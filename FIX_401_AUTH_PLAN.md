# Plan to Fix 401 Unauthorized Error

## 1. Diagnosis

The application is encountering a `401 Unauthorized` error when the frontend calls the `/api/billing/prepare` API endpoint.

-   **Root Cause:** The `src/middleware.ts` file is implemented using patterns from `@supabase/ssr`, which is intended for the Next.js App Router. However, this project uses the Pages Router. The API routes use `createPagesServerClient` from `@supabase/auth-helpers-nextjs`. This library mismatch causes the session cookie not to be refreshed or correctly passed to API routes, leading to authentication failure.
-   **Symptom:** The user is logged in on the client, but the server-side API routes do not recognize the user's session.

## 2. Solution

The solution is to replace the incorrect middleware with the standard, simplified middleware for the Pages Router using `@supabase/auth-helpers-nextjs`.

### Step 1: Replace Middleware (`src/middleware.ts`)

The entire content of `src/middleware.ts` will be replaced with the following code. This code uses `createMiddlewareClient` to automatically refresh the user's session on every matching request, ensuring the API routes always have access to a valid session.

```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Create a Supabase client configured to use cookies
  const supabase = createMiddlewareClient({ req, res });

  // Refresh session if expired - important for Server-Side Rendering
  const { data: { session } } = await supabase.auth.getSession();
  console.log(`Middleware: Session check for ${req.nextUrl.pathname}. User is ${session ? 'authenticated' : 'not authenticated'}.`);


  // Define protected routes
  const protectedPaths = ['/dashboard', '/inserat-erstellen'];
  const isProtectedPath = protectedPaths.some(path => req.nextUrl.pathname.startsWith(path));

  // If user is not signed in and is trying to access a protected route, redirect to auth page
  if (!session &amp;&amp; isProtectedPath) {
    console.log(`Middleware: Redirecting unauthenticated user to /auth.`);
    const redirectUrl = new URL('/auth', req.url);
    redirectUrl.searchParams.set('callback', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If user is signed in and tries to access the auth page, redirect to dashboard
  if (session &amp;&amp; req.nextUrl.pathname.startsWith('/auth')) {
    console.log(`Middleware: Redirecting authenticated user to /dashboard.`);
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```
*Note: The matcher has been updated to be more robust and follow modern best practices, preventing the middleware from running on unnecessary routes like API calls and static assets.*

### Step 2: No other changes required

The other files (`/api/billing/prepare.ts`, `Step3_PlanSelection.tsx`) are already implemented correctly and will work as expected once they receive a valid session from the middleware.

## 3. Validation

After implementing the new middleware:
1.  Log in to the application.
2.  Navigate to the "Inserat erstellen" page.
3.  Select a paid plan and proceed to payment.
4.  The `POST /api/billing/prepare` call should now return a `200 OK` status, and the Stripe payment form should load.
5.  There should be no `401 Unauthorized` errors in the console.

This plan directly addresses the root cause and will resolve the authentication errors.
