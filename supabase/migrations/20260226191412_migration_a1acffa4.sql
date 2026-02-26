CREATE OR REPLACE FUNCTION public.auto_publish_garage_listings()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.seller_type = 'garage' AND NEW.status = 'pending' THEN
    NEW.status := 'published';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_publish_garage_listings ON public.listings;

CREATE TRIGGER trg_auto_publish_garage_listings
BEFORE INSERT OR UPDATE OF status, seller_type ON public.listings
FOR EACH ROW
EXECUTE FUNCTION public.auto_publish_garage_listings();