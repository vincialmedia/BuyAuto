ALTER TYPE public.listing_status ADD VALUE IF NOT EXISTS 'paused';

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS paused_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS pause_until timestamptz NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'listings_pause_fields_consistent'
  ) THEN
    ALTER TABLE public.listings
      ADD CONSTRAINT listings_pause_fields_consistent
      CHECK (
        (paused_at IS NULL AND pause_until IS NULL)
        OR
        (paused_at IS NOT NULL AND pause_until IS NOT NULL)
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'listings_pause_max_90_days'
  ) THEN
    ALTER TABLE public.listings
      ADD CONSTRAINT listings_pause_max_90_days
      CHECK (
        paused_at IS NULL
        OR pause_until IS NULL
        OR pause_until <= paused_at + interval '90 days'
      );
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.archive_listing(p_listing_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  UPDATE public.listings l
  SET status = 'archived',
      archived_at = now(),
      updated_at = now()
  WHERE l.id = p_listing_id
    AND (
      l.created_by = v_user_id
      AND (
        l.garage_id IS NULL
        OR EXISTS (
          SELECT 1 FROM public.garages g
          WHERE g.id = l.garage_id
            AND g.owner_user_id = v_user_id
        )
      )
    );

  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_allowed_or_not_found';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.pause_listing(p_listing_id uuid, p_pause_days int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_pause_days int;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  v_pause_days := COALESCE(p_pause_days, 0);
  IF v_pause_days < 1 OR v_pause_days > 90 THEN
    RAISE EXCEPTION 'invalid_pause_days';
  END IF;

  UPDATE public.listings l
  SET status = 'paused',
      paused_at = now(),
      pause_until = now() + make_interval(days => v_pause_days),
      updated_at = now()
  WHERE l.id = p_listing_id
    AND l.status = 'published'
    AND (
      l.created_by = v_user_id
      AND (
        l.garage_id IS NULL
        OR EXISTS (
          SELECT 1 FROM public.garages g
          WHERE g.id = l.garage_id
            AND g.owner_user_id = v_user_id
        )
      )
    );

  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_allowed_or_not_found_or_not_published';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.unpause_listing(p_listing_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_paused_at timestamptz;
  v_pause_until timestamptz;
  v_duration interval;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT l.paused_at, l.pause_until
  INTO v_paused_at, v_pause_until
  FROM public.listings l
  WHERE l.id = p_listing_id
    AND l.status = 'paused'
    AND (
      l.created_by = v_user_id
      AND (
        l.garage_id IS NULL
        OR EXISTS (
          SELECT 1 FROM public.garages g
          WHERE g.id = l.garage_id
            AND g.owner_user_id = v_user_id
        )
      )
    )
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_allowed_or_not_found_or_not_paused';
  END IF;

  IF v_paused_at IS NULL OR v_pause_until IS NULL THEN
    v_duration := interval '0 days';
  ELSE
    v_duration := least(now(), v_pause_until) - v_paused_at;
    IF v_duration < interval '0 days' THEN
      v_duration := interval '0 days';
    END IF;
  END IF;

  UPDATE public.listings l
  SET status = 'published',
      expires_at = CASE
        WHEN l.expires_at IS NULL THEN NULL
        ELSE l.expires_at + v_duration
      END,
      paused_at = NULL,
      pause_until = NULL,
      updated_at = now()
  WHERE l.id = p_listing_id;

END;
$$;

REVOKE ALL ON FUNCTION public.archive_listing(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.pause_listing(uuid, int) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.unpause_listing(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.archive_listing(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.pause_listing(uuid, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unpause_listing(uuid) TO authenticated;