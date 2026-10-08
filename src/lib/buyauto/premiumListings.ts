import type { Listing } from "@/lib/buyauto/types";
import type { SearchQuery } from "@/lib/buyauto/search";
import { kaufartOf } from "@/lib/buyauto/kaufart";

/**
 * Every premium listing in one query (live offers only). Splitting the query by
 * Kaufart would cap the Leasingübernahme bucket at one page and silently drop paid
 * placements; 24 keeps the old ceiling (two queries of 12).
 */
export const PREMIUM_LISTINGS_QUERY: SearchQuery = { page: 1, premiumOnly: true, pageSize: 24 };

/**
 * "Is this a Leasingübernahme?" — answered by the one Kaufart rule
 * (lib/buyauto/kaufart): a monthly takeover rate, whatever deal_type is stored.
 */
export function isLeaseTakeoverListing(listing: Listing): boolean {
  return kaufartOf(listing) === "lease_takeover";
}

/** Direktkauf row that additionally offers a Leasingübernahme (the wizard's shape). */
export function hasEnabledTakeoverOffer(listing: Listing): boolean {
  return listing.leasing_offer?.lease_takeover_offer?.enabled === true;
}

/**
 * Order for the homepage premium carousel: Leasingübernahmen first (both
 * shapes above), then plain Direktkauf, newest first within each group.
 *
 * Ordering by date (not by stored deal_type) keeps a freshly published premium
 * Leasingübernahme from landing behind legacy rows from last winter, so paid
 * premium placement stays where the seller expects it.
 *
 * Product decision, deliberately kept from the Leasing-Fokus homepage: the
 * section is headed «Aktuelle Leasingübernahmen», so takeovers stay in
 * front and a premium plain Direktkauf follows them under «Alle» (it is
 * still newest-first under the Direktkauf tab). If the carousel should ever
 * become a general premium slot, drop the takeoverFirst tier and rename the
 * heading in the same change.
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
