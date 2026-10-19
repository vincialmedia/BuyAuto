/**
 * How a BuyAuto listing looks to an AI assistant (MCP connector).
 *
 * Built from the same Listing objects the site renders (services/listingsService
 * applies the Kaufart rule), and from an explicit allow-list of fields: no
 * seller names of private sellers, no user ids, no VIN, no payment or plan data.
 * Free-text descriptions lose e-mail addresses, phone numbers and links, so
 * contact keeps running through the listing page.
 */
import { buildListingHref } from "@/lib/buyauto/listingUrl";
import { listingFullName } from "@/lib/buyauto/listingSeo";
import { CANTON_CODES, CANTON_LABELS, type CantonCode } from "@/lib/buyauto/listingContract";
import { hasNewLeasingFinancing, kaufartOf } from "@/lib/buyauto/kaufart";
import { displayLocation } from "@/lib/buyauto/location";
import type { Listing, ListingDetail } from "@/lib/buyauto/types";

export const SITE_URL = "https://www.buyauto.ch";

/**
 * Marker on every link the connector hands out. Deliberately not a utm_source:
 * that would overwrite the assistant's own referrer (claude.ai, chatgpt.com),
 * which GA4's AI channel group reads (docs/ai-traffic-tracking.md). Connector
 * visits show up as landing pages with "via=mcp" in page_location.
 */
export const CONNECTOR_LINK_PARAMS = { via: "mcp" } as const;

export function siteUrl(path: string, params?: URLSearchParams): string {
  const url = new URL(path, SITE_URL);
  if (params) params.forEach((value, key) => url.searchParams.append(key, value));
  for (const [key, value] of Object.entries(CONNECTOR_LINK_PARAMS)) url.searchParams.set(key, value);
  return url.toString();
}

export function listingPageUrl(listing: { id: string; brand?: string | null; model?: string | null }): string {
  return siteUrl(buildListingHref(listing));
}

// ── Location ────────────────────────────────────────────────────────────────

const CANTON_CODE_SET = new Set<string>(CANTON_CODES);

/** Canton names in the four national languages (Nominatim strings use the local one). */
const CANTON_NAME_ALIASES: Record<string, CantonCode> = (() => {
  const map: Record<string, CantonCode> = {};
  for (const code of CANTON_CODES) map[normalizeText(CANTON_LABELS[code])] = code;
  const extra: Record<string, CantonCode> = {
    zurich: "ZH", berne: "BE", lucerne: "LU", lucerna: "LU", fribourg: "FR", friburgo: "FR",
    soleure: "SO", "bale-ville": "BS", "basilea-citta": "BS", "bale-campagne": "BL", "basilea-campagna": "BL",
    schaffhouse: "SH", "appenzell-rhodes-exterieures": "AR", "appenzell-rhodes-interieures": "AI",
    "saint-gall": "SG", "san-gallo": "SG", "st-gallen": "SG", grisons: "GR", grigioni: "GR", grischun: "GR",
    argovie: "AG", argovia: "AG", thurgovie: "TG", turgovia: "TG", ticino: "TI", vaud: "VD", waadt: "VD",
    valais: "VS", vallese: "VS", neuchatel: "NE", geneve: "GE", ginevra: "GE", genf: "GE", jura: "JU",
    glaris: "GL", glarona: "GL", obwald: "OW", obvaldo: "OW", nidwald: "NW", nidvaldo: "NW", zoug: "ZG",
    zugo: "ZG", schwytz: "SZ", svitto: "SZ", "uri": "UR",
  };
  return { ...map, ...extra };
})();

export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function cantonFromToken(token: string): CantonCode | null {
  const trimmed = token.trim();
  if (CANTON_CODE_SET.has(trimmed.toUpperCase()) && trimmed.length === 2) return trimmed.toUpperCase() as CantonCode;
  const inParens = trimmed.match(/\(([A-Za-z]{2})\)/);
  if (inParens && CANTON_CODE_SET.has(inParens[1].toUpperCase())) return inParens[1].toUpperCase() as CantonCode;
  // Bilingual Nominatim names: "Bern/Berne", "Valais/Wallis".
  for (const part of trimmed.split("/")) {
    const alias = CANTON_NAME_ALIASES[normalizeText(part)];
    if (alias) return alias;
  }
  return null;
}

/** Canton of a listing: the stored code, else read from the location text ("Dietikon, …, Zürich, 8953, Schweiz"). */
export function cantonCodeFor(location: string | null | undefined, cantonCode?: string | null): CantonCode | null {
  const stored = typeof cantonCode === "string" ? cantonCode.trim().toUpperCase() : "";
  if (CANTON_CODE_SET.has(stored)) return stored as CantonCode;
  const tokens = (location ?? "").split(",").map((t) => t.trim()).filter(Boolean);
  for (let i = tokens.length - 1; i >= 0; i--) {
    const code = cantonFromToken(tokens[i]);
    if (code) return code;
  }
  return null;
}

const COUNTRY_TOKENS = new Set(["schweiz", "suisse", "svizzera", "svizra", "switzerland", "ch"]);

/** Town of a listing: the first segment that is not a postcode, canton code or country. */
export function placeFor(location: string | null | undefined): string | null {
  const tokens = displayLocation(location).split(",").map((t) => t.trim()).filter(Boolean);
  for (const token of tokens) {
    if (/^\d{4}$/.test(token)) continue;
    if (token.length === 2 && CANTON_CODE_SET.has(token.toUpperCase())) continue;
    if (COUNTRY_TOKENS.has(normalizeText(token))) continue;
    return token;
  }
  return null;
}

// ── Description ─────────────────────────────────────────────────────────────

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const URL_RE = /\b(?:https?:\/\/|www\.)\S+/gi;
/** Swiss numbers: +41 / 0041 / 0 followed by nine digits, any separators ("079 123 45 67", "+41 (0)44 …"). */
const CH_PHONE_RE = /(?:(?:\+|\b00)41[\s./-]*(?:\(0\)[\s./-]*)?|\b0)(?:\d[\s./-]?){8}\d\b/g;
/** Other international numbers written with + or 00. */
const INTL_PHONE_RE = /(?:\+|\b00)[1-9]\d{0,2}(?:[\s./-]?\d){6,12}\b/g;

export const DESCRIPTION_REMOVED = "[removed]";

/** A date followed by more digits ("01.01.2028 12 Raten") can look like a phone number; dates stay. */
const DATE_START_RE = /^\d{1,2}\.\d{1,2}\.\d{2,4}/;
const removeUnlessDate = (match: string) => (DATE_START_RE.test(match) ? match : DESCRIPTION_REMOVED);

/** Seller text without contact details or links, collapsed whitespace, at most 2000 characters. */
export function sanitizeDescription(text: string | null | undefined): string | null {
  if (typeof text !== "string") return null;
  const cleaned = text
    .replace(/<[^>]*>/g, " ")
    .replace(EMAIL_RE, DESCRIPTION_REMOVED)
    .replace(URL_RE, DESCRIPTION_REMOVED)
    .replace(CH_PHONE_RE, removeUnlessDate)
    .replace(INTL_PHONE_RE, removeUnlessDate)
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!cleaned) return null;
  return cleaned.length > 2000 ? `${cleaned.slice(0, 1997).trimEnd()}...` : cleaned;
}

// ── Listing objects ─────────────────────────────────────────────────────────

export type OfferType = "lease_takeover" | "direct_purchase";

export const OFFER_TYPE_LABEL: Record<OfferType, string> = {
  lease_takeover: "Leasingübernahme (lease takeover)",
  direct_purchase: "Direktkauf (direct purchase)",
};

function positiveNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

function isoDate(value: string | null | undefined): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const m = value.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

/** Restkilometer: column first, then the takeover JSON offer (same order as the listing page). */
export function remainingKmFor(listing: Listing): number | null {
  const column = positiveNumber(listing.remaining_km);
  if (column !== null) return column;
  const offer = listing.leasing_offer as unknown as { lease_takeover_offer?: { remaining_km?: unknown } } | null;
  return positiveNumber(offer?.lease_takeover_offer?.remaining_km);
}

export interface ListingSummaryOutput {
  [key: string]: unknown;
  id: string;
  url: string;
  title: string;
  offer_type: OfferType;
  offer_label: string;
  monthly_rate_chf: number | null;
  remaining_months: number | null;
  deposit_chf: number | null;
  remaining_km_allowance: number | null;
  purchase_price_chf: number | null;
  new_leasing_offered: boolean;
  brand: string;
  model: string;
  year: number | null;
  mileage_km: number | null;
  fuel: string | null;
  gearbox: string | null;
  body: string | null;
  power_hp: number | null;
  location: string | null;
  canton_code: string | null;
  seller_type: "private" | "garage";
  garage_name: string | null;
  featured: boolean;
  image_url: string | null;
  listed_on: string | null;
}

export function listingTitle(listing: Listing): string {
  const name = listingFullName(listing) || [listing.brand, listing.model].filter(Boolean).join(" ") || "Fahrzeug";
  return listing.year ? `${name} (${listing.year})` : name;
}

function locationLabel(place: string | null, canton: CantonCode | null): string | null {
  if (place && canton) return `${place}, ${canton}`;
  if (place) return place;
  if (canton) return CANTON_LABELS[canton];
  return null;
}

export function listingSummary(listing: Listing, cantonCode?: string | null): ListingSummaryOutput {
  const kaufart = kaufartOf(listing);
  const isTakeover = kaufart === "lease_takeover";
  const canton = cantonCodeFor(listing.location, cantonCode);
  const sellerType = listing.seller_type === "garage" || listing.garage_id ? "garage" : "private";

  return {
    id: listing.id,
    url: listingPageUrl(listing),
    title: listingTitle(listing),
    offer_type: kaufart,
    offer_label: OFFER_TYPE_LABEL[kaufart],
    monthly_rate_chf: isTakeover ? positiveNumber(listing.pricePerMonthCHF) : null,
    // The transform reports unknown months as 0; only an ended contract really has 0 left.
    remaining_months: !isTakeover ? null : listing.contractEnded ? 0 : positiveNumber(listing.remainingMonths),
    deposit_chf: isTakeover ? (typeof listing.depositCHF === "number" && listing.depositCHF > 0 ? listing.depositCHF : 0) : null,
    remaining_km_allowance: isTakeover ? remainingKmFor(listing) : null,
    purchase_price_chf: isTakeover ? null : positiveNumber(listing.purchasePriceCHF),
    new_leasing_offered: !isTakeover && hasNewLeasingFinancing(listing),
    brand: listing.brand || "",
    model: listing.model || "",
    year: positiveNumber(listing.year),
    mileage_km: typeof listing.mileageKm === "number" && listing.mileageKm >= 0 ? listing.mileageKm : null,
    fuel: listing.fuel || null,
    gearbox: listing.gearbox || null,
    body: listing.body || null,
    power_hp: positiveNumber(listing.powerHp),
    location: locationLabel(placeFor(listing.location), canton),
    canton_code: canton,
    seller_type: sellerType,
    garage_name: sellerType === "garage" ? listing.garage_name?.trim() || null : null,
    featured: listing.premium === true,
    image_url: listing.imageUrl || listing.images?.[0] || null,
    listed_on: isoDate(listing.created_at),
  };
}

export interface ListingDetailOutput extends ListingSummaryOutput {
  contract_ended: boolean;
  variant: string | null;
  first_registration: string | null;
  drivetrain: string | null;
  description: string | null;
  images: string[];
  garage_page_url: string | null;
  contact: { how: string; url: string };
}

export const CONTACT_HOW =
  "Message the seller from the listing page on buyauto.ch. Visitors without an account create one in the same step.";

export function listingDetail(
  listing: ListingDetail,
  garage?: { name?: string | null; slug?: string | null } | null
): ListingDetailOutput {
  const summary = listingSummary(listing, listing.canton_code);
  const images = (listing.image_urls?.length ? listing.image_urls : listing.images ?? [])
    .filter((src): src is string => typeof src === "string" && /^https:\/\//.test(src))
    .slice(0, 12);
  const garageName = summary.seller_type === "garage" ? garage?.name?.trim() || summary.garage_name : null;
  const garageSlug = summary.seller_type === "garage" ? garage?.slug?.trim() ?? "" : "";

  return {
    ...summary,
    contract_ended: summary.offer_type === "lease_takeover" && listing.contractEnded === true,
    garage_name: garageName,
    variant: listing.variant?.trim() || null,
    first_registration: isoDate(listing.firstRegistration),
    drivetrain: listing.drivetrain?.trim() || null,
    description: sanitizeDescription(listing.description),
    images,
    image_url: summary.image_url ?? images[0] ?? null,
    // Same href as the listing page's garage link (/[dealerSlug]).
    garage_page_url: garageSlug ? siteUrl(`/${encodeURIComponent(garageSlug)}`) : null,
    contact: { how: CONTACT_HOW, url: summary.url },
  };
}
