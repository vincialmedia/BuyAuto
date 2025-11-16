
# Inquiry Email Domain Fix Plan

## Problem
The `send-inquiry-email` Edge Function is failing with a `403 validation_error` from Resend.

- **Root Cause:** The function attempts to send emails from `noreply@buyauto.app`.
- **Configuration:** The user has verified the domain `email.buyauto.ch` in their Resend account, not `buyauto.app`.

## Solution
Update the `send-inquiry-email` Edge Function to use the correct, verified domain.

1.  **File to Modify:** `supabase/functions/send-inquiry-email/index.ts`
2.  **Change:** Modify the `from` field in the `resend.emails.send` call.
    -   **From:** `from: "BuyAuto <noreply@buyauto.app>"`
    -   **To:** `from: "BuyAuto <noreply@email.buyauto.ch>"`
3.  **Deploy:** Redeploy the `send-inquiry-email` function to Supabase to apply the change.

This will align the code with the existing Resend configuration and resolve the error.
