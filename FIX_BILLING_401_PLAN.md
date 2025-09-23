# Plan: Fix 401 Unauthorized Error on `/api/billing/prepare`

## 1. Diagnosis

The application is receiving a `401 Unauthorized` error when the client-side sends a POST request to the `/api/billing/prepare` endpoint.

- **Symptom**: The "Continue" button on the plan selection step appears to do nothing after loading, and a 401 error appears in the browser console.
- **Root Cause**: The API route at `src/pages/api/billing/prepare.ts` is unable to authenticate the user. This is because it is not correctly configured to read the session cookie that is sent along with the client's request. The Supabase client on the server-side needs to be initialized in a way that it can access the request context.

## 2. Files to Investigate

- `src/pages/api/billing/prepare.ts`: This is the primary file to fix. It contains the server-side logic for creating a Stripe Payment Intent.
- `src/components/buyauto/create-listing/Step3_PlanSelection.tsx`: This file contains the client-side logic that calls the API endpoint. I will review it to ensure the `fetch` call is standard.
- `src/middleware.ts`: Re-confirm that the middleware is correctly refreshing the session and not interfering with API calls.

## 3. Proposed Solution

The fix involves refactoring `src/pages/api/billing/prepare.ts` to correctly handle user sessions on the server side using Supabase's auth helpers.

### Step 3.1: Refactor `prepare.ts`

- **Use `createRouteHandlerClient`**: Initialize the Supabase client within the API route handler using `createRouteHandlerClient` from `@supabase/auth-helpers-nextjs`. This is the correct method for Pages Router API routes.
- **Get User Session**: Use `await supabase.auth.getSession()` to retrieve the user's session from the cookies.
- **Add Auth Guard**: Before any Stripe logic, add a check to ensure `session.data.session` and `session.data.session.user` exist. If they don't, return a `401 Unauthorized` response immediately.

### Step 3.2: Verify Client-Side Request

- I will confirm that the request from `Step3_PlanSelection.tsx` is a standard `fetch` call to a relative URL (`/api/billing/prepare`). This ensures browser cookies are automatically included.

## 4. Implementation Steps (for Standard Mode)

1.  Read the content of `src/pages/api/billing/prepare.ts`.
2.  Rewrite the file to incorporate the `createRouteHandlerClient` and the session validation logic.
3.  Ensure all existing Stripe and database logic is preserved and only executed *after* a successful authentication check.
4.  Restart the server and verify the fix.
