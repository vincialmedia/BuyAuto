DO $$
BEGIN
  IF to_regclass('public.dealer_plans') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.dealer_plans ENABLE ROW LEVEL SECURITY';
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'dealer_plans' AND policyname = 'Public read dealer plans'
    ) THEN
      EXECUTE 'CREATE POLICY "Public read dealer plans" ON public.dealer_plans FOR SELECT USING (true)';
    END IF;
  END IF;

  IF to_regclass('public.dealer_subscriptions') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.dealer_subscriptions ENABLE ROW LEVEL SECURITY';
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'dealer_subscriptions' AND policyname = 'Dealer can view own subscription'
    ) THEN
      EXECUTE $p$
        CREATE POLICY "Dealer can view own subscription"
        ON public.dealer_subscriptions
        FOR SELECT
        USING (
          EXISTS (
            SELECT 1
            FROM public.garages g
            WHERE g.id = dealer_subscriptions.dealer_id
              AND g.owner_user_id = auth.uid()
          )
        )
      $p$;
    END IF;
  END IF;

  IF to_regclass('public.dealer_plan_changes') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.dealer_plan_changes ENABLE ROW LEVEL SECURITY';
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'dealer_plan_changes' AND policyname = 'Dealer can view own plan changes'
    ) THEN
      EXECUTE $p$
        CREATE POLICY "Dealer can view own plan changes"
        ON public.dealer_plan_changes
        FOR SELECT
        USING (
          EXISTS (
            SELECT 1
            FROM public.garages g
            WHERE g.id = dealer_plan_changes.dealer_id
              AND g.owner_user_id = auth.uid()
          )
        )
      $p$;
    END IF;
  END IF;

  IF to_regclass('public.dealer_premium_credits') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.dealer_premium_credits ENABLE ROW LEVEL SECURITY';
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'dealer_premium_credits' AND policyname = 'Dealer can view own premium credits'
    ) THEN
      EXECUTE $p$
        CREATE POLICY "Dealer can view own premium credits"
        ON public.dealer_premium_credits
        FOR SELECT
        USING (
          EXISTS (
            SELECT 1
            FROM public.garages g
            WHERE g.id = dealer_premium_credits.dealer_id
              AND g.owner_user_id = auth.uid()
          )
        )
      $p$;
    END IF;
  END IF;
END $$;