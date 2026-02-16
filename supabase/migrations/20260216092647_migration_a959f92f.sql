DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dealer_subscription_status') THEN
    CREATE TYPE public.dealer_subscription_status AS ENUM ('active', 'pending_change', 'canceled', 'past_due');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dealer_plan_change_status') THEN
    CREATE TYPE public.dealer_plan_change_status AS ENUM ('requested', 'approved', 'rejected', 'applied');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.dealer_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  monthly_price_chf INTEGER,
  listing_limit INTEGER,
  premium_included_per_month INTEGER,
  onboarding_included BOOLEAN NOT NULL DEFAULT false,
  onboarding_note TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dealer_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES public.garages(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.dealer_plans(id),
  status public.dealer_subscription_status NOT NULL DEFAULT 'active',
  start_date DATE NOT NULL DEFAULT current_date,
  end_date DATE,
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '1 month'),
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT dealer_subscriptions_dealer_id_key UNIQUE (dealer_id)
);

CREATE TABLE IF NOT EXISTS public.dealer_plan_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES public.garages(id) ON DELETE CASCADE,
  from_plan_id UUID REFERENCES public.dealer_plans(id),
  to_plan_id UUID NOT NULL REFERENCES public.dealer_plans(id),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  effective_date TIMESTAMPTZ,
  status public.dealer_plan_change_status NOT NULL DEFAULT 'requested',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dealer_premium_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES public.garages(id) ON DELETE CASCADE,
  period_yyyymm TEXT NOT NULL,
  credits_included INTEGER NOT NULL DEFAULT 0,
  credits_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT dealer_premium_credits_dealer_period_key UNIQUE (dealer_id, period_yyyymm),
  CONSTRAINT dealer_premium_credits_credits_used_check CHECK (credits_used >= 0),
  CONSTRAINT dealer_premium_credits_credits_included_check CHECK (credits_included >= 0)
);

CREATE OR REPLACE FUNCTION public.buyauto_touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'dealer_plans_touch_updated_at') THEN
    CREATE TRIGGER dealer_plans_touch_updated_at
    BEFORE UPDATE ON public.dealer_plans
    FOR EACH ROW
    EXECUTE FUNCTION public.buyauto_touch_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'dealer_subscriptions_touch_updated_at') THEN
    CREATE TRIGGER dealer_subscriptions_touch_updated_at
    BEFORE UPDATE ON public.dealer_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.buyauto_touch_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'dealer_plan_changes_touch_updated_at') THEN
    CREATE TRIGGER dealer_plan_changes_touch_updated_at
    BEFORE UPDATE ON public.dealer_plan_changes
    FOR EACH ROW
    EXECUTE FUNCTION public.buyauto_touch_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'dealer_premium_credits_touch_updated_at') THEN
    CREATE TRIGGER dealer_premium_credits_touch_updated_at
    BEFORE UPDATE ON public.dealer_premium_credits
    FOR EACH ROW
    EXECUTE FUNCTION public.buyauto_touch_updated_at();
  END IF;
END $$;

ALTER TABLE public.dealer_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealer_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealer_plan_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealer_premium_credits ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='dealer_plans' AND policyname='Anyone can view active dealer plans') THEN
    CREATE POLICY "Anyone can view active dealer plans"
    ON public.dealer_plans
    FOR SELECT
    USING (active = true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='dealer_subscriptions' AND policyname='Garage owners can view their subscription') THEN
    CREATE POLICY "Garage owners can view their subscription"
    ON public.dealer_subscriptions
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1
        FROM public.garages g
        WHERE g.id = dealer_subscriptions.dealer_id
          AND g.owner_user_id = auth.uid()
      )
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='dealer_plan_changes' AND policyname='Garage owners can view their plan changes') THEN
    CREATE POLICY "Garage owners can view their plan changes"
    ON public.dealer_plan_changes
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1
        FROM public.garages g
        WHERE g.id = dealer_plan_changes.dealer_id
          AND g.owner_user_id = auth.uid()
      )
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='dealer_premium_credits' AND policyname='Garage owners can view their premium credits') THEN
    CREATE POLICY "Garage owners can view their premium credits"
    ON public.dealer_premium_credits
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1
        FROM public.garages g
        WHERE g.id = dealer_premium_credits.dealer_id
          AND g.owner_user_id = auth.uid()
      )
    );
  END IF;
END $$;

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

CREATE OR REPLACE FUNCTION public.sync_garage_plan_snapshot_from_subscription(p_dealer_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_code TEXT;
  v_listing_limit INTEGER;
BEGIN
  SELECT p.code, p.listing_limit
  INTO v_plan_code, v_listing_limit
  FROM public.dealer_subscriptions s
  JOIN public.dealer_plans p ON p.id = s.plan_id
  WHERE s.dealer_id = p_dealer_id;

  IF v_plan_code IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.garages
  SET
    plan = v_plan_code,
    listing_limit = COALESCE(v_listing_limit, listing_limit)
  WHERE id = p_dealer_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_dealer_subscription_exists(p_dealer_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_id UUID;
BEGIN
  SELECT id INTO v_plan_id
  FROM public.dealer_plans
  WHERE code = 'starter'
  LIMIT 1;

  IF v_plan_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.dealer_subscriptions (dealer_id, plan_id, status, current_period_start, current_period_end)
  VALUES (p_dealer_id, v_plan_id, 'active', now(), now() + interval '1 month')
  ON CONFLICT (dealer_id) DO NOTHING;

  PERFORM public.sync_garage_plan_snapshot_from_subscription(p_dealer_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_garage_created_assign_default_plan()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.ensure_dealer_subscription_exists(NEW.id);
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'garages_assign_default_dealer_plan') THEN
    CREATE TRIGGER garages_assign_default_dealer_plan
    AFTER INSERT ON public.garages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_garage_created_assign_default_plan();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.request_dealer_plan_change(dealer_id UUID, to_plan_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner UUID;
  v_to_plan_id UUID;
  v_from_plan_id UUID;
  v_change_id UUID;
BEGIN
  SELECT owner_user_id INTO v_owner
  FROM public.garages
  WHERE id = dealer_id;

  IF v_owner IS NULL OR v_owner <> auth.uid() THEN
    RAISE EXCEPTION 'not_allowed';
  END IF;

  SELECT id INTO v_to_plan_id
  FROM public.dealer_plans
  WHERE code = lower(trim(to_plan_code))
    AND active = true
  LIMIT 1;

  IF v_to_plan_id IS NULL THEN
    RAISE EXCEPTION 'plan_not_found';
  END IF;

  SELECT plan_id INTO v_from_plan_id
  FROM public.dealer_subscriptions
  WHERE dealer_id = dealer_id;

  INSERT INTO public.dealer_plan_changes (dealer_id, from_plan_id, to_plan_id, status, requested_at, effective_date)
  VALUES (dealer_id, v_from_plan_id, v_to_plan_id, 'applied', now(), now())
  RETURNING id INTO v_change_id;

  INSERT INTO public.dealer_subscriptions (dealer_id, plan_id, status, current_period_start, current_period_end, start_date)
  VALUES (dealer_id, v_to_plan_id, 'active', now(), now() + interval '1 month', current_date)
  ON CONFLICT (dealer_id) DO UPDATE SET
    plan_id = EXCLUDED.plan_id,
    status = 'active',
    current_period_start = EXCLUDED.current_period_start,
    current_period_end = EXCLUDED.current_period_end,
    updated_at = now();

  PERFORM public.sync_garage_plan_snapshot_from_subscription(dealer_id);

  RETURN jsonb_build_object('change_id', v_change_id, 'status', 'applied');
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_dealer_premium_credits(dealer_id UUID, period_yyyymm TEXT)
RETURNS public.dealer_premium_credits
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner UUID;
  v_included INTEGER;
  v_row public.dealer_premium_credits;
BEGIN
  SELECT owner_user_id INTO v_owner
  FROM public.garages
  WHERE id = dealer_id;

  IF v_owner IS NULL OR v_owner <> auth.uid() THEN
    RAISE EXCEPTION 'not_allowed';
  END IF;

  SELECT COALESCE(p.premium_included_per_month, 0)
  INTO v_included
  FROM public.dealer_subscriptions s
  JOIN public.dealer_plans p ON p.id = s.plan_id
  WHERE s.dealer_id = dealer_id;

  v_included := COALESCE(v_included, 0);

  INSERT INTO public.dealer_premium_credits (dealer_id, period_yyyymm, credits_included, credits_used)
  VALUES (dealer_id, period_yyyymm, v_included, 0)
  ON CONFLICT (dealer_id, period_yyyymm)
  DO UPDATE SET
    credits_included = EXCLUDED.credits_included,
    updated_at = now()
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.garages LOOP
    PERFORM public.ensure_dealer_subscription_exists(r.id);
  END LOOP;
END $$;