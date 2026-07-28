#!/usr/bin/env node
/**
 * Seeds the third level of the vehicle hierarchy (make -> model -> variant) from
 * catalog/variants/*.json, adds model rows the source CSV never carried, and repairs
 * rows where a trim was seeded as a model.
 *
 * Modes:
 *   --validate  print SQL listing catalog model keys with no matching models row
 *   --sql       print idempotent SQL to stdout (no credentials needed)
 *   (none)      apply directly using SUPABASE_SERVICE_ROLE_KEY from .env.local
 *
 * Models that share an engine lineup are grouped, so "A4" and "A4 Avant" carry one
 * shared list rather than two copies. The emitted SQL keeps that shape (a models
 * array cross joined against a variants array) instead of expanding to one row per
 * pair, which keeps the payload small enough to apply over the SQL transport.
 *
 * See catalog/variants/README.md for the file format and granularity contract.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CATALOG_DIR = path.resolve(__dirname, '../../catalog/variants');
const SOURCE = 'catalog_variants_v1';

/** Mirrors public.normalize_vehicle_name — used only for in-memory dedupe/validation. */
function normalize(str) {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

const sqlStr = (s) => `'${String(s).replace(/'/g, "''")}'`;
const sqlArr = (xs) => `array[${xs.map(sqlStr).join(',')}]`;

function loadCatalog() {
  const files = fs
    .readdirSync(CATALOG_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort();

  const groups = [];
  const remaps = [];
  const newModels = [];
  const modelKeys = new Map(); // make -> Set(model) for the validation query
  const perModel = new Map(); // "make normalizedmodel" -> Set(normalized variant)
  let pairCount = 0;

  for (const file of files) {
    const raw = JSON.parse(fs.readFileSync(path.join(CATALOG_DIR, file), 'utf-8'));
    const make = raw.make;
    if (!make) throw new Error(`${file}: missing "make"`);
    if (!modelKeys.has(make)) modelKeys.set(make, new Set());

    // Models the CSV never had. BMW is the extreme case: 2/4/6/7/8 Series are absent
    // entirely, because every row for them was imported as a trim ("420d", "740e").
    for (const m of raw.models ?? []) {
      newModels.push({ make, name: m });
      modelKeys.get(make).add(m);
    }

    for (const group of raw.groups ?? []) {
      const models = group.models ?? [];
      const variants = group.variants ?? [];
      if (!models.length || !variants.length) {
        throw new Error(`${file}: group needs non-empty "models" and "variants"`);
      }

      // (model_id, normalized_name) is unique and normalize_vehicle_name drops
      // punctuation, so "3.0 TDI" and "30 TDI" are the same key. ON CONFLICT DO NOTHING
      // would swallow the loser silently; fail loudly instead so the catalog disambiguates.
      const seen = new Set();
      for (const v of variants) {
        const n = normalize(v);
        if (seen.has(n)) throw new Error(`${file}: duplicate variant "${v}" in group`);
        seen.add(n);
      }
      for (const m of models) {
        // A variant repeating its parent model name is a dead dropdown row.
        if (seen.has(normalize(m))) {
          throw new Error(`${file}: variant duplicates model name "${m}"`);
        }
        // The same model may appear in several groups; collisions across them land on
        // one model_id just the same, so track the union per model.
        const key = `${make} ${normalize(m)}`;
        const prior = perModel.get(key) ?? new Set();
        for (const n of seen) {
          if (prior.has(n)) throw new Error(`${file}: "${m}" gets variant key "${n}" twice`);
          prior.add(n);
        }
        perModel.set(key, prior);
        modelKeys.get(make).add(m);
      }

      pairCount += models.length * variants.length;
      groups.push({ make, models, variants });
    }

    for (const r of raw.remap ?? []) {
      if (!r.from || !r.model || !r.variant) {
        throw new Error(`${file}: remap needs "from", "model" and "variant"`);
      }
      remaps.push({ make, ...r });
      modelKeys.get(make).add(r.model);
    }
  }

  return { groups, remaps, newModels, files, modelKeys, pairCount };
}

/**
 * SQL that lists catalog model keys with no matching `models` row — run before seeding
 * to catch typos. Models the catalog declares under "models" are excluded: they are
 * expected to be missing, since the import is what creates them.
 */
function buildValidationSql({ modelKeys, newModels }) {
  const created = new Set(newModels.map((m) => `${m.make} ${normalize(m.name)}`));
  const rows = [];
  for (const [make, models] of modelKeys) {
    for (const m of models) {
      if (created.has(`${make} ${normalize(m)}`)) continue;
      rows.push(`(${sqlStr(make)},${sqlStr(m)})`);
    }
  }
  return `with k(make, model) as (values\n    ${rows.join(',\n    ')}\n)
select k.make, k.model as unmatched_catalog_key
from k
left join public.makes mk on mk.normalized_name = public.normalize_vehicle_name(k.make)
left join public.models mo on mo.make_id = mk.id
 and mo.normalized_name = public.normalize_vehicle_name(k.model)
where mo.id is null
order by 1, 2;`;
}

function buildSql({ groups, remaps, newModels }) {
  const out = [];
  out.push('-- Generated by src/scripts/import-variant-catalog.mjs — do not edit by hand.');
  out.push('begin;');
  out.push('');

  if (newModels.length) {
    out.push('-- ---------- models the CSV never carried ----------');
    const CHUNK = 120;
    for (let i = 0; i < newModels.length; i += CHUNK) {
      const rows = newModels
        .slice(i, i + CHUNK)
        .map((m) => `(${sqlStr(m.make)},${sqlStr(m.name)})`)
        .join(',\n    ');
      out.push(`with m(make, name) as (values\n    ${rows}\n)`);
      out.push('insert into public.models (make_id, name, source)');
      out.push(`select mk.id, m.name, ${sqlStr(SOURCE)}`);
      out.push('from m');
      out.push('join public.makes mk on mk.normalized_name = public.normalize_vehicle_name(m.make)');
      out.push('on conflict (make_id, normalized_name) do nothing;');
      out.push('');
    }
  }

  if (groups.length) {
    out.push('-- ---------- variants ----------');
    const CHUNK = 60;
    for (let i = 0; i < groups.length; i += CHUNK) {
      const rows = groups
        .slice(i, i + CHUNK)
        .map((g) => `(${sqlStr(g.make)},${sqlArr(g.models)},${sqlArr(g.variants)})`)
        .join(',\n    ');
      out.push(`with g(make, models, variants) as (values\n    ${rows}\n)`);
      out.push('insert into public.variants (model_id, name, source)');
      out.push(`select mo.id, v.name, ${sqlStr(SOURCE)}`);
      out.push('from g');
      out.push('cross join lateral unnest(g.variants) as v(name)');
      out.push('join public.makes mk on mk.normalized_name = public.normalize_vehicle_name(g.make)');
      out.push('join public.models mo on mo.make_id = mk.id and exists (');
      out.push('  select 1 from unnest(g.models) m');
      out.push('  where public.normalize_vehicle_name(m) = mo.normalized_name)');
      out.push('on conflict (model_id, normalized_name) do nothing;');
      out.push('');
    }
  }

  if (remaps.length) {
    out.push('-- ---------- remap: rows seeded as models that are really trims ----------');
    const rows = remaps
      .map((r) => `(${sqlStr(r.make)},${sqlStr(r.from)},${sqlStr(r.model)},${sqlStr(r.variant)})`)
      .join(',\n    ');
    out.push(`create temp table _remap on commit drop as
select * from (values\n    ${rows}\n) as t(make, from_name, model, variant);`);
    out.push('');
    // 1. the trim becomes a real variant of its true parent
    out.push(`insert into public.variants (model_id, name, source)
select mo.id, r.variant, ${sqlStr(SOURCE)}
from _remap r
join public.makes mk on mk.normalized_name = public.normalize_vehicle_name(r.make)
join public.models mo on mo.make_id = mk.id
 and mo.normalized_name = public.normalize_vehicle_name(r.model)
on conflict (model_id, normalized_name) do nothing;`);
    out.push('');
    // 2. keep the old text resolvable — resolve_model_id consults vehicle_aliases
    out.push(`insert into public.vehicle_aliases (entity_type, make_id, model_id, alias, normalized_alias, source)
select 'model', mk.id, mo.id, r.from_name, public.normalize_vehicle_name(r.from_name), ${sqlStr(SOURCE)}
from _remap r
join public.makes mk on mk.normalized_name = public.normalize_vehicle_name(r.make)
join public.models mo on mo.make_id = mk.id
 and mo.normalized_name = public.normalize_vehicle_name(r.model)
where not exists (
  select 1 from public.vehicle_aliases va
  where va.entity_type = 'model' and va.make_id = mk.id
    and va.normalized_alias = public.normalize_vehicle_name(r.from_name));`);
    out.push('');
    // 3. repoint listings before the orphan is hidden, so nothing dangles
    out.push(`update public.listings l
set model_id = mo.id, variant_id = v.id
from _remap r
join public.makes mk on mk.normalized_name = public.normalize_vehicle_name(r.make)
join public.models orphan on orphan.make_id = mk.id
 and orphan.normalized_name = public.normalize_vehicle_name(r.from_name)
join public.models mo on mo.make_id = mk.id
 and mo.normalized_name = public.normalize_vehicle_name(r.model)
join public.variants v on v.model_id = mo.id
 and v.normalized_name = public.normalize_vehicle_name(r.variant)
where l.model_id = orphan.id;`);
    out.push('');
    // 4. hide, never delete — models.id is FK'd ON DELETE RESTRICT
    out.push(`update public.models mo set is_active = false, updated_at = now()
from _remap r
join public.makes mk on mk.normalized_name = public.normalize_vehicle_name(r.make)
where mo.make_id = mk.id
  and mo.normalized_name = public.normalize_vehicle_name(r.from_name);`);
    out.push('');
  }

  out.push('commit;');
  return out.join('\n');
}

async function applyDirect(sql) {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('No .env.local found. Use --sql and apply the output manually.');
    process.exit(1);
  }
  const env = {};
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^([^=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  const url = env['NEXT_PUBLIC_SUPABASE_URL'];
  const key = env['SUPABASE_SERVICE_ROLE_KEY'];
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }
  const res = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql }),
  });
  if (!res.ok) {
    console.error(`Apply failed (${res.status}): ${await res.text()}`);
    console.error('If exec_sql is not defined in this project, use --sql instead.');
    process.exit(1);
  }
  console.log('✅ Applied.');
}

const catalog = loadCatalog();
const stats =
  `${catalog.pairCount} variant rows from ${catalog.groups.length} groups, ` +
  `${catalog.newModels.length} new models, ` +
  `${catalog.remaps.length} remaps, ${catalog.files.length} make files`;

if (process.argv.includes('--validate')) {
  process.stdout.write(buildValidationSql(catalog));
} else if (process.argv.includes('--sql')) {
  process.stdout.write(buildSql(catalog));
  console.error(`\n-- ${stats}`);
} else {
  await applyDirect(buildSql(catalog));
}
