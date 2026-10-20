/**
 * Checks for the brand page indexing rule with its 30-day grace period:
 * `npx tsx scripts/test-brand-grace.ts`. Exits non-zero on the first failed assertion.
 */
import assert from "node:assert/strict";
import {
  BRAND_PAGE_GRACE_DAYS,
  BRAND_PAGE_MIN_INDEXABLE_LISTINGS,
  brandPageCounts,
  endedTakeoversFromRows,
  endedWithinGrace,
  graceHistoryMatters,
  indexableBrandPages,
  isIndexableBrand,
  listingEndedAt,
  type EndedTakeover,
  type ListingHistoryRow,
} from "../src/lib/buyauto/leasingBrands";

const NOW = new Date("2026-10-20T12:00:00Z");
const DAY_MS = 24 * 60 * 60 * 1000;
const daysAgo = (n: number) => new Date(NOW.getTime() - n * DAY_MS).toISOString();
const slugs = (pages: { slug: string }[]) => pages.map((p) => p.slug).sort();

assert.equal(BRAND_PAGE_MIN_INDEXABLE_LISTINGS, 2);
assert.equal(BRAND_PAGE_GRACE_DAYS, 30);

// --- The rule itself ----------------------------------------------------------
assert.equal(isIndexableBrand(0), false, "0 live: noindex");
assert.equal(isIndexableBrand(0, 5), false, "0 live: noindex even with history");
assert.equal(isIndexableBrand(1), false, "1 live, no history: noindex");
assert.equal(isIndexableBrand(1, 0), false);
assert.equal(isIndexableBrand(1, 1), true, "1 live + 1 ended in the grace period: indexable");
assert.equal(isIndexableBrand(1, 3), true);
assert.equal(isIndexableBrand(2), true, "2 live: indexable");
assert.equal(isIndexableBrand(2, 0), true);
assert.equal(isIndexableBrand(7), true);
assert.equal(isIndexableBrand(1, -4), false, "a negative history count is ignored");

// --- The grace window ---------------------------------------------------------
assert.ok(endedWithinGrace(daysAgo(0), NOW), "ended just now");
assert.ok(endedWithinGrace(daysAgo(10), NOW));
assert.ok(endedWithinGrace(daysAgo(30), NOW), "day 30 still counts");
assert.ok(!endedWithinGrace(daysAgo(30.01), NOW), "older than 30 days");
assert.ok(!endedWithinGrace(daysAgo(45), NOW));
assert.ok(!endedWithinGrace(daysAgo(-1), NOW), "an end date in the future is no ended offer");
assert.ok(!endedWithinGrace("not a date", NOW));

// --- Brand pages: 0, 1 (no history), 1 (history inside 30 days), 1 (history older), 2
const live = [
  { brand: "BMW" },
  { brand: "BMW" }, // 2 live
  { brand: "Porsche" }, // 1 live, history inside 30 days
  { brand: "Volvo" }, // 1 live, history older than 30 days
  { brand: "Tesla" }, // 1 live, no history
];
const ended: EndedTakeover[] = [
  { brand: "Porsche", endedAt: daysAgo(12) },
  { brand: "Volvo", endedAt: daysAgo(40) },
  { brand: "Audi", endedAt: daysAgo(3) }, // 0 live: history alone never indexes
];

assert.deepEqual(slugs(indexableBrandPages(live, ended, NOW)), ["bmw", "porsche"]);
assert.deepEqual(slugs(indexableBrandPages(live, [], NOW)), ["bmw"], "without history: 2 live offers needed");
assert.deepEqual(slugs(indexableBrandPages(live)), ["bmw"], "history defaults to none");
assert.deepEqual(slugs(indexableBrandPages([], ended, NOW)), [], "0 live anywhere: nothing indexable");

const counts = Object.fromEntries(brandPageCounts(live, ended, NOW).map((p) => [p.slug, [p.count, p.endedInGrace]]));
assert.deepEqual(counts, { bmw: [2, 0], porsche: [1, 1], tesla: [1, 0], volvo: [1, 0] });
assert.equal(
  brandPageCounts(live, ended, NOW).some((p) => p.slug === "audi"),
  false,
  "a brand without live inventory gets no page"
);

// Alias-aware: Mercedes rows and "Mercedes-Benz" history land on the same page.
assert.deepEqual(
  slugs(indexableBrandPages([{ brand: "Mercedes" }], [{ brand: "Mercedes-Benz", endedAt: daysAgo(5) }], NOW)),
  ["mercedes-benz"]
);
assert.deepEqual(slugs(indexableBrandPages([{ brand: " Škoda " }], [{ brand: "Skoda", endedAt: daysAgo(1) }], NOW)), [
  "skoda",
]);

// The history is only read when a brand sits at exactly one live offer.
assert.equal(graceHistoryMatters([{ brand: "BMW" }, { brand: "BMW" }]), false);
assert.equal(graceHistoryMatters([]), false);
assert.equal(graceHistoryMatters([{ brand: "BMW" }, { brand: "BMW" }, { brand: "Fiat" }]), true);

// --- History rows -> ended takeovers ------------------------------------------
const takeover = { price_per_month_chf: 690, deal_type: "lease_takeover" } as const;
const row = (over: Partial<ListingHistoryRow>): ListingHistoryRow => ({
  brand: "Porsche",
  status: "sold",
  expires_at: null,
  sold_at: null,
  archived_at: null,
  published_at: daysAgo(90),
  ...takeover,
  ...over,
});

assert.equal(listingEndedAt(row({ status: "sold", sold_at: daysAgo(4) }), NOW), daysAgo(4));
assert.equal(listingEndedAt(row({ status: "archived", archived_at: daysAgo(6) }), NOW), daysAgo(6));
assert.equal(listingEndedAt(row({ status: "expired", expires_at: daysAgo(8) }), NOW), daysAgo(8));
assert.equal(listingEndedAt(row({ status: "published", expires_at: daysAgo(2) }), NOW), daysAgo(2), "past expiry");
assert.equal(listingEndedAt(row({ status: "published", expires_at: daysAgo(-9) }), NOW), null, "still live");
assert.equal(listingEndedAt(row({ status: "paused", expires_at: daysAgo(2) }), NOW), null);
assert.equal(listingEndedAt(row({ status: "sold", sold_at: null }), NOW), null, "no date, no place in time");

const historyRows: ListingHistoryRow[] = [
  row({ brand: "Porsche", status: "sold", sold_at: daysAgo(4) }), // counts
  row({ brand: "Porsche", status: "expired", expires_at: daysAgo(31) }), // too old
  row({ brand: "Volvo", status: "archived", archived_at: daysAgo(2), published_at: null }), // never live (declined)
  row({ brand: "Volvo", status: "sold", sold_at: daysAgo(3), price_per_month_chf: null, deal_type: "direct_purchase" }), // Direktkauf
  row({ brand: "Audi", status: "expired", expires_at: daysAgo(9), contract_end_date: daysAgo(60).slice(0, 10) }), // contract ended before
  row({
    brand: "Fiat",
    status: "archived",
    archived_at: daysAgo(20),
    price_per_month_chf: null,
    leasing_offer: { lease_takeover_offer: { price_per_month_chf: 410 } },
  }), // takeover by its JSON offer: counts
  row({ brand: "Tesla", status: "published", expires_at: daysAgo(1) }), // past expiry: counts
  row({ brand: "BMW", status: "draft", sold_at: daysAgo(1) }), // not an ended status
];

assert.deepEqual(endedTakeoversFromRows(historyRows, NOW), [
  { brand: "Porsche", endedAt: daysAgo(4) },
  { brand: "Fiat", endedAt: daysAgo(20) },
  { brand: "Tesla", endedAt: daysAgo(1) },
]);
assert.deepEqual(endedTakeoversFromRows([], NOW), []);

// End to end: Porsche (1 live + 1 sold 4 days ago) is indexable; Volvo (1 live, only a
// declined and a Direktkauf row) is not.
assert.deepEqual(
  slugs(indexableBrandPages([{ brand: "Porsche" }, { brand: "Volvo" }], endedTakeoversFromRows(historyRows, NOW), NOW)),
  ["porsche"]
);

console.log("brand grace: all checks passed");
