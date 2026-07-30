-- "Auf Entwurf ändern": an archived draft can be flipped back to 'draft' so the
-- owner can finish it, but the 5-day deletion clock keeps running. Only
-- publishing stops it.
--
-- The deadline therefore needs its own column, listings.draft_delete_at,
-- because archived_at is cleared by trigger the moment the row leaves
-- 'archived'. The delete sweep now keys on this column alone.

alter table public.listings
  add column if not exists draft_delete_at timestamptz;

comment on column public.listings.draft_delete_at is
  'Hard-delete deadline for a draft that aged out (30 days idle). Survives archived -> draft revives; cleared only when the listing is submitted/published.';

-- Backfill the drafts archived by the first sweep so their schedule is unchanged.
update public.listings
set draft_delete_at = archived_at + interval '5 days'
where status = 'archived'
  and archived_reason = 'draft_expired'
  and archived_at is not null
  and draft_delete_at is null;

create index if not exists listings_draft_delete_at_idx
  on public.listings (draft_delete_at)
  where draft_delete_at is not null;

-- ---------------------------------------------------------------------------
-- Publishing (or submitting for review) is the only exit from the deletion
-- countdown. Reviving to 'draft' keeps both the deadline and the reason marker.
-- ---------------------------------------------------------------------------

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

  if new.status in ('pending'::listing_status, 'published'::listing_status, 'active'::listing_status) then
    new.draft_delete_at := null;
    new.archived_reason := null;
  end if;

  return new;
end;
$function$;

-- ---------------------------------------------------------------------------
-- Archive sweep stamps the deadline; delete sweep keys on it.
-- ---------------------------------------------------------------------------

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
      draft_delete_at = coalesce(draft_delete_at, now() + interval '5 days'),
      updated_at = now()
  where status = 'draft'::listing_status
    and updated_at <= now() - interval '30 days'
    and draft_delete_at is null;
  get diagnostics v_listings = row_count;

  return jsonb_build_object(
    'wizard_drafts_archived', v_wizard,
    'draft_listings_archived', v_listings
  );
end;
$function$;

comment on function public.sweep_archive_stale_drafts() is
  'Marks drafts idle for 30 days as Archiviert and stamps draft_delete_at (+5 days). Revived drafts (draft_delete_at already set) are not re-archived; their deletion clock is already running.';

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
  -- Draft-originated listings past their deadline — whether still 'archived'
  -- or revived to 'draft' without being published. The status guard means a
  -- published listing is never deleted even if a stale deadline survives a bug.
  with doomed as (
    select *
    from public.listings
    where draft_delete_at is not null
      and draft_delete_at <= now()
      and status in ('archived'::listing_status, 'draft'::listing_status)
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
  'Hard-deletes draft-originated listings once draft_delete_at passes (tombstoned first), including drafts revived from Archiviert but never published. Ordinary archives (draft_delete_at NULL) are never touched.';
