
```markdown
# Plan: Post-Confirmation Welcome & Admin Notification Emails

This plan outlines the steps to automatically send a welcome email to a user after they confirm their email address and a notification email to an admin.

## Strategy

We will use a Supabase Database Trigger on the `auth.users` table. When a user's `email_confirmed_at` field changes from `NULL` to a timestamp (meaning they've just confirmed their email), the trigger will invoke a Supabase Edge Function named `welcome-email`. This function will then use Resend to send the emails.

## Step 1: Set Up Email Provider (Resend)

1.  **Sign Up & Verify Domain:** You have already signed up for Resend and verified your `email.buyauto.ch` domain. Great job!
2.  **Create an API Key:** In your Resend dashboard, create a new API Key with full access permissions.
3.  **Add Supabase Secrets:** Navigate to your Supabase Project Dashboard.
    *   Go to `Project Settings` > `Edge Functions`.
    *   Click `Add new secret` and create a secret named `RESEND_API_KEY`. Paste your Resend API key as the value.
    *   Create another secret named `ADMIN_EMAIL_ADDRESS` and set its value to `vincent@vincialmedia.com`.

## Step 2: Create the Edge Function (`welcome-email`)

This function is responsible for composing and sending the emails. To implement this, switch to **Creative Mode** and ask me to "create and deploy the welcome-email Edge Function using the plan".

**Edge Function Code:**
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@3.2.0";

// These secrets are retrieved from your Supabase project settings
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL_ADDRESS = Deno.env.get("ADMIN_EMAIL_ADDRESS");

const resend = new Resend(RESEND_API_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // This is needed for the Supabase client library to work correctly
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // The database trigger sends the new user record in the request body
    const { record } = await req.json();
    const userEmail = record.email;
    const userId = record.id;

    if (!userEmail) {
      throw new Error("User email is missing in the payload.");
    }
    
    if (!ADMIN_EMAIL_ADDRESS) {
      console.warn("ADMIN_EMAIL_ADDRESS secret is not set. Skipping admin notification.");
    }

    // --- 1. Send Welcome Email to the New User ---
    const sendToUser = await resend.emails.send({
      from: "welcome@email.buyauto.ch", // Using your verified domain
      to: userEmail,
      subject: "Welcome to BuyAuto! Your Account is Confirmed",
      html: `
        <h1>Welcome to BuyAuto!</h1>
        <p>Hi there,</p>
        <p>Thanks for joining us. Your email has been successfully confirmed, and your account is now active.</p>
        <p>You can now log in and start exploring available listings.</p>
        <p>Best,<br>The BuyAuto Team</p>
      `,
    });

    if (sendToUser.error) {
       console.error(`Error sending welcome email to ${userEmail}:`, sendToUser.error);
    } else {
       console.log(`Welcome email sent to ${userEmail}`);
    }

    // --- 2. Send Notification Email to the Admin ---
    if (ADMIN_EMAIL_ADDRESS) {
        const sendToAdmin = await resend.emails.send({
          from: "notifications@email.buyauto.ch", // Using your verified domain
          to: ADMIN_EMAIL_ADDRESS,
          subject: "🎉 New User Signup on BuyAuto!",
          html: `
            <h1>New User Alert!</h1>
            <p>A new user has just signed up and confirmed their email address.</p>
            <ul>
              <li><strong>User ID:</strong> ${userId}</li>
              <li><strong>Email:</strong> ${userEmail}</li>
            </ul>
          `,
        });

        if (sendToAdmin.error) {
           console.error(`Error sending admin notification for ${userEmail}:`, sendToAdmin.error);
        } else {
           console.log(`Admin notification sent for ${userEmail}`);
        }
    }

    return new Response(JSON.stringify({ message: "Emails processed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
```

## Step 3: Create the Database Function and Trigger

This SQL code needs to be run **once** in the Supabase SQL Editor (`Database` > `SQL Editor`). It creates the automation that connects the user confirmation event to the Edge Function.

**SQL Code:**
```sql
-- This function is called by the trigger.
-- It invokes the 'welcome-email' Edge Function when a user's email is confirmed.
create or replace function public.handle_user_confirmed()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Check if the email was just confirmed in this update
  if old.email_confirmed_at is null and new.email_confirmed_at is not null then
    -- Asynchronously invoke the Edge Function to send emails
    perform net.http_post(
      -- IMPORTANT: Replace <YOUR_PROJECT_REF> with your actual project reference ID
      url:='https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/welcome-email',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer <YOUR_SUPABASE_ANON_KEY>"}',
      body:=json_build_object('record', new)
    );
  end if;
  return new;
end;
$$;

-- Drop the trigger if it already exists to avoid errors on re-run
drop trigger if exists on_user_confirmed on auth.users;

-- This trigger fires after any update on the auth.users table
create trigger on_user_confirmed
  after update on auth.users
  for each row
  execute procedure public.handle_user_confirmed();

```
**CRITICAL:** In the SQL script, you must replace `<YOUR_PROJECT_REF>` and `<YOUR_SUPABASE_ANON_KEY>` with your actual Supabase project reference and public anon key, which you can find in your project's API settings.
```
