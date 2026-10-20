/**
 * When a garage microsite (/[dealerSlug]) is indexable and listed in the sitemap.
 *
 * A microsite is a search landing page only when it has something of its own: the
 * garage's description and at least one live listing. Everything else renders
 * "noindex, follow" and stays out of the sitemap. Test accounts are filtered by slug.
 * Nothing here touches the database: the page and the sitemap pass in what they
 * already read.
 */

/** A microsite is indexable from this many live listings on. */
export const GARAGE_MIN_INDEXABLE_LISTINGS = 1;

/** Slugs of known test accounts, never indexed. */
export const GARAGE_SLUG_DENYLIST: readonly string[] = ["pipi-kaka-ag"];

/** Slug parts that mark a test or demo account ("test-garage", "demo-ag"). */
export const GARAGE_TEST_SLUG_PARTS: readonly string[] = ["test", "demo", "dummy", "asdf"];

/** A real garage slug carries at least this many letters. */
export const GARAGE_SLUG_MIN_LETTERS = 3;

/** Why a slug is not treated as a real garage's, or null when it is. */
export function garageSlugRejection(slug: string | null | undefined): "empty" | "denylist" | "test-part" | "letters" | null {
  const normalized = (slug ?? "").trim().toLowerCase();
  if (!normalized) return "empty";
  if (GARAGE_SLUG_DENYLIST.includes(normalized)) return "denylist";
  const parts = normalized.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  if (parts.some((part) => GARAGE_TEST_SLUG_PARTS.includes(part))) return "test-part";
  const letters = normalized.match(/\p{L}/gu)?.length ?? 0;
  return letters >= GARAGE_SLUG_MIN_LETTERS ? null : "letters";
}

/** False for denylisted slugs, test or demo slugs and slugs with fewer than 3 letters. */
export function isPlausibleGarageSlug(slug: string | null | undefined): boolean {
  return garageSlugRejection(slug) === null;
}

/**
 * True when only a test or demo part of the slug keeps a garage out of the index: it
 * has a description and a live listing. That part rule goes beyond the denylist, so
 * the page logs such a garage (its slug is public, its URL) for Vince to check.
 */
export function isRejectedOnlyByTestSlugPart(input: GarageIndexingInput): boolean {
  return (
    garageSlugRejection(input.slug) === "test-part" &&
    (input.description ?? "").trim() !== "" &&
    input.liveListingCount >= GARAGE_MIN_INDEXABLE_LISTINGS
  );
}

export interface GarageIndexingInput {
  slug: string | null | undefined;
  description: string | null | undefined;
  /** Live listings of the garage (the same count its inventory shows). */
  liveListingCount: number;
}

/** Indexable and in the sitemap: plausible slug, a description and at least one live listing. */
export function isIndexableGarage({ slug, description, liveListingCount }: GarageIndexingInput): boolean {
  if (!isPlausibleGarageSlug(slug)) return false;
  if ((description ?? "").trim() === "") return false;
  return liveListingCount >= GARAGE_MIN_INDEXABLE_LISTINGS;
}
