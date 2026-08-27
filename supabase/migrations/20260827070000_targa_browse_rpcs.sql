-- Browse helpers for the TARGA test page (/tg-test): distinct makes and
-- distinct types per make, each with variant counts. Runs as invoker, so the
-- public-read RLS policy on tg_vehicle_types applies.

create index if not exists tg_vehicle_types_marke_typ_idx
  on public.tg_vehicle_types (marke, typ);

create or replace function public.tg_distinct_makes()
returns table(marke text, variant_count bigint)
language sql
stable
set search_path = ''
as $$
  select marke, count(*)
  from public.tg_vehicle_types
  where marke is not null
  group by marke
  order by marke
$$;

create or replace function public.tg_distinct_typs(p_marke text)
returns table(typ text, variant_count bigint)
language sql
stable
set search_path = ''
as $$
  select typ, count(*)
  from public.tg_vehicle_types
  where marke = p_marke and typ is not null
  group by typ
  order by typ
$$;
