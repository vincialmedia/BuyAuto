/** What the connector's tools read. Live implementation: ./liveData.ts; tests use fixtures. */
import type { SearchQuery, SearchResult } from "@/lib/buyauto/search";
import type { Listing, ListingDetail } from "@/lib/buyauto/types";

/** A search result item; the live source adds the stored canton code (listings_public.canton_code). */
export type ListingWithCanton = Listing & { canton_code?: string | null };

export interface ListingDataSource {
  /** Same contract as services/listingsService.searchListingsOrThrow; items may carry canton_code. */
  search(query: SearchQuery): Promise<SearchResult>;
  /** A published, unexpired listing, or null. Throws when the database fails. */
  getListing(id: string): Promise<ListingDetail | null>;
  /** Public garage name and microsite slug, or null. */
  getGarage(garageId: string): Promise<{ name: string | null; slug: string | null } | null>;
  /** Distinct listings.brand values of published listings. */
  liveBrands(): Promise<string[]>;
}
