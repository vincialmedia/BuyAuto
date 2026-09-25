-- Bookkeeping for listing translations (fr / it / en): one row per listing and
-- language, recording the latest attempt for a given source text. The listing
-- page and the nightly cron claim a translation here before paying for a model
-- call, so parallel requests don't translate the same text twice, and a text
-- that keeps failing is retried with backoff instead of on every page view.
-- Server-side only: RLS on, no policies (the service role bypasses RLS).
create table if not exists public.listing_translation_attempts (
  listing_id uuid not null references public.listings(id) on delete cascade,
  locale text not null check (locale in ('fr', 'it', 'en')),
  source_hash text not null,
  attempts integer not null default 1,
  last_attempt_at timestamptz not null default now(),
  last_error text,
  primary key (listing_id, locale)
);

alter table public.listing_translation_attempts enable row level security;

-- True when the caller may translate now: first attempt for this text, the
-- text changed since the last attempt, or the previous attempt for the same
-- text is older than its backoff (1 h, 4 h, 16 h, ~2.7 days, then weekly).
-- A successful translation keeps its row; the caller only claims when no
-- fresh translation exists, so a finished text is never claimed again.
create or replace function public.claim_listing_translation(p_listing_id uuid, p_locale text, p_source_hash text)
returns boolean
language sql
volatile
set search_path = ''
as $$
  with claimed as (
    insert into public.listing_translation_attempts as a (listing_id, locale, source_hash, attempts, last_attempt_at, last_error)
    values (p_listing_id, p_locale, p_source_hash, 1, now(), null)
    on conflict (listing_id, locale) do update
      set attempts = case when a.source_hash = excluded.source_hash then a.attempts + 1 else 1 end,
          source_hash = excluded.source_hash,
          last_attempt_at = now(),
          last_error = null
      where a.source_hash is distinct from excluded.source_hash
         or a.last_attempt_at < now() - least(interval '7 days', interval '15 minutes' * power(4, least(a.attempts, 6)))
    returning 1
  )
  select exists (select 1 from claimed)
$$;

revoke all on function public.claim_listing_translation(uuid, text, text) from public, anon, authenticated;
grant execute on function public.claim_listing_translation(uuid, text, text) to service_role;
