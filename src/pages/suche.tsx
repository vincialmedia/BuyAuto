import Head from "next/head";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { SearchQuery, SearchResult } from "@/lib/buyauto/search";
import { searchListings } from "@/services/listingsService";
import Header from "@/components/buyauto/Header";
import SearchLayout from "@/components/buyauto/search/SearchLayout";
import { debounce } from "@/lib/utils";

export default function SuchePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState<SearchQuery>({});
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Parse URL query params into SearchQuery
  const parseQueryFromUrl = useCallback((query: any): SearchQuery => {
    const searchQuery: SearchQuery = {};
    
    if (query.brand) searchQuery.brand = query.brand as string;
    if (query.model) searchQuery.model = query.model as string;
    if (query.yearMin) searchQuery.yearMin = parseInt(query.yearMin as string);
    if (query.priceMin) searchQuery.priceMin = parseInt(query.priceMin as string);
    if (query.priceMax) searchQuery.priceMax = parseInt(query.priceMax as string);
    if (query.monthsMin) searchQuery.monthsMin = parseInt(query.monthsMin as string);
    if (query.monthsMax) searchQuery.monthsMax = parseInt(query.monthsMax as string);
    if (query.kmMax) searchQuery.kmMax = parseInt(query.kmMax as string);
    if (query.page) searchQuery.page = parseInt(query.page as string);
    if (query.sort) searchQuery.sort = query.sort as SearchQuery["sort"];
    
    // Parse array filters
    if (query.body) {
      const values = Array.isArray(query.body) ? query.body : [query.body];
      searchQuery.body = values as ("Limousine" | "Kombi" | "SUV" | "Cabrio")[];
    }
    if (query.fuel) {
      const values = Array.isArray(query.fuel) ? query.fuel : [query.fuel];
      searchQuery.fuel = values as ("Benzin" | "Diesel" | "Hybrid" | "Elektro")[];
    }
    if (query.gearbox) {
      const values = Array.isArray(query.gearbox) ? query.gearbox : [query.gearbox];
      searchQuery.gearbox = values as ("Automatik" | "Manuell")[];
    }
    if (query.canton) {
      searchQuery.canton = Array.isArray(query.canton) ? query.canton as string[] : [query.canton as string];
    }
    
    // Parse boolean filters
    if (query.noDeposit) searchQuery.noDeposit = query.noDeposit === "true";
    if (query.premiumOnly) searchQuery.premiumOnly = query.premiumOnly === "true";
    
    return searchQuery;
  }, []);

  // Convert SearchQuery to URL query params
  const buildUrlQuery = useCallback((searchQuery: SearchQuery) => {
    const query: any = {};
    
    Object.entries(searchQuery).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          if (value.length > 0) {
            query[key] = value;
          }
        } else {
          query[key] = value.toString();
        }
      }
    });
    
    return query;
  }, []);

  // Debounced URL update function
  const debouncedUpdateUrl = useCallback(
    debounce((newSearchQuery: SearchQuery) => {
      const urlQuery = buildUrlQuery(newSearchQuery);
      router.push(
        {
          pathname: router.pathname,
          query: urlQuery,
        },
        undefined,
        { shallow: true }
      );
    }, 300),
    [router, buildUrlQuery]
  );

  // Handle filter changes from child components
  const handleSearchQueryChange = useCallback((newSearchQuery: SearchQuery) => {
    setSearchQuery(newSearchQuery);
    debouncedUpdateUrl(newSearchQuery);
  }, [debouncedUpdateUrl]);

  // Perform search when query changes
  useEffect(() => {
    const performSearch = async () => {
      setIsLoading(true);
      
      try {
        // Use real Supabase service
        const results = await searchListings(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('Search failed:', error);
        // Set empty results on error
        setSearchResults({
          items: [],
          total: 0,
          page: searchQuery.page || 1,
          pageSize: 12
        });
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [searchQuery]);

  // Initial load: parse URL params
  useEffect(() => {
    if (!router.isReady) return;
    
    const parsedQuery = parseQueryFromUrl(router.query);
    setSearchQuery(parsedQuery);
  }, [router.isReady, router.query, parseQueryFromUrl]);

  // Load all listings on first visit if no filters
  useEffect(() => {
    if (!router.isReady) return;
    
    // If there are no query parameters at all, perform an empty search to show all listings
    if (Object.keys(router.query).length === 0) {
      const emptyQuery: SearchQuery = {};
      setSearchQuery(emptyQuery);
    } else {
      const parsedQuery = parseQueryFromUrl(router.query);
      setSearchQuery(parsedQuery);
    }
  }, [router.isReady, router.query, parseQueryFromUrl]);

  const pageTitle = searchResults 
    ? `Fahrzeuge suchen (${searchResults.total} Treffer) | BuyAuto`
    : "Fahrzeuge suchen | Leasingübernahme Schweiz | BuyAuto";

  const metaDescription = "Durchstöbere aktuelle Leasingangebote und übernimm dein nächstes Auto-Leasing in der Schweiz – schnell und transparent.";

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={metaDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-white">
        <Header />
        
        <SearchLayout
          searchQuery={searchQuery}
          searchResults={searchResults}
          isLoading={isLoading}
          onSearchQueryChange={handleSearchQueryChange}
        />
      </div>
    </>
  );
}