# Stripe Initialization &amp; Hydration Error Fix Plan

## 1. Problem Analysis

The analysis provided by the user is correct. The root cause is the server-side Stripe SDK (`stripe` package) being imported into a client-side component bundle for the `/inserat-erstellen` page.

- **Primary Error**: `Error: Neither apiKey nor config.authenticator provided`
- **Cause**: The Stripe Node.js SDK is initialized in code that runs in the browser, where the required `STRIPE_SECRET_KEY` is not available.
- **Secondary Errors**: `Minified React error #418 / #423` (Hydration errors). These are symptoms of the primary error crashing the client-side render.
- **Contributing Factor**: The `/inserat-erstellen` page is being statically exported, which is unsuitable for a dynamic, user-specific flow like payment.

## 2. Solution Strategy

The solution involves strictly separating server-side and client-side code and ensuring the page is rendered dynamically.

### Step 1: Isolate Server-Side Stripe SDK

- **Action**: Rename `src/lib/stripe.ts` to `src/lib/stripe-server.ts`.
- **Purpose**: To make it explicit that this file contains the server-side SDK instance and must **only** be imported within `pages/api` routes.

### Step 2: Create a Dedicated, Safe Client-Side Stripe Loader

- **Action**: Create a new file `src/lib/stripe-client.ts`.
- **Contents**: This file will export a `getStripe` function that uses `@stripe/stripe-js`'s `loadStripe` with the `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
- **Safety**: The function will be SSR-safe, returning `Promise.resolve(null)` if run on the server, and will handle missing environment variables gracefully.

### Step 3: Refactor All Imports

- **Action**:
    - Update all API routes in `src/pages/api/billing/` to import their Stripe instance from `src/lib/stripe-server.ts`.
    - Update all React components, specifically `src/components/buyauto/create-listing/PaymentWidget.tsx` and `Step3_PlanSelection.tsx`, to get their Stripe instance from the new `src/lib/stripe-client.ts`.
- **Purpose**: To ensure no client-facing component ever imports the server-side SDK.

### Step 4: Disable Static Export for the Payment Page

- **Action**: Add an empty `getServerSideProps` function to `src/pages/inserat-erstellen.tsx`.
- **Code**:
  ```typescript
  export async function getServerSideProps() {
    return {
      props: {}, // return empty props
    };
  }
  ```
- **Purpose**: This forces Next.js to render the page on the server at request time, disabling static export (`nextExport`) for this route and resolving hydration issues related to dynamic content.

## 3. Acceptance Criteria

- The `Neither apiKey nor config.authenticator provided` error is completely gone.
- The React hydration errors (#418, #423) are resolved.
- The payment flow on the `/inserat-erstellen` page works correctly for both free and paid plans.
- The app builds and runs without crashing, even if the `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is missing (it should just not render the payment form).
