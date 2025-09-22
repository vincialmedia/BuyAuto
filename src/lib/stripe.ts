
import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Safe Stripe loader that only initializes on client-side
 * Prevents SSR issues and missing API key errors
 */
export const getStripe = (): Promise<Stripe | null> | null => {
  // Only run on client side
  if (typeof window === 'undefined') {
    console.warn('getStripe called on server side, returning null');
    return null;
  }

  // Return existing promise if already created
  if (stripePromise) {
    return stripePromise;
  }

  // Get publishable key from environment
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  
  if (!publishableKey) {
    console.error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not defined');
    return null;
  }

  // Create and cache the Stripe promise
  stripePromise = loadStripe(publishableKey);
  
  return stripePromise;
};

/**
 * Reset Stripe promise (useful for testing)
 */
export const resetStripePromise = () => {
  stripePromise = null;
};
