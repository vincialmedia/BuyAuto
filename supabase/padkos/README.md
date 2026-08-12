# Padkos × Supabase — hookup guide

The Padkos shop (`/padkos`) ships fully functional without a backend: cart,
wishlist and orders live in the visitor's localStorage, so every flow completes
end-to-end in the demo. This guide is the single list of steps to switch
persistence to Supabase + Vercel.

## 1. Create a dedicated Supabase project

Padkos is its own brand — do **not** reuse BuyAuto's Supabase project.
Create a fresh project at [database.new](https://database.new), region
`eu-central` (Frankfurt) for Austrian customers.

## 2. Apply the schema

Open the project's **SQL Editor**, paste the contents of
[`schema.sql`](./schema.sql), run it. That creates and seeds:

| Table | Purpose | Anon access |
|---|---|---|
| `padkos_products` | catalogue (seeded from the design bundle) | read |
| `padkos_orders` + `padkos_order_items` | guest checkout orders | insert-only |
| `padkos_newsletter` | signup emails (unique per address) | insert/upsert |
| `padkos_contact` | contact-form messages | insert-only |
| `padkos_wishlists` | cross-device wishlist for signed-in users | own rows |

RLS is on everywhere. Order rows are write-only for the anon key — reading
them back requires the service role (backoffice).

## 3. Set the env vars (Vercel → Project → Settings → Environment Variables)

```
NEXT_PUBLIC_PADKOS_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_PADKOS_SUPABASE_ANON_KEY=<anon key>
```

That's the whole switch: `src/lib/padkos/backend.ts` detects the vars and
starts writing orders, newsletter signups and contact messages to Supabase.
Locally, put the same two lines in `.env.local`.

## 4. What stays client-side on purpose

- **Cart & wishlist for guests** — localStorage, as designed. No account
  required to buy.
- **Order confirmation page** — reads the just-placed order from localStorage,
  so it works even if the Supabase write failed (the write is best-effort and
  logged; the local copy is the source for the confirmation screen).

## 5. Later steps (in rough order of value)

1. **Payment** — the checkout collects the payment *method* but takes no money
   ("Demo-Kasse" notice is shown). Wire Stripe/Mollie in `submitOrder()`
   before removing that notice; EPS + Klarna + Cards are all available via
   Stripe's Austrian payment methods.
2. **Order emails** — a Supabase Edge Function on `padkos_orders` INSERT
   (Resend works well) for the Bestellbestätigung the confirmation page
   promises.
3. **Auth** — `Login`/`Konto` are demo screens. Enable Supabase Auth (email +
   password), then: `padkos_wishlists` sync, order history by `email`.
4. **Catalogue from DB** — the client currently bundles the catalogue
   (`src/lib/padkos/catalog.ts`). Point the shop pages at `padkos_products`
   once stock management matters; the seed keeps both identical until then.
5. **LMIV compliance** — before selling real food, each product needs full
   Zutaten/Allergene/Nährwerte on the PDP (EU 1169/2011 applies to distance
   selling). The schema's `description` column is where that content lands;
   the PDP's "Zutaten & Allergene" accordion is the display slot.

## 6. Going to padkos.at (Vercel)

1. Add the domain in Vercel, point DNS.
2. Set `NEXT_PUBLIC_PADKOS_SITE_URL=https://www.padkos.at` — canonicals and
   JSON-LD switch to the real host.
3. Set `NEXT_PUBLIC_PADKOS_INDEXABLE=true` — removes the `noindex` that keeps
   the shop out of Google while it lives on buyauto.ch.
4. Replace the Impressum/AGB/Datenschutz *Musterangaben* with real register
   data (marked in `src/pages/padkos/rechtliches.tsx`).
