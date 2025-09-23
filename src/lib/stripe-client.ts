import { loadStripe, Stripe } from '@stripe/stripe-js';

// Use a module-level variable to cache the Stripe promise.
let stripePromise: Promise<Stripe | null> | undefined;

export const getStripe = (): Promise<Stripe | null> | null => {
  // Only run this logic in the browser.
  if (typeof window === 'undefined') {
    console.log('🚫 getStripe() called during SSR - returning null');
    return null;
  }
  
  if (!stripePromise) {
    const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    if (!stripePublishableKey) {
      console.error("❌ Stripe publishable key is not set. Please set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable.");
      // Return a promise that resolves to null to handle this gracefully.
      stripePromise = Promise.resolve(null);
    } else {
      console.log('✅ Initializing Stripe with publishable key');
      stripePromise = loadStripe(stripePublishableKey).catch(error => {
        console.error('❌ Failed to load Stripe:', error);
        return null;
      });
    }
  }
  return stripePromise;
};

// Additional helper function to check if Stripe is available
export function isStripeAvailable(): boolean {
  return typeof window !== 'undefined' && Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
}
