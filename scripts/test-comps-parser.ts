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

// --- as24CategoryUrl: no mileage window when km is unknown -------------------
const noKmUrl = as24CategoryUrl("Volkswagen", "Golf", { yearFrom: 2019, yearTo: 2023, body: null });
assert.equal(
  noKmUrl,
  "https://www.autoscout24.ch/de/s/mo-golf/mk-vw?firstRegistrationYearFrom=2019&firstRegistrationYearTo=2023"
);
assert.ok(!noKmUrl.includes("mileage"));

console.log("All comps-parser checks passed.");
