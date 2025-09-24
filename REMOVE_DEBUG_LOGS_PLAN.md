# Plan: Remove Debugging Console Logs

**Goal:** Remove the `console.log` statements that are outputting the Supabase session object to the browser console on the `inserat-erstellen` page. This is a cleanup task now that the underlying authentication issues are resolved.

**Analysis:**
The session object is likely being logged from one of two places:
1.  The client-side component that calls the API (`src/components/buyauto/create-listing/Step3_PlanSelection.tsx`).
2.  The API route itself (`src/pages/api/billing/prepare.ts`), where the log might have been added to debug server-side auth. The previous fixes involving `@supabase/ssr` make this the most likely location.

**Execution Steps:**
1.  **Inspect `src/pages/api/billing/prepare.ts`**: Open the file and search for `console.log` statements that might be printing the `user` or `session` object.
2.  **Remove the Log**: Delete the identified `console.log` statement.
3.  **Inspect `src/components/buyauto/create-listing/Step3_PlanSelection.tsx`**: Check for any similar logs as a secondary measure.
4.  **Validate**: After removal, confirm that the page functions correctly and the large JSON object no longer appears in the console.
