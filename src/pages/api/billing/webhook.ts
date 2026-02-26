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

function addDaysIso(baseIso: string, days: number): string | null {
  const ms = Date.parse(baseIso);
  if (!Number.isFinite(ms)) return null;
  return new Date(ms + days * 24 * 60 * 60 * 1000).toISOString();
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
      if (kind !== "dealer_plan") break;

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

      const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

      const currentPeriodStartIso = new Date(subscription.current_period_start * 1000).toISOString();
      const currentPeriodEndIso = new Date(subscription.current_period_end * 1000).toISOString();

      const { error: upsertSubError } = await supabaseAdmin
        .from("dealer_subscriptions")
        .upsert(
          {
            dealer_id: dealerId,
            plan_id: safeString(metadata.plan_id) ?? null,
            status: subscription.status === "active" ? "active" : subscription.status,
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

      const currentPeriodStartIso = new Date(subscription.current_period_start * 1000).toISOString();
      const currentPeriodEndIso = new Date(subscription.current_period_end * 1000).toISOString();

      const { error } = await supabaseAdmin
        .from("dealer_subscriptions")
        .upsert(
          {
            dealer_id: dealerId,
            plan_id: safeString(subMeta.plan_id) ?? null,
            status: subscription.status === "active" ? "active" : subscription.status,
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

      const currentPeriodStartIso = new Date(subscription.current_period_start * 1000).toISOString();
      const currentPeriodEndIso = new Date(subscription.current_period_end * 1000).toISOString();

      const endedAtIso = subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : null;
      const graceEndsAtIso = endedAtIso ? addDaysIso(endedAtIso, 5) : null;

      const status = subscription.status === "canceled" ? "canceled" : subscription.status;

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
        const { error } = await supabaseAdmin.from("listings").update({ payment_status: "paid" }).eq("id", listingId);

        if (error) {
          console.error(`Webhook: Failed to update listing ${listingId} to paid`, error);
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
