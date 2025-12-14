# Implementation Plan: "Verbleibende KM" (Remaining KM) Field

## Goal
Add a new field "Verbleibende KM" to listings, displayed on the right side under "Restlaufzeit".

## 1. Database Schema
- [ ] Create migration to add `remaining_km` (integer, nullable) to `listings` table.
- [ ] Run migration.
- [ ] Update Types (`src/integrations/supabase/database.types.ts` is auto-generated, but we need to ensure our app code uses it).

## 2. Type Definitions
- [ ] Update `Listing` interface in `src/lib/buyauto/types.ts` to include `remaining_km?: number`.
- [ ] Update `ListingFormData` schema/type in `src/lib/buyauto/schemas.ts` or local component state.

## 3. Listing Creation Wizard
- [ ] **Step 2 (Leasing Details):**
    - Modify `src/components/buyauto/create-listing/Step2_LeasingDetails.tsx`.
    - Add "Verbleibende KM" input field.
    - Update Zod validation schema to include `remaining_km`.
- [ ] **Step 5 (Preview):**
    - Modify `src/components/buyauto/create-listing/Step5_PreviewAndPay.tsx`.
    - Add "Verbleibende KM" to the summary list.
- [ ] **Service:**
    - Verify `src/services/createListingService.ts` passes the new field to Supabase.

## 4. Listing Display (Frontend)
- [ ] **Listing Card:**
    - Modify `src/components/buyauto/search/ModernListingCard.tsx` (and potentially `ListingCard.tsx` / `VerticalListingCard.tsx`).
    - Add "Verbleibende KM" display below/next to "Restlaufzeit".
    - Align it to the right as requested.
- [ ] **Detail Page:**
    - Modify `src/pages/fahrzeug/[id].tsx`.
    - Add "Verbleibende KM" to the details grid.

## 5. Admin & Editing
- [ ] **Admin Dashboard:**
    - Modify `src/components/admin/ListingDetailsModal.tsx`.
    - Add input/display for `remaining_km` to allow editing.
- [ ] **Update Service:**
    - Verify `src/services/listingsService.ts` handles updates for this field.

## 6. Verification
- [ ] Check migration status.
- [ ] Create a test listing with the new field.
- [ ] Verify display on card and detail page.
- [ ] Verify admin edit functionality.