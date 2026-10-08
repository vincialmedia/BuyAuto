/**
 * Kaufart — the ONE rule for how a listing is presented to buyers.
 *
 * Every public surface (cards, listing page, search filter, home tabs, hub and
 * brand pages, counts, titles/meta, JSON-LD, sitemap, live stats) and the
 * seller dashboard derive the display type from resolveListingOffer(). The
 * stored deal_type is never rewritten (it is seller data); it only feeds the
 * legacy guard below.
 *
 *   Leasingübernahme  coalesce(price_per_month_chf,
 *                              leasing_offer.lease_takeover_offer.price_per_month_chf) > 0,
 *                     whatever deal_type is stored (25 live takeovers are stored
 *                     as 'direct_purchase' with the rate in the JSON offer).
 *   Direktkauf        no monthly rate.
 *   Guard             a monthly price that comes from a NEW-leasing financing
 *                     offer (financing_type 'leasing' or leasing_offer.enabled,
 *                     without a lease_takeover_offer) is not a takeover: such a
 *                     listing keeps today's handling, i.e. the stored deal_type
 *                     (its "Leasing" teaser stays a Direktkauf variant).
 *
 * Effective values for a Leasingübernahme:
 *   rate     the coalesce above
 *   kaution  coalesce(deposit_chf, lease_takeover_offer.deposit_chf, 0)
 *   months   calendar months from today (Europe/Zurich) to contract_end_date,
 *            minimum 0; falls back to the stored value
 *            coalesce(remaining_months, lease_takeover_offer.remaining_months)
 *            while contract_end_date is NULL.
 * The database sets contract_end_date to the 1st of a month (first day of the
 * month the months were entered + N), so counting calendar months keeps the
 * seller's number for the rest of that month and counts down on every 1st.
 * A date a seller picked in the legacy takeover form can fall on any day; for
 * those the wizard's own rule applies (one month less while the end day is
 * still ahead of today's day), so the page never shows more than they entered.
 * At 0 months the contract has ended: the listing stays a Leasingübernahme but
 * drops out of every takeover list (isLiveOffer === false).
 */

export type Kaufart = "lease_takeover" | "direct_purchase";

export const KAUFART_LABEL: Record<Kaufart, string> = {
  lease_takeover: "Leasingübernahme",
  direct_purchase: "Direktkauf",
};

/** Raw listing fields the rule reads (DB column names, as in listings / listings_public). */
export interface KaufartSource {
  deal_type?: string | null;
  financing_type?: string | null;
  price_per_month_chf?: number | string | null;
  deposit_chf?: number | string | null;
  remaining_months?: number | string | null;
  contract_end_date?: string | null;
  leasing_offer?: unknown;
}

export interface ResolvedOffer {
  kaufart: Kaufart;
  /** True when the new-leasing guard kept the stored deal_type. */
  legacyLeasing: boolean;
  /** Monthly takeover rate (> 0) for a Leasingübernahme, else null. */
  rateChf: number | null;
  /** Effective Kaution for a Leasingübernahme (0 = none), else null. */
  kautionChf: number | null;
  /** Remaining months as stored by the seller (column, then JSON offer). */
  storedMonths: number | null;
  /** Remaining months as of today (see header), else null. */
  months: number | null;
  /** Leasingübernahme whose contract has run out (effective months reached 0). */
  contractEnded: boolean;
  /** False only for an ended Leasingübernahme: it must not appear in any list or count. */
  isLiveOffer: boolean;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

/** First non-null of the column value and the JSON offer value (SQL coalesce semantics). */
function coalesceNumber(column: unknown, fromOffer: unknown): number | null {
  const c = toNumber(column);
  if (c !== null) return c;
  return toNumber(fromOffer);
}

/** Today's calendar date in Switzerland as [year, month(1-12)]. */
function zurichYearMonthDay(now: Date): [number, number, number] {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Zurich",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);
  return [year, month, day];
}

/**
 * Remaining months from today to a contract end date ("YYYY-MM-DD"), minimum 0.
 * Returns null for a missing or unparseable date.
 */
export function monthsUntilContractEnd(contractEndDate: string | null | undefined, now: Date = new Date()): number | null {
  if (typeof contractEndDate !== "string") return null;
  const m = contractEndDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const endYear = Number(m[1]);
  const endMonth = Number(m[2]);
  const endDay = Number(m[3]);
  const [year, month, day] = zurichYearMonthDay(now);
  let months = endYear * 12 + endMonth - (year * 12 + month);
  // Seller-picked end date (not the database's 1st-of-month anchor): same rule as the wizard.
  if (endDay !== 1 && endDay < day) months -= 1;
  return Math.max(0, months);
}

/**
 * New-leasing financing on the listing (financing_type 'leasing' or an enabled
 * leasing_offer). On a Direktkauf this is the "Leasing" variant: Leasing chip,
 * "Ab CHF … / Monat" teaser and calculator — today's handling, kept as is.
 */
export function hasNewLeasingFinancing(source: { financing_type?: string | null; leasing_offer?: unknown }): boolean {
  return source.financing_type === "leasing" || asObject(source.leasing_offer)?.enabled === true;
}

export function resolveListingOffer(source: KaufartSource, now: Date = new Date()): ResolvedOffer {
  const offer = asObject(source.leasing_offer);
  const takeoverOffer = asObject(offer?.lease_takeover_offer);

  const rate = coalesceNumber(source.price_per_month_chf, takeoverOffer?.price_per_month_chf);
  const hasMonthlyRate = rate !== null && rate > 0;

  // Guard: a monthly price that belongs to a new-leasing offer (no takeover offer) is no takeover.
  const isNewLeasingOffer = hasNewLeasingFinancing(source) && takeoverOffer === null;

  const storedDealType: Kaufart = source.deal_type === "lease_takeover" ? "lease_takeover" : "direct_purchase";
  const legacyLeasing = hasMonthlyRate && isNewLeasingOffer;

  const kaufart: Kaufart = legacyLeasing ? storedDealType : hasMonthlyRate ? "lease_takeover" : "direct_purchase";

  if (kaufart !== "lease_takeover") {
    return {
      kaufart,
      legacyLeasing,
      rateChf: null,
      kautionChf: null,
      storedMonths: null,
      months: null,
      contractEnded: false,
      isLiveOffer: true,
    };
  }

  const kaution = coalesceNumber(source.deposit_chf, takeoverOffer?.deposit_chf) ?? 0;
  const storedMonths = coalesceNumber(source.remaining_months, takeoverOffer?.remaining_months);
  const monthsFromEndDate = monthsUntilContractEnd(source.contract_end_date, now);
  const months =
    monthsFromEndDate !== null
      ? monthsFromEndDate
      : storedMonths !== null
        ? Math.max(0, Math.round(storedMonths))
        : null;
  const contractEnded = months === 0;

  return {
    kaufart,
    legacyLeasing,
    rateChf: hasMonthlyRate ? rate : null,
    kautionChf: kaution > 0 ? kaution : 0,
    storedMonths,
    months,
    contractEnded,
    isLiveOffer: !contractEnded,
  };
}

/**
 * Kaufart of a listing object the UI already holds. Listing transforms stamp
 * `kaufart`; objects built elsewhere (raw DB rows in the dashboard, admin
 * rows) are resolved from their DB fields with the same rule.
 */
export function kaufartOf(listing: {
  kaufart?: Kaufart | null;
  deal_type?: string | null;
  financing_type?: string | null;
  price_per_month_chf?: number | string | null;
  pricePerMonthCHF?: number | null;
  leasing_offer?: unknown;
}): Kaufart {
  if (listing.kaufart === "lease_takeover" || listing.kaufart === "direct_purchase") return listing.kaufart;
  return resolveListingOffer({
    deal_type: listing.deal_type,
    financing_type: listing.financing_type,
    price_per_month_chf: listing.price_per_month_chf ?? listing.pricePerMonthCHF ?? null,
    leasing_offer: listing.leasing_offer,
  }).kaufart;
}
