
import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { stripe, calculateTotal, getPlanDetails, Plan, PREMIUM_BOOST_PRICE } from '@/lib/buyauto/stripe_config';
import { Database } from '@/integrations/supabase/types';
import crypto from 'crypto';

type Listing = Database['public']['Tables']['listings']['Row'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const supabase = createPagesServerClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { listing_id, plan, premium } = req.body;

  if (!listing_id || !plan || typeof premium !== 'boolean') {
    return res.status(400).json({ error: 'Missing required fields: listing_id, plan, premium' });
  }

  if (!Object.keys(getPlanDetails('standard')).length) { // A simple check if plans are loaded
      const validPlans = ['standard', 'extended', 'unlimited'];
      if (!validPlans.includes(plan)) {
        return res.status(400).json({ error: 'Invalid plan specified' });
      }
  }


  try {
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('*')
      .eq('id', listing_id)
      .eq('user_id', session.user.id)
      .single();

    if (listingError || !listing) {
      return res.status(404).json({ error: 'Listing not found or you do not have permission to access it.' });
    }

    const totalCHF = calculateTotal(plan as Plan, premium);
    const planDetails = getPlanDetails(plan as Plan);

    const getExpiresAt = (duration_days: number | null): string | null => {
        if (duration_days === null) return null;
        const date = new Date();
        date.setDate(date.getDate() + duration_days);
        return date.toISOString();
    }

    // Path 1: Free plan
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

      if (updateError) throw updateError;

      return res.status(200).json({ next: 'continue', listing_id });
    }

    // Path 2: Paid plan
    const amountInCents = Math.round(totalCHF * 100);

    const idempotencyKey = crypto.createHash('sha256').update(`${listing_id}-${plan}-${premium}-${session.user.id}`).digest('hex');

    const paymentIntentParams = {
        amount: amountInCents,
        currency: 'chf',
        automatic_payment_methods: { enabled: true },
        metadata: {
            listing_id: listing_id,
            user_id: session.user.id,
            plan: plan,
            premium: String(premium),
        },
        statement_descriptor: 'BUYAUTO',
    };

    let paymentIntent;

    if (listing.stripe_payment_intent_id) {
        try {
            paymentIntent = await stripe.paymentIntents.update(listing.stripe_payment_intent_id, paymentIntentParams, { idempotencyKey });
        } catch (e) {
            // If PI can't be updated (e.g., already processed), create a new one.
            paymentIntent = await stripe.paymentIntents.create(paymentIntentParams, { idempotencyKey });
        }
    } else {
        paymentIntent = await stripe.paymentIntents.create(paymentIntentParams, { idempotencyKey });
    }


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

    if (updateError) throw updateError;
    
    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      amount: totalCHF,
      currency: 'CHF',
    });

  } catch (error: any) {
    console.error('Error in /api/billing/prepare:', error);
    res.status(500).json({ error: error.message });
  }
}
