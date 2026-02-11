# BuyAuto — Phase 2 VIN → Canonical IDs → Step 1 Autofill (Plan & Validation)

## Goal (definition of done)
From **Inserat erstellen → Step 1**:
1) User enters a VIN and clicks **“Daten laden”**
2) Backend calls Vincario server-side
3) Response is normalized and mapped to **canonical IDs**:
   - `make_id`
   - `model_id` (**base model / family**)
   - `variant_id` (**exact trim**)
4) Frontend auto-populates dropdowns + specs (without overwriting manually edited fields)
5) Result is cached in `vin_cache`
6) User can review/edit and continue (**variant remains required**)

## Updated requirement (important)
**VIN decode must not be blocked by missing catalog coverage.**  
If Vincario returns a make/model/trim that does not yet exist in BuyAuto canonical tables, the backend must **seed canonical data at runtime (server-side)** and then return IDs. This ensures the Step 1 dropdowns can always be populated after VIN decode.

This changes the previous “return 422 if base model missing” behavior. After this change, 422 should only be used for truly invalid VIN input or provider hard-failure (no usable decode), not because the catalog is incomplete.

---

## Data model constraints (still enforced)
- Canonical storage stays: **Make → Model (base/family) → Variant (trim)**
- Variants are not models; models are not trims.
- Vincario is an input signal; BuyAuto stores canonical IDs, but may **seed** missing records using Vincario as an initial source.

**Display-only title rule remains unchanged:**
- If variant exists → “{Make} {Variant}”
- Else → “{Make} {Model}”

---

## Runtime Canonical Seeding (server-side only)

### When to seed
During `POST /api/vehicles/decode-vin`, after we extract fields from Vincario and attempt normal resolution via existing resolvers/aliases:

1) **Make**
- Try `resolve_make_id(provider_make)`
- If unresolved, **upsert** into `makes` using a cleaned `name` and `normalized_name`
- Add best-effort alias row in `vehicle_aliases` for the provider string

2) **Model (base model / family)**
- Try `resolve_model_id(make_id, provider_model candidates)`
- If unresolved and we have a `make_id` and some model-like text, **upsert** into `models`
- Add best-effort `vehicle_aliases` row(s) for the provider model string(s)

**Important:** We should still prefer “family/series” fields from Vincario decode (if present) over trim-like strings to avoid creating base models like “S 63 AMG”. However, if Vincario truly only provides a trim-like “model”, we seed it as a model to avoid blocking, but mark it for review (see below).

3) **Variant (trim)**
- Only resolve/create variants once `model_id` exists.
- If `provider_trim` (or derived trim) is present and not junk:
  - lookup by `(model_id, normalized_name)`
  - if missing: insert into `variants`
  - add `vehicle_aliases` for the trim text

### Review / Pending policy (strict)
Newly seeded records from Vincario should be **marked for later review** if the schema supports it (e.g. `source`, `is_active`, `needs_review`, etc.).
- Makes/models created from Vincario: mark as `source="vincario"` and optionally `is_active=true` (so they appear in dropdowns) but `needs_review=true` (so they can be normalized/merged later).
- Variants created from Vincario: same approach.

If the schema does not currently support “needs review”, we will:
- still store `source="vincario"` (if column exists)
- rely on deterministic `normalized_name` + aliases to reduce duplicates

---

## API behavior

### Endpoint
`POST /api/vehicles/decode-vin`
- Input: `{ vin: string }`
- Output: normalized payload including canonical IDs + specs:
  - `make_id`, `model_id`, `variant_id`
  - `year`, `fuel`, `transmission`, `drivetrain`, `power_hp`, `body_type`, `first_registration`
  - plus `provider_make/provider_model/provider_trim` for debugging/UI messaging

### Error handling
- **400**: invalid VIN format
- **401**: unauthenticated (same as current)
- **502**: Vincario provider hard failure / no usable payload
- **No more 422 purely due to missing catalog** (because we seed)

---

## vin_cache behavior
- Success cache: ~30 days
- Failed cache: short TTL (~5 minutes)
- Cache stores:
  - raw provider payload (`decoded_payload`)
  - normalized payload + IDs (`normalized_payload`, `make_id`, `model_id`, `variant_id`)
- Provider errors must never be served as cached success.

---

## Step 1 frontend autofill (unchanged behavior)
- VIN input + “Daten laden”
- On success:
  - set Make/Model/Variant dropdowns (IDs returned)
  - autofill specs only for fields that are empty/untouched
- Variant remains required to proceed:
  - if backend couldn’t extract a trim (rare), user must pick a variant manually

---

## Acceptance criteria (Phase 2 complete)
1) Enter VIN → click “Daten laden”
2) Backend returns **200** with `make_id` + `model_id` (and usually `variant_id`)
3) If the make/model/variant didn’t exist previously, it now exists in canonical tables and appears in dropdowns
4) Step 1 fields autofill correctly without overwriting edited fields
5) `vin_cache` stores raw + normalized payload and IDs
6) Listing title remains display-only and follows the variant-first rule

---

## Manual test protocol
1) Log in
2) Go to Inserat erstellen (Step 1)
3) Test VINs:
   - known-covered (e.g. GLE 53 AMG case)
   - previously failing (e.g. `W1K6G8CB6SA315776`)
4) Verify:
   - dropdowns populated (even if model wasn’t seeded before)
   - specs filled
   - variant required to proceed
   - `vin_cache` updated