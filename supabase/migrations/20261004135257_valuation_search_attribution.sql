-- Make every Eintauschwert-Rechner search attributable, so "how many people
-- used the calculator, for which cars, and how many hit the sign-up wall" is a
-- query instead of forensics. Until now a row held only the vehicle and the
-- search funnel: no user, no visitor, no page, no environment, and preview
-- builds (which write to this production table) were indistinguishable from
-- real visitors.
--
-- New columns:
--   status        'ok' (search ran) | 'search_failed' (Firecrawl key/credits)
--                 | 'gate_anon' | 'gate_free' | 'gate_paid' (a search was
--                 blocked by the anonymous / free / paid limit: the sign-up
--                 and upgrade moments)
--   source        'public' | 'dashboard' | 'embed' | 'other' (sent by the page)
--   embed_garage  the ?garage= slug of an embed
--   env           VERCEL_ENV of the build that wrote the row ('local' off Vercel)
--   user_id       the signed-in user, if any
--   visitor_id    random per-browser UUID; only sent after analytics consent
--   visitor_hash  sha256(daily salt || IP || user agent). The raw IP is never
--                 stored. A pg_cron job replaces the salt at 00:00 UTC, so a
--                 hash only groups one browser's searches within a day and
--                 can't be traced back to an IP from the database afterwards.
--                 Works without consent and in embeds.
--   is_internal   admin account or a browser flagged ba_no_track / arriving
--                 from vercel.com (the same rules GA4 uses)
--
-- Retention: a second pg_cron job strips user_id, visitor_id and visitor_hash
-- from rows older than 12 months; vehicle and funnel stay for statistics.
--
-- Distinct real people: see docs/valuation-search-logs.md.
--
-- Logging moves to log_valuation_event(), callable by service_role only: the
-- API routes call it with the service key. The old log_valuation_search() is
-- executable by anon, so anyone holding the public anon key can insert rows;
-- 20261004160100_drop_legacy_log_valuation_search drops it once the new code
-- is deployed (dropping it earlier would stop logging from the old deploy).

alter table public.valuation_search_logs
  add column if not exists status       text    not null default 'ok',
  add column if not exists source       text,
  add column if not exists embed_garage text,
  add column if not exists env          text,
  add column if not exists user_id      uuid references auth.users(id) on delete set null,
  add column if not exists visitor_id   uuid,
  add column if not exists visitor_hash text,
  add column if not exists is_internal  boolean not null default false;

-- Gate rows have no search funnel.
alter table public.valuation_search_logs alter column funnel drop not null;

alter table public.valuation_search_logs
  drop constraint if exists valuation_search_logs_status_check,
  add constraint valuation_search_logs_status_check
    check (status in ('ok', 'search_failed', 'gate_anon', 'gate_free', 'gate_paid')),
  drop constraint if exists valuation_search_logs_source_check,
  add constraint valuation_search_logs_source_check
    check (source is null or source in ('public', 'dashboard', 'embed', 'other')),
  drop constraint if exists valuation_search_logs_env_check,
  add constraint valuation_search_logs_env_check
    check (env is null or env in ('production', 'preview', 'development', 'local')),
  drop constraint if exists valuation_search_logs_embed_garage_check,
  add constraint valuation_search_logs_embed_garage_check
    check (embed_garage is null or char_length(embed_garage) <= 80),
  drop constraint if exists valuation_search_logs_visitor_hash_check,
  add constraint valuation_search_logs_visitor_hash_check
    check (visitor_hash is null or visitor_hash ~ '^[0-9a-f]{64}$');

create index if not exists valuation_search_logs_created_at_idx
  on public.valuation_search_logs (created_at);
create index if not exists valuation_search_logs_visitor_hash_idx
  on public.valuation_search_logs (visitor_hash) where visitor_hash is not null;

-- Server-only tables: RLS on with no policies already hides them; drop the
-- default client grants as well.
revoke all on table public.valuation_search_logs from anon, authenticated;

-- One row: today's salt (see the rotation job below).
create table if not exists public.valuation_visitor_salt (
  id   boolean primary key default true check (id),
  day  date    not null,
  salt bytea   not null
);
alter table public.valuation_visitor_salt enable row level security;
revoke all on table public.valuation_visitor_salt from anon, authenticated;

create or replace function public.log_valuation_event(
  p_status       text,
  p_vehicle      jsonb,
  p_funnel       jsonb,
  p_source       text,
  p_embed_garage text,
  p_env          text,
  p_user_id      uuid,
  p_visitor_id   uuid,
  p_ip           text,
  p_user_agent   text,
  p_is_internal  boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_day  date := (now() at time zone 'utc')::date;
  v_salt bytea;
  v_hash text;
begin
  if nullif(p_ip, '') is not null then
    -- Creates the salt on the first log of a day if the rotation job hasn't.
    insert into public.valuation_visitor_salt as s (id, day, salt)
    values (true, v_day, extensions.gen_random_bytes(32))
    on conflict (id) do update
      set day = excluded.day, salt = excluded.salt
      where s.day < excluded.day;
    select salt into v_salt from public.valuation_visitor_salt where day = v_day;
    v_hash := encode(
      extensions.digest(v_salt || convert_to(p_ip || '|' || coalesce(p_user_agent, ''), 'UTF8'), 'sha256'),
      'hex'
    );
  end if;

  -- Gate rows are reported by the browser without authentication: cap them
  -- per visitor and day so a script can't flood the counts.
  if p_status like 'gate%' and v_hash is not null and (
    select count(*) from public.valuation_search_logs
    where visitor_hash = v_hash and status like 'gate%'
      and created_at >= v_day::timestamp at time zone 'utc'
  ) >= 10 then
    return;
  end if;

  insert into public.valuation_search_logs
    (status, vehicle, funnel, source, embed_garage, env, user_id, visitor_id, visitor_hash, is_internal)
  values
    (coalesce(p_status, 'ok'), coalesce(p_vehicle, '{}'::jsonb), p_funnel, p_source,
     p_embed_garage, p_env, p_user_id, p_visitor_id, v_hash, coalesce(p_is_internal, false));
end;
$$;

revoke all on function public.log_valuation_event(text, jsonb, jsonb, text, text, text, uuid, uuid, text, text, boolean)
  from public, anon, authenticated;
grant execute on function public.log_valuation_event(text, jsonb, jsonb, text, text, text, uuid, uuid, text, text, boolean)
  to service_role;

-- Replace the salt at 00:00 UTC whether or not anyone searches that day, so
-- yesterday's hashes stop being reproducible on schedule, not on traffic.
-- (cron.schedule with an existing job name updates that job.)
select cron.schedule(
  'valuation-visitor-salt-rotate',
  '0 0 * * *',
  $$update public.valuation_visitor_salt
    set day = (now() at time zone 'utc')::date, salt = extensions.gen_random_bytes(32)
    where day < (now() at time zone 'utc')::date$$
);

-- Retention: after 12 months a row keeps only the car and the search funnel.
select cron.schedule(
  'valuation-search-logs-pseudonymise',
  '25 3 * * *',
  $$update public.valuation_search_logs
    set user_id = null, visitor_id = null, visitor_hash = null
    where created_at < now() - interval '12 months'
      and (user_id is not null or visitor_id is not null or visitor_hash is not null)$$
);

-- The rows logged before this migration (ids 2–33) were labelled once, outside
-- the migration (row ids are environment-specific); see
-- docs/valuation-search-logs.md.
