
# Fix Plan: Stripe Initialization &amp; Hydration Errors

This document outlines the plan to resolve the recurring Stripe and React hydration errors on the `inserat-erstellen` page.

## 1. Problem Analysis

- **Stripe Error**: `Neither apiKey nor config.authenticator provided`. This occurs because `loadStripe()` is called without a valid publishable key.
- **React Hydration Errors**: `Minified React error #418; #423`. This happens because the server-rendered HTML for the payment step does not match the client-rendered HTML, due to the Stripe component's client-side nature.

## 2. Root Cause

The `PaymentWidget` component, which uses Stripe.js, is being included in the server-side render pass for the `/inserat-erstellen` page. Stripe.js requires a browser environment (`window` object) and a publishable key, which leads to errors during SSR.

## 3. Solution

The core solution is to prevent the `PaymentWidget` from ever being rendered on the server. We will achieve this using a dynamic import with SSR disabled.

### Step-by-Step Implementation

1.  **File to Modify**: `src/components/buyauto/create-listing/Step3_PlanSelection.tsx`.

2.  **Action**: Replace the static import of `PaymentWidget` with a dynamic import.

    -   **Current Code (Static Import)**:
        ```typescript
        import PaymentWidget from './PaymentWidget';
        ```

    -   **New Code (Dynamic Import)**:
        ```typescript
        import dynamic from 'next/dynamic';

        const PaymentWidget = dynamic(() => import('./PaymentWidget'), {
          ssr: false,
          loading: () => &lt;p&gt;Zahlungs-Widget wird geladen...&lt;/p&gt;, // Optional: show a loading state
        });
        ```

3.  **Ensure Conditional Rendering**: Verify that the `PaymentWidget` is only rendered after the `clientSecret` has been fetched and is available in the component's state.

    ```typescript
    {clientSecret &amp;&amp; (
      &lt;PaymentWidget
        clientSecret={clientSecret}
        totalAmount={totalPrice}
        onSuccess={handlePaymentSuccess}
      /&gt;
    )}
    ```

4.  **Verification**: Confirm that the guard inside `src/components/buyauto/create-listing/PaymentWidget.tsx` remains in place as a safety fallback.

    ```typescript
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      console.error("Stripe key is not configured. Payment widget will not be displayed.");
      return null;
    }
    ```

## 4. Expected Outcome

- The `inserat-erstellen` page will load without any Stripe or hydration errors, even if the Stripe publishable key is not set.
- If a paid plan is selected, the `PaymentWidget` will load on the client-side, and the payment form will render correctly.
- The user experience will be smooth, with no application crashes.

