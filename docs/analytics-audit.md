# Analytics audit — GA4 tracking rebuild (Sept 2026)

Scope: everything in this repo that sends data to GA4 (property 437300642,
stream `G-KXKPFFXV3E`) or Google Ads (`AW-18317910859`), audited against the
brief, then the decisions taken. The GA4 facts below were read from the live
property with the Admin/Data API (read-only) on 2026-09-24; the listing facts
from the production Supabase project (read-only aggregate queries).

## 1. Audit (state before this change)

### 1.1 Loader

| Item | Finding |
| --- | --- |
| Loader | Plain `gtag.js`, no GTM, no library. One script for both destinations. |
| Files | `src/pages/_document.tsx` (inline Consent Mode v2 defaults + `window.gtag` shim), `src/components/analytics/GoogleAnalytics.tsx` (`<Script id="ga-config">` with the `config` calls, route-change page views), `src/lib/analytics/gtag.ts` (IDs, consent, `pageview`, `trackEvent`, `trackAdsConversion`, lazy loader). |
| Measurement ID | Compiled default was **`G-6GJ6D58G1S`**, overridable by `NEXT_PUBLIC_GA_MEASUREMENT_ID`. That ID is not a stream in any GA4 property this account can see; the only stream of property 437300642 is `G-KXKPFFXV3E`, and every event the code sends (incl. code-only ones like `premium_purchased`, `ai_referral`) arrives in that stream. So production overrides the default (env var or a combined Google tag). |
| `send_page_view` | `true` when the visitor had already answered the cookie banner, `false` while undecided (the held view is released by the banner). |
| Loaded twice? | No. One `gtag.js`, one GA4 `config`, one Ads `config`. |
| Script timing | `gtag.js` is injected on first interaction or after 8 s (immediately on gclid/gbraid/wbraid landings). Commands queue on `dataLayer` until then. |
| Embeds | `/embed/*` never loads the tag (no consent banner there). |

### 1.2 Every call that sent data

| File (before) | Command / event | Parameters | Fired on |
| --- | --- | --- | --- |
| `_document.tsx` | `consent default` / `consent update` | storage flags | page load (server HTML) |
| `GoogleAnalytics.tsx` | `config G-…` | `anonymize_ip`, `send_page_view` | hydration |
| `GoogleAnalytics.tsx` | `config AW-18317910859` | — | hydration |
| `gtag.ts` `pageview()` | `page_view` (`send_to` GA4) | **`page_path` + `page_location`**, `page_title`, `page_referrer` | every non-shallow route change |
| `aiReferral.ts` | `ai_referral` | `ai_source`, `page_referrer` | landing from an AI host, once per session |
| `lp/leasing-abgeben.tsx:101` | `cta_click` | `cta_location`, `page` | click |
| `leasing-abgeben-schweiz.tsx:114` | `cta_click` | `cta_location`, `page` | click |
| `Step5_PreviewAndPay.tsx:591` | `listing_published` | `deal_type`, `value` (CHF paid), `currency` | Stripe redirect return, intent `succeeded` (not re-read from Supabase) |
| `Step5_PreviewAndPay.tsx:625` | `premium_purchased` | `plan`, `value`, `currency` | same, if premium (incl. client-side guesses) |
| `Step5_PreviewAndPay.tsx:841` | `listing_published` | `plan`, `premium: false`, `deal_type` | free plan: after `/api/billing/prepare` returned `continue` |
| `Step5_PreviewAndPay.tsx:1004` | `listing_published` | `seller: "garage"`, `deal_type` | garage: after `publish_garage_listing` RPC |
| `Step5_PreviewAndPay.tsx:1066` | `listing_published` | `plan`, `premium`, `deal_type`, `value` (client-computed total), `currency` | embedded Stripe success callback |
| `Step5_PreviewAndPay.tsx:1074` | `premium_purchased` | `plan`, `value`, `currency` | same, if premium chosen |
| `Step5…:596, 847, 1007, 1089`, `ListingsSection.tsx:221, 267` | **`conversion`** `send_to AW-18317910859/nB-nCPKDmeQcEMvG1J5E` ("Inserat veröffentlicht") | `transaction_id`, `value`, `currency` | publish / payment / dashboard upgrade / relist |
| `ListingWizard.tsx:774` | **`conversion`** `…/-f3wCPWDmeQcEMvG1J5E` ("Inserat gestartet") | `transaction_id` | first form input, once per session |
| `GuestAuthGate.tsx:74` | **`conversion`** `…/2cMYCM6u8tgcEMvG1J5E` ("Submit lead form") | — | guest registration resolved |
| `Step5…:630, 1079` | `conversion` with `ADS_CONVERSIONS.premiumPurchase` | — | label was `""`, so it never sent |

Untargeted `trackEvent` calls reached **both** GA4 and the Ads tag.

### 1.3 Events carrying `value`

- `listing_published`: CHF actually paid on the two paid paths (plan + boost +
  donation), none on free/garage. GA4 shows 7 events worth CHF 52 in 90 days
  (e.g. CHF 50 Verlängert + two CHF 1 donations).
- `premium_purchased`: CHF 50 (1 event).

### 1.4 Google Ads

- ID `AW-18317910859` (conversion ID; the customer ID 230-645-0500 is a
  different number by design).
- Base tag: `gtag('config', 'AW-18317910859')` — **kept unchanged**.
- Explicit conversion calls: the three labels above, 7 call sites — **all
  removed** (see §3).

### 1.5 /suche double counting — root cause (from the live data)

`suche.tsx` applies **no** default `dealType` (no redirect, no
`router.replace`); the bare `/suche` is its own hub view. The brief's
assumption does not match the code. The real causes, visible in
`pagePathPlusQueryString` for the last 90 days:

| URL as reported | Views | Source |
| --- | ---: | --- |
| `/suche?dealType=lease_takeover` | 263 | enhanced measurement (history change) |
| `/suche?dealType=lease_takeover?dealType=lease_takeover` | 260 | the code's manual `page_view` |
| `/suche?page=1`, `/suche?page=1&brand=…` | 46, 15, … | filter changes (`page=1` added by a shallow push) counted by enhanced measurement |

1. **Every client-side navigation was counted twice** (site-wide, /suche is
   just the most-linked target): once by enhanced measurement ("Page changes
   based on browser history events" is **ON** in the stream — verified via the
   Admin API) and once by the code.
2. The code's hit sent `page_path` (with query) **and** `page_location`, which
   GA4 glued into a doubled query string.
3. Shallow filter/pagination updates were counted by enhanced measurement.

### 1.6 Premium payment confirmation

| Flow | Confirmation | Unique payment ID in the browser |
| --- | --- | --- |
| Wizard, embedded Stripe Element | `stripe.confirmPayment` returns the PaymentIntent (`status === "succeeded"`), then `/api/billing/verify-payment` + webhook write `payment_status='paid'`, `premium=true` | PaymentIntent id `pi_…` (from the intent / client secret); also stored in `listings.stripe_payment_intent_id` |
| Wizard, TWINT/3DS redirect | return to `?payment_confirmed=true&payment_intent_client_secret=…`, `stripe.retrievePaymentIntent` → `succeeded`, then verify-payment | same `pi_…` |
| Dashboard Premium boost | Stripe Checkout → `?premium_upgrade=success&listingId=…&session_id=cs_…`; `/api/billing/premium-upgrade/verify` returns 200 only when Stripe says `paid` | Checkout Session id `cs_…` |
| Dashboard relist | same pattern, `/api/billing/relist/verify` | `cs_…` |
| Dealer subscriptions | `?payment_success=true` only, **no session id** | none client-side |

### 1.7 Listing status lifecycle (decides `listing_published`)

- Private listings: free/paid checkout sets `payment_status='paid'`,
  `status='pending'`. Only an admin (`/api/admin/listings/update-status` /
  `adminService.approveListing`) sets `published` — later, in the admin's
  browser.
- Garage listings: the `publish_garage_listing` RPC (plus the
  `trg_auto_publish_garage_listings` trigger) publishes immediately.
- Last 120 days (Supabase): 23 private listings submitted and paid, 22 are
  `published`/`sold`, 1 `inactive`, **0 rejected**; average time from
  creation to `published_at` **1.3 h**.
- Paid listing mix (120 days): 15 free, 2 free + premium credit, 3 × CHF 1
  donation-only, 2 × Verlängert CHF 50, 1 × CHF 30.

### 1.8 Other findings

- `listing_inquiries`: **nothing writes to it any more** — the inquiry form was
  removed (see migration `20260729150000_retire_listing_inquiry_email_trigger`).
  Buyers now contact sellers through the listing chat (`MessagingPanel` →
  `create_or_get_conversation_for_listing` RPC).
- `dealer_leads`: **the table does not exist** (no migration, no code). The
  dealer onboarding path is a garage registration (`AuthForm`, account type
  `garage`) plus `mailto:` links on /fuer-garagen.
- Contact links: listing pages have **no** `tel:`/WhatsApp/`mailto:` links;
  dealer microsites (`/[dealerSlug]`) have `tel:` and `mailto:`.
- Admin: `profiles.role === 'admin'`, enforced for `/admin` in
  `src/middleware.ts` and exposed client-side as `useAuth().isAdmin`.
- Test routes: `/tg-test` (1 view in GA4) was deleted in #58; no other test
  pages exist.
- Other traffic in the data: `tagassistant.google.com` (7 sessions),
  `vercel.com` (7 sessions / 70 views — the owner opening production from the
  Vercel dashboard; hostname is always `www.buyauto.ch`, so preview
  deployments did not send data), `checkout.stripe.com` (2 sessions — Stripe
  returns stealing attribution).
- `page_location` carried the raw URL: Stripe `payment_intent_client_secret`
  on the redirect return and Supabase auth `code` on /auth.
- GA4 custom dimensions registered: `user_role` (user), `plan`, `deal_type`,
  `lead_type`, `listing_id`, `funnel_step`. **Not yet registered:**
  `step_name`, `contact_method`.
- Key events: `purchase`, `listing_published`.

### 1.9 Consent (cookie banner)

`CookieConsent.tsx` + Consent Mode v2 **advanced**:

- Before any choice: `ad_storage`, `ad_user_data`, `ad_personalization`,
  `analytics_storage` = `denied` (inline in the server HTML, before the tag).
- **Einverstanden** → all four `granted`, stored as `buyauto_consent_v2=granted`.
- **Ablehnen** → stays `denied`, stored, banner never returns.
- The tag **still loads for everyone** and sends **cookieless pings** while
  denied (no cookies, no client ID). GA4 uses them only for modelling; Google
  Ads for conversion modelling. So declining stops cookies and identifiers — it
  does not stop all requests to Google.
- The landing page view is held until the visitor answers and released once
  (cookied on accept, cookieless on decline).

## 2. Decisions

| # | Finding vs. brief | Decision | Why |
| --- | --- | --- | --- |
| D1 | Measurement ID default `G-6GJ6D58G1S` ≠ stream `G-KXKPFFXV3E` | Default is now `G-KXKPFFXV3E`; the env override stays. | The API shows 437300642 has exactly one stream, `G-KXKPFFXV3E`, and the production data lands there. A missing/odd env var can no longer send data elsewhere. |
| D2 | Pages Router, not App Router | `AnalyticsProvider` mounted in `_app.tsx`; page views keyed on `router.asPath` + Next's `shallow` flag. No `useSearchParams`, so no Suspense boundary is needed. | "Root layout" = `_app` here. `useSearchParams` + Suspense is an App Router requirement. |
| D3 | Brief: page_view on every `[pathname, searchParams]` change | One page_view on landing and on every **non-shallow** navigation; shallow URL updates are not page views (they update `page_location` for later events). | /suche filters and pagination are shallow updates of the same page; counting them is exactly what inflated /suche. Filter usage is measured by `search`. Verified E2E: `/suche?dealType=lease_takeover` → 1 page_view; filter reset → still 1. |
| D4 | /suche has no default filter | Nothing to change in `suche.tsx` for page views. Fixes: never send `page_path`; stop counting shallow updates; enhanced measurement page changes must be switched off (§4 of the report). | Root cause is in §1.5. |
| D5 | Private listings only become `published` after admin review, hours later, in the admin's browser (excluded) | `listing_published` fires at **server-confirmed submission**: after the listing row is read back from Supabase with `payment_status='paid'` and `status` `pending`/`published` (paid: and `stripe_payment_intent_id` = this payment). Garage: when the RPC's returned row says `published`. Once per `listing_id` (`ba_pub_<id>`). | There is no in-session "published" moment for private sellers without a server change (storing the GA client ID and sending via Measurement Protocol at approval → schema + server logic, out of bounds). Evidence: 22/23 submissions went live, avg 1.3 h, 0 rejections. Firing on dashboard revisit instead would lose sellers who never return and double-fire across devices. Flagged under "Needs Vince's decision". |
| D6 | `purchase` scope | `purchase` = a confirmed Premium product sale: a paid plan (Verlängert/Unlimitiert include Premium), the Premium Boost, a paid plan upgrade, the dashboard Premium boost, and a paid relist. Donation-only payments (CHF 1–200) send **no** `purchase`. Dealer subscriptions: not included. | Revenue belongs on `purchase` only, but a CHF 1 donation is not a sale and would add a primary Ads conversion. Dealer subscriptions have no client-side payment ID and would change what Ads optimises for (B2B) — flagged. |
| D7 | Payment ID | `transaction_id` = Stripe PaymentIntent `pi_…` (wizard) or Checkout Session `cs_…` (dashboard). Dedupe `ba_purchase_<id>`. | Real provider IDs are readable in the browser in every Premium flow. |
| D8 | Payment confirmation | Wizard: Stripe reports `succeeded` **and** the listing row, read back by `stripe_payment_intent_id`, shows `payment_status='paid'` **and** `premium=true` (retried for ~8 s while the webhook lands). Dashboard: verify endpoint returned 200 (Stripe `paid`) **and** the row shows `premium=true` (boost) or `status='published'` (relist). Never on a URL parameter alone. | Brief rule; also guards against crafted return URLs (RLS limits the read-back to the caller's own listing). |
| D9 | `premium_purchased`, `ai_referral` | Removed. `aiReferral.ts` deleted. | GA4's built-in AI channel covers AI referrals; `purchase` replaces `premium_purchased`. |
| D10 | Ads conversion calls exist | All removed (3 labels, 7 call sites, plus the never-sending premium label). Base `config AW-…` kept byte-identical in content (now issued from `initAnalytics`, skipped only for internal traffic). | Brief. Google Ads now counts only the GA4 imports. |
| D11 | Events reached the Ads tag too | Every event is sent with `send_to: G-KXKPFFXV3E`. | Otherwise Ads could see the same event directly and via the GA4 import. |
| D12 | Admin exclusion | Role-based (`profiles.role === 'admin'`) **and** route-based (`/admin`), plus `ba_no_track`. Tracking initialises only after auth + profile resolved, so an admin never queues a hit; `login` is sent after the role is known. | Admin role exists and can be reused. |
| D13 | `NEXT_PUBLIC_VERCEL_ENV` is used nowhere today | Disabled when it is set and not `production`, **and** whenever the hostname is not `www.buyauto.ch`/`buyauto.ch`. | If the variable is not exposed to the build, the brief's check alone would switch production tracking off overnight. The hostname rule also covers previews and localhost. |
| D14 | Vercel-dashboard / Tag Assistant traffic | Landing from `vercel.com` disables tracking for that browser session. Tag Assistant sessions (and `?ga_debug=1`) get `debug_mode: true`. | Real visitors never arrive from vercel.com. Debug-mode traffic is removed from reports by GA4's Developer-traffic filter while DebugView keeps working. |
| D15 | `listing_inquiries` is dead | `lead_type: 'inquiry'` stays in the type (registered dimension value) but has no trigger. The live contact path is tracked as `lead_type: 'conversation'`. | Nothing inserts inquiries any more. |
| D16 | `dealer_leads` does not exist | `generate_lead { lead_type: 'dealer_partner' }` fires when a **garage account registration** succeeds. | That is the only dealer-partner lead the product has. |
| D17 | No contact links on listing pages | `contact_click` via one delegated listener on listing pages **and** dealer microsites; `listing_id` optional (absent on dealer pages). The href is never sent. | Measures the contact links that exist and any added later. |
| D18 | PII | URLs sanitised (payment/auth secrets, e-mail, phone-like values dropped; free-text search params redacted when they look personal); `page_title` replaced when it looks personal (seller title suffix); brand/model/search_term pass the same guard; `user_id` only with analytics consent. | Brief constraint; the raw URLs and titles were the leak paths. |
| D19 | Stripe returns start a new session (`checkout.stripe.com`) | On landing from `*.stripe.com`, `page_referrer` is set to our own origin. | Keeps the purchase attributed to the ad/organic visit that brought the seller. Add Stripe to "unwanted referrals" in GA4 as well. |
| D20 | Consent | Behaviour kept exactly (advanced Consent Mode, held landing view). | Brief: respect current behaviour. What it does is described in §1.9. |

No blocker from the brief's list applies: no schema/RLS or server change was
needed, and GA4 is not injected from outside the repo.
