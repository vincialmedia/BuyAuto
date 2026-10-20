/**
 * Checks for the «Ähnliche Fahrzeuge» order and the previous / next links on a listing
 * page: `npx tsx scripts/test-similar-listings.ts`.
 * Exits non-zero on the first failed assertion.
 */
import assert from "node:assert/strict";
import {
  isPriceClose,
  neighboursInOrder,
  rankSimilar,
  SIMILAR_PRICE_TOLERANCE,
  type SimilarityKeys,
} from "../src/lib/buyauto/similarListings";

type Candidate = SimilarityKeys & { id: string; rank: number };

const candidate = (id: string, rank: number, keys: Partial<SimilarityKeys>): Candidate => ({
  id,
  rank,
  brand: null,
  body: null,
  price: null,
  ...keys,
});

// Relevance stand-in: lower rank first (the service passes premium first, then newest).
const byRank = (a: Candidate, b: Candidate) => a.rank - b.rank;
const ids = (list: Candidate[]) => list.map((c) => c.id);

// --- Price tolerance --------------------------------------------------------
assert.equal(SIMILAR_PRICE_TOLERANCE, 0.3);
assert.ok(isPriceClose(500, 500));
assert.ok(isPriceClose(500, 650), "upper bound is inclusive");
assert.ok(isPriceClose(500, 350), "lower bound is inclusive");
assert.ok(!isPriceClose(500, 651));
assert.ok(!isPriceClose(500, 349));
assert.ok(!isPriceClose(null, 500), "unknown target price is never close");
assert.ok(!isPriceClose(500, null), "unknown candidate price is never close");
assert.ok(!isPriceClose(0, 0), "a zero price is unknown");

// --- Order: brand, then body, then price, then relevance --------------------
const target: SimilarityKeys = { brand: "BMW", body: "SUV", price: 800 };
const pool: Candidate[] = [
  candidate("other-brand-all-else-same", 1, { brand: "Audi", body: "SUV", price: 800 }),
  candidate("bmw-kombi-far", 2, { brand: "BMW", body: "Kombi", price: 2000 }),
  candidate("bmw-suv-far", 3, { brand: "BMW", body: "SUV", price: 2000 }),
  candidate("bmw-suv-close", 4, { brand: "BMW", body: "SUV", price: 900 }),
  candidate("bmw-kombi-close", 5, { brand: "BMW", body: "Kombi", price: 700 }),
  candidate("other-brand-suv-far", 6, { brand: "Volvo", body: "SUV", price: 3000 }),
  candidate("other-brand-limo-close", 7, { brand: "Tesla", body: "Limousine", price: 820 }),
  candidate("bmw-suv-close-later", 8, { brand: "BMW", body: "SUV", price: 760 }),
];

assert.deepEqual(ids(rankSimilar(target, pool, (c) => c, byRank, 6)), [
  "bmw-suv-close",
  "bmw-suv-close-later",
  "bmw-suv-far",
  "bmw-kombi-close",
  "bmw-kombi-far",
  "other-brand-all-else-same",
]);

// Keeps the limit (6 on the listing page) and never more than there are.
assert.equal(rankSimilar(target, pool, (c) => c, byRank, 6).length, 6);
assert.equal(rankSimilar(target, pool.slice(0, 2), (c) => c, byRank, 6).length, 2);
assert.equal(rankSimilar(target, pool, (c) => c, byRank, 0).length, 0);

// Brand aliases from leasingBrands.ts: "Mercedes" rows count as Mercedes-Benz.
assert.deepEqual(
  ids(
    rankSimilar(
      { brand: "Mercedes-Benz", body: null, price: null },
      [candidate("bmw", 1, { brand: "BMW" }), candidate("mercedes", 2, { brand: "Mercedes" })],
      (c) => c,
      byRank,
      6
    )
  ),
  ["mercedes", "bmw"]
);

// An unknown body type (null or outside BODY_TYPES) never counts as the same body.
assert.deepEqual(
  ids(
    rankSimilar(
      { brand: null, body: null, price: null },
      [candidate("a", 1, { body: null }), candidate("b", 2, { body: "SUV" })],
      (c) => c,
      byRank,
      6
    )
  ),
  ["a", "b"],
  "without a target body, relevance decides"
);
assert.deepEqual(
  ids(
    rankSimilar(
      { brand: null, body: "Pickup", price: null },
      [candidate("a", 1, { body: "SUV" }), candidate("b", 2, { body: "Pickup" })],
      (c) => c,
      byRank,
      6
    )
  ),
  ["a", "b"],
  "a body outside BODY_TYPES is not matched"
);

// Without any shared key the relevance order is kept unchanged.
const plain = [candidate("x", 3, {}), candidate("y", 1, {}), candidate("z", 2, {})];
assert.deepEqual(ids(rankSimilar({ brand: "Fiat", body: "SUV", price: 300 }, plain, (c) => c, byRank, 6)), ["y", "z", "x"]);

// The input array is not reordered.
assert.deepEqual(ids(plain), ["x", "y", "z"]);

// --- Previous / next in the hub order, wrapping around ------------------------
const order = ["a", "b", "c", "d"].map((id) => ({ id }));
const around = (id: string, list = order) => {
  const { previous, next } = neighboursInOrder(list, (o) => o.id, id);
  return [previous?.id ?? null, next?.id ?? null];
};
assert.deepEqual(around("b"), ["a", "c"]);
assert.deepEqual(around("a"), ["d", "b"], "the first one links the last one");
assert.deepEqual(around("d"), ["c", "a"], "the last one links the first one");
assert.deepEqual(around("x"), [null, null], "an offer outside the order (ended) gets none");
assert.deepEqual(around("a", order.slice(0, 2)), [null, "b"], "with two offers the other one comes once");
assert.deepEqual(around("a", order.slice(0, 1)), [null, null], "a single offer has no neighbours");
assert.deepEqual(around("a", []), [null, null]);
// Every offer is linked from exactly two other offers (n >= 3).
const linkedFrom = new Map<string, Set<string>>(order.map((o) => [o.id, new Set()]));
for (const o of order) {
  const { previous, next } = neighboursInOrder(order, (x) => x.id, o.id);
  for (const target of [previous, next]) if (target) linkedFrom.get(target.id)?.add(o.id);
}
for (const [id, from] of linkedFrom) assert.equal(from.size, 2, `${id} is linked from two listings`);

console.log("test-similar-listings: all checks passed");
