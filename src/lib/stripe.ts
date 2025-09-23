import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  // CRITICAL: Never attempt to load Stripe during SSR
  if (typeof window === 'undefined') {
    console.log('🚫 getStripe() called during SSR - returning null');
    return Promise.resolve(null);
  }

  // Only initialize once in the browser
  if (!stripePromise) {
    const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    
    if (!pk) {
      console.error('❌ Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
      stripePromise = Promise.resolve(null);
      return stripePromise;
    }

    console.log('✅ Initializing Stripe with publishable key');
    stripePromise = loadStripe(pk).catch(error => {
      console.error('❌ Failed to load Stripe:', error);
      return null;
    });
  }
  
  return stripePromise;
}

// Additional helper function to check if Stripe is available
export function isStripeAvailable(): boolean {
  return typeof window !== 'undefined' && Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
}
