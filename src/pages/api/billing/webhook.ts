import { NextApiRequest, NextApiResponse } from "next";
import { stripe } from "@/lib/stripe-server";
import Stripe from "stripe";
import { buffer } from "micro";
import { adminService } from "@/services/adminService";
import { fulfillListingRelist } from "@/lib/billing/relist-fulfillment";
import { getPlanDetails } from "@/lib/buyauto/stripe_config";

export const config = {
  api: {
    bodyParser: false,
  },
};

function safeString(input: unknown): string | null {
  if (typeof input === "string" && input.trim().length > 0) return input;
  return null;
}

async function dealerGarageExists(
  supabaseAdmin: ReturnType<typeof adminService.getSupabaseAdminClient>,
  dealerId: string
): Promise<boolean> {
  const { data, error } = await supabaseAdmin.from("garages").select("id").eq("id", dealerId).maybeSingle();
  if (error) return false;
  return !!data?.id;
}

function addDaysIso(baseIso: string, days: number): string | null {
  const ms = Date.parse(baseIso);
  if (!Number.isFinite(ms)) return null;
  return new Date(ms + days * 24 * 60 * 60 * 1000).toISOString();
}

function mapStripeSubscriptionStatus(
  status: Stripe.Subscription.Status
): "active" | "pending_change" | "canceled" | "past_due" {
  if (status === "active") return "active";
  if (status === "past_due" || status === "unpaid") return "past_due";
  if (status === "canceled") return "canceled";
  return "pending_change";
}

async function applyDealerPlanSnapshot(input: {
  supabaseAdmin: ReturnType<typeof adminService.getSupabaseAdminClient>;
  dealerId: string;
  planCode: string;
}) {
  const { data: plan, error: planError } = await input.supabaseAdmin
    .from("dealer_plans")
    .select("id, code, listing_limit")
    .eq("code", input.planCode)
    .maybeSingle();

  if (planError) {
    console.error("Webhook: Failed to fetch dealer plan", planError);
    return null;
  }

  if (!plan?.id) {
    console.error("Webhook: Plan not found for code", input.planCode);
    return null;
  }

  const { data: existingSub } = await input.supabaseAdmin
    .from("dealer_subscriptions")
    .select("plan_id")
    .eq("dealer_id", input.dealerId)
    .maybeSingle();

  const fromPlanId = existingSub?.plan_id ?? null;

  const { error: garageUpdateError } = await input.supabaseAdmin
    .from("garages")
    .update({
      plan: plan.code,
      listing_limit: plan.listing_limit ?? null,
    })
    .eq("id", input.dealerId);

  if (garageUpdateError) {
    console.error("Webhook: Failed to update garage snapshot fields", garageUpdateError);
  }

  const { error: changeError } = await input.supabaseAdmin.from("dealer_plan_changes").insert({
    dealer_id: input.dealerId,
    from_plan_id: fromPlanId,
    to_plan_id: plan.id,
    status: "applied",
    notes: "Stripe subscription event",
  });

  if (changeError) {
    console.error("Webhook: Failed to insert plan change", changeError);
  }

  return plan;
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.warn("STRIPE_WEBHOOK_SECRET not set. Skipping webhook verification.");
    return res.status(200).send("Webhook secret not configured.");
  }

  const sig = req.headers["stripe-signature"];
  const reqBuffer = await buffer(req);

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(reqBuffer, sig!, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const supabaseAdmin = adminService.getSupabaseAdminClient();

  // When a fulfillment write fails after money was taken (relist republish,
  // premium grant, paid/pending promotion), the handler must NOT acknowledge
  // the event: Stripe only redelivers on non-2xx, and every fulfillment branch
  // is idempotent, so failing the delivery is the retry mechanism. Returning
  // 200 here would mark the event delivered and permanently drop the paid-for
  // fulfillment.
  let fulfillmentError = false;

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      const metadata = session.metadata ?? {};
      const kind = safeString(metadata.kind);
      if (kind === "dealer_plan") {
        const dealerId = safeString(metadata.dealer_id);
        const planCode = safeString(metadata.plan_code);
        const stripeCustomerId = typeof session.customer === "string" ? session.customer : null;
        const stripeSubscriptionId = typeof session.subscription === "string" ? session.subscription : null;

        if (!dealerId || !planCode || !stripeCustomerId || !stripeSubscriptionId) {
          console.error("Webhook: Missing dealer_plan metadata on checkout.session.completed", {
            dealerId,
            planCode,
            stripeCustomerId,
            stripeSubscriptionId,
          });
          break;
        }

        if (!(await dealerGarageExists(supabaseAdmin, dealerId))) {
          console.warn("Webhook: dealer not found (likely deleted), skipping", { dealerId, sessionId: session.id });
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

        const currentPeriodStartIso = new Date(subscription.current_period_start * 1000).toISOString();
        const currentPeriodEndIso = new Date(subscription.current_period_end * 1000).toISOString();

        const { error: upsertSubError } = await supabaseAdmin
          .from("dealer_subscriptions")
          .upsert(
            {
              dealer_id: dealerId,
              plan_id: safeString(metadata.plan_id) ?? null,
              status: mapStripeSubscriptionStatus(subscription.status),
              current_period_start: currentPeriodStartIso,
              current_period_end: currentPeriodEndIso,
              cancel_at_period_end: subscription.cancel_at_period_end ?? false,
              stripe_customer_id: stripeCustomerId,
              stripe_subscription_id: stripeSubscriptionId,
              cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
              canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
              ended_at: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : null,
              grace_ends_at: subscription.ended_at ? addDaysIso(new Date(subscription.ended_at * 1000).toISOString(), 5) : null,
            },
            { onConflict: "dealer_id" }
          );

        if (upsertSubError) {
          console.error("Webhook: Failed to upsert dealer subscription", upsertSubError);
          break;
        }

        await applyDealerPlanSnapshot({ supabaseAdmin, dealerId, planCode });

        break;
      }

      if (kind === "listing_relist") {
        const listingId = safeString(metadata.listing_id);

        if (!listingId) {
          console.error("Webhook: Missing listing_id for listing_relist", { sessionId: session.id });
          break;
        }

        // Shared with /api/billing/relist/verify (the client-return
        // reconciliation), so both paths apply the identical republish write.
        // Service role, so the premium- and status-authority triggers permit
        // the writes.
        const result = await fulfillListingRelist(supabaseAdmin, listingId, safeString(metadata.relist_plan));

        if (result.outcome === "failed") {
          console.error("Webhook: Failed to republish listing after relist payment", { listingId, error: result.error });
          fulfillmentError = true;
        } else if (result.outcome === "skipped") {
          console.warn(`Webhook: skipping relist for listing ${listingId}: ${result.reason}`);
        }

        break;
      }

      if (kind === "listing_premium_upgrade") {
        const listingId = safeString(metadata.listing_id);

        if (!listingId) {
          console.error("Webhook: Missing listing_id for listing_premium_upgrade", { sessionId: session.id });
          break;
        }

        const paidAmountCents = typeof session.amount_total === "number" ? session.amount_total : null;
        const amountChf = paidAmountCents ? Math.round(paidAmountCents / 100) : 30;

        const { error: applyError } = await supabaseAdmin.rpc("apply_listing_premium_purchase", {
          stripe_checkout_session_id: session.id,
          listing_id: listingId,
          user_id: safeString(metadata.user_id),
          amount_chf: amountChf,
        });

        if (applyError) {
          console.error("Webhook: Failed to apply listing premium purchase", { listingId, sessionId: session.id, applyError });
          fulfillmentError = true;
        }

        break;
      }

      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : null;

      if (!subscriptionId) break;

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const subMeta = subscription.metadata ?? {};
      const kind = safeString(subMeta.kind);
      if (kind !== "dealer_plan") break;

      const dealerId = safeString(subMeta.dealer_id);
      const planCode = safeString(subMeta.plan_code);

      if (!dealerId || !planCode) break;

      if (!(await dealerGarageExists(supabaseAdmin, dealerId))) {
        console.warn("Webhook: dealer not found (likely deleted), skipping invoice.paid", { dealerId, subscriptionId });
        break;
      }

      const currentPeriodStartIso = new Date(subscription.current_period_start * 1000).toISOString();
      const currentPeriodEndIso = new Date(subscription.current_period_end * 1000).toISOString();

      const { error } = await supabaseAdmin
        .from("dealer_subscriptions")
        .upsert(
          {
            dealer_id: dealerId,
            plan_id: safeString(subMeta.plan_id) ?? null,
            status: mapStripeSubscriptionStatus(subscription.status),
            current_period_start: currentPeriodStartIso,
            current_period_end: currentPeriodEndIso,
            cancel_at_period_end: subscription.cancel_at_period_end ?? false,
            stripe_customer_id: typeof subscription.customer === "string" ? subscription.customer : null,
            stripe_subscription_id: subscription.id,
            cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
            canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
            ended_at: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : null,
            grace_ends_at: subscription.ended_at ? addDaysIso(new Date(subscription.ended_at * 1000).toISOString(), 5) : null,
          },
          { onConflict: "dealer_id" }
        );

      if (error) console.error("Webhook: invoice.paid upsert dealer_subscriptions failed", error);

      await applyDealerPlanSnapshot({ supabaseAdmin, dealerId, planCode });

      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : null;
      if (!subscriptionId) break;

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const subMeta = subscription.metadata ?? {};
      const kind = safeString(subMeta.kind);
      if (kind !== "dealer_plan") break;

      const dealerId = safeString(subMeta.dealer_id);
      if (!dealerId) break;

      if (!(await dealerGarageExists(supabaseAdmin, dealerId))) {
        console.warn("Webhook: dealer not found (likely deleted), skipping invoice.payment_failed", { dealerId, subscriptionId });
        break;
      }

      const { error } = await supabaseAdmin
        .from("dealer_subscriptions")
        .update({ status: "past_due" })
        .eq("dealer_id", dealerId);

      if (error) console.error("Webhook: invoice.payment_failed update failed", error);

      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const subMeta = subscription.metadata ?? {};
      const kind = safeString(subMeta.kind);

      if (kind !== "dealer_plan") break;

      const dealerId = safeString(subMeta.dealer_id);
      const planCode = safeString(subMeta.plan_code);

      if (!dealerId) break;

      if (!(await dealerGarageExists(supabaseAdmin, dealerId))) {
        console.warn("Webhook: dealer not found (likely deleted), skipping subscription event", { dealerId, subscriptionId: subscription.id });
        break;
      }

      const currentPeriodStartIso = new Date(subscription.current_period_start * 1000).toISOString();
      const currentPeriodEndIso = new Date(subscription.current_period_end * 1000).toISOString();

      const endedAtIso = subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : null;
      const graceEndsAtIso = endedAtIso ? addDaysIso(endedAtIso, 5) : null;

      const status = mapStripeSubscriptionStatus(subscription.status);

      const { error } = await supabaseAdmin
        .from("dealer_subscriptions")
        .upsert(
          {
            dealer_id: dealerId,
            plan_id: safeString(subMeta.plan_id) ?? null,
            status,
            current_period_start: currentPeriodStartIso,
            current_period_end: currentPeriodEndIso,
            cancel_at_period_end: subscription.cancel_at_period_end ?? false,
            stripe_customer_id: typeof subscription.customer === "string" ? subscription.customer : null,
            stripe_subscription_id: subscription.id,
            cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
            canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
            ended_at: endedAtIso,
            grace_ends_at: graceEndsAtIso,
          },
          { onConflict: "dealer_id" }
        );

      if (error) console.error("Webhook: subscription updated upsert failed", error);

      if (planCode) {
        await applyDealerPlanSnapshot({ supabaseAdmin, dealerId, planCode });
      }

      break;
    }

    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      const kind = paymentIntent.metadata?.kind;
      if (kind === "dealer_plan") {
        break;
      }

      if (kind === "plan_change") {
        // Paid upgrade of an already-published listing's package. Must be
        // dispatched before the generic publish handling below: its premium
        // grant and paid/pending promotion assume an initial publish, and its
        // terminal-state guard treats 'paid' — the very state a plan change
        // starts from — as already handled.
        const listingId = safeString(paymentIntent.metadata?.listing_id);
        const newPlan = safeString(paymentIntent.metadata?.plan);

        if (!listingId || (newPlan !== "extended" && newPlan !== "unlimited")) {
          console.error("Webhook: invalid plan_change metadata", {
            listingId,
            newPlan,
            paymentIntentId: paymentIntent.id,
          });
          break;
        }

        const { data: listing } = await supabaseAdmin
          .from("listings")
          .select("price_plan, payment_status, status, stripe_payment_intent_id, expires_at")
          .eq("id", listingId)
          .single();

        if (!listing) {
          console.warn(`Webhook: listing ${listingId} not found for plan_change`);
          break;
        }

        // Same superseded-intent rule as the publish flow below: only the
        // intent currently attached to the listing may change its plan.
        if (!listing.stripe_payment_intent_id || listing.stripe_payment_intent_id !== paymentIntent.id) {
          console.warn(
            `Webhook: plan_change intent ${paymentIntent.id} does not match listing ${listingId} current intent ${listing.stripe_payment_intent_id ?? "NULL"}; skipping`
          );
          break;
        }

        if (listing.payment_status === "refunded") {
          console.warn(`Webhook: listing ${listingId} is refunded; skipping plan_change`);
          break;
        }

        // Replay guard: a redelivered succeeded event must not re-anchor the
        // runtime a second time.
        if (listing.price_plan === newPlan) {
          break;
        }

        const durationDays = getPlanDetails(newPlan).duration_days;
        // Edit policy: content edits never move the expiry — only this paid
        // plan change re-anchors it, to the chosen package's runtime from now.
        // A listing still waiting in review (expires_at NULL) keeps NULL: the
        // set_listing_expires_at trigger anchors the new duration_days at
        // publication, so the paid window doesn't tick during review.
        const newExpiresAt =
          newPlan === "unlimited" || durationDays === null || !listing.expires_at
            ? null
            : addDaysIso(new Date().toISOString(), durationDays);

        const { error: planChangeError } = await supabaseAdmin
          .from("listings")
          .update({
            // Prepare refuses expired listings, but a checkout left open in a
            // stale tab can still be paid after the listing expires. The money
            // bought a fresh runtime and the listing already passed review, so
            // republish rather than leaving a paid-for listing invisible.
            ...(listing.status === "expired" ? { status: "published" } : {}),
            price_plan: newPlan,
            // Dual-write until the legacy column drop — the expiry triggers
            // resolve the plan legacy-first (pricing_plan before price_plan).
            pricing_plan: newPlan,
            duration_days: durationDays,
            expires_at: newExpiresAt,
            price_paid_chf: Math.round(paymentIntent.amount / 100),
            // Both target plans include premium placement; it runs with the
            // listing (align_included_premium_on_publish re-anchors pending
            // listings when they go live).
            premium: true,
            is_premium: true,
            premium_until: newExpiresAt,
          })
          .eq("id", listingId);

        if (planChangeError) {
          console.error(`Webhook: Failed to apply plan_change for listing ${listingId}`, planChangeError);
          fulfillmentError = true;
        }

        break;
      }

      const listingId = paymentIntent.metadata?.listing_id;
      if (listingId) {
        // Fetch current listing to validate the intent and check its state.
        const { data: listing } = await supabaseAdmin
          .from("listings")
          .select("status, payment_status, stripe_payment_intent_id, expires_at, premium, premium_until")
          .eq("id", listingId)
          .single();

        if (!listing) {
          console.warn(`Webhook: listing ${listingId} not found for payment_intent.succeeded`);
          break;
        }

        // The intent must be the one currently attached to the listing — never
        // let a superseded or unrelated succeeded intent promote it. A NULL
        // stored intent also skips: the free-plan path clears the column, and
        // an orphaned intent from an earlier paid attempt must not be able to
        // promote or premium-grant a listing that finished as CHF 0.
        if (!listing.stripe_payment_intent_id || listing.stripe_payment_intent_id !== paymentIntent.id) {
          console.warn(
            `Webhook: payment_intent ${paymentIntent.id} does not match listing ${listingId} current intent ${listing.stripe_payment_intent_id ?? "NULL"}; skipping`
          );
          break;
        }

        // Premium is granted here, not by the client: the premium-authority
        // trigger rejects owners writing listings.premium, so the wizard and
        // prepare endpoint only carry the choice in payment metadata.
        //  * paid boost (standard plan): 30 days
        //  * Verlängert/Unlimitiert: included — runs with the listing
        // Runs before the terminal-state short-circuit so a verify-payment
        // race (which marks paid but cannot grant premium) can't starve it;
        // the alreadyPremium guard keeps replayed succeeded events from
        // extending premium a second time.
        const plan = safeString(paymentIntent.metadata?.plan);
        const boostPurchased = paymentIntent.metadata?.premium === "true";
        const premiumIncluded =
          paymentIntent.metadata?.premium_included === "true" || plan === "extended" || plan === "unlimited";

        const alreadyPremium =
          listing.premium === true &&
          (listing.premium_until === null || Date.parse(listing.premium_until) > Date.now());

        if ((boostPurchased || premiumIncluded) && !alreadyPremium && listing.payment_status !== "refunded") {
          const nowIso = new Date().toISOString();
          // A stale expires_at from an earlier cycle (already in the past) must
          // not become the anchor, or the premium would be granted pre-lapsed —
          // align_included_premium_on_publish re-anchors at publication anyway.
          const expiresAtIsFuture =
            typeof listing.expires_at === "string" && Date.parse(listing.expires_at) > Date.now();
          const premiumUntil =
            plan === "unlimited"
              ? null
              : premiumIncluded
                ? (expiresAtIsFuture ? listing.expires_at : addDaysIso(nowIso, 90))
                : addDaysIso(nowIso, 30);

          const { error: premiumError } = await supabaseAdmin
            .from("listings")
            .update({ premium: true, is_premium: true, premium_until: premiumUntil })
            .eq("id", listingId);

          if (premiumError) {
            console.error(`Webhook: Failed to grant premium to listing ${listingId}`, premiumError);
            fulfillmentError = true;
          }
        }

        // Non-destructive: never overwrite a terminal paid/refunded state.
        if (listing.payment_status === "refunded" || listing.payment_status === "paid") {
          break;
        }

        const updateData: { payment_status: "paid"; status?: "pending" } = {
          payment_status: "paid",
        };

        // If the listing is currently a draft (waiting for payment), move it to pending for review
        if (listing.status === "draft") {
          updateData.status = "pending";
        }

        const { error } = await supabaseAdmin
          .from("listings")
          .update(updateData)
          .eq("id", listingId);

        if (error) {
          console.error(`Webhook: Failed to update listing ${listingId} to paid/pending`, error);
          fulfillmentError = true;
        }
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      const kind = paymentIntent.metadata?.kind;
      if (kind === "dealer_plan") {
        break;
      }

      if (kind === "plan_change") {
        // A failed upgrade payment leaves the listing untouched: it is still
        // a fully paid listing on its current plan, and writing
        // 'payment_failed' here would knock that paid record over.
        break;
      }

      const listingId = paymentIntent.metadata?.listing_id;
      if (listingId) {
        const { error } = await supabaseAdmin
          .from("listings")
          .update({ payment_status: "payment_failed" })
          .eq("id", listingId);

        if (error) {
          console.error(`Webhook: Failed to update listing ${listingId} to payment_failed`, error);
        }
      }
      break;
    }

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  if (fulfillmentError) {
    // Non-2xx → Stripe redelivers. All fulfillment branches are idempotent
    // (status/alreadyPremium/terminal-state guards), so the retry is safe.
    return res.status(500).json({ received: false, retry: true });
  }

  res.status(200).json({ received: true });
};

export default handler;
