-- Ensure pg_net is enabled
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Update the function to correctly invoke the edge function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  user_id_text TEXT;
  raw_user_meta_data_jsonb JSONB;
  project_url TEXT;
  anon_key TEXT;
  payload JSONB;
BEGIN
  -- Extract user data from the new row
  user_email := NEW.email;
  user_id_text := NEW.id::TEXT;
  raw_user_meta_data_jsonb := NEW.raw_user_meta_data;

  -- Get Supabase project URL and anon key from settings
  project_url := current_setting('app.settings.api_url', true);
  anon_key := current_setting('app.settings.anon_key', true);

  -- Log the attempt for debugging purposes
  INSERT INTO public.debug_logs (log_message)
  VALUES (jsonb_build_object(
    'message', 'Attempting to invoke welcome-email function',
    'user_id', user_id_text,
    'email', user_email,
    'project_url', project_url
  ));

  -- Build the JSON payload for the Edge Function
  payload := jsonb_build_object(
      'email', user_email,
      'full_name', raw_user_meta_data_jsonb ->> 'full_name'
  );

  -- Asynchronously invoke the Edge Function using pg_net
  PERFORM net.http_post(
    url := project_url || '/functions/v1/welcome-email',
    headers := jsonb_build_object(
        'Authorization', 'Bearer ' || anon_key,
        'Content-Type', 'application/json'
    ),
    body := payload
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;