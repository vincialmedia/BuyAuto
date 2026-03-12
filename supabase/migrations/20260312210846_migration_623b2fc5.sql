ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS sold_at timestamp with time zone NULL,
  ADD COLUMN IF NOT EXISTS sold_delete_at timestamp with time zone NULL,
  ADD COLUMN IF NOT EXISTS status_before_sold listing_status NULL;

CREATE TABLE IF NOT EXISTS public.listing_media_backups (
  listing_id uuid PRIMARY KEY REFERENCES public.listings(id) ON DELETE CASCADE,
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  cover_image_url text NULL,
  cover_image_index integer NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.listing_media_backups ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'listing_media_backups' AND policyname = 'garage_owner_select_backup'
  ) THEN
    CREATE POLICY garage_owner_select_backup ON public.listing_media_backups
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM public.listings l
          JOIN public.garages g ON g.id = l.garage_id
          WHERE l.id = listing_media_backups.listing_id
            AND g.owner_user_id = auth.uid()
        )
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'listing_media_backups' AND policyname = 'garage_owner_insert_backup'
  ) THEN
    CREATE POLICY garage_owner_insert_backup ON public.listing_media_backups
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.listings l
          JOIN public.garages g ON g.id = l.garage_id
          WHERE l.id = listing_media_backups.listing_id
            AND g.owner_user_id = auth.uid()
        )
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'listing_media_backups' AND policyname = 'garage_owner_delete_backup'
  ) THEN
    CREATE POLICY garage_owner_delete_backup ON public.listing_media_backups
      FOR DELETE
      USING (
        EXISTS (
          SELECT 1
          FROM public.listings l
          JOIN public.garages g ON g.id = l.garage_id
          WHERE l.id = listing_media_backups.listing_id
            AND g.owner_user_id = auth.uid()
        )
      );
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.get_listing_cover_image(p_images jsonb, p_cover_index integer, p_cover_url text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_cover text;
BEGIN
  IF p_cover_url IS NOT NULL AND length(trim(p_cover_url)) > 0 THEN
    RETURN p_cover_url;
  END IF;

  IF p_images IS NULL OR jsonb_typeof(p_images) <> 'array' THEN
    RETURN NULL;
  END IF;

  IF p_cover_index IS NULL OR p_cover_index < 0 THEN
    p_cover_index := 0;
  END IF;

  v_cover := p_images ->> p_cover_index;
  IF v_cover IS NULL OR length(trim(v_cover)) = 0 THEN
    v_cover := p_images ->> 0;
  END IF;

  IF v_cover IS NULL OR length(trim(v_cover)) = 0 THEN
    RETURN NULL;
  END IF;

  RETURN v_cover;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_listing_sold(p_listing_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_uid uuid;
  v_listing record;
  v_cover text;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT *
  INTO v_listing
  FROM public.listings
  WHERE id = p_listing_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'listing_not_found';
  END IF;

  IF v_listing.created_by IS DISTINCT FROM v_uid THEN
    RAISE EXCEPTION 'not_allowed';
  END IF;

  v_cover := public.get_listing_cover_image(v_listing.images, v_listing.cover_image_index, v_listing.cover_image_url);

  INSERT INTO public.listing_media_backups(listing_id, images, cover_image_url, cover_image_index)
  VALUES (v_listing.id, COALESCE(v_listing.images, '[]'::jsonb), v_listing.cover_image_url, v_listing.cover_image_index)
  ON CONFLICT (listing_id) DO NOTHING;

  UPDATE public.listings
  SET
    status_before_sold = v_listing.status,
    status = 'sold',
    sold_at = now(),
    sold_delete_at = now() + interval '30 days',
    images = CASE
      WHEN v_cover IS NULL THEN '[]'::jsonb
      ELSE jsonb_build_array(v_cover)
    END,
    cover_image_url = v_cover,
    cover_image_index = 0,
    updated_at = now()
  WHERE id = v_listing.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_listing_available(p_listing_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_uid uuid;
  v_listing record;
  v_backup record;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT *
  INTO v_listing
  FROM public.listings
  WHERE id = p_listing_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'listing_not_found';
  END IF;

  IF v_listing.created_by IS DISTINCT FROM v_uid THEN
    RAISE EXCEPTION 'not_allowed';
  END IF;

  IF v_listing.status IS DISTINCT FROM 'sold'::listing_status THEN
    RAISE EXCEPTION 'not_sold';
  END IF;

  IF v_listing.sold_delete_at IS NULL OR v_listing.sold_delete_at <= now() THEN
    RAISE EXCEPTION 'sold_window_expired';
  END IF;

  SELECT *
  INTO v_backup
  FROM public.listing_media_backups
  WHERE listing_id = p_listing_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'backup_not_found';
  END IF;

  UPDATE public.listings
  SET
    status = COALESCE(v_listing.status_before_sold, 'published'::listing_status),
    status_before_sold = NULL,
    sold_at = NULL,
    sold_delete_at = NULL,
    images = v_backup.images,
    cover_image_url = v_backup.cover_image_url,
    cover_image_index = COALESCE(v_backup.cover_image_index, 0),
    updated_at = now()
  WHERE id = p_listing_id;

  DELETE FROM public.listing_media_backups WHERE listing_id = p_listing_id;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_listing_sold(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_listing_available(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_listing_sold(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_listing_available(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.get_listing_cover_image(jsonb, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_listing_cover_image(jsonb, integer, text) TO authenticated;