# Plan: Fix Listing Creation Error (HTTP 400)

## 1. The Problem

When a user submits Step 1 of the "Create Listing" wizard, the application tries to create a draft entry in the `listings` database table. This action fails with an `HTTP 400 Bad Request` error.

## 2. Root Cause

The `listings` table has several columns that are defined with a `NOT NULL` constraint, meaning they must have a value. The most critical one missing in the initial insert request is `canton_code`. The `location` field is also required.

The code in `src/components/buyauto/create-listing/Step1_VehicleData.tsx` does not provide a value for `canton_code` when creating the initial draft, which violates the database schema and causes the error.

## 3. The Solution

The solution is to modify the `createInitialListing` function within `src/components/buyauto/create-listing/Step1_VehicleData.tsx` to include valid, temporary placeholder values for all `NOT NULL` columns.

This will satisfy the database constraints, allowing the draft listing to be created successfully. These placeholder values will be overwritten with the user's actual data in the subsequent steps of the wizard.

## 4. Implementation Steps

1.  **File to Modify**: `src/components/buyauto/create-listing/Step1_VehicleData.tsx`
2.  **Function to Update**: `createInitialListing`
3.  **Changes Required**:
    -   Locate the `listingInsert` object.
    -   Add the `canton_code` field with a default placeholder value (e.g., `'ZH'`).
    -   Update the `location` field to a more descriptive placeholder (e.g., `'Wird später hinzugefügt'`).

### Code Snippet (for implementation)

```typescript
// Inside src/components/buyauto/create-listing/Step1_VehicleData.tsx

// ... inside createInitialListing function
const listingInsert = {
  user_id: user.id,
  brand: formData.brand,
  model: formData.model,
  year: Number(formData.year),
  mileage_km: Number(formData.km),
  fuel: formData.fuel,
  gearbox: formData.gearbox,
  body: formData.body,
  // Set default values for required fields that will be filled in later steps
  price_per_month_chf: 0, 
  remaining_months: 1, // Default to 1 month
  location: "Wird später hinzugefügt", // ✅ ADDED placeholder
  canton_code: "ZH", // ✅ ADDED placeholder for NOT NULL column
  title: `${formData.brand} ${formData.model}`,
  price_plan: "free30", // Use a valid default plan
  status: "draft",
  images: [],
  cover_image_index: 0,
  premium: false,
  duration_days: 30
};
// ... rest of the function
```

## 5. Next Steps

To apply this fix, please switch to **Standard Mode** and I will implement the changes as outlined above.
