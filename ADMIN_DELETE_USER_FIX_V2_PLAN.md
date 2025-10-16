
# Plan: Fix Admin User Deletion 403 Error (v2)

**1. File to Modify**: `src/pages/api/admin/delete-user.ts`

**2. Problem**: The API route incorrectly uses a low-privileged Supabase client (with the `anon` key) to check if the requesting user has the `admin` role. This check fails due to Row Level Security (RLS) on the `profiles` table, resulting in a `403 Forbidden` error, even for authenticated admins.

**3. Solution**: Refactor the API route to use a privileged client (with the `service_role` key) for checking the user's role. This bypasses RLS and allows for a correct permission check on the server.

    *   **Step 1: Authenticate User**: After receiving the request, first validate the user's identity by calling `supabase.auth.getUser(token)` with the standard `anon` client. This confirms the token is valid and belongs to a real user.

    *   **Step 2: Create Admin Client**: Immediately after successful authentication, create a `supabaseAdmin` client using the `SUPABASE_SERVICE_ROLE_KEY`.

    *   **Step 3: Check Role with Admin Privileges**: Use the `supabaseAdmin` client to query the `profiles` table for the authenticated user's ID (`user.id`) and check if their `role` is `admin`. This privileged query will bypass RLS.

    *   **Step 4: Execute Deletion**: If the user is confirmed to be an admin, proceed with the user deletion using the same `supabaseAdmin` client.

**4. Outcome**: The `/api/admin/delete-user` endpoint will correctly identify admin users by securely checking their role on the server, resolving the `403 Forbidden` error and allowing user deletion to succeed as intended.
