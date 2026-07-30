-- Monetize expiry: a published listing whose runtime ends becomes 'expired'
-- (not 'archived') and stays offline until the owner re-publishes it for
-- CHF 30 through the relist checkout. Nothing auto-deletes an expired listing.
--
-- Also: the Verlängert (extended) and Unlimitiert (unlimited) plans now include
-- Premium-Platzierung at no extra charge. The Stripe webhook grants it on
-- payment; this migration grandfathers any live listings already on those
-- plans.

-- ---------------------------------------------------------------------------
-- Expiry sweep: published -> expired (owner re-lists for CHF 30).
-- Garage listings are excluded: their visibility is governed by the dealer
-- entitlement job, not by per-listing runtimes.
-- ---------------------------------------------------------------------------

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
  set status = 'expired'::listing_status,
      updated_at = now()
  where status = 'published'::listing_status
    and expires_at is not null
    and expires_at <= now()
    and seller_type is distinct from 'garage';
  get diagnostics v_count = row_count;
  return v_count;
end;
$function$;

comment on function public.sweep_expired_listings() is
  'Moves published listings past expires_at to ''expired''. They stay there until the owner pays the CHF 30 relist fee; they are never auto-archived or auto-deleted.';

-- Legacy function kept because its name is exposed through PostgREST types.
-- It used to convert expired -> archived, which would now destroy the relist
-- state, so it is redefined to the same semantics as the sweep.
create or replace function public.archive_expired_listings()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  expired_count integer := 0;
begin
  expired_count := public.sweep_expired_listings();
  return jsonb_build_object(
    'legacy_converted', 0,
    'archived', 0,
    'expired', expired_count
  );
end;
$function$;

-- ---------------------------------------------------------------------------
-- Grandfather: live listings already on extended/unlimited get the included
-- premium placement. (Runs as service role, so the premium-authority trigger
-- permits it.) Unlimited premium never lapses; extended premium runs to the
-- listing's own expiry.
-- ---------------------------------------------------------------------------

update public.listings
set premium = true,
    is_premium = true,
    premium_until = case when price_plan = 'unlimited' then null else expires_at end,
    updated_at = now()
where price_plan in ('extended', 'unlimited')
  and status in ('pending'::listing_status, 'published'::listing_status, 'active'::listing_status)
  and premium is distinct from true;
