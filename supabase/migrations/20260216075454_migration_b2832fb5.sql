-- Seed dealer_plans (idempotent)
INSERT INTO public.dealer_plans (code, name, monthly_price_chf, listing_limit, premium_included_per_month, onboarding_included, onboarding_note, active)
VALUES
  ('starter', 'Starter', 149, 15, 1, false, NULL, true),
  ('growth', 'Growth', 349, 50, 5, true, 'Du schickst uns dein Inventar, wir erledigen den Rest.', true),
  ('pro', 'Pro', 599, 100, 10, true, 'Done-for-you Onboarding (priorisiert).', true),
  ('custom', '100+', NULL, NULL, NULL, true, 'Für grosse Bestände, mehrere Standorte oder Spezialprozesse.', true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  monthly_price_chf = EXCLUDED.monthly_price_chf,
  listing_limit = EXCLUDED.listing_limit,
  premium_included_per_month = EXCLUDED.premium_included_per_month,
  onboarding_included = EXCLUDED.onboarding_included,
  onboarding_note = EXCLUDED.onboarding_note,
  active = EXCLUDED.active,
  updated_at = now();

-- Ensure every garage has a subscription (default: starter)
WITH starter AS (
  SELECT id FROM public.dealer_plans WHERE code = 'starter' LIMIT 1
)
INSERT INTO public.dealer_subscriptions (dealer_id, plan_id)
SELECT g.id, starter.id
FROM public.garages g, starter
ON CONFLICT (dealer_id) DO NOTHING;

-- Sync garages.plan and garages.listing_limit snapshot from subscriptions for backward compatibility
CREATE OR REPLACE FUNCTION public.sync_garage_plan_snapshot_from_subscription(p_dealer_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
  v_limit integer;
BEGIN
  SELECT dp.code, dp.listing_limit
    INTO v_code, v_limit
  FROM public.dealer_subscriptions ds
  JOIN public.dealer_plans dp ON dp.id = ds.plan_id
  WHERE ds.dealer_id = p_dealer_id
  LIMIT 1;

  IF v_code IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.garages
    SET plan = v_code,
        listing_limit = COALESCE(v_limit, listing_limit),
        updated_at = now()
  WHERE id = p_dealer_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.tg_sync_garage_plan_snapshot_from_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.sync_garage_plan_snapshot_from_subscription(NEW.dealer_id);
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'dealer_subscriptions_sync_garage_snapshot'
  ) THEN
    CREATE TRIGGER dealer_subscriptions_sync_garage_snapshot
    AFTER INSERT OR UPDATE OF plan_id ON public.dealer_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.tg_sync_garage_plan_snapshot_from_subscription();
  END IF;
END $$;

-- Backfill snapshot once
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT dealer_id FROM public.dealer_subscriptions LOOP
    PERFORM public.sync_garage_plan_snapshot_from_subscription(r.dealer_id);
  END LOOP;
END $$;