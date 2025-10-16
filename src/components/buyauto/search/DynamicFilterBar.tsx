"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SearchQuery } from "@/lib/buyauto/search";
import { Filter, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getBrands, getModelsForBrand } from "@/services/listingsService";

interface DynamicFilterBarProps {
  searchQuery: SearchQuery;
  onSearchQueryChange: (query: SearchQuery) => void;
  className?: string;
}

type FilterChipKey = "brand" | "model" | "yearMin" | "priceMin" | "priceMax" | "monthsMax";

interface FilterChip {
  key: FilterChipKey;
  label: string;
  value: string;
}

export default function DynamicFilterBar({
  searchQuery,
  onSearchQueryChange,
  className
}: DynamicFilterBarProps) {
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  
  // State for dynamic dropdowns
  const [brands, setBrands] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [loadingModels, setLoadingModels] = useState(false);

  // Generate year options from 1990 to current year + 1
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: currentYear - 1989 }, (_, i) => currentYear + 1 - i);

  // Generate price options from 100 to 5000 in steps of 100
  const priceOptions = Array.from({ length: 50 }, (_, i) => (i + 1) * 100);

  // Fetch brands on mount
  useEffect(() => {
    const fetchBrands = async () => {
      setLoadingBrands(true);
      try {
        const brandsData = await getBrands();
        setBrands(brandsData);
      } catch (error) {
        console.error('Error fetching brands:', error);
      } finally {
        setLoadingBrands(false);
      }
    };
    fetchBrands();
  }, []);

  // Fetch models for brand when brand is selected
  useEffect(() => {
    if (searchQuery.brand) {
      const fetchModels = async () => {
        setLoadingModels(true);
        try {
          const modelsData = await getModelsForBrand(searchQuery.brand!);
          setModels(modelsData);
        } catch (error) {
          console.error('Error fetching models:', error);
        } finally {
          setLoadingModels(false);
        }
      };
      fetchModels();
    } else {
      setModels([]);
    }
  }, [searchQuery.brand]);

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
  
  const handlePriceChange = (value: string | undefined, type: 'min' | 'max') => {
    const priceAsNumber = value === 'all' ? undefined : (value ? parseInt(value, 10) : undefined);
    const newQuery = { ...searchQuery };
    if (type === 'min') {
      newQuery.priceMin = priceAsNumber;
    } else {
      newQuery.priceMax = priceAsNumber;
    }
    onSearchQueryChange(newQuery);
  };

  // Generate filter chips from active filters
  const getActiveFilterChips = (): FilterChip[] => {
    const chips: FilterChip[] = [];
    
    if (searchQuery.brand) chips.push({ key: "brand", label: "Marke", value: searchQuery.brand });
    if (searchQuery.model) chips.push({ key: "model", label: "Modell", value: searchQuery.model });
    if (searchQuery.yearMin) chips.push({ key: "yearMin", label: "Ab Jahr", value: searchQuery.yearMin.toString() });
    if (searchQuery.priceMin) chips.push({ key: "priceMin", label: "Min. Preis", value: `CHF ${searchQuery.priceMin}` });
    if (searchQuery.priceMax) chips.push({ key: "priceMax", label: "Max. Preis", value: `CHF ${searchQuery.priceMax}` });
    if (searchQuery.monthsMax) chips.push({ key: "monthsMax", label: "Restlaufzeit", value: `bis ${searchQuery.monthsMax} Mon.`});
    
    return chips;
  };

  const removeFilter = (chipKey: FilterChipKey) => {
    const newQuery: Partial<SearchQuery> = { ...searchQuery };
    delete newQuery[chipKey];

    if (chipKey === "brand" && newQuery.model) {
      delete newQuery.model;
    }

    onSearchQueryChange(newQuery as SearchQuery);
  };

  const activeChips = getActiveFilterChips();

  // Desktop Filter Bar
  const DesktopFilters = () => (
    <div className="space-y-3">
      {/* Main filter row */}
      <div className="grid grid-cols-8 items-center gap-4">
        {/* Brand */}
        <div className="col-span-1">
          <Select value={searchQuery.brand || "all"} onValueChange={handleBrandChange} disabled={loadingBrands}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Marke" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Marken</SelectItem>
              {brands.map((brand) => <SelectItem key={brand} value={brand}>{brand}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Model */}
        <div className="col-span-1">
          <Select value={searchQuery.model || "all"} onValueChange={handleModelChange} disabled={!searchQuery.brand || loadingModels}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={searchQuery.brand ? "Modell" : "Erst Marke"} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Modelle</SelectItem>
              {models.map((model) => <SelectItem key={model} value={model}>{model}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Year */}
        <div className="col-span-1">
          <Select value={searchQuery.yearMin ? searchQuery.yearMin.toString() : "all"} onValueChange={handleYearChange}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Jahr" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Jahre</SelectItem>
              {yearOptions.map((year) => <SelectItem key={year} value={year.toString()}>{year}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Min Price */}
        <div className="col-span-1">
          <Select value={searchQuery.priceMin ? searchQuery.priceMin.toString() : "all"} onValueChange={(value) => handlePriceChange(value, 'min')}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Min. Preis" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Kein Min.</SelectItem>
              {priceOptions.map((price) => (
                <SelectItem key={price} value={price.toString()}>CHF {price}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Max Price */}
        <div className="col-span-1">
          <Select value={searchQuery.priceMax ? searchQuery.priceMax.toString() : "all"} onValueChange={(value) => handlePriceChange(value, 'max')}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Max. Preis" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Kein Max.</SelectItem>
              {priceOptions.map((price) => (
                <SelectItem key={price} value={price.toString()}>CHF {price}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Restlaufzeit */}
        <div className="col-span-1">
          <Select
            value={searchQuery.monthsMax ? `${searchQuery.monthsMax}` : undefined}
            onValueChange={(value) => onSearchQueryChange({ ...searchQuery, monthsMax: value === "all" ? undefined : parseInt(value)})}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Max. Laufzeit" />
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

        {/* Sort */}
        <div className="col-span-1">
          <Select
            value={searchQuery.sort || "relevance"}
            onValueChange={(value) => onSearchQueryChange({ ...searchQuery, sort: value as SearchQuery["sort"]})}
          >
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevanz</SelectItem>
              <SelectItem value="priceAsc">Preis ↑</SelectItem>
              <SelectItem value="priceDesc">Preis ↓</SelectItem>
              <SelectItem value="yearDesc">Neueste</SelectItem>
              <SelectItem value="monthsAsc">Kurze Laufzeit</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filter chips */}
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

  // Mobile Filter Sheet
  const MobileFilters = () => (
    <div className="space-y-6 py-4">
      {/* Brand */}
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

      {/* Model */}
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

      {/* Year */}
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

      {/* Price Range */}
      <div>
        <label className="text-sm font-semibold text-neutral-900 mb-2 block">Preis pro Monat</label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-neutral-600 mb-1 block">Min.</label>
            <Select value={searchQuery.priceMin ? searchQuery.priceMin.toString() : "all"} onValueChange={(value) => handlePriceChange(value, 'min')}>
              <SelectTrigger className="h-11 text-sm">
                <SelectValue placeholder="Kein Min." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Kein Min.</SelectItem>
                {priceOptions.map((price) => (
                  <SelectItem key={price} value={price.toString()}>CHF {price}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-neutral-600 mb-1 block">Max.</label>
            <Select value={searchQuery.priceMax ? searchQuery.priceMax.toString() : "all"} onValueChange={(value) => handlePriceChange(value, 'max')}>
              <SelectTrigger className="h-11 text-sm">
                <SelectValue placeholder="Kein Max." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Kein Max.</SelectItem>
                {priceOptions.map((price) => (
                  <SelectItem key={price} value={price.toString()}>CHF {price}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Leasing Term */}
      <div>
        <label className="text-sm font-semibold text-neutral-900 mb-2 block">Restlaufzeit (max.)</label>
        <Select
          value={searchQuery.monthsMax ? `${searchQuery.monthsMax}` : undefined}
          onValueChange={(value) => onSearchQueryChange({ ...searchQuery, monthsMax: value === "all" ? undefined : parseInt(value)})}
        >
          <SelectTrigger className="h-11 text-sm">
            <SelectValue placeholder="Alle Laufzeiten" />
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

      {/* Sort */}
      <div>
        <label className="text-sm font-semibold text-neutral-900 mb-2 block">Sortierung</label>
        <Select
          value={searchQuery.sort || "relevance"}
          onValueChange={(value) => onSearchQueryChange({ ...searchQuery, sort: value as SearchQuery["sort"]})}
        >
          <SelectTrigger className="h-11 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">Relevanz</SelectItem>
            <SelectItem value="priceAsc">Preis aufsteigend</SelectItem>
            <SelectItem value="priceDesc">Preis absteigend</SelectItem>
            <SelectItem value="yearDesc">Neueste zuerst</SelectItem>
            <SelectItem value="monthsAsc">Kurze Laufzeit zuerst</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Apply & Clear Buttons */}
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
    <div className={cn("bg-white/95 backdrop-blur-md border-b border-neutral-200/80 shadow-sm transition-all duration-300", className)}>
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
        {/* Desktop: Show full filter bar */}
        <div className="hidden md:block">
          <DesktopFilters />
        </div>

        {/* Mobile: Show filter button */}
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
          
          {/* Mobile filter chips */}
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
