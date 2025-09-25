# Stripe Authentication Fix Plan

## Problem Analysis
The payment preparation step fails with "Payment system authentication failed" during the "Weiter zur Bezahlung" process.

## Root Cause
- Stripe secret key validation fails in `/api/billing/prepare.ts`
- The `stripe.balance.retrieve()` test call throws a StripeAuthenticationError
- Current key may be invalid, expired, or corrupted

## Current Configuration
```
STRIPE_SECRET_KEY=sk_test_51Q0oa9P3wVFWUmEQZUYSrx2P6A4Ae0J2LZ9nSjyLRlU6nJXIg7x8nvTJkxkxJaiwxSqmeBrSrhUZGb9uu8cjFJN700HEKzCO3j
```

## Fix Implementation Steps

### 1. Stripe Key Validation
- [ ] Test current key with direct Stripe API call
- [ ] Verify key belongs to correct Stripe account
- [ ] Check key permissions and restrictions

### 2. Environment Update
- [ ] Generate new test secret key from Stripe dashboard
- [ ] Update `.env.local` with valid key
- [ ] Test key functionality with balance retrieve

### 3. Error Handling Enhancement
- [ ] Add detailed error logging for debugging
- [ ] Improve user-facing error messages
- [ ] Add key validation endpoint for testing

### 4. End-to-End Testing
- [ ] Test complete listing creation flow
- [ ] Verify payment intent creation
- [ ] Confirm webhook processing
- [ ] Validate admin listing display

## Expected Outcome
- "Weiter zur Bezahlung" step works correctly
- Payment intents are created successfully
- Admin can see listing prices (price_paid_chf)
- Proper error handling for future issues

## Next Steps
Switch to Creative/Standard mode to implement the fixes.
