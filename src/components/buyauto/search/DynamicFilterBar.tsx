"use client"

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { SearchQuery } from "@/lib/buyauto/search";
import { Filter, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getBrands, getModelsForBrand } from "@/services/listingsService";

interface DynamicFilterBarProps {
  searchQuery: SearchQuery;
  onSearchQueryChange: (query: SearchQuery) => void;
  className?: string;
}

type SaleTypeOption = "all" | "lease_takeover" | "direct_purchase" | "leasing";

type FilterChipKey =
  | "saleType"
  | "brand"
  | "model"
  | "yearMin"
  | "priceMin"
  | "priceMax"
  | "monthsMax";

interface FilterChip {
  key: FilterChipKey;
  label: string;
  value: string;
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

export default function DynamicFilterBar({
  searchQuery,
  onSearchQueryChange,
  className,
}: DynamicFilterBarProps) {
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const [brands, setBrands] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [loadingModels, setLoadingModels] = useState(false);

  const saleType = useMemo(() => deriveSaleType(searchQuery), [searchQuery.dealType, searchQuery.financingType]);
  const isMixed = saleType === "all";
  const isLeaseTakeover = saleType === "lease_takeover";
  const isDirectPurchase = saleType === "direct_purchase" || saleType === "leasing";

  const formatChf = (value: number) => `CHF ${new Intl.NumberFormat("de-CH").format(value)}`;

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: currentYear - 1989 }, (_, i) => currentYear + 1 - i);

  const monthlyPriceOptions = useMemo(() => Array.from({ length: 50 }, (_, i) => (i + 1) * 100), []);
  const purchasePriceOptions = useMemo(() => Array.from({ length: 60 }, (_, i) => (i + 1) * 5000), []);
  const priceOptions = isDirectPurchase ? purchasePriceOptions : monthlyPriceOptions;

  useEffect(() => {
    const fetchBrands = async () => {
      setLoadingBrands(true);
      try {
        const brandsData = await getBrands();
        setBrands(brandsData);
      } catch (error) {
        console.error("Error fetching brands:", error);
      } finally {
        setLoadingBrands(false);
      }
    };
    fetchBrands();
  }, []);

  useEffect(() => {
    if (searchQuery.brand) {
      const fetchModels = async () => {
        setLoadingModels(true);
        try {
          const modelsData = await getModelsForBrand(searchQuery.brand!);
          setModels(modelsData);
        } catch (error) {
          console.error("Error fetching models:", error);
        } finally {
          setLoadingModels(false);
        }
      };
      fetchModels();
    } else {
      setModels([]);
    }
  }, [searchQuery.brand]);

  const handleSaleTypeChange = (value: string | undefined) => {
    const option = (value ?? "all") as SaleTypeOption;

    if (option === "all") {
      onSearchQueryChange({
        ...searchQuery,
        dealType: undefined,
        financingType: undefined,
        monthsMin: undefined,
        monthsMax: undefined,
        priceMin: undefined,
        priceMax: undefined,
      });
      return;
    }

    if (option === "lease_takeover") {
      onSearchQueryChange({
        ...searchQuery,
        dealType: "lease_takeover",
        financingType: undefined,
        priceMin: undefined,
        priceMax: undefined,
      });
      return;
    }

    if (option === "leasing") {
      onSearchQueryChange({
        ...searchQuery,
        dealType: "direct_purchase",
        financingType: "leasing",
        monthsMin: undefined,
        monthsMax: undefined,
        priceMin: undefined,
        priceMax: undefined,
      });
      return;
    }

    onSearchQueryChange({
      ...searchQuery,
      dealType: "direct_purchase",
      financingType: "cash",
      monthsMin: undefined,
      monthsMax: undefined,
      priceMin: undefined,
      priceMax: undefined,
    });
  };

  const handleBrandChange = (brand: string | undefined) => {
    const newBrand = brand === "all" ? undefined : brand;
    onSearchQueryChange({ ...searchQuery, brand: newBrand, model: undefined });
  };

  const handleModelChange = (model: string | undefined) => {
    onSearchQueryChange({ ...searchQuery, model: model === "all" ? undefined : model });
  };

  const handleYearChange = (year: string | undefined) => {
    const yearAsNumber = year === "all" ? undefined : (year ? parseInt(year, 10) : undefined);
    onSearchQueryChange({ ...searchQuery, yearMin: yearAsNumber });
  };

  const handlePriceChange = (value: string | undefined, type: "min" | "max") => {
    if (isMixed) return;

    const priceAsNumber = value === "all" ? undefined : (value ? parseInt(value, 10) : undefined);
    const newQuery = { ...searchQuery };
    if (type === "min") {
      newQuery.priceMin = priceAsNumber;
    } else {
      newQuery.priceMax = priceAsNumber;
    }
    onSearchQueryChange(newQuery);
  };

  const getActiveFilterChips = (): FilterChip[] => {
    const chips: FilterChip[] = [];

    if (saleType !== "all") {
      chips.push({ key: "saleType", label: "Verkaufsart", value: getSaleTypeLabel(saleType) });
    }

    if (searchQuery.brand) chips.push({ key: "brand", label: "Marke", value: searchQuery.brand });
    if (searchQuery.model) chips.push({ key: "model", label: "Modell", value: searchQuery.model });
    if (searchQuery.yearMin) chips.push({ key: "yearMin", label: "Ab Jahr", value: searchQuery.yearMin.toString() });

    const minLabel = isDirectPurchase ? "Min. Kaufpreis" : "Min. Rate";
    const maxLabel = isDirectPurchase ? "Max. Kaufpreis" : "Max. Rate";

    if (!isMixed && searchQuery.priceMin) chips.push({ key: "priceMin", label: minLabel, value: formatChf(searchQuery.priceMin) });
    if (!isMixed && searchQuery.priceMax) chips.push({ key: "priceMax", label: maxLabel, value: formatChf(searchQuery.priceMax) });

    if (isLeaseTakeover && searchQuery.monthsMax) {
      chips.push({ key: "monthsMax", label: "Restlaufzeit", value: `bis ${searchQuery.monthsMax} Mon.` });
    }

    return chips;
  };

  const removeFilter = (chipKey: FilterChipKey) => {
    const newQuery: Partial<SearchQuery> = { ...searchQuery };

    if (chipKey === "saleType") {
      delete newQuery.dealType;
      delete newQuery.financingType;
      delete newQuery.monthsMin;
      delete newQuery.monthsMax;
      delete newQuery.priceMin;
      delete newQuery.priceMax;
      onSearchQueryChange(newQuery as SearchQuery);
      return;
    }

    delete newQuery[chipKey as keyof SearchQuery];

    if (chipKey === "brand" && newQuery.model) {
      delete newQuery.model;
    }

    onSearchQueryChange(newQuery as SearchQuery);
  };

  const activeChips = getActiveFilterChips();

  const priceMinPlaceholder = isDirectPurchase ? "Min. Kaufpreis" : "Min. Rate";
  const priceMaxPlaceholder = isDirectPurchase ? "Max. Kaufpreis" : "Max. Rate";

  const DesktopFilters = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-8 items-center gap-4">
        <div className="col-span-1">
          <Select value={searchQuery.brand || "all"} onValueChange={handleBrandChange} disabled={loadingBrands}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Marke" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Marken</SelectItem>
              {brands.map((brand) => <SelectItem key={brand} value={brand}>{brand}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-1">
          <Select value={searchQuery.model || "all"} onValueChange={handleModelChange} disabled={!searchQuery.brand || loadingModels}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={searchQuery.brand ? "Modell" : "Erst Marke"} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Modelle</SelectItem>
              {models.map((model) => <SelectItem key={model} value={model}>{model}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-1">
          <Select value={searchQuery.yearMin ? searchQuery.yearMin.toString() : "all"} onValueChange={handleYearChange}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Jahr" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Jahre</SelectItem>
              {yearOptions.map((year) => <SelectItem key={year} value={year.toString()}>{year}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-1">
          <Select
            value={searchQuery.priceMin ? searchQuery.priceMin.toString() : "all"}
            onValueChange={(value) => handlePriceChange(value, "min")}
            disabled={isMixed}
          >
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={priceMinPlaceholder} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Kein Min.</SelectItem>
              {priceOptions.map((price) => (
                <SelectItem key={price} value={price.toString()}>{formatChf(price)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-1">
          <Select
            value={searchQuery.priceMax ? searchQuery.priceMax.toString() : "all"}
            onValueChange={(value) => handlePriceChange(value, "max")}
            disabled={isMixed}
          >
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={priceMaxPlaceholder} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Kein Max.</SelectItem>
              {priceOptions.map((price) => (
                <SelectItem key={price} value={price.toString()}>{formatChf(price)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-1">
          <Select
            value={isLeaseTakeover && searchQuery.monthsMax ? `${searchQuery.monthsMax}` : "all"}
            onValueChange={(value) => {
              if (!isLeaseTakeover) return;
              onSearchQueryChange({ ...searchQuery, monthsMax: value === "all" ? undefined : parseInt(value, 10) });
            }}
            disabled={!isLeaseTakeover}
          >
            <SelectTrigger className="h-8 text-xs">
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
        </div>

        <div className="col-span-1">
          <Select value={saleType} onValueChange={handleSaleTypeChange}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Verkaufsart" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle</SelectItem>
              <SelectItem value="lease_takeover">Leasingübernahme</SelectItem>
              <SelectItem value="direct_purchase">Direktkauf</SelectItem>
              <SelectItem value="leasing">Leasing</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-1">
          <Select
            value={searchQuery.sort || "relevance"}
            onValueChange={(value) => onSearchQueryChange({ ...searchQuery, sort: value as SearchQuery["sort"] })}
          >
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevanz</SelectItem>
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
        </div>
      </div>

      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {activeChips.map((chip) => (
            <div
              key={chip.key}
              className="inline-flex items-center space-x-1 px-2 py-1 bg-red-50 border border-red-200 rounded-full text-xs text-red-700 transition-all hover:bg-red-100"
            >
              <span className="font-medium">{chip.label}:</span>
              <span>{chip.value}</span>
              <button onClick={() => removeFilter(chip.key)} className="ml-1 p-0.5 hover:bg-red-200 rounded-full transition-colors">
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const MobileFilters = () => (
    <div className="space-y-6 py-4">
      <div>
        <label className="text-sm font-semibold text-neutral-900 mb-2 block">Verkaufsart</label>
        <Select value={saleType} onValueChange={handleSaleTypeChange}>
          <SelectTrigger className="h-11 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle</SelectItem>
            <SelectItem value="lease_takeover">Leasingübernahme</SelectItem>
            <SelectItem value="direct_purchase">Direktkauf</SelectItem>
            <SelectItem value="leasing">Leasing</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-semibold text-neutral-900 mb-2 block">Marke</label>
        <Select value={searchQuery.brand || "all"} onValueChange={handleBrandChange} disabled={loadingBrands}>
          <SelectTrigger className="h-11 text-sm">
            <SelectValue placeholder="Alle Marken" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Marken</SelectItem>
            {brands.map((brand) => <SelectItem key={brand} value={brand}>{brand}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-semibold text-neutral-900 mb-2 block">Modell</label>
        <Select value={searchQuery.model || "all"} onValueChange={handleModelChange} disabled={!searchQuery.brand || loadingModels}>
          <SelectTrigger className="h-11 text-sm">
            <SelectValue placeholder={searchQuery.brand ? "Alle Modelle" : "Erst Marke wählen"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Modelle</SelectItem>
            {models.map((model) => <SelectItem key={model} value={model}>{model}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-semibold text-neutral-900 mb-2 block">Baujahr (ab)</label>
        <Select value={searchQuery.yearMin ? searchQuery.yearMin.toString() : "all"} onValueChange={handleYearChange}>
          <SelectTrigger className="h-11 text-sm">
            <SelectValue placeholder="Alle Jahre" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Jahre</SelectItem>
            {yearOptions.map((year) => <SelectItem key={year} value={year.toString()}>{year}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-semibold text-neutral-900 mb-2 block">{isDirectPurchase ? "Kaufpreis" : "Preis pro Monat"}</label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-neutral-600 mb-1 block">Min.</label>
            <Select
              value={searchQuery.priceMin ? searchQuery.priceMin.toString() : "all"}
              onValueChange={(value) => handlePriceChange(value, "min")}
              disabled={isMixed}
            >
              <SelectTrigger className="h-11 text-sm">
                <SelectValue placeholder="Kein Min." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Kein Min.</SelectItem>
                {priceOptions.map((price) => (
                  <SelectItem key={price} value={price.toString()}>{formatChf(price)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-neutral-600 mb-1 block">Max.</label>
            <Select
              value={searchQuery.priceMax ? searchQuery.priceMax.toString() : "all"}
              onValueChange={(value) => handlePriceChange(value, "max")}
              disabled={isMixed}
            >
              <SelectTrigger className="h-11 text-sm">
                <SelectValue placeholder="Kein Max." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Kein Max.</SelectItem>
                {priceOptions.map((price) => (
                  <SelectItem key={price} value={price.toString()}>{formatChf(price)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {isMixed && (
          <p className="mt-2 text-xs text-neutral-500">
            Wähle zuerst eine Verkaufsart, um Preise zu filtern.
          </p>
        )}
      </div>

      <div>
        <label className="text-sm font-semibold text-neutral-900 mb-2 block">Restlaufzeit (max.)</label>
        <Select
          value={isLeaseTakeover && searchQuery.monthsMax ? `${searchQuery.monthsMax}` : "all"}
          onValueChange={(value) => {
            if (!isLeaseTakeover) return;
            onSearchQueryChange({ ...searchQuery, monthsMax: value === "all" ? undefined : parseInt(value, 10) });
          }}
          disabled={!isLeaseTakeover}
        >
          <SelectTrigger className="h-11 text-sm">
            <SelectValue placeholder={isLeaseTakeover ? "Alle Laufzeiten" : "Nur Leasingübernahme"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle</SelectItem>
            <SelectItem value="6">bis 6 Monate</SelectItem>
            <SelectItem value="12">bis 12 Monate</SelectItem>
            <SelectItem value="24">bis 24 Monate</SelectItem>
            <SelectItem value="36">bis 36 Monate</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-semibold text-neutral-900 mb-2 block">Sortierung</label>
        <Select
          value={searchQuery.sort || "relevance"}
          onValueChange={(value) => onSearchQueryChange({ ...searchQuery, sort: value as SearchQuery["sort"] })}
        >
          <SelectTrigger className="h-11 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">Relevanz</SelectItem>
            <SelectItem value="dateDesc">Neueste zuerst</SelectItem>
            <SelectItem value="yearDesc">Baujahr ↓</SelectItem>
            <SelectItem value="kmAsc">KM ↑</SelectItem>
            {!isMixed && (
              <>
                <SelectItem value="priceAsc">Preis aufsteigend</SelectItem>
                <SelectItem value="priceDesc">Preis absteigend</SelectItem>
              </>
            )}
            {isLeaseTakeover && (
              <>
                <SelectItem value="monthsAsc">Kurze Laufzeit zuerst</SelectItem>
                <SelectItem value="monthsDesc">Lange Laufzeit zuerst</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          onClick={() => setMobileFilterOpen(false)}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white h-11"
        >
          <ChevronRight className="h-4 w-4 mr-2" />
          Ergebnisse anzeigen
        </Button>
        {activeChips.length > 0 && (
          <Button
            variant="outline"
            onClick={() => {
              onSearchQueryChange({});
              setMobileFilterOpen(false);
            }}
            className="h-11 px-6 border-neutral-300 text-neutral-700 hover:bg-neutral-50"
          >
            Zurücksetzen
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className={cn("bg-white/80 backdrop-blur-md border-b border-white/30 shadow-sm transition-all duration-300", className)}>
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="hidden md:block">
          <DesktopFilters />
        </div>

        <div className="md:hidden">
          <div className="flex items-center justify-between">
            <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="h-9 text-sm font-semibold border-neutral-300 hover:bg-neutral-50">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter {activeChips.length > 0 && `(${activeChips.length})`}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
                <SheetHeader className="border-b border-neutral-200 pb-4 mb-2">
                  <SheetTitle className="text-lg font-bold">Fahrzeuge filtern</SheetTitle>
                </SheetHeader>
                <MobileFilters />
              </SheetContent>
            </Sheet>

            {activeChips.length > 0 && (
              <Button
                variant="ghost"
                onClick={() => onSearchQueryChange({})}
                className="h-9 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 font-semibold"
              >
                Alle löschen
              </Button>
            )}
          </div>

          {activeChips.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {activeChips.slice(0, 3).map((chip) => (
                <div
                  key={chip.key}
                  className="inline-flex items-center px-2.5 py-1 bg-red-50 border border-red-200 rounded-full text-xs text-red-700 font-medium"
                >
                  <span>{chip.value}</span>
                  <button onClick={() => removeFilter(chip.key)} className="ml-1.5 p-0.5 hover:bg-red-200 rounded-full transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {activeChips.length > 3 && (
                <span className="text-xs text-neutral-500 px-2.5 py-1 font-medium">
                  +{activeChips.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}