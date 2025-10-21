# Plan: Listing Inquiry Email Notification

This document outlines the plan to implement an email notification system for new listing inquiries. When a user submits the "Anfrage senden" form, the owner of the listing will receive an email with the inquiry details.

## 1. Backend: Supabase Edge Function

We will create a new Supabase Edge Function named `send-inquiry-email`.

**Path:** `supabase/functions/send-inquiry-email/index.ts`

**Responsibilities:**
1.  Accept an `inquiry_id` in the request body.
2.  Use the Supabase service role client to bypass RLS for trusted server-to-server communication.
3.  Fetch the inquiry details from the `listing_inquiries` table using the `inquiry_id`.
4.  Fetch the corresponding listing from the `listings` table using the `listing_id` from the inquiry.
5.  Fetch the profile of the listing owner from the `profiles` table using the `user_id` from the listing to get their email address.
6.  Construct an HTML email with the inquiry details (inquirer's name, email, phone, message) and a link to the listing.
7.  Use Supabase's built-in email sending capabilities to send the email to the listing owner.

## 2. Backend: Database Trigger

To automate the process, we will create a PostgreSQL function and a trigger in the database.

**a. Database Function (`handle_new_inquiry`)**
This function will be executed by the trigger. It will:
1.  Receive the new inquiry record (`NEW`).
2.  Invoke the `send-inquiry-email` Edge Function, passing the `NEW.id` (the ID of the new inquiry).

**b. Database Trigger (`on_inquiry_created`)**
This trigger will be attached to the `listing_inquiries` table.
1.  It will fire `AFTER INSERT` on the `listing_inquiries` table.
2.  For each new row, it will execute the `handle_new_inquiry` function.

## 3. Frontend: No Changes Required (Initially)

The existing `InquiryForm.tsx` component and `inquiryService.ts` are already set up to insert data into the `listing_inquiries` table. The new backend trigger will handle the email logic automatically, so no immediate frontend changes are needed. The user experience will remain the same: they fill out the form, submit it, and see a success message.

## 4. Security: Row-Level Security (RLS)

We will ensure the `listing_inquiries` table has appropriate RLS policies.
-   **INSERT:** Allow public, unauthenticated inserts so anyone can send an inquiry.
-   **SELECT:** Restrict to authenticated users who own the listing or admins.
-   **UPDATE/DELETE:** Restrict to the record creator or admins.

## Implementation Steps

1.  Create and deploy the `send-inquiry-email` Edge Function.
2.  Add the `handle_new_inquiry` function and `on_inquiry_created` trigger to the database via a SQL migration.
3.  Verify and apply the RLS policies for the `listing_inquiries` table.
4.  Test the end-to-end flow by submitting an inquiry from the listing detail page and checking if the owner receives an email.
