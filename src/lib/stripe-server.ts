import Stripe from 'stripe';

// Server-side Stripe instance - ONLY import this in API routes
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
});
