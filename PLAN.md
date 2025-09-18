# Global Header Implementation Plan

## 1. Goal
Create a single, sitewide global header that is consistent across all pages, responsive, and adapts to user authentication status.

## 2. Strategy: Root Layout
The most robust approach is to create a `MainLayout.tsx` component that wraps all page content via `_app.tsx`.

- **File:** `src/components/layout/MainLayout.tsx` (to be created)
- **Purpose:** This component will render the global header, a `main` tag for page content, and the global footer.
- **Integration:** In `src/pages/_app.tsx`, wrap the `<Component {...pageProps} />` with `<MainLayout>`.

## 3. Header Component Refactor
The existing `src/components/buyauto/Header.tsx` will be adapted to serve as the global header.

- **File:** `src/components/buyauto/Header.tsx` (to be refactored)
- **Key Features:**
    - Logo linking to `/`.
    - Main navigation links.
    - User authentication section (Login/Register or Profile Dropdown).
    - Sticky-on-scroll behavior.
    - Responsive design with a hamburger menu for mobile.

## 4. Authentication Logic
The header will use the `useAuth()` hook from `src/contexts/AuthContext.tsx` to display content conditionally.

- **Logged Out State (`!user`):**
    - Show "Login" button (`/auth`).
    - Show "Registrieren" button (`/auth?view=register`).
- **Logged In State (`user`):**
    - Show a user profile dropdown menu.
    - Dropdown contains:
        - "Profil" (`/dashboard`)
        - "Meine Inserate" (`/dashboard?tab=listings`)
        - "Abmelden" (Logout button).
- **Admin State (`user.role === 'admin'`):**
    - Add an "Admin" link to the user dropdown (`/admin`).
- **Loading State:**
    - Render a skeleton UI in the auth area to prevent content flashing (FOUC) while the user session is being checked.

## 5. Cleanup of Redundant Headers
To ensure a single source of truth, all existing page-specific headers will be removed.

- **`src/pages/index.tsx`**: Remove the direct rendering of `<Header />`.
- **`src/components/buyauto/dashboard/DashboardLayout.tsx`**: Remove `<DashboardHeader />`. The layout will be adjusted to receive content directly.
- **`src/components/buyauto/search/SearchLayout.tsx`**: Remove `<SlimHeader />`.
- **`src/components/admin/AdminLayout.tsx`**: The existing sidebar and top bar will be reviewed to ensure they integrate smoothly without visual conflicts with the new global header.

## 6. Implementation Steps (for Creative Mode)
1. Create `src/components/layout/MainLayout.tsx`.
2. Refactor `src/components/buyauto/Header.tsx` with the authentication logic.
3. Update `src/pages/_app.tsx` to use `MainLayout`.
4. Remove the old, redundant header components from their respective pages and layouts.
5. Test all routes and authentication states to confirm visual consistency and functionality.
