"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getBrands, getModelsForBrand } from "@/services/listingsService";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

type DealType = "" | "direct_purchase" | "leasing" | "lease_takeover";

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

// Price slider configurations
const PURCHASE_PRICE_CONFIG = {
  min: 5000,
  max: 500000,
  step: 5000,
  default: 500000,
  formatLabel: (v: number) => v >= 500000 ? "CHF 500'000+" : `CHF ${v.toLocaleString("de-CH")}`,
  formatShort: (v: number) => v >= 500000 ? "500k+" : `${Math.round(v / 1000)}k`,
};

const MONTHLY_PRICE_CONFIG = {
  min: 200,
  max: 2000,
  step: 50,
  default: 2000,
  formatLabel: (v: number) => v >= 2000 ? "CHF 2'000+/Mt." : `CHF ${v.toLocaleString("de-CH")}/Mt.`,
  formatShort: (v: number) => v >= 2000 ? "2k+/Mt." : `${v}/Mt.`,
};

interface SelectFieldProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  disabled?: boolean;
  className?: string;
  compact?: boolean;
}

function SelectField({ value, onChange, options, placeholder, disabled, className, compact }: SelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => o.value === value);

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "w-full flex items-center justify-between gap-1 text-left",
          "bg-transparent border-0 rounded-lg transition-all duration-200",
          "hover:bg-neutral-100 focus:bg-neutral-100 focus:outline-none",
          "font-medium",
          compact ? "h-9 px-2 text-xs" : "h-11 px-4 text-sm",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
          value ? "text-neutral-900" : "text-neutral-500"
        )}
      >
        <span className="truncate">{selectedOption?.label || placeholder}</span>
        <ChevronDown className={cn(
          "text-neutral-400 transition-transform duration-200 flex-shrink-0",
          compact ? "w-3 h-3" : "w-4 h-4",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-neutral-200 py-1 z-50 max-h-64 overflow-y-auto min-w-[140px]">
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

interface PriceFilterProps {
  purchasePrice: number;
  monthlyPrice: number;
  isMonthlyMode: boolean;
  onPurchasePriceChange: (value: number) => void;
  onMonthlyPriceChange: (value: number) => void;
  onModeChange: (isMonthly: boolean) => void;
  className?: string;
  compact?: boolean;
}

function PriceFilter({ 
  purchasePrice, 
  monthlyPrice, 
  isMonthlyMode, 
  onPurchasePriceChange, 
  onMonthlyPriceChange, 
  onModeChange,
  className,
  compact
}: PriceFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const config = isMonthlyMode ? MONTHLY_PRICE_CONFIG : PURCHASE_PRICE_CONFIG;
  const currentValue = isMonthlyMode ? monthlyPrice : purchasePrice;
  const isDefault = currentValue >= config.max;

  // Get display label for the trigger button
  const getDisplayLabel = () => {
    if (compact) {
      if (isDefault) return "Preis";
      return isMonthlyMode 
        ? `${currentValue}/Mt.`
        : `${Math.round(currentValue / 1000)}k`;
    }
    if (isDefault && !isMonthlyMode) return "Alle Preise";
    if (isDefault && isMonthlyMode) return "Alle Preise";
    return isMonthlyMode 
      ? `bis CHF ${currentValue.toLocaleString("de-CH")}/Mt.`
      : `bis CHF ${currentValue.toLocaleString("de-CH")}`;
  };

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between gap-1 text-left",
          "bg-transparent border-0 rounded-lg transition-all duration-200",
          "hover:bg-neutral-100 focus:bg-neutral-100 focus:outline-none",
          "font-medium cursor-pointer",
          compact ? "h-9 px-2 text-xs" : "h-11 px-4 text-sm",
          (!isDefault || isMonthlyMode) ? "text-neutral-900" : "text-neutral-500"
        )}
      >
        <span className="truncate">{getDisplayLabel()}</span>
        <ChevronDown className={cn(
          "text-neutral-400 transition-transform duration-200 flex-shrink-0",
          compact ? "w-3 h-3" : "w-4 h-4",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white rounded-xl shadow-2xl border border-neutral-200 p-5 z-50 w-[calc(100vw-2rem)] sm:w-80 max-w-sm">
            {/* Mode Toggle */}
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-neutral-100">
              <div className="flex-1">
                <p className="text-sm font-semibold text-neutral-900">Leasing & Übernahme</p>
                <p className="text-xs text-neutral-500 mt-0.5">Monatliche Rate anzeigen</p>
              </div>
              <Switch
                checked={isMonthlyMode}
                onCheckedChange={onModeChange}
                className="data-[state=checked]:bg-red-500"
              />
            </div>

            {/* Price Type Label */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                {isMonthlyMode ? "Monatliche Rate" : "Kaufpreis"}
              </span>
              <span className="text-sm font-bold text-neutral-900">
                {config.formatLabel(currentValue)}
              </span>
            </div>

            {/* Slider */}
            <div className="px-1">
              <Slider
                value={[currentValue]}
                onValueChange={(vals) => {
                  const newVal = vals[0] ?? config.max;
                  if (isMonthlyMode) {
                    onMonthlyPriceChange(newVal);
                  } else {
                    onPurchasePriceChange(newVal);
                  }
                }}
                min={config.min}
                max={config.max}
                step={config.step}
                className="w-full"
              />
            </div>

            {/* Min/Max Labels */}
            <div className="flex justify-between mt-2 text-xs text-neutral-400">
              <span>CHF {config.min.toLocaleString("de-CH")}</span>
              <span>CHF {config.max.toLocaleString("de-CH")}+</span>
            </div>

            {/* Quick Select Buttons */}
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-neutral-100">
              {isMonthlyMode ? (
                <>
                  {[500, 750, 1000, 1500, 2000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => onMonthlyPriceChange(val)}
                      className={cn(
                        "px-3 py-1.5 text-xs font-medium rounded-full transition-colors",
                        monthlyPrice === val
                          ? "bg-red-500 text-white"
                          : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                      )}
                    >
                      {val >= 2000 ? "2k+" : val}
                    </button>
                  ))}
                </>
              ) : (
                <>
                  {[25000, 50000, 75000, 100000, 500000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => onPurchasePriceChange(val)}
                      className={cn(
                        "px-3 py-1.5 text-xs font-medium rounded-full transition-colors",
                        purchasePrice === val
                          ? "bg-red-500 text-white"
                          : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                      )}
                    >
                      {val >= 500000 ? "500k+" : `${val / 1000}k`}
                    </button>
                  ))}
                </>
              )}
            </div>

            {/* Reset button */}
            {!isDefault && (
              <button
                type="button"
                onClick={() => {
                  if (isMonthlyMode) {
                    onMonthlyPriceChange(MONTHLY_PRICE_CONFIG.max);
                  } else {
                    onPurchasePriceChange(PURCHASE_PRICE_CONFIG.max);
                  }
                }}
                className="w-full mt-3 py-2 text-xs font-medium text-neutral-500 hover:text-neutral-700 transition-colors"
              >
                Filter zurücksetzen
              </button>
            )}
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
  const [dealType, setDealType] = useState<DealType>("");

  // Price filter state
  const [purchasePrice, setPurchasePrice] = useState(PURCHASE_PRICE_CONFIG.max);
  const [monthlyPrice, setMonthlyPrice] = useState(MONTHLY_PRICE_CONFIG.max);
  const [isMonthlyMode, setIsMonthlyMode] = useState(false);

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
  const advancedFilterCount = [yearMin, fuel, gearbox, body, dealType].filter(Boolean).length;

  // Check if price filter is active
  const isPriceFilterActive = isMonthlyMode 
    ? monthlyPrice < MONTHLY_PRICE_CONFIG.max 
    : purchasePrice < PURCHASE_PRICE_CONFIG.max;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const params: Record<string, string | string[]> = { page: "1" };

    if (brand) params.brand = brand;
    if (model) params.model = model;
    
    // Handle deal type - if monthly mode is on, filter to leasing/lease_takeover
    if (isMonthlyMode) {
      params.dealType = ["lease_takeover"];
      params.financingType = "leasing";
    } else if (dealType === "direct_purchase") {
      params.dealType = "direct_purchase";
    } else if (dealType === "leasing") {
      params.dealType = "direct_purchase";
      params.financingType = "leasing";
    } else if (dealType === "lease_takeover") {
      params.dealType = "lease_takeover";
    }

    // Handle price filter
    if (isPriceFilterActive) {
      params.priceMax = isMonthlyMode ? monthlyPrice.toString() : purchasePrice.toString();
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
    setDealType("");
    setPurchasePrice(PURCHASE_PRICE_CONFIG.max);
    setMonthlyPrice(MONTHLY_PRICE_CONFIG.max);
    setIsMonthlyMode(false);
    setYearMin("");
    setFuel("");
    setGearbox("");
    setBody("");
  };

  const hasAnyFilter = brand || model || dealType || isPriceFilterActive || yearMin || fuel || gearbox || body;

  const brandOptions = [{ value: "", label: "Marke" }, ...brands.map(b => ({ value: b, label: b }))];
  const modelOptions = [{ value: "", label: "Modell" }, ...models.map(m => ({ value: m, label: m }))];

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {/* Mobile Layout - Compact single row */}
      <div className="flex lg:hidden items-center gap-1">
        <div className="flex-1 flex items-center divide-x divide-neutral-200 min-w-0">
          <SelectField
            value={brand}
            onChange={(v) => { setBrand(v); setModel(""); }}
            options={brandOptions}
            placeholder="Marke"
            disabled={loadingBrands}
            compact
            className="flex-1 min-w-0"
          />
          <SelectField
            value={model}
            onChange={setModel}
            options={modelOptions}
            placeholder="Modell"
            disabled={!brand || loadingModels}
            compact
            className="flex-1 min-w-0"
          />
          <PriceFilter
            purchasePrice={purchasePrice}
            monthlyPrice={monthlyPrice}
            isMonthlyMode={isMonthlyMode}
            onPurchasePriceChange={setPurchasePrice}
            onMonthlyPriceChange={setMonthlyPrice}
            onModeChange={setIsMonthlyMode}
            compact
            className="flex-1 min-w-0"
          />
        </div>

        {/* Filter Button - Compact */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={cn(
            "h-9 w-9 flex items-center justify-center rounded-lg transition-all duration-200 flex-shrink-0",
            showAdvanced || advancedFilterCount > 0
              ? "bg-neutral-900 text-white"
              : "bg-neutral-100 text-neutral-600"
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          {advancedFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {advancedFilterCount}
            </span>
          )}
        </button>

        {/* Search Button - Compact */}
        <button
          type="submit"
          className="h-9 px-4 flex items-center gap-1.5 rounded-lg text-xs font-semibold bg-red-500 text-white flex-shrink-0"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Suchen</span>
        </button>
      </div>

      {/* Desktop Layout - Full width */}
      <div className="hidden lg:flex items-center gap-2">
        {/* Filter Fields */}
        <div className="flex-1 flex items-center divide-x divide-neutral-200">
          <SelectField
            value={brand}
            onChange={(v) => { setBrand(v); setModel(""); }}
            options={[{ value: "", label: "Alle Marken" }, ...brands.map(b => ({ value: b, label: b }))]}
            placeholder="Marke"
            disabled={loadingBrands}
            className="flex-1"
          />
          <SelectField
            value={model}
            onChange={setModel}
            options={[{ value: "", label: "Alle Modelle" }, ...models.map(m => ({ value: m, label: m }))]}
            placeholder="Modell"
            disabled={!brand || loadingModels}
            className="flex-1"
          />
          <PriceFilter
            purchasePrice={purchasePrice}
            monthlyPrice={monthlyPrice}
            isMonthlyMode={isMonthlyMode}
            onPurchasePriceChange={setPurchasePrice}
            onMonthlyPriceChange={setMonthlyPrice}
            onModeChange={setIsMonthlyMode}
            className="flex-1"
          />
          <SelectField
            value={dealType}
            onChange={(v) => setDealType(v as DealType)}
            options={DEAL_TYPE_OPTIONS}
            placeholder="Kaufart"
            className="flex-1"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 ml-2">
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
            <span>Filter</span>
            {advancedFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                {advancedFilterCount}
              </span>
            )}
          </button>

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

      {/* Advanced Filters Panel - Shared for both layouts */}
      <div className={cn(
        "overflow-hidden transition-all duration-300 ease-out",
        showAdvanced ? "max-h-[500px] opacity-100 mt-4" : "max-h-0 opacity-0"
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

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Deal Type - Only shown in advanced on mobile */}
            <div className="lg:hidden">
              <label className="block text-xs font-medium text-neutral-500 mb-1 px-1">Kaufart</label>
              <SelectField
                value={dealType}
                onChange={(v) => setDealType(v as DealType)}
                options={DEAL_TYPE_OPTIONS}
                placeholder="Alle"
                className="bg-neutral-50 rounded-lg"
              />
            </div>
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