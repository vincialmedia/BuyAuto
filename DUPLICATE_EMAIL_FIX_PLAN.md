# Duplicate Email Fix Plan

## Problem
Emails were sending twice across the platform (Welcome Emails, Inquiries, Listing Approvals, New Messages).

This was caused by:
1. Missing UNIQUE constraints on the `email_notification_log` table, which caused the Edge Functions' idempotency checks to fail.
2. Redundant manual Edge Function invocations in the frontend/API code overlapping with automatic Database Triggers (Postgres Webhooks).

## Phase 1: Database Fix (✅ COMPLETED)
UNIQUE constraints were successfully applied to `email_notification_log` to activate the idempotency locks:
- Entity-based emails (Inquiries, Listing status) now require a unique combination of `kind`, `entity_id`, and `recipient_email`.
- Message emails require a unique combination of `kind`, `message_id`, and `recipient_email`.
- Welcome emails require a unique combination of `kind` and `recipient_email`.

## Phase 2: Codebase Cleanup (⏳ TO DO)
Remove redundant manual Edge Function invocations to prevent the system from intentionally firing twice and hitting the newly created idempotency locks unnecessarily.

**Target File:** `src/pages/api/admin/listings/update-status.ts`
- Remove lines 86-96 that manually invoke the `listing-status-notification` Edge Function.
- The `on_listing_status_change` database trigger will handle sending the email automatically when the listing status is updated.

```typescript
// REMOVE THIS BLOCK:
try {
  await supabaseAdmin.functions.invoke("listing-status-notification", {
    body: {
      record: data,
      old_record: { status: oldStatus },
      ...(notificationStatus ? { notification_status: notificationStatus } : {}),
    },
  });
} catch (e) {
  console.warn("update-status: listing-status-notification invoke failed", e);
}
```