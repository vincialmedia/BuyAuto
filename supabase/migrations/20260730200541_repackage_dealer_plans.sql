-- Repackage the garage (dealer) plans.
--
-- Before this migration every tier shipped every feature and the only thing
-- that changed between Starter, Growth and Pro was the listing count. That
-- gives a small garage no reason to ever move up and hands our most expensive
-- capability (the Firecrawl-backed Eintauschwert search) to the cheapest tier.
--
-- The new shape keeps the three price points (149 / 349 / 599, so the existing
-- Stripe prices stay valid) and moves the differentiation onto the things that
-- actually cost us money or that a bigger garage genuinely needs:
--
--   * listing_limit           15  /  60 /  150   (raised — capacity is cheap)
--   * premium_included        1   /   6 /   15   (super-linear ladder)
--   * valuation_limit         25  / 100 /  400   (metered, real COGS)
--   * website_tools_included  no  / yes /  yes   (inventory + calculator widget)
--   * onboarding_vehicle_cap  –   /  60 /  150   (bounded human work)
--
-- Mirrors src/lib/buyauto/garagePlans.ts — change both together.

ALTER TABLE public.dealer_plans
  ADD COLUMN IF NOT EXISTS valuation_limit_per_month integer,
  ADD COLUMN IF NOT EXISTS website_tools_included boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_vehicle_cap integer,
  ADD COLUMN IF NOT EXISTS tagline text,
  ADD COLUMN IF NOT EXISTS support_level text;

COMMENT ON COLUMN public.dealer_plans.valuation_limit_per_month IS
  'Automatic Eintauschwert searches per month. NULL = fall back to the app default.';
COMMENT ON COLUMN public.dealer_plans.website_tools_included IS
  'Inventory iFrame + Eintauschwert widget for the garage''s own website.';
COMMENT ON COLUMN public.dealer_plans.onboarding_vehicle_cap IS
  'Vehicles we upload during onboarding. NULL = onboarding not included.';

UPDATE public.dealer_plans
SET
  name = 'Starter',
  tagline = 'Für kleine Garagen mit bis zu 15 Fahrzeugen am Platz',
  monthly_price_chf = 149,
  listing_limit = 15,
  premium_included_per_month = 1,
  valuation_limit_per_month = 25,
  website_tools_included = false,
  onboarding_included = false,
  onboarding_vehicle_cap = NULL,
  onboarding_note = NULL,
  support_level = 'E-Mail-Support',
  active = true
WHERE code = 'starter';

UPDATE public.dealer_plans
SET
  name = 'Growth',
  tagline = 'Für Garagen mit laufendem Occasionsgeschäft',
  monthly_price_chf = 349,
  listing_limit = 60,
  premium_included_per_month = 6,
  valuation_limit_per_month = 100,
  website_tools_included = true,
  onboarding_included = true,
  onboarding_vehicle_cap = 60,
  onboarding_note = 'Du schickst uns dein Inventar, wir stellen bis zu 60 Fahrzeuge ein.',
  support_level = 'Priorisierter Support',
  active = true
WHERE code = 'growth';

UPDATE public.dealer_plans
SET
  name = 'Pro',
  tagline = 'Für grosse Bestände und mehrere Standorte',
  monthly_price_chf = 599,
  listing_limit = 150,
  premium_included_per_month = 15,
  valuation_limit_per_month = 400,
  website_tools_included = true,
  onboarding_included = true,
  onboarding_vehicle_cap = 150,
  onboarding_note = 'Priorisiertes Onboarding: wir stellen bis zu 150 Fahrzeuge ein.',
  support_level = 'Persönlicher Ansprechpartner',
  active = true
WHERE code = 'pro';

-- The custom tier now starts above Pro's new cap, not above 100.
UPDATE public.dealer_plans
SET
  name = '150+',
  tagline = 'Individuelles Angebot',
  onboarding_note = 'Für grosse Bestände, mehrere Standorte oder Spezialprozesse.',
  support_level = 'Persönlicher Ansprechpartner',
  website_tools_included = true
WHERE code = 'custom';
