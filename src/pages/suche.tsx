
import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { searchListings, parseQueryFromUrl, type SearchQuery, type SearchResult } from "@/lib/buyauto/search";
import SearchLayout from "@/components/buyauto/search/SearchLayout";
import Header from "@/components/buyauto/Header";

export default function SearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState<SearchQuery>({});
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filterBarSticky, setFilterBarSticky] = useState(false);

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
    // Reset to page 1 when filters change (except for pagination)
    const resetPageQuery = { ...newSearchQuery };
    if (!newSearchQuery.page) {
      resetPageQuery.page = 1;
    }
    
    setSearchQuery(resetPageQuery);
    debouncedUpdateUrl(resetPageQuery);
  }, [debouncedUpdateUrl]);

  // Handle page changes
  const handlePageChange = useCallback((page: number) => {
    const newQuery = { ...searchQuery, page };
    setSearchQuery(newQuery);
    
    // Immediately update URL for pagination
    const urlQuery = buildUrlQuery(newQuery);
    router.push(
      {
        pathname: router.pathname,
        query: urlQuery,
      },
      undefined,
      { shallow: true }
    );
  }, [searchQuery, router, buildUrlQuery]);

  // Handle reset filters
  const handleResetFilters = useCallback(() => {
    const resetQuery: SearchQuery = { page: 1 };
    setSearchQuery(resetQuery);
    router.push({
      pathname: router.pathname,
      query: {},
    }, undefined, { shallow: true });
  }, [router]);

  // Handle show all listings
  const handleShowAllListings = useCallback(() => {
    handleResetFilters();
  }, [handleResetFilters]);

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

  // Initial load: parse URL params and load results
  useEffect(() => {
    if (!router.isReady) return;
    
    // Parse URL query parameters
    const parsedQuery = parseQueryFromUrl(router.query);
    setSearchQuery(parsedQuery);
    
    // Immediately set loading state and perform search
    setIsLoading(true);
    const performInitialSearch = async () => {
      try {
        const results = await searchListings(parsedQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('Initial search failed:', error);
        setSearchResults({
          items: [],
          total: 0,
          page: parsedQuery.page || 1,
          pageSize: 12
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    performInitialSearch();
  }, [router.isReady, router.query, parseQueryFromUrl]);

  // Handle scroll for sticky filter bar
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setFilterBarSticky(scrollY > 120);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // SEO and meta information
  const totalResults = searchResults?.total || 0;
  const currentPage = searchResults?.page || 1;
  const totalPages = Math.ceil(totalResults / (searchResults?.pageSize || 12));

  const pageTitle = totalResults > 0 
    ? `Auto Leasingübernahme – ${totalResults} Fahrzeuge gefunden | BuyAuto Schweiz`
    : "Auto Leasingübernahme – Fahrzeuge suchen | BuyAuto Schweiz";

  const metaDescription = "Minimalistische Suche für Auto-Leasingübernahmen in der Schweiz. Finde dein nächstes Fahrzeug nach Preis, Marke und Restlaufzeit.";

  // Generate JSON-LD schema for search results
  const generateJsonLd = () => {
    if (!searchResults || searchResults.items.length === 0) return null;

    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "Auto Leasingübernahme Suchresultate",
      "description": metaDescription,
      "numberOfItems": totalResults,
      "itemListElement": searchResults.items.map((listing, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Car",
          "name": `${listing.brand} ${listing.model}`,
          "brand": listing.brand,
          "model": listing.model,
          "vehicleModelDate": listing.year,
          "mileageFromOdometer": listing.mileageKm,
          "fuelType": listing.fuel,
          "vehicleTransmission": listing.gearbox,
          "offers": {
            "@type": "Offer",
            "price": listing.pricePerMonthCHF,
            "priceCurrency": "CHF",
            "priceSpecification": {
              "@type": "UnitPriceSpecification",
              "price": listing.pricePerMonthCHF,
              "priceCurrency": "CHF",
              "unitText": "MONTH"
            }
          }
        }
      }))
    };
  };

  const jsonLd = generateJsonLd();

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={metaDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Open Graph */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="website" />
        
        {/* JSON-LD */}
        {jsonLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        )}
      </Head>

      {/* Swiss Clean Design - Minimal Layout */}
      <div className="min-h-screen bg-white">
        {/* Slim Header */}
        <Header />

        {/* Dynamic Filter Bar */}
        <DynamicFilterBar
          searchQuery={searchQuery}
          onSearchQueryChange={handleSearchQueryChange}
          className={filterBarSticky ? "fixed top-14 left-0 right-0 z-40" : "sticky top-14 z-40"}
        />

        {/* Main Content */}
        <main className="max-w-[2000px] mx-auto px-4 md:px-6 lg:px-8">
          {/* Content padding to account for fixed header and filter bar */}
          <div className={filterBarSticky ? "pt-20" : "pt-6"}>
            
            {/* Results Summary */}
            {!isLoading && searchResults && (
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-neutral-600">
                    {totalResults > 0 ? (
                      <>
                        <span className="font-semibold text-neutral-900">{totalResults.toLocaleString()}</span> Fahrzeuge gefunden
                        {currentPage > 1 && (
                          <span className="ml-2">– Seite {currentPage} von {totalPages}</span>
                        )}
                      </>
                    ) : (
                      "Keine Fahrzeuge gefunden"
                    )}
                  </div>
                </div>
                {/* Thin divider */}
                <div className="mt-3 h-px bg-gradient-to-r from-neutral-200 via-neutral-300 to-neutral-200"></div>
              </div>
            )}

            {/* Vertical Results List */}
            <div className="mb-12">
              <VerticalResultsList
                searchResults={searchResults}
                isLoading={isLoading}
                onResetFilters={handleResetFilters}
                onShowAllListings={handleShowAllListings}
              />
            </div>

            {/* Pagination */}
            {!isLoading && searchResults && totalPages > 1 && (
              <div className="pb-12">
                <MinimalPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}