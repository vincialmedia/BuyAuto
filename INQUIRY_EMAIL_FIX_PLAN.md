
## Inquiry Email Delivery Fix Plan

### 1. Problem Analysis

The user reported that inquiry emails are not being sent to the listing owner, and the inquirer is not receiving a confirmation copy. Investigation revealed two root causes:

1.  **Database Relationship Error:** The `send-inquiry-email` Edge Function fails with a `4xx` error because it cannot resolve the listing owner's email address. The database query in the function relies on a named foreign key constraint `listings_user_id_fkey`, which is missing from the `listings` table schema. This causes the query for the owner's profile to return `null`, leading the function to throw an "Owner email not found" error.
2.  **Missing Confirmation Feature:** The Edge Function's logic only sends an email to the listing owner (`to: ownerEmail`). It does not include functionality to send a confirmation copy to the inquirer.

### 2. Proposed Solution

A two-step solution will be implemented to resolve both issues.

#### Step 1: Add Missing Foreign Key Constraint

A SQL `ALTER TABLE` command will be executed to add the necessary foreign key relationship between `listings.user_id` and `profiles.id`. This will fix the database query error in the Edge Function.

**SQL to Execute:**
```sql
ALTER TABLE public.listings
ADD CONSTRAINT listings_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id)
ON DELETE SET NULL;
```
*Rationale for `ON DELETE SET NULL`:* If a user's profile is deleted, their listings will not be deleted. Instead, the `user_id` on their listings will be set to `NULL`. This prevents accidental data loss.

#### Step 2: Enhance Edge Function to Send BCC Confirmation

The `send-inquiry-email/index.ts` function will be modified to include the inquirer's email address in the `bcc` field of the email. This will provide the user with a copy of their inquiry.

**Code Modification (`supabase/functions/send-inquiry-email/index.ts`):**
```typescript
// Inside the handler function, locate the resend.emails.send call

const sendResult = await resend.emails.send({
  from: "BuyAuto &lt;notifications@email.buyauto.ch&gt;",
  to: ownerEmail,
  bcc: inquiry.email, // &lt;-- ADD THIS LINE
  reply_to: inquiry.email,
  subject: emailSubject,
  html: emailHtml,
});
```

### 3. Implementation Steps

1.  Switch to **Standard Mode**.
2.  Use the `execute_sql_query` tool to apply the `ALTER TABLE` statement.
3.  Use the `update_file` tool to modify `supabase/functions/send-inquiry-email/index.ts` and add the `bcc` field.
4.  Confirm with the user that the fix is complete and ask them to test the inquiry form again.
