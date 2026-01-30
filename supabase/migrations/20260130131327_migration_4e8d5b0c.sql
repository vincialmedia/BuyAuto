ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS ui_version text;

UPDATE public.listings
SET ui_version = 'v1'
WHERE ui_version IS NULL;

ALTER TABLE public.listings
ALTER COLUMN ui_version SET DEFAULT 'v2';