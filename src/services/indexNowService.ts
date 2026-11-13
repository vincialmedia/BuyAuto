/**
 * Server-only: the data the IndexNow cron reads (src/lib/buyauto/indexNow.ts).
 *
 * Live listings come from the public offer index (anon key, listings_public). Listings
 * that ended (expired, sold, archived) have left listings_public, and anonymous reads of
 * public.listings only see published rows (RLS), so those are read with the service-role
 * key, the same way brandIndexingService and listingLifecycleService do: read-only
 * SELECTs of id, brand, model, status, the end dates and the Kaufart columns. The
 * publication times of the live listings come from public.listings the same way,
 * because listings_public has no published_at. Only ever import this module from API
 * routes. Listings deleted outright leave no row, so they are not submitted (a DELETE
 * trigger writing listing_tombstones would close that).
 */
import { createClient } from "@supabase/supabase-js";
import type { IndexNowDataSource, IndexNowEndedRow } from "@/lib/buyauto/indexNow";
import { getEndedTakeovers } from "@/services/brandIndexingService";
import { getPublicOfferIndex } from "@/services/listingsService";

const ENDED_COLUMNS =
  "id, brand, model, status, expires_at, sold_at, archived_at, published_at, " +
  "deal_type, financing_type, price_per_month_chf, remaining_months, leasing_offer, contract_end_date";

/** Statuses a once-live listing can end in. Rows still "published" past their expiry are read separately. */
const ENDED_STATUSES = ["expired", "sold", "archived"] as const;

/** Far above the listings that end or go live within a day. */
const ENDED_ROW_LIMIT = 1000;
/** A stalled read ends the run with an error in its summary instead of holding the function. */
const ENDED_READ_TIMEOUT_MS = 5000;

const DAY_MS = 24 * 60 * 60 * 1000;

/** The service-role client for the read-only SELECTs below; null without the key. */
function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

/**
 * Dates only, one day of margin: a coarse pre-filter without PostgREST's reserved
 * characters. collectIndexNowUrls applies the exact window.
 */
function dayBefore(since: Date): string {
  return new Date(since.getTime() - DAY_MS).toISOString().slice(0, 10);
}

async function readEndedRows(since: Date): Promise<IndexNowEndedRow[] | null> {
  const admin = serviceClient();
  if (!admin) {
    console.warn("IndexNow: SUPABASE_SERVICE_ROLE_KEY is not set; ended listings are not submitted.");
    return null;
  }

  const sinceDate = dayBefore(since);
  const tomorrow = new Date(Date.now() + DAY_MS).toISOString().slice(0, 10);

  const signal = AbortSignal.timeout(ENDED_READ_TIMEOUT_MS);
  const endedQuery = () => admin.from("listings").select(ENDED_COLUMNS).not("published_at", "is", null);
  // Two reads, so the live listings (published, expiry in the future) never fill the
  // row limit: the ended statuses by their end dates, and the rows still "published"
  // whose expiry falls in the window (past it, but not yet flipped by the status job).
  const [ended, pastExpiry] = await Promise.all([
    endedQuery()
      .in("status", [...ENDED_STATUSES])
      .or(`sold_at.gte.${sinceDate},archived_at.gte.${sinceDate},expires_at.gte.${sinceDate}`)
      .order("id")
      .limit(ENDED_ROW_LIMIT)
      .abortSignal(signal),
    endedQuery()
      .eq("status", "published")
      .gte("expires_at", sinceDate)
      .lt("expires_at", tomorrow)
      .order("id")
      .limit(ENDED_ROW_LIMIT)
      .abortSignal(signal),
  ]);
  if (ended.error) throw ended.error;
  if (pastExpiry.error) throw pastExpiry.error;

  const endedRows = (Array.isArray(ended.data) ? ended.data : []) as unknown as IndexNowEndedRow[];
  const pastExpiryRows = (Array.isArray(pastExpiry.data) ? pastExpiry.data : []) as unknown as IndexNowEndedRow[];
  if (endedRows.length >= ENDED_ROW_LIMIT || pastExpiryRows.length >= ENDED_ROW_LIMIT) {
    console.warn("IndexNow: the ended-listings read hit its row limit; some rows are missing.", { limit: ENDED_ROW_LIMIT });
  }
  return [...endedRows, ...pastExpiryRows];
}

/**
 * Listing id → published_at for the listings that went live since `since`. Publishing
 * leaves updated_at alone, so a listing approved more than a day after its last edit
 * shows up as changed only through its publication time.
 */
async function readPublishedSince(since: Date): Promise<Map<string, string> | null> {
  const admin = serviceClient();
  if (!admin) {
    console.warn("IndexNow: SUPABASE_SERVICE_ROLE_KEY is not set; live listings are matched on created_at and updated_at only.");
    return null;
  }

  const { data, error } = await admin
    .from("listings")
    .select("id, published_at")
    .eq("status", "published")
    .gte("published_at", dayBefore(since))
    .order("id")
    .limit(ENDED_ROW_LIMIT)
    .abortSignal(AbortSignal.timeout(ENDED_READ_TIMEOUT_MS));
  if (error) throw error;

  const rows = (Array.isArray(data) ? data : []) as unknown as { id: string | null; published_at: string | null }[];
  if (rows.length >= ENDED_ROW_LIMIT) {
    console.warn("IndexNow: the publication-times read hit its row limit; some rows are missing.", { limit: ENDED_ROW_LIMIT });
  }
  const publishedAt = new Map<string, string>();
  for (const row of rows) {
    if (row.id && row.published_at) publishedAt.set(row.id, row.published_at);
  }
  return publishedAt;
}

export function createIndexNowDataSource(): IndexNowDataSource {
  return {
    liveOffers: () => getPublicOfferIndex(),
    publishedSince: readPublishedSince,
    endedRows: readEndedRows,
    endedTakeovers: (now) => getEndedTakeovers(now),
  };
}
