/**
 * Checks for the comp-selection logic: `npx tsx scripts/test-comps-parser.ts`.
 * Exits non-zero on the first failed assertion.
 *
 * Variant names are the live catalog's (2026-10): VW Golf, Audi A4, BMW M3,
 * Mercedes AMG C 43, Tesla Model S. Regression: a "Golf R" lookup used to
 * drop the real Golf Rs as price outliers and value the car on plain Golfs.
 */
import assert from "node:assert/strict";
import {
  as24CategoryUrl,
  drivetrainOf,
  gearboxOf,
  modelPrecision,
  selectComps,
  splitVariant,
  stripModelPrefix,
  variantIdentity,
  variantVerdict,
  type CompCandidate,
} from "../src/lib/buyauto/compsParser";

// --- splitVariant ----------------------------------------------------------
assert.deepEqual(splitVariant("R"), { displacement: null, identity: "R", drive: null });
assert.deepEqual(splitVariant("GTI Clubsport"), { displacement: null, identity: "GTI Clubsport", drive: null });
assert.deepEqual(splitVariant("1.5 TSI"), { displacement: "1.5", identity: "", drive: null });
assert.deepEqual(splitVariant("2.0 TDI 4MOTION"), { displacement: "2.0", identity: "", drive: "Allrad" });
assert.deepEqual(splitVariant("40 TFSI quattro"), { displacement: null, identity: "40", drive: "Allrad" });
assert.deepEqual(splitVariant("C 220 d"), { displacement: null, identity: "C 220 d", drive: null });
assert.deepEqual(splitVariant("Competition xDrive"), { displacement: null, identity: "Competition", drive: "Allrad" });
assert.deepEqual(splitVariant("1.5 eHybrid"), { displacement: "1.5", identity: "eHybrid", drive: null });
assert.equal(splitVariant("Plaid").identity, "Plaid");
assert.deepEqual(splitVariant("C 43 4MATIC"), { displacement: null, identity: "C 43", drive: "Allrad" });
assert.deepEqual(splitVariant("1.5 eTSI"), { displacement: "1.5", identity: "", drive: null });
assert.equal(splitVariant("xDrive30d").identity, "30d");

// --- variantVerdict ----------------------------------------------------------
const golfSiblings = [
  "1.0 TSI", "1.2", "1.2 TSI", "1.4", "1.4 TGI", "1.4 TSI", "1.5 eTSI", "1.5 TGI",
  "1.5 TSI", "1.6", "1.6 TDI", "1.8 TSI", "2.0 TDI", "2.0 TDI 4MOTION", "GTD", "GTE",
  "GTI", "GTI Clubsport", "GTI TCR", "R",
].map((v) => splitVariant(v).identity);
const vv = (title: string, identity: string, url = "") => variantVerdict(title, url, identity, golfSiblings);

assert.equal(vv("VW Golf R 2.0 TSI 4Motion DSG", "R"), "match");
assert.equal(vv("VW Golf 8 R 20 Years", "R"), "match");
assert.equal(vv("VW Golf VII R", "R"), "match");
assert.notEqual(vv("VW Golf 1.5 TSI R-Line", "R"), "match");
assert.notEqual(vv("VW Golf R Line 1.5 eTSI", "R"), "match");
assert.equal(vv("VW Golf GTI Clubsport", "R"), "mismatch");
assert.equal(vv("VW Golf Life", "R"), "unknown");
assert.notEqual(vv("VW Golf Rabbit", "R"), "match");
assert.equal(vv("VW Golf GTI Clubsport", "GTI"), "mismatch");
assert.equal(vv("VW Golf GTI Performance", "GTI"), "match");
assert.equal(vv("VW Golf GTI Clubsport", "GTI Clubsport"), "match");
assert.equal(vv("VW Golf 1.4 TSI GTE", "GTE"), "match");
// The URL slug counts too, and portal structure ("/de/d/") is not a variant.
assert.equal(vv("VW Golf", "R", "https://www.autoscout24.ch/de/d/vw-golf-r-2-0-tsi-dsg-4motion-10826494"), "match");
assert.equal(vv("VW Golf", "R", "https://www.autoscout24.ch/de/d/vw-golf-1-5-tsi-r-line-10826494"), "unknown");
// Empty identity: nothing to check.
assert.equal(vv("VW Golf R", ""), "unknown");
// Free-text model (no siblings): match or unknown only.
assert.equal(variantVerdict("VW Golf GTI", "", "R", []), "unknown");

const a4Siblings = ["35 TDI", "40 TFSI quattro", "45 TFSI quattro", "2.0 TDI quattro"].map(
  (v) => splitVariant(v).identity
);
assert.equal(
  variantVerdict("Audi A4 Avant 40 TFSI S line S-tronic quattro", "", "40", a4Siblings),
  "match"
);
assert.equal(variantVerdict("Audi A4 Avant 45 TFSI S line quattro", "", "40", a4Siblings), "mismatch");
// A price is not a designation.
assert.equal(variantVerdict("Audi A4 Avant CHF 40'900", "", "40", a4Siblings), "unknown");
// Glued Mercedes designations.
assert.equal(variantVerdict("Mercedes-Benz C220d AMG Line", "", "C 220 d", []), "match");
assert.equal(variantVerdict("Mercedes-AMG C 43 4MATIC", "", "C 43", []), "match");

// --- modelPrecision (free-text "Golf R") ----------------------------------
assert.equal(modelPrecision("VW Golf R 2.0 TSI", "Golf R"), 0);
assert.equal(modelPrecision("VW Golf R-Line 1.5 TSI", "Golf R"), 1);
assert.equal(modelPrecision("VW Golf Rabbit", "Golf R"), 1);
assert.equal(modelPrecision("VW Golf 1.5tsi Life", "Golf 1.5 TSI"), 0);

// --- gearboxOf / drivetrainOf ---------------------------------------------
assert.equal(gearboxOf("Audi A4 Avant 45 TFSI S line S-tronic quattro"), "Automatik");
assert.equal(drivetrainOf("Audi A4 Avant 45 TFSI S line S-tronic quattro"), "Allrad");
assert.equal(gearboxOf("BMW 320d xDrive Steptronic"), "Automatik");
assert.equal(drivetrainOf("BMW 320d xDrive Steptronic"), "Allrad");
assert.equal(gearboxOf("Mercedes C 220 d 9G-Tronic"), "Automatik");
assert.equal(drivetrainOf("Mercedes C 220 d 9G-Tronic"), null);
assert.equal(gearboxOf("VW Golf 1.5 TSI"), null);
assert.equal(drivetrainOf("VW Golf 1.5 TSI"), null);
assert.equal(gearboxOf("Mercedes GLC 43 4Matic+"), null);
assert.equal(drivetrainOf("Mercedes GLC 43 4Matic+"), "Allrad");
assert.equal(gearboxOf("VW Golf 1.5 TSI 6-Gang manuell"), "Manuell");
assert.equal(gearboxOf("vw-golf-2-0-tsi-dsg"), "Automatik");
assert.equal(drivetrainOf("BMW 118i sDrive"), "2WD");
assert.equal(drivetrainOf("Maserati Quattroporte"), null);

// --- selectComps -------------------------------------------------------------
let n = 0;
const comp = (title: string, price: number, km: number): CompCandidate => ({
  title,
  price,
  km,
  url: `https://www.autoscout24.ch/de/d/listing-${1_000_000 + n++}`,
  source: "autoscout24.ch",
});
const plainGolfs = [
  comp("VW Golf 1.5 TSI Life", 14_500, 60_000),
  comp("VW Golf 1.5 eTSI Style DSG", 18_000, 40_000),
  comp("VW Golf 2.0 TDI Highline", 15_200, 90_000),
  comp("VW Golf Comfortline", 16_000, 70_000),
  comp("VW Golf 1.0 TSI", 14_000, 55_000),
  comp("VW Golf Life", 17_500, 35_000),
];
const golfRs = [
  comp("VW Golf R 2.0 TSI 4Motion DSG", 38_500, 45_000),
  comp("VW Golf 8 R 20 Years", 42_000, 20_000),
  comp("VW Golf VII R", 36_000, 80_000),
];
const rLine = comp("VW Golf 1.5 TSI R-Line", 24_000, 30_000);
const harvest = [...plainGolfs, ...golfRs, rLine];

// Back-compat (no variant): the plain majority anchors the band, Rs fall out.
const plain = selectComps(harvest, "Golf", 50_000);
assert.ok(plain.picked.every((c) => !golfRs.includes(c)));
assert.equal(plain.droppedForVariant, 0);
assert.equal(plain.variantUnverified, 0);

// Variant R: only the Golf Rs, no plain Golf, no R-Line.
const golfR = selectComps(harvest, "Golf", 50_000, null, {
  variant: { identity: "R", siblings: golfSiblings.filter((s) => s && s !== "R") },
});
assert.deepEqual(new Set(golfR.picked), new Set(golfRs));
assert.equal(golfR.droppedOutliers, 0);
assert.equal(golfR.toppedUp, 0);
assert.equal(golfR.variantUnverified, 7); // six plain Golfs + the R-Line
// Same without siblings (free text): unknowns are still set aside.
const golfRNoSiblings = selectComps(harvest, "Golf", 50_000, null, {
  variant: { identity: "R", siblings: [] },
});
assert.deepEqual(new Set(golfRNoSiblings.picked), new Set(golfRs));

// Unknown mileage: picks exist, no NaN, not biased to the lowest-km cars.
const spread = [
  comp("VW Golf Life", 25_000, 5_000),
  comp("VW Golf Life", 24_000, 8_000),
  comp("VW Golf Life", 21_000, 60_000),
  comp("VW Golf Life", 20_000, 65_000),
  comp("VW Golf Life", 19_500, 70_000),
  comp("VW Golf Life", 19_000, 75_000),
  comp("VW Golf Life", 18_500, 80_000),
  comp("VW Golf Life", 15_000, 160_000),
  comp("VW Golf Life", 14_000, 170_000),
];
const noKm = selectComps(spread, "Golf", null);
assert.equal(noKm.picked.length, 5);
assert.equal(noKm.relaxed, false);
assert.ok(noKm.picked.every((c) => Number.isFinite(c.km) && Number.isFinite(c.price)));
assert.deepEqual(
  noKm.picked.map((c) => c.km).sort((a, b) => a - b),
  [60_000, 65_000, 70_000, 75_000, 80_000]
);
assert.equal(selectComps([], "Golf", null).picked.length, 0);

// Gearbox/drive rank but never filter.
const a4 = [
  comp("Audi A4 Avant 40 TFSI S tronic", 30_000, 50_000),
  comp("Audi A4 Avant 40 TFSI quattro S tronic", 31_000, 52_000),
  comp("Audi A4 Avant 40 TFSI Schaltgetriebe", 29_000, 49_000),
];
const a4Pick = selectComps(a4, "A4", 50_000, null, { gearbox: "Automatik", drivetrain: "Allrad" });
assert.equal(a4Pick.picked.length, 3);
assert.equal(a4Pick.picked[0].title, "Audi A4 Avant 40 TFSI quattro S tronic");
assert.equal(a4Pick.picked[2].title, "Audi A4 Avant 40 TFSI Schaltgetriebe");

// --- Equipment lines are not the performance trim ----------------------------
// Live catalog (2026-10): Focus ... RS, ST; i30 ... N; Ceed ... GT; Clio ... GT, RS.
const focusSiblings = ["1.0 EcoBoost", "1.5 EcoBoost", "2.0 TDCi", "RS", "ST"].map((v) => splitVariant(v).identity);
assert.equal(variantVerdict("Ford Focus 2.3 EcoBoost ST", "", "ST", focusSiblings), "match");
assert.notEqual(variantVerdict("Ford Focus 1.0 EcoBoost ST-Line X", "", "ST", focusSiblings), "match");
assert.notEqual(variantVerdict("Ford Focus ST Line 1.5", "", "ST", focusSiblings), "match");
assert.equal(variantVerdict("Hyundai i30 N Performance", "", "N", []), "match");
assert.notEqual(variantVerdict("Hyundai i30 1.5 T-GDi N Line", "", "N", []), "match");
assert.notEqual(variantVerdict("Hyundai i30 1.5 T-GDi N-Line", "", "N", []), "match");
assert.equal(variantVerdict("Kia ProCeed 1.6 T-GDi GT", "", "GT", []), "match");
assert.notEqual(variantVerdict("Kia ceed 1.6 T-GDi GT-Line DCT", "", "GT", []), "match");
assert.notEqual(variantVerdict("Kia Ceed GT Line", "", "GT", []), "match");
assert.equal(variantVerdict("Renault Clio R.S. 200 EDC", "", "RS", []), "match");
assert.notEqual(variantVerdict("Renault Clio R.S. Line TCe 140", "", "RS", []), "match");
assert.notEqual(variantVerdict("Renault Clio RS Line", "", "RS", []), "match");
assert.notEqual(variantVerdict("Renault Clio GT Line", "", "GT", []), "match");
assert.equal(modelPrecision("Ford Focus ST-Line", "Focus ST"), 1);

// 4 real Focus ST against 8 cheap ST-Lines: the median must be the STs'.
const focusHarvest = [
  comp("Ford Focus 2.3 EcoBoost ST", 33_000, 40_000),
  comp("Ford Focus ST 2.3", 32_000, 55_000),
  comp("Ford Focus ST Performance", 35_000, 30_000),
  comp("Ford Focus 2.0 TDCi ST", 32_500, 60_000),
  ...[17_000, 17_500, 18_000, 18_500, 19_000, 19_500, 20_000, 20_500].map((p, i) =>
    comp(i % 2 ? "Ford Focus 1.0 EcoBoost ST-Line" : "Ford Focus 1.0 EcoBoost ST Line X", p, 40_000 + i * 5_000)
  ),
];
const focusSt = selectComps(focusHarvest, "Focus", 50_000, null, {
  variant: { identity: "ST", siblings: focusSiblings },
});
assert.equal(focusSt.picked.length, 4);
assert.ok(focusSt.picked.every((c) => c.price >= 32_000), "an ST-Line got into a Focus ST median");

// --- Catalog rows that repeat the model name ------------------------------
assert.equal(stripModelPrefix("X3 20d", "X3"), "20d");
assert.equal(stripModelPrefix("Panamera 4S", "Panamera"), "4S");
assert.equal(stripModelPrefix("20d", "X3"), "20d");
assert.equal(stripModelPrefix("C 220 d", "C-Klasse"), "C 220 d");
assert.equal(stripModelPrefix("3 Series 320d", "3 Series"), "320d");
assert.equal(variantIdentity("X3 20d xDrive", "X3"), "20d");
assert.equal(variantIdentity("IX1 30 xDrive", "iX1"), "30");
assert.equal(variantIdentity("I5 eDrive40", "i5"), "eDrive40");
// Live BMW X3 list: the duplicate "X3 20d xDrive" collapses onto "xDrive20d".
const x3Names = [
  "M40d", "M40i", "sDrive18d", "sDrive20i", "X3 20d xDrive", "xDrive18d", "xDrive20d", "xDrive20i",
  "xDrive23d", "xDrive25d", "xDrive28i", "xDrive30d", "xDrive30e", "xDrive30i", "xDrive35d", "xDrive35i",
];
const x3Own = variantIdentity("xDrive20d", "X3");
const x3Siblings = [...new Set(x3Names.map((v) => variantIdentity(v, "X3")).filter((id) => id && id !== x3Own))];
assert.equal(variantVerdict("BMW X3 xDrive20d M Sport Steptronic", "", x3Own, x3Siblings), "match");
assert.equal(variantVerdict("BMW X3 xDrive 20d xLine", "", x3Own, x3Siblings), "match");
assert.equal(variantVerdict("BMW X3 xDrive30d M Sport", "", x3Own, x3Siblings), "mismatch");
assert.equal(variantVerdict("BMW X3 M40d", "", x3Own, x3Siblings), "mismatch");
// Live Porsche Panamera list: "Panamera 4" is the base of "4 E-Hybrid".
const panameraNames = [
  "4 E-Hybrid", "4S Diesel", "4S E-Hybrid", "Diesel", "GTS", "Panamera 4", "Panamera 4S", "S",
  "S E-Hybrid", "Turbo", "Turbo E-Hybrid", "Turbo S", "Turbo S E-Hybrid",
];
const p4 = variantIdentity("Panamera 4", "Panamera");
const p4Siblings = panameraNames.map((v) => variantIdentity(v, "Panamera")).filter((id) => id && id !== p4);
assert.equal(variantVerdict("Porsche Panamera 4 PDK", "", p4, p4Siblings), "match");
assert.equal(variantVerdict("Porsche Panamera 4 E-Hybrid Sport Turismo", "", p4, p4Siblings), "mismatch");
assert.equal(variantVerdict("Porsche Panamera 4S", "", p4, p4Siblings), "mismatch");
const turbo = variantIdentity("Turbo", "Panamera");
assert.equal(variantVerdict("Porsche Panamera Turbo S E-Hybrid", "", turbo, panameraNames.map((v) => variantIdentity(v, "Panamera"))), "mismatch");

// --- Audi TFSI e plug-in hybrids --------------------------------------------
assert.equal(splitVariant("40 TFSI e").identity, "40 tfsie");
assert.equal(splitVariant("55 TFSI e quattro").drive, "Allrad");
const a3Siblings = ["30 TFSI", "35 TFSI", "40 TFSI quattro", "40 TDI quattro", "45 TFSI e", "40 TFSI e"].map(
  (v) => splitVariant(v).identity
);
const a3e = splitVariant("40 TFSI e").identity;
assert.equal(variantVerdict("Audi A3 Sportback 40 TFSI e S line", "", a3e, a3Siblings), "match");
assert.equal(variantVerdict("Audi A3 Sportback 40 TFSIe Advanced", "", a3e, a3Siblings), "match");
assert.equal(variantVerdict("Audi A3 Sportback 40 TFSI quattro S line", "", a3e, a3Siblings), "mismatch");
// ...and the petrol 40 TFSI no longer takes the plug-in hybrids.
assert.equal(variantVerdict("Audi A3 Sportback 40 TFSI e S line", "", "40", a3Siblings), "mismatch");
assert.equal(variantVerdict("Audi A3 Sportback 40 TFSI quattro", "", "40", a3Siblings), "match");

// --- Numbers that are no designation ----------------------------------------
assert.equal(variantVerdict("Audi A4 Avant 2.0 TDI quattro, 40.000 km", "", "40", a4Siblings), "unknown");
assert.equal(variantVerdict("Audi A4 Avant 35 TDI S tronic 40 000 km", "", "40", a4Siblings), "mismatch");
assert.equal(variantVerdict("Audi A4 Avant CHF 40 900", "", "40", a4Siblings), "unknown");
assert.equal(
  variantVerdict("Audi A4 Avant", "https://www.tutti.ch/de/vi/audi-a4-avant-40-000-km/12345678", "40", a4Siblings),
  "unknown"
);
// "3.0" is a displacement, not Audi's "30".
assert.equal(variantVerdict("Audi A4 Avant 3.0 TDI quattro", "", "30", []), "unknown");
assert.equal(variantVerdict("Audi A4 Avant 30 TDI S tronic", "", "30", []), "match");
// Names with spaced numbers survive ("C 63 507", "911 992").
assert.equal(variantVerdict("Mercedes-AMG C 63 507 Edition", "", "C 63", []), "match");

// --- Engine descriptors in displacement variants ------------------------------
assert.equal(splitVariant("1.6 Ti-VCT").identity, "");
assert.equal(splitVariant("1.6 CDTI").identity, "");
assert.equal(splitVariant("1.6 T-GDi").identity, "");
assert.equal(splitVariant("2.0 EcoBlue").identity, "");
assert.equal(splitVariant("1.0 MPI").identity, "");
// What no list covers ("4.0 Turbo", "1.5 Diesel") still finds the engine-only
// comps as top-ups, not zero.
const focus16 = [
  comp("Ford Focus 1.6 Trend", 9_000, 90_000),
  comp("Ford Focus 1.6 Titanium", 9_500, 80_000),
  comp("Ford Focus 1.6 Diesel Titanium", 9_800, 85_000),
  comp("Ford Focus 1.6 Ghia", 8_500, 110_000),
  comp("Ford Focus 2.0 Titanium", 11_000, 70_000),
];
const diesel = selectComps(focus16, "Focus 1.6", 90_000, null, {
  variant: { identity: "Diesel", siblings: [], displacement: "1.6" },
});
assert.equal(diesel.picked[0].title, "Ford Focus 1.6 Diesel Titanium");
assert.equal(diesel.picked.length, 4);
assert.equal(diesel.toppedUp, 3);
// A trim variant without a displacement keeps the strict rule (Golf R).
const strictR = selectComps(harvest, "Golf", 50_000, null, {
  variant: { identity: "R", siblings: golfSiblings, displacement: null },
});
assert.ok(strictR.picked.every((c) => c.price > 30_000));

// --- as24CategoryUrl: no mileage window when km is unknown -------------------
const noKmUrl = as24CategoryUrl("Volkswagen", "Golf", { yearFrom: 2019, yearTo: 2023, body: null });
assert.equal(
  noKmUrl,
  "https://www.autoscout24.ch/de/s/mo-golf/mk-vw?firstRegistrationYearFrom=2019&firstRegistrationYearTo=2023"
);
assert.ok(!noKmUrl.includes("mileage"));

console.log("All comps-parser checks passed.");
