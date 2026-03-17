-- Recreate get_my_message_threads(integer) using correct garages column `garage_name`
-- (email never returned)
DROP FUNCTION IF EXISTS public.get_my_message_threads(integer);

CREATE FUNCTION public.get_my_message_threads(p_limit integer DEFAULT 25)
RETURNS TABLE (
  conversation_id uuid,
  listing_id uuid,
  counterparty_display_name text,
  seller_display_name text,
  listing_make_model text,
  listing_cover_image_url text,
  listing_status listing_status,
  conversation_status text,
  last_message_at timestamptz,
  last_message_body text,
  unread_count integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH my_participation AS (
    SELECT
      cp.conversation_id,
      cp.user_id,
      cp.role,
      cp.unread_count
    FROM public.conversation_participants cp
    WHERE cp.user_id = auth.uid()
  ),
  other_participant AS (
    SELECT
      cp.conversation_id,
      cp.user_id,
      cp.role
    FROM public.conversation_participants cp
    WHERE cp.user_id <> auth.uid()
  ),
  listing_core AS (
    SELECT
      c.id AS conversation_id,
      c.status AS conversation_status,
      c.last_message_at,
      l.id AS listing_id,
      l.make_model AS listing_make_model,
      l.cover_image_url AS listing_cover_image_url,
      l.status AS listing_status,
      l.garage_id,
      l.user_id AS seller_user_id
    FROM public.conversations c
    JOIN public.listings l ON l.id = c.listing_id
  ),
  last_message AS (
    SELECT DISTINCT ON (m.conversation_id)
      m.conversation_id,
      m.body AS last_message_body
    FROM public.messages m
    ORDER BY m.conversation_id, m.created_at DESC
  ),
  seller_name AS (
    SELECT
      lc.conversation_id,
      COALESCE(g.garage_name, sp.full_name, '—') AS seller_display_name
    FROM listing_core lc
    LEFT JOIN public.garages g ON g.id = lc.garage_id
    LEFT JOIN public.profiles sp ON sp.id = lc.seller_user_id
  ),
  buyer_name AS (
    SELECT
      op.conversation_id,
      COALESCE(bp.full_name, '—') AS buyer_display_name
    FROM other_participant op
    LEFT JOIN public.profiles bp ON bp.id = op.user_id
    WHERE op.role = 'buyer'
  ),
  counterparty AS (
    SELECT
      mp.conversation_id,
      CASE
        WHEN mp.role = 'buyer' THEN sn.seller_display_name
        ELSE COALESCE(bn.buyer_display_name, sn.seller_display_name, '—')
      END AS counterparty_display_name,
      sn.seller_display_name
    FROM my_participation mp
    LEFT JOIN seller_name sn ON sn.conversation_id = mp.conversation_id
    LEFT JOIN buyer_name bn ON bn.conversation_id = mp.conversation_id
  )
  SELECT
    lc.conversation_id,
    lc.listing_id,
    c.counterparty_display_name,
    c.seller_display_name,
    lc.listing_make_model,
    lc.listing_cover_image_url,
    lc.listing_status,
    lc.conversation_status,
    lc.last_message_at,
    lm.last_message_body,
    mp.unread_count
  FROM my_participation mp
  JOIN listing_core lc ON lc.conversation_id = mp.conversation_id
  LEFT JOIN counterparty c ON c.conversation_id = mp.conversation_id
  LEFT JOIN last_message lm ON lm.conversation_id = mp.conversation_id
  ORDER BY lc.last_message_at DESC NULLS LAST
  LIMIT GREATEST(COALESCE(p_limit, 25), 1);
$$;

REVOKE ALL ON FUNCTION public.get_my_message_threads(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_message_threads(integer) TO authenticated;