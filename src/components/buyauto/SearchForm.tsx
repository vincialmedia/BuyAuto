
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
  const [noDeposit, setNoDeposit] = useState(true); // Default to "Keine Kaution"

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
    setSelectedModel(""); // Reset model when brand changes
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const queryParams: Record<string, string | string[]> = {};
    
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
    <Card className="bg-white/95 backdrop-blur-sm shadow-xl border-0 rounded-2xl p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Select value={selectedBrand} onValueChange={handleBrandChange} disabled={loadingBrands}>
            <SelectTrigger className="bg-white"><SelectValue placeholder="Alle Marken" /></SelectTrigger>
            <SelectContent>
              {brands.map((brand) => <SelectItem key={brand} value={brand}>{brand}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={selectedModel} onValueChange={setSelectedModel} disabled={!selectedBrand || loadingModels}>
            <SelectTrigger className="bg-white"><SelectValue placeholder="Alle Modelle" /></SelectTrigger>
            <SelectContent>
              {models.map((model) => <SelectItem key={model} value={model}>{model}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="bg-white"><SelectValue placeholder="Baujahr (alle)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="2023">ab 2023</SelectItem>
              <SelectItem value="2022">ab 2022</SelectItem>
              <SelectItem value="2020">ab 2020</SelectItem>
              <SelectItem value="2018">ab 2018</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedRestlaufzeit} onValueChange={setSelectedRestlaufzeit}>
            <SelectTrigger className="bg-white"><SelectValue placeholder="Restlaufzeit (alle)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0-6">≤ 6 Monate</SelectItem>
              <SelectItem value="7-12">7-12 Monate</SelectItem>
              <SelectItem value="13-24">13-24 Monate</SelectItem>
              <SelectItem value="24+">≥ 24 Monate</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Maximaler Preis pro Monat: CHF {priceRange[0].toLocaleString("de-CH")}{priceRange[0] === 2000 ? '+' : ''}
          </label>
          <Slider value={priceRange} onValueChange={setPriceRange} max={2000} min={200} step={50} />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>CHF 200</span>
            <span>CHF 2'000+</span>
          </div>
        </div>

        <Collapsible open={expandedFilters} onOpenChange={setExpandedFilters}>
          <CollapsibleTrigger asChild>
            <Button type="button" variant="ghost" className="w-full justify-between text-slate-700 hover:bg-slate-50">
              <span className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" />Erweiterte Filter</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${expandedFilters ? "rotate-180" : ""}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select value={selectedBody} onValueChange={setSelectedBody}>
                <SelectTrigger className="bg-white"><SelectValue placeholder="Karosserie" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Limousine">Limousine</SelectItem><SelectItem value="Kombi">Kombi</SelectItem>
                  <SelectItem value="SUV">SUV</SelectItem><SelectItem value="Cabrio">Cabrio</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedFuel} onValueChange={setSelectedFuel}>
                <SelectTrigger className="bg-white"><SelectValue placeholder="Antrieb" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Benzin">Benzin</SelectItem><SelectItem value="Diesel">Diesel</SelectItem>
                  <SelectItem value="Hybrid">Hybrid</SelectItem><SelectItem value="Elektro">Elektro</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedGearbox} onValueChange={setSelectedGearbox}>
                <SelectTrigger className="bg-white"><SelectValue placeholder="Getriebe" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Automatik">Automatik</SelectItem><SelectItem value="Manuell">Manuell</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="no-deposit" checked={noDeposit} onCheckedChange={(checked) => setNoDeposit(!!checked)} />
              <label htmlFor="no-deposit" className="text-sm font-medium text-slate-700 cursor-pointer">
                Keine Kaution
              </label>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold text-lg">
          <Search className="h-5 w-5 mr-2" />
          Fahrzeug finden
        </Button>
      </form>
    </Card>
  );
}
