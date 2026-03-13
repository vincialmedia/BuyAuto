-- BUYAUTO MESSAGING MVP (Fix B) - One batch migration
-- Safe guards: everything is IF NOT EXISTS where possible. Requires existing tables:
-- public.conversations, public.messages, public.conversation_participants, public.listings, public.profiles, public.garages

BEGIN;

-- 1) conversations: status + archive retention fields
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS archive_expires_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'conversations_status_check'
  ) THEN
    ALTER TABLE public.conversations
      ADD CONSTRAINT conversations_status_check
      CHECK (status IN ('new','active','archived','buyer_selected'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS conversations_listing_id_idx ON public.conversations(listing_id);
CREATE INDEX IF NOT EXISTS conversations_last_message_at_idx ON public.conversations(last_message_at);

-- 2) conversation_participants: unread tracking
ALTER TABLE public.conversation_participants
  ADD COLUMN IF NOT EXISTS unread_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_read_at timestamptz;

CREATE INDEX IF NOT EXISTS conversation_participants_user_id_idx ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS conversation_participants_conversation_id_idx ON public.conversation_participants(conversation_id);

-- 3) Trigger: keep conversations.last_message_at updated
CREATE OR REPLACE FUNCTION public._conversations_set_last_message_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.conversations
    SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS conversations_set_last_message_at ON public.messages;
CREATE TRIGGER conversations_set_last_message_at
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public._conversations_set_last_message_at();

-- 4) Trigger: increment unread for recipients
CREATE OR REPLACE FUNCTION public._messages_increment_unread()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.conversation_participants
    SET unread_count = unread_count + 1
  WHERE conversation_id = NEW.conversation_id
    AND user_id <> NEW.sender_user_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS messages_increment_unread ON public.messages;
CREATE TRIGGER messages_increment_unread
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public._messages_increment_unread();

-- 5) Guard trigger: prevent messages in read-only conversations
CREATE OR REPLACE FUNCTION public._messages_prevent_read_only()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_status text;
  v_listing_id uuid;
  v_listing_status text;
BEGIN
  SELECT c.status, c.listing_id
  INTO v_status, v_listing_id
  FROM public.conversations c
  WHERE c.id = NEW.conversation_id;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Conversation not found';
  END IF;

  IF v_status = 'archived' THEN
    RAISE EXCEPTION 'Conversation is archived';
  END IF;

  SELECT l.status::text
  INTO v_listing_status
  FROM public.listings l
  WHERE l.id = v_listing_id;

  -- If listing is sold, only buyer_selected conversation may receive messages
  IF v_listing_status = 'sold' AND v_status <> 'buyer_selected' THEN
    RAISE EXCEPTION 'Listing is sold';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS messages_prevent_read_only ON public.messages;
CREATE TRIGGER messages_prevent_read_only
BEFORE INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public._messages_prevent_read_only();

-- 6) RPC: mark conversation read
CREATE OR REPLACE FUNCTION public.mark_conversation_read(p_conversation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.conversation_participants
  SET unread_count = 0,
      last_read_at = now()
  WHERE conversation_id = p_conversation_id
    AND user_id = auth.uid();
END;
$$;

-- 7) RPC: unread total
CREATE OR REPLACE FUNCTION public.get_my_unread_message_count()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(SUM(cp.unread_count), 0)::int
  FROM public.conversation_participants cp
  WHERE cp.user_id = auth.uid();
$$;

-- 8) Helper: determine seller user id for a listing
-- We use:
-- - if listings.garage_id is set: garages.owner_user_id
-- - else: listings.created_by (fallback). If created_by is null, we cannot create seller participant.
CREATE OR REPLACE FUNCTION public._get_listing_seller_user_id(p_listing_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_garage_id uuid;
  v_seller_user_id uuid;
BEGIN
  SELECT l.garage_id
  INTO v_garage_id
  FROM public.listings l
  WHERE l.id = p_listing_id;

  IF v_garage_id IS NOT NULL THEN
    SELECT g.owner_user_id
    INTO v_seller_user_id
    FROM public.garages g
    WHERE g.id = v_garage_id;
  ELSE
    SELECT l.created_by
    INTO v_seller_user_id
    FROM public.listings l
    WHERE l.id = p_listing_id;
  END IF;

  RETURN v_seller_user_id;
END;
$$;

-- 9) RPC: create or get conversation for listing (no duplicates per buyer+listing)
-- Uses existing model: conversations + participants; enforces "one buyer per listing" by searching existing participant set.
CREATE OR REPLACE FUNCTION public.create_or_get_conversation_for_listing(p_listing_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_buyer_id uuid := auth.uid();
  v_conv_id uuid;
  v_listing_status text;
  v_seller_id uuid;
BEGIN
  IF v_buyer_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT l.status::text
  INTO v_listing_status
  FROM public.listings l
  WHERE l.id = p_listing_id;

  IF v_listing_status IS NULL THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;

  -- Prevent new conversations for sold listings
  IF v_listing_status = 'sold' THEN
    RETURN NULL;
  END IF;

  -- Find existing conversation for this buyer+listing
  SELECT c.id
  INTO v_conv_id
  FROM public.conversations c
  JOIN public.conversation_participants cp
    ON cp.conversation_id = c.id
   AND cp.user_id = v_buyer_id
   AND cp.role = 'buyer'
  WHERE c.listing_id = p_listing_id
  LIMIT 1;

  IF v_conv_id IS NOT NULL THEN
    RETURN v_conv_id;
  END IF;

  -- Create new conversation
  INSERT INTO public.conversations (listing_id, status, last_message_at)
  VALUES (p_listing_id, 'new', NULL)
  RETURNING id INTO v_conv_id;

  -- Add buyer participant
  INSERT INTO public.conversation_participants (conversation_id, user_id, role, unread_count)
  VALUES (v_conv_id, v_buyer_id, 'buyer', 0)
  ON CONFLICT DO NOTHING;

  -- Add seller participant
  v_seller_id := public._get_listing_seller_user_id(p_listing_id);
  IF v_seller_id IS NOT NULL THEN
    INSERT INTO public.conversation_participants (conversation_id, user_id, role, unread_count)
    VALUES (v_conv_id, v_seller_id, 'seller', 0)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN v_conv_id;
END;
$$;

-- 10) RPC: get conversation context (listing + seller/buyer + permissions + flags)
CREATE OR REPLACE FUNCTION public.get_conversation_context(p_conversation_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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

  -- Must be participant
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

  -- buyer = participant with role buyer
  SELECT cp.user_id
  INTO v_buyer_id
  FROM public.conversation_participants cp
  WHERE cp.conversation_id = p_conversation_id
    AND cp.role = 'buyer'
  LIMIT 1;

  -- seller = listing seller user id
  v_seller_id := public._get_listing_seller_user_id(v_conv.listing_id);

  -- Seller display name: garage.name if garage listing; else seller profile full_name
  IF v_listing.garage_id IS NOT NULL THEN
    SELECT g.name
    INTO v_seller_display_name
    FROM public.garages g
    WHERE g.id = v_listing.garage_id;
  ELSE
    SELECT p.full_name
    INTO v_seller_display_name
    FROM public.profiles p
    WHERE p.id = v_seller_id;
  END IF;

  -- Buyer profile context
  SELECT p.id, p.full_name, p.email
  INTO v_buyer_profile
  FROM public.profiles p
  WHERE p.id = v_buyer_id;

  -- Permissions: only seller can archive / select buyer
  v_can_archive := (v_user_id = v_seller_id);
  v_can_select_buyer := (v_user_id = v_seller_id);

  -- Read-only flags
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
$$;

-- 11) RPC: archive conversation (seller only)
CREATE OR REPLACE FUNCTION public.archive_conversation(p_conversation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_listing_id uuid;
  v_seller_id uuid;
BEGIN
  SELECT c.listing_id
  INTO v_listing_id
  FROM public.conversations c
  WHERE c.id = p_conversation_id;

  IF v_listing_id IS NULL THEN
    RAISE EXCEPTION 'Conversation not found';
  END IF;

  v_seller_id := public._get_listing_seller_user_id(v_listing_id);

  IF auth.uid() IS NULL OR auth.uid() <> v_seller_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.conversations
  SET status = 'archived',
      archived_at = now(),
      archive_expires_at = COALESCE(archive_expires_at, now() + interval '30 days')
  WHERE id = p_conversation_id;
END;
$$;

-- 12) RPC: select buyer and mark listing sold, archive other conversations
CREATE OR REPLACE FUNCTION public.select_buyer_and_mark_listing_sold(p_conversation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_listing_id uuid;
  v_seller_id uuid;
BEGIN
  SELECT c.listing_id
  INTO v_listing_id
  FROM public.conversations c
  WHERE c.id = p_conversation_id;

  IF v_listing_id IS NULL THEN
    RAISE EXCEPTION 'Conversation not found';
  END IF;

  v_seller_id := public._get_listing_seller_user_id(v_listing_id);

  IF auth.uid() IS NULL OR auth.uid() <> v_seller_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Mark selected conversation buyer_selected
  UPDATE public.conversations
  SET status = 'buyer_selected'
  WHERE id = p_conversation_id;

  -- Mark listing sold (reuses existing listing_status enum)
  UPDATE public.listings
  SET status = 'sold'
  WHERE id = v_listing_id;

  -- Archive all other conversations for this listing
  UPDATE public.conversations
  SET status = 'archived',
      archived_at = now(),
      archive_expires_at = now() + interval '30 days'
  WHERE listing_id = v_listing_id
    AND id <> p_conversation_id;
END;
$$;

COMMIT;