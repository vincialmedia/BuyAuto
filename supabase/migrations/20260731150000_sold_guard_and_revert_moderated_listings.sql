-- Moderation-outcome handling for owners.
--
-- 1. mark_listing_sold had NO status guard: any listing — declined, archived,
--    draft, pending — could be flipped to 'sold'. "Sold" is only meaningful
--    for a listing that was actually reachable by buyers, so it is now
--    restricted to published/active/paused (mark_listing_available already
--    had the mirror-image guard).
-- 2. revert_listing_to_draft now also accepts admin outcomes ('rejected' and
--    any 'archived' listing), so an owner whose listing was declined can pull
--    it back to draft, fix it, and resubmit. It restarts the idle clock
--    (updated_at = now()), which is what makes the 30-day draft countdown
--    start from the moment of the revert.
-- 3. The archive sweep no longer stamps a deletion deadline on PAID drafts.
--    Those are protected from deletion anyway (delete-sweep payment guard), so
--    stamping draft_delete_at would show owners a "wird gelöscht" countdown
--    that can never fire. Paid drafts archive and then simply stay.
--
-- Both rewritten functions carry forward the guards added in
-- 20260730150000_listing_flow_integration_repairs.sql — the garage-inventory
-- exclusion in the archive sweep and the 24h working window on revive. They
-- are restated here rather than assumed, because CREATE OR REPLACE FUNCTION
-- replaces the whole body: writing either function against an older copy
-- silently reverts those protections.

create or replace function public.mark_listing_sold(p_listing_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
DECLARE
  v_now timestamptz := now();
  v_status public.listing_status;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.listings l
    LEFT JOIN public.garages g ON g.id = l.garage_id
    WHERE l.id = p_listing_id
      AND (
        l.created_by = auth.uid()
        OR (g.owner_user_id = auth.uid())
        OR (public.get_my_role() = 'admin'::text)
      )
  ) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  SELECT status INTO v_status FROM public.listings WHERE id = p_listing_id;

  -- Only a listing that was actually live can have been sold. Blocks marking
  -- declined/archived/expired/draft/pending listings as sold, which would
  -- otherwise launder them past moderation into the sold lifecycle.
  IF v_status IS NULL OR v_status NOT IN (
    'published'::public.listing_status,
    'active'::public.listing_status,
    'paused'::public.listing_status
  ) THEN
    RAISE EXCEPTION 'listing_not_sellable';
  END IF;

  UPDATE public.listings l
  SET
    status_before_sold = COALESCE(l.status_before_sold, l.status),
    status = 'sold'::public.listing_status,
    sold_at = COALESCE(l.sold_at, v_now),
    sold_delete_at = COALESCE(l.sold_delete_at, v_now + interval '30 days'),
    updated_at = v_now
  WHERE l.id = p_listing_id;
END;
$function$;

create or replace function public.revert_listing_to_draft(p_listing_id uuid)
returns void
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'extensions', 'auth'
as $function$
declare
  v_listing public.listings%rowtype;
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

  update public.listings
  set status = 'draft'::listing_status,
      -- The deadline survives the revive, but never so close that the next
      -- hourly sweep deletes the draft mid-edit.
      draft_delete_at = case
        when draft_delete_at is null then null
        else greatest(draft_delete_at, now() + interval '24 hours')
      end,
      -- Restarts the 30-day idle clock from the revert.
      updated_at = now()
  where id = p_listing_id;
end;
$function$;

create or replace function public.sweep_archive_stale_drafts()
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'extensions', 'auth'
as $function$
declare
  v_wizard integer := 0;
  v_listings integer := 0;
begin
  update public.listing_drafts
  set archived_at = now()
  where archived_at is null
    and updated_at <= now() - interval '30 days';
  get diagnostics v_wizard = row_count;

  update public.listings
  set status = 'archived'::listing_status,
      archived_at = now(),
      archived_reason = 'draft_expired',
      -- Paid drafts are never deleted by the delete sweep, so they must not
      -- carry a deletion deadline either — otherwise the dashboard shows a
      -- countdown that can never fire.
      draft_delete_at = case
        when coalesce(payment_status::text, '') = 'paid' then null
        else coalesce(draft_delete_at, now() + interval '5 days')
      end,
      updated_at = now()
  where status = 'draft'::listing_status
    and updated_at <= now() - interval '30 days'
    and draft_delete_at is null
    -- Garage inventory is excluded: enforce-dealer-entitlements parks a lapsed
    -- dealer's listings in 'draft', and that state must stay recoverable for
    -- as long as it takes the dealer to renew.
    and garage_id is null;
  get diagnostics v_listings = row_count;

  return jsonb_build_object(
    'wizard_drafts_archived', v_wizard,
    'draft_listings_archived', v_listings
  );
end;
$function$;

comment on function public.sweep_archive_stale_drafts() is
  'Marks drafts idle for 30 days as Archiviert and stamps draft_delete_at (+5 days), except for paid drafts (never deleted, so never given a deadline). Garage listings are never swept (a lapsed dealer''s parked inventory must stay recoverable).';
