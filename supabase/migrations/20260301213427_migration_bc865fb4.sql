CREATE TABLE IF NOT EXISTS public.listing_premium_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_checkout_session_id TEXT NOT NULL UNIQUE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  user_id UUID NULL,
  amount_chf INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CHF',
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.listing_premium_purchases ENABLE ROW LEVEL SECURITY;