import { supabase } from "@/integrations/supabase/client";
import { SearchQuery, SearchResult } from "@/lib/buyauto/search";
import { Listing, ListingDetail } from "@/lib/buyauto/types";
import type { Database } from "@/integrations/supabase/types";
import { BODY_TYPES, FUEL_TYPES, GEARBOX_TYPES } from "@/lib/buyauto/listingContract";
import { hasNewLeasingFinancing, kaufartOf, resolveListingOffer, type ResolvedOffer } from "@/lib/buyauto/kaufart";
import { publicSellerName } from "@/lib/buyauto/sellerName";
import { displayLocation } from "@/lib/buyauto/location";
import { computeInventoryStats, type InventoryStats } from "@/lib/buyauto/facts";

type PublicListingRow = Database["public"]["Views"]["listings_public"]["Row"];
type ListingsTableRow = Database["public"]["Tables"]["listings"]["Row"];

const PUBLIC_LISTINGS_VIEW = "listings_public";

type PublicGarageRow = {
  id: string;
  garage_name: string | null;
  city: string | null;
  slug: string | null;
  description: string | null;
  header_image_url: string | null;
  logo_url: string | null;
};

function resolveListingImagesPublicUrl(pathOrUrl: string | null): string | null {
  if (typeof pathOrUrl !== "string") return null;
  const v = pathOrUrl.trim();
  if (!v) return null;

  if (/^https?:\/\//i.test(v)) return v;
  if (v.startsWith("/")) return v;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) return null;

  const encoded = v
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");

  return `${base}/storage/v1/object/public/listing-images/${encoded}`;
}

type PublicListingOwnerProfileRow = {
  listing_id: string;
  full_name: string | null;
  avatar_url: string | null;
};

async function fetchPublicListingOwnerProfilesByListingIds(
  listingIds: string[]
): Promise<Record<string, { fullName: string | null; avatarUrl: string | null }>> {
  const unique = Array.from(new Set(listingIds.filter((v) => typeof v === "string" && v.trim() !== "")));
  if (unique.length === 0) return {};

  const { data, error } = await supabase.rpc("get_public_listing_owner_profiles", { p_listing_ids: unique });

  if (error) {
    console.error("Error fetching public owner profiles by listing IDs:", { error, count: unique.length });
    return {};
  }

  const rows = (Array.isArray(data) ? data : []) as unknown as PublicListingOwnerProfileRow[];
  const map: Record<string, { fullName: string | null; avatarUrl: string | null }> = {};

  for (const r of rows) {
    const listingId = typeof (r as any)?.listing_id === "string" ? (r as any).listing_id : String((r as any)?.listing_id ?? "");
    if (!listingId) continue;

    map[listingId] = {
      fullName: typeof (r as any)?.full_name === "string" ? (r as any).full_name : null,
      avatarUrl: typeof (r as any)?.avatar_url === "string" ? (r as any).avatar_url : null,
    };
  }

  return map;
}

async function fetchPublicGaragesByIds(garageIds: string[]): Promise<Record<string, PublicGarageRow>> {
  const unique = Array.from(new Set(garageIds.filter((v) => typeof v === "string" && v.trim() !== "")));
  if (unique.length === 0) return {};

  const { data, error } = await supabase.rpc("get_public_garages", { p_garage_ids: unique });

  if (error) {
    console.error("Error fetching public garages:", { error, count: unique.length });
    return {};
  }

  const rows = (Array.isArray(data) ? data : []) as unknown as PublicGarageRow[];
  const map: Record<string, PublicGarageRow> = {};

  for (const r of rows) {
    const id = typeof (r as any)?.id === "string" ? (r as any).id : String((r as any)?.id ?? "");
    if (!id) continue;

    map[id] = {
      id,
      garage_name: typeof (r as any)?.garage_name === "string" ? (r as any).garage_name : null,
      city: typeof (r as any)?.city === "string" ? (r as any).city : null,
      slug: typeof (r as any)?.slug === "string" ? (r as any).slug : null,
      description: typeof (r as any)?.description === "string" ? (r as any).description : null,
      header_image_url: typeof (r as any)?.header_image_url === "string" ? (r as any).header_image_url : null,
      logo_url: typeof (r as any)?.logo_url === "string" ? (r as any).logo_url : null,
    };
  }

  return map;
}

function getListingIdFromRow(row: unknown): string | null {
  const r = row as Record<string, unknown>;
  const id = r.id;
  if (typeof id === "string" && id.trim()) return id;
  if (id === null || id === undefined) return null;
  const s = String(id);
  return s.trim() ? s : null;
}

function getNonEmptyString(input: unknown): string | null {
  if (typeof input === "string") return input.trim() ? input : null;
  if (input === null || input === undefined) return null;
  const s = String(input);
  return s.trim() ? s : null;
}

function getGarageIdFromRow(row: unknown): string | null {
  const r = row as any;

  const candidates: unknown[] = [
    r.garage_id,
    r.garageId,
    r.garage?.id,
    r.garage?.garage_id,
    r.garages?.id,
  ];

  for (const c of candidates) {
    const v = getNonEmptyString(c);
    if (v) return v;
  }

  return null;
}

function getGarageNameFromRow(row: unknown): string | null {
  const r = row as any;

  const candidates: unknown[] = [
    r.garage_name,
    r.garageName,
    r.garage?.garage_name,
    r.garage?.name,
    r.garages?.garage_name,
    r.garages?.name,
  ];

  for (const c of candidates) {
    const v = getNonEmptyString(c);
    if (v) return v;
  }

  return null;
}

function getSellerTypeFromRow(row: unknown): "private" | "garage" | null {
  const r = row as any;

  const t = r.seller_type ?? r.sellerType ?? null;
  if (t === "garage" || t === "private") return t;

  return getGarageIdFromRow(row) ? "garage" : null;
}

function isGarageSellerFromRow(row: unknown): boolean {
  return getSellerTypeFromRow(row) === "garage";
}

/**
 * Safely parse images from database JSON field
 * Handles multiple formats and provides proper fallbacks
 */
function parseImagesFromDatabase(imagesField: any, coverImageUrl?: string): string[] {
  let imageUrls: string[] = [];

  // Handle various image formats from database
  if (imagesField) {
    try {
      // Case 1: Already an array (direct array storage)
      if (Array.isArray(imagesField)) {
        imageUrls = imagesField.filter(img => typeof img === "string" && img.trim() !== "");
      }
      // Case 2: JSON string that needs parsing
      else if (typeof imagesField === "string") {
        const parsed = JSON.parse(imagesField);
        if (Array.isArray(parsed)) {
          imageUrls = parsed.filter(img => typeof img === "string" && img.trim() !== "");
        }
      }
      // Case 3: Object (might be a JSON object)
      else if (typeof imagesField === "object") {
        if (imagesField.length !== undefined) {
          const values = Object.values(imagesField) as unknown[];
          imageUrls = values.filter(img => typeof img === "string" && img.trim() !== "") as string[];
        }
      }
    } catch (error) {
      console.error("Error parsing images JSON:", {
        error: (error as Error).message,
        imagesField: imagesField,
        type: typeof imagesField
      });
      imageUrls = [];
    }
  }

  // Fallback: if no images in array but cover_image_url exists, use it
  if (imageUrls.length === 0 && coverImageUrl && coverImageUrl.trim() !== "") {
    imageUrls = [coverImageUrl];
  }

  return imageUrls;
}

/**
 * Normalize enum-ish string fields coming from DB views (typed as string).
 * Allowed values come from the single field contract, so read-side and
 * write-side can never disagree about what a valid body/fuel/gearbox is.
 */
const FUEL_VALUES = FUEL_TYPES;
type FuelValue = (typeof FUEL_VALUES)[number];

const GEARBOX_VALUES = GEARBOX_TYPES;
type GearboxValue = (typeof GEARBOX_VALUES)[number];

const BODY_VALUES = BODY_TYPES;
type BodyValue = (typeof BODY_VALUES)[number];

function isOneOf<T extends readonly string[]>(values: T, input: unknown): input is T[number] {
  return typeof input === "string" && (values as readonly string[]).includes(input);
}

function normalizeFuel(input: unknown): FuelValue {
  if (isOneOf(FUEL_VALUES, input)) return input;
  return "Benzin";
}

function normalizeGearbox(input: unknown): GearboxValue {
  if (isOneOf(GEARBOX_VALUES, input)) return input;
  return "Automatik";
}

function normalizeBody(input: unknown): BodyValue {
  if (isOneOf(BODY_VALUES, input)) return input;
  return "Limousine";
}

// ---------------------------------------------------------------------------
// Row -> UI Listing transforms. Every public listing passes through
// listingFieldsFromRow, which applies the Kaufart rule (lib/buyauto/kaufart):
// kaufart, effective monthly rate, Kaution and remaining months are decided
// there and nowhere else. deal_type stays the stored value (analytics reads it).
// ---------------------------------------------------------------------------

type ListingSourceRow = {
  id?: unknown;
  brand?: string | null;
  model?: string | null;
  variant?: string | null;
  title?: string | null;
  description?: string | null;
  year?: number | null;
  price_per_month_chf?: number | null;
  purchase_price_chf?: number | null;
  remaining_months?: number | null;
  remaining_km?: number | null;
  deposit_chf?: number | null;
  contract_end_date?: string | null;
  location?: string | null;
  mileage_km?: number | null;
  fuel?: unknown;
  gearbox?: unknown;
  body?: unknown;
  premium?: boolean | null;
  images?: unknown;
  cover_image_url?: string | null;
  deal_type?: string | null;
  financing_type?: string | null;
  leasing_offer?: unknown;
  vin?: string | null;
  make_id?: string | null;
  model_id?: string | null;
  variant_id?: string | null;
  power_hp?: number | null;
  drivetrain?: string | null;
  first_registration?: string | null;
  created_at?: string | null;
};

/** Purchase price is only ever purchase_price_chf (never the plan fee price_paid_chf). */
function purchasePriceFromRow(row: ListingSourceRow): number | null {
  const v = row.purchase_price_chf;
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null;
}

function listingFieldsFromRow(row: ListingSourceRow, now: Date = new Date()) {
  const imageUrls = parseImagesFromDatabase(row.images, row.cover_image_url ?? undefined);
  const offer = resolveListingOffer(row, now);
  const isTakeover = offer.kaufart === "lease_takeover";

  const leasing_offer =
    row.leasing_offer && typeof row.leasing_offer === "object" ? (row.leasing_offer as any) : null;

  return {
    id: String(row.id ?? ""),
    deal_type: (row.deal_type ?? "direct_purchase") as Listing["deal_type"],
    kaufart: offer.kaufart,
    contractEnded: offer.contractEnded,
    financing_type: (row.financing_type ?? null) as Listing["financing_type"],
    leasing_offer,
    brand: row.brand ?? "",
    model: row.model ?? "",
    variant: row.variant ?? null,
    title: row.title || undefined,
    description: row.description || undefined,
    year: row.year ?? 0,
    pricePerMonthCHF: isTakeover ? offer.rateChf ?? 0 : row.price_per_month_chf ?? 0,
    remainingMonths: isTakeover ? offer.months ?? 0 : row.remaining_months ?? 0,
    remaining_km: row.remaining_km ?? null,
    location: displayLocation(row.location),
    mileageKm: row.mileage_km ?? 0,
    fuel: normalizeFuel(row.fuel),
    gearbox: normalizeGearbox(row.gearbox),
    body: normalizeBody(row.body),
    premium: row.premium ?? false,
    depositCHF: isTakeover ? offer.kautionChf ?? 0 : row.deposit_chf ?? null,
    images: imageUrls,
    imageUrl: imageUrls[0] || "",
    purchasePriceCHF: purchasePriceFromRow(row),

    vin: row.vin ?? null,
    makeId: row.make_id ?? null,
    modelId: row.model_id ?? null,
    variantId: row.variant_id ?? null,
    powerHp: row.power_hp ?? null,
    drivetrain: row.drivetrain ?? null,
    firstRegistration: row.first_registration ?? null,
    created_at: row.created_at ?? null,
  };
}

function sellerFieldsFromRow(row: unknown) {
  const joinedProfile = (row as { profiles?: { full_name?: string | null; avatar_url?: string | null } | null }).profiles ?? null;
  const rawName = joinedProfile?.full_name ?? (row as { seller_name?: string | null }).seller_name ?? null;
  const rawAvatar = joinedProfile?.avatar_url ?? (row as { seller_avatar_url?: string | null }).seller_avatar_url ?? null;

  const seller_type = getSellerTypeFromRow(row);
  const garage_id = getGarageIdFromRow(row);
  const garage_name = getGarageNameFromRow(row);

  return {
    seller_type,
    seller_name: publicSellerName({ sellerType: seller_type, fullName: getNonEmptyString(rawName), garageName: garage_name }),
    seller_avatar_url: getNonEmptyString(rawAvatar),
    garage_id,
    garage_name,
    garage_logo_url: null as string | null,
  };
}

// Transform public listing row to UI Listing format
function transformPublicRowToListing(row: PublicListingRow, now: Date = new Date()): Listing {
  return {
    ...listingFieldsFromRow(row as unknown as ListingSourceRow, now),
    ...sellerFieldsFromRow(row),
  };
}

// Transform public listing row to detailed format
function transformPublicRowToListingDetail(row: PublicListingRow, now: Date = new Date()): ListingDetail {
  return {
    ...listingFieldsFromRow(row as unknown as ListingSourceRow, now),
    ...sellerFieldsFromRow(row),
    canton_code: row.canton_code ?? "",
    cover_image_url: row.cover_image_url ?? null,
    image_urls: parseImagesFromDatabase(row.images, row.cover_image_url),
    status: (row.status ?? "draft") as ListingDetail["status"],
    created_at: row.created_at ?? "",
    expires_at: row.expires_at ?? null,
    duration_days: row.duration_days ?? null,
    price_plan: (row.price_plan ?? null) as ListingDetail["price_plan"],
    premium_until: row.premium_until ?? null,
  };
}

export { transformPublicRowToListingDetail };

function transformListingsTableRowToListingDetail(row: ListingsTableRow): ListingDetail {
  return {
    ...listingFieldsFromRow(row as unknown as ListingSourceRow),
    canton_code: row.canton_code ?? "",
    cover_image_url: row.cover_image_url ?? null,
    image_urls: parseImagesFromDatabase(row.images, row.cover_image_url),
    status: (row.status ?? "draft") as ListingDetail["status"],
    created_at: row.created_at ?? "",
    expires_at: row.expires_at ?? null,
    duration_days: row.duration_days ?? null,
    price_plan: (row.price_plan ?? null) as ListingDetail["price_plan"],
    premium_until: row.premium_until ?? null,

    seller_type: row.seller_type ?? null,
    seller_name: null,
    seller_avatar_url: null,
    garage_id: row.garage_id ?? null,
    garage_name: null,
    garage_logo_url: null,
  };
}

// ---------------------------------------------------------------------------
// Public inventory engine.
//
// Stage 1 reads light columns for every published, unexpired listing that
// matches the plain column filters (brand, year, canton, …) and resolves each
// row's Kaufart in code. Kaufart, monthly rate, Kaution and effective months are
// filtered, sorted and paginated on those resolved offers, so counts, filters
// and badges can never disagree. Stage 2 loads the full rows of the page that
// is shown. The inventory is small (dozens of rows; PostgREST caps a response
// at 1000), so stage 1 is one cheap sequential scan.
// ---------------------------------------------------------------------------

const OFFER_COLUMNS =
  "id, brand, model, variant, year, price_per_month_chf, purchase_price_chf, remaining_months, deposit_chf, " +
  "leasing_offer, deal_type, financing_type, mileage_km, premium, created_at, updated_at, garage_id";

type OfferRow = {
  id: string;
  brand: string | null;
  model: string | null;
  variant: string | null;
  year: number | null;
  price_per_month_chf: number | null;
  purchase_price_chf: number | null;
  remaining_months: number | null;
  deposit_chf: number | null;
  leasing_offer: unknown;
  deal_type: string | null;
  financing_type: string | null;
  mileage_km: number | null;
  premium: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  garage_id: string | null;
  contract_end_date?: string | null;
};

/** A published listing with its resolved Kaufart and effective values. */
export type PublicOffer = OfferRow & { offer: ResolvedOffer };

// listings_public gains contract_end_date with migration 20261008090000. Until
// that migration is applied the column does not exist (PostgreSQL 42703), so
// the read retries without it and months fall back to the stored value — the
// site works before and after the migration. Safe to drop once it is live.
let contractEndColumnMissingAt: number | null = null;
const CONTRACT_END_RECHECK_MS = 5 * 60 * 1000;

function isMissingContractEndColumn(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === "42703" || /contract_end_date/.test(error.message ?? "");
}

async function selectOfferRows(scope: (query: any) => any): Promise<OfferRow[]> {
  const run = (columns: string) =>
    scope(supabase.from(PUBLIC_LISTINGS_VIEW).select(columns).eq("status", "published")) as PromiseLike<{
      data: unknown;
      error: { code?: string; message?: string } | null;
    }>;

  const tryContractEnd =
    contractEndColumnMissingAt === null || Date.now() - contractEndColumnMissingAt > CONTRACT_END_RECHECK_MS;

  if (tryContractEnd) {
    const { data, error } = await run(`${OFFER_COLUMNS}, contract_end_date`);
    if (!error) {
      contractEndColumnMissingAt = null;
      return (Array.isArray(data) ? data : []) as OfferRow[];
    }
    if (!isMissingContractEndColumn(error)) throw error;
    contractEndColumnMissingAt = Date.now();
  }

  const { data, error } = await run(OFFER_COLUMNS);
  if (error) throw error;
  return (Array.isArray(data) ? data : []) as OfferRow[];
}

function resolveOffers(rows: OfferRow[], now: Date): PublicOffer[] {
  return rows.map((row) => ({ ...row, offer: resolveListingOffer(row, now) }));
}

/** Plain column filters PostgREST can apply before the Kaufart stage. */
function applyColumnFilters(query: any, q: SearchQuery, garageId?: string): any {
  let next = query;
  if (garageId) next = next.eq("garage_id", garageId);

  // Free-text keyword (e.g. Google sitelinks searchbox `?query=bmw`): match across brand + model.
  if (q.query) {
    const term = q.query.trim().replace(/[%,()\\*]/g, " ").trim();
    if (term) next = next.or(`brand.ilike.%${term}%,model.ilike.%${term}%`);
  }

  if (q.brands?.length) next = next.in("brand", q.brands);
  else if (q.brand) next = next.eq("brand", q.brand);
  if (q.model) next = next.ilike("model", `%${q.model}%`);
  if (q.variant) next = next.eq("variant", q.variant);
  if (q.yearMin) next = next.gte("year", q.yearMin);
  if (q.yearMax) next = next.lte("year", q.yearMax);
  if (typeof q.kmMax === "number") next = next.lte("mileage_km", q.kmMax);
  if (q.canton?.length) next = next.in("canton_code", q.canton);
  if (q.fuel?.length) next = next.in("fuel", q.fuel);
  if (q.gearbox?.length) next = next.in("gearbox", q.gearbox);
  if (q.body?.length) next = next.in("body", q.body);
  if (q.premiumOnly) next = next.eq("premium", true);
  return next;
}

type KaufartScope = {
  bucket: "lease_takeover" | "direct_purchase" | "monthly" | "all";
  financingType?: "cash" | "leasing";
  priceMode: "monthly" | "purchase" | "none";
};

/** URL params -> which Kaufart bucket a query asks for (URL contract unchanged). */
function kaufartScopeFor(q: SearchQuery): KaufartScope {
  if (q.monthlyOnly === true) return { bucket: "monthly", priceMode: "monthly" };

  const hasMonthsFilter = typeof q.monthsMin === "number" || typeof q.monthsMax === "number";
  const dealType = q.dealType ?? (hasMonthsFilter ? "lease_takeover" : q.financingType ? "direct_purchase" : undefined);

  if (dealType === "lease_takeover") return { bucket: "lease_takeover", priceMode: "monthly" };
  if (dealType === "direct_purchase") {
    return { bucket: "direct_purchase", financingType: q.financingType, priceMode: "purchase" };
  }
  return { bucket: "all", priceMode: "none" };
}

function inKaufartScope(o: PublicOffer, scope: KaufartScope): boolean {
  // A Leasingübernahme whose contract has run out is no live offer anywhere.
  if (!o.offer.isLiveOffer) return false;

  switch (scope.bucket) {
    case "all":
      return true;
    case "lease_takeover":
      return o.offer.kaufart === "lease_takeover";
    case "monthly":
      return o.offer.kaufart === "lease_takeover" || hasNewLeasingFinancing(o);
    case "direct_purchase":
      if (o.offer.kaufart !== "direct_purchase") return false;
      if (scope.financingType === "leasing") return hasNewLeasingFinancing(o);
      if (scope.financingType === "cash") return o.financing_type === "cash" || o.financing_type === null;
      return true;
  }
}

function priceOf(o: PublicOffer, mode: KaufartScope["priceMode"]): number | null {
  if (mode === "monthly") return o.offer.rateChf;
  if (mode === "purchase") {
    const v = o.purchase_price_chf;
    return typeof v === "number" && v > 0 ? v : null;
  }
  return null;
}

function timeOf(value: string | null): number {
  const t = value ? Date.parse(value) : NaN;
  return Number.isNaN(t) ? 0 : t;
}

function compareOffers(sort: SearchQuery["sort"], scope: KaufartScope): (a: PublicOffer, b: PublicOffer) => number {
  const newestFirst = (a: PublicOffer, b: PublicOffer) => timeOf(b.created_at) - timeOf(a.created_at) || a.id.localeCompare(b.id);
  const nullsLast = (x: number | null, y: number | null, dir: 1 | -1) => {
    if (x === null && y === null) return 0;
    if (x === null) return 1;
    if (y === null) return -1;
    return (x - y) * dir;
  };

  const isTakeover = scope.bucket === "lease_takeover";

  if (scope.priceMode !== "none" && (sort === "priceAsc" || sort === "priceDesc")) {
    const dir = sort === "priceAsc" ? 1 : -1;
    return (a, b) => nullsLast(priceOf(a, scope.priceMode), priceOf(b, scope.priceMode), dir) || newestFirst(a, b);
  }
  if (sort === "dateDesc") return newestFirst;
  if (sort === "yearDesc") return (a, b) => (b.year ?? 0) - (a.year ?? 0) || newestFirst(a, b);
  if (isTakeover && (sort === "monthsAsc" || sort === "monthsDesc")) {
    const dir = sort === "monthsAsc" ? 1 : -1;
    return (a, b) => nullsLast(a.offer.months, b.offer.months, dir) || newestFirst(a, b);
  }
  if (sort === "kmAsc") return (a, b) => (a.mileage_km ?? 0) - (b.mileage_km ?? 0) || newestFirst(a, b);
  return (a, b) => Number(Boolean(b.premium)) - Number(Boolean(a.premium)) || newestFirst(a, b);
}

/** Kaufart, price, months and Kaution filters on resolved offers. */
function filterOffers(offers: PublicOffer[], q: SearchQuery, scope: KaufartScope): PublicOffer[] {
  return offers.filter((o) => {
    if (!inKaufartScope(o, scope)) return false;

    if (scope.priceMode !== "none" && (typeof q.priceMin === "number" || typeof q.priceMax === "number")) {
      const price = priceOf(o, scope.priceMode);
      if (price === null) return false;
      if (typeof q.priceMin === "number" && price < q.priceMin) return false;
      if (typeof q.priceMax === "number" && price > q.priceMax) return false;
    }

    if (scope.bucket === "lease_takeover" && (typeof q.monthsMin === "number" || typeof q.monthsMax === "number")) {
      const months = o.offer.months;
      if (months === null) return false;
      if (typeof q.monthsMin === "number" && months < q.monthsMin) return false;
      if (typeof q.monthsMax === "number" && months > q.monthsMax) return false;
    }

    if (q.noDeposit && o.offer.kaufart === "lease_takeover" && (o.offer.kautionChf ?? 0) > 0) return false;

    return true;
  });
}

/** Full rows for the given ids, in the given order, enriched with seller/garage data. */
async function loadListingsByIds(ids: string[], now: Date): Promise<Listing[]> {
  if (ids.length === 0) return [];

  const { data, error } = await supabase.from(PUBLIC_LISTINGS_VIEW).select("*").in("id", ids).eq("status", "published");
  if (error) throw error;

  const byId = new Map<string, PublicListingRow>();
  for (const row of (Array.isArray(data) ? data : []) as unknown as PublicListingRow[]) {
    if (row?.id) byId.set(String(row.id), row);
  }

  const rows = ids.map((id) => byId.get(id)).filter((r): r is PublicListingRow => Boolean(r));
  return enrichPublicListings(rows, now);
}

/** Garage name/logo for garage rows; abbreviated owner name + avatar for private rows. */
async function enrichPublicListings(rows: PublicListingRow[], now: Date): Promise<Listing[]> {
  const garageIds = rows
    .map((r) => getGarageIdFromRow(r))
    .filter((v): v is string => typeof v === "string" && v.length > 0);

  const privateListingIds = rows
    .filter((r) => !isGarageSellerFromRow(r))
    .map((r) => getListingIdFromRow(r))
    .filter((v): v is string => typeof v === "string" && v.trim() !== "");

  const [publicGaragesById, ownerProfilesByListingId] = await Promise.all([
    fetchPublicGaragesByIds(garageIds),
    fetchPublicListingOwnerProfilesByListingIds(privateListingIds),
  ]);

  return rows.map((r) => {
    const listing = transformPublicRowToListing(r, now);

    const gId = getGarageIdFromRow(r);
    if (gId && publicGaragesById[gId]) {
      const g = publicGaragesById[gId];
      const resolvedLogo = resolveListingImagesPublicUrl(g.logo_url) ?? g.logo_url ?? null;
      return {
        ...listing,
        seller_name: publicSellerName({ sellerType: "garage", garageName: g.garage_name }) ?? listing.seller_name ?? null,
        garage_name: g.garage_name ?? listing.garage_name ?? null,
        garage_id: gId,
        garage_logo_url: resolvedLogo,
      };
    }

    if (!isGarageSellerFromRow(r)) {
      const p = ownerProfilesByListingId[listing.id];
      if (p) {
        return {
          ...listing,
          seller_name: publicSellerName({ sellerType: "private", fullName: p.fullName }) ?? listing.seller_name ?? null,
          seller_avatar_url: p.avatarUrl ?? listing.seller_avatar_url ?? null,
        };
      }
    }

    return listing;
  });
}

async function runOfferSearch(searchQuery: SearchQuery, garageId?: string): Promise<SearchResult> {
  const pageSize = searchQuery.pageSize && searchQuery.pageSize > 0 ? searchQuery.pageSize : 12;
  const page = searchQuery.page || 1;
  const now = new Date();

  const scope = kaufartScopeFor(searchQuery);
  const rows = await selectOfferRows((query) => applyColumnFilters(query, searchQuery, garageId));
  const matches = filterOffers(resolveOffers(rows, now), searchQuery, scope).sort(
    compareOffers(searchQuery.sort || (garageId ? "dateDesc" : "relevance"), scope)
  );

  const offset = (page - 1) * pageSize;
  const pageIds = matches.slice(offset, offset + pageSize).map((o) => o.id);
  const items = await loadListingsByIds(pageIds, now);

  return { items, total: matches.length, page, pageSize };
}

// PUBLIC FRONTEND FUNCTIONS (homepage, search, listing detail)

export async function getPublishedListingById(id: string): Promise<ListingDetail | null> {
  try {
    const { data, error } = await supabase
      .from(PUBLIC_LISTINGS_VIEW)
      .select("*")
      .eq("id", id)
      // The view contains published, unexpired listings only, so filtering for
      // 'sold' here never matched anything. A sold listing is intentionally not
      // publicly reachable; the detail page redirects for that case.
      .eq("status", "published")
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      console.error("Error fetching published listing by ID:", error);
      return null;
    }

    const base = transformPublicRowToListingDetail(data as unknown as PublicListingRow);

    if (!isGarageSellerFromRow(data)) {
      const missingName = !(typeof (base as any)?.seller_name === "string" && (base as any).seller_name.trim());
      const missingAvatar = !(typeof (base as any)?.seller_avatar_url === "string" && (base as any).seller_avatar_url.trim());

      if (missingName || missingAvatar) {
        const byListingId = await fetchPublicListingOwnerProfilesByListingIds([id]);
        const p = byListingId[id];
        if (p) {
          return {
            ...base,
            seller_name: publicSellerName({ sellerType: "private", fullName: p.fullName }) ?? (base as any).seller_name ?? null,
            seller_avatar_url: p.avatarUrl ?? (base as any).seller_avatar_url ?? null,
          };
        }
      }
    }

    return base;
  } catch (error) {
    console.error("Get published listing by ID error:", error);
    return null;
  }
}

export async function searchListings(searchQuery: SearchQuery): Promise<SearchResult> {
  try {
    return await runOfferSearch(searchQuery);
  } catch (error) {
    console.error("Search listings error:", error);
    return {
      items: [],
      total: 0,
      page: searchQuery.page || 1,
      pageSize: searchQuery.pageSize || 12,
    };
  }
}

/**
 * Same as searchListings, but a failed query throws instead of returning an empty
 * result. ISR pages use it so a Supabase hiccup during revalidation keeps the last
 * good page instead of caching an empty (noindex) one.
 */
export async function searchListingsOrThrow(searchQuery: SearchQuery): Promise<SearchResult> {
  return runOfferSearch(searchQuery);
}

export async function searchDealerListings(garageId: string, searchQuery: SearchQuery): Promise<SearchResult> {
  try {
    return await runOfferSearch(searchQuery, garageId);
  } catch (error) {
    console.error("Search dealer listings error:", { garageId, error });
    return {
      items: [],
      total: 0,
      page: searchQuery.page || 1,
      pageSize: searchQuery.pageSize || 12,
    };
  }
}

/**
 * Every published, unexpired listing with its resolved Kaufart — the basis for
 * counts, brand-page indexing, the sitemap and the live stats. Ended
 * Leasingübernahmen are included but flagged (offer.isLiveOffer === false).
 */
export async function getPublicOfferIndex(now: Date = new Date()): Promise<PublicOffer[]> {
  const rows = await selectOfferRows((query) => query);
  return resolveOffers(rows, now);
}

/** Live Leasingübernahme offers only (what the hub, brand pages and stats count). */
export function liveTakeovers(offers: PublicOffer[]): PublicOffer[] {
  return offers.filter((o) => o.offer.kaufart === "lease_takeover" && o.offer.isLiveOffer);
}

// Brands are static-ish data fetched on every mount of SearchBarV2/SearchForm/DynamicFilterBar.
// Cache in module scope (with inflight dedup) so repeat calls within a session don't refetch.
let cachedBrands: string[] | null = null;
let brandsInflight: Promise<string[]> | null = null;

export async function getBrands(): Promise<string[]> {
  if (cachedBrands) return cachedBrands;
  if (brandsInflight) return brandsInflight;

  brandsInflight = (async () => {
    try {
      const { data, error } = await supabase
        .from(PUBLIC_LISTINGS_VIEW)
        .select("brand");

      if (error) {
        console.error("Error fetching brands:", error);
        return [];
      }

      const brands = Array.from(
        new Set(
          (data ?? [])
            .map((r) => (r as { brand?: string | null }).brand)
            .filter((v): v is string => typeof v === "string" && v.trim() !== "")
        )
      ).sort((a, b) => a.localeCompare(b, "de-CH"));

      if (brands.length > 0) cachedBrands = brands;

      return brands;
    } catch (error) {
      console.error("Get brands error:", error);
      return [];
    } finally {
      brandsInflight = null;
    }
  })();

  return brandsInflight;
}

export async function getModelsForBrand(brand: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from(PUBLIC_LISTINGS_VIEW)
      .select("model")
      .eq("brand", brand);

    if (error) {
      console.error("Error fetching models for brand:", { brand, error });
      return [];
    }

    const models = Array.from(
      new Set(
        (data ?? [])
          .map((r) => (r as { model?: string | null }).model)
          .filter((v): v is string => typeof v === "string" && v.trim() !== "")
      )
    ).sort((a, b) => a.localeCompare(b, "de-CH"));

    return models;
  } catch (error) {
    console.error("Get models for brand error:", error);
    return [];
  }
}

// Variant options for the search dropdowns. Like getModelsForBrand this reads the
// live inventory (listings_public), not the catalog: the filter should only offer
// versions that at least one published listing actually has.
export async function getVariantsForBrandModel(brand: string, model: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from(PUBLIC_LISTINGS_VIEW)
      .select("variant")
      .eq("brand", brand)
      .ilike("model", `%${model}%`)
      .not("variant", "is", null);

    if (error) {
      console.error("Error fetching variants for brand/model:", { brand, model, error });
      return [];
    }

    const variants = Array.from(
      new Set(
        (data ?? [])
          .map((r) => (r as { variant?: string | null }).variant)
          .filter((v): v is string => typeof v === "string" && v.trim() !== "")
      )
    ).sort((a, b) => a.localeCompare(b, "de-CH"));

    return variants;
  } catch (error) {
    console.error("Get variants for brand/model error:", error);
    return [];
  }
}

export async function getSimilarListings(listing: ListingDetail, limit: number = 6): Promise<Listing[]> {
  try {
    const now = new Date();
    const kaufart = kaufartOf(listing);
    const offers = await getPublicOfferIndex(now);
    const ids = offers
      .filter((o) => o.id !== listing.id && o.offer.isLiveOffer && o.offer.kaufart === kaufart)
      .sort(compareOffers("relevance", { bucket: "all", priceMode: "none" }))
      .slice(0, limit)
      .map((o) => o.id);
    return await loadListingsByIds(ids, now);
  } catch (error) {
    console.error("Get similar listings error:", error);
    return [];
  }
}

export async function getUserListingById(id: string): Promise<ListingDetail | null> {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      return null;
    }

    const viewerId = userData.user.id;

    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching user listing by ID:", error);
      return null;
    }

    if (!data) {
      return null;
    }

    const createdBy = (data as unknown as { created_by?: string | null }).created_by ?? null;
    const userId = (data as unknown as { user_id?: string | null }).user_id ?? null;
    const isOwner = createdBy === viewerId || userId === viewerId;

    // Prevent leaking preview-only data via the public_read_published policy.
    if (!isOwner) {
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, avatar_url, show_name_publicly")
      .eq("id", viewerId)
      .maybeSingle();

    if (profileError) {
      console.error("Error fetching profile for preview listing:", profileError);
    }

    // Preview must match the public display: an anonymous seller sees
    // "Privatanbieter" on their own listing too.
    const hideName = profile?.show_name_publicly === false;

    const meta = (userData.user.user_metadata ?? {}) as Record<string, unknown>;
    const metaFullName = typeof meta.full_name === "string" ? meta.full_name : null;
    const metaAvatarUrl = typeof meta.avatar_url === "string" ? meta.avatar_url : null;

    const seller_name = hideName
      ? null
      : publicSellerName({
          sellerType: (data as unknown as { seller_type?: string | null }).seller_type ?? "private",
          fullName:
            (typeof profile?.full_name === "string" && profile.full_name.trim() ? profile.full_name : null) ??
            (metaFullName && metaFullName.trim() ? metaFullName : null),
        });

    const seller_avatar_url = hideName
      ? null
      : (typeof profile?.avatar_url === "string" && profile.avatar_url.trim() ? profile.avatar_url : null) ??
        (metaAvatarUrl && metaAvatarUrl.trim() ? metaAvatarUrl : null) ??
        null;

    const listingDetail = transformListingsTableRowToListingDetail(data as ListingsTableRow);

    return {
      ...listingDetail,
      seller_name,
      seller_avatar_url,
    };
  } catch (error) {
    console.error("Get user listing by ID error:", error);
    return null;
  }
}

/**
 * Live inventory stats over the current Leasingübernahme listings (facts module).
 * Pages that print them revalidate hourly (getStaticProps revalidate: 3600).
 */
export async function getLiveInventoryStats(): Promise<InventoryStats> {
  const offers = await getPublicOfferIndex();
  return computeInventoryStats(liveTakeovers(offers).map((o) => o.offer));
}
