
# Plan: Fix 400 Error on `get_all_users_with_profiles` RPC

## 1. Problem Diagnosis

- **Symptom:** The admin dashboard fails to load the list of users, showing a "Fehler beim Laden der Benutzer" toast notification.
- **Root Cause:** A `400 Bad Request` error is returned from the Supabase RPC call to `get_all_users_with_profiles`.
- **Hypothesis:** The SQL inside the `get_all_users_with_profiles` function is flawed. It likely uses an `INNER JOIN` between `auth.users` and `public.profiles`. This fails if a user exists in the `auth` schema but does not have a corresponding record in the `profiles` table, leading to an error within the function's execution.

## 2. Plan of Action

### Step 1: Analyze Frontend Implementation
- **Files to check:** `src/services/userManagementService.ts` and `src/components/admin/UsersView.tsx`.
- **Goal:** Understand how the `rpc` function is called from the client-side code. This will confirm no incorrect parameters are being passed.

### Step 2: Retrieve and Analyze the Database Function
- **Action:** Use `get_database_schema` or query `pg_proc` to get the current SQL definition for the `get_all_users_with_profiles` function.
- **Goal:** Confirm the use of `INNER JOIN` and identify it as the point of failure.

### Step 3: Correct the SQL Function
- **Action:** Draft a new `CREATE OR REPLACE FUNCTION` statement.
- **Correction:** The new function will use a `LEFT JOIN` from `auth.users` to `public.profiles`. This ensures all authenticated users are returned, with `NULL` values for profile fields if no profile exists.
- **Code:**
  ```sql
  CREATE OR REPLACE FUNCTION get_all_users_with_profiles()
  RETURNS TABLE (
      user_id uuid,
      email text,
      created_at timestamptz,
      last_sign_in_at timestamptz,
      full_name text,
      is_admin boolean
  )
  LANGUAGE sql
  SECURITY DEFINER
  AS $$
    SELECT
        u.id as user_id,
        u.email,
        u.created_at,
        u.last_sign_in_at,
        p.full_name,
        p.is_admin
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.user_id;
  $$;
  ```

### Step 4: Apply the Fix and Verify
- **Action:** Execute the corrected SQL using the `execute_sql_query` tool.
- **Verification:** After the function is updated, the admin "Benutzer" tab should load all users without error. The app should be refreshed to test the result.
