# BuyAuto — Canonical Vehicle Foundation (Make / Model / Variant IDs)
**Scope:** Foundation only (no UI changes, no enum syncing, no equipment/options catalog)  
**Goal:** Ensure *any* vehicle input (manual now, VIN later) resolves to **BuyAuto-owned canonical IDs** and prevents duplicates.

---

## 0) Non‑negotiable principles (as agreed)
1. **BuyAuto owns the canonical IDs**: `make_id`, `model_id`, optional `variant_id`.
2. External providers (e.g. Vincario) are **sources**, never source-of-truth.
3. Manual entry and VIN-based entry must resolve to the **same canonical IDs**.
4. Existing `public.makes` + `public.models` are **kept as-is** (no deletion/re-import/replacement).
5. This is **not** a full automotive catalog (no options, equipment lists, WLTP/CO₂).
6. **No backfill without explicit review + approval**.

---

## 1) Current DB reality (important schema detail)
### Canonical tables (already exist + populated)
- `public.makes (id, name, normalized_name, …)`
- `public.models (id, make_id, name, normalized_name, …)`
- `public.variants (id, model_id, name, normalized_name, is_active, …)` *(present, can be sparsely populated)*

### Alias / mapping table (already exists)
- `public.vehicle_aliases`
  - Designed to map messy inputs → canonical entities.
  - Columns include: `entity_type`, `normalized_alias`, plus `make_id/model_id/variant_id` as applicable.

### Listings vs Drafts (critical difference)
- `public.listings` stores free text in columns: `brand`, `model`.
- `public.listing_drafts` stores free text in `data jsonb` (no `brand` / `model` columns).

---

## 2) Canonical ID columns added (schema-only change already done)
✅ Added **nullable** canonical columns + FK constraints + indexes:

- `public.listings`
  - `make_id uuid NULL REFERENCES public.makes(id)`
  - `model_id uuid NULL REFERENCES public.models(id)`
  - `variant_id uuid NULL REFERENCES public.variants(id)`

- `public.listing_drafts`
  - same three columns + indexes

**What we intentionally did NOT do**
- No `NOT NULL`
- No backfill `UPDATE`
- No UI/service changes yet

---

## 3) Resolution strategy (canonical mapping algorithm)
### Inputs
- Manual input today:
  - From listings: `brand`, `model`
  - From drafts: `data->>'brand'`, `data->>'model'` (and optionally fallback keys)
- VIN decoding later:
  - Provider returns make/model/trim strings → treated as inputs to the same resolver.

### Resolver: “same input → same IDs”
Use the existing Postgres functions (already present in schema):
- `public.normalize_vehicle_name(input text) returns text`
- `public.resolve_make_id(p_make_text text) returns uuid`
- `public.resolve_model_id(p_make_id uuid, p_model_text text) returns uuid`
- `public.resolve_variant_id(p_model_id uuid, p_variant_text text) returns uuid`

**Expected behavior**
- Normalization reduces fragmentation: casing, spacing, punctuation differences.
- Alias table catches “Mercedes-Benz” vs “Mercedes”, “VW” vs “Volkswagen”, etc.
- Canonical tables remain the final target.

---

## 4) Dry‑run reporting (no writes) — Listings
These queries produce a mapping quality report **without updating any rows**.

### 4.1 Coverage summary (listings)
```sql
with base as (
  select
    l.id,
    l.brand,
    l.model
  from public.listings l
),
resolved as (
  select
    id,
    brand,
    model,
    public.resolve_make_id(brand) as make_id_res,
    null::uuid as model_id_res
  from base
),
resolved2 as (
  select
    r.*,
    case
      when r.make_id_res is null then null
      else public.resolve_model_id(r.make_id_res, r.model)
    end as model_id_res2
  from resolved r
)
select
  count(*)::int as total,
  sum((make_id_res is not null)::int)::int as make_resolved,
  sum((make_id_res is not null and model_id_res2 is not null)::int)::int as model_resolved,
  sum((make_id_res is null)::int)::int as make_unresolved,
  sum((make_id_res is not null and model_id_res2 is null)::int)::int as model_unresolved
from resolved2;
```

### 4.2 Top unmatched makes (listings)
```sql
with rows as (
  select
    public.normalize_vehicle_name(l.brand) as make_norm,
    public.resolve_make_id(l.brand) as make_id_res
  from public.listings l
)
select
  make_norm,
  count(*)::int as cnt
from rows
where make_id_res is null
group by make_norm
order by cnt desc, make_norm
limit 50;
```

### 4.3 Top unmatched models (within resolved make) (listings)
```sql
with rows as (
  select
    l.brand,
    l.model,
    public.resolve_make_id(l.brand) as make_id_res
  from public.listings l
),
models_res as (
  select
    r.*,
    case
      when r.make_id_res is null then null
      else public.resolve_model_id(r.make_id_res, r.model)
    end as model_id_res
  from rows r
)
select
  mk.name as canonical_make,
  public.normalize_vehicle_name(mr.model) as model_norm,
  count(*)::int as cnt
from models_res mr
join public.makes mk on mk.id = mr.make_id_res
where mr.make_id_res is not null
  and mr.model_id_res is null
group by mk.name, model_norm
order by cnt desc, canonical_make, model_norm
limit 50;
```

---

## 5) Dry‑run reporting (no writes) — Listing Drafts (JSON input)
Drafts store user input in `listing_drafts.data` (jsonb). We should treat these keys as the source for resolution:

- Primary keys: `data->>'brand'`, `data->>'model'`
- Optional fallbacks (legacy): `data->>'make'`, `data->>'manufacturer'`

### 5.1 Coverage summary (drafts)
```sql
with base as (
  select
    d.id,
    coalesce(nullif(d.data->>'brand',''), nullif(d.data->>'make',''), nullif(d.data->>'manufacturer','')) as brand_text,
    coalesce(nullif(d.data->>'model',''), nullif(d.data->>'model_name','')) as model_text
  from public.listing_drafts d
),
resolved as (
  select
    id,
    brand_text,
    model_text,
    public.resolve_make_id(brand_text) as make_id_res
  from base
),
resolved2 as (
  select
    r.*,
    case
      when r.make_id_res is null then null
      when r.model_text is null then null
      else public.resolve_model_id(r.make_id_res, r.model_text)
    end as model_id_res
  from resolved r
)
select
  count(*)::int as total,
  sum((make_id_res is not null)::int)::int as make_resolved,
  sum((make_id_res is not null and model_id_res is not null)::int)::int as model_resolved,
  sum((make_id_res is null)::int)::int as make_unresolved,
  sum((make_id_res is not null and model_id_res is null)::int)::int as model_unresolved
from resolved2;
```

### 5.2 Top unmatched makes (drafts)
```sql
with rows as (
  select
    public.normalize_vehicle_name(
      coalesce(nullif(d.data->>'brand',''), nullif(d.data->>'make',''), nullif(d.data->>'manufacturer',''))
    ) as make_norm,
    public.resolve_make_id(
      coalesce(nullif(d.data->>'brand',''), nullif(d.data->>'make',''), nullif(d.data->>'manufacturer',''))
    ) as make_id_res
  from public.listing_drafts d
)
select
  make_norm,
  count(*)::int as cnt
from rows
where make_id_res is null
group by make_norm
order by cnt desc, make_norm
limit 50;
```

### 5.3 Top unmatched models (within resolved make) (drafts)
```sql
with rows as (
  select
    coalesce(nullif(d.data->>'brand',''), nullif(d.data->>'make',''), nullif(d.data->>'manufacturer','')) as brand_text,
    coalesce(nullif(d.data->>'model',''), nullif(d.data->>'model_name','')) as model_text,
    public.resolve_make_id(coalesce(nullif(d.data->>'brand',''), nullif(d.data->>'make',''), nullif(d.data->>'manufacturer',''))) as make_id_res
  from public.listing_drafts d
),
models_res as (
  select
    r.*,
    case
      when r.make_id_res is null then null
      when r.model_text is null then null
      else public.resolve_model_id(r.make_id_res, r.model_text)
    end as model_id_res
  from rows r
)
select
  mk.name as canonical_make,
  public.normalize_vehicle_name(mr.model_text) as model_norm,
  count(*)::int as cnt
from models_res mr
join public.makes mk on mk.id = mr.make_id_res
where mr.make_id_res is not null
  and mr.model_id_res is null
group by mk.name, model_norm
order by cnt desc, canonical_make, model_norm
limit 50;
```

---

## 6) How we prevent duplicates (without building a giant catalog)
### 6.1 Canonical tables remain minimal
- We rely on `makes`/`models` for the canonical identity.
- We do **not** expand into trims/options catalog.

### 6.2 Vehicle aliases are the “pressure valve”
When dry-run reports show unmatched or ambiguous values:
- Add a row in `vehicle_aliases` so future resolutions converge.

**Example alias intent (conceptual)**
- `entity_type='make'`: “vw” → `make_id = Volkswagen`
- `entity_type='make'`: “mercedes-benz” → `make_id = Mercedes-Benz` *(or Mercedes, depending on canonical naming)*
- `entity_type='model'`: “m 140 i” under BMW → model_id that matches canonical “M140i” (if present)

> Note: exact insertion/upsert strategy depends on whether `vehicle_aliases` already enforces uniqueness via constraint/index. If it does not, we should add a unique index on `(entity_type, normalized_alias)` (requires explicit DDL confirmation).

---

## 7) Write-path options (still no UI required)
We have two safe paths. Both preserve “BuyAuto owns canonical IDs”.

### Option A (App/service layer)
- When saving draft/listing, call resolver (RPCs) and persist `make_id/model_id/variant_id`.
- Pros: simple to reason about, easy to test in code.
- Cons: requires disciplined usage across all write locations.

### Option B (Database triggers) — recommended for long-term consistency
- DB trigger on `listings` and `listing_drafts` that sets canonical IDs whenever:
  - free-text brand/model changes (`listings`)
  - JSON `data` changes (`listing_drafts`)
- Pros: guarantees canonical IDs even if a new write path is added later.
- Cons: needs careful trigger conditions + avoids unintended updates.

**Important:** triggers can be enabled for *new/updated rows only* and still respect “no backfill”.

---

## 8) Backfill policy (explicit opt-in only)
Backfill is optional and should happen only after:
1. We run the dry-run reports
2. We review unmatched buckets
3. We add aliases to handle the top offenders
4. You explicitly approve the exact UPDATE statements

If you want, I can prepare the exact backfill SQL (guarded, batched, with row counts) **for review only**.

---

## 9) Immediate next step (recommended)
1) Run the dry-run coverage summaries for:
   - `listings`
   - `listing_drafts`
2) Inspect the “top unmatched” lists.
3) Decide:
   - Do we add a few key aliases now?
   - And do we prefer **DB triggers** (Option B) or **service-layer writes** (Option A) for the canonical IDs going forward?