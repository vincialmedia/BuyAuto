
import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { stripe } from '@/lib/buyauto/stripe_config';

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

  const { listing_id } = req.body;

  if (!listing_id) {
    return res.status(400).json({ error: 'Missing listing_id' });
  }

  try {
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('stripe_payment_intent_id, payment_status')
      .eq('id', listing_id)
      .eq('user_id', session.user.id)
      .single();

    if (listingError || !listing) {
      return res.status(404).json({ error: 'Listing not found or you do not have permission to access it.' });
    }

    if (listing.stripe_payment_intent_id && listing.payment_status === 'requires_payment') {
      await stripe.paymentIntents.cancel(listing.stripe_payment_intent_id);
    }
    
    const { error: updateError } = await supabase
        .from('listings')
        .update({ payment_status: 'canceled' })
        .eq('id', listing_id);

    if (updateError) throw updateError;
    
    res.status(200).json({ ok: true, message: 'Payment intent canceled and listing status updated.' });

  } catch (error: any) {
    console.error('Error in /api/billing/cancel-intent:', error);
    res.status(500).json({ error: error.message });
  }
}
