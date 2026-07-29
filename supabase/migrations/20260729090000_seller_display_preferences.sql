-- Seller display preferences: show the real name by default, with an opt-in
-- "als Privatanbieter anzeigen" anonymity toggle.
--
-- Private sellers are displayed on listings via profiles.full_name, resolved
-- through the SECURITY DEFINER RPCs below (anon users cannot read profiles
-- directly). Until now there was no way to opt out of showing the name, and
-- wizard signups produced blank names (handle_new_user even fell back to the
-- raw email address as the display name). This migration:
--   1. adds profiles.show_name_publicly (default true)
--   2. makes the public-profile RPCs return NULL name/avatar when the seller
--      opted out — every "Privatanbieter" UI fallback then kicks in
--   3. hardens handle_new_user: trims names, falls back to first/last name,
--      and never uses the email address as a display name
--   4. respects the flag in the messaging RPCs (thread list + conversation
--      header show "Privatanbieter" instead of the real name)
--   5. normalizes existing blank names to NULL and backfills real names from
--      auth metadata where available

alter table public.profiles
  add column if not exists show_name_publicly boolean not null default true;

comment on column public.profiles.show_name_publicly is
  'When false the user appears as "Privatanbieter": public RPCs return NULL full_name/avatar_url for their listings.';

update public.profiles
set full_name = null
where full_name is not null
  and btrim(full_name) = '';

update public.profiles p
set full_name = u.meta_name
from (
  select
    id,
    nullif(btrim(coalesce(
      nullif(btrim(coalesce(raw_user_meta_data->>'full_name', '')), ''),
      concat_ws(' ',
        nullif(btrim(coalesce(raw_user_meta_data->>'first_name', '')), ''),
        nullif(btrim(coalesce(raw_user_meta_data->>'last_name', '')), '')
      )
    )), '') as meta_name
  from auth.users
) u
where p.id = u.id
  and p.full_name is null
  and u.meta_name is not null
  and u.meta_name <> coalesce(p.email, '');

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  selected_role text;
  new_full_name text;
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

  return new;
end;
$function$;

create or replace function public.get_public_profiles(p_user_ids uuid[])
returns table(id uuid, full_name text, avatar_url text)
language sql
stable security definer
set search_path to 'public'
as $function$
  select
    p.id,
    case when p.show_name_publicly then nullif(btrim(coalesce(p.full_name, '')), '') end as full_name,
    case when p.show_name_publicly then p.avatar_url end as avatar_url
  from public.profiles p
  where p.id = any(coalesce(p_user_ids, array[]::uuid[]));
$function$;

create or replace function public.get_public_listing_owner_profiles(p_listing_ids uuid[])
returns table(listing_id uuid, full_name text, avatar_url text)
language sql
stable security definer
set search_path to 'public'
as $function$
  select
    l.id as listing_id,
    case when p.show_name_publicly then nullif(btrim(coalesce(p.full_name, '')), '') end as full_name,
    case when p.show_name_publicly then p.avatar_url end as avatar_url
  from public.listings l
  left join public.profiles p
    on p.id = coalesce(l.user_id, l.created_by)
  where l.id = any(p_listing_ids)
    and l.status in ('published','sold');
$function$;

-- Messaging: the seller's display name in the thread list and conversation
-- header must honor the toggle too, otherwise chat leaks the hidden name.
-- Both functions are recreated verbatim from the live definitions with only
-- the seller display-name expression changed (fallback '—' -> 'Privatanbieter').

create or replace function public.get_my_message_threads(p_limit integer default 25)
returns table(conversation_id uuid, listing_id uuid, counterparty_display_name text, seller_display_name text, listing_make_model text, listing_cover_image_url text, listing_status listing_status, conversation_status text, last_message_at timestamp with time zone, last_message_body text, unread_count integer)
language sql
security definer
set search_path to 'public'
as $function$
  WITH my_participation AS (
    SELECT
      cp.conversation_id,
      cp.user_id,
      cp.role,
      cp.unread_count
    FROM public.conversation_participants cp
    WHERE cp.user_id = auth.uid()
  ),
  other_participant AS (
    SELECT
      cp.conversation_id,
      cp.user_id,
      cp.role
    FROM public.conversation_participants cp
    WHERE cp.user_id <> auth.uid()
  ),
  listing_core AS (
    SELECT
      c.id AS conversation_id,
      c.status AS conversation_status,
      c.last_message_at,
      l.id AS listing_id,
      l.make_model AS listing_make_model,
      public.get_listing_cover_image(l.images, l.cover_image_index, l.cover_image_url) AS listing_cover_image_url,
      l.status AS listing_status,
      l.garage_id,
      l.user_id AS seller_user_id
    FROM public.conversations c
    JOIN public.listings l ON l.id = c.listing_id
  ),
  last_message AS (
    SELECT DISTINCT ON (m.conversation_id)
      m.conversation_id,
      m.body AS last_message_body
    FROM public.messages m
    ORDER BY m.conversation_id, m.created_at DESC
  ),
  seller_name AS (
    SELECT
      lc.conversation_id,
      COALESCE(
        g.garage_name,
        CASE WHEN sp.show_name_publicly THEN NULLIF(BTRIM(sp.full_name), '') END,
        'Privatanbieter'
      ) AS seller_display_name
    FROM listing_core lc
    LEFT JOIN public.garages g ON g.id = lc.garage_id
    LEFT JOIN public.profiles sp ON sp.id = lc.seller_user_id
  ),
  buyer_name AS (
    SELECT
      op.conversation_id,
      COALESCE(bp.full_name, '—') AS buyer_display_name
    FROM other_participant op
    LEFT JOIN public.profiles bp ON bp.id = op.user_id
    WHERE op.role = 'buyer'
  ),
  counterparty AS (
    SELECT
      mp.conversation_id,
      CASE
        WHEN mp.role = 'buyer' THEN sn.seller_display_name
        ELSE COALESCE(bn.buyer_display_name, sn.seller_display_name, '—')
      END AS counterparty_display_name,
      sn.seller_display_name
    FROM my_participation mp
    LEFT JOIN seller_name sn ON sn.conversation_id = mp.conversation_id
    LEFT JOIN buyer_name bn ON bn.conversation_id = mp.conversation_id
  )
  SELECT
    lc.conversation_id,
    lc.listing_id,
    c.counterparty_display_name,
    c.seller_display_name,
    lc.listing_make_model,
    lc.listing_cover_image_url,
    lc.listing_status,
    lc.conversation_status,
    lc.last_message_at,
    lm.last_message_body,
    mp.unread_count
  FROM my_participation mp
  JOIN listing_core lc ON lc.conversation_id = mp.conversation_id
  LEFT JOIN counterparty c ON c.conversation_id = mp.conversation_id
  LEFT JOIN last_message lm ON lm.conversation_id = mp.conversation_id
  ORDER BY lc.last_message_at DESC NULLS LAST
  LIMIT GREATEST(COALESCE(p_limit, 25), 1);
$function$;

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
  v_read_only := (v_conversation.status in ('archived', 'buyer_selected'));
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
      'email', v_buyer_profile.email
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
