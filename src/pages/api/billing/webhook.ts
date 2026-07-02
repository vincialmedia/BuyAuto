import { NextApiRequest, NextApiResponse } from "next";
import { stripe } from "@/lib/stripe-server";
import Stripe from "stripe";
import { buffer } from "micro";
import { adminService } from "@/services/adminService";

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

      const listingId = paymentIntent.metadata?.listing_id;
      if (listingId) {
        // Fetch current listing to validate the intent and check its state.
        const { data: listing } = await supabaseAdmin
          .from("listings")
          .select("status, payment_status, stripe_payment_intent_id")
          .eq("id", listingId)
          .single();

        if (!listing) {
          console.warn(`Webhook: listing ${listingId} not found for payment_intent.succeeded`);
          break;
        }

        // The intent must be the one currently attached to the listing — never
        // let a superseded or unrelated succeeded intent promote it.
        if (listing.stripe_payment_intent_id && listing.stripe_payment_intent_id !== paymentIntent.id) {
          console.warn(
            `Webhook: payment_intent ${paymentIntent.id} does not match listing ${listingId} current intent ${listing.stripe_payment_intent_id}; skipping`
          );
          break;
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

  res.status(200).json({ received: true });
};

export default handler;
