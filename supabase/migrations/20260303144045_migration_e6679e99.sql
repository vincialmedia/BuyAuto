CREATE FUNCTION public.ensure_dealer_premium_credits(p_dealer_id uuid, p_period_yyyymm text)
RETURNS public.dealer_premium_credits
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_owner uuid;
  v_garage_plan_code text;
  v_effective_plan_id uuid;
  v_included integer := 0;
  v_row public.dealer_premium_credits;
BEGIN
  SELECT owner_user_id, plan
  INTO v_owner, v_garage_plan_code
  FROM public.garages
  WHERE id = p_dealer_id;

  IF v_owner IS NULL OR v_owner <> auth.uid() THEN
    RAISE EXCEPTION 'not_allowed';
  END IF;

  SELECT o.plan_id
  INTO v_effective_plan_id
  FROM public.dealer_admin_overrides o
  WHERE o.dealer_id = p_dealer_id
    AND now() >= o.starts_at
    AND now() <= o.ends_at
  ORDER BY o.created_at DESC
  LIMIT 1;

  IF v_effective_plan_id IS NULL THEN
    SELECT s.plan_id
    INTO v_effective_plan_id
    FROM public.dealer_subscriptions s
    WHERE s.dealer_id = p_dealer_id
      AND s.status = 'active'
    ORDER BY s.created_at DESC
    LIMIT 1;
  END IF;

  IF v_effective_plan_id IS NULL AND v_garage_plan_code IS NOT NULL THEN
    SELECT p.id
    INTO v_effective_plan_id
    FROM public.dealer_plans p
    WHERE p.code = v_garage_plan_code
    LIMIT 1;
  END IF;

  IF v_effective_plan_id IS NOT NULL THEN
    SELECT COALESCE(p.premium_included_per_month, 0)
    INTO v_included
    FROM public.dealer_plans p
    WHERE p.id = v_effective_plan_id;
  END IF;

  INSERT INTO public.dealer_premium_credits (dealer_id, period_yyyymm, credits_included, credits_used)
  VALUES (p_dealer_id, p_period_yyyymm, v_included, 0)
  ON CONFLICT (dealer_id, period_yyyymm)
  DO UPDATE SET credits_included = EXCLUDED.credits_included,
                updated_at = now()
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$function$;