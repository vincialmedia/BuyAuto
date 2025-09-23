import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { stripe } from '@/lib/stripe-server';
import { adminService } from '@/services/adminService';

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
  
  // TODO: Implement a robust admin check. For now, we assume this endpoint is protected.
  // const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', session.user.id).single();
  // if(!profile?.is_admin) {
  //   return res.status(403).json({ error: 'Forbidden: Admins only' });
  // }


  const { listing_id, reason = 'requested_by_customer' } = req.body;

  if (!listing_id) {
    return res.status(400).json({ error: 'Missing listing_id' });
  }
  
  const supabaseAdmin = adminService.getSupabaseAdminClient();

  try {
    const { data: listing, error: listingError } = await supabaseAdmin
      .from('listings')
      .select('stripe_payment_intent_id, payment_status, stripe_refund_id')
      .eq('id', listing_id)
      .single();

    if (listingError || !listing) {
      return res.status(404).json({ error: 'Listing not found.' });
    }

    if (listing.stripe_refund_id) {
      return res.status(200).json({ ok: true, message: 'Listing already refunded.' });
    }

    if (listing.payment_status !== 'paid' || !listing.stripe_payment_intent_id) {
      return res.status(400).json({ error: 'Listing is not eligible for a refund.' });
    }

    const refund = await stripe.refunds.create({
      payment_intent: listing.stripe_payment_intent_id,
      reason: reason,
    });

    const { error: updateError } = await supabaseAdmin
      .from('listings')
      .update({
        stripe_refund_id: refund.id,
        refunded_at: new Date().toISOString(),
        payment_status: 'refunded',
      })
      .eq('id', listing_id);

    if (updateError) throw updateError;
    
    // TODO: Send refund notification email to user.

    res.status(200).json({ ok: true, refund_id: refund.id });

  } catch (error: any) {
    console.error('Error in /api/billing/refund:', error);
    res.status(500).json({ error: error.message });
  }
}
