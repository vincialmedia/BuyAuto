
# Stripe Payment Integration Summary for BuyAuto

This document summarizes the implementation of Stripe for handling payments in the "Inserat Erstellen" (Create Listing) flow.

## 1. Goal

The primary goal was to process payments directly on the billing step using the Stripe Payment Element. The system handles both paid and zero-price scenarios, as well as refunds for rejected listings.

## 2. Environment Variables

The following variables were added to `.env.local` to configure Stripe in test mode.

```
# Stripe API Keys (Test Mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_4ZlHGCjsiXjF31Ard96LGWzG
STRIPE_SECRET_KEY=sk_test_4ZlHiV7J7NPrEdF1kcEPQHE9
STRIPE_WEBHOOK_SECRET=
```

## 3. Database Schema

The `public.listings` table in Supabase was extended with the following fields to track billing information:

- `pricing_plan` (text): Stores the selected plan (`'standard'`, `'extended'`, `'unlimited'`).
- `duration_days` (int): The listing's duration in days. `null` for the unlimited plan.
- `expires_at` (timestamptz): Calculated expiration date. `null` for the unlimited plan.
- `premium` (boolean): `true` if the Premium-Boost was purchased.
- `premium_until` (timestamptz): Expiration date for the premium boost.
- `price_paid_chf` (int): The total amount paid in CHF.
- `payment_status` (text): Tracks the payment state (`'unpaid'`, `'requires_payment'`, `'paid'`, `'refunded'`, `'canceled'`).
- `stripe_payment_intent_id` (text): The ID of the associated Stripe Payment Intent.
- `stripe_refund_id` (text): The ID of the Stripe refund, if applicable.
- `refunded_at` (timestamptz): Timestamp of when the refund was processed.

## 4. Server-Side Pricing Logic

A centralized configuration was created in `src/lib/buyauto/stripe_config.ts` to manage pricing rules server-side.

- **Plans:**
  - `Standard`: CHF 0 (60 days)
  - `Verlängert`: CHF 50 (90 days)
  - `Unlimitiert`: CHF 190 (unlimited)
- **Add-on:**
  - `Premium-Boost`: + CHF 30

The server exclusively calculates the total amount to prevent client-side manipulation.

## 5. API Endpoints

Several API routes were created under `src/pages/api/billing/` to handle the payment lifecycle.

### `POST /api/billing/prepare`
This is the core endpoint for initiating a payment.
- **Input**: `{ listing_id, plan, premium }`
- **Logic**:
  1. Verifies the user owns the listing.
  2. Calculates the `total_chf` server-side.
  3. **If `total_chf === 0`**: It updates the listing directly with the chosen plan details and `payment_status = 'paid'`. It returns `{ next: 'continue' }` to the client to skip Stripe.
  4. **If `total_chf > 0`**: It creates (or updates) a Stripe PaymentIntent. The `listing_id` is stored in the PaymentIntent's metadata. It updates the listing's `payment_status` to `'requires_payment'` and returns the `clientSecret` to the frontend.

### `POST /api/billing/refund` (Admin-only)
This endpoint handles refunds for rejected listings.
- **Input**: `{ listing_id, reason? }`
- **Logic**:
  1. Confirms the user is an admin.
  2. Fetches the listing and checks if it's eligible for a refund (`payment_status === 'paid'`).
  3. Creates a refund via the Stripe API.
  4. Updates the listing's `payment_status` to `'refunded'` and stores the `stripe_refund_id` and `refunded_at` timestamp.
  5. The endpoint is idempotent; it won't create multiple refunds for the same listing.

### `POST /api/billing/webhook`
This endpoint listens for events from Stripe to keep the system in sync.
- **Logic**:
  - If `STRIPE_WEBHOOK_SECRET` is not set, it logs a warning and returns a `200` status, ensuring development/staging environments run without a configured webhook.
  - Handles `payment_intent.succeeded` to update the listing's `payment_status` to `'paid'`.
  - Handles `payment_intent.payment_failed` for potential recovery logic in the future.

### `POST /api/billing/cancel-intent`
Allows the user to back out of a payment step, canceling the Stripe Payment Intent if one was created.

## 6. Frontend Flow (`Step3_PlanSelection.tsx`)

The third step of the "Inserat erstellen" wizard was modified to handle payments:

1.  **Plan & Premium Selection**: The user selects a plan and can toggle the Premium Boost.
2.  **Total Calculation**: The total price is displayed in real-time.
3.  **API Call**: On clicking "Weiter", the component calls `/api/billing/prepare`.
4.  **Conditional Flow**:
    - If the API returns `{ next: 'continue' }` (for a free plan), the wizard proceeds to the next step without showing any payment UI.
    - If the API returns a `clientSecret`, the Stripe Payment Element is rendered using the `CheckoutForm.tsx` component.
5.  **Payment Confirmation**: After the user submits their payment details, `stripe.confirmPayment` is called. On success, the user is redirected back to the page, where a `useEffect` hook verifies the payment status with Stripe and proceeds to the final step of the wizard.

## 7. Admin Refund Logic (`ModerationView.tsx`)

The admin moderation interface was updated to trigger refunds:

- When an admin rejects a listing, the code now checks if the listing has a `payment_status` of `'paid'`.
- If it does, it makes a request to the `POST /api/billing/refund` endpoint before updating the listing's status to `'rejected'`.
- This ensures that users who paid for a listing that doesn't meet the platform's criteria are automatically refunded.
