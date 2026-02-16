# BuyAuto – “Preise für Garagen” Landingpage + Dealer Package System (Foundation)

Date: 2026-02-16  
Project: BuyAuto.ch (Next.js Pages Router + Supabase)

---

## 0) Executive summary

You want two deliverables:

1) A new **mobile-first, sales-driven landing page** for garage pricing in **Du-form (Deutsch/CH)**, URL:
- Canonical: **/garage-preise/**
- Optional alias: /preise-garagen/ → redirect to /garage-preise/

2) A **Dealer (Garage) package/subscription foundation** in Supabase so garages can:
- Have a current plan (Starter/Growth/Pro/Custom)
- See it under **Garage Dashboard → “Zahlung”**
- Request upgrades/downgrades (stateful, even before payments are integrated)
- Get soft enforcement for:
  - **Listing publish limit** per plan
  - **Premium credits per month** per plan

This plan is designed to be **backwards-compatible** with the existing schema and flows, and to avoid breaking current garage dashboards and the existing publish RPC.

---

## 1) Check results (facts we verified)

### 1.1 Existing DB schema (relevant parts)

**profiles**
- `role` allowed values: `private`, `garage`, `admin`

**garages**
- `id` uuid PK
- `owner_user_id` uuid FK → `profiles.id`
- `listing_limit` int default **10**
- `plan` text default **"free"**
- RLS enabled; garage owners can select/update their own garage

**listings**
- `garage_id` uuid FK → `garages.id` (ON DELETE SET NULL)
- `status` enum `listing_status` includes: `draft`, `pending`, `published`, `active`, etc.
- Premium-related columns already exist:
  - `is_premium` boolean (nullable, default false)
  - `premium_until` timestamptz
  - `premium` boolean (legacy)
- RLS enabled; insert/update constraints already enforce:
  - `created_by = uid()` and `user_id = uid()`
  - `garage_id` allowed only if `garages.owner_user_id = uid()`

**No existing dealer plan tables** in public schema today.

### 1.2 Existing “publish listing” enforcement entry point
Search confirmed the frontend uses a Supabase RPC:
- `publish_garage_listing(listing_id)` is called from:
  - `src/components/buyauto/create-listing/Step5_PreviewAndPay.tsx`
  - `src/components/dashboard/ListingsSection.tsx`

This is the safest place to keep enforcement stable. We should *not* remove it; we should either:
- keep it and drive limits via `garages.listing_limit` (synced from plan), or
- carefully update the RPC to read from new subscription tables (riskier).

**Recommendation:** keep the RPC behavior stable and sync `garages.listing_limit` from the active plan.

### 1.3 Existing UI “Plan” placeholder
`src/components/buyauto/dashboard/GarageDashboard.tsx` contains a “Plan” tab with placeholder copy (plan change not wired).
This is our natural integration point for the new **“Zahlung”** tab/section.

---

## 2) Decisions (lock these before implementation)

### D1) Canonical URL
- Canonical: **/garage-preise/**
- If we also create /preise-garagen/: implement a redirect (Next.js redirect or middleware) to canonical.

### D2) Plan change timing (Foundation, no payments yet)
Apply plan changes **immediately** upon request:
- create `dealer_plan_changes` row (status `requested` → `applied`)
- update `dealer_subscriptions` to new plan (status `active`)
This minimizes edge-cases and makes UI predictable.

(We can later switch to “effective at period end” once payments & billing cycles matter.)

### D3) Premium credit period
Use a monthly period key:
- `period_yyyymm` = `YYYY-MM` (e.g. `2026-02`)
Premium highlight duration:
- set `premium_until = now() + interval '30 days'` (aligns with existing listing premium logic patterns)

---

## 3) Frontend: /garage-preise/ page plan (Du-form, Deutsch/CH)

### 3.1 SEO
- Meta title: **“BuyAuto – Preise für Garagen”**
- Meta description: **“Pakete für Garagen: Inserate, VIN-PreFill, Leasing-Rechner und Deal-Chat pro Fahrzeug. Done-for-you Onboarding ab Growth.”**
- Canonical link: `https://www.buyauto.ch/garage-preise/`

### 3.2 Page structure (exact sections & copy baseline)

#### 1) HERO (Above the fold)
- H1: **“Preise für Garagen”**
- Headline: **“Mehr Anfragen. Weniger Aufwand.”**
- Subheadline: **“Dein Inventar online – mit VIN-PreFill, Leasing-Rechner und Deal-Chat pro Fahrzeug.”**
- Support line: **“Marketplace für Direktkauf & Leasing – mit klaren Inseraten und direktem Kontakt.”**
- Buttons:
  - Primary: **“Jetzt starten”** → Dealer signup / onboarding
  - Secondary: **“Preise ansehen”** → scroll to packages section
- Trust bullets:
  - “VIN-PreFill (wo verfügbar)”
  - “Leasing-Rechner im Inserat”
  - “Deal-Chat inkl. Dokumentenversand”

CTA routing recommendation (to confirm once we inspect auth params):
- `/auth?redirect=/dashboard/garage&role=garage` (or closest supported variant)
Fallback: `/auth?redirect=/dashboard/garage`

#### 2) IN JEDEM PAKET INKLUSIVE (icon/bullet grid)
Title: **“In jedem Paket inklusive”**
Bullets:
- “Garage-Profilseite + Inventar-Seite”
- “Inserate erstellen & verwalten”
- “VIN-PreFill (wo verfügbar)”
- “Leasing-Rechner direkt im Inserat”
- “Deal-Chat pro Fahrzeug (Chat + Dokumente)”
- “Basis-Statistiken: Views & Anfragen”
Note:
- “Wichtig: Leads können nicht garantiert werden – aber du bekommst eine saubere Präsenz + direkten Kanal für Anfragen.”

#### 3) PAKETE (Pricing cards)
4 cards, highlight Growth as “Meist gewählt”.

- Starter
  - “CHF 149 / Monat”
  - “bis zu 15 Inserate”
  - “1 Premium Inserat / Monat inklusive”
  - “Alles aus ‘Inklusive’”
  - CTA “Starter wählen”

- Growth (Meist gewählt)
  - “CHF 349 / Monat”
  - “bis zu 50 Inserate”
  - “5 Premium Inserate / Monat inklusive”
  - Includes:
    - “Alles aus Starter”
    - “Done-for-you Onboarding”
    - “Du schickst uns dein Inventar, wir erledigen den Rest.”
  - CTA “Growth wählen”

- Pro
  - “CHF 599 / Monat”
  - “bis zu 100 Inserate”
  - “10 Premium Inserate / Monat inklusive”
  - Includes:
    - “Alles aus Growth”
    - “Done-for-you Onboarding (priorisiert)”
  - CTA “Pro wählen”

- 100+
  - “Individuell”
  - “Für grosse Bestände, mehrere Standorte oder Spezialprozesse.”
  - CTA “Kontakt aufnehmen”

**No “search boost” promises.** Premium described as visual highlighting only.

#### 4) WAS IST EIN PREMIUM INSERAT?
Title: **“Was ist ein Premium Inserat?”**
Text:
- “Ein Premium Inserat ist visuell hervorgehoben (Premium-Badge + Highlight) und kann zusätzlich in separaten Premium-Bereichen erscheinen (z.B. Startseite / Premium-Sektion), ohne dass wir eine bessere Suchplatzierung versprechen.”
Bullets:
- “Premium-Badge + visuelle Hervorhebung”
- “Optional: Platzierung in Premium-Sektionen, wenn verfügbar”
- “Monatliches Premium-Kontingent je nach Paket”
Note:
- “Premium = Hervorhebung, nicht garantierte Leads.”

#### 5) DONE-FOR-YOU ONBOARDING (How it works)
Title: **“So bist du schnell live”**
3 steps:
1. “Du schickst uns dein Inventar”
2. “Wir erstellen die Inserate”
3. “Du bekommst Anfragen” (Deal-Chat pro Fahrzeug + Dokumente)

#### 6) FAQ (8–10)
Include required questions:
- Was zählt als Inserat?
- Up-/Downgrade?
- Mindestlaufzeit?
- Deal-Chat?
- Onboarding-Daten?
- Leads garantiert?
- Premium einsetzen?
- Zahlungsarten?
- Was passiert bei Kündigung?

#### 7) FINAL CTA
Headline: **“Bereit, dein Inventar live zu bringen?”**
Buttons: “Jetzt starten” + “Kontakt aufnehmen”  
Reassurance: “Monatlich kündbar. Keine Setup-Falle.”

### 3.3 Design system constraints
- Modern Swiss-clean, whitespace
- `rounded-3xl` major cards, `rounded-2xl` small components
- Heading style: `font-bold tracking-tight text-neutral-900`
- Body: `text-neutral-600`
- Avoid “demo marketplace” references

---

## 4) Backend: Dealer package system (Supabase)

### 4.1 Data model (new tables)

> We will treat **Dealer = Garage** and use `dealer_id = garages.id`.

#### Table: `dealer_plans`
- id uuid PK default gen_random_uuid()
- code text UNIQUE (`starter`, `growth`, `pro`, `custom`)
- name text
- monthly_price_chf int NULL for custom
- listing_limit int NULL for custom
- premium_included_per_month int NULL for custom
- onboarding_included bool default false
- onboarding_note text NULL
- active bool default true
- created_at timestamptz default now()
- updated_at timestamptz default now()

#### Enum: `dealer_subscription_status`
- `active`, `pending_change`, `canceled`, `past_due`

#### Table: `dealer_subscriptions`
- id uuid PK
- dealer_id uuid NOT NULL FK → garages.id (ON DELETE CASCADE)
- plan_id uuid NOT NULL FK → dealer_plans.id
- status dealer_subscription_status NOT NULL default `active`
- start_date date default current_date
- end_date date NULL
- current_period_start timestamptz default now()
- current_period_end timestamptz NULL (optional until payments)
- cancel_at_period_end bool default false
- created_at, updated_at timestamptz

Constraints/indexes:
- Ensure only one active subscription per dealer:
  - partial unique index on (dealer_id) WHERE status = 'active'

#### Enum: `dealer_plan_change_status`
- `requested`, `approved`, `rejected`, `applied`

#### Table: `dealer_plan_changes`
- id uuid PK
- dealer_id uuid FK → garages.id
- from_plan_id uuid FK → dealer_plans.id
- to_plan_id uuid FK → dealer_plans.id
- requested_at timestamptz default now()
- effective_date timestamptz default now()
- status dealer_plan_change_status default `requested`
- notes text NULL
- created_at, updated_at

#### Optional: `dealer_premium_credits`
- id uuid PK
- dealer_id uuid FK → garages.id
- period_yyyymm text (YYYY-MM)
- credits_included int NOT NULL
- credits_used int NOT NULL default 0
- created_at, updated_at
Unique:
- (dealer_id, period_yyyymm)

### 4.2 Seeds
Seed `dealer_plans` via UPSERT on `code`:
- starter: 149 CHF, limit 15, premium 1, onboarding false
- growth: 349 CHF, limit 50, premium 5, onboarding true + note
- pro: 599 CHF, limit 100, premium 10, onboarding true (prioritized) + note
- custom: null price/limits (or very high), onboarding true, active true

### 4.3 Assign default plan on dealer creation
Trigger on `garages` INSERT:
- create `dealer_subscriptions` row with plan = `starter` (unless you decide otherwise)
- sync compatibility fields on `garages`:
  - garages.plan = plan.code
  - garages.listing_limit = plan.listing_limit

### 4.4 Keep backward compatibility (critical)
Because existing code & RPCs already depend on:
- `garages.plan`
- `garages.listing_limit`

We will **maintain these fields** as a denormalized snapshot of the active plan.

Implementation:
- Trigger on `dealer_subscriptions` INSERT/UPDATE where status='active' to update `garages.plan` and `garages.listing_limit`.

### 4.5 Plan change flow (payment later)
DB function / RPC (recommended):
- `request_dealer_plan_change(to_plan_code text)`:
  1) resolve dealer_id from `garages.owner_user_id = auth.uid()`
  2) resolve current active plan_id
  3) resolve to_plan_id via code
  4) insert into `dealer_plan_changes`
  5) apply immediately: update active subscription `plan_id`
  6) mark change as `applied`
  7) return new plan summary

### 4.6 Soft enforcement

#### Listing publish limit
Safest approach now:
- keep existing `publish_garage_listing(listing_id)` RPC behavior
- ensure `garages.listing_limit` is correct for the active plan
- optionally add a second RPC `get_dealer_limits()` for UI to display limits without relying on `garages` fields

#### Premium credits
Implement atomic RPC:
- `apply_dealer_premium(listing_id uuid)`:
  - verify listing belongs to this dealer (listing.garage_id is owned by auth.uid())
  - ensure credits row exists for current month (create if missing with included credits based on active plan)
  - if credits_used >= credits_included: return error
  - else increment credits_used and set:
    - listings.is_premium = true
    - listings.premium_until = now() + interval '30 days'
  - return updated credits + listing premium state

### 4.7 RLS policies (mandatory)
- `dealer_plans`: public SELECT where `active = true` (no write)
- `dealer_subscriptions`: owners can SELECT their dealer subscription via join on garages.owner_user_id = auth.uid()
- `dealer_plan_changes`: owners can SELECT/INSERT for their dealer
- `dealer_premium_credits`: owners can SELECT for their dealer; writes only via RPC (recommended)
- Admin: full access (same pattern as existing `profiles`/`listings` admin policies)

---

## 5) UI: Garage Dashboard → “Zahlung”

### 5.1 Location
Implement inside existing **GarageDashboard** (tabs) as:
- Rename/replace “Plan” tab to **“Zahlung”**
- Keep route `/dashboard/garage` stable

### 5.2 Sections
1) **Current Plan Card**
- plan name, price (CHF/month), listing limit, premium credits/month
- show “Monatlich kündbar” note (UI copy)

2) **Plan selector**
- show Starter/Growth/Pro/100+ (Custom)
- actions:
  - “Upgrade auf Growth”
  - “Upgrade auf Pro”
  - “Kontakt aufnehmen” (Custom)

3) **Change history**
- list from `dealer_plan_changes` (requested/applied timestamps)

### 5.3 “Contact” behavior
For 100+:
- button opens `mailto:` with subject/body prefill OR links to an existing contact flow if you prefer (can be upgraded later to a form).

---

## 6) UI/UX integration points (enforcement messaging)

### 6.1 When publish is blocked due to limit
- show clear inline error:
  - “Du hast dein Inserate-Limit erreicht. Upgrade dein Paket, um mehr Inserate zu veröffentlichen.”
- CTA: “Zu Zahlung” (opens the Zahlung tab)
- Secondary CTA: “Kontakt aufnehmen” for custom

### 6.2 Premium credits empty
- “Dein Premium-Kontingent ist aufgebraucht.”
- CTA: upgrade plan or contact

---

## 7) Implementation sequence (safe rollout)

### Phase 1 — DB foundation
1) Create enums + tables + indexes
2) Seed plans (upsert)
3) Add triggers:
   - updated_at
   - default subscription on `garages` insert
   - sync garages.plan/listing_limit from active subscription
4) Backfill existing garages → create active subscription rows

### Phase 2 — Services layer (frontend)
- Add a dedicated service (e.g. `dealerSubscriptionService.ts`) to:
  - fetch active plan summary
  - list active plans
  - request plan change
  - fetch change history
  - apply premium credit (RPC)

### Phase 3 — Garage Dashboard UI
- Implement “Zahlung” UI in `GarageDashboard.tsx`
- Wire to services
- Add basic plan selector + change history

### Phase 4 — Landing page
- Create `/garage-preise` Next page (and optional redirect alias)
- Ensure copy is Du-form everywhere

### Phase 5 — Enforcement UX polish
- Ensure publish errors from RPC are handled and route to Zahlung
- Add “apply premium” action (optional initial toggle) with credits checks

---

## 8) Test checklist (must-pass before merge)

### DB/RLS
- As garage user:
  - can read own subscription + changes
  - cannot read other garage subscriptions
  - can read dealer_plans (active only)
- RPC tests:
  - request plan change works and syncs garages.plan/listing_limit
  - apply premium consumes credit atomically

### App flows
- Garage login → `/dashboard/garage` loads
- Publish listing as garage works below limit
- Publish listing blocks at limit with friendly CTA
- Zahlung shows correct current plan and history
- Landing page renders, scroll-to-packages works, CTAs route correctly

### Tooling
- Run Bug Finder (`lint` + `tsc --noEmit`) before finalize.

---

## 9) Risks & mitigations

- **Existing RPC `publish_garage_listing`** is a dependency: avoid changing signature/behavior; use synced `garages.listing_limit` to keep it stable.
- **Legacy premium fields**: both `premium` and `is_premium` exist. Standardize in new logic on `is_premium` + `premium_until` and do not break any existing admin views.
- **Auth role source**: some UI checks use `user_metadata.role`; garage role is in `profiles.role`. Ensure the Zahlung tab relies on `profiles.role`/garage ownership, not metadata.