"use client"

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { SearchQuery } from "@/lib/buyauto/search";
import { Filter, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getBrands, getModelsForBrand, getVariantsForBrandModel } from "@/services/listingsService";
import { useT } from "@/i18n/runtime";

interface DynamicFilterBarProps {
  searchQuery: SearchQuery;
  onSearchQueryChange: (query: SearchQuery) => void;
  className?: string;
}

type SaleTypeOption = "all" | "lease_takeover" | "direct_purchase" | "leasing";

type FilterChipKey =
  | "saleType"
  | "query"
  | "brand"
  | "model"
  | "variant"
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
  const t = useT();
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const [brands, setBrands] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [variants, setVariants] = useState<string[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingVariants, setLoadingVariants] = useState(false);

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

  useEffect(() => {
    if (searchQuery.brand && searchQuery.model) {
      const fetchVariants = async () => {
        setLoadingVariants(true);
        try {
          const variantsData = await getVariantsForBrandModel(searchQuery.brand!, searchQuery.model!);
          setVariants(variantsData);
        } catch (error) {
          console.error("Error fetching variants:", error);
        } finally {
          setLoadingVariants(false);
        }
      };
      fetchVariants();
    } else {
      setVariants([]);
    }
  }, [searchQuery.brand, searchQuery.model]);

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
    onSearchQueryChange({ ...searchQuery, brand: newBrand, model: undefined, variant: undefined });
  };

  const handleModelChange = (model: string | undefined) => {
    onSearchQueryChange({ ...searchQuery, model: model === "all" ? undefined : model, variant: undefined });
  };

  const handleVariantChange = (variant: string | undefined) => {
    onSearchQueryChange({ ...searchQuery, variant: variant === "all" ? undefined : variant });
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
      chips.push({ key: "saleType", label: t("Verkaufsart"), value: t(getSaleTypeLabel(saleType)) });
    }

    if (searchQuery.query) chips.push({ key: "query", label: t("Suche"), value: searchQuery.query });
    if (searchQuery.brand) chips.push({ key: "brand", label: t("Marke"), value: searchQuery.brand });
    if (searchQuery.model) chips.push({ key: "model", label: t("Modell"), value: searchQuery.model });
    if (searchQuery.variant) chips.push({ key: "variant", label: t("Ausführung"), value: searchQuery.variant });
    if (searchQuery.yearMin) chips.push({ key: "yearMin", label: t("Ab Jahr"), value: searchQuery.yearMin.toString() });

    const minLabel = isDirectPurchase ? t("Min. Kaufpreis") : t("Min. Rate");
    const maxLabel = isDirectPurchase ? t("Max. Kaufpreis") : t("Max. Rate");

    if (!isMixed && searchQuery.priceMin) chips.push({ key: "priceMin", label: minLabel, value: formatChf(searchQuery.priceMin) });
    if (!isMixed && searchQuery.priceMax) chips.push({ key: "priceMax", label: maxLabel, value: formatChf(searchQuery.priceMax) });

    if (isLeaseTakeover && searchQuery.monthsMax) {
      chips.push({ key: "monthsMax", label: t("Restlaufzeit"), value: t("bis {n} Mon.", { n: searchQuery.monthsMax }) });
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

    if (chipKey === "brand") {
      delete newQuery.model;
      delete newQuery.variant;
    }
    if (chipKey === "model") {
      delete newQuery.variant;
    }

    onSearchQueryChange(newQuery as SearchQuery);
  };

  const activeChips = getActiveFilterChips();

  const priceMinPlaceholder = isDirectPurchase ? t("Min. Kaufpreis") : t("Min. Rate");
  const priceMaxPlaceholder = isDirectPurchase ? t("Max. Kaufpreis") : t("Max. Rate");

  // Inline JSX (not inner components): declaring these as components inside the render
  // body gives them a new identity every render, remounting the whole Radix Select subtree.
  const desktopFilters = (
    <div className="space-y-3">
      <div className="grid grid-cols-9 items-center gap-4">
        <div className="col-span-1">
          <Select value={searchQuery.brand || "all"} onValueChange={handleBrandChange} disabled={loadingBrands}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={t("Marke")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("Alle Marken")}</SelectItem>
              {brands.map((brand) => <SelectItem key={brand} value={brand}>{brand}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-1">
          <Select value={searchQuery.model || "all"} onValueChange={handleModelChange} disabled={!searchQuery.brand || loadingModels}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={searchQuery.brand ? t("Modell") : t("Erst Marke")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("Alle Modelle")}</SelectItem>
              {models.map((model) => <SelectItem key={model} value={model}>{model}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-1">
          <Select
            value={searchQuery.variant || "all"}
            onValueChange={handleVariantChange}
            disabled={!searchQuery.model || loadingVariants}
          >
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={searchQuery.model ? t("Ausführung") : t("Erst Modell")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("Alle Ausführungen")}</SelectItem>
              {variants.map((variant) => <SelectItem key={variant} value={variant}>{variant}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-1">
          <Select value={searchQuery.yearMin ? searchQuery.yearMin.toString() : "all"} onValueChange={handleYearChange}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={t("Jahr")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("Alle Jahre")}</SelectItem>
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
              <SelectItem value="all">{t("Kein Min.")}</SelectItem>
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
              <SelectItem value="all">{t("Kein Max.")}</SelectItem>
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
              <SelectValue placeholder={isLeaseTakeover ? t("Max. Laufzeit") : t("Nur Leasingübernahme")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("Alle@@term")}</SelectItem>
              <SelectItem value="6">{t("bis {n} Mon.", { n: 6 })}</SelectItem>
              <SelectItem value="12">{t("bis {n} Mon.", { n: 12 })}</SelectItem>
              <SelectItem value="24">{t("bis {n} Mon.", { n: 24 })}</SelectItem>
              <SelectItem value="36">{t("bis {n} Mon.", { n: 36 })}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-1">
          <Select value={saleType} onValueChange={handleSaleTypeChange}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder={t("Verkaufsart")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("Alle")}</SelectItem>
              <SelectItem value="lease_takeover">{t("Leasingübernahme")}</SelectItem>
              <SelectItem value="direct_purchase">{t("Direktkauf")}</SelectItem>
              <SelectItem value="leasing">{t("Leasing")}</SelectItem>
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
              <SelectItem value="relevance">{t("Relevanz")}</SelectItem>
              <SelectItem value="dateDesc">{t("Neueste")}</SelectItem>
              <SelectItem value="yearDesc">{t("Baujahr ↓")}</SelectItem>
              <SelectItem value="kmAsc">{t("KM ↑")}</SelectItem>
              {!isMixed && (
                <>
                  <SelectItem value="priceAsc">{t("Preis ↑")}</SelectItem>
                  <SelectItem value="priceDesc">{t("Preis ↓")}</SelectItem>
                </>
              )}
              {isLeaseTakeover && (
                <>
                  <SelectItem value="monthsAsc">{t("Kurze Laufzeit")}</SelectItem>
                  <SelectItem value="monthsDesc">{t("Lange Laufzeit")}</SelectItem>
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
              <span className="font-medium">{t("{label}:", { label: chip.label })}</span>
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

  const mobileFilters = (
    <div className="space-y-6 py-4">
      <div>
        <label className="text-sm font-semibold text-neutral-900 mb-2 block">{t("Verkaufsart")}</label>
        <Select value={saleType} onValueChange={handleSaleTypeChange}>
          <SelectTrigger className="h-11 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("Alle")}</SelectItem>
            <SelectItem value="lease_takeover">{t("Leasingübernahme")}</SelectItem>
            <SelectItem value="direct_purchase">{t("Direktkauf")}</SelectItem>
            <SelectItem value="leasing">{t("Leasing")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-semibold text-neutral-900 mb-2 block">{t("Marke")}</label>
        <Select value={searchQuery.brand || "all"} onValueChange={handleBrandChange} disabled={loadingBrands}>
          <SelectTrigger className="h-11 text-sm">
            <SelectValue placeholder={t("Alle Marken")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("Alle Marken")}</SelectItem>
            {brands.map((brand) => <SelectItem key={brand} value={brand}>{brand}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-semibold text-neutral-900 mb-2 block">{t("Modell")}</label>
        <Select value={searchQuery.model || "all"} onValueChange={handleModelChange} disabled={!searchQuery.brand || loadingModels}>
          <SelectTrigger className="h-11 text-sm">
            <SelectValue placeholder={searchQuery.brand ? t("Alle Modelle") : t("Erst Marke wählen")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("Alle Modelle")}</SelectItem>
            {models.map((model) => <SelectItem key={model} value={model}>{model}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-semibold text-neutral-900 mb-2 block">{t("Ausführung")}</label>
        <Select
          value={searchQuery.variant || "all"}
          onValueChange={handleVariantChange}
          disabled={!searchQuery.model || loadingVariants}
        >
          <SelectTrigger className="h-11 text-sm">
            <SelectValue placeholder={searchQuery.model ? t("Alle Ausführungen") : t("Erst Modell wählen")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("Alle Ausführungen")}</SelectItem>
            {variants.map((variant) => <SelectItem key={variant} value={variant}>{variant}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-semibold text-neutral-900 mb-2 block">{t("Baujahr (ab)")}</label>
        <Select value={searchQuery.yearMin ? searchQuery.yearMin.toString() : "all"} onValueChange={handleYearChange}>
          <SelectTrigger className="h-11 text-sm">
            <SelectValue placeholder={t("Alle Jahre")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("Alle Jahre")}</SelectItem>
            {yearOptions.map((year) => <SelectItem key={year} value={year.toString()}>{year}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-semibold text-neutral-900 mb-2 block">{isDirectPurchase ? t("Kaufpreis") : t("Preis pro Monat")}</label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-neutral-600 mb-1 block">{t("Min.")}</label>
            <Select
              value={searchQuery.priceMin ? searchQuery.priceMin.toString() : "all"}
              onValueChange={(value) => handlePriceChange(value, "min")}
              disabled={isMixed}
            >
              <SelectTrigger className="h-11 text-sm">
                <SelectValue placeholder={t("Kein Min.")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("Kein Min.")}</SelectItem>
                {priceOptions.map((price) => (
                  <SelectItem key={price} value={price.toString()}>{formatChf(price)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-neutral-600 mb-1 block">{t("Max.")}</label>
            <Select
              value={searchQuery.priceMax ? searchQuery.priceMax.toString() : "all"}
              onValueChange={(value) => handlePriceChange(value, "max")}
              disabled={isMixed}
            >
              <SelectTrigger className="h-11 text-sm">
                <SelectValue placeholder={t("Kein Max.")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("Kein Max.")}</SelectItem>
                {priceOptions.map((price) => (
                  <SelectItem key={price} value={price.toString()}>{formatChf(price)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {isMixed && (
          <p className="mt-2 text-xs text-neutral-500">
            {t("Wähle zuerst eine Verkaufsart, um Preise zu filtern.")}
          </p>
        )}
      </div>

      <div>
        <label className="text-sm font-semibold text-neutral-900 mb-2 block">{t("Restlaufzeit (max.)")}</label>
        <Select
          value={isLeaseTakeover && searchQuery.monthsMax ? `${searchQuery.monthsMax}` : "all"}
          onValueChange={(value) => {
            if (!isLeaseTakeover) return;
            onSearchQueryChange({ ...searchQuery, monthsMax: value === "all" ? undefined : parseInt(value, 10) });
          }}
          disabled={!isLeaseTakeover}
        >
          <SelectTrigger className="h-11 text-sm">
            <SelectValue placeholder={isLeaseTakeover ? t("Alle Laufzeiten") : t("Nur Leasingübernahme")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("Alle@@term")}</SelectItem>
            <SelectItem value="6">{t("bis {n} Monate", { n: 6 })}</SelectItem>
            <SelectItem value="12">{t("bis {n} Monate", { n: 12 })}</SelectItem>
            <SelectItem value="24">{t("bis {n} Monate", { n: 24 })}</SelectItem>
            <SelectItem value="36">{t("bis {n} Monate", { n: 36 })}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-semibold text-neutral-900 mb-2 block">{t("Sortierung")}</label>
        <Select
          value={searchQuery.sort || "relevance"}
          onValueChange={(value) => onSearchQueryChange({ ...searchQuery, sort: value as SearchQuery["sort"] })}
        >
          <SelectTrigger className="h-11 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">{t("Relevanz")}</SelectItem>
            <SelectItem value="dateDesc">{t("Neueste zuerst")}</SelectItem>
            <SelectItem value="yearDesc">{t("Baujahr ↓")}</SelectItem>
            <SelectItem value="kmAsc">{t("KM ↑")}</SelectItem>
            {!isMixed && (
              <>
                <SelectItem value="priceAsc">{t("Preis aufsteigend")}</SelectItem>
                <SelectItem value="priceDesc">{t("Preis absteigend")}</SelectItem>
              </>
            )}
            {isLeaseTakeover && (
              <>
                <SelectItem value="monthsAsc">{t("Kurze Laufzeit zuerst")}</SelectItem>
                <SelectItem value="monthsDesc">{t("Lange Laufzeit zuerst")}</SelectItem>
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
          {t("Ergebnisse anzeigen")}
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
            {t("Zurücksetzen")}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className={cn("bg-white/80 backdrop-blur-md border-b border-white/30 shadow-sm transition-all duration-300", className)}>
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="hidden md:block">
          {desktopFilters}
        </div>

        <div className="md:hidden">
          <div className="flex items-center justify-between">
            <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="h-9 text-sm font-semibold border-neutral-300 hover:bg-neutral-50">
                  <Filter className="h-4 w-4 mr-2" />
                  {t("Filter")} {activeChips.length > 0 && `(${activeChips.length})`}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
                <SheetHeader className="border-b border-neutral-200 pb-4 mb-2">
                  <SheetTitle className="text-lg font-bold">{t("Fahrzeuge filtern")}</SheetTitle>
                </SheetHeader>
                {mobileFilters}
              </SheetContent>
            </Sheet>

            {activeChips.length > 0 && (
              <Button
                variant="ghost"
                onClick={() => onSearchQueryChange({})}
                className="h-9 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 font-semibold"
              >
                {t("Alle löschen")}
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