# Verification

## While you build (automatic)

The PostToolUse hook in `.claude/settings.json` runs `node scripts/check-seo-content.mjs --hook` after every Edit or Write on a public page, a public component, a `src/lib/buyauto` module or `public/llms.txt`.

1. It checks the text you just wrote: for an Edit only the new text, for a Write the whole file. Deletions check nothing. The rules: "ß", formal address in mid-sentence (Sie, Ihnen, Ihr), typed CHF amounts and percentages in page copy, absolute promises, inflated words, negative parallelisms, Leasingexit/LeaseExit names, the "gratis"/"kostenlos" count, and title and description length or a year in the title.
2. When the edit touches the head (title, description, canonical, robots) or creates the file, it also checks that title, description and canonical are present, and the page's `CONTENT_LAST_UPDATED` wiring (indexable static page listed, noindex page not listed).
3. Findings come back to you as hook feedback. Fix the real ones in the text you wrote and leave older findings in untouched text alone. For a genuine exception, such as a verbatim lender quote, store the text in a property named `quote` or ending in `Quote`, or put a comment containing `seo-check-ignore` on the line above, and mention it in the PR.
4. The hook is a safety net. It misses things a reader would catch, such as "Sie" at the start of a sentence, a claim without a number, or a wrong fact, so the steps below still apply.

## Before the PR

1. Checks:
   - `node scripts/check-seo-content.mjs --diff origin/main`: checks only the lines this branch changed (uncommitted and new files included) plus the site-level checks (retired URLs still linked or listed, llms.txt links, `CONTENT_LAST_UPDATED` entries without a page). It must report nothing.
   - `node scripts/check-seo-content.mjs <changed files>` shows the older findings in those files too. List them in the PR description as a count per file; don't fix them silently in an unrelated PR.
   - `npx tsc --noEmit`, `npm run lint`, the tests for any logic you touched (`for f in scripts/test-*.ts; do npx tsx "$f" || exit 1; done`; tsx runs one file per call), and `npm run build` where the environment has the Supabase variables.
2. Server HTML as Googlebot, with scripts stripped:

   ```bash
   URL="https://<preview-host>/leasinguebernahme"
   curl -sL -A "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" "$URL" \
     | perl -0777 -pe 's/<script\b.*?<\/script>//gis' > page.html
   grep -o '<title>[^<]*' page.html
   grep -o 'CHF' page.html | wc -l
   ```

   Title, H1, main copy, tables, numbers and lender facts must be in it. Stripping scripts also removes the JSON-LD, so check structured data on the unstripped HTML. Vercel previews send `X-Robots-Tag: noindex` on every page, so judge robots by the meta tag in the HTML; the header only exists on previews.
3. Numbers table in the PR description: every number on the page and its source (`facts.ts`, `leasingCompanies.ts`, the pricing config or a live query). Zero rows without a source.
4. Mobile at 390×844 (a Playwright screenshot where Playwright is available, otherwise the browser's device mode): a guide fits in about 12 screens; count the calls to action in the content (at most 3).
5. Templated pages: run `node scripts/seo-ngram-overlap.mjs <base URL> <path> <path> …` before and after the change. Pairwise overlap stays well under 30 %.
6. Redirects: `curl -sI` the old URL on www.buyauto.ch with a query string and expect one 308 to a page that answers 200, query string kept. On the bare domain buyauto.ch expect a 307 to www first (Vercel's domain setting); report it, don't edit `vercel.json` for it.
7. Structured data validates and every value matches the visible text.
8. Run the `seo-reviewer` agent on the diff and fix its findings.
9. List the preview URLs in the PR and what Vince should check on each (numbers, founder wording, claims). He fact-checks before he merges.

## After merge

Tell Vince these steps; Claude Code has no access to Search Console or Bing Webmaster Tools.

1. `./scripts/check-geo.sh` against production.
2. Search Console: URL Inspection, then Request indexing for every new or changed URL; resubmit the sitemap when URLs were added or removed.
3. Bing Webmaster Tools: submit the same URLs (until IndexNow exists).
4. Two to four weeks later: impressions, clicks and position for the page and its queries, compared with the baseline Vince keeps outside the repo. Don't judge a change while a core update is rolling out; Google suggests waiting at least a full week after an update completes before reading the data.

## Every quarter, with Vince

1. Re-check facts on the cadence in sourcing.md.
2. Read the Search Console queries of the top pages and answer new questions on the page that owns them. Update its date only if the content changed.
3. Pages with almost no impressions after a full quarter in the index: improve, merge or set to noindex. Vince decides which.
4. Re-measure brand page overlap and check the inventory thresholds.
5. Run `npm run check:seo` (the whole site) and pick off older findings in a PR of their own.
