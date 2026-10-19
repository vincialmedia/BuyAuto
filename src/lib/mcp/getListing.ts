/** get_listing: one published listing by id or buyauto.ch URL. */
import { extractListingIdFromParam } from "@/lib/buyauto/listingUrl";
import { optString, rejectUnknownKeys, type Args } from "@/lib/mcp/args";
import type { ListingDataSource } from "@/lib/mcp/dataSource";
import { listingDetail, type ListingDetailOutput } from "@/lib/mcp/listingOutput";
import { ToolInputError, toolError, toolResult } from "@/lib/mcp/protocol";

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Listing id from a UUID, a "/fahrzeug/<slug>-<uuid>" path or a full buyauto.ch URL. */
export function listingIdFromInput(input: string): string | null {
  let candidate = input.trim();
  try {
    if (/^https?:\/\//i.test(candidate)) candidate = new URL(candidate).pathname;
  } catch {
    return null;
  }
  candidate = candidate.split(/[?#]/)[0].replace(/\/+$/, "");
  const lastSegment = candidate.split("/").pop() ?? "";
  let decoded: string;
  try {
    decoded = decodeURIComponent(lastSegment);
  } catch {
    return null; // malformed %-escape: not a listing id
  }
  const id = extractListingIdFromParam(decoded);
  return UUID_RE.test(id) ? id.toLowerCase() : null;
}

export async function runGetListing(args: Args, data: ListingDataSource) {
  rejectUnknownKeys(args, ["id"], "get_listing");
  const raw = optString(args, "id", 300);
  if (!raw) throw new ToolInputError('get_listing needs "id": the listing id from search_listings or a buyauto.ch/fahrzeug/… link.');
  const id = listingIdFromInput(raw);
  if (!id) {
    throw new ToolInputError(
      `"${raw}" is not a BuyAuto listing id. Use the "id" from search_listings (a UUID) or a link like https://www.buyauto.ch/fahrzeug/bmw-x3-<id>.`
    );
  }

  const listing = await data.getListing(id);
  if (!listing) {
    return toolError(
      `No live listing with the id ${id} on BuyAuto. It may have been sold, paused or expired; search_listings shows what is online now.`
    );
  }

  const garage = listing.garage_id ? await data.getGarage(listing.garage_id) : null;
  const detail: ListingDetailOutput = listingDetail(listing, garage);
  const notes: string[] = [];
  if (detail.contract_ended) notes.push("The leasing contract of this listing has run out, so it is no longer offered for takeover.");
  return toolResult({ listing: detail, notes });
}
