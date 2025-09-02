
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

    // Use raw SQL to insert the listing to avoid TypeScript issues
    const query = `
      INSERT INTO listings (
        brand, model, year, mileage_km, km, body, fuel, gearbox, 
        price_per_month_chf, remaining_months, deposit_chf, 
        location, canton_code, images, cover_image_index, cover_image_url,
        price_plan, is_premium, premium, duration_days, expires_at, 
        title, user_id, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 
        $17, $18, $19, $20, $21, $22, $23, 'pending'::listing_status
      ) RETURNING *;
    `;

    const { data, error } = await supabase.rpc('execute_sql', {
      query_text: query,
      params: [
        listingData.brand,
        listingData.model,
        listingData.year,
        listingData.km,
        listingData.km,
        mapBodyType(listingData.body),
        mapFuelType(listingData.fuel),
        mapGearboxType(listingData.gearbox),
        listingData.price_per_month_chf,
        listingData.remaining_months,
        listingData.deposit_chf || 0,
        listingData.location,
        listingData.canton_code,
        JSON.stringify(listingData.images || []),
        listingData.cover_image_index || 0,
        listingData.images?.[listingData.cover_image_index || 0] || null,
        listingData.price_plan,
        listingData.is_premium || false,
        listingData.is_premium || false,
        listingData.duration_days,
        listingData.expires_at,
        `${listingData.brand} ${listingData.model} (${listingData.year})`,
        user?.id || null
      ]
    });

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
