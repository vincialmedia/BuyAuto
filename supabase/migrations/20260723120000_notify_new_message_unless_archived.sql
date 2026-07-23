-- Fix: new-message email notifications were never being sent.
--
-- Root cause: create_or_get_conversation_for_listing inserts every conversation
-- with status 'new', and nothing promotes it to 'active' anymore — the trigger
-- that performed the 'new'->'active' flip (on_message_insert_update_conversation_
-- and_unread) had its status update removed and its triggers dropped by the
-- 2026-03-17 trigger-dedup migration (20260317093035). The surviving message
-- triggers only touch last_message_at / unread_count. Meanwhile the previous
-- handle_new_message_email (20260322123818) only fired net.http_post when the
-- conversation status was exactly 'active', so it silently skipped EVERY message.
-- 'buyer_selected' threads (which stay open for the winning buyer/seller after a
-- sale) were skipped for the same reason.
--
-- New rule: notify for every conversation EXCEPT archived ones. This matches the
-- edge function's own isConversationNotifiable() guard (which blocks only
-- archived/closed/blocked/inactive/resolved) and the write-permission guard
-- _messages_prevent_read_only (which blocks only archived / sold-non-buyer_selected).
--
-- Also restores `set search_path` on this SECURITY DEFINER function, which the
-- 20260322123818 rewrite dropped (Supabase linter: function_search_path_mutable).

create or replace function public.handle_new_message_email()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  recipient_user_id uuid;
  fn_url text;
  svc_key text;
  convo_status text;
begin
  -- Only notify for normal user messages
  if new.sender_user_id is null then
    return new;
  end if;

  -- Notify for new / active / buyer_selected; skip only archived threads.
  select c.status
    into convo_status
  from public.conversations c
  where c.id = new.conversation_id;

  if convo_status = 'archived' then
    return new;
  end if;

  svc_key := public.get_service_role_key();
  if svc_key is null or length(svc_key) = 0 then
    raise warning 'handle_new_message_email: missing service role key';
    return new;
  end if;

  fn_url := public.supabase_url() || '/functions/v1/new-message-notification';

  -- Find exactly one counterparty recipient (exclude sender)
  select cp.user_id
    into recipient_user_id
  from public.conversation_participants cp
  where cp.conversation_id = new.conversation_id
    and cp.user_id is not null
    and cp.user_id <> new.sender_user_id
  order by cp.user_id
  limit 1;

  if recipient_user_id is null then
    raise warning 'handle_new_message_email: no recipient for message %, conversation %', new.id, new.conversation_id;
    return new;
  end if;

  -- Fire-and-forget call to Edge Function
  perform net.http_post(
    url := fn_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || svc_key
    ),
    body := jsonb_build_object(
      'message_id', new.id,
      'recipient_user_id', recipient_user_id
    )
  );

  return new;
exception
  when others then
    raise warning 'handle_new_message_email exception for message %: %', new.id, sqlerrm;
    return new;
end;
$$;

-- Re-point the trigger at the corrected function (idempotent)
drop trigger if exists on_message_insert_send_email on public.messages;
create trigger on_message_insert_send_email
after insert on public.messages
for each row execute function public.handle_new_message_email();
