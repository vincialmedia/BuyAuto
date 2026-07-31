-- Integration repairs after merging the catalog/variant work (#10), the
-- draft-lifecycle/expiry batch (#26) and the leasing restriction (#30) on top
-- of the premium/expiry hardening (#21). Six independent fixes:
--
-- 1. CRITICAL - Dealer inventory vs. draft sweeps: enforce-dealer-entitlements
--    demotes a lapsed dealer's published listings to status 'draft'. The new
--    draft sweeps then treat them like abandoned wizard drafts: archived after
--    30 idle days, hard-deleted 5 days later. A lapsed subscription must never
--    destroy a dealer's inventory - both sweeps now skip garage listings, and
--    already-armed deadlines on garage rows are cleared.
--
-- 2. listings_public: the repo migration from #10 (variant join) and the live
--    definition from #21 (lapse-aware premium) had each reverted the other,
--    depending on apply order - live prod was missing the variant column
--    entirely, which breaks the variant search facet. One canonical
--    definition: variant join + premium masking + published/expiry filter.
--
-- 3. Garage listings have no per-listing runtime (inventory is
--    subscription-driven, and the expiry sweep deliberately excludes them),
--    but the publish triggers still stamped expires_at - once past it, the
--    public views hid the listing forever with no exit. Publish triggers now
--    skip garage rows; existing stamps are cleared.
--
-- 4. Expiry reminders: uq_email_log_entity is unique on (kind, entity,
--    recipient), so the 7-day reminder suppressed the 3-day one, and after a
--    paid relist every future cycle's reminders were suppressed too. The
--    expiry reminder gets the same days_before carve-out the draft reminder
--    already has (the relist fulfillment paths additionally clear old rows).
--
-- 5. Included premium (Verlaengert/Unlimitiert) was anchored at payment time,
--    while the listing runtime starts at publication - premium lapsed up to
--    days before the paid runtime ended. A publish-time trigger now aligns
--    premium_until with expires_at.
--
-- 6. revert_listing_to_draft could revive a draft seconds before its
--    deletion deadline - the next hourly sweep then deleted it mid-edit. A
--    revive now guarantees at least a 24h working window (bounded: reviving
--    requires the archived draft_expired state, which a revived row no longer
--    has, so the extension cannot be repeated).

-- ---------------------------------------------------------------------------
-- 1. Draft sweeps never touch garage listings
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
  'Marks drafts idle for 30 days as Archiviert and stamps draft_delete_at (+5 days). Garage listings are never swept (a lapsed dealer''s parked inventory must stay recoverable). Revived drafts (draft_delete_at already set) are not re-archived.';

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
      and garage_id is null
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
      and l.garage_id is null
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
  'Hard-deletes draft-originated listings once draft_delete_at passes (tombstoned first). Garage listings and paid drafts are never swept; requires_payment drafts get a 2-day grace. All predicates are re-checked at delete time against the current row version.';

-- Disarm deadlines the old sweeps already stamped onto garage rows. Their
-- status (draft/archived) is left as-is - it is the dealer-entitlement state.
update public.listings
set draft_delete_at = null,
    archived_reason = case when archived_reason = 'draft_expired' then null else archived_reason end
where garage_id is not null
  and (draft_delete_at is not null or archived_reason = 'draft_expired');

-- ---------------------------------------------------------------------------
-- 2. Canonical listings_public: variant join + lapse-aware premium
-- ---------------------------------------------------------------------------

drop view if exists public.listings_public;

create view public.listings_public with (security_invoker = true) as
  select l.id, l.brand, l.model, v.name as variant, l.title, l.year,
         l.price_per_month_chf, l.remaining_months,
         l.location, l.canton_code, l.mileage_km, l.fuel, l.gearbox, l.body,
         (l.premium and (l.premium_until is null or l.premium_until > now())) as premium,
         l.cover_image_url, l.deposit_chf, l.created_at, l.updated_at, l.duration_days,
         l.is_premium, l.price_plan, l.expires_at, l.status, l.user_id, l.images,
         l.cover_image_index, l.premium_until, l.created_by, l.moderation_note,
         l.pricing_plan, l.price_paid_chf, l.payment_status, l.stripe_payment_intent_id,
         l.stripe_refund_id, l.refunded_at, l.description, l.remaining_km, l.seller_type,
         l.garage_id, l.deal_type, l.financing_type, l.leasing_offer, l.ui_version,
         l.purchase_price_chf, l.make_id, l.model_id, l.variant_id, l.vin, l.power_hp,
         l.drivetrain, l.first_registration, l.view_count, l.archived_at
    from public.listings l
    left join public.variants v on v.id = l.variant_id
   where l.status = 'published'::listing_status
     and (l.expires_at is null or l.expires_at > now());

grant all on public.listings_public to anon, authenticated, service_role, postgres;

-- ---------------------------------------------------------------------------
-- 3. Garage listings carry no per-listing runtime
-- ---------------------------------------------------------------------------

create or replace function public.ensure_listing_expiry_defaults()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  plan text;
  duration integer;
begin
  if (new.status)::text <> 'published' then
    return new;
  end if;

  -- Garage inventory runs on the dealer subscription, not a per-listing
  -- runtime; the expiry sweep excludes it, so a stamped expires_at would only
  -- ever hide the listing with no path back.
  if new.garage_id is not null then
    new.duration_days := null;
    new.expires_at := null;
    return new;
  end if;

  if new.expires_at is not null then
    return new;
  end if;

  plan := coalesce(new.pricing_plan, new.price_plan, 'standard');

  if plan = 'unlimited' then
    new.duration_days := null;
    new.expires_at := null;
    return new;
  end if;

  if new.duration_days is null then
    if plan = 'extended' then
      duration := 90;
    elsif plan in ('free30','premium30') then
      duration := 30;
    else
      duration := 60;
    end if;

    new.duration_days := duration;
  else
    duration := new.duration_days;
  end if;

  if duration is not null then
    new.expires_at := now() + make_interval(days => duration);
  end if;

  return new;
end;
$function$;

create or replace function public.set_listing_expires_at()
returns trigger
language plpgsql
set search_path to 'pg_catalog', 'public', 'extensions', 'auth'
as $function$
begin
  -- See ensure_listing_expiry_defaults: garage inventory never expires per
  -- listing.
  if new.garage_id is not null then
    new.expires_at := null;
    return new;
  end if;
  if new.duration_days is null then
    new.expires_at := null;
    return new;
  end if;
  if new.expires_at is not null then
    return new;
  end if;
  if new.status in ('published'::listing_status, 'active'::listing_status) then
    new.expires_at := now() + make_interval(days => new.duration_days);
  end if;
  return new;
end;
$function$;

-- Clear stamps that already exist on garage rows so nothing is hidden by a
-- runtime it should never have had.
update public.listings
set expires_at = null,
    duration_days = null
where garage_id is not null
  and (expires_at is not null or duration_days is not null);

-- ---------------------------------------------------------------------------
-- 4. Expiry reminders: per-step dedupe instead of one-shot-forever
-- ---------------------------------------------------------------------------

drop index if exists public.uq_email_log_entity;

create unique index uq_email_log_entity
  on public.email_notification_log (kind, entity_id, recipient_email)
  where entity_id is not null
    and message_id is null
    and kind not in ('draft_completion_reminder', 'listing_expiry_reminder');

create unique index if not exists email_notification_log_expiry_reminder_uniq
  on public.email_notification_log (kind, entity_id, days_before, recipient_email)
  where kind = 'listing_expiry_reminder'
    and entity_id is not null
    and days_before is not null
    and recipient_email is not null;

-- ---------------------------------------------------------------------------
-- 5. Included premium runs with the listing runtime
-- ---------------------------------------------------------------------------

create or replace function public.align_included_premium_on_publish()
returns trigger
language plpgsql
set search_path to 'pg_catalog', 'public', 'extensions', 'auth'
as $function$
begin
  -- The webhook grants included premium when the payment lands, but the
  -- listing clock only starts at publication - re-anchor the premium window
  -- to the runtime the seller actually paid for. Garage premium is credit-
  -- driven and stays untouched.
  if new.status = 'published'::listing_status
     and old.status is distinct from new.status
     and new.premium is true
     and new.garage_id is null
     and coalesce(new.pricing_plan, new.price_plan, 'standard') in ('extended', 'unlimited') then
    if coalesce(new.pricing_plan, new.price_plan) = 'unlimited' then
      new.premium_until := null;
    elsif new.expires_at is not null then
      new.premium_until := new.expires_at;
    end if;
  end if;

  return new;
end;
$function$;

-- 'zz_' so it runs after the expiry triggers in the same BEFORE UPDATE chain
-- (trigger order is alphabetical) - expires_at must be anchored first.
drop trigger if exists zz_align_included_premium_on_publish on public.listings;
create trigger zz_align_included_premium_on_publish
  before update on public.listings
  for each row
  execute function public.align_included_premium_on_publish();

-- ---------------------------------------------------------------------------
-- 6. A revive always leaves a real working window
-- ---------------------------------------------------------------------------

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
      -- The deadline survives the revive, but never so close that the next
      -- hourly sweep deletes the draft mid-edit. Bounded: a revived row loses
      -- the archived/draft_expired state this RPC requires, so the 24h floor
      -- cannot be re-applied repeatedly.
      draft_delete_at = case
        when draft_delete_at is null then null
        else greatest(draft_delete_at, now() + interval '24 hours')
      end,
      updated_at = now()
  where id = p_listing_id;
end;
$function$;

notify pgrst, 'reload schema';
