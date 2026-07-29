-- Draft lifecycle sweeps: 30 days idle -> Archiviert, 5 days later -> deleted.
--
-- Covers both kinds of draft:
--   * public.listing_drafts       - wizard drafts (jsonb, never became a listing)
--   * public.listings status=draft - listings created by the wizard but never paid/published
--
-- Idle is measured from updated_at (last edit), so a draft someone is still
-- working on never ages out.

-- ---------------------------------------------------------------------------
-- Don't email "Ihr Inserat wurde archiviert" for a draft that was never live.
-- The day-30 reminder already tells the owner it is about to be archived.
-- ---------------------------------------------------------------------------

create or replace function public.handle_listing_status_change()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  fn_url text;
  svc_key text;
  new_status text;
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  if new.status is not distinct from old.status then
    return new;
  end if;

  new_status := new.status::text;

  if new_status not in ('published', 'rejected', 'archived') then
    return new;
  end if;

  -- A stale draft being swept into 'archived' is housekeeping, not a
  -- moderation outcome the owner needs an email about.
  if new_status = 'archived' and new.archived_reason = 'draft_expired' then
    return new;
  end if;

  svc_key := public.get_service_role_key();
  fn_url := public.supabase_url() || '/functions/v1/listing-status-notification';

  perform net.http_post(
    url := fn_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || svc_key
    ),
    body := jsonb_build_object(
      'record', to_jsonb(new),
      'old_record', to_jsonb(old),
      'notification_status', new_status
    )
  );

  return new;
end;
$function$;

-- ---------------------------------------------------------------------------
-- Archive drafts that have sat untouched for 30 days
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
      updated_at = now()
  where status = 'draft'::listing_status
    and updated_at <= now() - interval '30 days';
  get diagnostics v_listings = row_count;

  return jsonb_build_object(
    'wizard_drafts_archived', v_wizard,
    'draft_listings_archived', v_listings
  );
end;
$function$;

comment on function public.sweep_archive_stale_drafts() is
  'Marks drafts idle for 30 days as Archiviert. Idle is measured from updated_at.';

-- ---------------------------------------------------------------------------
-- Delete archived drafts 5 days after they were archived
--
-- Scoped to draft-originated archives only: a published listing that expired
-- into 'archived' has archived_reason NULL and is never touched here.
-- ---------------------------------------------------------------------------

create or replace function public.sweep_delete_archived_drafts()
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'extensions', 'auth'
as $function$
declare
  v_wizard integer := 0;
  v_listings integer := 0;
  v_cutoff timestamptz := now() - interval '5 days';
begin
  -- Draft listings: keep a tombstone so the record survives the delete,
  -- mirroring the sold-listing cleanup.
  with doomed as (
    select *
    from public.listings
    where status = 'archived'::listing_status
      and archived_reason = 'draft_expired'
      and archived_at is not null
      and archived_at <= v_cutoff
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

  -- Wizard drafts are not listings, so there is nothing to tombstone.
  delete from public.listing_drafts
  where archived_at is not null
    and archived_at <= v_cutoff;
  get diagnostics v_wizard = row_count;

  return jsonb_build_object(
    'wizard_drafts_deleted', v_wizard,
    'draft_listings_deleted', v_listings
  );
end;
$function$;

comment on function public.sweep_delete_archived_drafts() is
  'Hard-deletes draft-originated archives 5 days after archiving. Archives from expired published listings (archived_reason IS NULL) are left alone.';

-- ---------------------------------------------------------------------------
-- Wire both sweeps into the existing hourly maintenance job
-- ---------------------------------------------------------------------------

create or replace function public.run_listing_maintenance()
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'extensions', 'auth'
as $function$
declare
  v_reactivated integer;
  v_expired integer;
  v_premium integer;
  v_drafts_archived jsonb;
  v_drafts_deleted jsonb;
begin
  v_reactivated := public.sweep_reactivate_paused();
  v_expired := public.sweep_expired_listings();
  v_premium := public.sweep_lapsed_premium();
  v_drafts_archived := public.sweep_archive_stale_drafts();
  v_drafts_deleted := public.sweep_delete_archived_drafts();

  return jsonb_build_object(
    'reactivated', v_reactivated,
    'expired', v_expired,
    'premium_cleared', v_premium,
    'drafts_archived', v_drafts_archived,
    'drafts_deleted', v_drafts_deleted
  );
end;
$function$;

revoke all on function public.sweep_archive_stale_drafts() from public, anon, authenticated;
revoke all on function public.sweep_delete_archived_drafts() from public, anon, authenticated;
