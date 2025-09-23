# Adjusted Fix Plan: Stripe &amp; Supabase

This plan incorporates the detailed strategy for fixing Stripe initialization and Supabase profile fetching.

## 1. Stripe Fixes

### 1.1. Safe Stripe Loader (`src/lib/stripe.ts`)

Create/replace `src/lib/stripe.ts` to safely handle initialization, only loading Stripe in the browser and returning a promise.

```typescript
// src/lib/stripe.ts
import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise&lt;Stripe | null&gt; | null = null;

export function getStripe(): Promise&lt;Stripe | null&gt; {
  if (typeof window === 'undefined') {
    return Promise.resolve(null);
  }
  if (!stripePromise) {
    const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    stripePromise = pk ? loadStripe(pk) : Promise.resolve(null);
    if (!pk) console.error('❌ Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
  }
  return stripePromise;
}
```

### 1.2. Client-Only Payment Widget (`src/components/buyauto/create-listing/PaymentWidget.tsx`)

Make the payment widget client-only and ensure it only renders the `<Elements>` provider when a `clientSecret` is available.

```typescript
// src/components/buyauto/create-listing/PaymentWidget.tsx
'use client';

import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/stripe';
import CheckoutForm from './CheckoutForm';

const stripePromise = getStripe();

export default function PaymentWidget({
  clientSecret,
  totalAmount,
  onSuccess,
}: { clientSecret: string; totalAmount: number; onSuccess: () => void }) {
  if (!clientSecret || !stripePromise) return null; // Guard: no clientSecret or stripe, no render
  return (
    &lt;Elements stripe={stripePromise} options={{ clientSecret }}&gt;
      &lt;CheckoutForm onSuccess={onSuccess} totalAmount={totalAmount} /&gt;
    &lt;/Elements&gt;
  );
}
```

### 1.3. Billing Step Integration (`src/components/buyauto/create-listing/Step3_PlanSelection.tsx`)

Modify the billing step logic:
1.  If the total amount is `0`, do not call the `/api/billing/prepare` endpoint and proceed to the next step directly.
2.  If the total amount is `> 0`, call the API, get the `clientSecret`, and then render the `PaymentWidget`.
3.  The widget should be dynamically imported using `next/dynamic` with `ssr: false`.

## 2. Supabase Profile Fixes

### 2.1. Database Trigger for Auto-Creation (SQL)

Execute the following SQL to create a trigger that automatically creates a `profiles` entry for each new user in `auth.users`. This also includes the necessary RLS policies, correcting the previous typo of `public.protocols`.

```sql
-- Auto-create a default profile row on new user
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'user')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Minimal RLS
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
for select using (auth.uid() = id);

drop policy if exists "profiles_upsert_own" on public.profiles;
create policy "profiles_upsert_own" on public.profiles
for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
for update using (auth.uid() = id);
```

### 2.2. Client-Side Query (`src/contexts/AuthContext.tsx` or similar)

Update the client-side query to gracefully handle cases where a profile might not exist (e.g., for users created before the trigger was active) by using `.maybeSingle()` and providing a default role.

```typescript
// Example from where the role is checked
const { data, error } = await supabase
  .from('profiles')
  .select('id, role')
  .eq('id', userId)
  .maybeSingle();

const role = data?.role ?? 'user';
// Use the 'role' variable for checks, e.g., setIsAdmin(role === 'admin');
```

## Implementation

This plan will be executed in **Creative Mode**.

1.  Execute the SQL script for the Supabase trigger and RLS policies.
2.  Update `src/lib/stripe.ts`.
3.  Update `src/components/buyauto/create-listing/PaymentWidget.tsx`.
4.  Update the client-side role check (`src/contexts/AuthContext.tsx` or equivalent).
5.  Verify and adjust `src/components/buyauto/create-listing/Step3_PlanSelection.tsx` to skip payment for 0 CHF totals.
