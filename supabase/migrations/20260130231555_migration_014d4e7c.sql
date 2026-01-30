CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.conversation_participants (
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'buyer' CHECK (role IN ('buyer','seller')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 5000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.message_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_listing_id ON public.conversations(listing_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created_at ON public.messages(conversation_id, created_at DESC);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'conversations' AND policyname = 'participants_can_read_conversations'
  ) THEN
    CREATE POLICY "participants_can_read_conversations"
    ON public.conversations
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1
        FROM public.conversation_participants cp
        WHERE cp.conversation_id = conversations.id
          AND cp.user_id = auth.uid()
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'conversations' AND policyname = 'authenticated_can_create_conversations'
  ) THEN
    CREATE POLICY "authenticated_can_create_conversations"
    ON public.conversations
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'conversation_participants' AND policyname = 'participants_can_read_participants'
  ) THEN
    CREATE POLICY "participants_can_read_participants"
    ON public.conversation_participants
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1
        FROM public.conversation_participants cp
        WHERE cp.conversation_id = conversation_participants.conversation_id
          AND cp.user_id = auth.uid()
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'conversation_participants' AND policyname = 'users_can_add_self_as_participant'
  ) THEN
    CREATE POLICY "users_can_add_self_as_participant"
    ON public.conversation_participants
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'messages' AND policyname = 'participants_can_read_messages'
  ) THEN
    CREATE POLICY "participants_can_read_messages"
    ON public.messages
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1
        FROM public.conversation_participants cp
        WHERE cp.conversation_id = messages.conversation_id
          AND cp.user_id = auth.uid()
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'messages' AND policyname = 'participants_can_send_messages'
  ) THEN
    CREATE POLICY "participants_can_send_messages"
    ON public.messages
    FOR INSERT
    WITH CHECK (
      auth.uid() IS NOT NULL
      AND sender_user_id = auth.uid()
      AND EXISTS (
        SELECT 1
        FROM public.conversation_participants cp
        WHERE cp.conversation_id = messages.conversation_id
          AND cp.user_id = auth.uid()
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'message_attachments' AND policyname = 'participants_can_read_attachments'
  ) THEN
    CREATE POLICY "participants_can_read_attachments"
    ON public.message_attachments
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1
        FROM public.messages m
        JOIN public.conversation_participants cp ON cp.conversation_id = m.conversation_id
        WHERE m.id = message_attachments.message_id
          AND cp.user_id = auth.uid()
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'message_attachments' AND policyname = 'participants_can_add_attachments'
  ) THEN
    CREATE POLICY "participants_can_add_attachments"
    ON public.message_attachments
    FOR INSERT
    WITH CHECK (
      auth.uid() IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.messages m
        JOIN public.conversation_participants cp ON cp.conversation_id = m.conversation_id
        WHERE m.id = message_attachments.message_id
          AND cp.user_id = auth.uid()
      )
    );
  END IF;
END$$;

CREATE OR REPLACE FUNCTION public._conversations_set_last_message_at()
RETURNS trigger
LANGUAGE plpgsql
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

CREATE OR REPLACE FUNCTION public._conversation_participants_ensure_owner()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_listing_id uuid;
  v_owner_id uuid;
BEGIN
  SELECT c.listing_id INTO v_listing_id
  FROM public.conversations c
  WHERE c.id = NEW.conversation_id;

  IF v_listing_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(l.created_by, l.user_id) INTO v_owner_id
  FROM public.listings l
  WHERE l.id = v_listing_id;

  IF v_owner_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.conversation_participants (conversation_id, user_id, role)
  VALUES (NEW.conversation_id, v_owner_id, 'seller')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_participants_ensure_owner ON public.conversation_participants;

CREATE TRIGGER trg_participants_ensure_owner
AFTER INSERT ON public.conversation_participants
FOR EACH ROW
EXECUTE FUNCTION public._conversation_participants_ensure_owner();