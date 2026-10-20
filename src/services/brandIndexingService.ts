/**
 * Server-only: which brand pages (/leasinguebernahme/[marke]) are indexable, with
 * the 30-day grace period (BRAND_PAGE_GRACE_DAYS in leasingBrands.ts).
 *
 * The grace period needs the Leasingübernahmen that ended recently. listings_public
 * only holds published, unexpired rows and anonymous reads of public.listings only
 * see published rows (RLS), so the ended ones are read with the service-role key, the
 * same key the billing API routes and listingLifecycleService use: read-only
 * SELECTs of brand, status, dates and the Kaufart columns, nothing else. Only ever
 * import this module from getServerSideProps, getStaticProps or API routes.
 *
 * Without the key, or when Supabase refuses the read (a 4xx: wrong key, schema), the
 * history is empty: the grace period cannot apply and a page needs
 * BRAND_PAGE_MIN_INDEXABLE_LISTINGS live offers (the rule before the grace period).
 * A read that fails on the way (network, timeout, 5xx) falls back on the last good
 * result; without one, `requireHistory` callers get BrandHistoryUnavailableError, so
 * the brand page keeps its last good ISR version and the sitemap answers 503 instead
 * of dropping a page that is in its grace period.
 *
 * Known gap: a listing deleted outright (the owner's «Löschen» in the dashboard) leaves
 * no row, so it never counts for the grace period. That errs on the safe side (the page
 * drops to noindex as under the old rule). Closing it needs a DELETE trigger that
 * writes listing_tombstones (a migration, not part of PR C).
 */
import { createClient } from "@supabase/supabase-js";
import {
  BRAND_PAGE_GRACE_DAYS,
  BRAND_PAGE_MIN_INDEXABLE_LISTINGS,
  createGraceHistoryCache,
  endedWithinGrace,
  graceHistoryMatters,
  indexableBrandPages,
  isIndexableBrand,
  type BrandPageSummary,
  type EndedTakeover,
  type ListingHistoryRow,
} from "@/lib/buyauto/leasingBrands";
import { getPublicOfferIndex, liveTakeovers, type PublicOffer } from "@/services/listingsService";

const HISTORY_COLUMNS =
  "id, brand, status, expires_at, sold_at, archived_at, published_at, " +
  "deal_type, financing_type, price_per_month_chf, leasing_offer, contract_end_date";

/** Statuses a once-live listing can end in. Rows still "published" past their expiry are read separately. */
const ENDED_STATUSES = ["expired", "sold", "archived"] as const;

const DAY_MS = 24 * 60 * 60 * 1000;
/** The history changes when an offer ends; brand pages revalidate every 300 s too. */
const HISTORY_TTL_MS = 5 * 60 * 1000;
/** After a read without rows (failed or refused), the next attempt waits this long. */
const HISTORY_RETRY_MS = 60 * 1000;
/** The read runs on the hub, listing and sitemap requests: a stalled one must not hold them. */
const HISTORY_TIMEOUT_MS = 3000;
/** Far above the dozens of takeovers that end within a month. */
const HISTORY_ROW_LIMIT = 1000;

/** The grace history decides a page and could not be read (see the module comment). */
export class BrandHistoryUnavailableError extends Error {
  constructor() {
    super("Brand grace history unavailable");
    this.name = "BrandHistoryUnavailableError";
  }
}

/** PostgREST answered with a client error: configuration (key, schema), not a passing failure. */
function isRefused(status: number): boolean {
  return status >= 400 && status < 500 && status !== 408 && status !== 429;
}

async function readHistoryRows(now: Date): Promise<ListingHistoryRow[] | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;

  // Dates only (one day of margin each side): a coarse pre-filter without PostgREST's
  // reserved characters. endedTakeoversFromRows applies the exact window.
  const since = new Date(now.getTime() - (BRAND_PAGE_GRACE_DAYS + 1) * DAY_MS).toISOString().slice(0, 10);
  const tomorrow = new Date(now.getTime() + DAY_MS).toISOString().slice(0, 10);

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const signal = AbortSignal.timeout(HISTORY_TIMEOUT_MS);
  const history = () => admin.from("listings").select(HISTORY_COLUMNS).not("published_at", "is", null);
  // Two reads, so the live listings (published, expiry in the future) never fill the
  // row limit: the ended statuses by their end dates, and the rows still "published"
  // whose expiry falls in the window (past it, but not yet flipped by the status job).
  const [ended, pastExpiry] = await Promise.all([
    history()
      .in("status", [...ENDED_STATUSES])
      .or(`sold_at.gte.${since},archived_at.gte.${since},expires_at.gte.${since}`)
      .order("id")
      .limit(HISTORY_ROW_LIMIT)
      .abortSignal(signal),
    history()
      .eq("status", "published")
      .gte("expires_at", since)
      .lt("expires_at", tomorrow)
      .order("id")
      .limit(HISTORY_ROW_LIMIT)
      .abortSignal(signal),
  ]);
  for (const result of [ended, pastExpiry]) {
    if (!result.error) continue;
    if (isRefused(result.status)) {
      console.error("Brand grace history refused; the rule without the grace period applies:", {
        status: result.status,
        code: result.error.code,
        message: result.error.message,
      });
      return null;
    }
    throw result.error;
  }

  const endedRows = (Array.isArray(ended.data) ? ended.data : []) as unknown as ListingHistoryRow[];
  const pastExpiryRows = (Array.isArray(pastExpiry.data) ? pastExpiry.data : []) as unknown as ListingHistoryRow[];
  if (endedRows.length >= HISTORY_ROW_LIMIT || pastExpiryRows.length >= HISTORY_ROW_LIMIT) {
    console.warn("Brand grace history hit the row limit; older rows are missing.", { limit: HISTORY_ROW_LIMIT });
  }
  return [...endedRows, ...pastExpiryRows];
}

const graceHistory = createGraceHistoryCache(readHistoryRows, {
  ttlMs: HISTORY_TTL_MS,
  retryMs: HISTORY_RETRY_MS,
  onError: (error) => console.error("Brand grace history read failed:", error),
});

/**
 * Leasingübernahmen that ended (expired, sold, archived) within the grace period.
 * Cached for five minutes; on a failed read the last good result is reused, else none.
 */
export async function getEndedTakeovers(now: Date = new Date()): Promise<EndedTakeover[]> {
  return (await graceHistory(now)).ended;
}

type IndexingOptions = {
  now?: Date;
  /**
   * Throw BrandHistoryUnavailableError instead of applying the rule without the grace
   * period when the history decides and its read failed (brand page ISR, sitemap).
   */
  requireHistory?: boolean;
};

/**
 * The indexable brand pages for this offer index: the gate for the brand page's
 * robots tag, the sitemap and every link to a brand page (hub, guide, cost page,
 * listing pages, retired listing redirects, IndexNow). The history is read only when
 * some brand has exactly one live offer, the only case where it decides.
 */
export async function indexableBrandPagesFor(
  offers: PublicOffer[],
  { now = new Date(), requireHistory = false }: IndexingOptions = {}
): Promise<BrandPageSummary[]> {
  const takeovers = liveTakeovers(offers);
  if (!graceHistoryMatters(takeovers)) return indexableBrandPages(takeovers, [], now);
  const history = await graceHistory(now);
  if (history.failed && requireHistory) throw new BrandHistoryUnavailableError();
  return indexableBrandPages(takeovers, history.ended, now);
}

/** Like indexableBrandPagesFor, reading the live offer index. Throws on a failed offer read. */
export async function getIndexableBrandPages(): Promise<BrandPageSummary[]> {
  return indexableBrandPagesFor(await getPublicOfferIndex());
}

/** One brand page: its live Leasingübernahme count and the DB spellings it covers. */
export async function isBrandPageIndexable(
  liveCount: number,
  dbBrands: string[],
  { now = new Date(), requireHistory = false }: IndexingOptions = {}
): Promise<boolean> {
  if (liveCount < 1 || liveCount >= BRAND_PAGE_MIN_INDEXABLE_LISTINGS) return isIndexableBrand(liveCount);
  const history = await graceHistory(now);
  if (history.failed && requireHistory) throw new BrandHistoryUnavailableError();
  const endedInGrace = history.ended.filter(
    (r) => typeof r.brand === "string" && dbBrands.includes(r.brand.trim()) && endedWithinGrace(r.endedAt, now)
  ).length;
  return isIndexableBrand(liveCount, endedInGrace);
}
