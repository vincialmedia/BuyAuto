/** What the connector's tools read. Live implementation: ./liveData.ts; tests use fixtures. */
import type { SearchQuery, SearchResult } from "@/lib/buyauto/search";
import type { ListingDetail } from "@/lib/buyauto/types";

export interface ListingDataSource {
  /** Same contract as services/listingsService.searchListingsOrThrow. */
  search(query: SearchQuery): Promise<SearchResult>;
  /** A published, unexpired listing, or null. Throws when the database fails. */
  getListing(id: string): Promise<ListingDetail | null>;
  /** Public garage name and microsite slug, or null. */
  getGarage(garageId: string): Promise<{ name: string | null; slug: string | null } | null>;
  /** Distinct listings.brand values of published listings. */
  liveBrands(): Promise<string[]>;
}
