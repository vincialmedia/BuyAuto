
import { supabase } from "@/integrations/supabase/client";

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: 'private' | 'garage' | 'admin';
  created_at: string;
}

export interface GarageDetails {
  garage_name: string;
  city: string | null;
  contact_email: string | null;
}

export const userManagementService = {
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data as UserProfile;
  },

  async updateProfile(userId: string, updates: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
  
  /**
   * Atomically upgrades a user to 'garage' role and creates their garage profile.
   * Uses the 'upgrade_to_garage' database RPC function.
   */
  async upgradeToGarage(details: GarageDetails) {
    const { data, error } = await supabase.rpc('upgrade_to_garage', {
      garage_name: details.garage_name,
      city: details.city,
      contact_email: details.contact_email
    });

    if (error) throw error;
    
    // The RPC returns { success: boolean, error: string }
    // We check the returned JSON object
    if (data && (data as any).error) {
      throw new Error((data as any).error);
    }
    
    return data;
  }
};
