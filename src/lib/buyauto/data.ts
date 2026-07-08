import { Listing } from "./types";

export const mockListings: Listing[] = [
  {
    id: "1",
    user_id: "mock-user-1",
    brand: "BMW",
    model: "330i xDrive Touring",
    year: 2023,
    pricePerMonthCHF: 890,
    remainingMonths: 18,
    location: "Zürich, ZH",
    mileageKm: 15200,
    fuel: "Benzin",
    gearbox: "Automatik",
    body: "Kombi",
    premium: true,
    imageUrl: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=600&fit=crop&crop=center&fm=webp&q=75",
    images: ["https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=600&fit=crop&crop=center&fm=webp&q=75"]
  },
  {
    id: "2",
    user_id: "mock-user-2",
    brand: "Audi",
    model: "Q5 45 TFSI",
    year: 2022,
    pricePerMonthCHF: 750,
    remainingMonths: 24,
    location: "Basel, BS",
    mileageKm: 8900,
    fuel: "Hybrid",
    gearbox: "Automatik",
    body: "SUV",
    premium: true,
    imageUrl: "https://images.unsplash.com/photo-1544829099-b9a0c5303bea?w=800&h=600&fit=crop&crop=center&fm=webp&q=75",
    images: ["https://images.unsplash.com/photo-1544829099-b9a0c5303bea?w=800&h=600&fit=crop&crop=center&fm=webp&q=75"]
  },
  {
    id: "3",
    user_id: "mock-user-3",
    brand: "Mercedes-Benz",
    model: "C 220 d",
    year: 2021,
    pricePerMonthCHF: 680,
    remainingMonths: 12,
    location: "Bern, BE",
    mileageKm: 22300,
    fuel: "Diesel",
    gearbox: "Automatik",
    body: "Limousine",
    premium: false,
    imageUrl: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&h=600&fit=crop&crop=center&fm=webp&q=75",
    images: ["https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&h=600&fit=crop&crop=center&fm=webp&q=75"]
  },
  {
    id: "4",
    user_id: "mock-user-4",
    brand: "VW",
    model: "Golf 8 R-Line",
    year: 2023,
    pricePerMonthCHF: 450,
    remainingMonths: 15,
    location: "Luzern, LU",
    mileageKm: 18700,
    fuel: "Benzin",
    gearbox: "Manuell",
    body: "Limousine",
    premium: false,
    imageUrl: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=600&fit=crop&crop=center&fm=webp&q=75",
    images: ["https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=600&fit=crop&crop=center&fm=webp&q=75"]
  },
  {
    id: "5",
    user_id: "mock-user-5",
    brand: "Tesla",
    model: "Model Y Long Range",
    year: 2022,
    pricePerMonthCHF: 820,
    remainingMonths: 30,
    location: "Genf, GE",
    mileageKm: 5200,
    fuel: "Elektro",
    gearbox: "Automatik",
    body: "SUV",
    premium: false,
    imageUrl: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&h=600&fit=crop&crop=center&fm=webp&q=75",
    images: ["https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&h=600&fit=crop&crop=center&fm=webp&q=75"]
  },
  {
    id: "6",
    user_id: "mock-user-6",
    brand: "Volvo",
    model: "XC60 B4",
    year: 2021,
    pricePerMonthCHF: 720,
    remainingMonths: 21,
    location: "St. Gallen, SG",
    mileageKm: 12800,
    fuel: "Benzin",
    gearbox: "Automatik",
    body: "SUV",
    premium: false,
    imageUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop&crop=center&fm=webp&q=75",
    images: ["https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop&crop=center&fm=webp&q=75"]
  },
  {
    id: "7",
    user_id: "mock-user-7",
    brand: "Toyota",
    model: "RAV4 Hybrid",
    year: 2023,
    pricePerMonthCHF: 590,
    remainingMonths: 27,
    location: "Winterthur, ZH",
    mileageKm: 7400,
    fuel: "Hybrid",
    gearbox: "Automatik",
    body: "SUV",
    premium: false,
    imageUrl: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=600&fit=crop&crop=center&fm=webp&q=75",
    images: ["https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=600&fit=crop&crop=center&fm=webp&q=75"]
  },
  {
    id: "8",
    user_id: "mock-user-8",
    brand: "Mini",
    model: "Cooper S Cabrio",
    year: 2022,
    pricePerMonthCHF: 650,
    remainingMonths: 9,
    location: "Lausanne, VD",
    mileageKm: 19600,
    fuel: "Benzin",
    gearbox: "Automatik",
    body: "Cabrio",
    premium: false,
    imageUrl: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop&crop=center&fm=webp&q=75",
    images: ["https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop&crop=center&fm=webp&q=75"]
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

export const cantons = [
  { value: "AG", label: "Aargau" },
  { value: "AI", label: "Appenzell Innerrhoden" },
  { value: "AR", label: "Appenzell Ausserrhoden" },
  { value: "BE", label: "Bern" },
  { value: "BL", label: "Basel-Landschaft" },
  { value: "BS", label: "Basel-Stadt" },
  { value: "FR", label: "Freiburg" },
  { value: "GE", label: "Genf" },
  { value: "GL", label: "Glarus" },
  { value: "GR", label: "Graubünden" },
  { value: "JU", label: "Jura" },
  { value: "LU", label: "Luzern" },
  { value: "NE", label: "Neuenburg" },
  { value: "NW", label: "Nidwalden" },
  { value: "OW", label: "Obwalden" },
  { value: "SG", label: "St. Gallen" },
  { value: "SH", label: "Schaffhausen" },
  { value: "SO", label: "Solothurn" },
  { value: "SZ", label: "Schwyz" },
  { value: "TG", label: "Thurgau" },
  { value: "TI", label: "Tessin" },
  { value: "UR", label: "Uri" },
  { value: "VD", label: "Waadt" },
  { value: "VS", label: "Wallis" },
  { value: "ZG", label: "Zug" },
  { value: "ZH", label: "Zürich" },
];