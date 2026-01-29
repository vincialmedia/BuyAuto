export type DealType = "lease_takeover" | "direct_purchase";
export type FinancingType = "cash" | "leasing";

export interface LeaseTakeoverOffer {
  enabled: boolean;
  price_per_month_chf: number;
  remaining_months: number;
  deposit_chf: number;
  remaining_km?: number;
  pickup_canton_code: string;
}

export interface LeasingOffer {
  enabled: boolean;
  interest_rate_pct: number;
  down_payment_pct: number;
  no_down_payment: boolean;
  min_term_months: number;
  max_term_months: number;
  km_options?: number[];
  residual_pct_adjustment_pp?: number;
  lease_takeover_offer?: LeaseTakeoverOffer;
}

export interface Listing {
  id: string;
  user_id?: string; // ✅ Made optional to fix build errors
  deal_type?: DealType;
  financing_type?: FinancingType | null;
  leasing_offer?: LeasingOffer | null;
  brand: string;
  model: string;
  title?: string;
  year: number;
  pricePerMonthCHF: number;
  remainingMonths: number;
  remaining_km?: number;
  location: string;
  mileageKm: number;
  fuel: "Benzin" | "Diesel" | "Hybrid" | "Elektro";
  gearbox: "Automatik" | "Manuell";
  body: "Limousine" | "Kombi" | "SUV" | "Cabrio";
  premium: boolean;
  depositCHF?: number | null;
  images: string[];
  imageUrl: string;
  description?: string; // ✅ Added description field
  purchasePriceCHF?: number | null;
}

export type PricePlanId = "free30" | "standard" | "extended" | "unlimited";

export interface PricePlan {
  id: PricePlanId;
  name: string;
  price: number;
  features: string[];
  duration_days: number;
  is_featured: boolean;
}

export interface ListingData {
  deal_type?: DealType;
  financing_type?: FinancingType | null;
  leasing_offer?: LeasingOffer | null;
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
  description?: string;
  
  price_per_month_chf?: number;
  remaining_months?: number;
  remaining_km?: number; // ✅ Added remaining_km
  deposit_chf?: number;
  location?: string;
  canton_code?: string;
  title?: string;
  
  price_plan?: PricePlanId;
  pricing_plan?: string;
  premium?: boolean;
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
  
  images?: string[];
  cover_image_index?: number;
  
  id?: string;
  user_id?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ListingFormData {
  brand: string;
  model: string;
  year: number | string;
  mileage_km: number | string;
  fuel: "Benzin" | "Diesel" | "Hybrid" | "Elektro";
  gearbox: "Automatik" | "Manuell";  
  body: "Limousine" | "Kombi" | "SUV" | "Cabrio";
  description?: string; // ✅ Added description field
  
  price_per_month_chf: number | string;
  remaining_months: number | string;
  deposit_chf?: number | string | null;
  location: string;
  canton_code: string;
  title?: string;
  
  price_plan: PricePlanId;
  
  images: string[];
  cover_image_index: number;
}

export interface ListingDetail extends Listing {
  canton_code: string;
  cover_image_url?: string;
  image_urls: string[];
  status: "draft" | "pending" | "active" | "inactive" | "sold" | "published" | "rejected" | "expired";
  created_at: string;
  expires_at: string | null;
  duration_days: number | null;
  price_plan: PricePlanId | null;
  premium_until: string | null;
  cover_image_index?: number;
  listing_price?: number;
  is_premium?: boolean;
  description?: string; // ✅ Added description field
}

export interface Inquiry {
  listing_id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
}

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

export type ListingStatus = "draft" | "pending" | "active" | "inactive" | "sold" | "published" | "rejected" | "expired";
