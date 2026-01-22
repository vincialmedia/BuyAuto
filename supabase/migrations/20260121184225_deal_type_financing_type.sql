DO $$
BEGIN
  CREATE TYPE public.deal_type AS ENUM ('lease_takeover', 'direct_purchase');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.financing_type AS ENUM ('cash', 'leasing');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS deal_type public.deal_type NOT NULL DEFAULT 'lease_takeover',
  ADD COLUMN IF NOT EXISTS financing_type public.financing_type NULL;

UPDATE public.listings
SET
  deal_type = 'lease_takeover',
  financing_type = NULL;

ALTER TABLE public.listings
  DROP CONSTRAINT IF EXISTS listings_deal_financing_consistency,
  ADD CONSTRAINT listings_deal_financing_consistency
    CHECK (
      (deal_type = 'lease_takeover' AND financing_type IS NULL)
      OR
      (deal_type = 'direct_purchase' AND financing_type IS NOT NULL)
    );

CREATE INDEX IF NOT EXISTS listings_deal_type_idx ON public.listings (deal_type);
CREATE INDEX IF NOT EXISTS listings_deal_type_financing_type_idx ON public.listings (deal_type, financing_type);

CREATE OR REPLACE VIEW public.public_listings AS
SELECT
  id,
  brand,
  model,
  title,
  description,
  deal_type,
  financing_type,
  year,
  price_per_month_chf,
  remaining_months,
  remaining_km,
  location,
  canton_code,
  mileage_km,
  fuel,
  gearbox,
  body,
  premium,
  images,
  cover_image_index,
  deposit_chf,
  created_at,
  CASE
    WHEN jsonb_array_length(COALESCE(images, '[]'::jsonb)) > 0 THEN
      CASE
        WHEN cover_image_index IS NOT NULL
          AND cover_image_index < jsonb_array_length(COALESCE(images, '[]'::jsonb))
          THEN images ->> cover_image_index
        ELSE images ->> 0
      END
    ELSE NULL::text
  END AS cover_image_url
FROM public.listings
WHERE status = 'published'::listing_status;