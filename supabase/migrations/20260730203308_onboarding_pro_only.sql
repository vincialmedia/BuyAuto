-- Personalised onboarding (we set the garage up and upload their inventory) is
-- now a Pro-only differentiator.
--
-- In 20260730120000 it still sat in Growth as well, which left Pro separated
-- from Growth by volume and support level alone. Moving the human work to Pro
-- gives that tier a capability of its own — and keeps the promise bounded to
-- the one package whose price actually covers it.

UPDATE public.dealer_plans
SET
  onboarding_included = false,
  onboarding_vehicle_cap = NULL,
  onboarding_note = NULL
WHERE code = 'growth';

UPDATE public.dealer_plans
SET
  onboarding_included = true,
  onboarding_vehicle_cap = 150,
  onboarding_note = 'Personalisiertes Onboarding: wir richten dich ein und stellen bis zu 150 Fahrzeuge für dich ein.'
WHERE code = 'pro';
