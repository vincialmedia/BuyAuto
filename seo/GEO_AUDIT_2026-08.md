# GEO Audit — BuyAuto (August 2026)

Phase-1-Befund für den GEO-Sprint (Generative Engine Optimization). Auditiert wurden
Codebase, produktive Supabase-Datenbank (Projekt `fgalkhfopecwsryracre`) und ein lokaler
Production-Build. **Einschränkung:** Die Sandbox, in der dieser Audit lief, hat keinen
ausgehenden HTTP-Zugriff (Proxy-Policy blockt u.a. www.buyauto.ch und *.supabase.co).
Live-Crawls mit Bot-User-Agents konnten deshalb nicht ausgeführt werden — dafür liefert
`scripts/check-geo.sh` (R9) die Post-Deploy-Verifikation. Alle übrigen Aussagen stützen
sich auf Code (mit Datei/Zeile) und echte DB-Daten.

## Architektur-Fakten

- **Router:** Next.js 15 Pages Router (`src/pages/`). `next build` grün (Baseline verifiziert).
- **Rendering:** `/fahrzeug/[id]` SSR (`getServerSideProps`, volle Fahrzeugdaten im Server-HTML,
  410/404 für tote Inserate, Canonical-Slug-Redirect). Home ISR (Premium-Inserate im HTML).
  `/suche` SSR nur für indexierbare Views (Hub + einzelner dealType), Rest client-fetched + noindex.
  Brand-Pages SSG mit `fallback: "blocking"`, `revalidate: 300`. Ratgeber statisch/ISR.
- **JSON-LD:** `_app.tsx` (Organization + WebSite/SearchAction, sitewide), `fahrzeug/[id].tsx`
  (Car+Offer), `[marke].tsx` (BreadcrumbList + FAQPage + ItemList), `suche.tsx` (ItemList),
  Ratgeber (Article, teils FAQPage/BreadcrumbList), `Breadcrumbs.tsx` (geteilte Komponente).
- **robots.txt:** statisch in `public/robots.txt`. **Sitemap:** `src/pages/sitemap.xml.ts`
  (SSR-Route, liest `listings_public`, `get_public_garage_slugs`, `LEASING_BRANDS`).
- **Kein llms.txt** (fällt heute auf die Catch-all-Route `[dealerSlug].tsx` → 404).
- **Analytics:** GA4 per `NEXT_PUBLIC_GA_MEASUREMENT_ID` (Vercel-Env, nicht im Repo),
  Google Ads hartkodiert `AW-18317910859` (`src/lib/analytics/gtag.ts:31`). Consent Mode v2,
  `trackEvent()` erreicht alle Destinations.
- **Middleware/WAF:** Middleware nur auf `/dashboard/*` + `/admin/*` (`src/middleware.ts:40-42`).
  Kein UA-Sniffing, kein X-Robots-Tag, keine Bot-Blocks in `next.config.mjs`/`vercel.json`. ✅
- **DB (`listings` / View `listings_public`):** `brand`/`model`/`year`/`mileage_km`/`fuel`/
  `gearbox`/`body`/`deal_type` NOT NULL; nullable: `price_per_month_chf`, `remaining_months`,
  `deposit_chf`, `first_registration` (Text `YYYY-MM`), `location` (mal Kanton-Code «ZH», mal
  Nominatim-String), `canton_code`, `drivetrain` («Allrad»/«Frontantrieb»/«Heckantrieb»),
  `remaining_km`, `purchase_price_chf`, `updated_at`. **Keine `color`-Spalte.** Keine
  Review-/Rating-Tabelle. `deal_type`: `lease_takeover` (13 aktiv) / `direct_purchase` (12 aktiv,
  alle `financing_type='cash'`). **Achtung:** Alle direct_purchase-Zeilen tragen
  `remaining_months=12` und `deposit_chf=0` als Formular-Defaults — für Schema nutzlos.

## R1–R9: Pass/Fail

| Req | Status | Befund |
|---|---|---|
| R1 robots.txt | ❌ FAIL | Nur `User-agent: *`-Gruppe; keiner der 9 AI-Bots explizit erlaubt (`public/robots.txt:1-7`). Disallows: `/admin`, `/dashboard`, `/api/`; Sitemap-Zeile vorhanden. |
| R2 llms.txt | ❌ FAIL | Existiert nirgends; `/llms.txt` läuft in `[dealerSlug].tsx` → RPC-Miss → 404. |
| R3 BreadcrumbList | ⚠️ PARTIAL | **Fehlt** auf `/fahrzeug/[id]` (kein Breadcrumb-Schema, `[id].tsx`), auf Hub `leasinguebernahme.tsx`, `leasinguebernahme-vs-autoabo`, `auto-abo-kuendigen`, `auto-abo-vs-leasing-kosten`, `leasing-concierge`, `preise`. **Vorhanden** auf Brand-Pages (`[marke].tsx:52-60`) und 7 Ratgebern (teils via `Breadcrumbs.tsx`, teils inline). Defekt: `auto-abos-im-vergleich.tsx:299-303` — Crumb «Auto-Abo» zeigt auf `/leasinguebernahme`. |
| R4 Vehicle-Schema | ❌ FAIL | Car+Offer vorhanden ([id].tsx:339-364) mit Preis/UnitPriceSpecification, aber es fehlen: `offers.leaseLength`, `dateVehicleFirstRegistered`, `offers.availableAtOrFrom`, `description`, `driveWheelConfiguration`. `color`: n/a (keine DB-Spalte → weglassen). Kein aggregateRating (korrekt ✅). Keine persönlichen Verkäuferdaten im Schema ✅ (seller_name nur im UI). |
| R5 Brand-Coverage | ❌ FAIL | Registry hartkodiert (8 Marken, `leasingBrands.ts:21-78`). **Bug:** Registry-Name «Mercedes-Benz» ≠ DB-Brand «Mercedes» → `/leasinguebernahme/mercedes-benz` zeigt 0 von 5 live Takeover-Inseraten, ist noindex und fehlt in der Sitemap. **Fiat** (1 Takeover) und **Škoda** (2 Takeover) haben gar keine Seite; Mini (nur Direktkauf) ebenfalls nicht. Neue DB-Marke ⇒ Code-Änderung nötig. |
| R6 Sitemap | ❌ FAIL | `changefreq`+`priority` auf allen URL-Klassen; `lastmod` nur bei Listings (`sitemap.xml.ts:67-132`). Statisch/Brand/Garage ohne lastmod. Brand-URLs erben den Mercedes-Mismatch aus R5. Kein Cache-Header. |
| R7 AI-Referral | ❌ FAIL | Kein `ai_referral`/`ai_source`-Code im Repo (Grep = 0). `document.referrer` nur für GA4-page_view (`gtag.ts:129-130`). |
| R8 Answer-first | ❌ FAIL (10 von 12) | Direkter Antwort-Absatz nach H1 fehlt auf: Hub `leasinguebernahme`, `leasinguebernahme-kosten` (Antwort erst in «Kurz gesagt»-Box unterhalb der CTAs — und widerspricht sich: 200–600 vs. 200–650 CHF), `leasingvertrag-uebertragen`, `leasinguebernahme-vs-neues-leasing`, `leasinguebernahme-vs-autoabo`, `auto-abo-kuendigen`, `auto-abos-im-vergleich` (nennt keine Anbieter), `leasing-abgeben-schweiz`, `autoscout24-alternative-…`, `carify-alternativen` (Badge sagt «2025», Title «2026»). Sichtbares «Aktualisiert am» nur auf `auto-abo-vs-leasing-kosten` + `eintauschwert-rechner` (Muster: `LAST_UPDATED`-Konstante, synchron mit `dateModified`). Alle Article-Schemas tragen hartkodiertes `dateModified: "2026-06-08"` (bzw. 07-22), kein `datePublished`. |
| R9 check-geo.sh | ❌ FAIL | Kein `scripts/`-Verzeichnis, keine Shell-Scripts im Repo. |

Bereits bestanden (keine Änderung nötig): SSR-Extraktion auf Listing/Home/Brand-Pages,
`html lang="de-CH"`, Canonicals+OG auf den Kernseiten, keine ß im gerenderten Copy,
CHF-Apostroph-Format fast überall, FAQ-Antworten via `forceMount` im Server-HTML,
kein Bot-Blocking in Middleware/Headern, kein aggregateRating.

## Weitere Befunde (ausserhalb R1–R9, nicht in diesem Sprint gefixt)

1. **Dealer-Microsites (`/[dealerSlug]`) haben null Fahrzeugdaten im Server-HTML** —
   `PublicDealerInventory` fetcht rein client-seitig. Für AI-Crawler ist das Inventar
   unsichtbar, obwohl die URLs in der Sitemap stehen. (Aktuell 0 Garagen mit Slug live.)
2. **Doppeltes, widersprüchliches Organization-Schema** auf Dealer-Pages
   (`_app.tsx:33-43` vs. `StructuredData.tsx:41-61`, verschiedene Logos/Beschreibungen);
   Organization ohne Adresse/sameAs. `StructuredData.tsx` enthält tote Product/WebSite-Zweige.
3. **`/preise`:** Garage-Preise fehlen im Server-HTML (Persona-Toggle rendert nur `private`);
   H1 ist der Keyword-freie Slogan «Klar. Fair. Swiss-clean.»; kein JSON-LD.
4. **3 Ratgeber komplett in Sie-Form** (`leasinguebernahme-vs-neues-leasing`,
   `leasinguebernahme-vs-autoabo`, `auto-abo-kuendigen`) — verletzt die Du-Konvention.
   Neue R8-Antwortblöcke sind in Du geschrieben; Voll-Rewrite der Bodies war ausserhalb
   des R8-Scopes («do not rewrite bodies beyond this»).
5. **FAQ-Schema-Drift:** `autoscout24-alternative` + `carify-alternativen` pflegen
   FAQ-Text doppelt (Schema ≠ Accordion). 3 Seiten mit sichtbarem FAQ ohne FAQPage-Schema.
6. `/suche`: og:title/description fehlen; `agb`/`datenschutz` ohne Canonical.
7. Header-Dropdown-Links (Radix) sind nicht im Server-HTML — Footer-Linkmap kompensiert.

## Fix-Plan (umgesetzt in dieser Reihenfolge, 1 Commit pro Fix)

1. **R1** `public/robots.txt`: explizite Allow-Gruppen für alle 9 Bots, Disallows gespiegelt, Sitemap bleibt.
2. **R2** `public/llms.txt` (statisch ⇒ text/plain, gewinnt gegen `[dealerSlug]`-Route): Blockquote + Sektionen Fahrzeuge/Ratgeber/Preise mit real existierenden Routen.
3. **R3** `Breadcrumbs.tsx` um JSON-LD-only-Export erweitern; einsetzen auf `/fahrzeug/[id]` (nur JSON-LD — sichtbare Crumbs passen nicht ins bestehende Detail-Design), Hub, vs-autoabo, auto-abo-kuendigen, auto-abo-vs-leasing-kosten, leasing-concierge, preise; falschen Crumb in auto-abos-im-vergleich korrigieren.
4. **R4** Car/Offer-Schema vervollständigen: `leaseLength` (nur `lease_takeover`, `P{n}M`), `dateVehicleFirstRegistered` (nur validiertes `YYYY-MM`), `availableAtOrFrom` (Ortsparser: Kanton-Code ⇒ addressRegion, Ortsname ⇒ addressLocality, immer CH; nichts erfinden), deterministische `description` je Kaufart, `driveWheelConfiguration`-Mapping. Direct-purchase-Defaults (12 Monate/0 Kaution) fliessen bewusst NICHT ins Schema.
5. **R5** Brand-Registry dynamisch: Alias-Support (Mercedes ⇄ Mercedes-Benz), DB-getriebene Slugs für alle Marken mit ≥1 aktiven Inserat (generische Du-Intro + echte Modellnamen aus der DB), `getStaticPaths` + Hub + Sitemap aus derselben Quelle. Entscheid Zero-Listing: kuratierte/bekannte Marken bleiben 200 + noindex-Empty-State (bestehendes, dokumentiertes Muster), unbekannte Slugs bleiben 404.
6. **R6** Sitemap: changefreq/priority raus; lastmod überall (Listings `updated_at`, Brands = max(updated_at) der Marke, Content-Seiten aus neuer gepflegter Konstanten-Map, Garagen via erweitertem RPC `get_public_garage_slugs` + Migration); Cache-Header.
7. **R7** `src/lib/analytics/aiReferral.ts` + Mount in `GoogleAnalytics`; sessionStorage `buyauto:ai-source`; `ai_referral`-Event via `trackEvent`; `docs/ai-traffic-tracking.md` mit GA4-Channel-Group-Anleitung.
8. **R8** 10 fehlgeschlagene Seiten: 2–4-Satz-Antwort direkt nach H1 (Du, quotable, aus dem realen Seiteninhalt), sichtbares «Aktualisiert am» via `LAST_UPDATED`-Muster, `dateModified` aus derselben Konstante, `datePublished` wo ehrlich bekannt (keins erfunden). 200–600/650-Widerspruch auf einen Wert (200–650) vereinheitlicht.
9. **R9** `scripts/check-geo.sh` gegen Prod-URL (GPTBot/ClaudeBot, Statuscodes, ld+json + leaseLength-Grep, Pass/Fail-Summary).
10. Optional: `/elektroauto-leasing-abgeben` + Datenseiten-Skeleton — Scaffolds mit TODO-Markern, **noindex bis echter Content da ist**, nicht in der Sitemap.
