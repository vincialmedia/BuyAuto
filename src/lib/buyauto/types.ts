export interface Listing {
  id: string;
  brand: string;
  model: string;
  title?: string;
  year: number;
  pricePerMonthCHF: number;
  remainingMonths: number;
  location: string;
  mileageKm: number;
  fuel: "Benzin" | "Diesel" | "Hybrid" | "Elektro";
  gearbox: "Automatik" | "Manuell";
  body: "Limousine" | "Kombi" | "SUV" | "Cabrio";
  premium: boolean;
  depositCHF?: number | null;
  images: string[];
  imageUrl: string; // Ensure this is present and used as the primary image
}

// Price plan types
export type PricePlan = "free30" | "premium30" | "paid90" | "unlimited";

// Type for create listing form data - matches what the components actually use
export interface ListingData {
  brand?: string;
  model?: string;
  year?: number;
  mileage?: number;
  km?: number; // Changed to number for consistency
  fuel?: string;
  transmission?: string;
  gearbox?: string;
  power?: number;
  color?: string;
  body?: string;
  // Step3 fields
  price_plan?: string;
  duration_days?: number;
  plan_price?: number;
  is_premium?: boolean;
  plan?: string;
  price?: number;
  // Step4 fields
  images?: string[];
  cover_image_index?: number;
}

// Comprehensive form data type for listing creation
export interface ListingFormData {
  // Step 1: Vehicle Data
  brand: string;
  model: string;
  year: number | string;
  mileage_km: number | string;
  fuel: "Benzin" | "Diesel" | "Hybrid" | "Elektro";
  gearbox: "Automatik" | "Manuell";
  body: "Limousine" | "Kombi" | "SUV" | "Cabrio";
  
  // Step 2: Leasing Details
  price_per_month_chf: number | string;
  remaining_months: number | string;
  deposit_chf?: number | string | null;
  location: string;
  canton_code: string;
  title?: string;
  
  // Step 3: Plan Selection
  price_plan: PricePlan;
  
  // Step 4: Images
  images: string[];
  cover_image_index: number;
}

// Extended listing type for detail page with additional fields
export interface ListingDetail extends Listing {
  canton_code?: string;
  cover_image_url?: string;
  image_urls: string[];
  status: "pending" | "published" | "rejected" | "expired";
  created_at: string;
  expires_at?: string | null;
  duration_days?: number | null;
  price_plan?: PricePlan | null;
  premium_until?: string | null;
}

// Type for listing inquiries
export interface Inquiry {
  listing_id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
}

// Type for inquiry form data with validation
export interface InquiryFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export interface SearchFilters {
  brand?: string;
  model?: string;
  yearFrom?: number;
  maxPricePerMonth?: number;
  remainingMonths?: string;
  body?: string;
  fuel?: string;
  gearbox?: string;
  maxMileage?: number;
  canton?: string;
  requiresDeposit?: boolean;
}
