import { supabase } from "@/integrations/supabase/client";
import { SearchQuery, SearchResult } from "@/lib/buyauto/search";
import { Listing, ListingDetail, PricePlanId } from "@/lib/buyauto/types";
import type { Database } from "@/integrations/supabase/types";

type PublicListingRow = Database["public"]["Views"]["listings_public"]["Row"];
type ListingsTableRow = Database["public"]["Tables"]["listings"]["Row"];

const PUBLIC_LISTINGS_VIEW = "listings_public";

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

const BODY_VALUES = ["Limousine", "Kombi", "SUV", "Cabrio"] as const;
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
  const seller_name =
    joinedProfile?.full_name ??
    (row as unknown as { seller_name?: string | null }).seller_name ??
    null;
  const seller_avatar_url =
    joinedProfile?.avatar_url ??
    (row as unknown as { seller_avatar_url?: string | null }).seller_avatar_url ??
    null;
  const garage_name = (row as unknown as { garage_name?: string | null }).garage_name ?? null;

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

    seller_type: row.seller_type ?? null,
    seller_name,
    seller_avatar_url,
    garage_id: row.garage_id ?? null,
    garage_name,
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
  const seller_name =
    joinedProfile?.full_name ??
    (row as unknown as { seller_name?: string | null }).seller_name ??
    null;
  const seller_avatar_url =
    joinedProfile?.avatar_url ??
    (row as unknown as { seller_avatar_url?: string | null }).seller_avatar_url ??
    null;
  const garage_name = (row as unknown as { garage_name?: string | null }).garage_name ?? null;

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

    seller_type: row.seller_type ?? null,
    seller_name,
    seller_avatar_url,
    garage_id: row.garage_id ?? null,
    garage_name,
  };
}

export { transformPublicRowToListingDetail };

function transformListingsTableRowToListingDetail(row: ListingsTableRow): ListingDetail {
  const imageUrls = parseImagesFromDatabase(row.images, row.cover_image_url);

  const purchasePriceCHF = typeof row.purchase_price_chf === "number" ? row.purchase_price_chf : null;

  const leasing_offer =
    row.leasing_offer && typeof row.leasing_offer === "object" ? (row.leasing_offer as any) : null;

  return {
    id: row.id,
    ui_version: row.ui_version === "v2" ? "v2" : "v1",
    deal_type: (row.deal_type ?? "lease_takeover") as any,
    financing_type: (row.financing_type ?? null) as any,
    leasing_offer,
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
  };
}

// PUBLIC FRONTEND FUNCTIONS (homepage, search, listing detail)

export async function getPublishedListingById(id: string): Promise<ListingDetail | null> {
  try {
    const { data, error } = await supabase
      .from(PUBLIC_LISTINGS_VIEW)
      .select("*")
      .eq("id", id)
      .eq("status", "published")
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      console.error("Error fetching published listing by ID:", error);
      return null;
    }

    return transformPublicRowToListingDetail(data as unknown as PublicListingRow);
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

    const items = (data || []).map((r) => transformPublicRowToListing(r as unknown as PublicListingRow));

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

    const items = (data || []).map((r) => transformPublicRowToListing(r as unknown as PublicListingRow));

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

    return transformListingsTableRowToListingDetail(data as ListingsTableRow);
  } catch (error) {
    console.error("Get user listing by ID error:", error);
    return null;
  }
}
