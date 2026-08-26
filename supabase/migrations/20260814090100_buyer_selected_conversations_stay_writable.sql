-- Selecting a buyer used to freeze the very conversation the seller chose:
-- get_conversation_context flagged status 'buyer_selected' as read-only, so
-- seller and selected buyer could no longer message each other to arrange the
-- handover. Now only archived threads — and, once the listing is sold, the
-- threads of the buyers who were NOT selected — are read-only.

create or replace function public.get_conversation_context(p_conversation_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
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
$$;
