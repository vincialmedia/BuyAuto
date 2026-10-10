/**
 * Checks for the Auto-Abo "same model" matching: `npx tsx scripts/test-autoabo-match.ts`.
 * Exits non-zero on the first failed assertion.
 */
import assert from "node:assert/strict";
import {
  brandAliases,
  isSameBrand,
  matchSameModel,
  modelMatches,
  takeoverTitle,
  type TakeoverCandidate,
} from "../src/lib/buyauto/autoAboMatch";
import { AUTO_ABO_PROVIDERS } from "../src/lib/buyauto/facts";

const candidate = (over: Partial<TakeoverCandidate> & { id: string }): TakeoverCandidate => ({
  brand: null,
  model: null,
  variant: null,
  year: null,
  rateChf: 500,
  months: 24,
  kautionChf: 0,
  ...over,
});

// --- Brand: case-insensitive, aliases from leasingBrands.ts -----------------
assert.ok(isSameBrand("BMW", "BMW"));
assert.ok(isSameBrand("bmw", "BMW"));
assert.ok(isSameBrand(" Bmw ", "BMW"));
assert.ok(isSameBrand("Volkswagen", "Volkswagen"));
assert.ok(isSameBrand("volkswagen", "Volkswagen"));
assert.ok(isSameBrand("Mercedes", "Mercedes-Benz"));
assert.ok(isSameBrand("Mercedes-Benz", "Mercedes"));
assert.ok(isSameBrand("Skoda", "Škoda"));
assert.ok(isSameBrand("Škoda", "Skoda"));
assert.ok(isSameBrand("Opel", "Opel"));
assert.ok(!isSameBrand("Mini", "BMW"));
assert.ok(!isSameBrand("Peugeot", "Opel"));
assert.ok(!isSameBrand(null, "BMW"));
assert.ok(!isSameBrand("", "BMW"));
assert.deepEqual(brandAliases("Mercedes").sort(), ["mercedes", "mercedes-benz"]);
assert.deepEqual(brandAliases("Opel"), ["opel"]);

// --- Model: whole-token containment, case-insensitive -----------------------
assert.ok(modelMatches("X3", "X3"));
assert.ok(modelMatches("x3", "X3"));
assert.ok(modelMatches("X3 xDrive20d", "X3"));
assert.ok(modelMatches("BMW X3", "X3"));
assert.ok(!modelMatches("iX3", "X3"));
assert.ok(!modelMatches("X30", "X3"));
assert.ok(!modelMatches("xDrive30d", "X3"));
assert.ok(modelMatches("Corsa", "Corsa"));
assert.ok(modelMatches("Corsa-e", "Corsa"));
assert.ok(modelMatches("208", "208"));
assert.ok(modelMatches("e-208", "208"));
assert.ok(!modelMatches("2008", "208"));
assert.ok(!modelMatches("3008", "208"));
assert.ok(modelMatches("ID.3", "ID.3"));
assert.ok(modelMatches("id.3 Pro S", "ID.3"));
assert.ok(!modelMatches("ID.4", "ID.3"));
assert.ok(!modelMatches("ID3", "ID.3"));
assert.ok(!modelMatches(null, "X3"));
assert.ok(!modelMatches("X3", ""));

// --- Title -------------------------------------------------------------------
assert.equal(takeoverTitle({ brand: "BMW", model: "X3", variant: "xDrive20d" }), "BMW X3 xDrive20d");
assert.equal(takeoverTitle({ brand: "BMW", model: "X3", variant: "X3 20d xDrive" }), "BMW X3 20d xDrive");
assert.equal(takeoverTitle({ brand: "BMW", model: "X3", variant: null }), "BMW X3");
assert.equal(takeoverTitle({ brand: "BMW", model: "M135i", variant: "M135i" }), "BMW M135i");

// --- matchSameModel ----------------------------------------------------------
const x3 = AUTO_ABO_PROVIDERS.flatMap((p) => p.offers).find((o) => o.listingModel === "X3");
assert.ok(x3, "F10 has a BMW X3 example");

const pool: TakeoverCandidate[] = [
  candidate({ id: "a", brand: "BMW", model: "X3", variant: "xDrive20d", year: 2021, rateChf: 398, months: 40, kautionChf: 8000 }),
  candidate({ id: "b", brand: "BMW", model: "X3", year: 2025, rateChf: 767, months: 43 }),
  candidate({ id: "c", brand: "BMW", model: "X3", variant: "xDrive30e", year: 2025, rateChf: 692, months: 61 }),
  candidate({ id: "d", brand: "bmw", model: "X3", variant: "X3 20d xDrive", year: 2024, rateChf: 922, months: 18 }),
  candidate({ id: "e", brand: "BMW", model: "iX3", year: 2024, rateChf: 800 }),
  candidate({ id: "f", brand: "BMW", model: "xDrive30d", year: 2024, rateChf: 1208 }),
  candidate({ id: "g", brand: "Mini", model: "X3", year: 2024, rateChf: 500 }),
  candidate({ id: "h", brand: "BMW", model: "X3", year: 2023, rateChf: null }),
  candidate({ id: "i", brand: "BMW", model: "X3", year: 2023, rateChf: 0 }),
  candidate({ id: "j", brand: "BMW", model: "X3", year: null, rateChf: 300 }),
];

{
  const m = matchSameModel(x3, pool, 10);
  assert.equal(m.total, 5);
  // Newest year first, then the lower rate; unknown year last.
  assert.deepEqual(
    m.listings.map((l) => l.id),
    ["c", "b", "d", "a", "j"]
  );
  const a = m.listings.find((l) => l.id === "a");
  assert.equal(a?.href, "/fahrzeug/bmw-x3-a");
  assert.equal(a?.title, "BMW X3 xDrive20d");
  assert.equal(a?.rateChf, 398);
  assert.equal(a?.months, 40);
  assert.equal(a?.kautionChf, 8000);
  // Serializable for getStaticProps: no undefined anywhere.
  assert.equal(JSON.stringify(m).includes("undefined"), false);
  assert.deepEqual(JSON.parse(JSON.stringify(m)), m);
}

{
  const m = matchSameModel(x3, pool, 2);
  assert.equal(m.total, 5);
  assert.deepEqual(
    m.listings.map((l) => l.id),
    ["c", "b"]
  );
}

{
  // Aliases reach the matcher: a "Mercedes" listing matches a "Mercedes-Benz" offer.
  const m = matchSameModel({ brand: "Mercedes-Benz", listingModel: "GLC" }, [
    candidate({ id: "m1", brand: "Mercedes", model: "GLC", year: 2020, rateChf: 960 }),
    candidate({ id: "m2", brand: "Mercedes", model: "GLC Coupé", year: 2022, rateChf: 990 }),
    candidate({ id: "m3", brand: "Mercedes", model: "GLA", year: 2025, rateChf: 937 }),
  ]);
  assert.deepEqual(
    m.listings.map((l) => l.id),
    ["m2", "m1"]
  );
}

{
  // No match: nothing to render.
  const corsa = AUTO_ABO_PROVIDERS.flatMap((p) => p.offers).find((o) => o.listingModel === "Corsa");
  assert.ok(corsa);
  const m = matchSameModel(corsa, pool);
  assert.equal(m.total, 0);
  assert.deepEqual(m.listings, []);
}

console.log("test-autoabo-match: all assertions passed");
