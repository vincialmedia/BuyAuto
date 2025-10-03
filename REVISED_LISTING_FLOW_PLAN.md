# Plan: Refactor Listing Creation to Move Payment to the Final Step

## 1. Goal

As per the user's request, restructure the "inserat erstellen" wizard to move the Stripe payment process to the very end. The listing will only be created and made active *after* a successful payment on the final preview screen. This simplifies the user flow and eliminates the re-payment bug.

We will maintain the "draft" system to ensure user progress is saved at each step.

## 2. New Wizard Flow

1.  **Step 1: Vehicle Data** -> Creates `draft` listing in the database. *(No change)*
2.  **Step 2: Leasing Details** -> Updates the `draft` listing. *(No change)*
3.  **Step 3: Plan Selection** -> **(Simplified)** The user only selects a plan. The Stripe payment form is removed. The chosen plan is saved to the draft listing.
4.  **Step 4: Images** -> User uploads images for the draft listing. *(No change)*
5.  **Step 5: Preview &amp; Pay** -> **(New Combined Step)** The user previews all listing details and then completes the payment using the Stripe widget on this same screen. Successful payment updates the listing status to `pending`.
6.  **Step 6: Success** -> Confirmation screen. *(No change)*

## 3. Technical Implementation Plan

### Part 1: Modify `ListingWizard` and Step Components

1.  **File: `src/components/buyauto/create-listing/ListingWizard.tsx`**
    *   The `steps` array will need to be adjusted. The component for the final step will be the new `Step5_PreviewAndPay`.

2.  **File: `src/components/buyauto/create-listing/Step3_PlanSelection.tsx`**
    *   **Remove Stripe Logic**: Delete the `PaymentWidget` and `CheckoutForm` components from the render method.
    *   **Remove State**: Remove `clientSecret`, `paymentIntentId`, and any other Stripe-related state.
    *   **Simplify `handlePlanSelection`**: This function will no longer call `/api/billing/prepare`. Instead, it will:
        *   Call a service function (e.g., `createListingService.updateListing`) to save the selected `planId` to the draft listing in the database.
        *   Invoke `props.onNext()` to proceed to the next step.

3.  **File: `src/components/buyauto/create-listing/Step5_Preview.tsx`**
    *   **Rename** this file to `src/components/buyauto/create-listing/Step5_PreviewAndPay.tsx`.
    *   **Move Stripe Logic Here**: Integrate the `PaymentWidget`, `CheckoutForm`, and all related state management (`clientSecret`, etc.) that was removed from `Step3_PlanSelection`.
    *   The component will first display the full listing preview.
    *   Below the preview, it will render the payment section.
    *   A `useEffect` hook will be used to call the `/api/billing/prepare` endpoint when the component mounts to fetch the `clientSecret` for the Stripe payment element.

### Part 2: Adjust Services and API

1.  **File: `src/services/createListingService.ts`**
    *   Ensure the `updateListing` function can handle a payload that only contains the `plan` or `plan_id` to update the draft listing from Step 3. No other changes are likely needed here.

2.  **File: `pages/inserat-erstellen.tsx`**
    *   Update the import for the final step component to point to the new `Step5_PreviewAndPay`.

## 4. Summary of Changes

*   **`Step3_PlanSelection.tsx`**: Becomes a simple selection component. All payment logic is removed.
*   **`Step5_Preview.tsx`**: Is renamed and becomes the new `Step5_PreviewAndPay.tsx`, absorbing all payment logic.
*   **`ListingWizard.tsx`**: The component for the final step is updated.

This approach achieves the desired user flow while maintaining data persistence, providing a robust and intuitive experience.
