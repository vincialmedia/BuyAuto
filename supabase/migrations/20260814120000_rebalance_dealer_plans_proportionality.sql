-- Rebalance Growth and Pro so the garage offer is proportional again.
--
-- The July repackaging (20260730200541) raised listing limits and built a
-- super-linear premium ladder (1/6/15). Measured against the market and our
-- own private side that overshot:
--
--   * Pro sold an active listing for CHF 3.99/month while a private
--     Verlängert listing costs ~CHF 16.70/month — a 4.2x discount, before
--     counting CHF 450/month of bundled premium boosts (75% of the package
--     price). Growth/Pro even undercut the budget independents (autolina
--     ~6.53, Carmarket ~5.14 per vehicle/month).
--   * 15 included boosts let a single dealer flood the premium rail that
--     private sellers pay CHF 30 per boost for.
--   * 400 valuation searches/month is unbounded Firecrawl COGS.
--
-- New shape (prices unchanged — the existing Stripe prices stay valid):
--
--   * listing_limit           15 /  40 / 100   (was 15/60/150)
--   * premium_included        1  /   3 /   6   (was 1/6/15; value 20/26/30% of price)
--   * valuation_limit         25 /  60 / 150   (was 25/100/400)
--   * onboarding_vehicle_cap  –  /   – / 100   (stays Pro-only, cap follows limit)
--
-- Starter is untouched: CHF 9.93/vehicle sits between tutti (9.56) and anibis
-- (17.25) — market-conform, and the entry tier is the wedge.
--
-- Mirrors src/lib/buyauto/garagePlans.ts — change both together. Full
-- rationale: GARAGE_PRICING_REBALANCE_AUG_2026.md. No active
-- dealer_subscriptions exist at migration time, so no grandfathering needed;
-- the Stripe webhook copies these values onto garages at their next checkout.

UPDATE public.dealer_plans
SET
  listing_limit = 40,
  premium_included_per_month = 3,
  valuation_limit_per_month = 60
WHERE code = 'growth';

UPDATE public.dealer_plans
SET
  listing_limit = 100,
  premium_included_per_month = 6,
  valuation_limit_per_month = 150,
  onboarding_vehicle_cap = 100,
  onboarding_note = 'Personalisiertes Onboarding: wir richten dich ein und stellen bis zu 100 Fahrzeuge für dich ein.'
WHERE code = 'pro';

-- The custom tier starts above Pro's new cap and now carries a visible price
-- floor — "auf Anfrage" without a number destroys the anchor.
UPDATE public.dealer_plans
SET
  name = '100+',
  tagline = 'Individuelles Angebot ab CHF 999/Monat'
WHERE code = 'custom';
