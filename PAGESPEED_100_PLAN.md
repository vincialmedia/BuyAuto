# PageSpeed 100 Plan — Mobile & Desktop

Analysis of what keeps www.buyauto.ch below 100 on PageSpeed Insights and the
prioritized path to fix it. Grounded in a Lighthouse 13 run against a local
production build of this repo (commit `fe76aa1`) plus a source-map byte
attribution of every chunk. Local absolute numbers are pessimistic (slower
container CPU, cold image-optimizer cache, no Vercel CDN) — the *attribution*
is what transfers to production.

## Baseline (local prod build, Lighthouse 13, PSI settings)

| | Mobile | Desktop |
|---|---|---|
| Performance | **54** | **93** |
| LCP | 4.8 s (score 0.31) | 1.2 s (0.90) |
| TBT | 1,410 ms (0.16) | 160 ms (0.87) |
| CLS | **0 (perfect)** | 0 |
| FCP | 1.6 s (0.94) | 0.4 s |
| Accessibility | 90 | 90 |
| Best Practices | 96 (local-only console errors) | — |
| SEO | **100** | 100 |

Important caveat: these runs **blocked gtag.js** (unreachable from the test
container). Production loads it on every page — the real PSI score carries that
extra weight on top of everything below.

## The two headline findings

### 1. The hero image is NOT the problem — hydration is

The LCP element is the hero `<img>` (Porsche). Its delivery pipeline is already
optimal: `<link rel=preload>` with `imagesrcset`, `fetchpriority=high`, AVIF,
43 KB at w=750/q75 on mobile. Lighthouse's LCP phase breakdown:

| Phase | Duration |
|---|---|
| TTFB | 44 ms |
| Resource load delay | 51 ms |
| Resource load duration | 878 ms (cold local optimizer; CDN-cached in prod) |
| **Element render delay** | **1,292 ms** |

The image is *downloaded and waiting* — it can't paint because the main thread
is busy executing/hydrating JavaScript. **Fixing TBT fixes LCP.** Image-side
tweaks (quality 75→60) are worth ~10–35 KB but are second-order.

### 2. First Load JS is 235 KB gz, and 60% of `_app` is unused on first paint

Build output: shared First Load JS **223 KB gz** (framework 44.8 + main 34.1 +
`_app` **119.5** + css 22.1) + ~12.5 KB homepage chunk. Lighthouse: **70 KB of
the 117 KB `_app` transfer is unused** on the homepage; script eval 1,448 ms,
style/layout 989 ms on throttled mobile.

Source-map attribution of `_app` (390 KB raw → 119.5 KB gz):

| Bytes (raw) | % | What | Why it's in every page |
|---|---|---|---|
| ~154 KB | 39% | `@supabase/*` (auth-js 58, realtime-js 29, **`buffer` polyfill 24**, storage-js 13, postgrest-js 12, auth-helpers 12, supabase-js 6) | `AuthContext` statically imports the client in `_app`. realtime-js (websockets) + its `buffer` polyfill load for every anonymous visitor and are never used outside messaging |
| ~42 KB | 11% | **Two toast systems**: sonner 32 + @radix-ui/react-toast 10 | Both `<Toaster/>`s mounted in `_app` |
| ~55 KB | 14% | Header dropdowns: @radix-ui/react-menu 12 + dropdown-menu 4 + floating-ui 21 + roving-focus/focus-scope/dismissable-layer/popper ~13 + react-remove-scroll 5 | Two `DropdownMenu`s in `Header` |
| 19 KB | 5% | tailwind-merge | `cn()` in ui kit — keep |
| 7 KB | 2% | styled-jsx runtime | one `<style jsx global>` in `_app` for the font variable |

## Roadmap (ordered by points-per-effort)

### Phase 1 — Take gtag.js off the critical path (mobile +4–8, desktop +1–2)

`GOOGLE_ADS_ID` defaults to a live ID in `src/lib/analytics/gtag.ts`, so
gtag.js loads `afterInteractive` on **every** page for **every** visitor
(~115 KB + 100–300 ms main-thread on mobile).

- Load gtag.js lazily: on first interaction (`pointerdown`/`scroll`/`keydown`,
  with a ~4 s idle fallback) instead of `afterInteractive`.
- Exception to preserve ad attribution: when the landing URL carries
  `gclid`/`gbraid`/`wbraid`, load immediately — that's the hit that captures
  the click ID. Organic/direct visitors (what PSI simulates) never pay the tag
  before interaction.
- Consent Mode inline defaults in `_document` stay exactly as they are (they
  must run before the tag, and they will).

### Phase 2 — Shrink critical `_app` JS from ~120 KB gz to ~55–65 KB gz (mobile +8–15)

1. **Lazy-load the Supabase client.** In `AuthContext`, `await import()` the
   client inside the mount effect instead of a top-level import (services used
   by it move behind the same dynamic boundary). Hydration then completes
   without ~45 KB gz of Supabase code; auth state resolves a beat later —
   the header already renders a skeleton for `loading === true`.
   - Longer-term: migrate `createPagesBrowserClient` (deprecated
     `auth-helpers`) → `@supabase/ssr` `createBrowserClient`, which is already
     in `package.json`.
2. **One toast system, lazily mounted.** Consolidate the 11 files using
   `@/hooks/use-toast` onto sonner (or vice-versa), delete the other
   `<Toaster/>`, and mount the survivor with `next/dynamic({ ssr: false })`
   so it hydrates after LCP. (−~12 KB gz + less hydration work)
3. **Replace the two header `DropdownMenu`s** with a light custom disclosure
   (button + absolutely-positioned panel, aria-expanded, outside-click/Escape
   handling — no positioning engine needed for a fixed header). Removes
   Radix menu + floating-ui + roving-focus + remove-scroll from every page
   (−~15 KB gz). Radix stays for the rest of the app.
4. **Drop styled-jsx**: the one `<style jsx global>` in `_app` (font family on
   `html`) can be a plain `<style>` tag or a class on `<Html>` in
   `_document`. (−~2.5 KB gz + runtime)

### Phase 3 — Hydrate only the above-the-fold homepage (mobile +5–10)

The homepage SSR HTML is ~118 KB; React re-renders all of it during hydration
(script eval 1,448 ms + style/layout 989 ms on throttled mobile). Above the
fold only Header + hero + SearchBarV2 need early interactivity.

1. **Defer below-fold hydration.** Wrap `PremiumListings`,
   `WhyBuyAutoSection`, `BuyerGarageSection`, `FounderStory` (FAQ and
   `SeoCopyBlock` are already `dynamic()`) in a lazy-hydration wrapper:
   server-rendered HTML stays (SEO/paint unchanged), React attaches on
   IntersectionObserver visibility. This chunks hydration into small tasks —
   directly cutting TBT and LCP render delay.
2. **Split SearchBarV2** (696 lines): the collapsed bar hydrates eagerly; the
   expanded filter panel (sliders, switches, brand/model pickers +
   `listingsService` calls) becomes a `dynamic()` import triggered on first
   expand.
3. Audit decorative `blur-3xl`/gradient layers on mobile — several large
   blurred elements are style/layout/paint cost with little visual payoff at
   412 px wide; gate the heaviest behind `md:`.

### Phase 4 — LCP polish (mobile +2–4, desktop +1–2)

- Hero `quality={75}` → `{60}` (AVIF at q60 is visually fine for a photo under
  a dark gradient): mobile 43 KB → ~30 KB, desktop 97 KB → ~65 KB.
- The source PNG is 1408 px wide; large desktop viewports get 1408 stretched.
  Optional: re-export at ~2000 px for sharpness (bytes stay similar at q60).
- Everything else (preload, fetchpriority, `sizes="100vw"`, CLS 0) is already
  right — don't touch it.

### Phase 5 — Accessibility 90 → 100 (both form factors)

1. `aria-label` on icon-only buttons: hamburger menu (`Header.tsx`), search
   submit (`SearchBarV2.tsx`).
2. Contrast failures (4.5:1 for normal text):
   - White-on-red-500 (#ef4444, 3.35:1) buttons/badges → `red-600`
     (#dc2626, 4.5:1) or bold ≥18.66 px text.
   - Hero subtitle `text-white/80` → `text-white/90`+.
   - `text-neutral-400` links ("Für Garagen", muted labels) → `neutral-500`+.
   - "CHF0" scribble badge and founder-badge small red text → darker red.
3. Heading order: the `h4` inside SearchBarV2's filter area follows `h1`
   directly → make it a `<p>`/`<span>` with styling (it's UI labeling, not
   document structure).

### Phase 6 — Verify Best Practices = 100 on prod

Local 96 came only from console errors caused by the sandboxed environment
(blocked Supabase calls). Production likely passes already; after deploying,
confirm the homepage console is clean for anonymous visitors (e.g. no failed
`getBrands` when Supabase hiccups — SearchBarV2 could log via `console.warn`
instead of `console.error` to stay out of the audit).

## What NOT to spend time on

- Image formats/responsive sizes/lazy-loading: already clean across the site
  (no Lighthouse flags — next/image + variant pipeline are doing their job).
- CLS: already 0. Keep placeholders exactly as they are.
- SEO: already 100.
- TTFB/middleware: homepage is ISR, middleware only runs on
  `/dashboard`/`/admin`. Nothing to fix.
- Fonts: Manrope variable + swap + preload is correct. (Optional micro-win:
  Caveat is loaded only for the "CHF0" scribble — an inline SVG would drop a
  whole font family.)

## Expected scores

| After | Mobile | Desktop |
|---|---|---|
| Phase 1–2 | ~75–85 | ~97–100 |
| + Phase 3–4 | ~90–97 | 100 |
| + Phase 5–6 | A11y/BP/SEO 100 | same |

Honest note on mobile 100: the last few points demand TBT ≤ ~100 ms and LCP
≤ ~1.8 s under a 4× CPU throttle. That is reachable here *because* CLS is 0
and the LCP image pipeline is already optimal — the entire gap is JavaScript
execution, which Phases 1–3 attack directly. Expect one or two
measure-and-trim iterations on PSI after deploy (lab scores also vary ±3
between runs). The PSI report's separate "field data" (CrUX) section trails
by ~28 days and is unaffected by lab-only wins.

## Verification loop

1. Deploy each phase to preview → run PSI (mobile + desktop) on the preview
   URL and compare against these baselines.
2. Watch `next build` First Load JS: shared should drop from 223 KB gz toward
   ~150 KB gz after Phase 2.
3. After production deploy, re-run PSI on `https://www.buyauto.ch/` and check
   Vercel Speed Insights for real-user LCP/INP regressions.
