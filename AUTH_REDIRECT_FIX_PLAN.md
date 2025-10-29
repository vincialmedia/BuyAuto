# Admin Auth Page Access Fix Plan

## 1. The Problem

Admins are automatically redirected from the `/auth` page to the `/admin` dashboard, preventing them from viewing the login/registration page while authenticated. This is caused by redirection logic in `src/pages/auth.tsx`.

## 2. The Goal

Allow an admin to optionally bypass the automatic redirect and view the `/auth` page, without disrupting the standard user experience for regular users.

## 3. The Plan

Introduce a query parameter (`?stay=true`) to control the redirection behavior.

### 3.1. Modify `src/pages/auth.tsx`

-   In the `useEffect` hook, read the `stay` query parameter from `router.query`.
-   Wrap the entire redirection logic in a condition that checks if `stay` is not `true`.

```tsx
// Before
useEffect(() => {
  if (user && !loading && !adminLoading && !hasRedirected) {
    // ... redirection logic ...
  }
}, [user, loading, isAdmin, adminLoading, router, hasRedirected]);

// After
useEffect(() => {
  const { stay } = router.query;

  if (user && !loading && !adminLoading && !hasRedirected && stay !== 'true') {
    // ... redirection logic ...
  }
}, [user, loading, isAdmin, adminLoading, router, hasRedirected]);
```

## 4. How to Use

After implementation, an admin can access the auth page by navigating to `/auth?stay=true`. Accessing `/auth` directly will still result in the standard redirect.
