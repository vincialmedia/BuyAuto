-- "Users can update own profile" lets a signed-in user update every column of
-- their own profiles row, role included. Admin access everywhere is decided by
-- get_my_role() = 'admin', which reads profiles.role, so any user could promote
-- themselves with
--   update public.profiles set role = 'admin' where id = auth.uid();
-- RLS cannot compare against the old row, so guard the column with a trigger.
--
-- Role changes stay allowed for:
--   * admins on the client (get_my_role() = 'admin', "Admins have full access"),
--   * the service role (/api/admin/set-user-role, /api/admin/approve-garage-trial,
--     edge functions),
--   * SECURITY DEFINER functions owned by postgres (upgrade_to_garage,
--     admin_downgrade_garage_to_private), which run as their owner.
-- The trigger function is deliberately SECURITY INVOKER: current_user has to be
-- the caller's role, not the function owner.

create or replace function public.guard_profiles_role_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.role is not distinct from old.role then
    return new;
  end if;

  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  if public.get_my_role() = 'admin' then
    return new;
  end if;

  raise exception 'Only admins can change a profile role'
    using errcode = '42501';
end;
$$;

revoke all on function public.guard_profiles_role_change() from public, anon, authenticated;

drop trigger if exists guard_profiles_role_change on public.profiles;
create trigger guard_profiles_role_change
  before update on public.profiles
  for each row
  execute function public.guard_profiles_role_change();
