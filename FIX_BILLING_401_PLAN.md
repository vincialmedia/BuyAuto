# Plan: Fix 401 Unauthorized Error on `/api/billing/prepare`

## 1. Diagnosis ✅ COMPLETED

The application was receiving a `401 Unauthorized` error when the client-side sent a POST request to the `/api/billing/prepare` endpoint.

- **Symptom**: The "Continue" button on the plan selection step appeared to do nothing after loading, and a 401 error appeared in the browser console.
- **Root Cause**: The API route at `src/pages/api/billing/prepare.ts` was using `createPagesServerClient` instead of `createServerSupabaseClient`, which is the correct function for Pages Router API routes to read session cookies.

## 2. Files Investigated ✅ COMPLETED

- ✅ `src/pages/api/billing/prepare.ts`: Fixed - Updated Supabase client initialization
- ✅ `src/components/buyauto/create-listing/Step3_PlanSelection.tsx`: Verified - Client-side fetch call is correct
- ✅ `src/middleware.ts`: Confirmed - Middleware correctly refreshes sessions

## 3. Solution Implemented ✅ COMPLETED

### The Fix
Updated `src/pages/api/billing/prepare.ts` to use the correct Supabase initialization pattern:

```typescript
// OLD (incorrect for Pages Router API routes)
const supabase = createPagesServerClient({ req, res });

// NEW (correct for Pages Router API routes) 
const supabase = createServerSupabaseClient({ req, res });
```

### Additional Improvements Made:
- ✅ Enhanced error logging for session failures
- ✅ Clear error messages for 401 responses  
- ✅ Proper authentication guard before any business logic
- ✅ Server restarted to apply changes

## 4. Testing Status ✅ READY

The fix has been implemented and is ready for testing:
- Server restarted successfully
- No linting or TypeScript errors
- Authentication flow should now work properly
- Both free (CHF 0) and paid plans should process correctly

## 5. Expected Behavior

- ✅ **Free Plans (CHF 0)**: Should continue directly to next step without Stripe
- ✅ **Paid Plans (CHF 50/190)**: Should show Stripe payment form
- ✅ **No more 401 errors**: API route can now read user sessions properly
- ✅ **Client-side**: Continue button should work as expected