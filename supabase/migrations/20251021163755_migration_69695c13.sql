-- Clean up existing RLS policies on profiles table
DROP POLICY IF EXISTS "Users can insert own profile during registration" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_service" ON public.profiles;
DROP POLICY IF EXISTS "profiles_upsert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;


-- Create a clean set of RLS policies for the 'profiles' table
-- 1. Users can view their own profile
CREATE POLICY "Users can view their own profile." ON public.profiles FOR SELECT USING (auth.uid() = id);

-- 2. Users can update their own profile
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 3. Admins have full access
CREATE POLICY "Admins have full access." ON public.profiles FOR ALL USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE
      profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);


-- Create the function to handle new user setup
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  user_full_name TEXT;
BEGIN
  -- Insert a new row into public.profiles
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    'user'
  );

  -- Get user email and name for the function invocation
  SELECT
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name'
  INTO user_email,
  user_full_name;

  -- Asynchronously invoke the Edge Function
  PERFORM net.http_post(
    url := 'https://fgalkhfopecwsryracre.supabase.co/functions/v1/welcome-email',
    headers := jsonb_build_object(
      'Content-Type',
      'application/json',
      'Authorization',
      'Bearer ' || current_setting('request.jwt.claim', true)
    ),
    body := jsonb_build_object(
      'record',
      jsonb_build_object(
        'id',
        NEW.id,
        'email',
        user_email,
        'full_name',
        user_full_name
      )
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger to call the function after a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();