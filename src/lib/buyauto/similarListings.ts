/**
 * Order of the «Ähnliche Fahrzeuge» on a listing page. Pure: the listing service
 * feeds it the live offer index. Tests: `npx tsx scripts/test-similar-listings.ts`.
 *
 * Candidates are ranked by, in this order:
 * 1. the same brand (aliases from leasingBrands.ts, so "Mercedes" matches "Mercedes-Benz"),
 * 2. the same body type,
 * 3. a price within SIMILAR_PRICE_TOLERANCE of the listing's: the monthly rate for a
 *    Leasingübernahme, the purchase price for a Direktkauf,
 * 4. the caller's relevance order (premium first, then newest).
 * Each step only breaks ties of the steps above it.
 */
import { isSameBrand } from "@/lib/buyauto/autoAboMatch";
import { BODY_TYPES } from "@/lib/buyauto/listingContract";

/** Share of the listing's price a candidate may differ by and still count as close. */
export const SIMILAR_PRICE_TOLERANCE = 0.3;

/** What the ranking compares, for the listing and for each candidate. */
export interface SimilarityKeys {
  brand: string | null;
  /** Body type; anything outside BODY_TYPES (or null) never counts as the same. */
  body: string | null;
  /** Monthly rate (Leasingübernahme) or purchase price (Direktkauf); null when unknown. */
  price: number | null;
}

function isKnownBody(body: string | null): body is string {
  return typeof body === "string" && (BODY_TYPES as readonly string[]).includes(body);
}

function isPositive(value: number | null): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

/** True when both prices are known and the candidate's is within the tolerance of the target's. */
export function isPriceClose(target: number | null, candidate: number | null): boolean {
  if (!isPositive(target) || !isPositive(candidate)) return false;
  return Math.abs(candidate - target) <= target * SIMILAR_PRICE_TOLERANCE;
}

/** [same brand, same body, close price] as 1/0, compared left to right. */
function similarityScore(target: SimilarityKeys, candidate: SimilarityKeys): [number, number, number] {
  const sameBrand =
    typeof target.brand === "string" && typeof candidate.brand === "string" && isSameBrand(target.brand, candidate.brand);
  const sameBody = isKnownBody(target.body) && isKnownBody(candidate.body) && target.body === candidate.body;
  return [sameBrand ? 1 : 0, sameBody ? 1 : 0, isPriceClose(target.price, candidate.price) ? 1 : 0];
}

/**
 * The `limit` candidates most similar to the target. `keysOf` reads a candidate's
 * keys; `relevance` breaks the remaining ties (and keeps the order stable).
 */
export function rankSimilar<T>(
  target: SimilarityKeys,
  candidates: readonly T[],
  keysOf: (candidate: T) => SimilarityKeys,
  relevance: (a: T, b: T) => number,
  limit: number
): T[] {
  const scored = candidates.map((candidate) => ({ candidate, score: similarityScore(target, keysOf(candidate)) }));
  scored.sort((a, b) => {
    for (let i = 0; i < a.score.length; i++) {
      const diff = b.score[i] - a.score[i];
      if (diff !== 0) return diff;
    }
    return relevance(a.candidate, b.candidate);
  });
  return scored.slice(0, Math.max(0, limit)).map((s) => s.candidate);
}
