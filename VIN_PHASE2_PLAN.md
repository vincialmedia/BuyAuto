# BuyAuto — Phase 2 VIN → Canonical IDs → Step 1 Autofill (Plan & Validation)

## Goal (definition of done)
From **Inserat erstellen → Step 1**:
1) User enters a VIN and clicks **“Daten laden”**
2) Backend calls Vincario server-side
3) Response is normalized and mapped to **canonical IDs**:
   - `make_id`
   - `model_id` (base model only)
   - `variant_id` (trim; may be auto-created under an existing base model)
4) Frontend auto-populates dropdowns + specs (without overwriting manually edited fields)
5) Result is cached in `vin_cache`
6) User can review/edit and continue (variant remains required)

## Confirmed current database columns (source of truth)
From schema:

### listings (relevant)
- `year` (integer)
- `mileage_km` (integer)  ← km field
- `fuel` (varchar(20))
- `gearbox` (varchar(20)) ← transmission field in UI maps here
- `body` (varchar(20))    ← body_type field in UI maps here
- `location` (varchar(100))
- Canonical IDs: `make_id`, `model_id`, `variant_id` (uuid, nullable)

### Missing in listings table (important)
These do **not** exist as columns in `listings` right now:
- `first_registration`
- `drivetrain`
- `power_hp`

Decision needed: either (A) add new nullable columns (safe additive migration), or (B) store only in `listing_drafts.data` / UI state for now.

## Current endpoints involved
- `POST /api/vehicles/decode-vin` (server-side Vincario + mapping + caching)
- `GET /api/vehicles/makes`
- `GET /api/vehicles/models?make_id=...`
- `GET /api/vehicles/variants?model_id=...`

## Canonical rules (must remain true)
- No automatic base-model creation.
- Variants may be auto-created **only if** `model_id` (base model) is already resolved.
- Vincario is input only; BuyAuto canonical DB remains source of truth.
- Display title is display-only: `{Make} {Variant}` else `{Make} {Model}`.

---

## Work items / checks

### 1) Vincario control-sum correctness (current blocker)
**Symptom:** provider returns “Invalid Control sum”.

Plan:
- Add server-side diagnostics (masked VIN) to log:
  - which URL was called
  - which control-sum variant was attempted
  - provider response `{status, message}`

- Implement a robust fallback matrix (stop at first success):
  - control-sum string: with separators vs without separators
  - hash algorithm: SHA1(10 chars) vs SHA1(full) vs MD5 (depending on Vincario docs)
  - operation key: `decode` (and only if docs show otherwise, test `decode/info` style)

**Acceptance:** at least one real VIN returns HTTP 200 with a decoded payload where provider error flags are false.

### 2) Normalization + canonical mapping
- `make_id`: resolve via existing resolver + aliases (must not create)
- `model_id`: resolve base model only (must not create)
- `variant_id`:
  - If resolver finds existing → use it
  - Else create variant under `model_id` (only if `model_id` exists)
  - Seed `vehicle_aliases` for the variant name (source: vincario)

**Acceptance:** response includes IDs when resolvable, and created variants appear under the correct base model.

### 3) vin_cache behavior
- Success cache: ~30 days
- Failed cache: short TTL (~5 minutes)
- Provider error responses must never be served as cached success.

**Acceptance:** second request for same VIN returns cached success; failed cache does not block retries for “Invalid Control sum”.

### 4) Step 1 frontend autofill behavior
- VIN section at top: VIN input + “Daten laden”
- On success: set canonical dropdown values + specs.
- Do not overwrite user-edited fields: only fill empty / untouched.
- If `variant_id` missing: require manual variant selection before continuing.

Potential UI nuance to validate:
- When setting make/model/variant programmatically, ensure dependent option lists load such that the Select can display the selected value (may require sequencing or “set after options load”).

**Acceptance:** user sees make/model/variant selected + other fields populated after clicking “Daten laden”.

---

## Test protocol (manual)
1) Log in
2) Go to Inserat erstellen (Step 1)
3) VIN: test `WBY2Z21030V349762`
4) Click “Daten laden”
5) Verify:
   - dropdowns set correctly
   - year/fuel/gearbox/body/etc filled
   - variant enforced (cannot proceed if missing)

If failure:
- Record HTTP status + response JSON from Network tab
- Check `vin_cache` row for the VIN (status/error_message/updated_at)