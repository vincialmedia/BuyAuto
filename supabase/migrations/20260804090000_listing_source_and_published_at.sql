-- Attribution + substantiation columns for marketplace stats.
-- "source" stores the seller's answer to "Wie hast du uns gefunden?" (optional).
-- "published_at" records the first moment a listing went live, so premium
-- performance claims can eventually be backed by real time-to-sale data.
alter table public.listings add column if not exists source text;
alter table public.listings add column if not exists published_at timestamptz;

-- Stamp the first transition to published server-side, so every publish path
-- (moderation approval, garage direct publish, relist) records it without any
-- client involvement.
create or replace function public.set_listing_published_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_listings_set_published_at on public.listings;
create trigger trg_listings_set_published_at
before insert or update of status on public.listings
for each row
execute function public.set_listing_published_at();

-- Backfill rows that are demonstrably live now or were sold from live.
-- created_at is the closest known stand-in for their go-live time. Archived
-- rows are left null: moderation-declined ones were never live, and the rest
-- cannot be distinguished retroactively.
update public.listings
set published_at = created_at
where published_at is null
  and status in ('published', 'sold');
