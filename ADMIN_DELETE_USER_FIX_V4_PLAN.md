## Admin User Deletion Fix Plan (V4)

**Goal:** Fix the "Invalid API key" error during the admin status check in the `delete-user` API route.

**Problem Analysis:**
The Vercel logs clearly show that the API call fails at Step 3 when trying to fetch the user's profile to check their role. The error is `Invalid API key`. This happens because the query to the `profiles` table is being made with the standard user-authenticated client, which appears to lack the correct permissions or is using a faulty `anon` key for database queries.

**Solution:**
The check for a user's admin role is an administrative action and should be performed by a client with administrative privileges. The fix is to use the `supabaseAdmin` client (initialized with the `SUPABASE_SERVICE_ROLE_KEY`) to fetch the user's profile. This client has the necessary permissions to bypass any RLS policies and read from the `profiles` table.

**Implementation Steps:**

1.  **Modify `src/pages/api/admin/delete-user.ts`:**
    *   Locate the line responsible for fetching the user profile:
        ```typescript
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          // ...
        ```
    *   Change `supabase` to `supabaseAdmin` to use the client with service role privileges:
        ```typescript
        const { data: profile, error: profileError } = await supabaseAdmin
          .from("profiles")
          // ...
        ```

This change will ensure the admin check is performed reliably, resolving the "Invalid API key" error and allowing the rest of the function to execute as intended.
