# Google Analytics 4 + Google Ads — Setup

Rebuilt in Sept 2026. The audit and every decision behind this setup are in
`docs/analytics-audit.md`; the event catalogue is `docs/analytics-events.md`.

## Files

| File | Role |
| --- | --- |
| `src/pages/_document.tsx` | Consent Mode v2 defaults (`denied`), inline in the server HTML so they run before the tag. Re-grants immediately for returning visitors who already accepted. Also installs the `window.gtag` queue shim. |
| `src/lib/analytics.ts` | The only analytics module: IDs, consent read/write, internal-traffic guard, loader, page views, `setUser`, typed `track()`. |
| `src/components/analytics/AnalyticsProvider.tsx` | Mounted in `_app`. Initialises GA once auth has resolved, sends one page view per page, keeps `user_id`/`user_role` in sync, measures contact clicks. |
| `src/components/buyauto/CookieConsent.tsx` | Banner: **Ablehnen** / **Einverstanden**. |

## IDs

- GA4: property 437300642, stream `G-KXKPFFXV3E` (compiled default).
  `NEXT_PUBLIC_GA_MEASUREMENT_ID` overrides it at build time — if it is set in
  Vercel it must be `G-KXKPFFXV3E` (or `""` to switch GA off).
- Google Ads: `AW-18317910859` (compiled default, `NEXT_PUBLIC_GADS_ID`
  overrides). Only the base tag (`gtag('config', 'AW-…')`) runs on the site —
  gclid capture and remarketing. **Conversions come exclusively from the GA4
  import** of the key events `listing_published` and `purchase`. The old
  tag-based conversion calls ("Inserat gestartet", "Inserat veröffentlicht",
  "Submit lead form") were removed from the code.

## When nothing is sent

Tracking only runs on `www.buyauto.ch` / `buyauto.ch`. It is off — and
`gtag.js` is never requested — on previews and localhost, on `/admin*`,
`/embed*` and `/…test` routes, for signed-in admins, for sessions that came
from the Vercel dashboard, and in any browser where
`localStorage.setItem('ba_no_track', '1')` was run (undo with
`localStorage.removeItem('ba_no_track')`).

## Loading and performance

`gtag.js` (~115 KB) is injected on the first scroll/tap/key press or after
8 s, never during page load; on Google Ads click landings (gclid/gbraid/wbraid)
it loads immediately so the click ID is captured. Commands issued earlier wait
on `dataLayer` and are replayed in order.

## Consent behaviour

- Until the visitor chooses, Consent Mode is `denied`: GA4 and Google Ads send
  cookieless pings only (no cookies, no client ID) — used by Google for
  modelling. The landing page view is held until the choice.
- **Einverstanden** → `analytics_storage`, `ad_storage`, `ad_user_data`,
  `ad_personalization` granted; full measurement, and `user_id` (the
  pseudonymous Supabase UUID) is attached for signed-in users.
- **Ablehnen** → stays denied permanently; cookieless pings continue, no
  `user_id`. The banner does not reappear.
- The choice lives in `localStorage` under `buyauto_consent_v2`. The footer
  link reopens the banner.

## Verifying

1. Open `https://www.buyauto.ch/?ga_debug=1` in a clean browser (no ad blocker).
2. Accept the banner, scroll once.
3. GA4 → Admin → **DebugView** shows the device within ~30 s.
4. DevTools → Network → filter `collect`: requests to
   `google-analytics.com/g/collect` with `tid=G-KXKPFFXV3E`. Before consent they
   carry `gcs=G100`, after consent `gcs=G111`.

uBlock Origin, Brave, Firefox strict mode and most VPN filters block
`googletagmanager.com`. Test in a clean browser before concluding the tag is
broken.
