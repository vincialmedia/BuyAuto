import { supabase } from "@/integrations/supabase/client";
import { PostgrestError } from "@supabase/supabase-js";
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

async function getUserListings(): Promise<ListingDetail[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.log("No user session found for dashboard.");
      return [];
    }

    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching listings for current user:", error);
      return [];
    }

    if (!data) return [];

    // Map snake_case from DB to the camelCase ListingDetail type the component expects
    const listings: ListingDetail[] = data.map((dbListing: any) => ({
      ...dbListing,
      pricePerMonthCHF: dbListing.price_per_month_chf,
      remainingMonths: dbListing.remaining_months,
      mileageKm: dbListing.mileage_km,
      depositCHF: dbListing.deposit_chf,
      image_urls: dbListing.images || [],
      imageUrl: dbListing.cover_image_url || (Array.isArray(dbListing.images) && dbListing.images.length > 0 ? dbListing.images[dbListing.cover_image_index || 0] : ''),
    }));

    return listings;

  } catch (error) {
    console.error('Dashboard getUserListings unexpected error:', error);
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
      .eq("user_id", user.id);

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
