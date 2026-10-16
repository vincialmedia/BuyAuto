import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { searchListings, searchListingsOrThrow } from "@/services/listingsService";
import { type SearchQuery, type SearchResult } from "@/lib/buyauto/search";
import { buildListingHref } from "@/lib/buyauto/listingUrl";
import { debounce } from "@/lib/utils";
import VerticalResultsList from "@/components/buyauto/search/VerticalResultsList";
import { safeFreeText, track } from "@/lib/analytics";
import { kaufartOf } from "@/lib/buyauto/kaufart";
import { pluralize } from "@/lib/buyauto/format";

const DynamicFilterBar = dynamic(() => import("@/components/buyauto/search/DynamicFilterBar"), {
  ssr: true,
  loading: () => (
    <div className="h-16 bg-white border-b border-neutral-200 animate-pulse" />
  ),
});

const CANONICAL_SEARCH_URL = "https://www.buyauto.ch/suche";

/**
 * The Direktkauf view (?dealType=direct_purchase) is indexable from one full results
 * page of live offers. Below that it is a thin car-buying page next to the
 * Leasingübernahme focus, so it renders noindex, follow without a canonical, like a
 * brand page under its threshold.
 */
const DIRECT_PURCHASE_MIN_INDEXABLE_LISTINGS = 12;

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
  if (query.variant) newQuery.variant = query.variant as string;
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

// The bare /suche (page 1, no filters/sort/search term): every offer of both Kaufarten,
// with its own title/H1/meta.
function isDefaultSearchQuery(q: SearchQuery): boolean {
  if (q.page && q.page > 1) return false;
  if (q.sort) return false;
  if (q.query && q.query.trim() !== "") return false;
  if (q.brand || q.model || q.variant) return false;
  if (q.dealType || q.financingType) return false;
  if (q.yearMin || q.yearMax || q.priceMin || q.priceMax || q.kmMax || q.monthsMin || q.monthsMax) return false;
  if (q.monthlyOnly || q.noDeposit || q.premiumOnly) return false;
  if ((q.canton && q.canton.length) || (q.fuel && q.fuel.length) || (q.gearbox && q.gearbox.length) || (q.body && q.body.length)) return false;
  return true;
}

// A single dealType filter (e.g. /suche?dealType=lease_takeover) with nothing else set.
// These are the category views; the Leasingübernahme one is the offer hub.
function isSingleDealTypeQuery(q: SearchQuery): boolean {
  if (q.dealType !== "lease_takeover" && q.dealType !== "direct_purchase") return false;
  if (q.financingType) return false;
  if (q.page && q.page > 1) return false;
  if (q.sort) return false;
  if (q.query && q.query.trim() !== "") return false;
  if (q.brand || q.model || q.variant) return false;
  if (q.yearMin || q.yearMax || q.priceMin || q.priceMax || q.kmMax || q.monthsMin || q.monthsMax) return false;
  if (q.monthlyOnly || q.noDeposit || q.premiumOnly) return false;
  if ((q.canton && q.canton.length) || (q.fuel && q.fuel.length) || (q.gearbox && q.gearbox.length) || (q.body && q.body.length)) return false;
  return true;
}

// Views rendered on the server and cached at the CDN: the bare /suche and the single
// dealType views. Everything else (extra filters, sort, pagination, free-text search)
// loads in the browser.
function isServerRenderedSearchQuery(q: SearchQuery): boolean {
  return isDefaultSearchQuery(q) || isSingleDealTypeQuery(q);
}

/**
 * Whether a view may be indexed (self-canonical) or renders noindex, follow without a
 * canonical. `total` is the live result count, null while unknown.
 * - Leasingübernahme hub: indexable while it has offers (an empty hub is a soft 404).
 * - Direktkauf view: indexable from DIRECT_PURCHASE_MIN_INDEXABLE_LISTINGS offers.
 * - The bare /suche lists the hub's offers again plus Direktkauf, so it is a search
 *   tool, not a landing page: noindex, follow like every filtered view.
 */
function isIndexedSearchView(q: SearchQuery, total: number | null): boolean {
  if (!isSingleDealTypeQuery(q)) return false;
  if (q.dealType === "direct_purchase") return total !== null && total >= DIRECT_PURCHASE_MIN_INDEXABLE_LISTINGS;
  // Unknown total (the 503 path renders without results): no canonical on that HTML.
  return total !== null && total > 0;
}

// Self-referencing canonical of an indexed view (only single dealType views are indexed).
function canonicalUrlForQuery(q: SearchQuery): string {
  return `${CANONICAL_SEARCH_URL}?dealType=${q.dealType}`;
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

  // GA4 search: once per distinct query string, when its results are in.
  const lastReportedSearchKey = useRef<string | null>(null);
  const initialResultsRef = useRef(initialResults);
  const reportSearch = useCallback(
    (query: SearchQuery, results: SearchResult) => {
      const key = JSON.stringify(buildUrlQuery(query));
      if (key === lastReportedSearchKey.current) return;
      lastReportedSearchKey.current = key;
      track("search", {
        search_term: safeFreeText(query.query),
        deal_type: query.dealType,
        results_count: results.total ?? 0,
        page: results.page || query.page || 1,
      });
    },
    [buildUrlQuery]
  );

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
      if (initialResultsRef.current) reportSearch(searchQuery, initialResultsRef.current);
      return;
    }

    const performSearch = async () => {
      setIsLoading(true);
      try {
        const results = await searchListings(searchQuery);
        setSearchResults(results);
        reportSearch(searchQuery, results);
      } catch (error) {
        console.error("Search failed:", error);
        setSearchResults({ items: [], total: 0, page: searchQuery.page || 1, pageSize: 12 });
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [searchQuery, isInitialized, buildUrlQuery, initialQueryKey, reportSearch]);

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

  const isDefaultView = useMemo(() => isDefaultSearchQuery(searchQuery), [searchQuery]);
  const isHubView = useMemo(
    () => isSingleDealTypeQuery(searchQuery) && searchQuery.dealType === "lease_takeover",
    [searchQuery]
  );
  const isIndexed = isIndexedSearchView(searchQuery, searchResults ? totalResults : null);
  const saleTypeLabel = useMemo(() => getSaleTypeLabel(searchQuery), [searchQuery]);

  const heading = useMemo(() => {
    if (isDefaultView) return "Alle Angebote: Leasingübernahmen und Direktkauf";
    if (saleTypeLabel === "Leasingübernahme") return "Leasingübernahme-Angebote in der Schweiz";
    if (saleTypeLabel === "Direktkauf") return "Autos zum Direktkauf";
    if (saleTypeLabel === "Leasing") return "Leasing-Angebote in der Schweiz";
    return "Fahrzeuge in der Schweiz";
  }, [isDefaultView, saleTypeLabel]);

  const pageTitle = isDefaultView
    ? "Alle Angebote: Leasingübernahmen und Direktkauf | BuyAuto"
    : saleTypeLabel === "Leasingübernahme"
      ? searchResults
        ? `Leasingübernahme-Angebote: ${totalResults} ${pluralize(totalResults, "Auto", "Autos")} zur Übernahme | BuyAuto`
        : "Leasingübernahme-Angebote in der Schweiz | BuyAuto"
      : saleTypeLabel === "Direktkauf"
        ? totalResults > 0
          ? `Autos zum Direktkauf: ${totalResults} ${pluralize(totalResults, "Angebot", "Angebote")} | BuyAuto`
          : "Autos zum Direktkauf | BuyAuto"
        : totalResults > 0
          ? `${saleTypeLabel} – ${totalResults} ${pluralize(totalResults, "Fahrzeug", "Fahrzeuge")} gefunden | BuyAuto Schweiz`
          : `${saleTypeLabel} – Fahrzeuge suchen | BuyAuto Schweiz`;

  // Counts only from the live result; while it is unknown the sentence goes without one.
  const takeoverOffersLabel =
    searchResults && totalResults > 0
      ? `${totalResults} ${pluralize(totalResults, "laufender Leasingvertrag", "laufende Leasingverträge")}`
      : "Laufende Leasingverträge";

  const metaDescription = isDefaultView
    ? "Alle Inserate auf BuyAuto: laufende Leasingverträge zur Übernahme und Autos zum Direktkauf in der Schweiz."
    : saleTypeLabel === "Leasingübernahme"
      ? `${takeoverOffersLabel} zur Übernahme in der Schweiz. Vergleiche Monatsrate und Restlaufzeit und melde dich direkt beim Anbieter.`
      : saleTypeLabel === "Leasing"
        ? "Leasing in der Schweiz: Entdecke Fahrzeuge mit aktivem Leasing-Angebot von privaten Anbietern und Garagen – transparent, schnell und direkt über BuyAuto."
        : saleTypeLabel === "Direktkauf"
          ? "Autos zum Direktkauf auf BuyAuto: Inserate mit Kaufpreis in CHF, Kontakt direkt mit dem Anbieter."
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
        // Kaufart rule (lib/buyauto/kaufart), never the stored deal_type.
        const isDirectPurchase = kaufartOf(listing) === "direct_purchase";
        const priceCandidate = isDirectPurchase ? listing.purchasePriceCHF : listing.pricePerMonthCHF;
        const price = typeof priceCandidate === "number" && priceCandidate > 0 ? priceCandidate : null;

        const offer = price
          ? isDirectPurchase
            ? {
                // Direct purchase: a one-time sale price is correct at the top level.
                "@type": "Offer",
                "price": price,
                "priceCurrency": "CHF",
                "availability": "https://schema.org/InStock",
              }
            : {
                // Lease takeover: a recurring monthly rate — express via priceSpecification
                // only, never as a top-level Offer.price (which reads as a sale price).
                "@type": "Offer",
                "priceCurrency": "CHF",
                "availability": "https://schema.org/InStock",
                "priceSpecification": {
                  "@type": "UnitPriceSpecification",
                  "price": price,
                  "priceCurrency": "CHF",
                  "unitText": "MONTH",
                },
              }
          : undefined;

        const itemUrl = `https://www.buyauto.ch${buildListingHref({ id: listing.id, brand: listing.brand, model: listing.model })}`;

        return {
          "@type": "ListItem",
          "position": (currentPage - 1) * 12 + index + 1,
          "item": {
            "@type": "Car",
            "name": `${listing.brand} ${listing.model}`,
            "url": itemUrl,
            "brand": { "@type": "Brand", "name": listing.brand },
            "model": listing.model,
            "vehicleModelDate": listing.year,
            ...(listing.mileageKm
              ? { "mileageFromOdometer": { "@type": "QuantitativeValue", "value": listing.mileageKm, "unitCode": "KMT" } }
              : {}),
            ...(listing.fuel ? { "fuelType": listing.fuel } : {}),
            ...(listing.gearbox ? { "vehicleTransmission": listing.gearbox } : {}),
            ...(offer ? { "offers": offer } : {}),
          },
        };
      }),
    };
  };

  const jsonLd = isIndexed ? generateJsonLd() : null;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={metaDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        {isIndexed ? (
          <link rel="canonical" href={canonicalUrlForQuery(searchQuery)} />
        ) : (
          <meta name="robots" content="noindex,follow" />
        )}
        {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
        <div className={`transition-shadow duration-300 ${filterBarSticky ? "fixed top-0 left-0 right-0 z-50 shadow-lg" : "relative z-40"}`}>
          <DynamicFilterBar
            searchQuery={searchQuery}
            onSearchQueryChange={handleSearchQueryChange}
          />
        </div>

        <main className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`${filterBarSticky ? "pt-24" : "pt-8"} pb-16`}>
            {/* Stays mounted while isLoading (previous count / placeholder) so the
                results grid below doesn't shift ~110px on every search (CLS). */}
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-2">
                {!isLoading && searchResults && totalResults === 0 ? "Keine Ergebnisse" : heading}
              </h1>
              <p className="text-sm text-neutral-600">
                {isLoading && !searchResults ? (
                  <>Fahrzeuge werden geladen…</>
                ) : totalResults > 0 ? (
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

            <VerticalResultsList
              listings={searchResults?.items || []}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              isLoading={isLoading}
              totalResults={totalResults}
              onClearFilters={handleResetFilters}
            />

            {/* Server-rendered links on to the guides, on the hub only. The anchors name
                each guide's own topic; the head term belongs to the home page. */}
            {isHubView && (
              <section className="mt-12 border-t border-neutral-200 pt-8">
                <h2 className="text-lg font-bold text-neutral-900 mb-3">
                  Mehr zur Leasingübernahme in der Schweiz
                </h2>
                <p className="text-sm text-neutral-600 mb-4 max-w-2xl">
                  Neu beim Thema? Im Ratgeber erfährst du Schritt für Schritt, wie eine
                  Leasingübernahme abläuft, was sie kostet und worauf du achten musst.
                </p>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                  <Link href="/leasinguebernahme" className="font-semibold text-primary hover:underline">
                    So funktioniert eine Leasingübernahme
                  </Link>
                  <Link href="/leasinguebernahme-kosten" className="text-primary hover:underline">
                    Was kostet eine Leasingübernahme?
                  </Link>
                  <Link href="/leasingvertrag-uebertragen" className="text-primary hover:underline">
                    Leasingvertrag übertragen (für Abgeber)
                  </Link>
                </div>
              </section>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<SearchPageProps> = async ({ query, res }) => {
  const initialQuery = parseSearchQueryFromParams(query as Record<string, string | string[] | undefined>);

  // The bare /suche and the single dealType views (incl. the Leasingübernahme hub) are
  // server-rendered, so crawlers get the listings and the robots decision in the initial
  // HTML. Filtered / paginated drill-downs stay client-fetched (noindex).
  if (!isServerRenderedSearchQuery(initialQuery)) {
    return { props: { initialResults: null, initialQuery } };
  }

  try {
    const results = await searchListingsOrThrow(initialQuery);
    // These views are the same for every visitor — let the CDN serve them.
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    // Strip any `undefined` fields so Next can serialize the props.
    const initialResults = JSON.parse(JSON.stringify(results)) as SearchResult;
    return { props: { initialResults, initialQuery } };
  } catch (error) {
    // Transient backend failure: 503 (retry later), never a cached "0 Autos" page.
    console.error("SSR /suche search failed:", error);
    res.statusCode = 503;
    res.setHeader("Retry-After", "120");
    res.setHeader("Cache-Control", "no-store");
    return { props: { initialResults: null, initialQuery } };
  }
};
