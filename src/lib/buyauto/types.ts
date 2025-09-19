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
  // Step 1: Vehicle data fields
  brand?: string;
  model?: string;
  year?: number;
  mileage?: number;
  km?: number;
  fuel?: string;
  transmission?: string;
  gearbox?: string;
  power?: number;
  color?: string;
  body?: string;
  
  // Step 2: Leasing details fields
  price_per_month_chf?: number;
  remaining_months?: number;
  deposit_chf?: number;
  location?: string;
  canton_code?: string;
  title?: string;
  
  // Step 3: Billing/Plan fields - Ensure all properties are explicitly defined
  price_plan?: 'standard' | 'extended' | 'unlimited';
  pricing_plan?: string;
  premium?: boolean; // Explicitly define this as boolean
  duration_days?: number;
  expires_at?: string;
  premium_until?: string;
  price_paid_chf?: number;
  payment_status?: 'unpaid' | 'requires_payment' | 'paid' | 'refunded' | 'canceled';
  stripe_payment_intent_id?: string;
  stripe_refund_id?: string;
  refunded_at?: string;
  plan_price?: number;
  is_premium?: boolean;
  plan?: string;
  price?: number;
  
  // Step 4: Images fields
  images?: string[];
  cover_image_index?: number;
  
  // General listing fields
  id?: string;
  user_id?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

// ✅ FIXED: Updated to match exact database constraint values
export interface ListingFormData {
  // Step 1: Vehicle Data
  brand: string;
  model: string;
  year: number | string;
  mileage_km: number | string;
  fuel: "Benzin" | "Diesel" | "Hybrid" | "Elektro"; // ✅ Fixed to match DB constraints
  gearbox: "Automatik" | "Manuell"; // ✅ Fixed to match DB constraints  
  body: "Limousine" | "Kombi" | "SUV" | "Cabrio"; // ✅ Fixed to match DB constraints
  
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
