-- Content fix in the Leasingübernahme chat checklist: the leasing bank does
-- NOT arrange the re-registration at the Strassenverkehrsamt — it only
-- releases ("Freigabe") the car for transfer. Once the Freigabe is there,
-- buyer or seller go to the Strassenverkehrsamt themselves and have the
-- Fahrzeugausweis transferred. The wrong bullet is replaced with an
-- easy-to-read "❗ WICHTIG" callout; the notification emails carry the same
-- correction (buyer-selected-notification edge function).
--
-- select_buyer_and_mark_listing_sold restated in full (CREATE OR REPLACE
-- swaps the whole body); only the GEMEINSAM section of the message changed
-- vs. 20260805100000_leasing_checklist_covers_hybrid_takeover.sql.

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
  v_is_lease_takeover boolean;
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
  -- reach can have been sold.
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

  -- A takeover is on the table for pure lease-takeover listings AND for
  -- "Direktkauf + Leasingübernahme" hybrids.
  v_is_lease_takeover := v_listing.deal_type::text = 'lease_takeover'
    OR COALESCE(v_listing.leasing_offer -> 'lease_takeover_offer' ->> 'enabled', 'false') = 'true';

  -- Leasingübernahme: post the next-steps checklist into the chat so both
  -- parties see the same instructions. Runs after the conversation is
  -- buyer_selected, so the sold-listing write guard lets it through.
  IF v_is_lease_takeover THEN
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
      '• Macht eine gemeinsame Fahrzeugbesichtigung und haltet den Zustand schriftlich fest – Vorschäden gehen auf den Käufer über.' || E'\n\n' ||
      '❗ WICHTIG – UMSCHREIBUNG: Die Leasingbank gibt die Übernahme nur frei, die Umschreibung macht sie nicht. Sobald die Freigabe der Bank da ist, geht der Käufer oder der Verkäufer selbst zum Strassenverkehrsamt und lässt den Fahrzeugausweis auf den Käufer umschreiben.' || E'\n\n' ||
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
