-- Fix: ensure each message triggers at most one email per recipient, and we only send for active conversations.
-- Also harden auth header usage and add basic exception logging.

create or replace function public.handle_new_message_email()
returns trigger
language plpgsql
security definer
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

  -- Only notify for active conversations (avoid emails for archived/closed threads)
  select c.status
    into convo_status
  from public.conversations c
  where c.id = new.conversation_id;

  if convo_status is not null and convo_status <> 'active' then
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

-- Ensure trigger points to the correct function (idempotent)
drop trigger if exists on_message_insert_send_email on public.messages;
create trigger on_message_insert_send_email
after insert on public.messages
for each row execute function public.handle_new_message_email();