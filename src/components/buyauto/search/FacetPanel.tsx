import { SearchQuery, getAllBrands, getBrandModels, getAllCantons } from "@/lib/buyauto/search";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { X, RotateCcw } from "lucide-react";
import { useMemo, useState, useEffect } from "react";

interface FacetPanelProps {
  searchQuery: SearchQuery;
  onSearchQueryChange: (query: SearchQuery) => void;
  onApply?: () => void;
  isMobile?: boolean;
}

const BODY_TYPES = ["Limousine", "Kombi", "SUV", "Cabrio"];
const FUEL_TYPES = ["Benzin", "Diesel", "Hybrid", "Elektro"];
const GEARBOX_TYPES = ["Automatik", "Manuell"];
const YEAR_OPTIONS = [
  { value: 2018, label: "ab 2018" },
  { value: 2019, label: "ab 2019" },
  { value: 2020, label: "ab 2020" },
  { value: 2021, label: "ab 2021" },
  { value: 2022, label: "ab 2022" },
  { value: 2023, label: "ab 2023" }
];

const KM_OPTIONS = [
  { value: 20000, label: "≤ 20'000 km" },
  { value: 50000, label: "≤ 50'000 km" },
  { value: 100000, label: "≤ 100'000 km" },
  { value: 150000, label: "≤ 150'000 km" }
];

export default function FacetPanel({
  searchQuery,
  onSearchQueryChange,
  onApply,
  isMobile = false,
}: FacetPanelProps) {
  const [localQuery, setLocalQuery] = useState<SearchQuery>(searchQuery);

  // Sync local state when searchQuery changes
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  const brands = getAllBrands();
  const availableModels = useMemo(() => {
    return localQuery.brand ? getBrandModels(localQuery.brand) : [];
  }, [localQuery.brand]);

  const cantons = getAllCantons();

  const updateLocalQuery = (updates: Partial<SearchQuery>) => {
    const newQuery = { ...localQuery, ...updates };
    
    // Clear model if brand changes
    if (updates.brand !== undefined && updates.brand !== localQuery.brand) {
      newQuery.model = undefined;
    }
    
    // Reset page to 1 when filters change
    newQuery.page = 1;
    
    setLocalQuery(newQuery);
  };

  const handleApply = () => {
    onSearchQueryChange(localQuery);
    onApply?.();
  };

  const handleReset = () => {
    const resetQuery: SearchQuery = {};
    setLocalQuery(resetQuery);
    onSearchQueryChange(resetQuery);
  };

  const isArrayFieldChecked = (field: keyof SearchQuery, value: string) => {
    const fieldValue = localQuery[field];
    return Array.isArray(fieldValue) && fieldValue.includes(value);
  };

  const toggleArrayField = (field: keyof SearchQuery, value: string) => {
    const fieldValue = localQuery[field];
    let currentValues: string[] = [];
    
    if (Array.isArray(fieldValue)) {
      currentValues = fieldValue as string[];
    }
    
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    // Handle different array field types properly
    if (field === 'body') {
      updateLocalQuery({
        [field]: newValues.length > 0 ? newValues as ("Limousine" | "Kombi" | "SUV" | "Cabrio")[] : undefined
      });
    } else if (field === 'fuel') {
      updateLocalQuery({
        [field]: newValues.length > 0 ? newValues as ("Benzin" | "Diesel" | "Hybrid" | "Elektro")[] : undefined
      });
    } else if (field === 'gearbox') {
      updateLocalQuery({
        [field]: newValues.length > 0 ? newValues as ("Automatik" | "Manuell")[] : undefined
      });
    } else if (field === 'canton') {
      updateLocalQuery({
        [field]: newValues.length > 0 ? newValues : undefined
      });
    }
  };

  const CardWrapper = isMobile ? 'div' : Card;
  const headerProps = isMobile ? {} : { className: "pb-3" };

  return (
    <CardWrapper className={isMobile ? "p-6" : ""}>
      {!isMobile && (
        <CardHeader {...headerProps}>
          <CardTitle className="text-lg font-semibold text-neutral-900">
            Filter
          </CardTitle>
        </CardHeader>
      )}
      
      <CardContent className={isMobile ? "p-0" : "pt-0"}>
        {isMobile && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Filter</h2>
            <Separator />
          </div>
        )}

        <Accordion type="multiple" defaultValue={["basic", "specs", "location"]} className="w-full space-y-2">
          <AccordionItem value="basic" className="border-none">
            <AccordionTrigger className="text-sm font-medium text-neutral-700 hover:text-neutral-900 py-3 hover:no-underline">
              Fahrzeug
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pb-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-neutral-600 uppercase tracking-wide">Marke</Label>
                <Select 
                  value={localQuery.brand || "all"} 
                  onValueChange={(value) => updateLocalQuery({ brand: value === "all" ? undefined : value })}
                >
                  <SelectTrigger className="bg-white border-neutral-300 text-neutral-900">
                    <SelectValue placeholder="Alle Marken" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Marken</SelectItem>
                    {brands.map(brand => (
                      <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {availableModels.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-neutral-600 uppercase tracking-wide">Modell</Label>
                  <Select 
                    value={localQuery.model || "all"} 
                    onValueChange={(value) => updateLocalQuery({ model: value === "all" ? undefined : value })}
                  >
                    <SelectTrigger className="bg-white border-neutral-300 text-neutral-900">
                      <SelectValue placeholder="Alle Modelle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Modelle</SelectItem>
                      {availableModels.map(model => (
                        <SelectItem key={model} value={model}>{model}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-xs font-medium text-neutral-600 uppercase tracking-wide">Baujahr</Label>
                <Select 
                  value={localQuery.yearMin?.toString() || "all"} 
                  onValueChange={(value) => updateLocalQuery({ yearMin: value === "all" ? undefined : parseInt(value) })}
                >
                  <SelectTrigger className="bg-white border-neutral-300 text-neutral-900">
                    <SelectValue placeholder="Beliebig" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Beliebig</SelectItem>
                    {YEAR_OPTIONS.map(year => (
                      <SelectItem key={year.value} value={year.value.toString()}>{year.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-medium text-neutral-600 uppercase tracking-wide">Preis pro Monat</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Input
                      type="number"
                      placeholder="Min CHF"
                      value={localQuery.priceMin || ""}
                      onChange={(e) => updateLocalQuery({ 
                        priceMin: e.target.value ? parseInt(e.target.value) : undefined 
                      })}
                      className="bg-white border-neutral-300 text-neutral-900"
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      placeholder="Max CHF"
                      value={localQuery.priceMax || ""}
                      onChange={(e) => updateLocalQuery({ 
                        priceMax: e.target.value ? parseInt(e.target.value) : undefined 
                      })}
                      className="bg-white border-neutral-300 text-neutral-900"
                    />
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="specs" className="border-none">
            <AccordionTrigger className="text-sm font-medium text-neutral-700 hover:text-neutral-900 py-3 hover:no-underline">
              Eigenschaften
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pb-4">
              <div className="space-y-3">
                <Label className="text-xs font-medium text-neutral-600 uppercase tracking-wide">Karosserie</Label>
                <div className="space-y-2">
                  {BODY_TYPES.map(bodyType => (
                    <div key={bodyType} className="flex items-center space-x-2">
                      <Checkbox
                        id={`body-${bodyType}`}
                        checked={isArrayFieldChecked('body', bodyType)}
                        onCheckedChange={() => toggleArrayField('body', bodyType)}
                        className="border-neutral-400 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                      />
                      <Label htmlFor={`body-${bodyType}`} className="text-sm text-neutral-700 cursor-pointer">
                        {bodyType}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-medium text-neutral-600 uppercase tracking-wide">Antrieb</Label>
                <div className="space-y-2">
                  {FUEL_TYPES.map(fuelType => (
                    <div key={fuelType} className="flex items-center space-x-2">
                      <Checkbox
                        id={`fuel-${fuelType}`}
                        checked={isArrayFieldChecked('fuel', fuelType)}
                        onCheckedChange={() => toggleArrayField('fuel', fuelType)}
                        className="border-neutral-400 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                      />
                      <Label htmlFor={`fuel-${fuelType}`} className="text-sm text-neutral-700 cursor-pointer">
                        {fuelType}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-medium text-neutral-600 uppercase tracking-wide">Getriebe</Label>
                <div className="space-y-2">
                  {GEARBOX_TYPES.map(gearboxType => (
                    <div key={gearboxType} className="flex items-center space-x-2">
                      <Checkbox
                        id={`gearbox-${gearboxType}`}
                        checked={isArrayFieldChecked('gearbox', gearboxType)}
                        onCheckedChange={() => toggleArrayField('gearbox', gearboxType)}
                        className="border-neutral-400 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                      />
                      <Label htmlFor={`gearbox-${gearboxType}`} className="text-sm text-neutral-700 cursor-pointer">
                        {gearboxType}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-medium text-neutral-600 uppercase tracking-wide">Kilometerstand</Label>
                <div className="space-y-2">
                  {KM_OPTIONS.map(kmOption => (
                    <div key={kmOption.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`km-${kmOption.value}`}
                        checked={localQuery.kmMax === kmOption.value}
                        onCheckedChange={(checked) => updateLocalQuery({ 
                          kmMax: checked ? kmOption.value : undefined 
                        })}
                        className="border-neutral-400 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                      />
                      <Label htmlFor={`km-${kmOption.value}`} className="text-sm text-neutral-700 cursor-pointer">
                        {kmOption.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="location" className="border-none">
            <AccordionTrigger className="text-sm font-medium text-neutral-700 hover:text-neutral-900 py-3 hover:no-underline">
              Standort & Konditionen
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pb-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-neutral-600 uppercase tracking-wide">Kanton</Label>
                <Select 
                  value={localQuery.canton?.[0] || "all"} 
                  onValueChange={(value) => updateLocalQuery({ canton: value === "all" ? undefined : [value] })}
                >
                  <SelectTrigger className="bg-white border-neutral-300 text-neutral-900">
                    <SelectValue placeholder="Alle Kantone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Kantone</SelectItem>
                    {cantons.map(canton => (
                      <SelectItem key={canton} value={canton}>{canton}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="no-deposit"
                    checked={localQuery.noDeposit || false}
                    onCheckedChange={(checked) => updateLocalQuery({ noDeposit: checked === true ? true : undefined })}
                    className="border-neutral-400 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                  />
                  <Label htmlFor="no-deposit" className="text-sm text-neutral-700 cursor-pointer">
                    Keine Kaution
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="premium-only"
                    checked={localQuery.premiumOnly || false}
                    onCheckedChange={(checked) => updateLocalQuery({ premiumOnly: checked === true ? true : undefined })}
                    className="border-neutral-400 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                  />
                  <Label htmlFor="premium-only" className="text-sm text-neutral-700 cursor-pointer">
                    Nur Premium
                  </Label>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="flex gap-3 pt-6 mt-6 border-t border-neutral-200">
          <Button 
            onClick={handleApply}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium"
          >
            Filter anwenden
          </Button>
          <Button 
            onClick={handleReset}
            variant="outline"
            className="bg-transparent hover:bg-neutral-100/80 border-neutral-300 text-neutral-600 hover:text-neutral-800"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </CardWrapper>
  );
}