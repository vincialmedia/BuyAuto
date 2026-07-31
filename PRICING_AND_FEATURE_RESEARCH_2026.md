# Pricing- & Feature-Research 2026

Stand: 30. Juli 2026. Ergänzt `GARAGE_PRICING_STRATEGY_2026.md` um Preis­psychologie,
Konkurrenz-Feature-Analyse und ein Konsistenz-Audit über alle Preisflächen —
für Garagen **und** Private.

Lesbare Fassung: siehe Artifact „BuyAuto — Pricing & Feature Research".

---

## 0. Methodik und Belastbarkeit (bitte zuerst lesen)

12 Recherche-Agenten, 228 Befunde. Das Websuche-Kontingent der Sitzung war nach
den ersten vier Themen aufgebraucht. Was das für die Belastbarkeit heisst:

| Bereich | Grundlage | Vertrauen |
|---|---|---|
| Schweizer Konkurrenz & Preise | live, 66 Suchen, Quellen verlinkt | hoch |
| Europa (Auto Trader, mobile.de, …) | live, 52 Suchen | hoch |
| Global (CarGurus, carsales, …) | live, 54 Suchen | hoch |
| Preispsychologie Stufenmodell | live, 45 Suchen | hoch |
| C2C-Psychologie, Trust, KI, DMS-Integration | **nur Modellwissen**, keine Quellen abrufbar | mittel |
| Alles über den eigenen Code | **selbst im Repo geprüft** | hoch |

**Nachtrag 31.7.: die vier ungedeckten Themen sind nachrecherchiert** — siehe
Abschnitt 8. Das Websuche-Kontingent setzt pro Sitzung zurück; der Ausfall war
also hausgemacht (8 parallele Agenten à 10–20 Suchen haben die 200 Aufrufe
verbraucht, bevor die zweite Hälfte startete), nicht ein Limit der Umgebung.
WebFetch, curl und Firecrawl sind dagegen dauerhaft gesperrt — die Egress-Policy
blockt jeden Host ausser GitHub/Supabase, auch Wikipedia. **WebSearch ist der
einzige Kanal.** Konsequenz für künftige Recherchen: Suchen direkt und in kleinen
Blöcken ausführen statt an parallele Agenten delegieren, die das Budget
unsichtbar aufbrauchen.

Die Verifikations-Agenten konnten aus demselben Grund nichts extern gegenprüfen.
Ein Befund war veraltet: ein Agent meldete, die DB gewähre Growth noch das
Onboarding, das die Preisseite Pro vorbehält — das war zwei Stunden vorher
behoben und in der DB nachgeprüft.

Firecrawl und direkter Seitenabruf sind aus dieser Umgebung per Egress-Policy
gesperrt. Alle Konkurrenzzahlen stammen aus Branchenartikeln und öffentlichen
Seiten, nicht aus Angeboten. Vor einer Kampagne, die damit argumentiert, einmal
selbst gegenprüfen — besonders die AS24-Preise, die der Car-Value-Faktor ohnehin
individuell macht.

---

## 1. Das Marktfenster

* **AutoScout24 hat am 1. Juni 2026 die Händlerpreise um ~15% erhöht.** Eine Garage
  dokumentiert CHF 13'949 (Juni 2020) → CHF 46'320 (Juni 2026), **+232%**.
* Der **AGVS** (~4'000 Mitglieder) hat die Preispolitik öffentlich als nicht
  akzeptabel bezeichnet. Innert Tagen sanken die inserierten Fahrzeuge um ~2'000.
* Die **WEKO ermittelt gegen die Swiss Marketplace Group**.

→ Garagen wechseln gerade. Das ist ein Fenster von Monaten. Verkaufsgespräche
schlagen in dieser Phase jede Feature-Roadmap.

### Preisvergleich Händler (CHF/Monat)

| Anbieter | Modell | Preis | pro Fahrzeug/Mt |
|---|---|---|---|
| AutoScout24 Basic 10 | Abo × Car-Value-Faktor 0.8–1.2 | 359.– | 35.90 |
| AutoScout24 Prof. Plus 50 | Abo × Faktor 1.1 | 1'549.90 | 31.00 |
| anibis AutoPRO | Abo, 4–500 Inserate | 69.– bis 499.– | 17.25 → 1.00 |
| tutti AutoPRO M | Abo, 25 Inserate | 239.– | 9.56 |
| Carmarket (Emil Frey) | Jahresabo, 30 Dauerplätze | 1'850.–/Jahr | 5.14 |
| autolina | Abo, unbegrenzt | 199.– | → 0 |
| automo.ch | Abo, unbegrenzt | 55.– | → 0 |
| ~~CAR FOR YOU~~ | erfolgsbasiert: 200.– Basis + 200.–/verkauftes Auto, Deckel 1'000.– | **2024 eingestellt** | — |
| **BuyAuto** | Abo, 15/60/150 | 149 / 349 / 599 | 9.93 / 5.82 / 3.99 |

> ⚠️ **Korrigiert am 31.7. — siehe Abschnitt 9.** Ich hatte CAR FOR YOU als „den
> wichtigsten einzelnen Wettbewerbsbefund" bezeichnet. **CAR FOR YOU wurde 2024
> von SMG abgeschaltet.** Das Erfolgsmodell war der letzte Versuch einer
> sterbenden Plattform, nicht ein lebendes Konkurrenzangebot. Die Lehre daraus
> ist eine andere — und wichtiger.

Weitere relevante Anbieter:
* **gowago.ch** — 9'000+ Autos, **gratis für Händler**, Alles-inklusive-Monatspreis,
  digitale Signatur. Incumbent auf dem Leasing-Winkel; monetisiert die
  Finanzierung, nicht das Inserat.
* **LeasingPlatz.ch** — besetzt Leasingübernahme heute, aber dünnes Produkt:
  CHF 39 für 6 Monate, keine Kommission.
* **AutoScout24 Direct** — Privat-an-Händler-Auktion, CHF 99 Erfolgsgebühr.
* **Ricardo** — seit 12.1.2026 rückerstattbare Einstellgebühr + 10% Erfolgsgebühr,
  max. CHF 290.

---

## 2. Garagen-Struktur: sechs Verdikte

| Verdikt | Befund |
|---|---|
| **Ändern** | **Inserate-Deckel sind der grösste strukturelle Fehler.** Du rationierst dein eigenes Angebot; jedes Inserat kostet fast nichts. Empfehlung: Pro auf unbegrenzt. |
| **Behalten** | **CHF 149 ist nicht zu tief.** Gemessen an Werbekosten pro verkauftem Auto bist du stark unterbepreist. Aber „billige Alternative" ist eine Falle — verkauf über „Fixpreis statt Fahrzeugwert", nie über den Preis. |
| **Ändern** | **Das harte 402-Limit beim Eintauschwert-Rechner verschenkt 5–15% Upgrade-Conversion.** Weiche Grenze statt Block. Harte Verbrauchsdeckel auf einem Werkzeug sind die Preismechanik mit dem meisten Ärger-Potenzial. |
| **Ändern** | **„150+ auf Anfrage" zerstört den Anker.** Versteckte Preise senken Vertrauen. „ab CHF 899" hinschreiben. |
| **Beobachten** | **149 → 349 → 599 fällt ab (2.34× / 1.72×).** Pro ist relativ zum Inhalt billig und zieht an Growth vorbei. Sauberer wäre Pro bei CHF 699 (2× Growth, runde Zahl fürs Top-Tier). Braucht neuen Stripe-Preis. |
| **Beobachten** | **Decoy-Effekt repliziert grösstenteils nicht** — nicht darauf bauen. Centre-Stage-Effekt ist real, hängt aber an der Anordnung; auf Mobile stapeln die Karten. **Behoben**: empfohlene Karte steht auf Mobile zuoberst. Was zuverlässig wirkt, ist das „Beliebt"-Signal (Social Proof). |

### Die offene Frage: Erfolgsmodell?

Ein reines Abo ist für einen Marktplatz ohne nachgewiesene Reichweite der
schwerste Verkauf — das bleibt richtig. Aber die Begründung „CAR FOR YOU beweist,
dass Schweizer Händler erfolgsbasiert annehmen" trägt nicht mehr: CFY ist
abgeschaltet (Abschnitt 9). Verkäufe kannst du ausserdem nicht verifizieren.

**Empfehlung statt Erfolgsgebühr:** eine risikofreie Eintrittsvariante, die ohne
Verifikation funktioniert — „erste 3 Monate CHF 49, danach regulär, monatlich
kündbar" oder „keine Zahlung bis zur ersten Anfrage".

---

## 3. Privat-Leiter: fünf Verdikte

Kurz: **gut gebaut — ausser am Ablauf, und sie verkauft zum falschen Zeitpunkt.**
0 / 50 / 190 ist ein sauberer Kompromiss-Effekt; die Aufgabe der CHF 190 ist es,
die CHF 50 zu verkaufen.

| Verdikt | Befund |
|---|---|
| **Behalten** | **Gratis-Einstieg ist richtig.** Die Privatseite ist Bestandsbeschaffung, keine Umsatzlinie. Gegen Facebook Marketplace/tutti/anibis kannst du für Vorteil zahlen lassen, nicht für Zugang. |
| **Ändern** | **CHF 30 Wiedereinstell-Gebühr belastet den enttäuschtesten Nutzer.** Branchennorm bei Ablauf ist Gratis-Verlängerung, monetisiert über Position. `RELIST_PROMO_ACTIVE` existiert bereits und steht auf `false` — einschalten. |
| **Ändern** | **Upgrade an Tag 10–14 verkaufen, nicht in Schritt 3 des Wizards.** „Dein Inserat hatte 43 Aufrufe und 0 Anfragen" — mit seinen eigenen Zahlen, im Moment des Schmerzes. |
| **Beobachten** | **Unlimitiert hat Negativauslese.** „Online bis verkauft" kauft genau das Auto, das sich nicht verkauft. Flat-Rate-Bias spricht fürs Angebot, aber ehrliche Obergrenze setzen (max. 24 Monate) und beobachten, wie viele nach 12 Monaten noch stehen. |
| **Ändern** | **5 Fotos im Gratis-Tarif ist die falsche Grenze.** Schweizer Händler-Norm sind 16–64 Bilder; AS24 verkauft Bilderpakete als Produkt und lässt die Bildzahl ins Ranking einfliessen. Auf 8–10 erhöhen; die Grenze soll die Platzierung sein. |

**Rechtlich prüfen:** „Bis zu 3× höhere Verkaufschancen" steht an zwei Stellen am
Premium Boost. Ohne eigene Messdaten ist das nach UWG angreifbar. Nicht
geändert, weil möglicherweise Daten vorliegen.

---

## 4. Feature-Lücken

### Tabellenstakes — fehlt, um glaubwürdig zu sein

1. **Preisbewertungs-Label am Inserat** („Guter Preis"). Standard bei AS24 DE/AT,
   mobile.de, CarGurus, carsales, LaCentrale. **Die Datengrundlage existiert
   bereits** (Eintauschwert-Scraper). Bestes Wirkung/Aufwand-Verhältnis der Liste.
2. **Bestandsimport statt Handeingabe.** Bei 60+ Autos ein Dealbreaker. Aber bei
   deiner Zielgrösse haben die meisten kein integrationswürdiges DMS. Realistisch:
   *ein* generischer Importer mit Mapping-UI plus „importiere meinen Bestand von
   meinem bestehenden Portal-Profil" — mit schriftlicher Freigabe der Garage
   (sonst rechtlich heikel).
3. **Verteilung.** AS24 bündelt Weiterveröffentlichung auf comparis/anibis/tutti
   ins Abo. Du hast null Partner. Billigste Abklärung: **comparis fragen**, zu
   welchen Bedingungen der Carfinder (~220'000 CH-Inserate) aufnimmt.
4. **MFK-Datum, Typenschein-Nr., Garantie, Direktimport als Felder.** Verifiziert:
   keins existiert im Schema. Schweizer Käufer filtern nach „ab MFK"; bei AS24
   fliessen diese Felder in den Completeness Score und damit ins Ranking.
5. **Französisch und Italienisch.** Verifiziert: keine i18n-Konfiguration. Die
   Leasingübernahme-Zielgruppe liegt stark in der Romandie.

### Zur Orientierung: was die Besten bauen

* **Auto Trader UK** — *Retail Rating* (1–100 erwartete Verkaufsgeschwindigkeit am
  eigenen Standort), *Retail Check* (Live-Marktbewertung + Wettbewerbsposition),
  *Co-Driver* (KI schreibt Beschreibung, sortiert Bilder), *Deal Builder*
  (Online-Checkout mit GBP 99 rückerstattbarer Reservation). ARPR: GBP 2'995/Monat.
* **CarGurus** — Instant Market Value + Deal-Rating-Badge; dasselbe Modell wird
  als Analytik an Händler zurückverkauft.
* **mobile.de** — Lead Manager mit den *tatsächlichen Suchkriterien* des Käufers,
  KI-Inseratsqualitätsprüfung.
* **Motorway (UK)** — gratis inserieren, Händler bieten, Verkäufer zahlt
  GBP 29.99–99.99 bei Erfolg.
* **OTOMOTO Pay** — Multi-Lender-Finanzierung nativ im Inserat, mit Garantie.
* **Warnung:** fünf gescheiterte Bestandsmodelle in drei Jahren (Vroom, Shift, …).
  Asset-light bleiben.

---

## 5. Ideen, die in der Schweiz niemand macht

Alle im Leasing — dort, wo bereits gebaut ist und kein Incumbent überboten werden
muss. Drei brauchen fast keine neue Technik, nur Verbindung von Vorhandenem.

**Im Code verifiziert:** `estimateRestwert()` in `leasingMath.ts` existiert, der
Vergleichsinserate-Scraper existiert, `contract_end_date` und `canton_code`
werden erfasst — nichts davon ist verbunden.

1. **Leasing-Equity-Erkennung** — „Dein Leasingauto ist CHF 3'400 mehr wert als
   dein Ablösewert." Beide Hälften vorhanden, nur verbinden. Macht in der Schweiz
   niemand. Verwandelt passiven SEO-Verkehr in Verkäufer mit Geldgrund.
2. **Der Leasingvertrag *ist* der Wizard** — PDF hoch, Vision-Modell liest
   Leasinggeber, Rate, Laufzeit, Restwert, km-Limit, Mehrkilometer-Ansatz,
   Anzahlung; Inserat zu 90% fertig. Kein weltweites Vorbild gefunden. Füllt
   nebenbei die Felder, die heute fehlen — **verifiziert: Ablösewert,
   Übernahmegebühr und Mehrkilometer-Ansatz existieren nirgends**, dabei ist der
   Mehrkilometer-Ansatz das grösste unbegrenzte Käuferrisiko.
3. **Restlaufzeit-Alarm** — `contract_end_date` liegt vor. 6–9 Monate vor
   Vertragsende ist der Leasingnehmer maximal entscheidungsbereit. Du bist die
   einzige CH-Plattform mit diesem Datum. Spiegelprodukt für Garagen: Vorabsicht
   auf kommende Leasingrückläufer als Beschaffungskanal.
4. **Kantonaler Kostenrechner** — „Was dich dieses Auto in deinem Kanton kostet."
   Reine Daten, kein Partner, sehr teilbar, zahlt auf SEO ein. **Verifiziert:
   `canton_code` wird erfasst und in `comps.ts` null Mal verwendet.**
5. **Schweizer Kilometerstand-Register, gratis** — die CH hat kein nationales
   Tacho-Register (Belgien: Car-Pass). Jede gesehene Kombination aus
   Fahrgestellnummer, km-Stand und Datum protokollieren — auch aus dem Scraper —
   ergibt über die Zeit ein nicht kopierbares Vertrauens-Asset.

Weitere geprüfte, aber ungenutzte Hebel: **Attach-Revenue über Versicherung und
Finanzierung** (ein Fahrzeug kann in der CH ohne Versicherungsnachweis nicht
eingelöst werden — du stehst genau in diesem Moment; gowago ist gratis für
Händler, weil es die Finanzierung monetisiert).

---

## 6. Konsistenz-Audit

Geprüft: Preisseite, Paketwahl, Dashboard, Inserat-Wizard, FAQ, E-Mail-Templates,
AGB, Rechner-Landingpage.

### Behoben

| Widerspruch | Fix |
|---|---|
| Garagen bekamen **5 Fotos** pro Inserat (sie überspringen die Planwahl, der Entwurf behielt `price_plan: "standard"`) — ein Händler für CHF 599/Mt stand schlechter da als ein Privatverkäufer für CHF 50 | `GARAGE_MAX_PHOTOS = 20`, und die Pakete sagen es |
| Wizard und Preisseite zeigten unterschiedliche Standard-Einschränkungen (3 vs. 1) — die Seite, die verkauft, versprach weniger als die, die kassiert | gemeinsame `PrivatePlanExclusions` + `privatePlanMarketingFeatures` |
| „Jederzeit pausierbar" als Unlimitiert-Vorteil verkauft, obwohl Pausieren in jedem Plan geht | ersetzt durch „Pausieren ohne Zeitverlust – es läuft keine Frist" |
| Eintauschwert-Rechner versprach weiter „unbegrenzte Suchen" nach Einführung der Stufen-Kontingente | echte Kontingente 25/100/400 |
| FAQ verschwieg, dass das Standard-Inserat gratis ist, auf einer Seite, die Preistransparenz verspricht | konkrete Preise in der Antwort |
| Dieselbe Ansicht duzte und siezte gleichzeitig (Billing-Tab) | durchgehend „du" |
| Empfohlene Karte lag auf Mobile in der Mitte, wo es keine Mitte gibt | `order-first md:order-none` |

### Offen — Entscheidungen, keine Fehler

* **Vorangekreuzte Spende von CHF 1 im Wizard.** Die Preisseite sagt „CHF 0" und
  „keine Setup-Fallen", an der Kasse steht standardmässig ein Franken. Sichtbar
  und abwählbar, aber auf der Preisseite nirgends erwähnt. Entweder offenlegen
  oder standardmässig aus.
* **„CHF 0 einmalig"** ist eine schwache Darstellung von gratis. „Gratis" wirkt
  stärker — Gegenargument: kannibalisiert die CHF 50.
* **Das ganze Garagen-Dashboard siezt**, die Preisseiten duzen (6 Dateien).
* **Leasing-Concierge hat keinen Zahlungsweg** — CHF 350 Erfolgsgebühr und ab
  CHF 790 stehen dort, verlinkt sind nur `mailto:`. Kein Formular, kein Stripe,
  keine Messung. **Verifiziert.**
* **KKG / Preisbekanntgabeverordnung** — in jedem Inserat wird ein von der Garage
  konfigurierbarer Zinssatz ausgeliefert; im Code kommt weder „Jahreszins" noch
  „KKG" vor. Anwaltlich prüfen lassen.

---

## 7. Empfohlene Reihenfolge

1. **Verkaufen, jetzt, mit dem was steht.** Das AS24-Fenster schliesst sich. Zehn
   Telefonate bringen mehr als jede weitere Analyse.
2. **Leasing-Concierge messbar machen** — höchster ARPU, seit Launch ein
   `mailto:`-Link. Formular in die DB, Stripe für die Erfolgsgebühr, zählen.
3. **Preisbewertungs-Label** — Tabellenstakes, Datengrundlage vorhanden.
4. **Leasing-Equity-Erkennung** — zwei bestehende Bausteine verbinden.
5. **Gratis-Wiedereinstellen einschalten + Boost bei Tag 10–14 verkaufen.**
6. **MFK / Typenschein / Garantie / Direktimport als Felder**, dann `canton_code`
   endlich benutzen.
7. **Bei comparis anfragen** — ein Mail. ⚠️ **Erwartung nach unten korrigiert**
   (siehe 8.5): der Carfinder aggregiert AutoScout24, AutoClick und Car4you, und
   der Inserierungspfad läuft über AS24. Das ist eine SMG-Partnerschaft, kein
   offener Feed. Trotzdem fragen — aber nicht darauf planen.
8. **KKG/PBV anwaltlich prüfen**, bevor mehr Leasing gebaut wird.
9. **Jahresabo + risikofreie Eintrittsvariante** (beide brauchen neue
   Stripe-Preise).
10. **Unit Economics rechnen** — 12 Agenten, ~50 Empfehlungen, niemand hat
    ausgerechnet, wie viele Garagen auf welcher Stufe ein tragfähiges Geschäft
    ergeben. Bei ~4'000 AGVS-Garagen ist gut möglich, dass eine Handvoll
    Concierge-Abschlüsse pro Monat die ganze Abo-Roadmap schlägt.

---

## 8. Nachtrag (31.7.): die vier ungedeckten Themen, jetzt mit Quellen

### 8.1 AutoScout24 gibt Privatverkäufern eine Geld-zurück-Garantie

**Der wichtigste neue Befund für die Privat-Seite.** AS24 erstattet den
Inseratspreis, wenn ein Fahrzeug nach **120 Tagen** nicht verkauft ist —
gebunden an Inserate mit unbegrenzter Laufzeit. Bedingungen: der geforderte
Preis muss **marktgerecht** sein und es müssen **Originalbilder** verwendet
werden. AS24 vermarktet das als „wir stehen für den Verkaufserfolg ein".

Direkter Benchmark für Unlimitiert (CHF 190), das keine Garantie hat.

**Und der eigentliche Punkt — das hängt mit Empfehlung 3 zusammen:** die
Preisbewertung ist nicht bloss ein Tabellenstakes-Feature, sie ist die
*Voraussetzung* für eine solche Garantie. Nur wenn du „marktgerechter Preis"
maschinell prüfen kannst, kannst du „verkauft oder Geld zurück" ohne
Negativauslese anbieten. Badge und Garantie sind ein Projekt, nicht zwei — und
zusammen ergeben sie das stärkste Angebot, das die Privat-Seite haben könnte.

### 8.2 AS24 ist für Private deutlich teurer als du — und du sagst es nicht

Inseratspakete Basic / Plus / Premium / Unlimited, **ab CHF 34**; Basic
**CHF 59** und Plus **CHF 99** jeweils für **14 Tage**; Laufzeiten 14/30/60 Tage
oder unbegrenzt; **maximal 6 Fotos**. Das Inserat erscheint auf AS24 und
anibis.ch.

Gegenüberstellung, die auf deiner Preisseite fehlt: **CHF 50 für 90 Tage**, mit
Premium-Platzierung inklusive und 15 Fotos — gegen CHF 59 für 14 Tage und 6
Fotos. Das ist ein Faktor 6 bei der Laufzeit.

### 8.3 Dein Gratis-Tarif ist grosszügiger als der der Konkurrenz

* **tutti.ch**: die ersten zwei Fahrzeuginserate gratis — **nur unter CHF 3'000**
  Verkaufspreis. Laufzeit 60 Tage, Verlängerung kostenpflichtig.
* **anibis.ch**: die ersten zwei gratis — **nur unter CHF 5'000** (seit 13.11.2024).

**BuyAuto Standard ist gratis ohne Preisobergrenze.** Das ist eine ownable
Aussage, die heute nirgends steht: „Gratis inserieren — egal, was dein Auto
kostet."

### 8.4 Vertrauen: die Bausteine existieren in der Schweiz

* **carVertical bedient die Schweiz** (carvertical.com/ch): VIN-Abfrage aus über
  900 Datenquellen inkl. Kilometerstand-Historie und Unfalldaten. Eine
  lizenzierbare Historie-Schicht ist also verfügbar — das war vorher nur eine
  Vermutung.
* **anibis betreibt seit März 2022 einen Treuhandservice** über den Anbieter
  Tripartie: Geld bleibt auf einem Treuhandkonto, bis der Käufer den Erhalt
  bestätigt. Zahlungs-Vertrauen ist auf Schweizer Kleinanzeigen also etabliert
  und akzeptiert.

### 8.5 Händler-Integration: konkreter als gedacht — comparis dagegen enger

* **AutoScout24 hat eine dokumentierte DMS API** für automatische, laufende
  Synchronisation des Fahrzeugbestands, plus die HCI-JSON-Schnittstelle in die
  eigene Website des Händlers.
* Namentlich belegte Schweizer DMS: **bme ag** (Maienfeld, modular: Verkauf,
  Werkstatt, Finanzen, Personal) und **Swivex** (cloud-native DMS/CRM für
  Schweizer Autohäuser). Es existiert sogar ein Vergleichsportal
  (garagensoftwarevergleich.ch) — eine fertige Zielliste.
* **comparis Carfinder aggregiert AutoScout24, AutoClick und Car4you**, und der
  Weg „bei comparis inserieren" führt über AS24: wer bei AS24 inseriert,
  erscheint ohne Zusatzkosten auf comparis und anibis. Das ist eine
  Partnerschaft innerhalb der SMG-Familie, kein offener Feed. **Empfehlung 7
  entsprechend abgestuft** — die Anfrage kostet ein Mail, aber plane nicht damit.

### 8.6 KI: der Branchenstandard ist Geschwindigkeit, nicht Kreativität

Der Massstab bei fortgeschrittenen Händlern ist der „3-day frontline standard":
ein zugekauftes Fahrzeug ist innert 72 Stunden auf allen angebundenen Kanälen
live, mit automatisierter Foto-Pipeline (Hintergrund, Zuschnitt, Hero-Shot,
plattformspezifische Formate). Dazu KI-Beschreibungen und Preisprognose.
Relevanter Datenpunkt für die Maschinenlesbarkeit: **rund 30% der Käufer nutzen
bereits generative KI für die Fahrzeugrecherche.**

### Was ich trotzdem nicht bekommen habe

Die **vollständige AS24-Preistabelle für Private** (14/30/60/unbegrenzt ×
Basic/Plus/Premium/Unlimited). Die Suche liefert Eckwerte (ab 34, Basic 59, Plus
99), nicht das ganze Raster; die Seite selbst ist aus dieser Umgebung nicht
abrufbar. Dafür braucht es einen Blick von einem Rechner mit offenem Netz.

---

## 9. Korrektur (31.7.): CAR FOR YOU ist tot — und das ist die wichtigere Lehre

Vince hat den Fehler gefunden: ich habe CAR FOR YOU als lebenden Wettbewerber
behandelt. **SMG hat die Plattform 2024 abgeschaltet**; im Automotive-Portfolio
ist nur noch AutoScout24. Grund laut SMG: die Nutzerzahlen waren in den zwei
Jahren davor deutlich zurückgegangen.

Das erfolgsbasierte Preismodell (CHF 200 + 200 pro verkauftem Auto, Deckel
1'000) war damit der **letzte Versuch einer sterbenden Plattform**, nicht ein
funktionierendes Konkurrenzangebot.

### Was daraus wirklich folgt — und es ist unbequemer

**CAR FOR YOU ist die Warnung, nicht die Vorlage.** Die Plattform war günstiger
als AutoScout24, hatte ein händlerfreundliches Erfolgsmodell, gehörte erst der
TX Group und dann SMG — also Geld, Marketing und Reichweite im Rücken. Sie ist
trotzdem gestorben, weil die **Käufer** nicht kamen.

Das ist exakt BuyAutos strategische Position, nur mit weniger Kapital. Die
Schlussfolgerung ist unangenehm klar:

> **Der Preis ist nicht dein Engpass. Die Nachfrage ist es.**
> Ein besseres Preismodell hat CAR FOR YOU nicht gerettet, und es wird BuyAuto
> nicht retten. Wenn Garagen kommen und keine Anfragen bekommen, kündigen sie
> innert Monaten — genau die 3–5% monatliche SMB-Churn aus Abschnitt 2.

Damit bestätigt sich der eine Kritikpunkt, den ich selbst zu tief gewichtet
hatte: **niemand hat untersucht, woher die Käufer kommen.** Die 27
SEO-Landingpages im Repo sind faktisch die Go-to-Market-Strategie, und keine
einzige Recherche-Perspektive hat sie bewertet. Das gehört vor jede weitere
Preisdiskussion.

### Drei weitere Korrekturen aus derselben Recherche

**a) „Garagen wechseln gerade" war zu stark formuliert.** Die Realität laut
Branchenpresse: viele Garagisten sind unzufrieden, aber **die wenigsten
kündigen tatsächlich**. AutoScout24 liefert weiterhin die beste Lead-Qualität,
und genau deshalb bleiben sie. Das Fenster existiert — aber es ist ein Fenster
für Gespräche und Zweitplatzierungen, nicht für Massenwechsel.

**b) Der Preisüberwacher hat sich mit SMG geeinigt.** Inserenten erhalten
günstigere Konditionen. Das heisst: **der Preisabstand, auf dem meine Argumentation
teilweise ruht, kann sich verkleinern.** Baue die Positionierung nicht allein auf
„AS24 ist teuer" — das kann dir wegregulieren.

**c) Der AGVS empfiehlt seinen Mitgliedern bereits konkrete Alternativen:
Autolina und Carmarket.** Carmarket wächst dadurch spürbar. Das ist die
wichtigste praktische Konsequenz dieser Korrektur:

> **Der Branchenverband macht Distribution — gratis — und BuyAuto steht nicht
> auf der Liste.** Auf diese Empfehlungsliste zu kommen ist wahrscheinlich mehr
> wert als jede Änderung an den Paketen. Das ist der Ersatz für die
> comparis-Empfehlung, die ich in Abschnitt 8.5 abstufen musste.

### Und die Marktkonzentration ist grösser als meine Tabelle zeigt

SMG besitzt **AutoScout24, MotoScout24, tutti, anibis, Ricardo, Homegate und
ImmoScout24** — und hat zusätzlich das C2B-Geschäft von CARAUKTION in AS24
integriert. Von den „Wettbewerbern" in der Tabelle in Abschnitt 1 sind AS24,
tutti, anibis und Ricardo **ein einziges Unternehmen**.

Wirklich unabhängig sind: **autolina, automo.ch, Carmarket** (händlereigen, Emil
Frey) — und BuyAuto.

Das ist ein besseres Verkaufsargument als der Preis: nicht „wir sind günstiger",
sondern **„wir gehören nicht denen, die dir jedes Jahr die Rechnung erhöhen"**.
Der Preisüberwacher und die WEKO-Untersuchung stützen das, und es lässt sich
nicht wegregulieren.

---

## Quellen (live recherchiert)

**Schweiz**
- [AutoScout24 B2B — Abos](https://b2b.autoscout24.ch/abos-v3/) · [Premium-Pakete](https://b2b.autoscout24.ch/premium-pakete/) · [Completeness Score](https://b2b.autoscout24.ch/completeness-score/) · [Bilderpaket](https://b2b.autoscout24.ch/aboss/bilderpaket/) · [HCI JSON](https://b2b.autoscout24.ch/neue-hci-json-schnittstelle-flexibler-schneller-zukunftssicher/) · [Cockpit](https://b2b.autoscout24.ch/cockpit-handlungsempfehlungen-ihre-neue-schaltzentrale-fuer-erfolgreiche-inserate/)
- ~~CAR FOR YOU: erfolgsbasiertes Preismodell~~ — Plattform 2024 abgeschaltet, siehe Abschnitt 9
- [Carmarket (Emil Frey), auto-wirtschaft.ch](https://www.auto-wirtschaft.ch/news/carmarket-die-auto-verkaufsplattform-von-profis-fur-profis-wird-2-jahre-alt)
- [anibis AutoPRO](https://www.anibis.help/hc/de/articles/14606795418258-Neues-anibis-ch-Abonnement-AutoPRO) · [tutti Fahrzeug-Abos](https://www.tutti.ch/de/subscription/vehicle)
- [autolina Händler](https://www.autolina.ch/en/haendler_info) · [automo.ch Preise](https://automo.ch/en/prices-automo-ch-offer/)
- [gowago.ch](https://gowago.ch/de) · [LeasingPlatz.ch](https://leasingplatz.ch/inserieren-und-uebergeben/)
- [AutoScout24 Direct](https://www.autoscout24.ch/de/direct) · [Ricardo rückerstattbare Einstellgebühr](https://help.ricardo.ch/hc/de/articles/21355925904284-R%C3%BCckerstattbare-Einstellgeb%C3%BChr-f%C3%BCr-Fahrzeuge-ab-dem-12-01-2026)
- [AGVS: «Wir wünschen uns Wettbewerb und faire Preise»](https://www.agvs-upsa.ch/de/news/wir-wuenschen-uns-wettbewerb-und-faire-preise) · [Garagisten verlassen AutoScout24](https://www.streetlife.ch/artikel/jetzt-reicht-es-warum-schweizer-garagisten-autoscout24-jetzt-massenweise-verlassen) · [WEKO ermittelt gegen SMG](https://insideparadeplatz.ch/2025/09/10/weko-ermittelt-gegen-swiss-marketplace/)
- [comparis carfinder](https://en.comparis.ch/carfinder/autokaufen/autoscout24) · [Typenscheinnummer](https://en.comparis.ch/carfinder/autokaufen/typenscheinnummer)
- [anibis Treuhandservice](https://swissmarketplace.group/de/media-release/anibis-ch-lanciert-treuhandservice-fuer-mehr-sicherheit-beim-kaufen-und-verkaufen/) · [Eurotax/TCS](https://www.tcs.ch/de/testberichte-ratgeber/ratgeber/fahrzeug-kaufen-verkaufen/eurotax-fahrzeugbewertung.php)

**Europa**
- [Auto Trader Retail Rating](https://help.autotrader.co.uk/hc/en-gb/articles/19690017165981-What-is-Retail-Rating) · [Retail Check](https://www.autotrader.co.uk/partners/retailer/solutions/retail-check) · [Deal Builder](https://www.autotrader.co.uk/partners/retailer/deal-builder) · [Co-Driver](https://plc.autotrader.co.uk/news-views/press-releases/auto-trader-unlocks-ai-powered-retailing-for-all-retailers-with-launch-of-co-driver/) · [ARPR GBP 2'995](https://www.motortrader.com/motor-trader-news/automotive-news/average-amount-dealers-pay-to-auto-trader-per-month-rises-5-to-2994-06-11-2025)
- [mobile.de Preisstruktur](https://www.autohaus.de/nachrichten/autohandel/fahrzeugboerse-neue-preisstruktur-bei-mobile-de-2727359) · [Lead Management](https://newsroom.mobile.de/lead-management/) · [Preisbewertung](https://www.autoscout24.de/promo-lp/preisbewertung/)
- [Motorway Service Fees](https://motorway.co.uk/service-fees) · [LeasingMarkt.de Kosten](https://www.leasingmarkt.de/kosten) · [OTOMOTO Pay](https://media.otomoto.pl/rusza-otomoto-pay-pierwsze-zintegrowane-z-platforma-motoryzacyjna-narzedzie-do-finansowania)

**Global**
- [CarGurus IMV](https://cargurus.helpscoutdocs.com/article/10-what-is-imv) · [carsales Price Indicator](https://help.carsales.com.au/hc/en-gb/articles/360015482932-carsales-Price-Indicators-FAQs) · [carsales Instant Offer](https://help.carsales.com.au/hc/en-gb/articles/360020475032-Instant-Offer-FAQs)
- [Cars.com / Accu-Trade](https://www.cars.com/articles/cars-to-acquire-the-accu-trade-group-adds-digital-vehicle-acquisition-to-the-cars-platform-446778/) · [Goo Inspection](https://www.gooinspection.com/en/) · [Vroom-Abwicklung](https://wolfstreet.com/2024/01/23/another-online-used-car-dealer-bites-the-dust-vroom-3-5-years-after-red-hot-ipo-shuts-down-as-ally-suspends-credit-line/)

**Nachtrag 31.7.**
- [AS24 Produkte und Preise (privat)](https://www.autoscout24.ch/de/produkte-und-preise) · [Geld-zurück-Garantie, AUTO&Wirtschaft](https://auto-wirtschaft.ch/news/5491-auto-verkauft-oder-inseratepreis-zuruck-bei-autoscout24) · [Ringier-Mitteilung](https://www.ringier.com/de/autoscout24-lanciert-fuer-private-ein-neues-angebot-mit-geld-zurueck-garantie/) · [motortipps: nach 4 Monaten Geld zurück](https://motortipps.ch/autoscout24-nach-4-monaten-geld-zurueck/)
- [tutti: Fahrzeuginserate — gratis und kostenpflichtig](https://www.tutti.help/hc/de/articles/22848726798098-Fahrzeuginserate-%C3%9Cbersicht-von-kostenlosen-und-geb%C3%BChrenpflichtigen-Inserats-Optionen) · [anibis: dasselbe](https://www.anibis.help/hc/de/articles/22621870923282-Fahrzeuginserate-%C3%9Cbersicht-von-kostenlosen-und-geb%C3%BChrenpflichtigen-Inserats-Optionen)
- [carVertical Schweiz](https://www.carvertical.com/ch/dekodieren-der-fahrgestellnummer-vin) · [anibis Treuhandservice (Tripartie)](https://swissmarketplace.group/de/media-release/anibis-ch-lanciert-treuhandservice-fuer-mehr-sicherheit-beim-kaufen-und-verkaufen/)
- [AS24: Was ist die DMS API](https://help.autoscout24.ch/hc/de/articles/34448520065170-Was-ist-die-DMS-API) · [AS24 HCI-JSON-Schnittstelle](https://www.garagen-website.ch/angebot/autoscout24-schnittstelle/) · [Garagensoftware-Vergleich Schweiz](https://garagensoftwarevergleich.ch/software)
- [comparis: Insertion via AutoScout24](https://en.comparis.ch/carfinder/autokaufen/autoscout24) · [AS24: Insertion auf comparis](https://b2b.autoscout24.ch/aboss/insertion-auf-comparis/) · [comparis Carfinder Lancierung als Metasuchmaschine](https://www.presseportal.ch/de/pm/100003671/100489526)
- [Spyne: KI-Foto-Pipelines und der 3-Tage-Frontline-Standard](https://www.spyne.ai/blogs/best-car-photo-editing-tools-for-dealerships)

**Korrektur 31.7. (Abschnitt 9)**
- [Inside Paradeplatz: SMG bündelt Kräfte bei Auto-Annoncen — Car For You deaktiviert](https://insideparadeplatz.ch/2024/03/09/onine-herrscherin-der-verlage-buendelt-kraefte-bei-auto-annoncen/) · [AGVS: «Autoscout24 und Car For You bleiben erhalten» (frühere Zusage)](https://www.senseseegaragist.ch/de/news/news-archiv/autoscout24-und-car-you-bleiben-erhalten)
- [Swiss Marketplace Group (Wikipedia)](https://de.wikipedia.org/wiki/Swiss_Marketplace_Group) · [Scout24 Schweiz (Wikipedia)](https://de.wikipedia.org/wiki/Scout24_Schweiz)
- [NZZ: SMG einigt sich mit dem Preisüberwacher — günstigere Konditionen für Inserenten](https://www.nzz.ch/wirtschaft/inserenten-erhalten-guenstigere-konditionen-auf-online-marktplaetzen-wie-ricardo-und-homegate-ld.1918966) · [NZZ: Gibt es genügend Wettbewerb bei den Online-Marktplätzen?](https://www.nzz.ch/wirtschaft/ricardo-tutti-homegate-autoscout24-schroepft-die-swiss-marketplace-group-ihre-kunden-ld.1774737)
- [SMG: AutoScout24 integriert C2B-Geschäft von CARAUKTION](https://swissmarketplace.group/de/media-release/autoscout24-integriert-c2b-geschaeftsmodell-carauktion-konzentriert-sich-auf-b2b-kerngeschaeft/)

**Preispsychologie**
- [HBR: Good-Better-Best](https://hbr.org/2018/09/the-good-better-best-approach-to-pricing) · [Centre-Stage-Effekt](https://www.coglode.com/research/centre-stage-effect) · [Decoy-Effekt repliziert nicht](https://journals.sagepub.com/doi/abs/10.1509/jmr.12.0061) · [Usage Caps](https://stripe.com/resources/more/usage-caps-how-to-protect-performance-and-turn-usage-into-revenue) · [Marktplatz-Dynamik (Andrew Chen)](https://stripe.com/guides/atlas/andrew-chen-marketplaces) · [SMB-Churn-Benchmarks](https://optif.ai/learn/questions/b2b-saas-churn-rate-benchmark/) · [Preistransparenz B2B](https://www.pacepricing.com/blog/hidden-prices-lost-buyers-why-b2b-saas-companies-should-embrace-transparency)
