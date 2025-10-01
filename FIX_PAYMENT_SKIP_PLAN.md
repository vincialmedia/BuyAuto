
# Plan: Fix Payment Skip in Listing Creation Flow

This plan outlines the steps to fix the bug where selecting a paid plan in the "Inserat erstellen" wizard skips the payment step.

## 1. The Problem

The `Step3_PlanSelection.tsx` component has an incorrect `onClick` handler on the plan selection cards. This handler (`handleSelectPlan`) saves the plan and immediately calls `nextStep()`, bypassing the payment preparation logic contained in the `handlePreparePayment` function.

## 2. The Solution

I will refactor `src/components/buyauto/create-listing/Step3_PlanSelection.tsx` to restore the correct user flow.

### Step-by-Step Implementation

1.  **Update `Card` onClick Handler**:
    -   In the JSX for the plan selection cards, change the `onClick` attribute from `() => handleSelectPlan(planKey)` to `() => setSelectedPlan(planKey)`. This will ensure clicking a card only updates the local state.

2.  **Remove `handleSelectPlan` Function**:
    -   Delete the entire `handleSelectPlan` async function, as it is redundant and the source of the bug.

3.  **Enhance `handlePreparePayment` Function**:
    -   Inside `handlePreparePayment`, before the `fetch` call to `/api/billing/prepare`, add the logic to save the selected plan and premium status to the database.
    -   This involves calling `createOrUpdateListing` with the `listing_id`, `selectedPlan`, and `isPremium` state.
    -   This consolidates the save-and-pay logic into the single, correct user action (clicking the main "Continue" button).

## 3. File to be Modified

-   `src/components/buyauto/create-listing/Step3_PlanSelection.tsx`

By implementing this plan, the wizard will correctly differentiate between free and paid plans, showing the payment widget when required.
