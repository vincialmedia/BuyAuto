ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS purchase_price_chf integer;

UPDATE public.listings
SET purchase_price_chf = price_per_month_chf,
    price_per_month_chf = NULL
WHERE deal_type = 'direct_purchase'
  AND purchase_price_chf IS NULL
  AND price_per_month_chf IS NOT NULL;

UPDATE public.listings
SET ui_version = 'v2'
WHERE deal_type = 'direct_purchase'
  AND (ui_version IS NULL OR ui_version = 'v1');