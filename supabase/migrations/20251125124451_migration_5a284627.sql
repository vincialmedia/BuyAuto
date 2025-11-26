CREATE EXTENSION IF NOT EXISTS "pg_net";

CREATE OR REPLACE FUNCTION public.handle_new_listing_notification()
RETURNS TRIGGER AS $$
DECLARE
  request_url TEXT := 'https://fgalkhfopecwsryracre.supabase.co/functions/v1/admin-new-listing-notification';
  request_headers JSONB := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnYWxraGZvcGVjd3NyeXJhY3JlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NTgyNTcsImV4cCI6MjA3MTUzNDI1N30.NVkJifm16QeDNEE_E2HBjkcVhWHksCN4gCyvjT5T0RU"}';
  payload JSONB;
  should_notify BOOLEAN := FALSE;
BEGIN
  -- Check logic inside function to avoid complex Trigger WHEN clauses
  IF (TG_OP = 'INSERT') THEN
    -- For new records, check if they meet the criteria immediately
    IF (NEW.status = 'pending' AND NEW.payment_status = 'paid') THEN
      should_notify := TRUE;
    END IF;
  ELSIF (TG_OP = 'UPDATE') THEN
    -- For updates, ONLY notify if they JUST became ready (state change)
    -- This prevents spam if you edit a pending listing later
    IF (NEW.status = 'pending' AND NEW.payment_status = 'paid') AND
       (OLD.status IS DISTINCT FROM 'pending' OR OLD.payment_status IS DISTINCT FROM 'paid') THEN
      should_notify := TRUE;
    END IF;
  END IF;

  IF (should_notify) THEN
    payload := jsonb_build_object('record', row_to_json(NEW));
    -- Send the request asynchronously via pg_net
    PERFORM net.http_post(
      url := request_url,
      headers := request_headers,
      body := payload
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the Trigger on the listings table
DROP TRIGGER IF EXISTS on_listing_ready_for_review ON public.listings;
CREATE TRIGGER on_listing_ready_for_review
AFTER INSERT OR UPDATE ON public.listings
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_listing_notification();