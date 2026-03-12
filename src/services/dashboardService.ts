import { supabase } from "@/integrations/supabase/client";
import { ListingDetail, ListingStatus } from "@/lib/buyauto/types";

export type DashboardListingStatus = ListingStatus;

export interface DashboardListing {
  id: string;
  brand: string;
  model: string;
  title?: string;
  description: string | null;
  year: number;
  price_per_month_chf: number;
  price_paid_chf: number | null;
  listing_price: number | null;
  remaining_months: number;
  location: string;
  canton_code: string;
  mileage_km: number;
  fuel: string;
  gearbox: string;
  body: string;
  premium: boolean;
  is_premium: boolean;
  premium_until: string | null;
  paused_at?: string | null;
  pause_until?: string | null;
  expires_at: string | null;
  status: DashboardListingStatus;
  created_at: string;
  updated_at?: string;
  duration_days: number | null;
  price_plan: string | null;
  cover_image_url: string | null;
  images: any;
  cover_image_index: number;
  moderation_note: string | null;
  created_by: string | null;
  user_id: string | null;
  deposit_chf: number | null;
  view_count: number;
  sold_at?: string | null;
  sold_delete_at?: string | null;
  status_before_sold?: ListingStatus | null;
}

export interface DashboardStats {
  active: number;
  pending: number;
  sold: number;
  expired: number;
  totalViews: number;
}

export type ListingTombstone = {
  id: string;
  original_listing_id: string;
  garage_id: string | null;
  seller_user_id: string | null;
  brand: string;
  model: string;
  year: number | null;
  location: string | null;
  deal_type: string | null;
  financing_type: string | null;
  price_per_month_chf: number | null;
  purchase_price_chf: number | null;
  cover_image_url: string | null;
  sold_at: string | null;
  deleted_at: string;
};

function normalizeDealFields<T extends { deal_type?: unknown; financing_type?: unknown }>(
  row: T
): { deal_type: "lease_takeover" | "direct_purchase"; financing_type: "cash" | "leasing" | null } {
  const dealType = row.deal_type === "direct_purchase" ? "direct_purchase" : "lease_takeover";
  const financingType =
    dealType === "direct_purchase" && (row.financing_type === "cash" || row.financing_type === "leasing")
      ? row.financing_type
      : null;
  return { deal_type: dealType, financing_type: financingType };
}

async function getUserListings(): Promise<ListingDetail[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log("No user session found for dashboard.");
      return [];
    }

    const { data: createdByData, error: createdByError } = await supabase
      .from("listings")
      .select("*")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false });

    if (createdByError) {
      console.error("Error fetching listings (created_by) for current user:", createdByError);
    }

    const { data: userIdData, error: userIdError } = await supabase
      .from("listings")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (userIdError) {
      console.error("Error fetching listings (user_id) for current user:", userIdError);
    }

    const combined = [
      ...(Array.isArray(createdByData) ? createdByData : []),
      ...(Array.isArray(userIdData) ? userIdData : []),
    ];

    const byId = new Map<string, any>();
    combined.forEach((row) => {
      if (row?.id) byId.set(row.id, row);
    });

    const merged = Array.from(byId.values()).sort((a, b) => {
      const aDate = a?.created_at ? new Date(a.created_at).getTime() : 0;
      const bDate = b?.created_at ? new Date(b.created_at).getTime() : 0;
      return bDate - aDate;
    });

    const listings: ListingDetail[] = merged.map((dbListing: any) => ({
      ...dbListing,
      pricePerMonthCHF: dbListing.price_per_month_chf,
      remainingMonths: dbListing.remaining_months,
      mileageKm: dbListing.mileage_km,
      depositCHF: dbListing.deposit_chf,
      image_urls: dbListing.images || [],
      imageUrl:
        dbListing.cover_image_url ||
        (Array.isArray(dbListing.images) && dbListing.images.length > 0
          ? dbListing.images[dbListing.cover_image_index || 0]
          : ""),
      view_count: dbListing.view_count || 0,
    }));

    return listings;
  } catch (error) {
    console.error("Dashboard getUserListings unexpected error:", error);
    return [];
  }
}

async function getListingTombstones(): Promise<ListingTombstone[]> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) return [];

  const { data: garage, error: garageError } = await supabase
    .from("garages")
    .select("id")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (garageError) throw garageError;
  if (!garage?.id) return [];

  const { data, error } = await supabase
    .from("listing_tombstones")
    .select("*")
    .eq("garage_id", garage.id)
    .order("deleted_at", { ascending: false });

  if (error) throw error;

  return (Array.isArray(data) ? data : []).map((r: any) => ({
    id: String(r.id),
    original_listing_id: String(r.original_listing_id),
    garage_id: r.garage_id ? String(r.garage_id) : null,
    seller_user_id: r.seller_user_id ? String(r.seller_user_id) : null,
    brand: String(r.brand ?? ""),
    model: String(r.model ?? ""),
    year: typeof r.year === "number" ? r.year : null,
    location: typeof r.location === "string" ? r.location : null,
    deal_type: typeof r.deal_type === "string" ? r.deal_type : null,
    financing_type: typeof r.financing_type === "string" ? r.financing_type : null,
    price_per_month_chf: typeof r.price_per_month_chf === "number" ? r.price_per_month_chf : null,
    purchase_price_chf: typeof r.purchase_price_chf === "number" ? r.purchase_price_chf : null,
    cover_image_url: typeof r.cover_image_url === "string" ? r.cover_image_url : null,
    sold_at: typeof r.sold_at === "string" ? r.sold_at : null,
    deleted_at: String(r.deleted_at),
  }));
}

export const dashboardService = {
  getUserListings,
  getListingTombstones,
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSoldLegacy(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailableLegacy(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingAvailable(listingId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
    if (error) throw error;
  },
  async markListingSold(listingId: string): Promise<void> {
    const