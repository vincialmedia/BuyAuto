
# Email Configuration Guide: Switching to Resend SMTP

Currently, your "Confirm Signup" emails are sent via Supabase's default mail server, which adds "via supabase.co" branding and may affect deliverability. To send these emails through your verified Resend domain, follow these steps.

## Phase 1: Get SMTP Credentials from Resend

1. Log in to your [Resend Dashboard](https://resend.com/api-keys).
2. Create a new API Key (or use an existing one).
   - **Name:** `Supabase SMTP` (recommended)
   - **Permission:** `Sending access` is sufficient.
3. Copy the API Key (it starts with `re_`).

## Phase 2: Configure Supabase Auth

1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **Project Settings** (cog icon) → **Authentication**.
3. Scroll down to **SMTP Settings**.
4. Toggle **Enable Custom SMTP** to `ON`.
5. Enter the following details:
   - **Sender Email:** `onboarding@your-domain.com` (Must verify this domain in Resend first)
   - **Sender Name:** `BuyAuto`
   - **Host:** `smtp.resend.com`
   - **Port:** `465`
   - **Username:** `resend`
   - **Password:** `[Paste your Resend API Key here]` (e.g., `re_12345...`)
   - **Secure Connection:** Toggle `ON` (SSL/TLS)
6. Click **Save**.

## Phase 3: Customize the Email Template

Now that the *delivery* is fixed, you can fix the *content* to remove Supabase references.

1. In Supabase Dashboard, go to **Authentication** → **Email Templates**.
2. Select **Confirm Signup**.
3. Edit the **Subject**: e.g., `Confirm your registration on BuyAuto`
4. Edit the **Body** (HTML). You can use standard HTML here.
   
   **Basic Clean Template Example:**
   ```html
   &lt;h2&gt;Welcome to BuyAuto!&lt;/h2&gt;
   &lt;p&gt;Please confirm your email address to activate your account.&lt;/p&gt;
   &lt;p&gt;&lt;a href="{{ .ConfirmationURL }}" style="background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;"&gt;Confirm Email&lt;/a&gt;&lt;/p&gt;
   &lt;p&gt;Or copy this link: {{ .ConfirmationURL }}&lt;/p&gt;
   ```
5. Click **Save**.

## Phase 4: Verification

1. Go to your app and register a new test user.
2. Check the email inbox.
   - **From:** Should be your domain (e.g., `onboarding@buyauto.com`).
   - **Mailed-by:** Should be `resend.com` or your authenticated domain.
   - **Branding:** "via supabase.co" should be gone.

## Advanced Option: Total Control (Not Recommended yet)

If you absolutely need a React-based email template (identical to your other Resend emails) for the confirmation step, we would need to:
1. Disable "Confirm Email" auto-sending in Supabase.
2. Create a Database Trigger on `auth.users`.
3. Use the Admin API to generate a confirmation link manually.
4. Send it via an Edge Function using Resend SDK.

*Recommendation: Stick to the SMTP method above. It is more secure, reliable, and requires zero code maintenance.*
  