# Garagen-Pricing Rebalance — August 2026

Stand: 14. August 2026. Antwort auf: «Das Garagen-Angebot ist viel zu grosszügig
und unproportional zu dem, was Private bekommen.» Baut auf
`GARAGE_PRICING_STRATEGY_2026.md` (Juli-Repackaging) und
`PRICING_AND_FEATURE_RESEARCH_2026.md` auf; die Konkurrenzzahlen wurden am
14.8. per Websuche nachgeprüft (AS24 B2B, anibis AutoPRO, tutti, autolina —
Fetch der Preisseiten bleibt aus dieser Umgebung geblockt, Suche bestätigt die
Juli-Werte).

---

## 1. Der Befund: wo «zu grosszügig» wirklich sitzt

Ausgangslage (seit Juli-Repackaging), pro **aktivem Inserat und Monat**:

| | Preis/Mt | Inserate | CHF/Fahrzeug | Premium-Boosts/Mt | Boost-Wert | Wert-Anteil am Preis |
|---|---|---|---|---|---|---|
| Starter | 149 | 15 | 9.93 | 1 | CHF 30 | 20% |
| Growth | 349 | 60 | 5.82 | 6 | CHF 180 | **52%** |
| Pro | 599 | 150 | 3.99 | 15 | CHF 450 | **75%** |

Der Vergleichsmassstab auf der eigenen Plattform: ein privates
Verlängert-Inserat kostet CHF 50 für 90 Tage ≈ **CHF 16.70 pro aktivem Monat**.

Drei Dinge sind tatsächlich unproportional:

1. **Pro verkauft das Inserat für CHF 3.99**, während der Privatkunde daneben
   CHF 16.70 zahlt — Faktor 4.2, *bevor* man die Gratis-Boosts einrechnet.
   Branchenüblich ist ein Mengenrabatt von grob 2–3×, nicht 4×+.
2. **Die Premium-Boosts entwerten das eigene Produkt.** Pro enthält 15 Boosts
   im Einzelwert von CHF 450 bei CHF 599 Paketpreis. Damit ist der Boost für
   Garagen faktisch gratis — dasselbe Produkt, für das Private CHF 30 pro
   Stück zahlen. Nebenwirkung: ein einziger Pro-Händler kann die
   Premium-Schiene der Suche mit 15 Fahrzeugen pro Monat fluten und verdrängt
   die zahlenden Privat-Boosts.
3. **400 Bewertungen/Monat sind unbudgetierte COGS.** Jede automatische
   Eintauschwert-Suche kostet Firecrawl-Credits; «praktisch unbegrenzt» stand
   wörtlich auf der Karte.

**Nicht** das Problem: Starter. CHF 9.93 pro Fahrzeug liegt zwischen tutti
(9.56) und anibis (17.25) — marktkonform, und der Einstieg ist unser Wedge.

## 2. Markt-Check (14.8.2026, Suche-verifiziert)

Pro aktivem Inserat und Monat, Händlerangebote Schweiz:

| Anbieter | Modell | CHF/Fahrzeug/Mt |
|---|---|---|
| AutoScout24 Basic 10 | CHF 359 Listenpreis × Car-Value-Faktor 0.8–1.2, **12 Mt. Mindestlaufzeit** | ~32–43 |
| AutoScout24 Prof. Plus 50 | CHF 1'409 × Faktor (Beispiel 1'549.90) | ~31 |
| anibis AutoPRO (klein) | CHF 69/Mt für 4 Inserate | 17.25 |
| tutti AutoPRO M | CHF 239/Mt für 25 | 9.56 |
| autolina | ~CHF 196/Mt bis 30 Fahrzeuge | 6.53 |
| Carmarket (Emil Frey) | CHF 1'850/Jahr, 30 Dauerplätze | 5.14 |
| automo.ch | CHF 55/Mt unbegrenzt | → 0 |
| **BuyAuto bisher** | 149 / 349 / 599 | **9.93 / 5.82 / 3.99** |

Growth und Pro unterboten also nicht nur AS24 (gewollt), sondern auch die
unabhängigen Billiganbieter autolina und Carmarket — die Plattformen, die der
AGVS seinen Mitgliedern als AS24-Alternative empfiehlt. Das ist die Definition
von «zu grosszügig»: billiger als die Budget-Schiene, mit mehr Inhalt.

Privatseite zum Vergleich: AS24 verlangt von Privaten ab CHF 34–99+ (Basic
CHF 59 / 14 Tage, max. 6 Fotos); tutti/anibis sind nur unter CHF 3'000/5'000
Fahrzeugwert gratis. Unser Gratis-Standard bleibt bewusst grosszügiger — die
Privatseite ist Bestandsbeschaffung (siehe Juli-Research), an ihr wird nichts
geändert.

## 3. Entscheid: Preise halten, Inhalte proportionieren

Die CHF-Preispunkte bleiben. Gründe: (a) `dealer_plans.stripe_price_id` hängt
an den bestehenden Stripe-Prices — neue Beträge brauchen neue Prices, das ist
ein eigener Schritt; (b) null zahlende Garagen heisst: der Engpass ist
Nachfrage, nicht Preis (CAR-FOR-YOU-Lektion aus dem Juli-Research). Gekürzt
wird, was das Angebot unproportional macht — genau die Option «lower the
slots offered».

| | **Starter** CHF 149 | **Growth** CHF 349 ★ | **Pro** CHF 599 |
|---|---|---|---|
| Aktive Inserate | 15 (=) | **40** (war 60) | **100** (war 150) |
| CHF pro Fahrzeug/Mt | 9.93 | **8.73** | **5.99** |
| Premium-Boosts/Mt | 1 (=) | **3** (war 6) | **6** (war 15) |
| Boost-Wert-Anteil | 20% | 26% | 30% |
| Eintauschwert-Suchen/Mt | 25 (=) | **60** (war 100) | **150** (war 400) |
| Website-Tools | – | ✓ | ✓ |
| Onboarding (nur Pro) | – | – | **bis 100** (war 150) |
| Individuell ab | | | **«100+» — sichtbar «ab CHF 999/Mt»** |

### Warum genau diese Zahlen

* **Pro CHF 5.99/Fahrzeug** stellt sich *neben* autolina (6.53) und Carmarket
  (5.14) statt 40% darunter — mit deutlich mehr Produkt drin (Boosts,
  Bewertungen, Widgets, Onboarding, ohne Jahresvertrag). Der
  AS24-Undercut (5–7×) bleibt vollständig erhalten.
* **Growth CHF 8.73/Fahrzeug** bleibt knapp unter tutti (9.56) und klar über
  autolina — die Mitte trägt weiterhin den Center-Stage-Platz.
* **Boost-Leiter 1 / 3 / 6** statt 1 / 6 / 15: der inkludierte Wert steigt
  weiter mit der Stufe (20% → 26% → 30% des Paketpreises), aber der Boost
  bleibt ein Produkt mit Preis (CHF 30) statt einer Beilage. Maximale
  Premium-Flutung durch einen einzelnen Händler: 6 statt 15 Fahrzeuge/Monat.
* **Bewertungen 25 / 60 / 150**: Worst-Case-COGS pro Pro-Kunde auf ~⅓
  begrenzt; die Formulierung «praktisch unbegrenzt» verschwindet aus der Copy.
* **Proportionalität zur Privatseite**: Händlerrabatt gegenüber
  Verlängert-Äquivalent (16.70/Mt) jetzt 40% / 48% / 64% statt bis zu 76%
  plus Gratis-Boosts. Mengenrabatt ja, Verramschen nein.
* **«100+ ab CHF 999»** statt «150+ auf Anfrage»: der Juli-Research-Befund
  («versteckte Preise zerstören den Anker») wird umgesetzt und über Pro
  entsteht sichtbare Preisluft nach oben — ohne neuen Stripe-Price, weil
  individuell offeriert.

### Was bewusst gleich bleibt

* **Starter komplett** — marktkonform, und ein kastrierter Einstieg
  verkauft gegen autolina/Facebook schlechter.
* **Onboarding exklusiv in Pro** (Code, DB und alle Flächen sind seit
  `20260730203308_onboarding_pro_only.sql` konsistent — live in der DB
  nachgeprüft am 14.8.).
* **Privat-Preise 0 / 50 / 190** und `GARAGE_MAX_PHOTOS = 20`.
* **149 / 349 / 599** als Preispunkte (Stripe bleibt unangetastet).

### Preiserhöhungs-Trigger (festgehalten, damit es nicht wieder Bauchgefühl wird)

1. Ab **10 zahlenden Garagen**: neue Kunden +20% (179 / 419 / 719, neue
   Stripe-Prices), Bestandskunden behalten den «Founding-Garage»-Preis —
   das ist gleichzeitig das Verkaufsargument davor.
2. **Pro → CHF 699** (2× Growth, Juli-Verdikt) im selben Schritt.
3. Jahresabo «2 Monate gratis» sobald Stripe-Jahres-Prices existieren.

## 4. Präsentation: die zwei gemeldeten Probleme

**«Ich verstehe die USP auf den Preiskarten nicht»** — gemeint ist die
Wertzeile `Premium-Wert CHF 180/Monat inklusive · CHF 5.82 pro Fahrzeug`:
zwei Rechnungen in einer Zeile, ohne Erklärung, was ein «Premium-Wert» ist.
Fix: die Karte trägt nur noch **eine** Rechnung («= CHF 8.75 pro Fahrzeug und
Monat»), der Boost wird als normaler Bullet mit seinem Einzelpreis erklärt
(«3 Premium-Boosts pro Monat inklusive — einzeln CHF 30»), und die
Kennzahl-Kachel heisst «Premium-Boosts/Mt.» statt «Premium / Monat».

**«Es gibt keine Seite mit Side-by-Side-Vergleich»** — /preise zeigt über den
Persona-Toggle immer nur *eine* Seite, und für die Privat-Pläne existierte
gar keine Vergleichstabelle. Fix (nach Review konsolidiert auf **eine**
Seite statt einer separaten /preise/vergleich): (1) Privat-Matrix
Standard/Verlängert/Unlimitiert direkt unter den Privat-Karten (neu),
(2) Garagen-Matrix wie gehabt unter den Garagen-Karten, (3) darunter — für
beide Personas sichtbar — der Block «Privat oder Garagen-Paket?» mit
Faustregel und der Pro-Fahrzeug-Rechnung über beide Welten. Der
Hero-Verlauf, der die USP-Kacheln weiss überblendete, ist entfernt.

**Nachtrag Enforcement:** «Keine Website-Tools» im Starter war bis dahin nur
eine UI-Fence — die Embed-iFrames (`/embed/garage/<slug>`,
`/embed/eintauschwert-rechner`) waren öffentlich und der Rechner-Snippet
stand jedem Paket im Dashboard. Jetzt: SECURITY-DEFINER-RPC
`get_garage_website_tools_enabled` (Override → Subscription →
garages.plan), beide Embeds prüfen serverseitig (fail-open bei Fehlern),
das Rechner-Widget verlangt `?garage=<slug>`, und der Snippet im Dashboard
ist Growth+.

## 5. Code-Änderungen in diesem Branch

| Ort | Änderung |
|---|---|
| `src/lib/buyauto/garagePlans.ts` | neue Stückzahlen, neue Highlight-Copy, `perVehicleLine` statt `planValueLine`, `GARAGE_CUSTOM_FROM_CHF = 999` |
| `supabase/migrations/20260814_rebalance_dealer_plans_proportionality.sql` | Growth/Pro-Zahlen, Onboarding-Cap 100, Custom-Zeile «100+» |
| `src/components/buyauto/pricing/GaragePlanCards.tsx` | Kachel-Label, einfache Pro-Fahrzeug-Zeile |
| `src/pages/preise.tsx` | konsolidiert: Privat-Matrix + «Privat oder Garage?»-Block auf der Seite |
| `src/components/buyauto/pricing/PrivateFeatureMatrix.tsx` | **neu** — Privat-Matrix |
| `src/components/buyauto/pricing/PrivatVsGarageSection.tsx` | **neu** — Side-by-Side-Block inkl. Pro-Fahrzeug-Rechnung |
| `src/components/buyauto/pricing/PricingHero.tsx` | Weiss-Verlauf entfernt (überblendete die USP-Kacheln) |
| `src/components/buyauto/pricing/pricingData.ts` | `PRIVATE_COMPARISON_ROWS` |
| `src/components/buyauto/pricing/GaragePricingSection.tsx`, `src/pages/garage-plan.tsx`, `GarageBillingTab.tsx` | «100+ ab CHF 999» sichtbar |
| `src/pages/eintauschwert-rechner.tsx` | FAQ-Kontingente interpoliert statt hartkodiert (25/100/400 stand fest im Text) |
| `src/pages/embed/garage/[dealerSlug].tsx`, `src/pages/embed/eintauschwert-rechner.tsx` | Website-Tools serverseitig erzwungen (Growth+), Rechner-Embed braucht `?garage=` |
| `src/components/buyauto/dashboard/GarageDashboard.tsx` | Rechner-Snippet nur noch Growth+, Snippet mit `?garage=` |
| `supabase/migrations/20260814130000_garage_website_tools_gate.sql` | **neu** — `get_garage_website_tools_enabled` RPC |
| `src/lib/buyauto/contentDates.ts` | `/preise` gebumpt |

Nicht angefasst: Stripe-Konfiguration, Privat-Pläne, Webhook-Logik (kopiert
`listing_limit`/`premium_included_per_month` bei Checkout automatisch aus der
DB — null aktive Subscriptions, also keine Rückwirkung auf Bestandskunden).

## Quellen (Nachprüfung 14.8.)

- [AS24 B2B Abos](https://b2b.autoscout24.ch/abos-v3/) · [Insertionsangebote](https://b2b.autoscout24.ch/insertionsangebote/) · [Abopakete-Hilfe](https://help.autoscout24.ch/hc/de/articles/34478598625554-Welche-Abopakete-sind-verf%C3%BCgbar) — Basic 10: CHF 359 × CVF; Prof. Plus 50: CHF 1'409 × CVF; 12 Mt. Mindestlaufzeit
- [watson: Garagisten-Revolte gegen AS24-Preiserhöhung](https://www.watson.ch/wirtschaft/schweiz/202306652-grosse-garagen-starten-revolte-gegen-autoscout24) — +15% per 1.6.2026
- [anibis AutoPRO](https://www.anibis.help/hc/de/articles/14606795418258-AutoPRO-f%C3%BCr-Fahrzeug-Verk%C3%A4ufer-innen) — 5 Stufen, CHF 69 (4 Inserate) bis CHF 499 (500)
- [tutti Fahrzeug-Abos](https://www.tutti.ch/de/subscription/vehicle) · [tutti-Hilfe: Gratis-Grenze CHF 3'000](https://www.tutti.help/hc/de/articles/22848726798098)
- [autolina Händler](https://www.autolina.ch/en/haendler_info) · [verkaufedeinauto.ch Vergleich](https://verkaufedeinauto.ch/en/list-your-car-for-free-in-switzerland-tips-comparison-2025/) — ~CHF 196/Mt bis 30 Fahrzeuge
- [automo.ch Preise](https://automo.ch/en/prices-automo-ch-offer/)
- [AS24 privat: Produkte & Preise](https://www.autoscout24.ch/de/produkte-und-preise) · [Geld-zurück-Garantie](https://auto-wirtschaft.ch/news/5491-auto-verkauft-oder-inseratepreis-zuruck-bei-autoscout24)
- Carmarket-Preis (CHF 1'850/Jahr): Juli-Research, Suche am 14.8. lieferte keine neue Zahl — vor Sales-Einsatz einmal direkt verifizieren
