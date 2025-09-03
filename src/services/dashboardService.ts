
import { supabase } from "@/integrations/supabase/client";

export interface DashboardListing {
  id: string;
  brand: string;
  model: string;
  year: number;
  price_per_month_chf: number;
  remaining_months: number;
  location: string;
  premium: boolean;
  is_premium: boolean;
  premium_until: string | null;
  expires_at: string | null;
  status: "pending" | "published" | "expired";
  created_at: string;
  duration_days: number | null;
  price_plan: string | null;
  cover_image_url: string | null;
  images: string[];
  cover_image_index: number;
}

export interface DashboardStats {
  active: number;
  pending: number;
  expired: number;
  total: number;
}

export const dashboardService = {
  async getUserListings(): Promise<DashboardListing[]> {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user listings:', error);
      throw error;
    }

    return data || [];
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const listings = await this.getUserListings();
    const now = new Date();

    const stats = listings.reduce((acc, listing) => {
      acc.total++;
      
      if (listing.status === 'pending') {
        acc.pending++;
      } else if (listing.status === 'published') {
        if (!listing.expires_at || new Date(listing.expires_at) > now) {
          acc.active++;
        } else {
          acc.expired++;
        }
      } else if (listing.status === 'expired') {
        acc.expired++;
      }

      return acc;
    }, { active: 0, pending: 0, expired: 0, total: 0 });

    return stats;
  },

  async deleteListing(listingId: string): Promise<void> {
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', listingId);

    if (error) {
      console.error('Error deleting listing:', error);
      throw error;
    }
  },

  async updateListingStatus(listingId: string, status: "pending" | "published" | "expired"): Promise<void> {
    const { error } = await supabase
      .from('listings')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', listingId);

    if (error) {
      console.error('Error updating listing status:', error);
      throw error;
    }
  },

  async upgradeToPremium(listingId: string): Promise<void> {
    const premiumUntil = new Date();
    premiumUntil.setDate(premiumUntil.getDate() + 30); // 30 days premium

    const { error } = await supabase
      .from('listings')
      .update({ 
        premium: true,
        is_premium: true,
        premium_until: premiumUntil.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', listingId);

    if (error) {
      console.error('Error upgrading listing to premium:', error);
      throw error;
    }
  },

  async extendListing(listingId: string, additionalDays: number = 90): Promise<void> {
    const { data: listing } = await supabase
      .from('listings')
      .select('expires_at, duration_days')
      .eq('id', listingId)
      .single();

    if (!listing) throw new Error('Listing not found');

    const currentExpiry = listing.expires_at ? new Date(listing.expires_at) : new Date();
    const newExpiry = new Date(currentExpiry);
    newExpiry.setDate(newExpiry.getDate() + additionalDays);

    const newDurationDays = (listing.duration_days || 30) + additionalDays;

    const { error } = await supabase
      .from('listings')
      .update({ 
        expires_at: newExpiry.toISOString(),
        duration_days: newDurationDays,
        status: 'published',
        updated_at: new Date().toISOString()
      })
      .eq('id', listingId);

    if (error) {
      console.error('Error extending listing:', error);
      throw error;
    }
  }
};

export default dashboardService;
