-- Harden mark_listing_available: it restores a listing's pre-sold status, but
-- without a state guard an owner could call it directly on an unpaid draft to
-- force it to 'published', bypassing payment/moderation. Restrict it to
-- listings that are actually sold (the only legitimate use: "mark available
-- again"). Ownership check is preserved verbatim.
CREATE OR REPLACE FUNCTION public.mark_listing_available(p_listing_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_now timestamptz := now();
  v_restore public.listing_status;
  v_status public.listing_status;
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

  SELECT status INTO v_status FROM public.listings WHERE id = p_listing_id;

  -- Only a sold listing may be marked available again. This blocks using this
  -- RPC to self-publish an unpaid draft/pending listing.
  IF v_status IS DISTINCT FROM 'sold'::public.listing_status THEN
    RAISE EXCEPTION 'listing is not sold';
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
$function$;
