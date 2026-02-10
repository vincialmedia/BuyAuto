alter table public.models add column if not exists source text;
alter table public.variants add column if not exists source text;
alter table public.vehicle_aliases add column if not exists source text;