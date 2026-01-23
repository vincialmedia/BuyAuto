BEGIN;

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS leasing_offer jsonb;

ALTER TABLE public.listings
  ALTER COLUMN deal_type SET DEFAULT 'direct_purchase'::deal_type;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'listings_leasing_offer_consistency'
  ) THEN
    ALTER TABLE public.listings
      ADD CONSTRAINT listings_leasing_offer_consistency
      CHECK (
        (
          deal_type = 'lease_takeover'::deal_type
          AND financing_type IS NULL
          AND leasing_offer IS NULL
        )
        OR
        (
          deal_type = 'direct_purchase'::deal_type
          AND (financing_type IS NULL OR financing_type = 'cash'::financing_type)
          AND leasing_offer IS NULL
        )
        OR
        (
          deal_type = 'direct_purchase'::deal_type
          AND financing_type = 'leasing'::financing_type
          AND leasing_offer IS NOT NULL
          AND COALESCE(leasing_offer->>'enabled','false') = 'true'
          AND (leasing_offer ? 'interest_rate_pct')
          AND (leasing_offer ? 'min_term_months')
          AND (leasing_offer ? 'max_term_months')
          AND (leasing_offer->>'interest_rate_pct') ~ '^[0-9]+(\.[0-9]+)?$'
          AND (leasing_offer->>'min_term_months') ~ '^[0-9]+$'
          AND (leasing_offer->>'max_term_months') ~ '^[0-9]+$'
          AND (leasing_offer->>'max_term_months')::int >= (leasing_offer->>'min_term_months')::int
          AND (
            (leasing_offer->>'no_down_payment') IS NULL
            OR (leasing_offer->>'no_down_payment') IN ('true','false')
          )
          AND (
            (leasing_offer->>'down_payment_pct') IS NULL
            OR (leasing_offer->>'down_payment_pct') ~ '^[0-9]+(\.[0-9]+)?$'
          )
          AND (
            COALESCE(leasing_offer->>'no_down_payment','false') <> 'true'
            OR COALESCE((leasing_offer->>'down_payment_pct')::numeric, 0) = 0
          )
        )
      );
  END IF;
END $$;

COMMIT;