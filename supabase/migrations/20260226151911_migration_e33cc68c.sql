ALTER TABLE public.dealer_plans
ADD COLUMN IF NOT EXISTS stripe_price_id text;

ALTER TABLE public.dealer_subscriptions
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
ADD COLUMN IF NOT EXISTS cancel_at timestamptz,
ADD COLUMN IF NOT EXISTS canceled_at timestamptz,
ADD COLUMN IF NOT EXISTS ended_at timestamptz,
ADD COLUMN IF NOT EXISTS grace_ends_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS dealer_subscriptions_stripe_subscription_id_key
ON public.dealer_subscriptions (stripe_subscription_id);

CREATE TABLE IF NOT EXISTS public.dealer_admin_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES public.garages(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.dealer_plans(id) ON DELETE RESTRICT,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  notes text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dealer_admin_overrides ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='dealer_admin_overrides' AND policyname='Admins can manage dealer overrides'
  ) THEN
    CREATE POLICY "Admins can manage dealer overrides"
    ON public.dealer_admin_overrides
    FOR ALL
    USING (public.get_my_role() = 'admin')
    WITH CHECK (public.get_my_role() = 'admin');
  END IF;
END$$;