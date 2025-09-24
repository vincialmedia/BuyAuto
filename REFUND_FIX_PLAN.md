
# Refund Integration Plan

## Problem

When an administrator rejects a paid listing from the admin dashboard, the listing's status is correctly updated to `rejected` in the database, but the payment is not automatically refunded to the user.

This is because the `rejectListing` and `bulkReject` functions in `src/services/adminService.ts` only handle the database update and do not trigger the existing Stripe refund logic.

A fully functional refund endpoint exists at `/api/billing/refund`, but it is not being called during the rejection process.

## Solution

The plan is to integrate the refund process directly into the listing rejection flow. This will be done by modifying the admin service to call the refund API after a listing is successfully rejected.

### 1. Update `src/services/adminService.ts`

- **`rejectListing(id, reason)` function:**
    - After successfully updating the listing status to `rejected`, make a `fetch` POST request to `/api/billing/refund`.
    - Pass `{ listing_id: id }` in the request body.
    - Check the response from the refund API. If the refund fails, log a detailed error to the console (e.g., `Failed to process refund for listing ${id}. Please check manually.`).
- **`bulkReject(ids, reason)` function:**
    - Loop through each `id` in the `ids` array.
    - After the bulk update to `rejected`, make individual `fetch` requests to `/api/billing/refund` for each listing ID.
    - Add similar error handling for each failed refund attempt.

### 2. Update `src/components/admin/ModerationView.tsx`

- **`handleReject()` & `handleBulkReject()` functions:**
    - Modify the success `toast` message to provide better feedback to the admin.
    - Change the description from "Das Inserat wurde abgelehnt" to "Das Inserat wurde abgelehnt und die Rückerstattung eingeleitet." (The listing has been rejected and the refund has been initiated).

This plan ensures that the refund is a standard part of the rejection workflow, improving consistency and reducing the need for manual intervention.
