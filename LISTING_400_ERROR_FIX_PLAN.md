# Plan: Fix 400 Bad Request on Step 1 of Listing Creation

## 1. Problem Analysis

The user is encountering a `400 Bad Request` error from Supabase when submitting the first step of the "Create Listing" wizard.

-   **Symptom:** The browser console shows a `POST` request to `/rest/v1/listings` failing with a 400 status code.
-   **Root Cause:** The `handleVehicleDataSubmit` function in `Step1_VehicleData.tsx` is constructing a data payload that includes both a `km` field and a `mileage_km` field. The `listings` table in the database only has a `mileage_km` column. Sending a non-existent `km` column causes the database to reject the insert operation.

## 2. Proposed Solution

The fix involves correcting the data payload sent during the initial draft listing creation to match the database schema precisely.

-   **File to Modify:** `src/components/buyauto/create-listing/Step1_VehicleData.tsx`
-   **Function to Modify:** `handleVehicleDataSubmit`
-   **Specific Change:** In the `validatedData` object within the function, I will remove the `km` property. The `mileage_km` property, which correctly maps the form input to the database column, will be retained.

**Before:**
```javascript
const validatedData = {
  //...
  mileage_km: parseInt(formData.km.toString()), 
  km: parseInt(formData.km.toString()), // This redundant field causes the error
  //...
};
```

**After:**
```javascript
const validatedData = {
  //...
  mileage_km: parseInt(formData.km.toString()), // This is the correct field
  // The 'km' field will be removed
  //...
};
```

## 3. Impact and Risk Assessment

-   **Impact:** This change will fix the bug preventing users from creating a listing. The listing wizard will correctly create a single "draft" listing in the database and allow the user to proceed to the next step.
-   **Risks:** The risk is extremely low. This is a highly targeted fix that only affects the data structure of a single API call. It has no impact on other features like authentication, payments, or the admin dashboard. The fix corrects a clear bug where the front-end code was not aligned with the database schema.
