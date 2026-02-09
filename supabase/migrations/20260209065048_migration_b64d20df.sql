CREATE TABLE IF NOT EXISTS public.vin_cache (
  vin TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'pending',
  provider TEXT NOT NULL DEFAULT 'vincario',
  decoded_payload JSONB,
  normalized_payload JSONB,
  make_id UUID NULL REFERENCES public.makes(id),
  model_id UUID NULL REFERENCES public.models(id),
  variant_id UUID NULL REFERENCES public.variants(id),
  error_message TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vin_cache_updated_at_idx ON public.vin_cache(updated_at);

ALTER TABLE public.vin_cache ENABLE ROW LEVEL SECURITY;