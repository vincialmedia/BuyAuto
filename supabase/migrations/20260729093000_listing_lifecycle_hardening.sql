-- LISTINGS LIFECYCLE HARDENING
--
-- Fixes found in the listings-backend audit (PR #21 follow-up). Five things were
-- broken or missing in the lifecycle:
--
--  1. A private (non-garage) seller could set status='published' straight from the
--     browser via the owner_update RLS policy (no column restriction), bypassing
--     admin review — the exact sibling of the premium self-grant. Garage publishes
--     are already gated by enforce_garage_published_listing_requirements; nothing
--     gated private ones.
--  2. Nothing ever expired a listing. The check-expired-listings edge function was
--     never scheduled, so published rows sat live forever past expires_at.
--  3. Nothing reactivated a paused listing: the hourly auto-unpause cron POSTed to a
--     wrong project URL, and the unpause_listing RPC requires auth.uid(), which the
--     service-role caller never has — every call raised and the loop reported ok:0.
--  4. Lapsed premium kept its badge, homepage slot and search boost: the public
--     views exposed the raw `premium` flag with no premium_until check.
--  5. The paid-duration clock started at checkout (prepare wrote expires_at then),
--     so moderation time was deducted from what the seller paid for.
--
-- Approach: enforcement and sweeps live in SQL (pg_cron calls SQL directly — no
-- edge function, no service-role key, no external URL to get wrong). Expiry
-- semantics preserved: premium_until IS NULL still means "permanent" (the platform
-- owner deliberately seeds permanent-premium listings).

begin;

-- ---------------------------------------------------------------------------
-- 1. Status authority: only an admin, the service role / cron, or the gated
--    garage self-publish path may move a listing INTO 'published'. A private
--    owner can no longer forge it.
-- ---------------------------------------------------------------------------
create or replace function public.enforce_listing_status_authority()
returns trigger
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'extensions', 'auth'
as $function$
begin
  -- Only transitions INTO 'published' are gated.
  if new.status is distinct from 'published'::listing_status then
    return new;
  end if;

  -- Already published (an ordinary field edit on a live listing): nothing to gate.
  if tg_op = 'UPDATE' and old.status = 'published'::listing_status then
    return new;
  end if;

  -- Re-activation of an already-approved listing by its owner is legitimate:
  -- unpause (paused -> published) and mark-available (sold -> published).
  if tg_op = 'UPDATE' and old.status in ('paused'::listing_status, 'sold'::listing_status) then
    return new;
  end if;

  -- Service role / cron / direct SQL (no end-user JWT).
  if auth.uid() is null then
    return new;
  end if;

  -- Admin backend.
  if public.get_my_role() = 'admin' then
    return new;
  end if;

  -- Garage self-publish. seller_type is server-derived from the owner's profile
  -- role (apply_listing_seller_metadata) and cannot be forged by a private user,
  -- and enforce_garage_published_listing_requirements independently checks garage
  -- ownership, an active plan and the listing limit for this same transition.
  if new.seller_type = 'garage' then
    return new;
  end if;

  raise exception 'listing_publish_requires_review'
    using hint = 'A private listing is published by an admin after review, not by its owner.';
end;
$function$;

drop trigger if exists trg_enforce_listing_status_authority on public.listings;

create trigger trg_enforce_listing_status_authority
before insert or update of status on public.listings
for each row
execute function public.enforce_listing_status_authority();

-- ---------------------------------------------------------------------------
-- 2. Expiry clock starts at publication, not at checkout.
--    Previously this trigger anchored expires_at at created_at whenever
--    duration_days was written while the listing was still a draft/pending, so
--    the paid window started counting before moderation. Now expires_at is only
--    materialized once the listing is (becoming) live; while it waits for review,
--    expires_at stays NULL and is filled from now() at publish.
-- ---------------------------------------------------------------------------
create or replace function public.set_listing_expires_at()
returns trigger
language plpgsql
set search_path to 'pg_catalog', 'public', 'extensions', 'auth'
as $function$
begin
  if new.duration_days is null then
    new.expires_at := null;
    return new;
  end if;

  -- Respect an explicitly provided expiry (admin edits, unpause shifts, the
  -- one-time backfill migration).
  if new.expires_at is not null then
    return new;
  end if;

  -- Only start the clock when the listing is live. A pending listing keeps a NULL
  -- expiry until an admin publishes it.
  if new.status in ('published'::listing_status, 'active'::listing_status) then
    new.expires_at := now() + make_interval(days => new.duration_days);
  end if;

  return new;
end;
$function$;

-- ---------------------------------------------------------------------------
-- 3. Let a previously-published listing return to 'published' without re-running
--    the garage publish gate (limit/plan). Reactivating a paused garage listing
--    must not be rejected just because the caller is the maintenance sweep.
-- ---------------------------------------------------------------------------
create or replace function public.enforce_garage_published_listing_requirements()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'auth'
as $function$
declare
  v_owner uuid;
  v_limit integer := 0;
  v_published_count integer := 0;
begin
  if new.seller_type is distinct from 'garage' or new.status is distinct from 'published' then
    return new;
  end if;

  -- Already-approved listing coming back online (unpause) — do not re-gate.
  if tg_op = 'UPDATE' and old.status in ('published', 'paused') then
    return new;
  end if;

  if role() = 'service_role' then
    return new;
  end if;

  if auth.uid() is null then
    return new;
  end if;

  if get_my_role() = 'admin' then
    return new;
  end if;

  if new.garage_id is null then
    raise exception 'Garage ID missing';
  end if;

  select g.owner_user_id, coalesce(g.listing_limit, 0)
  into v_owner, v_limit
  from public.garages g
  where g.id = new.garage_id
  for update;

  if not found then
    raise exception 'Garage not found';
  end if;

  if v_owner <> auth.uid() then
    raise exception 'Not authorized';
  end if;

  if new.created_by is not null and new.created_by <> auth.uid() then
    raise exception 'Not authorized';
  end if;

  if not public.dealer_has_entitlement(new.garage_id) then
    raise exception 'Garage has no active plan';
  end if;

  select count(*)
  into v_published_count
  from public.listings l
  where l.garage_id = new.garage_id
    and l.status = 'published'
    and l.id <> new.id;

  if v_published_count >= v_limit then
    raise exception 'Garage listing limit reached';
  end if;

  return new;
end;
$function$;

-- ---------------------------------------------------------------------------
-- 4. Maintenance sweeps (run by pg_cron; auth.uid() is NULL there, so the status
--    and premium authority triggers admit these writes).
-- ---------------------------------------------------------------------------

-- Archive listings whose paid window has elapsed.
create or replace function public.sweep_expired_listings()
returns integer
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'extensions', 'auth'
as $function$
declare
  v_count integer;
begin
  update public.listings
  set status = 'archived'::listing_status,
      archived_at = now(),
      updated_at = now()
  where status = 'published'::listing_status
    and expires_at is not null
    and expires_at <= now();
  get diagnostics v_count = row_count;
  return v_count;
end;
$function$;

-- Clear premium once its window has elapsed. NULL premium_until is permanent and
-- is never touched, so seeded permanent-premium listings survive.
create or replace function public.sweep_lapsed_premium()
returns integer
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'extensions', 'auth'
as $function$
declare
  v_count integer;
begin
  update public.listings
  set premium = false,
      is_premium = false,
      updated_at = now()
  where premium = true
    and premium_until is not null
    and premium_until <= now();
  get diagnostics v_count = row_count;
  return v_count;
end;
$function$;

-- Reactivate paused listings whose pause window has elapsed, extending their
-- expiry by the time actually spent paused (mirrors unpause_listing, minus the
-- per-user auth checks that a cron run cannot satisfy).
create or replace function public.sweep_reactivate_paused()
returns integer
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'extensions', 'auth'
as $function$
declare
  v_count integer;
begin
  update public.listings l
  set status = 'published'::listing_status,
      expires_at = case
        when l.expires_at is null then null
        else l.expires_at + (least(now(), l.pause_until) - coalesce(l.paused_at, l.pause_until))
      end,
      paused_at = null,
      pause_until = null,
      updated_at = now()
  where l.status = 'paused'::listing_status
    and l.pause_until is not null
    and l.pause_until <= now();
  get diagnostics v_count = row_count;
  return v_count;
end;
$function$;

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
begin
  -- Reactivate first so a listing that un-pauses and is simultaneously past expiry
  -- is evaluated for expiry in the same run.
  v_reactivated := public.sweep_reactivate_paused();
  v_expired := public.sweep_expired_listings();
  v_premium := public.sweep_lapsed_premium();
  return jsonb_build_object(
    'reactivated', v_reactivated,
    'expired', v_expired,
    'premium_cleared', v_premium
  );
end;
$function$;

revoke all on function public.sweep_expired_listings() from public, anon, authenticated;
revoke all on function public.sweep_lapsed_premium() from public, anon, authenticated;
revoke all on function public.sweep_reactivate_paused() from public, anon, authenticated;
revoke all on function public.run_listing_maintenance() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. Cron: drop the broken auto-unpause job (wrong URL + auth-incompatible RPC)
--    and run the SQL maintenance sweep hourly instead.
-- ---------------------------------------------------------------------------
do $$
begin
  perform cron.unschedule('auto-unpause-listings-hourly');
exception when others then
  null; -- job may not exist in every environment
end $$;

select cron.schedule(
  'listing-maintenance-hourly',
  '15 * * * *',
  $$ select public.run_listing_maintenance(); $$
);

-- ---------------------------------------------------------------------------
-- 6. Public views: make `premium` expiry-aware at the source, so the search
--    premium filter, the relevance boost and the card badge all stop honouring a
--    lapsed premium in one place. Also add the missing expiry predicate to
--    public_listings (it was anon-readable and exposed expired rows). Column lists
--    are otherwise unchanged so the generated types still match.
-- ---------------------------------------------------------------------------
drop view if exists public.listings_public;
drop view if exists public.public_listings;

create view public.listings_public with (security_invoker = true) as
  select id, brand, model, title, year, price_per_month_chf, remaining_months,
         location, canton_code, mileage_km, fuel, gearbox, body,
         (premium and (premium_until is null or premium_until > now())) as premium,
         cover_image_url, deposit_chf, created_at, updated_at, duration_days,
         is_premium, price_plan, expires_at, status, user_id, images,
         cover_image_index, premium_until, created_by, moderation_note,
         pricing_plan, price_paid_chf, payment_status, stripe_payment_intent_id,
         stripe_refund_id, refunded_at, description, remaining_km, seller_type,
         garage_id, deal_type, financing_type, leasing_offer, ui_version,
         purchase_price_chf, make_id, model_id, variant_id, vin, power_hp,
         drivetrain, first_registration, view_count, archived_at
    from public.listings
   where status = 'published'::listing_status
     and (expires_at is null or expires_at > now());

create view public.public_listings with (security_invoker = true) as
  select id, brand, model, title, description, year, price_per_month_chf,
         remaining_months, remaining_km, location, canton_code, mileage_km, fuel,
         gearbox, body,
         (premium and (premium_until is null or premium_until > now())) as premium,
         images, cover_image_index, deposit_chf, created_at,
         case
           when jsonb_array_length(images) > 0 then
             case
               when cover_image_index is not null
                    and cover_image_index < jsonb_array_length(images)
                 then images ->> cover_image_index
               else images ->> 0
             end
           else null::text
         end as cover_image_url,
         deal_type, financing_type
    from public.listings
   where status = 'published'::listing_status
     and (expires_at is null or expires_at > now());

grant all on public.listings_public to anon, authenticated, service_role, postgres;
grant all on public.public_listings to anon, authenticated, service_role, postgres;

commit;

notify pgrst, 'reload schema';
