
# Plan to Remove Duplicate Header

## 1. Objective
Remove the secondary header banner appearing on the dashboard page to leave only the single, main site header.

## 2. Analysis
- **Problem:** The dashboard page (`/dashboard`) displays two header components.
- **Cause:** The page component at `src/pages/dashboard.tsx` explicitly renders a `<DashboardHeader />`. This is in addition to the primary `<Header />` that is likely rendered by a global layout component (e.g., in `_app.tsx`).
- **Desired State:** Only the main, site-wide navigation header should be visible on the dashboard page.

## 3. Implementation Steps
1.  **Edit Page Component:** Open the file `src/pages/dashboard.tsx`.
2.  **Locate Redundant Code:** Find the JSX tag `<DashboardHeader />`.
3.  **Remove Redundant Code:** Delete the entire `<DashboardHeader />` line from the file.
4.  **Verification:** Confirm that all necessary user actions (like "Logout") are available within the main header's user menu. The dashboard page should now render cleanly with only one header.
