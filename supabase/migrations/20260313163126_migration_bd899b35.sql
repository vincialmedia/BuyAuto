-- Guard: prevent sending messages into read-only conversations (archived or sold non-selected)
CREATE OR REPLACE FUNCTION public._messages_prevent_read_only()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conv public.conversations%ROWTYPE;
  v_listing_status text;
BEGIN
  SELECT * INTO v_conv FROM public.conversations WHERE id = NEW.conversation_id;
  IF v_conv.id IS NULL THEN
    RAISE EXCEPTION 'conversation_not_found';
  END IF;

  SELECT status::text INTO v_listing_status FROM public.listings WHERE id = v_conv.listing_id;

  IF v_conv.status = 'archived' THEN
    RAISE EXCEPTION 'conversation_archived';
  END IF;

  IF v_listing_status = 'sold' AND v_conv.status <> 'buyer_selected' THEN
    RAISE EXCEPTION 'listing_sold_read_only';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS messages_prevent_read_only ON public.messages;
CREATE TRIGGER messages_prevent_read_only
BEFORE INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public._messages_prevent_read_only();