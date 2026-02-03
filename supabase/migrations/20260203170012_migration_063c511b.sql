BEGIN;

-- 1) Fix: allow cash direct purchase to carry leasing_offer when enabled=false (for lease_takeover_offer)
ALTER TABLE public.listings
  DROP CONSTRAINT IF EXISTS listings_leasing_offer_consistency;

ALTER TABLE public.listings
  ADD CONSTRAINT listings_leasing_offer_consistency
  CHECK (
    -- lease takeover: no financing_type, no leasing_offer
    (
      deal_type = 'lease_takeover'::deal_type
      AND financing_type IS NULL
      AND leasing_offer IS NULL
    )

    OR

    -- direct purchase: leasing financing requires enabled=true + basic fields
    (
      deal_type = 'direct_purchase'::deal_type
      AND financing_type = 'leasing'::financing_type
      AND leasing_offer IS NOT NULL
      AND COALESCE(leasing_offer->>'enabled', 'false') = 'true'
      AND (leasing_offer ? 'interest_rate_pct')
      AND (leasing_offer ? 'min_term_months')
      AND (leasing_offer ? 'max_term_months')
      AND ((leasing_offer->>'min_term_months') ~ '^[0-9]+$')
      AND ((leasing_offer->>'max_term_months') ~ '^[0-9]+$')
      AND ((leasing_offer->>'max_term_months')::int >= (leasing_offer->>'min_term_months')::int)
    )

    OR

    -- direct purchase: cash can have leasing_offer NULL OR leasing_offer.enabled=false (optionally with lease_takeover_offer)
    (
      deal_type = 'direct_purchase'::deal_type
      AND financing_type = 'cash'::financing_type
      AND (
        leasing_offer IS NULL
        OR (
          leasing_offer IS NOT NULL
          AND COALESCE(leasing_offer->>'enabled', 'false') = 'false'
          AND (
            (leasing_offer->'lease_takeover_offer') IS NULL
            OR (
              COALESCE(leasing_offer->'lease_takeover_offer'->>'enabled', 'false') = 'true'
              AND (leasing_offer->'lease_takeover_offer' ? 'price_per_month_chf')
              AND (leasing_offer->'lease_takeover_offer' ? 'remaining_months')
              AND (leasing_offer->'lease_takeover_offer' ? 'deposit_chf')
              AND (leasing_offer->'lease_takeover_offer' ? 'pickup_canton_code')
              AND ((leasing_offer->'lease_takeover_offer'->>'price_per_month_chf') ~ '^[0-9]+(\\.[0-9]+)?$')
              AND ((leasing_offer->'lease_takeover_offer'->>'remaining_months') ~ '^[0-9]+$')
              AND ((leasing_offer->'lease_takeover_offer'->>'deposit_chf') ~ '^[0-9]+(\\.[0-9]+)?$')
              AND ((leasing_offer->'lease_takeover_offer'->>'price_per_month_chf')::numeric > 0)
              AND ((leasing_offer->'lease_takeover_offer'->>'remaining_months')::int > 0)
              AND ((leasing_offer->'lease_takeover_offer'->>'deposit_chf')::numeric >= 0)
              AND (length(btrim(leasing_offer->'lease_takeover_offer'->>'pickup_canton_code')) > 0)
              AND (
                (leasing_offer->'lease_takeover_offer'->>'remaining_km') IS NULL
                OR (
                  (leasing_offer->'lease_takeover_offer'->>'remaining_km') ~ '^[0-9]+(\\.[0-9]+)?$'
                  AND ((leasing_offer->'lease_takeover_offer'->>'remaining_km')::numeric >= 0)
                )
              )
            )
          )
        )
      )
    )

    OR

    -- direct purchase drafts that haven't set financing yet
    (
      deal_type = 'direct_purchase'::deal_type
      AND financing_type IS NULL
      AND leasing_offer IS NULL
    )
  );

-- 2) Fix: widen residual adjustment range to match UI/service clamp (-20..+20)
ALTER TABLE public.listings
  DROP CONSTRAINT IF EXISTS listings_leasing_offer_residual_adj_pp_range;

ALTER TABLE public.listings
  ADD CONSTRAINT listings_leasing_offer_residual_adj_pp_range
  CHECK (
    leasing_offer IS NULL
    OR (leasing_offer->>'residual_pct_adjustment_pp') IS NULL
    OR (
      (leasing_offer->>'residual_pct_adjustment_pp') ~ '^-?[0-9]+([.][0-9]+)?$'
      AND (leasing_offer->>'residual_pct_adjustment_pp')::numeric >= (-20)::numeric
      AND (leasing_offer->>'residual_pct_adjustment_pp')::numeric <= (20)::numeric
    )
  );

COMMIT;