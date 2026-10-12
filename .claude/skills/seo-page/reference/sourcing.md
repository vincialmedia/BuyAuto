# Sources and facts

## Where numbers come from

Every number on a public page comes from one of these four places. Memory, "typical" values, rules of thumb, other sites' numbers and AI answers don't count.

1. `src/lib/buyauto/facts.ts`: lender fees and clauses, the KKG reference, cantonal tariffs, Auto-Abo offers, the founder story. Each figure is a typed constant tied to a `FactSource` (`title`, `url`, `stand`). `FACTS_CHECKED_ON` is the date the set was last checked against the documents.
2. `src/lib/buyauto/leasingCompanies.ts`: further lender facts as `SourcedFact` entries, each with source and Stand (`LENDER_RESEARCH_STAND`).
3. BuyAuto's own prices: `pricingPlans` in `src/lib/buyauto/stripe_config.ts` for private listings, `GARAGE_PLANS` in `src/lib/buyauto/garagePlans.ts` for garages.
4. Live data: offer counts, monthly rates, months left and Kaution, overall and per brand or model, from `src/services/listingsService.ts` (`getPublicOfferIndex`, `liveTakeovers`, `getLiveInventoryStats`) and `computeInventoryStats` in `facts.ts`. Pages read them in `getStaticProps` with `revalidate` or in `getServerSideProps`.

Copy modules in `src/lib/buyauto` (for example `exitCalculatorText.ts`) build their sentences from these sources too; they don't hold numbers of their own.

## Which sources are good enough

In this order:

1. The issuer's own document: the lender's fee schedule, ALB/AVB or FAQ; the canton's official tariff; the law on fedlex.admin.ch.
2. The provider's own page for its own prices (for example an Auto-Abo provider's offer page).
3. Official statistics (BFS, ASTRA) for market facts.

Not good enough: blogs, forums, comparison sites, press articles about someone else's fees, a competitor's claims about third parties, AI summaries and search snippets.

## Adding a fact

1. Open the primary source yourself. If the sandbox can't reach it, ask Vince to attach the document. Never add a fact from memory or from a search snippet.
2. Record the exact figure, its VAT basis (exkl. or inkl. MWST), the clause or page (for example "Ziff. 18"), the document's version or date as its Stand, the URL, and the exact wording if it will be quoted.
3. Add it to `facts.ts` as typed data with its `FactSource`. Derived values (incl. MWST, ranges, minimum and maximum) are computed with helpers such as `withVat` and the range helpers, never typed.
4. On the page, print it with `SourceCitation` next to the number and add its source to the page's `SOURCES` list for `SourcesList`.
5. Add or extend a test script in `scripts/` when the value goes through logic.
6. Bump `CONTENT_LAST_UPDATED` for every page that now prints the fact.

## When nothing is published

Say so: "nicht publiziert" plus what the reader can do ("frag bei deiner Leasinggesellschaft nach"). Never estimate, average, or borrow another lender's figure.

## Live data

1. Every median or range shows its sample size ("bei 8 von 36 Angeboten").
2. If the live read fails, the element is hidden. A fallback number labelled as live is never shown.
3. Live numbers appear in titles and descriptions only on pages that revalidate (`revalidate` in `getStaticProps`, or `getServerSideProps`).
4. No live numbers typed into llms.txt or other static text; they go stale within days.

## Keeping facts current

1. Lender documents: check quarterly and whenever a lender publishes a new edition. Update `FACTS_CHECKED_ON`.
2. Cantonal tariffs: check every January (most tariffs change on 1 January) and when a canton announces a change.
3. Auto-Abo prices: check before every edit of the comparison page and at least quarterly; they change often.
4. KKG and other law: check yearly.
5. When a fact changes, update `facts.ts` with the new Stand, `CONTENT_LAST_UPDATED` for each static page that prints it, and `BRAND_PAGES_CONTENT_UPDATED` when the brand pages print it.

## Numbers about BuyAuto itself

Listing and user counts come only from live queries. Business figures such as revenue appear only if Vince has already made them public, and they must match what he said.
