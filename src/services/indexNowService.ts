/**
 * Server-only: the data the IndexNow cron reads (src/lib/buyauto/indexNow.ts).
 *
 * Live listings come from the public offer index (anon key, listings_public). Listings
 * that ended (expired, sold, archived) have left listings_public, and anonymous reads of
 * public.listings only see published rows (RLS), so those are read with the service-role
 * key, the same way brandIndexingService and listingLifecycleService do: one read-only
 * SELECT of id, brand, model, status, the end dates and the Kaufart columns. Only ever
 * import this module from API routes.
 */
import { createClient } from "@supabase/supabase-js";
import type { IndexNowDataSource, IndexNowEndedRow } from "@/lib/buyauto/indexNow";
import { getPublicOfferIndex } from "@/services/listingsService";

const ENDED_COLUMNS =
  "id, brand, model, status, expires_at, sold_at, archived_at, published_at, " +
  "deal_type, financing_type, price_per_month_chf, remaining_months, leasing_offer, contract_end_date";

/** Statuses a once-live listing can end in, plus "published" for rows past their expiry. */
const ENDED_STATUSES = ["expired", "sold", "archived", "published"] as const;

/** Far above the listings that end within a day. */
const ENDED_ROW_LIMIT = 1000;

const DAY_MS = 24 * 60 * 60 * 1000;

async function readEndedRows(since: Date): Promise<IndexNowEndedRow[] | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.warn("IndexNow: SUPABASE_SERVICE_ROLE_KEY is not set; ended listings are not submitted.");
    return null;
  }

  // Date only, one day of margin: a coarse pre-filter without PostgREST's reserved
  // characters. collectIndexNowUrls applies the exact window.
  const sinceDate = new Date(since.getTime() - DAY_MS).toISOString().slice(0, 10);

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await admin
    .from("listings")
    .select(ENDED_COLUMNS)
    .in("status", [...ENDED_STATUSES])
    .not("published_at", "is", null)
    .or(`sold_at.gte.${sinceDate},archived_at.gte.${sinceDate},expires_at.gte.${sinceDate}`)
    .order("id")
    .limit(ENDED_ROW_LIMIT);
  if (error) throw error;

  const rows = (Array.isArray(data) ? data : []) as unknown as IndexNowEndedRow[];
  if (rows.length >= ENDED_ROW_LIMIT) {
    console.warn("IndexNow: the ended-listings read hit its row limit; some rows are missing.", { limit: ENDED_ROW_LIMIT });
  }
  return rows;
}

export function createIndexNowDataSource(): IndexNowDataSource {
  return {
    liveOffers: () => getPublicOfferIndex(),
    endedRows: readEndedRows,
  };
}
