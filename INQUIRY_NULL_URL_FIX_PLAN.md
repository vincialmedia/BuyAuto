## Plan to Fix NULL URL in Inquiry Trigger

**1. Problem Analysis**

The console shows a `400 Bad Request` error originating from Supabase when creating a listing inquiry. The detailed error message is `null value in column "url" of relation "http_request_queue" violates not-null constraint`.

This indicates that the database trigger (`handle_new_inquiry`) is attempting to make an HTTP request (to invoke the `send-inquiry-email` Edge Function) but is providing a `NULL` URL.

The root cause lies in the `public.supabase_url()` helper function created previously. It was designed to fetch the `SUPABASE_URL` from the Supabase Vault, but this secret does not exist there, causing the function to return `NULL`.

**2. Proposed Solution**

I will modify the `public.supabase_url()` function to be more robust and not rely on a Vault secret. The new version will programmatically construct the project's URL using the built-in `project_ref` setting provided by Supabase.

**3. Implementation Steps**

- **Step 1: Re-create the `supabase_url` Function:** Execute an SQL query to redefine the `public.supabase_url()` function. The new implementation will be:

  ```sql
  CREATE OR REPLACE FUNCTION public.supabase_url()
  RETURNS text
  LANGUAGE sql
  STABLE
  AS $$
    SELECT 'https://' || current_setting('app.settings.project_ref', true) || '.supabase.co'
  $$;
  ```

This will fix the `NULL` URL issue and allow the `handle_new_inquiry` trigger to successfully invoke the Edge Function.
