-- Add `viewer` and `counterparty` to get_conversation_context.
--
-- The client ConversationContext type (and both the dashboard conversation page
-- and the listing MessagingPanel) read ctx.viewer and ctx.counterparty
-- (display_name / role) to label who the current user is talking to. The function
-- never returned those keys, so the dashboard header showed "—" / "Kontakt" and the
-- role label degraded. This recreates the function to also return:
--   viewer       = { user_id, role }           (the current user's role in the thread)
--   counterparty = { id, role, display_name }   (the other party, relative to viewer)
--
-- Everything else (title/conversation/listing/buyer/seller/permissions/flags) is
-- unchanged and additive, so existing consumers keep working. Also pins search_path.

create or replace function public.get_conversation_context(p_conversation_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_user_id uuid := auth.uid();
  v_conv record;
  v_listing record;
  v_buyer_id uuid;
  v_seller_id uuid;
  v_buyer_profile record;
  v_seller_display_name text;
  v_can_archive boolean := false;
  v_can_select_buyer boolean := false;
  v_read_only boolean := false;
  v_viewer_role text := null;
  v_counterparty_id uuid := null;
  v_counterparty_role text := null;
  v_counterparty_display_name text := null;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select c.*
    into v_conv
  from public.conversations c
  where c.id = p_conversation_id;

  if not found then
    return null;
  end if;

  if not exists (
    select 1
    from public.conversation_participants cp
    where cp.conversation_id = p_conversation_id
      and cp.user_id = v_user_id
  ) then
    return null;
  end if;

  select l.id, l.brand, l.model, l.make_model, l.year, l.price_per_month_chf, l.purchase_price_chf,
         l.mileage_km, l.cover_image_url, l.status::text as status, l.garage_id
    into v_listing
  from public.listings l
  where l.id = v_conv.listing_id;

  select cp.user_id
    into v_buyer_id
  from public.conversation_participants cp
  where cp.conversation_id = p_conversation_id
    and cp.role = 'buyer'
  limit 1;

  v_seller_id := public._get_listing_seller_user_id(v_conv.listing_id);

  if v_listing.garage_id is not null then
    select g.garage_name
      into v_seller_display_name
    from public.garages g
    where g.id = v_listing.garage_id;
  else
    select p.full_name
      into v_seller_display_name
    from public.profiles p
    where p.id = v_seller_id;
  end if;

  select p.id, p.full_name, p.email
    into v_buyer_profile
  from public.profiles p
  where p.id = v_buyer_id;

  v_can_archive := (v_user_id = v_seller_id);
  v_can_select_buyer := (v_user_id = v_seller_id);

  v_read_only := (v_conv.status = 'archived')
    or (v_listing.status = 'sold' and v_conv.status <> 'buyer_selected');

  -- Resolve viewer + counterparty relative to the current user.
  if v_user_id = v_seller_id then
    v_viewer_role := 'seller';
    v_counterparty_id := v_buyer_id;
    v_counterparty_role := 'buyer';
    v_counterparty_display_name := v_buyer_profile.full_name;
  elsif v_user_id = v_buyer_id then
    v_viewer_role := 'buyer';
    v_counterparty_id := v_seller_id;
    v_counterparty_role := 'seller';
    v_counterparty_display_name := v_seller_display_name;
  end if;

  return jsonb_build_object(
    'title', coalesce(v_seller_display_name, '—') || ' - ' || coalesce(v_listing.make_model, 'Fahrzeug'),
    'conversation', jsonb_build_object(
      'id', v_conv.id,
      'status', v_conv.status,
      'last_message_at', v_conv.last_message_at,
      'archived_at', v_conv.archived_at,
      'archive_expires_at', v_conv.archive_expires_at,
      'my_unread_count', coalesce((select cp.unread_count from public.conversation_participants cp where cp.conversation_id = p_conversation_id and cp.user_id = v_user_id limit 1), 0)
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
      'cover_image_url', v_listing.cover_image_url,
      'status', v_listing.status,
      'garage_id', v_listing.garage_id
    ),
    'viewer', jsonb_build_object(
      'user_id', v_user_id,
      'role', v_viewer_role
    ),
    'counterparty', jsonb_build_object(
      'id', v_counterparty_id,
      'role', v_counterparty_role,
      'display_name', v_counterparty_display_name
    ),
    'buyer', jsonb_build_object(
      'id', v_buyer_profile.id,
      'full_name', v_buyer_profile.full_name,
      'email', v_buyer_profile.email
    ),
    'seller', jsonb_build_object(
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
