-- Ensure unread_count + last_message_at update on every new message (create trigger only if missing)
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
  SET unread_count = COALESCE(unread_count, 0) + 1
  WHERE conversation_id = NEW.conversation_id
    AND user_id <> NEW.sender_user_id;

  RETURN NEW;
END;
$function$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'messages'
      AND t.tgname = 'trg_messages_after_insert_unread'
      AND NOT t.tgisinternal
  ) THEN
    CREATE TRIGGER trg_messages_after_insert_unread
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.on_message_insert_update_conversation_and_unread();
  END IF;
END $$;