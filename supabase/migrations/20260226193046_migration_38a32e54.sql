CREATE OR REPLACE FUNCTION public.auto_publish_garage_listings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.seller_type = 'garage' THEN
    IF NEW.status IS NULL OR NEW.status = 'pending'::listing_status THEN
      NEW.status := 'published'::listing_status;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_publish_garage_listings ON public.listings;

CREATE TRIGGER trg_auto_publish_garage_listings
BEFORE INSERT OR UPDATE OF status, seller_type ON public.listings
FOR EACH ROW
EXECUTE FUNCTION public.auto_publish_garage_listings();