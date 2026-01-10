-- Create trigger function to automatically send service inquiry emails
CREATE OR REPLACE FUNCTION handle_new_service_inquiry()
RETURNS TRIGGER AS $$
BEGIN
  -- Invoke the Edge Function via pg_net extension
  PERFORM
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/service-inquiry-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object('record', row_to_json(NEW))
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on service_inquiries table
DROP TRIGGER IF EXISTS on_service_inquiry_created ON service_inquiries;
CREATE TRIGGER on_service_inquiry_created
  AFTER INSERT ON service_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_service_inquiry();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA net TO postgres, anon, authenticated, service_role;