CREATE EXTENSION IF NOT EXISTS "pg_net";

CREATE OR REPLACE FUNCTION public.handle_new_listing_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Logic for INSERT
  IF (TG_OP = 'INSERT') THEN
    IF (NEW.status = 'pending' AND NEW.payment_status = 'paid') THEN
      PERFORM net.http_post(
        url := 'https://fgalkhfopecwsryracre.supabase.co/functions/v1/admin-new-listing-notification',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnYWxraGZvcGVjd3NyeXJhY3JlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NTgyNTcsImV4cCI6MjA3MTUzNDI1N30.NVkJifm16QeDNEE_E2HBjkcVhWHksCN4gCyvjT5T0RU"}'::jsonb,
        body := jsonb_build_object('record', row_to_json(NEW))
      );
    END IF;
  -- Logic for UPDATE
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Only trigger if it transitions INTO the target state
    IF (NEW.status = 'pending' AND NEW.payment_status = 'paid') AND
       (OLD.status IS DISTINCT FROM 'pending' OR OLD.payment_status IS DISTINCT FROM 'paid') THEN
      PERFORM net.http_post(
        url := 'https://fgalkhfopecwsryracre.supabase.co/functions/v1/admin-new-listing-notification',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnYWxraGZvcGVjd3NyeXJhY3JlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NTgyNTcsImV4cCI6MjA3MTUzNDI1N30.NVkJifm16QeDNEE_E2HBjkcVhWHksCN4gCyvjT5T0RU"}'::jsonb,
        body := jsonb_build_object('record', row_to_json(NEW))
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_listing_ready_for_review ON public.listings;

CREATE TRIGGER on_listing_ready_for_review
AFTER INSERT OR UPDATE ON public.listings
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_listing_notification();