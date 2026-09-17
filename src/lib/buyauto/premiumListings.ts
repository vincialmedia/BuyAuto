import type { Listing } from "@/lib/buyauto/types";

/**
 * A Leasingübernahme comes in two shapes: the legacy `deal_type =
 * 'lease_takeover'` row, and — for every listing the wizard has created since
 * the unified flow — a `direct_purchase` row whose `leasing_offer.
 * lease_takeover_offer.enabled` is true (optionally with a Kaufpreis next to
 * it). Every surface that asks "is this a takeover?" must accept both.
 */
export function isLeaseTakeoverListing(listing: Listing): boolean {
  return listing.deal_type === "lease_takeover" || hasEnabledTakeoverOffer(listing);
}

/** Direktkauf row that additionally offers a Leasingübernahme (the wizard's shape). */
export function hasEnabledTakeoverOffer(listing: Listing): boolean {
  return listing.leasing_offer?.lease_takeover_offer?.enabled === true;
}

/**
 * Order for the homepage premium carousel: Leasingübernahmen first (both
 * shapes above), then plain Direktkauf, newest first within each group.
 *
 * The carousel is fed by two premium queries (deal_type lease_takeover and
 * direct_purchase). Concatenating them put every legacy takeover row ahead of
 * every wizard-created takeover, so a freshly published premium
 * Leasingübernahme landed on carousel page 4 behind rows from last winter.
 * Merging by date keeps paid premium placement where the seller expects it.
 */
export function orderPremiumListings(items: Listing[]): Listing[] {
  const uniqueById = new Map<string, Listing>();
  for (const listing of items) {
    if (!uniqueById.has(listing.id)) uniqueById.set(listing.id, listing);
  }

  const createdAtMs = (listing: Listing): number => {
    const parsed = listing.created_at ? Date.parse(listing.created_at) : NaN;
    return Number.isFinite(parsed) ? parsed : Number.NEGATIVE_INFINITY;
  };

  return Array.from(uniqueById.values()).sort((a, b) => {
    const takeoverFirst = Number(isLeaseTakeoverListing(b)) - Number(isLeaseTakeoverListing(a));
    if (takeoverFirst !== 0) return takeoverFirst;
    const createdA = createdAtMs(a);
    const createdB = createdAtMs(b);
    if (createdA === createdB) return 0; // also covers two rows without a usable created_at
    return createdB > createdA ? 1 : -1;
  });
}
