
# Fix Payment Re-entry and Re-payment Bug in Listing Wizard

## 1. Problem

When a user completes payment in the "inserat erstellen" flow and navigates back to a previous step, they are forced to go through the payment process again. This second attempt fails with a Stripe API `400` error because the `PaymentIntent` has already been processed.

## 2. Goal

Modify the listing creation wizard to be "payment-aware." Once a listing's fee is paid, the user should be able to navigate back and forth between steps to edit details without being prompted to pay again.

## 3. High-Level Plan

1.  **Persist Payment Status**: After a successful payment, update the `listings` table in the database to reflect that the listing is paid.
2.  **Stateful Wizard**: Ensure the `ListingWizard` fetches and respects the listing's payment status from the database.
3.  **Conditional UI**: Update `Step3_PlanSelection` to show a confirmation message instead of the payment form if payment has already been made.

## 4. Detailed Implementation Steps

### Step 1: Update Listing Status on Payment Success

In `src/components/buyauto/create-listing/CheckoutForm.tsx`:

-   After the `stripe.confirmPayment` call succeeds, it redirects to the success screen. Before that, or on the success screen, we need to ensure the listing status is updated. The webhook (`pages/api/billing/webhook.ts`) should already handle setting the `status` to `pending` upon `payment_intent.succeeded`. We must ensure the client-side state is also updated.
-   In `ListingWizard.tsx`, the `onNext` function for the payment step should refetch the listing data to get the updated status before proceeding.

### Step 2: Make `ListingWizard` Aware of Payment Status

In `src/components/buyauto/create-listing/ListingWizard.tsx`:

-   The `wizardData` state object should be the single source of truth.
-   When a step is completed (e.g., `handleNext`), the `updateData` function is called. We need to ensure that when payment is made, the updated listing data (with the new `status`) is fetched from `createListingService` and passed to `updateData`.

### Step 3: Modify `Step3_PlanSelection.tsx`

This is the core of the client-side fix.

1.  **Add a State for Payment Status:**
    -   Introduce a local state variable to track if the payment is complete.
    -   `const [isPaid, setIsPaid] = useState(false);`

2.  **Check Payment Status on Mount:**
    -   Use a `useEffect` to check the status of the listing from the `wizardData` prop.
    -   The `listings` table has a `status` and `payment_intent_id` column. If `payment_intent_id` is not null and the `status` is one of `pending`, `active`, or `published`, it means the listing is paid.

    ```typescript
    useEffect(() => {
      const listingIsPaid =
        !!props.wizardData.payment_intent_id &&
        ['pending', 'active', 'published'].includes(props.wizardData.status);
      setIsPaid(listingIsPaid);
    }, [props.wizardData]);
    ```

3.  **Prevent API Call if Paid:**
    -   In the `handlePlanSelection` function, wrap the call to `fetch('/api/billing/prepare', ...)` in a condition.

    ```typescript
    if (isPaid) {
      // If already paid, just proceed.
      // Maybe update the plan if it changed, but don't create a new payment intent.
      // For now, we can just call onNext directly if plan hasn't changed.
      props.onNext(selectedPlan);
      return;
    }
    // ... existing code to prepare payment
    ```

4.  **Conditionally Render UI:**
    -   In the JSX, use the `isPaid` flag to either show the payment form or a confirmation message.

    ```tsx
    {isPaid ? (
      <div className="text-center p-8 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="text-xl font-semibold text-green-800">Payment Complete</h3>
        <p className="text-gray-600 mt-2">
          You have already paid for this listing. You can freely edit other details.
        </p>
      </div>
    ) : (
      // ... existing JSX for plan selection and PaymentWidget
      <PaymentWidget ... />
    )}
    ```

### Step 4: Ensure Navigation Logic is Correct

In `src/components/buyauto/create-listing/ListingWizard.tsx`:

-   The `handleNext` and `handlePrev` functions should not clear any payment-related state. The current implementation of passing `wizardData` should be sufficient as long as the data within it is correctly updated after payment.

This plan ensures a robust fix by relying on the database as the source of truth for payment status and updating the UI accordingly.
  