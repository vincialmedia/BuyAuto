-- Preflight: helper functions/extensions/triggers (read-only)
select n.nspname, p.proname
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('get_service_role_key', 'supabase_url')
order by p.proname;

select extname
from pg_extension
where extname in ('pg_net', 'pg_cron')
order by extname;

select
  t.tgname as trigger_name,
  pg_get_triggerdef(t.oid) as trigger_def
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'auth'
  and c.relname = 'users'
  and not t.tgisinternal
order by t.tgname;

-- Idempotency for welcome email (email confirmed)
create unique index if not exists email_notification_log_welcome_confirmed_uniq
  on public.email_notification_log (kind, entity_id, recipient_user_id)
  where kind = 'welcome_email_confirmed'
    and entity_id is not null
    and recipient_user_id is not null;

-- Trigger function (create-only; no replace)
do $$
begin
  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'handle_auth_user_email_confirmed'
  ) then
    execute $fn$
      create function public.handle_auth_user_email_confirmed()
      returns trigger
      language plpgsql
      security definer
      set search_path = public, extensions
      as $body$
      declare
        fn_url text;
        svc_key text;
      begin
        if tg_op <> 'UPDATE' then
          return new;
        end if;

        if old.email_confirmed_at is not null then
          return new;
        end if;

        if new.email_confirmed_at is null then
          return new;
        end if;

        svc_key := public.get_service_role_key();
        fn_url := public.supabase_url() || '/functions/v1/welcome-email';

        perform net.http_post(
          url := fn_url,
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || svc_key
          ),
          body := jsonb_build_object(
            'record', to_jsonb(new)
          )
        );

        return new;
      end;
      $body$;
    $fn$;
  end if;
end$$;

-- Trigger (create-only)
do $$
begin
  if not exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'auth'
      and c.relname = 'users'
      and t.tgname = 'on_auth_user_email_confirmed'
      and not t.tgisinternal
  ) then
    execute 'create trigger on_auth_user_email_confirmed
      after update of email_confirmed_at on auth.users
      for each row
      execute function public.handle_auth_user_email_confirmed()';
  end if;
end$$;

-- Verify trigger presence
select
  t.tgname as trigger_name,
  pg_get_triggerdef(t.oid) as trigger_def
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'auth'
  and c.relname = 'users'
  and not t.tgisinternal
order by t.tgname;