/**
 * Shared search contract types.
 *
 * This module used to also ship a ~200-line in-memory demo search engine
 * (getDemoListings + a second `searchListings` over randomly generated cars with
 * Unsplash images, plus formatPrice/formatMileage/getBrandModels/getAllBrands/
 * getAllCantons). It was scaffolding from before the Supabase-backed search
 * existed, and its `searchListings` export collided by name with the real one in
 * services/listingsService — importing from the wrong module silently returned
 * fake cars. Its only consumers were the legacy search UI cluster, which has been
 * removed; the live search is services/listingsService.searchListings.
 */
import { Listing } from "./types";

export interface SearchQuery {
  page?: number;
  query?: string;
  brand?: string;
  model?: string;
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  kmMax?: number;
  monthsMin?: number;
  monthsMax?: number;
  monthlyOnly?: boolean;
  canton?: string[];
  fuel?: string[];
  gearbox?: string[];
  body?: string[];
  noDeposit?: boolean;
  premiumOnly?: boolean;
  sort?: "relevance" | "priceAsc" | "priceDesc" | "yearDesc" | "monthsAsc" | "monthsDesc" | "kmAsc" | "dateDesc";
  dealType?: "lease_takeover" | "direct_purchase";
  financingType?: "cash" | "leasing";
  garageId?: string;
}

export type SearchResult = {
  items: Listing[];
  total: number;
  page: number;
  pageSize: number;
};
