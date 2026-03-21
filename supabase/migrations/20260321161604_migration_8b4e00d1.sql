-- 1) Log table for idempotency across all reminder/notification emails
create table if not exists public.email_notification_log (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  entity_id uuid null,
  message_id uuid null,
  recipient_user_id uuid null,
  recipient_email text null,
  days_before integer null,
  created_at timestamp with time zone not null default now(),
  constraint email_notification_log_has_target check (entity_id is not null or message_id is not null)
);

create unique index if not exists email_notification_log_listing_reminder_uniq
  on public.email_notification_log (kind, entity_id, days_before, recipient_user_id)
  where kind in ('listing_expiry_reminder','trial_expiry_reminder') and entity_id is not null and days_before is not null;

create unique index if not exists email_notification_log_message_uniq
  on public.email_notification_log (kind, message_id, recipient_user_id)
  where kind = 'new_message' and message_id is not null and recipient_user_id is not null;

alter table public.email_notification_log enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'email_notification_log' and policyname = 'Service role only'
  ) then
    execute 'create policy "Service role only" on public.email_notification_log
      for all
      using (auth.role() = ''service_role'')
      with check (auth.role() = ''service_role'')';
  end if;
end$$;

-- 2) New Message email trigger -> Edge Function
create or replace function public.handle_new_message_email()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  recipient record;
  fn_url text;
  svc_key text;
begin
  svc_key := public.get_service_role_key();
  fn_url := public.supabase_url() || '/functions/v1/new-message-notification';

  for recipient in
    select cp.user_id
    from public.conversation_participants cp
    where cp.conversation_id = new.conversation_id
      and cp.user_id is not null
      and cp.user_id <> new.sender_user_id
  loop
    perform net.http_post(
      url := fn_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || svc_key
      ),
      body := jsonb_build_object(
        'message_id', new.id,
        'recipient_user_id', recipient.user_id
      )
    );
  end loop;

  return new;
end;
$$;

drop trigger if exists on_message_insert_send_email on public.messages;
create trigger on_message_insert_send_email
after insert on public.messages
for each row
execute function public.handle_new_message_email();

-- 3) Ensure listing status notifications also cover "archived" (expiry/job based)
create or replace function public.handle_listing_status_change()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  fn_url text;
  svc_key text;
  new_status text;
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  if new.status is not distinct from old.status then
    return new;
  end if;

  new_status := new.status::text;

  if new_status not in ('published', 'rejected', 'archived') then
    return new;
  end if;

  svc_key := public.get_service_role_key();
  fn_url := public.supabase_url() || '/functions/v1/listing-status-notification';

  perform net.http_post(
    url := fn_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || svc_key
    ),
    body := jsonb_build_object(
      'record', to_jsonb(new),
      'old_record', to_jsonb(old),
      'notification_status', new_status
    )
  );

  return new;
end;
$$;

-- 4) Daily cron jobs for reminders (3 & 7 days are handled inside each function)
do $$
declare
  cmd_listing text;
  cmd_trial text;
begin
  cmd_listing := $cmd$
    select net.http_post(
      url := public.supabase_url() || '/functions/v1/listing-expiry-reminder',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || public.get_service_role_key()
      ),
      body := '{}'::jsonb
    );
  $cmd$;

  cmd_trial := $cmd$
    select net.http_post(
      url := public.supabase_url() || '/functions/v1/trial-expiry-reminder',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || public.get_service_role_key()
      ),
      body := '{}'::jsonb
    );
  $cmd$;

  if not exists (select 1 from cron.job where jobname = 'listing-expiry-reminders-daily') then
    perform cron.schedule('listing-expiry-reminders-daily', '5 7 * * *', cmd_listing);
  end if;

  if not exists (select 1 from cron.job where jobname = 'trial-expiry-reminders-daily') then
    perform cron.schedule('trial-expiry-reminders-daily', '10 7 * * *', cmd_trial);
  end if;
end$$;