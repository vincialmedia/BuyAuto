# Vehicle Catalog Extension — Models from 2010 Onwards

## What this is

The make/model catalog (`public/Makes_Models_V2.csv`, mirrored in
`public/buyauto_master_make_model_giant_list_v2.csv`, served from the Supabase
`makes` / `models` tables) was reviewed make-by-make against the vehicles
actually sold new on the Swiss/European market from 2010 onwards. This
extension adds **655 models** and **15 makes** (1,133 → 1,788 rows),
delivered in two passes.

### Pass 1 — nameplate coverage (264 models, 15 new makes)

Filled the missing distinct nameplates and the 15 absent makes (Abarth,
Aiways, Alpina, BYD, Caterham, Chrysler, Dodge, Fisker, Jaecoo, KTM, MG,
Maxus, Omoda, RAM, Saab). See the sections further down.

### Pass 2 — derivative & performance-trim audit (+391 models)

A follow-up audit of every make (38 make-groups, each audited then
adversarially verified with web checks) caught the factory
performance/body derivatives that marketplaces list as their own model but
that pass 1 missed — the "Golf GTI Clubsport" class of gap. Every proposal
was rejected unless it is a real European-market production model, uses the
Swiss/European market name, matches that make's existing catalog
granularity, and does not collide with an existing row under
`normalize_vehicle_name()`. Highlights:

- **VW** Golf GTI Clubsport, Golf GTI TCR, Golf GTI/GTD/R Variant &
  Cabriolet gaps, up! GTI, Scirocco R, Polo R WRC, Touareg R, XL1, and the
  ID.3/4/5/7 GTX + ID. Buzz GTX electric-performance line.
- **BMW** (47) the missing M-derivatives and engine designations; **Mercedes**
  (54) the remaining AMG variants (AMG A/C/E/G/GLC/GLE/S "xx" gaps) and
  classes; **Audi** (23) S/RS gaps and Avant/Cabriolet body styles;
  **Porsche** (31) 911/Cayenne/Panamera derivative depth.
- **Hot hatches / warm derivatives** Hyundai N, Renault RS/E-Tech, Peugeot
  GTi, Opel/Vauxhall OPC/VXR-era models, MINI JCW/Cooper S body+trim combos,
  Suzuki Swift Sport, Mitsubishi Lancer Evolution, Alfa 147/GT.
- **Supercar/halo depth** matching each make's existing granularity: Ferrari
  458 Speciale / F12tdf / 812 Competizione / SF90 XX / 296 Speciale;
  Lamborghini Veneno / Sesto Elemento / Essenza SCV12; Aston Martin Zagato /
  Speedster / Valiant one-offs; Bugatti Brouillard; Koenigsegg Sadair's
  Spear; Rimac Nevera R.
- **China-brand & commercial depth** BYD, MG, Maxus, XPeng, NIO, Leapmotor,
  Voyah, Seres, SsangYong, plus vans (Nissan NV, Ford/VW e-commercials,
  Piaggio, Ligier microcars).

What the pass-2 verifiers **rejected** (kept out on purpose): UK-only badges
that are a different make in Switzerland (Chrysler Ypsilon/Delta →
Lancia, Mitsubishi Mirage → Space Star, Shogun Sport → Pajero Sport);
performance trims for makes catalogued only at base-model level (all Nissan
Nismo variants, Jaguar XKR/XFR/XJR, Lancia Ypsilon HF); obsolete regional
names that collide with the standardised row (NIO ES8 → EL8); and
micro-volume specials for mainstream makes (Saab 9-4X).

> Note: three normalized-name collisions already exist in the base catalog
> (`Ford Ka`/`Ka+`, `Kia Cee'd`/`Ceed`, `Toyota C-HR`/`C-HR+`). They predate
> this work; the DB unique index on `(make_id, normalized_name)` keeps only
> one of each pair. Not introduced here — flagged for a future cleanup.

## How to apply to the database

Either one of:

1. **Migration (recommended):** apply
   `supabase/migrations/20260721120000_extend_makes_models_catalog.sql`.
   It is idempotent (`on conflict do nothing`), inserts the 15 new makes and
   655 models (both passes), and tags new model rows with
   `source = 'catalog_extension_2010_onwards'`.
2. **Import script:** `node src/scripts/import-v2-catalog.mjs` re-imports the
   updated CSV (also idempotent).

## New makes added (with their 2010+ model line-ups)

| Make | Why | Models |
|---|---|---|
| Abarth | Sold in CH alongside Fiat since 2008 | 500, 595, 695, 124 Spider, 500e, 600e |
| Alpina | Official CH importer | B3, B4, B5, B6, B7, B8, D3, D4, D5, XB7, XD3, XD4 |
| BYD | CH market entry 2025 (Dolphin Surf from CHF 20,990) | Atto 2, Atto 3, Dolphin, Dolphin Surf, Han, Seal, Seal 6 DM-i, Seal U, Sealion 7, Tang |
| MG | Relaunched in CH 2021; 3,673 cars sold in CH in 2025 | MG3, MG4, MG5, ZS, HS, Marvel R, Cyberster, S5 EV |
| Omoda / Jaecoo | Official CH distribution via EuropeanCar | Omoda 5, E5, 9; Jaecoo 5, 7 |
| Maxus | Distributed in CH by Astara | eDeliver 3, eDeliver 9, Mifa 9, T90 EV |
| Aiways | Sold in CH 2020–2023 | U5, U6 |
| Fisker | Karma (2012), Ocean (2023–24) delivered in CH | Karma, Ocean |
| Saab | Sold new until 2011–2012 | 9-3, 9-5 |
| Chrysler | Sold new until ~2011 | 300C, Grand Voyager |
| Dodge | European sales until 2010–2011 | Avenger, Caliber, Journey, Nitro |
| RAM | Officially imported pickups, common in CH | 1500 |
| Caterham | Sold in CH | Seven |
| KTM | X-Bow street-legal in CH | X-Bow |

## Gaps filled for existing makes (highlights)

- **Discontinued 2010s models that were missing entirely:** Alfa Romeo
  159/Brera/Spider; Audi A4 Avant/allroad, A5 Sportback/Cabriolet, A6
  Avant/allroad; Citroën C1/C5/C6/C8/C4 Cactus/C-Elysée/DS4/DS5/Nemo/C-Zero;
  Fiat Bravo/Croma/Sedici/Idea/Ducato; Ford Fusion/Grand C-MAX; Hyundai
  Elantra/Grand Santa Fe; Kia Rio/Venga/Optima/ProCeed; Lancia
  Delta/Musa/Thema/Flavia; Land Rover Freelander; Jaguar XK; Lexus GS/IS/LFA;
  Mazda CX-7/RX-8; Mercedes GLK/ML/GL/R-Klasse/SLS AMG/Viano/Vito; Nissan
  Note/Pulsar/Pixo/NV200/e-NV200/Qashqai+2; Opel & Vauxhall Astra H/Corsa
  D/Zafira B/Combo C/Vivaro A; Peugeot 107/207/301/308 CC/407/607/807/4007;
  Renault Fluence/Modus/Wind; Seat Exeo; Subaru Tribeca; Suzuki
  Alto/Splash/Kizashi; Toyota Prius Plus; VW Fox/Golf Cabriolet/Golf Plus/Golf
  Sportsvan/e-Golf/e-up!; Volvo C30/C70/S40/V50; Chevrolet (Europe, until
  2015) Aveo/Captiva/Cruze/Volt plus Camaro/Corvette; Daihatsu (until 2013)
  Sirion/Terios/Materia/Copen/Charade/Trevis; Lada Granta/Niva; SsangYong
  Rodius; Infiniti EX/FX/M.
- **BMW engine-designation convention completed:** 114d, 114i, 123d, 128ti,
  135i, 216d, 216i, 316d, 325i, 328i, 428i, 525d, 528i, 535i, M550i, XM.
- **Body/derivative entries in line with catalog conventions:** Porsche 911
  Targa, 911 GT2 RS, Cayenne Coupé, Panamera Sport Turismo, Taycan Cross
  Turismo; VW Passat Variant/Alltrack, Golf Alltrack, Tiguan Allspace; Volvo
  V40/V60/V90 Cross Country; Škoda Enyaq Coupé; Honda Civic Type R.
- **Supercars/exotics:** McLaren 12C, 540C, 570S, 570GT, 600LT, 620R, 650S,
  675LT, 720S, 750S, 765LT, GTS, W1; Ferrari 599, 612 Scaglietti, California,
  Amalfi, 849 Testarossa; Lamborghini Gallardo, Murciélago, Fenomeno; Pagani
  Zonda, Huayra; Aston Martin DBS, Virage, Cygnet, One-77, Vulcan, Valour;
  Bugatti Tourbillon; Koenigsegg One:1; Maserati MCPura.
- **2025/2026 launches (verified July 2026):** VW ID. Polo (pre-sales since
  April 2026), Cupra Raval (market launch summer 2026), Kia EV2 (on sale from
  summer 2026), Volvo EX60 (customer deliveries running), Škoda Epiq,
  Leapmotor B10 (orderable in CH from CHF 29,900), Mitsubishi Grandis (from
  CHF 27,998), Alpine A390, Mazda 6e, Suzuki e Vitara, Honda Prelude,
  Ferrari Amalfi/849 Testarossa, McLaren W1, Bugatti Tourbillon.

## Naming rules respected

- Model names are unique per make under `public.normalize_vehicle_name()`
  (lowercase, unaccented, punctuation stripped) — all additions were checked
  against existing rows so none is silently dropped by
  `on conflict do nothing` (e.g. "Prius Plus" is used instead of "Prius+",
  which would normalize identically to the existing "Prius").
- Make spellings follow the existing catalog ("Mercedes", "Škoda", "Citroën",
  "Seat", "MINI", "smart"), and both CSVs stay byte-identical and sorted in
  the file's original (byte-order) sort.

## Explicitly left out

- Pre-2010-only models (e.g. Alfa 8C, Peugeot 1007, Opel Vectra, VW Fox
  predecessors) — outside the requested range.
- Announced but not yet orderable models (e.g. VW ID. Cross, NIO ET9,
  Polestar 7).
- Brands without credible Swiss distribution (Ora/GWM, VinFast, Togg,
  Hongqi, Rivian, Wiesmann).
- Trim-level variants beyond the catalog's existing granularity.
