# Garagen-Pricing: Analyse, Research & neues Packaging

Stand: Juli 2026. Grundlage für den Umbau der Garagen-Pakete in diesem Branch.

> **Update 14.8.2026:** Die Stückzahlen aus Abschnitt 4 wurden nachjustiert
> (Growth/Pro waren gegenüber der Privatseite und den Budget-Konkurrenten zu
> grosszügig) — aktueller Stand und Begründung in
> `GARAGE_PRICING_REBALANCE_AUG_2026.md`.

---

## 1. Ausgangslage

| Paket | Preis/Mt | Inserate | Premium/Mt | Features |
|---|---|---|---|---|
| Starter | CHF 149 | 15 | 1 | **alle** |
| Growth | CHF 349 | 50 | 5 | **alle** |
| Pro | CHF 599 | 100 | 10 | **alle** |

Alle sieben Kernfeatures (Profilseite, Inserate, VIN-PreFill, Leasing-Rechner,
Deal-Chat, Eintauschwert-Rechner mit *unbegrenzten* Suchen, Statistiken) waren
in jedem Paket enthalten. Einziger Unterschied: Stückzahlen.

Relevant für die Risikobewertung: **aktuell null zahlende Garagen** (0 aktive
Subscriptions, 0 Trials, 3 Garagen-Accounts). Ein Repackaging kostet also keine
Migration und keinen Bestandskunden — jetzt ist der billigste Zeitpunkt dafür.

---

## 2. Wettbewerb Schweiz

Zahlen aus öffentlich zugänglichen Quellen (die B2B-Preisseiten von AutoScout24
sind nicht frei abrufbar; die Werte stammen aus Branchenberichten und
Vergleichsartikeln).

| Plattform | Preis für Händler | Pro Inserat/Mt |
|---|---|---|
| **AutoScout24** | ~CHF 560/Mt für bis 25 Fahrzeuge; real belegter Fall: CHF 1'847/Mt bei 22 Inseraten; Beispiel "Professional Plus 50": CHF 1'549.90/Mt | **CHF 22–84** |
| **tutti.ch AutoPRO M** | CHF 239/Mt für 25 aktive Inserate | CHF 9.56 |
| **Autolina** | CHF 199/Mt unbegrenzt (bzw. ~CHF 196 bis 30 Fahrzeuge) | CHF 2–7 |
| **Ricardo** | keine Abo-Gebühr, 8–12% Verkaufsgebühr, max. CHF 290 | erfolgsabhängig |
| **Facebook Marketplace** | gratis | 0 |
| **BuyAuto neu** | CHF 149 / 349 / 599 | **CHF 3.99–9.93** |

Drei Dinge fallen auf:

1. **AutoScout24 ist der Preisanker, nicht der Preisvergleich.** Deren Modell hat
   einen "Car Value Factor" von 0.8–1.2 — der Preis hängt am durchschnittlichen
   Fahrzeugwert im Bestand. Genau daran reibt sich die Branche: der AGVS titelt
   "Wir wünschen uns Wettbewerb und faire Preise" und schreibt, die
   Preiserhöhungen seien für Garagisten schwer nachvollziehbar. Gleichzeitig
   liefert AS24 die beste Lead-Qualität — deshalb zahlen sie trotzdem.
2. **Autolina ist die Preisuntergrenze.** CHF 199 unbegrenzt. Wer BuyAuto nur
   über "Inserate pro Franken" vergleicht, verliert gegen Autolina — bei
   schwächerer Lead-Qualität.
3. **Nach oben ist enorm Luft.** Zwischen CHF 599 und CHF 1'549 liegt der ganze
   Markt, den AS24 heute allein bedient.

**Fazit zur Frage "bin ich zu grosszügig?": beim Preis nein, beim Packaging ja.**
149/349/599 sind gegenüber AS24 ein 3- bis 5-facher Undercut und gegenüber tutti
konkurrenzfähig. Zu grosszügig war, *was* in jedem Paket steckte.

---

## 3. Pricing-Psychologie: was die Forschung sagt

**Drei Stufen sind richtig.** Dreistufige Pricing-Pages konvertieren rund 1.4×
so gut wie zweistufige; vier und mehr Stufen konvertieren schlechter. Der
*Center-Stage-Effekt* zieht Käufer zur mittleren Option, weil sie sie für die
populärste halten. → Growth bleibt die visuell hervorgehobene Mitte.

**Feature-Gating ist kein Selbstzweck, aber Fences sind nötig.** Die klare
Aussage aus der aktuellen SaaS-Pricing-Literatur: ohne Fences selektieren sich
grosse Kunden in das billigste Paket und man verliert die Fähigkeit, Wert
abzuschöpfen. Die praktikable Entscheidungsregel: *Was ein Kunde braucht, um zum
ersten Erfolgserlebnis zu kommen, gehört ins Einstiegspaket. Was erst Wert hat,
wenn ein Workflow schon läuft, gehört nach oben.*

→ Inserieren, VIN-PreFill, Leasing-Rechner, Deal-Chat, Profilseite = First
Value, bleiben überall drin. Website-Widget, personalisiertes Onboarding, grosse
Bewertungs-Kontingente = Workflow-Features, wandern nach oben.

**Value Metric statt reiner Feature-Liste.** Der stärkste Hebel ist eine
Metrik, die mit dem Nutzen mitwächst. BuyAuto hat drei davon, und nur eine war
bisher bepreist:

| Metrik | Kostet uns | War bepreist |
|---|---|---|
| Aktive Inserate | ~nichts | ja |
| Premium-Boosts | Sichtbarkeits-Inventar | ja |
| **Eintauschwert-Suchen** | **Firecrawl-Credits, echte COGS** | **nein — unbegrenzt ab CHF 149** |
| Inventar-Upload | Menschenarbeit | nein — unbegrenzt |

**Charm Pricing bleibt.** 149/349/599 nutzen den Left-Digit-Effekt (1xx/3xx/5xx)
und sind im B2B-SMB-Bereich Standard. Kein Grund, daran zu drehen.

**Preis zerlegen.** "CHF 599" wirkt gross, "CHF 3.99 pro Fahrzeug und Monat"
klein. Beides steht jetzt auf der Karte.

**Risk Reversal gehört neben den CTA, nicht in den Footer.** Für einen
Garagisten sind das genau drei Einwände: Vertragslaufzeit, versteckte
Setup-Kosten, wertabhängige Preise. Alle drei beantwortet die Trust-Row.

---

## 4. Das neue Packaging

Preise unverändert (die Stripe-Preise bleiben damit gültig — kein Migrationsrisiko).
Verändert wurde, was drin ist.

| | **Starter** CHF 149 | **Growth** CHF 349 ★ | **Pro** CHF 599 |
|---|---|---|---|
| Für wen | Kleine Garagen, ≤15 Fahrzeuge | Laufendes Occasionsgeschäft | Grosse Bestände, mehrere Standorte |
| Aktive Inserate | 15 | **60** (war 50) | **150** (war 100) |
| Premium-Boosts/Mt | 1 | **6** (war 5) | **15** (war 10) |
| Eintauschwert-Bewertungen/Mt | **25** | **100** | **400** |
| Website-Tools (Widget) | **–** | ✓ | ✓ |
| Personalisiertes Onboarding & Inventar-Upload | **–** | **–** | bis 150 Fahrzeuge |
| Support | E-Mail | Priorisiert | Persönlicher Ansprechpartner |
| Profilseite, VIN-PreFill, Leasing-Rechner, Deal-Chat, Statistiken | ✓ | ✓ | ✓ |

### Warum genau so

**Inserate-Limits rauf, teure Dinge fencen.** Listing-Kapazität kostet uns
nichts — dort grosszügig zu sein macht das Angebot attraktiver und schliesst die
Lücke zu Autolina. Was uns tatsächlich Geld kostet (Firecrawl-Suchen) und was
Menschenarbeit ist (Inventar-Upload), ist jetzt bepreist. Das ist genau die
umgekehrte Verteilung von vorher.

**Premium-Ladder wird überproportional.** 1 → 6 → 15 statt 1 → 5 → 10. Growth
enthält Premium im Wert von CHF 180/Mt bei CHF 349 Paketpreis, Pro CHF 450 bei
CHF 599. Das ist die Zahl, die den Upgrade rechtfertigt.

**Jede Stufe hat einen sichtbaren Grund zum Upgraden.** Starter fehlen zwei
Dinge explizit (Website-Tools, persönliches Onboarding), Growth eines
(persönliches Onboarding) — mit grauem X auf der Karte, genau wie beim privaten
Standard-Plan. Vorher gab es für eine 12-Auto-Garage keinen einzigen Grund, je
zu Growth zu wechseln.

**Pro wird zum Anker — und bekommt eine eigene Fähigkeit.** Das
personalisierte Onboarding (wir richten die Garage ein und laden den Bestand
hoch) liegt ausschliesslich in Pro. Vorher unterschied sich Pro von Growth nur
durch Stückzahlen und Support-Level; jetzt gibt es einen Grund zum Upgrade, der
nicht "mehr vom Gleichen" heisst. Gleichzeitig ist die Menschenarbeit damit auf
das eine Paket begrenzt, dessen Preis sie deckt. Pro liegt trotzdem noch bei
rund einem Drittel dessen, was AS24 für vergleichbares Volumen verlangt.

**Was ich bewusst *nicht* gemacht habe:** keine Statistiken oder Kernfunktionen
aus Starter herausgenommen. Ein kastriertes Einstiegspaket verkauft schlechter
und ist gegen Facebook Marketplace und Autolina der falsche Zug — der Wedge muss
funktionieren.

---

## 5. Präsentation

Übernommen aus der Private-Pricing-Seite und auf **alle** Garagen-Preisflächen
angewendet:

- **Gleiche Kartensprache** — `rounded-3xl`, Backdrop-Blur, Marken-Gold-Halo und
  "Beliebt"-Badge auf der Empfehlung.
- **"Für wen"-Zeile pro Paket** statt generischer Feature-Stichworte.
- **Zwei Kennzahlen-Kacheln** (Inserate / Premium) — die Leiter ist auf einen
  Blick lesbar.
- **Wertzeile unter dem Preis**: "Premium-Wert CHF 180/Monat inklusive · CHF 5.82
  pro Fahrzeug".
- **Graues X für Fehlendes** bei Starter — die Upgrade-Begründung muss sichtbar
  sein, nicht erschlossen werden.
- **Trust-Row direkt bei den CTAs**: monatlich kündbar / keine Setup-Gebühr /
  Fixpreis statt Fahrzeugwert.
- **Vergleichstabelle** Feature × Paket mit Tooltips, horizontal scrollbar auf
  Mobile.
- **"In jedem Paket inklusive"** bleibt — mit der ehrlichen Zeile, dass Leads
  nicht garantiert werden können.
- **150+ Anker-Block** in Schwarz für individuelle Angebote.

Bewusst *nicht* auf der Seite: konkrete Konkurrenzpreise. Die AS24-Preise sind
individuell und variabel (Car Value Factor); sie öffentlich zu zitieren wäre
angreifbar. Stattdessen wird derselbe Effekt über "Fixpreis statt Fahrzeugwert"
und die Pro-Fahrzeug-Zerlegung erzielt. Für Sales-Gespräche und Cold Outreach
sind die Zahlen aus Abschnitt 2 dagegen das stärkste Argument, das du hast.

---

## 6. Nächste Hebel (brauchen Stripe-Arbeit, deshalb nicht in diesem Branch)

1. **Jahresabo mit "2 Monate gratis" (~17%).** Der grösste Retention-Hebel
   überhaupt: Jahrespläne halten nach 12 Monaten ~92% der Kunden gegenüber ~68%
   bei Monatsplänen; unfreiwillige Churn sinkt drastisch, weil es eine statt
   zwölf Zahlungen gibt. Nötig: je ein wiederkehrender Jahres-Price in Stripe
   plus eine Spalte `stripe_price_id_yearly` — dann kann der Monat/Jahr-Toggle
   auf die Karten.
2. **Add-ons statt Paketwechsel.** Extra-Premium-Boost (CHF 30), 50 zusätzliche
   Bewertungen, +25 Inserate. Fängt die Kunden ab, die knapp über ein Limit
   laufen, aber noch nicht die nächste Stufe brauchen.
3. **14-Tage-Trial auf Growth.** Die Trial-Mechanik existiert schon
   (`dealer_admin_overrides`, Admin-Freischaltung) — sie ist nur nicht als
   Angebot auf der Seite sichtbar.
4. **Team-Zugänge** als Pro-Fence, sobald Mehrbenutzer-Garagen unterstützt sind.
5. **Preise erst erhöhen, wenn die ersten 10 Garagen zahlen.** Penetration
   zuerst, Preisdurchsetzung danach — mit Bestandsschutz für die ersten Kunden
   ("Founding Garage"-Preis), das ist gleichzeitig ein Verkaufsargument.

---

## 7. Was im Code geändert wurde

| Ort | Änderung |
|---|---|
| `src/lib/buyauto/garagePlans.ts` | **neu** — Single Source of Truth für Stufen, Limits, Copy |
| `src/components/buyauto/pricing/GaragePlanCards.tsx` | **neu** — geteilte Karten in der Private-Pricing-Sprache |
| `src/components/buyauto/pricing/GarageFeatureMatrix.tsx` | **neu** — Vergleichstabelle |
| `src/components/buyauto/pricing/GarageTrustRow.tsx` | **neu** — Risk Reversal |
| `src/components/buyauto/pricing/GaragePricingSection.tsx` | neu aufgebaut (`/preise`) |
| `src/components/buyauto/pricing/PricingHero.tsx` | Persona-abhängige USPs & Subline |
| `src/components/buyauto/pricing/pricingData.ts` | Garagen-Daten ausgelagert, Re-Export |
| `src/pages/garage-plan.tsx` | eigene Paketliste entfernt, nutzt die geteilten Karten |
| `src/components/buyauto/dashboard/GarageBillingTab.tsx` | dito, plus Kontingent-Anzeige im Status |
| `src/components/buyauto/dashboard/GarageProfileTab.tsx` | Embed-Snippet ist jetzt Growth+ |
| `src/hooks/use-dealer-plan.ts` | **neu** — löst das effektive Paket auf |
| `src/lib/buyauto/valuationQuota.ts` | Bewertungs-Kontingent pro Stufe statt pauschal 100 |
| `src/components/buyauto/calculator/EintauschwertRechner.tsx`, `src/pages/eintauschwert-rechner.tsx` | "unbegrenzt" durch die echten Kontingente ersetzt |
| `supabase/migrations/20260730200541_repackage_dealer_plans.sql` | neue Spalten + neue Werte in `dealer_plans` (angewendet) |

Drei Stellen führten vorher je eine eigene, auseinandergelaufene Paketliste
(`/preise`, `/garage-plan`, Dashboard). Jetzt gibt es genau eine.

---

## Quellen

- [Dealer OS: AutoScout24 vs. Autolina vs. Facebook Marketplace](https://www.dealeros.ch/en/blog/autoscout24-autolina-facebook-vergleich)
- [automo.ch: Extremely high costs dominate Swiss online car marketplaces](https://automo.ch/en/extremely-high-costs-dominate-swiss-car-marketplaces/)
- [AutoScout24 B2B – Abo-Übersicht](https://b2b.autoscout24.ch/abos-v3/) · [Premium-Pakete](https://b2b.autoscout24.ch/premium-pakete/)
- [tutti.ch – AutoPRO Abos](https://www.tutti.ch/de/subscription/vehicle)
- [autolina.ch – Händler & Garagen](https://www.autolina.ch/en/haendler_info)
- [AGVS/UPSA: «Wir wünschen uns Wettbewerb und faire Preise»](https://www.agvs-upsa.ch/de/news/wir-wuenschen-uns-wettbewerb-und-faire-preise)
- [Pricing Page Psychology 2026 – digitalapplied](https://www.digitalapplied.com/blog/subscription-pricing-page-psychology-decision-framework-2026)
- [SaaS Pricing Page Best Practices – PipelineRoad](https://pipelineroad.com/agency/blog/saas-pricing-page-best-practices)
- [SaaS Pricing Structure: Models, Metrics & Thresholds – pricingsaas](https://newsletter.pricingsaas.com/p/the-definitive-guide-to-pricing-structure)
- [Annual vs Monthly Pricing – Baremetrics](https://baremetrics.com/blog/annual-vs-monthly-pricing-better-retention)
- [Charm Pricing – Price2Spy](https://www.price2spy.com/blog/charm-pricing/)
