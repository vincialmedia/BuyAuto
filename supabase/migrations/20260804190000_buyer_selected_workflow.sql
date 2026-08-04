-- Buyer-selection workflow: notify the chosen buyer, and for a
-- Leasingübernahme walk both parties through the bank's takeover process.
--
-- 1. messages.sender_user_id becomes nullable: a NULL sender is a system
--    message (rendered as a neutral "BuyAuto" notice in both chat UIs).
--    The existing message triggers already handle NULL senders safely:
--    handle_new_message_email returns early for them, and
--    handle_new_message_unread's `user_id <> NEW.sender_user_id` matches no
--    rows — the RPC below bumps unread_count for both participants itself.
--    RLS is unaffected: the INSERT policy still requires
--    sender_user_id = auth.uid() for client writes; system messages are only
--    written by SECURITY DEFINER functions.
--
-- 2. select_buyer_and_mark_listing_sold now
--    - carries the same status guard and sold-lifecycle stamping as
--      mark_listing_sold (status_before_sold / sold_at / sold_delete_at —
--      previously this path only flipped status, so the 30-day sold cleanup
--      and "Reaktivieren" restore state never applied to chat-selected sales),
--    - posts the Leasingübernahme checklist into the winning chat as a
--      system message when the listing is a lease takeover,
--    - calls the buyer-selected-notification edge function, which emails the
--      buyer ("Sie wurden als Käufer ausgewählt") and, for lease takeovers,
--      both parties with their next steps. Notification failures never roll
--      back the sale.
--
-- 3. get_listing_conversations_for_seller powers the buyer chooser shown
--    when a seller marks a listing as sold from the listing overview (they
--    pick the buyer from the chats on that listing).

BEGIN;

ALTER TABLE public.messages ALTER COLUMN sender_user_id DROP NOT NULL;

COMMENT ON COLUMN public.messages.sender_user_id IS
  'NULL for automatic system messages (e.g. the Leasingübernahme checklist posted on buyer selection).';

CREATE OR REPLACE FUNCTION public.select_buyer_and_mark_listing_sold(p_conversation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'extensions', 'auth'
AS $function$
DECLARE
  v_now timestamptz := now();
  v_listing_id uuid;
  v_seller_id uuid;
  v_listing public.listings%ROWTYPE;
  v_system_message text;
  fn_url text;
  svc_key text;
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

  SELECT * INTO v_listing
  FROM public.listings
  WHERE id = v_listing_id
  FOR UPDATE;

  -- Same rule as mark_listing_sold: only a listing buyers could actually
  -- reach can have been sold. Blocks laundering declined/archived/draft
  -- listings into the sold lifecycle via the conversation path.
  IF v_listing.status IS NULL OR v_listing.status NOT IN (
    'published'::public.listing_status,
    'active'::public.listing_status,
    'paused'::public.listing_status
  ) THEN
    RAISE EXCEPTION 'listing_not_sellable';
  END IF;

  -- The winning chat stays open for buyer + seller.
  UPDATE public.conversations
  SET status = 'buyer_selected'
  WHERE id = p_conversation_id;

  -- Full sold stamping, identical to mark_listing_sold.
  UPDATE public.listings l
  SET
    status_before_sold = COALESCE(l.status_before_sold, l.status),
    status = 'sold'::public.listing_status,
    sold_at = COALESCE(l.sold_at, v_now),
    sold_delete_at = COALESCE(l.sold_delete_at, v_now + interval '30 days'),
    updated_at = v_now
  WHERE l.id = v_listing_id;

  -- Every other conversation on this listing becomes read-only.
  UPDATE public.conversations
  SET status = 'archived',
      archived_at = v_now,
      archive_expires_at = now() + interval '30 days'
  WHERE listing_id = v_listing_id
    AND id <> p_conversation_id;

  -- Leasingübernahme: post the next-steps checklist into the chat so both
  -- parties see the same instructions. Runs after the conversation is
  -- buyer_selected, so the sold-listing write guard lets it through.
  IF v_listing.deal_type::text = 'lease_takeover' THEN
    v_system_message :=
      'Der Verkäufer hat einen Käufer für dieses Fahrzeug ausgewählt – das Inserat ist als verkauft markiert. Dieser Chat bleibt für euch beide offen.' || E'\n\n' ||
      'So geht es mit der Leasingübernahme weiter:' || E'\n\n' ||
      'FÜR DEN VERKÄUFER (bisheriger Leasingnehmer)' || E'\n' ||
      '1. Kontaktiere deine Leasingbank und melde die gewünschte Vertragsübernahme. Frage nach dem Übernahmeformular („Antrag auf Vertragsübernahme“).' || E'\n' ||
      '2. Fülle das Formular aus, unterschreibe es und lege eine Kopie deiner ID bei.' || E'\n' ||
      '3. Stelle sicher, dass alle Leasingraten bezahlt sind. Viele Banken (z. B. BANK-now oder Cembra) verlangen zudem mind. 12 Monate Restlaufzeit.' || E'\n' ||
      '4. Kläre die Übernahmegebühr der Bank (je nach Anbieter ca. CHF 100–600) und wer sie übernimmt.' || E'\n' ||
      '5. Übergib das Fahrzeug erst, wenn die Bank die Übernahme schriftlich genehmigt hat – bis dahin haftest du weiter.' || E'\n\n' ||
      'FÜR DEN KÄUFER (neuer Leasingnehmer)' || E'\n' ||
      '1. Fülle deinen Teil des Übernahmeformulars aus und unterschreibe die Einwilligung zur Bonitätsprüfung – die Bank prüft dich wie einen Neukunden.' || E'\n' ||
      '2. Reiche die verlangten Unterlagen ein: Kopie von ID/Pass bzw. Ausländerausweis (B/C), die letzten 3 Lohnabrechnungen, je nach Bank auch einen Betreibungsauszug.' || E'\n' ||
      '3. Schliesse eine Vollkaskoversicherung ab – sie ist während der ganzen Leasingdauer obligatorisch.' || E'\n' ||
      '4. Unterschreibe nach der Genehmigung den übernommenen Leasingvertrag.' || E'\n\n' ||
      'GEMEINSAM' || E'\n' ||
      '• Macht eine gemeinsame Fahrzeugbesichtigung und haltet den Zustand schriftlich fest – Vorschäden gehen auf den Käufer über.' || E'\n' ||
      '• Die Umschreibung beim Strassenverkehrsamt veranlasst in der Regel die Leasingbank.' || E'\n\n' ||
      'Hinweis: Ablauf und Gebühren unterscheiden sich je nach Leasingbank (z. B. Cembra Money Bank, BANK-now, MultiLease, AMAG Leasing). Massgebend sind immer die Angaben eurer Leasingbank.';

    INSERT INTO public.messages (conversation_id, sender_user_id, body)
    VALUES (p_conversation_id, NULL, v_system_message);

    -- NULL-sender inserts don't bump unread (the trigger compares against
    -- the sender), so mark the checklist unread for both participants.
    UPDATE public.conversation_participants
    SET unread_count = unread_count + 1
    WHERE conversation_id = p_conversation_id;
  END IF;

  -- Buyer/seller emails; a notification failure must never abort the sale.
  BEGIN
    svc_key := public.get_service_role_key();

    IF svc_key IS NULL OR length(svc_key) = 0 THEN
      RAISE WARNING 'select_buyer_and_mark_listing_sold: missing service role key';
    ELSE
      fn_url := rtrim(trim(public.supabase_url()), '/') || '/functions/v1/buyer-selected-notification';

      PERFORM net.http_post(
        url := fn_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || svc_key
        ),
        body := jsonb_build_object('conversation_id', p_conversation_id),
        timeout_milliseconds := 15000
      );
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'select_buyer_and_mark_listing_sold notification failed for %: %', p_conversation_id, sqlerrm;
  END;
END;
$function$;

-- Buyer chooser for "Als verkauft markieren" on the listing overview: all
-- chats on one of the caller's listings, newest first. Only the listing's
-- seller gets rows back.
CREATE OR REPLACE FUNCTION public.get_listing_conversations_for_seller(p_listing_id uuid)
RETURNS TABLE(
  conversation_id uuid,
  buyer_display_name text,
  conversation_status text,
  last_message_at timestamptz,
  last_message_body text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    c.id AS conversation_id,
    COALESCE(NULLIF(BTRIM(p.full_name), ''), 'Interessent') AS buyer_display_name,
    c.status AS conversation_status,
    c.last_message_at,
    (
      SELECT m.body
      FROM public.messages m
      WHERE m.conversation_id = c.id
      ORDER BY m.created_at DESC
      LIMIT 1
    ) AS last_message_body
  FROM public.conversations c
  JOIN public.conversation_participants cp
    ON cp.conversation_id = c.id
   AND cp.role = 'buyer'
  LEFT JOIN public.profiles p ON p.id = cp.user_id
  WHERE c.listing_id = p_listing_id
    AND auth.uid() IS NOT NULL
    AND auth.uid() = public._get_listing_seller_user_id(p_listing_id)
  ORDER BY c.last_message_at DESC NULLS LAST;
$function$;

REVOKE ALL ON FUNCTION public.get_listing_conversations_for_seller(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_listing_conversations_for_seller(uuid) TO authenticated;

COMMIT;
