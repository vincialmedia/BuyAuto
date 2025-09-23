import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (typeof window === 'undefined') {
    return Promise.resolve(null);
  }
  if (!stripePromise) {
    const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    stripePromise = pk ? loadStripe(pk) : Promise.resolve(null);
    if (!pk) console.error('❌ Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
  }
  return stripePromise;
}