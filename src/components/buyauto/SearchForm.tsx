"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { getBrands, getModelsForBrand } from "@/services/listingsService";

interface SearchFormProps {
  variant?: "default" | "hero";
}

type RestlaufzeitOption = "" | "0-6" | "7-12" | "13-24" | "24+";

function getRestlaufzeitLabel(option: RestlaufzeitOption): string {
  if (option === "0-6") return "≤ 6 Monate";
  if (option === "7-12") return "7–12 Monate";
  if (option === "13-24") return "13–24 Monate";
  if (option === "24+") return "≥ 24 Monate";
  return "Alle";
}

function formatChf(value: number): string {
  return `CHF ${value.toLocaleString("de-CH")}`;
}

export default function SearchForm({ variant = "default" }: SearchFormProps) {
  const router = useRouter();
  const isHero = variant === "hero";

  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  const [includeLeasingOffers, setIncludeLeasingOffers] = useState(false);
  const [includeLeaseTakeovers, setIncludeLeaseTakeovers] = useState(false);

  const [selectedRestlaufzeit, setSelectedRestlaufzeit] = useState<RestlaufzeitOption>("");
  const [noDeposit, setNoDeposit] = useState(false);

  const [priceRange, setPriceRange] = useState<number[]>([2000]);

  const [selectedBody, setSelectedBody] = useState("");
  const [selectedFuel, setSelectedFuel] = useState("");
  const [selectedGearbox, setSelectedGearbox] = useState("");

  const [brands, setBrands] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [loadingModels, setLoadingModels] = useState(false);

  const [expandedFilters, setExpandedFilters] = useState(false);

  const monthlyPriceEnabled = includeLeasingOffers || includeLeaseTakeovers;
  const leaseTakeoversOnly = includeLeaseTakeovers && !includeLeasingOffers;
  const leasingOffersOnly = includeLeasingOffers && !includeLeaseTakeovers;
  const monthlyBundle = includeLeasingOffers && includeLeaseTakeovers;

  const sliderConfig = useMemo(() => {
    return {
      min: 200,
      max: 2000,
      step: 50,
      label: "Maximaler Preis pro Monat",
      maxSuffix: "+",
    };
  }, []);

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
    if (!monthlyPriceEnabled) {
      setPriceRange([sliderConfig.max]);
    }
  }, [monthlyPriceEnabled, sliderConfig.max]);

  useEffect(() => {
    if (!leaseTakeoversOnly) {
      setSelectedRestlaufzeit("");
      setNoDeposit(false);
    }
  }, [leaseTakeoversOnly]);

  const handleBrandChange = (brand: string) => {
    setSelectedBrand(brand);
    setSelectedModel("");
  };

  const isPriceFilterActive =
    monthlyPriceEnabled && (priceRange[0] ?? sliderConfig.max) < sliderConfig.max;

  const calculateGradientOpacity = () => {
    const price = priceRange[0] ?? sliderConfig.max;
    const percentage = price / sliderConfig.max;
    return Math.min(percentage * 0.8, 0.8);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const queryParams: Record<string, string | string[]> = { page: "1" };

    if (leasingOffersOnly) {
      queryParams.dealType = "direct_purchase";
      queryParams.financingType = "leasing";
    } else if (leaseTakeoversOnly) {
      queryParams.dealType = "lease_takeover";
    } else if (monthlyBundle) {
      queryParams.monthlyOnly = "true";
    }

    if (selectedBrand) queryParams.brand = selectedBrand;
    if (selectedModel) queryParams.model = selectedModel;
    if (selectedYear) queryParams.yearMin = selectedYear;

    if (isPriceFilterActive) {
      queryParams.priceMax = (priceRange[0] ?? sliderConfig.max).toString();
    }

    if (leaseTakeoversOnly && noDeposit) queryParams.noDeposit = "true";
    if (selectedBody) queryParams.body = [selectedBody];
    if (selectedFuel) queryParams.fuel = [selectedFuel];
    if (selectedGearbox) queryParams.gearbox = [selectedGearbox];

    if (leaseTakeoversOnly && selectedRestlaufzeit) {
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

  const checkboxContainerStyles = isHero ? "bg-white/15 border-white/25" : "bg-neutral-50 border-neutral-200";
  const checkboxLabelStyles = isHero ? "text-white" : "text-neutral-800";
  const checkboxHintStyles = isHero ? "text-neutral-200" : "text-neutral-600";

  return (
    <Card className={cn("rounded-3xl p-6 md:p-8 max-w-4xl mx-auto border transition-all duration-300", cardStyles)}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          <Select value={selectedModel} onValueChange={setSelectedModel} disabled={!selectedBrand || loadingModels}>
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

        <div
          className={cn(
            "rounded-2xl border p-4",
            isHero ? "border-white/25 bg-white/10" : "border-neutral-200 bg-white"
          )}
        >
          <div className={cn("text-sm font-semibold mb-3", isHero ? "text-white" : "text-neutral-900")}>
            Monatliche Angebote
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              className={cn(
                "flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors",
                checkboxContainerStyles,
                isHero ? "hover:bg-white/20" : "hover:bg-neutral-50"
              )}
            >
              <Checkbox
                id="leasing-offers"
                checked={includeLeasingOffers}
                onCheckedChange={(checked) => setIncludeLeasingOffers(!!checked)}
                className="mt-0.5 border-neutral-400 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
              />
              <span className="space-y-0.5">
                <span className={cn("block text-sm font-semibold", checkboxLabelStyles)}>Leasingangebote</span>
                <span className={cn("block text-xs", checkboxHintStyles)}>Fahrzeuge mit aktiviertem Leasing-Angebot</span>
              </span>
            </label>

            <label
              className={cn(
                "flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors",
                checkboxContainerStyles,
                isHero ? "hover:bg-white/20" : "hover:bg-neutral-50"
              )}
            >
              <Checkbox
                id="lease-takeovers"
                checked={includeLeaseTakeovers}
                onCheckedChange={(checked) => setIncludeLeaseTakeovers(!!checked)}
                className="mt-0.5 border-neutral-400 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
              />
              <span className="space-y-0.5">
                <span className={cn("block text-sm font-semibold", checkboxLabelStyles)}>Leasingübernahmen</span>
                <span className={cn("block text-xs", checkboxHintStyles)}>Bestehende Leasingverträge übernehmen</span>
              </span>
            </label>
          </div>

          {!monthlyPriceEnabled ? (
            <p className={cn("mt-3 text-xs font-medium", subTextStyles)}>
              Wähle <span className={cn("font-semibold", isHero ? "text-white" : "text-neutral-900")}>Leasingangebote</span> oder{" "}
              <span className={cn("font-semibold", isHero ? "text-white" : "text-neutral-900")}>Leasingübernahmen</span>, um nach monatlichen Preisen zu filtern.
            </p>
          ) : (
            <div className="mt-5">
              <label className={cn("block text-sm font-semibold mb-4 tracking-wide", labelStyles)}>
                {sliderConfig.label}: {formatChf(priceRange[0] ?? sliderConfig.max)}
                {(priceRange[0] ?? sliderConfig.max) === sliderConfig.max ? sliderConfig.maxSuffix : ""}
              </label>

              <div
                className="absolute inset-x-0 top-12 h-2 rounded-full transition-all duration-500"
                style={{
                  background: `linear-gradient(to right,
                  rgb(163 163 163 / 0.3) 0%,
                  rgb(239 68 68 / ${calculateGradientOpacity() * 0.4}) ${((priceRange[0] ?? sliderConfig.max) / sliderConfig.max) * 100}%,
                  rgb(220 38 38 / ${calculateGradientOpacity()}) ${((priceRange[0] ?? sliderConfig.max) / sliderConfig.max) * 100}%,
                  rgb(163 163 163 / 0.1) 100%)`,
                }}
              />

              <div className="relative pt-2">
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
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

              {monthlyBundle && (
                <p className={cn("mt-3 text-xs font-medium", subTextStyles)}>
                  Filter gilt für Leasingangebote und Leasingübernahmen.
                </p>
              )}
            </div>
          )}
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
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  iconStyles,
                  expandedFilters ? "rotate-180" : ""
                )}
              />
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="space-y-6 pt-6">
            {leaseTakeoversOnly && (
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

                <div className={cn("flex items-center space-x-3 p-4 rounded-xl border", checkboxContainerStyles)}>
                  <Checkbox
                    id="no-deposit"
                    checked={noDeposit}
                    onCheckedChange={(checked) => setNoDeposit(!!checked)}
                    className="border-neutral-400 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                  />
                  <label htmlFor="no-deposit" className={cn("text-sm font-medium cursor-pointer", labelStyles)}>
                    Keine Kaution
                  </label>
                </div>
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