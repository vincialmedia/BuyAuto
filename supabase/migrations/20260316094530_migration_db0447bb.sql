-- Fix #1: add listings.make_model as a GENERATED column using an IMMUTABLE expression
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'listings'
      AND column_name = 'make_model'
  ) THEN
    ALTER TABLE public.listings
      ADD COLUMN make_model text
      GENERATED ALWAYS AS (btrim(coalesce(brand, '') || ' ' || coalesce(model, ''))) STORED;
  END IF;
END $$;

-- Fix #2: remove recursive SELECT policies on conversation_participants and replace with non-recursive policy
DO $$
DECLARE
  r record;
BEGIN
  -- Drop all existing SELECT policies on the table (they are currently recursive and break messaging)
  FOR r IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'conversation_participants'
      AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.conversation_participants', r.policyname);
  END LOOP;

  -- Ensure RLS is enabled (should already be, but safe)
  EXECUTE 'ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY';

  -- Create a safe, non-recursive SELECT policy:
  -- Users can read only their own participant row(s).
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'conversation_participants'
      AND policyname = 'participants_can_read_own_participation'
  ) THEN
    EXECUTE 'CREATE POLICY participants_can_read_own_participation ON public.conversation_participants FOR SELECT USING (auth.uid() = user_id)';
  END IF;
END $$;