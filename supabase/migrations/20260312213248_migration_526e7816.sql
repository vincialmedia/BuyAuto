-- Create tombstones table for "reference cards" after deletion
CREATE TABLE IF NOT EXISTS public.listing_tombstones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_listing_id uuid NOT NULL,
  garage_id uuid NULL REFERENCES public.garages(id) ON DELETE SET NULL,
  seller_user_id uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  brand text NULL,
  model text NULL,
  year integer NULL,
  location text NULL,
  deal_type public.deal_type NULL,
  financing_type public.financing_type NULL,
  price_per_month_chf integer NULL,
  purchase_price_chf integer NULL,
  cover_image_url text NULL,
  sold_at timestamptz NULL,
  deleted_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS listing_tombstones_original_listing_id_key
  ON public.listing_tombstones(original_listing_id);

ALTER TABLE public.listing_tombstones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Garages can view their own tombstones" ON public.listing_tombstones;
CREATE POLICY "Garages can view their own tombstones"
  ON public.listing_tombstones
  FOR SELECT
  USING (
    (
      garage_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.garages g
        WHERE g.id = listing_tombstones.garage_id
          AND g.owner_user_id = auth.uid()
      )
    )
    OR (seller_user_id = auth.uid())
    OR (public.get_my_role() = 'admin'::text)
  );

-- RPC: mark sold (garage/private owner only)
CREATE OR REPLACE FUNCTION public.mark_listing_sold(p_listing_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.listings l
    LEFT JOIN public.garages g ON g.id = l.garage_id
    WHERE l.id = p_listing_id
      AND (
        l.created_by = auth.uid()
        OR (g.owner_user_id = auth.uid())
        OR (public.get_my_role() = 'admin'::text)
      )
  ) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  UPDATE public.listings l
  SET
    status_before_sold = COALESCE(l.status_before_sold, l.status),
    status = 'sold'::public.listing_status,
    sold_at = COALESCE(l.sold_at, v_now),
    sold_delete_at = COALESCE(l.sold_delete_at, v_now + interval '30 days'),
    updated_at = v_now
  WHERE l.id = p_listing_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_listing_sold(uuid) TO authenticated;

-- RPC: mark available again
CREATE OR REPLACE FUNCTION public.mark_listing_available(p_listing_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
  v_restore public.listing_status;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.listings l
    LEFT JOIN public.garages g ON g.id = l.garage_id
    WHERE l.id = p_listing_id
      AND (
        l.created_by = auth.uid()
        OR (g.owner_user_id = auth.uid())
        OR (public.get_my_role() = 'admin'::text)
      )
  ) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  SELECT COALESCE(status_before_sold, 'published'::public.listing_status)
  INTO v_restore
  FROM public.listings
  WHERE id = p_listing_id;

  UPDATE public.listings
  SET
    status = v_restore,
    sold_at = NULL,
    sold_delete_at = NULL,
    status_before_sold = NULL,
    updated_at = v_now
  WHERE id = p_listing_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_listing_available(uuid) TO authenticated;