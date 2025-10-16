
# Plan to Fix Next.js Navigation Error

## 1. The Problem

The application is throwing the following error: `Invariant: attempted to hard navigate to the same URL`. This occurs when `router.push()` or `router.replace()` is called with the same URL that the application is currently on. The presence of a `?refresh=...` query parameter indicates that this is likely an attempt to force a page to re-fetch server-side data.

## 2. Investigation

1.  **Find the Source:** Search the project for the string `?refresh=` to locate the code responsible for this navigation.
2.  **Analyze the Context:** The code is expected to be within the `AuthContext.tsx` file, specifically inside the `onAuthStateChange` listener, which handles redirects after login/logout events.

## 3. Proposed Solution

The solution is to prevent this redundant navigation by adding a conditional check.

1.  **Conditional Logic:** Before calling `router.push()`, check if the `router.pathname` is different from the target path.
2.  **Refined Refresh:** If the user is already on the target page, use `router.reload()` instead. This achieves the goal of re-running `getServerSideProps` to get fresh data without causing a navigation error.

### Example Implementation:

```typescript
// Inside the onAuthStateChange listener

// If a user signs in or out, and we want to redirect to the homepage
const targetPathname = '/';

if (router.pathname !== targetPathname) {
  // If not on the homepage, navigate there with the refresh param
  router.push(`/?refresh=${Math.random()}`);
} else {
  // If already on the homepage, just reload the page to get fresh data
  router.reload();
}
```

## 4. Implementation Steps

1.  Switch to **Standard Mode**.
2.  Open the file identified during the investigation (e.g., `src/contexts/AuthContext.tsx`).
3.  Modify the navigation logic to include the conditional check as described above.
4.  Save the file and verify that the error no longer occurs after logging in or out.
