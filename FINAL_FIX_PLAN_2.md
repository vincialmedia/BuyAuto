# Final Fix Plan 2

## 1. Step 1 Form Data Loss Fix
**File:** `src/components/buyauto/create-listing/step1/Step1Form.tsx`
- **Issue:** When drafts are saved and reloaded, numeric fields like `power_hp` (PS), `km`, and `year` may be parsed as strings. The strict type check in `defaultValues` discards them.
- **Fix:** Update `defaultValues` to securely parse numbers even if they arrive as strings (e.g., using `parseInt` or `Number()`). 

## 2. Robust Payment Verification & Status Update
**File:** `src/pages/api/billing/verify-payment.ts` (New File)
- **Issue:** The webhook `payment_intent.succeeded` might not be enabled in the Stripe Dashboard, causing paid listings to remain in `draft` status, which blocks the admin email.
- **Fix:** Create a direct verification API endpoint. It will accept the `payment_intent_id`, securely fetch the status from Stripe Server, and if successful, update the database listing to:
  - `status = 'pending'`
  - `payment_status = 'paid'`
  - `price_paid_chf = [actual amount]`
This guarantees the DB trigger for the email will fire.

## 3. Frontend Integration
**File:** `src/components/buyauto/create-listing/Step5_PreviewAndPay.tsx`
- **Issue:** The frontend updates local state but doesn't forcefully sync the payment success back to the database.
- **Fix:** Update `handlePaymentConfirmation` to call the new `/api/billing/verify-payment` endpoint as soon as Stripe returns a `succeeded` status. Wait for this API to confirm before showing the success screen.