# BuyAuto – Checks + Implementationsplan (Garage-Preise & Dealer Package System)

Stand: 2026-02-16

## 1) Ergebnis der Checks (Ist-Zustand, verifiziert im Schema)

### Dealer/Organisation Modell
- “Dealer” ist bei euch die Tabelle `public.garages`.
- Beziehung:
  - `garages.owner_user_id → profiles.id` (User/Owner)
  - `listings.garage_id → garages.id` (Inserate gehören optional zu einer Garage)

### Listing & Premium Felder (bereits vorhanden)
- `listings.is_premium` (boolean, default false)
- `listings.premium_until` (timestamptz, nullable)
- `listings.premium` existiert ebenfalls (legacy) – wir nutzen für neue Logik primär `is_premium`/`premium_until` und lassen legacy unberührt.

### Garage Plan Snapshot (bereits vorhanden, muss kompatibel bleiben)
- `garages.plan` (text, default 'free')
- `garages.listing_limit` (int, default 10)

### Dealer Package Tabellen (bereits vorhanden)
- `dealer_plans` (public read for active plans, admin manage)
- `dealer_subscriptions` (FK `dealer_id → garages.id`, unique per dealer)
- `dealer_plan_changes`
- `dealer_premium_credits` (unique `(dealer_id, period_yyyymm)`)

### Enforcement / Publish
- Frontend ruft bereits `supabase.rpc("publish_garage_listing", { listing_id })` auf (mehrere Stellen).
- Daraus folgt: Limits sind bereits serverseitig enforce-bar. Wir dürfen dieses Verhalten nicht brechen; UI soll Fehlermeldung + Upgrade CTA liefern.

---

## 2) Zielbild (Was “fertig” bedeutet)

### Landingpage /garage-preise
- Mobil-first, Du-Form, Deutsch/CH
- Struktur exakt nach Vorgabe (Hero, Inklusive, Pakete, Premium-Erklärung, Done-for-you, FAQ, Final CTA)
- SEO:
  - title: “BuyAuto – Preise für Garagen”
  - description: “Pakete für Garagen: Inserate, VIN-PreFill, Leasing-Rechner und Deal-Chat pro Fahrzeug. Done-for-you Onboarding ab Growth.”
- Canonical Route:
  - Hauptseite: `/garage-preise`
  - Redirect: `/preise-garagen` → `/garage-preise` (301)

### Dealer “Zahlung” UI (im Garage-Dashboard)
- Zeigt aktuellen Plan (Name/Preis/Limit/Premium Kontingent)
- Zeigt Periode (falls in subscription gepflegt)
- Plan Selector (Starter/Growth/Pro + Kontakt für 100+/Custom)
- Change History (dealer_plan_changes)
- Buttons erzeugen Change Requests (auch wenn Payment später kommt)

### Soft Enforcement
- Publish: wenn Limit erreicht → blockiert (server) + UI zeigt klare Meldung + CTA zu “Zahlung”
- Premium: “Premium setzen” nutzt Credits:
  - wenn Credits aufgebraucht → block + CTA zu “Zahlung”
  - wenn vorhanden → credits_used++ (atomar via RPC) + listing premium setzen

---

## 3) Implementations-Reihenfolge (sicher, ohne Regressionen)

### Phase A — UI Landingpage
1. `/garage-preise` finalisieren (Design/Copy/SEO)
2. Redirect page `/preise-garagen` (permanent redirect)
3. Smoke: Page lädt, CTAs korrekt, kein Demo-Wording, überall “Du”

### Phase B — “Zahlung” im Garage-Dashboard (Foundation)
1. Neue Tab-Sektion “Zahlung” im Garage-Dashboard (ersetzt/übernimmt bisherigen “Plan”-Placeholder)
2. Daten laden:
   - active plans (`dealer_plans`)
   - my subscription (`dealer_subscriptions`)
   - my plan changes (`dealer_plan_changes`)
   - premium credits row für aktuellen Monat (ensure row via upsert) + anzeigen
3. Planwechsel:
   - Button → `request_dealer_plan_change` (bestehende RPC) → danach refresh subscription + history

### Phase C — Soft Enforcement (UX)
1. Publish Flow:
   - dort wo `.rpc("publish_garage_listing")` genutzt wird, Error abfangen
   - klare Meldung “Limit erreicht” + Link/Button “Paket ändern” → Garage-Dashboard “Zahlung”
2. Premium Flow:
   - Listing-UI Action “Als Premium markieren” nur über RPC `garage_set_listing_premium_with_credit`
   - Error abfangen → CTA “Upgrade” / “Kontakt aufnehmen”

---

## 4) Backward Compatibility / “Nichts kaputt machen”
- Bestehende Felder `garages.plan` und `garages.listing_limit` bleiben bestehen und werden weiterhin angezeigt (Fallback).
- Keine Breaking Changes an `publish_garage_listing` Aufrufern – nur bessere Error Messages/UX.
- Keine neuen kritischen E-Mail-Trigger im Frontend (Golden Rule bleibt intakt).

---

## 5) Test-Checkliste (vor Merge/Publish)

### Automatisch
- Softgen Bug Finder: `lint` + `tsc --noEmit` muss grün sein.

### Manuell (Smoke)
- `/garage-preise`:
  - Mobile Layout: Hero + Pricing Cards funktionieren
  - CTA “Jetzt starten” führt zu Auth/Onboarding
  - Keine “Sie”-Formulierungen
- Garage:
  - Login als Garage → `/dashboard/garage` lädt
  - Tab “Zahlung” zeigt Plan + History
  - Planwechsel erzeugt Change Request und UI refresht
- Enforcement:
  - Publish bei Limit: blockiert + CTA sichtbar
  - Premium Credits: wenn 0 → blockiert + CTA sichtbar