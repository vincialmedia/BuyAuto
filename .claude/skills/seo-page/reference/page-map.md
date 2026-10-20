# Page map: which URL owns which intent

State after SEO Phase 2 (PRs #81, #82 and #84). Until #81 and #82 are merged, the four lender pages and `/leasing-concierge` are still live; don't delete or redirect them outside those PRs. Update this file in the same PR whenever a page is added, merged, retitled, set to noindex or retired.

## Indexable pages

| URL | Owns | Notes |
|---|---|---|
| `/` | "Leasingübernahme Schweiz" (the head term) and the brand | Live offer count above the fold (the hub's count, so the two never disagree); up to 12 live offers (the first 12 of the hub, in the hub's order) in the server HTML. Fees live on the cost page, not in the hero |
| `/suche?dealType=lease_takeover` | Browsing the Leasingübernahme offers | The canonical offer hub: self-canonical, in the sitemap, title carries the live count. Its first page server-renders every live Leasingübernahme, up to 60 (`HUB_PAGE_SIZE` in `suche.tsx`; every other view shows 12), so each listing has a crawlable link; it also links the indexable brand pages |
| `/suche?dealType=direct_purchase` | Cars to buy outright (Direktkauf) | Indexable from 12 live offers (`DIRECT_PURCHASE_MIN_INDEXABLE_LISTINGS` in `suche.tsx`), then self-canonical; below that `noindex, follow`, out of the sitemap and llms.txt |
| `/leasinguebernahme` | How a takeover works for both sides | Guide; leaves the head term to `/` |
| `/leasinguebernahme-kosten` | What a takeover costs: lender fees, cantonal fees (`#kantone`), Kaution | Holds the former lender pages as `#cembra`, `#amag`, `#multilease`, `#bank-now` |
| `/leasing-abgeben-schweiz` | Getting out of a lease: abgeben, vorzeitig beenden, auflösen | Exit options with the Ausstiegsrechner |
| `/leasingvertrag-uebertragen` | The seller's step-by-step for transferring a contract | Links to the guide instead of repeating it |
| `/leasinguebernahme-vs-autoabo` | Leasingübernahme compared with an Auto-Abo | The only Auto-Abo page on the site. Lists the live Leasingübernahmen with at most 24 months left (the short-need answer), hidden when there are none (PR C) |
| `/leasinguebernahme/[marke]` | "[Marke] Leasingübernahme" and that brand's leasing company | Indexable from 2 live takeover offers (`BRAND_PAGE_MIN_INDEXABLE_LISTINGS` in `leasingBrands.ts`), or from 1 while the brand had 2 takeovers live within the last 30 days (`BRAND_PAGE_GRACE_DAYS`: the live ones plus those that expired, sold or were archived in that window). The grace period keeps a page from dropping out of the index and coming back each time one offer ends before the next arrives. At 0 live offers: noindex at once (PR C) |
| `/eintauschwert-rechner` | Trade-in value / car valuation (tool) | |
| `/fuer-garagen` | BuyAuto for garages | |
| `/preise` | BuyAuto's own prices | |
| `/fahrzeug/[id]` | One offer | See page-types.md for retired and ended listings |
| `/[dealerSlug]` | A garage's microsite | The first page of the inventory is server-rendered. Indexable and in the sitemap only with a description, at least 1 live listing and a real slug (`isIndexableGarage` in `garageIndexing.ts`); otherwise `noindex, follow` without a canonical (PR C) |
| `/agb`, `/datenschutz`, `/impressum` | Legal | |

The bare `/suche` and any other `/suche` view (extra filters, sort, pagination, free-text search) render `noindex, follow` without a canonical.

## Not indexable on purpose

| URL | Why |
|---|---|
| `/lp/leasing-abgeben` | Google Ads landing page: noindex, never linked from content pages, changed only together with the ads |
| `/elektroauto-leasing-abgeben`, `/leasingausstieg-kosten-daten` | Scaffolds of [TODO] placeholders: they answer 404 (`notFound` in `getStaticProps`) while `CONTENT_READY` is false, so nothing can crawl, link or list them; the scaffold code stays as the draft until they pass the bar below (PR C) |
| `/updates` | Site news for visitors, not a search intent: `noindex, follow`, no canonical, out of the sitemap, llms.txt and `CONTENT_LAST_UPDATED` (PR C) |
| `/auth` | Login and registration: `noindex, follow` (PR C) |
| `/inserat-erstellen`, `/garage-plan`, dashboards, embeds | App screens, noindex. `/dashboard*` and `/admin` are also disallowed in robots.txt. `/inserat-erstellen` now stays noindex after hydration too (it used to switch to `index, follow`; PR C changed only that meta tag, not the listing flow) |
| Brand pages with 0 live offers, or 1 without a second takeover live in the last 30 days | `noindex, follow`, no canonical, out of the sitemap, never linked |
| Garage microsites without a description, without a live listing, or with a test slug | `noindex, follow`, no canonical, out of the sitemap (`garageIndexing.ts`: a denylist plus test/demo slugs and slugs with fewer than 3 letters; the test/demo rule goes beyond the denylist, so a garage with text and a live listing that only it keeps out is logged once, for Vince to check) |
| `/suche` (no filters) | Lists the hub's offers again plus Direktkauf, so it would compete with the hub. A search tool for visitors: server-rendered, `noindex, follow`, out of the sitemap and llms.txt (PR #84) |

## Retired URLs

Never create a page at these paths again. Each one 308s in a single hop on www.buyauto.ch.

| Old URL | Now |
|---|---|
| `/auto-abos-im-vergleich`, `/carify-alternativen`, `/auto-abo-vs-leasing-kosten`, `/auto-abo-kuendigen` | `/leasinguebernahme-vs-autoabo` |
| `/leasinguebernahme-vs-neues-leasing`, `/leasing-transfer` | `/leasinguebernahme` |
| `/fuer-haendler`, `/fuer-haendler/marktwert-rechner` | `/eintauschwert-rechner` |
| `/leasing-concierge` | `/leasing-abgeben-schweiz` (BuyAuto offers no concierge service) |
| `/cembra-leasing-uebernehmen`, `/amag-leasing-uebernehmen`, `/multilease-leasing-uebernehmen`, `/bank-now-leasing-uebernehmen` | `/leasinguebernahme-kosten#cembra`, `#amag`, `#multilease`, `#bank-now` |
| `/autoscout24-alternative-leasinguebernahme` | `/` (PR C, Vince's decision). A page built on a competitor's brand name (see Don't build) with no unique asset of its own; the head term and the live offers are on the home page |

## The bar for a new indexable URL

A new URL needs all five. Anything less is an improvement to an existing page.

1. A distinct intent: someone searching it expects a different answer from the one an existing page gives. Variants such as "leasing übernehmen" or "leasingvertrag übernehmen" go on the owner page.
2. Measured demand: queries in Search Console or Keyword Planner (Switzerland), supplied by Vince. A page for an audience without search demand, such as garages, is fine when Vince asks for it.
3. A unique asset from the list in SKILL.md.
4. Facts that can be kept current, each in `facts.ts` with a Stand.
5. For programmatic pages (brand, canton, model): indexable only above the live-inventory threshold, and different enough from their siblings, meaning a pairwise 7-gram overlap well under 30 % (`scripts/seo-ngram-overlap.mjs`). Below the threshold they render `noindex, follow` and stay out of the sitemap.

When a proposed page fails any of these, say so and suggest the existing page it should improve instead.

## Don't build

1. A blog or news section, or articles that summarise what other sites say.
2. Generic Auto-Abo, car-buying, insurance or financing content that isn't about taking over or handing over a lease.
3. One page per synonym of an owned intent, or per city, canton or model without live inventory there.
4. Pages built on a competitor's brand name that suggest a relationship, and anything about the company Leasingexit or LeaseExit.
5. Pages that share most of their text with another page and swap a few words (Google calls this scaled content abuse; Bing calls it artificially engineered language).

## Candidates, only once they pass the bar

1. Canton pages: only for cantons with recurring live inventory. The unique asset is that canton's offers plus its official fees from `CANTONAL_FEES`. The URL pattern needs a decision with Vince first, because `/leasinguebernahme/[marke]` already uses that level.
2. Model pages (for example BMW X3): only where the model has recurring inventory.
3. Returning a car at contract end ("Leasing-Rückgabe"): a separate intent from getting out early; needs demand data and a unique asset first.
4. A market data page (rates, months left and Kaution by brand, from live inventory), updated in place every quarter, with the sample size next to every median.
5. French, Italian and English versions of the pages above through the i18n setup (PR #66). No separate FR-only pages.
