"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { getBrands, getModelsForBrand, getVariantsForBrandModel } from "@/services/listingsService";

interface SearchFormProps {
  variant?: "default" | "hero";
}

type RestlaufzeitOption = "" | "0-6" | "7-12" | "13-24" | "24+";
type DealTypeMode = "all" | "direct_purchase_only" | "leasing_only" | "lease_takeover_only";

function getRestlaufzeitLabel(option: RestlaufzeitOption): string {
  if (option === "0-6") return "≤ 6 Monate";
  if (option === "7-12") return "7–12 Monate";
  if (option === "13-24") return "13–24 Monate";
  if (option === "24+") return "≥ 24 Monate";
  return "Alle";
}

function formatChf(value: number): string {
  // Deterministic Swiss grouping (500'000): Node and browsers disagree on the de-CH
  // apostrophe (U+0027 vs U+2019), which breaks hydration when this renders server-side.
  return `CHF ${String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, "'")}`;
}

function getModeLabel(mode: DealTypeMode): string {
  if (mode === "direct_purchase_only") return "Direktkauf";
  if (mode === "leasing_only") return "Leasingangebote";
  if (mode === "lease_takeover_only") return "Leasingübernahmen";
  return "Alle";
}

export default function SearchForm({ variant = "default" }: SearchFormProps) {
  const router = useRouter();
  const isHero = variant === "hero";

  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedVariant, setSelectedVariant] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  const [dealMode, setDealMode] = useState<DealTypeMode>("all");

  const [selectedRestlaufzeit, setSelectedRestlaufzeit] = useState<RestlaufzeitOption>("");
  const [noDeposit, setNoDeposit] = useState(false);

  const [monthlyPriceRange, setMonthlyPriceRange] = useState<number[]>([2000]);
  const [purchasePriceRange, setPurchasePriceRange] = useState<number[]>([500000]);

  const [selectedBody, setSelectedBody] = useState("");
  const [selectedFuel, setSelectedFuel] = useState("");
  const [selectedGearbox, setSelectedGearbox] = useState("");

  const [brands, setBrands] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [variants, setVariants] = useState<string[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingVariants, setLoadingVariants] = useState(false);

  const [expandedFilters, setExpandedFilters] = useState(false);

  const monthlyPriceEnabled = dealMode === "leasing_only" || dealMode === "lease_takeover_only";

  const sliderConfig = useMemo(() => {
    if (monthlyPriceEnabled) {
      return {
        min: 200,
        max: 2000,
        step: 50,
        label: "Maximaler Monatlicher Preis",
        maxSuffix: "+",
      };
    }

    return {
      min: 5000,
      max: 500000,
      step: 5000,
      label: "Maximaler Preis",
      maxSuffix: "+",
    };
  }, [monthlyPriceEnabled]);

  const activePriceRange = monthlyPriceEnabled ? monthlyPriceRange : purchasePriceRange;
  const setActivePriceRange = monthlyPriceEnabled ? setMonthlyPriceRange : setPurchasePriceRange;

  useEffect(() => {
    const fetchBrands = async () => {
      setLoadingBrands(true);
      const brandsData = await getBrands();
      setBrands(brandsData);
      setLoadingBrands(false);
    };

    fetchBrands();
  }, []);

  useEffect(() => {
    if (!selectedBrand) {
      setModels([]);
      return;
    }

    const fetchModels = async () => {
      setLoadingModels(true);
      const modelsData = await getModelsForBrand(selectedBrand);
      setModels(modelsData);
      setLoadingModels(false);
    };

    fetchModels();
  }, [selectedBrand]);

  useEffect(() => {
    if (!selectedBrand || !selectedModel) {
      setVariants([]);
      return;
    }

    const fetchVariants = async () => {
      setLoadingVariants(true);
      const variantsData = await getVariantsForBrandModel(selectedBrand, selectedModel);
      setVariants(variantsData);
      setLoadingVariants(false);
    };

    fetchVariants();
  }, [selectedBrand, selectedModel]);

  useEffect(() => {
    if (dealMode !== "lease_takeover_only") {
      setSelectedRestlaufzeit("");
      setNoDeposit(false);
    }
  }, [dealMode]);

  const handleBrandChange = (brand: string) => {
    setSelectedBrand(brand);
    setSelectedModel("");
    setSelectedVariant("");
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    setSelectedVariant("");
  };

  const isPriceFilterActive = (activePriceRange[0] ?? sliderConfig.max) < sliderConfig.max;

  const calculateGradientOpacity = () => {
    const price = activePriceRange[0] ?? sliderConfig.max;
    const percentage = price / sliderConfig.max;
    return Math.min(percentage * 0.8, 0.8);
  };

  const handleModeClick = (mode: DealTypeMode) => {
    setDealMode((prev) => (prev === mode ? "all" : mode));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const queryParams: Record<string, string | string[]> = { page: "1" };

    if (dealMode === "direct_purchase_only") {
      queryParams.dealType = "direct_purchase";
    } else if (dealMode === "leasing_only") {
      queryParams.dealType = "direct_purchase";
      queryParams.financingType = "leasing";
    } else if (dealMode === "lease_takeover_only") {
      queryParams.dealType = "lease_takeover";
    }

    if (selectedBrand) queryParams.brand = selectedBrand;
    if (selectedModel) queryParams.model = selectedModel;
    if (selectedVariant) queryParams.variant = selectedVariant;
    if (selectedYear) queryParams.yearMin = selectedYear;

    if (isPriceFilterActive) {
      queryParams.priceMax = (activePriceRange[0] ?? sliderConfig.max).toString();
    }

    if (dealMode === "lease_takeover_only" && noDeposit) queryParams.noDeposit = "true";
    if (selectedBody) queryParams.body = [selectedBody];
    if (selectedFuel) queryParams.fuel = [selectedFuel];
    if (selectedGearbox) queryParams.gearbox = [selectedGearbox];

    if (dealMode === "lease_takeover_only" && selectedRestlaufzeit) {
      const monthsMap: Record<string, { min?: number; max?: number }> = {
        "0-6": { max: 6 },
        "7-12": { min: 7, max: 12 },
        "13-24": { min: 13, max: 24 },
        "24+": { min: 24 },
      };

      const monthsFilter = monthsMap[selectedRestlaufzeit];

      if (monthsFilter?.min) queryParams.monthsMin = monthsFilter.min.toString();
      if (monthsFilter?.max) queryParams.monthsMax = monthsFilter.max.toString();
    }

    router.push({ pathname: "/suche", query: queryParams });
  };

  const cardStyles = isHero
    ? "bg-white/25 backdrop-blur-xl border-white/30 shadow-2xl shadow-black/10"
    : "bg-white/90 backdrop-blur-md border-white/30 shadow-2xl shadow-neutral-900/20 dark:bg-zinc-900/90 dark:border-zinc-700/30";

  const inputStyles = isHero
    ? "bg-white/20 border-white/30 text-white placeholder:text-white/80 hover:bg-white/30 hover:border-white/40 focus:border-white/50 focus:bg-white/30"
    : "bg-neutral-50 border-neutral-300 text-neutral-800 hover:border-neutral-400";

  const labelStyles = isHero ? "text-white" : "text-neutral-700";
  const subTextStyles = isHero ? "text-neutral-200" : "text-neutral-500";
  const iconStyles = isHero ? "text-neutral-200" : "text-neutral-500";

  const pillBase = cn(
    "h-10 rounded-full px-4 text-sm font-semibold border transition-colors",
    isHero ? "border-white/25" : "border-neutral-200"
  );

  const pillInactive = isHero
    ? "bg-white/10 text-white hover:bg-white/15"
    : "bg-white text-neutral-800 hover:bg-neutral-50";

  const pillActive = isHero
    ? "bg-white/25 text-white border-white/40"
    : "bg-neutral-900 text-white border-neutral-900";

  return (
    <Card className={cn("rounded-3xl p-6 md:p-8 max-w-4xl mx-auto border transition-all duration-300", cardStyles)}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Select value={selectedBrand} onValueChange={handleBrandChange} disabled={loadingBrands}>
            <SelectTrigger className={cn("h-12 rounded-xl font-medium transition-colors", inputStyles)}>
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

          <Select value={selectedModel} onValueChange={handleModelChange} disabled={!selectedBrand || loadingModels}>
            <SelectTrigger className={cn("h-12 rounded-xl font-medium transition-colors", inputStyles)}>
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

          <Select value={selectedVariant} onValueChange={setSelectedVariant} disabled={!selectedModel || loadingVariants}>
            <SelectTrigger className={cn("h-12 rounded-xl font-medium transition-colors", inputStyles)}>
              <SelectValue placeholder="Ausführung" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-neutral-200">
              {variants.map((v) => (
                <SelectItem key={v} value={v} className="font-medium">
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className={cn("h-12 rounded-xl font-medium transition-colors", inputStyles)}>
              <SelectValue placeholder="Jahr" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-neutral-200">
              <SelectItem value="2023" className="font-medium">
                ab 2023
              </SelectItem>
              <SelectItem value="2022" className="font-medium">
                ab 2022
              </SelectItem>
              <SelectItem value="2020" className="font-medium">
                ab 2020
              </SelectItem>
              <SelectItem value="2018" className="font-medium">
                ab 2018
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className={cn("rounded-2xl border p-4", isHero ? "border-white/25 bg-white/10" : "border-neutral-200 bg-white")}>
          <div className="space-y-4">
            <div>
              <label className={cn("block text-sm font-semibold mb-3 tracking-wide", labelStyles)}>
                {sliderConfig.label}: {formatChf(activePriceRange[0] ?? sliderConfig.max)}
                {(activePriceRange[0] ?? sliderConfig.max) === sliderConfig.max ? sliderConfig.maxSuffix : ""}
              </label>

              <div className="relative pt-2">
                {monthlyPriceEnabled && (
                  <div
                    className="absolute inset-x-0 top-3 h-2 rounded-full transition-all duration-500"
                    style={{
                      background: `linear-gradient(to right,
                      rgb(163 163 163 / 0.3) 0%,
                      rgb(239 68 68 / ${calculateGradientOpacity() * 0.4}) ${((activePriceRange[0] ?? sliderConfig.max) / sliderConfig.max) * 100}%,
                      rgb(220 38 38 / ${calculateGradientOpacity()}) ${((activePriceRange[0] ?? sliderConfig.max) / sliderConfig.max) * 100}%,
                      rgb(163 163 163 / 0.1) 100%)`,
                    }}
                  />
                )}

                <Slider
                  value={activePriceRange}
                  onValueChange={setActivePriceRange}
                  max={sliderConfig.max}
                  min={sliderConfig.min}
                  step={sliderConfig.step}
                  className="w-full"
                />
              </div>

              <div className={cn("flex justify-between text-xs font-medium mt-2", subTextStyles)}>
                <span>{formatChf(sliderConfig.min)}</span>
                <span>
                  {formatChf(sliderConfig.max)}
                  {sliderConfig.maxSuffix}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => handleModeClick("direct_purchase_only")}
                className={cn(pillBase, dealMode === "direct_purchase_only" ? pillActive : pillInactive)}
              >
                {dealMode === "direct_purchase_only" ? getModeLabel("direct_purchase_only") : `Nur ${getModeLabel("direct_purchase_only")}`}
              </Button>
              <Button
                type="button"
                onClick={() => handleModeClick("leasing_only")}
                className={cn(pillBase, dealMode === "leasing_only" ? pillActive : pillInactive)}
              >
                {dealMode === "leasing_only" ? getModeLabel("leasing_only") : `Nur ${getModeLabel("leasing_only")}`}
              </Button>
              <Button
                type="button"
                onClick={() => handleModeClick("lease_takeover_only")}
                className={cn(pillBase, dealMode === "lease_takeover_only" ? pillActive : pillInactive)}
              >
                {dealMode === "lease_takeover_only"
                  ? getModeLabel("lease_takeover_only")
                  : `Nur ${getModeLabel("lease_takeover_only")}`}
              </Button>
            </div>

            <p className={cn("text-xs font-medium", subTextStyles)}>
              {dealMode === "all" ? "Suche über alle Deal Types." : `Filter aktiv: ${getModeLabel(dealMode)}.`}
            </p>
          </div>
        </div>

        <Collapsible open={expandedFilters} onOpenChange={setExpandedFilters}>
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className={cn(
                "w-full justify-between h-12 rounded-xl font-medium border transition-colors",
                isHero
                  ? "text-white hover:bg-white/20 border-white/30 hover:text-white hover:border-white/40"
                  : "text-neutral-700 hover:bg-neutral-100 border-neutral-300"
              )}
            >
              <span className="flex items-center gap-3">
                <SlidersHorizontal className={cn("h-4 w-4", iconStyles)} />
                Erweiterte Filter
              </span>
              <ChevronDown
                className={cn("h-4 w-4 transition-transform duration-200", iconStyles, expandedFilters ? "rotate-180" : "")}
              />
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="space-y-6 pt-6">
            {dealMode === "lease_takeover_only" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select value={selectedRestlaufzeit} onValueChange={(v) => setSelectedRestlaufzeit(v as RestlaufzeitOption)}>
                  <SelectTrigger className={cn("h-12 rounded-xl font-medium transition-colors", inputStyles)}>
                    <SelectValue placeholder="Restlaufzeit" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-neutral-200">
                    <SelectItem value="" className="font-medium">
                      Alle
                    </SelectItem>
                    <SelectItem value="0-6" className="font-medium">
                      {getRestlaufzeitLabel("0-6")}
                    </SelectItem>
                    <SelectItem value="7-12" className="font-medium">
                      {getRestlaufzeitLabel("7-12")}
                    </SelectItem>
                    <SelectItem value="13-24" className="font-medium">
                      {getRestlaufzeitLabel("13-24")}
                    </SelectItem>
                    <SelectItem value="24+" className="font-medium">
                      {getRestlaufzeitLabel("24+")}
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  type="button"
                  onClick={() => setNoDeposit((v) => !v)}
                  className={cn(
                    "h-12 rounded-xl border font-semibold justify-start px-4 transition-colors",
                    isHero ? "border-white/25 bg-white/10 text-white hover:bg-white/15" : "border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50",
                    noDeposit ? (isHero ? "ring-2 ring-white/40" : "ring-2 ring-neutral-900/20") : ""
                  )}
                >
                  Keine Kaution
                </Button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select value={selectedBody} onValueChange={setSelectedBody}>
                <SelectTrigger className={cn("h-12 rounded-xl font-medium transition-colors", inputStyles)}>
                  <SelectValue placeholder="Karosserie" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-neutral-200">
                  <SelectItem value="Limousine" className="font-medium">
                    Limousine
                  </SelectItem>
                  <SelectItem value="Kombi" className="font-medium">
                    Kombi
                  </SelectItem>
                  <SelectItem value="SUV" className="font-medium">
                    SUV
                  </SelectItem>
                  <SelectItem value="Cabrio" className="font-medium">
                    Cabrio
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedFuel} onValueChange={setSelectedFuel}>
                <SelectTrigger className={cn("h-12 rounded-xl font-medium transition-colors", inputStyles)}>
                  <SelectValue placeholder="Antrieb" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-neutral-200">
                  <SelectItem value="Benzin" className="font-medium">
                    Benzin
                  </SelectItem>
                  <SelectItem value="Diesel" className="font-medium">
                    Diesel
                  </SelectItem>
                  <SelectItem value="Hybrid" className="font-medium">
                    Hybrid
                  </SelectItem>
                  <SelectItem value="Elektro" className="font-medium">
                    Elektro
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedGearbox} onValueChange={setSelectedGearbox}>
                <SelectTrigger className={cn("h-12 rounded-xl font-medium transition-colors", inputStyles)}>
                  <SelectValue placeholder="Getriebe" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-neutral-200">
                  <SelectItem value="Automatik" className="font-medium">
                    Automatik
                  </SelectItem>
                  <SelectItem value="Manuell" className="font-medium">
                    Manuell
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CollapsibleContent>
        </Collapsible>

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