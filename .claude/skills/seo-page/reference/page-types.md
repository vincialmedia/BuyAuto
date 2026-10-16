# Page types

Pick the type before building. Each one lists what it must contain, its structured data and how it is indexed. The rules in SKILL.md apply to all of them.

## 1. Guide (Ratgeber)

Examples: `/leasinguebernahme`, `/leasingvertrag-uebertragen`. Reference implementation: `src/pages/leasinguebernahme.tsx` after Phase 2.

1. H1 names the topic plainly. The first 2–4 sentences under it answer the main question directly, in words an AI answer could quote.
2. Sections follow the questions people actually ask (from Search Console queries via Vince). Use a question as the H2 where that reads naturally.
3. `AuthorBox` right after the intro, with the page path, so the visible «Aktualisiert am» matches `CONTENT_LAST_UPDATED`.
4. Live numbers where they help (offer count, median rate, months left), always with the count of offers they come from.
5. The founder example once, through `FounderTakeoverNote`, where it shows the point being made.
6. `SourcesList` at the end with every source the page cites.
7. Length is whatever the intent needs. Google has no preferred word count. As a working limit, a guide stays within about 10–12 phone screens at 390×844. No synonym sections, repeated definitions or mid-page search forms.
8. Structured data: `Article` (headline = H1, description, author Vincent Hänggi with jobTitle "Gründer von BuyAuto", publisher BuyAuto, `dateModified` from `CONTENT_LAST_UPDATED`, `mainEntityOfPage`), plus `BreadcrumbJsonLd`. `datePublished` only if the real date is known.

Skeleton, following the reference implementation:

```tsx
const PAGE_PATH = "/beispiel";
const PAGE_URL = `https://www.buyauto.ch${PAGE_PATH}`;
const H1 = "…";
const TITLE = "… | BuyAuto";
const DESCRIPTION = "…";
const LAST_UPDATED_ISO = CONTENT_LAST_UPDATED[PAGE_PATH];
const SOURCES: FactSource[] = [/* every source the page cites, in order */];

<Head>
  <title>{TITLE}</title>
  <meta name="description" content={DESCRIPTION} />
  <link rel="canonical" href={PAGE_URL} />
  {/* og:title, og:description, og:url, og:image; Article JSON-LD */}
</Head>
<BreadcrumbJsonLd items={[/* Home → parent → this page */]} />
<h1>{H1}</h1>
<p>{/* the direct answer */}</p>
<AuthorBox path={PAGE_PATH} />
{/* sections, SourceCitation next to every sourced number */}
<SourcesList sources={SOURCES} />

export const getStaticProps = async () => ({ props: { stats: /* live */ }, revalidate: 300 });
```

## 2. Cost or data page

Example: `/leasinguebernahme-kosten`.

1. Tables carry the content and are rendered on the server. Every cell with a number links its source (`SourceCitation`) and shows the Stand.
2. Summaries such as "von CHF X bis Y" are computed from the data (`FAHRZEUGAUSWEIS_RANGE`, `KONTROLLSCHILDER_RANGE` and the summary labels in `facts.ts`), never typed.
3. "Nicht publiziert" is a valid cell. It is never filled with an estimate.
4. Each section that other pages link to has a stable anchor (`#kantone`, `#cembra`, …). Never rename an anchor that a redirect or link points to.
5. VAT: lender fees say exkl. or inkl. MWST as the source states them, with both shown where the source gives exkl. Cantonal fees are official fees and get no MWST label. BuyAuto's own prices get no VAT label until Vince confirms the basis.

## 3. Tool page

Examples: `/eintauschwert-rechner`, the Ausstiegsrechner on `/leasing-abgeben-schweiz`.

1. The explanation, the method and a worked example are server-rendered text. The calculator itself may be client-side.
2. A result is shown only when its inputs exist. Results are labelled as estimates from the user's own inputs.
3. Fixed inputs (fees, cantonal tariffs, BuyAuto's own prices) come from `facts.ts` or the pricing config, never from constants inside the component. Rules of thumb in the explanation (typical margins, typical preparation costs) are numbers too: they need a source or they go.
4. Logic lives in `src/lib/buyauto/` with a test script in `scripts/test-*.ts` (pattern: `scripts/test-exit-calculator.ts`) covering each scenario, missing inputs and an unknown fee.

## 4. Inventory page

Examples: the hub `/suche?dealType=lease_takeover` and `/leasinguebernahme/[marke]`. Future canton or model pages follow the same rules.

1. Live numbers go where the code already puts them: the hub's title carries the live offer count ("Leasingübernahme-Angebote: 37 Autos zur Übernahme | BuyAuto"); brand page titles and H1s are fixed text, and their counts sit in the meta description, the stats and the section headings. Every number comes from the live query.
2. Listing cards are in the server HTML. Stats (count, median rate, median months left, Kaution) show their sample size.
3. Brand pages carry a section on the brand's leasing company with its sourced facts (`brandLenders.ts`, `facts.ts`), which is most of what makes each brand page different.
4. Indexing follows the threshold: from `BRAND_PAGE_MIN_INDEXABLE_LISTINGS` live offers the page is indexable and in the sitemap, below it `noindex, follow` without a canonical (pattern in `[marke].tsx`, which never sends canonical and noindex together).
5. Sitemap `lastmod` is the newest listing change for that page, so it stays honest without hand edits.
6. Structured data: `ItemList` of the offers and `BreadcrumbList`.
7. Shared template text stays short. Measure pairwise 7-gram overlap with `scripts/seo-ngram-overlap.mjs` whenever the template changes; it must stay well under 30 %.

## 5. Comparison page

Examples: `/leasinguebernahme-vs-autoabo`, `/autoscout24-alternative-leasinguebernahme`.

1. Both sides are priced from sources with a Stand and a link (Auto-Abo offers from `AUTO_ABO_PROVIDERS`). Prices change often, so the Stand is shown next to them.
2. Say plainly when the other option fits better (for example a short or flexible need for an Auto-Abo).
3. Where BuyAuto has a live offer of the same model, show it next to the compared price.
4. No unsourced percentages or savings claims. Competitors are named only to compare facts, never to suggest a partnership, and never disparaged.

## 6. Listing page

`/fahrzeug/[id]`, rendered with `getServerSideProps`.

1. Title and description come from `src/lib/buyauto/listingSeo.ts`: "{Marke} {Modell} ({Jahr}) – Leasingübernahme CHF {Rate}/Mt., {n} Mt. | BuyAuto" for takeovers and "{Marke} {Modell} ({Jahr}) – CHF {Preis} | BuyAuto" for Direktkauf, up to about 70 characters. The model year belongs here; the 60-character aim and the no-year rule in technical.md are for content pages. Don't change the pattern without a reason in the PR.
2. Structured data: `Car` with an `Offer` including `leaseLength` (`P{n}M`) for takeovers. `scripts/check-geo.sh` checks for it after deploys. Google phased out the vehicle listing rich result after June 2025; the markup stays because other search engines and AI systems read it.
3. Seller names appear as first name and initial only. No seller contact data in the schema.
4. Sold, archived, expired or rejected listings 308 to their brand page when it is indexable, otherwise to the Leasingübernahme hub, and keep gclid/utm. Owners and admins still see the page. Paused, draft and pending listings answer 404 with noindex. A takeover whose contract has ended stays reachable with noindex and no Offer in the schema.

## 7. Ads landing page

`/lp/*`: always `noindex`, never linked from content pages, built for the ad's promise. The copy rules still apply. Changes go together with the Google Ads campaign, never as part of SEO work.

## 8. Market data page (instead of a blog)

1. One URL, updated in place each quarter, never a new post per quarter.
2. Built only from live inventory and `facts.ts`: rates, months left and Kaution by brand, with the sample size next to every median and the method in one paragraph.
3. Only worth indexing when there are enough live offers for the numbers to mean something; Vince decides.
4. `Article` schema with `datePublished` (first publication) and `dateModified` (last refresh), both honest.

## 9. Language versions

Applies once the i18n work (PR #66) is merged. Conventions live in `src/i18n/README.md` and `src/i18n/GLOSSARY.md` on that branch.

1. German stays unprefixed; French, Italian and English live under `/fr`, `/it`, `/en` with self-referencing canonicals and an hreflang cluster (plus `x-default` to German) only where the main content exists in that language.
2. The German text is the translation key. Any German copy change needs updated fr/it/en entries in the same PR, or those versions silently fall back to German; run the i18n check script.
3. Numbers and facts are the same in every language, from the same `facts.ts` constants. Nothing is re-typed per language.
4. Address: French "vous", Italian "tu" on marketing pages, English "you" (GLOSSARY.md). Search terms per language come from the glossary ("reprise de leasing", "subentro nel leasing", "lease takeover"). Where the glossary and copy.md disagree, copy.md wins: the slogan "Ohne Verlust" and its translations are absolute promises and aren't used in new copy.
5. No automatic redirect by browser language. Translations are reviewed like any other AI-written text before they go live.
