# BuyAuto — V2 Listing UI Rollout Plan (Recommended: Legacy stays V1, ALL new listings are V2)

**Decision (2026-01-30):** Keep **all existing listings** on the **legacy UI (v1)** to avoid regressions, and ship the **new UI (v2)** for **every new listing created from now on** — **regardless of listing type** (including “plain Leasingübernahme” / `deal_type="lease_takeover"`).

We will keep `public.listings.ui_version` as the single source of truth for gating.

---

## Goal (why we’re doing this)
- Preserve current UX for the existing inventory (no sudden UI change).
- Enable direct purchase + future features safely on new listings.
- Maintain a clean rollback lever via `ui_version`.

---

## Golden rules
1. **Existing listings remain v1** unless explicitly migrated later.
2. **ALL new listings must be v2** (explicitly set or by DB default) — **including lease_takeover / Leasingübernahme**.
3. UI gating uses `listing.ui_version` **only** (no date-based heuristics in the frontend).
4. **No crashes** when optional data is missing (images, price fields, seller profile fields).

---

## Current state (known issue blocking builds)
TypeScript currently fails in `src/services/createListingService.ts` because:
- code is already using `ui_version`
- but the local insert/update payload type does not include `ui_version`

This **must be fixed first** or builds remain blocked.

---

## Phase 0 — Unblock builds (TypeScript fix) ✅ first
**Goal:** Fix the existing TS errors related to `ui_version`.

### Changes (code-level)
1) `src/lib/buyauto/types.ts`
- Ensure the project has:
  ```ts
  export type ListingUiVersion = "v1" | "v2";
  ```

2) `src/services/createListingService.ts`
- Update the local insert/update payload typing (e.g. `ListingUpdatePayload`) to include:
  - `ui_version?: ListingUiVersion | null`
- Ensure the “normalize payload” functions can safely pass `ui_version` without TS failures.

**Exit criteria:** `check_for_errors` shows **no TypeScript errors**.

---

## Phase 1 — Database rollout gating (v1 backfill + v2 default)
**Goal:** Ensure existing listings are v1 and new listings default to v2.

**Planned SQL (execute only during implementation; requires confirmation):**
```sql
-- 1) Ensure column exists
ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS ui_version text;

-- 2) Backfill existing listings to v1 (legacy)
UPDATE public.listings
SET ui_version = 'v1'
WHERE ui_version IS NULL;

-- 3) Ensure new listings default to v2 (new UI)
ALTER TABLE public.listings
ALTER COLUMN ui_version SET DEFAULT 'v2';
```

**Notes**
- This ensures **any insertion path** (wizard, admin insert, scripts) produces **v2 by default** going forward.

---

## Phase 2 — Create Listing Flow: always write `ui_version = "v2"` (all deal types)
**Goal:** Enforce “new listings are v2” regardless of DB default.

### Recommended approach (do both)
- **Frontend wizard**: set `ui_version: "v2"` when starting a new draft listing.
- **Create service**: ensure insert payload always sets `ui_version: "v2"` (even for `deal_type="lease_takeover"`).

**Why both:** redundancy. If one side forgets, the other still enforces v2.

**Acceptance**
- Any new listing inserted today always has `ui_version = 'v2'`.
- Existing listings remain unchanged.

---

## Phase 3 — UI gating (search cards + detail page)
**Goal:** Make legacy listings render exactly as before, and enable v2 UI only for new listings.

### Search result cards
**Where**
- `src/components/buyauto/search/ModernListingCard.tsx`
- `src/components/buyauto/search/VerticalListingCard.tsx`
- `src/components/buyauto/search/ListingCard.tsx` (if used)

**Behavior**
- If `listing.ui_version === "v1"` (or null):
  - render legacy visual + legacy pricing rules
- If `listing.ui_version === "v2"`:
  - render v2 UI
  - must support BOTH:
    - `deal_type="lease_takeover"` (Leasingübernahme)
    - `deal_type="direct_purchase"` (future)

### Listing detail page
**Where**
- `src/pages/fahrzeug/[id].tsx`

**Behavior**
- If `ui_version === "v1"`: keep the legacy layout/modules unchanged
- If `ui_version === "v2"`:
  - show v2 modules
  - ensure Leasingübernahme still looks correct
  - only show “direct purchase extras” where applicable

---

## Phase 4 — Leasing Calculator — v2 + direct purchase only
**Rule:** Render only when:
- `listing.ui_version === "v2"`
- `listing.deal_type === "direct_purchase"`
- `listing.leasing_offer?.enabled === true`

**Meaning:** plain Leasingübernahme (lease takeover) listings will be v2 UI, but won’t show the direct-purchase leasing calculator.

---

## QA / Acceptance checklist
- Existing listings:
  - search cards unchanged
  - detail page unchanged
- New v2 listings (any type):
  - cards + detail use v2 UI
  - Leasingübernahme v2 looks correct and has correct fallbacks
  - no crashes on missing fields (images, price, seller profile)
- TypeScript + lint clean (`check_for_errors` clean)

---

## Rollback strategy
- If v2 causes issues for specific new listings:
  - set affected listings to `ui_version = 'v1'` (fast rollback)
- Keep v1 UI path intact until v2 stabilizes

---

## Implementation note (mode)
This plan is ready for implementation in **Standard Mode** (code changes + DB migration execution + error checking).
