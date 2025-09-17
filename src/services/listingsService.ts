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
  // Handle images field properly - it's stored as JSON in the database
  let imageUrls: string[] = [];
  
  if (row.images) {
    try {
      if (Array.isArray(row.images)) {
        // If it's already an array (some cases)
        imageUrls = row.images.filter(img => typeof img === "string" && img.trim() !== "");
      } else if (typeof row.images === "string") {
        // If it's a JSON string, parse it
        const parsed = JSON.parse(row.images);
        if (Array.isArray(parsed)) {
          imageUrls = parsed.filter(img => typeof img === "string" && img.trim() !== "");
        }
      }
    } catch (error) {
      console.warn("Error parsing images JSON:", error, row.images);
      imageUrls = [];
    }
  }

  // Fallback to cover_image_url if no images in array
  if (imageUrls.length === 0 && row.cover_image_url) {
    imageUrls = [row.cover_image_url];
  }

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
    images: imageUrls, // This is the key fix - properly parsed images array
    imageUrl: imageUrls[0] || row.cover_image_url || "",
    canton_code: row.canton_code,
    cover_image_url: row.cover_image_url,
    image_urls: imageUrls,
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
  // Handle images field properly - it's stored as JSON in the database
  let imageUrls: string[] = [];
  
  if (row.images) {
    try {
      if (Array.isArray(row.images)) {
        // If it's already an array (some cases)
        imageUrls = row.images.filter(img => typeof img === "string" && img.trim() !== "");
      } else if (typeof row.images === "string") {
        // If it's a JSON string, parse it
        const parsed = JSON.parse(row.images);
        if (Array.isArray(parsed)) {
          imageUrls = parsed.filter(img => typeof img === "string" && img.trim() !== "");
        }
      }
    } catch (error) {
      console.warn("Error parsing images JSON:", error, row.images);
      imageUrls = [];
    }
  }

  // Fallback to cover_image_url if no images in array
  if (imageUrls.length === 0 && row.cover_image_url) {
    imageUrls = [row.cover_image_url];
  }

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
    images: imageUrls, // This is the key fix - properly parsed images array
    imageUrl: imageUrls[0] || row.cover_image_url || "",
    canton_code: row.canton_code,
    cover_image_url: row.cover_image_url,
    image_urls: imageUrls,
    status: row.status as "pending" | "published" | "rejected" | "expired",
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
      if (error.code === 'PGRST116') return null; // No rows returned
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

export async function searchListings(searchQuery: SearchQuery): Promise<SearchResult> {
  try {
    const pageSize = 12;
    const page = searchQuery.page || 1;
    const offset = (page - 1) * pageSize;

    let query = supabase
      .from('public_listings')
      .select('*', { count: 'exact' });

    // Apply filters
    if (searchQuery.brand) query = query.eq('brand', searchQuery.brand);
    if (searchQuery.model) query = query.eq('model', searchQuery.model);
    if (searchQuery.yearMin) {
      query = query.gte('year', searchQuery.yearMin);
    }

    if (searchQuery.priceMin) {
      query = query.gte('price_per_month_chf', searchQuery.priceMin);
    }

    if (searchQuery.priceMax) {
      query = query.lte('price_per_month_chf', searchQuery.priceMax);
    }

    if (typeof searchQuery.kmMax === 'number') query = query.lte('mileage_km', searchQuery.kmMax);
    if (typeof searchQuery.monthsMin === 'number') query = query.gte('remaining_months', searchQuery.monthsMin);
    if (typeof searchQuery.monthsMax === 'number') query = query.lte('remaining_months', searchQuery.monthsMax);
    if (searchQuery.canton?.length) query = query.in('canton_code', searchQuery.canton);
    if (searchQuery.fuel?.length) query = query.in('fuel', searchQuery.fuel);
    if (searchQuery.gearbox?.length) query = query.in('gearbox', searchQuery.gearbox);
    if (searchQuery.body?.length) query = query.in('body', searchQuery.body);
    if (searchQuery.premiumOnly) query = query.eq('premium', true);
    if (searchQuery.noDeposit) query = query.is('deposit_chf', null);

    // Apply sorting
    switch (searchQuery.sort) {
      case 'priceAsc':
        query = query.order('price_per_month_chf', { ascending: true });
        break;
      case 'priceDesc':
        query = query.order('price_per_month_chf', { ascending: false });
        break;
      case 'dateDesc':
        query = query.order('created_at', { ascending: false });
        break;
      case 'monthsAsc':
        query = query.order('remaining_months', { ascending: true });
        break;
      case 'monthsDesc':
        query = query.order('remaining_months', { ascending: false });
        break;
      case 'yearDesc':
        query = query.order('year', { ascending: false });
        break;
      case 'kmAsc':
        query = query.order('mileage_km', { ascending: true });
        break;
      case 'relevance':
      default:
        query = query.order('premium', { ascending: false }).order('created_at', { ascending: false });
        break;
    }

    // Apply pagination
    query = query.range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Search query error:', error);
      throw error;
    }

    const items = (data || []).map(transformPublicRowToListing);

    return {
      items,
      total: count || 0,
      page,
      pageSize,
    };
  } catch (error) {
    console.error('Search listings error:', error);
    return {
      items: [],
      total: 0,
      page: searchQuery.page || 1,
      pageSize: 12,
    };
  }
}

export async function getBrands(): Promise<string[]> {
  try {
    const { data, error } = await supabase.rpc('get_distinct_brands');

    if (error) {
      console.error('Error fetching brands:', error);
      return [];
    }
    return data;
  } catch (error) {
    console.error('Get brands error:', error);
    return [];
  }
}

export async function getModelsForBrand(brand: string): Promise<string[]> {
  try {
     const { data, error } = await supabase.rpc('get_models_for_brand', { p_brand: brand });

    if (error) {
      console.error('Error fetching models:', error);
      return [];
    }
    return data;
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
      .select(`*`)
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
      .select(`*`)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
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
      .select(`*`)
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