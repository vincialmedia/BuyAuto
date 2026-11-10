/**
 * Promotion codes for garage plans (used by api/dealer/prepare).
 *
 * Offers live in Stripe only: the discount, how long it runs, which product it
 * applies to and an optional free trial. Nothing about an offer belongs in
 * this public repo. Stripe coupons cannot carry a trial, so a trial is
 * expressed as `trial_days` metadata on the promotion code or on its coupon
 * (the promotion code wins when both are set).
 */

/** Stripe promotion codes consist of letters and digits only (checked after upper-casing). */
const PROMO_CODE_PATTERN = /^[A-Z0-9]{3,40}$/;

/** Upper bound for a metadata-driven trial; anything above is treated as a typo. */
export const MAX_PROMO_TRIAL_DAYS = 365;

/** The fields read from a Stripe promotion code (API 2024-06-20, `data.coupon.applies_to` expanded). */
export type PromotionCodeLike = {
  id: string;
  active?: boolean | null;
  /** Set when the code is reserved for one Stripe customer. */
  customer?: unknown;
  metadata?: Record<string, string> | null;
  restrictions?: {
    minimum_amount?: number | null;
    minimum_amount_currency?: string | null;
  } | null;
  coupon?: {
    valid?: boolean | null;
    metadata?: Record<string, string> | null;
    applies_to?: { products?: string[] | null } | null;
  } | null;
};

/** The plan price the code would be applied to. */
export type PromoPriceContext = {
  productId: string | null;
  unitAmount: number | null;
  currency: string | null;
};

export type PromoEvaluation =
  | { ok: true; promotionCodeId: string; trialDays: number | null }
  | { ok: false; reason: "invalid" | "wrong_plan" | "misconfigured" };

/** Trims and upper-cases what the garage typed; `null` when there is no code. */
export function normalizePromoCode(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const code = input.trim().toUpperCase();
  return code.length > 0 ? code : null;
}

/** Cheap shape check before asking Stripe, so junk never reaches the API. */
export function isPromoCodeFormat(code: string): boolean {
  return PROMO_CODE_PATTERN.test(code);
}

/**
 * Reads `trial_days` from Stripe metadata.
 *
 *  - `undefined`: the key is absent or blank (no statement about a trial)
 *  - a number from 0 to MAX_PROMO_TRIAL_DAYS: 0 means "explicitly no trial"
 *  - `"invalid"`: the key is set but is not a whole number in range. The
 *    caller must refuse the code instead of silently dropping the trial: a
 *    garage that was promised a free period would otherwise be charged at once.
 */
export function readTrialDays(metadata: Record<string, string> | null | undefined): number | "invalid" | undefined {
  const raw = metadata?.trial_days;
  if (raw === undefined || raw === null) return undefined;
  const text = String(raw).trim();
  if (text === "") return undefined;
  if (!/^\d{1,3}$/.test(text)) return "invalid";
  const days = Number(text);
  return days <= MAX_PROMO_TRIAL_DAYS ? days : "invalid";
}

/**
 * Decides whether a promotion code found in Stripe may be applied to the plan
 * price a garage picked, and which trial (if any) comes with it.
 *
 *  - "invalid": no such active code, its coupon is used up or expired, or the
 *    code is reserved for one Stripe customer (checkout creates a new one)
 *  - "wrong_plan": the coupon is limited to other products, or the code needs
 *    a higher minimum amount than this plan costs
 *  - "misconfigured": the trial metadata is unreadable
 */
export function evaluatePromotionCode(
  promo: PromotionCodeLike | null | undefined,
  price: PromoPriceContext
): PromoEvaluation {
  if (!promo || !promo.id || promo.active === false) return { ok: false, reason: "invalid" };
  if (!promo.coupon || promo.coupon.valid !== true) return { ok: false, reason: "invalid" };
  if (promo.customer) return { ok: false, reason: "invalid" };

  const restrictedProducts = promo.coupon.applies_to?.products ?? [];
  if (restrictedProducts.length > 0 && (!price.productId || !restrictedProducts.includes(price.productId))) {
    return { ok: false, reason: "wrong_plan" };
  }

  const minimumAmount = promo.restrictions?.minimum_amount;
  if (typeof minimumAmount === "number" && minimumAmount > 0) {
    const minimumCurrency = (promo.restrictions?.minimum_amount_currency ?? "").toLowerCase();
    const sameCurrency = minimumCurrency !== "" && minimumCurrency === (price.currency ?? "").toLowerCase();
    if (!sameCurrency || typeof price.unitAmount !== "number" || price.unitAmount < minimumAmount) {
      return { ok: false, reason: "wrong_plan" };
    }
  }

  const ownTrial = readTrialDays(promo.metadata);
  const trial = ownTrial !== undefined ? ownTrial : readTrialDays(promo.coupon.metadata);
  if (trial === "invalid") return { ok: false, reason: "misconfigured" };

  return {
    ok: true,
    promotionCodeId: promo.id,
    trialDays: typeof trial === "number" && trial > 0 ? trial : null,
  };
}

/**
 * True when Stripe rejected a Checkout Session because of the discount we
 * attached (for example a restriction that only shows at redemption time).
 * Those are the garage's problem to hear about as "code not valid", not a 500.
 */
export function isDiscountRejection(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { type?: unknown; param?: unknown; code?: unknown; message?: unknown };
  if (candidate.type !== "StripeInvalidRequestError") return false;
  const param = typeof candidate.param === "string" ? candidate.param : "";
  const code = typeof candidate.code === "string" ? candidate.code : "";
  const message = typeof candidate.message === "string" ? candidate.message : "";
  return (
    param.startsWith("discounts") ||
    code.startsWith("promotion_code") ||
    code.startsWith("coupon") ||
    /promotion code|coupon/i.test(message)
  );
}
