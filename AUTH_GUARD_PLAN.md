# Authentication Guard Plan for "Inserat erstellen"

**Goal:** Secure the listing creation page (`/inserat-erstellen`) so that it is only accessible to authenticated users.

## Strategy

A multi-layered approach will be used to ensure robust security and a good user experience. This involves server-side protection via middleware and client-side UI adjustments.

### 1. Server-Side Route Protection (Middleware)

This is the core security measure that prevents any unauthorized access to the page, even if a user tries to access the URL directly.

-   **File to Modify:** `src/middleware.ts`
-   **Action:**
    -   Intercept requests to `/inserat-erstellen`.
    -   Check for an active user session using `supabase.auth.getUser()`.
    -   If no user session exists, redirect the user to the login page.
    -   Append a `redirect` query parameter to the login URL (e.g., `/auth?redirect=/inserat-erstellen`) to enable redirection back to the listing creation page after a successful login.

### 2. Client-Side UI Enhancement (Header Link)

This improves the user experience by proactively guiding non-logged-in users to the login page instead of letting them hit a protected route unexpectedly.

-   **File to Modify:** `src/components/buyauto/Header.tsx`
-   **Action:**
    -   Use the `useAuth` hook to check the user's authentication state.
    -   If the user is logged in, the "Inserat erstellen" link will point directly to `/inserat-erstellen`.
    -   If the user is **not** logged in, the link's `href` will be changed to `/auth?redirect=/inserat-erstellen`.

### 3. Post-Login Redirection

This ensures a seamless user flow by returning the user to their intended page after they authenticate.

-   **File to Check/Modify:** `src/pages/auth.tsx`
-   **Action:**
    -   On the `auth.tsx` page, read the `redirect` query parameter from the URL using `useRouter`.
    -   After a successful login event is detected (via the `AuthContext`), check if the `redirect` parameter exists.
    -   If it exists, use `router.push()` to navigate the user to the specified path.
    -   If it does not exist, redirect the user to a default page, such as `/dashboard`.

This plan provides a secure and intuitive implementation for protecting the "Inserat erstellen" page.
