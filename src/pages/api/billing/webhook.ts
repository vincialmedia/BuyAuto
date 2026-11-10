import { NextApiRequest, NextApiResponse } from "next";
import { stripe } from "@/lib/stripe-server";
import Stripe from "stripe";
import { buffer } from "micro";
import { adminService } from "@/services/adminService";
import { fulfillListingRelist } from "@/lib/billing/relist-fulfillment";
import { getPlanDetails } from "@/lib/buyauto/stripe_config";
import {
  readInvoiceSubscriptionId,
  syncDealerSubscription,
  type DealerSyncDeps,
  type StripeSubscriptionLike,
  type TrackedSubscription,
} from "@/lib/billing/dealer-subscription-sync";

export const config = {
  api: {
    bodyParser: false,
  },
};

type SupabaseAdmin = ReturnType<typeof adminService.getSupabaseAdminClient>;

function safeString(input: unknown): string | null {
  if (typeof input === "string" && input.trim().length > 0) return input;
  return null;
}

function addDaysIso(baseIso: string, days: number): string | null {
  const ms = Date.parse(baseIso);
  if (!Number.isFinite(ms)) return null;
  return new Date(ms + days * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Copies the plan onto the garage (plan code and listing limit) and logs the
 * change. Only called for a running subscription. Throws when the garage
 * cannot be updated, so the delivery fails and Stripe sends the event again.
 */
async function applyDealerPlanSnapshot(input: {
  supabaseAdmin: SupabaseAdmin;
  dealerId: string;
  planCode: string;
  previousPlanId: string | null;
}): Promise<void> {
  const { data: plan, error: planError } = await input.supabaseAdmin
    .from("dealer_plans")
    .select("id, code, listing_limit")
    .eq("code", input.planCode)
    .maybeSingle();

  if (planError) throw planError;

  if (!plan?.id) {
    console.error("Webhook: Plan not found for code", input.planCode);
    return;
  }

  const { error: garageUpdateError } = await input.supabaseAdmin
    .from("garages")
    .update({
      plan: plan.code,
      listing_limit: plan.listing_limit ?? null,
    })
    .eq("id", input.dealerId);

  if (garageUpdateError) throw garageUpdateError;

  // One log entry per real change: every Stripe event of a subscription ends
  // up here, and most of them leave the plan as it was.
  if (input.previousPlanId === plan.id) return;

  const { error: changeError } = await input.supabaseAdmin.from("dealer_plan_changes").insert({
    dealer_id: input.dealerId,
    from_plan_id: input.previousPlanId,
    to_plan_id: plan.id,
    status: "applied",
    notes: "Stripe subscription event",
  });

  // The log is not worth failing a delivery over.
  if (changeError) {
    console.error("Webhook: Failed to insert plan change", changeError);
  }
}

/** Stripe and database access for lib/billing/dealer-subscription-sync. Every function throws on failure. */
function dealerSyncDeps(supabaseAdmin: SupabaseAdmin): DealerSyncDeps {
  return {
    async retrieveSubscription(subscriptionId) {
      try {
        return (await stripe.subscriptions.retrieve(subscriptionId)) as unknown as StripeSubscriptionLike;
      } catch (error: unknown) {
        // A subscription Stripe does not know cannot be synced, and sending
        // the event again would not change that.
        if ((error as { code?: unknown } | null)?.code === "resource_missing") return null;
        throw error;
      }
    },

    async garageExists(dealerId) {
      const { data, error } = await supabaseAdmin.from("garages").select("id").eq("id", dealerId).maybeSingle();
      if (error) throw error;
      return Boolean(data?.id);
    },

    async loadTrackedSubscription(dealerId) {
      const { data, error } = await supabaseAdmin
        .from("dealer_subscriptions")
        .select("plan_id, status, stripe_subscription_id, ended_at")
        .eq("dealer_id", dealerId)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as TrackedSubscription | null;
    },

    async writeSubscription(row) {
      const { error } = await supabaseAdmin.from("dealer_subscriptions").upsert(row, { onConflict: "dealer_id" });
      if (error) throw error;
    },

    applyPlan: ({ dealerId, planCode, previousPlanId }) =>
      applyDealerPlanSnapshot({ supabaseAdmin, dealerId, planCode, previousPlanId }),
  };
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    // Never answer 2xx here. Stripe treats a 2xx as delivered and does not
    // send the event again, so a deployment without the secret would drop
    // every payment and subscription event for good. A 5xx keeps Stripe
    // retrying and shows the endpoint as failing in the Stripe Dashboard.
    console.error("STRIPE_WEBHOOK_SECRET is not set. Refusing the event so that Stripe retries it.");
    return res.status(500).send("Webhook secret not configured.");
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

  // Garage plans. An event only says "look at this subscription again": the
  // state is fetched fresh from Stripe and written by
  // lib/billing/dealer-subscription-sync, which also explains which events
  // are ignored. A failed sync fails the delivery, so Stripe sends it again.
  const syncDealer = async (subscriptionId: string, fromCheckout: boolean) => {
    try {
      const result = await syncDealerSubscription(dealerSyncDeps(supabaseAdmin), subscriptionId, { fromCheckout });

      if (result.outcome === "ignored" && result.reason !== "not_dealer_plan") {
        // "other_subscription": the garage has two running Stripe
        // subscriptions. That needs a human, so it is logged as an error.
        const log =
          result.reason === "other_subscription" || result.reason === "missing_metadata" ? console.error : console.warn;
        log("Webhook: dealer subscription not synced", {
          reason: result.reason,
          subscriptionId,
          dealerId: result.dealerId ?? null,
          eventType: event.type,
        });
      }
    } catch (error: unknown) {
      console.error("Webhook: dealer subscription sync failed", { subscriptionId, eventType: event.type, error });
      fulfillmentError = true;
    }
  };

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      const metadata = session.metadata ?? {};
      const kind = safeString(metadata.kind);
      if (kind === "dealer_plan") {
        const stripeSubscriptionId =
          typeof session.subscription === "string" ? session.subscription : safeString(session.subscription?.id);

        if (!stripeSubscriptionId) {
          console.error("Webhook: dealer_plan checkout completed without a subscription", { sessionId: session.id });
          break;
        }

        await syncDealer(stripeSubscriptionId, true);

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

    case "invoice.paid":
    case "invoice.payment_failed": {
      // Either way the subscription behind the invoice may have changed
      // (trial started, renewed, payment overdue), so read it again. Stripe
      // decides when a failed payment makes it past_due, not this handler.
      const subscriptionId = readInvoiceSubscriptionId(event.data.object);
      if (!subscriptionId) break;

      await syncDealer(subscriptionId, false);

      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      if (safeString(subscription.metadata?.kind) !== "dealer_plan") break;

      // The payload is a snapshot from when the event was created and can
      // arrive late or out of order: only its id is used.
      await syncDealer(subscription.id, false);

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
        // Only for the intent currently attached to the listing, and never
        // over a paid or refunded record. A declined first attempt is often
        // followed by a successful one on the same intent, and Stripe may
        // deliver this event after the success (or days later, as a retry):
        // without these conditions it would turn a paid listing back into an
        // unpaid one, which the publish and refund paths then act on.
        const { error } = await supabaseAdmin
          .from("listings")
          .update({ payment_status: "payment_failed" })
          .eq("id", listingId)
          .eq("stripe_payment_intent_id", paymentIntent.id)
          .or("payment_status.is.null,payment_status.not.in.(paid,refunded)");

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
