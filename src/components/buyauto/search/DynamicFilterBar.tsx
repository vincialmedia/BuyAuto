"use client"

import { useState, useEffect } from "react";
import { useDebounce } from 'use-debounce';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SearchQuery } from "@/lib/buyauto/search";
import { Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getBrands, getModelsForBrand } from "@/services/listingsService";
import { Slider } from "@/components/ui/slider";

interface DynamicFilterBarProps {
  searchQuery: SearchQuery;
  onSearchQueryChange: (query: SearchQuery) => void;
  className?: string;
}

type FilterChipKey = "brand" | "model" | "yearMin" | "priceMax" | "monthsMax";

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
  // Local state for immediate UI feedback
  const [localPrice, setLocalPrice] = useState(searchQuery.priceMax ?? 3000);
  const [localYear, setLocalYear] = useState(searchQuery.yearMin ?? '');
  
  // Debounce the local values before pushing to URL
  const [debouncedPrice] = useDebounce(localPrice, 300);
  const [debouncedYear] = useDebounce(localYear, 500);

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  
  // State for dynamic dropdowns
  const [brands, setBrands] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [loadingModels, setLoadingModels] = useState(false);

  // Effect to update search query when debounced price changes
  useEffect(() => {
    // Avoid triggering a search on initial component mount if price hasn't changed
    if (debouncedPrice === (searchQuery.priceMax ?? 3000)) {
      return;
    }

    if (debouncedPrice < 3000) {
      onSearchQueryChange({
        ...searchQuery,
        priceMax: debouncedPrice
      });
    } else {
      // Remove priceMax filter if set to maximum
      const { priceMax, ...rest } = searchQuery;
      onSearchQueryChange(rest);
    }
  }, [debouncedPrice]);

  // Effect to update search query when debounced year changes
  useEffect(() => {
    // Avoid triggering a search on initial component mount if year hasn't changed
    if (debouncedYear === (searchQuery.yearMin ?? '')) {
        return;
    }
    
    const yearAsNumber = debouncedYear ? parseInt(String(debouncedYear), 10) : undefined;
    if (yearAsNumber && yearAsNumber > 1900) {
        onSearchQueryChange({
            ...searchQuery,
            yearMin: yearAsNumber
        });
    } else {
        const { yearMin, ...rest } = searchQuery;
        onSearchQueryChange(rest);
    }
  }, [debouncedYear]);


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
  
  // Generate filter chips from active filters
  const getActiveFilterChips = (): FilterChip[] => {
    const chips: FilterChip[] = [];
    
    if (searchQuery.brand) chips.push({ key: "brand", label: "Marke", value: searchQuery.brand });
    if (searchQuery.model) chips.push({ key: "model", label: "Modell", value: searchQuery.model });
    if (searchQuery.yearMin) chips.push({ key: "yearMin", label: "Ab Jahr", value: searchQuery.yearMin.toString() });
    if (searchQuery.priceMax && searchQuery.priceMax < 3000) chips.push({ key: "priceMax", label: "Max. Preis", value: `CHF ${searchQuery.priceMax}` });
    if (searchQuery.monthsMax) chips.push({ key: "monthsMax", label: "Restlaufzeit", value: `bis ${searchQuery.monthsMax} Mon.`});
    
    return chips;
  };

  const removeFilter = (chipKey: FilterChipKey) => {
    const newQuery: Partial<SearchQuery> = { ...searchQuery };
    delete newQuery[chipKey];

    if (chipKey === "brand" && newQuery.model) {
      delete newQuery.model; // Also clear model when clearing brand
    }
    
    if (chipKey === "priceMax") {
      setLocalPrice(3000);
    }
    if (chipKey === "yearMin") {
      setLocalYear("");
    }

    onSearchQueryChange(newQuery as SearchQuery);
  };

  const activeChips = getActiveFilterChips();

  // Desktop Filter Bar
  const DesktopFilters = () => (
    <div className="space-y-3">
      {/* Main filter row */}
      <div className="grid grid-cols-7 items-center gap-4">
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
          <Input
            type="number"
            placeholder="Jahr"
            value={localYear}
            onChange={(e) => setLocalYear(e.target.value)}
            className="h-8 text-xs"
          />
        </div>

        {/* Price Slider */}
        <div className="col-span-2">
            <div className="px-1">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-neutral-600 font-medium">Max. Preis</span>
                    <span className="text-xs font-semibold text-red-600">CHF {localPrice}</span>
                </div>
                <Slider
                    value={[localPrice]}
                    onValueChange={(value) => setLocalPrice(value[0])}
                    max={3000}
                    step={50}
                    className="h-8"
                />
            </div>
        </div>

        {/* Restlaufzeit */}
        <div className="col-span-1">
          <Select
            value={searchQuery.monthsMax ? `${searchQuery.monthsMax}` : "all"}
            onValueChange={(value) => onSearchQueryChange({ ...searchQuery, monthsMax: value === "all" ? undefined : parseInt(value)})}
          >
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Restlaufzeit" /></SelectTrigger>
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
              className="inline-flex items-center space-x-1 px-2 py-1 bg-red-50 border border-red-200 rounded-full text-xs text-red-700"
            >
              <span className="font-medium">{chip.label}:</span>
              <span>{chip.value}</span>
              <button onClick={() => removeFilter(chip.key)} className="ml-1 p-0.5 hover:bg-red-100 rounded-full">
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className={cn("bg-white/90 backdrop-blur-sm border-b border-neutral-200/60 shadow-sm", className)}>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        {/* Desktop: Show full filter bar */}
        <div className="hidden md:block">
          <DesktopFilters />
        </div>

        {/* Mobile: Show filter button */}
        <div className="md:hidden">
          <div className="flex items-center justify-between">
            <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="h-8 text-xs">
                  <Filter className="h-3 w-3 mr-1" />
                  Filter ({activeChips.length})
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh]">
                <SheetHeader><SheetTitle>Fahrzeuge filtern</SheetTitle></SheetHeader>
                <div className="py-4"><p className="text-sm">Mobile filters coming soon...</p></div>
              </SheetContent>
            </Sheet>
            
            {activeChips.length > 0 && (
              <Button variant="ghost" onClick={() => onSearchQueryChange({})} className="h-8 text-xs text-red-600">
                Alle Filter löschen
              </Button>
            )}
          </div>
          
          {/* Mobile filter chips */}
          {activeChips.length > 0 && (
             <div className="flex flex-wrap gap-1 mt-2">
              {activeChips.slice(0, 3).map((chip) => (
                <div key={chip.key} className="inline-flex items-center px-2 py-0.5 bg-red-50 rounded-full text-xs text-red-700">
                  <span>{chip.value}</span>
                  <button onClick={() => removeFilter(chip.key)} className="ml-1 p-0.5 hover:bg-red-100 rounded-full">
                    <X className="h-2 w-2" />
                  </button>
                </div>
              ))}
              {activeChips.length > 3 && <span className="text-xs text-neutral-500 px-2 py-0.5">+{activeChips.length - 3}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}