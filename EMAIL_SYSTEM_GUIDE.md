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

## 3. Reply-To (CRITICAL)
Every email must set a `reply_to` that a human actually reads. The sender stays on the
verified subdomain for deliverability, but nobody monitors `noreply@` — several templates
tell the recipient *"antworten Sie einfach auf diese E-Mail"*, so a reply landing in a black
hole is a broken promise.

**Default:** `reply_to: "hello@buyauto.ch"` on every send.

**Exception:** `service-inquiry-email` keeps `reply_to: inquiryEmail` so the admin replies
straight to the customer who submitted the concierge request.

## 4. Branding / Logo
All email templates use `/buyauto-logo-email.png` — the same wordmark the website header
renders (`/buyauto-logo-header.png`), cropped to its bounding box and flattened onto white.

- Do **not** point emails at `/buyauto-logo.png`: that asset is a dark, glowing 1536×1024
  render (and is actually a JPEG despite the `.png` extension), which looked broken in inboxes.
- Do **not** point emails at `/buyauto-logo-header.png` directly either: roughly 60% of that
  file is transparent padding, so at `height="40"` the wordmark shrinks to ~12px.
- Keep the explicit `width`/`height` attributes — Outlook needs them, and the asset is served
  at ~2× its display size so it stays sharp on retina screens.

## 5. Specific Email Patterns

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

## 6. Required Environment Variables (Secrets)
These must be set in the Supabase Dashboard (Edge Functions > Secrets).

- `RESEND_API_KEY`: API key for the mailing service.
- `SUPABASE_URL`: Project URL.
- `SUPABASE_SERVICE_ROLE_KEY`: Admin key for DB lookups (needed to find owner emails).
- `ADMIN_EMAIL_ADDRESS`: Recipient for system alerts.

## 7. Troubleshooting History
*   **Issue:** Emails not arriving or going to spam.
    *   **Solution:** We switched to the verified subdomain `@email.buyauto.ch` exclusively.
*   **Issue:** Owners replying to the system instead of the buyer.
    *   **Solution:** Implemented `reply_to: [inquiryEmail]` header in the Resend API call.
*   **Issue:** Templates invited users to reply, but the reply went to the unmonitored `noreply@` address.
    *   **Solution:** Added `reply_to: "hello@buyauto.ch"` to every send (see section 3).
*   **Issue:** The logo in emails rendered as a dark, blurry block.
    *   **Solution:** Switched every template to `/buyauto-logo-email.png` (see section 4).
