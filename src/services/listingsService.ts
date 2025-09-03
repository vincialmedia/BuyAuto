
import { supabase } from "@/integrations/supabase/client";
import { SearchQuery, SearchResult } from "@/lib/buyauto/search";
import { Listing, ListingDetail } from "@/lib/buyauto/types";

// Database row type (matches Supabase schema without canton_code)
type ListingRow = {
  id: string;
  brand: string;
  model: string;
  title?: string;
  year: number;
  price_per_month_chf: number;
  remaining_months: number;
  location: string;
  mileage_km: number;
  fuel: "Benzin" | "Diesel" | "Hybrid" | "Elektro";
  gearbox: "Automatik" | "Manuell";
  body: "Limousine" | "Kombi" | "SUV" | "Cabrio";
  premium: boolean;
  cover_image_url?: string;
  deposit_chf?: number;
  created_at: string;
  status?: string;
  expires_at?: string;
  duration_days?: number;
  price_plan?: string;
  premium_until?: string;
  canton_code?: string;
  image_urls?: string[];
};

// Transform database row to UI Listing format
function transformDbRowToListing(row: ListingRow): Listing {
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
    // For now, use cover_image_url as single image, can extend to multiple images later
    images: row.cover_image_url ? [row.cover_image_url] : [],
    imageUrl: row.cover_image_url || ""
  };
}

// Transform database row to detailed listing format
function transformDbRowToListingDetail(row: ListingRow): ListingDetail {
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
    image_urls: row.image_urls || [],
    status: (row.status as "published" | "draft" | "expired") || "published",
    created_at: row.created_at,
    expires_at: row.expires_at,
    duration_days: row.duration_days,
    price_plan: row.price_plan as "free30" | "premium30" | "paid90" | "unlimited",
    premium_until: row.premium_until,
  };
}

// Get a single published listing by ID
export async function getPublishedListingById(id: string): Promise<ListingDetail | null> {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select(`
        id, brand, model, title, year, price_per_month_chf, remaining_months,
        location, mileage_km, fuel, gearbox, body, premium, cover_image_url,
        deposit_chf, created_at, status, expires_at, duration_days, price_plan,
        premium_until, canton_code, image_urls
      `)
      .eq('id', id)
      .eq('status', 'published')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      console.error('Error fetching listing by ID:', error);
      return null;
    }

    return transformDbRowToListingDetail(data);
  } catch (error) {
    console.error('Get published listing by ID error:', error);
    return null;
  }
}

// Get similar listings based on brand or body type
export async function getSimilarListings(listing: ListingDetail, limit: number = 6): Promise<Listing[]> {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select(`
        id, brand, model, title, year, price_per_month_chf, remaining_months,
        location, mileage_km, fuel, gearbox, body, premium, cover_image_url,
        deposit_chf, created_at
      `)
      .eq('status', 'published')
      .neq('id', listing.id)
      .or(`brand.eq.${listing.brand},body.eq.${listing.body}`)
      .order('premium', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching similar listings:', error);
      return [];
    }

    return (data || []).map(transformDbRowToListing);
  } catch (error) {
    console.error('Get similar listings error:', error);
    return [];
  }
}

export async function searchListings(query: SearchQuery): Promise<SearchResult> {
  try {
    const pageSize = 12;
    const page = query.page || 1;
    const offset = (page - 1) * pageSize;

    // Start building the query
    let supabaseQuery = supabase
      .from('listings')
      .select('*', { count: 'exact' });

    // Apply filters
    if (query.brand) {
      supabaseQuery = supabaseQuery.eq('brand', query.brand);
    }

    if (query.model) {
      supabaseQuery = supabaseQuery.eq('model', query.model);
    }

    if (query.yearMin) {
      supabaseQuery = supabaseQuery.gte('year', query.yearMin);
    }

    if (query.priceMin) {
      supabaseQuery = supabaseQuery.gte('price_per_month_chf', query.priceMin);
    }

    if (query.priceMax) {
      supabaseQuery = supabaseQuery.lte('price_per_month_chf', query.priceMax);
    }

    if (query.monthsMin) {
      supabaseQuery = supabaseQuery.gte('remaining_months', query.monthsMin);
    }

    if (query.monthsMax) {
      supabaseQuery = supabaseQuery.lte('remaining_months', query.monthsMax);
    }

    if (query.body && query.body.length > 0) {
      supabaseQuery = supabaseQuery.in('body', query.body);
    }

    if (query.fuel && query.fuel.length > 0) {
      supabaseQuery = supabaseQuery.in('fuel', query.fuel);
    }

    if (query.gearbox && query.gearbox.length > 0) {
      supabaseQuery = supabaseQuery.in('gearbox', query.gearbox);
    }

    if (query.kmMax) {
      supabaseQuery = supabaseQuery.lte('mileage_km', query.kmMax);
    }

    if (query.noDeposit) {
      supabaseQuery = supabaseQuery.is('deposit_chf', null);
    }

    if (query.premiumOnly) {
      supabaseQuery = supabaseQuery.eq('premium', true);
    }

    // Apply sorting
    const sort = query.sort || "relevance";
    switch (sort) {
      case "relevance":
        // Premium first, then newest
        supabaseQuery = supabaseQuery
          .order('premium', { ascending: false })
          .order('created_at', { ascending: false });
        break;
      case "priceAsc":
        supabaseQuery = supabaseQuery.order('price_per_month_chf', { ascending: true });
        break;
      case "priceDesc":
        supabaseQuery = supabaseQuery.order('price_per_month_chf', { ascending: false });
        break;
      case "monthsAsc":
        supabaseQuery = supabaseQuery.order('remaining_months', { ascending: true });
        break;
      case "monthsDesc":
        supabaseQuery = supabaseQuery.order('remaining_months', { ascending: false });
        break;
      case "yearDesc":
        supabaseQuery = supabaseQuery.order('year', { ascending: false });
        break;
      case "kmAsc":
        supabaseQuery = supabaseQuery.order('mileage_km', { ascending: true });
        break;
    }

    // Apply pagination
    supabaseQuery = supabaseQuery.range(offset, offset + pageSize - 1);

    // Execute query
    const { data, error, count } = await supabaseQuery;

    if (error) {
      console.error('Supabase search error:', error);
      throw error;
    }

    // Transform data
    const items = (data || []).map(transformDbRowToListing);

    return {
      items,
      total: count || 0,
      page,
      pageSize
    };

  } catch (error) {
    console.error('Search listings error:', error);
    
    // Fallback: return empty results instead of crashing
    return {
      items: [],
      total: 0,
      page: query.page || 1,
      pageSize: 12
    };
  }
}

// Get unique brands from database for filter options
export async function getBrands(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select('brand')
      .order('brand');

    if (error) {
      console.error('Error fetching brands:', error);
      return [];
    }

    // Get unique brands
    const uniqueBrands = [...new Set(data.map(row => row.brand))];
    return uniqueBrands;

  } catch (error) {
    console.error('Get brands error:', error);
    return [];
  }
}

// Get models for a specific brand
export async function getModelsForBrand(brand: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select('model')
      .eq('brand', brand)
      .order('model');

    if (error) {
      console.error('Error fetching models:', error);
      return [];
    }

    // Get unique models
    const uniqueModels = [...new Set(data.map(row => row.model))];
    return uniqueModels;

  } catch (error) {
    console.error('Get models error:', error);
    return [];
  }
}