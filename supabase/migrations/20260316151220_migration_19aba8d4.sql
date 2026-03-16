-- 1) Fix seller resolution: for private listings, fall back to user_id if created_by is NULL
CREATE OR REPLACE FUNCTION public._get_listing_seller_user_id(p_listing_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_garage_id uuid;
  v_created_by uuid;
  v_user_id uuid;
  v_seller_user_id uuid;
BEGIN
  SELECT l.garage_id, l.created_by, l.user_id
    INTO v_garage_id, v_created_by, v_user_id
  FROM public.listings l
  WHERE l.id = p_listing_id;

  IF v_garage_id IS NOT NULL THEN
    SELECT g.owner_user_id
      INTO v_seller_user_id
    FROM public.garages g
    WHERE g.id = v_garage_id;
  ELSE
    v_seller_user_id := COALESCE(v_created_by, v_user_id);
  END IF;

  RETURN v_seller_user_id;
END;
$function$;

-- 2) Add advisory lock + ensure seller participant exists even when returning an existing conversation
CREATE OR REPLACE FUNCTION public.create_or_get_conversation_for_listing(p_listing_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_buyer_id uuid := auth.uid();
  v_conv_id uuid;
  v_listing_status text;
  v_seller_id uuid;
BEGIN
  IF v_buyer_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(p_listing_id::text)::bigint, hashtext(v_buyer_id::text)::bigint);

  SELECT l.status::text
    INTO v_listing_status
  FROM public.listings l
  WHERE l.id = p_listing_id;

  IF v_listing_status IS NULL THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;

  IF v_listing_status = 'sold' THEN
    RETURN NULL;
  END IF;

  SELECT c.id
    INTO v_conv_id
  FROM public.conversations c
  JOIN public.conversation_participants cp
    ON cp.conversation_id = c.id
   AND cp.user_id = v_buyer_id
   AND cp.role = 'buyer'
  WHERE c.listing_id = p_listing_id
  LIMIT 1;

  v_seller_id := public._get_listing_seller_user_id(p_listing_id);

  IF v_conv_id IS NOT NULL THEN
    IF v_seller_id IS NOT NULL AND v_seller_id <> v_buyer_id THEN
      INSERT INTO public.conversation_participants (conversation_id, user_id, role, unread_count)
      VALUES (v_conv_id, v_seller_id, 'seller', 0)
      ON CONFLICT DO NOTHING;
    END IF;

    RETURN v_conv_id;
  END IF;

  INSERT INTO public.conversations (listing_id, status, last_message_at)
  VALUES (p_listing_id, 'new', NULL)
  RETURNING id INTO v_conv_id;

  INSERT INTO public.conversation_participants (conversation_id, user_id, role, unread_count)
  VALUES (v_conv_id, v_buyer_id, 'buyer', 0)
  ON CONFLICT DO NOTHING;

  IF v_seller_id IS NOT NULL AND v_seller_id <> v_buyer_id THEN
    INSERT INTO public.conversation_participants (conversation_id, user_id, role, unread_count)
    VALUES (v_conv_id, v_seller_id, 'seller', 0)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN v_conv_id;
END;
$function$;

-- 3) Fix garage display name column in get_conversation_context (garages.garage_name, not garages.name)
CREATE OR REPLACE FUNCTION public.get_conversation_context(p_conversation_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_conv record;
  v_listing record;
  v_buyer_id uuid;
  v_seller_id uuid;
  v_buyer_profile record;
  v_seller_display_name text;
  v_can_archive boolean := false;
  v_can_select_buyer boolean := false;
  v_read_only boolean := false;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT c.*
    INTO v_conv
  FROM public.conversations c
  WHERE c.id = p_conversation_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = p_conversation_id
      AND cp.user_id = v_user_id
  ) THEN
    RETURN NULL;
  END IF;

  SELECT l.id, l.brand, l.model, l.make_model, l.year, l.price_per_month_chf, l.purchase_price_chf,
         l.mileage_km, l.cover_image_url, l.status::text AS status, l.garage_id
    INTO v_listing
  FROM public.listings l
  WHERE l.id = v_conv.listing_id;

  SELECT cp.user_id
    INTO v_buyer_id
  FROM public.conversation_participants cp
  WHERE cp.conversation_id = p_conversation_id
    AND cp.role = 'buyer'
  LIMIT 1;

  v_seller_id := public._get_listing_seller_user_id(v_conv.listing_id);

  IF v_listing.garage_id IS NOT NULL THEN
    SELECT g.garage_name
      INTO v_seller_display_name
    FROM public.garages g
    WHERE g.id = v_listing.garage_id;
  ELSE
    SELECT p.full_name
      INTO v_seller_display_name
    FROM public.profiles p
    WHERE p.id = v_seller_id;
  END IF;

  SELECT p.id, p.full_name, p.email
    INTO v_buyer_profile
  FROM public.profiles p
  WHERE p.id = v_buyer_id;

  v_can_archive := (v_user_id = v_seller_id);
  v_can_select_buyer := (v_user_id = v_seller_id);

  v_read_only := (v_conv.status = 'archived')
    OR (v_listing.status = 'sold' AND v_conv.status <> 'buyer_selected');

  RETURN jsonb_build_object(
    'title', COALESCE(v_seller_display_name, '—') || ' - ' || COALESCE(v_listing.make_model, 'Fahrzeug'),
    'conversation', jsonb_build_object(
      'id', v_conv.id,
      'status', v_conv.status,
      'last_message_at', v_conv.last_message_at,
      'archived_at', v_conv.archived_at,
      'archive_expires_at', v_conv.archive_expires_at,
      'my_unread_count', COALESCE((SELECT cp.unread_count FROM public.conversation_participants cp WHERE cp.conversation_id = p_conversation_id AND cp.user_id = v_user_id LIMIT 1), 0)
    ),
    'listing', jsonb_build_object(
      'id', v_listing.id,
      'brand', v_listing.brand,
      'model', v_listing.model,
      'make_model', v_listing.make_model,
      'year', v_listing.year,
      'price_per_month_chf', v_listing.price_per_month_chf,
      'purchase_price_chf', v_listing.purchase_price_chf,
      'mileage_km', v_listing.mileage_km,
      'cover_image_url', v_listing.cover_image_url,
      'status', v_listing.status,
      'garage_id', v_listing.garage_id
    ),
    'buyer', jsonb_build_object(
      'id', v_buyer_profile.id,
      'full_name', v_buyer_profile.full_name,
      'email', v_buyer_profile.email
    ),
    'seller', jsonb_build_object(
      'display_name', v_seller_display_name
    ),
    'permissions', jsonb_build_object(
      'can_select_buyer', v_can_select_buyer,
      'can_archive', v_can_archive
    ),
    'flags', jsonb_build_object(
      'read_only', v_read_only
    )
  );
END;
$function$;

-- 4) Backfill missing seller participants for existing conversations
WITH convs_missing_seller AS (
  SELECT
    c.id AS conversation_id,
    c.listing_id,
    public._get_listing_seller_user_id(c.listing_id) AS seller_user_id,
    (SELECT cp.user_id
     FROM public.conversation_participants cp
     WHERE cp.conversation_id = c.id AND cp.role = 'buyer'
     LIMIT 1) AS buyer_user_id
  FROM public.conversations c
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = c.id
      AND cp.role = 'seller'
  )
)
INSERT INTO public.conversation_participants (conversation_id, user_id, role, unread_count, last_read_at)
SELECT
  m.conversation_id,
  m.seller_user_id,
  'seller',
  COALESCE((
    SELECT count(*)::int
    FROM public.messages msg
    WHERE msg.conversation_id = m.conversation_id
      AND msg.sender_user_id <> m.seller_user_id
  ), 0),
  NULL
FROM convs_missing_seller m
WHERE m.seller_user_id IS NOT NULL
  AND (m.buyer_user_id IS NULL OR m.seller_user_id <> m.buyer_user_id)
ON CONFLICT DO NOTHING;

-- 5) Ensure conversations.last_message_at is consistent with messages
WITH latest AS (
  SELECT conversation_id, max(created_at) AS max_created_at
  FROM public.messages
  GROUP BY conversation_id
)
UPDATE public.conversations c
SET last_message_at = l.max_created_at
FROM latest l
WHERE c.id = l.conversation_id
  AND (c.last_message_at IS NULL OR c.last_message_at < l.max_created_at);

-- 6) Add/ensure trigger to update last_message_at + unread_count on new messages (only if none exists)
CREATE OR REPLACE FUNCTION public.on_message_insert_update_conversation_and_unread()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at,
      status = CASE WHEN status = 'new' THEN 'active' ELSE status END
  WHERE id = NEW.conversation_id;

  UPDATE public.conversation_participants
  SET unread_count = unread_count + 1
  WHERE conversation_id = NEW.conversation_id
    AND user_id <> NEW.sender_user_id;

  UPDATE public.conversation_participants
  SET unread_count = 0,
      last_read_at = NEW.created_at
  WHERE conversation_id = NEW.conversation_id
    AND user_id = NEW.sender_user_id;

  RETURN NEW;
END;
$function$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'messages'
      AND t.tgname = 'messages_after_insert_unread'
      AND NOT t.tgisinternal
  ) THEN
    EXECUTE 'CREATE TRIGGER messages_after_insert_unread
             AFTER INSERT ON public.messages
             FOR EACH ROW
             EXECUTE FUNCTION public.on_message_insert_update_conversation_and_unread()';
  END IF;
END $$;