## Stripe and Hydration Error Final Fix Plan

This document outlines the definitive plan to resolve the Stripe initialization and React hydration errors.

### 1. Create a New, Safe Stripe Loader

**File**: `src/lib/stripe-client.ts`
**Purpose**: To create a completely client-side-only, SSR-safe Stripe loader. This isolates the Stripe instance and prevents it from ever being initialized on the server.

**Implementation**:
```typescript
import { loadStripe, Stripe } from '@stripe/stripe-js';

// Use a module-level variable to cache the Stripe promise.
let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  // Only run this logic in the browser.
  if (typeof window === 'undefined') {
    return null;
  }
  
  if (!stripePromise) {
    const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    if (!stripePublishableKey) {
      console.error("Stripe publishable key is not set. Please set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable.");
      // Return a promise that resolves to null to handle this gracefully.
      stripePromise = Promise.resolve(null);
    } else {
      stripePromise = loadStripe(stripePublishableKey);
    }
  }
  return stripePromise;
};
```

### 2. Update the Payment Widget

**File**: `src/components/buyauto/create-listing/PaymentWidget.tsx`
**Purpose**: To use the new safe loader and only render the Stripe `<Elements>` component once the Stripe instance is confirmed to be available.

**Implementation**:
```typescript
'use client';

import { useEffect, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/stripe-client'; // Use the new client-safe loader
import CheckoutForm from './CheckoutForm';
import type { Stripe } from '@stripe/stripe-js';

// ... (props interface)

export default function PaymentWidget({ clientSecret, totalAmount, onSuccess }) {
  const [stripe, setStripe] = useState<Promise<Stripe | null> | null>(null);

  useEffect(() => {
    // getStripe() is now guaranteed to only run on the client.
    const stripePromise = getStripe();
    if (stripePromise) {
      setStripe(stripePromise);
    }
  }, []);

  // Do not render anything until the Stripe promise is set and we have a client secret.
  if (!stripe || !clientSecret) {
    return (
      <div className="text-center p-4">
        <p>Loading Payment Form...</p>
      </div>
    );
  }

  const appearance = { /* ... appearance options ... */ };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white p-6 rounded-lg border ...">
        <h3 ...>Sichere Zahlung - CHF {totalAmount}</h3>
        <Elements stripe={stripe} options={{ clientSecret, appearance }}>
          <CheckoutForm onSuccess={onSuccess} totalAmount={totalAmount} />
        </Elements>
      </div>
    </div>
  );
}
```

### 3. Refactor the Main Billing Step

**File**: `src/components/buyauto/create-listing/Step3_PlanSelection.tsx`
**Purpose**: To ensure the `PaymentWidget` is only rendered on the client side when a payment is actually required.

**Implementation**:
*   Ensure the dynamic import remains in place and is correctly configured:
    ```typescript
    import dynamic from 'next/dynamic';

    const PaymentWidget = dynamic(
      () => import('./PaymentWidget'),
      { 
        ssr: false,
        loading: () => <p>Loading payment form...</p> 
      }
    );
    ```
*   The conditional rendering logic (`clientSecret ? <PaymentWidget ... /> : ...`) will now correctly mount the client-only widget without causing SSR issues.

### 4. Create Supabase `handle_new_user` Function

**File**: `supabase/migrations/0001_handle_new_user_trigger.sql` (or similar)
**Purpose**: To automatically create a user profile upon sign-up, preventing "406 Not Acceptable" errors.

**Implementation**:
```sql
-- Creates a trigger function to automatically insert a new row into public.profiles
-- when a new user signs up in auth.users.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'user');
  return new;
end;
$$ language plpgsql security definer;

-- Creates the trigger that executes the function after a new user is created.
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

This comprehensive approach will fully resolve the reported issues by enforcing correct SSR boundaries and safe initialization patterns.
