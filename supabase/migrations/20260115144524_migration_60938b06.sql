-- 1. MIGRATE PROFILES ROLE
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Update existing data
UPDATE public.profiles SET role = 'private' WHERE role = 'user' OR role IS NULL;

-- Set new default and constraint
ALTER TABLE public.profiles 
  ALTER COLUMN role SET DEFAULT 'private',
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('private', 'garage', 'admin'));

-- 2. CREATE GARAGES TABLE
CREATE TABLE IF NOT EXISTS public.garages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  garage_name text NOT NULL,
  city text,
  contact_email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT garages_owner_user_id_key UNIQUE (owner_user_id)
);

-- 3. ENABLE RLS FOR GARAGES
ALTER TABLE public.garages ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES FOR GARAGES (STRICT: Owner Only)
DROP POLICY IF EXISTS "Garage owner can view own garage" ON public.garages;
CREATE POLICY "Garage owner can view own garage" 
ON public.garages FOR SELECT 
USING (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "Garage owner can update own garage" ON public.garages;
CREATE POLICY "Garage owner can update own garage" 
ON public.garages FOR UPDATE 
USING (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "Garage owner can insert own garage" ON public.garages;
CREATE POLICY "Garage owner can insert own garage" 
ON public.garages FOR INSERT 
WITH CHECK (
  auth.uid() = owner_user_id 
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'garage')
);

-- 5. TRIGGER FOR NEW USERS (Reliability)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.email, 
    'private'
  )
  ON CONFLICT (id) DO NOTHING; -- Safe fallback if profile exists
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to recreate clean
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. RPC FUNCTION FOR ATOMIC UPGRADE
CREATE OR REPLACE FUNCTION public.upgrade_to_garage(
  p_garage_name text,
  p_city text,
  p_contact_email text
) 
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid;
  v_garage_id uuid;
BEGIN
  v_user_id := auth.uid();
  
  -- Check if user exists
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Update Profile Role
  UPDATE public.profiles 
  SET role = 'garage' 
  WHERE id = v_user_id;

  -- 2. Create Garage Record
  INSERT INTO public.garages (owner_user_id, garage_name, city, contact_email)
  VALUES (v_user_id, p_garage_name, p_city, p_contact_email)
  RETURNING id INTO v_garage_id;

  RETURN jsonb_build_object(
    'success', true, 
    'role', 'garage', 
    'garage_id', v_garage_id
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false, 
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;