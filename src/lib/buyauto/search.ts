export type SearchQuery = {
  brand?: string;
  model?: string;
  yearMin?: number;
  priceMin?: number;
  priceMax?: number;
  monthsMin?: number;
  monthsMax?: number;
  body?: string[];
  fuel?: string[];
  gearbox?: string[];
  kmMax?: number;
  canton?: string[];
  noDeposit?: boolean;
  premiumOnly?: boolean;
  page?: number;
  sort?: "relevance" | "priceAsc" | "priceDesc" | "monthsAsc" | "monthsDesc" | "yearDesc" | "kmAsc";
};

export type Listing = {
  id: string;
  brand: string;
  model: string;
  title?: string;
  year: number;
  pricePerMonthCHF: number;
  remainingMonths: number;
  location: string;
  cantonCode: string;
  mileageKm: number;
  fuel: "Benzin" | "Diesel" | "Hybrid" | "Elektro";
  gearbox: "Automatik" | "Manuell";
  body: "Limousine" | "Kombi" | "SUV" | "Cabrio";
  premium: boolean;
  depositCHF?: number | null;
  images: string[];
};

export type SearchResult = {
  items: Listing[];
  total: number;
  page: number;
  pageSize: number;
};

const SWISS_CANTONS = ["ZH", "BE", "LU", "UR", "SZ", "OW", "NW", "GL", "ZG", "FR", "SO", "BS", "BL", "SH", "AR", "AI", "SG", "GR", "AG", "TG", "TI", "VD", "VS", "NE", "GE", "JU"];

const DEMO_BRANDS = ["BMW", "Mercedes-Benz", "Audi", "Volkswagen", "Porsche", "Volvo", "Tesla", "Lexus", "Jaguar"];
const DEMO_MODELS = {
  BMW: ["3er", "5er", "X3", "X5", "i4"],
  "Mercedes-Benz": ["C-Klasse", "E-Klasse", "GLC", "GLE", "EQC"],
  Audi: ["A3", "A4", "Q5", "Q7", "e-tron"],
  Volkswagen: ["Golf", "Passat", "Tiguan", "Touareg", "ID.4"],
  Porsche: ["911", "Cayenne", "Macan", "Panamera", "Taycan"],
  Volvo: ["XC40", "XC60", "XC90", "V60", "S60"],
  Tesla: ["Model 3", "Model S", "Model X", "Model Y"],
  Lexus: ["IS", "ES", "RX", "NX", "UX"],
  Jaguar: ["XE", "XF", "F-PACE", "E-PACE", "I-PACE"]
};

const DEMO_LOCATIONS = [
  { city: "Zürich", canton: "ZH" },
  { city: "Basel", canton: "BS" },
  { city: "Bern", canton: "BE" },
  { city: "Genf", canton: "GE" },
  { city: "Lausanne", canton: "VD" },
  { city: "Winterthur", canton: "ZH" },
  { city: "Luzern", canton: "LU" },
  { city: "St. Gallen", canton: "SG" },
  { city: "Lugano", canton: "TI" },
  { city: "Thun", canton: "BE" }
];

const DEMO_IMAGES = [
  "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&h=600&fit=crop"
];

export function getDemoListings(): Listing[] {
  const listings: Listing[] = [];
  
  for (let i = 0; i < 40; i++) {
    const brand = DEMO_BRANDS[Math.floor(Math.random() * DEMO_BRANDS.length)];
    const models = DEMO_MODELS[brand as keyof typeof DEMO_MODELS];
    const model = models[Math.floor(Math.random() * models.length)];
    const location = DEMO_LOCATIONS[Math.floor(Math.random() * DEMO_LOCATIONS.length)];
    const isPremium = Math.random() < 0.3; // 30% premium
    
    const basePrice = 400 + Math.floor(Math.random() * 2000);
    const pricePerMonth = isPremium ? basePrice + 200 : basePrice;
    
    const fuel: Listing["fuel"] = ["Benzin", "Diesel", "Hybrid", "Elektro"][Math.floor(Math.random() * 4)] as Listing["fuel"];
    const gearbox: Listing["gearbox"] = Math.random() < 0.7 ? "Automatik" : "Manuell";
    const body: Listing["body"] = ["Limousine", "Kombi", "SUV", "Cabrio"][Math.floor(Math.random() * 4)] as Listing["body"];
    
    const year = 2018 + Math.floor(Math.random() * 6);
    const remainingMonths = 6 + Math.floor(Math.random() * 30);
    const mileageKm = 5000 + Math.floor(Math.random() * 120000);
    
    const hasDeposit = Math.random() < 0.6;
    const depositCHF = hasDeposit ? 1000 + Math.floor(Math.random() * 4000) : null;
    
    const imageCount = 1 + Math.floor(Math.random() * 3);
    const images = Array.from({ length: imageCount }, () => 
      DEMO_IMAGES[Math.floor(Math.random() * DEMO_IMAGES.length)]
    );
    
    listings.push({
      id: `listing-${i + 1}`,
      brand,
      model,
      title: Math.random() < 0.3 ? `${brand} ${model} Sportline` : undefined,
      year,
      pricePerMonthCHF: pricePerMonth,
      remainingMonths,
      location: `${location.city} (${location.canton})`,
      cantonCode: location.canton,
      mileageKm,
      fuel,
      gearbox,
      body,
      premium: isPremium,
      depositCHF,
      images
    });
  }
  
  return listings;
}

export function searchListings(query: SearchQuery): SearchResult {
  const allListings = getDemoListings();
  const pageSize = 12;
  const page = query.page || 1;
  
  // Apply filters
  let filteredListings = allListings.filter(listing => {
    // Brand filter
    if (query.brand && listing.brand !== query.brand) return false;
    
    // Model filter (depends on brand)
    if (query.model && listing.model !== query.model) return false;
    
    // Year filter
    if (query.yearMin && listing.year < query.yearMin) return false;
    
    // Price filters
    if (query.priceMin && listing.pricePerMonthCHF < query.priceMin) return false;
    if (query.priceMax && listing.pricePerMonthCHF > query.priceMax) return false;
    
    // Remaining months filters
    if (query.monthsMin && listing.remainingMonths < query.monthsMin) return false;
    if (query.monthsMax && listing.remainingMonths > query.monthsMax) return false;
    
    // Body type filter
    if (query.body && query.body.length > 0 && !query.body.includes(listing.body)) return false;
    
    // Fuel type filter
    if (query.fuel && query.fuel.length > 0 && !query.fuel.includes(listing.fuel)) return false;
    
    // Gearbox filter
    if (query.gearbox && query.gearbox.length > 0 && !query.gearbox.includes(listing.gearbox)) return false;
    
    // Mileage filter
    if (query.kmMax && listing.mileageKm > query.kmMax) return false;
    
    // Canton filter
    if (query.canton && query.canton.length > 0 && !query.canton.includes(listing.cantonCode)) return false;
    
    // No deposit filter
    if (query.noDeposit && listing.depositCHF !== null) return false;
    
    // Premium only filter
    if (query.premiumOnly && !listing.premium) return false;
    
    return true;
  });
  
  // Apply sorting
  const sort = query.sort || "relevance";
  filteredListings.sort((a, b) => {
    switch (sort) {
      case "relevance":
        // Boost premium listings slightly
        if (a.premium && !b.premium) return -1;
        if (!a.premium && b.premium) return 1;
        return 0;
      case "priceAsc":
        return a.pricePerMonthCHF - b.pricePerMonthCHF;
      case "priceDesc":
        return b.pricePerMonthCHF - a.pricePerMonthCHF;
      case "monthsAsc":
        return a.remainingMonths - b.remainingMonths;
      case "monthsDesc":
        return b.remainingMonths - a.remainingMonths;
      case "yearDesc":
        return b.year - a.year;
      case "kmAsc":
        return a.mileageKm - b.mileageKm;
      default:
        return 0;
    }
  });
  
  const total = filteredListings.length;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const items = filteredListings.slice(startIndex, endIndex);
  
  return {
    items,
    total,
    page,
    pageSize
  };
}

// Utility functions for UI
export function formatPrice(price: number): string {
  return `CHF ${price.toLocaleString('de-CH')}`;
}

export function formatMileage(km: number): string {
  return `${km.toLocaleString('de-CH')} km`;
}

export function getBrandModels(brand: string): string[] {
  return DEMO_MODELS[brand as keyof typeof DEMO_MODELS] || [];
}

export function getAllBrands(): string[] {
  return DEMO_BRANDS;
}

export function getAllCantons(): string[] {
  return SWISS_CANTONS;
}