/**
 * contract_end_date — the end of a lease-takeover contract as the seller picked
 * it in the listing wizard ("yyyy-MM-dd").
 *
 * Write side: the database trigger set_listing_contract_end_date (migration
 * 20261008153608) keeps a non-null date the client sends and otherwise anchors
 * the contract at the 1st of the current month (Europe/Zurich) + remaining
 * months. So every listing write sends the seller's date for a takeover, no
 * date when the seller gave none (months typed by hand: the trigger counts down
 * from the months), and null on a listing without a takeover.
 *
 * Read side: the seller dashboard flags a takeover whose contract_end_date
 * has passed (Europe/Zurich).
 */
import { resolveListingOffer, type KaufartSource } from "./kaufart";

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** The value as "yyyy-MM-dd" when it is a real calendar date in that format, else null. */
export function normalizeContractEndDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const m = value.trim().match(ISO_DATE_RE);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (probe.getUTCFullYear() !== year || probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day) {
    return null;
  }
  return `${m[1]}-${m[2]}-${m[3]}`;
}

/** "yyyy-MM-dd" as a local Date at midnight (for the date pickers), else undefined. */
export function parseContractEndDate(value: unknown): Date | undefined {
  const normalized = normalizeContractEndDate(value);
  if (!normalized) return undefined;
  const [year, month, day] = normalized.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** A Direktkauf leasing_offer that carries an enabled Leasingübernahme offer. */
export function hasEnabledTakeoverOffer(leasingOffer: unknown): boolean {
  if (!leasingOffer || typeof leasingOffer !== "object") return false;
  const takeover = (leasingOffer as { lease_takeover_offer?: unknown }).lease_takeover_offer;
  return Boolean(takeover && typeof takeover === "object" && (takeover as { enabled?: unknown }).enabled === true);
}

/** A listing write that is a takeover: deal_type lease_takeover, or a Direktkauf with an enabled takeover offer. */
export function isTakeoverListingWrite(source: { deal_type?: string | null; leasing_offer?: unknown }): boolean {
  if (source.deal_type === "lease_takeover") return true;
  return source.deal_type === "direct_purchase" && hasEnabledTakeoverOffer(source.leasing_offer);
}

/**
 * contract_end_date for a listing write:
 *   takeover with a valid date  -> the seller's date (the trigger keeps it);
 *   takeover without a date     -> undefined, i.e. not sent: a new row gets its
 *                                  end date from the months, an existing row
 *                                  keeps its running countdown unless the
 *                                  months changed (then the trigger re-anchors);
 *   no takeover                 -> null, clearing a stale date (as
 *                                  mirrorTakeoverOfferIntoColumns does).
 */
export function contractEndDateForListingWrite(source: {
  deal_type?: string | null;
  leasing_offer?: unknown;
  contract_end_date?: unknown;
}): string | null | undefined {
  if (!isTakeoverListingWrite(source)) return null;
  return normalizeContractEndDate(source.contract_end_date) ?? undefined;
}

/**
 * The legacy takeover form lets the seller pick an end date (which fills the
 * months) or type the months by hand. The date only stands while the months
 * are still the ones it came with (`dateMonths`: computed from the pick, or
 * the stored months when an existing date was loaded); once the seller types
 * other months, no date is sent and the trigger counts down from the months.
 */
export function contractEndDateForMonths(params: {
  contractEndDate: string | null;
  dateMonths: number | null;
  months: unknown;
}): string | null {
  const date = normalizeContractEndDate(params.contractEndDate);
  if (!date || params.dateMonths === null) return null;
  const months = typeof params.months === "number" ? params.months : Number(params.months);
  return Number.isFinite(months) && months === params.dateMonths ? date : null;
}

/** Today's date in Switzerland as "yyyy-MM-dd". */
function zurichTodayIso(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Zurich",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/**
 * Seller dashboard: "Vertrag abgelaufen – Inserat prüfen". Shown when the
 * listing is a takeover (deal_type lease_takeover or a Direktkauf with a
 * takeover offer, per resolveListingOffer) and its contract_end_date lies
 * before today in Zurich. No date, no badge; a sold listing has nothing left
 * to check.
 */
export function showContractEndedBadge(
  listing: KaufartSource & { status?: string | null },
  now: Date = new Date()
): boolean {
  if (listing.status === "sold") return false;
  if (resolveListingOffer(listing, now).kaufart !== "lease_takeover") return false;
  const endDate = normalizeContractEndDate(listing.contract_end_date);
  return endDate !== null && endDate < zurichTodayIso(now);
}
