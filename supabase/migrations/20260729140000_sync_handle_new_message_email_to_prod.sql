-- Sync handle_new_message_email in tracked migrations to the live production
-- definition.
--
-- Production's handle_new_message_email had been hot-patched directly in the DB
-- to a version that is better than what the tracked migrations produced (and
-- better than 20260723120000_notify_new_message_unless_archived.sql): it gates on
-- a status BLOCKLIST (archived/closed/blocked/inactive/resolved) rather than a
-- single status, notifies EVERY counterparty participant (not just one), sets an
-- explicit search_path, and gives net.http_post a 15s timeout.
--
-- The tracked migrations had diverged from that, so a fresh `db reset` (or any
-- future migration apply against prod) would have DOWNGRADED the function. This
-- migration recreates it to match production verbatim, so repo == prod and
-- re-applying is a no-op. It supersedes the definition in 20260723120000.
-- (Production already runs this exact body, so nothing changes there.)

create or replace function public.handle_new_message_email()
returns trigger
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'extensions', 'auth'
as $function$
declare
  recipient record;
  recipient_user_id uuid;
  fn_url text;
  svc_key text;
  convo_status text;
  convo_status_norm text;
begin
  if new.sender_user_id is null then
    return new;
  end if;

  select c.status
    into convo_status
  from public.conversations c
  where c.id = new.conversation_id;

  convo_status_norm := lower(trim(coalesce(convo_status, '')));

  if convo_status_norm in ('archived', 'closed', 'blocked', 'inactive', 'resolved') then
    return new;
  end if;

  svc_key := public.get_service_role_key();
  if svc_key is null or length(svc_key) = 0 then
    raise warning 'handle_new_message_email: missing service role key';
    return new;
  end if;

  fn_url := rtrim(trim(public.supabase_url()), '/') || '/functions/v1/new-message-notification';

  for recipient in
    select cp.user_id
    from public.conversation_participants cp
    where cp.conversation_id = new.conversation_id
      and cp.user_id is not null
      and cp.user_id <> new.sender_user_id
  loop
    recipient_user_id := recipient.user_id;

    perform net.http_post(
      url := fn_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || svc_key
      ),
      body := jsonb_build_object(
        'message_id', new.id,
        'recipient_user_id', recipient_user_id
      ),
      timeout_milliseconds := 15000
    );
  end loop;

  return new;
exception
  when others then
    raise warning 'handle_new_message_email exception for message %: %', new.id, sqlerrm;
    return new;
end;
$function$;

-- Ensure the trigger is present and points at the function (idempotent).
drop trigger if exists on_message_insert_send_email on public.messages;
create trigger on_message_insert_send_email
after insert on public.messages
for each row execute function public.handle_new_message_email();
