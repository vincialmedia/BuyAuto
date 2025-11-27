# Newsletter Integration Plan (Direct to Resend)

## 1. Overview
Implement a newsletter signup form in the global footer that sends contact data directly to Resend, bypassing the application database.

## 2. Prerequisites
- **Resend API Key**: Must be set in `.env.local` as `RESEND_API_KEY`.
- **Resend Audience ID**: You must create an Audience in the Resend Dashboard and add its ID to `.env.local` as `RESEND_AUDIENCE_ID`.
- **Package**: Install the SDK via `npm install resend`.

## 3. Architecture

### A. Frontend Component (`src/components/buyauto/NewsletterSignup.tsx`)
- **Location**: Embedded in `src/components/buyauto/Footer.tsx` (above current content).
- **Fields**:
  - Email Input (Standard styling).
  - Checkbox: "Ich möchte Informationen und Angebote per E-Mail erhalten." (Required to submit).
- **Validation**: Zod schema for email format.
- **State**: Loading, Success, Error states.

### B. Backend API Route (`src/pages/api/newsletter/subscribe.ts`)
- **Method**: POST
- **Security**: Validates request body, protects API key on server.
- **Logic**:
  1. Receive `email` from request.
  2. Initialize Resend SDK.
  3. Call `resend.contacts.create()` method.
  4. Payload mapping:
     ```javascript
     {
       email: email,
       audienceId: process.env.RESEND_AUDIENCE_ID,
       data: {
         signed_up_at: new Date().toISOString(), // Custom attribute for Sign Up Date
         source: 'footer_signup'
       }
     }
     ```
  5. Return success/error to frontend.

## 4. Implementation Steps

### Step 1: Configuration
1. Add environment variables to `.env.local`.
2. Run `npm install resend`.

### Step 2: Backend Implementation
1. Create `src/pages/api/newsletter/subscribe.ts`.
2. Implement error handling (e.g., if contact already exists).

### Step 3: Frontend Implementation
1. Create `src/components/buyauto/NewsletterSignup.tsx`.
2. Update `src/components/buyauto/Footer.tsx` to include the new component at the top of the container.

### Step 4: Verification
1. Test submission.
2. Verify contact appears in Resend Dashboard > Audiences > All Contacts.
3. Verify `signed_up_at` property exists in the contact details.
