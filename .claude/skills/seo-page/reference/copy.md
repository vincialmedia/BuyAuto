# Copy rules

German for Swiss readers, written by BuyAuto, about money. Accuracy first, then clarity, then everything else.

## Voice

1. Address the reader with du, lowercase in running text ("du", "dein"). Never "Sie", "Ihnen" or "Ihr" as address on public pages, including buttons, errors, banners and toasts. The only exception is a lender's own wording inside a quote. Legal pages (AGB, Datenschutz, Impressum) keep their legal wording; change how they address the reader only when Vince asks.
2. Answer first. The first sentences under the H1 and under each H2 give the answer, then the detail.
3. Be concrete: who does what, who pays, how much, and where the number comes from.
4. Short paragraphs of two to four sentences, one idea each. Tables for anything with more than two dimensions.
5. Use the main term where it is natural (title, H1, intro, a few headings). No keyword lists, synonym sections or repeated definitions.

## Swiss spelling and formats

1. "ss", never "ß" (Strassenverkehrsamt, massgebend, Grösse).
2. Amounts: CHF before the number with the apostrophe separator, built with the helpers in `src/lib/buyauto/format.ts`: `formatChf` (CHF 2'000), `formatChfRange` (CHF 2'000–15'000), `formatChfRappen` (CHF 432.40). Never type an amount into copy. `format.ts` decides the separator (the plain apostrophe, which keeps server and browser output identical), also where older design notes show ’.
3. Monthly rates: "pro Monat" in running text, "/Monat" or "/Mt." only in tables and cards.
4. VAT: lender fees say "exkl. MWST" or "inkl. MWST" as the source states them; where the source gives exkl., show both. Cantonal fees are official fees and get no MWST label. BuyAuto's own prices get no VAT label until Vince confirms the basis.
5. Dates: `formatSwissDate` for «Aktualisiert am»; a Stand is printed the way the source document prints it.
6. Guillemets «…» for quotes and named terms.

## Names and terms

1. Consistent terms: Leasingübernahme, Leasingnehmer (bisheriger, neuer), Leasinggesellschaft, Abgeber, Übernehmer, Restlaufzeit, Monatsrate, Kaution, Anzahlung, Ablösesumme, vorzeitige Vertragsauflösung, Strassenverkehrsamt, Fahrzeugausweis, Kontrollschilder.
2. Lender names exactly as the `name` fields in `facts.ts`.
3. Attribution traps found in review:
   - The sentence about rewriting a contract to a new lessee comes from ALPHERA's FAQ. Attribute it to ALPHERA, never to BMW.
   - CA Auto Finance Suisse SA is Fiat's «Leasingpartner», owned by Crédit Agricole, not by Stellantis.
   - AMAG's ALB Ziff. 9.1.1 lists service partners. Which brands AMAG Leasing covers comes from its Geschäftsbericht 2025 quote.
   - CA Auto Finance's «Halterwechsel» fee is a keeper change within the same household, not a contract transfer.

## Patterns to leave out

1. Negative parallelisms: "nicht nur X, sondern auch Y", "nicht X, sondern Y" used as a device. State the positive point.
2. Inflated words: revolutionär, bahnbrechend, einzigartig, unschlagbar, ultimativ, erstklassig, innovativ, nahtlos, stressfrei, kinderleicht, im Handumdrehen, massgeschneidert.
3. Platitudes: "Vertrauen Sie auf bewährte Prozesse", "Schweizer Qualität", "Wir machen es dir einfach".
4. Bullets that start with a bold label ("**Schnell:** …"). Write the sentence.
5. Many dashes. Use full stops and commas; the en dash is for ranges.
6. A year in a title, unless the page is a dated report.

## Calls to action

1. At most 3 in the page content (header, footer and navigation don't count), with one primary action.
2. Buttons say what happens: "Inserat erstellen", "Angebote ansehen", "Kosten berechnen".

## Claims

1. No absolute promises: "ohne Verlust", "garantiert", "risikolos", or "sofort" when it promises an outcome such as finding a new lessee. A takeover still costs the lender's transfer fee and BuyAuto's own fee, so "without loss" can't be promised to every reader. The remaining uses are the `/lp/leasing-abgeben` title (Ads landing page) and the noindex E-Auto scaffold. Don't add new ones; Vince decides about those two.
2. "gratis" or "kostenlos" at most once per page and only for something that is free for everyone reading it. Never for garage packages: they are paid monthly plans (`GARAGE_PLANS`). Mention a garage discount or trial only when it is in the pricing config and Vince confirms it.
3. Superlatives and comparisons about BuyAuto ("die grösste", "die einzige", "günstiger als") only with a source. Swiss unfair competition law (UWG Art. 3 Abs. 1) covers incorrect or misleading statements about your own business, offers and prices (lit. b), comparisons with others that are incorrect, misleading, needlessly disparaging or that lean on their reputation (lit. e), and disparaging others (lit. a).
4. Figures BuyAuto has given to the press must match what the site says.

## Quotes

1. Verbatim, in «…», one or two sentences, with source and Stand.
2. Stored in `facts.ts` as a property named `quote` or ending in `Quote` (for example `terminationQuote`). The automated check skips those lines, so a lender's own "Sie" or "Ihrem" stays as published. Anywhere else, mark a verbatim quote with a comment containing `seo-check-ignore` on the line above.

## The founder story

1. The facts, and only these: in 2024 Vincent Hänggi had a BMW i8 on lease with about 30 months left. Buying it out, or terminating and selling, would have cost him about CHF 20'000, the gap between what he still owed and what the car was worth. He handed the contract over with a Leasingübernahme; BMW's leasing company charged him CHF 550, the full fee, which he paid as the outgoing lessee. BuyAuto didn't exist yet.
2. Never state how he found the new lessee, how long it took, which documents were needed, or anything that makes it sound like a BuyAuto case.
3. Use the existing wordings, all built from `FOUNDER_TAKEOVER`: `FOUNDER_TAKEOVER_TEXT` and `FounderTakeoverNote` (inline or box), `AUTHOR_ONE_LINER` in the `AuthorBox`, the BMW row of `LenderFeeTable` and the FAQ answer on the cost page. First person only in `FounderStory` on the home page. New wording needs Vince's approval.
4. Label it «Eigene Erfahrung des Gründers» (`FOUNDER_TAKEOVER.label`).

## Testimonials and reviews

None unless they are real, attributable, given with the person's written permission and approved by Vince. Never written by AI. No `Review` or `AggregateRating` markup.

## Competitors and the Leasingexit rule

1. Name a competitor only to compare facts that have a source. Never suggest a partnership, never disparage.
2. "Leasing-Exit", with the hyphen, only as a plain description of getting out of a lease. Never "Leasingexit", "LeaseExit" or leasingexit.ch, and no comparison with or reference to that company.

## Images and alt text

1. New images: real photos (listings, Vince), screenshots of BuyAuto or simple diagrams. No AI-generated people presented as customers, sellers or authors; Google names AI-generated author headshots as deceptive authorship.
2. Alt text in German describing what the image shows. Alt text counts as content for the fact-check.
3. `next/image` with width and height so nothing shifts while loading.
4. Known exception, left as it is until Vince replaces it: the AI-generated hero image on the home page (with English alt text). Don't swap or delete it in passing. (The AI-generated handshake image went with the retired AutoScout24 comparison page in PR C.)

## Known copy exceptions

No unsourced claims open. The Eintauschwert-Rechner (`src/pages/eintauschwert-rechner.tsx`, `EintauschwertRechner.tsx`) used to explain its method with dealer rules of thumb (typical margins, preparation and warranty costs, «Faustregel» percentages) that had no source; PR C dropped them from the copy, the FAQ and the tooltips, together with an «in 2 Minuten» speed claim, a «reichen in der Praxis» rule for the number of comparables and a sentence on what «viele Händler» do. The FAQ now describes what the tool does (the median of the comparables; a range with fewer than 3 of them or widely spread prices). The calculator's prefilled inputs stay as starting values to overwrite and are never called typical or branchenüblich.

Older checker findings on that page are left for a copy PR of their own: «gratis»/«kostenlos» more than once, the title length (title and H1 stayed as they were in PR C), and the km example in the method section, which types the tool's own adjustment (`KM_ADJUST_PCT_PER_10K`) and a CHF example instead of printing them from the constant.
