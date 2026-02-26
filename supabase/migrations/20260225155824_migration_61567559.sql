-- 2) Ensure new listings always get an expiry when they get published (if not unlimited)
create or replace function public.ensure_listing_expiry_defaults()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  plan text;
  duration integer;
begin
  if (new.status)::text <> 'published' then
    return new;
  end if;

  if new.expires_at is not null then
    return new;
  end if;

  plan := coalesce(new.pricing_plan, new.price_plan, 'standard');

  if plan = 'unlimited' then
    new.duration_days := null;
    new.expires_at := null;
    return new;
  end if;

  if new.duration_days is null then
    if plan = 'extended' then
      duration := 90;
    elsif plan in ('free30','premium30') then
      duration := 30;
    else
      duration := 60;
    end if;

    new.duration_days := duration;
  else
    duration := new.duration_days;
  end if;

  if duration is not null then
    new.expires_at := now() + make_interval(days => duration);
  end if;

  return new;
end;
$$;

drop trigger if exists on_listing_published_set_expiry on public.listings;

create trigger on_listing_published_set_expiry
before update of status on public.listings
for each row
when (((new.status)::text = 'published') and ((new.status)::text is distinct from (old.status)::text))
execute function public.ensure_listing_expiry_defaults();