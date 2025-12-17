# Implementation Plan: "Verbleibende KM" (Remaining KM)

## 1. Analysis
- **Database**: `listings` table has `remaining_km` (integer, nullable).
- **Frontend Types**: `Listing` and `ListingData` in `types.ts` include `remaining_km`.
- **Step 2 (Leasing Details)**:
  - Schema includes `remaining_km`.
  - **MISSING**: JSX Input field.
  - **MISSING**: `onSubmit` payload mapping.
- **Display Components**:
  - `Step5_PreviewAndPay`: Includes display logic.
  - `ModernListingCard`: Includes display logic.
  - `fahrzeug/[id]`: Includes display logic.
- **Admin**:
  - `adminService.ts`: `AdminListing` interface missing `remaining_km`.
  - `ListingDetailsModal`: Missing input/display.

## 2. Implementation Steps

### Step A: Update Listing Wizard (Step 2)
**File:** `src/components/buyauto/create-listing/Step2_LeasingDetails.tsx`
- Add Input field for `remaining_km` (optional field).
- Update `onSubmit` to include `remaining_km: formData.remaining_km` in `updatePayload`.

### Step B: Update Admin Service
**File:** `src/services/adminService.ts`
- Update `AdminListing` interface to include `remaining_km: number | null;`.

### Step C: Update Admin Modal
**File:** `src/components/admin/ListingDetailsModal.tsx`
- Add `remaining_km` to `editData` state.
- Add Input field in the "Listing-Preis" or "Fahrzeugdaten" section to allow editing `remaining_km`.
- Update `handleSave` (should work automatically if `editData` is typed correctly).

## 3. Verification
- Create a new listing and verify "Verbleibende KM" is saved.
- Check the preview (Step 5).
- Check the final listing page.
- Check the Admin Dashboard to verify the field is visible/editable.