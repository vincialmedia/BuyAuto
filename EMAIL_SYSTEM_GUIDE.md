# BuyAuto Email System Guide & Best Practices

## 1. Core Architecture: Database Triggers
**Golden Rule:** Never trigger critical transactional emails directly from the client-side (React).
- **Mechanism:** We use Supabase Database Webhooks.
- **Flow:** Row Inserted in DB $\rightarrow$ Supabase Webhook $\rightarrow$ Edge Function $\rightarrow$ Resend API.
- **Reasoning:** Ensures reliability, handles secrets securely on the server, and centralizes logic.

## 2. Verified Domains (CRITICAL)
We must **ONLY** send emails from the verified subdomain `@email.buyauto.ch`.
Using root `@buyauto.ch` or other domains will result in delivery failures (DMARC/DKIM issues).

| Purpose | Sender Address | Sender Name |
|---------|---------------|-------------|
| Listing Inquiries | `noreply@email.buyauto.ch` | BuyAuto |
| User Welcome | `welcome@email.buyauto.ch` | BuyAuto |
| Admin Alerts | `notifications@email.buyauto.ch` | BuyAuto |

## 3. Specific Email Patterns

### A. Inquiry Emails (`send-inquiry-email`)
This function handles messages from interested buyers to listing owners.

**Critical Requirements:**
1.  **Sender:** `BuyAuto <noreply@email.buyauto.ch>`
2.  **Recipient (To):** The Listing Owner (fetched via database lookup using `listing_id`).
3.  **Copy (BCC):** The Inquirer (`record.email`) - ensures they have a record.
4.  **Reply-To:** The Inquirer (`record.email`) - **CRITICAL**.
    *   *Why:* This allows the listing owner to simply click "Reply" in their email client to respond directly to the potential buyer, rather than replying to the system `noreply` address.

**Data Fetching Logic:**
The Edge Function receives the `inquiry` record payload. It must then use the `SUPABASE_SERVICE_ROLE_KEY` to:
1.  Query `listings` table to find `created_by` (owner ID).
2.  Query `profiles` table to find the owner's `email`.

### B. Welcome Emails (`welcome-email`)
Triggered when a new user confirms their email.

**Critical Requirements:**
1.  **Sender:** `welcome@email.buyauto.ch`
2.  **Recipient:** The new user.
3.  **Admin Notification:** Sends a separate alert to `ADMIN_EMAIL_ADDRESS` from `notifications@email.buyauto.ch`.

## 4. Required Environment Variables (Secrets)
These must be set in the Supabase Dashboard (Edge Functions > Secrets).

- `RESEND_API_KEY`: API key for the mailing service.
- `SUPABASE_URL`: Project URL.
- `SUPABASE_SERVICE_ROLE_KEY`: Admin key for DB lookups (needed to find owner emails).
- `ADMIN_EMAIL_ADDRESS`: Recipient for system alerts.

## 5. Troubleshooting History
*   **Issue:** Emails not arriving or going to spam.
    *   **Solution:** We switched to the verified subdomain `@email.buyauto.ch` exclusively.
*   **Issue:** Owners replying to the system instead of the buyer.
    *   **Solution:** Implemented `reply_to: [inquiryEmail]` header in the Resend API call.
