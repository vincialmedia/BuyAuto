/**
 * Checks for the garage promotion-code helpers: `npx tsx scripts/test-dealer-promo.ts`.
 * Exits non-zero on the first failed assertion.
 *
 * All fixtures are made up. They copy the shape Stripe returns for
 * `promotionCodes.list` on API 2024-06-20 with `data.coupon.applies_to`
 * expanded; no real code, amount or product id belongs in this repo.
 */
import assert from "node:assert/strict";
import {
  MAX_PROMO_TRIAL_DAYS,
  evaluatePromotionCode,
  isDiscountRejection,
  isPromoCodeFormat,
  normalizePromoCode,
  readTrialDays,
  type PromotionCodeLike,
  type PromoPriceContext,
} from "../src/lib/billing/dealer-promo";

// --- What the garage typed ---------------------------------------------------
assert.equal(normalizePromoCode("  partner24 "), "PARTNER24");
assert.equal(normalizePromoCode("Partner24"), "PARTNER24");
assert.equal(normalizePromoCode(""), null);
assert.equal(normalizePromoCode("   "), null);
assert.equal(normalizePromoCode(undefined), null);
assert.equal(normalizePromoCode(null), null);
assert.equal(normalizePromoCode(42), null);
assert.equal(normalizePromoCode({ code: "X" }), null);

assert.equal(isPromoCodeFormat("PARTNER24"), true);
assert.equal(isPromoCodeFormat("ABC"), true);
assert.equal(isPromoCodeFormat("A".repeat(40)), true);
assert.equal(isPromoCodeFormat("AB"), false);
assert.equal(isPromoCodeFormat("A".repeat(41)), false);
assert.equal(isPromoCodeFormat("PARTNER 24"), false);
assert.equal(isPromoCodeFormat("PARTNER24!"), false);
assert.equal(isPromoCodeFormat("PARTNER_24"), false); // Stripe codes are letters and digits only
assert.equal(isPromoCodeFormat("PARTNER-24"), false);
assert.equal(isPromoCodeFormat("partner24"), false); // callers normalize first
assert.equal(isPromoCodeFormat("ÄÖÜ"), false);
assert.equal(isPromoCodeFormat("X'; DROP TABLE--"), false);
assert.equal(isPromoCodeFormat("code[]=A&code[]=B"), false);

// --- trial_days metadata -----------------------------------------------------
assert.equal(readTrialDays(undefined), undefined);
assert.equal(readTrialDays(null), undefined);
assert.equal(readTrialDays({}), undefined);
assert.equal(readTrialDays({ other: "1" }), undefined);
assert.equal(readTrialDays({ trial_days: "" }), undefined);
assert.equal(readTrialDays({ trial_days: "   " }), undefined);
assert.equal(readTrialDays({ trial_days: "30" }), 30);
assert.equal(readTrialDays({ trial_days: " 30 " }), 30);
assert.equal(readTrialDays({ trial_days: "030" }), 30);
assert.equal(readTrialDays({ trial_days: "0" }), 0);
assert.equal(readTrialDays({ trial_days: "1" }), 1);
assert.equal(readTrialDays({ trial_days: String(MAX_PROMO_TRIAL_DAYS) }), MAX_PROMO_TRIAL_DAYS);
assert.equal(readTrialDays({ trial_days: String(MAX_PROMO_TRIAL_DAYS + 1) }), "invalid");
assert.equal(readTrialDays({ trial_days: "30 Tage" }), "invalid");
assert.equal(readTrialDays({ trial_days: "3 Monate" }), "invalid");
assert.equal(readTrialDays({ trial_days: "-5" }), "invalid");
assert.equal(readTrialDays({ trial_days: "1.5" }), "invalid");
assert.equal(readTrialDays({ trial_days: "3e1" }), "invalid");
assert.equal(readTrialDays({ trial_days: "9999" }), "invalid");
assert.equal(readTrialDays({ trial_days: "ja" }), "invalid");

// --- Deciding on a promotion code --------------------------------------------
const PLAN_A: PromoPriceContext = { productId: "prod_planA", unitAmount: 20000, currency: "chf" };
const PLAN_B: PromoPriceContext = { productId: "prod_planB", unitAmount: 50000, currency: "chf" };

function promo(overrides: Partial<PromotionCodeLike> = {}, coupon: Partial<NonNullable<PromotionCodeLike["coupon"]>> = {}): PromotionCodeLike {
  return {
    id: "promo_test",
    active: true,
    customer: null,
    metadata: {},
    restrictions: { minimum_amount: null, minimum_amount_currency: null },
    coupon: { valid: true, metadata: {}, applies_to: undefined, ...coupon },
    ...overrides,
  };
}

// Nothing found, switched off, used up.
assert.deepEqual(evaluatePromotionCode(undefined, PLAN_A), { ok: false, reason: "invalid" });
assert.deepEqual(evaluatePromotionCode(null, PLAN_A), { ok: false, reason: "invalid" });
assert.deepEqual(evaluatePromotionCode(promo({ active: false }), PLAN_A), { ok: false, reason: "invalid" });
assert.deepEqual(evaluatePromotionCode(promo({}, { valid: false }), PLAN_A), { ok: false, reason: "invalid" });
assert.deepEqual(evaluatePromotionCode(promo({ coupon: null }), PLAN_A), { ok: false, reason: "invalid" });
assert.deepEqual(evaluatePromotionCode(promo({ id: "" }), PLAN_A), { ok: false, reason: "invalid" });
// A coupon without an explicit `valid: true` is never trusted.
assert.deepEqual(evaluatePromotionCode(promo({}, { valid: undefined }), PLAN_A), { ok: false, reason: "invalid" });

// Reserved for one Stripe customer: checkout creates a new customer, so it can't apply.
assert.deepEqual(evaluatePromotionCode(promo({ customer: "cus_someone" }), PLAN_A), { ok: false, reason: "invalid" });
assert.deepEqual(evaluatePromotionCode(promo({ customer: { id: "cus_someone" } }), PLAN_A), { ok: false, reason: "invalid" });

// No product restriction: any plan.
assert.deepEqual(evaluatePromotionCode(promo(), PLAN_A), { ok: true, promotionCodeId: "promo_test", trialDays: null });
assert.deepEqual(evaluatePromotionCode(promo({}, { applies_to: { products: [] } }), PLAN_B), {
  ok: true,
  promotionCodeId: "promo_test",
  trialDays: null,
});
assert.deepEqual(evaluatePromotionCode(promo({}, { applies_to: null }), PLAN_B), {
  ok: true,
  promotionCodeId: "promo_test",
  trialDays: null,
});

// Restricted to one product: only that plan.
const onlyPlanA = promo({}, { applies_to: { products: ["prod_planA"] } });
assert.deepEqual(evaluatePromotionCode(onlyPlanA, PLAN_A), { ok: true, promotionCodeId: "promo_test", trialDays: null });
assert.deepEqual(evaluatePromotionCode(onlyPlanA, PLAN_B), { ok: false, reason: "wrong_plan" });
assert.deepEqual(evaluatePromotionCode(onlyPlanA, { ...PLAN_A, productId: null }), { ok: false, reason: "wrong_plan" });
const twoPlans = promo({}, { applies_to: { products: ["prod_other", "prod_planB"] } });
assert.equal(evaluatePromotionCode(twoPlans, PLAN_B).ok, true);
assert.equal(evaluatePromotionCode(twoPlans, PLAN_A).ok, false);

// Minimum order value on the code.
const needs300 = promo({ restrictions: { minimum_amount: 30000, minimum_amount_currency: "chf" } });
assert.deepEqual(evaluatePromotionCode(needs300, PLAN_A), { ok: false, reason: "wrong_plan" });
assert.equal(evaluatePromotionCode(needs300, PLAN_B).ok, true);
assert.equal(evaluatePromotionCode(needs300, { ...PLAN_B, unitAmount: 30000 }).ok, true);
assert.deepEqual(evaluatePromotionCode(needs300, { ...PLAN_B, unitAmount: null }), { ok: false, reason: "wrong_plan" });
// A minimum in another currency can't be compared: refuse instead of guessing.
const needs300Eur = promo({ restrictions: { minimum_amount: 30000, minimum_amount_currency: "eur" } });
assert.deepEqual(evaluatePromotionCode(needs300Eur, PLAN_B), { ok: false, reason: "wrong_plan" });
assert.equal(evaluatePromotionCode(promo({ restrictions: { minimum_amount: 30000, minimum_amount_currency: "CHF" } }), PLAN_B).ok, true);
assert.equal(evaluatePromotionCode(promo({ restrictions: null }), PLAN_A).ok, true);

// Trial from the coupon, from the code, and the code winning over the coupon.
assert.deepEqual(evaluatePromotionCode(promo({}, { metadata: { trial_days: "60" } }), PLAN_A), {
  ok: true,
  promotionCodeId: "promo_test",
  trialDays: 60,
});
assert.deepEqual(evaluatePromotionCode(promo({ metadata: { trial_days: "14" } }), PLAN_A), {
  ok: true,
  promotionCodeId: "promo_test",
  trialDays: 14,
});
assert.deepEqual(evaluatePromotionCode(promo({ metadata: { trial_days: "14" } }, { metadata: { trial_days: "60" } }), PLAN_A), {
  ok: true,
  promotionCodeId: "promo_test",
  trialDays: 14,
});
// "0" on the code switches the coupon's trial off for that code.
assert.deepEqual(evaluatePromotionCode(promo({ metadata: { trial_days: "0" } }, { metadata: { trial_days: "60" } }), PLAN_A), {
  ok: true,
  promotionCodeId: "promo_test",
  trialDays: null,
});
// Unrelated metadata changes nothing.
assert.deepEqual(evaluatePromotionCode(promo({ metadata: { campaign: "x" } }, { metadata: { note: "y" } }), PLAN_A), {
  ok: true,
  promotionCodeId: "promo_test",
  trialDays: null,
});

// Unreadable trial metadata refuses the code: never silently charge a garage that was promised a free period.
assert.deepEqual(evaluatePromotionCode(promo({}, { metadata: { trial_days: "3 Monate" } }), PLAN_A), {
  ok: false,
  reason: "misconfigured",
});
assert.deepEqual(evaluatePromotionCode(promo({ metadata: { trial_days: "x" } }, { metadata: { trial_days: "60" } }), PLAN_A), {
  ok: false,
  reason: "misconfigured",
});
assert.deepEqual(evaluatePromotionCode(promo({}, { metadata: { trial_days: "999" } }), PLAN_A), {
  ok: false,
  reason: "misconfigured",
});
// The product check comes first: a wrong plan is reported as such even when the metadata is broken.
assert.deepEqual(
  evaluatePromotionCode(promo({}, { applies_to: { products: ["prod_planA"] }, metadata: { trial_days: "x" } }), PLAN_B),
  { ok: false, reason: "wrong_plan" }
);

// The full happy path, shaped like a real answer: restricted product plus a trial on the coupon.
const realistic: PromotionCodeLike = {
  id: "promo_1TestOnlyNotReal",
  active: true,
  customer: null,
  metadata: {},
  restrictions: { minimum_amount: null, minimum_amount_currency: null },
  coupon: {
    valid: true,
    metadata: { trial_days: "45" },
    applies_to: { products: ["prod_planB"] },
  },
};
assert.deepEqual(evaluatePromotionCode(realistic, PLAN_B), {
  ok: true,
  promotionCodeId: "promo_1TestOnlyNotReal",
  trialDays: 45,
});
assert.deepEqual(evaluatePromotionCode(realistic, PLAN_A), { ok: false, reason: "wrong_plan" });

// --- Stripe refusing the discount when the session is created -----------------
assert.equal(
  isDiscountRejection({ type: "StripeInvalidRequestError", param: "discounts[0][promotion_code]", message: "x" }),
  true
);
assert.equal(
  isDiscountRejection({ type: "StripeInvalidRequestError", code: "promotion_code_customer_mismatch", message: "x" }),
  true
);
assert.equal(isDiscountRejection({ type: "StripeInvalidRequestError", code: "coupon_expired", message: "x" }), true);
assert.equal(
  isDiscountRejection({ type: "StripeInvalidRequestError", message: "This promotion code cannot be redeemed." }),
  true
);
assert.equal(
  isDiscountRejection({ type: "StripeInvalidRequestError", param: "line_items[0][price]", message: "No such price" }),
  false
);
assert.equal(isDiscountRejection({ type: "StripeAPIError", message: "coupon service down" }), false);
assert.equal(isDiscountRejection(new Error("coupon")), false);
assert.equal(isDiscountRejection(null), false);
assert.equal(isDiscountRejection("promotion code"), false);

console.log("test-dealer-promo: all checks passed");
