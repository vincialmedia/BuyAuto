-- Trigger: increment unread_count for other participants
CREATE OR REPLACE FUNCTION public._messages_increment_unread()
RETURNS TRIGGER
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

DROP TRIGGER IF EXISTS trg_messages_increment_unread ON public.messages;
CREATE TRIGGER trg_messages_increment_unread
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public._messages_increment_unread();