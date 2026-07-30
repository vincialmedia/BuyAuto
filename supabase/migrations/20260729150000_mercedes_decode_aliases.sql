-- VIN decodes for Mercedes arrive with the pre-2014 badge order the provider
-- (and most of the world) still uses: model "G", trim "G 63 AMG" / "AMG G63".
-- The catalog names those models "AMG G 63" and the plain family "G-Class",
-- so nothing resolved and the decode produced make-only autofill.
--
-- Three alias sets close the gap; the decode endpoint tries the trim against
-- model aliases before falling back to the family name.

begin;

-- 1. The bare family "G" is the G-Class.
insert into public.vehicle_aliases (entity_type, make_id, model_id, alias, normalized_alias, source)
select 'model', mk.id, mo.id, 'G', public.normalize_vehicle_name('G'), 'vincario'
from public.makes mk
join public.models mo on mo.make_id = mk.id and mo.is_active
where mk.name = 'Mercedes' and mo.name = 'G-Class'
  and not exists (
    select 1 from public.vehicle_aliases a
    where a.entity_type = 'model' and a.make_id = mk.id
      and a.normalized_alias = public.normalize_vehicle_name('G'));

-- 2. Reversed badge for every "AMG X NN" model: "X NN AMG" -> "AMG X NN".
--    (The compact "AMG G63" form already normalizes to the model's own key.)
insert into public.vehicle_aliases (entity_type, make_id, model_id, alias, normalized_alias, source)
select 'model', mo.make_id, mo.id,
       regexp_replace(mo.name, '^AMG (.*)$', '\1 AMG'),
       public.normalize_vehicle_name(regexp_replace(mo.name, '^AMG (.*)$', '\1 AMG')),
       'vincario'
from public.models mo
join public.makes mk on mk.id = mo.make_id and mk.name = 'Mercedes'
where mo.is_active and mo.name ~ '^AMG [A-Z]+ ?[0-9]+$'
  and not exists (
    select 1 from public.vehicle_aliases a
    where a.entity_type = 'model' and a.make_id = mo.make_id
      and a.normalized_alias = public.normalize_vehicle_name(regexp_replace(mo.name, '^AMG (.*)$', '\1 AMG')))
  and not exists (
    select 1 from public.models x
    where x.make_id = mo.make_id and x.is_active
      and x.normalized_name = public.normalize_vehicle_name(regexp_replace(mo.name, '^AMG (.*)$', '\1 AMG')));

-- 3. Where an AMG model has exactly ONE variant, the reversed badge names that
--    variant too ("G 63 AMG" -> the AMG G 63's "G 63 4MATIC"), so the decode
--    lands the full make -> model -> variant chain. Ambiguous models (C 63 has
--    S and E Performance steps) get no variant alias — the seller picks.
insert into public.vehicle_aliases (entity_type, model_id, variant_id, alias, normalized_alias, source)
select 'variant', mo.id, v.id,
       regexp_replace(mo.name, '^AMG (.*)$', '\1 AMG'),
       public.normalize_vehicle_name(regexp_replace(mo.name, '^AMG (.*)$', '\1 AMG')),
       'vincario'
from public.models mo
join public.makes mk on mk.id = mo.make_id and mk.name = 'Mercedes'
join public.variants v on v.model_id = mo.id
where mo.is_active and mo.name ~ '^AMG [A-Z]+ ?[0-9]+$'
  and (select count(*) from public.variants v2 where v2.model_id = mo.id) = 1
on conflict (model_id, normalized_alias) where entity_type = 'variant' do nothing;

commit;
