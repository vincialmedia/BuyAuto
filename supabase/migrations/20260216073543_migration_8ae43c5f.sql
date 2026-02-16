DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dealer_subscription_status') THEN
    CREATE TYPE public.dealer_subscription_status AS ENUM ('active', 'pending_change', 'canceled', 'past_due');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dealer_plan_change_status') THEN
    CREATE TYPE public.dealer_plan_change_status AS ENUM ('requested', 'approved', 'rejected', 'applied');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.dealer_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  monthly_price_chf integer NULL,
  listing_limit integer NULL,
  premium_included_per_month integer NULL,
  onboarding_included boolean NOT NULL DEFAULT false,
  onboarding_note text NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dealer_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL UNIQUE REFERENCES public.garages(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.dealer_plans(id),
  status public.dealer_subscription_status NOT NULL DEFAULT 'active',
  start_date date NOT NULL DEFAULT current_date,
  end_date date NULL,
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz NOT NULL DEFAULT (now() + interval '1 month'),
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dealer_plan_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES public.garages(id) ON DELETE CASCADE,
  from_plan_id uuid NULL REFERENCES public.dealer_plans(id),
  to_plan_id uuid NOT NULL REFERENCES public.dealer_plans(id),
  requested_at timestamptz NOT NULL DEFAULT now(),
  effective_date timestamptz NOT NULL DEFAULT now(),
  status public.dealer_plan_change_status NOT NULL DEFAULT 'requested',
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dealer_premium_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES public.garages(id) ON DELETE CASCADE,
  period_yyyymm text NOT NULL,
  credits_included integer NOT NULL DEFAULT 0,
  credits_used integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT dealer_premium_credits_dealer_period_key UNIQUE (dealer_id, period_yyyymm)
);

CREATE OR REPLACE FUNCTION public.buyauto_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_dealer_plans_updated_at') THEN
    CREATE TRIGGER trg_dealer_plans_updated_at
    BEFORE UPDATE ON public.dealer_plans
    FOR EACH ROW
    EXECUTE FUNCTION public.buyauto_set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_dealer_subscriptions_updated_at') THEN
    CREATE TRIGGER trg_dealer_subscriptions_updated_at
    BEFORE UPDATE ON public.dealer_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.buyauto_set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_dealer_plan_changes_updated_at') THEN
    CREATE TRIGGER trg_dealer_plan_changes_updated_at
    BEFORE UPDATE ON public.dealer_plan_changes
    FOR EACH ROW
    EXECUTE FUNCTION public.buyauto_set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_dealer_premium_credits_updated_at') THEN
    CREATE TRIGGER trg_dealer_premium_credits_updated_at
    BEFORE UPDATE ON public.dealer_premium_credits
    FOR EACH ROW
    EXECUTE FUNCTION public.buyauto_set_updated_at();
  END IF;
END $$;

ALTER TABLE public.dealer_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealer_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealer_plan_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealer_premium_credits ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='dealer_plans' AND policyname='public_can_read_dealer_plans') THEN
    CREATE POLICY public_can_read_dealer_plans ON public.dealer_plans
      FOR SELECT TO public
      USING (active = true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='dealer_plans' AND policyname='admins_manage_dealer_plans') THEN
    CREATE POLICY admins_manage_dealer_plans ON public.dealer_plans
      FOR ALL TO public
      USING (get_my_role() = 'admin')
      WITH CHECK (get_my_role() = 'admin');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='dealer_subscriptions' AND policyname='owners_can_read_own_subscriptions') THEN
    CREATE POLICY owners_can_read_own_subscriptions ON public.dealer_subscriptions
      FOR SELECT TO public
      USING (
        get_my_role() = 'admin'
        OR EXISTS (
          SELECT 1 FROM public.garages g
          WHERE g.id = dealer_subscriptions.dealer_id
            AND g.owner_user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='dealer_subscriptions' AND policyname='owners_can_update_own_subscriptions') THEN
    CREATE POLICY owners_can_update_own_subscriptions ON public.dealer_subscriptions
      FOR UPDATE TO public
      USING (
        get_my_role() = 'admin'
        OR EXISTS (
          SELECT 1 FROM public.garages g
          WHERE g.id = dealer_subscriptions.dealer_id
            AND g.owner_user_id = auth.uid()
        )
      )
      WITH CHECK (
        get_my_role() = 'admin'
        OR EXISTS (
          SELECT 1 FROM public.garages g
          WHERE g.id = dealer_subscriptions.dealer_id
            AND g.owner_user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='dealer_plan_changes' AND policyname='owners_can_read_own_plan_changes') THEN
    CREATE POLICY owners_can_read_own_plan_changes ON public.dealer_plan_changes
      FOR SELECT TO public
      USING (
        get_my_role() = 'admin'
        OR EXISTS (
          SELECT 1 FROM public.garages g
          WHERE g.id = dealer_plan_changes.dealer_id
            AND g.owner_user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='dealer_plan_changes' AND policyname='owners_can_insert_plan_changes') THEN
    CREATE POLICY owners_can_insert_plan_changes ON public.dealer_plan_changes
      FOR INSERT TO public
      WITH CHECK (
        get_my_role() = 'admin'
        OR EXISTS (
          SELECT 1 FROM public.garages g
          WHERE g.id = dealer_plan_changes.dealer_id
            AND g.owner_user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='dealer_plan_changes' AND policyname='admins_can_update_plan_changes') THEN
    CREATE POLICY admins_can_update_plan_changes ON public.dealer_plan_changes
      FOR UPDATE TO public
      USING (get_my_role() = 'admin')
      WITH CHECK (get_my_role() = 'admin');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='dealer_premium_credits' AND policyname='owners_can_read_own_premium_credits') THEN
    CREATE POLICY owners_can_read_own_premium_credits ON public.dealer_premium_credits
      FOR SELECT TO public
      USING (
        get_my_role() = 'admin'
        OR EXISTS (
          SELECT 1 FROM public.garages g
          WHERE g.id = dealer_premium_credits.dealer_id
            AND g.owner_user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='dealer_premium_credits' AND policyname='owners_can_update_own_premium_credits') THEN
    CREATE POLICY owners_can_update_own_premium_credits ON public.dealer_premium_credits
      FOR UPDATE TO public
      USING (
        get_my_role() = 'admin'
        OR EXISTS (
          SELECT 1 FROM public.garages g
          WHERE g.id = dealer_premium_credits.dealer_id
            AND g.owner_user_id = auth.uid()
        )
      )
      WITH CHECK (
        get_my_role() = 'admin'
        OR EXISTS (
          SELECT 1 FROM public.garages g
          WHERE g.id = dealer_premium_credits.dealer_id
            AND g.owner_user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='dealer_premium_credits' AND policyname='owners_can_insert_own_premium_credits') THEN
    CREATE POLICY owners_can_insert_own_premium_credits ON public.dealer_premium_credits
      FOR INSERT TO public
      WITH CHECK (
        get_my_role() = 'admin'
        OR EXISTS (
          SELECT 1 FROM public.garages g
          WHERE g.id = dealer_premium_credits.dealer_id
            AND g.owner_user_id = auth.uid()
        )
      );
  END IF;
END $$;

INSERT INTO public.dealer_plans (
  code, name, monthly_price_chf, listing_limit, premium_included_per_month, onboarding_included, onboarding_note, active
) VALUES
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

INSERT INTO public.dealer_subscriptions (
  dealer_id, plan_id, status, start_date, current_period_start, current_period_end
)
SELECT
  g.id,
  p.id,
  'active'::public.dealer_subscription_status,
  current_date,
  now(),
  now() + interval '1 month'
FROM public.garages g
JOIN public.dealer_plans p
  ON p.code = CASE
    WHEN lower(coalesce(g.plan, '')) IN ('starter','growth','pro','custom') THEN lower(g.plan)
    ELSE 'starter'
  END
LEFT JOIN public.dealer_subscriptions s
  ON s.dealer_id = g.id
WHERE s.id IS NULL;

UPDATE public.garages g
SET
  plan = p.code,
  listing_limit = COALESCE(p.listing_limit, g.listing_limit),
  updated_at = now()
FROM public.dealer_subscriptions s
JOIN public.dealer_plans p ON p.id = s.plan_id
WHERE s.dealer_id = g.id;

CREATE OR REPLACE FUNCTION public.ensure_dealer_premium_credits(dealer_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_period text := to_char(now(), 'YYYY-MM');
  v_plan_id uuid;
  v_included int := 0;
  v_is_owner boolean := false;
BEGIN
  v_is_owner := EXISTS (
    SELECT 1 FROM public.garages g
    WHERE g.id = dealer_id AND (g.owner_user_id = auth.uid() OR get_my_role() = 'admin')
  );

  IF NOT v_is_owner THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT s.plan_id INTO v_plan_id
  FROM public.dealer_subscriptions s
  WHERE s.dealer_id = dealer_id;

  IF v_plan_id IS NULL THEN
    RETURN;
  END IF;

  SELECT COALESCE(p.premium_included_per_month, 0) INTO v_included
  FROM public.dealer_plans p
  WHERE p.id = v_plan_id;

  INSERT INTO public.dealer_premium_credits (dealer_id, period_yyyymm, credits_included, credits_used)
  VALUES (dealer_id, v_period, v_included, 0)
  ON CONFLICT (dealer_id, period_yyyymm) DO UPDATE
  SET credits_included = EXCLUDED.credits_included,
      updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.request_dealer_plan_change(dealer_id uuid, to_plan_code text)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_to_code text := lower(trim(to_plan_code));
  v_is_owner boolean := false;
  v_current_sub public.dealer_subscriptions%ROWTYPE;
  v_from_plan_id uuid;
  v_to_plan_id uuid;
  v_change_id uuid;
  v_listing_limit int;
BEGIN
  v_is_owner := EXISTS (
    SELECT 1 FROM public.garages g
    WHERE g.id = dealer_id AND (g.owner_user_id = auth.uid() OR get_my_role() = 'admin')
  );

  IF NOT v_is_owner THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO v_current_sub
  FROM public.dealer_subscriptions s
  WHERE s.dealer_id = dealer_id;

  v_from_plan_id := v_current_sub.plan_id;

  SELECT p.id, p.listing_limit INTO v_to_plan_id, v_listing_limit
  FROM public.dealer_plans p
  WHERE p.code = v_to_code AND p.active = true;

  IF v_to_plan_id IS NULL THEN
    RAISE EXCEPTION 'Unknown plan';
  END IF;

  INSERT INTO public.dealer_plan_changes (dealer_id, from_plan_id, to_plan_id, status, requested_at, effective_date, notes)
  VALUES (dealer_id, v_from_plan_id, v_to_plan_id, 'applied'::public.dealer_plan_change_status, now(), now(), 'Applied immediately (foundation)')
  RETURNING id INTO v_change_id;

  UPDATE public.dealer_subscriptions
  SET plan_id = v_to_plan_id,
      status = 'active'::public.dealer_subscription_status,
      current_period_start = now(),
      current_period_end = now() + interval '1 month',
      cancel_at_period_end = false,
      updated_at = now()
  WHERE dealer_id = dealer_id;

  UPDATE public.garages g
  SET
    plan = v_to_code,
    listing_limit = COALESCE(v_listing_limit, g.listing_limit),
    updated_at = now()
  WHERE g.id = dealer_id;

  PERFORM public.ensure_dealer_premium_credits(dealer_id);

  RETURN jsonb_build_object(
    'ok', true,
    'change_id', v_change_id,
    'dealer_id', dealer_id,
    'to_plan_code', v_to_code
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.garage_set_listing_premium_with_credit(listing_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_listing record;
  v_dealer_id uuid;
  v_period text := to_char(now(), 'YYYY-MM');
  v_included int := 0;
  v_used int := 0;
BEGIN
  SELECT l.id, l.created_by, l.garage_id INTO v_listing
  FROM public.listings l
  WHERE l.id = listing_id;

  IF v_listing.id IS NULL THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;

  IF v_listing.created_by IS NULL OR v_listing.created_by <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  v_dealer_id := v_listing.garage_id;
  IF v_dealer_id IS NULL THEN
    RAISE EXCEPTION 'Listing is not linked to a garage';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.garages g
    WHERE g.id = v_dealer_id AND g.owner_user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  PERFORM public.ensure_dealer_premium_credits(v_dealer_id);

  SELECT credits_included, credits_used INTO v_included, v_used
  FROM public.dealer_premium_credits
  WHERE dealer_id = v_dealer_id AND period_yyyymm = v_period
  FOR UPDATE;

  IF v_used >= v_included THEN
    RAISE EXCEPTION 'No premium credits left for this month';
  END IF;

  UPDATE public.dealer_premium_credits
  SET credits_used = credits_used + 1,
      updated_at = now()
  WHERE dealer_id = v_dealer_id AND period_yyyymm = v_period;

  UPDATE public.listings
  SET
    premium = true,
    is_premium = true,
    premium_until = now() + interval '30 days',
    updated_at = now()
  WHERE id = listing_id;

  RETURN jsonb_build_object(
    'ok', true,
    'dealer_id', v_dealer_id,
    'period', v_period
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_garage_default_plan()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_plan_id uuid;
BEGIN
  SELECT id INTO v_plan_id
  FROM public.dealer_plans
  WHERE code = 'starter'
  LIMIT 1;

  IF v_plan_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.dealer_subscriptions (dealer_id, plan_id, status, start_date, current_period_start, current_period_end)
  VALUES (NEW.id, v_plan_id, 'active'::public.dealer_subscription_status, current_date, now(), now() + interval '1 month')
  ON CONFLICT (dealer_id) DO NOTHING;

  UPDATE public.garages g
  SET
    plan = 'starter',
    listing_limit = COALESCE((SELECT listing_limit FROM public.dealer_plans WHERE id = v_plan_id), g.listing_limit),
    updated_at = now()
  WHERE g.id = NEW.id;

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_garages_default_plan_after_insert') THEN
    CREATE TRIGGER trg_garages_default_plan_after_insert
    AFTER INSERT ON public.garages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_garage_default_plan();
  END IF;
END $$;