
import { supabase } from "@/integrations/supabase/client";

export interface CreateListingData {
  // Vehicle Data
  brand: string;
  model: string;
  year: number;
  km: number;
  body: string;
  fuel: string;
  gearbox: string;
  
  // Leasing Details
  price_per_month_chf: number;
  remaining_months: number;
  deposit_chf: number;
  location: string;
  canton_code: string;
  
  // Images
  images: string[];
  cover_image_index: number;
  
  // Plan Selection & Status
  price_plan: string;
  is_premium: boolean;
  duration_days: number | null;
  expires_at: string | null;
  status: 'pending' | 'active' | 'expired' | 'rejected';
}

export async function createListing(listingData: CreateListingData) {
  try {
    // Get current user - for now, we'll create listings without auth for demo
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    // For demo purposes, allow creating listings without authentication
    // In production, uncomment the line below to enforce authentication
    // if (userError || !user) {
    //   throw new Error('User must be authenticated to create a listing');
    // }

    // Insert the listing with proper field mapping
    const { data, error } = await supabase
      .from('listings')
      .insert([
        {
          // Vehicle data - map to correct database fields
          brand: listingData.brand,
          model: listingData.model,
          year: listingData.year,
          km: listingData.km,
          mileage_km: listingData.km, // Also populate legacy field
          body: listingData.body,
          fuel: listingData.fuel,
          gearbox: listingData.gearbox,
          
          // Leasing details
          price_per_month_chf: listingData.price_per_month_chf,
          remaining_months: listingData.remaining_months,
          deposit_chf: listingData.deposit_chf || 0,
          location: listingData.location,
          canton_code: listingData.canton_code,
          
          // Images (stored as JSON array)
          images: listingData.images || [],
          cover_image_index: listingData.cover_image_index || 0,
          cover_image_url: listingData.images?.[listingData.cover_image_index || 0] || null,
          
          // Plan and status management
          price_plan: listingData.price_plan,
          is_premium: listingData.is_premium || false,
          premium: listingData.is_premium || false, // Also populate legacy field
          duration_days: listingData.duration_days,
          expires_at: listingData.expires_at,
          status: listingData.status || 'pending',
          
          // Auto-generated title for search
          title: `${listingData.brand} ${listingData.model} (${listingData.year})`,
          
          // Metadata
          user_id: user?.id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw new Error(`Failed to create listing: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error creating listing:', error);
    throw error;
  }
}

export async function getListings(filters?: {
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  canton?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    let query = supabase
      .from('listings')
      .select('*');

    // Apply filters
    if (filters?.brand) {
      query = query.eq('brand', filters.brand);
    }
    
    if (filters?.minPrice) {
      query = query.gte('price_per_month_chf', filters.minPrice);
    }
    
    if (filters?.maxPrice) {
      query = query.lte('price_per_month_chf', filters.maxPrice);
    }
    
    if (filters?.canton) {
      query = query.eq('canton_code', filters.canton);
    }
    
    if (filters?.status) {
      query = query.eq('status', filters.status);
    } else {
      // Default to only active listings
      query = query.eq('status', 'active');
    }

    // Order premium listings first, then by created_at
    query = query.order('is_premium', { ascending: false })
                 .order('created_at', { ascending: false });

    // Apply pagination
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching listings:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getListings:', error);
    throw error;
  }
}

export async function getListingById(id: string) {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .eq('status', 'active')
      .single();

    if (error) {
      console.error('Error fetching listing by ID:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getListingById:', error);
    throw error;
  }
}

export async function updateListingStatus(id: string, status: 'pending' | 'active' | 'expired' | 'rejected') {
  try {
    const { data, error } = await supabase
      .from('listings')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating listing status:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateListingStatus:', error);
    throw error;
  }
}

export async function checkExpiredListings() {
  try {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('listings')
      .update({ 
        status: 'expired',
        updated_at: now
      })
      .eq('status', 'active')
      .not('expires_at', 'is', null)
      .lt('expires_at', now)
      .select();

    if (error) {
      console.error('Error checking expired listings:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in checkExpiredListings:', error);
    throw error;
  }
}

// Export types for other modules
export type Listing = {
  id: string;
  user_id?: string;
  brand: string;
  model: string;
  title?: string;
  year: number;
  km: number;
  mileage_km?: number;
  body: string;
  fuel: string;
  gearbox: string;
  price_per_month_chf: number;
  remaining_months: number;
  deposit_chf?: number;
  location: string;
  canton_code: string;
  images: string[];
  cover_image_index?: number;
  cover_image_url?: string;
  price_plan: string;
  is_premium: boolean;
  premium?: boolean;
  duration_days: number | null;
  expires_at: string | null;
  status: 'pending' | 'active' | 'expired' | 'rejected';
  created_at: string;
  updated_at: string;
};
