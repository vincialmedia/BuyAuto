import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Info,
  RotateCcw,
  Plus,
  Trash2,
  Lock,
  Calculator,
  Car,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useAuth } from "@/contexts/AuthContext";

// --- Types ---

interface CompRow {
  price: number; // Inseratspreis des Vergleichsfahrzeugs (CHF)
  km: number;    // Kilometerstand des Vergleichsfahrzeugs
}

type MarginMode = 'percent' | 'fixed';

interface CalculatorState {
  vehicleLabel: string;
  vehicleKm: number;
  comps: CompRow[];
  kmRate: number;        // CHF pro km Laufleistungs-Differenz
  reconCost: number;     // Aufbereitung & Reparaturen (fix)
  warrantyCost: number;  // Garantie-Rückstellung (fix)
  standingCost: number;  // Standzeit & Kapitalbindung (fix)
  marginMode: MarginMode;
  marginPercent: number; // Marge in % vom Marktwert
  marginFixed: number;   // Marge als Fixbetrag
}

interface CalcResult {
  adjustedPrices: number[];
  marketValue: number;
  marketMin: number;
  marketMax: number;
  reconCost: number;
  warrantyCost: number;
  standingCost: number;
  marginValue: number;
  totalDeductions: number;
  offer: number;
  offerMin: number;
  offerMax: number;
  offerShare: number; // Eintauschwert in % vom Marktwert
  compCount: number;
}

const DEFAULT_STATE: CalculatorState = {
  vehicleLabel: "",
  vehicleKm: 80000,
  comps: [
    { price: 0, km: 0 },
    { price: 0, km: 0 },
    { price: 0, km: 0 },
  ],
  kmRate: 0.10,
  reconCost: 800,
  warrantyCost: 500,
  standingCost: 300,
  marginMode: 'percent',
  marginPercent: 12,
  marginFixed: 1500,
};

const PRESET_GOLF: CalculatorState = {
  vehicleLabel: "VW Golf 1.5 TSI (2020)",
  vehicleKm: 78000,
  comps: [
    { price: 18900, km: 65000 },
    { price: 17500, km: 82000 },
    { price: 16900, km: 95000 },
  ],
  kmRate: 0.10,
  reconCost: 800,
  warrantyCost: 500,
  standingCost: 300,
  marginMode: 'percent',
  marginPercent: 12,
  marginFixed: 1500,
};

const MAX_COMPS = 6;

// localStorage flag for the one free anonymous calculation. Deliberately simple:
// this is a lead magnet, not DRM — a cleared cache just grants another freebie.
const FREE_LOOKUP_KEY = "buyauto_eintausch_free_used";

const chf = (v: number) =>
  Math.round(v).toLocaleString("de-CH");

// Dealers quote round numbers — snap the offer to CHF 50 steps.
const roundTo50 = (v: number) => Math.round(v / 50) * 50;

const median = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

function compute(state: CalculatorState): CalcResult | null {
  const validComps = state.comps.filter((c) => c.price > 0);
  if (validComps.length === 0) return null;

  // Laufleistungs-Angleich: hat das Vergleichsfahrzeug MEHR km als unseres,
  // ist unser Fahrzeug entsprechend mehr wert (und umgekehrt).
  const adjustedPrices = validComps.map(
    (c) => c.price + (c.km - state.vehicleKm) * state.kmRate
  );

  const marketValue = median(adjustedPrices);
  const marketMin = Math.min(...adjustedPrices);
  const marketMax = Math.max(...adjustedPrices);

  const marginValue =
    state.marginMode === 'percent'
      ? marketValue * (state.marginPercent / 100)
      : state.marginFixed;

  const totalDeductions =
    state.reconCost + state.warrantyCost + state.standingCost + marginValue;

  const offer = Math.max(0, roundTo50(marketValue - totalDeductions));
  const offerMin = Math.max(0, roundTo50(marketMin - totalDeductions));
  const offerMax = Math.max(0, roundTo50(marketMax - totalDeductions));

  return {
    adjustedPrices,
    marketValue,
    marketMin,
    marketMax,
    reconCost: state.reconCost,
    warrantyCost: state.warrantyCost,
    standingCost: state.standingCost,
    marginValue,
    totalDeductions,
    offer,
    offerMin,
    offerMax,
    offerShare: marketValue > 0 ? (offer / marketValue) * 100 : 0,
    compCount: validComps.length,
  };
}

// --- Helper Components ---

const MoneyInput = ({
  label,
  value,
  onChange,
  tooltip,
  highlight = false,
  unit = "CHF",
  step,
}: {
  label: string;
  value: number;
  onChange: (val: number) => void;
  tooltip?: string;
  highlight?: boolean;
  unit?: string;
  step?: string;
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
        step={step}
        value={value === 0 ? "" : value}
        onChange={(e) => onChange(Number(e.target.value))}
        placeholder="0"
        className={`pr-12 ${highlight ? "border-neutral-400 bg-white shadow-sm font-semibold" : "bg-neutral-50/50"}`}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 pointer-events-none">
        {unit}
      </span>
    </div>
  </div>
);

// Structured placeholder approximating the calculator's real layout/height so the
// pre-hydration -> hydrated swap causes minimal layout shift. Keep in sync with the
// dynamic-import loading fallback in src/pages/eintauschwert-rechner.tsx.
const CalculatorSkeleton = () => (
  <div className="w-full space-y-8 animate-pulse" aria-hidden="true">
    {/* Presets bar */}
    <div className="h-24 sm:h-16 bg-neutral-50 rounded-xl border border-neutral-200" />
    {/* Vehicle + comps card / deductions card */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="h-[520px] bg-white rounded-xl border border-neutral-200 shadow-sm" />
      <div className="h-[520px] bg-white rounded-xl border border-neutral-200 shadow-sm" />
    </div>
    {/* Calculate button */}
    <div className="h-16 max-w-md mx-auto bg-neutral-100 rounded-xl" />
    {/* Results */}
    <div className="h-[420px] bg-neutral-900 rounded-2xl" />
  </div>
);

// --- Main Component ---

export function EintauschwertRechner() {
  const { user } = useAuth();
  const [state, setState] = useState<CalculatorState>(DEFAULT_STATE);
  const [isClient, setIsClient] = useState(false);
  const [result, setResult] = useState<CalcResult | null>(null);
  const [gated, setGated] = useState(false);
  const [freeLookupUsed, setFreeLookupUsed] = useState(false);
  const [showFormulas, setShowFormulas] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      setFreeLookupUsed(window.localStorage.getItem(FREE_LOOKUP_KEY) === "1");
    }
  }, []);

  // A login lifts the gate: recompute nothing, just unlock the button again.
  useEffect(() => {
    if (user) setGated(false);
  }, [user]);

  const updateState = <K extends keyof CalculatorState>(key: K, value: CalculatorState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const updateComp = (index: number, key: keyof CompRow, value: number) => {
    setState((prev) => {
      const comps = prev.comps.map((c, i) => (i === index ? { ...c, [key]: value } : c));
      return { ...prev, comps };
    });
  };

  const addComp = () => {
    setState((prev) =>
      prev.comps.length >= MAX_COMPS
        ? prev
        : { ...prev, comps: [...prev.comps, { price: 0, km: 0 }] }
    );
  };

  const removeComp = (index: number) => {
    setState((prev) =>
      prev.comps.length <= 1
        ? prev
        : { ...prev, comps: prev.comps.filter((_, i) => i !== index) }
    );
  };

  const handlePreset = () => {
    setState(PRESET_GOLF);
    toast.success("Beispielwerte geladen");
  };

  const handleReset = () => {
    setState(DEFAULT_STATE);
    setResult(null);
    setGated(false);
  };

  const handleCalculate = () => {
    const validComps = state.comps.filter((c) => c.price > 0);
    if (validComps.length === 0) {
      toast.error("Mindestens 1 Vergleichsfahrzeug nötig", {
        description: "Trag den Inseratspreis von mindestens einem vergleichbaren Fahrzeug ein.",
      });
      return;
    }
    if (state.vehicleKm <= 0) {
      toast.error("Kilometerstand fehlt", {
        description: "Trag den Kilometerstand des Eintausch-Fahrzeugs ein.",
      });
      return;
    }

    // Gate: one anonymous calculation, unlimited (still free) with an account.
    if (!user) {
      if (freeLookupUsed) {
        setGated(true);
        setResult(null);
        return;
      }
      window.localStorage.setItem(FREE_LOOKUP_KEY, "1");
      setFreeLookupUsed(true);
    }

    const computed = compute(state);
    setResult(computed);
    setGated(false);

    if (validComps.length < 3) {
      toast.info("Tipp: 3–5 Vergleichsfahrzeuge", {
        description: "Je mehr Vergleichsinserate, desto belastbarer der Marktwert.",
      });
    }
  };

  if (!isClient) return <CalculatorSkeleton />;

  return (
    <div className="w-full space-y-8" id="calculator-tool">

      {/* --- PRESETS --- */}
      <div className="flex flex-wrap gap-3 items-center justify-center p-4 bg-neutral-50 rounded-xl border border-neutral-200">
        <span className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mr-2">
          Beispiel laden:
        </span>
        <Button
          variant="outline"
          size="sm"
          className="bg-white hover:bg-neutral-50 text-neutral-700 border-neutral-300"
          onClick={handlePreset}
        >
          <Car className="w-4 h-4 mr-2 text-red-600" />
          VW Golf, 78&apos;000 km
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto text-neutral-500 hover:text-neutral-900"
          onClick={handleReset}
        >
          <RotateCcw className="w-4 h-4 mr-2" /> Reset
        </Button>
      </div>

      {/* --- Main Input Grid --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* LEFT: Vehicle + Comps */}
        <Card className="border-neutral-200 shadow-sm overflow-hidden h-full">
          <CardHeader className="bg-neutral-50 border-b border-neutral-100 pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center text-sm font-bold">1</div>
              Fahrzeug & Marktlage
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-neutral-600">Fahrzeug (optional)</Label>
                <Input
                  type="text"
                  value={state.vehicleLabel}
                  onChange={(e) => updateState('vehicleLabel', e.target.value)}
                  placeholder="z.B. VW Golf 1.5 TSI (2020)"
                  className="bg-neutral-50/50"
                />
              </div>
              <MoneyInput
                label="Kilometerstand"
                value={state.vehicleKm}
                onChange={(v) => updateState('vehicleKm', v)}
                unit="km"
                highlight
                tooltip="Kilometerstand des Fahrzeugs, das du in Eintausch nimmst."
              />
            </div>

            <Separator />

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-bold text-neutral-900">
                  Vergleichsfahrzeuge am Markt
                </Label>
                <TooltipProvider>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-neutral-400 hover:text-neutral-600 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs bg-neutral-900 text-white border-neutral-800">
                      <p className="text-xs">
                        Suche 3–5 vergleichbare Inserate (gleiches Modell, ähnliches Alter und Ausstattung)
                        und trag Preis und Kilometerstand ein. Der Rechner gleicht die Laufleistung
                        automatisch an.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-xs text-neutral-400">
                Inseratspreise vergleichbarer Occasionen – der Rechner rechnet die km-Differenz an.
              </p>
            </div>

            <div className="space-y-3">
              {state.comps.map((comp, i) => (
                <div key={i} className="flex items-end gap-2">
                  <div className="flex-1">
                    <MoneyInput
                      label={i === 0 ? "Inseratspreis" : ""}
                      value={comp.price}
                      onChange={(v) => updateComp(i, 'price', v)}
                    />
                  </div>
                  <div className="flex-1">
                    <MoneyInput
                      label={i === 0 ? "Kilometerstand" : ""}
                      value={comp.km}
                      onChange={(v) => updateComp(i, 'km', v)}
                      unit="km"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-neutral-400 hover:text-red-600"
                    onClick={() => removeComp(i)}
                    disabled={state.comps.length <= 1}
                    title="Zeile entfernen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={addComp}
                disabled={state.comps.length >= MAX_COMPS}
                className="border-neutral-300 text-neutral-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Vergleichsfahrzeug
              </Button>
              <div className="w-40">
                <MoneyInput
                  label="km-Angleich"
                  value={state.kmRate}
                  onChange={(v) => updateState('kmRate', v)}
                  unit="CHF/km"
                  step="0.01"
                  tooltip="Wert pro Kilometer Laufleistungs-Differenz. Faustregel: 0.05–0.15 CHF/km je nach Segment (Kleinwagen tiefer, Premium höher)."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* RIGHT: Deductions */}
        <Card className="border-neutral-200 shadow-sm overflow-hidden h-full">
          <CardHeader className="bg-neutral-50 border-b border-neutral-100 pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <div className="w-8 h-8 rounded-full bg-white border-2 border-neutral-900 text-neutral-900 flex items-center justify-center text-sm font-bold">2</div>
              Deine Abzüge als Garage
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <MoneyInput
                label="Aufbereitung & Reparaturen"
                value={state.reconCost}
                onChange={(v) => updateState('reconCost', v)}
                tooltip="Reinigung, Politur, kleine Instandstellungen, MFK falls nötig. Üblich: 300–1'500 CHF."
              />
              <MoneyInput
                label="Garantie-Rückstellung"
                value={state.warrantyCost}
                onChange={(v) => updateState('warrantyCost', v)}
                tooltip="Rückstellung für die gesetzliche Gewährleistung beim Weiterverkauf. Üblich: 300–800 CHF."
              />
              <div className="sm:col-span-2">
                <MoneyInput
                  label="Standzeit & Kapitalbindung"
                  value={state.standingCost}
                  onChange={(v) => updateState('standingCost', v)}
                  tooltip="Platzkosten, Inserate und gebundenes Kapital bis zum Weiterverkauf. Faustregel: ca. 10–30 CHF pro Standtag."
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-bold text-neutral-900">Deine Marge</Label>
                  <TooltipProvider>
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-neutral-400 hover:text-neutral-600 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs bg-neutral-900 text-white border-neutral-800">
                        <p className="text-xs">
                          Branchenüblich sind 10–20% vom Marktwert – oder ein fixes Ertragsziel
                          pro Fahrzeug (z.B. 1'500 CHF). Prozent skaliert mit dem Fahrzeugwert,
                          Fixbetrag eignet sich für günstige Fahrzeuge.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Tabs
                  value={state.marginMode}
                  onValueChange={(v) => updateState('marginMode', v as MarginMode)}
                >
                  <TabsList className="h-9 bg-neutral-100 p-1">
                    <TabsTrigger
                      value="percent"
                      className="data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm font-semibold text-xs px-3"
                    >
                      Prozent
                    </TabsTrigger>
                    <TabsTrigger
                      value="fixed"
                      className="data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm font-semibold text-xs px-3"
                    >
                      Fixbetrag
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {state.marginMode === 'percent' ? (
                <MoneyInput
                  label="Marge in % vom Marktwert"
                  value={state.marginPercent}
                  onChange={(v) => updateState('marginPercent', v)}
                  unit="%"
                  highlight
                />
              ) : (
                <MoneyInput
                  label="Marge als Fixbetrag"
                  value={state.marginFixed}
                  onChange={(v) => updateState('marginFixed', v)}
                  highlight
                />
              )}
            </div>

            <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
              <p className="text-xs text-neutral-500 leading-relaxed">
                <strong className="text-neutral-700">Faustregel:</strong> Der Eintauschwert liegt
                am Ende meist bei <strong className="text-neutral-700">80–90% des Marktwerts</strong>.
                Liegt dein Ergebnis deutlich darunter oder darüber, prüfe Abzüge und Vergleichspreise.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- CALCULATE BUTTON --- */}
      <div className="flex flex-col items-center gap-3">
        <Button
          size="lg"
          onClick={handleCalculate}
          className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30 px-10 py-6 text-base font-semibold rounded-xl w-full max-w-md"
        >
          <Calculator className="w-5 h-5 mr-2" />
          Eintauschwert berechnen
        </Button>
        {!user && (
          <p className="text-xs text-neutral-400 text-center">
            {freeLookupUsed
              ? "Deine Gratis-Berechnung ist aufgebraucht – mit kostenlosem Konto rechnest du unbegrenzt weiter."
              : "1 Berechnung gratis ohne Konto. Danach: unbegrenzt kostenlos mit BuyAuto-Konto."}
          </p>
        )}
      </div>

      {/* --- SIGNUP GATE --- */}
      {gated && (
        <div className="bg-neutral-900 rounded-2xl p-8 md:p-12 text-white shadow-2xl relative overflow-hidden" id="gate">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/20 blur-[100px] rounded-full pointer-events-none" />
          <div className="relative z-10 max-w-xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/10 border border-white/20">
              <Lock className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-2xl md:text-3xl font-bold">
              Kostenlos weiterrechnen
            </h3>
            <p className="text-neutral-300 leading-relaxed">
              Deine Gratis-Berechnung ist aufgebraucht. Erstell dir ein <strong className="text-white">kostenloses
              BuyAuto-Konto</strong> und rechne unbegrenzt weiter – der Rechner bleibt gratis.
            </p>
            <ul className="text-sm text-neutral-300 space-y-2 text-left max-w-xs mx-auto">
              <li className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                Unbegrenzte Eintauschwert-Berechnungen
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                Occasionen direkt auf BuyAuto inserieren
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                Garagen-Tools: eigene Microsite & Anfragen
              </li>
            </ul>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button asChild size="lg" className="bg-red-600 hover:bg-red-700 text-white border-none">
                <Link href="/auth?redirect=/eintauschwert-rechner">
                  Kostenlos registrieren
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/20 hover:bg-white/10 hover:text-white bg-transparent text-white">
                <Link href="/auth?redirect=/eintauschwert-rechner">
                  Ich habe schon ein Konto
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* --- RESULTS SECTION --- */}
      {result && (
        <div className="bg-neutral-900 rounded-2xl p-4 sm:p-6 md:p-10 text-white shadow-2xl relative overflow-hidden" id="results">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/20 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full pointer-events-none" />

          <div className="relative z-10">
            <h3 className="text-center text-neutral-400 font-medium uppercase tracking-widest text-sm mb-8">
              Ergebnis{state.vehicleLabel ? ` – ${state.vehicleLabel}` : ""}
            </h3>

            <div className="flex flex-col md:flex-row items-stretch justify-center gap-4 md:gap-8 mb-10">
              {/* MARKET VALUE */}
              <div className="flex-1 bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="text-sm font-medium text-neutral-400 mb-4">
                  Marktwert (Verkaufspreis)
                </div>
                <div className="text-3xl font-bold">CHF {chf(result.marketValue)}</div>
                <div className="text-xs text-neutral-500 mt-1">
                  Median aus {result.compCount} Vergleichsfahrzeug{result.compCount === 1 ? "" : "en"}, km-bereinigt
                </div>
                <div className="mt-4 pt-4 border-t border-white/10 text-sm text-neutral-300">
                  Spanne: CHF {chf(result.marketMin)} – {chf(result.marketMax)}
                </div>
              </div>

              {/* VS Divider */}
              <div className="hidden md:flex flex-col items-center justify-center gap-2">
                <div className="h-full w-px bg-neutral-800/50"></div>
                <div className="text-neutral-600 font-bold text-sm bg-neutral-900 z-10 py-2">−</div>
                <div className="h-full w-px bg-neutral-800/50"></div>
              </div>

              {/* OFFER */}
              <div className="flex-1 bg-green-500/5 rounded-xl p-6 border border-green-500/50 shadow-lg shadow-green-900/20">
                <div className="text-sm font-medium text-neutral-400 mb-4 flex justify-between items-start">
                  Dein Eintauschwert (Angebot)
                  <Badge className="bg-green-500 hover:bg-green-600 text-white border-none">
                    {result.offerShare.toFixed(0)}% vom Marktwert
                  </Badge>
                </div>
                <div className="text-4xl font-bold text-green-400">CHF {chf(result.offer)}</div>
                <div className="text-xs text-neutral-500 mt-1">
                  Marktwert minus Abzüge, gerundet auf CHF 50
                </div>
                <div className="mt-4 pt-4 border-t border-white/10 text-sm text-neutral-300">
                  Verhandlungs-Spanne: CHF {chf(result.offerMin)} – {chf(result.offerMax)}
                </div>
              </div>
            </div>

            {/* BREAKDOWN TABLE */}
            <div className="max-w-2xl mx-auto text-sm bg-neutral-950/50 rounded-lg p-3 sm:p-4 md:p-6 border border-white/5">
              <div className="flex justify-between items-center text-neutral-500 font-bold uppercase text-xs tracking-wider mb-4 border-b border-white/10 pb-2">
                <span>Rechenweg</span>
                <span className="text-right">CHF</span>
              </div>

              <div className="flex justify-between items-center py-1.5 text-white font-medium">
                <span>Marktwert (Median, km-bereinigt)</span>
                <span className="font-mono">{chf(result.marketValue)}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 text-neutral-400">
                <span>− Aufbereitung & Reparaturen</span>
                <span className="font-mono">{chf(result.reconCost)}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 text-neutral-400">
                <span>− Garantie-Rückstellung</span>
                <span className="font-mono">{chf(result.warrantyCost)}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 text-neutral-400">
                <span>− Standzeit & Kapitalbindung</span>
                <span className="font-mono">{chf(result.standingCost)}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 text-neutral-400">
                <span>
                  − Marge ({state.marginMode === 'percent' ? `${state.marginPercent}% vom Marktwert` : "Fixbetrag"})
                </span>
                <span className="font-mono">{chf(result.marginValue)}</span>
              </div>

              <div className="border-t border-white/20 mt-3 pt-3 flex justify-between items-center font-bold text-base">
                <span>Eintauschwert (gerundet)</span>
                <span className="font-mono text-green-400">CHF {chf(result.offer)}</span>
              </div>
            </div>

            <div className="flex justify-center mt-6">
              <Button variant="link" className="text-neutral-400 hover:text-white" onClick={() => setShowFormulas(!showFormulas)}>
                {showFormulas ? <ChevronUp className="w-4 h-4 mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
                Berechnungsdetails anzeigen
              </Button>
            </div>

            {showFormulas && (
              <div className="max-w-2xl mx-auto mt-4 p-4 bg-black/20 rounded-lg text-xs text-neutral-400 font-mono">
                <p className="mb-2 font-bold text-white">Berechnungslogik:</p>
                <div className="space-y-1">
                  <p>Angeglichener Preis = Inseratspreis + (km Vergleich − km Fahrzeug) × CHF/km</p>
                  <p>Marktwert = Median der angeglichenen Preise</p>
                  <p>Eintauschwert = Marktwert − Aufbereitung − Garantie − Standzeit − Marge</p>
                </div>
                <p className="mt-3 text-neutral-500">
                  Angeglichene Vergleichspreise: {result.adjustedPrices.map((p) => chf(p)).join(" / ")}
                </p>
              </div>
            )}

            {/* CTA */}
            <div className="max-w-2xl mx-auto mt-8 bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10 text-center">
              <p className="text-neutral-300 mb-4">
                Fahrzeug übernommen? <strong className="text-white">Inserier die Occasion gratis auf BuyAuto</strong> –
                oder hol dir als Garage die eigene Microsite.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild className="bg-red-600 hover:bg-red-700 text-white border-none">
                  <Link href="/inserat-erstellen">Occasion inserieren</Link>
                </Button>
                <Button asChild variant="outline" className="border-white/20 hover:bg-white/10 hover:text-white bg-transparent text-white">
                  <Link href="/garage-plan">Garagen-Angebot ansehen</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
