# Why these rules: the sources

Checked 11–12 October 2026. Re-check when Google, Bing or OpenAI change their documentation, and update the rules that depend on it.

## Google

1. Core updates in 2026: the March 2026 core update ran from 27 March to 8 April; Google called it a regular update to surface relevant, satisfying content from all types of sites, with no new guidance. The May 2026 core update began on 21 May. Google advises waiting at least a full week after a core update completes before reading Search Console, and says smaller, unannounced core updates can also lift content that has improved.
   [Google: core updates and your website](https://developers.google.com/search/updates/core-updates), [Search Engine Land](https://searchengineland.com/google-march-2026-core-update-rollout-is-now-complete-473883), [Search Engine Journal](https://www.searchenginejournal.com/google-begins-rolling-out-may-2026-core-update/575589/)
2. Ranking systems: Google says they are designed to work at page level and that site-wide signals and classifiers are used too.
   [A guide to Google Search ranking systems](https://developers.google.com/search/docs/appearance/ranking-systems-guide)
3. Helpful, reliable, people-first content (updated 5 October 2026): original information and analysis, clear sourcing, visible authorship, explaining how content was made; warning signs include writing to a word count, many pages in the hope some rank, extensive automation, summarising others, and changing dates to seem fresh. Deceptive authorship (invented names, AI-generated headshots) is called out.
   [Google Search Central](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
4. Using generative AI content (updated 1 October 2026): Google calls it critical to fact-check and review all AI-generated content by hand before publishing, and says this includes title elements, meta descriptions, structured data and image alt text.
   [Google Search Central](https://developers.google.com/search/docs/fundamentals/using-gen-ai-content)
5. Spam policies: scaled content abuse covers many pages generated mainly to manipulate rankings, whether by AI, people or both, including pages stitched together or reworded from other content. Since 15 May 2026 the policies explicitly apply to AI Overviews and AI Mode. The September 2026 spam update ran from 24 September to 8 October.
   [Google spam policies](https://developers.google.com/search/docs/essentials/spam-policies), [PPC Land](https://ppc.land/google-spam-policies-now-officially-cover-ai-overviews-and-ai-mode-in-search), [Search Engine Roundtable](https://seroundtable.com/google-september-2026-spam-update-done-42235.html)
6. AI features (updated 10 December 2025): no extra requirements, files or markup to appear in AI Overviews or AI Mode. A page must be indexed and eligible for a snippet, structured data must match the visible text, and important content should be text.
   [Google Search Central](https://developers.google.com/search/docs/appearance/ai-features)
7. Structured data: FAQ rich results stopped appearing on 7 May 2026, for every site. On 12 June 2025 Google announced that seven rich result features, vehicle listing among them, would be phased out over the following weeks and months. Neither change requires removing existing markup; it just no longer produces those results in Google.
   [Techwyse on the FAQPage notice](https://www.techwyse.com/news/ai-search/google-faq-rich-results-deprecated-2026), [PPC Land on the June 2025 phase-out](https://ppc.land/google-deprecates-seven-structured-data-types-to-simplify-search-results/)
8. Title links (updated 10 December 2025): unique, descriptive, concise titles, brand at the start or end, no keyword stuffing; Google rewrites half-empty, boilerplate, outdated or inaccurate titles.
   [Google Search Central](https://developers.google.com/search/docs/appearance/title-link)
9. Byline dates: a visible, labelled date that matches `datePublished`/`dateModified` in the markup.
   [Google Search Central](https://developers.google.com/search/docs/appearance/publication-dates)
10. Multilingual sites (updated 10 December 2025): separate URLs per language, hreflang, no automatic redirects by language, and the main content translated along with the navigation.
    [Google Search Central](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites)
11. Core Web Vitals "good" thresholds at the 75th percentile: LCP 2.5 s, INP 200 ms, CLS 0.1.
    [web.dev](https://web.dev/articles/defining-core-web-vitals-thresholds)

## Bing

Bing rewrote its Webmaster Guidelines in early 2026 to cover Copilot and grounding. It names Generative Engine Optimization, recommends stating facts directly, consistent entity names, one topic per URL and key information near the top, and adds sections on artificially engineered language and on prompt injection. Large-scale content generated without oversight or editorial review may be excluded from the index.
[Search Engine Journal](https://www.searchenginejournal.com/bing-adds-geo-to-official-guidelines-expands-ai-abuse-definitions/568442)

## OpenAI

OAI-SearchBot is the crawler behind ChatGPT search; sites that opt out of it aren't shown in ChatGPT search answers, apart from navigational links. GPTBot is for model training, and ChatGPT-User fetches pages when a user asks.
[OpenAI crawler documentation](https://developers.openai.com/api/docs/bots)

## Swiss law

UWG (SR 241) Art. 3 Abs. 1 treats as unfair: incorrect or misleading statements about your own business, offers or prices (lit. b); comparisons with others that are incorrect, misleading, needlessly disparaging or that lean on their reputation (lit. e); and disparaging others with incorrect, misleading or needlessly hurtful statements (lit. a). This is why every claim needs a source, comparisons stick to sourced facts, and testimonials must be real.
[UWG on LexFind](https://www.lexfind.ch/tolv/150161/de)
