# Admin New Listing Notification Plan

## Objective
Notify `hello@buyauto.ch` immediately when a new listing is submitted and waiting for approval ("pending" status).

## Trigger Logic
Based on the database analysis, the most reliable signal for a completed submission is the `payment_status` column.

- **Trigger Condition:**
  - `payment_status` changes to `'paid'`
  - AND `status` is `'pending'`
- **Why?**
  - `payment_status` is set to `'paid'` only when the user completes the checkout (for paid plans) or clicks "Create Listing" (for free plans).
  - Checking for `status = 'pending'` ensures we are notifying about listings that actually need approval.
  - Checking that it *changed* to 'paid' prevents duplicate notifications for subsequent updates to the same listing.

## Implementation Steps

### 1. Create Edge Function (`admin-new-listing-notification`)
We will create a new Supabase Edge Function that:
- Accepts the listing record payload.
- Formats an email with key details:
  - Brand & Model
  - Year & Mileage
  - Price Plan (Free/Premium)
  - Link to Admin Dashboard
- Sends the email to `hello@buyauto.ch` using the Resend API.

### 2. Database Trigger
We will create a PostgreSQL trigger using a migration file:
- **Function:** `handle_new_listing_notification()` - calls the Edge Function.
- **Trigger:** `on_listing_paid`
  - Runs `AFTER UPDATE` on `public.listings`.
  - Condition: `(OLD.payment_status IS DISTINCT FROM 'paid') AND (NEW.payment_status = 'paid') AND (NEW.status = 'pending')`.

## Validation
- Existing "paid" listings: 3
- Existing "requires_payment" listings: 17
- This confirms `payment_status` is being used and is the correct field to watch.

## Security
- The Edge Function will be protected (only callable by the database webhook).
- API keys will be securely stored in Supabase Secrets.
