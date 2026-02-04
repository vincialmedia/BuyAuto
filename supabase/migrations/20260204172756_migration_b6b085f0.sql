create extension if not exists pgcrypto with schema extensions;
create extension if not exists unaccent with schema extensions;

create or replace function public.normalize_vehicle_name(input text)
returns text
language sql
immutable
as $$
  select regexp_replace(
    extensions.unaccent(lower(trim(coalesce(input, '')))),
    '[^a-z0-9]+',
    '',
    'g'
  );
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.makes (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null,
  normalized_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.models (
  id uuid primary key default extensions.gen_random_uuid(),
  make_id uuid not null references public.makes(id) on delete restrict,
  name text not null,
  normalized_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.variants (
  id uuid primary key default extensions.gen_random_uuid(),
  model_id uuid not null references public.models(id) on delete restrict,
  name text not null,
  normalized_name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vehicle_aliases (
  id uuid primary key default extensions.gen_random_uuid(),
  entity_type text not null,
  make_id uuid null references public.makes(id) on delete cascade,
  model_id uuid null references public.models(id) on delete cascade,
  variant_id uuid null references public.variants(id) on delete cascade,
  alias text not null,
  normalized_alias text not null,
  source text not null default 'manual',
  created_at timestamptz not null default now()
);

alter table public.vehicle_aliases
  drop constraint if exists vehicle_aliases_entity_type_check;

alter table public.vehicle_aliases
  add constraint vehicle_aliases_entity_type_check
  check (entity_type in ('make', 'model', 'variant'));

alter table public.vehicle_aliases
  drop constraint if exists vehicle_aliases_entity_requirements_check;

alter table public.vehicle_aliases
  add constraint vehicle_aliases_entity_requirements_check
  check (
    (entity_type = 'make' and make_id is not null and model_id is null and variant_id is null) or
    (entity_type = 'model' and make_id is not null and model_id is not null and variant_id is null) or
    (entity_type = 'variant' and model_id is not null and variant_id is not null)
  );

create unique index if not exists makes_normalized_name_key
  on public.makes(normalized_name);

create unique index if not exists models_make_id_normalized_name_key
  on public.models(make_id, normalized_name);

create unique index if not exists variants_model_id_normalized_name_key
  on public.variants(model_id, normalized_name);

create unique index if not exists vehicle_aliases_make_normalized_alias_key
  on public.vehicle_aliases(normalized_alias)
  where entity_type = 'make';

create unique index if not exists vehicle_aliases_model_make_id_normalized_alias_key
  on public.vehicle_aliases(make_id, normalized_alias)
  where entity_type = 'model';

create unique index if not exists vehicle_aliases_variant_model_id_normalized_alias_key
  on public.vehicle_aliases(model_id, normalized_alias)
  where entity_type = 'variant';

create or replace function public.makes_apply_normalized_name()
returns trigger
language plpgsql
as $$
begin
  new.normalized_name = public.normalize_vehicle_name(new.name);
  return new;
end;
$$;

create or replace function public.models_apply_normalized_name()
returns trigger
language plpgsql
as $$
begin
  new.normalized_name = public.normalize_vehicle_name(new.name);
  return new;
end;
$$;

create or replace function public.variants_apply_normalized_name()
returns trigger
language plpgsql
as $$
begin
  new.normalized_name = public.normalize_vehicle_name(new.name);
  return new;
end;
$$;

create or replace function public.vehicle_aliases_apply_normalized_alias()
returns trigger
language plpgsql
as $$
begin
  new.normalized_alias = public.normalize_vehicle_name(new.alias);
  return new;
end;
$$;

drop trigger if exists trg_makes_updated_at on public.makes;
create trigger trg_makes_updated_at
before update on public.makes
for each row execute function public.set_updated_at();

drop trigger if exists trg_models_updated_at on public.models;
create trigger trg_models_updated_at
before update on public.models
for each row execute function public.set_updated_at();

drop trigger if exists trg_variants_updated_at on public.variants;
create trigger trg_variants_updated_at
before update on public.variants
for each row execute function public.set_updated_at();

drop trigger if exists trg_makes_normalized_name on public.makes;
create trigger trg_makes_normalized_name
before insert or update on public.makes
for each row execute function public.makes_apply_normalized_name();

drop trigger if exists trg_models_normalized_name on public.models;
create trigger trg_models_normalized_name
before insert or update on public.models
for each row execute function public.models_apply_normalized_name();

drop trigger if exists trg_variants_normalized_name on public.variants;
create trigger trg_variants_normalized_name
before insert or update on public.variants
for each row execute function public.variants_apply_normalized_name();

drop trigger if exists trg_vehicle_aliases_normalized_alias on public.vehicle_aliases;
create trigger trg_vehicle_aliases_normalized_alias
before insert or update on public.vehicle_aliases
for each row execute function public.vehicle_aliases_apply_normalized_alias();

insert into public.makes (name, normalized_name)
select
  min(vc.make) as name,
  public.normalize_vehicle_name(vc.make) as normalized_name
from public.vehicle_catalog vc
where vc.make is not null and trim(vc.make) <> ''
group by public.normalize_vehicle_name(vc.make)
on conflict (normalized_name) do nothing;

with src as (
  select
    public.normalize_vehicle_name(make) as make_norm,
    public.normalize_vehicle_name(model) as model_norm,
    min(model) as display_model
  from public.vehicle_catalog
  where make is not null and trim(make) <> ''
    and model is not null and trim(model) <> ''
  group by make_norm, model_norm
)
insert into public.models (make_id, name, normalized_name)
select mk.id, src.display_model, src.model_norm
from src
join public.makes mk on mk.normalized_name = src.make_norm
on conflict (make_id, normalized_name) do nothing;

alter table public.makes enable row level security;
alter table public.models enable row level security;
alter table public.variants enable row level security;
alter table public.vehicle_aliases enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'makes' and policyname = 'Public read'
  ) then
    create policy "Public read" on public.makes for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'models' and policyname = 'Public read'
  ) then
    create policy "Public read" on public.models for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'variants' and policyname = 'Public read'
  ) then
    create policy "Public read" on public.variants for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'vehicle_aliases' and policyname = 'Public read'
  ) then
    create policy "Public read" on public.vehicle_aliases for select using (true);
  end if;
end $$;

create or replace function public.resolve_make_id(p_make_text text)
returns uuid
language sql
stable
as $$
  with input as (
    select public.normalize_vehicle_name(p_make_text) as norm
  )
  select m.id
  from public.makes m, input i
  where m.normalized_name = i.norm

  union all

  select va.make_id
  from public.vehicle_aliases va, input i
  where va.entity_type = 'make'
    and va.normalized_alias = i.norm
  limit 1;
$$;

create or replace function public.resolve_model_id(p_make_id uuid, p_model_text text)
returns uuid
language sql
stable
as $$
  with input as (
    select public.normalize_vehicle_name(p_model_text) as norm
  )
  select mo.id
  from public.models mo, input i
  where mo.make_id = p_make_id
    and mo.normalized_name = i.norm

  union all

  select va.model_id
  from public.vehicle_aliases va, input i
  where va.entity_type = 'model'
    and va.make_id = p_make_id
    and va.normalized_alias = i.norm
  limit 1;
$$;

create or replace function public.resolve_variant_id(p_model_id uuid, p_variant_text text)
returns uuid
language sql
stable
as $$
  with input as (
    select public.normalize_vehicle_name(p_variant_text) as norm
  )
  select v.id
  from public.variants v, input i
  where v.model_id = p_model_id
    and v.normalized_name = i.norm

  union all

  select va.variant_id
  from public.vehicle_aliases va, input i
  where va.entity_type = 'variant'
    and va.model_id = p_model_id
    and va.normalized_alias = i.norm
  limit 1;
$$;