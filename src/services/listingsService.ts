
import { supabase } from "@/integrations/supabase/client";
import { SearchQuery, SearchResult } from "@/lib/buyauto/search";
import { Listing, ListingDetail } from "@/lib/buyauto/types";

// Database row type for public listings view
type PublicListingRow = {
  id: string;
  brand: string;
  model: string;
  title?: string;
  year: number;
  price_per_month_chf: number;
  remaining_months: number;
  location: string;
  canton_code: string;
  mileage_km: number;
  fuel: "Benzin" | "Diesel" | "Hybrid" | "Elektro";
  gearbox: "Automatik" | "Manuell";
  body: "Limousine" | "Kombi" | "SUV" | "Cabrio";
  premium: boolean;
  cover_image_url?: string;
  images?: any;
  cover_image_index?: number;
  deposit_chf?: number;
  created_at: string;
};

// Database row type for full listings (dashboard/admin)
type FullListingRow = PublicListingRow & {
  status: string;
  expires_at?: string;
  duration_days?: number;
  price_plan?: string;
  premium_until?: string;
  created_by?: string;
  user_id?: string;
  moderation_note?: string;
  updated_at?: string;
};

// Transform public listing row to UI Listing format
function transformPublicRowToListing(row: PublicListingRow): Listing {
  return {
    id: row.id,
    brand: row.brand,
    model: row.model,
    title: row.title || undefined,
    year: row.year,
    pricePerMonthCHF: row.price_per_month_chf,
    remainingMonths: row.remaining_months,
    location: row.location,
    mileageKm: row.mileage_km,
    fuel: row.fuel,
    gearbox: row.gearbox,
    body: row.body,
    premium: row.premium,
    depositCHF: row.deposit_chf || null,
    images: row.cover_image_url ? [row.cover_image_url] : [],
    imageUrl: row.cover_image_url || ""
  };
}

// Transform public listing row to detailed format
function transformPublicRowToListingDetail(row: PublicListingRow): ListingDetail {
  return {
    id: row.id,
    brand: row.brand,
    model: row.model,
    title: row.title || undefined,
    year: row.year,
    pricePerMonthCHF: row.price_per_month_chf,
    remainingMonths: row.remaining_months,
    location: row.location,
    mileageKm: row.mileage_km,
    fuel: row.fuel,
    gearbox: row.gearbox,
    body: row.body,
    premium: row.premium,
    depositCHF: row.deposit_chf || null,
    images: row.cover_image_url ? [row.cover_image_url] : [],
    imageUrl: row.cover_image_url || "",
    canton_code: row.canton_code,
    cover_image_url: row.cover_image_url,
    image_urls: [], // Extract from images jsonb if needed
    status: "published", // Always published in public view
    created_at: row.created_at,
    expires_at: null,
    duration_days: null,
    price_plan: null,
    premium_until: null,
  };
}

// Transform full listing row (for dashboard/admin)
function transformFullRowToListingDetail(row: FullListingRow): ListingDetail {
  return {
    id: row.id,
    brand: row.brand,
    model: row.model,
    title: row.title || undefined,
    year: row.year,
    pricePerMonthCHF: row.price_per_month_chf,
    remainingMonths: row.remaining_months,
    location: row.location,
    mileageKm: row.mileage_km,
    fuel: row.fuel,
    gearbox: row.gearbox,
    body: row.body,
    premium: row.premium,
    depositCHF: row.deposit_chf || null,
    images: row.cover_image_url ? [row.cover_image_url] : [],
    imageUrl: row.cover_image_url || "",
    canton_code: row.canton_code,
    cover_image_url: row.cover_image_url,
    image_urls: [], // Extract from images jsonb if needed
    status: (row.status as "published" | "pending" | "rejected" | "expired") || "published",
    created_at: row.created_at,
    expires_at: row.expires_at,
    duration_days: row.duration_days,
    price_plan: row.price_plan as "free30" | "premium30" | "paid90" | "unlimited",
    premium_until: row.premium_until,
  };
}

// PUBLIC FRONTEND FUNCTIONS (homepage, search, listing detail)
// These use the secure public_listings view

export async function getPublishedListingById(id: string): Promise<ListingDetail | null> {
  try {
    const { data, error } = await supabase
      .from('public_listings')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      console.error('Error fetching published listing by ID:', error);
      return null;
    }

    return transformPublicRowToListingDetail(data);
  } catch (error) {
    console.error('Get published listing by ID error:', error);
    return null;
  }
}

export async function getSimilarListings(listing: ListingDetail, limit: number = 6): Promise<Listing[]> {
  try {
    const { data, error } = await supabase
      .from('public_listings')
      .select('*')
      .neq('id', listing.id)
      .or(`brand.eq.${listing.brand},body.eq.${listing.body}`)
      .order('premium', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching similar listings:', error);
      return [];
    }

    return (data || []).map(transformPublicRowToListing);
  } catch (error) {
    console.error('Get similar listings error:', error);
    return [];
  }
}

export async function searchListings(query: SearchQuery): Promise<SearchResult> {
  try {
    const pageSize = 12;
    const page = query.page || 1;
    
    // Use the secure search RPC function
    const { data, error } = await supabase
      .rpc('search_published_listings', {
        search_brand: query.brand || null,
        search_model: query.model || null,
        min_year: query.yearMin || null,
        max_year: null, // Add if needed
        min_price: query.priceMin || null,
        max_price: query.priceMax || null,
        search_canton: null, // Add canton filter if needed
        search_fuel: query.fuel && query.fuel.length > 0 ? query.fuel[0] : null,
        search_gearbox: query.gearbox && query.gearbox.length > 0 ? query.gearbox[0] : null,
        search_body: query.body && query.body.length > 0 ? query.body[0] : null,
        max_mileage: query.kmMax || null,
        premium_only: query.premiumOnly || false,
        limit_count: pageSize,
        offset_count: (page - 1) * pageSize
      });

    if (error) {
      console.error('Search RPC error:', error);
      throw error;
    }

    // Get total count with a separate query for simplicity
    const { count } = await supabase
      .from('public_listings')
      .select('*', { count: 'exact', head: true });

    const items = (data || []).map(transformPublicRowToListing);

    return {
      items,
      total: count || 0,
      page,
      pageSize
    };

  } catch (error) {
    console.error('Search listings error:', error);
    
    return {
      items: [],
      total: 0,
      page: query.page || 1,
      pageSize: 12
    };
  }
}

export async function getBrands(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('public_listings')
      .select('brand')
      .order('brand');

    if (error) {
      console.error('Error fetching brands:', error);
      return [];
    }

    const uniqueBrands = [...new Set(data.map(row => row.brand))];
    return uniqueBrands;

  } catch (error) {
    console.error('Get brands error:', error);
    return [];
  }
}

export async function getModelsForBrand(brand: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('public_listings')
      .select('model')
      .eq('brand', brand)
      .order('model');

    if (error) {
      console.error('Error fetching models:', error);
      return [];
    }

    const uniqueModels = [...new Set(data.map(row => row.model))];
    return uniqueModels;

  } catch (error) {
    console.error('Get models error:', error);
    return [];
  }
}

// USER DASHBOARD FUNCTIONS
// These query the full listings table, but RLS ensures users only see their own

export async function getUserListings(): Promise<ListingDetail[]> {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select(`
        id, brand, model, title, year, price_per_month_chf, remaining_months,
        location, canton_code, mileage_km, fuel, gearbox, body, premium, 
        cover_image_url, images, cover_image_index, deposit_chf, created_at,
        status, expires_at, duration_days, price_plan, premium_until,
        created_by, user_id, moderation_note, updated_at
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user listings:', error);
      return [];
    }

    return (data || []).map(transformFullRowToListingDetail);
  } catch (error) {
    console.error('Get user listings error:', error);
    return [];
  }
}

export async function getUserListingById(id: string): Promise<ListingDetail | null> {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select(`
        id, brand, model, title, year, price_per_month_chf, remaining_months,
        location, canton_code, mileage_km, fuel, gearbox, body, premium, 
        cover_image_url, images, cover_image_index, deposit_chf, created_at,
        status, expires_at, duration_days, price_plan, premium_until,
        created_by, user_id, moderation_note, updated_at
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching user listing by ID:', error);
      return null;
    }

    return transformFullRowToListingDetail(data);
  } catch (error) {
    console.error('Get user listing by ID error:', error);
    return null;
  }
}

// ADMIN FUNCTIONS
// These also query the full listings table, but RLS allows admins to see all

export async function getAllListings(): Promise<ListingDetail[]> {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select(`
        id, brand, model, title, year, price_per_month_chf, remaining_months,
        location, canton_code, mileage_km, fuel, gearbox, body, premium, 
        cover_image_url, images, cover_image_index, deposit_chf, created_at,
        status, expires_at, duration_days, price_plan, premium_until,
        created_by, user_id, moderation_note, updated_at
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all listings (admin):', error);
      return [];
    }

    return (data || []).map(transformFullRowToListingDetail);
  } catch (error) {
    console.error('Get all listings error:', error);
    return [];
  }
}

export async function updateListingStatus(id: string, status: string, moderationNote?: string): Promise<boolean> {
  try {
    const updateData: any = { status };
    if (moderationNote !== undefined) {
      updateData.moderation_note = moderationNote;
    }

    const { error } = await supabase
      .from('listings')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating listing status:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Update listing status error:', error);
    return false;
  }
}
