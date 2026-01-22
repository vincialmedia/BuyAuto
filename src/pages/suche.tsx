import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { searchListings } from "@/services/listingsService";
import { type SearchQuery, type SearchResult } from "@/lib/buyauto/search";
import { debounce } from "@/lib/utils";
import VerticalResultsList from "@/components/buyauto/search/VerticalResultsList";

// Dynamically import the filter bar to reduce initial bundle size on mobile
const DynamicFilterBar = dynamic(() => import("@/components/buyauto/search/DynamicFilterBar"), {
  ssr: true, // Still render on server for SEO
  loading: () => (
    <div className="h-16 bg-white border-b border-neutral-200 animate-pulse" />
  ),
});

export default function SearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState<SearchQuery>({});
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterBarSticky, setFilterBarSticky] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const parseQueryFromUrl = useCallback((query: any): SearchQuery => {
    const newQuery: SearchQuery = {};
    if (query.brand) newQuery.brand = query.brand as string;
    if (query.model) newQuery.model = query.model as string;
    if (query.yearMin) newQuery.yearMin = parseInt(query.yearMin as string);
    if (query.priceMin) newQuery.priceMin = parseInt(query.priceMin as string);
    if (query.priceMax) newQuery.priceMax = parseInt(query.priceMax as string);
    if (query.monthsMin) newQuery.monthsMin = parseInt(query.monthsMin as string);
    if (query.monthsMax) newQuery.monthsMax = parseInt(query.monthsMax as string);
    if (query.kmMax) newQuery.kmMax = parseInt(query.kmMax as string);
    if (query.page) newQuery.page = parseInt(query.page as string);
    if (query.sort) newQuery.sort = query.sort as SearchQuery["sort"];
    if (query.body) newQuery.body = Array.isArray(query.body) ? query.body : [query.body];
    if (query.fuel) newQuery.fuel = Array.isArray(query.fuel) ? query.fuel : [query.fuel];
    if (query.gearbox) newQuery.gearbox = Array.isArray(query.gearbox) ? query.gearbox : [query.gearbox];
    if (query.canton) newQuery.canton = Array.isArray(query.canton) ? query.canton : [query.canton];
    if (query.noDeposit) newQuery.noDeposit = query.noDeposit === "true";
    if (query.premiumOnly) newQuery.premiumOnly = query.premiumOnly === "true";

    const dealType = query.dealType;
    if (dealType === "lease_takeover" || dealType === "direct_purchase") {
      newQuery.dealType = dealType;

      const financingType = query.financingType;
      if (dealType === "direct_purchase" && (financingType === "cash" || financingType === "leasing")) {
        newQuery.financingType = financingType;
      }
    }

    return newQuery;
  }, []);

  const buildUrlQuery = useCallback((query: SearchQuery) => {
    const urlQuery: any = {};
    for (const key in query) {
      const value = query[key as keyof SearchQuery];
      if (value !== undefined && value !== null && (Array.isArray(value) ? value.length > 0 : value !== '')) {
        urlQuery[key] = value;
      }
    }
    return urlQuery;
  }, []);

  const debouncedUpdateUrl = useCallback(
    debounce((newSearchQuery: SearchQuery) => {
      const urlQuery = buildUrlQuery(newSearchQuery);
      router.push({ pathname: router.pathname, query: urlQuery }, undefined, { shallow: true });
    }, 300),
    [router, buildUrlQuery]
  );

  const handleSearchQueryChange = useCallback((newSearchQuery: SearchQuery) => {
    const queryWithPageReset = { ...newSearchQuery, page: 1 };
    setSearchQuery(queryWithPageReset);
    debouncedUpdateUrl(queryWithPageReset);
  }, [debouncedUpdateUrl]);
  
  const handlePageChange = useCallback((page: number) => {
    const newQuery = { ...searchQuery, page };
    setSearchQuery(newQuery);
    router.push({ pathname: router.pathname, query: buildUrlQuery(newQuery) }, undefined, { shallow: true, scroll: false });
    
    // Smooth scroll to top with offset for sticky header
    const headerOffset = 100;
    const elementPosition = 0;
    const offsetPosition = elementPosition - headerOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }, [searchQuery, router, buildUrlQuery]);

  const handleResetFilters = useCallback(() => {
    const resetQuery: SearchQuery = { page: 1 };
    setSearchQuery(resetQuery);
    router.push({ pathname: router.pathname, query: {} }, undefined, { shallow: true });
  }, [router]);

  useEffect(() => {
    if (router.isReady && !isInitialized) {
      const parsedQuery = parseQueryFromUrl(router.query);
      setSearchQuery(parsedQuery);
      setIsInitialized(true);
    }
  }, [router.isReady, isInitialized, parseQueryFromUrl]);

  useEffect(() => {
    if (!isInitialized) return;
    
    const performSearch = async () => {
      setIsLoading(true);
      try {
        const results = await searchListings(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults({ items: [], total: 0, page: searchQuery.page || 1, pageSize: 12 });
      } finally {
        setIsLoading(false);
      }
    };
    
    performSearch();
  }, [searchQuery, isInitialized]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollThreshold = 80;
      setFilterBarSticky(window.scrollY > scrollThreshold);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const totalResults = searchResults?.total || 0;
  const currentPage = searchResults?.page || 1;
  const totalPages = Math.ceil(totalResults / (searchResults?.pageSize || 12));
  const pageTitle = totalResults > 0 ? `Auto Leasingübernahme – ${totalResults} Fahrzeuge gefunden | BuyAuto Schweiz` : "Auto Leasingübernahme – Fahrzeuge suchen | BuyAuto Schweiz";
  const metaDescription = "Leasingübernahme in der Schweiz leicht gemacht: Finde bestehende Leasingverträge, sichere dir starke Deals und wechsle dein Auto stressfrei mit BuyAuto.";

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
        "position": (currentPage - 1) * 12 + index + 1,
        "item": {
          "@type": "Car",
          "name": `${listing.brand} ${listing.model}`,
          "brand": { "@type": "Brand", "name": listing.brand },
          "model": listing.model,
          "vehicleModelDate": listing.year,
          "mileageFromOdometer": { "@type": "QuantitativeValue", "value": listing.mileageKm, "unitCode": "KMT" },
          "fuelType": listing.fuel,
          "vehicleTransmission": listing.gearbox,
          "offers": {
            "@type": "Offer",
            "price": listing.pricePerMonthCHF,
            "priceCurrency": "CHF",
            "priceSpecification": { "@type": "UnitPriceSpecification", "price": listing.pricePerMonthCHF, "priceCurrency": "CHF", "unitText": "MONTH" }
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
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <link rel="canonical" href={`https://buyauto.ch${router.asPath.split('?')[0]}`} />
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
        {/* Filter Bar - Sticky behavior */}
        <div className={`transition-all duration-300 ${filterBarSticky ? 'fixed top-0 left-0 right-0 z-50 shadow-lg' : 'relative z-40'}`}>
          <DynamicFilterBar
            searchQuery={searchQuery}
            onSearchQueryChange={handleSearchQueryChange}
          />
        </div>

        {/* Main Content */}
        <main className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`${filterBarSticky ? 'pt-24' : 'pt-8'} pb-16 transition-all duration-300`}>
            {/* Results Header */}
            {!isLoading && searchResults && (
              <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-2">
                  {totalResults > 0 ? (
                    <>Deine Fahrzeuge</>
                  ) : (
                    <>Keine Ergebnisse</>
                  )}
                </h1>
                <p className="text-sm text-neutral-600">
                  {totalResults > 0 ? (
                    <>
                      <span className="font-semibold text-neutral-900">{totalResults.toLocaleString()}</span> {totalResults === 1 ? 'Fahrzeug' : 'Fahrzeuge'} verfügbar
                      {currentPage > 1 && <span className="text-neutral-400 mx-2">·</span>}
                      {currentPage > 1 && `Seite ${currentPage} von ${totalPages}`}
                    </>
                  ) : (
                    <>Passe deine Filter an, um Ergebnisse zu sehen</>
                  )}
                </p>
                
                {/* Subtle divider */}
                <div className="mt-4 h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent"></div>
              </div>
            )}
            
            {/* Results List */}
            <VerticalResultsList
              listings={searchResults?.items || []}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              isLoading={isLoading}
              totalResults={totalResults}
              onClearFilters={handleResetFilters}
            />
          </div>
        </main>
      </div>
    </>
  );
}
