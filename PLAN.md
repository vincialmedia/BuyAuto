# Implementation Plan: Listing Flow &amp; Dashboard Fixes

This document outlines the plan to resolve three issues:
1.  Incorrect plan display in the listing creation preview.
2.  Missing plan information in the admin dashboard.
3.  Missing plan information in the end-user dashboard.

---

### Problem 1: Fix Listing Creation Preview

**Goal:** Ensure the selected plan is correctly displayed on the final preview screen and the main call-to-action button has consistent text.

**Analysis:** The issue stems from the `price_plan` not being consistently passed to the final preview step (`Step5_Preview.tsx`) and conditional logic on the button text.

**Implementation Steps:**

1.  **Analyze `ListingWizard.tsx` and `Step3_PlanSelection.tsx`**:
    - Confirm that selecting a plan in `Step3_PlanSelection.tsx` correctly updates the shared state in `ListingWizard.tsx`.
    - Ensure the `price_plan` field is part of the `ListingWizardState`.

2.  **Modify `src/components/buyauto/create-listing/Step5_Preview.tsx`**:
    - Access the `price_plan` from the wizard's state within the component.
    - Add a new UI element in the summary section to display the chosen plan (e.g., "Gewählter Plan: Premium").
    - Locate the main submission button and change its text to be static: **"Inserat erstellen"**. This involves removing the conditional logic that currently shows "Inserat kostenfrei erstellen".

---

### Problem 2: Display Listing Plan in Admin Dashboard

**Goal:** Make the selected pricing plan visible for each listing in the admin dashboard for better moderation and overview.

**Analysis:** The `price_plan` column is available in the database but is not being fetched or displayed in the admin panel components.

**Implementation Steps:**

1.  **Update `src/services/adminService.ts`**:
    - Add a `price_plan: string;` property to the `AdminListing` TypeScript interface. The service already uses `select('*')`, which will fetch this column automatically. This change makes the data type-safe and accessible.

2.  **Modify `src/components/admin/ModerationView.tsx`**:
    - Add a new "Plan" column header to the main listings table.
    - In the table body, render the `listing.price_plan` value for each row.
    - Use a `<Badge>` component to style the plan name for better visual distinction.

3.  **Modify `src/components/admin/AllListingsView.tsx`**:
    - Replicate the same UI changes from `ModerationView.tsx` to this component.

---

### Problem 3: Display Listing Plan in User Dashboard

**Goal:** Allow end-users to see the plan associated with each of their listings in their personal dashboard.

**Analysis:** Similar to the admin dashboard, the user's dashboard currently does not fetch or display the `price_plan` for their listings.

**Implementation Steps:**

1.  **Update `src/services/dashboardService.ts`**:
    - Add a `price_plan: string;` property to the `UserListing` (or equivalent) TypeScript interface in this service.
    - Ensure the query fetching the user's listings includes the `price_plan`.

2.  **Modify `src/components/buyauto/dashboard/ListingsSection.tsx`**:
    - Add a new "Plan" column header to the user's listings table.
    - In the table body, render the `listing.price_plan` for each of the user's listings.
    - Use a `<Badge>` for consistency with the admin view.

---

This plan will be executed in **Standard Mode** upon approval.
