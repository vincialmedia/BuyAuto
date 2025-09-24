## 🚨 Fix Plan: Resolving Recurring 401 Unauthorized Errors

### 1. Diagnosis (Root Cause Identified)

The application is consistently receiving a `401 Unauthorized` error when making client-side `fetch` requests to protected API endpoints like `/api/billing/prepare`.

- **Symptom**: Paid plan selection fails, and a `401` error appears in the browser console.
- **Root Cause**: The Next.js middleware configuration in `src/middleware.ts` is explicitly configured to **ignore all paths starting with `/api`**.
- **Impact**: This prevents the Supabase session cookie from being refreshed for any API calls. When the user's access token expires, the API route receives an invalid session and correctly denies access, resulting in the `401` error.

### 2. Files to be Modified

- `src/middleware.ts`: This is the only file that needs to be changed.

### 3. The Solution

The fix is to update the `matcher` in `src/middleware.ts` to allow it to run on API routes, ensuring the session is always fresh.

**Current (Incorrect) Matcher:**
```javascript
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
```

**Proposed (Correct) Matcher:**
I will update the matcher to run on all paths *except* for static files and image optimization files. This is a common and robust pattern for Supabase authentication.

```javascript
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
```
This change ensures the middleware will now execute for API routes, refresh the session cookie, and allow authenticated requests to succeed.

### 4. Implementation Steps

1.  Modify the `config.matcher` in `src/middleware.ts` as described above.
2.  The server will automatically restart to apply the new middleware configuration.
3.  Verify the fix by re-testing the payment flow.

### 5. Expected Outcome

- **No more `401` errors** on the `/api/billing/prepare` endpoint.
- The payment flow for paid plans will proceed correctly, showing the Stripe payment form.
- The user's session will be correctly validated for all server-side API requests requiring authentication.
