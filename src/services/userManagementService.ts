import { supabase } from "@/integrations/supabase/client";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
  updated_at: string | null;
}

export interface UserWithStats extends UserProfile {
  listings_count: number;
  active_listings: number;
  pending_listings: number;
}

export interface UserFilters {
  search?: string;
  role?: 'admin' | 'user' | 'all';
  page?: number;
  limit?: number;
}

export const userManagementService = {
  /**
   * Get all users with stats
   */
  async getUsers(filters: UserFilters = {}): Promise<{
    users: UserWithStats[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const {
      search,
      role = 'all',
      page = 1,
      limit = 25
    } = filters;

    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' });

    // Apply filters
    if (role !== 'all') {
      query = query.eq('role', role);
    }

    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: profiles, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    // Get listings count for each user
    const usersWithStats = await Promise.all(
      (profiles || []).map(async (profile) => {
        const { count: totalListings } = await supabase
          .from('listings')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profile.id);

        const { count: activeListings } = await supabase
          .from('listings')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profile.id)
          .eq('status', 'published');

        const { count: pendingListings } = await supabase
          .from('listings')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profile.id)
          .eq('status', 'pending');

        return {
          ...profile,
          listings_count: totalListings || 0,
          active_listings: activeListings || 0,
          pending_listings: pendingListings || 0,
        };
      })
    );

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      users: usersWithStats,
      total,
      page,
      totalPages
    };
  },

  /**
   * Get user details including their listings
   */
  async getUserDetails(userId: string): Promise<{
    profile: UserProfile;
    listings: any[];
  }> {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    const { data: listings, error: listingsError } = await supabase
      .from('listings')
      .select('id, brand, model, status, created_at, price_paid_chf')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (listingsError) throw listingsError;

    return {
      profile: profile as UserProfile,
      listings: listings || []
    };
  },

  /**
   * Delete user account (cascade to listings via DB constraint)
   */
  async deleteUser(userId: string): Promise<void> {
    // First delete all user's listings
    const { error: listingsError } = await supabase
      .from('listings')
      .delete()
      .eq('user_id', userId);

    if (listingsError) throw listingsError;

    // Then delete the profile
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) throw profileError;

    // Delete from auth.users using admin API
    // Note: This requires admin privileges and proper RLS policies
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    
    if (authError) {
      console.error('Failed to delete auth user:', authError);
      throw new Error('Failed to delete user from authentication system');
    }
  },

  /**
   * Send password reset email
   */
  async resetUserPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?mode=reset`,
    });

    if (error) throw error;
  },

  /**
   * Update user role (admin/user)
   */
  async updateUserRole(userId: string, role: 'admin' | 'user'): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId);

    if (error) throw error;
  },

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<{
    total: number;
    admins: number;
    users: number;
  }> {
    const { data, error } = await supabase
      .from('profiles')
      .select('role');

    if (error) throw error;

    const stats = (data || []).reduce((acc: any, profile: any) => {
      acc.total++;
      if (profile.role === 'admin') {
        acc.admins++;
      } else {
        acc.users++;
      }
      return acc;
    }, { total: 0, admins: 0, users: 0 });

    return stats;
  }
};
