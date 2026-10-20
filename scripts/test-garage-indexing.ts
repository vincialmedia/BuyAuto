/**
 * Checks for the garage microsite indexing rule: `npx tsx scripts/test-garage-indexing.ts`.
 * Exits non-zero on the first failed assertion.
 */
import assert from "node:assert/strict";
import {
  garageSlugRejection,
  isIndexableGarage,
  isPlausibleGarageSlug,
  isRejectedOnlyByTestSlugPart,
} from "../src/lib/buyauto/garageIndexing";

// --- Slugs --------------------------------------------------------------------
assert.ok(isPlausibleGarageSlug("garage-muster"));
assert.ok(isPlausibleGarageSlug("auto-zentrum-schlieren"));
assert.ok(isPlausibleGarageSlug("abc"), "three letters are enough");
assert.ok(isPlausibleGarageSlug("garage-2000"));
assert.ok(isPlausibleGarageSlug("testa-automobile"), "a part that only starts with test is fine");
assert.ok(!isPlausibleGarageSlug("pipi-kaka-ag"), "denylisted");
assert.ok(!isPlausibleGarageSlug("PIPI-KAKA-AG"), "denylist ignores case");
assert.ok(!isPlausibleGarageSlug("test-garage"));
assert.ok(!isPlausibleGarageSlug("garage-demo"));
assert.ok(!isPlausibleGarageSlug("ab"), "fewer than 3 letters");
assert.ok(!isPlausibleGarageSlug("a1-b2"));
assert.ok(!isPlausibleGarageSlug("12345"));
assert.ok(!isPlausibleGarageSlug(""));
assert.ok(!isPlausibleGarageSlug(null));

// --- Indexable: description + at least one live listing + plausible slug -------
const good = { slug: "garage-muster", description: "Familienbetrieb in Schlieren.", liveListingCount: 1 };
assert.ok(isIndexableGarage(good));
assert.ok(isIndexableGarage({ ...good, liveListingCount: 12 }));
assert.ok(!isIndexableGarage({ ...good, liveListingCount: 0 }), "no live listing");
assert.ok(!isIndexableGarage({ ...good, description: "" }), "empty description");
assert.ok(!isIndexableGarage({ ...good, description: "   " }), "blank description");
assert.ok(!isIndexableGarage({ ...good, description: null }));
assert.ok(!isIndexableGarage({ ...good, slug: "pipi-kaka-ag" }), "test slug, even with listings and text");

// --- Why a slug is rejected, and when the page logs it ---------------------------
assert.equal(garageSlugRejection("garage-muster"), null);
assert.equal(garageSlugRejection("pipi-kaka-ag"), "denylist");
assert.equal(garageSlugRejection("garage-test-ag"), "test-part");
assert.equal(garageSlugRejection("ab"), "letters");
assert.equal(garageSlugRejection(" "), "empty");
assert.ok(isRejectedOnlyByTestSlugPart({ ...good, slug: "demo-cars-ag" }), "text and a listing, only the test part rule says no");
assert.ok(!isRejectedOnlyByTestSlugPart({ ...good, slug: "demo-cars-ag", description: "" }), "no text: noindex anyway");
assert.ok(!isRejectedOnlyByTestSlugPart({ ...good, slug: "demo-cars-ag", liveListingCount: 0 }), "no listing: noindex anyway");
assert.ok(!isRejectedOnlyByTestSlugPart({ ...good, slug: "pipi-kaka-ag" }), "denylisted on purpose");
assert.ok(!isRejectedOnlyByTestSlugPart(good), "indexable");

console.log("garage indexing: all checks passed");
