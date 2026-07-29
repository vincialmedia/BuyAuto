-- Refuse to downgrade admin accounts in upgrade_to_garage.
--
-- profiles.role is the single source of admin access (AuthContext's isAdmin
-- and the /admin middleware guard both derive from it), and no product flow
-- can ever set role back to 'admin' — /api/admin/set-user-role only accepts
-- 'private' | 'garage'. Without this guard, an admin submitting the
-- "Zur Garage wechseln" form on /dashboard/private would silently and
-- irreversibly strip their own admin rights. The UI now hides that form for
-- admins; this makes the RPC itself refuse, so the protection does not rely
-- on the client alone.
--
-- This also syncs the tracked definition with production, which already runs
-- with an explicit search_path that the original tracked migration
-- (20260115144524) lacked. Supersedes the definition there; re-applying is
-- idempotent.

CREATE OR REPLACE FUNCTION public.upgrade_to_garage(
  p_garage_name text,
  p_city text,
  p_contact_email text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'extensions', 'auth'
AS $function$
DECLARE
  v_user_id uuid;
  v_garage_id uuid;
  v_current_role text;
BEGIN
  v_user_id := auth.uid();

  -- Check if user exists
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT p.role INTO v_current_role
  FROM public.profiles p
  WHERE p.id = v_user_id;

  -- Admin accounts must never be downgraded (see header comment).
  IF v_current_role = 'admin' THEN
    RAISE EXCEPTION 'Admin-Konten können nicht in ein Garage-Konto umgewandelt werden';
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
$function$;
