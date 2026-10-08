-- Public seller names: first name + last-name initial, never the full name.
--
-- get_public_profiles and get_public_listing_owner_profiles are SECURITY
-- DEFINER and executable by anon, so anyone could read a private seller's full
-- name through /rest/v1/rpc/... even though the site only ever renders
-- "Dávid T." (src/lib/buyauto/sellerName.ts). This migration:
--   1. adds public.public_seller_display_name(text), an exact SQL mirror of
--      abbreviatePrivateName() in sellerName.ts
--   2. recreates both RPCs with unchanged signatures, return types, SECURITY
--      DEFINER and grants; the full_name column now carries the public display
--      name only. Garage sellers / garage owners get their business name and no
--      personal avatar. show_name_publicly = false still yields NULL/NULL.
--   3. limits get_public_profiles to users that own a published or sold
--      listing (the only ids any caller passes), so buyer accounts can no
--      longer be resolved by uuid.
-- Messaging (get_my_message_threads, get_conversation_context) and admin
-- screens do not use these RPCs and are unchanged.

create or replace function public.public_seller_display_name(p text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $function$
  -- Mirrors abbreviatePrivateName():
  --   cleaned = name.replace(/\s+/g, " ").trim()   (JS \s set spelled out)
  --   '' or contains '@'          -> NULL
  --   one token                   -> that token
  --   several tokens              -> first + ' ' + upper(first letter of last
  --                                  token, leading non-letters stripped) + '.'
  --                                  (no letter left -> first token only)
  -- ICU collation: [[:alpha:]] = Unicode general category L (JS \p{L}) and
  -- upper() does full case mapping like toLocaleUpperCase ('ß' -> 'SS').
  select case
    when c.s is null or c.s = '' or pg_catalog.strpos(c.s, '@') > 0 then null
    when pg_catalog.cardinality(c.toks) = 1 then c.toks[1]
    else (
      select case
        when t.last_tok = '' then c.toks[1]
        else c.toks[1] || ' '
          || pg_catalog.upper(pg_catalog."left"(t.last_tok, 1) collate pg_catalog."und-x-icu")
          || '.'
      end
      from (
        select pg_catalog.regexp_replace(
          c.toks[pg_catalog.cardinality(c.toks)] collate pg_catalog."und-x-icu",
          '^[^[:alpha:]]+', ''
        ) as last_tok
      ) t
    )
  end
  from (
    select x.s, pg_catalog.string_to_array(x.s, ' ') as toks
    from (
      select pg_catalog.btrim(
        pg_catalog.regexp_replace(
          p,
          U&'[!0009!000a!000b!000c!000d !00a0!1680!2000-!200a!2028!2029!202f!205f!3000!feff]+' UESCAPE '!',
          ' ',
          'g'
        ),
        ' '
      ) as s
    ) x
  ) c
$function$;

comment on function public.public_seller_display_name(text) is
  'Public seller display name ("Dávid Tóth" -> "Dávid T."). SQL mirror of abbreviatePrivateName() in src/lib/buyauto/sellerName.ts — change both together.';

-- Pure helper, only called from the SECURITY DEFINER RPCs below (which run as
-- their owner), so it does not need to be part of the public API.
revoke all on function public.public_seller_display_name(text) from public, anon, authenticated;
grant execute on function public.public_seller_display_name(text) to postgres, service_role;

create or replace function public.get_public_profiles(p_user_ids uuid[])
returns table(id uuid, full_name text, avatar_url text)
language sql
stable
security definer
set search_path = ''
as $function$
  select
    p.id,
    case
      when not p.show_name_publicly then null
      when s.is_garage then nullif(btrim(coalesce(og.garage_name, '')), '')
      else public.public_seller_display_name(p.full_name)
    end as full_name,
    case
      when p.show_name_publicly and not s.is_garage then p.avatar_url
    end as avatar_url
  from public.profiles p
  left join lateral (
    select true as owns_garage, g.garage_name
    from public.garages g
    where g.owner_user_id = p.id
    order by g.created_at nulls last, g.id
    limit 1
  ) og on true
  cross join lateral (
    select (p.role = 'garage' or og.owns_garage is not null) as is_garage
  ) s
  where p.id = any(coalesce(p_user_ids, array[]::uuid[]))
    and exists (
      select 1
      from public.listings l
      where coalesce(l.user_id, l.created_by) = p.id
        and l.status in ('published', 'sold')
    );
$function$;

create or replace function public.get_public_listing_owner_profiles(p_listing_ids uuid[])
returns table(listing_id uuid, full_name text, avatar_url text)
language sql
stable
security definer
set search_path = ''
as $function$
  select
    l.id as listing_id,
    case
      when not coalesce(p.show_name_publicly, false) then null
      when s.is_garage then nullif(btrim(coalesce(lg.garage_name, og.garage_name, '')), '')
      else public.public_seller_display_name(p.full_name)
    end as full_name,
    case
      when coalesce(p.show_name_publicly, false) and not s.is_garage then p.avatar_url
    end as avatar_url
  from public.listings l
  left join public.profiles p
    on p.id = coalesce(l.user_id, l.created_by)
  left join public.garages lg
    on lg.id = l.garage_id
  left join lateral (
    select true as owns_garage, g.garage_name
    from public.garages g
    where g.owner_user_id = p.id
    order by g.created_at nulls last, g.id
    limit 1
  ) og on true
  cross join lateral (
    select (
      coalesce(l.seller_type, '') = 'garage'
      or l.garage_id is not null
      or coalesce(p.role, '') = 'garage'
      or og.owns_garage is not null
    ) as is_garage
  ) s
  where l.id = any(p_listing_ids)
    and l.status in ('published', 'sold');
$function$;

comment on function public.get_public_profiles(uuid[]) is
  'Public seller card data for owners of published/sold listings. full_name holds the PUBLIC display name only ("First L." or garage name), never the stored full name.';
comment on function public.get_public_listing_owner_profiles(uuid[]) is
  'Public seller card data per published/sold listing. full_name holds the PUBLIC display name only ("First L." or garage name), never the stored full name.';

-- CREATE OR REPLACE keeps the existing ACL; restated so the intended grants
-- are explicit in the migration history.
grant execute on function public.get_public_profiles(uuid[]) to anon, authenticated, service_role;
grant execute on function public.get_public_listing_owner_profiles(uuid[]) to anon, authenticated, service_role;
