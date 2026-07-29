# Google Analytics 4 — Setup

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
| `src/lib/analytics/gtag.ts` | Measurement ID, consent read/write, `pageview()`, `trackEvent()`. No-ops entirely when the env var is unset. |
| `src/components/analytics/GoogleAnalytics.tsx` | Loads `gtag.js`, configures the property, sends a page view on every client-side route change. |
| `src/components/buyauto/CookieConsent.tsx` | Banner now has **Ablehnen** and **Einverstanden**; both write a Consent Mode update. |
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

## Consent behaviour

- Nothing is stored until the visitor chooses. Consent Mode defaults to `denied`,
  so GA sends cookieless pings only — aggregate counts, no identifiers.
- **Einverstanden** → `analytics_storage: granted`, full GA4 measurement.
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

Events respect consent automatically and are dropped when no measurement ID is set.
