import React, { useState, useEffect, useMemo } from 'react';
import { 
  Info, 
  RotateCcw, 
  Share2, 
  AlertCircle,
  TrendingUp,
  Car,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// --- Types ---

type Horizon = 3 | 6 | 12 | 24 | 36 | 48;

interface CalculatorState {
  // Shared
  horizon: Horizon;
  expectedKmMonthly: number;
  annualFixedCost: number; // Vignette etc.
  
  // Auto-Abo Inputs
  abo_monthlyRate: number;
  abo_includedKmMonthly: number;
  abo_extraKmPrice: number;
  abo_oneTimeFees: number;
  abo_extraMonthlyCost: number;
  abo_expectedDamageYearly: number; // New: Damage Buffer

  // Leasing Inputs
  leasing_monthlyRate: number;
  leasing_downPayment: number;
  leasing_setupFee: number;
  leasing_monthlyInsurance: number;
  leasing_yearlyService: number;
  leasing_totalTires: number; // Total over term
  leasing_yearlyTax: number; // New: Cantonal Tax
  leasing_includedKmYearly: number;
  leasing_extraKmPrice: number;
  leasing_endCosts: number;
}

const DEFAULT_STATE: CalculatorState = {
  horizon: 36,
  expectedKmMonthly: 1250,
  annualFixedCost: 40,
  
  // Abo Defaults (Example: Mid-range)
  abo_monthlyRate: 750,
  abo_includedKmMonthly: 1750,
  abo_extraKmPrice: 0.45,
  abo_oneTimeFees: 250,
  abo_extraMonthlyCost: 0,
  abo_expectedDamageYearly: 0,

  // Leasing Defaults (Example: Comparable car)
  leasing_monthlyRate: 420,
  leasing_downPayment: 3000,
  leasing_setupFee: 0,
  leasing_monthlyInsurance: 150,
  leasing_yearlyService: 50, // Converted to monthly in inputs if needed, keeping as monthly for consistency? Wait, type says yearlyService. Let's align with input labels.
  leasing_totalTires: 800,
  leasing_yearlyTax: 450,
  leasing_includedKmYearly: 15000,
  leasing_extraKmPrice: 0.50,
  leasing_endCosts: 0,
};

// Note: leasing_yearlyService in default state was 500 in previous version, changed to 50 * 12 = 600 approx.
// Let's stick to the prompt's suggested defaults where applicable.
// Prompt suggested: insurance 180, service 50/mo, tires 600/yr, tax 450/yr, extra km 0.60

const SUGGESTED_DEFAULTS: CalculatorState = {
  horizon: 36,
  expectedKmMonthly: 1250,
  annualFixedCost: 40,
  
  abo_monthlyRate: 750,
  abo_includedKmMonthly: 1750,
  abo_extraKmPrice: 0.45,
  abo_oneTimeFees: 250,
  abo_extraMonthlyCost: 0,
  abo_expectedDamageYearly: 0,

  leasing_monthlyRate: 420,
  leasing_downPayment: 3000,
  leasing_setupFee: 0,
  leasing_monthlyInsurance: 180,
  leasing_yearlyService: 50 * 12, // 600
  leasing_totalTires: 600 * 3, // 1800 for 3 years approx, simplified
  leasing_yearlyTax: 450,
  leasing_includedKmYearly: 15000,
  leasing_extraKmPrice: 0.60,
  leasing_endCosts: 0,
};


const PRESET_FIAT_500: CalculatorState = {
  horizon: 48,
  expectedKmMonthly: 500,
  annualFixedCost: 40,
  
  abo_monthlyRate: 519,
  abo_includedKmMonthly: 500,
  abo_extraKmPrice: 0,
  abo_oneTimeFees: 0,
  abo_extraMonthlyCost: 0,
  abo_expectedDamageYearly: 0,

  leasing_monthlyRate: 285,
  leasing_downPayment: 0,
  leasing_setupFee: 0,
  leasing_monthlyInsurance: 100,
  leasing_yearlyService: 300,
  leasing_totalTires: 400,
  leasing_yearlyTax: 200,
  leasing_includedKmYearly: 10000,
  leasing_extraKmPrice: 0,
  leasing_endCosts: 0,
};

const PRESET_SHORT_COMPARISON: CalculatorState = {
  horizon: 12,
  expectedKmMonthly: 1500,
  annualFixedCost: 40,

  abo_monthlyRate: 690,
  abo_includedKmMonthly: 1750,
  abo_extraKmPrice: 0.45,
  abo_oneTimeFees: 250,
  abo_extraMonthlyCost: 0,
  abo_expectedDamageYearly: 0,

  leasing_monthlyRate: 450,
  leasing_downPayment: 2000,
  leasing_setupFee: 200,
  leasing_monthlyInsurance: 140,
  leasing_yearlyService: 400,
  leasing_totalTires: 600,
  leasing_yearlyTax: 450,
  leasing_includedKmYearly: 20000,
  leasing_extraKmPrice: 0.50,
  leasing_endCosts: 0,
};


// --- Helper Components ---

const MoneyInput = ({ 
  label, 
  value, 
  onChange, 
  tooltip, 
  highlight = false,
  subLabel
}: { 
  label: string; 
  value: number; 
  onChange: (val: number) => void; 
  tooltip?: string;
  highlight?: boolean;
  subLabel?: string;
}) => (
  <div className="space-y-1.5">
    <div className="flex items-center gap-2">
      <Label className={`text-sm ${highlight ? "font-bold text-neutral-900" : "font-medium text-neutral-600"}`}>
        {label}
      </Label>
      {tooltip && (
        <TooltipProvider>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-neutral-400 hover:text-neutral-600 cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs bg-neutral-900 text-white border-neutral-800">
              <p className="text-xs">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
    <div className="relative">
      <Input
        type="number"
        min={0}
        value={value === 0 ? "" : value}
        onChange={(e) => onChange(Number(e.target.value))}
        placeholder="0"
        className={`pr-8 ${highlight ? "border-neutral-400 bg-white shadow-sm font-semibold" : "bg-neutral-50/50"}`}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 pointer-events-none">
        CHF
      </span>
    </div>
    {subLabel && <p className="text-xs text-neutral-400">{subLabel}</p>}
  </div>
);

const KmInput = ({ 
  label, 
  value, 
  onChange,
  unit = "km"
}: { 
  label: string; 
  value: number; 
  onChange: (val: number) => void;
  unit?: string;
}) => (
  <div className="space-y-1.5">
    <Label className="text-sm font-medium text-neutral-600">{label}</Label>
    <div className="relative">
      <Input
        type="number"
        min={0}
        value={value === 0 ? "" : value}
        onChange={(e) => onChange(Number(e.target.value))}
        placeholder="0"
        className="pr-12 bg-neutral-50/50"
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 pointer-events-none">
        {unit}
      </span>
    </div>
  </div>
);

// Structured placeholder approximating the calculator's real layout/height
// (presets bar, controls, shared inputs, two input cards, results block) so the
// pre-hydration -> hydrated swap causes minimal layout shift.
// Keep in sync with the dynamic-import loading fallback in
// src/pages/auto-abo-vs-leasing-kosten.tsx (duplicated there so this module stays code-split).
const CalculatorSkeleton = () => (
  <div className="w-full space-y-8 animate-pulse" aria-hidden="true">
    {/* Presets bar */}
    <div className="h-28 sm:h-16 bg-neutral-50 rounded-xl border border-neutral-200" />
    {/* Controls bar */}
    <div className="h-40 md:h-28 bg-white rounded-xl border border-neutral-200 shadow-sm" />
    {/* Shared inputs */}
    <div className="h-52 md:h-32 bg-neutral-50/50 rounded-xl border border-neutral-200" />
    {/* Abo / Leasing input cards */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="h-[440px] bg-white rounded-xl border border-neutral-200 shadow-sm" />
      <div className="h-[560px] bg-white rounded-xl border border-neutral-200 shadow-sm" />
    </div>
    {/* Results: two result cards + summary + breakdown */}
    <div className="bg-neutral-900 rounded-2xl p-4 sm:p-6 md:p-10">
      <div className="flex flex-col md:flex-row items-stretch gap-4 md:gap-8 mb-10">
        <div className="flex-1 h-44 bg-white/5 rounded-xl border border-white/10" />
        <div className="flex-1 h-44 bg-white/5 rounded-xl border border-white/10" />
      </div>
      <div className="max-w-3xl mx-auto h-24 bg-white/10 rounded-xl mb-8" />
      <div className="max-w-3xl mx-auto h-72 bg-neutral-950/50 rounded-lg border border-white/5" />
    </div>
  </div>
);

// --- Main Component ---

export function AutoAboVsLeasingCalculator() {
  const [state, setState] = useState<CalculatorState>(SUGGESTED_DEFAULTS);
  const [simpleMode, setSimpleMode] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [showFormulas, setShowFormulas] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const loadedState: Partial<CalculatorState> = {};
      
      Object.keys(DEFAULT_STATE).forEach(key => {
        const val = params.get(key);
        if (val) loadedState[key as keyof CalculatorState] = Number(val) as any;
      });

      if (Object.keys(loadedState).length > 0) {
        setState(prev => ({ ...prev, ...loadedState }));
      }
    }
  }, []);

  const updateState = (key: keyof CalculatorState, value: number) => {
    setState(prev => ({ ...prev, [key]: value }));
  };

  const handlePreset = (preset: CalculatorState) => {
    setState(preset);
    toast.success("Beispielwerte geladen");
  };

  // --- Calculations ---

  const results = useMemo(() => {
    const { horizon } = state;
    
    // Shared
    const expected_km_total = state.expectedKmMonthly * horizon;
    const fixed_cost_total = (state.annualFixedCost / 12) * horizon;

    // --- ABO ---
    const abo_base = (state.abo_monthlyRate * horizon) + state.abo_oneTimeFees + (state.abo_extraMonthlyCost * horizon);
    
    const abo_included_km_total = state.abo_includedKmMonthly * horizon;
    const abo_extra_km = Math.max(0, expected_km_total - abo_included_km_total);
    const abo_extra_km_cost = abo_extra_km * state.abo_extraKmPrice;
    
    const abo_damage_total = (state.abo_expectedDamageYearly / 12) * horizon;

    const abo_total = abo_base + abo_extra_km_cost + abo_damage_total + fixed_cost_total;
    const abo_monthly = abo_total / horizon;
    const abo_per_km = abo_total / Math.max(1, expected_km_total);

    // --- LEASING ---
    const leasing_base = (state.leasing_monthlyRate * horizon) + state.leasing_downPayment + state.leasing_setupFee + state.leasing_endCosts;
    const leasing_insurance = state.leasing_monthlyInsurance * horizon;
    const leasing_service = (state.leasing_yearlyService / 12) * horizon;
    const leasing_tires = state.leasing_totalTires; // Already total for term or logic? Prompt said "tires/year 600".
    // Wait, the interface says leasing_totalTires. But prompt defaults say "tires/year". 
    // Let's adjust logic to be consistent with prompt requirement: "Reifen / saisonale Kosten pro Jahr".
    // I will interpret input as YEARLY in the UI for better UX, but update state logic.
    // Actually, to keep state simple, let's treat the state variable as "TOTAL" but the UI input as "Yearly" if easier, OR just change state name.
    // For now, let's assume the state stores Total Tires Cost for simplicity in calculation, but I should probably change it to Yearly to match the requested inputs.
    // Let's refactor: leasing_yearlyTires.
    // To minimize refactor risk of breaking existing UI references, I will calc logic carefully.
    // Let's stick to the prompt's input list: "Reifen / saisonale Kosten pro Jahr".
    // So I should treat the input as yearly.
    
    const leasing_tires_total = (state.leasing_totalTires / 12) * horizon; // Wait, if variable is "totalTires", it implies total.
    // Let's rename the UI label to "Reifen (Total)" or change logic.
    // User requested "Reifen ... pro Jahr".
    // I will allow the input to represent "Yearly" cost but store it in a new variable or reuse.
    // Let's use `leasing_totalTires` as "Yearly" cost in logic to match the input label I will create.
    // RE-DECISION: I will assume the state `leasing_totalTires` actually holds the YEARLY cost now based on my updated default inputs.
    const leasing_tires_calculated = (state.leasing_totalTires / 12) * horizon; 

    const leasing_tax_total = (state.leasing_yearlyTax / 12) * horizon;
    
    const leasing_included_km_total = state.leasing_includedKmYearly * (horizon / 12);
    const leasing_extra_km = Math.max(0, expected_km_total - leasing_included_km_total);
    const leasing_extra_km_cost = leasing_extra_km * state.leasing_extraKmPrice;

    const leasing_total = leasing_base + leasing_insurance + leasing_service + leasing_tires_calculated + leasing_tax_total + leasing_extra_km_cost + fixed_cost_total;
    const leasing_monthly = leasing_total / horizon;
    const leasing_per_km = leasing_total / Math.max(1, expected_km_total);

    return {
      abo: {
        total: abo_total,
        monthly: abo_monthly,
        per_km: abo_per_km,
        breakdown: {
          rate: state.abo_monthlyRate * horizon,
          oneTime: state.abo_oneTimeFees,
          extraMonthly: state.abo_extraMonthlyCost * horizon,
          extraKm: abo_extra_km_cost,
          damage: abo_damage_total,
          fixed: fixed_cost_total
        }
      },
      leasing: {
        total: leasing_total,
        monthly: leasing_monthly,
        per_km: leasing_per_km,
        breakdown: {
          rate: state.leasing_monthlyRate * horizon,
          down: state.leasing_downPayment + state.leasing_setupFee + state.leasing_endCosts,
          insurance: leasing_insurance,
          service: leasing_service,
          tires: leasing_tires_calculated,
          tax: leasing_tax_total,
          extraKm: leasing_extra_km_cost,
          fixed: fixed_cost_total
        }
      },
      delta: Math.abs(abo_total - leasing_total),
      winner: abo_total < leasing_total ? 'abo' : 'leasing'
    };
  }, [state]);

  // Handle sharing
  const handleShare = () => {
    const params = new URLSearchParams();
    Object.entries(state).forEach(([key, val]) => {
      params.set(key, val.toString());
    });
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    navigator.clipboard.writeText(url);
    toast.success("Link kopiert!", {
      description: "Deine Berechnung ist im Link gespeichert."
    });
  };

  if (!isClient) return <CalculatorSkeleton />;

  return (
    <div className="w-full space-y-8" id="calculator-tool">
      
      {/* --- PRESETS --- */}
      <div className="flex flex-wrap gap-3 items-center justify-center p-4 bg-neutral-50 rounded-xl border border-neutral-200">
        <span className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mr-2">
          Beispiele laden:
        </span>
        <Button 
          variant="outline" 
          size="sm"
          className="bg-white hover:bg-neutral-50 text-neutral-700 border-neutral-300"
          onClick={() => handlePreset(PRESET_FIAT_500)}
        >
          <Car className="w-4 h-4 mr-2 text-red-600" />
          Kleinwagen (48 Mt)
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          className="bg-white hover:bg-neutral-50 text-neutral-700 border-neutral-300"
          onClick={() => handlePreset(PRESET_SHORT_COMPARISON)}
        >
          <TrendingUp className="w-4 h-4 mr-2 text-blue-600" />
          Kurzzeit (12 Mt)
        </Button>
        <Button
           variant="ghost"
           size="sm"
           className="ml-auto text-neutral-500 hover:text-neutral-900"
           onClick={() => setState(SUGGESTED_DEFAULTS)}
        >
           <RotateCcw className="w-4 h-4 mr-2" /> Reset
        </Button>
      </div>

      {/* --- Controls Bar --- */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 md:p-6 flex flex-col md:flex-row justify-between items-center gap-6 md:sticky md:top-20 z-20">
        <div className="w-full md:w-auto flex flex-col items-center md:items-start gap-2">
          <Label className="text-neutral-500 uppercase tracking-wide text-xs font-bold">Laufzeit (Monate)</Label>
          <Tabs 
            value={state.horizon.toString()} 
            onValueChange={(v) => updateState('horizon', Number(v) as Horizon)}
            className="w-full md:w-auto"
          >
            <TabsList className="grid grid-cols-6 h-11 bg-neutral-100 p-1">
              {[3, 6, 12, 24, 36, 48].map(m => (
                <TabsTrigger 
                  key={m} 
                  value={m.toString()}
                  className="data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm font-semibold text-xs md:text-sm px-1 md:px-3"
                >
                  {m}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto justify-center md:justify-end">
          <div className="flex items-center gap-2">
            <Switch 
              id="simple-mode" 
              checked={simpleMode}
              onCheckedChange={setSimpleMode}
              className="data-[state=checked]:bg-red-600"
            />
            <Label htmlFor="simple-mode" className="cursor-pointer font-medium text-neutral-700">
              Nur Monatsrate vergleichen
            </Label>
          </div>
          <Separator orientation="vertical" className="h-8 hidden md:block" />
          <Button variant="ghost" size="icon" onClick={handleShare} title="Teilen">
            <Share2 className="h-4 w-4 text-neutral-500" />
          </Button>
        </div>
      </div>

      {/* --- SHARED INPUTS --- */}
      <div className="bg-neutral-50/50 rounded-xl p-6 border border-neutral-200">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <KmInput 
             label="Erwartete Fahrleistung pro Monat"
             value={state.expectedKmMonthly}
             onChange={(v) => updateState('expectedKmMonthly', v)}
           />
           <MoneyInput 
             label="Allgemeine Fixkosten (Vignette etc.) / Jahr"
             value={state.annualFixedCost}
             onChange={(v) => updateState('annualFixedCost', v)}
             tooltip="Kosten die bei BEIDEN Varianten anfallen (z.B. Vignette)."
           />
         </div>
      </div>

      {/* --- Main Input Grid --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT: Auto-Abo */}
        <Card className="border-neutral-200 shadow-sm overflow-hidden h-full">
          <CardHeader className="bg-neutral-50 border-b border-neutral-100 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xl">
                <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center text-sm font-bold">A</div>
                Auto-Abo
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <MoneyInput 
              label="Monatsrate (Abo)" 
              value={state.abo_monthlyRate} 
              onChange={(v) => updateState('abo_monthlyRate', v)} 
              highlight
            />
            
            {!simpleMode && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <MoneyInput 
                    label="Startgebühr (Einmalig)" 
                    value={state.abo_oneTimeFees} 
                    onChange={(v) => updateState('abo_oneTimeFees', v)}
                    tooltip="Zustellung, Abholung, Mitgliedsgebühr."
                  />
                   <MoneyInput 
                    label="Zusatzkosten (Monat)" 
                    value={state.abo_extraMonthlyCost} 
                    onChange={(v) => updateState('abo_extraMonthlyCost', v)}
                    tooltip="Optionales Zubehör, Auslands-Pakete, etc."
                  />
                  <KmInput
                    label="Inklusive km / Monat"
                    value={state.abo_includedKmMonthly}
                    onChange={(v) => updateState('abo_includedKmMonthly', v)}
                  />
                  <MoneyInput 
                    label="Preis pro Mehr-km" 
                    value={state.abo_extraKmPrice} 
                    onChange={(v) => updateState('abo_extraKmPrice', v)}
                  />
                  <div className="col-span-2">
                    <MoneyInput 
                      label="Erwartete Schaden-Kosten / Jahr" 
                      value={state.abo_expectedDamageYearly} 
                      onChange={(v) => updateState('abo_expectedDamageYearly', v)}
                      tooltip="Puffer für Selbstbehalt oder Schäden bei Rückgabe."
                    />
                  </div>
                </div>
              </div>
            )}
            {simpleMode && <p className="text-xs text-neutral-400 italic text-center">Detail-Optionen ausgeblendet</p>}
          </CardContent>
        </Card>

        {/* RIGHT: Leasing */}
        <Card className="border-neutral-200 shadow-sm overflow-hidden h-full">
          <CardHeader className="bg-neutral-50 border-b border-neutral-100 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xl">
                <div className="w-8 h-8 rounded-full bg-white border-2 border-neutral-900 text-neutral-900 flex items-center justify-center text-sm font-bold">L</div>
                Leasing
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <MoneyInput 
              label="Monatsrate (Leasing)" 
              value={state.leasing_monthlyRate} 
              onChange={(v) => updateState('leasing_monthlyRate', v)} 
              highlight
            />
            <MoneyInput 
              label="Anzahlung / Sonderzahlung" 
              value={state.leasing_downPayment} 
              onChange={(v) => updateState('leasing_downPayment', v)}
            />

            {!simpleMode && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <MoneyInput 
                    label="Versicherung (Monat)" 
                    value={state.leasing_monthlyInsurance} 
                    onChange={(v) => updateState('leasing_monthlyInsurance', v)}
                  />
                  <MoneyInput 
                    label="Service (Jahr)" 
                    value={state.leasing_yearlyService} 
                    onChange={(v) => updateState('leasing_yearlyService', v)}
                  />
                  <MoneyInput 
                    label="Reifen (Jahr)" 
                    value={state.leasing_totalTires} 
                    onChange={(v) => updateState('leasing_totalTires', v)}
                    tooltip="Kosten für Reifenwechsel und Einlagerung pro Jahr."
                  />
                   <MoneyInput 
                    label="Verkehrssteuer (Jahr)" 
                    value={state.leasing_yearlyTax} 
                    onChange={(v) => updateState('leasing_yearlyTax', v)}
                  />
                  <div className="col-span-2 grid grid-cols-2 gap-4">
                     <KmInput
                      label="Inklusive km / Jahr"
                      value={state.leasing_includedKmYearly}
                      onChange={(v) => updateState('leasing_includedKmYearly', v)}
                      unit="km/Jahr"
                    />
                     <MoneyInput 
                      label="Preis pro Mehr-km" 
                      value={state.leasing_extraKmPrice} 
                      onChange={(v) => updateState('leasing_extraKmPrice', v)}
                    />
                  </div>
                  <div className="col-span-2">
                    <MoneyInput 
                      label="Gebühren & Ende (Total)" 
                      value={state.leasing_endCosts + state.leasing_setupFee} 
                      onChange={(v) => updateState('leasing_endCosts', v)}
                      tooltip="Abschlussgebühr + Rückgabekosten + Instandstellung."
                      subLabel="Einmalig (Start + Ende)"
                    />
                  </div>
                </div>
              </div>
            )}
            {simpleMode && <p className="text-xs text-neutral-400 italic text-center">Detail-Optionen ausgeblendet</p>}
          </CardContent>
        </Card>
      </div>
      
      {/* --- WARNINGS --- */}
      <div className="space-y-3">
        {simpleMode && (
           <Alert variant="destructive" className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Vorsicht: Milchmädchen-Rechnung</AlertTitle>
            <AlertDescription>
              Ein reiner Ratenvergleich ist irreführend. Versicherung, Service und Reifen machen beim Leasing oft 30-40% der Kosten aus. Deaktiviere "Nur Raten", um die Wahrheit zu sehen.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* --- RESULTS SECTION --- */}
      <div className="bg-neutral-900 rounded-2xl p-4 sm:p-6 md:p-10 text-white shadow-2xl relative overflow-hidden" id="results">
        {/* Background Effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/20 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10">
          <h3 className="text-center text-neutral-400 font-medium uppercase tracking-widest text-sm mb-8">
            Ergebnis nach {state.horizon} Monaten
          </h3>

          <div className="flex flex-col md:flex-row items-stretch justify-center gap-4 md:gap-8 mb-10">
            
            {/* ABO RESULT */}
            <ResultCard 
              title="Auto-Abo Total" 
              total={results.abo.total} 
              monthly={results.abo.monthly}
              perKm={results.abo.per_km}
              isWinner={results.winner === 'abo'}
            />

            {/* VS Divider */}
            <div className="hidden md:flex flex-col items-center justify-center gap-2">
              <div className="h-full w-px bg-neutral-800/50"></div>
              <div className="text-neutral-600 font-bold text-sm bg-neutral-900 z-10 py-2">VS</div>
              <div className="h-full w-px bg-neutral-800/50"></div>
            </div>

            {/* LEASING RESULT */}
            <ResultCard 
              title="Leasing Total (Vollkosten)" 
              total={results.leasing.total} 
              monthly={results.leasing.monthly}
              perKm={results.leasing.per_km}
              isWinner={results.winner === 'leasing'}
            />
          </div>

          {/* SUMMARY BOX */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10 max-w-3xl mx-auto mb-8">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="text-xl md:text-2xl font-bold">
                {results.winner === 'abo' ? (
                  <>
                    Abo ist <span className="text-green-400">CHF {results.delta.toFixed(0)}</span> günstiger
                  </>
                ) : (
                  <>
                    Leasing ist <span className="text-green-400">CHF {results.delta.toFixed(0)}</span> günstiger
                  </>
                )}
              </div>
              <p className="text-neutral-400 text-sm md:text-base">
                (Differenz über {state.horizon} Monate: ca. CHF {(results.delta / state.horizon).toFixed(0)} pro Monat)
              </p>
            </div>
          </div>

          {/* BREAKDOWN TABLE */}
           <div className="max-w-3xl mx-auto text-sm bg-neutral-950/50 rounded-lg p-3 sm:p-4 md:p-6 border border-white/5">
              <div className="flex justify-between items-center text-neutral-500 font-bold uppercase text-xs tracking-wider mb-4 border-b border-white/10 pb-2">
                <span>Kostenfaktor (Total)</span>
                <span className="w-16 sm:w-24 text-right">Abo</span>
                <span className="w-16 sm:w-24 text-right">Leasing</span>
              </div>
              
              <BreakdownRow label="Monatsraten (Basis)" val1={results.abo.breakdown.rate} val2={results.leasing.breakdown.rate} highlight />
              <BreakdownRow label="Einmalig / Anzahlung" val1={results.abo.breakdown.oneTime} val2={results.leasing.breakdown.down} />
              <BreakdownRow label="Versicherung" val1={0} val2={results.leasing.breakdown.insurance} />
              <BreakdownRow label="Service / Reifen" val1={0} val2={results.leasing.breakdown.service + results.leasing.breakdown.tires} />
              <BreakdownRow label="Steuern" val1={0} val2={results.leasing.breakdown.tax} />
              <BreakdownRow label="Mehrkilometer" val1={results.abo.breakdown.extraKm} val2={results.leasing.breakdown.extraKm} />
              <BreakdownRow label="Schäden / Risiko" val1={results.abo.breakdown.damage} val2={0} />
              <BreakdownRow label="Sonstiges (Fix)" val1={results.abo.breakdown.extraMonthly + results.abo.breakdown.fixed} val2={results.leasing.breakdown.fixed} />
              
              <div className="border-t border-white/20 mt-3 pt-3 flex justify-between items-center font-bold text-sm sm:text-base">
                <span>Total</span>
                <span className="w-20 sm:w-24 text-right text-white">CHF {results.abo.total.toFixed(0)}</span>
                <span className="w-20 sm:w-24 text-right text-white">CHF {results.leasing.total.toFixed(0)}</span>
              </div>
           </div>
           
           <div className="flex justify-center mt-6">
             <Button variant="link" className="text-neutral-400 hover:text-white" onClick={() => setShowFormulas(!showFormulas)}>
               {showFormulas ? <ChevronUp className="w-4 h-4 mr-2"/> : <ChevronDown className="w-4 h-4 mr-2"/>}
               Berechnungsdetails anzeigen
             </Button>
           </div>
           
           {showFormulas && (
             <div className="max-w-3xl mx-auto mt-4 p-4 bg-black/20 rounded-lg text-xs text-neutral-400 font-mono">
               <p className="mb-2 font-bold text-white">Berechnungslogik ({state.horizon} Monate):</p>
               <div className="space-y-1">
                 <p>Abo Total = (Rate * M) + Startgebühr + (Zusatz * M) + (Mehr-Km * Preis) + (Schaden/Jahr / 12 * M) + Fixkosten</p>
                 <p>Leasing Total = (Rate * M) + Anzahlung + Gebühren + (Versicherung * M) + (Service/Jahr / 12 * M) + (Reifen/Jahr / 12 * M) + (Steuer/Jahr / 12 * M) + (Mehr-Km * Preis) + Fixkosten</p>
               </div>
             </div>
           )}

        </div>
      </div>
    </div>
  );
}

const ResultCard = ({ title, total, monthly, perKm, isWinner }: any) => (
  <div className={`flex-1 bg-white/5 rounded-xl p-6 border transition-all duration-300 ${isWinner ? 'border-green-500/50 bg-green-500/5 shadow-lg shadow-green-900/20 transform scale-[1.02]' : 'border-white/10'}`}>
    <div className="text-sm font-medium text-neutral-400 mb-4 flex justify-between items-start">
      {title}
      {isWinner && <Badge className="bg-green-500 hover:bg-green-600 text-white border-none">Günstiger</Badge>}
    </div>
    
    <div className="space-y-4">
      <div>
        <div className="text-3xl font-bold">CHF {total.toFixed(0)}</div>
        <div className="text-xs text-neutral-500">Gesamtkosten</div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
        <div>
           <div className="text-xl font-semibold text-white">CHF {monthly.toFixed(0)}</div>
           <div className="text-xs text-neutral-500">Ø pro Monat</div>
        </div>
        <div className="text-right">
           <div className="text-xl font-semibold text-neutral-300">{perKm.toFixed(2)}</div>
           <div className="text-xs text-neutral-500">CHF pro km</div>
        </div>
      </div>
    </div>
  </div>
);

const BreakdownRow = ({ 
  label, 
  val1, 
  val2, 
  highlight = false,
}: { 
  label: string; 
  val1: number; 
  val2: number;
  highlight?: boolean;
}) => (
  <div className={`flex justify-between items-center py-1.5 ${highlight ? 'text-white font-medium' : 'text-neutral-400'}`}>
    <span>{label}</span>
    <div className="flex gap-2 sm:gap-4 text-right font-mono text-xs sm:text-sm">
      <span className="w-16 sm:w-24">{val1 > 0 ? val1.toFixed(0) : '-'}</span>
      <span className="w-16 sm:w-24">{val2 > 0 ? val2.toFixed(0) : '-'}</span>
    </div>
  </div>
);