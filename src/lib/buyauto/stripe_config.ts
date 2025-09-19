
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
});

export const pricingPlans = {
  standard: { price: 0, duration_days: 60, name: 'Standard' },
  extended: { price: 50, duration_days: 90, name: 'Verlängert' },
  unlimited: { price: 190, duration_days: null, name: 'Unlimitiert' },
};

export const PREMIUM_BOOST_PRICE = 30;

export type Plan = keyof typeof pricingPlans;

export function calculateTotal(plan: Plan, isPremium: boolean): number {
  const planPrice = pricingPlans[plan]?.price ?? 0;
  const premiumPrice = isPremium ? PREMIUM_BOOST_PRICE : 0;
  return planPrice + premiumPrice;
}

export function getPlanDetails(plan: Plan) {
  return pricingPlans[plan];
}
