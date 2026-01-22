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
}

export interface DashboardStats {
  active: number;
  pending: number;
  sold: number;
  expired: number;
}

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
    const { data: { user } } = await supabase.auth.getUser();

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
    }));

    return listings;

  } catch (error) {
    console.error("Dashboard getUserListings unexpected error:", error);
    return [];
  }
}

export const dashboardService = {
  getUserListings,
  async getDashboardStats(): Promise<DashboardStats> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("listings")
      .select("status")
      .or(`created_by.eq.${user.id},user_id.eq.${user.id}`);

    if (error) throw error;

    const stats = {
      active: 0,
      pending: 0,
      sold: 0,
      expired: 0,
    };

    data?.forEach((listing) => {
      if (listing.status === "active" || listing.status === "published") stats.active++;
      else if (listing.status === "pending") stats.pending++;
      else if (listing.status === "sold") stats.sold++;
      else if (listing.status === "expired") stats.expired++;
    });

    return stats;
  },
  updateListing,
  deleteListing,
  upgradeToPremium,
  extendListing,
};

async function updateListing(id: string, updates: any) {
  const { data, error } = await supabase
    .from('listings')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function deleteListing(id: string) {
  const { error } = await supabase
    .from('listings')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("Error deleting listing:", error);
    return { success: false, error };
  }
  return { success: true };
}

async function upgradeToPremium(id: string) {
  // Placeholder implementation - in production this would trigger a payment flow
  console.log("Upgrade to premium requested for", id);
  return { success: false, message: "Payment integration required" };
}

async function extendListing(id: string) {
  // Extend by 30 days
  const nextMonth = new Date();
  nextMonth.setDate(nextMonth.getDate() + 30);
  
  const { error } = await supabase
    .from('listings')
    .update({ 
      expires_at: nextMonth.toISOString(),
      status: 'active'
    })
    .eq('id', id);

  if (error) {
    console.error("Error extending listing:", error);
    return { success: false, error };
  }
  return { success: true };
}