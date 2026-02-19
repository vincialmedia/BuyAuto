# Garage Dashboard Redesign Plan

This plan outlines the steps to restructure the Garage Dashboard, expand profile management capabilities, and implement view statistics.

## Phase 1: Database Updates

### 1. Update `garages` Table
Add the following columns to support the new public profile features:
- `slug` (text, unique): For the public URL `buyauto.ch/[garage_name]`.
- `description` (text): For the "Bio" / "Über uns" section.
- `phone_number` (text): Public contact number.
- `website_url` (text): Link to their external website.
- `header_image_url` (text): URL for the profile header/banner image.
- `opening_hours` (jsonb): Structure for storing weekly opening times.
- `services` (text[] or jsonb): List of services offered (e.g., "Werkstatt", "Reifenwechsel").
- `google_reviews_snippet` (jsonb): Placeholder for future Google Reviews integration.

### 2. Update `listings` Table
- Add `view_count` (integer, default 0): To track how many times a listing is viewed.

### 3. Migration SQL
```sql
-- Add profile fields to garages table
ALTER TABLE garages 
ADD COLUMN IF NOT EXISTS slug text UNIQUE,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS phone_number text,
ADD COLUMN IF NOT EXISTS website_url text,
ADD COLUMN IF NOT EXISTS header_image_url text,
ADD COLUMN IF NOT EXISTS opening_hours jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS services text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS google_reviews_snippet jsonb DEFAULT '{}'::jsonb;

-- Add view tracking to listings
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0;

-- Create index for faster slug lookups
CREATE INDEX IF NOT EXISTS idx_garages_slug ON garages(slug);
```

## Phase 2: Dashboard UI Restructuring

### 1. Navigation Overhaul (`GarageDashboard.tsx`)
- Replace the existing `Tabs` structure with a new layout focusing on 3 main sections:
  1.  **Inventar** (Inventory)
  2.  **Profil Daten** (Profile Data)
  3.  **Abonnemente** (Subscriptions/Billing)

### 2. Inventar Section
- **Sub-Navigation**: Implement a prominent toggle/switcher at the top for:
  -   **Aktive Inserate**: Shows the `ListingsSection` component.
  -   **Entwürfe**: Shows the `DraftsSection` component.
- **Components**:
  -   Refactor `ListingsSection.tsx` to *only* show active listings (remove the embedded `DraftsSection` import if present).
  -   Ensure `DraftsSection.tsx` is styled consistently with the active listings view.

### 3. Abonnemente Section
- Rename "Zahlung" tab to "Abonnemente".
- Keep the existing `GarageBillingTab` component functionality.

## Phase 3: Profile Management (`GarageProfileTab.tsx`)

Create a new component `GarageProfileTab` to handle the expanded profile data form.

### UI Sections:
1.  **Basis-Infos**:
    -   **Garage Name**: (Existing)
    -   **Slug**: Auto-generated from name, but editable. Validation for uniqueness.
    -   **Logo Upload**: (Existing)
    -   **Header Bild Upload**: New dropper/upload area for the banner image.
2.  **Kontakt & Bio**:
    -   **Beschreibung (Bio)**: Textarea for `description`.
    -   **Telefon**: Input for `phone_number`.
    -   **E-Mail**: (Existing `contact_email`)
    -   **Webseite**: Input for `website_url`.
    -   **Adresse**: (Existing `city`, maybe expand to full address if needed).
3.  **Öffnungszeiten**:
    -   A structured weekly schedule editor (Montag - Sonntag).
    -   Inputs for "Von" and "Bis", plus a "Geschlossen" toggle per day.
4.  **Dienstleistungen**:
    -   A dynamic list or tag input for `services`.

## Phase 4: Stats & View Counting

### 1. View Counting Implementation
- **Increment Logic**:
  -   Create a database function `increment_listing_view(listing_id uuid)` to safely increment the counter.
  -   Call this function via RPC in `src/pages/fahrzeug/[id].tsx` (server-side or client-side effect).
  -   *Optimization*: Use `localStorage` or session check to prevent duplicate counts from the same user in a short session (optional MVP).

### 2. Dashboard Stats Update
- Update `dashboardService.getDashboardStats()` to include a sum of `view_count` from all user listings.
- Add a new "Views" card to the `statCards` array in `GarageDashboard.tsx`.

## Implementation Steps

1.  **Execute Database Migration**: Apply the schema changes.
2.  **Regenerate Types**: Update TypeScript definitions.
3.  **Update Services**:
    -   Update `garageService.ts` to handle new profile fields.
    -   Update `dashboardService.ts` to fetch view counts.
4.  **Refactor Dashboard**:
    -   Modify `GarageDashboard.tsx` layout and tabs.
    -   Create `GarageProfileTab.tsx`.
    -   Split/Clean up `ListingsSection` and `DraftsSection` usage.
5.  **Implement View Counting**: Add the increment logic to the listing detail page.