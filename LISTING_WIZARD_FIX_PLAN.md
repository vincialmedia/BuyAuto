# Listing Wizard "Missing ID" Fix Plan

## 1. Problem Diagnosis

After fixing the "duplicate listing" issue by deferring record creation to the final step, a new error emerged in Step 2: `❌ No listing ID found in wizard data`.

## 2. Root Cause

The previous fix was based on the incorrect assumption that only the first and last steps of the wizard interact with the database. In reality, intermediate steps (like Step 2) also need to perform `UPDATE` operations on the listing.

By removing the initial record creation in Step 1, these intermediate steps no longer had a `listing.id` to reference, causing the process to fail.

## 3. Solution: Adopt a "Draft" Workflow

The correct, robust solution is to create a single "draft" listing record at the very beginning and then progressively update it throughout the wizard.

### Implementation Steps:

1.  **Restore Initial Creation in Step 1**:
    -   Modify `Step1_VehicleData.tsx` to call `createOrUpdateListing` on submit.
    -   This will perform an `INSERT` since no ID exists.
    -   The newly generated `listingId` must be retrieved and saved into the `ListingWizard`'s central data context.

2.  **Fix Step 2 Logic**:
    -   Modify `Step2_LeasingDetails.tsx` to use the `listingId` from the wizard context.
    -   On submit, it will call `createOrUpdateListing`. With the `listingId` present, this will correctly perform an `UPDATE`.

3.  **Verify All Subsequent Steps**:
    -   Ensure that all other wizard steps (`Step3`, `Step4`, `Step5`) also use the `listingId` from context to perform `UPDATE` operations via the `createOrUpdateListing` service.

This approach ensures a single, stable record is used throughout the entire creation flow, solving both the original duplication bug and the subsequent "missing ID" error.
