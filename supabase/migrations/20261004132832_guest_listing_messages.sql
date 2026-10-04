-- Logged-out visitors on /fahrzeug/[id] can send their first message and create
-- their account in one step (POST /api/messages/guest). The route runs with the
-- service role, so it has no auth.uid(); everything it needs from the database
-- lives here, callable by service_role only.
--
-- 1. create_or_get_conversation_for_listing keeps its signature, grants and
--    behaviour, but its body moves into _create_or_get_conversation_for_listing_as,
--    which takes the buyer explicitly. The logged-in chat (auth.uid()) and the
--    guest route (the freshly created user) open conversations through the same
--    code. The body below is the live version, unchanged apart from where the
--    buyer id comes from.
-- 2. guest_message_precheck answers in one call whether the listing is live
--    (same rule as listings_public), whether the email is the seller's own, and
--    whether an account already exists for it.
-- 3. guest_message_attempts + guest_message_register_attempt: at most N guest
--    submissions per hashed IP per 24 hours.
-- 4. get_conversation_context no longer sends the buyer's email to the seller's
--    browser. Only the buyer gets it back (nothing renders it either way).

-- 1. Conversation creation -----------------------------------------------------

create or replace function public._create_or_get_conversation_for_listing_as(p_listing_id uuid, p_buyer_id uuid)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_buyer_id uuid := p_buyer_id;
  v_seller_id uuid;
  v_conversation_id uuid;
begin
  if v_buyer_id is null then
    raise exception 'not_authenticated';
  end if;

  v_seller_id := public._get_listing_seller_user_id(p_listing_id);

  if v_seller_id is null then
    raise exception 'listing_creator_not_found';
  end if;

  if v_buyer_id = v_seller_id then
    raise exception 'cannot_message_own_listing';
  end if;

  -- Prevent new conversations for sold listings (MVP requirement)
  if exists (
    select 1
    from public.listings l
    where l.id = p_listing_id
      and l.status = 'sold'
  ) then
    raise exception 'listing_sold';
  end if;

  -- No duplicates: find existing conversation for this buyer+listing
  select c.id
    into v_conversation_id
  from public.conversations c
  join public.conversation_participants cp
    on cp.conversation_id = c.id
   and cp.user_id = v_buyer_id
   and cp.role = 'buyer'
  where c.listing_id = p_listing_id
  limit 1;

  if v_conversation_id is not null then
    return v_conversation_id;
  end if;

  insert into public.conversations (listing_id, status)
  values (p_listing_id, 'new')
  returning id into v_conversation_id;

  insert into public.conversation_participants (conversation_id, user_id, role, unread_count)
  values
    (v_conversation_id, v_buyer_id, 'buyer', 0),
    (v_conversation_id, v_seller_id, 'seller', 0);

  return v_conversation_id;
end;
$function$;

revoke all on function public._create_or_get_conversation_for_listing_as(uuid, uuid) from public, anon, authenticated;
grant execute on function public._create_or_get_conversation_for_listing_as(uuid, uuid) to service_role;

-- CREATE OR REPLACE keeps the existing grants (the logged-in chat calls this).
create or replace function public.create_or_get_conversation_for_listing(p_listing_id uuid)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  return public._create_or_get_conversation_for_listing_as(p_listing_id, auth.uid());
end;
$function$;

-- 2. Pre-checks for the guest route --------------------------------------------

create or replace function public.guest_message_precheck(p_listing_id uuid, p_email text)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_listing record;
  v_seller_id uuid;
  v_is_seller_email boolean;
  v_account_exists boolean;
begin
  select l.status, l.expires_at, l.garage_id
    into v_listing
  from public.listings l
  where l.id = p_listing_id;

  if not found then
    return jsonb_build_object('listing_available', false);
  end if;

  v_seller_id := public._get_listing_seller_user_id(p_listing_id);

  select
    exists (
      select 1 from auth.users u
      where u.id = v_seller_id and lower(u.email) = v_email
    )
    or exists (
      select 1 from public.garages g
      where g.id = v_listing.garage_id and lower(btrim(g.contact_email)) = v_email
    )
  into v_is_seller_email;

  select exists (select 1 from auth.users u where lower(u.email) = v_email)
  into v_account_exists;

  return jsonb_build_object(
    -- Same visibility rule as the listings_public view the page renders from.
    'listing_available',
      v_seller_id is not null
      and v_listing.status = 'published'
      and (v_listing.expires_at is null or v_listing.expires_at > now()),
    'is_seller_email', v_is_seller_email,
    'account_exists', v_account_exists
  );
end;
$function$;

revoke all on function public.guest_message_precheck(uuid, text) from public, anon, authenticated;
grant execute on function public.guest_message_precheck(uuid, text) to service_role;

-- 3. Per-IP limit ----------------------------------------------------------------

create table if not exists public.guest_message_attempts (
  id uuid primary key default gen_random_uuid(),
  -- sha256 of the client IP, never the IP itself.
  ip_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists guest_message_attempts_ip_created_idx
  on public.guest_message_attempts (ip_hash, created_at desc);

-- Server-only: RLS on with no policies, and the default client grants removed.
alter table public.guest_message_attempts enable row level security;
revoke all on table public.guest_message_attempts from public, anon, authenticated;
grant all on table public.guest_message_attempts to service_role;

create or replace function public.guest_message_register_attempt(p_ip_hash text, p_limit integer)
returns boolean
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_recent integer;
begin
  -- No lock: two parallel requests from one IP can both pass at the limit,
  -- which is fine for a spam brake.
  delete from public.guest_message_attempts
  where created_at < now() - interval '2 days';

  select count(*)
    into v_recent
  from public.guest_message_attempts a
  where a.ip_hash = p_ip_hash
    and a.created_at > now() - interval '24 hours';

  if v_recent >= p_limit then
    return false;
  end if;

  insert into public.guest_message_attempts (ip_hash) values (p_ip_hash);
  return true;
end;
$function$;

revoke all on function public.guest_message_register_attempt(text, integer) from public, anon, authenticated;
grant execute on function public.guest_message_register_attempt(text, integer) to service_role;

-- 4. Buyer email stays with the buyer ---------------------------------------------

create or replace function public.get_conversation_context(p_conversation_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  v_me_role text;
  v_listing record;
  v_conversation record;

  v_seller_display_name text;
  v_buyer_profile record;

  v_can_select_buyer boolean := false;
  v_can_archive boolean := true;
  v_read_only boolean := false;

  v_counterparty_display_name text;
  v_counterparty_user_id uuid;
  v_counterparty_role text;

  v_listing_cover_image_url text;
begin
  if v_uid is null then
    return null;
  end if;

  select cp.role
  into v_me_role
  from public.conversation_participants cp
  where cp.conversation_id = p_conversation_id
    and cp.user_id = v_uid;

  if v_me_role is null then
    return null;
  end if;

  select *
  into v_conversation
  from public.conversations c
  where c.id = p_conversation_id;

  if v_conversation is null then
    return null;
  end if;

  select l.*
  into v_listing
  from public.listings l
  where l.id = v_conversation.listing_id;

  if v_listing is null then
    return null;
  end if;

  v_listing_cover_image_url := public.get_listing_cover_image(v_listing.images, v_listing.cover_image_index, v_listing.cover_image_url);

  select
    coalesce(
      g.garage_name,
      case when p.show_name_publicly then nullif(btrim(p.full_name), '') end,
      'Privatanbieter'
    ) as display_name
  into v_seller_display_name
  from public.listings l
  left join public.garages g on g.id = l.garage_id
  left join public.profiles p on p.id = l.user_id
  where l.id = v_listing.id;

  select p.id, p.full_name, p.email
  into v_buyer_profile
  from public.conversation_participants cp
  join public.profiles p on p.id = cp.user_id
  where cp.conversation_id = p_conversation_id
    and cp.role = 'buyer'
  limit 1;

  if v_me_role = 'buyer' then
    v_counterparty_role := 'seller';
    v_counterparty_user_id := v_listing.user_id;
    v_counterparty_display_name := v_seller_display_name;
  else
    v_counterparty_role := 'buyer';
    v_counterparty_user_id := v_buyer_profile.id;
    v_counterparty_display_name := coalesce(v_buyer_profile.full_name, '—');
  end if;

  v_can_select_buyer := (v_me_role = 'seller') and (v_listing.status is distinct from 'sold') and (v_buyer_profile.id is not null);
  -- Archived threads are closed. Once the listing is sold every other thread
  -- goes read-only too, but the selected buyer's conversation stays open —
  -- that pair still has a handover to arrange.
  v_read_only := (v_conversation.status = 'archived')
    or ((v_listing.status = 'sold') and (v_conversation.status is distinct from 'buyer_selected'));
  v_can_archive := (v_conversation.status not in ('archived', 'buyer_selected'));

  return jsonb_build_object(
    'title', coalesce(v_counterparty_display_name, '—') || ' - ' || coalesce(v_listing.make_model, 'Fahrzeug'),
    'viewer', jsonb_build_object(
      'user_id', v_uid,
      'role', v_me_role
    ),
    'counterparty', jsonb_build_object(
      'id', v_counterparty_user_id,
      'role', v_counterparty_role,
      'display_name', v_counterparty_display_name
    ),
    'conversation', jsonb_build_object(
      'id', v_conversation.id,
      'status', v_conversation.status,
      'last_message_at', v_conversation.last_message_at,
      'archived_at', v_conversation.archived_at,
      'archive_expires_at', v_conversation.archive_expires_at,
      'my_unread_count', (
        select cp.unread_count
        from public.conversation_participants cp
        where cp.conversation_id = p_conversation_id and cp.user_id = v_uid
      )
    ),
    'listing', jsonb_build_object(
      'id', v_listing.id,
      'brand', v_listing.brand,
      'model', v_listing.model,
      'make_model', v_listing.make_model,
      'year', v_listing.year,
      'price_per_month_chf', v_listing.price_per_month_chf,
      'purchase_price_chf', v_listing.purchase_price_chf,
      'mileage_km', v_listing.mileage_km,
      'cover_image_url', v_listing_cover_image_url,
      'status', v_listing.status,
      'garage_id', v_listing.garage_id
    ),
    'buyer', jsonb_build_object(
      'id', v_buyer_profile.id,
      'full_name', v_buyer_profile.full_name,
      'email', case when v_me_role = 'buyer' then v_buyer_profile.email end
    ),
    'seller', jsonb_build_object(
      'id', v_listing.user_id,
      'display_name', v_seller_display_name
    ),
    'permissions', jsonb_build_object(
      'can_select_buyer', v_can_select_buyer,
      'can_archive', v_can_archive
    ),
    'flags', jsonb_build_object(
      'read_only', v_read_only
    )
  );
end;
$function$;
