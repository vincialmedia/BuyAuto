-- STEP 1: Make listing ownership explicit (data-only, no UI changes)
-- Canonical owner = created_by (already used by RLS). Keep user_id synced for existing dashboard queries.

-- A) Add columns + FK
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS seller_type text,
  ADD COLUMN IF NOT EXISTS garage_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'listings_garage_id_fkey'
      AND conrelid = 'public.listings'::regclass
  ) THEN
    ALTER TABLE public.listings
      ADD CONSTRAINT listings_garage_id_fkey
      FOREIGN KEY (garage_id)
      REFERENCES public.garages(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- B) Backfill NULLs + fix mismatches (created_by is canonical)
UPDATE public.listings
SET created_by = COALESCE(created_by, user_id)
WHERE created_by IS NULL AND user_id IS NOT NULL;

UPDATE public.listings
SET user_id = COALESCE(user_id, created_by)
WHERE user_id IS NULL AND created_by IS NOT NULL;

UPDATE public.listings
SET user_id = created_by
WHERE created_by IS NOT NULL
  AND user_id IS NOT NULL
  AND created_by <> user_id;

-- C) Backfill seller_type + garage_id (best-effort, do not fail if garage row missing)
UPDATE public.listings l
SET seller_type = CASE WHEN p.role = 'garage' THEN 'garage' ELSE 'private' END
FROM public.profiles p
WHERE p.id = l.created_by
  AND (l.seller_type IS NULL OR l.seller_type = '');

UPDATE public.listings l
SET garage_id = g.id
FROM public.garages g
WHERE l.seller_type = 'garage'
  AND l.created_by = g.owner_user_id
  AND l.garage_id IS NULL;

UPDATE public.listings
SET garage_id = NULL
WHERE seller_type = 'private' AND garage_id IS NOT NULL;

-- D) Trigger (with auth.uid guard, no get_my_role dependency)
CREATE OR REPLACE FUNCTION public.apply_listing_seller_metadata()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_role text;
  v_garage_id uuid;
BEGIN
  -- Only default ownership from auth.uid() when it exists (prevents server/service inserts breaking)
  IF NEW.created_by IS NULL AND auth.uid() IS NOT NULL THEN
    NEW.created_by := auth.uid();
  END IF;

  IF NEW.user_id IS NULL AND NEW.created_by IS NOT NULL THEN
    NEW.user_id := NEW.created_by;
  END IF;

  -- If both set but differ, canonicalize to created_by (do not fail)
  IF NEW.created_by IS NOT NULL AND NEW.user_id IS NOT NULL AND NEW.created_by <> NEW.user_id THEN
    NEW.user_id := NEW.created_by;
  END IF;

  -- Prevent ownership changes for authenticated callers
  IF TG_OP = 'UPDATE' AND auth.uid() IS NOT NULL THEN
    IF NEW.created_by IS DISTINCT FROM OLD.created_by OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
      RAISE EXCEPTION 'Listing ownership cannot be changed';
    END IF;
  END IF;

  -- Set/repair seller_type from profile role when missing
  IF NEW.seller_type IS NULL OR NEW.seller_type = '' THEN
    SELECT p.role INTO v_role
    FROM public.profiles p
    WHERE p.id = NEW.created_by;

    IF v_role = 'garage' THEN
      NEW.seller_type := 'garage';
    ELSE
      NEW.seller_type := 'private';
    END IF;
  END IF;

  -- Defensive normalization
  IF NEW.seller_type NOT IN ('private','garage') THEN
    NEW.seller_type := 'private';
  END IF;

  -- Enforce garage attachment rules
  IF NEW.seller_type = 'private' THEN
    NEW.garage_id := NULL;
  ELSE
    -- seller_type = 'garage'
    IF NEW.garage_id IS NULL AND NEW.created_by IS NOT NULL THEN
      SELECT g.id INTO v_garage_id
      FROM public.garages g
      WHERE g.owner_user_id = NEW.created_by
      LIMIT 1;

      NEW.garage_id := v_garage_id; -- may remain NULL if garage row missing
    END IF;

    -- If garage_id is present, it must belong to the listing owner (prevents attaching to another garage)
    IF NEW.garage_id IS NOT NULL AND NEW.created_by IS NOT NULL THEN
      PERFORM 1
      FROM public.garages g
      WHERE g.id = NEW.garage_id
        AND g.owner_user_id = NEW.created_by;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'garage_id must belong to listing owner';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_apply_listing_seller_metadata ON public.listings;
CREATE TRIGGER trg_apply_listing_seller_metadata
BEFORE INSERT OR UPDATE ON public.listings
FOR EACH ROW
EXECUTE FUNCTION public.apply_listing_seller_metadata();

-- E) CHECK constraints (after backfill + mismatch alignment)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'listings_seller_type_check'
      AND conrelid = 'public.listings'::regclass
  ) THEN
    ALTER TABLE public.listings
      ADD CONSTRAINT listings_seller_type_check
      CHECK (seller_type IS NULL OR seller_type IN ('private','garage'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'listings_private_garage_null_check'
      AND conrelid = 'public.listings'::regclass
  ) THEN
    ALTER TABLE public.listings
      ADD CONSTRAINT listings_private_garage_null_check
      CHECK (seller_type IS NULL OR seller_type <> 'private' OR garage_id IS NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'listings_owner_fields_match_check'
      AND conrelid = 'public.listings'::regclass
  ) THEN
    ALTER TABLE public.listings
      ADD CONSTRAINT listings_owner_fields_match_check
      CHECK (created_by IS NULL OR user_id IS NULL OR created_by = user_id);
  END IF;
END $$;

-- RLS: verify enabled (idempotent)
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- RLS: update owner policies last (keep existing admin + public_read_published policies intact)
DROP POLICY IF EXISTS owner_insert ON public.listings;
CREATE POLICY owner_insert
ON public.listings
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND user_id = auth.uid()
  AND (
    garage_id IS NULL OR EXISTS (
      SELECT 1
      FROM public.garages g
      WHERE g.id = garage_id
        AND g.owner_user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS owner_update ON public.listings;
CREATE POLICY owner_update
ON public.listings
FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (
  created_by = auth.uid()
  AND user_id = auth.uid()
  AND (
    garage_id IS NULL OR EXISTS (
      SELECT 1
      FROM public.garages g
      WHERE g.id = garage_id
        AND g.owner_user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS owner_select ON public.listings;
CREATE POLICY owner_select
ON public.listings
FOR SELECT
TO authenticated
USING (created_by = auth.uid());

DROP POLICY IF EXISTS owner_delete ON public.listings;
CREATE POLICY owner_delete
ON public.listings
FOR DELETE
TO authenticated
USING (created_by = auth.uid());