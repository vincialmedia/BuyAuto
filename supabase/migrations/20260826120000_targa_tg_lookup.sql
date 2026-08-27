-- Swiss TARGA type-approval (Typengenehmigung) lookup tables.
-- Source: Bundesamt für Strassen ASTRA – TARGA Typengenehmigungen (OGD)
-- https://opendata.astra.admin.ch/ivzod/2000-Typengenehmigungen_TG_TARGA/
-- One TG-Nr (field 24 of the Fahrzeugausweis, e.g. 1TD812) can span multiple
-- rows (one per transmission/variant), so tg_nr is indexed but NOT unique.

create table if not exists public.tg_vehicle_types (
  id bigint generated always as identity primary key,
  tg_nr text not null,
  variante text,
  marke text,
  typ text,
  fahrzeugart text,
  karosserieform text,
  karosserieform_code text,
  treibstoff text,
  hubraum_ccm integer,
  leistung_kw numeric,
  getriebe text,
  motor_marke text,
  motor_typ text,
  vmax_kmh integer,
  tg_erteilt date,
  raw jsonb not null,
  source_updated_at timestamptz,
  ingested_at timestamptz default now()
);

create index if not exists tg_vehicle_types_tg_nr_idx
  on public.tg_vehicle_types (tg_nr);

-- Bookkeeping for ingest runs (Last-Modified change detection + audit).
create table if not exists public.tg_ingest_runs (
  id bigint generated always as identity primary key,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  rows integer,
  source_last_modified text,
  status text not null default 'running'
);

alter table public.tg_vehicle_types enable row level security;
alter table public.tg_ingest_runs enable row level security;

-- Public read on the lookup data; writes only via service role (bypasses RLS).
drop policy if exists "Public read tg_vehicle_types" on public.tg_vehicle_types;
create policy "Public read tg_vehicle_types"
  on public.tg_vehicle_types
  for select
  to anon, authenticated
  using (true);

-- tg_ingest_runs: no policies — service role only.
