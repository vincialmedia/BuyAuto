# Page map: which URL owns which intent

State after SEO Phase 2 (PRs #81, #82 and #84). Until #81 and #82 are merged, the four lender pages and `/leasing-concierge` are still live; don't delete or redirect them outside those PRs. Update this file in the same PR whenever a page is added, merged, retitled, set to noindex or retired.

## Indexable pages

| URL | Owns | Notes |
|---|---|---|
| `/` | "Leasingübernahme Schweiz" (the head term) and the brand | Live offer count above the fold (the hub's count, so the two never disagree); up to 12 live offers (the hub's first page) in the server HTML. Fees live on the cost page, not in the hero |
| `/suche?dealType=lease_takeover` | Browsing the Leasingübernahme offers | The canonical offer hub: self-canonical, in the sitemap, title carries the live count |
| `/suche?dealType=direct_purchase` | Cars to buy outright (Direktkauf) | Indexable from 12 live offers (`DIRECT_PURCHASE_MIN_INDEXABLE_LISTINGS` in `suche.tsx`), then self-canonical; below that `noindex, follow`, out of the sitemap and llms.txt |
| `/leasinguebernahme` | How a takeover works for both sides | Guide; leaves the head term to `/` |
| `/leasinguebernahme-kosten` | What a takeover costs: lender fees, cantonal fees (`#kantone`), Kaution | Holds the former lender pages as `#cembra`, `#amag`, `#multilease`, `#bank-now` |
| `/leasing-abgeben-schweiz` | Getting out of a lease: abgeben, vorzeitig beenden, auflösen | Exit options with the Ausstiegsrechner |
| `/leasingvertrag-uebertragen` | The seller's step-by-step for transferring a contract | Links to the guide instead of repeating it |
| `/leasinguebernahme-vs-autoabo` | Leasingübernahme compared with an Auto-Abo | The only Auto-Abo page on the site |
| `/leasinguebernahme/[marke]` | "[Marke] Leasingübernahme" and that brand's leasing company | Indexable from 2 live takeover offers (`BRAND_PAGE_MIN_INDEXABLE_LISTINGS` in `leasingBrands.ts`) |
| `/autoscout24-alternative-leasinguebernahme` | AutoScout24 compared with BuyAuto for leasing | |
| `/eintauschwert-rechner` | Trade-in value / car valuation (tool) | |
| `/fuer-garagen` | BuyAuto for garages | |
| `/preise` | BuyAuto's own prices | |
| `/fahrzeug/[id]` | One offer | See page-types.md for retired and ended listings |
| `/[dealerSlug]` | A garage's microsite | The first page of the inventory is server-rendered |
| `/updates`, `/agb`, `/datenschutz`, `/impressum` | Site news and legal | |

The bare `/suche` and any other `/suche` view (extra filters, sort, pagination, free-text search) render `noindex, follow` without a canonical.

## Not indexable on purpose

| URL | Why |
|---|---|
| `/lp/leasing-abgeben` | Google Ads landing page: noindex, never linked from content pages, changed only together with the ads |
| `/elektroauto-leasing-abgeben`, `/leasingausstieg-kosten-daten` | Scaffolds: noindex and out of the sitemap until they pass the bar below |
| `/inserat-erstellen`, `/garage-plan`, dashboards, auth, embeds | App screens. Known issue: `/inserat-erstellen` sends noindex in the server HTML but renders `index, follow` after hydration; it belongs to the listing flow, so Vince decides when to fix it |
| Brand pages with fewer than 2 live offers | `noindex, follow`, no canonical, out of the sitemap |
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
