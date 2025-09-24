
# Plan: Fix Database Schema for Draft Listings

## 1. The Problem

The application logic for creating a multi-step listing is in conflict with the database schema's strict `NOT NULL` constraints. The frontend tries to save a partial draft after Step 1, but the `listings` table requires fields that are only collected in later steps (e.g., price, location), causing an `HTTP 400 Bad Request` error.

Using placeholder values is an illogical workaround that masks the underlying design flaw.

## 2. The Solution: "Schema-First" Fix

The correct solution is to modify the database schema to properly support the concept of a "draft" listing. A draft, by definition, is an incomplete record.

I will alter the `listings` table to allow `NULL` values for columns that are not provided in the first step of the wizard.

## 3. Implementation Steps

### Step 3.1: Modify Database Schema

I will execute the following SQL `ALTER TABLE` commands to make the relevant columns optional (nullable):

```sql
ALTER TABLE listings ALTER COLUMN price_per_month_chf DROP NOT NULL;
ALTER TABLE listings ALTER COLUMN remaining_months DROP NOT NULL;
ALTER TABLE listings ALTER COLUMN location DROP NOT NULL;
ALTER TABLE listings ALTER COLUMN canton_code DROP NOT NULL;
```

This change allows a listing to be created with only the basic vehicle information from Step 1.

### Step 3.2: Refactor Frontend Code

With the database schema fixed, the frontend code can be cleaned up. I will modify `src/components/buyauto/create-listing/Step1_VehicleData.tsx`.

- **File to Modify**: `src/components/buyauto/create-listing/Step1_VehicleData.tsx`
- **Function to Update**: The `createInitialListing` async function.
- **Changes Required**:
    - Remove the unnecessary placeholder values for `price_per_month_chf`, `remaining_months`, `location`, and `canton_code` from the `listingInsert` object.

The resulting code will be cleaner, more logical, and directly aligned with the new, more flexible database schema.

### Code Snippet (After Refactor)
```typescript
// Inside src/components/buyauto/create-listing/Step1_VehicleData.tsx

const listingInsert = {
  user_id: user.id,
  created_by: user.id,
  brand: formData.brand,
  model: formData.model,
  year: Number(formData.year),
  mileage_km: Number(formData.km),
  fuel: formData.fuel,
  gearbox: formData.gearbox,
  body: formData.body,
  title: `${formData.brand} ${formData.model}`,
  status: "draft",
  // Other fields have defaults or are now nullable
};
```
