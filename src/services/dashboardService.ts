import { supabase } from "@/integrations/supabase/client";

export type DashboardListingStatus = "pending" | "published" | "rejected" | "expired";

export interface DashboardListing {
  id: string;
  brand: string;
  model: string;
  title?: string;
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

export async function getUserListings(): Promise<any[]> {
  try {
    // Step 1: Get the current authenticated user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.log("No user session found for dashboard.");
      return [];
    }

    // Step 2: Add an explicit .eq() filter to the query to ensure users only see their own listings
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching listings for current user:", error);
      return [];
    }

    return data || [];

  } catch (error) {
    console.error('Dashboard getUserListings unexpected error:', error);
    return [];
  }
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    // Get the user's listings using our secure API
    const listings = await getUserListings();

    const now = new Date();
    const stats = {
      active: 0,
      pending: 0,
      expired: 0,
      rejected: 0,
      total: listings.length
    };

    listings.forEach((listing) => {
      // Check if listing is expired based on expires_at date
      if (listing.expires_at && new Date(listing.expires_at) <= now) {
        stats.expired += 1;
      } else {
        switch (listing.status) {
          case 'published':
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

export async function deleteListing(listingId: string): Promise<boolean> {
  try {
    // RLS ensures users can only delete their own listings
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', listingId);

    if (error) {
      console.error('Delete listing error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete listing unexpected error:', error);
    return false;
  }
}

export async function upgradeToPremium(listingId: string): Promise<boolean> {
  try {
    // Set premium until 30 days from now
    const premiumUntil = new Date();
    premiumUntil.setDate(premiumUntil.getDate() + 30);

    // RLS ensures users can only update their own listings
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

export async function extendListing(listingId: string, days: number): Promise<boolean> {
  try {
    // Extend the expiry date by the specified number of days
    const newExpiryDate = new Date();
    newExpiryDate.setDate(newExpiryDate.getDate() + days);

    // RLS ensures users can only update their own listings
    const { error } = await supabase
      .from('listings')
      .update({
        expires_at: newExpiryDate.toISOString(),
        duration_days: days,
        status: 'published' // Reactivate if expired
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
