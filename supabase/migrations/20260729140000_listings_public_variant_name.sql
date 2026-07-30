-- Search filters by name strings against listings_public (brand, model). Listings
-- carry variant_id but the view never exposed the variant's NAME, so the search UI
-- could not offer or filter a third level. Join it in as `variant` so the whole
-- search stack stays uniformly name-based.
--
-- Left join: listings without a variant keep flowing through the view. The join is
-- safe under security_invoker because variants has a public-read RLS policy.

begin;

drop view if exists public.listings_public;

create view public.listings_public with (security_invoker = true) as
  select l.id, l.brand, l.model, v.name as variant, l.title, l.year,
         l.price_per_month_chf, l.remaining_months,
         l.location, l.canton_code, l.mileage_km, l.fuel, l.gearbox, l.body, l.premium,
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

commit;

-- Make PostgREST pick up the new column immediately (clears the PGRST204 cache).
notify pgrst, 'reload schema';
