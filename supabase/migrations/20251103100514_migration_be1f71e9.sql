-- Step 1: Create the database function to handle new inquiries
CREATE OR REPLACE FUNCTION public.handle_new_inquiry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Allows the function to use pg_net with service role keys
AS $$
BEGIN
  -- Asynchronously invoke the send-inquiry-email Edge Function
  PERFORM net.http_post(
    url := supabase_url() || '/functions/v1/send-inquiry-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || supabase_service_role_key() -- Use the service role key for authentication
    ),
    body := jsonb_build_object('record', NEW)
  );
  
  -- Return the new record to complete the INSERT operation
  RETURN NEW;
END;
$$;

-- Step 2: Create the trigger that fires after a new inquiry is inserted
DROP TRIGGER IF EXISTS on_inquiry_created ON public.listing_inquiries;
CREATE TRIGGER on_inquiry_created
AFTER INSERT ON public.listing_inquiries
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_inquiry();