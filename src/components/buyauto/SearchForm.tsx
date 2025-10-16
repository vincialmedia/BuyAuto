
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";
import { getBrands, getModelsForBrand } from "@/services/listingsService";

export default function SearchForm() {
  const router = useRouter();

  // State for filter values
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedRestlaufzeit, setSelectedRestlaufzeit] = useState("");
  const [priceRange, setPriceRange] = useState([2000]);
  const [selectedBody, setSelectedBody] = useState("");
  const [selectedFuel, setSelectedFuel] = useState("");
  const [selectedGearbox, setSelectedGearbox] = useState("");
  const [noDeposit, setNoDeposit] = useState(false);

  // State for dynamic dropdowns
  const [brands, setBrands] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [loadingModels, setLoadingModels] = useState(false);
  
  // State for UI
  const [expandedFilters, setExpandedFilters] = useState(false);

  // Fetch brands on mount
  useEffect(() => {
    const fetchBrands = async () => {
      setLoadingBrands(true);
      const brandsData = await getBrands();
      setBrands(brandsData);
      setLoadingBrands(false);
    };
    fetchBrands();
  }, []);

  // Fetch models when brand changes
  useEffect(() => {
    if (selectedBrand) {
      const fetchModels = async () => {
        setLoadingModels(true);
        const modelsData = await getModelsForBrand(selectedBrand);
        setModels(modelsData);
        setLoadingModels(false);
      };
      fetchModels();
    } else {
      setModels([]);
    }
  }, [selectedBrand]);

  const handleBrandChange = (brand: string) => {
    setSelectedBrand(brand);
    setSelectedModel("");
  };

  // Dynamic gradient calculation based on price
  const calculateGradientOpacity = () => {
    const price = priceRange[0];
    const maxPrice = 2000;
    const percentage = price / maxPrice;
    return Math.min(percentage * 0.8, 0.8); // Cap at 0.8 opacity
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const queryParams: Record<string, string | string[]> = {
      page: '1'
    };
    
    if (selectedBrand) queryParams.brand = selectedBrand;
    if (selectedModel) queryParams.model = selectedModel;
    if (selectedYear) queryParams.yearMin = selectedYear;
    if (priceRange[0] < 2000) queryParams.priceMax = priceRange[0].toString();
    if (noDeposit) queryParams.noDeposit = "true";
    if (selectedBody) queryParams.body = [selectedBody];
    if (selectedFuel) queryParams.fuel = [selectedFuel];
    if (selectedGearbox) queryParams.gearbox = [selectedGearbox];

    if (selectedRestlaufzeit) {
      const monthsMap: Record<string, { min?: number; max?: number }> = {
        "0-6": { max: 6 }, "7-12": { min: 7, max: 12 },
        "13-24": { min: 13, max: 24 }, "24+": { min: 24 },
      };
      const monthsFilter = monthsMap[selectedRestlaufzeit];
      if (monthsFilter) {
        if (monthsFilter.min) queryParams.monthsMin = monthsFilter.min.toString();
        if (monthsFilter.max) queryParams.monthsMax = monthsFilter.max.toString();
      }
    }
    
    router.push({
      pathname: '/suche',
      query: queryParams
    });
  };

  return (
    <Card className="bg-white shadow-2xl shadow-neutral-900/20 border border-neutral-200/30 rounded-3xl p-6 md:p-8 max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main filters in clean grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Select value={selectedBrand} onValueChange={handleBrandChange} disabled={loadingBrands}>
            <SelectTrigger className="bg-neutral-50 border-neutral-300 text-neutral-800 h-11 rounded-xl font-medium hover:border-neutral-400 transition-colors">
              <SelectValue placeholder="Marke" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-neutral-200">
              {brands.map((brand) => (
                <SelectItem key={brand} value={brand} className="font-medium">
                  {brand}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedModel} onValueChange={setSelectedModel} disabled={!selectedBrand || loadingModels}>
            <SelectTrigger className="bg-neutral-50 border-neutral-300 text-neutral-800 h-11 rounded-xl font-medium hover:border-neutral-400 transition-colors">
              <SelectValue placeholder="Modell" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-neutral-200">
              {models.map((model) => (
                <SelectItem key={model} value={model} className="font-medium">
                  {model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="bg-neutral-50 border-neutral-300 text-neutral-800 h-11 rounded-xl font-medium hover:border-neutral-400 transition-colors">
              <SelectValue placeholder="Jahr" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-neutral-200">
              <SelectItem value="2023" className="font-medium">ab 2023</SelectItem>
              <SelectItem value="2022" className="font-medium">ab 2022</SelectItem>
              <SelectItem value="2020" className="font-medium">ab 2020</SelectItem>
              <SelectItem value="2018" className="font-medium">ab 2018</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedRestlaufzeit} onValueChange={setSelectedRestlaufzeit}>
            <SelectTrigger className="bg-neutral-50 border-neutral-300 text-neutral-800 h-11 rounded-xl font-medium hover:border-neutral-400 transition-colors">
              <SelectValue placeholder="Restlaufzeit" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-neutral-200">
              <SelectItem value="0-6" className="font-medium hover:underline hover:decoration-neutral-400 transition-all">≤ 6 Monate</SelectItem>
              <SelectItem value="7-12" className="font-medium hover:underline hover:decoration-neutral-400 transition-all">7-12 Monate</SelectItem>
              <SelectItem value="13-24" className="font-medium hover:underline hover:decoration-neutral-400 transition-all">13-24 Monate</SelectItem>
              <SelectItem value="24+" className="font-medium hover:underline hover:decoration-neutral-400 transition-all">≥ 24 Monate</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Dynamic Price Slider with Gradient Background */}
        <div className="relative">
          <label className="block text-sm font-semibold text-neutral-700 mb-4 tracking-wide">
            Maximaler Preis pro Monat: CHF {priceRange[0].toLocaleString("de-CH")}{priceRange[0] === 2000 ? '+' : ''}
          </label>
          
          {/* Dynamic gradient background behind slider */}
          <div 
            className="absolute inset-x-0 top-12 h-2 rounded-full transition-all duration-500"
            style={{
              background: `linear-gradient(to right, 
                rgb(163 163 163 / 0.3) 0%, 
                rgb(239 68 68 / ${calculateGradientOpacity() * 0.4}) ${(priceRange[0] / 2000) * 100}%, 
                rgb(220 38 38 / ${calculateGradientOpacity()}) ${(priceRange[0] / 2000) * 100}%, 
                rgb(163 163 163 / 0.1) 100%)`
            }}
          />
          
          <div className="relative pt-2">
            <Slider 
              value={priceRange} 
              onValueChange={setPriceRange} 
              max={2000} 
              min={200} 
              step={50}
              className="w-full"
            />
          </div>
          
          <div className="flex justify-between text-xs font-medium text-neutral-500 mt-2">
            <span>CHF 200</span>
            <span>CHF 2'000+</span>
          </div>
        </div>

        {/* Expandable Filters */}
        <Collapsible open={expandedFilters} onOpenChange={setExpandedFilters}>
          <CollapsibleTrigger asChild>
            <Button 
              type="button" 
              variant="ghost" 
              className="w-full justify-between text-neutral-700 hover:bg-neutral-100 h-11 rounded-xl font-medium border border-neutral-300"
            >
              <span className="flex items-center gap-3">
                <SlidersHorizontal className="h-4 w-4 text-neutral-500" />
                Erweiterte Filter
              </span>
              <ChevronDown className={`h-4 w-4 text-neutral-500 transition-transform duration-200 ${expandedFilters ? "rotate-180" : ""}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select value={selectedBody} onValueChange={setSelectedBody}>
                <SelectTrigger className="bg-neutral-50 border-neutral-300 text-neutral-800 h-11 rounded-xl font-medium hover:border-neutral-400 transition-colors">
                  <SelectValue placeholder="Karosserie" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-neutral-200">
                  <SelectItem value="Limousine" className="font-medium">Limousine</SelectItem>
                  <SelectItem value="Kombi" className="font-medium">Kombi</SelectItem>
                  <SelectItem value="SUV" className="font-medium">SUV</SelectItem>
                  <SelectItem value="Cabrio" className="font-medium">Cabrio</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedFuel} onValueChange={setSelectedFuel}>
                <SelectTrigger className="bg-neutral-50 border-neutral-300 text-neutral-800 h-11 rounded-xl font-medium hover:border-neutral-400 transition-colors">
                  <SelectValue placeholder="Antrieb" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-neutral-200">
                  <SelectItem value="Benzin" className="font-medium">Benzin</SelectItem>
                  <SelectItem value="Diesel" className="font-medium">Diesel</SelectItem>
                  <SelectItem value="Hybrid" className="font-medium">Hybrid</SelectItem>
                  <SelectItem value="Elektro" className="font-medium">Elektro</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedGearbox} onValueChange={setSelectedGearbox}>
                <SelectTrigger className="bg-neutral-50 border-neutral-300 text-neutral-800 h-11 rounded-xl font-medium hover:border-neutral-400 transition-colors">
                  <SelectValue placeholder="Getriebe" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-neutral-200">
                  <SelectItem value="Automatik" className="font-medium">Automatik</SelectItem>
                  <SelectItem value="Manuell" className="font-medium">Manuell</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-3 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
              <Checkbox 
                id="no-deposit" 
                checked={noDeposit} 
                onCheckedChange={(checked) => setNoDeposit(!!checked)}
                className="border-neutral-400 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
              />
              <label htmlFor="no-deposit" className="text-sm font-medium text-neutral-700 cursor-pointer">
                Keine Kaution
              </label>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Submit Button - more compact */}
        <Button 
          type="submit" 
          className="w-full bg-red-500 hover:bg-red-600 text-white h-12 rounded-xl font-semibold text-base shadow-lg shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/25 transition-all duration-200 hover:-translate-y-0.5"
        >
          <Search className="h-4 w-4 mr-3" />
          Fahrzeug finden
        </Button>
      </form>
    </Card>
  );
}