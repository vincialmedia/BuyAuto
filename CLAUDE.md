# BuyAuto

Swiss marketplace for Leasingübernahmen (lease takeovers) at buyauto.ch, built and run by Vince (Vincent Hänggi). The site is German (de-CH); French, Italian and English versions are in progress (PR #66).

## Stack

- Next.js 15 with the Pages Router (`src/pages`), React 18, Tailwind, shadcn/ui (`src/components/ui`)
- Supabase for database, auth and edge functions (`supabase/`), Vercel deploys from GitHub
- Commands: `npm run dev`, `npm run build`, `npm run lint`, `npx tsc --noEmit`, `npm run check:seo`, `node scripts/check-seo-content.mjs --diff origin/main`
- Tests: `for f in scripts/test-*.ts; do npx tsx "$f" || exit 1; done` (tsx runs one file per call)

## Public pages and SEO

Before planning, writing or changing anything on a public page (copy, title, meta description, numbers, structured data, links, redirects, sitemap, llms.txt), load the `seo-page` skill in `.claude/skills/seo-page/` and follow it. The short version:

1. One intent per URL. Check `reference/page-map.md` and improve the page that owns an intent instead of adding a second one.
2. Every number comes from `src/lib/buyauto/facts.ts` or `leasingCompanies.ts` (with source and Stand), the pricing config, or live data. No invented numbers, rules of thumb, testimonials or customer cases.
3. Vince's 2024 takeover is his own experience as founder (`FOUNDER_TAKEOVER`), never a BuyAuto case.
4. du, "ss" never "ß", at most 3 calls to action, "gratis"/"kostenlos" at most once, no absolute promises.
5. "Leasing-Exit" only as a plain description, never the company Leasingexit or LeaseExit.
6. Everything that matters for search is in the server HTML.
7. A hook checks every edit with `scripts/check-seo-content.mjs`, and the `seo-reviewer` agent reviews the diff before the PR. Vince fact-checks the preview before he merges.

## Where things live

- `src/lib/buyauto/facts.ts` and `leasingCompanies.ts`: sourced facts. `contentDates.ts`: last-updated dates (sitemap, visible date, Article dateModified). `format.ts`: CHF and number formatting. `stripe_config.ts` and `garagePlans.ts`: BuyAuto's prices.
- `src/services/listingsService.ts`: live inventory.
- `src/pages/sitemap.xml.ts`, `public/robots.txt`, `public/llms.txt`.
- Redirects: `next.config.mjs`. The bare domain buyauto.ch reaches www through Vercel's domain settings.
- Content page components in `src/components/buyauto/`: `AuthorBox`, `SourceCitation`, `FounderTakeoverNote`, `Breadcrumbs`, `LenderFeeTable`, `CantonalFeesTable`, `ExitCalculator` (most of them from SEO Phase 2, PRs #81 and #82).

## Working rules

- The repo is public. Never commit keys, `.env` values, customer data, ad budgets, pricing plans, or Search Console, GA4 or revenue numbers, and keep them out of comments, commit messages and PR descriptions too.
- Supabase migrations: additive only, dry-run first, applied to production only after Vince says "go".
- Leave GA4 and Google Ads tracking, consent logic, pricing, the `/lp/*` pages and the listing flow (`/inserat-erstellen`, `src/components/buyauto/create-listing/`) unchanged unless the task names them.
- Check server rendering by fetching the page as Googlebot with scripts stripped (see the skill's `reference/verify.md`). A browser runs the JavaScript and hides what crawlers miss.
- History, kept for reference only: the `*_PLAN.md`, `*_SUMMARY.md` and similar files in the repo root, `seo/CONTENT_BRIEFS_LEASINGUEBERNAHME.md` and `seo/GEO_AUDIT_2026-08.md`. Where they or `.design-sync/` notes disagree with the seo-page skill or `format.ts`, the skill and `format.ts` win.
