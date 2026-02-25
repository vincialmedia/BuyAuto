begin;

do $$
declare
  enum_schema text;
  enum_name text;
  has_archived boolean;
begin
  select tn.nspname, t.typname
  into enum_schema, enum_name
  from pg_attribute a
  join pg_class c on c.oid = a.attrelid
  join pg_namespace cn on cn.oid = c.relnamespace
  join pg_type t on t.oid = a.atttypid
  join pg_namespace tn on tn.oid = t.typnamespace
  where cn.nspname = 'public'
    and c.relname = 'listings'
    and a.attname = 'status';

  if enum_name is null then
    raise exception 'Could not resolve enum type for public.listings.status';
  end if;

  select exists (
    select 1
    from pg_enum e
    join pg_type t2 on t2.oid = e.enumtypid
    join pg_namespace n2 on n2.oid = t2.typnamespace
    where n2.nspname = enum_schema
      and t2.typname = enum_name
      and e.enumlabel = 'archived'
  )
  into has_archived;

  if not has_archived then
    execute format('alter type %I.%I add value %L', enum_schema, enum_name, 'archived');
  end if;
end $$;

create or replace view public.listings_public as
select *
from public.listings
where status = 'published'
  and (expires_at is null or expires_at > now());

create or replace function public.set_listing_expires_at()
returns trigger
language plpgsql
as $$
declare
  base_ts timestamptz;
begin
  if new.duration_days is null then
    new.expires_at := null;
    return new;
  end if;

  if new.expires_at is not null then
    return new;
  end if;

  if tg_op = 'UPDATE'
     and (old.status is distinct from new.status)
     and new.status in ('published','active') then
    base_ts := now();
  elsif tg_op = 'INSERT'
        and new.status in ('published','active') then
    base_ts := now();
  else
    base_ts := coalesce(new.created_at, now());
  end if;

  new.expires_at := base_ts + make_interval(days => new.duration_days);
  return new;
end;
$$;

drop trigger if exists set_listing_expires_at_trigger on public.listings;

create trigger set_listing_expires_at_trigger
before insert or update of status, duration_days, expires_at on public.listings
for each row
execute function public.set_listing_expires_at();

update public.listings
set expires_at = created_at + make_interval(days => duration_days)
where expires_at is null
  and duration_days is not null
  and status in ('published','active','pending');

update public.listings
set status = 'archived',
    archived_at = coalesce(archived_at, now())
where status::text = 'expired';

update public.listings
set status = 'archived',
    archived_at = coalesce(archived_at, now())
where status in ('published','active')
  and expires_at is not null
  and expires_at <= now();

commit;

select
  count(*) filter (where status = 'published') as published_total,
  count(*) filter (where status = 'published' and expires_at is not null and expires_at <= now()) as published_but_expired_should_be_zero,
  count(*) filter (where status = 'archived') as archived_total
from public.listings;