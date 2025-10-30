-- 1. Create a helper function to get user role without recursion
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- 2. Clean up duplicate policies on 'listing_inquiries'
DROP POLICY IF EXISTS "Anyone can insert inquiries" ON public.listing_inquiries;
DROP POLICY IF EXISTS "Anyone can submit inquiries" ON public.listing_inquiries;

-- 3. Clean up duplicate policy on 'profiles'
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;

-- 4. Fix 'profiles' table admin policy
DROP POLICY IF EXISTS "Admins have full access." ON public.profiles;
CREATE POLICY "Admins have full access" ON public.profiles
  FOR ALL
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- 5. Fix 'listings' table admin policy
DROP POLICY IF EXISTS admin_all ON public.listings;
CREATE POLICY "Admins have full access" ON public.listings
  FOR ALL
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- 6. Fix 'listing_inquiries' table admin policy
DROP POLICY IF EXISTS "Admins can view all inquiries" ON public.listing_inquiries;
CREATE POLICY "Admins can view all inquiries" ON public.listing_inquiries
  FOR SELECT
  USING (public.get_my_role() = 'admin');