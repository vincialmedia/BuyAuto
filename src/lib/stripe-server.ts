import Stripe from "stripe";

// Server-side Stripe instance - ONLY import this in API routes.
//
// Initialized lazily: constructing Stripe at module scope crashes every
// importing endpoint at load time when STRIPE_SECRET_KEY is absent (e.g. a
// local checkout without the Vercel secrets) — even code paths that never
// call Stripe, like the CHF-0 publish in billing/prepare. The Proxy keeps
// call sites unchanged and only throws when a Stripe API is actually used,
// inside the handler's own try/catch.
let cachedStripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!cachedStripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    cachedStripe = new Stripe(key, {
      apiVersion: "2024-06-20" as Stripe.LatestApiVersion,
      typescript: true,
    });
  }
  return cachedStripe;
}

export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const instance = getStripe();
    const value = (instance as unknown as Record<PropertyKey, unknown>)[prop];
    return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(instance) : value;
  },
});
