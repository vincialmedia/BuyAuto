-- Create the trigger function that calls the Edge Function
CREATE OR REPLACE FUNCTION public.handle_new_listing_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_id bigint;
BEGIN
  -- Only trigger when payment_status changes to 'paid' and status is 'pending'
  IF (OLD.payment_status IS DISTINCT FROM 'paid') 
     AND (NEW.payment_status = 'paid') 
     AND (NEW.status = 'pending') THEN
    
    -- Call the Edge Function via pg_net
    SELECT net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/admin-new-listing-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key')
      ),
      body := jsonb_build_object(
        'type', 'INSERT',
        'table', 'listings',
        'record', row_to_json(NEW),
        'old_record', row_to_json(OLD)
      )
    ) INTO request_id;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger on the listings table
DROP TRIGGER IF EXISTS on_listing_paid ON listings;

CREATE TRIGGER on_listing_paid
  AFTER UPDATE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_listing_notification();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_listing_notification() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_listing_notification() TO service_role;