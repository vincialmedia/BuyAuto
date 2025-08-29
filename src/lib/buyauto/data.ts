
import { Listing } from "./types";

export const mockListings: Listing[] = [
  {
    id: "1",
    brand: "BMW",
    model: "3er Touring",
    year: 2022,
    pricePerMonthCHF: 649,
    remainingMonths: 18,
    location: "Zürich, ZH",
    cantonCode: "ZH",
    mileageKm: 15200,
    fuel: "Benzin",
    gearbox: "Automatik",
    body: "Kombi",
    premium: true,
    imageUrl: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=600&fit=crop&crop=center",
    images: ["https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=600&fit=crop&crop=center"]
  },
  {
    id: "2",
    brand: "Audi",
    model: "Q5 Sportback",
    year: 2023,
    pricePerMonthCHF: 789,
    remainingMonths: 24,
    location: "Basel, BS",
    cantonCode: "BS",
    mileageKm: 8900,
    fuel: "Hybrid",
    gearbox: "Automatik",
    body: "SUV",
    premium: true,
    imageUrl: "https://images.unsplash.com/photo-1544829099-b9a0c5303bea?w=800&h=600&fit=crop&crop=center",
    images: ["https://images.unsplash.com/photo-1544829099-b9a0c5303bea?w=800&h=600&fit=crop&crop=center"]
  },
  {
    id: "3",
    brand: "Mercedes-Benz",
    model: "C-Klasse",
    year: 2021,
    pricePerMonthCHF: 599,
    remainingMonths: 12,
    location: "Bern, BE",
    cantonCode: "BE",
    mileageKm: 22300,
    fuel: "Diesel",
    gearbox: "Automatik",
    body: "Limousine",
    premium: false,
    imageUrl: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&h=600&fit=crop&crop=center",
    images: ["https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&h=600&fit=crop&crop=center"]
  },
  {
    id: "4",
    brand: "Volkswagen",
    model: "Golf GTI",
    year: 2022,
    pricePerMonthCHF: 459,
    remainingMonths: 15,
    location: "Luzern, LU",
    cantonCode: "LU",
    mileageKm: 18700,
    fuel: "Benzin",
    gearbox: "Manuell",
    body: "Limousine",
    premium: false,
    imageUrl: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=600&fit=crop&crop=center",
    images: ["https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=600&fit=crop&crop=center"]
  },
  {
    id: "5",
    brand: "Tesla",
    model: "Model Y",
    year: 2023,
    pricePerMonthCHF: 899,
    remainingMonths: 30,
    location: "Genf, GE",
    cantonCode: "GE",
    mileageKm: 5200,
    fuel: "Elektro",
    gearbox: "Automatik",
    body: "SUV",
    premium: false,
    imageUrl: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&h=600&fit=crop&crop=center",
    images: ["https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&h=600&fit=crop&crop=center"]
  },
  {
    id: "6",
    brand: "Porsche",
    model: "Macan S",
    year: 2022,
    pricePerMonthCHF: 1189,
    remainingMonths: 21,
    location: "St. Gallen, SG",
    cantonCode: "SG",
    mileageKm: 12800,
    fuel: "Benzin",
    gearbox: "Automatik",
    body: "SUV",
    premium: false,
    imageUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop&crop=center",
    images: ["https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop&crop=center"]
  },
  {
    id: "7",
    brand: "Volvo",
    model: "XC60 Recharge",
    year: 2023,
    pricePerMonthCHF: 729,
    remainingMonths: 27,
    location: "Winterthur, ZH",
    cantonCode: "ZH",
    mileageKm: 7400,
    fuel: "Hybrid",
    gearbox: "Automatik",
    body: "SUV",
    premium: false,
    imageUrl: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=600&fit=crop&crop=center",
    images: ["https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=600&fit=crop&crop=center"]
  },
  {
    id: "8",
    brand: "Mini",
    model: "Cooper S Cabrio",
    year: 2021,
    pricePerMonthCHF: 549,
    remainingMonths: 9,
    location: "Lausanne, VD",
    cantonCode: "VD",
    mileageKm: 19600,
    fuel: "Benzin",
    gearbox: "Automatik",
    body: "Cabrio",
    premium: false,
    imageUrl: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop&crop=center",
    images: ["https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop&crop=center"]
  }
];

export const getBrands = (): string[] => {
  return Array.from(new Set(mockListings.map(listing => listing.brand))).sort();
};

export const getModelsByBrand = (brand: string): string[] => {
  return Array.from(new Set(
    mockListings
      .filter(listing => listing.brand === brand)
      .map(listing => listing.model)
  )).sort();
};

export const getPremiumListings = (): Listing[] => {
  return mockListings.filter(listing => listing.premium);
};

export const getTotalListingsCount = (): number => {
  return mockListings.length;
};
