import type { GetServerSideProps } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { searchListings } from "@/services/listingsService";
import { type SearchQuery, type SearchResult } from "@/lib/buyauto/search";
import { debounce } from "@/lib/utils";
import VerticalResultsList from "@/components/buyauto/search/VerticalResultsList";

const DynamicFilterBar = dynamic(() => import("@/components/buyauto/search/DynamicFilterBar"), {
  ssr: true,
  loading: () => (
    <div className="h-16 bg-white border-b border-neutral-200 animate-pulse" />
  ),
});

const CANONICAL_SEARCH_URL = "https://www.buyauto.ch/suche";

type SearchPageProps = {
  initialResults: SearchResult | null;
  initialQuery: SearchQuery;
};

// Shared, pure parser used by BOTH getServerSideProps (SSR) and the client so the
// server-rendered markup matches what the client hydrates.
function parseSearchQueryFromParams(query: Record<string, string | string[] | undefined>): SearchQuery {
  const newQuery: SearchQuery = {};
  if (query.query) newQuery.query = query.query as string;
  if (query.brand) newQuery.brand = query.brand as string;
  if (query.model) newQuery.model = query.model as string;
  if (query.yearMin) newQuery.yearMin = parseInt(query.yearMin as string, 10);
  if (query.yearMax) newQuery.yearMax = parseInt(query.yearMax as string, 10);
  if (query.priceMin) newQuery.priceMin = parseInt(query.priceMin as string, 10);
  if (query.priceMax) newQuery.priceMax = parseInt(query.priceMax as string, 10);
  if (query.monthsMin) newQuery.monthsMin = parseInt(query.monthsMin as string, 10);
  if (query.monthsMax) newQuery.monthsMax = parseInt(query.monthsMax as string, 10);
  if (query.kmMax) newQuery.kmMax = parseInt(query.kmMax as string, 10);
  if (query.page) newQuery.page = parseInt(query.page as string, 10);
  if (query.sort) newQuery.sort = query.sort as SearchQuery["sort"];
  if (query.body) newQuery.body = Array.isArray(query.body) ? query.body : [query.body];
  if (query.fuel) newQuery.fuel = Array.isArray(query.fuel) ? query.fuel : [query.fuel];
  if (query.gearbox) newQuery.gearbox = Array.isArray(query.gearbox) ? query.gearbox : [query.gearbox];
  if (query.canton) newQuery.canton = Array.isArray(query.canton) ? query.canton : [query.canton];
  if (query.noDeposit) newQuery.noDeposit = query.noDeposit === "true";
  if (query.premiumOnly) newQuery.premiumOnly = query.premiumOnly === "true";
  if (query.monthlyOnly) newQuery.monthlyOnly = query.monthlyOnly === "true";

  const dealType = query.dealType;
  if (dealType === "lease_takeover" || dealType === "direct_purchase") {
    newQuery.dealType = dealType;

    const financingType = query.financingType;
    if (dealType === "direct_purchase" && (financingType === "cash" || financingType === "leasing")) {
      newQuery.financingType = financingType;
    }
  }

  return newQuery;
}

// The bare /suche (page 1, no filters/sort/search term) is the single indexable view.
// Any filtered / sorted / paginated drill-down is a noindex,follow variant.
function isDefaultSearchQuery(q: SearchQuery): boolean {
  if (q.page && q.page > 1) return false;
  if (q.sort) return false;
  if (q.query && q.query.trim() !== "") return false;
  if (q.brand || q.model) return false;
  if (q.dealType || q.financingType) return false;
  if (q.yearMin || q.yearMax || q.priceMin || q.priceMax || q.kmMax || q.monthsMin || q.monthsMax) return false;
  if (q.monthlyOnly || q.noDeposit || q.premiumOnly) return false;
  if ((q.canton && q.canton.length) || (q.fuel && q.fuel.length) || (q.gearbox && q.gearbox.length) || (q.body && q.body.length)) return false;
  return true;
}

function getSaleTypeLabel(query: SearchQuery): string {
  if (!query.dealType) return "Fahrzeuge";
  if (query.dealType === "lease_takeover") return "Leasingübernahme";
  if (query.financingType === "leasing") return "Leasing";
  return "Direktkauf";
}

export default function SearchPage({ initialResults, initialQuery }: SearchPageProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState<SearchQuery>(initialQuery ?? {});
  const [searchResults, setSearchResults] = useState<SearchResult | null>(initialResults);
  const [isLoading, setIsLoading] = useState(!initialResults);
  const [filterBarSticky, setFilterBarSticky] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  // True until the SSR-provided results for the initial query have been consumed once,
  // so we don't immediately re-fetch the same default view on the client.
  const hydratedRef = useRef(Boolean(initialResults));

  const buildUrlQuery = useCallback((query: SearchQuery) => {
    const urlQuery: any = {};
    for (const key in query) {
      const value = query[key as keyof SearchQuery];

      if (key === "financingType" && (query.dealType ?? undefined) !== "direct_purchase") continue;
      if (key === "monthlyOnly" && value !== true) continue;

      if (value !== undefined && value !== null && (Array.isArray(value) ? value.length > 0 : value !== "")) {
        urlQuery[key] = value;
      }
    }
    return urlQuery;
  }, []);

  const initialQueryKey = useMemo(
    () => JSON.stringify(buildUrlQuery(initialQuery ?? {})),
    [buildUrlQuery, initialQuery]
  );

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

    const headerOffset = 100;
    window.scrollTo({
      top: 0 - headerOffset,
      behavior: "smooth",
    });
  }, [searchQuery, router, buildUrlQuery]);

  const handleResetFilters = useCallback(() => {
    const resetQuery: SearchQuery = {};
    setSearchQuery(resetQuery);
    router.push({ pathname: router.pathname, query: {} }, undefined, { shallow: true });
  }, [router]);

  useEffect(() => {
    if (router.isReady && !isInitialized) {
      const parsedQuery = parseSearchQueryFromParams(router.query as Record<string, string | string[] | undefined>);
      setSearchQuery(parsedQuery);
      setIsInitialized(true);
    }
  }, [router.isReady, isInitialized, router.query]);

  useEffect(() => {
    if (!isInitialized) return;

    // Skip exactly one fetch when the current query still matches the SSR-rendered
    // default view (results are already in state from getServerSideProps).
    const currentKey = JSON.stringify(buildUrlQuery(searchQuery));
    if (hydratedRef.current && currentKey === initialQueryKey) {
      hydratedRef.current = false;
      return;
    }

    const performSearch = async () => {
      setIsLoading(true);
      try {
        const results = await searchListings(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error("Search failed:", error);
        setSearchResults({ items: [], total: 0, page: searchQuery.page || 1, pageSize: 12 });
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [searchQuery, isInitialized, buildUrlQuery, initialQueryKey]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollThreshold = 80;
      setFilterBarSticky(window.scrollY > scrollThreshold);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const totalResults = searchResults?.total || 0;
  const currentPage = searchResults?.page || 1;
  const totalPages = Math.ceil(totalResults / (searchResults?.pageSize || 12));

  const isIndexableView = useMemo(() => isDefaultSearchQuery(searchQuery), [searchQuery]);
  const saleTypeLabel = useMemo(() => getSaleTypeLabel(searchQuery), [searchQuery]);

  const heading = useMemo(() => {
    if (isIndexableView) return "Autos kaufen & Leasingübernahmen in der Schweiz";
    if (saleTypeLabel === "Leasingübernahme") return "Leasingübernahme – Fahrzeuge in der Schweiz";
    if (saleTypeLabel === "Direktkauf") return "Autos kaufen in der Schweiz";
    if (saleTypeLabel === "Leasing") return "Leasing-Angebote in der Schweiz";
    return "Fahrzeuge in der Schweiz";
  }, [isIndexableView, saleTypeLabel]);

  const pageTitle = isIndexableView
    ? "Auto kaufen oder Leasing übernehmen in der Schweiz | BuyAuto"
    : totalResults > 0
      ? `${saleTypeLabel} – ${totalResults} Fahrzeuge gefunden | BuyAuto Schweiz`
      : `${saleTypeLabel} – Fahrzeuge suchen | BuyAuto Schweiz`;

  const metaDescription = isIndexableView
    ? "Entdecke aktuelle Fahrzeuge in der Schweiz – direkt kaufen oder einen laufenden Leasingvertrag übernehmen. Geprüfte Angebote von Privatpersonen und Garagen auf BuyAuto."
    : saleTypeLabel === "Leasingübernahme"
      ? "Leasingübernahme in der Schweiz leicht gemacht: Finde bestehende Leasingverträge, sichere dir starke Deals und wechsle dein Auto stressfrei mit BuyAuto."
      : saleTypeLabel === "Leasing"
        ? "Leasing in der Schweiz: Entdecke Fahrzeuge mit aktivem Leasing-Angebot von privaten Anbietern und Garagen – transparent, schnell und direkt über BuyAuto."
        : saleTypeLabel === "Direktkauf"
          ? "Direktkauf in der Schweiz: Finde Fahrzeuge von privaten Anbietern und Garagen – transparent, schnell und direkt über BuyAuto."
          : "Finde Fahrzeuge in der Schweiz: Leasingübernahme, Direktkauf und Leasing-Angebote – transparent, schnell und direkt über BuyAuto.";

  const generateJsonLd = () => {
    if (!searchResults || searchResults.items.length === 0) return null;

    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": `BuyAuto Suchresultate – ${saleTypeLabel}`,
      "description": metaDescription,
      "numberOfItems": totalResults,
      "itemListElement": searchResults.items.map((listing, index) => {
        const dealType = listing.deal_type ?? "lease_takeover";
        const isDirectPurchase = dealType === "direct_purchase";
        const priceCandidate = isDirectPurchase ? listing.purchasePriceCHF : listing.pricePerMonthCHF;
        const price = typeof priceCandidate === "number" && priceCandidate > 0 ? priceCandidate : null;

        const offer = price
          ? {
              "@type": "Offer",
              "price": price,
              "priceCurrency": "CHF",
              "availability": "https://schema.org/InStock",
              ...(isDirectPurchase
                ? {}
                : {
                    "priceSpecification": {
                      "@type": "UnitPriceSpecification",
                      "price": price,
                      "priceCurrency": "CHF",
                      "unitText": "MONTH",
                    },
                  }),
            }
          : undefined;

        return {
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
            ...(offer ? { "offers": offer } : {}),
          },
        };
      }),
    };
  };

  const jsonLd = isIndexableView ? generateJsonLd() : null;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={metaDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        {isIndexableView ? (
          <link rel="canonical" href={CANONICAL_SEARCH_URL} />
        ) : (
          <meta name="robots" content="noindex,follow" />
        )}
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
        <div className={`transition-all duration-300 ${filterBarSticky ? "fixed top-0 left-0 right-0 z-50 shadow-lg" : "relative z-40"}`}>
          <DynamicFilterBar
            searchQuery={searchQuery}
            onSearchQueryChange={handleSearchQueryChange}
          />
        </div>

        <main className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`${filterBarSticky ? "pt-24" : "pt-8"} pb-16 transition-all duration-300`}>
            {!isLoading && searchResults && (
              <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-2">
                  {totalResults > 0 ? heading : "Keine Ergebnisse"}
                </h1>
                <p className="text-sm text-neutral-600">
                  {totalResults > 0 ? (
                    <>
                      <span className="font-semibold text-neutral-900">{totalResults.toLocaleString()}</span> {totalResults === 1 ? "Fahrzeug" : "Fahrzeuge"} verfügbar
                      {currentPage > 1 && <span className="text-neutral-400 mx-2">·</span>}
                      {currentPage > 1 && `Seite ${currentPage} von ${totalPages}`}
                    </>
                  ) : (
                    <>Passe deine Filter an, um Ergebnisse zu sehen</>
                  )}
                </p>

                <div className="mt-4 h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent"></div>
              </div>
            )}

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

export const getServerSideProps: GetServerSideProps<SearchPageProps> = async ({ query }) => {
  const initialQuery = parseSearchQueryFromParams(query as Record<string, string | string[] | undefined>);

  // Only the bare default view is server-rendered for indexing. Filtered / paginated
  // drill-downs stay client-fetched (and are emitted as noindex,follow).
  if (!isDefaultSearchQuery(initialQuery)) {
    return { props: { initialResults: null, initialQuery } };
  }

  try {
    const results = await searchListings(initialQuery);
    // Strip any `undefined` fields so Next can serialize the props.
    const initialResults = JSON.parse(JSON.stringify(results)) as SearchResult;
    return { props: { initialResults, initialQuery } };
  } catch (error) {
    console.error("SSR /suche search failed:", error);
    return { props: { initialResults: null, initialQuery } };
  }
};
