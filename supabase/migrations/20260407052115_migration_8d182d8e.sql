BEGIN;

CREATE OR REPLACE FUNCTION public.dealer_has_entitlement(p_dealer_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
  SELECT
    EXISTS (
      SELECT 1
      FROM public.dealer_admin_overrides o
      WHERE o.dealer_id = p_dealer_id
        AND now() >= o.starts_at
        AND now() <= o.ends_at
    )
    OR EXISTS (
      SELECT 1
      FROM public.dealer_subscriptions s
      WHERE s.dealer_id = p_dealer_id
        AND (
          (
            s.status = 'active'
            AND s.current_period_end > now()
            AND (s.ended_at IS NULL OR s.ended_at > now())
          )
          OR (s.grace_ends_at IS NOT NULL AND s.grace_ends_at > now())
        )
    );
$$;

CREATE OR REPLACE FUNCTION public.ensure_dealer_premium_credits(p_dealer_id uuid, p_period_yyyymm text)
RETURNS dealer_premium_credits
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'extensions', 'auth'
AS $function$
DECLARE
  v_owner uuid;
  v_garage_plan_code text;
  v_effective_plan_id uuid;
  v_included integer := 0;
  v_row public.dealer_premium_credits;
  v_has_any_subscription boolean := false;
BEGIN
  SELECT owner_user_id, plan
  INTO v_owner, v_garage_plan_code
  FROM public.garages
  WHERE id = p_dealer_id;

  IF v_owner IS NULL OR v_owner <> auth.uid() THEN
    RAISE EXCEPTION 'not_allowed';
  END IF;

  v_has_any_subscription := EXISTS (
    SELECT 1
    FROM public.dealer_subscriptions s
    WHERE s.dealer_id = p_dealer_id
  );

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
      AND (
        (
          s.status = 'active'
          AND s.current_period_end > now()
          AND (s.ended_at IS NULL OR s.ended_at > now())
        )
        OR (s.grace_ends_at IS NOT NULL AND s.grace_ends_at > now())
      )
    ORDER BY s.created_at DESC
    LIMIT 1;
  END IF;

  IF v_effective_plan_id IS NULL
     AND NOT v_has_any_subscription
     AND v_garage_plan_code IS NOT NULL
     AND v_garage_plan_code <> 'no_plan' THEN
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

CREATE OR REPLACE FUNCTION public.garage_set_listing_premium_with_credit(listing_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path TO 'pg_catalog', 'public', 'extensions', 'auth'
AS $function$
DECLARE
  v_listing record;
  v_dealer_id uuid;
  v_period text := to_char((now() at time zone 'utc'), 'YYYYMM');
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

  IF NOT public.dealer_has_entitlement(v_dealer_id) THEN
    RAISE EXCEPTION 'Garage has no active plan';
  END IF;

  PERFORM public.ensure_dealer_premium_credits(v_dealer_id, v_period);

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
$function$;

CREATE OR REPLACE FUNCTION public.publish_garage_listing(listing_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  v_listing public.listings%ROWTYPE;
  v_garage public.garages%ROWTYPE;
  v_active_published_count integer;
  v_limit integer;
  v_has_entitlement boolean;
BEGIN
  SELECT *
  INTO v_listing
  FROM public.listings
  WHERE id = listing_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;

  IF v_listing.seller_type <> 'garage' THEN
    RAISE EXCEPTION 'Listing is not a garage listing';
  END IF;

  IF v_listing.status = 'published' THEN
    RETURN to_jsonb(v_listing);
  END IF;

  IF v_listing.status NOT IN ('pending', 'draft') THEN
    RAISE EXCEPTION 'Cannot publish from status %', v_listing.status;
  END IF;

  IF v_listing.garage_id IS NULL THEN
    RAISE EXCEPTION 'Garage ID missing';
  END IF;

  SELECT *
  INTO v_garage
  FROM public.garages
  WHERE id = v_listing.garage_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Garage not found';
  END IF;

  IF role() <> 'service_role' THEN
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'Not authorized';
    END IF;

    IF get_my_role() <> 'admin' THEN
      IF v_garage.owner_user_id <> auth.uid() THEN
        RAISE EXCEPTION 'Not authorized';
      END IF;

      IF v_listing.created_by IS NOT NULL AND v_listing.created_by <> auth.uid() THEN
        RAISE EXCEPTION 'Not authorized';
      END IF;
    END IF;
  END IF;

  v_has_entitlement := public.dealer_has_entitlement(v_listing.garage_id);

  IF NOT v_has_entitlement THEN
    RAISE EXCEPTION 'Garage has no active plan';
  END IF;

  v_limit := COALESCE(v_garage.listing_limit, 0);

  SELECT count(*)
  INTO v_active_published_count
  FROM public.listings
  WHERE garage_id = v_listing.garage_id
    AND status = 'published';

  IF v_active_published_count >= v_limit THEN
    RAISE EXCEPTION 'Garage listing limit reached';
  END IF;

  UPDATE public.listings
  SET status = 'published',
      seller_type = 'garage',
      updated_at = now()
  WHERE id = listing_id
  RETURNING * INTO v_listing;

  RETURN to_jsonb(v_listing);
END;
$function$;

CREATE OR REPLACE FUNCTION public.enforce_garage_published_listing_requirements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  v_owner uuid;
  v_limit integer := 0;
  v_published_count integer := 0;
BEGIN
  IF NEW.seller_type IS DISTINCT FROM 'garage' OR NEW.status IS DISTINCT FROM 'published' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status = 'published' THEN
    RETURN NEW;
  END IF;

  IF role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF get_my_role() = 'admin' THEN
    RETURN NEW;
  END IF;

  IF NEW.garage_id IS NULL THEN
    RAISE EXCEPTION 'Garage ID missing';
  END IF;

  SELECT g.owner_user_id, COALESCE(g.listing_limit, 0)
  INTO v_owner, v_limit
  FROM public.garages g
  WHERE g.id = NEW.garage_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Garage not found';
  END IF;

  IF v_owner <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF NEW.created_by IS NOT NULL AND NEW.created_by <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF NOT public.dealer_has_entitlement(NEW.garage_id) THEN
    RAISE EXCEPTION 'Garage has no active plan';
  END IF;

  SELECT count(*)
  INTO v_published_count
  FROM public.listings l
  WHERE l.garage_id = NEW.garage_id
    AND l.status = 'published'
    AND l.id <> NEW.id;

  IF v_published_count >= v_limit THEN
    RAISE EXCEPTION 'Garage listing limit reached';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_enforce_garage_publish_requirements ON public.listings;

CREATE TRIGGER trg_enforce_garage_publish_requirements
BEFORE INSERT OR UPDATE OF status ON public.listings
FOR EACH ROW
EXECUTE FUNCTION public.enforce_garage_published_listing_requirements();

COMMIT;