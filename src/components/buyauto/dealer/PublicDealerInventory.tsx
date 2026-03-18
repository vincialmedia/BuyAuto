"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SearchQuery, SearchResult } from "@/lib/buyauto/search";
import { searchDealerListings } from "@/services/listingsService";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

type SaleTypeOption = "all" | "lease_takeover" | "direct_purchase" | "leasing";

interface PublicDealerInventoryProps {
  garageId: string;
  className?: string;
  initialQuery?: Partial<SearchQuery> & { saleType?: string };
  embedId?: string;
}

function deriveSaleType(query: SearchQuery): SaleTypeOption {
  if (!query.dealType) return "all";
  if (query.dealType === "lease_takeover") return "lease_takeover";
  if (query.financingType === "leasing") return "leasing";
  return "direct_purchase";
}

function getSaleTypeLabel(option: SaleTypeOption): string {
  if (option === "lease_takeover") return "Leasingübernahme";
  if (option === "leasing") return "Leasing";
  if (option === "direct_purchase") return "Direktkauf";
  return "Alle";
}

function formatChf(value: number): string {
  return `CHF ${new Intl.NumberFormat("de-CH").format(value)}`;
}

function getCurrentYear(): number {
  return new Date().getFullYear();
}

function parseInitialSaleType(value: string | undefined): Partial<SearchQuery> {
  const v = (value || "").trim();
  if (v === "lease_takeover") return { dealType: "lease_takeover", financingType: undefined };
  if (v === "leasing") return { dealType: "direct_purchase", financingType: "leasing" };
  if (v === "direct_purchase") return { dealType: "direct_purchase", financingType: "cash" };
  if (v === "all") return { dealType: undefined, financingType: undefined };
  return {};
}

function postHeightToParent(embedId?: string) {
  if (typeof window === "undefined") return;
  if (window.top === window.self) return;

  const height = document.documentElement?.scrollHeight ?? document.body?.scrollHeight;
  if (typeof height !== "number" || !Number.isFinite(height)) return;

  window.parent.postMessage({ type: "BUY_AUTO_IFRAME_HEIGHT", height }, "*");

  if (embedId?.trim()) {
    window.parent.postMessage({ type: "buyauto:resize", id: embedId.trim(), height }, "*");
  }
}

export function PublicDealerInventory({ garageId, className, initialQuery, embedId }: PublicDealerInventoryProps) {
  const [query, setQuery] = useState<SearchQuery>(() => {
    const base: SearchQuery = {
      page: 1,
      sort: "dateDesc",
      ...(initialQuery || {}),
    };

    const saleTypePatch = parseInitialSaleType(initialQuery?.saleType);
    return { ...base, ...saleTypePatch };
  });

  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(true);

  const saleType = useMemo(() => deriveSaleType(query), [query.dealType, query.financingType]);
  const isMixed = saleType === "all";
  const isLeaseTakeover = saleType === "lease_takeover";
  const isDirectPurchase = saleType === "direct_purchase" || saleType === "leasing";

  const currentYear = getCurrentYear();
  const yearOptions = useMemo(() => Array.from({ length: currentYear - 1989 }, (_, i) => currentYear + 1 - i), [currentYear]);

  const monthlyPriceOptions = useMemo(() => Array.from({ length: 50 }, (_, i) => (i + 1) * 100), []);
  const purchasePriceOptions = useMemo(() => Array.from({ length: 60 }, (_, i) => (i + 1) * 5000), []);
  const priceOptions = isDirectPurchase ? purchasePriceOptions : monthlyPriceOptions;

  const priceMinPlaceholder = isDirectPurchase ? "Min. Kaufpreis" : "Min. Rate";
  const priceMaxPlaceholder = isDirectPurchase ? "Max. Kaufpreis" : "Max. Rate";

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      const next = await searchDealerListings(garageId, query);
      if (cancelled) return;
      setResults(next);
      setLoading(false);

      requestAnimationFrame(() => {
        postHeightToParent(embedId);
      });
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [garageId, query, embedId]);

  useEffect(() => {
    postHeightToParent(embedId);
    const onResize = () => postHeightToParent(embedId);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [embedId]);

  const total = results?.total ?? 0;
  const page = results?.page ?? query.page ?? 1;
  const pageSize = results?.pageSize ?? 12;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const setQuerySafe = (next: SearchQuery) => {
    setQuery({
      ...next,
      page: next.page ?? 1,
    });
  };

  const handleSaleTypeChange = (value: string | undefined) => {
    const option = (value ?? "all") as SaleTypeOption;

    if (option === "all") {
      setQuerySafe({
        ...query,
        dealType: undefined,
        financingType: undefined,
        monthsMin: undefined,
        monthsMax: undefined,
        priceMin: undefined,
        priceMax: undefined,
        page: 1,
      });
      return;
    }

    if (option === "lease_takeover") {
      setQuerySafe({
        ...query,
        dealType: "lease_takeover",
        financingType: undefined,
        priceMin: undefined,
        priceMax: undefined,
        page: 1,
      });
      return;
    }

    if (option === "leasing") {
      setQuerySafe({
        ...query,
        dealType: "direct_purchase",
        financingType: "leasing",
        monthsMin: undefined,
        monthsMax: undefined,
        priceMin: undefined,
        priceMax: undefined,
        page: 1,
      });
      return;
    }

    setQuerySafe({
      ...query,
      dealType: "direct_purchase",
      financingType: "cash",
      monthsMin: undefined,
      monthsMax: undefined,
      priceMin: undefined,
      priceMax: undefined,
      page: 1,
    });
  };

  const handleYearChange = (year: string | undefined) => {
    const yearAsNumber = year === "all" ? undefined : (year ? parseInt(year, 10) : undefined);
    setQuerySafe({ ...query, yearMin: yearAsNumber, page: 1 });
  };

  const handlePriceChange = (value: string | undefined, type: "min" | "max") => {
    if (isMixed) return;

    const priceAsNumber = value === "all" ? undefined : (value ? parseInt(value, 10) : undefined);
    const next: SearchQuery = { ...query, page: 1 };
    if (type === "min") next.priceMin = priceAsNumber;
    else next.priceMax = priceAsNumber;
    setQuerySafe(next);
  };

  const handleMonthsMaxChange = (value: string | undefined) => {
    if (!isLeaseTakeover) return;
    setQuerySafe({ ...query, monthsMax: value === "all" ? undefined : parseInt(value ?? "", 10), page: 1 });
  };

  const handleSortChange = (value: string | undefined) => {
    setQuerySafe({ ...query, sort: (value as SearchQuery["sort"]) ?? "dateDesc", page: 1 });
  };

  const goToPage = (nextPage: number) => {
    const p = Math.min(Math.max(1, nextPage), totalPages);
    setQuerySafe({ ...query, page: p });
  };

  return (
    <section className={cn("rounded-3xl border border-neutral-200 bg-white shadow-lg", className)}>
      <div className="border-b border-neutral-200 px-6 py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-neutral-900">Fahrzeuge im Angebot</h2>
            <p className="mt-1 text-sm text-neutral-600">
              {loading ? "Lade Fahrzeuge…" : total > 0 ? `${total.toLocaleString("de-CH")} Fahrzeuge` : "Aktuell keine Fahrzeuge verfügbar"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={saleType} onValueChange={handleSaleTypeChange}>
              <SelectTrigger className="h-9 w-[180px] rounded-2xl text-sm">
                <SelectValue placeholder="Alle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                <SelectItem value="lease_takeover">Leasingübernahme</SelectItem>
                <SelectItem value="direct_purchase">Direktkauf</SelectItem>
                <SelectItem value="leasing">Leasing</SelectItem>
              </SelectContent>
            </Select>

            <Select value={query.yearMin ? `${query.yearMin}` : "all"} onValueChange={handleYearChange}>
              <SelectTrigger className="h-9 w-[150px] rounded-2xl text-sm">
                <SelectValue placeholder="Jahr" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Jahre</SelectItem>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={`${y}`}>
                    ab {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={query.priceMin ? `${query.priceMin}` : "all"} onValueChange={(v) => handlePriceChange(v, "min")} disabled={isMixed}>
              <SelectTrigger className="h-9 w-[160px] rounded-2xl text-sm">
                <SelectValue placeholder={priceMinPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Kein Min.</SelectItem>
                {priceOptions.map((p) => (
                  <SelectItem key={p} value={`${p}`}>
                    {formatChf(p)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={query.priceMax ? `${query.priceMax}` : "all"} onValueChange={(v) => handlePriceChange(v, "max")} disabled={isMixed}>
              <SelectTrigger className="h-9 w-[160px] rounded-2xl text-sm">
                <SelectValue placeholder={priceMaxPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Kein Max.</SelectItem>
                {priceOptions.map((p) => (
                  <SelectItem key={p} value={`${p}`}>
                    {formatChf(p)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={isLeaseTakeover && query.monthsMax ? `${query.monthsMax}` : "all"} onValueChange={handleMonthsMaxChange} disabled={!isLeaseTakeover}>
              <SelectTrigger className="h-9 w-[170px] rounded-2xl text-sm">
                <SelectValue placeholder={isLeaseTakeover ? "Max. Laufzeit" : "Nur Leasingübernahme"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                <SelectItem value="6">bis 6 Mon.</SelectItem>
                <SelectItem value="12">bis 12 Mon.</SelectItem>
                <SelectItem value="24">bis 24 Mon.</SelectItem>
                <SelectItem value="36">bis 36 Mon.</SelectItem>
              </SelectContent>
            </Select>

            <Select value={query.sort ?? "dateDesc"} onValueChange={handleSortChange}>
              <SelectTrigger className="h-9 w-[160px] rounded-2xl text-sm">
                <SelectValue placeholder="Sortierung" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dateDesc">Neueste</SelectItem>
                <SelectItem value="yearDesc">Baujahr ↓</SelectItem>
                <SelectItem value="kmAsc">KM ↑</SelectItem>
                {!isMixed && (
                  <>
                    <SelectItem value="priceAsc">Preis ↑</SelectItem>
                    <SelectItem value="priceDesc">Preis ↓</SelectItem>
                  </>
                )}
                {isLeaseTakeover && (
                  <>
                    <SelectItem value="monthsAsc">Kurze Laufzeit</SelectItem>
                    <SelectItem value="monthsDesc">Lange Laufzeit</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>

            <Button variant="outline" className="h-9 rounded-2xl" onClick={() => setQuery({ page: 1, sort: "dateDesc" })}>
              Zurücksetzen
            </Button>
          </div>
        </div>

        {isMixed && (
          <p className="mt-3 text-xs text-neutral-500">
            Hinweis: Bei “Alle” werden verschiedene Preisarten gemischt; Preisfilter sind deshalb deaktiviert. Wähle eine Verkaufsart, um nach Preisen zu filtern.
          </p>
        )}
      </div>

      <div className="px-6 py-6">
        {loading && !results ? (
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Lade Fahrzeuge…
          </div>
        ) : null}

        {!loading && results && results.items.length === 0 ? (
          <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-10 text-center">
            <h3 className="text-base font-semibold text-neutral-900">Keine Fahrzeuge gefunden</h3>
            <p className="mt-2 text-sm text-neutral-600">Passe die Filter an oder setze sie zurück, um weitere Fahrzeuge zu sehen.</p>
          </div>
        ) : null}

        {results && results.items.length > 0 ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.items.map((listing) => {
                const href = `/fahrzeug/${listing.id}`;
                const priceLine =
                  listing.deal_type === "direct_purchase"
                    ? typeof listing.purchasePriceCHF === "number" && listing.purchasePriceCHF > 0
                      ? formatChf(listing.purchasePriceCHF)
                      : null
                    : typeof listing.pricePerMonthCHF === "number" && listing.pricePerMonthCHF > 0
                      ? `${formatChf(listing.pricePerMonthCHF)}/Monat`
                      : null;

                return (
                  <Link
                    key={listing.id}
                    href={href}
                    className="group overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className="aspect-[16/10] w-full bg-neutral-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={listing.imageUrl || "/buyauto-logo.png"}
                        alt={`${listing.brand} ${listing.model}`}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                        loading="lazy"
                      />
                    </div>

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-neutral-900">
                            {listing.brand} {listing.model}
                          </div>
                          <div className="mt-0.5 text-xs text-neutral-600">
                            {listing.year} • {listing.location}
                          </div>
                        </div>

                        {listing.premium ? (
                          <span className="rounded-full bg-neutral-900 px-2.5 py-1 text-[11px] font-semibold text-white">Premium</span>
                        ) : null}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-neutral-700">
                        <span className="rounded-full bg-neutral-100 px-2.5 py-1">{listing.fuel}</span>
                        <span className="rounded-full bg-neutral-100 px-2.5 py-1">{listing.gearbox}</span>
                        <span className="rounded-full bg-neutral-100 px-2.5 py-1">{listing.body}</span>
                      </div>

                      <div className="mt-4 flex items-end justify-between gap-3">
                        <div>
                          <div className="text-xs uppercase tracking-wide text-neutral-500">
                            {getSaleTypeLabel(deriveSaleType({ dealType: listing.deal_type, financingType: listing.financing_type ?? undefined }))}
                          </div>
                          <div className="mt-1 text-sm font-bold text-neutral-900">{priceLine ?? "Preis auf Anfrage"}</div>
                        </div>

                        <span className="text-sm font-semibold text-primary underline underline-offset-4">Details</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-neutral-200 pt-6 sm:flex-row">
              <div className="text-sm text-neutral-600">
                Seite <span className="font-semibold text-neutral-900">{page}</span> von{" "}
                <span className="font-semibold text-neutral-900">{totalPages}</span>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" className="h-9 rounded-2xl" onClick={() => goToPage(page - 1)} disabled={page <= 1}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Zurück
                </Button>
                <Button variant="outline" className="h-9 rounded-2xl" onClick={() => goToPage(page + 1)} disabled={page >= totalPages}>
                  Weiter
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}