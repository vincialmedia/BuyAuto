# Datenschutz (Privacy Policy) Implementation Plan

## 1. Analysis & Requirements
We need to create a GDPR/DSGVO-compliant privacy policy page for BuyAuto (Swiss market focus).

### Detected Technologies & Services
- **Hosting:** Vercel (Serverless functions, CDN)
- **Database & Auth:** Supabase (hosted in Frankfurt/AWS usually, need to confirm region)
- **Payments:** Stripe (Credit card processing)
- **Fonts:** Google Fonts (via Next.js optimization - locally hosted proxy)
- **Images/Storage:** Supabase Storage
- **File Uploads:** Uppy (Transloadit) - referenced in _document.tsx

## 2. Information Collection (Questionnaire)
To generate a legally sound text, we need the following details from the user:

### A. Company Information (Verantwortlicher)
- Company Name:
- Address:
- E-Mail for Privacy Concerns:
- Represented by (CEO/Owner):

### B. Data Processing Details
1. **Analytics:** Do you use Google Analytics, Plausible, Hotjar, or Vercel Analytics? (None found in code, but please confirm).
2. **Marketing:** Do you use newsletters (Mailchimp, SendGrid)?
3. **Cookies:** Do you use a Cookie Consent banner? (Not seen in code, essential for non-necessary cookies).
4. **Server Logs:** Vercel collects standard logs.
5. **Supabase Region:** Is your Supabase project hosted in the EU (Frankfurt)?

## 3. Implementation Plan
1. **Create Page:** `src/pages/datenschutz.tsx`
2. **Content Structure:**
   - General Information
   - Responsible Entity
   - Data Collection on Website (Cookies, Logs)
   - Registration & User Account
   - Payment Processing (Stripe)
   - Hosting & Backend (Vercel, Supabase)
   - User Rights (Access, Deletion, etc.)
3. **Styling:** Use simple, readable text layout with `prose` (Tailwind typography) or custom styling consistent with the site.

## 4. Next Steps
- Wait for user answers.
- Draft the content based on answers.
- Implement the page.
