-- A refund closes a listing's payment cycle. Reverting a refunded listing to
-- draft has to open a new one.
--
-- Declining a paid listing now refunds it (src/pages/api/admin/listings/
-- update-status.ts), which leaves payment_status='refunded' on the row. Every
-- downstream guard treats that as terminal: /api/billing/prepare answers 409
-- "bereits bezahlt", and both the Stripe webhook and verify-payment refuse to
-- write over it. A seller who pulled their declined listing back to draft to
-- fix it would therefore never be able to pay for it again, and never republish
-- it — the refund would have quietly cost them the listing.
--
-- Clearing the cycle on the revert is what keeps the two features coherent. The
-- seller starts over exactly as if the listing had never been paid for, and a
-- second decline refunds the second payment instead of short-circuiting on the
-- first refund's stripe_refund_id. Stripe remains the record of the charge and
-- the refund; the listing row only ever describes the cycle it is in now.
--
-- Only 'refunded' resets. A *paid* listing reverted to draft keeps its payment,
-- so a seller who pulls back an aged-out draft can resubmit on the money
-- already taken rather than being charged twice.
--
-- CREATE OR REPLACE swaps the entire body, so every guard this function already
-- had is restated verbatim below: the ownership check with no existence oracle,
-- the archived/rejected-only transition, the refusal once the deletion deadline
-- has passed, and the 24h floor that stops a revived draft being swept away
-- mid-edit.
create or replace function public.revert_listing_to_draft(p_listing_id uuid)
returns void
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'extensions', 'auth'
as $function$
declare
  v_listing public.listings%rowtype;
  v_refunded boolean;
begin
  select * into v_listing
  from public.listings
  where id = p_listing_id
  for update;

  -- Same error for "does not exist" and "not yours": no existence oracle.
  if not found
     or auth.uid() is null
     or (v_listing.created_by is distinct from auth.uid() and v_listing.user_id is distinct from auth.uid()) then
    raise exception 'listing_not_found';
  end if;

  -- Aged-out drafts, admin-declined listings and archived listings can all be
  -- pulled back to draft. Live states have their own transitions.
  if v_listing.status not in ('archived'::listing_status, 'rejected'::listing_status) then
    raise exception 'only_archived_or_rejected_can_be_reverted';
  end if;

  if v_listing.draft_delete_at is not null and v_listing.draft_delete_at <= now() then
    raise exception 'deletion_deadline_passed';
  end if;

  v_refunded := v_listing.payment_status = 'refunded';

  update public.listings
  set status = 'draft'::listing_status,
      -- The deadline survives the revive, but never so close that the next
      -- hourly sweep deletes the draft mid-edit. A decline reverted before its
      -- final 5 days has no deadline at all, so it becomes an ordinary draft
      -- with a fresh 30-day clock.
      draft_delete_at = case
        when draft_delete_at is null then null
        else greatest(draft_delete_at, now() + interval '24 hours')
      end,
      -- It is a draft now, not an archived or declined listing. Leaving these
      -- set made the admin Entwürfe view read the stale stamp as "already
      -- archived" and show a deletion countdown for a live draft, and left a
      -- 'moderation_declined' marker that would exempt the row from the delete
      -- sweep's payment guard.
      archived_at = null,
      archived_reason = null,
      -- The money is back with the seller, so this listing is unpaid again.
      -- Leaving the refunded cycle in place would block /api/billing/prepare,
      -- and the stale stripe_refund_id would make a second decline skip its
      -- refund as "already refunded".
      payment_status = case when v_refunded then null else payment_status end,
      stripe_payment_intent_id = case when v_refunded then null else stripe_payment_intent_id end,
      stripe_refund_id = case when v_refunded then null else stripe_refund_id end,
      refunded_at = case when v_refunded then null else refunded_at end,
      price_paid_chf = case when v_refunded then null else price_paid_chf end,
      -- Restarts the 30-day idle clock from the revert.
      updated_at = now()
  where id = p_listing_id;
end;
$function$;
