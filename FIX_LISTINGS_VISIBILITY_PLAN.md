
# Plan: Fix Listings Not Appearing in Admin Backend

## 1. The Problem
Admin users can see correct statistics for listings (pending, approved, etc.) on the dashboard, but the main table view shows "Keine Inserate gefunden" (No listings found), even when filters are set to states with existing listings.

## 2. Analysis
The issue is likely caused by one of the following:
- The Supabase query in `adminService.ts` is failing or returning empty data due to a reference to a non-existent or renamed column from a recent refactor.
- A client-side rendering error in `AllListingsView.tsx` or `ModerationView.tsx` is preventing the list from being displayed.
- An issue with the filtering logic.

The primary suspect is the `getListings` function in `adminService.ts`.

## 3. The Solution
I will implement the following steps to resolve the issue:

### Step 1: Examine and Correct the Data Fetching Service
I will analyze the `getListings` function within `src/services/adminService.ts`. I'll carefully review the `select()` statement to ensure all requested columns exist in the `listings` table. I'll remove any invalid columns and ensure it correctly fetches all data needed for the admin view.

### Step 2: Validate Frontend Components
I will inspect `src/components/admin/AllListingsView.tsx` and `src/components/admin/ModerationView.tsx` to confirm they are using the correct properties from the fetched listing objects and that there are no silent rendering errors.

### Step 3: Implement and Verify
I will apply the necessary code changes. After implementation, I will run the build and tests to ensure the fix works correctly and hasn't introduced any new issues.

By following this plan, I will restore the visibility of listings in the admin backend.
