-- Ensure unread_count isn't incorrectly set to total message count.
-- 1) Recreate trigger function to increment unread_count only for recipients.
create or replace function public.handle_new_message_unread()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
    set last_message_at = new.created_at
  where id = new.conversation_id;

  update public.conversation_participants cp
    set unread_count = cp.unread_count + 1
  where cp.conversation_id = new.conversation_id
    and cp.user_id <> new.sender_user_id;

  return new;
end;
$$;

-- 2) Ensure trigger exists and points to the correct function
drop trigger if exists trg_messages_unread on public.messages;
create trigger trg_messages_unread
after insert on public.messages
for each row execute function public.handle_new_message_unread();

-- 3) Mark read RPC sets unread_count=0 for viewer
create or replace function public.mark_conversation_read(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversation_participants
    set unread_count = 0,
        last_read_at = now()
  where conversation_id = p_conversation_id
    and user_id = auth.uid();
end;
$$;

-- 4) Unread count RPC sums unread_count
create or replace function public.get_my_unread_message_count()
returns integer
language sql
security definer
set search_path = public
as $$
  select coalesce(sum(cp.unread_count), 0)::integer
  from public.conversation_participants cp
  where cp.user_id = auth.uid();
$$;

-- 5) Fix existing data: set unread_count based on last_read_at, but never count sender's own messages.
-- We'll set unread_count = count(messages newer than last_read_at) for each participant.
with cp as (
  select conversation_id, user_id, coalesce(last_read_at, 'epoch'::timestamptz) as last_read_at
  from public.conversation_participants
),
counts as (
  select
    cp.conversation_id,
    cp.user_id,
    count(m.*)::integer as unread
  from cp
  join public.messages m on m.conversation_id = cp.conversation_id
  where m.created_at > cp.last_read_at
    and m.sender_user_id <> cp.user_id
  group by cp.conversation_id, cp.user_id
)
update public.conversation_participants p
set unread_count = coalesce(c.unread, 0)
from counts c
where p.conversation_id = c.conversation_id
  and p.user_id = c.user_id;

update public.conversation_participants p
set unread_count = 0
where unread_count < 0;