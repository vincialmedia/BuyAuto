/**
 * Checks for the decode-tg mappers: `npx tsx scripts/test-decode-tg-mappers.ts`.
 * Exits non-zero on the first failed assertion.
 *
 * The expected values are verified against the LIVE tg_vehicle_types data
 * (2026-09-25): fuel codes B/D/C/F/E/N/Y/K/Z/R/X with example vehicles per
 * code, gearbox codes m6/a8/m5/m7a/m?a/m6a/m1a/m?/s/h1/h2, and the VW model
 * catalog for the prefix matcher (regression: TG 1XZ901 "Golf 8 1.5 eTSI"
 * failed to map to "Golf").
 */
import assert from "node:assert/strict";
import {
  mapTgFuel,
  mapTgTransmission,
  matchModelFromTyp,
} from "../src/pages/api/vehicles/decode-tg";

// --- fuel codes (empirical meanings, see decode-tg comment) ---------------
assert.equal(mapTgFuel("B"), "Benzin");
assert.equal(mapTgFuel("D"), "Diesel");
assert.equal(mapTgFuel("E"), "Elektro");
assert.equal(mapTgFuel("C"), "Hybrid"); // VW Golf 8 1.5 eTSI (1XZ901), Tonale PHEV
assert.equal(mapTgFuel("F"), "Hybrid"); // Alpina D3 S (Diesel-MHEV)
assert.equal(mapTgFuel("R"), "Hybrid"); // BMW i3 REX
assert.equal(mapTgFuel("K"), "Benzin"); // E85
assert.equal(mapTgFuel("N"), null); // CNG — kein FUEL_TYPES-Wert
assert.equal(mapTgFuel("Y"), null); // CNG bivalent
assert.equal(mapTgFuel("Z"), null); // LPG
assert.equal(mapTgFuel("X"), null); // Wasserstoff
assert.equal(mapTgFuel("BE"), "Hybrid");
assert.equal(mapTgFuel("Benzin"), "Benzin");
assert.equal(mapTgFuel(""), null);
assert.equal(mapTgFuel(null), null);

// --- gearbox codes ---------------------------------------------------------
assert.equal(mapTgTransmission("m6"), "Manuell");
assert.equal(mapTgTransmission("m5"), "Manuell");
assert.equal(mapTgTransmission("m?"), "Manuell");
assert.equal(mapTgTransmission("m12"), "Manuell");
assert.equal(mapTgTransmission("m7a"), "Automatik"); // DSG — Regression 1XZ901
assert.equal(mapTgTransmission("m6a"), "Automatik");
assert.equal(mapTgTransmission("m1a"), "Automatik"); // Eingang-Automat (Tesla)
assert.equal(mapTgTransmission("m?a"), "Automatik");
assert.equal(mapTgTransmission("a8"), "Automatik");
assert.equal(mapTgTransmission("a4"), "Automatik");
assert.equal(mapTgTransmission("s"), "Automatik"); // stufenlos/CVT
assert.equal(mapTgTransmission("h2"), null); // hydrostatisch
assert.equal(mapTgTransmission("Automat"), "Automatik");
assert.equal(mapTgTransmission(""), null);

// --- model prefix matcher ---------------------------------------------------
const vwModels = [
  { id: "golf", name: "Golf" },
  { id: "golf-gti", name: "Golf GTI" },
  { id: "golf-gti-clubsport", name: "Golf GTI Clubsport" },
  { id: "golf-variant", name: "Golf Variant" },
  { id: "e-golf", name: "e-Golf" },
  { id: "id3", name: "ID.3" },
  { id: "t5", name: "T5" },
  { id: "up", name: "up!" },
];

// Regression: TG 1XZ901
assert.deepEqual(matchModelFromTyp("Golf 8 1.5 eTSI", vwModels), {
  id: "golf",
  name: "Golf",
  rest: "8 1.5 eTSI",
});
// Longest name wins
assert.equal(matchModelFromTyp("Golf GTI Clubsport 2.0", vwModels)?.id, "golf-gti-clubsport");
assert.equal(matchModelFromTyp("Golf GTI 2.0 TSI", vwModels)?.id, "golf-gti");
// Punctuation-insensitive token compare
assert.equal(matchModelFromTyp("ID.3 Pro S", vwModels)?.id, "id3");
assert.equal(matchModelFromTyp("ID3 Pro", vwModels)?.id, "id3");
assert.equal(matchModelFromTyp("up! 1.0", vwModels)?.id, "up");
// e-Golf must not fall into "Golf" (different first token)
assert.equal(matchModelFromTyp("e-Golf 100kW", vwModels)?.id, "e-golf");
// Token boundaries: "T500" is NOT "T5"
assert.equal(matchModelFromTyp("T500 Kipper", vwModels), null);
// No match at all
assert.equal(matchModelFromTyp("Passat 2.0 TDI", vwModels), null);
assert.equal(matchModelFromTyp("", vwModels), null);

console.log("All decode-tg mapper checks passed.");
