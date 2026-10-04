-- Diagnostic funnel log for /api/valuation/comps. Written server-side via the
-- SECURITY DEFINER RPC below; not readable by clients (RLS enabled, no
-- policies), so it leaks nothing and cannot be queried from the browser.
--
-- Applied to prod on 2026-07-28 straight from the PR #15 branch and never
-- committed; restored here verbatim from supabase_migrations.schema_migrations
-- so the repo can rebuild the schema. 20261004135257_valuation_search_attribution
-- builds on it.
create table if not exists public.valuation_search_logs (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  vehicle jsonb not null,
  funnel jsonb not null
);

alter table public.valuation_search_logs enable row level security;

-- Write-only entry point for the API route (anon + authenticated sessions).
create or replace function public.log_valuation_search(p_vehicle jsonb, p_funnel jsonb)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.valuation_search_logs (vehicle, funnel)
  values (p_vehicle, p_funnel);
$$;

revoke all on function public.log_valuation_search(jsonb, jsonb) from public;
grant execute on function public.log_valuation_search(jsonb, jsonb) to anon, authenticated;
