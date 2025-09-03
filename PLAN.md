# BuyAuto - Authentication Feature Plan

This document outlines the plan to create a new login/registration page for the BuyAuto application.

## 1. Goal & Scope

- **Goal:** Implement a secure, stylish, and mobile-friendly authentication flow using Supabase Auth.
- **Features:** User registration (email/password), login, logout, and password reset request.
- **Redirects:** Authenticated users are redirected to `/dashboard`.
- **Design:** Swiss minimalism (clean white background, red accents, subtle shadows).
- **Out of Scope:** Full implementation of the `/dashboard` content.

## 2. File Structure & Components

The following files will be created or modified:

-   **New Page:** `src/pages/auth.tsx`
    -   The main entry point for authentication. It will host the `AuthForm` component and handle redirects for logged-in users. It will also contain SEO metadata.
-   **New Page:** `src/pages/dashboard.tsx`
    -   A protected placeholder page accessible only to authenticated users. It will contain a welcome message and a logout button.
-   **New Core Component:** `src/components/buyauto/auth/AuthForm.tsx`
    -   A client-side component that encapsulates the entire authentication UI.
    -   Uses `shadcn/ui` Tabs to switch between "Anmelden" (Login) and "Registrieren" (Register) forms.
    -   Manages all form state using `react-hook-form` and validates with `zod`.
    -   Handles API calls to the `authService`.
-   **New Layout Component:** `src/components/buyauto/auth/AuthLayout.tsx`
    -   A simple layout wrapper for the auth page, ensuring a focused experience with a slim header (logo only) and centered content.
-   **New Context:** `src/contexts/AuthContext.tsx` and `src/hooks/useAuth.ts`
    -   Provides a global `AuthProvider` and `useAuth` hook.
    -   Manages the user's session state by subscribing to `supabase.auth.onAuthStateChange`.
-   **New Service:** `src/services/authService.ts`
    -   A dedicated module to centralize all Supabase Auth function calls (`signUp`, `signInWithPassword`, `signOut`, etc.). This promotes separation of concerns.
-   **Schema Updates:** `src/lib/buyauto/schemas.ts`
    -   Will be updated to include Zod schemas for login and registration forms to ensure robust validation.
-   **App Modification:** `src/pages/_app.tsx`
    -   The root App component will be wrapped with the new `AuthProvider` to make session data available globally.

## 3. Data Flow & Authentication Logic

1.  **Auth Context:** `AuthContext.tsx` will initialize the Supabase client and listen for `onAuthStateChange`. The `user` object will be distributed to the entire component tree.
2.  **Protected Routes:** A higher-order component or a check within `dashboard.tsx` will redirect unauthenticated users from `/dashboard` to `/auth`. Conversely, `auth.tsx` will redirect authenticated users to `/dashboard`.
3.  **Registration Form:**
    -   **Fields:** Vorname, Nachname, E-Mail, Passwort.
    -   **Validation:** Zod schema will enforce email format and a minimum password length of 8 characters.
    -   **Submission:** Calls `authService.signUp`, which in turn calls `supabase.auth.signUp`. `Vorname` and `Nachname` are stored in the `options.data` metadata field.
    -   **Feedback:** A toast notification will inform the user to check their email for verification.
4.  **Login Form:**
    -   **Fields:** E-Mail, Passwort.
    -   **Submission:** Calls `authService.signIn`, which uses `supabase.auth.signInWithPassword`.
    -   **Success:** `onAuthStateChange` fires, and the page redirects to `/dashboard`.
    -   **Error:** Displays an inline error message (e.g., "Ungültige E-Mail oder Passwort").

## 4. UI/UX & Styling

-   **Framework:** `shadcn/ui` components will be used for consistency (`Card`, `Tabs`, `Button`, `Input`, `Form`).
-   **Style:** A minimal and clean aesthetic. The primary color for actions will be a strong red (`#ef4444`). The layout will be spacious and centered.
-   **Animation:** `framer-motion` will be used for subtle fade-in-slide transitions between the login/register tabs and for button hover effects (slight elevation).
-   **Notifications:** `sonner` will be used for toast notifications (e.g., green for success, red for errors).

## 5. Implementation Steps

1.  **Setup Auth Context:** Create `AuthContext.tsx` and wrap `_app.tsx` with its provider.
2.  **Define Schemas & Service:** Add validation schemas to `schemas.ts` and create the `authService.ts` with all Supabase auth methods.
3.  **Build UI Components:** Develop `AuthLayout.tsx` and the main `AuthForm.tsx` component.
4.  **Create Pages:** Implement the `auth.tsx` and `dashboard.tsx` pages.
5.  **Connect Logic:** Wire up the form submissions, state management, redirection, and error/success handling.
6.  **Final Polish:** Apply animations, final styling touches, and ensure responsiveness.
