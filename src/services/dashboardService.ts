
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
  status: "pending" | "published" | "rejected" | "expired";
  created_at: string;
  duration_days: number | null;
  price_plan: string | null;
  cover_image_url: string | null;
  images: any;
  cover_image_index: number;
  moderation_note: string | null;
  created_by: string | null;
  user_id: string | null;
}

export interface DashboardStats {
  active: number;
  pending: number;
  rejected: number;
  expired: number;
  total: number;
}

export const dashboardService = {
  /**
   * Get listings for the current user only.
   * RLS policy "owner_select" ensures users can only see their own listings.
   */
  async getUserListings(): Promise<DashboardListing[]> {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          id, brand, model, year, price_per_month_chf, remaining_months,
          location, premium, is_premium, premium_until, expires_at,
          status, created_at, duration_days, price_plan, cover_image_url,
          images, cover_image_index, moderation_note, created_by, user_id
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user listings:', error);
        throw new Error('Failed to fetch your listings');
      }

      // RLS ensures this data only contains the current user's listings
      return data || [];
    } catch (error) {
      console.error('Get user listings error:', error);
      throw error;
    }
  },

  /**
   * Calculate dashboard statistics from user's own listings only.
   */
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const listings = await this.getUserListings();
      const now = new Date();

      const stats = listings.reduce((acc, listing) => {
        acc.total++;
        
        switch (listing.status) {
          case 'pending':
            acc.pending++;
            break;
          case 'published':
            // Check if listing has expired
            if (!listing.expires_at || new Date(listing.expires_at) > now) {
              acc.active++;
            } else {
              acc.expired++;
            }
            break;
          case 'rejected':
            acc.rejected++;
            break;
          case 'expired':
            acc.expired++;
            break;
        }

        return acc;
      }, { active: 0, pending: 0, rejected: 0, expired: 0, total: 0 });

      return stats;
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      throw error;
    }
  },

  /**
   * Delete a user's listing.
   * RLS policy "owner_delete" ensures users can only delete their own listings.
   */
  async deleteListing(listingId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingId);

      if (error) {
        console.error('Error deleting listing:', error);
        throw new Error('Failed to delete listing');
      }
    } catch (error) {
      console.error('Delete listing error:', error);
      throw error;
    }
  },

  /**
   * Update a user's listing status.
   * RLS policy "owner_update" ensures users can only update their own listings.
   */
  async updateListingStatus(listingId: string, status: "pending" | "published" | "rejected" | "expired"): Promise<void> {
    try {
      const { error } = await supabase
        .from('listings')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', listingId);

      if (error) {
        console.error('Error updating listing status:', error);
        throw new Error('Failed to update listing status');
      }
    } catch (error) {
      console.error('Update listing status error:', error);
      throw error;
    }
  },

  /**
   * Upgrade a user's listing to premium.
   * RLS policy "owner_update" ensures users can only upgrade their own listings.
   */
  async upgradeToPremium(listingId: string): Promise<void> {
    try {
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
        throw new Error('Failed to upgrade listing to premium');
      }
    } catch (error) {
      console.error('Upgrade to premium error:', error);
      throw error;
    }
  },

  /**
   * Extend a user's listing duration.
   * RLS policy "owner_update" ensures users can only extend their own listings.
   */
  async extendListing(listingId: string, additionalDays: number = 90): Promise<void> {
    try {
      // First get the current listing data (RLS ensures user can only access their own)
      const { data: listing, error: fetchError } = await supabase
        .from('listings')
        .select('expires_at, duration_days, status')
        .eq('id', listingId)
        .single();

      if (fetchError) {
        console.error('Error fetching listing for extension:', fetchError);
        throw new Error('Listing not found or access denied');
      }

      if (!listing) {
        throw new Error('Listing not found');
      }

      // Calculate new expiry date
      const currentExpiry = listing.expires_at ? new Date(listing.expires_at) : new Date();
      const newExpiry = new Date(currentExpiry);
      newExpiry.setDate(newExpiry.getDate() + additionalDays);

      const newDurationDays = (listing.duration_days || 30) + additionalDays;

      // Update the listing
      const { error } = await supabase
        .from('listings')
        .update({ 
          expires_at: newExpiry.toISOString(),
          duration_days: newDurationDays,
          status: listing.status === 'expired' ? 'published' : listing.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', listingId);

      if (error) {
        console.error('Error extending listing:', error);
        throw new Error('Failed to extend listing');
      }
    } catch (error) {
      console.error('Extend listing error:', error);
      throw error;
    }
  },

  /**
   * Get a specific listing by ID for the current user.
   * RLS policy "owner_select" ensures users can only access their own listings.
   */
  async getUserListingById(listingId: string): Promise<DashboardListing | null> {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          id, brand, model, year, price_per_month_chf, remaining_months,
          location, premium, is_premium, premium_until, expires_at,
          status, created_at, duration_days, price_plan, cover_image_url,
          images, cover_image_index, moderation_note, created_by, user_id
        `)
        .eq('id', listingId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - either doesn't exist or user doesn't own it
          return null;
        }
        console.error('Error fetching user listing by ID:', error);
        throw new Error('Failed to fetch listing');
      }

      return data;
    } catch (error) {
      console.error('Get user listing by ID error:', error);
      throw error;
    }
  },

  /**
   * Resubmit a rejected listing (change status from rejected to pending).
   * RLS policy "owner_update" ensures users can only resubmit their own listings.
   */
  async resubmitListing(listingId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('listings')
        .update({ 
          status: 'pending',
          moderation_note: null, // Clear previous moderation note
          updated_at: new Date().toISOString()
        })
        .eq('id', listingId)
        .eq('status', 'rejected'); // Only allow resubmission of rejected listings

      if (error) {
        console.error('Error resubmitting listing:', error);
        throw new Error('Failed to resubmit listing');
      }
    } catch (error) {
      console.error('Resubmit listing error:', error);
      throw error;
    }
  }
};

export default dashboardService;
