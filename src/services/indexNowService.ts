/**
 * Server-only: the data the IndexNow cron reads (src/lib/buyauto/indexNow.ts).
 *
 * Live listings come from the public offer index (anon key, listings_public). Listings
 * that ended (expired, sold, archived) have left listings_public, and anonymous reads of
 * public.listings only see published rows (RLS), so those are read with the service-role
 * key, the same way brandIndexingService and listingLifecycleService do: read-only
 * SELECTs of id, brand, model, status, the end dates and the Kaufart columns. Only ever
 * import this module from API routes. Listings deleted outright leave no row, so they
 * are not submitted (a DELETE trigger writing listing_tombstones would close that).
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

/** Far above the listings that end within a day. */
const ENDED_ROW_LIMIT = 1000;
/** A stalled read ends the run with an error in its summary instead of holding the function. */
const ENDED_READ_TIMEOUT_MS = 5000;

const DAY_MS = 24 * 60 * 60 * 1000;

async function readEndedRows(since: Date): Promise<IndexNowEndedRow[] | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.warn("IndexNow: SUPABASE_SERVICE_ROLE_KEY is not set; ended listings are not submitted.");
    return null;
  }

  // Dates only, one day of margin each side: a coarse pre-filter without PostgREST's
  // reserved characters. collectIndexNowUrls applies the exact window.
  const sinceDate = new Date(since.getTime() - DAY_MS).toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + DAY_MS).toISOString().slice(0, 10);

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
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

export function createIndexNowDataSource(): IndexNowDataSource {
  return {
    liveOffers: () => getPublicOfferIndex(),
    endedRows: readEndedRows,
    endedTakeovers: (now) => getEndedTakeovers(now),
  };
}
