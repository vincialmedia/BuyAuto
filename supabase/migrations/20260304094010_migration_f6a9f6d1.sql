CREATE INDEX IF NOT EXISTS listing_drafts_data_listing_id_idx
ON public.listing_drafts ((data->>'id'));

CREATE OR REPLACE FUNCTION public.delete_listing_drafts_on_publish()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status
       AND NEW.status IN ('published', 'active') THEN
      DELETE FROM public.listing_drafts
      WHERE (data->>'id') = NEW.id::text;
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    IF NEW.status IN ('published', 'active') THEN
      DELETE FROM public.listing_drafts
      WHERE (data->>'id') = NEW.id::text;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS listing_delete_drafts_on_publish ON public.listings;

CREATE TRIGGER listing_delete_drafts_on_publish
AFTER INSERT OR UPDATE OF status ON public.listings
FOR EACH ROW
EXECUTE FUNCTION public.delete_listing_drafts_on_publish();