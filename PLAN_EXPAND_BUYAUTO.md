
# Plan to expand BuyAuto (Strict Safety & Architecture)

## Context & Objective
BuyAuto is evolving to support multiple offer types. We must distinguish between **Private Sellers** and **Garages** (professional sellers) while preserving existing functionality.

**Goal:** Implement a robust role-based access control system with separate dashboards, ensuring data integrity and security at the database level.

---

## 1. Database Architecture (Supabase / PostgreSQL)

### A. Profiles Table (Secure & Constrained)
We reuse the existing `public.profiles` table but enforce strict data integrity.

- **Migration Step:**
  - Update existing rows: `UPDATE profiles SET role = 'private' WHERE role IS NULL OR role = 'user';`
  - **Constraint:** Add a check constraint to enforce allowed values:
    `ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('private', 'garage', 'admin'));`
  - **Default:** Set default value to `'private'`.

### B. Garages Table (Private & Owner-Only)
A new table for business info. **Crucial:** This table contains private contact info and must NOT be publicly readable by default.

- **Table:** `public.garages`
- **Fields:**
  - `id`: `uuid` (PK)
  - `owner_user_id`: `uuid` (FK to `profiles.id`, Unique)
  - `garage_name`: `text` (Required)
  - `city`: `text`
  - `contact_email`: `text` (Private)
  - `created_at`: `timestamptz`
- **RLS Policies (Strict):**
  - **SELECT:** Owner only (`owner_user_id = auth.uid()`). *No public access.*
  - **INSERT/UPDATE:** Owner only (`owner_user_id = auth.uid()` AND `profiles.role = 'garage'`).

### C. Atomic Operations (RPC Functions)

**1. Profile Creation Trigger (Reliability)**
- **Function:** `public.handle_new_user()`
- **Trigger:** `on_auth_user_created` (AFTER INSERT ON `auth.users`)
- **Logic:** Automatically inserts a row into `public.profiles` with `role = 'private'`.
- **Safety:** Uses `ON CONFLICT DO NOTHING` to prevent errors if a profile somehow exists.

**2. Upgrade to Garage (Transaction)**
- **Function:** `public.upgrade_to_garage(garage_name, city, contact_email)`
- **Logic:** Executed as a single transaction:
  1.  Update `profiles.role` to `'garage'` for the calling user.
  2.  Insert row into `garages` table.
- **Why:** Prevents "broken state" where a user has the role but no garage record.

---

## 2. Frontend Architecture (Next.js Pages Router + SSR)

*We leverage Server-Side Rendering (SSR) for secure, flicker-free routing.*

### A. Dashboard Routing (`src/pages/dashboard.tsx`)
- **Mechanism:** `getServerSideProps`
- **Logic:**
  1.  Fetch user session/profile server-side.
  2.  Check `role`.
  3.  **Redirect (307 Temporary):**
      - If `private` → `/dashboard/private`
      - If `garage` → `/dashboard/garage`
      - If `admin` → `/admin` (or generic dashboard)
      - If unauthenticated → `/auth`

### B. Protected Dashboards
- **`src/pages/dashboard/private.tsx`**:
  - Uses `getServerSideProps` to ensure `role === 'private'`.
  - If mismatch, redirect to correct dashboard.
  - Contains the "Upgrade to Garage" UI.
- **`src/pages/dashboard/garage.tsx`**:
  - Uses `getServerSideProps` to ensure `role === 'garage'`.
  - If mismatch, redirect.

### C. Upgrade Flow (Client Side)
- **UI:** Simple form in `PrivateDashboard`.
- **Action:** Calls `supabase.rpc('upgrade_to_garage', { ... })`.
- **On Success:** Force reload or redirect to `/dashboard/garage`.

---

## 3. Implementation Steps

### Phase 1: Database Foundation (Critical)
1.  **Migration:** Safe update of existing roles (`user` -> `private`).
2.  **Constraints:** Apply `CHECK (role IN ...)` and defaults.
3.  **Trigger:** Create/Verify `handle_new_user` trigger.
4.  **Table:** Create `garages` table with RLS (Owner-only).
5.  **RPC:** Create `upgrade_to_garage` database function.

### Phase 2: Frontend Routing & Security
6.  **Page Logic:** Refactor `dashboard.tsx` to use `getServerSideProps`.
7.  **New Pages:** Create `/dashboard/private` and `/dashboard/garage` with SSR role checks.
8.  **Service:** Update `authService` or `userManagementService` to include the `upgrade_to_garage` RPC call.

### Phase 3: Verification (Definition of Done)
9.  **Test Signup:** Create new user -> Verify DB profile exists with `role='private'`.
10. **Test Migration:** Verify existing users are now `private` and can log in.
11. **Test RLS:** Attempt to read another user's garage -> Should fail.
12. **Test Upgrade:** Use UI to upgrade -> Verify DB transaction (Role update + Garage insert).
13. **Test Routing:** Login as private -> Auto-redirect to `/dashboard/private`. Login as garage -> Auto-redirect to `/dashboard/garage`.

---

## 4. Caution & Constraints
- **Do NOT** touch existing `listings` or `leasing` logic.
- **Do NOT** expose `garages` to public SELECT.
- **Do NOT** rely on client-side redirects for access control.
