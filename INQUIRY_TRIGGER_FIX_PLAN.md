
# Plan: Fix "function supabase_url() does not exist" Error

## 1. Problem Diagnosis

- **Symptom:** Submitting a listing inquiry fails with a console error: `[INQUIRY SERVICE] Error creating inquiry: { "code": "42883", "message": "function supabase_url() does not exist", ... }`.
- **Root Cause:** The database trigger `on_inquiry_created` calls a PL/pgSQL function (`handle_new_inquiry`) which, in turn, attempts to invoke an Edge Function. This process relies on a helper function `supabase_url()` to get the project's URL for the invocation request. This helper function was either deleted or never created.
- **Impact:** No new inquiries can be saved to the database, and no notification emails are sent.

## 2. Plan of Action

The fix requires re-creating the necessary helper functions in the database. These functions will securely retrieve Supabase project secrets.

### Step 1: Create Secure Helper Functions

We will create two SQL functions to securely access the necessary secrets (`supabase_url` and `supabase_service_role_key`) from Supabase's `vault`. This is the modern, secure approach.

**Action:** Execute the following SQL to create the functions.

```sql
-- Function to get the Supabase URL from secrets
create or replace function public.supabase_url()
returns text
language sql
stable
as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'supabase_url' limit 1;
$$;

-- Function to get the Service Role Key from secrets
create or replace function public.get_service_role_key()
returns text
language sql
stable
as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'supabase_service_role_key' limit 1;
$$;
```

### Step 2: Update the `handle_new_inquiry` function

The original `handle_new_inquiry` function was likely looking for `supabase_url()` and a hardcoded key or another function for the key. We need to ensure it uses the new `get_service_role_key()` function.

**Action:** Update the `handle_new_inquiry` function to use the new helper function for the service role key.

```sql
CREATE OR REPLACE FUNCTION public.handle_new_inquiry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  listing_title TEXT;
  owner_email TEXT;
  inquiry_name TEXT;
  inquiry_email TEXT;
  inquiry_message TEXT;
  listing_id_text TEXT;
BEGIN
  -- Get listing details
  SELECT l.title, p.email INTO listing_title, owner_email
  FROM public.listings l
  JOIN public.profiles p ON l.user_id = p.id
  WHERE l.id = NEW.listing_id;

  -- Get inquiry details from the new row
  inquiry_name := NEW.name;
  inquiry_email := NEW.email;
  inquiry_message := NEW.message;
  listing_id_text := NEW.listing_id::text;

  -- Invoke the Edge Function
  PERFORM net.http_post(
    url := public.supabase_url() || '/functions/v1/send-inquiry-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || public.get_service_role_key()
    ),
    body := jsonb_build_object(
      'listingId', listing_id_text,
      'listingTitle', listing_title,
      'ownerEmail', owner_email,
      'inquiryName', inquiry_name,
      'inquiryEmail', inquiry_email,
      'inquiryMessage', inquiry_message
    )
  );

  RETURN NEW;
END;
$$;

```

### Step 3: Verification

- **Action:** Submit a new inquiry through the UI.
- **Expected Result:**
  1. The inquiry is successfully saved to the `listing_inquiries` table.
  2. The "send-inquiry-email" Edge Function is invoked successfully (check Supabase logs).
  3. The listing owner receives the inquiry email.
  4. The inquirer receives a BCC copy of the email.
