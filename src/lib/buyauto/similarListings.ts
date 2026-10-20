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

/**
 * The offers before and after `id` in `ordered` (the hub's order for a
 * Leasingübernahme, the Direktkauf view's order for a Direktkauf), wrapping around at
 * both ends. The listing page links both, so every live offer gets links from two
 * other listing pages, whatever its brand, on top of its hub card. Nothing when `id`
 * is not in the list (an ended offer) or the list has fewer than two offers; with
 * exactly two, the other one comes back once, as `next`.
 */
export function neighboursInOrder<T>(
  ordered: readonly T[],
  idOf: (item: T) => string,
  id: string
): { previous: T | null; next: T | null } {
  const n = ordered.length;
  const index = ordered.findIndex((item) => idOf(item) === id);
  if (index === -1 || n < 2) return { previous: null, next: null };
  const next = ordered[(index + 1) % n];
  const previous = ordered[(index - 1 + n) % n];
  return { previous: idOf(previous) === idOf(next) ? null : previous, next };
}
