# What makes a high-converting paid-traffic landing page

Research + applied redesign for `/leasing-abgeben-schweiz`, our Google Ads conversion page.

---

## 1. The problem, measured

The complaint was "white space and a wall of text." That is exactly what the CSS produced. Measured
on the live layout at 1440×800 (≈700px actually visible after browser chrome):

| Element | Cumulative offset from top |
|---|---|
| Sticky site header (`h-20`) | 80px |
| Breadcrumb block (`pt-6`) | ~135px |
| Hero padding (`pt-16` + `py-20`) | ~280px |
| "Der ultimative Guide" badge | ~340px |
| H1 (`lg:text-7xl`, 2 lines) | ~520px |
| Intro paragraph (`text-2xl`, 62 words, 6 lines) | ~755px |
| **Primary CTA** | **~790px — below the fold** |
| Quick stats | ~900px |

Three compounding failures:

1. **~280px of pure padding before a single word.** Roughly 40% of the first screen was spent on
   spacing before content started.
2. **Zero CTA above the fold.** The visitor's entire first screen was a badge, a headline, and a
   62-word paragraph. Nothing to click, nothing to do.
3. **The "white space" was a 2.5 MB image.** The hero loaded
   `20251209_0003_Handshake_in_Zurich...png` (2.5 MB) with `priority`, then covered it with
   `bg-gradient-to-r from-white via-white/95 to-white/80` plus a second white gradient on top. The
   image was the LCP element *and* was ~95% erased by white overlays. We paid the load time and got
   the appearance of an empty page.

Secondary issues: the interactive cost calculator — the single strongest asset on the page — sat
~1000px down; the intro paragraph answered a research question ("what are my three options?") rather
than making an offer; and the hero showed two competing CTAs.

---

## 2. What the research says

### Attention collapses at the fold — but the fold is a filter, not a wall

Nielsen Norman Group's eye-tracking work found content above the fold gets **57% of viewing time**,
the second screenful about **17%**, and that users spend **>65% of their time in the top 40%** of a
page. The pattern was unchanged between their 2010 and 2018 studies. Critically, people *do* scroll —
but only when "the initially viewable information makes them believe that it will be worth their
time." The first screen's job is to earn the scroll, not to contain everything.

Implication: the first screen must carry the offer and the action. Everything else can go below.

### For Google Ads specifically: message match and a single visible CTA

The consensus checklist for paid-search landing pages is a headline that mirrors the ad's promise and
contains the keyword, a one-sentence subheadline, one visually distinct CTA, and at least one trust
signal — all above the fold. Strong ad-to-page relevance with a value proposition readable in five
seconds is reported to lift conversions **20–50%** while also improving Quality Score.

Our ad keyword is "leasing abgeben" — high commercial intent, bottom-of-funnel. That traffic already
knows what it wants; it needs the offer, not an education.

### Attention ratio: every extra link leaks budget

Unbounce frames this as **attention ratio** — links on the page divided by conversion goals, ideal
1:1. Their case study cut a page from 10:1 to 1:1 and saw a **31% lift**. HubSpot's own testing found
removing navigation lifted mid-funnel conversions **16–28%**. The nuance that matters for us:
navigation is defensible on top-of-funnel research pages, but on high-intent bottom-funnel keywords
removing competing links consistently helps.

Our page had the full site nav (Inserat erstellen, Fahrzeuge suchen ▾, Preise, account), breadcrumbs,
and seven in-page CTAs of which several pointed away from the conversion.

### Speed is a conversion input, not a technical nicety

Pages loading in 1 second convert roughly **3× better** than pages loading in 5 seconds; **53% of
mobile users abandon** above 3 seconds. A 2.5 MB decorative LCP image is a direct conversion cost.

### Interaction beats reading

Multi-step and interactive elements outperform static ones — multi-step forms are reported at **86%
higher conversion** than single-step equivalents, via smaller initial asks and sunk-cost commitment.
The mechanism is *micro-commitment*: a low-friction first interaction that makes the visitor a
participant rather than a reader.

We already own the perfect instrument for this — the exit-cost calculator. It personalises the offer
instantly ("these are **your** CHF 10'800") without asking for a single piece of personal data. It
was buried below three screens.

### Social proof works, and works best next to the CTA

Testimonials lift conversions ~34%; social proof placed *below the CTA* is reported at up to +68%.
Hubstaff's test of logos + testimonial directly under the CTA went from 6.89% → 10.95% (**+59%**).
70% of shoppers look for trust indicators before converting.

Constraint we must respect: we have no testimonials and a prior commit deliberately softened
unsubstantiated claims. So the only social proof we may use is **real and verifiable** — the live
count of lease-takeover listings from the database, and the actual listing cards.

### Benchmarks, for calibration

Median landing page conversion sits around **4.3–6.6%** depending on the dataset; lead-gen pages for
consumer services run higher (home services ~8.5%). Cold PPC traffic typically converts at **2–5%**.
That's the band to judge this page against — not an abstract "good."

---

## 3. The layout that follows from this

**Principle: the first screen is an offer, not an article. Everything decorative is subordinate to
the CTA's position.**

### Above the fold — two-column hero

| Left (the offer) | Right (the interaction) |
|---|---|
| Live-proof eyebrow (real listing count) | Compact exit-cost calculator |
| H1 with the ad keyword + the differentiator | Two sliders (Restlaufzeit, Monatsrate) |
| **One** sentence subhead carrying the price anchor | The number: "Restraten, die dein Nachfolger übernimmt" |
| Primary CTA | Übernahme ~CHF 350 vs. Kündigung "mehrere tausend" |
| Friction-killing microcopy | Second CTA |
| Three factual trust points | Guide-value disclaimer |

The calculator replaces the hero image. It is the visual weight *and* the micro-commitment — moving a
slider is a two-second interaction that turns an abstract claim into the visitor's own number, right
next to the button.

Measured result (production build, Chromium):

| Viewport | Primary CTA position | Fold |
|---|---|---|
| Desktop 1440×900 | **543px** | 900px ✅ |
| Desktop 1440×800 | ~543px | 800px ✅ |
| Mobile 390×844 | **~470px** | 844px ✅ |

On mobile the headline, subhead, CTA, microcopy and all three trust points fit in the first screen.

### Below the fold — decision → mechanism → proof → objections → close

1. **Deine 3 Optionen im Vergleich** — the decision the visitor came to make, so it comes first. The
   old 62-word hero paragraph lives here as the section intro, where an explainer belongs.
2. **So funktioniert's** — 5 steps in one horizontal band instead of five stacked full-width cards
   (was ~1400px of scroll, now ~300px).
3. **Live-Inserate** — real current listings, our only honest social proof, immediately followed by a CTA.
4. **Warum Leasing abgeben?** — topical coverage retained, compressed from six large cards to a
   compact grid.
5. **FAQ** — last objections before the close. Now also emits FAQPage JSON-LD from the same data
   object that renders the accordion, so schema can never drift from visible copy.
6. **Final CTA** — one action. The competing "Mehr erfahren" button became a text link.

### Copy changes and why

| Before | After | Rationale |
|---|---|---|
| H1 "Leasing abgeben **ohne Stress.**" | "Leasing abgeben – **ohne teure Kündigung.**" | Keyword match kept; vague benefit replaced with the concrete differentiator |
| 62-word, 3-option paragraph | 1 sentence, 28 words, carrying the CHF 350 anchor | 5-second value prop; the explainer moved to the comparison section |
| — | "Gratis · 60 Tage online · Login erst beim Veröffentlichen" | Kills the three biggest hesitations. All three verifiable: `standard` plan is CHF 0 / 60 days, and the wizard genuinely defers login to publish |
| "Der ultimative Guide 2026 · Aktualisiert am …" | Live listing count (≥5) or a neutral fallback | The guide badge sells an article; the count sells a marketplace. Falls back gracefully on low inventory so it never reads as weak |

### Technical / measurement changes

- **Removed the 2.5 MB hero PNG** from the critical path (still used by two other pages, so the file
  stays). Replaced with a CSS gradient. Removes the LCP payload *and* the "empty white space" look
  that prompted this work.
- **Every CTA now fires `trackEvent("cta_click", { cta_location })`** — hero, calculator,
  options_compare, process, live_listings, sticky_bar, final. Without this there is no way to know
  which slot earns the conversion.
- **Sticky bar triggers at 320px** instead of 600px, so it takes over right as the hero CTA leaves.
- **Fixed nested `<main>`** — the page rendered `<main>` inside `MainLayout`'s `<main>`, which is
  invalid HTML.
- **FAQPage JSON-LD added**, driven by the same `FAQS` constant as the accordion.

---

## 4. What to test next

The layout is now instrumented; these are the experiments it enables, in rough expected-value order.

1. **Hero CTA destination.** Today it jumps to the full wizard. Test a single-question first step in
   the hero itself ("Welche Marke gibst du ab?") that hands off to the wizard prefilled. This is the
   micro-commitment pattern with the largest reported lift, and the wizard already supports guest
   drafts. Requires adding prefill query-param support back to `ListingWizard` (the old
   `?deal_type=` deep link was removed).
2. **Attention ratio.** Test a stripped header for `gclid`-bearing sessions — logo only, no nav
   dropdowns. Research points at 16–28% for high-intent traffic; we are currently at ~12 competing
   links.
3. **Eyebrow proof.** Live count vs. a cumulative "X Leasings bereits übergeben" figure, once we can
   substantiate one from `listings.published_at` / sold transitions.
4. **Calculator defaults.** Currently 24 months × CHF 450 = CHF 10'800. Test whether a higher default
   anchor produces more starts.
5. **Real social proof.** The single largest missing lever. One verifiable testimonial from a
   completed takeover, placed directly under the hero CTA, is the highest-leverage content we do not
   yet have.

---

## Sources

- [Scrolling and Attention — Nielsen Norman Group](https://www.nngroup.com/articles/scrolling-and-attention/) · [original research study](https://www.nngroup.com/articles/scrolling-and-attention-original-research/)
- [Google Ads Landing Page Best Practices 2026 — ConversionStudio](https://conversion.studio/blog/google-ads-landing-page)
- [Google Ads Landing Page Best Practices: 2026 Checklist — Foundry CRO](https://foundrycro.com/blog/google-ads-landing-page-best-practices-2026/)
- [Landing Pages & Quality Score — Omologist](https://omologist.com/google-ads/landing-pages-quality-score/)
- [Should You Remove Navigation From Your Landing Pages? — HubSpot](https://blog.hubspot.com/marketing/landing-page-navigation-ht)
- [5 CRO best practices to boost landing page conversions — Unbounce](https://unbounce.com/conversion-rate-optimization/cro-best-practices/)
- [Should Landing Pages Have Navigation? What the Data Says — SeedProd](https://www.seedprod.com/landing-page-navigation/)
- [Landing Page Conversion Benchmarks 2026 — Leadpages](https://leadpages.com/blog/landing-page-conversion-benchmarks-2026)
- [Landing Page Conversion Rate Benchmarks by Industry 2026 — LanderLab](https://landerlab.io/blog/landing-page-conversion-rate)
- [17 Data-Backed Landing Page Form Elements That Convert — KlientBoost](https://www.klientboost.com/landing-pages/landing-page-forms/)
- [High-converting lead generation forms — Venture Harbour](https://ventureharbour.com/high-converting-lead-generation-forms/)
- [30 Landing Page Trust Signal Impact on Conversion Statistics — Flint](https://www.flint.com/articles/landing-page-trust-signal-conversion-statistics)
- [Trust Signals That Convert: A Funnel Placement Framework — Digital Applied](https://www.digitalapplied.com/blog/social-proof-trust-signals-2026-conversion-placement-framework)
- [The Hero Section Formula — Atticus Li](https://atticusli.com/blog/posts/hero-section-formula-headline-subhead-cta-visual-order/)
- [Best CTA Placement Strategies for 2026 Landing Pages — LandingPageFlow](https://www.landingpageflow.com/post/best-cta-placement-strategies-for-landing-pages)
