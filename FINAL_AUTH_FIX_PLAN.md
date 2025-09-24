
# FINAL AUTH FIX: Migrating to @supabase/ssr

## 1. Diagnosis

- **Problem**: The API route `/api/billing/prepare` returns a `401 Unauthorized` error, preventing users from proceeding to payment.
- **Root Cause**: The application uses the outdated `@supabase/auth-helpers-nextjs` library for server-side authentication. This library has known issues with session management between the Next.js middleware and API routes, causing the API route to fail to recognize the user's session.
- **Solution**: Migrate the entire server-side authentication flow (middleware and API routes) to the modern, more reliable `@supabase/ssr` library. This will create a single, consistent, and robust method for handling auth cookies and sessions.

## 2. Implementation Steps

### Step 1: Update Middleware (`src/middleware.ts`)

I will refactor the middleware to use `createServerClient` from `@supabase/ssr`. This involves:
- Importing `createServerClient` and `type { CookieOptions }` from `@supabase/ssr`.
- Importing `cookies` from `next/headers`.
- Creating a server client instance within the middleware.
- Calling `supabase.auth.getUser()` to trigger a session refresh. `@supabase/ssr` handles the cookie updates automatically on the response.

### Step 2: Update API Route (`src/pages/api/billing/prepare.ts`)

I will refactor the API route to use the same `@supabase/ssr` pattern. This involves:
- Importing `createServerClient` from `@supabase/ssr`.
- Creating a server-side client instance within the API handler, using the `req` and `res` objects to manage cookies.
- Using this new client to get the user's session via `supabase.auth.getUser()`.
- The rest of the business logic in the file will remain the same but will now operate with a correctly authenticated user.

### Step 3: Cleanup

I will remove the old `@supabase/auth-helpers-nextjs` imports from both files to prevent conflicts and ensure the new library is being used exclusively for server-side operations.

## 3. Expected Outcome

- The `401 Unauthorized` error will be eliminated.
- The POST request to `/api/billing/prepare` will succeed with a `200 OK` status.
- Users will be able to select a paid plan and proceed to the Stripe payment page without any authentication errors.
- The application's authentication system will be more stable, secure, and aligned with current Supabase and Next.js best practices.
