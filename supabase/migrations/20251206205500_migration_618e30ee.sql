DROP VIEW IF EXISTS public_listings;

CREATE VIEW public_listings AS
SELECT 
  id,
  brand,
  model,
  title,
  description, -- Added successfully now
  year,
  price_per_month_chf,
  remaining_months,
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
  -- Helper to get the cover image URL directly
  CASE 
    WHEN jsonb_array_length(images) > 0 THEN 
      -- Handle potential null index safely
      CASE 
        WHEN cover_image_index IS NOT NULL AND cover_image_index < jsonb_array_length(images) THEN
          images->>cover_image_index
        ELSE
          images->>0
      END
    ELSE NULL
  END as cover_image_url
FROM listings
WHERE status = 'published';