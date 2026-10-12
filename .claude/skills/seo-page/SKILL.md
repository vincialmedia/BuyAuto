---
name: seo-page
description: BuyAuto's rules and workflow for every public page on buyauto.ch. Use before planning, creating, rewriting or editing a page or its copy, title, meta description, headings, numbers, structured data, internal links, redirects, sitemap entry or llms.txt, including brand and inventory pages, calculators, comparisons, landing pages, articles and language versions.
when_to_use: Triggers include "new page", "neue Seite", "SEO", "Ratgeber", "blog post", "article", "landing page", "rewrite the guide", "brand page", "change the title", "meta description", "redirect this page", "translate this page".
---

# BuyAuto page guidelines

Every public page on buyauto.ch follows this skill. The aim is page one in Google and citations in Bing, Copilot and ChatGPT for the Swiss Leasingübernahme topic. The method is the same for all of them: one intent per URL, answered more accurately and more specifically than any other Swiss page.

## Why the bar is high

Google ranks mainly page by page but also uses site-wide signals, so thin, templated or off-topic pages can weigh on the whole domain. Pages about products BuyAuto doesn't sell, like the former generic Auto-Abo pages, attract searches BuyAuto can't serve. So the default answer to "should we add a page?" is no, unless it clears the bar in [reference/page-map.md](reference/page-map.md).

## What only BuyAuto has

Every page uses at least one of these. A page without one repeats what other sites already say, and it doesn't get built.

1. Live inventory: offer count, monthly rates, months left and Kaution, per brand and model (`src/services/listingsService.ts`; `computeInventoryStats` in `facts.ts`).
2. Sourced lender, cantonal and provider facts in `src/lib/buyauto/facts.ts` and `leasingCompanies.ts`, each with URL and Stand.
3. Vince's own takeover in 2024 (`FOUNDER_TAKEOVER`).
4. Tools: the Eintauschwert-Rechner and the Ausstiegsrechner (`ExitCalculator`).

There is no blog. Recurring content is a data page updated in place (see [reference/page-types.md](reference/page-types.md)).

## Non-negotiables

1. One intent, one URL. Look the intent up in [reference/page-map.md](reference/page-map.md) before creating a URL. If a page already owns it, improve that page. Synonyms and query variants belong on the owner page.
2. Every number and factual claim has a source, from one of four places: `facts.ts` or `leasingCompanies.ts` (sourced facts with URL and Stand, cited next to the number with `SourceCitation` and listed in `SourcesList`), the pricing config (`pricingPlans`, `GARAGE_PLANS`) for BuyAuto's own prices, or live queries for inventory numbers. If none of them has it, the sentence goes without the number. Never invent experience values, rules of thumb, testimonials, customer cases, statistics or percentages.
3. Vince's 2024 takeover is his own experience as founder. It comes only from `FOUNDER_TAKEOVER`: through `FounderTakeoverNote`, `AuthorBox` or `FounderStory`, or next to `FOUNDER_TAKEOVER.label` as in the BMW row of `LenderFeeTable` and the cost page FAQ. Nothing is added to it, no new wording without Vince, and it is never a BuyAuto case, customer story or testimonial.
4. Copy: du, "ss" never "ß", Swiss number and date formats. No negative parallelisms, inflated words, platitudes, bold lead-ins on bullets or absolute promises, and few dashes. At most 3 calls to action in the page content. "gratis"/"kostenlos" at most once per page and only where it is true. Details in [reference/copy.md](reference/copy.md).
5. "Leasing-Exit" is only a plain description of getting out of a lease. Never name, compare with or imply a link to a company called Leasingexit or LeaseExit.
6. Everything that matters for search is in the server HTML: title, H1, body copy, tables, numbers, lender facts, structured data, and the explanation and example of any calculator. The calculator itself may be client-side.
7. Every indexable page has a unique title, H1 and meta description and a self-referencing canonical. Static content pages also get an entry in `CONTENT_LAST_UPDATED`; editorial pages get the `AuthorBox` and a Quellen list. Noindex pages stay out of `CONTENT_LAST_UPDATED`, the sitemap and llms.txt. Legal pages (AGB, Datenschutz, Impressum) stay as they are unless Vince asks.
8. Moving or deleting a page: 308, one hop, query string kept. Update internal links, `CONTENT_LAST_UPDATED`, the sitemap, llms.txt and [reference/page-map.md](reference/page-map.md) in the same PR.
9. Dates stay honest. Change a page's `CONTENT_LAST_UPDATED` date only when its content changes, never to look fresh.
10. A person checks every page before it goes live. Google's guidance since 1 October 2026 is to fact-check all AI-generated content by hand, including titles, meta descriptions, structured data and alt text. Claude Code drafts and verifies; Vince reviews the preview and the numbers table before he merges.
11. Page work leaves these alone unless the task names them: GA4 and Google Ads tracking, consent logic, pricing, the `/lp/*` pages, and the listing flow (`/inserat-erstellen`, `src/components/buyauto/create-listing/`, the messages in `listingContract.ts`).
12. The repo is public. No Search Console, GA4 or revenue numbers, ad budgets, pricing plans, keys or customer data in code, comments, commit messages or PR descriptions. Baselines and results go to Vince in chat.

## Workflow

For a new page, a rewrite, or any change to a page's intent, numbers, claims or indexing:

1. Decide before writing code. Name the intent and its main queries, the page that owns it today, the unique asset the page uses, the page type and whether it will be indexable. Demand data (Search Console, Google Ads Keyword Planner for Switzerland) comes from Vince: ask for it, never estimate search volumes. If the intent is already owned or the page has no unique asset, stop and tell Vince why.
2. Facts first. Any new number or provider fact goes into `facts.ts` (or `leasingCompanies.ts` for lender details) with its source and Stand before copy is written ([reference/sourcing.md](reference/sourcing.md)). If you can't open the primary source yourself, don't add the fact; ask Vince.
3. Build from the page type in [reference/page-types.md](reference/page-types.md) with the existing components: `SourceCitation`/`SourcesList`, `AuthorBox`, `FounderTakeoverNote`, `Breadcrumbs`/`BreadcrumbJsonLd`, `LenderFeeTable`, `CantonalFeesTable`, `ExitCalculator`. Most of them arrived with SEO Phase 2 (PRs #81 and #82); if they are missing, those PRs aren't merged yet, so tell Vince instead of rebuilding them.
4. Wire it up: `CONTENT_LAST_UPDATED`, internal links from its parent page and on to the next step, llms.txt, redirects if it replaces a URL ([reference/technical.md](reference/technical.md)).
5. Verify with [reference/verify.md](reference/verify.md). A hook runs `scripts/check-seo-content.mjs` on the text you write after every edit. Before you finish, run `node scripts/check-seo-content.mjs --diff origin/main` (the lines you changed plus the site-level checks) and the typecheck.
6. Review: have the `seo-reviewer` agent check the diff against this skill, then fix what it finds.
7. Hand over: put the brief, the numbers table and the preview URLs into the PR description, and tell Vince the after-launch steps in [reference/verify.md](reference/verify.md).

Small changes, such as a sentence, a typo or a single link, that add no URL and keep the page's intent, numbers, claims, indexing and redirects as they are: skip steps 1, 6 and the brief. The hook and step 5 still apply.

## PR checklist

Copy this into the PR description and tick it honestly.

- [ ] Intent checked in page-map.md: no second page for the same intent
- [ ] Unique asset used (live data, sourced facts, founder experience or a tool)
- [ ] The first 2–4 sentences under the H1 answer the main question
- [ ] Numbers table: every number on the page maps to `facts.ts`, `leasingCompanies.ts`, the pricing config or a live query
- [ ] Title, H1 and meta description unique; canonical and robots correct
- [ ] Server HTML (fetched as Googlebot, scripts stripped) contains title, H1, copy, tables and numbers
- [ ] du, ss, no Sie; at most 3 calls to action; "gratis"/"kostenlos" at most once; no absolute promises
- [ ] `CONTENT_LAST_UPDATED`, sitemap, llms.txt, internal links and page-map.md updated; redirects are one 308 hop
- [ ] Structured data matches the visible text; `AuthorBox` and Quellen on editorial pages
- [ ] `node scripts/check-seo-content.mjs --diff origin/main` reports nothing; typecheck and lint pass
- [ ] `seo-reviewer` findings fixed
- [ ] Preview links listed for Vince's fact-check

## References

- [reference/page-map.md](reference/page-map.md): which URL owns which intent, retired URLs, the bar for new pages, what not to build
- [reference/page-types.md](reference/page-types.md): structure, components and schema per page type (guide, cost/data, tool, inventory, comparison, listing, landing page, data page, language versions)
- [reference/copy.md](reference/copy.md): voice, Swiss spelling and formats, banned patterns, claims, quotes, the founder story, competitors, images
- [reference/sourcing.md](reference/sourcing.md): where numbers come from, how to add a fact, re-check cadence
- [reference/technical.md](reference/technical.md): head tags, rendering, structured data, sitemap and llms.txt, redirects, URLs, internal links, performance, Bing and AI search, languages
- [reference/verify.md](reference/verify.md): checks before the PR, review, and steps after launch
- [reference/why.md](reference/why.md): the Google, Bing, OpenAI and legal sources these rules rest on, with dates
