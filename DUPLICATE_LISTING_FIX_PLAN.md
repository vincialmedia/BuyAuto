
# Duplicate Listing Creation Fix Plan

## 1. Problem Diagnosis

When a user creates a new listing, two separate records are created in the `listings` database table.
- **Record 1**: Created during Step 1 of the wizard (`Step1_VehicleData.tsx`), containing only basic vehicle information.
- **Record 2**: Created during the final step of the wizard (likely `Step5_Preview.tsx`), containing all the information gathered throughout the process.

This happens because the process involves two separate `insert` operations instead of a single `insert` followed by subsequent `update` operations.

## 2. Root Cause

- `Step1_VehicleData.tsx` calls a function (`createInitialListing`) that performs an `INSERT` operation.
- A later step calls the `createListing` function from `createListingService.ts`, which also performs an `INSERT` operation, creating the duplicate.

The core issue is the lack of a unified "create or update" logic. The system should create a listing once and then only update it.

## 3. Solution

The fix is to consolidate the creation and update logic into a single, intelligent service function.

### Implementation Steps:

1.  **Refactor `createListingService.ts`**:
    -   Rename the `createListing` function to `createOrUpdateListing`.
    -   Modify this function to accept an optional `id` from the `ListingFormData`.
    -   If an `id` is present, the function will perform an `UPDATE` on the existing listing.
    -   If no `id` is present, it will perform an `INSERT` to create a new listing.
    -   The function will always return the `id` of the listing (either the existing one or the newly created one).

2.  **Update Component Calls**:
    -   All components that currently call `createListing` or `updateListing` will be modified to call the new `createOrUpdateListing` function, passing the complete data from the wizard context. This ensures a single point of entry for saving listing data.

This approach guarantees that only one listing record is ever created and that it is progressively updated throughout the wizard, completely resolving the duplication issue.
