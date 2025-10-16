import { supabase } from "@/integrations/supabase/client";
import { SearchQuery, SearchResult } from "@/lib/buyauto/search";
import { Listing, ListingDetail, PricePlanId } from "@/lib/buyauto/types";

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
  listing_price?: number;
};

/**
 * Safely parse images from database JSON field
 * Handles multiple formats and provides proper fallbacks
 */
function parseImagesFromDatabase(imagesField: any, coverImageUrl?: string): string[] {
  let imageUrls: string[] = [];
  
  // Handle various image formats from database
  if (imagesField) {
    try {
      // Case 1: Already an array (direct array storage)
      if (Array.isArray(imagesField)) {
        imageUrls = imagesField.filter(img => typeof img === "string" && img.trim() !== "");
      } 
      // Case 2: JSON string that needs parsing
      else if (typeof imagesField === "string") {
        const parsed = JSON.parse(imagesField);
        if (Array.isArray(parsed)) {
          imageUrls = parsed.filter(img => typeof img === "string" && img.trim() !== "");
        }
      }
      // Case 3: Object (might be a JSON object)
      else if (typeof imagesField === "object") {
        if (imagesField.length !== undefined) {
          const values = Object.values(imagesField) as unknown[];
          imageUrls = values.filter(img => typeof img === "string" && img.trim() !== "") as string[];
        }
      }
    } catch (error) {
      console.error("Error parsing images JSON:", {
        error: (error as Error).message,
        imagesField: imagesField,
        type: typeof imagesField
      });
      imageUrls = [];
    }
  }

  // Fallback: if no images in array but cover_image_url exists, use it
  if (imageUrls.length === 0 && coverImageUrl && coverImageUrl.trim() !== "") {
    imageUrls = [coverImageUrl];
  }

  return imageUrls;
}

// Transform public listing row to UI Listing format
function transformPublicRowToListing(row: PublicListingRow): Listing {
  const imageUrls = parseImagesFromDatabase(row.images, row.cover_image_url);
  
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
    images: imageUrls,
    imageUrl: imageUrls[0] || ""
  };
}

// Transform public listing row to detailed format
function transformPublicRowToListingDetail(row: PublicListingRow): ListingDetail {
  const imageUrls = parseImagesFromDatabase(row.images, row.cover_image_url);

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
    images: imageUrls,
    imageUrl: imageUrls[0] || "",
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
function transformFullRowToListingDetail(row: any): ListingDetail {
  const imageUrls = parseImagesFromDatabase(row.images, row.cover_image_url);

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
    is_premium: row.premium,
    depositCHF: row.deposit_chf || null,
    images: imageUrls,
    imageUrl: imageUrls[0] || "",
    canton_code: row.canton_code,
    cover_image_url: row.cover_image_url,
    image_urls: imageUrls,
    status: row.status as "pending" | "active" | "inactive" | "sold" | "published" | "rejected" | "expired",
    created_at: row.created_at,
    expires_at: row.expires_at,
    duration_days: row.duration_days,
    price_plan: row.price_plan as PricePlanId,
    premium_until: row.premium_until,
    cover_image_index: row.cover_image_index,
    listing_price: row.price_paid_chf, // Use price_paid_chf as listing_price
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
        return null; // No rows returned
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
    if (searchQuery.model) query = query.ilike('model', `%${searchQuery.model}%`);
    if (searchQuery.yearMin) query = query.gte('year', searchQuery.yearMin);
    if (searchQuery.priceMax) query = query.lte('price_per_month_chf', searchQuery.priceMax);
    if (typeof searchQuery.kmMax === 'number') query = query.lte('mileage_km', searchQuery.kmMax);
    if (searchQuery.canton?.length) query = query.in('canton_code', searchQuery.canton);
    if (searchQuery.fuel?.length) query = query.in('fuel', searchQuery.fuel);
    if (searchQuery.gearbox?.length) query = query.in('gearbox', searchQuery.gearbox);
    if (searchQuery.body?.length) query = query.in('body', searchQuery.body);
    if (searchQuery.premiumOnly) query = query.eq('premium', true);
    if (searchQuery.noDeposit) query = query.is('deposit_chf', null);
    
    // Sorting
    const sortOrder = searchQuery.sort || 'relevance';
    if (sortOrder === 'priceAsc') query = query.order('price_per_month_chf', { ascending: true });
    else if (sortOrder === 'priceDesc') query = query.order('price_per_month_chf', { ascending: false });
    else if (sortOrder === 'dateDesc') query = query.order('created_at', { ascending: false });
    else query = query.order('premium', { ascending: false }).order('created_at', { ascending: false });


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
// Note: The main getUserListings function is in dashboardService.ts with proper user filtering

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

/**
 * Get user's own listing by ID - includes drafts for preview
 * This is used on the success screen to preview newly created listings
 * that might not be published yet
 */
export async function getUserListingByIdForPreview(id: string): Promise<ListingDetail | null> {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select(`*`)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Error fetching user listing for preview:', error);
      return null;
    }

    return transformFullRowToListingDetail(data);
  } catch (error) {
    console.error('Get user listing for preview error:', error);
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

export async function getPublishedListingsCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('public_listings')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error fetching published listings count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Get published listings count error:', error);
    return 0;
  }
}
