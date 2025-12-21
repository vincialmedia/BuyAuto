-- 1. Update handle_new_user to ONLY create profile (REMOVE email sending)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    'user'
  );
  RETURN NEW;
END;
$function$;

-- 2. Create new function SPECIFICALLY for welcome email
CREATE OR REPLACE FUNCTION public.handle_welcome_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  user_email TEXT;
  user_full_name TEXT;
BEGIN
  user_email := NEW.email;
  user_full_name := NEW.raw_user_meta_data ->> 'full_name';

  PERFORM net.http_post(
    url := 'https://fgalkhfopecwsryracre.supabase.co/functions/v1/welcome-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('request.jwt.claim', true)
    ),
    body := jsonb_build_object(
      'record', jsonb_build_object(
        'id', NEW.id,
        'email', user_email,
        'full_name', user_full_name,
        'email_confirmed_at', NEW.email_confirmed_at
      )
    )
  );
  RETURN NEW;
END;
$function$;

-- 3. Create the new trigger that fires ONLY when email is confirmed
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
AFTER UPDATE ON auth.users
FOR EACH ROW
WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
EXECUTE FUNCTION public.handle_welcome_email();