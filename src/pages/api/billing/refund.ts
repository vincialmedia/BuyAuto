import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { adminService } from '@/services/adminService';
import { refundListingIfPaid, type RefundReason } from '@/lib/billing/refund-listing';

const REFUND_REASONS: RefundReason[] = ['duplicate', 'fraudulent', 'requested_by_customer'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const supabase = createPagesServerClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Admin-only: refunds move money and must never be self-serve. Mirror the
  // profiles.role === 'admin' gate used by the other admin API routes.
  const { data: me } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .maybeSingle<{ role: string | null }>();

  if (!me || me.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admins only' });
  }

  const { listing_id, reason = 'requested_by_customer' } = req.body ?? {};

  if (!listing_id) {
    return res.status(400).json({ error: 'Missing listing_id' });
  }

  const refundReason: RefundReason = REFUND_REASONS.includes(reason) ? reason : 'requested_by_customer';

  // The refund itself lives in @/lib/billing/refund-listing so the moderation
  // routes can give the money back without round-tripping through HTTP.
  const result = await refundListingIfPaid(adminService.getSupabaseAdminClient(), listing_id, refundReason);

  switch (result.outcome) {
    case 'refunded':
      // TODO: Send refund notification email to user.
      return res.status(200).json({ ok: true, refund_id: result.refundId });
    case 'already_refunded':
      return res.status(200).json({ ok: true, message: 'Listing already refunded.' });
    case 'not_eligible':
      return res.status(400).json({ error: 'Listing is not eligible for a refund.' });
    case 'not_found':
      return res.status(404).json({ error: 'Listing not found.' });
    case 'failed':
    default:
      console.error('Error in /api/billing/refund:', result.outcome === 'failed' ? result.error : result);
      return res.status(500).json({ error: result.outcome === 'failed' ? result.error : 'Refund failed' });
  }
}
