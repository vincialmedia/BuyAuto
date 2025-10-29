# Admin Access &amp; Redirect Loop Fix Plan

## 1. The Problem

A logged-in admin is trapped in a redirect loop between `/auth` and `/admin`. The `/admin` page incorrectly determines the user is not an admin and redirects them to `/auth?message=Kein%20Zugriff` ("No Access").

## 2. Root Cause Analysis

The issue stems from the `checkAdminRole` function within `src/contexts/AuthContext.tsx`. This function fails to correctly identify the user as an admin, causing the `isAdmin` state to be `false`. The security guard on the `/admin` page then correctly denies access, triggering the redirect loop.

The failure is likely due to one of the following:
- Incorrect Row Level Security (RLS) on the `profiles` table.
- The `role` column for the admin user in the `profiles` table is not set to the string `'admin'`.
- The admin user lacks a profile entry entirely.

## 3. The Solution

We will take a three-step approach to diagnose and fix the `isAdmin` check permanently.

### Step 1: Add Diagnostic Logging (Implementation)

To confirm our diagnosis, we will add more detailed logging to `src/contexts/AuthContext.tsx`.

**File to Modify:** `src/contexts/AuthContext.tsx`

**Action:** In the `checkAdminRole` function, add logging to display the raw data returned from the database.

```typescript
// Inside checkAdminRole function, after the supabase query:

if (error) {
  console.error('Error checking admin role:', error);
  // Add this log:
  console.log('[ADMIN CHECK FAILED] Due to database error.');
  setIsAdmin(false);
} else {
  // Add these logs:
  console.log('[ADMIN CHECK DATA] Raw profile data from DB:', data);
  const role = data?.role ?? 'user';
  console.log(`[ADMIN CHECK RESULT] Role resolved to: '${role}'. Is admin: ${role === 'admin'}`);
  setIsAdmin(role === 'admin');
}
```

This will show us in the browser console exactly what the database is returning and why the check is failing.

### Step 2: Verify and Fix RLS on `profiles` Table (User Action)

The most common cause for this issue is an RLS policy that prevents users from reading their own profiles.

**Action:** Go to your Supabase SQL Editor and run the following query. This ensures that every authenticated user can read their own profile.

```sql
-- First, drop the old SELECT policy if it exists, to avoid conflicts.
-- Replace "Users can view their own records" with your actual policy name if different.
DROP POLICY IF EXISTS "Users can view their own records" ON public.profiles;

-- Create a new, correct SELECT policy.
CREATE POLICY "Users can view their own profiles" ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Also, ensure users can update their own profiles (good practice).
DROP POLICY IF EXISTS "Users can update their own records" ON public.profiles;
CREATE POLICY "Users can update their own profiles" ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

### Step 3: Manually Set the Admin Role (User Action)

If logging or RLS doesn't solve it, the user's role may simply be incorrect in the database.

**Action:** In the Supabase SQL Editor, run this command to forcefully set the role for your admin user. **Replace `'your-admin-user-email@example.com'` with your actual admin login email.**

```sql
-- This query finds the user's ID from the auth schema
-- and uses it to update the 'role' in the public profiles table.
UPDATE public.profiles
SET role = 'admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'your-admin-user-email@example.com'
);
```

## 4. Final Steps

After implementing the logging in **Step 1**, please switch to **Standard Mode** so I can apply the code changes. After that, you can perform the actions in **Step 2** and **Step 3** in your Supabase dashboard. This comprehensive approach should permanently resolve the access issue.
