# Technical rules

## Head

1. `<title>`: unique per page and describing the page, main query near the front, ` | BuyAuto` at the end, no repeated keywords, same language as the page, and no current year unless the page is a dated report. Aim for 60 characters at most; Google truncates by width and rewrites titles that are vague, boilerplate or don't match the main heading. Listing titles follow their own pattern (page-types.md, listing page).
2. One H1, the most prominent text on the page, saying the same thing as the title.
3. Meta description: unique and specific. One sourced fact or a live count helps. Aim for 155 characters at most; Google may show other text.
4. Canonical: absolute `https://www.buyauto.ch/…` URL, self-referencing on every indexable page. Never a canonical together with `noindex`. On `/suche`, the Leasingübernahme hub (`?dealType=lease_takeover`) is self-canonical while it has offers and the Direktkauf view (`?dealType=direct_purchase`) from `DIRECT_PURCHASE_MIN_INDEXABLE_LISTINGS` offers; the bare page and every other filter, sort, page or search render `noindex, follow` without a canonical (`isIndexedSearchView` in `suche.tsx`).
5. Robots: `noindex, follow` for thin inventory pages (brand pages below the threshold, garage microsites without a description or a live listing), landing pages, app screens (`/auth`) and site news (`/updates`); on indexable pages either no robots tag or `index, follow`. A scaffold of placeholder copy answers 404 (`notFound`) until it is ready, so it can't be crawled at all (PR C). Never use robots.txt to keep a page out of the index: a blocked URL can still be indexed, `noindex` is the tool for that.
6. `og:title`, `og:description`, `og:url` and `og:image` match the page.
7. `<html lang="de-CH">` is set in `_document.tsx`.
8. `src/components/SEO.tsx` requires `title`, `description` and `url` (the types enforce it since PR #84). A blank `url` leaves the canonical out; never pass the home page as `url` for another page.

## Rendering

1. Content pages use `getStaticProps` with `revalidate` (300 is the house value); listings use `getServerSideProps`.
2. Everything that matters for search is in the server HTML. Client-only components are for interactivity; dynamic imports below the fold are fine.
3. Accordion, tab and FAQ content is in the server DOM (`forceMount` or plain markup), never loaded on click.
4. Check it with the Googlebot fetch in verify.md. A browser shows the page after JavaScript has run, which hides what crawlers miss.

## Structured data

1. `Organization` and `WebSite` are set site-wide in `_app.tsx`. The Organization is the site's one node with `@id` `https://www.buyauto.ch/#organization` (`ORGANIZATION_JSON_LD` in `src/lib/buyauto/entities.ts`): name, url, logo, and the e-mail and address exactly as on `/impressum`, nothing that page doesn't say, and no `sameAs` until there is a real profile to list (never an empty one). No second `Organization` on a page: an `Article`'s `publisher` and the `WebSite`'s `publisher` are the reference `ORGANIZATION_REF`. `StructuredData` on garage pages emits only the `AutoDealer` (since PR #84).
2. Editorial pages: `Article` (fields in page-types.md) and `BreadcrumbList` through `BreadcrumbJsonLd`. The `AuthorBox` adds the site's one `Person` node, `@id` `https://www.buyauto.ch/#vincent-haenggi` (jobTitle «Gründer», `worksFor` the Organization's `@id`), and every `Article` names it as `author` by that `@id` (`FOUNDER_REF`, which also carries `@type` and `name`, as `ORGANIZATION_REF` does, so the reference reads correctly to a parser that doesn't join the JSON-LD blocks by `@id`); the Organization's `founder` carries the same `@id`, so the reference resolves on every page (PR C). Never invent profiles or `sameAs` links for him.
3. Inventory pages: `ItemList` and `BreadcrumbList`. Listings: `Car` with an `Offer` that carries `leaseLength`.
4. `FAQPage` is optional. Google stopped showing FAQ rich results on 7 May 2026, so it brings no visible feature there; other systems may still read it. Add it only when it mirrors a visible FAQ rendered from the same data array, never as a second copy of the text.
5. Never `Review`, `AggregateRating` or `HowTo`, and no invented ratings.
6. Every value in the markup is visible on the page and comes from the same constant. Structured data is part of the human fact-check.
7. Validate new markup with the Schema.org validator, and Google's Rich Results Test where a feature exists.

## Sitemap, dates and llms.txt

1. A static content page that is indexable gets an entry in `CONTENT_LAST_UPDATED` (`src/lib/buyauto/contentDates.ts`) with the date of its last real content change. That one entry feeds the sitemap `lastmod`, the visible «Aktualisiert am» in the `AuthorBox` and the `Article` `dateModified`. Legal pages keep their current entries.
2. Brand pages are listed automatically while indexable (`indexableBrandPagesFor`, grace period included; `BRAND_PAGES_CONTENT_UPDATED` for template changes). Listings and garage pages come from the database; a garage page only when `isIndexableGarage` (description, at least 1 live listing, real slug) holds, the same rule as its robots tag.
3. Remove the entry when a page is deleted, redirected or set to noindex.
4. `public/llms.txt`: one line per indexable content or offer page (brand, listing, garage and legal pages stay out), with a factual description and no live numbers, prices or promises. Update it with every added, moved or deleted page. Google's AI features need no special files, so this is for other assistants; it must never contradict the site.

## Redirects

1. Add the rule to `redirects()` in `next.config.mjs` with `permanent: true` (308), pointing at the final URL. Next keeps the query string.
2. The bare domain `buyauto.ch` is redirected to www by Vercel's domain settings before any rule runs, currently with a 307, so the `buyauto.ch` host rules in `vercel.json` never fire. Don't add new ones. The apex chain is 307 to www, then the 308 from `next.config.mjs`; Vince can make the first hop permanent in Vercel's domain settings.
3. In the same PR: update internal links (search `src` and `supabase/functions` for the old path, relative and absolute), `CONTENT_LAST_UPDATED`, llms.txt and page-map.md, and delete the old page file.
4. Never redirect to a page that redirects again or is noindex. When content was merged into a section, redirect to that section's anchor.

## URLs

1. Lowercase, hyphenated, German words with ue/ae/oe for umlauts (`leasinguebernahme`), short, no dates or IDs (listings excepted), no trailing slash.
2. A live URL changes only with a 308 and a reason in the PR.
3. Garage microsites live at top-level slugs (`/[dealerSlug]`), and a static page silently wins over a garage with the same slug. Before adding a top-level URL, check that no garage uses it (`get_public_garage_slugs`), or ask Vince when the session has no database access.

## Internal links

1. Every new page gets at least one link from its parent page's body copy (guide, cost page, hub or brand page), with anchor text that says where it goes. Header and footer links don't count.
2. Every page links on to the next step the reader needs: guide → cost page → offers or "Inserat erstellen"; brand page → the cost page section for its leasing company, and back: the cost page's lender rows and sections and the hub link the indexable brand pages with the brand name as the anchor, and each takeover listing links its own («Alle Leasingübernahmen von {Marke}»). Each listing also links the previous and the next offer in the hub's order (page-types.md, listing page), so no live offer depends on the similar cards alone.
3. Links to brand pages are gated on the brand indexing rule at build or request time (`getIndexableBrandPages` / `indexableBrandPagesFor` in `src/services/brandIndexingService.ts`, server-only because the 30-day grace period reads ended listings with the service-role key), so a noindex brand page is never linked.
4. No link blocks or lists of keyword links.
5. No orphan pages. If nothing should link to a page, it shouldn't be indexable.

## Performance

1. Core Web Vitals "good" at the 75th percentile, checked on mobile: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1.
2. `next/image` with width and height, hero images sized for mobile, heavy components (search forms, carousels, calculators) imported dynamically below the fold.
3. No layout shift from late banners or chips: reserve the space or render nothing.

## Bing, Copilot and ChatGPT

1. `public/robots.txt` welcomes the AI search crawlers (OAI-SearchBot, Claude-SearchBot, PerplexityBot and others). OpenAI says sites that opt out of OAI-SearchBot aren't shown in ChatGPT search answers, apart from navigational links. Which bots are allowed is Vince's call.
2. Bing's 2026 guidelines ask for facts stated directly, consistent names, one topic per URL and key information near the top. This skill's rules already produce that.
3. AI referral traffic is tracked (`docs/ai-traffic-tracking.md`). `scripts/check-geo.sh` checks crawler access and listing schema after deploys.
4. IndexNow tells Bing and the other participating engines about new and changed URLs; Google doesn't use it. A daily Vercel Cron (`vercel.json` `crons`, 05:00 UTC) calls `/api/indexnow`, which submits the listings published, updated, expired, sold or archived in the last 26 hours, plus the hub and the brand pages of the brands whose Leasingübernahmen changed, while those pages are indexable or when the brand's last live takeover ended in the window (`src/lib/buyauto/indexNow.ts`, at most 500 URLs, tests in `scripts/test-indexnow.ts`). Listings deleted outright leave no row and are not submitted. The key file is `public/<INDEXNOW_KEY>.txt`; changing the key means replacing that file in the same commit. Only production submits (`VERCEL_ENV`), previews and `?dryRun=1` return the list without sending it. With `CRON_SECRET` set in Vercel the route accepts only Vercel Cron's bearer token; without it, only the `vercel-cron/` user agent, and an instance submits at most once in 20 hours on that path (a repeat gets 429), so set the secret (PR C).

## Languages

See page-types.md section 9. hreflang, per-language canonicals and sitemaps come from the i18n helpers; never hand-write hreflang tags in a page. The hook checks German copy only; translations are covered by the `seo-reviewer`.
