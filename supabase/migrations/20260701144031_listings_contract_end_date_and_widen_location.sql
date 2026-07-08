-- Fix two create-listing submit failures caused by code/schema drift.
--
-- 1) PGRST204 "Could not find the 'contract_end_date' column of 'listings'":
--    The whole create-listing stack (types.ts, schemas.ts, the Step 2
--    LeaseTakeover* forms and createListingService's ListingUpdatePayload) has
--    always written a top-level `contract_end_date` field, but no migration ever
--    created the column. Pure Leasingübernahme listings send it on insert, so
--    PostgREST rejects the request before it reaches Postgres. Add the column the
--    code already expects (a nullable DATE; forms send `yyyy-MM-dd`).
--
-- 2) 22001 "value too long for type character varying(100)":
--    `location` (and `title`) were character varying(100). `location` stores the
--    full Nominatim `display_name` returned by /api/locations/suggest, e.g.
--    "Niederbuchsiten, Bezirk Gäu, Amtei Thal-Gäu, Solothurn, 4626,
--    Schweiz/Suisse/Svizzera/Svizra" (92 chars) — already within 8 chars of the
--    limit, and longer municipality/district combinations overflow it. Widen both
--    text columns to unbounded `text` (a lossless change). Length is validated in
--    the app layer, not by an arbitrary DB cap.
--
-- `location` and `title` are referenced by the security_invoker views
-- `listings_public` and `public_listings`, so Postgres blocks the ALTER TYPE while
-- they exist. Drop both views, widen the columns, then recreate the views verbatim
-- (same definition, security_invoker=true, and grants). Nothing else depends on
-- these views. All wrapped in one transaction so the public read surface is never
-- missing.

begin;

-- (1) Missing column the create-listing code already writes.
alter table public.listings
  add column if not exists contract_end_date date;

comment on column public.listings.contract_end_date is
  'Lease-takeover contract end date (nullable). Written by the create-listing wizard for deal_type = lease_takeover.';

-- (2) Widen the two varchar(100) text columns. Drop dependent views first.
drop view if exists public.listings_public;
drop view if exists public.public_listings;

alter table public.listings
  alter column location type text,
  alter column title    type text;

-- Recreate views exactly as they were (security_invoker so RLS on listings applies
-- to the querying role).
create view public.listings_public with (security_invoker = true) as
  select id, brand, model, title, year, price_per_month_chf, remaining_months,
         location, canton_code, mileage_km, fuel, gearbox, body, premium,
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
         gearbox, body, premium, images, cover_image_index, deposit_chf, created_at,
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
   where status = 'published'::listing_status;

-- Restore grants (GRANT ALL matches the captured privilege set for every role).
grant all on public.listings_public to anon, authenticated, service_role, postgres;
grant all on public.public_listings to anon, authenticated, service_role, postgres;

commit;

-- Make PostgREST pick up the new column immediately (clears the PGRST204 cache).
notify pgrst, 'reload schema';
