-- Fix #3: dedupe unread increment triggers on public.messages
-- Goal: keep ONLY `trg_messages_unread` (handle_new_message_unread) for unread increments
-- and keep ONLY ONE last_message_at trigger.

DO $$
BEGIN
  -- Drop duplicate triggers that call on_message_insert_update_conversation_and_unread()
  IF EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'messages' AND t.tgname = 'messages_after_insert_unread'
  ) THEN
    EXECUTE 'DROP TRIGGER messages_after_insert_unread ON public.messages';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'messages' AND t.tgname = 'messages_after_insert_update_conversation_unread'
  ) THEN
    EXECUTE 'DROP TRIGGER messages_after_insert_update_conversation_unread ON public.messages';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'messages' AND t.tgname = 'trg_messages_after_insert_unread'
  ) THEN
    EXECUTE 'DROP TRIGGER trg_messages_after_insert_unread ON public.messages';
  END IF;

  -- Drop duplicate triggers that call _messages_increment_unread()
  IF EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'messages' AND t.tgname = 'messages_increment_unread'
  ) THEN
    EXECUTE 'DROP TRIGGER messages_increment_unread ON public.messages';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'messages' AND t.tgname = 'trg_messages_increment_unread'
  ) THEN
    EXECUTE 'DROP TRIGGER trg_messages_increment_unread ON public.messages';
  END IF;

  -- Keep one last_message_at trigger; drop duplicates
  IF EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'messages' AND t.tgname = 'trg_messages_set_last_message_at'
  ) THEN
    EXECUTE 'DROP TRIGGER trg_messages_set_last_message_at ON public.messages';
  END IF;

  -- We keep `conversations_set_last_message_at` as the canonical one.
END $$;

-- Recalculate unread_count based on last_read_at (now that triggers are deduped)
WITH latest AS (
  SELECT
    cp.conversation_id,
    cp.user_id,
    COUNT(m.id) AS unread_count
  FROM public.conversation_participants cp
  LEFT JOIN public.messages m
    ON m.conversation_id = cp.conversation_id
   AND m.sender_user_id <> cp.user_id
   AND (cp.last_read_at IS NULL OR m.created_at > cp.last_read_at)
  GROUP BY cp.conversation_id, cp.user_id
)
UPDATE public.conversation_participants cp
SET unread_count = latest.unread_count
FROM latest
WHERE cp.conversation_id = latest.conversation_id
  AND cp.user_id = latest.user_id;