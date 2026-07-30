// Remove server-side Stripe import - this was causing client-side bundle issues
// The stripe instance is now in src/lib/stripe-server.ts for API routes only

export const STRIPE_PUBLISHABLE_KEY = 'pk_test_4ZlHGCjsiXjF31Ard96LGWzG';

export const pricingPlans = {
  standard: { price: 0, duration_days: 60, name: 'Standard' },
  extended: { price: 50, duration_days: 90, name: 'Verlängert' },
  unlimited: { price: 190, duration_days: null, name: 'Unlimitiert' },
};

export const PREMIUM_BOOST_PRICE = 30;

/** Fee to re-publish a listing after it expired. */
export const RELIST_PRICE_CHF = 30;

/** Verlängert perk: renewing an expired Verlängert listing costs half. */
export const RELIST_PRICE_EXTENDED_CHF = 15;

export function relistPriceChf(plan: Plan | string | null | undefined): number {
  return plan === "extended" ? RELIST_PRICE_EXTENDED_CHF : RELIST_PRICE_CHF;
}

/**
 * Relist promo switch. While true, the UI shows the regular price struck
 * through ("CHF 30" -> gratis) and the relist endpoint republishes directly
 * instead of opening a Stripe checkout. Currently off — relisting costs
 * RELIST_PRICE_CHF, or sellers can relist as Verlängert for the plan price
 * (90 days + premium included).
 */
export const RELIST_PROMO_ACTIVE = false;

export type Plan = keyof typeof pricingPlans;

/**
 * Verlängert and Unlimitiert include Premium-Platzierung at no extra charge.
 * The premium flag itself is granted server-side by the Stripe webhook after
 * payment — clients must never write listings.premium (the premium-authority
 * trigger rejects owners).
 */
export function planIncludesPremium(plan: Plan | string | null | undefined): boolean {
  return plan === 'extended' || plan === 'unlimited';
}

export function calculateTotal(plan: Plan, isPremium: boolean): number {
  const planPrice = pricingPlans[plan]?.price ?? 0;
  // The boost is only a paid add-on where it isn't already part of the plan.
  const premiumPrice = isPremium && !planIncludesPremium(plan) ? PREMIUM_BOOST_PRICE : 0;
  return planPrice + premiumPrice;
}

export function getPlanDetails(plan: Plan) {
  return pricingPlans[plan];
}
