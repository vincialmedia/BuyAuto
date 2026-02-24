ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS archived_at timestamptz;

CREATE OR REPLACE FUNCTION public.set_listings_archived_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'archived' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    NEW.archived_at := COALESCE(NEW.archived_at, now());
  END IF;

  IF NEW.status IS DISTINCT FROM 'archived' THEN
    NEW.archived_at := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_listings_archived_at ON public.listings;

CREATE TRIGGER trg_set_listings_archived_at
BEFORE UPDATE OF status ON public.listings
FOR EACH ROW
EXECUTE FUNCTION public.set_listings_archived_at();