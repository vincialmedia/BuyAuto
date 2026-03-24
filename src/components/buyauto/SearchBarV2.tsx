"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getBrands, getModelsForBrand } from "@/services/listingsService";

type DealType = "" | "direct_purchase" | "leasing" | "lease_takeover";

const PRICE_OPTIONS = [
  { value: "", label: "Alle Preise" },
  { value: "500", label: "bis CHF 500/Mt." },
  { value: "750", label: "bis CHF 750/Mt." },
  { value: "1000", label: "bis CHF 1'000/Mt." },
  { value: "1500", label: "bis CHF 1'500/Mt." },
  { value: "25000", label: "bis CHF 25'000" },
  { value: "50000", label: "bis CHF 50'000" },
  { value: "75000", label: "bis CHF 75'000" },
  { value: "100000", label: "bis CHF 100'000" },
];

const DEAL_TYPE_OPTIONS = [
  { value: "", label: "Alle Kaufarten" },
  { value: "direct_purchase", label: "Direktkauf" },
  { value: "leasing", label: "Leasing" },
  { value: "lease_takeover", label: "Leasingübernahme" },
];

const YEAR_OPTIONS = [
  { value: "", label: "Beliebig" },
  { value: "2024", label: "ab 2024" },
  { value: "2023", label: "ab 2023" },
  { value: "2022", label: "ab 2022" },
  { value: "2020", label: "ab 2020" },
  { value: "2018", label: "ab 2018" },
];

const FUEL_OPTIONS = [
  { value: "", label: "Alle" },
  { value: "Benzin", label: "Benzin" },
  { value: "Diesel", label: "Diesel" },
  { value: "Elektro", label: "Elektro" },
  { value: "Hybrid", label: "Hybrid" },
];

const GEARBOX_OPTIONS = [
  { value: "", label: "Alle" },
  { value: "Automatik", label: "Automatik" },
  { value: "Manuell", label: "Manuell" },
];

const BODY_OPTIONS = [
  { value: "", label: "Alle" },
  { value: "Limousine", label: "Limousine" },
  { value: "Kombi", label: "Kombi" },
  { value: "SUV", label: "SUV" },
  { value: "Cabrio", label: "Cabrio" },
  { value: "Coupé", label: "Coupé" },
];

interface SelectFieldProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  disabled?: boolean;
  className?: string;
}

function SelectField({ value, onChange, options, placeholder, disabled, className }: SelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => o.value === value);

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "w-full h-11 px-4 flex items-center justify-between gap-2 text-left",
          "bg-transparent border-0 rounded-lg transition-all duration-200",
          "hover:bg-neutral-100 focus:bg-neutral-100 focus:outline-none",
          "text-sm font-medium",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
          value ? "text-neutral-900" : "text-neutral-500"
        )}
      >
        <span className="truncate">{selectedOption?.label || placeholder}</span>
        <ChevronDown className={cn(
          "w-4 h-4 text-neutral-400 transition-transform duration-200 flex-shrink-0",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-neutral-200 py-1 z-50 max-h-64 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full px-4 py-2.5 text-left text-sm transition-colors",
                  "hover:bg-neutral-50",
                  option.value === value 
                    ? "text-red-600 font-semibold bg-red-50" 
                    : "text-neutral-700"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function SearchBarV2() {
  const router = useRouter();

  // Primary filters
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [dealType, setDealType] = useState<DealType>("");

  // Advanced filters
  const [yearMin, setYearMin] = useState("");
  const [fuel, setFuel] = useState("");
  const [gearbox, setGearbox] = useState("");
  const [body, setBody] = useState("");

  // UI state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [brands, setBrands] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [loadingModels, setLoadingModels] = useState(false);

  // Fetch brands on mount
  useEffect(() => {
    const fetchBrands = async () => {
      setLoadingBrands(true);
      const data = await getBrands();
      setBrands(data);
      setLoadingBrands(false);
    };
    fetchBrands();
  }, []);

  // Fetch models when brand changes
  useEffect(() => {
    if (!brand) {
      setModels([]);
      setModel("");
      return;
    }

    const fetchModels = async () => {
      setLoadingModels(true);
      const data = await getModelsForBrand(brand);
      setModels(data);
      setLoadingModels(false);
    };
    fetchModels();
  }, [brand]);

  // Count active advanced filters
  const advancedFilterCount = [yearMin, fuel, gearbox, body].filter(Boolean).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const params: Record<string, string | string[]> = { page: "1" };

    if (brand) params.brand = brand;
    if (model) params.model = model;
    if (maxPrice) params.priceMax = maxPrice;
    
    if (dealType === "direct_purchase") {
      params.dealType = "direct_purchase";
    } else if (dealType === "leasing") {
      params.dealType = "direct_purchase";
      params.financingType = "leasing";
    } else if (dealType === "lease_takeover") {
      params.dealType = "lease_takeover";
    }

    if (yearMin) params.yearMin = yearMin;
    if (fuel) params.fuel = [fuel];
    if (gearbox) params.gearbox = [gearbox];
    if (body) params.body = [body];

    router.push({ pathname: "/suche", query: params });
  };

  const clearAllFilters = () => {
    setBrand("");
    setModel("");
    setMaxPrice("");
    setDealType("");
    setYearMin("");
    setFuel("");
    setGearbox("");
    setBody("");
  };

  const hasAnyFilter = brand || model || maxPrice || dealType || yearMin || fuel || gearbox || body;

  const brandOptions = [{ value: "", label: "Alle Marken" }, ...brands.map(b => ({ value: b, label: b }))];
  const modelOptions = [{ value: "", label: "Alle Modelle" }, ...models.map(m => ({ value: m, label: m }))];

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {/* Main Search Row */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-0">
        {/* Filter Fields */}
        <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-1 lg:gap-0 lg:divide-x lg:divide-neutral-200">
          <SelectField
            value={brand}
            onChange={(v) => { setBrand(v); setModel(""); }}
            options={brandOptions}
            placeholder="Marke"
            disabled={loadingBrands}
            className="lg:pr-1"
          />
          <SelectField
            value={model}
            onChange={setModel}
            options={modelOptions}
            placeholder="Modell"
            disabled={!brand || loadingModels}
            className="lg:px-1"
          />
          <SelectField
            value={maxPrice}
            onChange={setMaxPrice}
            options={PRICE_OPTIONS}
            placeholder="Preis"
            className="lg:px-1"
          />
          <SelectField
            value={dealType}
            onChange={(v) => setDealType(v as DealType)}
            options={DEAL_TYPE_OPTIONS}
            placeholder="Kaufart"
            className="lg:pl-1"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 lg:ml-4 mt-3 lg:mt-0">
          {/* Advanced Filter Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={cn(
              "h-11 px-4 flex items-center gap-2 rounded-xl text-sm font-medium transition-all duration-200",
              "border",
              showAdvanced || advancedFilterCount > 0
                ? "bg-neutral-900 text-white border-neutral-900"
                : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filter</span>
            {advancedFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                {advancedFilterCount}
              </span>
            )}
          </button>

          {/* Search Button */}
          <button
            type="submit"
            className={cn(
              "h-11 px-6 flex items-center gap-2 rounded-xl text-sm font-semibold transition-all duration-200",
              "bg-red-500 text-white hover:bg-red-600",
              "shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30",
              "hover:-translate-y-0.5 active:translate-y-0"
            )}
          >
            <Search className="w-4 h-4" />
            <span>Suchen</span>
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      <div className={cn(
        "overflow-hidden transition-all duration-300 ease-out",
        showAdvanced ? "max-h-96 opacity-100 mt-4" : "max-h-0 opacity-0"
      )}>
        <div className="pt-4 border-t border-neutral-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-neutral-700">Erweiterte Filter</h4>
            {hasAnyFilter && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs font-medium text-red-500 hover:text-red-600 flex items-center gap-1 transition-colors"
              >
                <X className="w-3 h-3" />
                Alle zurücksetzen
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1 px-1">Jahrgang</label>
              <SelectField
                value={yearMin}
                onChange={setYearMin}
                options={YEAR_OPTIONS}
                placeholder="Beliebig"
                className="bg-neutral-50 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1 px-1">Treibstoff</label>
              <SelectField
                value={fuel}
                onChange={setFuel}
                options={FUEL_OPTIONS}
                placeholder="Alle"
                className="bg-neutral-50 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1 px-1">Getriebe</label>
              <SelectField
                value={gearbox}
                onChange={setGearbox}
                options={GEARBOX_OPTIONS}
                placeholder="Alle"
                className="bg-neutral-50 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1 px-1">Karosserie</label>
              <SelectField
                value={body}
                onChange={setBody}
                options={BODY_OPTIONS}
                placeholder="Alle"
                className="bg-neutral-50 rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}