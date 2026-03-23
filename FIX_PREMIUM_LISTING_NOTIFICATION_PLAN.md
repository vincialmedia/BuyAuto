# Premium Listing Notification Fix Plan

## Problem
The `admin-new-listing-notification` email is not triggered for Premium/Paid listings. The Postgres trigger `on_listing_ready_for_review` requires both:
- `status = 'pending'`
- `payment_status = 'paid'`

For free listings, `prepare.ts` sets both fields simultaneously since no payment is required.
For paid listings, `prepare.ts` sets `payment_status = 'requires_payment'` and leaves `status = 'draft'`. When the payment succeeds, the Stripe Webhook (`webhook.ts`) updates `payment_status = 'paid'`, but **fails to update `status = 'pending'`**. As a result, the listing gets stuck in `draft` with `paid` status, and the email trigger never fires.

## Solution
Update `src/pages/api/billing/webhook.ts` in the `payment_intent.succeeded` event handler:
1. When a listing payment succeeds, fetch the current listing.
2. If the listing is currently in `status = 'draft'`, update it to `status = 'pending'` alongside `payment_status = 'paid'`.

This ensures that upon successful payment, the listing officially enters the review queue, and the PostgreSQL trigger will successfully fire and send the notification to the admin.