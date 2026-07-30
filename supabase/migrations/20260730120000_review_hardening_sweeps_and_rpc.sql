-- Hardening from the adversarial review of the draft/expiry batch.
--
-- 1. The delete sweep must never destroy a draft whose payment is in flight
--    or completed. A revived draft can be sitting in Stripe checkout when its
--    deadline passes: payment_status is 'requires_payment' while the money is
--    being taken, and 'paid' for the seconds (or, if the webhook is down,
--    longer) before the status flips to pending and the trigger clears the
--    deadline. Deleting in that window destroys a paid listing.
--    * paid drafts are never swept;
--    * requires_payment drafts get a 2-day grace past the deadline, which
--      outlasts any real checkout while still clearing abandoned ones.
-- 2. The DELETE re-checks every predicate on the current row version (not
--    just the CTE snapshot), so a row that gets published/paid between
--    snapshot and row lock survives (EvalPlanQual re-evaluates the quals).
-- 3. Marking a revived draft as sold now clears the deletion deadline —
--    'sold' has its own lifecycle (sold_delete_at); keeping both countdowns
--    was contradictory.
-- 4. revert_listing_to_draft: uniform error for missing vs foreign listings
--    (no existence oracle), and refuses drafts whose deadline already passed
--    (the next sweep would delete them minutes after the "rescue").

create or replace function public.sweep_delete_archived_drafts()
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'extensions', 'auth'
as $function$
declare
  v_wizard integer := 0;
  v_listings integer := 0;
begin
  with doomed as (
    select *
    from public.listings
    where draft_delete_at is not null
      and draft_delete_at <= now()
      and status in ('archived'::listing_status, 'draft'::listing_status)
      and coalesce(payment_status::text, '') <> 'paid'
      and (coalesce(payment_status::text, '') <> 'requires_payment'
           or draft_delete_at <= now() - interval '2 days')
  ), tombstoned as (
    insert into public.listing_tombstones (
      original_listing_id, garage_id, seller_user_id, brand, model, year,
      location, deal_type, financing_type, price_per_month_chf,
      purchase_price_chf, cover_image_url, sold_at, deleted_at
    )
    select
      d.id, d.garage_id, d.created_by, d.brand, d.model, d.year,
      d.location, d.deal_type, d.financing_type, d.price_per_month_chf,
      d.purchase_price_chf, d.cover_image_url, null, now()
    from doomed d
    on conflict (original_listing_id) do nothing
    returning original_listing_id
  ), removed as (
    delete from public.listings l
    using doomed d
    where l.id = d.id
      -- Re-checked on the current row version: a concurrent publish/payment
      -- between snapshot and lock keeps the row alive.
      and l.status in ('archived'::listing_status, 'draft'::listing_status)
      and l.draft_delete_at is not null
      and l.draft_delete_at <= now()
      and coalesce(l.payment_status::text, '') <> 'paid'
      and (coalesce(l.payment_status::text, '') <> 'requires_payment'
           or l.draft_delete_at <= now() - interval '2 days')
    returning l.id
  )
  select count(*) into v_listings from removed;

  delete from public.listing_drafts
  where archived_at is not null
    and archived_at <= now() - interval '5 days';
  get diagnostics v_wizard = row_count;

  return jsonb_build_object(
    'wizard_drafts_deleted', v_wizard,
    'draft_listings_deleted', v_listings
  );
end;
$function$;

comment on function public.sweep_delete_archived_drafts() is
  'Hard-deletes draft-originated listings once draft_delete_at passes (tombstoned first). Paid drafts are never swept; requires_payment drafts get a 2-day grace. All predicates are re-checked at delete time against the current row version.';

create or replace function public.set_listings_archived_at()
returns trigger
language plpgsql
set search_path to 'pg_catalog', 'public', 'extensions', 'auth'
as $function$
begin
  if new.status = 'archived' and (old.status is distinct from new.status) then
    new.archived_at := coalesce(new.archived_at, now());
  end if;

  if new.status is distinct from 'archived' then
    new.archived_at := null;
  end if;

  if new.status in ('pending'::listing_status, 'published'::listing_status, 'active'::listing_status, 'sold'::listing_status) then
    new.draft_delete_at := null;
    new.archived_reason := null;
  end if;

  return new;
end;
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

  if v_listing.status <> 'archived'::listing_status or v_listing.archived_reason is distinct from 'draft_expired' then
    raise exception 'only_expired_draft_archives_can_be_reverted';
  end if;

  if v_listing.draft_delete_at is not null and v_listing.draft_delete_at <= now() then
    raise exception 'deletion_deadline_passed';
  end if;

  update public.listings
  set status = 'draft'::listing_status,
      updated_at = now()
  where id = p_listing_id;
end;
$function$;
