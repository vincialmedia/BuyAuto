
# Listing Visibility &amp; Access Control Implementation Plan

This document outlines the strategy for implementing role-based access control for listings, ensuring data is segregated between public, user, and admin views.

## Phase 1: Database Schema &amp; Security

We will apply the necessary SQL objects to the Supabase database. This will enforce security at the data layer, which is the most secure approach.

### 1.1. RLS Policies &amp; `created_by` Trigger

The following SQL script will be executed to:
1.  Enable RLS on the `public.listings` table.
2.  Create a trigger function to automatically stamp the `created_by` field with the current user's ID.
3.  Create RLS policies for public, owner, and admin roles.

```sql
-- Enable RLS on the listings table
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Function and Trigger to stamp created_by on new listings
CREATE OR REPLACE FUNCTION public.set_listing_creator()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger to prevent duplication
DROP TRIGGER IF EXISTS on_listing_created ON public.listings;

-- Create the trigger
CREATE TRIGGER on_listing_created
  BEFORE INSERT ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.set_listing_creator();

-- Purge existing policies to start fresh and avoid conflicts
DROP POLICY IF EXISTS "public_read_published" ON public.listings;
DROP POLICY IF EXISTS "owner_select" ON public.listings;
DROP POLICY IF EXISTS "owner_insert" ON public.listings;
DROP POLICY IF EXISTS "owner_update" ON public.listings;
DROP POLICY IF EXISTS "owner_delete" ON public.listings;
DROP POLICY IF EXISTS "admin_all" ON public.listings;

-- 1. Public can only read PUBLISHED listings (for anonymous and authenticated users on public pages)
CREATE POLICY "public_read_published"
  ON public.listings FOR SELECT
  USING (status = 'published');

-- 2. Owners can manage their own listings (for dashboard)
-- We combine owner policies into one for simplicity, but the user requested separate ones.
-- Sticking to the user's request for clarity.
CREATE POLICY "owner_select"
  ON public.listings FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "owner_insert"
  ON public.listings FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "owner_update"
  ON public.listings FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "owner_delete"
  ON public.listings FOR DELETE
  USING (created_by = auth.uid());

-- 3. Admins can do everything. This relies on a 'role' custom claim in the user's JWT.
-- This assumes the custom claim is being set correctly (e.g., via a 'profiles' table and trigger).
CREATE POLICY "admin_all"
  ON public.listings FOR ALL
  USING (((current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'admin'))
  WITH CHECK (((current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'admin'));
```

### 1.2. Public-Facing Security View

A PostgreSQL VIEW will be created to provide a safe, pre-filtered subset of data for all public-facing queries (Homepage, Search, Listing Detail). This prevents any possibility of unpublished data leaking to the UI.

```sql
CREATE OR REPLACE VIEW public.public_listings AS
  SELECT
    id,
    brand,
    model,
    year,
    price_per_month_chf,
    remaining_months,
    location,
    canton_code,
    mileage_km,
    fuel,
    gearbox,
    body,
    (premium AND (premium_until IS NULL OR premium_until > now())) AS premium,
    cover_image_url,
    image_urls,
    created_at,
    status -- For sanity checking, though it will always be 'published'
  FROM public.listings
  WHERE status = 'published';
```

## Phase 2: Service Layer Refactoring

The TypeScript services will be updated to query the correct database objects. The Supabase client will be used with the user's session, so RLS policies are automatically applied.

### 2.1. Public Data Services (`listingsService.ts`, page-level data fetching)

-   **`searchListings` (in `src/lib/buyauto/search.ts`):** This function, which powers the `/suche` page, will be modified to query `public.public_listings` instead of `public.listings`.
-   **`getListingById` (in `src/pages/fahrzeug/[id].tsx`):** The server-side data fetching for the detail page will also query `public.public_listings`. This ensures a user cannot access a pending/rejected listing by guessing the URL.
-   **Homepage Queries (in `src/pages/index.tsx`):** Data fetching for premium listings on the homepage will also be pointed to the `public.public_listings` view.

### 2.2. User Dashboard Services (`dashboardService.ts`)

-   **`getUserListings`:** This function will continue to query `public.listings`. Because the user is authenticated, the `owner_select` policy will activate, automatically filtering results to only those where `created_by = auth.uid()`. This correctly shows them all their listings, regardless of status.

### 2.3. Admin Services (`adminService.ts`)

-   **`getAllListings`, `getModerationQueue`:** These functions will continue to query `public.listings`. For a logged-in admin (with the correct JWT claim), the `admin_all` policy will bypass other restrictions, granting full access to all records.

## Phase 3: UI and Formatting

-   **Currency Formatting:** A utility function will be created or updated in `src/lib/utils.ts` to format numbers into the `CHF 1’290 / Monat` style. This will be applied in `ListingCard.tsx`, `[id].tsx`, and other relevant components.
-   **Component Review:** Components in `/dashboard` and `/admin` will be checked to ensure they correctly display all listing statuses (`StatusBadge.tsx`).

## Phase 4: Verification

The implementation will be tested against the user's acceptance criteria:
1.  ✅ Logged-out user sees only `published` listings.
2.  ✅ User A sees only User A's listings in their dashboard.
3.  ✅ User B sees only User B's listings in their dashboard.
4.  ✅ Admin sees all listings in the admin dashboard.
5.  ✅ `created_by` is auto-stamped on creation.
6.  ✅ A newly `published` listing appears on the public site.
7.  ✅ `pending`/`rejected` listings never appear on the public site.
