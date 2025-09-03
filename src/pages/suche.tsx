
import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { searchListings, type SearchQuery, type SearchResult } from "@/lib/buyauto/search";
import Header from "@/components/buyauto/Header";
import { debounce } from "@/lib/utils";
import DynamicFilterBar from "@/components/buyauto/search/DynamicFilterBar";
import VerticalResultsList from "@/components/buyauto/search/VerticalResultsList";
import MinimalPagination from "@/components/buyauto/search/MinimalPagination";

export default function SearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState<SearchQuery>({});
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterBarSticky, setFilterBarSticky] = useState(false);

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
    router.push({ pathname: router.pathname, query: buildUrlQuery(newQuery) }, undefined, { shallow: true, scroll: true });
  }, [searchQuery, router, buildUrlQuery]);

  const handleResetFilters = useCallback(() => {
    const resetQuery: SearchQuery = { page: 1 };
    setSearchQuery(resetQuery);
    router.push({ pathname: router.pathname, query: {} }, undefined, { shallow: true });
  }, [router]);

  useEffect(() => {
    if (router.isReady) {
      const parsedQuery = parseQueryFromUrl(router.query);
      setSearchQuery(parsedQuery);
    }
  }, [router.isReady, router.query, parseQueryFromUrl]);

  useEffect(() => {
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
    if (router.isReady) {
        performSearch();
    }
  }, [searchQuery, router.isReady]);

  useEffect(() => {
    const handleScroll = () => setFilterBarSticky(window.scrollY > 120);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const totalResults = searchResults?.total || 0;
  const currentPage = searchResults?.page || 1;
  const totalPages = Math.ceil(totalResults / (searchResults?.pageSize || 12));
  const pageTitle = totalResults > 0 ? `Auto Leasingübernahme – ${totalResults} Fahrzeuge gefunden | BuyAuto Schweiz` : "Auto Leasingübernahme – Fahrzeuge suchen | BuyAuto Schweiz";
  const metaDescription = "Minimalistische Suche für Auto-Leasingübernahmen in der Schweiz. Finde dein nächstes Fahrzeug nach Preis, Marke und Restlaufzeit.";

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
        {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
      </Head>

      <div className="min-h-screen bg-white">
        <Header />

        <DynamicFilterBar
          searchQuery={searchQuery}
          onSearchQueryChange={handleSearchQueryChange}
          className={filterBarSticky ? "fixed top-14 left-0 right-0 z-40" : "sticky top-14 z-40"}
        />

        <main className="max-w-[2000px] mx-auto px-4 md:px-6 lg:px-8">
          <div className={filterBarSticky ? "pt-28" : "pt-6"}>
            {!isLoading && searchResults && (
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-neutral-600">
                    {totalResults > 0 ? (
                      <><span className="font-semibold text-neutral-900">{totalResults.toLocaleString()}</span> Fahrzeuge gefunden {currentPage > 1 && `– Seite ${currentPage} von ${totalPages}`}</>
                    ) : ( "Keine Fahrzeuge gefunden" )}
                  </div>
                </div>
                <div className="mt-3 h-px bg-gradient-to-r from-neutral-200 via-neutral-300 to-neutral-200"></div>
              </div>
            )}
            
            <VerticalResultsList
              searchResults={searchResults}
              isLoading={isLoading}
              onResetFilters={handleResetFilters}
              onShowAllListings={handleResetFilters}
            />

            {!isLoading && searchResults && totalPages > 1 && (
              <div className="py-12">
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
