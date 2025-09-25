import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { stripe } from '@/lib/stripe-server';
import { calculateTotal, getPlanDetails, Plan, PREMIUM_BOOST_PRICE } from '@/lib/buyauto/stripe_config';
import { Database } from '@/integrations/supabase/types';
import crypto from 'crypto';

type Listing = Database['public']['Tables']['listings']['Row'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    // Early validation - check if Stripe secret key exists
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('❌ STRIPE_SECRET_KEY environment variable is not set');
      return res.status(500).json({ 
        error: 'Payment system configuration error. Please contact support.' 
      });
    }

    // Test Stripe key validity with a simple API call
    try {
      await stripe.balance.retrieve();
    } catch (stripeError: any) {
      console.error('❌ Stripe API key validation failed:', stripeError.message);
      
      if (stripeError.type === 'StripeAuthenticationError') {
        return res.status(500).json({ 
          error: 'Payment system authentication failed. Please contact support.',
          details: 'Invalid or expired Stripe API key'
        });
      }
      
      // Re-throw other Stripe errors
      throw stripeError;
    }

    // Create Supabase client using the modern @supabase/ssr library
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies[name]
          },
          set(name: string, value: string, options: CookieOptions) {
            res.setHeader('Set-Cookie', `${name}=${value}; ${Object.entries(options).map(([k, v]) => `${k}=${v}`).join('; ')}`)
          },
          remove(name: string, options: CookieOptions) {
            res.setHeader('Set-Cookie', `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; ${Object.entries(options).map(([k, v]) => `${k}=${v}`).join('; ')}`)
          },
        },
      }
    )

    // Get the current user session
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error('User authentication error:', userError);
      return res.status(401).json({ error: 'Authentication failed' });
    }

    if (!user) {
      console.error('No authenticated user found');
      return res.status(401).json({ error: 'Unauthorized - Please log in' });
    }

    const { listing_id, plan, premium } = req.body;

    if (!listing_id || !plan || typeof premium !== 'boolean') {
      return res.status(400).json({ error: 'Missing required fields: listing_id, plan, premium' });
    }

    // Validate plan
    const validPlans = ['standard', 'extended', 'unlimited'];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan specified' });
    }

    // Verify the listing belongs to the authenticated user
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('*')
      .eq('id', listing_id)
      .eq('user_id', user.id)
      .single();

    if (listingError || !listing) {
      console.error('Listing access error:', listingError);
      return res.status(404).json({ error: 'Listing not found or you do not have permission to access it.' });
    }

    const totalCHF = calculateTotal(plan as Plan, premium);
    const planDetails = getPlanDetails(plan as Plan);

    const getExpiresAt = (duration_days: number | null): string | null => {
        if (duration_days === null) return null;
        const date = new Date();
        date.setDate(date.getDate() + duration_days);
        return date.toISOString();
    };

    // Path 1: Free plan (CHF 0)
    if (totalCHF === 0) {
      const { error: updateError } = await supabase
        .from('listings')
        .update({
          pricing_plan: plan,
          duration_days: planDetails.duration_days,
          expires_at: getExpiresAt(planDetails.duration_days),
          premium: false,
          premium_until: null,
          price_paid_chf: 0,
          payment_status: 'paid', // Free is considered paid
        })
        .eq('id', listing_id);

      if (updateError) {
        console.error('Database update error for free plan:', updateError);
        throw new Error('Failed to update listing');
      }

      return res.status(200).json({ next: 'continue', listing_id });
    }

    // Path 2: Paid plan - Create Stripe Payment Intent
    const amountInCents = Math.round(totalCHF * 100);

    const idempotencyKey = crypto
      .createHash('sha256')
      .update(`${listing_id}-${plan}-${premium}-${user.id}`)
      .digest('hex');

    const paymentIntentParams = {
        amount: amountInCents,
        currency: 'chf',
        automatic_payment_methods: { enabled: true },
        metadata: {
            listing_id: listing_id,
            user_id: user.id,
            plan: plan,
            premium: String(premium),
        },
        statement_descriptor: 'BUYAUTO',
    };

    let paymentIntent;

    try {
      if (listing.stripe_payment_intent_id) {
          try {
              // Try to update existing Payment Intent
              paymentIntent = await stripe.paymentIntents.update(
                listing.stripe_payment_intent_id, 
                paymentIntentParams, 
                { idempotencyKey }
              );
          } catch (e) {
              // If PI can't be updated (e.g., already processed), create a new one
              paymentIntent = await stripe.paymentIntents.create(
                paymentIntentParams, 
                { idempotencyKey }
              );
          }
      } else {
          // Create new Payment Intent
          paymentIntent = await stripe.paymentIntents.create(
            paymentIntentParams, 
            { idempotencyKey }
          );
      }
    } catch (stripeError: any) {
      console.error('❌ Stripe Payment Intent creation failed:', stripeError);
      
      if (stripeError.type === 'StripeAuthenticationError') {
        return res.status(500).json({ 
          error: 'Payment system authentication failed. Please contact support.',
          details: 'Stripe API authentication error'
        });
      }
      
      return res.status(500).json({ 
        error: 'Payment processing failed. Please try again or contact support.',
        details: stripeError.message
      });
    }

    // Update the listing with payment information
    const { error: updateError } = await supabase
      .from('listings')
      .update({
        pricing_plan: plan,
        duration_days: planDetails.duration_days,
        expires_at: getExpiresAt(planDetails.duration_days),
        premium: premium,
        premium_until: premium ? getExpiresAt(30) : null,
        price_paid_chf: totalCHF,
        payment_status: 'requires_payment',
        stripe_payment_intent_id: paymentIntent.id,
      })
      .eq('id', listing_id);

    if (updateError) {
      console.error('Database update error for paid plan:', updateError);
      throw new Error('Failed to update listing');
    }
    
    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      amount: totalCHF,
      currency: 'CHF',
    });

  } catch (error: any) {
    console.error('❌ Error in /api/billing/prepare:', error);
    
    // More specific error handling
    if (error.type === 'StripeAuthenticationError') {
      return res.status(500).json({ 
        error: 'Payment system authentication failed. Please contact support.',
        details: 'Invalid Stripe API credentials'
      });
    }
    
    return res.status(500).json({ 
      error: error.message || 'An unexpected error occurred. Please try again or contact support.',
      timestamp: new Date().toISOString()
    });
  }
}
