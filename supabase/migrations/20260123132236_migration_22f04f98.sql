ALTER TABLE public.listings
ADD CONSTRAINT listings_leasing_offer_residual_adj_pp_range
CHECK (
  leasing_offer IS NULL
  OR (leasing_offer ->> 'residual_pct_adjustment_pp') IS NULL
  OR (
    (leasing_offer ->> 'residual_pct_adjustment_pp') ~ '^-?[0-9]+([.][0-9]+)?$'
    AND ((leasing_offer ->> 'residual_pct_adjustment_pp')::numeric >= -10)
    AND ((leasing_offer ->> 'residual_pct_adjustment_pp')::numeric <= 10)
  )
);