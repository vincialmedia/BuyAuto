-- A refunded revert opens a new payment cycle (20260731223000) — but it left
-- the old cycle's runtime and premium behind on the row:
--
--  * expires_at survived, so when the seller paid again and the listing was
--    re-approved, ensure_listing_expiry_defaults kept the stale (possibly
--    already passed) stamp instead of anchoring a fresh window — the newly
--    paid listing could go live already expired, and the premium grant paths
--    could anchor premium_until to that dead runtime.
--  * premium/is_premium/premium_until survived, so a refunded Verlängert or
--    Unlimitiert listing reverted to draft and re-paid as Standard (or free)
--    kept the premium placement of the plan whose money was given back.
--
-- Both clears apply only to the refunded case — the same rule as the payment
-- columns: the seller starts over exactly as if the listing had never been
-- paid for. A *paid* listing reverted to draft keeps its runtime stamp and
-- premium, because its payment (and what it bought) is still in force.
--
-- The premium clear needs the transaction-local premium grant: this RPC runs
-- as the listing owner, and trg_enforce_listing_premium_authority rejects
-- owners changing premium columns without it.
--
-- CREATE OR REPLACE swaps the entire body, so every guard this function
-- already had is restated verbatim below: the ownership check with no
-- existence oracle, the archived/rejected-only transition, the refusal once
-- the deletion deadline has passed, and the 24h floor that stops a revived
-- draft being swept away mid-edit.
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

  if v_refunded then
    perform set_config('app.premium_grant', 'on', true);
  end if;

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
      -- The refunded cycle's runtime and premium go with it: the next payment
      -- must buy a fresh window (anchored at re-publication), and the premium
      -- of a plan whose money was given back must not survive into a cycle
      -- that may never include it.
      expires_at = case when v_refunded then null else expires_at end,
      premium = case when v_refunded then false else premium end,
      is_premium = case when v_refunded then false else is_premium end,
      premium_until = case when v_refunded then null else premium_until end,
      -- Restarts the 30-day idle clock from the revert.
      updated_at = now()
  where id = p_listing_id;

  if v_refunded then
    perform set_config('app.premium_grant', 'off', true);
  end if;
end;
$function$;

notify pgrst, 'reload schema';
