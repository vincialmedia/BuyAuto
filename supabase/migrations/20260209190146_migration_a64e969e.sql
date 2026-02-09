ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS vin text NULL,
  ADD COLUMN IF NOT EXISTS power_hp integer NULL,
  ADD COLUMN IF NOT EXISTS drivetrain text NULL,
  ADD COLUMN IF NOT EXISTS first_registration text NULL;

CREATE INDEX IF NOT EXISTS listings_vin_idx ON public.listings (vin);

ALTER TABLE public.variants
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual';