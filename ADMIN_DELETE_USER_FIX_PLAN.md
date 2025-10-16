# Admin User Deletion - 403 Forbidden Error Fix Plan

## 1. Problem Diagnosis

When an admin attempts to delete a user from the `/admin` page, the operation fails with a `403 Forbidden` error.

- **Error Log:** `AuthApiError: User not allowed`
- **Root Cause:** The client-side code (`src/services/userManagementService.ts`) is attempting to call `supabase.auth.admin.deleteUser()`. This is a privileged, admin-level operation that requires the `service_role` key. For security, Supabase correctly blocks this action when initiated from a browser.

## 2. Solution: Secure API Route Proxy

We will create a secure server-side API endpoint to act as a trusted proxy for this operation. This ensures the `service_role` key is never exposed to the client.

**The correct flow will be:** Admin UI (Browser) → Our Secure API Route → Supabase Admin API → SUCCESS!

## 3. Implementation Steps

### Step 1: Create the Secure API Endpoint

1.  **Create a new file:** `src/pages/api/admin/delete-user.ts`.
2.  **Implement the API logic:**
    - The handler will be an `async` function that accepts `req` and `res`.
    - It must handle `POST` requests only.
    - **Security Check:** It will use the Supabase JS library to check if the incoming request is from a logged-in user with an `admin` role. If not, it will return a `401 Unauthorized` or `403 Forbidden` error.
    - **Create Admin Client:** It will initialize a new Supabase client using `process.env.NEXT_PUBLIC_SUPABASE_URL` and the secret `process.env.SUPABASE_SERVICE_ROLE_KEY`.
    - **Execute Deletion:** It will use this admin client to call `supabaseAdmin.auth.admin.deleteUser(userId)`.
    - **Respond:** It will return a `200 OK` on success or a `500` status with an error message on failure.

### Step 2: Update the Client-Side Service

1.  **Modify file:** `src/services/userManagementService.ts`.
2.  **Rewrite `deleteUser` function:**
    - The function will no longer call `supabase.auth.admin.deleteUser()` directly.
    - It will be changed to make an asynchronous `fetch` call to our new API endpoint: `/api/admin/delete-user`.
    - It will send the `userId` in the `body` of a `POST` request.
    - It will check the response from the API call. If the response is not `ok`, it will throw an error to be caught by the UI.

### Step 3: Cleanup (Optional but Recommended)

- The current `deleteUser` service function attempts to delete listings and profiles before deleting the auth user. If the database has `ON DELETE CASCADE` set up correctly on the `listings.user_id` and `profiles.id` foreign keys (referencing `auth.users.id`), deleting the auth user via the admin API should automatically cascade and delete all related data.
- The new API route will only need to perform the `deleteUser` action, simplifying the logic. We will remove the redundant deletion steps from the client-side service.

This plan ensures the action is performed securely while providing the same user experience for the admin.
