import React, { useEffect, useRef, useState } from 'react';
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
  Search,
  Loader2,
  ExternalLink,
  ArrowRight,
  Pencil,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { FREE_MONTHLY_LIMIT, PAID_MONTHLY_LIMIT } from "@/lib/buyauto/valuationQuota";

// --- Types ---

interface CompRow {
  price: number; // Inseratspreis des Vergleichsfahrzeugs (CHF)
  km: number;    // Kilometerstand des Vergleichsfahrzeugs
}

interface FoundListing {
  price: number;
  km: number;
  title: string;
  url: string;
  source: string;
}

interface VehicleOption {
  id: string;
  name: string;
}

type MarginMode = 'percent' | 'fixed';
type CompsMode = 'auto' | 'manual';

interface CalculatorState {
  make: string;
  model: string;
  year: number;
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

const CURRENT_YEAR = new Date().getFullYear();

const DEFAULT_STATE: CalculatorState = {
  make: "",
  model: "",
  year: 0,
  vehicleKm: 0,
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
  make: "VW",
  model: "Golf 1.5 TSI",
  year: 2020,
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

// Anonymous users get a taste before signing up: 5 free automatic searches,
// counted in localStorage. This is a lead magnet, not DRM — a cleared cache just
// grants another 5. Logged-in users are metered server-side (5/mo free, 100/mo
// paid) via /api/valuation/*. Only automatic searches count; manual entry and
// "Neuberechnung" are always free.
const ANON_FREE_SEARCHES = 5;
const ANON_SEARCH_KEY = "buyauto_eintausch_anon_searches";

type GateKind = null | "anon" | "free_plan" | "paid_limit";

interface QuotaState {
  used: number;
  limit: number;
  remaining: number;
  plan: "free" | "paid";
}

const SIGNUP_HREF = "/auth?view=register&type=garage&redirect=/eintauschwert-rechner";

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
  placeholder = "0",
}: {
  label: string;
  value: number;
  onChange: (val: number) => void;
  tooltip?: string;
  highlight?: boolean;
  unit?: string;
  step?: string;
  placeholder?: string;
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
        placeholder={placeholder}
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
    {/* Step-1 vehicle card */}
    <div className="h-[560px] max-w-2xl mx-auto bg-white rounded-xl border border-neutral-200 shadow-sm" />
  </div>
);

// --- Main Component ---

export function EintauschwertRechner() {
  const { user } = useAuth();
  const [state, setState] = useState<CalculatorState>(DEFAULT_STATE);
  const [isClient, setIsClient] = useState(false);
  const [result, setResult] = useState<CalcResult | null>(null);
  const [gateKind, setGateKind] = useState<GateKind>(null);
  const [anonSearchesUsed, setAnonSearchesUsed] = useState(0);
  const [quota, setQuota] = useState<QuotaState | null>(null);
  const [showFormulas, setShowFormulas] = useState(false);
  const [compsMode, setCompsMode] = useState<CompsMode>('auto');
  const [searching, setSearching] = useState(false);
  const [foundListings, setFoundListings] = useState<FoundListing[]>([]);
  const [makes, setMakes] = useState<VehicleOption[]>([]);
  const [models, setModels] = useState<VehicleOption[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [makeId, setMakeId] = useState("");
  const [modelId, setModelId] = useState("");
  // Explicit user-facing choice between dropdowns and free text. Deriving this
  // from "is the field empty" flips the input type mid-keystroke — never do that.
  const [vehicleFieldMode, setVehicleFieldMode] = useState<'select' | 'text'>('select');
  // Two-step flow: 1 = vehicle & market, 2 = garage deductions + result.
  const [step, setStep] = useState<1 | 2>(1);
  // Vehicle identity at calculation time — changing the car invalidates comps.
  const searchedVehicleRef = useRef("");

  // Latest committed values for async handlers: the search response must merge
  // into what the user sees NOW, not into a snapshot from click time.
  const stateRef = useRef(state);
  const compsModeRef = useRef(compsMode);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  useEffect(() => {
    compsModeRef.current = compsMode;
  }, [compsMode]);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      const raw = Number(window.localStorage.getItem(ANON_SEARCH_KEY) ?? 0);
      setAnonSearchesUsed(Number.isFinite(raw) && raw > 0 ? raw : 0);
    }
  }, []);

  // Load the logged-in user's authoritative monthly quota so the counter is
  // correct before the first search. Anonymous users keep the localStorage count.
  useEffect(() => {
    if (!user) {
      setQuota(null);
      return;
    }
    let cancelled = false;
    fetch("/api/valuation/quota")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d?.authenticated) return;
        setQuota({ used: d.used, limit: d.limit, remaining: d.remaining, plan: d.plan });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Make/model dropdowns from the existing vehicles API — best-effort; when the
  // lists are unavailable the fields degrade to free-text inputs below.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/vehicles/makes")
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: Array<{ id?: string; name?: string }>) => {
        if (cancelled || !Array.isArray(rows)) return;
        setMakes(
          rows
            .filter((m) => m?.id && m?.name)
            .map((m) => ({ id: String(m.id), name: String(m.name) }))
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // Always drop the previous make's models immediately — a stale list must
    // never be selectable under the newly chosen make.
    setModels([]);
    if (!makeId) {
      setModelsLoading(false);
      return;
    }
    let cancelled = false;
    setModelsLoading(true);
    fetch(`/api/vehicles/models?make_id=${encodeURIComponent(makeId)}`)
      .then((r) => (r.ok ? r.json() : { models: [] }))
      .then((data: { models?: Array<{ id?: string; name?: string }> }) => {
        if (cancelled) return;
        setModels(
          (data?.models ?? [])
            .filter((m) => m?.id && m?.name)
            .map((m) => ({ id: String(m.id), name: String(m.name) }))
        );
      })
      .catch(() => {
        if (!cancelled) setModels([]);
      })
      .finally(() => {
        if (!cancelled) setModelsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [makeId]);

  // A login clears the anonymous gate — the server quota takes over.
  useEffect(() => {
    if (user) setGateKind(null);
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
    setCompsMode('manual');
    setFoundListings([]);
    // Preset names don't map to dropdown ids — show them as text fields.
    setMakeId("");
    setModelId("");
    setVehicleFieldMode('text');
    setStep(2);
    toast.success("Beispielwerte geladen", {
      description: "Manuelle Vergleichswerte für einen VW Golf (2020).",
    });
  };

  const handleReset = () => {
    setState({ ...DEFAULT_STATE, comps: DEFAULT_STATE.comps.map((c) => ({ ...c })) });
    setResult(null);
    setGateKind(null);
    setFoundListings([]);
    setMakeId("");
    setModelId("");
    setVehicleFieldMode('select');
    setStep(1);
  };

  const handleMakeSelect = (id: string) => {
    const selected = makes.find((m) => m.id === id);
    // Drop the previous make's models synchronously so the model dropdown can
    // never offer a stale list while the new fetch is in flight.
    setModels([]);
    setModelsLoading(true);
    setMakeId(id);
    setModelId("");
    setState((prev) => ({ ...prev, make: selected?.name ?? "", model: "" }));
  };

  const handleModelSelect = (id: string) => {
    const selected = models.find((m) => m.id === id);
    setModelId(id);
    setState((prev) => ({ ...prev, model: selected?.name ?? "" }));
  };

  const switchToTextFields = () => {
    setVehicleFieldMode('text');
    setMakeId("");
    setModelId("");
  };

  const switchToSelectFields = () => {
    setVehicleFieldMode('select');
    setMakeId("");
    setModelId("");
    setState((prev) => ({ ...prev, make: "", model: "" }));
  };

  // Dropdowns only when the vehicle DB delivered options AND the user hasn't
  // opted into free text (preset values or "not in the list" cases).
  const useSelectFields = vehicleFieldMode === 'select' && makes.length > 0;
  const modelSelectReady = useSelectFields && makeId !== "" && models.length > 0;

  const vehicleLabel = [state.make, state.model, state.year > 0 ? `(${state.year})` : ""]
    .filter(Boolean)
    .join(" ");

  const validateVehicle = (): boolean => {
    if (!state.make.trim() || !state.model.trim()) {
      toast.error("Marke und Modell fehlen", {
        description: "Marke und Modell sind Pflichtfelder.",
      });
      return false;
    }
    if (state.year < 1980 || state.year > CURRENT_YEAR + 1) {
      toast.error("Jahrgang fehlt", {
        description: `Gib einen Jahrgang zwischen 1980 und ${CURRENT_YEAR + 1} ein.`,
      });
      return false;
    }
    if (state.vehicleKm <= 0) {
      toast.error("Kilometerstand fehlt", {
        description: "Trag den Kilometerstand des Eintausch-Fahrzeugs ein.",
      });
      return false;
    }
    return true;
  };

  // Remaining automatic searches for the current viewer (used for the counter and
  // the pre-search gate). null = unknown (e.g. logged-in quota still loading).
  const searchesRemaining: number | null = user
    ? quota
      ? quota.remaining
      : null
    : Math.max(0, ANON_FREE_SEARCHES - anonSearchesUsed);
  const searchesLimit = user ? quota?.limit ?? null : ANON_FREE_SEARCHES;

  // Blocks an automatic search when the quota is exhausted, showing the right
  // gate. Returns true when the search may proceed. Manual entry never calls this.
  const gateBeforeSearch = (): boolean => {
    if (!user) {
      if (anonSearchesUsed >= ANON_FREE_SEARCHES) {
        setGateKind("anon");
        setResult(null);
        return false;
      }
      return true;
    }
    if (quota && quota.remaining <= 0) {
      setGateKind(quota.plan === "paid" ? "paid_limit" : "free_plan");
      setResult(null);
      return false;
    }
    return true;
  };

  const finishWithComputation = (nextState: CalculatorState) => {
    const computed = compute(nextState);
    if (!computed) {
      toast.error("Keine Vergleichspreise vorhanden", {
        description: "Trag mindestens ein Vergleichsfahrzeug mit Preis ein.",
      });
      return false;
    }
    setResult(computed);
    setGateKind(null);
    searchedVehicleRef.current = `${nextState.make}|${nextState.model}|${nextState.year}`;
    return true;
  };

  // Recompute with edited deductions/comps — the comps are already paid for, so
  // no new search, no gate, no freebie consumption.
  const handleRecalculate = () => {
    const computed = compute(state);
    if (!computed) {
      toast.error("Keine Vergleichspreise vorhanden", {
        description: "Trag mindestens ein Vergleichsfahrzeug mit Preis ein.",
      });
      return;
    }
    setResult(computed);
    toast.success("Neu berechnet");
  };

  // Fresh car, same garage: vehicle and comps reset, the Abzüge (the garage's
  // own cost structure) are kept.
  const handleNewCar = () => {
    setState((prev) => ({
      ...DEFAULT_STATE,
      comps: DEFAULT_STATE.comps.map((c) => ({ ...c })),
      kmRate: prev.kmRate,
      reconCost: prev.reconCost,
      warrantyCost: prev.warrantyCost,
      standingCost: prev.standingCost,
      marginMode: prev.marginMode,
      marginPercent: prev.marginPercent,
      marginFixed: prev.marginFixed,
    }));
    setResult(null);
    setFoundListings([]);
    setGateKind(null);
    setMakeId("");
    setModelId("");
    setVehicleFieldMode('select');
    setCompsMode('auto');
    setStep(1);
    searchedVehicleRef.current = "";
    document.getElementById('calculator-tool')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Step 1 -> 2. If the car changed since the last calculation, the old comps
  // and result no longer describe it — clear them (auto mode only; manually
  // entered comps are the user's own data).
  const handleContinue = () => {
    if (!validateVehicle()) return;
    const key = `${state.make}|${state.model}|${state.year}`;
    if (result && searchedVehicleRef.current && key !== searchedVehicleRef.current) {
      setResult(null);
      if (compsMode === 'auto') {
        setFoundListings([]);
        setState((prev) => ({
          ...prev,
          comps: DEFAULT_STATE.comps.map((c) => ({ ...c })),
        }));
      }
    }
    setStep(2);
  };

  // Manual comp entry hits no portal and spends no Firecrawl credits — it is
  // always free and never metered.
  const handleManualCalculate = () => {
    if (!validateVehicle()) return;

    const validComps = state.comps.filter((c) => c.price > 0);
    if (validComps.length === 0) {
      toast.error("Mindestens 1 Vergleichsfahrzeug nötig", {
        description: "Trag den Inseratspreis von mindestens einem vergleichbaren Fahrzeug ein.",
      });
      return;
    }
    if (validComps.length < 3) {
      toast.info("Tipp: 3–5 Vergleichsfahrzeuge", {
        description: "Je mehr Vergleichsinserate, desto belastbarer der Marktwert.",
      });
    }
    finishWithComputation(state);
  };

  const handleSearchAndCalculate = async () => {
    if (!validateVehicle()) return;
    if (!gateBeforeSearch()) return;

    setSearching(true);
    setFoundListings([]);
    try {
      const res = await fetch("/api/valuation/comps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          make: state.make.trim(),
          model: state.model.trim(),
          year: state.year,
          km: state.vehicleKm,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 402) {
          // Server quota exhausted (logged-in). Reflect the authoritative numbers
          // and show the matching gate.
          if (body?.quota) {
            setQuota({
              used: body.quota.used,
              limit: body.quota.limit,
              remaining: body.quota.remaining ?? 0,
              plan: body.quota.plan,
            });
          }
          setGateKind(body?.quota?.plan === "paid" ? "paid_limit" : "free_plan");
          setResult(null);
        } else if (res.status === 503) {
          toast.error("Automatische Suche momentan nicht verfügbar", {
            description: "Erfasse die Vergleichsfahrzeuge manuell – der Rechner funktioniert weiterhin.",
          });
          setCompsMode('manual');
          setStep(1); // the manual comp rows live in step 1
        } else if (res.status === 429) {
          toast.error("Zu viele Anfragen", {
            description: body?.message ?? "Bitte versuch es in einer Stunde nochmals.",
          });
        } else {
          toast.error("Suche fehlgeschlagen", {
            description: body?.message ?? "Bitte prüf deine Eingaben und versuch es nochmals.",
          });
        }
        return;
      }

      const data: {
        comps: FoundListing[];
        warning?: string;
        diagnosis?: string;
        quota?: QuotaState;
      } = await res.json();
      const comps = Array.isArray(data.comps) ? data.comps : [];

      // The search ran (Firecrawl was billed) — count it. Logged-in users get the
      // server's authoritative number; anonymous users bump the localStorage tally.
      if (data.quota) {
        setQuota({
          used: data.quota.used,
          limit: data.quota.limit,
          remaining: data.quota.remaining ?? Math.max(0, data.quota.limit - data.quota.used),
          plan: data.quota.plan,
        });
      } else if (!user) {
        const next = anonSearchesUsed + 1;
        setAnonSearchesUsed(next);
        try {
          window.localStorage.setItem(ANON_SEARCH_KEY, String(next));
        } catch {
          /* ignore storage errors */
        }
      }

      // The user switched to manual entry while the search ran — their typed
      // comps win, the late results are discarded.
      if (compsModeRef.current === 'manual') {
        toast.info("Manuelle Erfassung aktiv", {
          description: "Die Suchergebnisse wurden verworfen – deine Eingaben bleiben erhalten.",
        });
        return;
      }

      if (comps.length === 0) {
        toast.warning("Keine Vergleichsinserate gefunden", {
          description:
            data.diagnosis ??
            "Erfasse 3–5 Vergleichsfahrzeuge manuell – z.B. von AutoScout24 oder tutti.",
          duration: 10000,
        });
        setCompsMode('manual');
        setStep(1); // the manual comp rows live in step 1
        return;
      }

      setFoundListings(comps);
      // Merge into the LATEST state, not the click-time snapshot — the user may
      // have corrected km, costs or margin while the search was running.
      const nextState: CalculatorState = {
        ...stateRef.current,
        comps: comps.map((c) => ({ price: c.price, km: c.km })),
      };
      setState(nextState);

      if (data.warning) {
        toast.warning("Wenige Treffer", { description: data.warning });
      } else {
        toast.success(`${comps.length} Vergleichsinserate gefunden`);
      }

      finishWithComputation(nextState);
    } catch {
      toast.error("Suche fehlgeschlagen", {
        description: "Netzwerkfehler – erfasse die Vergleichsfahrzeuge manuell.",
      });
    } finally {
      setSearching(false);
    }
  };

  if (!isClient) return <CalculatorSkeleton />;

  // Shared blocks (plain JSX values, NOT components — a component defined inside
  // the render body remounts on every keystroke and inputs lose focus).
  const compRowsEditor = (
    <>
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
    </>
  );

  const foundListingsBlock = foundListings.length > 0 && (
    <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200 space-y-2">
      <p className="text-xs font-bold text-neutral-500 uppercase tracking-wide">
        Gefundene Inserate
      </p>
      {foundListings.map((l, i) => (
        <a
          key={i}
          href={l.url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="flex items-center justify-between gap-2 text-sm text-neutral-600 hover:text-red-600 transition-colors group"
        >
          <span className="truncate">{l.title}</span>
          <span className="shrink-0 flex items-center gap-2 text-xs text-neutral-400 group-hover:text-red-600">
            CHF {chf(l.price)} · {chf(l.km)} km · {l.source}
            <ExternalLink className="w-3 h-3" />
          </span>
        </a>
      ))}
    </div>
  );

  const kmRateInput = (
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
  );

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

      {/* --- STEP 1: Vehicle & Market --- */}
      {step === 1 && (
        <Card className="max-w-2xl mx-auto border-neutral-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-neutral-50 border-b border-neutral-100 pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center text-sm font-bold">1</div>
              Fahrzeug & Marktlage
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-bold text-neutral-900">Marke *</Label>
                {useSelectFields ? (
                  <Select value={makeId} onValueChange={handleMakeSelect}>
                    <SelectTrigger className="border-neutral-400 bg-white shadow-sm font-semibold">
                      <SelectValue placeholder="Marke wählen" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {makes.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type="text"
                    value={state.make}
                    onChange={(e) => updateState('make', e.target.value)}
                    placeholder="z.B. VW"
                    className="border-neutral-400 bg-white shadow-sm font-semibold"
                  />
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-bold text-neutral-900">Modell *</Label>
                {useSelectFields ? (
                  modelSelectReady ? (
                    <Select value={modelId} onValueChange={handleModelSelect}>
                      <SelectTrigger className="border-neutral-400 bg-white shadow-sm font-semibold">
                        <SelectValue placeholder="Modell wählen" />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {models.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : makeId && modelsLoading ? (
                    <Select value="" disabled>
                      <SelectTrigger className="border-neutral-400 bg-white shadow-sm font-semibold">
                        <SelectValue placeholder="Modelle laden…" />
                      </SelectTrigger>
                      <SelectContent />
                    </Select>
                  ) : makeId ? (
                    <Input
                      type="text"
                      value={state.model}
                      onChange={(e) => updateState('model', e.target.value)}
                      placeholder="z.B. Golf"
                      className="border-neutral-400 bg-white shadow-sm font-semibold"
                    />
                  ) : (
                    <Select value="" disabled>
                      <SelectTrigger className="border-neutral-400 bg-white shadow-sm font-semibold">
                        <SelectValue placeholder="Zuerst Marke wählen" />
                      </SelectTrigger>
                      <SelectContent />
                    </Select>
                  )
                ) : (
                  <Input
                    type="text"
                    value={state.model}
                    onChange={(e) => updateState('model', e.target.value)}
                    placeholder="z.B. Golf"
                    className="border-neutral-400 bg-white shadow-sm font-semibold"
                  />
                )}
              </div>
              <div className="sm:col-span-2 -mt-2">
                {useSelectFields ? (
                  <button
                    type="button"
                    onClick={switchToTextFields}
                    className="text-xs text-neutral-400 hover:text-red-600 underline underline-offset-2 transition-colors"
                  >
                    Marke oder Modell nicht in der Liste? Manuell eingeben
                  </button>
                ) : makes.length > 0 ? (
                  <button
                    type="button"
                    onClick={switchToSelectFields}
                    className="text-xs text-neutral-400 hover:text-red-600 underline underline-offset-2 transition-colors"
                  >
                    Aus Liste wählen
                  </button>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-bold text-neutral-900">Jahrgang *</Label>
                <Input
                  type="number"
                  min={1980}
                  max={CURRENT_YEAR + 1}
                  value={state.year === 0 ? "" : state.year}
                  onChange={(e) => updateState('year', Number(e.target.value))}
                  placeholder={`z.B. ${CURRENT_YEAR - 5}`}
                  className="border-neutral-400 bg-white shadow-sm font-semibold"
                />
              </div>
              <MoneyInput
                label="Kilometerstand *"
                value={state.vehicleKm}
                onChange={(v) => updateState('vehicleKm', v)}
                unit="km"
                highlight
                placeholder="z.B. 80'000"
                tooltip="Kilometerstand des Fahrzeugs, das du in Eintausch nimmst."
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-bold text-neutral-900">
                  Vergleichsfahrzeuge
                </Label>
                <TooltipProvider>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-neutral-400 hover:text-neutral-600 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs bg-neutral-900 text-white border-neutral-800">
                      <p className="text-xs">
                        Automatisch: der Rechner durchsucht öffentliche Schweizer Occasions-Portale
                        nach passenden Inseraten. Manuell: trag Preis und Kilometerstand von 3–5
                        Inseraten selbst ein. Gefundene Werte kannst du immer noch anpassen.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Tabs value={compsMode} onValueChange={(v) => setCompsMode(v as CompsMode)}>
                <TabsList className="h-9 bg-neutral-100 p-1">
                  <TabsTrigger
                    value="auto"
                    className="data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm font-semibold text-xs px-3"
                  >
                    Automatisch suchen
                  </TabsTrigger>
                  <TabsTrigger
                    value="manual"
                    className="data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm font-semibold text-xs px-3"
                  >
                    Manuell erfassen
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {compsMode === 'auto' && foundListings.length === 0 && (
              <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200 text-sm text-neutral-600 leading-relaxed">
                <Search className="w-4 h-4 inline-block mr-2 text-red-600" />
                Der Rechner sucht live nach vergleichbaren Inseraten auf Schweizer
                Occasions-Portalen (AutoScout24, tutti & Co.), gleicht die Kilometer an und
                übernimmt bis zu 5 Treffer. Die Suche dauert ca. 10–30 Sekunden.
              </div>
            )}

            {(compsMode === 'manual' || foundListings.length > 0) && (
              <>
                {compRowsEditor}
                {foundListingsBlock}
                {kmRateInput}
              </>
            )}

            <Button
              size="lg"
              onClick={handleContinue}
              className="w-full bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30 py-6 text-base font-semibold rounded-xl"
            >
              Weiter zu den Abzügen
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* --- STEP 2: Deductions + Result --- */}
      {step === 2 && (
        <div className="max-w-2xl mx-auto space-y-6">

        {/* Vehicle summary strip */}
        <div className="flex items-center justify-between gap-4 bg-white rounded-xl border border-neutral-200 shadow-sm p-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
              <Car className="w-5 h-5 text-red-600" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-neutral-900 truncate">{vehicleLabel || "Fahrzeug"}</p>
              <p className="text-xs text-neutral-500">
                {chf(state.vehicleKm)} km · {compsMode === 'auto' ? "Automatische Suche" : "Manuelle Vergleichswerte"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep(1)}
            className="shrink-0 text-neutral-500 hover:text-red-600"
          >
            <Pencil className="w-4 h-4 mr-2" />
            Bearbeiten
          </Button>
        </div>

        <Card className="border-neutral-200 shadow-sm overflow-hidden">
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

        {/* Comps stay editable after a calculation — "Neuberechnung" reuses them. */}
        {result && state.comps.some((c) => c.price > 0) && (
          <Card className="border-neutral-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-neutral-50 border-b border-neutral-100 pb-4">
              <CardTitle className="text-base font-bold text-neutral-700">
                Vergleichsinserate (anpassbar)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {foundListingsBlock}
              {compRowsEditor}
              {kmRateInput}
            </CardContent>
          </Card>
        )}

        {/* --- CALCULATE / RECALCULATE --- */}
        <div className="flex flex-col items-center gap-3">
          <Button
            size="lg"
            onClick={
              result
                ? handleRecalculate
                : compsMode === 'auto'
                  ? handleSearchAndCalculate
                  : handleManualCalculate
            }
            disabled={searching}
            className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30 px-10 py-6 text-base font-semibold rounded-xl w-full max-w-md"
          >
            {searching ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Suche Vergleichsinserate…
              </>
            ) : result ? (
              <>
                <RotateCcw className="w-5 h-5 mr-2" />
                Neuberechnung
              </>
            ) : compsMode === 'auto' ? (
              <>
                <Search className="w-5 h-5 mr-2" />
                Inserate suchen & Eintauschwert berechnen
              </>
            ) : (
              <>
                <Calculator className="w-5 h-5 mr-2" />
                Eintauschwert berechnen
              </>
            )}
          </Button>
          {result && (
            <Button
              variant="outline"
              size="lg"
              onClick={handleNewCar}
              className="border-neutral-300 text-neutral-700 hover:text-red-600 hover:border-red-300 rounded-xl w-full max-w-md"
            >
              <Car className="w-5 h-5 mr-2" />
              Neues Auto berechnen
            </Button>
          )}
          {/* Search counter — auto mode, before a result exists. */}
          {compsMode === 'auto' && !result && searchesRemaining !== null && (
            <div className="text-sm text-center" aria-live="polite">
              {searchesRemaining > 0 ? (
                <span className="text-neutral-500">
                  Noch{" "}
                  <strong className="text-neutral-800">{searchesRemaining}</strong>
                  {searchesLimit !== null ? ` von ${searchesLimit}` : ""}{" "}
                  {user ? "Suchen diesen Monat" : "gratis Suchen"} übrig
                </span>
              ) : (
                <span className="text-red-600 font-medium">
                  {user ? "Monatskontingent aufgebraucht" : "Gratis-Suchen aufgebraucht"}
                </span>
              )}
            </div>
          )}
          {result && (
            <p className="text-xs text-neutral-400 text-center">
              Neuberechnungen mit angepassten Abzügen sind gratis und zählen nicht zu deinen Suchen.
            </p>
          )}
        </div>
        </div>
      )}

      {/* --- QUOTA GATE --- */}
      {gateKind && (
        <div className="bg-neutral-900 rounded-2xl p-8 md:p-12 text-white shadow-2xl relative overflow-hidden" id="gate">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/20 blur-[100px] rounded-full pointer-events-none" />
          <div className="relative z-10 max-w-xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/10 border border-white/20">
              <Lock className="w-6 h-6 text-red-400" />
            </div>

            {gateKind === "anon" && (
              <>
                <h3 className="text-2xl md:text-3xl font-bold">Mehr Suchen freischalten</h3>
                <p className="text-neutral-300 leading-relaxed">
                  Deine <strong className="text-white">{ANON_FREE_SEARCHES} gratis Suchen</strong> sind
                  aufgebraucht. Registriere dich kostenlos als Garage und such weiter –
                  plus Zugriff auf den Rechner in deinem Dashboard.
                </p>
                <ul className="text-sm text-neutral-300 space-y-2 text-left max-w-xs mx-auto">
                  <li className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    {FREE_MONTHLY_LIMIT} Suchen pro Monat gratis – im Paket unbegrenzt*
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    Rechner im Dashboard & manuelle Berechnung ohne Limit
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    Occasionen inserieren & eigene Garagen-Microsite
                  </li>
                </ul>
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  <Button asChild size="lg" className="bg-red-600 hover:bg-red-700 text-white border-none">
                    <Link href={SIGNUP_HREF}>Kostenlos als Garage registrieren</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-white/20 hover:bg-white/10 hover:text-white bg-transparent text-white">
                    <Link href="/auth?redirect=/eintauschwert-rechner">Ich habe schon ein Konto</Link>
                  </Button>
                </div>
              </>
            )}

            {gateKind === "free_plan" && (
              <>
                <h3 className="text-2xl md:text-3xl font-bold">Monatslimit erreicht</h3>
                <p className="text-neutral-300 leading-relaxed">
                  Du hast diesen Monat alle <strong className="text-white">{FREE_MONTHLY_LIMIT} Gratis-Suchen</strong>{" "}
                  genutzt. Mit einem Garagen-Paket suchst du unbegrenzt* – und bekommst
                  Inserate, Microsite und Anfragen dazu.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  <Button asChild size="lg" className="bg-red-600 hover:bg-red-700 text-white border-none">
                    <Link href="/garage-plan">Garagen-Paket ansehen</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-white/20 hover:bg-white/10 hover:text-white bg-transparent text-white">
                    <Link href="/preise">Preise vergleichen</Link>
                  </Button>
                </div>
                <p className="text-xs text-neutral-500">
                  Manuelle Berechnungen bleiben unbegrenzt gratis.
                </p>
              </>
            )}

            {gateKind === "paid_limit" && (
              <>
                <h3 className="text-2xl md:text-3xl font-bold">Monatskontingent erreicht</h3>
                <p className="text-neutral-300 leading-relaxed">
                  Du hast diesen Monat {PAID_MONTHLY_LIMIT} automatische Suchen genutzt – das
                  faire Nutzungslimit deines Pakets. Brauchst du mehr? Melde dich, wir finden
                  eine Lösung. Manuelle Berechnungen bleiben unbegrenzt.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  <Button asChild size="lg" className="bg-red-600 hover:bg-red-700 text-white border-none">
                    <Link href="/#kontakt">Kontakt aufnehmen</Link>
                  </Button>
                </div>
              </>
            )}
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
              Ergebnis{vehicleLabel ? ` – ${vehicleLabel}` : ""}
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
