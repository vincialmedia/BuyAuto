import { supabase } from "@/integrations/supabase/client";
import { SearchQuery, SearchResult } from "@/lib/buyauto/search";
import { Listing, ListingDetail, PricePlanId } from "@/lib/buyauto/types";
import type { Database } from "@/integrations/supabase/types";

type PublicListingRow = Database["public"]["Views"]["listings_public"]["Row"];
type ListingsTableRow = Database["public"]["Tables"]["listings"]["Row"];

const PUBLIC_LISTINGS_VIEW = "listings_public";

type PublicProfileRow = { id: string; full_name: string | null; avatar_url: string | null };

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

async function getPublicProfilesByIds(
  userIds: string[]
): Promise<Record<string, { fullName: string | null; avatarUrl: string | null }>> {
  const unique = Array.from(new Set(userIds.filter((v) => typeof v === "string" && v.trim() !== "")));
  if (unique.length === 0) return {};

  const { data, error } = await supabase.rpc("get_public_profiles", { p_user_ids: unique });

  if (error) {
    console.error("Error fetching public profiles:", { error, count: unique.length });
    return {};
  }

  const rows = (Array.isArray(data) ? data : []) as unknown as PublicProfileRow[];
  const map: Record<string, { fullName: string | null; avatarUrl: string | null }> = {};

  for (const r of rows) {
    const id = typeof (r as any)?.id === "string" ? (r as any).id : String((r as any)?.id ?? "");
    if (!id) continue;

    map[id] = {
      fullName: typeof (r as any)?.full_name === "string" ? (r as any).full_name : null,
      avatarUrl: typeof (r as any)?.avatar_url === "string" ? (r as any).avatar_url : null,
    };
  }

  return map;
}

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

function getOwnerUserIdFromPublicRow(row: unknown): string | null {
  const r = row as Record<string, unknown>;

  const candidates: unknown[] = [
    r.user_id,
    r.created_by,
    (r as any)?.seller_user_id,
    (r as any)?.sellerUserId,
    (r as any)?.owner_user_id,
    (r as any)?.ownerUserId,
    (r as any)?.seller_user?.id,
    (r as any)?.sellerUser?.id,
  ];

  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c;
  }

  return null;
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
 * Normalize enum-ish string fields coming from DB views (typed as string)
 */
const FUEL_VALUES = ["Benzin", "Diesel", "Hybrid", "Elektro"] as const;
type FuelValue = (typeof FUEL_VALUES)[number];

const GEARBOX_VALUES = ["Automatik", "Manuell"] as const;
type GearboxValue = (typeof GEARBOX_VALUES)[number];

const BODY_VALUES = ["Limousine", "Kombi", "SUV", "Cabrio", "Coupe"] as const;
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

// Transform public listing row to UI Listing format
function transformPublicRowToListing(row: PublicListingRow): Listing {
  const imageUrls = parseImagesFromDatabase(row.images, row.cover_image_url);

  const purchasePriceCandidate =
    (row as unknown as { purchase_price_chf?: unknown; price_chf?: unknown; price_paid_chf?: unknown })
      .purchase_price_chf ??
    (row as unknown as { purchase_price_chf?: unknown; price_chf?: unknown; price_paid_chf?: unknown }).price_chf ??
    (row as unknown as { purchase_price_chf?: unknown; price_chf?: unknown; price_paid_chf?: unknown }).price_paid_chf ??
    null;

  const purchasePriceCHF = typeof purchasePriceCandidate === "number" ? purchasePriceCandidate : null;

  const leasingOfferCandidate =
    (row as unknown as { leasing_offer?: unknown; leasingOffer?: unknown }).leasing_offer ??
    (row as unknown as { leasing_offer?: unknown; leasingOffer?: unknown }).leasingOffer ??
    null;

  const leasing_offer =
    leasingOfferCandidate && typeof leasingOfferCandidate === "object" ? (leasingOfferCandidate as any) : null;

  const joinedProfile = (row as unknown as { profiles?: { full_name?: string | null; avatar_url?: string | null } | null }).profiles ?? null;

  const sellerNameCandidate =
    joinedProfile?.full_name ??
    (row as unknown as { seller_name?: string | null }).seller_name ??
    null;

  const sellerAvatarCandidate =
    joinedProfile?.avatar_url ??
    (row as unknown as { seller_avatar_url?: string | null }).seller_avatar_url ??
    null;

  const seller_name = getNonEmptyString(sellerNameCandidate);
  const seller_avatar_url = getNonEmptyString(sellerAvatarCandidate);

  const seller_type = getSellerTypeFromRow(row);
  const garage_id = getGarageIdFromRow(row);
  const garage_name = getGarageNameFromRow(row);

  const effectiveSellerName = seller_name ?? (seller_type === "garage" ? garage_name : null);

  return {
    id: String(row.id ?? ""),
    ui_version: row.ui_version === "v2" ? "v2" : "v1",
    deal_type: row.deal_type ?? "lease_takeover",
    financing_type: row.financing_type ?? null,
    leasing_offer,
    brand: row.brand ?? "",
    model: row.model ?? "",
    title: row.title || undefined,
    description: row.description || undefined,
    year: row.year ?? 0,
    pricePerMonthCHF: row.price_per_month_chf ?? 0,
    remainingMonths: row.remaining_months ?? 0,
    remaining_km: row.remaining_km ?? null,
    location: row.location ?? "",
    mileageKm: row.mileage_km ?? 0,
    fuel: normalizeFuel(row.fuel),
    gearbox: normalizeGearbox(row.gearbox),
    body: normalizeBody(row.body),
    premium: row.premium ?? false,
    depositCHF: row.deposit_chf ?? null,
    images: imageUrls,
    imageUrl: imageUrls[0] || "",
    purchasePriceCHF,

    vin: row.vin ?? null,
    makeId: row.make_id ?? null,
    modelId: row.model_id ?? null,
    variantId: row.variant_id ?? null,
    powerHp: row.power_hp ?? null,
    drivetrain: row.drivetrain ?? null,
    firstRegistration: row.first_registration ?? null,

    seller_type,
    seller_name: effectiveSellerName,
    seller_avatar_url,
    garage_id,
    garage_name,
    garage_logo_url: null,
  };
}

// Transform public listing row to detailed format
function transformPublicRowToListingDetail(row: PublicListingRow): ListingDetail {
  const imageUrls = parseImagesFromDatabase(row.images, row.cover_image_url);

  const purchasePriceCandidate =
    (row as unknown as { purchase_price_chf?: unknown; price_chf?: unknown; price_paid_chf?: unknown })
      .purchase_price_chf ??
    (row as unknown as { purchase_price_chf?: unknown; price_chf?: unknown; price_paid_chf?: unknown }).price_chf ??
    (row as unknown as { purchase_price_chf?: unknown; price_chf?: unknown; price_paid_chf?: unknown }).price_paid_chf ??
    null;

  const purchasePriceCHF = typeof purchasePriceCandidate === "number" ? purchasePriceCandidate : null;

  const leasingOfferCandidate =
    (row as unknown as { leasing_offer?: unknown; leasingOffer?: unknown }).leasing_offer ??
    (row as unknown as { leasing_offer?: unknown; leasingOffer?: unknown }).leasingOffer ??
    null;

  const leasing_offer =
    leasingOfferCandidate && typeof leasingOfferCandidate === "object" ? (leasingOfferCandidate as any) : null;

  const joinedProfile = (row as unknown as { profiles?: { full_name?: string | null; avatar_url?: string | null } | null }).profiles ?? null;

  const sellerNameCandidate =
    joinedProfile?.full_name ??
    (row as unknown as { seller_name?: string | null }).seller_name ??
    null;

  const sellerAvatarCandidate =
    joinedProfile?.avatar_url ??
    (row as unknown as { seller_avatar_url?: string | null }).seller_avatar_url ??
    null;

  const seller_name = getNonEmptyString(sellerNameCandidate);
  const seller_avatar_url = getNonEmptyString(sellerAvatarCandidate);

  const seller_type = getSellerTypeFromRow(row);
  const garage_id = getGarageIdFromRow(row);
  const garage_name = getGarageNameFromRow(row);

  const effectiveSellerName = seller_name ?? (seller_type === "garage" ? garage_name : null);

  return {
    id: String(row.id ?? ""),
    ui_version: row.ui_version === "v2" ? "v2" : "v1",
    deal_type: row.deal_type ?? "lease_takeover",
    financing_type: row.financing_type ?? null,
    leasing_offer,
    brand: row.brand ?? "",
    model: row.model ?? "",
    title: row.title || undefined,
    description: row.description || undefined,
    year: row.year ?? 0,
    pricePerMonthCHF: row.price_per_month_chf ?? 0,
    remainingMonths: row.remaining_months ?? 0,
    remaining_km: row.remaining_km ?? null,
    location: row.location ?? "",
    mileageKm: row.mileage_km ?? 0,
    fuel: normalizeFuel(row.fuel),
    gearbox: normalizeGearbox(row.gearbox),
    body: normalizeBody(row.body),
    premium: row.premium ?? false,
    depositCHF: row.deposit_chf ?? null,
    images: imageUrls,
    imageUrl: imageUrls[0] || "",
    purchasePriceCHF,
    canton_code: row.canton_code ?? "",
    cover_image_url: row.cover_image_url ?? null,
    image_urls: imageUrls,
    status: (row.status ?? "draft") as ListingDetail["status"],
    created_at: row.created_at ?? "",
    expires_at: row.expires_at ?? null,
    duration_days: row.duration_days ?? null,
    price_plan: (row.price_plan ?? null) as ListingDetail["price_plan"],
    premium_until: row.premium_until ?? null,

    vin: row.vin ?? null,
    makeId: row.make_id ?? null,
    modelId: row.model_id ?? null,
    variantId: row.variant_id ?? null,
    powerHp: row.power_hp ?? null,
    drivetrain: row.drivetrain ?? null,
    firstRegistration: row.first_registration ?? null,

    seller_type,
    seller_name: effectiveSellerName,
    seller_avatar_url,
    garage_id,
    garage_name,
    garage_logo_url: null,
  };
}

export { transformPublicRowToListingDetail };

function transformListingsTableRowToListingDetail(row: ListingsTableRow): ListingDetail {
  const imageUrls = parseImagesFromDatabase(row.images, row.cover_image_url);

  const purchasePriceCHF = typeof row.purchase_price_chf === "number" ? row.purchase_price_chf : null;

  const leasingOffer =
    row.leasing_offer && typeof row.leasing_offer === "object" ? (row.leasing_offer as any) : null;

  return {
    id: row.id,
    ui_version: row.ui_version === "v2" ? "v2" : "v1",
    deal_type: (row.deal_type ?? "lease_takeover") as any,
    financing_type: (row.financing_type ?? null) as any,
    leasing_offer: leasingOffer,
    brand: row.brand ?? "",
    model: row.model ?? "",
    title: row.title ?? undefined,
    description: row.description ?? undefined,
    year: row.year ?? 0,
    pricePerMonthCHF: row.price_per_month_chf ?? 0,
    remainingMonths: row.remaining_months ?? 0,
    remaining_km: row.remaining_km ?? null,
    location: row.location ?? "",
    mileageKm: row.mileage_km ?? 0,
    fuel: normalizeFuel(row.fuel),
    gearbox: normalizeGearbox(row.gearbox),
    body: normalizeBody(row.body),
    premium: row.premium ?? false,
    depositCHF: row.deposit_chf ?? null,
    images: imageUrls,
    imageUrl: imageUrls[0] || "",
    purchasePriceCHF,
    canton_code: row.canton_code ?? "",
    cover_image_url: row.cover_image_url ?? null,
    image_urls: imageUrls,
    status: (row.status ?? "draft") as ListingDetail["status"],
    created_at: row.created_at ?? "",
    expires_at: row.expires_at ?? null,
    duration_days: row.duration_days ?? null,
    price_plan: (row.price_plan ?? null) as ListingDetail["price_plan"],
    premium_until: row.premium_until ?? null,

    vin: row.vin ?? null,
    makeId: row.make_id ?? null,
    modelId: row.model_id ?? null,
    variantId: row.variant_id ?? null,
    powerHp: row.power_hp ?? null,
    drivetrain: row.drivetrain ?? null,
    firstRegistration: row.first_registration ?? null,

    seller_type: row.seller_type ?? null,
    seller_name: null,
    seller_avatar_url: null,
    garage_id: row.garage_id ?? null,
    garage_name: null,
    garage_logo_url: null,
  };
}

// PUBLIC FRONTEND FUNCTIONS (homepage, search, listing detail)

export async function getPublishedListingById(id: string): Promise<ListingDetail | null> {
  try {
    const { data, error } = await supabase
      .from(PUBLIC_LISTINGS_VIEW)
      .select("*")
      .eq("id", id)
      .in("status", ["published", "sold"])
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
            seller_name: p.fullName ?? (base as any).seller_name ?? null,
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
    const pageSize = 12;
    const page = searchQuery.page || 1;
    const offset = (page - 1) * pageSize;

    const monthlyOnly = searchQuery.monthlyOnly === true;

    const hasMonthsFilter = typeof searchQuery.monthsMin === "number" || typeof searchQuery.monthsMax === "number";
    const isLeasingOfferFilter = searchQuery.dealType === "direct_purchase" && searchQuery.financingType === "leasing";

    const inferredDealType: "lease_takeover" | "direct_purchase" | undefined =
      searchQuery.dealType ??
      (hasMonthsFilter ? "lease_takeover" : searchQuery.financingType ? "direct_purchase" : undefined);

    const effectiveDealType = inferredDealType;
    const isMixed = !monthlyOnly && !effectiveDealType;
    const isLeaseTakeover = effectiveDealType === "lease_takeover";
    const isDirectPurchase = effectiveDealType === "direct_purchase";

    const priceMode: "monthly" | "purchase" | "none" =
      monthlyOnly || isLeaseTakeover || isLeasingOfferFilter ? "monthly" : isDirectPurchase ? "purchase" : "none";

    const monthlyPriceColumn = "price_per_month_chf";
    const purchasePriceColumn = "purchase_price_chf";
    const priceColumn = priceMode === "monthly" ? monthlyPriceColumn : purchasePriceColumn;

    let query = supabase
      .from(PUBLIC_LISTINGS_VIEW)
      .select("*", { count: "exact" })
      .eq("status", "published");

    if (monthlyOnly) {
      query = query.or("deal_type.eq.lease_takeover,and(deal_type.eq.direct_purchase,financing_type.eq.leasing,leasing_offer->>enabled.eq.true)");
    } else if (effectiveDealType) {
      query = query.eq("deal_type", effectiveDealType);
    }

    if (!monthlyOnly && effectiveDealType === "direct_purchase") {
      if (searchQuery.financingType === "leasing") {
        query = query
          .eq("financing_type", "leasing")
          .contains("leasing_offer", { enabled: true });
      } else if (searchQuery.financingType === "cash") {
        query = query.or("financing_type.eq.cash,financing_type.is.null");
      }
    }

    if (searchQuery.brand) query = query.eq("brand", searchQuery.brand);
    if (searchQuery.model) query = query.ilike("model", `%${searchQuery.model}%`);
    if (searchQuery.yearMin) query = query.gte("year", searchQuery.yearMin);
    if (searchQuery.yearMax) query = query.lte("year", searchQuery.yearMax);

    if (priceMode !== "none") {
      if (typeof searchQuery.priceMin === "number") query = query.gte(priceColumn, searchQuery.priceMin);
      if (typeof searchQuery.priceMax === "number") query = query.lte(priceColumn, searchQuery.priceMax);
    }

    if (isLeaseTakeover) {
      if (typeof searchQuery.monthsMin === "number") query = query.gte("remaining_months", searchQuery.monthsMin);
      if (typeof searchQuery.monthsMax === "number") query = query.lte("remaining_months", searchQuery.monthsMax);
    }

    if (typeof searchQuery.kmMax === "number") query = query.lte("mileage_km", searchQuery.kmMax);
    if (searchQuery.canton?.length) query = query.in("canton_code", searchQuery.canton);
    if (searchQuery.fuel?.length) query = query.in("fuel", searchQuery.fuel);
    if (searchQuery.gearbox?.length) query = query.in("gearbox", searchQuery.gearbox);
    if (searchQuery.body?.length) query = query.in("body", searchQuery.body);
    if (searchQuery.premiumOnly) query = query.eq("premium", true);
    if (searchQuery.noDeposit) query = query.is("deposit_chf", null);

    const sortOrder = searchQuery.sort || "relevance";

    if (priceMode !== "none" && sortOrder === "priceAsc") query = query.order(priceColumn, { ascending: true, nullsFirst: false });
    else if (priceMode !== "none" && sortOrder === "priceDesc") query = query.order(priceColumn, { ascending: false, nullsFirst: false });
    else if (sortOrder === "dateDesc") query = query.order("created_at", { ascending: false });
    else if (sortOrder === "yearDesc") query = query.order("year", { ascending: false });
    else if (isLeaseTakeover && sortOrder === "monthsAsc") query = query.order("remaining_months", { ascending: true });
    else if (isLeaseTakeover && sortOrder === "monthsDesc") query = query.order("remaining_months", { ascending: false });
    else if (sortOrder === "kmAsc") query = query.order("mileage_km", { ascending: true });
    else query = query.order("premium", { ascending: false }).order("created_at", { ascending: false });

    query = query.range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("Search query error:", error);
      throw error;
    }

    const rows = (Array.isArray(data) ? data : []) as unknown as PublicListingRow[];

    const garageIds = rows
      .map((r) => (r as unknown as { garage_id?: string | null }).garage_id ?? null)
      .filter((v): v is string => typeof v === "string" && v.length > 0);

    const publicGaragesById = await fetchPublicGaragesByIds(garageIds);

    const privateRows = rows.filter((r) => !isGarageSellerFromRow(r));

    const privateListingIds = privateRows
      .map((r) => getListingIdFromRow(r))
      .filter((v): v is string => typeof v === "string" && v.trim() !== "");

    const ownerProfilesByListingId = await fetchPublicListingOwnerProfilesByListingIds(privateListingIds);

    const items = rows.map((r) => {
      const listing = transformPublicRowToListing(r as unknown as PublicListingRow);

      const gId = getGarageIdFromRow(r);
      if (gId && publicGaragesById[gId]) {
        const g = publicGaragesById[gId];
        const resolvedLogo = resolveListingImagesPublicUrl(g.logo_url) ?? g.logo_url ?? null;
        return {
          ...listing,
          seller_name: g.garage_name ?? listing.seller_name ?? null,
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
            seller_name: p.fullName ?? listing.seller_name ?? null,
            seller_avatar_url: p.avatarUrl ?? listing.seller_avatar_url ?? null,
          };
        }
      }

      return listing;
    });

    return {
      items,
      total: count || 0,
      page,
      pageSize,
    };
  } catch (error) {
    console.error("Search listings error:", error);
    return {
      items: [],
      total: 0,
      page: searchQuery.page || 1,
      pageSize: 12,
    };
  }
}

export async function searchDealerListings(garageId: string, searchQuery: SearchQuery): Promise<SearchResult> {
  try {
    const pageSize = 12;
    const page = searchQuery.page || 1;
    const offset = (page - 1) * pageSize;

    const monthlyOnly = searchQuery.monthlyOnly === true;

    const hasMonthsFilter = typeof searchQuery.monthsMin === "number" || typeof searchQuery.monthsMax === "number";
    const isLeasingOfferFilter = searchQuery.dealType === "direct_purchase" && searchQuery.financingType === "leasing";

    const inferredDealType: "lease_takeover" | "direct_purchase" | undefined =
      searchQuery.dealType ??
      (hasMonthsFilter ? "lease_takeover" : searchQuery.financingType ? "direct_purchase" : undefined);

    const effectiveDealType = inferredDealType;
    const isMixed = !monthlyOnly && !effectiveDealType;
    const isLeaseTakeover = effectiveDealType === "lease_takeover";
    const isDirectPurchase = effectiveDealType === "direct_purchase";

    const priceMode: "monthly" | "purchase" | "none" =
      monthlyOnly || isLeaseTakeover || isLeasingOfferFilter ? "monthly" : isDirectPurchase ? "purchase" : "none";

    const monthlyPriceColumn = "price_per_month_chf";
    const purchasePriceColumn = "purchase_price_chf";
    const priceColumn = priceMode === "monthly" ? monthlyPriceColumn : purchasePriceColumn;

    let query = supabase
      .from(PUBLIC_LISTINGS_VIEW)
      .select("*", { count: "exact" })
      .eq("garage_id", garageId)
      .eq("status", "published");

    if (monthlyOnly) {
      query = query.or("deal_type.eq.lease_takeover,and(deal_type.eq.direct_purchase,financing_type.eq.leasing,leasing_offer->>enabled.eq.true)");
    } else if (effectiveDealType) {
      query = query.eq("deal_type", effectiveDealType);
    }

    if (!monthlyOnly && effectiveDealType === "direct_purchase") {
      if (searchQuery.financingType === "leasing") {
        query = query
          .eq("financing_type", "leasing")
          .contains("leasing_offer", { enabled: true });
      } else if (searchQuery.financingType === "cash") {
        query = query.or("financing_type.eq.cash,financing_type.is.null");
      }
    }

    if (searchQuery.brand) query = query.eq("brand", searchQuery.brand);
    if (searchQuery.model) query = query.ilike("model", `%${searchQuery.model}%`);
    if (searchQuery.yearMin) query = query.gte("year", searchQuery.yearMin);
    if (searchQuery.yearMax) query = query.lte("year", searchQuery.yearMax);

    if (priceMode !== "none") {
      if (typeof searchQuery.priceMin === "number") query = query.gte(priceColumn, searchQuery.priceMin);
      if (typeof searchQuery.priceMax === "number") query = query.lte(priceColumn, searchQuery.priceMax);
    }

    if (isLeaseTakeover) {
      if (typeof searchQuery.monthsMin === "number") query = query.gte("remaining_months", searchQuery.monthsMin);
      if (typeof searchQuery.monthsMax === "number") query = query.lte("remaining_months", searchQuery.monthsMax);
    }

    if (typeof searchQuery.kmMax === "number") query = query.lte("mileage_km", searchQuery.kmMax);
    if (searchQuery.canton?.length) query = query.in("canton_code", searchQuery.canton);
    if (searchQuery.fuel?.length) query = query.in("fuel", searchQuery.fuel);
    if (searchQuery.gearbox?.length) query = query.in("gearbox", searchQuery.gearbox);
    if (searchQuery.body?.length) query = query.in("body", searchQuery.body);
    if (searchQuery.premiumOnly) query = query.eq("premium", true);
    if (searchQuery.noDeposit) query = query.is("deposit_chf", null);

    const sortOrder = searchQuery.sort || "dateDesc";

    if (priceMode !== "none" && sortOrder === "priceAsc") query = query.order(priceColumn, { ascending: true, nullsFirst: false });
    else if (priceMode !== "none" && sortOrder === "priceDesc") query = query.order(priceColumn, { ascending: false, nullsFirst: false });
    else if (sortOrder === "dateDesc") query = query.order("created_at", { ascending: false });
    else if (sortOrder === "yearDesc") query = query.order("year", { ascending: false });
    else if (isLeaseTakeover && sortOrder === "monthsAsc") query = query.order("remaining_months", { ascending: true });
    else if (isLeaseTakeover && sortOrder === "monthsDesc") query = query.order("remaining_months", { ascending: false });
    else if (sortOrder === "kmAsc") query = query.order("mileage_km", { ascending: true });
    else query = query.order("premium", { ascending: false }).order("created_at", { ascending: false });

    query = query.range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("Dealer search query error:", { garageId, error });
      throw error;
    }

    const rows = (Array.isArray(data) ? data : []) as unknown as PublicListingRow[];

    const garageIds = rows
      .map((r) => (r as unknown as { garage_id?: string | null }).garage_id ?? null)
      .filter((v): v is string => typeof v === "string" && v.length > 0);

    const publicGaragesById = await fetchPublicGaragesByIds(garageIds);

    const privateRows = rows.filter((r) => !isGarageSellerFromRow(r));
    const ownerIdByListingId: Record<string, string> = {};

    for (const r of privateRows) {
      const listingId = getListingIdFromRow(r);
      const ownerId = getOwnerUserIdFromPublicRow(r);
      if (listingId && ownerId) ownerIdByListingId[listingId] = ownerId;
    }

    const missingOwnerListingIds = privateRows
      .map((r) => getListingIdFromRow(r))
      .filter((v): v is string => typeof v === "string" && v.trim() !== "")
      .filter((listingId) => !ownerIdByListingId[listingId]);

    if (missingOwnerListingIds.length > 0) {
      const { data: ownerRows, error: ownerError } = await supabase
        .from("listings")
        .select("id, user_id, created_by, seller_type, status")
        .in("id", missingOwnerListingIds)
        .in("status", ["published", "sold"]);

      if (ownerError) {
        console.error("Owner fallback query error (dealer search):", { ownerError, count: missingOwnerListingIds.length });
      } else {
        const normalized = Array.isArray(ownerRows) ? ownerRows : [];
        for (const row of normalized) {
          const listingId = typeof (row as any)?.id === "string" ? (row as any).id : String((row as any)?.id ?? "");
          if (!listingId || ownerIdByListingId[listingId]) continue;

          const sellerType = (row as any)?.seller_type ?? null;
          if (sellerType === "garage") continue;

          const userId = (row as any)?.user_id ?? null;
          const createdBy = (row as any)?.created_by ?? null;

          const ownerId =
            (typeof userId === "string" && userId.trim() ? userId : null) ??
            (typeof createdBy === "string" && createdBy.trim() ? createdBy : null) ??
            null;

          if (ownerId) ownerIdByListingId[listingId] = ownerId;
        }
      }
    }

    const privateOwnerIds = Object.values(ownerIdByListingId).filter((v) => typeof v === "string" && v.trim() !== "");
    const profileMap = await getPublicProfilesByIds(privateOwnerIds);

    const ownerProfilesByListingId: Record<string, { fullName: string | null; avatarUrl: string | null }> = {};
    for (const [listingId, ownerId] of Object.entries(ownerIdByListingId)) {
      const p = profileMap[ownerId];
      if (!p) continue;
      ownerProfilesByListingId[listingId] = p;
    }

    const items = rows.map((r) => {
      const listing = transformPublicRowToListing(r as unknown as PublicListingRow);

      const gId = getGarageIdFromRow(r);
      if (gId && publicGaragesById[gId]) {
        const g = publicGaragesById[gId];
        const resolvedLogo = resolveListingImagesPublicUrl(g.logo_url) ?? g.logo_url ?? null;
        return {
          ...listing,
          seller_name: g.garage_name ?? listing.seller_name ?? null,
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
            seller_name: p.fullName ?? listing.seller_name ?? null,
            seller_avatar_url: p.avatarUrl ?? listing.seller_avatar_url ?? null,
          };
        }
      }

      return listing;
    });

    return {
      items,
      total: count || 0,
      page,
      pageSize,
    };
  } catch (error) {
    console.error("Search dealer listings error:", error);
    return {
      items: [],
      total: 0,
      page: searchQuery.page || 1,
      pageSize: 12,
    };
  }
}

export async function getBrands(): Promise<string[]> {
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

    return brands;
  } catch (error) {
    console.error("Get brands error:", error);
    return [];
  }
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

export async function getSimilarListings(listing: ListingDetail, limit: number = 6): Promise<Listing[]> {
  try {
    const dealType = (listing.deal_type ?? "lease_takeover") as "lease_takeover" | "direct_purchase";

    let query = supabase
      .from(PUBLIC_LISTINGS_VIEW)
      .select("*")
      .neq("id", listing.id)
      .eq("deal_type", dealType);

    query = query.eq("status", "published");

    const { data, error } = await query
      .order("premium", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching similar listings:", error);
      return [];
    }

    return (data ?? []).map((r) => transformPublicRowToListing(r as unknown as PublicListingRow));
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
      .select("full_name, avatar_url")
      .eq("id", viewerId)
      .maybeSingle();

    if (profileError) {
      console.error("Error fetching profile for preview listing:", profileError);
    }

    const meta = (userData.user.user_metadata ?? {}) as Record<string, unknown>;
    const metaFullName = typeof meta.full_name === "string" ? meta.full_name : null;
    const metaAvatarUrl = typeof meta.avatar_url === "string" ? meta.avatar_url : null;

    const seller_name =
      (typeof profile?.full_name === "string" && profile.full_name.trim() ? profile.full_name : null) ??
      (metaFullName && metaFullName.trim() ? metaFullName : null) ??
      null;

    const seller_avatar_url =
      (typeof profile?.avatar_url === "string" && profile.avatar_url.trim() ? profile.avatar_url : null) ??
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
