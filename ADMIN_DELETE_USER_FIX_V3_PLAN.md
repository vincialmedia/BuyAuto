
# Admin Delete User Fix v3 - Diagnostic Plan

This plan outlines the steps to diagnose and permanently fix the recurring `403 Forbidden` error when an admin tries to delete a user.

## Problem Analysis

The `DELETE /api/admin/delete-user` endpoint is failing with a `403 Forbidden - Admin access required` error, even when the request is initiated by a logged-in admin. The previous fix, which involved using the `SUPABASE_SERVICE_ROLE_KEY`, was not sufficient. This indicates that the server-side admin check is still failing.

The most likely causes are:
1.  The `SUPABASE_SERVICE_ROLE_KEY` environment variable is missing, incorrect, or not accessible in the Vercel serverless function environment.
2.  The database query to fetch the user's role is failing for another reason (e.g., incorrect user ID, RLS issue not bypassed).
3.  The user's role in the `profiles` table is not exactly `"admin"`.

## Diagnostic Strategy

The core of this plan is to add detailed, step-by-step logging to the API route to trace the execution flow and inspect key variables on the server.

### Step 1: Add Enhanced Logging

Modify `src/pages/api/admin/delete-user.ts` to add `console.log` and `console.error` statements at every critical step:

- Log entry into the handler.
- Check and log the presence of `SUPABASE_SERVICE_ROLE_KEY`.
- Log the result of `supabase.auth.getUser(token)`.
- Log the ID of the user attempting the action.
- Log the error if the admin client fails to retrieve the user's profile.
- Log the retrieved profile data to inspect the `role`.
- Log the `userId` to be deleted.
- Log any errors from `supabaseAdmin.auth.admin.deleteUser(userId)`.

### Step 2: Deploy and Test

- Deploy the updated code.
- Ask the user to reproduce the error by attempting to delete a user.

### Step 3: Analyze Server Logs

- Access the serverless function logs in the Vercel dashboard.
- Analyze the output from the `console.log` statements to identify the exact point of failure.

### Step 4: Implement Final Fix

- Based on the log analysis, implement a targeted fix. This could involve:
  - Correcting the environment variables in Vercel.
  - Adjusting the database query.
  - Modifying the role check logic.

