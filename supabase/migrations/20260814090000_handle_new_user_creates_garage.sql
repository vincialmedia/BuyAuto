-- New garage accounts used to dead-end: handle_new_user only created the
-- profiles row, so a signup with role='garage' had no garages row and the
-- garage dashboard / plan flow found nothing to attach to. The signup form
-- already collects garage_name/city/contact_email into the auth metadata —
-- create the garages row from it here.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
declare
  selected_role text;
  new_full_name text;
  new_garage_name text;
begin
  -- Get role from metadata, default to 'private'
  selected_role := coalesce(new.raw_user_meta_data->>'role', 'private');

  -- Validate role (security precaution)
  if selected_role not in ('private', 'garage') then
    selected_role := 'private';
  end if;

  -- Display name: prefer full_name, else "first last". Never the email —
  -- a missing name must stay NULL so the UI shows "Privatanbieter".
  new_full_name := nullif(btrim(coalesce(new.raw_user_meta_data->>'full_name', '')), '');
  if new_full_name is null then
    new_full_name := nullif(btrim(concat_ws(' ',
      nullif(btrim(coalesce(new.raw_user_meta_data->>'first_name', '')), ''),
      nullif(btrim(coalesce(new.raw_user_meta_data->>'last_name', '')), '')
    )), '');
  end if;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new_full_name,
    selected_role
  );

  -- Guarded so a failure here can never abort the signup itself: a missing
  -- garages row is recoverable later, a missing auth user is not.
  -- garage_name is NOT NULL, so fall back to the person's name; the garage
  -- can rename itself in the dashboard.
  if selected_role = 'garage' then
    begin
      new_garage_name := coalesce(
        nullif(btrim(coalesce(new.raw_user_meta_data->>'garage_name', '')), ''),
        new_full_name,
        'Garage'
      );

      insert into public.garages (owner_user_id, garage_name, city, contact_email)
      values (
        new.id,
        new_garage_name,
        nullif(btrim(coalesce(new.raw_user_meta_data->>'city', '')), ''),
        coalesce(nullif(btrim(coalesce(new.raw_user_meta_data->>'contact_email', '')), ''), new.email)
      )
      on conflict (owner_user_id) do nothing;
    exception when others then
      raise warning 'handle_new_user: could not create garage for %: %', new.id, sqlerrm;
    end;
  end if;

  return new;
end;
$$;
