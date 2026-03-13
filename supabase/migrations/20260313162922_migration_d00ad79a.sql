-- Add messaging MVP fields to conversations + participants
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS archived_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS archive_expires_at timestamptz NULL;

ALTER TABLE public.conversation_participants
  ADD COLUMN IF NOT EXISTS unread_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_read_at timestamptz NULL;

-- Constraints to keep status sane
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'conversations_status_check'
  ) THEN
    ALTER TABLE public.conversations
      ADD CONSTRAINT conversations_status_check
      CHECK (status IN ('new','active','archived','buyer_selected'));
  END IF;
END $$;