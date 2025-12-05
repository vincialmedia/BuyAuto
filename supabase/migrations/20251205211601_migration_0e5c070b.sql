-- Create function to handle listing status changes
CREATE OR REPLACE FUNCTION public.handle_listing_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only trigger if status changed to 'published' or 'rejected'
  IF (NEW.status = 'published' OR NEW.status = 'rejected') 
     AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    
    -- Invoke the Edge Function
    PERFORM
      net.http_post(
        url := 'https://gajhxrhfkjpfkybnlmyj.supabase.co/functions/v1/listing-status-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object(
          'record', to_jsonb(NEW),
          'old_record', to_jsonb(OLD)
        )
      );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_listing_status_change ON public.listings;

-- Create trigger for listing status changes
CREATE TRIGGER on_listing_status_change
  AFTER UPDATE ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_listing_status_change();