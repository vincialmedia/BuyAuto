
# Plan: Final Fix for Listing Creation Error (HTTP 400)

## 1. The Problem

Despite fixing the missing `canton_code`, the application still receives an `HTTP 400 Bad Request` error when creating a draft listing in Step 1.

## 2. Root Cause Analysis

The `400` error code points to a data validation failure. After reviewing the database schema again, the most likely culprit is a `CHECK` constraint on the `price_per_month_chf` column. 

Database price columns are almost always constrained to be positive values (e.g., `price > 0`). In the previous fix, the code sets a placeholder value of `price_per_month_chf: 0`, which violates this constraint and causes the entire database `INSERT` operation to fail.

## 3. The Solution

The solution is to change the placeholder value for `price_per_month_chf` from `0` to a valid, non-zero integer like `1`. This will satisfy the database's `CHECK` constraint, allowing the draft listing to be created successfully.

This value is only temporary and will be correctly updated with the user's input in Step 2 of the wizard.

## 4. Implementation Steps

1.  **File to Modify**: `src/components/buyauto/create-listing/Step1_VehicleData.tsx`
2.  **Function to Update**: The `createInitialListing` async function.
3.  **Changes Required**:
    -   Locate the `listingInsert` object.
    -   Change the value of `price_per_month_chf` from `0` to `1`.

### Code Snippet (for implementation)

```typescript
// Inside src/components/buyauto/create-listing/Step1_VehicleData.tsx

const listingInsert = {
  // ... other fields
  price_per_month_chf: 1, // ✅ FIXED: Changed from 0 to 1 to pass CHECK constraint
  remaining_months: 12, 
  // ... rest of the fields
};
```

## 5. Next Steps

To apply this fix, please switch to **Standard Mode**, and I will implement the change as outlined above. This should finally resolve the listing creation error.
