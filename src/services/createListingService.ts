
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

// Map form values to database enum values
const mapBodyType = (body: string): string => {
  const mapping: Record<string, string> = {
    "Limousine": "Limousine",
    "Kombi": "Kombi", 
    "SUV": "SUV",
    "Coupé": "Cabrio",
    "Cabriolet": "Cabrio",
    "Kleinwagen": "Limousine",
    "Van": "Kombi",
    "Pick-up": "SUV",
    "Sportwagen": "Cabrio",
    "Stadtgeländewagen": "SUV"
  };
  return mapping[body] || "Limousine";
};

const mapFuelType = (fuel: string): string => {
  const mapping: Record<string, string> = {
    "Benzin": "Benzin",
    "Diesel": "Diesel",
    "Elektro": "Elektro",
    "Hybrid (Benzin)": "Hybrid",
    "Hybrid (Diesel)": "Hybrid",
    "Plug-in-Hybrid": "Hybrid",
    "Erdgas (CNG)": "Benzin",
    "Autogas (LPG)": "Benzin"
  };
  return mapping[fuel] || "Benzin";
};

const mapGearboxType = (gearbox: string): string => {
  const mapping: Record<string, string> = {
    "Manuell": "Manuell",
    "Automatik": "Automatik",
    "Halbautomatik": "Automatik",
    "Stufenlos (CVT)": "Automatik"
  };
  return mapping[gearbox] || "Manuell";
};

export async function createListing(listingData: CreateListingData) {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;

    // Prepare the insert data with proper type mapping
    const insertData: any = {
      brand: listingData.brand,
      model: listingData.model,
      year: listingData.year,
      mileage_km: listingData.km,
      body: mapBodyType(listingData.body),
      fuel: mapFuelType(listingData.fuel),
      gearbox: mapGearboxType(listingData.gearbox),
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
      duration_days: listingData.duration_days,
      expires_at: listingData.expires_at,
      title: `${listingData.brand} ${listingData.model} (${listingData.year})`,
      user_id: user?.id || null,
      status: 'pending'
    };

    const { data, error } = await supabase
      .from('listings')
      .insert(insertData)
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

export interface Listing {
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
  km?: number;
  fuel: string;
  gearbox: string;
  body: string;
  premium?: boolean;
  is_premium?: boolean;
  cover_image_url?: string;
  deposit_chf?: number;
  created_at?: string;
  updated_at?: string;
  duration_days?: number;
  price_plan?: string;
  expires_at?: string;
  status?: string;
  user_id?: string;
  images?: string[];
  cover_image_index?: number;
}
