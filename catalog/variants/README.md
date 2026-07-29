# Vehicle variant catalog

Third level of the vehicle hierarchy: **make → model → variant**.

The `makes` and `models` tables were seeded from `public/Makes_Models_V2.csv`, which has
no trim column. These files add the missing level, add model rows the CSV never carried
(BMW has no `2 Series` row at all), and repair rows where a trim was seeded *as* a model
(BMW `320d`, Mercedes `C 220 d` — 470 rows, 26% of the catalog).

## File format

One JSON file per make, named after the make slug (`mercedes.json`, `alfa-romeo.json`).

```jsonc
{
  "make": "Audi",                    // must match makes.name exactly
  "models": ["2 Series", "4 Series"],  // model rows to create if absent
  "groups": [
    // Models that share an engine lineup share one list. A4 and A4 Avant are sold with
    // the same engines, so they are written once — this is what keeps the generated
    // SQL small enough to apply over the MCP transport.
    { "models": ["A4", "A4 Avant"],  // each must match models.name exactly
      "variants": ["2.0 TDI", "40 TFSI quattro"] }
  ],
  "remap": [
    // A row currently in `models` that is really a trim. The importer moves it under
    // `model` as a variant, records a vehicle_alias so existing text still resolves,
    // repoints any listings, then deactivates the orphan model row.
    { "from": "320d", "model": "3 Series", "variant": "320d" }
  ],
  "merge": [
    // remap with nowhere to land: the row is a duplicate spelling, a generation artefact
    // or an equipment line, none of which may become a variant. Alias + repoint +
    // deactivate, but no variant row is invented. Naming a variant here is an error.
    { "from": "Passat R-Line", "model": "Passat" }
  ],
  "rename": [
    // Right car, right level, wrong string. The row keeps its id, listings and variants;
    // only the label changes, and the old spelling stays resolvable as an alias.
    { "from": "IONIQ 5 N", "to": "Ioniq 5 N" }
  ]
}
```

### Operation order

The generated SQL runs `models` → `groups` → `remap` → `rename` → `merge`. Two consequences:

- A `remap` target must already exist or be listed in `models`. It cannot be a name that
  only a `rename` is about to create — Opel's base `Astra` is created via `models` for
  exactly this reason.
- A `merge` target *may* come from a `rename`, since renames run first.

`rename` compares raw strings, not normalized ones, because most renames here are cosmetic
(`IONIQ 5 N`, `Megane RS` → `Mégane RS`) and normalization strips the very casing and
accents they fix. For the same reason the "is the target name already taken" guard excludes
the row being renamed, or a cosmetic rename would match itself and silently skip.

### Granularity contract

A variant string carries **engine badge + drivetrain**, and nothing else:

- ✅ `40 TFSI quattro`, `320d xDrive`, `2.0 TDI`, `C 220 d 4MATIC`
- ❌ gearbox (`S tronic`) — already a separate listing field (`gearbox`)
- ❌ fuel type (`Diesel`) — already a separate listing field (`fuel_type`)
- ❌ equipment lines (`S line`, `M Sport`) — combinatorial, and not what identifies the car

Both badge eras are included, because the catalog covers 2010+: an A4 may be a
`2.0 TDI` (B8, 2010-2015) or a `40 TDI quattro` (B9, 2016+). Sellers pick whichever
is printed on their car.

### Rules

- Names are written exactly as the manufacturer brands them in the Swiss market.
  `normalized_name` is derived by a DB trigger — never set it by hand.
- Variants are unique per `(model_id, normalized_name)`. `normalize_vehicle_name` strips
  all non-alphanumerics, so `40 TFSI` and `40TFSI` collide by design — but so do Audi's
  two badge eras: `3.0 TDI` and `30 TDI` both reduce to `30tdi`, and an A4 genuinely
  offered both. Where that happens, qualify the displacement-era name with its cylinder
  layout (`3.0 TDI (V6)`), which is accurate and keeps both rows. The importer aborts on
  a collision rather than letting `ON CONFLICT DO NOTHING` drop one silently.
- Do not list a variant that duplicates its parent model name (`A4` under `A4`).
- S/RS/AMG/M cars that exist as their own model row keep their engine as the variant
  (`RS6` → `4.0 TFSI quattro`), so the level is never empty.

## Importing

```bash
# Catch typos first: lists catalog model keys with no matching models row
node src/scripts/import-variant-catalog.mjs --validate

# Print SQL to stdout (no credentials needed) — used to apply via the Supabase MCP
node src/scripts/import-variant-catalog.mjs --sql > /tmp/variants.sql

# Or apply directly with the service-role key from .env.local
node src/scripts/import-variant-catalog.mjs
```

All modes are idempotent: re-running inserts nothing new.
