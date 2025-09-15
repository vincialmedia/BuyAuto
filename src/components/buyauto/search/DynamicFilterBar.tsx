import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SearchQuery } from "@/lib/buyauto/search";
import { Filter, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { getBrands, getModelsForBrand } from "@/services/listingsService";

interface DynamicFilterBarProps {
  searchQuery: SearchQuery;
  onSearchQueryChange: (query: SearchQuery) => void;
  className?: string;
}

interface FilterChip {
  key: string;
  label: string;
  value: string;
}

export default function DynamicFilterBar({ 
  searchQuery, 
  onSearchQueryChange, 
  className 
}: DynamicFilterBarProps) {
  const [priceValue, setPriceValue] = useState(searchQuery.priceMax || 3000);
  const sliderRef = useRef<HTMLInputElement>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  
  // State for dynamic dropdowns
  const [brands, setBrands] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [loadingModels, setLoadingModels] = useState(false);

  // Update local price state when searchQuery changes
  useEffect(() => {
    setPriceValue(searchQuery.priceMax || 3000);
  }, [searchQuery.priceMax]);

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

  // Fetch models when brand changes
  useEffect(() => {
    if (searchQuery.brand) {
      const fetchModels = async () => {
        setLoadingModels(true);
        try {
          const modelsData = await getModelsForBrand(searchQuery.brand);
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
    onSearchQueryChange({ 
      ...searchQuery, 
      brand: brand === "all" ? undefined : brand,
      model: undefined // Reset model when brand changes
    });
  };

  const handleModelChange = (model: string | undefined) => {
    onSearchQueryChange({ 
      ...searchQuery, 
      model: model === "all" ? undefined : model
    });
  };

  // Calculate the gradient fill percentage based on price value
  const maxPrice = 3000;
  const fillPercentage = Math.min((priceValue / maxPrice) * 100, 100);
  
  // Dynamic gradient colors based on price value
  const getGradientColor = (percentage: number) => {
    if (percentage < 30) return "from-neutral-300 to-neutral-400";
    if (percentage < 60) return "from-neutral-400 to-red-300";
    if (percentage < 80) return "from-red-300 to-red-400";
    return "from-red-400 to-red-600";
  };

  const handlePriceChange = (value: number) => {
    setPriceValue(value);
    // Only set priceMax if it's not the default max value
    if (value < maxPrice) {
      onSearchQueryChange({
        ...searchQuery,
        priceMax: value
      });
    } else {
      // Remove priceMax filter if set to maximum
      const updatedQuery = { ...searchQuery };
      delete updatedQuery.priceMax;
      onSearchQueryChange(updatedQuery);
    }
  };

  // Generate filter chips from active filters
  const getActiveFilterChips = (): FilterChip[] => {
    const chips: FilterChip[] = [];
    
    if (searchQuery.brand) {
      chips.push({ key: "brand", label: "Marke", value: searchQuery.brand });
    }
    if (searchQuery.model) {
      chips.push({ key: "model", label: "Modell", value: searchQuery.model });
    }
    if (searchQuery.yearMin) {
      chips.push({ key: "yearMin", label: "Ab Jahr", value: searchQuery.yearMin.toString() });
    }
    if (searchQuery.priceMax && searchQuery.priceMax < 3000) {
      chips.push({ key: "priceMax", label: "Max. Preis", value: `CHF ${searchQuery.priceMax}` });
    }
    if (searchQuery.monthsMin || searchQuery.monthsMax) {
      const min = searchQuery.monthsMin || 0;
      const max = searchQuery.monthsMax || 60;
      chips.push({ key: "months", label: "Restlaufzeit", value: `${min}-${max} Mon.` });
    }
    
    return chips;
  };

  const removeFilter = (chipKey: string) => {
    const updatedQuery = { ...searchQuery };
    
    switch (chipKey) {
      case "brand":
        delete updatedQuery.brand;
        delete updatedQuery.model; // Also clear model when clearing brand
        break;
      case "model":
        delete updatedQuery.model;
        break;
      case "yearMin":
        delete updatedQuery.yearMin;
        break;
      case "priceMax":
        delete updatedQuery.priceMax;
        setPriceValue(3000);
        break;
      case "months":
        delete updatedQuery.monthsMin;
        delete updatedQuery.monthsMax;
        break;
    }
    
    onSearchQueryChange(updatedQuery);
  };

  const activeChips = getActiveFilterChips();

  // Desktop Filter Bar
  const DesktopFilters = () => (
    <div className="space-y-3">
      {/* Main filter row */}
      <div className="flex items-center space-x-4">
        {/* Brand - Now using Select dropdown */}
        <div className="min-w-0 flex-1">
          <Select 
            value={searchQuery.brand || "all"} 
            onValueChange={handleBrandChange}
            disabled={loadingBrands}
          >
            <SelectTrigger className="h-8 text-xs border-neutral-300/60 bg-white/80 focus:border-red-500">
              <SelectValue placeholder="Marke" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Marken</SelectItem>
              {brands.map((brand) => (
                <SelectItem key={brand} value={brand}>
                  {brand}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Model - Now using Select dropdown */}
        <div className="min-w-0 flex-1">
          <Select 
            value={searchQuery.model || "all"} 
            onValueChange={handleModelChange}
            disabled={!searchQuery.brand || loadingModels}
          >
            <SelectTrigger className="h-8 text-xs border-neutral-300/60 bg-white/80 focus:border-red-500">
              <SelectValue placeholder={searchQuery.brand ? "Modell" : "Erst Marke wählen"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Modelle</SelectItem>
              {models.map((model) => (
                <SelectItem key={model} value={model}>
                  {model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Year */}
        <div className="min-w-0 w-20">
          <Input
            type="number"
            placeholder="Jahr"
            value={searchQuery.yearMin || ""}
            onChange={(e) => onSearchQueryChange({ 
              ...searchQuery, 
              yearMin: e.target.value ? parseInt(e.target.value) : undefined 
            })}
            className="h-8 text-xs border-neutral-300/60 bg-white/80 focus:border-red-500 focus:ring-0"
          />
        </div>

        {/* Price Slider with Dynamic Background */}
        <div className="min-w-0 flex-1 relative">
          <div className="px-3 py-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-neutral-600 font-medium">Max. Preis</span>
              <span className="text-xs font-semibold text-red-600">CHF {priceValue}</span>
            </div>
            <div className="relative">
              {/* Background track with dynamic gradient */}
              <div className="h-1 bg-neutral-200 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all duration-300 bg-gradient-to-r rounded-full",
                    getGradientColor(fillPercentage)
                  )}
                  style={{ width: `${fillPercentage}%` }}
                />
              </div>
              
              {/* Actual slider */}
              <input
                ref={sliderRef}
                type="range"
                min="0"
                max={maxPrice}
                step="50"
                value={priceValue}
                onChange={(e) => handlePriceChange(parseInt(e.target.value))}
                className="absolute inset-0 w-full h-1 opacity-0 cursor-pointer"
              />
              
              {/* Custom thumb */}
              <div 
                className="absolute top-1/2 w-3 h-3 bg-white border-2 border-red-500 rounded-full transform -translate-y-1/2 -translate-x-1/2 shadow-sm transition-all duration-200 hover:scale-110"
                style={{ left: `${fillPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Restlaufzeit */}
        <div className="min-w-0 w-32">
          <Select
            value={searchQuery.monthsMax ? `${searchQuery.monthsMax}` : "all"}
            onValueChange={(value) => onSearchQueryChange({ 
              ...searchQuery, 
              monthsMax: value === "all" ? undefined : parseInt(value)
            })}
          >
            <SelectTrigger className="h-8 text-xs border-neutral-300/60 bg-white/80">
              <SelectValue placeholder="Restlaufzeit" />
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
        <div className="min-w-0 w-32">
          <Select
            value={searchQuery.sort || "relevance"}
            onValueChange={(value) => onSearchQueryChange({ 
              ...searchQuery, 
              sort: value as SearchQuery["sort"]
            })}
          >
            <SelectTrigger className="h-8 text-xs border-neutral-300/60 bg-white/80">
              <SelectValue />
            </SelectTrigger>
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
        <div className="flex flex-wrap gap-2">
          {activeChips.map((chip) => (
            <div
              key={chip.key}
              className="inline-flex items-center space-x-1 px-2 py-1 bg-red-50 border border-red-200 rounded-full text-xs text-red-700"
            >
              <span className="font-medium">{chip.label}:</span>
              <span>{chip.value}</span>
              <button
                onClick={() => removeFilter(chip.key)}
                className="ml-1 p-0.5 hover:bg-red-100 rounded-full transition-colors"
              >
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
      <div className="max-w-[2000px] mx-auto px-4 md:px-6 lg:px-8 py-3">
        {/* Desktop: Show full filter bar */}
        <div className="hidden md:block">
          <DesktopFilters />
        </div>

        {/* Mobile: Show filter button */}
        <div className="md:hidden">
          <div className="flex items-center justify-between">
            <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="h-8 text-xs bg-transparent border-neutral-300">
                  <Filter className="h-3 w-3 mr-1" />
                  Filter ({activeChips.length})
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh]">
                <SheetHeader>
                  <SheetTitle>Fahrzeuge filtern</SheetTitle>
                </SheetHeader>
                <div className="py-4 space-y-4">
                  {/* Mobile version of filters would go here */}
                  <p className="text-sm text-neutral-600">Mobile filter interface coming soon...</p>
                </div>
              </SheetContent>
            </Sheet>
            
            {activeChips.length > 0 && (
              <Button
                variant="ghost"
                onClick={() => onSearchQueryChange({})}
                className="h-8 text-xs text-red-600 hover:bg-red-50"
              >
                Alle Filter löschen
              </Button>
            )}
          </div>
          
          {/* Mobile filter chips */}
          {activeChips.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {activeChips.slice(0, 3).map((chip) => (
                <div
                  key={chip.key}
                  className="inline-flex items-center space-x-1 px-2 py-0.5 bg-red-50 border border-red-200 rounded-full text-xs text-red-700"
                >
                  <span>{chip.value}</span>
                  <button
                    onClick={() => removeFilter(chip.key)}
                    className="ml-0.5 p-0.5 hover:bg-red-100 rounded-full transition-colors"
                  >
                    <X className="h-2 w-2" />
                  </button>
                </div>
              ))}
              {activeChips.length > 3 && (
                <span className="text-xs text-neutral-500 px-2 py-0.5">+{activeChips.length - 3} weitere</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}