# Content Briefs — Ranking #1 for "Leasingübernahme" in Switzerland

**Created:** 2026-06-09 · **Owner:** Vincent · **Domain:** https://www.buyauto.ch (de-CH)

These briefs are the writing/build plan behind the SEO audit. They target the highest-opportunity keywords in the Leasingübernahme cluster, exploiting the one structural gap in the market: **no large real-listings marketplace owns this category** — it's held by small portals (LeasingPlatz, LeaseTransfer), bait-and-switch subscription content (Carvolution, Carify), and the German `leasingmarkt.de` (EUR, German law — not Swiss). BuyAuto has the content depth *and* real inventory to take both the informational and transactional layers.

**Strategic principle for the head term:** win mixed-intent queries with a **hybrid hub** (concise guide + FAQ schema + live listings on one URL), not a pure guide or a pure listing wall.

> Keyword demand/difficulty are estimates (no paid SEO tool connected). Validate the Tier-1 + brand terms in Google Keyword Planner / Search Console before committing budget. Char counts: title ≤ 60, meta description ≤ 160.

---

## Quick-reference content calendar

| # | Page | Target keyword | Status | Priority | Effort |
|---|------|---------------|--------|----------|--------|
| 1 | `/leasinguebernahme` → **hybrid hub** | Leasingübernahme | Exists, upgrade | P0 | Half-day |
| 2 | `/suche?dealType=lease_takeover` | Leasingübernahme Angebote / Plattform | **Now indexable** ✅ | P0 | 1–2h copy |
| 3 | `/leasinguebernahme/[marke]` | Leasingübernahme Tesla/BMW/Audi… | **Template live** ✅ | P0 | Scale copy |
| 4 | `/leasing-aufloesen` (new) | Leasing auflösen / vorzeitig kündigen | New | P1 | Half-day |
| 5 | `/leasing-abgeben-schweiz` | Leasing abgeben / loswerden | Exists, strengthen | P1 | 2–3h |
| 6 | `/leasinguebernahme-kosten` + calculator | Was kostet eine Leasingübernahme | Exists, add tool | P1 | Multi-day |
| 7 | `/leasinguebernahme/[kanton]` (new pattern) | Leasingübernahme Zürich/Bern/… | New | P2 | Multi-day |
| 8 | `/leasing-rueckgabe` (new) | Leasing Rückgabe worauf achten | New | P2 | Half-day |
| 9 | `/reprise-de-leasing` (new, FR) | reprise de leasing Suisse | New | P2 | Multi-day |

---

## Brief 1 — Pillar hub upgrade: "Leasingübernahme"

- **URL:** `/leasinguebernahme` (existing pillar — evolve into a hybrid hub)
- **Primary keyword:** Leasingübernahme · **Secondary:** Leasing übernehmen, Leasingübernahme Schweiz, Leasing Transfer
- **Intent:** Mixed (informational + commercial + transactional) — the page must satisfy all three.
- **Title tag (58):** `Leasingübernahme Schweiz – Leitfaden & Angebote | BuyAuto`
- **Meta description (151):** `Leasingübernahme in der Schweiz: So übernimmst du einen laufenden Leasingvertrag ohne hohe Anzahlung. Ratgeber, Kosten & aktuelle Angebote auf BuyAuto.`
- **H1:** `Leasingübernahme in der Schweiz` (keep keyword-first)
- **What to change (the upgrade):** The page is currently a strong guide (~3k words) but is pure editorial. Add a **live listings block** ("Aktuelle Leasingübernahmen") pulling the newest `lease_takeover` listings (SSR, e.g. 6–9 cards) with a CTA to `/suche?dealType=lease_takeover`. This converts the head-term page from "guide only" to the hybrid format Google rewards for this query — and is exactly what Carvolution/AutoScout lack.
- **Outline (H2/H3):**
  - Was ist eine Leasingübernahme? (definition; Leasingübernahme = Leasing Transfer)
  - **Aktuelle Leasingübernahme-Angebote** ← NEW live listings block
  - Wie funktioniert eine Leasingübernahme? (5 Schritte)
  - Voraussetzungen (Wohnsitz CH, Bonität, Zustimmung Leasinggeber)
  - Was kostet eine Leasingübernahme? → link to cost page
  - Vorteile & Risiken
  - Leasing übernehmen vs. Leasing abgeben (beide Seiten)
  - Rechtliche Hinweise (CH-spezifisch)
  - FAQ
- **FAQ / schema:** Keep `Article` + the new `FAQPage` (already added). When the listings block ships, also emit `ItemList`. ✅ FAQPage is live.
- **Internal links:** → cost page, → `/leasingvertrag-uebertragen`, → brand pages (Tesla/BMW/Audi), → `/suche?dealType=lease_takeover`, → `/leasing-abgeben-schweiz`.
- **Word count:** 2,800–3,500 (keep depth; don't dilute).
- **Priority/Effort:** P0 / Half-day (the listings block is the only real build).

---

## Brief 2 — Leasingübernahme listings (category page)

- **URL:** `/suche?dealType=lease_takeover` (**now indexable + SSR'd + self-canonical** — shipped)
- **Primary keyword:** Leasingübernahme Angebote · **Secondary:** Leasingübernahme Plattform Schweiz, Leasing übernehmen Inserate
- **Intent:** Transactional. This is the page that beats guide-only competitors.
- **Title (in code, dynamic):** `Leasingübernahme – N Fahrzeuge gefunden | BuyAuto Schweiz` ✅
- **H1 (in code):** `Leasingübernahme – Fahrzeuge in der Schweiz` ✅
- **What to add:** A short (120–180 word) **intro copy block above the grid** so the page isn't pure listings — give Google indexable context. Suggested copy:
  > "Übernimm einen laufenden Leasingvertrag in der Schweiz – ohne hohe Anzahlung und mit kurzer Restlaufzeit. Auf BuyAuto findest du geprüfte Leasingübernahme-Angebote von Privatpersonen und Garagen. Filtere nach Marke, Kanton, Restlaufzeit und Monatsrate und übernimm dein Wunschauto in wenigen Tagen."
  Add 4–5 internal links beneath it (pillar guide, cost page, top brand pages).
- **Schema:** `ItemList` of `Car` + monthly `Offer`/`UnitPriceSpecification` ✅ (already emitted, deal-type-correct).
- **Priority/Effort:** P0 / 1–2h (intro copy + link row).

---

## Brief 3 — Brand landing pages: "Leasingübernahme [Marke]"

- **URL pattern:** `/leasinguebernahme/[marke]` (**template live** — Tesla, BMW, Audi, Mercedes-Benz, VW, Porsche, Volvo, Toyota)
- **Primary keyword:** Leasingübernahme Tesla / BMW / Audi / Mercedes … · **Secondary:** Auto Leasing übernehmen [Marke]
- **Intent:** Transactional. **No competitor has brand pages** — this is the widest-open gap.
- **Title (in code):** `Leasingübernahme [Marke] – Angebote in der Schweiz | BuyAuto` ✅
- **H1:** `Leasingübernahme [Marke] in der Schweiz` ✅
- **Already built:** SSR listings grid, breadcrumb + FAQ schema, ItemList when inventory exists, auto-noindex when a brand has 0 listings (prevents thin pages), sitemap includes only brands with live inventory.
- **To scale / improve:**
  1. **Per-brand intro copy** is in `src/lib/buyauto/leasingBrands.ts` — refine each to be genuinely brand-specific (charging/EV angle for Tesla, model breadth for VW, etc.).
  2. **Add more brands** to the registry as inventory grows (Cupra, Škoda, Hyundai, Kia, Mini, BMW i-series). One registry entry = one new SEO page.
  3. Consider **model-level pages** later (`/leasinguebernahme/tesla/model-3`) once brand pages prove out — only where recurring inventory exists.
- **FAQ (3, brand-injected, already rendered + schema'd):** Wie funktioniert…/ Was kostet…/ Welche Modelle… .
- **Internal links:** breadcrumb → pillar; footer of page → cost, transfer, all takeovers. ✅
- **Priority/Effort:** P0 / ongoing copy polish.

---

## Brief 4 — Exit-funnel page: "Leasing auflösen / vorzeitig kündigen" (NEW)

- **URL:** `/leasing-aufloesen` (new)
- **Primary keyword:** Leasing auflösen · **Secondary:** Leasing vorzeitig kündigen, Leasing kündigen Kosten/Strafe, aus Leasingvertrag aussteigen
- **Intent:** Informational → high-urgency. These users are in pain (need out of a contract). **Takeover is the cheaper answer** → convert them into *supply-side listings* (your inventory pipeline).
- **Title (57):** `Leasing auflösen oder vorzeitig kündigen – Schweiz | BuyAuto`
- **Meta description (156):** `Leasing vorzeitig auflösen in der Schweiz? Was eine Kündigung kostet, welche Strafen drohen – und warum die Leasingübernahme oft die günstigere Lösung ist.`
- **H1:** `Leasing auflösen oder vorzeitig kündigen – die Optionen in der Schweiz`
- **Angle:** Honest comparison of exit options (Rückgabe, Kündigung mit Strafe, Verkauf, **Übernahme**). Lead the user to "lass jemanden dein Leasing übernehmen" as the no-loss route. Cite the SRF "Leasing-Schuldenfalle" angle and that penalty clauses can be contested — strong trust content.
- **Outline:** Kann man ein Leasing vorzeitig auflösen? · Welche Kosten/Strafen entstehen? · Die 4 Auswege im Vergleich (Tabelle) · Warum Leasingübernahme meist am günstigsten ist · So gibst du dein Leasing ab (Schritt-für-Schritt) · FAQ.
- **FAQ / schema:** `Article` + `FAQPage` (Kann man vorzeitig kündigen? / Was kostet die Auflösung? / Ist die Strafe rechtens? / Geht das ohne Kosten via Übernahme?).
- **Internal links:** → `/leasing-abgeben-schweiz` (primary CTA: "Leasing abgeben"), → `/inserat-erstellen`, → pillar, → cost page.
- **Word count:** 1,500–2,200. **Priority/Effort:** P1 / Half-day.

---

## Brief 5 — Supply-side strengthen: "Leasing abgeben / loswerden"

- **URL:** `/leasing-abgeben-schweiz` (existing — strengthen)
- **Primary keyword:** Leasing abgeben · **Secondary:** Leasing loswerden, Leasingvertrag abgeben, Leasing übergeben
- **Intent:** Transactional (seller side). LeasingPlatz ranks here ("Leasing loswerden") — beatable.
- **Title (54):** `Leasing abgeben in der Schweiz – ohne Verlust | BuyAuto`
- **Meta description (150):** `Leasing abgeben statt teuer kündigen: Inseriere deinen Leasingvertrag auf BuyAuto und finde einen Übernehmer. So funktioniert die Leasingübergabe in der Schweiz.`
- **H1:** `Leasing abgeben in der Schweiz – ohne Verlust`
- **To add:** Add `FAQPage` schema (it currently has none if not already — verify). Add a clear "Jetzt Leasing inserieren" CTA → `/inserat-erstellen`. Add a 3-step "So gibst du dein Leasing ab" with screenshots.
- **Internal links:** ← from `/leasing-aufloesen` (Brief 4), → pillar, → cost page.
- **Priority/Effort:** P1 / 2–3h.

---

## Brief 6 — Cost page + interactive calculator

- **URL:** `/leasinguebernahme-kosten` (existing — add a tool)
- **Primary keyword:** Was kostet eine Leasingübernahme · **Secondary:** Leasingübernahme Gebühren, Transfergebühr, Ummeldung Kosten
- **Intent:** Informational (featured-snippet target).
- **Title (57):** `Leasingübernahme Kosten Schweiz – alle Gebühren | BuyAuto`
- **The edge:** **No competitor has an interactive cost calculator.** Build one: inputs = Monatsrate, Restlaufzeit, Anzahlung übernommen?, Kanton (→ Ummeldung), Expertise ja/nein → output: einmalige Einstiegskosten + Gesamtkosten über Restlaufzeit. Strong link-magnet + dwell time + snippet bait.
- **Schema:** `Article` + `FAQPage` ✅ already added. Keep cost tables visible (snippet source).
- **Internal links:** → pillar, → `/leasing-aufloesen` (cost-of-cancelling comparison), → listings.
- **Priority/Effort:** P1 / Multi-day (calculator build).

---

## Brief 7 — Canton/region pages: "Leasingübernahme [Kanton]" (NEW pattern)

- **URL pattern:** `/leasinguebernahme/zuerich`, `/leasinguebernahme/bern`, `/leasinguebernahme/basel`, `/leasinguebernahme/genf` …
- **Primary keyword:** Leasingübernahme Zürich / Bern / Basel · **Secondary:** Leasing übernehmen [Stadt/Kanton]
- **Intent:** Transactional, geo. Thin competition (most rankers are nationwide).
- **Title:** `Leasingübernahme Zürich – Angebote in der Region | BuyAuto`
- **H1:** `Leasingübernahme in Zürich`
- **Build note:** Mirror the brand-page template (`searchListings({ dealType:'lease_takeover', canton:['ZH'] })`), same auto-noindex-when-empty guard. **Only generate cantons where inventory recurs** — otherwise thin-content risk. Start with ZH, BE, BS, AG, VD, GE, TI.
- **Schema:** Breadcrumb + FAQ + ItemList (when inventory).
- **Priority/Effort:** P2 / Multi-day (after brand pages prove out).

---

## Brief 8 — "Leasing Rückgabe – worauf achten" (NEW)

- **URL:** `/leasing-rueckgabe` (new)
- **Primary keyword:** Leasing Rückgabe · **Secondary:** Leasing zurückgeben worauf achten, Rückgabeprotokoll, Mehrkilometer/Schäden
- **Intent:** Informational (large volume; Zurich/AXA/TCS/gowago rank).
- **Title (55):** `Leasing-Rückgabe Schweiz – worauf du achten musst | BuyAuto`
- **Meta description (152):** `Leasing-Auto zurückgeben: Rückgabeprotokoll, Mehrkilometer, Schäden und versteckte Kosten. So vermeidest du Nachzahlungen – oder gibst dein Leasing einfach ab.`
- **Angle:** Informational guide that cross-links to the cheaper alternative: "Rückgabe-Stress vermeiden → Leasing abgeben/übernehmen lassen."
- **Schema:** `Article` + `FAQPage`. **Internal links:** → `/leasing-abgeben-schweiz`, → `/leasing-aufloesen`, → pillar.
- **Priority/Effort:** P2 / Half-day.

---

## Brief 9 — French pillar: "reprise de leasing" (NEW, CH-FR)

- **URL:** `/reprise-de-leasing` (new; add `hreflang` pairing with `/leasinguebernahme`)
- **Primary keyword:** reprise de leasing Suisse · **Secondary:** reprendre un leasing, transfert de leasing, reprise de leasing Tesla/BMW
- **Intent:** Mixed. CH-FR is under-served — only LeaseTransfer is multilingual and its FR is thin.
- **Title (56):** `Reprise de leasing en Suisse – guide & annonces | BuyAuto`
- **Meta description (154):** `Reprise de leasing en Suisse : reprenez un contrat de leasing en cours sans gros acompte. Guide, coûts et annonces vérifiées de particuliers et garages.`
- **H1:** `Reprise de leasing en Suisse`
- **Build note:** Requires a real i18n decision (the site is currently de-CH only, no `next.config` i18n, no hreflang). Minimum viable: a standalone localized page + `<link rel="alternate" hreflang="fr-CH">` ↔ `de-CH` pairing on both pages. Localize fully (CHF, cantonal authorities, Swiss banks) — don't machine-translate.
- **Schema:** Article + FAQPage (FR). **Priority/Effort:** P2 / Multi-day. (IT "subentro leasing" is a later, smaller follow-up.)

---

## Internal-linking map (hub-and-spoke)

```
/leasinguebernahme  (HUB)
 ├── /suche?dealType=lease_takeover      (listings)
 ├── /leasinguebernahme/[marke]          (brand spokes → back to hub + listings)
 ├── /leasinguebernahme/[kanton]         (geo spokes)
 ├── /leasinguebernahme-kosten           (cost + calculator)
 ├── /leasingvertrag-uebertragen         (process)
 ├── /leasing-abgeben-schweiz   ←── /leasing-aufloesen  ←── /leasing-rueckgabe   (exit funnel → supply)
 └── /reprise-de-leasing (fr-CH)         (hreflang ↔ hub)
```
Every spoke links **up** to the hub and **across** to the listings page. The exit-funnel pages (Rückgabe → auflösen → abgeben) all funnel toward "list your lease," which feeds inventory.

## Notes
- Keep `dateModified` in Article schema driven by real edit dates (audit flagged the hardcoded `2026-06-08`).
- Add `FAQPage` schema to any new content page from day one (it's the cheapest SERP-feature win and no competitor uses it).
- Validate every page in Google's Rich Results Test after publish; submit to Search Console.
