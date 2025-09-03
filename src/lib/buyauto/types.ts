
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

// Extended listing type for detail page with additional fields
export interface ListingDetail extends Listing {
  canton_code?: string;
  cover_image_url?: string;
  image_urls: string[];
  status: "published" | "draft" | "expired";
  created_at: string;
  expires_at?: string;
  duration_days?: number;
  price_plan?: "free30" | "premium30" | "paid90" | "unlimited";
  premium_until?: string;
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