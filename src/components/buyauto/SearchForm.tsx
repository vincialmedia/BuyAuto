
"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";
import { getBrands, getModelsByBrand } from "@/lib/buyauto/data";

export default function SearchForm() {
  const router = useRouter();
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedRestlaufzeit, setSelectedRestlaufzeit] = useState<string>("");
  const [priceRange, setPriceRange] = useState([1000]);
  const [expandedFilters, setExpandedFilters] = useState(false);
  const [selectedBody, setSelectedBody] = useState<string>("");
  const [selectedFuel, setSelectedFuel] = useState<string>("");
  const [selectedGearbox, setSelectedGearbox] = useState<string>("");
  const [requiresDeposit, setRequiresDeposit] = useState(false);

  const brands = getBrands();
  const models = selectedBrand ? getModelsByBrand(selectedBrand) : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Build query parameters based on form values
    const queryParams: Record<string, string | string[]> = {};
    
    // Basic filters
    if (selectedBrand) {
      queryParams.brand = selectedBrand;
    }
    
    if (selectedModel) {
      queryParams.model = selectedModel;
    }
    
    // Year mapping
    if (selectedYear) {
      const yearMap: Record<string, number> = {
        "2018": 2018,
        "2020": 2020,
        "2022": 2022,
        "2023": 2023
      };
      if (yearMap[selectedYear]) {
        queryParams.yearMin = yearMap[selectedYear].toString();
      }
    }
    
    // Restlaufzeit (remaining months) mapping
    if (selectedRestlaufzeit) {
      const monthsMap: Record<string, { min?: number, max?: number }> = {
        "0-6": { max: 6 },
        "7-12": { min: 7, max: 12 },
        "13-24": { min: 13, max: 24 },
        "24+": { min: 24 }
      };
      const monthsFilter = monthsMap[selectedRestlaufzeit];
      if (monthsFilter) {
        if (monthsFilter.min) queryParams.monthsMin = monthsFilter.min.toString();
        if (monthsFilter.max) queryParams.monthsMax = monthsFilter.max.toString();
      }
    }
    
    // Price filter
    if (priceRange[0] > 200) {
      queryParams.priceMax = priceRange[0].toString();
    }
    
    // Advanced filters
    if (selectedBody) {
      queryParams.body = selectedBody;
    }
    
    if (selectedFuel) {
      queryParams.fuel = selectedFuel;
    }
    
    if (selectedGearbox) {
      queryParams.gearbox = selectedGearbox;
    }
    
    // Deposit filter (inverted logic - if requiresDeposit is false, we want noDeposit to be true)
    if (!requiresDeposit) {
      queryParams.noDeposit = "true";
    }
    
    // Navigate to search page with query parameters
    router.push({
      pathname: '/suche',
      query: queryParams
    });
  };

  return (
    <Card className="bg-white/95 backdrop-blur-sm shadow-xl border-0 rounded-2xl p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Marke
            </label>
            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Alle Marken" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Alle Marken</SelectItem>
                {brands.map((brand) => (
                  <SelectItem key={brand} value={brand}>
                    {brand}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Modell
            </label>
            <Select 
              value={selectedModel} 
              onValueChange={setSelectedModel}
              disabled={!selectedBrand}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Alle Modelle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Alle Modelle</SelectItem>
                {models.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Jahr
            </label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Alle Jahre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Alle Jahre</SelectItem>
                <SelectItem value="2018">ab 2018</SelectItem>
                <SelectItem value="2020">ab 2020</SelectItem>
                <SelectItem value="2022">ab 2022</SelectItem>
                <SelectItem value="2023">ab 2023</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Restlaufzeit
            </label>
            <Select value={selectedRestlaufzeit} onValueChange={setSelectedRestlaufzeit}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Alle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Alle</SelectItem>
                <SelectItem value="0-6">≤ 6 Monate</SelectItem>
                <SelectItem value="7-12">7-12 Monate</SelectItem>
                <SelectItem value="13-24">13-24 Monate</SelectItem>
                <SelectItem value="24+">≥ 24 Monate</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Price Slider */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Maximaler Preis pro Monat: CHF {priceRange[0].toLocaleString("de-CH")}
          </label>
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
            max={2000}
            min={200}
            step={50}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>CHF 200</span>
            <span>CHF 2'000+</span>
          </div>
        </div>

        {/* Expandable Advanced Filters */}
        <Collapsible open={expandedFilters} onOpenChange={setExpandedFilters}>
          <CollapsibleTrigger asChild>
            <Button 
              type="button" 
              variant="ghost" 
              className="w-full justify-between text-slate-700 hover:bg-slate-50"
            >
              <span className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Erweiterte Filter
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform ${expandedFilters ? "rotate-180" : ""}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Karosserie
                </label>
                <Select value={selectedBody} onValueChange={setSelectedBody}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Alle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Alle</SelectItem>
                    <SelectItem value="Limousine">Limousine</SelectItem>
                    <SelectItem value="Kombi">Kombi</SelectItem>
                    <SelectItem value="SUV">SUV</SelectItem>
                    <SelectItem value="Cabrio">Cabrio</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Antrieb
                </label>
                <Select value={selectedFuel} onValueChange={setSelectedFuel}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Alle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Alle</SelectItem>
                    <SelectItem value="Benzin">Benzin</SelectItem>
                    <SelectItem value="Diesel">Diesel</SelectItem>
                    <SelectItem value="Hybrid">Hybrid</SelectItem>
                    <SelectItem value="Elektro">Elektro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Getriebe
                </label>
                <Select value={selectedGearbox} onValueChange={setSelectedGearbox}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Alle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Alle</SelectItem>
                    <SelectItem value="Automatik">Automatik</SelectItem>
                    <SelectItem value="Manuell">Manuell</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="deposit"
                checked={requiresDeposit}
                onCheckedChange={(checked) => setRequiresDeposit(!!checked)}
              />
              <label
                htmlFor="deposit"
                className="text-sm font-medium text-slate-700 cursor-pointer"
              >
                Kaution erforderlich
              </label>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Search Button */}
        <Button
          type="submit"
          className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold text-lg"
        >
          <Search className="h-5 w-5 mr-2" />
          Fahrzeug finden
        </Button>
      </form>
    </Card>
  );
}
