import type { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/integrations/supabase/types";
import { stripe } from "@/lib/stripe-server";

type PrepareBody = {
  plan_code?: string;
  success_path?: string;
  cancel_path?: string;
  /** Optional promotion code typed on /garage-plan (e.g. for founding partners). */
  promo_code?: string;
};

/**
 * Promotion codes are configured in Stripe only — amount, duration, which
 * product they apply to and an optional free trial — so offers never live in
 * this public repo. The trial comes from `trial_days` metadata on the
 * promotion code (or its coupon); Stripe coupons can't express a trial.
 */
const PROMO_CODE_PATTERN = /^[A-Z0-9_-]{3,40}$/;
const MAX_PROMO_TRIAL_DAYS = 365;

function normalizePromoCode(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const code = input.trim().toUpperCase();
  return code.length > 0 ? code : null;
}

function parseTrialDays(...candidates: Array<string | undefined>): number | null {
  for (const raw of candidates) {
    if (typeof raw !== "string" || raw.trim() === "") continue;
    const days = Number.parseInt(raw.trim(), 10);
    if (Number.isInteger(days) && days > 0 && days <= MAX_PROMO_TRIAL_DAYS) return days;
  }
  return null;
}

type GaragePick = Pick<Database["public"]["Tables"]["garages"]["Row"], "id" | "owner_user_id">;
type PlanPick = Pick<Database["public"]["Tables"]["dealer_plans"]["Row"], "id" | "code" | "monthly_price_chf" | "active" | "stripe_price_id">;

function normalizePlanCode(input: unknown): "starter" | "growth" | "pro" | null {
  const raw = typeof input === "string" ? input.trim().toLowerCase() : "";
  if (raw === "starter" || raw === "growth" || raw === "pro") return raw;
  return null;
}

function isSafeNextPath(input: unknown): input is string {
  return typeof input === "string" && input.startsWith("/") && !input.startsWith("//");
}

function getErrorMessage(input: unknown): string {
  if (typeof input === "string" && input.trim().length > 0) return input;
  if (input && typeof input === "object" && "message" in input && typeof (input as any).message === "string") return (input as any).message;
  return "Unexpected error";
}

function isMonthlyRecurringStripePrice(price: Awaited<ReturnType<typeof stripe.prices.retrieve>>): boolean {
  const recurring = (price as any)?.recurring;
  if (!recurring) return false;
  const interval = typeof recurring.interval === "string" ? recurring.interval : null;
  const usageType = typeof recurring.usage_type === "string" ? recurring.usage_type : null;
  return interval === "month" && usageType === "licensed";
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

    if (sessionError) return res.status(401).json({ ok: false, error: "Authentication failed" });
    if (!session?.user) return res.status(401).json({ ok: false, error: "Unauthorized" });

    const body = (req.body ?? {}) as PrepareBody;
    const planCode = normalizePlanCode(body.plan_code);
    if (!planCode) return res.status(400).json({ ok: false, error: "Invalid plan_code" });

    const { data: garageRaw, error: garageError } = await supabase
      .from("garages")
      .select("id, owner_user_id")
      .eq("owner_user_id", session.user.id)
      .maybeSingle();

    if (garageError) return res.status(500).json({ ok: false, error: "Failed to load garage" });

    const garage = (garageRaw ?? null) as GaragePick | null;
    if (!garage?.id) return res.status(400).json({ ok: false, error: "No garage found for this user" });

    const { data: planRaw, error: planError } = await supabase
      .from("dealer_plans")
      .select("id, code, monthly_price_chf, active, stripe_price_id")
      .eq("code", planCode)
      .eq("active", true)
      .maybeSingle();

    if (planError) return res.status(500).json({ ok: false, error: "Failed to load plan" });

    const plan = (planRaw ?? null) as PlanPick | null;

    if (!plan?.id) return res.status(400).json({ ok: false, error: "Plan not found" });
    if (!plan.stripe_price_id || typeof plan.stripe_price_id !== "string") {
      return res.status(400).json({ ok: false, error: "Plan is not configured for recurring billing (missing stripe_price_id)" });
    }

    const stripePrice = await stripe.prices.retrieve(plan.stripe_price_id);
    if (!isMonthlyRecurringStripePrice(stripePrice)) {
      return res.status(400).json({
        ok: false,
        error: "This plan is not configured as a monthly recurring Stripe price. Please verify the Stripe price is recurring monthly in CHF.",
      });
    }

    const promoCode = normalizePromoCode(body.promo_code);
    let promotionCodeId: string | null = null;
    let trialDays: number | null = null;

    if (promoCode) {
      const invalidCode = { ok: false, error: "Dieser Code ist ungültig oder abgelaufen." };
      if (!PROMO_CODE_PATTERN.test(promoCode)) return res.status(400).json(invalidCode);

      const promos = await stripe.promotionCodes.list({
        code: promoCode,
        active: true,
        limit: 1,
        expand: ["data.coupon.applies_to"],
      });
      const promo = promos.data[0];
      if (!promo || !promo.coupon?.valid) return res.status(400).json(invalidCode);

      const restrictedProducts = promo.coupon.applies_to?.products ?? [];
      const priceProduct = typeof stripePrice.product === "string" ? stripePrice.product : stripePrice.product?.id;
      if (restrictedProducts.length > 0 && (!priceProduct || !restrictedProducts.includes(priceProduct))) {
        return res.status(400).json({ ok: false, error: "Dieser Code gilt nicht für das gewählte Paket." });
      }

      promotionCodeId = promo.id;
      trialDays = parseTrialDays(promo.metadata?.trial_days, promo.coupon.metadata?.trial_days);
    }

    const protocol = (req.headers["x-forwarded-proto"] as string) || "http";
    const host = req.headers.host;
    const origin = host ? `${protocol}://${host}` : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const requestedSuccessPath = isSafeNextPath(body.success_path) ? body.success_path : null;
    const requestedCancelPath = isSafeNextPath(body.cancel_path) ? body.cancel_path : null;

    const successUrl = new URL(requestedSuccessPath ?? "/dashboard/garage", origin);
    successUrl.searchParams.set("payment_success", "true");

    const cancelUrl = new URL(requestedCancelPath ?? "/billing/cancel", origin);

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
      success_url: successUrl.toString(),
      cancel_url: cancelUrl.toString(),
      ...(promotionCodeId ? { discounts: [{ promotion_code: promotionCodeId }] } : {}),
      subscription_data: {
        ...(trialDays ? { trial_period_days: trialDays } : {}),
        metadata: {
          kind: "dealer_plan",
          dealer_id: garage.id,
          plan_code: planCode,
          plan_id: plan.id,
          user_id: session.user.id,
          ...(promoCode && promotionCodeId ? { promo_code: promoCode } : {}),
        },
      },
      metadata: {
        kind: "dealer_plan",
        dealer_id: garage.id,
        plan_code: planCode,
        plan_id: plan.id,
        user_id: session.user.id,
        ...(promoCode && promotionCodeId ? { promo_code: promoCode } : {}),
      },
    });

    if (!checkoutSession.url) {
      return res.status(500).json({ ok: false, error: "Could not generate payment URL" });
    }

    return res.status(200).json({ ok: true, url: checkoutSession.url });
  } catch (e: unknown) {
    console.error("Dealer subscription prepare error:", e);
    return res.status(500).json({ ok: false, error: getErrorMessage(e) });
  }
}