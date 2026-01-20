-- 1) Add "draft" to the listings status enum (so real listings can be saved as Entwurf)
ALTER TYPE public.listing_status ADD VALUE IF NOT EXISTS 'draft';

-- 2) Partial drafts table (allows saving immediately, even with only 1 field)
CREATE TABLE IF NOT EXISTS public.listing_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3) RLS policies (each user can CRUD only their own drafts; multiple drafts naturally supported)
ALTER TABLE public.listing_drafts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'listing_drafts'
      AND policyname = 'Users can view their own listing drafts'
  ) THEN
    CREATE POLICY "Users can view their own listing drafts"
    ON public.listing_drafts FOR SELECT
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'listing_drafts'
      AND policyname = 'Users can insert their own listing drafts'
  ) THEN
    CREATE POLICY "Users can insert their own listing drafts"
    ON public.listing_drafts FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'listing_drafts'
      AND policyname = 'Users can update their own listing drafts'
  ) THEN
    CREATE POLICY "Users can update their own listing drafts"
    ON public.listing_drafts FOR UPDATE
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'listing_drafts'
      AND policyname = 'Users can delete their own listing drafts'
  ) THEN
    CREATE POLICY "Users can delete their own listing drafts"
    ON public.listing_drafts FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END $$;