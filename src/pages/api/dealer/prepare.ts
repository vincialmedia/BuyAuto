import type { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/integrations/supabase/types";
import { stripe } from "@/lib/stripe-server";
import {
  evaluatePromotionCode,
  isDiscountRejection,
  isPromoCodeFormat,
  normalizePromoCode,
  type PromotionCodeLike,
} from "@/lib/billing/dealer-promo";
import {
  hasLiveStripeSubscription,
  summarizeKnownSubscriptions,
  type TrackedSubscription,
} from "@/lib/billing/dealer-subscription-sync";
import { resolveSameOriginUrl } from "@/lib/safe-next-path";

type PrepareBody = {
  plan_code?: string;
  success_path?: string;
  cancel_path?: string;
  /** Optional promotion code typed on /garage-plan. Offers live in Stripe only, see lib/billing/dealer-promo. */
  promo_code?: string;
};

// Shown to the garage as they are (toast on /garage-plan), so: German, du.
const MESSAGES = {
  signIn: "Bitte melde dich an und versuche es nochmals.",
  noGarage: "Zu diesem Konto gehört noch keine Garage. Bitte melde dich bei uns: hello@buyauto.ch",
  planUnavailable: "Dieses Paket lässt sich gerade nicht buchen. Bitte melde dich bei uns: hello@buyauto.ch",
  alreadySubscribed:
    "Für deine Garage läuft bereits ein Paket. Für einen Wechsel oder eine Kündigung melde dich bei uns: hello@buyauto.ch",
  paymentOverdue:
    "Die letzte Zahlung für dein Paket ist fehlgeschlagen. Melde dich bei uns, dann bringen wir das in Ordnung: hello@buyauto.ch",
  generic: "Die Zahlung konnte nicht vorbereitet werden. Bitte versuche es in ein paar Minuten nochmals.",
} as const;

const PROMO_ERROR_MESSAGES = {
  invalid: "Dieser Code ist ungültig oder abgelaufen.",
  wrong_plan: "Dieser Code gilt nicht für das gewählte Paket.",
  misconfigured: "Dieser Code lässt sich gerade nicht einlösen. Bitte melde dich bei uns: hello@buyauto.ch",
} as const;

type GaragePick = Pick<Database["public"]["Tables"]["garages"]["Row"], "id" | "owner_user_id">;
type PlanPick = Pick<Database["public"]["Tables"]["dealer_plans"]["Row"], "id" | "code" | "monthly_price_chf" | "active" | "stripe_price_id">;

function normalizePlanCode(input: unknown): "starter" | "growth" | "pro" | null {
  const raw = typeof input === "string" ? input.trim().toLowerCase() : "";
  if (raw === "starter" || raw === "growth" || raw === "pro") return raw;
  return null;
}

function isMonthlyRecurringStripePrice(price: Awaited<ReturnType<typeof stripe.prices.retrieve>>): boolean {
  const recurring = (price as any)?.recurring;
  if (!recurring) return false;
  const interval = typeof recurring.interval === "string" ? recurring.interval : null;
  const usageType = typeof recurring.usage_type === "string" ? recurring.usage_type : null;
  return interval === "month" && usageType === "licensed";
}

/**
 * Stripe's current status of the subscription on record, or `null` when
 * Stripe does not know it. Asked before a garage is turned away: the row in
 * `dealer_subscriptions` is written by the webhook, and a row that missed its
 * "cancelled" event must not lock the garage out. Throws when Stripe cannot
 * be asked; then no checkout is started either.
 */
async function retrieveStripeSubscriptionStatus(subscriptionId: string): Promise<string | null> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription.status;
  } catch (error: unknown) {
    if ((error as { code?: unknown } | null)?.code === "resource_missing") return null;
    throw error;
  }
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The statuses of every subscription Stripe has for this garage, found by the
 * metadata this endpoint puts on them. This is the answer that does not
 * depend on our webhook: while events are not arriving there is no row, and a
 * garage that sees no plan after paying tries again.
 *
 * Stripe's search lags behind by up to about a minute, which is why the row
 * is looked at first. A failed search is logged and treated as "nothing
 * found": the row check above still stands.
 */
async function searchStripeSubscriptionStatuses(dealerId: string): Promise<string[]> {
  if (!UUID_PATTERN.test(dealerId)) return [];
  try {
    const result = await stripe.subscriptions.search({
      query: `metadata['dealer_id']:'${dealerId}' AND metadata['kind']:'dealer_plan'`,
      limit: 20,
    });
    return result.data.map((subscription) => subscription.status);
  } catch (error: unknown) {
    console.error("Dealer subscription prepare: Stripe subscription search failed", error);
    return [];
  }
}

function promoError(res: NextApiResponse, reason: keyof typeof PROMO_ERROR_MESSAGES) {
  // `field` lets the page show the message next to the code input.
  return res.status(400).json({ ok: false, error: PROMO_ERROR_MESSAGES[reason], field: "promo_code" });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  try {
    const supabase = createPagesServerClient<Database>({ req, res });
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) return res.status(401).json({ ok: false, error: MESSAGES.signIn });

    const body = (req.body ?? {}) as PrepareBody;
    const planCode = normalizePlanCode(body.plan_code);
    if (!planCode) return res.status(400).json({ ok: false, error: MESSAGES.planUnavailable });

    const { data: garageRaw, error: garageError } = await supabase
      .from("garages")
      .select("id, owner_user_id")
      .eq("owner_user_id", session.user.id)
      .maybeSingle();

    if (garageError) {
      console.error("Dealer subscription prepare: failed to load garage", garageError);
      return res.status(500).json({ ok: false, error: MESSAGES.generic });
    }

    const garage = (garageRaw ?? null) as GaragePick | null;
    if (!garage?.id) return res.status(400).json({ ok: false, error: MESSAGES.noGarage });

    const { data: planRaw, error: planError } = await supabase
      .from("dealer_plans")
      .select("id, code, monthly_price_chf, active, stripe_price_id")
      .eq("code", planCode)
      .eq("active", true)
      .maybeSingle();

    if (planError) {
      console.error("Dealer subscription prepare: failed to load plan", planError);
      return res.status(500).json({ ok: false, error: MESSAGES.generic });
    }

    const plan = (planRaw ?? null) as PlanPick | null;

    if (!plan?.id || !plan.stripe_price_id || typeof plan.stripe_price_id !== "string") {
      console.error("Dealer subscription prepare: plan missing or without a Stripe price", { planCode });
      return res.status(400).json({ ok: false, error: MESSAGES.planUnavailable });
    }

    // One Stripe subscription per garage. Nothing in Stripe links two
    // checkouts of the same garage, so a second one would bill it twice and,
    // with a code, start another free period. Plan changes and cancellations
    // go through support until there is a self-service flow for them.
    //
    // Two sources, in this order: the row our webhook keeps (current within
    // seconds, confirmed with Stripe before anyone is turned away), then
    // Stripe's own search (still right when the webhook is not delivering).
    const { data: currentSubscription, error: currentSubscriptionError } = await supabase
      .from("dealer_subscriptions")
      .select("plan_id, status, stripe_subscription_id, ended_at")
      .eq("dealer_id", garage.id)
      .maybeSingle<TrackedSubscription>();

    if (currentSubscriptionError) {
      console.error("Dealer subscription prepare: failed to load subscription", currentSubscriptionError);
      return res.status(500).json({ ok: false, error: MESSAGES.generic });
    }

    const knownStatuses: string[] = [];
    if (hasLiveStripeSubscription(currentSubscription)) {
      const status = await retrieveStripeSubscriptionStatus(currentSubscription.stripe_subscription_id);
      if (status) knownStatuses.push(status);
    }
    if (!summarizeKnownSubscriptions(knownStatuses).block) {
      knownStatuses.push(...(await searchStripeSubscriptionStatuses(garage.id)));
    }
    const known = summarizeKnownSubscriptions(knownStatuses);

    if (known.block) {
      // `code` lets the page show this as a note instead of an error.
      return res.status(409).json({
        ok: false,
        error: known.block === "overdue" ? MESSAGES.paymentOverdue : MESSAGES.alreadySubscribed,
        code: known.block === "overdue" ? "payment_overdue" : "already_subscribed",
      });
    }

    const hadSubscriptionBefore = known.hadSubscriptionBefore || Boolean(currentSubscription?.stripe_subscription_id);

    const stripePrice = await stripe.prices.retrieve(plan.stripe_price_id);
    if (!isMonthlyRecurringStripePrice(stripePrice)) {
      console.error("Dealer subscription prepare: Stripe price is not a monthly recurring price", { planCode });
      return res.status(400).json({ ok: false, error: MESSAGES.planUnavailable });
    }

    const promoCode = normalizePromoCode(body.promo_code);
    let promotionCodeId: string | null = null;
    let trialDays: number | null = null;

    if (promoCode) {
      if (!isPromoCodeFormat(promoCode)) return promoError(res, "invalid");

      // Stripe matches `code` case-insensitively. The same code can exist once
      // per customer-restricted variant, so look at a few and take the one
      // that is open to everyone.
      const promos = await stripe.promotionCodes.list({
        code: promoCode,
        active: true,
        limit: 10,
        expand: ["data.coupon.applies_to"],
      });
      const candidates = promos.data as unknown as PromotionCodeLike[];
      const promo = candidates.find((candidate) => !candidate.customer) ?? candidates[0];

      const evaluation = evaluatePromotionCode(promo, {
        productId: typeof stripePrice.product === "string" ? stripePrice.product : (stripePrice.product?.id ?? null),
        unitAmount: typeof stripePrice.unit_amount === "number" ? stripePrice.unit_amount : null,
        currency: typeof stripePrice.currency === "string" ? stripePrice.currency : null,
      });

      // `=== false`, not `!evaluation.ok`: this project compiles without
      // strictNullChecks, where only the explicit comparison narrows the union.
      if (evaluation.ok === false) {
        if (evaluation.reason === "misconfigured") {
          console.error("Dealer subscription prepare: promotion code has unreadable trial_days metadata", promo?.id);
        }
        return promoError(res, evaluation.reason);
      }

      promotionCodeId = evaluation.promotionCodeId;
      trialDays = evaluation.trialDays;

      // A free period is for a garage's first subscription only. A garage
      // that had one before (it has ended, or the check above would have
      // stopped the request) keeps the discount and starts paying right away.
      // Stripe Checkout shows the terms that apply before the garage confirms.
      if (trialDays && hadSubscriptionBefore) trialDays = null;
    }

    const forwardedProto = String(req.headers["x-forwarded-proto"] ?? "").split(",")[0].trim();
    const host = req.headers.host;
    const origin = host
      ? `${forwardedProto || "http"}://${host}`
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Stripe sends the garage to these URLs, so they must stay on this site.
    const successUrl = resolveSameOriginUrl(body.success_path, origin) ?? new URL("/dashboard/garage", origin);
    successUrl.searchParams.set("payment_success", "true");

    const cancelUrl = resolveSameOriginUrl(body.cancel_path, origin) ?? new URL("/billing/cancel", origin);

    const sessionMetadata = {
      kind: "dealer_plan",
      dealer_id: garage.id,
      plan_code: planCode,
      plan_id: plan.id,
      user_id: session.user.id,
      ...(promoCode && promotionCodeId ? { promo_code: promoCode } : {}),
    };

    let checkoutSession: Awaited<ReturnType<typeof stripe.checkout.sessions.create>>;
    try {
      checkoutSession = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
        success_url: successUrl.toString(),
        cancel_url: cancelUrl.toString(),
        ...(promotionCodeId ? { discounts: [{ promotion_code: promotionCodeId }] } : {}),
        subscription_data: {
          ...(trialDays ? { trial_period_days: trialDays } : {}),
          metadata: sessionMetadata,
        },
        metadata: sessionMetadata,
      });
    } catch (stripeError: unknown) {
      // Restrictions that only show at redemption time (for example a code
      // reserved for first-time customers) surface here, not in the lookup.
      if (promotionCodeId && isDiscountRejection(stripeError)) {
        console.error("Dealer subscription prepare: Stripe refused the promotion code", stripeError);
        return promoError(res, "invalid");
      }
      throw stripeError;
    }

    if (!checkoutSession.url) {
      console.error("Dealer subscription prepare: Stripe returned a session without a URL", checkoutSession.id);
      return res.status(500).json({ ok: false, error: MESSAGES.generic });
    }

    return res.status(200).json({ ok: true, url: checkoutSession.url });
  } catch (e: unknown) {
    // Details stay in the log. The garage gets a sentence it can act on.
    console.error("Dealer subscription prepare error:", e);
    return res.status(500).json({ ok: false, error: MESSAGES.generic });
  }
}
