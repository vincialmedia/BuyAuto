-- Drop and recreate the function with proper pg_net usage
DROP FUNCTION IF EXISTS public.handle_new_inquiry() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_inquiry()
RETURNS TRIGGER AS $$
DECLARE
  project_url TEXT;
  service_role_key TEXT;
  request_id BIGINT;
BEGIN
  -- Get Supabase project URL from the database
  -- Format: https://[project-ref].supabase.co
  SELECT current_setting('request.headers', true)::json->>'x-forwarded-host'
  INTO project_url;
  
  -- Construct the Edge Function URL
  -- If we can't get the URL from headers, we'll use a placeholder that needs to be configured
  IF project_url IS NULL OR project_url = '' THEN
    project_url := 'https://vgrkecspllwxccwsrxwm.supabase.co';
  ELSE
    project_url := 'https://' || project_url;
  END IF;
  
  -- Use pg_net to invoke the Edge Function asynchronously
  -- Note: The service role key is securely stored in Supabase Vault
  SELECT INTO request_id net.http_post(
    url := project_url || '/functions/v1/send-inquiry-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key', true)
    ),
    body := jsonb_build_object(
      'inquiry_id', NEW.id
    ),
    timeout_milliseconds := 5000
  );
  
  -- Log the request (optional, for debugging)
  RAISE NOTICE 'Inquiry email triggered for inquiry_id: %, request_id: %', NEW.id, request_id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the insert
    RAISE WARNING 'Failed to trigger inquiry email for inquiry_id %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_inquiry_created ON public.listing_inquiries;
CREATE TRIGGER on_inquiry_created
  AFTER INSERT ON public.listing_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_inquiry();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA net TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA net TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA net TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA net TO postgres, anon, authenticated, service_role;