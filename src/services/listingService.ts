
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type ListingTable = Database["public"]["Tables"]["listings"];
type ListingInsert = ListingTable["Insert"];
type ListingUpdate = ListingTable["Update"];

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
    const { data: { user } } = await supabase.auth.getUser();

    const insertData: ListingInsert = {
      brand: listingData.brand,
      model: listingData.model,
      year: listingData.year,
      mileage_km: listingData.km, // Correct field from schema
      body: listingData.body,
      fuel: listingData.fuel,
      gearbox: listingData.gearbox,
      price_per_month_chf: listingData.price_per_month_chf,
      remaining_months: listingData.remaining_months,
      deposit_chf: listingData.deposit_chf || 0,
      location: listingData.location,
      canton_code: listingData.canton_code,
      images: listingData.images || [],
      cover_image_index: listingData.cover_image_index || 0,
      cover_image_url: listingData.images?.[listingData.cover_image_index || 0] || null,
      price_plan: listingData.price_plan,
      is_premium: listingData.is_premium || false,
      premium: listingData.is_premium || false,
      duration_days: listingData.duration_days,
      expires_at: listingData.expires_at,
      status: listingData.status || 'pending',
      title: `${listingData.brand} ${listingData.model} (${listingData.year})`,
      user_id: user?.id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // 'km' is not in the base schema, only mileage_km. The ALTER might not have updated types.
    };

    const { data, error } = await supabase
      .from('listings')
      .insert(insertData) // Pass a single object, not an array for a single insert
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
      query = query.eq('status', 'active');
    }

    query = query.order('is_premium', { ascending: false })
                 .order('created_at', { ascending: false });

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
    // The generated types might be out of sync. 'status' is a valid column.
    const updatePayload: ListingUpdate = { 
        status,
        updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('listings')
      .update(updatePayload)
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
    
    // The generated types might be out of sync. 'status' is a valid column.
    const updatePayload: ListingUpdate = {
        status: 'expired',
        updated_at: now
    };

    const { data, error } = await supabase
      .from('listings')
      .update(updatePayload)
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

export type Listing = ListingTable["Row"] & { km?: number };
