-- Review follow-up for 20261004132832_guest_listing_messages.
--
-- guest_message_precheck
-- * account_exists also looks at auth.identities (provider 'email'), the same
--   place Supabase Auth checks for duplicate emails on signup, so the guest
--   route never signs up an address Auth would treat as taken.
-- * recent_unconfirmed_guest_conversations: conversations opened on this
--   listing in the last 24 hours by accounts the guest route created and that
--   haven't confirmed their email yet. The route caps it per listing, so one
--   seller can't be flooded with unconfirmed messages from many IPs.

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
  v_recent_guest_conversations integer;
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

  select
    exists (select 1 from auth.users u where lower(u.email) = v_email)
    or exists (select 1 from auth.identities i where i.provider = 'email' and lower(i.email) = v_email)
  into v_account_exists;

  select count(*)
    into v_recent_guest_conversations
  from public.conversations c
  join public.conversation_participants cp
    on cp.conversation_id = c.id
   and cp.role = 'buyer'
  join auth.users u
    on u.id = cp.user_id
  where c.listing_id = p_listing_id
    and c.created_at > now() - interval '24 hours'
    and u.email_confirmed_at is null
    and u.raw_app_meta_data->>'signup_source' = 'listing_message';

  return jsonb_build_object(
    -- Same visibility rule as the listings_public view the page renders from.
    'listing_available',
      v_seller_id is not null
      and v_listing.status = 'published'
      and (v_listing.expires_at is null or v_listing.expires_at > now()),
    'is_seller_email', v_is_seller_email,
    'account_exists', v_account_exists,
    'recent_unconfirmed_guest_conversations', v_recent_guest_conversations
  );
end;
$function$;

revoke all on function public.guest_message_precheck(uuid, text) from public, anon, authenticated;
grant execute on function public.guest_message_precheck(uuid, text) to service_role;
