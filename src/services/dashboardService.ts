
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
  rejected: number;
  expired: number;
  total: number;
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

async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const listings: ListingDetail[] = await getUserListings();

    const now = new Date();
    const stats: DashboardStats = {
      active: 0,
      pending: 0,
      expired: 0,
      rejected: 0,
      total: listings.length
    };

    listings.forEach((listing) => {
      if (listing.expires_at && new Date(listing.expires_at) <= now) {
        stats.expired += 1;
      } else {
        switch (listing.status) {
          case 'published':
          case 'active':
            stats.active += 1;
            break;
          case 'pending':
            stats.pending += 1;
            break;
          case 'rejected':
            stats.rejected += 1;
            break;
          case 'expired':
            stats.expired += 1;
            break;
        }
      }
    });

    return stats;

  } catch (error) {
    console.error('Dashboard stats unexpected error:', error);
    return { active: 0, pending: 0, expired: 0, rejected: 0, total: 0 };
  }
}

async function updateListing(listingId: string, updates: Partial<DashboardListing>): Promise<{ success: boolean; error: PostgrestError | null }> {
  try {
    const { error } = await supabase
      .from('listings')
      .update(updates)
      .eq('id', listingId);

    if (error) {
      console.error('Update listing error:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err) {
    const error = err as PostgrestError;
    console.error('Update listing unexpected error:', error);
    return { success: false, error };
  }
}


async function deleteListing(listingId: string): Promise<{ success: boolean; error: PostgrestError | null }> {
  try {
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', listingId);

    if (error) {
      console.error('Delete listing error:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err) {
    const error = err as PostgrestError;
    console.error('Delete listing unexpected error:', error);
    return { success: false, error };
  }
}

async function upgradeToPremium(listingId: string): Promise<boolean> {
  try {
    const premiumUntil = new Date();
    premiumUntil.setDate(premiumUntil.getDate() + 30);

    const { error } = await supabase
      .from('listings')
      .update({
        premium: true,
        is_premium: true,
        premium_until: premiumUntil.toISOString(),
        price_plan: 'premium30'
      })
      .eq('id', listingId);

    if (error) {
      console.error('Upgrade to premium error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Upgrade to premium unexpected error:', error);
    return false;
  }
}

async function extendListing(listingId: string, days: number): Promise<boolean> {
  try {
    const newExpiryDate = new Date();
    newExpiryDate.setDate(newExpiryDate.getDate() + days);

    const { error } = await supabase
      .from('listings')
      .update({
        expires_at: newExpiryDate.toISOString(),
        duration_days: days,
        status: 'published'
      })
      .eq('id', listingId);

    if (error) {
      console.error('Extend listing error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Extend listing unexpected error:', error);
    return false;
  }
}

export const dashboardService = {
  getUserListings,
  getDashboardStats,
  updateListing,
  deleteListing,
  upgradeToPremium,
  extendListing,
};
