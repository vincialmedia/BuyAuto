# BuyAuto – Admin Dashboard Enhancements (Implementation Plan)
Date: 2026-02-23  
Scope: Extend the existing admin dashboard (Listings + Users) with more powerful management tools, reliable email notifications, and a mobile-friendly UI.

---

## 0) Context & Current State (what we already have)
### Admin UI
- Admin route: `src/pages/admin.tsx` (guarded by `useAuth()` + redirect).
- Admin sections:
  - Listings moderation: `src/components/admin/ModerationView.tsx`
  - All listings: `src/components/admin/AllListingsView.tsx`
  - Users: `src/components/admin/UsersView.tsx`
  - Listing edit modal: `src/components/admin/ListingDetailsModal.tsx`

### Data model highlights (from current Supabase schema)
- `profiles` table: `role` ∈ `private | garage | admin`
- `garages` table: `owner_user_id` (unique), `plan` (legacy-ish), `listing_limit`, etc.
- `listings` table contains many additional fields not surfaced in UI yet:
  - Core: `brand`, `model`, `title`, `year`, `location`, `canton_code`, `description`
  - Status/monetization: `status`, `duration_days`, `expires_at`, `price_plan`, `pricing_plan`, `payment_status`, `price_paid_chf`, Stripe ids
  - Deal logic: `deal_type`, `financing_type`, `leasing_offer` (jsonb), `purchase_price_chf`, `price_per_month_chf`
  - Catalog mapping: `make_id`, `model_id`, `variant_id`, `vin`, `power_hp`, `drivetrain`, `first_registration`
  - Seller: `seller_type`, `garage_id`, plus seller display fields
- Dealer plans/subscriptions:
  - `dealer_plans`, `dealer_subscriptions`, `dealer_plan_changes`, `dealer_premium_credits`

### Email notifications (important)
- There is an Edge Function: `supabase/functions/listing-status-notification/index.ts`
- It is designed for webhook/trigger-style payloads `{ record, old_record }`
- **Bug risk in current function**: it references `record.make` but listings schema uses `brand`. That likely breaks email content unless corrected.

---

## 1) Feature Breakdown (what you requested)
You requested these admin capabilities:

1. Switch users between **Garage** and **Private** profiles  
2. Switch the **payment plan** of garages/users tied to garages  
3. Change **listing type** for privates (Free / Extended / Unlimited)  
4. Change **everything** about a vehicle listing (show all fields)  
5. Delete/decline listings and ensure uploader receives an **email**  
6. Make the dashboard **mobile friendly**  
7. See which listing is tied to which **user**

This plan implements all seven, while keeping security and the “server-side email trigger” philosophy.

---

## 2) Product Decisions Needed (small but important)
Before implementation, we should confirm 3 business rules:

### A) What does “Switch user to Garage” mean operationally?
Recommended behavior:
- Setting `profiles.role = "garage"` is not enough; we should also ensure a `garages` row exists for that user:
  - create `garages` record if missing (with minimal defaults)
  - optionally prompt admin for `garage_name`, `city`, `contact_email`

### B) What does “Garage → Private” do with existing garage data?
✅ Confirmed rule: **Block downgrade** if the user has **active subscriptions or active listings**.

**Definition (implementation-ready):**
- “Active subscription” = a `dealer_subscriptions` row for the user’s garage where `status` ∈ `{'active','pending_change','past_due'}` (anything not safely inactive/canceled).
- “Active listings” = listings tied to the user’s `garage_id` where `status` ∈ `{'pending','published','active','draft'}`.
  - Rationale: these are operationally “in-flight” and should not be orphaned by role changes.

If downgrade is allowed (no active subs/listings), recommended behavior:
- Set `profiles.role = 'private'`
- Remove/detach garage presence cleanly (recommended: delete `garages` row; FK sets `listings.garage_id = NULL`)
- Normalize any remaining historical listings if needed (optional cleanup; not required for correctness)

### C) What should “Unlimited” mean for a private listing?
✅ Confirmed definition:
- Unlimited = **no expiry**: `duration_days = null` and `expires_at = null`

---

## 3) Architecture Approach (recommended)
### Principle: Admin actions should be atomic + auditable
For sensitive multi-step operations (role conversions, plan changes, bulk listing updates), prefer **DB RPC functions** with:
- `SECURITY DEFINER`
- explicit check `get_my_role() = 'admin'`
- transactional updates (role + garage row + listing fixes happen together)

This reduces the risk of partial states when done from the UI and makes debugging easier.

### Emails: keep the established server-side pattern
- For **reject**: status change to `rejected` should trigger webhook → Edge Function → Resend.
- For **delete**: either:
  - (Preferred) treat deletion as **“archive + notify”** (status = `archived`) so the existing “status change” pipeline handles it, OR
  - add a **DELETE webhook** to invoke a deletion notification Edge Function.

---

## 4) Implementation Plan by Feature

## 4.1 Users: Switch between Private and Garage (Feature #1)
### Backend (DB)
Create RPCs (names are suggestions):
- `admin_set_user_role(p_user_id uuid, p_role text)`
  - validates role ∈ {private, garage, admin}
  - updates `profiles.role`
- `admin_convert_user_to_garage(p_user_id uuid, p_garage_name text, p_city text, p_contact_email text)`
  - sets `profiles.role = 'garage'`
  - inserts `garages` row if missing (enforce `garages_owner_user_id_key`)
  - default `listing_limit` based on chosen plan or fallback
- `admin_convert_user_to_private(p_user_id uuid, p_strategy text)`
  - strategy ∈ {detach_listings, archive_listings, block_if_active}
  - handles listing migration safely (garage_id removal, seller_type normalization)

### Frontend (Admin UI)
In `UsersView`:
- Add “Role” control:
  - a Select: Private / Garage / Admin
  - if selecting Garage: show a small form to capture `garage_name` (required), optional city/email
  - if selecting Private from Garage: show confirmation dialog with strategy selection and listing counts
- Show “Has garage” indicator + garage name/slug if exists

### QA
- Confirm RLS allows admin to update other users (it does: `profiles` has “Admins have full access”).
- Ensure role changes immediately reflect `useAuth().isAdmin` logic where applicable.

---

## 4.2 Garages: Switch payment plan (Feature #2)
### Backend (DB)
Create RPC:
- `admin_change_dealer_plan(p_dealer_id uuid, p_to_plan_code text, p_note text, p_apply_immediately boolean)`
  - resolves `dealer_plans.id` from `code`
  - updates `dealer_subscriptions.plan_id` (and `updated_at`)
  - inserts `dealer_plan_changes` row for audit trail (recommended)
  - optionally updates `garages.listing_limit` to match plan’s `listing_limit` if you want the garage record to reflect plan limits

Also consider a lightweight view for admin:
- `admin_dealer_overview` (dealer_id, garage_name, owner_user_id, plan_code, subscription status, listing_limit, premium credits)

### Frontend (Admin UI)
Two entry points:
1) From **UsersView** (when user is garage owner):
   - show current plan + Select new plan (active plans)
   - “Apply now” button + confirmation
2) From **Listings** detail:
   - show garage info and current plan with quick link “Open garage owner” / “Change plan”

### QA
- Validate that changing plan updates any downstream behaviors (listing limits, premium credits).
- Confirm that dealer tables’ RLS policies allow admin updates (they do via `get_my_role() = 'admin'` OR owner checks).

---

## 4.3 Private listing type: Free / Extended / Unlimited (Feature #3)
### Data mapping (confirmed)
Use existing listing fields (no new schema needed for the plan type itself):
- Store plan in `price_plan` (canonical), and mirror to `pricing_plan` for backward compatibility where needed:
  - `"standard" | "extended" | "unlimited"`

Map durations directly to `src/lib/buyauto/stripe_config.ts`:
- standard: `duration_days = 60`
- extended: `duration_days = 90`
- unlimited: `duration_days = null` and `expires_at = null`

Derived fields:
- For standard/extended: set `expires_at = now() + duration_days`
- For unlimited: `expires_at = null`

> Note: implementation will first verify whether the create-listing flow and admin UI read `price_plan` vs `pricing_plan`, then standardize reads on `price_plan` while keeping writes mirrored for safety.

### Backend
- Add RPC: `admin_set_private_listing_type(p_listing_id uuid, p_type text)`
  - validates `p_type` ∈ {standard, extended, unlimited}
  - sets `price_plan` (and mirrors to `pricing_plan`)
  - sets `duration_days` and `expires_at` per mapping above (unlimited => nulls)

### Frontend
In listing edit modal:
- Add “Private listing type” control visible when `seller_type = "private"` and `garage_id IS NULL`.

---

## 4.4 Full listing editor (Feature #4)
### Goal
Make all important fields editable and visible, with validation aligned to DB constraints.

### Approach (UI)
Refactor `ListingDetailsModal` into a **tabbed** layout:
- Tab 1: Summary (current)
- Tab 2: Pricing & Deal (monthly vs purchase)
- Tab 3: Vehicle Specs (mileage, fuel, gearbox, body, power_hp, drivetrain, first_registration, vin)
- Tab 4: Seller & Ownership (seller_type, created_by/user_id, garage_id, seller display fields)
- Tab 5: Media (images array, cover index/url)
- Tab 6: Payments (read-only by default): payment_status, stripe_payment_intent_id, refund ids

Implementation notes:
- Use React Hook Form + Zod for robust forms (already in stack)
- Provide “Raw JSON editor” for `leasing_offer` (advanced) + a small structured subset (enabled, monthly payment adjustments) for basic use

### Backend/service changes
- Update `adminService` types to include the extra listing columns.
- Switch the modal to load full data via `adminService.getListingDetails(id)` to avoid relying on list rows.

### Validation
- Enforce check constraints in UI (fuel/body/gearbox/canton allowed values).
- Guard number fields against NaN (empty → null).

---

## 4.5 Delete/Decline listings with email notification (Feature #5)
### Decline (status = rejected)
- Ensure rejection flow always sets:
  - `status = 'rejected'`
  - `moderation_note` = reason (required)
- Confirm webhook triggers Edge Function email.
- Fix Edge Function email template to use correct fields (`brand`, not `make`).
- Optional improvement: include listing title + link back to dashboard.

### Delete (confirmed product behavior)
✅ Confirmed:
- Admin “Delete” action becomes: **Archive immediately** (remove from public view) → **auto-delete after 30 days**

**Archive behavior (immediate effect):**
- Set `status = 'archived'`
- Set `moderation_note = 'Archiviert durch Admin: ...'` (optional)
- Set `archived_at = now()` (recommended new column for reliable cleanup timing)
- Trigger email notification to uploader via the existing status-notification pipeline (extend it to include `archived`)

**Auto-delete after 30 days:**
- Scheduled job (Edge Function) runs daily:
  - selects listings where `status = 'archived'` and `archived_at < now() - interval '30 days'`
  - hard-deletes those rows (FK cascades will clean related inquiries/conversations where applicable)
- This keeps the admin action safe and reversible for 30 days, while still meeting the data lifecycle requirement.

**Schema note (recommended):**
- Add `listings.archived_at timestamptz null`
- Add a DB trigger: when status changes to `archived`, set `archived_at = now()` (and only then).
  - This ensures archiving from any code-path is tracked consistently.

### Email function updates (Edge Function)
Update `listing-status-notification` to:
- Handle statuses:
  - published → “approved” email
  - rejected → “rejected” email
  - archived → “archived/removed” email (includes “will be deleted in 30 days” message)
- Use correct listing fields (`brand`, `model`) and stable owner resolution (`created_by`/`user_id` to profile id).

---

## 4.6 Mobile-friendly admin dashboard (Feature #6)
### Targets
- Listings views (Moderation + All listings) need a mobile layout like UsersView already has.

### UI plan
- Keep table for `md+`
- Add **mobile cards** for `<md`:
  - vehicle title, status badge, premium badge, created/expiry
  - owner: name/email (if available)
  - actions as a bottom row of icon buttons (View / Approve / Reject / Archive)
- Improve modals on mobile:
  - convert details modal to `Drawer` for mobile (shadcn drawer is available)
  - or make `DialogContent` full-screen on small breakpoints

### Navigation
If the admin layout uses a sidebar, ensure:
- hamburger menu / sheet on mobile
- sticky top bar with active section

---

## 4.7 Show which listing is tied to which user (Feature #7)
### Backend
Because `listings.created_by` references `users.id` (not directly `profiles.id`), joining via PostgREST may be unreliable without extra FK.

Two options:

**Option A (no schema change; recommended first):**
- In `adminService.getListings()`:
  1) fetch listings page
  2) collect owner ids from `created_by`/`user_id`
  3) fetch matching profiles in a second query
  4) merge into a richer DTO

**Option B (schema improvement):**
- Add FK constraint `listings.created_by -> profiles.id` (and/or `listings.user_id -> profiles.id`) to enable direct joins.
- Pros: simpler queries
- Cons: requires migration + careful validation

### Frontend
- Add columns / fields:
  - Owner name + email
  - Owner role (private/garage)
  - If garage listing: garage name + link to dealer public page + link to garage owner in Users tab
- Add deep-linking:
  - From listings table/card: “Open user” → opens UserDetailsModal

---

## 5) Phased Delivery (recommended)
### Phase 1 (High value, low risk)
- Feature #7 (owner visibility everywhere)
- Feature #6 (mobile cards for listings views)
- Feature #1 (role switch) — with conservative “garage → private” strategy (archive or detach)

### Phase 2 (Revenue/ops)
- Feature #2 (garage plan switching with audit trail)
- Feature #3 (private listing type control)

### Phase 3 (Power admin tooling)
- Feature #4 (full listing editor with validation)
- Feature #5 (archive/delete email flows hardened; Edge Function fixes)

---

## 6) Testing & Safety Checklist
- RLS verification:
  - confirm admin role detection is correct (`get_my_role()` + profiles.role)
- Regression tests:
  - list queries still paginate correctly
  - listing updates still respect DB check constraints
- Email tests (staging):
  - approve/reject/archive sends to uploader
  - templates use verified sender and correct listing fields
- Mobile QA:
  - iPhone width: filter controls usable, actions reachable, dialogs not clipped

---

## 7) Open Questions (to finalize before build)
1) For “active listings” that block Garage → Private downgrade: should **draft** listings count as active? (recommended: yes; plan assumes yes)
2) Do you want to allow an admin-only **Restore from Archive** action during the 30-day window?

---