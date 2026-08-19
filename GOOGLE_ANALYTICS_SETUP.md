# Google Analytics 4 + Google Ads — Setup

## Why analytics were missing

Google Analytics was never wired into this codebase. `PRODUCTION_READINESS_PLAN.md`
listed it as "Status: Missing" with a final step of *"User provides GA4 ID -> Add
Analytics script"*, and that step was never completed — there is no `gtag`,
`googletagmanager`, or measurement ID anywhere in the repo's git history. The only
analytics that ever shipped from this repo is `@vercel/analytics`.

`datenschutz.tsx` already promised Google Analytics ("Wir nutzen oder planen die
Nutzung von Google Analytics"), which is why the site looked like it should have
been reporting.

If a GA property did receive data at some point, the tag was injected outside this
repo (e.g. the Softgen builder preview host or a tag added to an older deployment)
and stopped the moment the site began deploying from this repository.

## What is now in place

| File | Role |
| --- | --- |
| `src/pages/_document.tsx` | Consent Mode v2 defaults (`denied`), inline in the server HTML so they run before the tag loads. Re-grants immediately for returning visitors who already accepted. |
| `src/lib/analytics/gtag.ts` | Measurement ID, Google Ads ID, consent read/write, `pageview()`, `trackEvent()`, `trackAdsConversion()`. Each product no-ops when its ID is unset. |
| `src/components/analytics/GoogleAnalytics.tsx` | Loads `gtag.js` once, configures the GA4 property and the Google Ads tag on it, sends a page view on every client-side route change. |
| `src/components/buyauto/CookieConsent.tsx` | Banner now has **Ablehnen** and **Einverstanden**; both write a Consent Mode update covering analytics *and* advertising storage. |
| `src/pages/datenschutz.tsx` | Privacy policy matches actual behaviour, incl. opt-out path. |

## Required step: set the measurement ID

The tag only renders when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is present at **build**
time (Next.js inlines `NEXT_PUBLIC_*` into the client bundle — setting it at
runtime has no effect).

1. In [Google Analytics](https://analytics.google.com/) → **Admin** → **Data streams**,
   open (or create) the web stream for `https://www.buyauto.ch` and copy the
   **Measurement ID** — format `G-XXXXXXXXXX`.
2. In Vercel → project → **Settings** → **Environment Variables**, add:

   | Key | Value | Environments |
   | --- | --- | --- |
   | `NEXT_PUBLIC_GA_MEASUREMENT_ID` | `G-XXXXXXXXXX` | Production (and Preview, if you want preview traffic) |

3. **Redeploy.** Existing deployments were built without the variable and will not
   pick it up.
4. For local development, add the same line to `.env.local`.

## Verifying

1. Open `https://www.buyauto.ch` in a private window with no ad blocker.
2. Click **Einverstanden** in the cookie banner.
3. GA → **Reports** → **Realtime** should show the visit within ~30 seconds.
4. In DevTools → Network, filter for `collect` — you should see requests to
   `google-analytics.com/g/collect`. Before consent these carry `gcs=G100`
   (cookieless); after consent, `gcs=G111`.
5. Navigate between pages — each navigation should produce its own `page_view`.

Note: uBlock Origin, Brave, Firefox strict mode and most VPN-level filters block
`googletagmanager.com` outright. Test in a clean browser before concluding the
tag is broken.

## Google Ads

The Google Ads tag (`AW-18317910859`) rides on the same `gtag.js` as GA4 — one
script, one `config` call per destination, which is how Google's own
multi-product snippet works.

Unlike the measurement ID it is **not** required as an env var: the ID is
compiled in as the default, because the campaigns depend on it being live and a
missing variable on a deployment must not silently switch conversion tracking
off. `NEXT_PUBLIC_GADS_ID` overrides it (format `AW-XXXXXXXXX`; set it to an
empty string to disable the tag, e.g. on a fork or a staging deployment). The
legacy name `NEXT_PUBLIC_GOOGLE_ADS_ID` is still honoured when the canonical
one is unset. Base tag and every conversion `send_to` resolve from the same
value, so they cannot diverge.

Differences from the GA4 config, both deliberate:

- The Ads tag **is not** held back until the banner is answered. That first hit
  is what captures the `gclid` of an ad click; holding it would lose the
  click-to-conversion link for anyone who leaves before deciding. Consent Mode
  keeps it cookieless until `ad_storage` is granted.
- Client-side navigations are reported to GA4 only (`send_to`), so the Ads tag
  counts the landing hit and nothing else — same as the stock snippet.

### Conversion actions

A conversion action reads as **"not detected"** in Google Ads until something on
the site actually fires it — the base tag alone is never enough, which is the
usual reason the troubleshooter comes back red on a freshly installed tag.

Labels live in `ADS_CONVERSIONS` in `src/lib/analytics/gtag.ts` — or, for the
listing-funnel conversions, in env vars read by `src/lib/gads.ts`. Either way a
label is the part after the slash in the `AW-XXXXXXXXX/LabelHere` string shown
under the conversion's *Tag einrichten* in Google Ads.

| Conversion action | Label source | Fires on | Where |
| --- | --- | --- | --- |
| Submit lead form | `ADS_CONVERSIONS.submitLeadForm` | A guest seller creates an account to publish their listing (registration only — signing in with an existing account does not count) | `src/components/buyauto/create-listing/GuestAuthGate.tsx` |
| Listing creation started | `NEXT_PUBLIC_GADS_LABEL_START` | First meaningful interaction with the creation form on `/inserat-erstellen` (first input/change in any field; once per browser session, not in edit mode) | `src/components/buyauto/create-listing/ListingWizard.tsx` |
| Listing published / paid upgrade | `NEXT_PUBLIC_GADS_LABEL_PUBLISH` | Every successful publish (free, paid — embedded or TWINT/3DS redirect — and garage), plus payment success for a listing upgrade (premium boost, relist, paid plan change). `value` carries the CHF actually paid when there was a payment; value-less otherwise. Deduped per payment via `transaction_id` + a session guard, so a publish and its payment confirmation count once. | `Step5_PreviewAndPay.tsx`, `dashboard/ListingsSection.tsx` |

The env-label conversions no-op while their env var is unset, so the call sites
ship safely before the conversion actions exist in Google Ads. All three
`NEXT_PUBLIC_GADS_*` vars are build-time-inlined — set them in Vercel and
redeploy (see `.env.local` for the placeholder block).

To add another, put its label in `ADS_CONVERSIONS` and call it from the success
path:

```ts
import { ADS_CONVERSIONS, trackAdsConversion } from "@/lib/analytics/gtag";

trackAdsConversion(ADS_CONVERSIONS.submitLeadForm, { value: 49, currency: "CHF" });
```

Other candidates, deliberately **not** wired up: the first message to a seller on
a listing (`MessagingPanel`), garage registration (`AuthForm`), and the footer
newsletter signup. Newsletter in particular is high-volume and cheap to obtain,
so counting it as a lead pulls Smart Bidding away from real inquiries.

### Verifying the Ads tag

1. Load the site in a clean browser and check DevTools → Network for
   `googletagmanager.com/gtag/js?id=AW-18317910859`.
2. In the Console, `dataLayer` should contain `["config","AW-18317910859"]`.
3. Google Ads → **Tools** → **Conversions** → **Google tag** → *Check your
   website* confirms the tag is detected on `www.buyauto.ch`.

## Consent behaviour

- Nothing is stored until the visitor chooses. Consent Mode defaults to `denied`,
  so GA and Google Ads send cookieless pings only — aggregate counts, no
  identifiers, no ad cookies.
- **Einverstanden** → `analytics_storage` *and* `ad_storage` /`ad_user_data` /
  `ad_personalization` granted: full GA4 measurement plus Ads conversion
  tracking and remarketing.
- **Ablehnen** → stays denied, permanently, and the banner does not reappear.
- The choice is stored under `buyauto_consent_v2` in `localStorage`. The old
  `buyauto_cookie_consent` key is deliberately not reused: that banner had no
  reject option and gated nothing, so it is not valid consent for analytics
  cookies. Existing visitors are asked once more.
- To revoke: clear site data. The banner returns on the next visit.

## Tracking custom events

```ts
import { trackEvent } from "@/lib/analytics/gtag";

trackEvent("listing_published", { listing_id: id, package: "premium" });
```

Events respect consent automatically and are dropped when neither ID is set. An
untargeted `trackEvent` reaches every configured destination, so naming one after
a Google Ads conversion action picks it up there as well as in GA4.
