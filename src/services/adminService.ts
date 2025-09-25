import { supabase } from "@/integrations/supabase/client";
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';

export interface AdminListingFilters {
  status?: 'pending' | 'published' | 'rejected' | 'expired' | 'all';
  brand?: string;
  canton?: string;
  premium?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AdminListing {
  id: string;
  brand: string;
  model: string;
  title: string | null;
  year: number;
  price_paid_chf: number | null;
  location: string;
  canton_code: string;
  premium: boolean;
  premium_until: string | null;
  status: 'pending' | 'published' | 'rejected' | 'expired';
  moderation_note: string | null;
  created_at: string;
  created_by: string | null;
  user_id: string | null;
  expires_at: string | null;
  duration_days: number | null;
  price_plan: string;
  images: any[];
  cover_image_index: number;
  cover_image_url: string | null;
}

export interface AdminStats {
  total: number;
  pending: number;
  published: number;
  rejected: number;
  expired: number;
}

export const adminService = {
  /**
   * Get Supabase admin client with service role key for bypassing RLS
   */
  getSupabaseAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    return createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  },

  /**
   * Get admin statistics
   */
  async getStats(): Promise<AdminStats> {
    const { data, error } = await supabase
      .from('listings')
      .select('status');

    if (error) throw error;

    const stats = (data as any).reduce((acc: any, listing: any) => {
      acc.total++;
      acc[listing.status as keyof AdminStats]++;
      return acc;
    }, { total: 0, pending: 0, published: 0, rejected: 0, expired: 0 });

    return stats;
  },

  /**
   * Get listings for admin with filters and pagination
   */
  async getListings(filters: AdminListingFilters = {}): Promise<{
    listings: AdminListing[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const {
      status = 'all',
      brand,
      canton,
      premium,
      search,
      page = 1,
      limit = 25
    } = filters;

    let query = supabase
      .from('listings')
      .select('*', { count: 'exact' });

    // Apply filters
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (brand) {
      query = query.ilike('brand', `%${brand}%`);
    }

    if (canton) {
      query = query.eq('canton_code', canton);
    }

    if (premium !== undefined) {
      query = query.eq('premium', premium);
    }

    if (search) {
      query = query.or(`brand.ilike.%${search}%,model.ilike.%${search}%,location.ilike.%${search}%`);
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      listings: data as AdminListing[],
      total,
      page,
      totalPages
    };
  },

  /**
   * Get single listing details for admin
   */
  async getListingDetails(id: string): Promise<AdminListing> {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as AdminListing;
  },

  /**
   * Approve a listing
   */
  async approveListing(id: string, options: {
    activatePremium?: boolean;
    premiumDays?: number;
  } = {}): Promise<AdminListing> {
    const updates: any = {
      status: 'published',
      moderation_note: null
    };

    // Get the listing to check duration_days
    const { data: listing } = await supabase
      .from('listings')
      .select('duration_days')
      .eq('id', id)
      .single();

    // Set expires_at based on duration_days
    if (listing?.duration_days) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + listing.duration_days);
      updates.expires_at = expiresAt.toISOString();
    }

    // Handle premium activation
    if (options.activatePremium) {
      const premiumDays = options.premiumDays || 30;
      const premiumUntil = new Date();
      premiumUntil.setDate(premiumUntil.getDate() + premiumDays);
      
      updates.premium = true;
      updates.premium_until = premiumUntil.toISOString();
    }

    const { data, error } = await supabase
      .from('listings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as AdminListing;
  },

  /**
   * Reject a listing with reason and trigger refund
   */
  async rejectListing(id: string, reason: string): Promise<AdminListing> {
    const { data, error } = await supabase
      .from('listings')
      .update({
        status: 'rejected',
        moderation_note: reason
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Trigger refund after successful listing rejection
    try {
      const refundResponse = await fetch('/api/billing/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ listing_id: id })
      });

      if (!refundResponse.ok) {
        const refundError = await refundResponse.json();
        console.error(`Failed to process refund for listing ${id}:`, refundError);
        // Log error but don't throw - listing rejection was successful
        console.warn(`Manual refund may be required for listing ${id}. Error: ${refundError.error || 'Unknown error'}`);
      } else {
        console.log(`Refund successfully initiated for listing ${id}`);
      }
    } catch (refundError) {
      console.error(`Failed to process refund for listing ${id}:`, refundError);
      console.warn(`Manual refund may be required for listing ${id}. Please check manually.`);
    }

    return data as AdminListing;
  },

  /**
   * Update listing details (inline edit)
   */
  async updateListingDetails(id: string, updates: Partial<AdminListing>): Promise<AdminListing> {
    const { data, error } = await supabase
      .from('listings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as AdminListing;
  },

  /**
   * Toggle premium status
   */
  async togglePremium(id: string, isPremium: boolean, days?: number): Promise<AdminListing> {
    const updates: any = {
      premium: isPremium
    };

    if (isPremium && days) {
      const premiumUntil = new Date();
      premiumUntil.setDate(premiumUntil.getDate() + days);
      updates.premium_until = premiumUntil.toISOString();
    } else if (!isPremium) {
      updates.premium_until = null;
    }

    const { data, error } = await supabase
      .from('listings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as AdminListing;
  },

  /**
   * Extend listing expiry
   */
  async extendExpiry(id: string, days: number): Promise<AdminListing> {
    // Get current expires_at or use current date if null
    const { data: listing } = await supabase
      .from('listings')
      .select('expires_at')
      .eq('id', id)
      .single();

    const baseDate = listing?.expires_at ? new Date(listing.expires_at) : new Date();
    baseDate.setDate(baseDate.getDate() + days);

    const { data, error } = await supabase
      .from('listings')
      .update({ expires_at: baseDate.toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as AdminListing;
  },

  /**
   * Delete a listing
   */
  async deleteListing(id: string): Promise<void> {
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Bulk approve listings
   */
  async bulkApprove(ids: string[], options: {
    activatePremium?: boolean;
    premiumDays?: number;
  } = {}): Promise<void> {
    for (const id of ids) {
      await this.approveListing(id, options);
    }
  },

  /**
   * Bulk reject listings with refund processing
   */
  async bulkReject(ids: string[], reason: string): Promise<void> {
    // First, update all listing statuses to rejected
    const { error } = await supabase
      .from('listings')
      .update({
        status: 'rejected',
        moderation_note: reason
      })
      .in('id', ids);

    if (error) throw error;

    // Then, trigger refunds for each listing
    const refundPromises = ids.map(async (id) => {
      try {
        const refundResponse = await fetch('/api/billing/refund', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ listing_id: id })
        });

        if (!refundResponse.ok) {
          const refundError = await refundResponse.json();
          console.error(`Failed to process refund for listing ${id}:`, refundError);
          console.warn(`Manual refund may be required for listing ${id}. Error: ${refundError.error || 'Unknown error'}`);
        } else {
          console.log(`Refund successfully initiated for listing ${id}`);
        }
      } catch (refundError) {
        console.error(`Failed to process refund for listing ${id}:`, refundError);
        console.warn(`Manual refund may be required for listing ${id}. Please check manually.`);
      }
    });

    // Process all refunds in parallel but don't wait for completion
    // This prevents blocking the UI if some refunds are slow
    Promise.allSettled(refundPromises);
  }
};
