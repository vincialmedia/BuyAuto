-- Helper: set last_message_at on message insert
CREATE OR REPLACE FUNCTION public._conversations_set_last_message_at()
RETURNS TRIGGER
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

DROP TRIGGER IF EXISTS trg_messages_set_last_message_at ON public.messages;
CREATE TRIGGER trg_messages_set_last_message_at
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public._conversations_set_last_message_at();