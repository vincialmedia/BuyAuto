
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

// Map Swiss cantons from location
const getCantonFromLocation = (location: string): string => {
  const cantonMapping: Record<string, string> = {
    "Aargau": "AG",
    "Appenzell Ausserrhoden": "AR", 
    "Appenzell Innerrhoden": "AI",
    "Basel-Landschaft": "BL",
    "Basel-Stadt": "BS",
    "Bern": "BE",
    "Freiburg": "FR",
    "Genf": "GE",
    "Glarus": "GL",
    "Graubünden": "GR",
    "Jura": "JU",
    "Luzern": "LU",
    "Neuenburg": "NE",
    "Nidwalden": "NW",
    "Obwalden": "OW",
    "Schaffhausen": "SH",
    "Schwyz": "SZ",
    "Solothurn": "SO",
    "St. Gallen": "SG",
    "Tessin": "TI",
    "Thurgau": "TG",
    "Uri": "UR",
    "Waadt": "VD",
    "Wallis": "VS",
    "Zug": "ZG",
    "Zürich": "ZH"
  };
  
  // Try to find the canton in the location string
  for (const [cantonName, cantonCode] of Object.entries(cantonMapping)) {
    if (location.toLowerCase().includes(cantonName.toLowerCase())) {
      return cantonCode;
    }
  }
  
  // Default to ZH if no match found
  return "ZH";
};

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
    console.log('Creating listing with data:', listingData);
    
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Ensure all required fields are present and properly typed
    if (!listingData.brand || !listingData.model || !listingData.year) {
      throw new Error('Brand, model, and year are required');
    }

    if (!listingData.km || isNaN(Number(listingData.km))) {
      throw new Error('Valid mileage (km) is required');
    }

    if (!listingData.price_per_month_chf || isNaN(Number(listingData.price_per_month_chf))) {
      throw new Error('Valid monthly price is required');
    }

    if (!listingData.remaining_months || isNaN(Number(listingData.remaining_months))) {
      throw new Error('Valid remaining months is required');
    }

    if (!listingData.location) {
      throw new Error('Location is required');
    }

    // Prepare the insert data with proper type mapping and all required fields
    const insertData: any = {
      // Required fields
      brand: String(listingData.brand).trim(),
      model: String(listingData.model).trim(),
      year: parseInt(String(listingData.year), 10),
      mileage_km: parseInt(String(listingData.km), 10), // Database field is mileage_km
      body: mapBodyType(listingData.body),
      fuel: mapFuelType(listingData.fuel),
      gearbox: mapGearboxType(listingData.gearbox),
      price_per_month_chf: parseInt(String(listingData.price_per_month_chf), 10),
      remaining_months: parseInt(String(listingData.remaining_months), 10),
      location: String(listingData.location).trim(),
      canton_code: getCantonFromLocation(listingData.location), // Required field

      // Optional fields with defaults
      deposit_chf: listingData.deposit_chf ? parseInt(String(listingData.deposit_chf), 10) : null,
      images: Array.isArray(listingData.images) ? listingData.images : [],
      cover_image_index: listingData.cover_image_index || 0,
      cover_image_url: (Array.isArray(listingData.images) && listingData.images.length > 0) 
        ? listingData.images[listingData.cover_image_index || 0] 
        : null,
      
      // Plan and status fields
      price_plan: listingData.price_plan || 'free60',
      is_premium: Boolean(listingData.is_premium),
      premium: Boolean(listingData.is_premium), // Also set the old premium field for compatibility
      duration_days: listingData.duration_days || 60,
      expires_at: listingData.expires_at,
      
      // Auto-generated fields
      title: `${listingData.brand} ${listingData.model} (${listingData.year})`,
      status: 'pending',
      user_id: user.id,
      created_by: user.id
    };

    console.log('Prepared insert data:', insertData);

    const { data, error } = await supabase
      .from('listings')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw new Error(`Fehler beim Erstellen des Inserats: ${error.message}`);
    }

    console.log('Listing created successfully:', data);
    return data;
  } catch (error) {
    console.error('Error creating listing:', error);
    
    // Provide user-friendly error messages
    if (error instanceof Error) {
      if (error.message.includes('not authenticated')) {
        throw new Error('Sie müssen angemeldet sein, um ein Inserat zu erstellen.');
      }
      if (error.message.includes('required')) {
        throw error; // Pass through validation errors as-is
      }
      if (error.message.includes('violates')) {
        throw new Error('Einige Daten sind ungültig. Bitte überprüfen Sie Ihre Eingaben.');
      }
    }
    
    throw new Error('Fehler beim Erstellen des Inserats. Bitte versuchen Sie es erneut.');
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
  canton_code?: string;
}
