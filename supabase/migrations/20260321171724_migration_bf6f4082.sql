create unique index if not exists email_notification_log_listing_status_uniq
  on public.email_notification_log (kind, entity_id, recipient_user_id)
  where kind like 'listing_status_%' and entity_id is not null and recipient_user_id is not null;

do $$
begin
  if not exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'listings'
      and t.tgname = 'on_listing_status_change'
      and not t.tgisinternal
  ) then
    execute 'create trigger on_listing_status_change after update on public.listings for each row execute function public.handle_listing_status_change()';
  end if;
end$$;

select
  t.tgname as trigger_name,
  pg_get_triggerdef(t.oid) as trigger_def
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'listings'
  and not t.tgisinternal
order by t.tgname;