-- 1) Create the missing inbox RPC used by the frontend: get_my_message_threads(p_limit)
-- Uses get_conversation_context to compute seller_display_name correctly (garage name vs private full name)
create or replace function public.get_my_message_threads(p_limit integer default 25)
returns table (
  conversation_id uuid,
  listing_id uuid,
  seller_display_name text,
  listing_make_model text,
  listing_cover_image_url text,
  last_message_at timestamptz,
  last_message_body text,
  unread_count integer,
  listing_status public.listing_status,
  conversation_status text
)
language sql
security definer
set search_path = public
as $$
  with base as (
    select
      c.id as conversation_id,
      c.listing_id,
      c.status as conversation_status,
      c.last_message_at,
      cp.unread_count,
      public.get_conversation_context(c.id) as ctx
    from public.conversations c
    join public.conversation_participants cp
      on cp.conversation_id = c.id
     and cp.user_id = auth.uid()
    order by coalesce(c.last_message_at, c.created_at) desc
    limit greatest(1, least(coalesce(p_limit, 25), 100))
  )
  select
    b.conversation_id,
    b.listing_id,
    nullif(b.ctx->'seller'->>'display_name', '') as seller_display_name,
    nullif(b.ctx->'listing'->>'make_model', '') as listing_make_model,
    nullif(b.ctx->'listing'->>'cover_image_url', '') as listing_cover_image_url,
    coalesce(
      (b.ctx->'conversation'->>'last_message_at')::timestamptz,
      b.last_message_at
    ) as last_message_at,
    coalesce(lm.body, '') as last_message_body,
    coalesce(b.unread_count, 0) as unread_count,
    (b.ctx->'listing'->>'status')::public.listing_status as listing_status,
    coalesce(b.conversation_status, b.ctx->'conversation'->>'status', 'active') as conversation_status
  from base b
  left join lateral (
    select m.body
    from public.messages m
    where m.conversation_id = b.conversation_id
    order by m.created_at desc
    limit 1
  ) lm on true
  order by coalesce(
    (b.ctx->'conversation'->>'last_message_at')::timestamptz,
    b.last_message_at
  ) desc nulls last;
$$;

-- 2) Keep unread_count + last_message_at in sync when a new message is inserted
create or replace function public.on_message_insert_update_conversation_and_unread()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
    set last_message_at = new.created_at
  where id = new.conversation_id;

  update public.conversation_participants
    set unread_count = coalesce(unread_count, 0) + 1
  where conversation_id = new.conversation_id
    and user_id <> new.sender_user_id;

  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'messages'
      and t.tgname = 'messages_after_insert_update_conversation_unread'
      and not t.tgisinternal
  ) then
    execute 'create trigger messages_after_insert_update_conversation_unread
      after insert on public.messages
      for each row
      execute function public.on_message_insert_update_conversation_and_unread()';
  end if;
end $$;

-- 3) Quick sanity check: the RPC exists and returns rows for the current user (if any)
select * from public.get_my_message_threads(5);