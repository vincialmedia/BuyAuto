/**
 * IndexNow: tells Bing, Yandex and the other participating engines which URLs on
 * www.buyauto.ch changed, so they recrawl them without waiting for the sitemap.
 * Google does not use IndexNow. Bing's index feeds ChatGPT search and Copilot.
 *
 * The daily cron (vercel.json → /api/indexnow) collects the listings that were
 * published, updated, expired, sold or archived within the last INDEXNOW_WINDOW_HOURS
 * and submits their /fahrzeug/ URLs, plus the Leasingübernahme hub and the brand pages
 * of the brands whose takeovers changed. A brand page is submitted while it is
 * indexable (the rule of the sitemap and the brand links, grace period included), or
 * when its brand's last live Leasingübernahme ended in the window: the page has just
 * gone noindex or away, and the engines should see that.
 *
 * Pure logic: the data source and fetch are passed in, so
 * `npx tsx scripts/test-indexnow.ts` runs it with mocks. Server-only (API route and
 * tests); never import it from a page component. Listings deleted outright leave no
 * row and are not submitted (see brandIndexingService).
 *
 * The key is public by design: IndexNow verifies ownership by fetching
 * INDEXNOW_KEY_LOCATION, the file public/<key>.txt that holds the key.
 */
import { timingSafeEqual } from "node:crypto";
import { resolveListingOffer, type Kaufart } from "@/lib/buyauto/kaufart";
import {
  brandPageForDbBrand,
  graceHistoryMatters,
  indexableBrandPages,
  listingEndedAt,
  type EndedTakeover,
  type ListingHistoryRow,
} from "@/lib/buyauto/leasingBrands";
import { buildListingHref } from "@/lib/buyauto/listingUrl";

export const INDEXNOW_KEY = "50ebc8faf6aca0fd48bc68fc8bfaa822";
export const INDEXNOW_HOST = "www.buyauto.ch";
export const INDEXNOW_SITE_URL = `https://${INDEXNOW_HOST}`;
export const INDEXNOW_KEY_LOCATION = `${INDEXNOW_SITE_URL}/${INDEXNOW_KEY}.txt`;
export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

/** The cron runs daily; two extra hours cover a late or retried run. */
export const INDEXNOW_WINDOW_HOURS = 26;
/** Upper bound per submission (IndexNow accepts up to 10'000; a day here has dozens). */
export const INDEXNOW_MAX_URLS = 500;
/** A slow IndexNow answer must not hold the function open. */
export const INDEXNOW_TIMEOUT_MS = 10_000;

/** The canonical Leasingübernahme hub (self-canonical view of /suche). */
export const INDEXNOW_HUB_PATH = "/suche?dealType=lease_takeover";

const HOUR_MS = 60 * 60 * 1000;

/** A row of the live offer index (listings_public, Kaufart resolved): PublicOffer fits. */
export interface IndexNowOffer {
  id: string;
  brand: string | null;
  model: string | null;
  created_at: string | null;
  updated_at: string | null;
  offer: { kaufart: Kaufart; isLiveOffer: boolean };
}

/** A listings row that may have ended (read server-side with the service role). */
export type IndexNowEndedRow = ListingHistoryRow & {
  id: string;
  model: string | null;
  remaining_months?: number | string | null;
};

export interface IndexNowDataSource {
  /** Every published, unexpired listing (getPublicOfferIndex). */
  liveOffers(): Promise<IndexNowOffer[]>;
  /**
   * Rows that can have ended since `since`: status expired, sold, archived, or published
   * past its expiry. null when the rows cannot be read (no service-role key).
   */
  endedRows(since: Date): Promise<IndexNowEndedRow[] | null>;
  /**
   * The Leasingübernahmen that ended within the brand grace period (getEndedTakeovers),
   * for the brand page rule. Read only when a brand sits at exactly one live offer.
   */
  endedTakeovers(now: Date): Promise<EndedTakeover[]>;
}

export interface IndexNowCollection {
  /** Absolute www URLs, deduplicated: hub, brand pages, then listings; at most INDEXNOW_MAX_URLS. */
  urls: string[];
  /** Live listings published or updated in the window. */
  changedListings: number;
  /** Listings that ended in the window; null when the ended rows were not readable. */
  endedListings: number | null;
  /** True when more than INDEXNOW_MAX_URLS URLs were collected and the rest was dropped. */
  truncated: boolean;
  /** Read errors (the run continues with what it has). */
  errors: string[];
}

function timeMs(value: string | null | undefined): number | null {
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
}

function inWindow(ms: number | null, sinceMs: number, nowMs: number): boolean {
  return ms !== null && ms >= sinceMs && ms <= nowMs;
}

function errorText(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) return String((error as { message: unknown }).message);
  return String(error);
}

export function indexNowSince(now: Date): Date {
  return new Date(now.getTime() - INDEXNOW_WINDOW_HOURS * HOUR_MS);
}

/**
 * The URLs to submit for the window ending at `now`. Never throws: a failed read is
 * reported in `errors` and the run goes on with the other source.
 *
 * A listing counts when it was created or updated in the window (live) or ended in the
 * window (expired, sold, archived, or published past its expiry; its URL now redirects).
 * For a Leasingübernahme the hub and its brand page change too, so the hub is added
 * and the brand page under the rule in the module comment; a Direktkauf adds only its
 * own URL.
 */
export async function collectIndexNowUrls(source: IndexNowDataSource, now: Date = new Date()): Promise<IndexNowCollection> {
  const nowMs = now.getTime();
  const since = indexNowSince(now);
  const sinceMs = since.getTime();
  const errors: string[] = [];

  type Change = { href: string; brand: string | null; takeover: boolean; ended: boolean; at: number };
  const changes: Change[] = [];

  let liveRows: IndexNowOffer[] | null = null;
  let changedListings = 0;
  try {
    liveRows = await source.liveOffers();
    for (const row of liveRows) {
      const at = Math.max(timeMs(row.updated_at) ?? -Infinity, timeMs(row.created_at) ?? -Infinity);
      if (!inWindow(Number.isFinite(at) ? at : null, sinceMs, nowMs)) continue;
      changedListings += 1;
      changes.push({
        href: buildListingHref({ id: row.id, brand: row.brand, model: row.model }),
        brand: row.brand,
        takeover: row.offer.kaufart === "lease_takeover",
        ended: false,
        at,
      });
    }
  } catch (error) {
    errors.push(`live listings: ${errorText(error)}`);
  }

  let endedListings: number | null = null;
  try {
    const rows = await source.endedRows(since);
    if (rows !== null) {
      endedListings = 0;
      for (const row of rows) {
        if (!row.published_at) continue; // never live: declined or draft
        const endedAt = listingEndedAt(row, now);
        const at = timeMs(endedAt);
        if (!endedAt || !inWindow(at, sinceMs, nowMs)) continue;
        endedListings += 1;
        // Was it on the hub when it ended? Same rule as the brand grace period.
        const offer = resolveListingOffer(row, new Date(endedAt));
        changes.push({
          href: buildListingHref({ id: row.id, brand: row.brand, model: row.model }),
          brand: row.brand,
          takeover: offer.kaufart === "lease_takeover" && offer.isLiveOffer,
          ended: true,
          at: at as number,
        });
      }
    }
  } catch (error) {
    errors.push(`ended listings: ${errorText(error)}`);
  }

  // Newest change first, so a truncated list keeps the latest listings.
  changes.sort((a, b) => b.at - a.at || a.href.localeCompare(b.href));

  // Brand pages: indexable ones, and those whose last live takeover ended (see the
  // module comment). Without the live offers neither is known, so every brand page of a
  // changed takeover is submitted.
  let indexableSlugs: Set<string> | null = null;
  const liveTakeoverSlugs = new Set<string>();
  if (liveRows) {
    const liveTakeoverRows = liveRows.filter((r) => r.offer.kaufart === "lease_takeover" && r.offer.isLiveOffer);
    for (const row of liveTakeoverRows) {
      const page = typeof row.brand === "string" ? brandPageForDbBrand(row.brand) : null;
      if (page) liveTakeoverSlugs.add(page.slug);
    }
    let endedTakeovers: EndedTakeover[] = [];
    if (graceHistoryMatters(liveTakeoverRows)) {
      try {
        endedTakeovers = await source.endedTakeovers(now);
      } catch (error) {
        errors.push(`brand grace history: ${errorText(error)}`);
      }
    }
    indexableSlugs = new Set(indexableBrandPages(liveTakeoverRows, endedTakeovers, now).map((b) => b.slug));
  }

  const takeoverChanges = changes.filter((c) => c.takeover);
  const brandPaths = new Set<string>();
  for (const change of takeoverChanges) {
    const page = typeof change.brand === "string" ? brandPageForDbBrand(change.brand) : null;
    if (!page) continue;
    const submit =
      indexableSlugs === null || indexableSlugs.has(page.slug) || (change.ended && !liveTakeoverSlugs.has(page.slug));
    if (submit) brandPaths.add(`/leasinguebernahme/${page.slug}`);
  }

  const paths = [
    ...(takeoverChanges.length > 0 ? [INDEXNOW_HUB_PATH] : []),
    ...Array.from(brandPaths).sort(),
    ...changes.map((c) => c.href),
  ];
  const urls = Array.from(new Set(paths.map((p) => `${INDEXNOW_SITE_URL}${p}`)));

  return {
    urls: urls.slice(0, INDEXNOW_MAX_URLS),
    changedListings,
    endedListings,
    truncated: urls.length > INDEXNOW_MAX_URLS,
    errors,
  };
}

export interface IndexNowSubmission {
  /** True when IndexNow answered 200 (submitted) or 202 (accepted, key check pending). */
  ok: boolean;
  /** HTTP status from IndexNow; null when no request was sent or it failed. */
  status: number | null;
  error?: string;
}

/** The request body IndexNow expects for a list of URLs on one host. */
export function indexNowPayload(urls: string[]) {
  return { host: INDEXNOW_HOST, key: INDEXNOW_KEY, keyLocation: INDEXNOW_KEY_LOCATION, urlList: urls };
}

/** POSTs the URLs to IndexNow. Never throws; an empty list sends nothing. */
export async function submitIndexNow(
  urls: string[],
  fetchImpl: typeof fetch,
  timeoutMs: number = INDEXNOW_TIMEOUT_MS
): Promise<IndexNowSubmission> {
  if (urls.length === 0) return { ok: true, status: null };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(indexNowPayload(urls)),
      signal: controller.signal,
    });
    const ok = res.status === 200 || res.status === 202;
    return ok ? { ok, status: res.status } : { ok, status: res.status, error: `IndexNow answered ${res.status}` };
  } catch (error) {
    return { ok: false, status: null, error: errorText(error) };
  } finally {
    clearTimeout(timer);
  }
}

export interface IndexNowRunSummary extends Omit<IndexNowCollection, "urls"> {
  ok: boolean;
  /** Number of URLs collected (and submitted unless dryRun). */
  urlCount: number;
  urls: string[];
  /** True when nothing was sent on purpose (not production, or ?dryRun=1). */
  dryRun: boolean;
  submission: IndexNowSubmission | null;
}

/** Collects and (unless dryRun) submits. Never throws. */
export async function runIndexNow({
  source,
  fetchImpl,
  now = new Date(),
  dryRun,
}: {
  source: IndexNowDataSource;
  fetchImpl: typeof fetch;
  now?: Date;
  dryRun: boolean;
}): Promise<IndexNowRunSummary> {
  const collection = await collectIndexNowUrls(source, now);
  const submission = dryRun || collection.urls.length === 0 ? null : await submitIndexNow(collection.urls, fetchImpl);
  return {
    ...collection,
    ok: collection.errors.length === 0 && (submission === null || submission.ok),
    urlCount: collection.urls.length,
    dryRun,
    submission,
  };
}

// ---------------------------------------------------------------------------
// Who may trigger the run
// ---------------------------------------------------------------------------

export type CronAuth = { ok: true; warning?: string } | { ok: false };

function sameSecret(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/**
 * Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when the project has a
 * CRON_SECRET. With a secret set, only that header passes. Without one, only requests
 * whose user agent starts with "vercel-cron/" pass, with a warning to set the secret.
 * Anyone can send that user agent, so the run is kept harmless: it only reads listing
 * URLs and pings IndexNow, and the secret is the real gate (set CRON_SECRET in Vercel).
 */
export function authorizeCronRequest({
  authorization,
  userAgent,
  cronSecret,
}: {
  authorization: string | undefined;
  userAgent: string | undefined;
  cronSecret: string | undefined;
}): CronAuth {
  const secret = cronSecret?.trim();
  if (secret) {
    return typeof authorization === "string" && sameSecret(authorization, `Bearer ${secret}`) ? { ok: true } : { ok: false };
  }
  if (typeof userAgent === "string" && userAgent.startsWith("vercel-cron/")) {
    return { ok: true, warning: "IndexNow cron: CRON_SECRET is not set; accepted on the vercel-cron user agent only." };
  }
  return { ok: false };
}
