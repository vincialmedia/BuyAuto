# GA4 event catalogue

All events go through `track()` / `trackOnce()` in `src/lib/analytics.ts`, are
type-checked against `EventMap`, and are sent to GA4 only
(`send_to: G-KXKPFFXV3E`). Google Ads receives `listing_published` and
`purchase` through the GA4 import (both primary conversions).

Nothing is sent — and `gtag.js` is not loaded — for: hosts other than
`www.buyauto.ch`/`buyauto.ch`, non-production Vercel builds, `/admin*`,
`/embed*`, `/…test` routes, signed-in admins, browsers with
`localStorage.ba_no_track = "1"`, and sessions that arrived from vercel.com.

Registered custom dimensions (must match exactly): `deal_type`, `listing_id`,
`lead_type`, `funnel_step`, `plan`, `step_name`, `contact_method` (event) and
`user_role` (user). `step_name` and `contact_method` still need registering in
GA4.

| Event | Parameters | Fired from | Trigger (confirmed state) |
| --- | --- | --- | --- |
| `page_view` | `page_location` (sanitised, absolute), `page_title`, `page_referrer` (landing only) | `components/analytics/AnalyticsProvider.tsx` → `trackPageView` | Landing page (after auth resolved; held until the cookie banner is answered on a first visit) and every non-shallow navigation. Shallow URL updates are not page views. |
| `sign_up` | `method: "email"` (+ user property `user_role`) | `auth/AuthForm.tsx`, `create-listing/GuestAuthGate.tsx` | `authService.signUp` resolved (account created; duplicates throw). |
| `login` | `method: "email"` | queued in `AuthForm.tsx` / `GuestAuthGate.tsx`, sent by `AnalyticsProvider` | `signInWithPassword` resolved **and** the profile loaded (never for admins). |
| `listing_start` | `deal_type`, `entry_page` (session landing path) | `create-listing/ListingWizard.tsx` | First input/change in the create form, once per browser session, not in edit mode. |
| `listing_step` | `funnel_step` (2–5), `step_name` (`offer`, `plan`, `photos`, `preview_payment`), `deal_type` | `create-listing/ListingWizard.tsx` | Each step reached by moving forward, once per wizard visit; not in edit mode or on the Stripe-return jump. |
| `listing_published` | `listing_id`, `deal_type`, `brand`, `model`, `plan: "free" \| "premium"`, `value: 0`, `currency: "CHF"` | `create-listing/Step5_PreviewAndPay.tsx` | Row read back from Supabase: private → `payment_status='paid'` and `status` `pending`/`published` (paid: the row's `stripe_payment_intent_id` is this payment); garage → RPC row `status='published'`. Once per `listing_id` (`ba_pub_<id>`). Not for paid plan changes of an existing listing. `value` is always 0 (type-enforced). |
| `purchase` | `transaction_id` (`pi_…` or `cs_…`), `value` (CHF charged), `currency: "CHF"`, `items[]` (`item_name`: `Premium Inserat` / `Inserat Reaktivierung` / `Unterstützung`, `item_id` = listing id, `item_variant`, `price`, `quantity: 1`) | `Step5_PreviewAndPay.tsx` (plan, boost, plan upgrade), `dashboard/ListingsSection.tsx` (dashboard boost, relist) | Stripe says succeeded/paid **and** the listing row confirms it (`paid` + `premium=true`, or `published` for a relist). Only when a Premium product (or relist) was bought — donation-only payments send none. Once per transaction (`ba_purchase_<id>`). |
| `view_item` | `listing_id`, `deal_type`, `brand`, `model`, `price` (monthly rate for Leasingübernahmen, sale price otherwise), `currency: "CHF"` | `pages/fahrzeug/[id].tsx` | Listing shown (per listing id); not the owner's `?preview=true`. |
| `search` | `search_term` (only when a free-text term exists and does not look personal), `deal_type` (when filtered), `results_count`, `page` | `pages/suche.tsx` | Results for a query string arrived (SSR or client fetch), once per distinct query string. |
| `generate_lead` | `lead_type`, `listing_id?`, `deal_type?`, `value: 0`, `currency: "CHF"` | see below | see below |
| ↳ `conversation` | `listing_id` | `detail/MessagingPanel.tsx` | First message of a new conversation sent successfully; once per listing per browser. |
| ↳ `dealer_partner` | — | `auth/AuthForm.tsx` | A garage account registration succeeded. |
| ↳ `valuation` | — | `calculator/EintauschwertRechner.tsx` | A calculated Eintauschwert result rendered; once per vehicle (recalculations don't count). |
| ↳ `inquiry` | — | — | No trigger: nothing writes `listing_inquiries` any more. |
| `contact_click` | `contact_method: "phone" \| "whatsapp" \| "email"`, `listing_id` (listing pages only) | `AnalyticsProvider.tsx` (delegated listener) | Click on a `tel:`, `mailto:` or WhatsApp link on `/fahrzeug/[id]` or a dealer microsite. The link target is never sent. |
| `cta_click` | `cta_id`, `page_path` | `pages/lp/leasing-abgeben.tsx`, `pages/leasing-abgeben-schweiz.tsx` | CTA click (navigation intent; not a conversion). |

User scope: `user_id` = Supabase user UUID (only with analytics consent),
user property `user_role` = `private` / `dealer` / `admin`.

Debugging: `?ga_debug=1` on any production URL turns on `debug_mode` for that
browser session (`?ga_debug=0` turns it off); Tag Assistant sessions get it
automatically. `NEXT_PUBLIC_GA_DEBUG=1` does the same for a whole build —
never leave it set in production.
