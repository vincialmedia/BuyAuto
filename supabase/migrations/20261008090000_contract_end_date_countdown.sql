-- SEO Phase 1 / Task 5a: remaining months that count down.
--
-- Every listing stores remaining months as entered (remaining_months, or
-- leasing_offer->lease_takeover_offer->remaining_months for takeovers saved as
-- direct_purchase), but contract_end_date is NULL on every row, so the site has
-- shown the same number since publication. This migration anchors each contract
-- to a real end date; the app then shows
--   effective months = calendar months from today to contract_end_date (min 0)
-- and falls back to the stored value while contract_end_date is NULL
-- (src/lib/buyauto/kaufart.ts).
--
-- Additive only:
--   * remaining_months, deal_type and every other seller-entered value stay
--     untouched; only contract_end_date is filled, and only where it is NULL.
--   * new helper + trigger functions, a new trigger, and listings_public gains
--     one trailing column (contract_end_date). Existing columns, their order
--     and the security_invoker setting are unchanged.
--
-- Side effects of the backfill UPDATE were checked against every row trigger on
-- public.listings (2026-10-08): the status/notification triggers only act on a
-- status or payment transition, the expiry/premium/drafts triggers are scoped
-- to other columns, and apply_canonical_vehicle_ids_listings has nothing to
-- fill (make_id/model_id set on every row; listings carry no variant text).
-- No email or webhook fires and updated_at is not stamped.

begin;

-- ---------------------------------------------------------------------------
-- 1. Stored remaining months: column first, then the takeover offer JSON.
--    Non-numeric JSON values yield NULL instead of raising, so a malformed
--    offer can never block a save through the trigger below.
-- ---------------------------------------------------------------------------
create or replace function public.listing_stored_remaining_months(
  p_remaining_months integer,
  p_leasing_offer jsonb
)
returns integer
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    p_remaining_months,
    case
      when (p_leasing_offer -> 'lease_takeover_offer' ->> 'remaining_months') ~ '^\s*\d+(\.\d+)?\s*$'
        then round((p_leasing_offer -> 'lease_takeover_offer' ->> 'remaining_months')::numeric)::integer
    end
  );
$$;

comment on function public.listing_stored_remaining_months(integer, jsonb) is
  'coalesce(remaining_months, leasing_offer.lease_takeover_offer.remaining_months) as integer; NULL when absent or non-numeric.';

-- ---------------------------------------------------------------------------
-- 2. Backfill: first day of the month of published_at (fallback created_at)
--    + stored months. Runs before the trigger exists.
-- ---------------------------------------------------------------------------
update public.listings l
   set contract_end_date = (
         date_trunc('month', coalesce(l.published_at, l.created_at) at time zone 'Europe/Zurich')::date
         + make_interval(months => greatest(0, m.months))
       )::date
  from (
    select id, public.listing_stored_remaining_months(remaining_months, leasing_offer) as months
      from public.listings
  ) m
 where m.id = l.id
   and l.contract_end_date is null
   and m.months is not null
   and coalesce(l.published_at, l.created_at) is not null;

-- ---------------------------------------------------------------------------
-- 3. Write path: whenever remaining months are saved, anchor the contract at
--    the first day of the current month (Europe/Zurich) + N months.
--    * create: only when the seller did not enter a contract end date;
--    * edit: only when the stored months changed (re-saving the form with the
--      same months keeps the running countdown) and the seller did not change
--      the contract end date in the same save, or when no end date exists.
--    A contract end date the seller entered is never overwritten.
-- ---------------------------------------------------------------------------
create or replace function public.set_listing_contract_end_date()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_months integer := public.listing_stored_remaining_months(new.remaining_months, new.leasing_offer);
  v_old_months integer;
begin
  if v_months is null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.contract_end_date is not null then
      return new;
    end if;
  else
    v_old_months := public.listing_stored_remaining_months(old.remaining_months, old.leasing_offer);
    if new.contract_end_date is not null
       and (v_months is not distinct from v_old_months
            or new.contract_end_date is distinct from old.contract_end_date) then
      return new;
    end if;
  end if;

  new.contract_end_date := (
    date_trunc('month', now() at time zone 'Europe/Zurich')::date
    + make_interval(months => greatest(0, v_months))
  )::date;

  return new;
end;
$$;

drop trigger if exists trg_listings_contract_end_date on public.listings;
create trigger trg_listings_contract_end_date
  before insert or update on public.listings
  for each row execute function public.set_listing_contract_end_date();

-- ---------------------------------------------------------------------------
-- 4. Expose contract_end_date on the public read surface (appended column).
-- ---------------------------------------------------------------------------
create or replace view public.listings_public with (security_invoker = true) as
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
         l.drivetrain, l.first_registration, l.view_count, l.archived_at,
         l.contract_end_date
    from public.listings l
    left join public.variants v on v.id = l.variant_id
   where l.status = 'published'::listing_status
     and (l.expires_at is null or l.expires_at > now());

commit;

notify pgrst, 'reload schema';
