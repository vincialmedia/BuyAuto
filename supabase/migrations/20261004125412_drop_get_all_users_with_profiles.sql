-- get_all_users_with_profiles() returned every user's email, created_at,
-- last_sign_in_at, full_name and role straight from auth.users. It was
-- SECURITY DEFINER with no role check and executable by anon, so anyone with
-- the public anon key could dump the whole user list through
-- /rest/v1/rpc/get_all_users_with_profiles.
--
-- 20251016130149 already dropped it, but it was recreated outside the
-- migration history. Nothing in the app calls it (the admin user list reads
-- public.profiles under the admin RLS policy), so drop it again.

drop function if exists public.get_all_users_with_profiles();
