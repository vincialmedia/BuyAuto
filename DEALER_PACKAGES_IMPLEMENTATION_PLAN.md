# BuyAuto – Checks + Implementationsplan (Garage-Preise & Dealer Package System)

Stand: 2026-02-16

## 1) Ergebnis der Checks (Ist-Zustand, verifiziert im Schema)

### Dealer/Organisation Modell
- “Dealer” ist bei euch die Tabelle `public.garages`.
- Beziehung:
  - `garages.owner_user_id → profiles.id` (User/Owner)
  - `listings.garage_id → garages.id` (Inserate gehören optional zu einer Garage)

### Listing & Premium Felder (bereits vorhanden)
- `listings.is_premium` (boolean, default false)
- `listings.premium_until` (timestamptz, nullable)
- `listings.premium` existiert ebenfalls (legacy) – wir nutzen für neue Logik primär `is_premium`/`premium_until` und lassen legacy unberührt.

### Garage Plan Snapshot (bereits vorhanden, muss kompatibel bleiben)
- `garages.plan` (text, default 'free')
- `garages.listing_limit` (int, default 10)

### Dealer Package Tabellen (bereits vorhanden)
- `dealer_plans` (public read for active plans, admin manage)
- `dealer_subscriptions` (FK `dealer_id → garages.id`, unique per dealer)
- `dealer_plan_changes`
- `dealer_premium_credits` (unique `(dealer_id, period_yyyymm)`)

### Enforcement / Publish
- Frontend ruft bereits `supabase.rpc("publish_garage_listing", { listing_id })` auf (mehrere Stellen).
- Daraus folgt: Limits sind bereits serverseitig enforce-bar. Wir dürfen dieses Verhalten nicht brechen; UI soll Fehlermeldung + Upgrade CTA liefern.

---

## 2) Zielbild (Was “fertig” bedeutet)

### Landingpage /garage-preise
- Mobil-first, Du-Form, Deutsch/CH
- Struktur exakt nach Vorgabe (Hero, Inklusive, Pakete, Premium-Erklärung, Done-for-you, FAQ, Final CTA)
- SEO:
  - title: “BuyAuto – Preise für Garagen”
  - description: “Pakete für Garagen: Inserate, VIN-PreFill, Leasing-Rechner und Deal-Chat pro Fahrzeug. Done-for-you Onboarding ab Growth.”
- Canonical Route:
  - Hauptseite: `/garage-preise`
  - Redirect: `/preise-garagen` → `/garage-preise` (301)

### Dealer “Zahlung” UI (im Garage-Dashboard)
- Zeigt aktuellen Plan (Name/Preis/Limit/Premium Kontingent)
- Zeigt Periode (falls in subscription gepflegt)
- Plan Selector (Starter/Growth/Pro + Kontakt für 100+/Custom)
- Change History (dealer_plan_changes)
- Buttons erzeugen Change Requests (auch wenn Payment später kommt)

### Soft Enforcement
- Publish: wenn Limit erreicht → blockiert (server) + UI zeigt klare Meldung + CTA zu “Zahlung”
- Premium: “Premium setzen” nutzt Credits:
  - wenn Credits aufgebraucht → block + CTA zu “Zahlung”
  - wenn vorhanden → credits_used++ (atomar via RPC) + listing premium setzen

---

## 3) Implementations-Reihenfolge (sicher, ohne Regressionen)

### Phase A — UI Landingpage
1. `/garage-preise` finalisieren (Design/Copy/SEO)
2. Redirect page `/preise-garagen` (permanent redirect)
3. Smoke: Page lädt, CTAs korrekt, kein Demo-Wording, überall “Du”

### Phase B — “Zahlung” im Garage-Dashboard (Foundation)
1. Neue Tab-Sektion “Zahlung” im Garage-Dashboard (ersetzt/übernimmt bisherigen “Plan”-Placeholder)
2. Daten laden:
   - active plans (`dealer_plans`)
   - my subscription (`dealer_subscriptions`)
   - my plan changes (`dealer_plan_changes`)
   - premium credits row für aktuellen Monat (ensure row via upsert) + anzeigen
3. Planwechsel:
   - Button → `request_dealer_plan_change` (bestehende RPC) → danach refresh subscription + history

### Phase C — Soft Enforcement (UX)
1. Publish Flow:
   - dort wo `.rpc("publish_garage_listing")` genutzt wird, Error abfangen
   - klare Meldung “Limit erreicht” + Link/Button “Paket ändern” → Garage-Dashboard “Zahlung”
2. Premium Flow:
   - Listing-UI Action “Als Premium markieren” nur über RPC `garage_set_listing_premium_with_credit`
   - Error abfangen → CTA “Upgrade” / “Kontakt aufnehmen”

---

## 4) Backward Compatibility / “Nichts kaputt machen”
- Bestehende Felder `garages.plan` und `garages.listing_limit` bleiben bestehen und werden weiterhin angezeigt (Fallback).
- Keine Breaking Changes an `publish_garage_listing` Aufrufern – nur bessere Error Messages/UX.
- Keine neuen kritischen E-Mail-Trigger im Frontend (Golden Rule bleibt intakt).

---

## 5) Test-Checkliste (vor Merge/Publish)

### Automatisch
- Softgen Bug Finder: `lint` + `tsc --noEmit` muss grün sein.

### Manuell (Smoke)
- `/garage-preise`:
  - Mobile Layout: Hero + Pricing Cards funktionieren
  - CTA “Jetzt starten” führt zu Auth/Onboarding
  - Keine “Sie”-Formulierungen
- Garage:
  - Login als Garage → `/dashboard/garage` lädt
  - Tab “Zahlung” zeigt Plan + History
  - Planwechsel erzeugt Change Request und UI refresht
- Enforcement:
  - Publish bei Limit: blockiert + CTA sichtbar
  - Premium Credits: wenn 0 → blockiert + CTA sichtbar

---

## 6) NEW: Recurring dealer billing + “Upgrade for how long” + downgrade-to-drafts

### 6.1 Current state (as-is)
- Dealer package purchase currently uses a one-time Stripe Checkout Session (`mode: "payment"` in `src/pages/api/dealer/prepare.ts`).
- The system then writes a 30-day access window into `public.dealer_subscriptions` in the webhook / confirm handler.
- Result: packages are **not recurring** yet. Switching to real Stripe Subscriptions is required.

### 6.2 Target behavior (to-be)
#### A) Dealer self-serve packages (paid, recurring)
- Dealers choose a plan and pay with Stripe.
- Billing is **recurring monthly** (CHF).
- Plan remains active until canceled or payment fails.
- Stripe subscription lifecycle becomes the source of truth.

#### B) Admin-only “Upgrade for how long” (free override, no credit card)
- Duration picker exists **only in the admin dashboard**, not in dealer Pricing checkout.
- Values: `1, 2, 3, 6, 12, 999` months.
- Admin can grant a plan “for free” for N months without collecting CC details.
- Implementation is **DB-driven** using `public.dealer_admin_overrides`:
  - Create a row `{ dealer_id, plan_id, starts_at, ends_at, notes, created_by }`
  - This override takes precedence over Stripe subscription status for access checks.

#### C) Subscription/override end + grace rule
- When a dealer’s Stripe subscription ends OR an admin override ends:
  - The dealer keeps their current listing statuses for a **5-day grace period**.
  - After grace ends, all garage listings with status in **`published`, `active`, `inactive`** are converted to **`draft`** and therefore unpublished from the frontend.
  - To re-publish, the dealer must select a new plan again.

#### D) Downgrade behavior (admin action)
- When admin downgrades a dealer plan, show a clear banner/toast in dealer dashboard:
  - “Plan geändert – bitte Inserate in Entwürfen prüfen und erneut veröffentlichen.”
- Downgrade does **not** instantly unpublish; it follows the same grace mechanism if the change results in loss of entitlement, otherwise it may immediately enforce limits on publish operations.

### 6.3 Data model requirements
- Store Stripe recurring price ids in DB:
  - `public.dealer_plans.stripe_price_id` (text) must be populated for starter/growth/pro.
- Store Stripe linkage + subscription state in `public.dealer_subscriptions`:
  - `stripe_customer_id`, `stripe_subscription_id` (unique), `cancel_at`, `canceled_at`, `ended_at`, `grace_ends_at` (already present via migrations).
- Ensure we can compute entitlement by:
  1) Active admin override (now between starts_at and ends_at) OR
  2) Active Stripe subscription (status=active and current_period_end in the future; not ended) OR
  3) If ended: allow until `grace_ends_at`

### 6.4 Stripe implementation (required changes)
- Update `src/pages/api/dealer/prepare.ts`:
  - Switch Checkout Session to `mode: "subscription"`
  - Use plan’s `stripe_price_id`
  - Include metadata: `{ kind:"dealer_plan", dealer_id, plan_id, plan_code, user_id }`
- Update `src/pages/api/billing/webhook.ts`:
  - Handle subscription events:
    - `checkout.session.completed` (subscription id + customer id)
    - `invoice.paid` (renewals)
    - `invoice.payment_failed`
    - `customer.subscription.updated`
    - `customer.subscription.deleted`
  - Map Stripe subscription → `dealer_subscriptions`:
    - maintain `current_period_start/end`, `status`, `stripe_subscription_id`, `stripe_customer_id`
    - when subscription ends: set `ended_at` and `grace_ends_at = ended_at + 5 days`

### 6.5 Enforcement job (reliability)
- Add/update a scheduled Edge Function (recommended new function, similar to `check-expired-listings`) that:
  1) Finds dealers where (subscription ended OR override expired) AND `grace_ends_at <= now()`
  2) Converts all affected listings (`published`, `active`, `inactive`) to `draft`
  3) Logs counts for monitoring
- This avoids relying solely on webhook timing and guarantees eventual consistency.

### 6.6 Admin dashboard work (scope)
- Add an admin control to grant/adjust `dealer_admin_overrides` with the duration picker.
- Add admin control to switch a dealer’s paid plan (Stripe subscription) if needed (future enhancement).
- Ensure all admin actions are server-side / RPC-gated and audited in DB.