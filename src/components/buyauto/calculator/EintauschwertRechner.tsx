import { tgDecodeUrl } from "@/lib/buyauto/listingContract";
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
  AlertTriangle,
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
import { useRouter } from "next/router";
import { FREE_MONTHLY_LIMIT, PAID_MONTHLY_LIMIT } from "@/lib/buyauto/valuationQuota";
import { GARAGE_PLANS } from "@/lib/buyauto/garagePlans";
import { T, useT, type TFunction } from "@/i18n/runtime";
import { track } from "@/lib/analytics";

/** Biggest per-month valuation quota any public package includes. */
const MAX_PLAN_VALUATIONS = GARAGE_PLANS.pro.valuationsPerMonth;

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
  /** Karosserie ('' = unbekannt/egal) — schärft die automatische Suche. */
  bodyType: string;
  /** Hubraum-Token aus dem Typenschein (z.B. "2.0", '' = unbekannt) — aktiviert
   *  den Motorisierungs-Filter serverseitig, ohne die Suchqueries zu verändern. */
  displacement: string;
  comps: CompRow[];
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
  /** Absolute Extremwerte der angeglichenen Preise (immer min–max). */
  fullMin: number;
  fullMax: number;
  /** true: marketMin/marketMax sind die P25–P75-Spanne (ab 4 Comps), nicht min–max. */
  bandIsIqr: boolean;
  /** fullMax / fullMin der angeglichenen Preise; null wenn nicht sinnvoll. */
  spreadFactor: number | null;
  /** Zu wenige oder zu stark streuende Vergleichswerte — Spanne statt Punktwert zeigen. */
  lowConfidence: boolean;
}

const CURRENT_YEAR = new Date().getFullYear();

// Laufleistungs-Angleich: ein Auto verliert grob diesen Anteil seines Werts pro
// 10'000 km. Wert-proportional statt eines fixen Rappenbetrags — 10 Rp./km war
// auf die Golf-Klasse (~CHF 20'000) kalibriert und hat sechsstellige Fahrzeuge
// praktisch nicht angeglichen (CHF 7'000 Korrektur bei 70'000 km Differenz auf
// einem CHF 130'000-Roadster). 5%/10'000 km ergibt für den 20k-Golf weiterhin
// die bewährten ~10 Rp./km.
const KM_ADJUST_PCT_PER_10K = 5;
// Bei extremen km-Differenzen läuft die lineare Korrektur aus dem Ruder —
// Angleich auf ±50% des Inseratspreises begrenzen.
const KM_ADJUST_CAP = 0.5;

// Unter 3 Vergleichsfahrzeugen oder ab diesem Faktor zwischen teuerstem und
// günstigstem angeglichenen Preis ist der Median keine belastbare Punktschätzung
// mehr — das Ergebnis wird als Spanne mit Warnung präsentiert.
const MIN_CONFIDENT_COMPS = 3;
const MAX_CONFIDENT_SPREAD = 1.8;

// Karosserie-Auswahl für die automatische Suche. Werte = compsParser BodyType;
// '' heisst unbekannt/egal und lässt die Suche ungefiltert.
const BODY_TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "limousine", label: "Limousine" },
  { value: "kombi", label: "Kombi" },
  { value: "suv", label: "SUV" },
  { value: "coupe", label: "Coupé" },
  { value: "cabrio", label: "Cabriolet" },
  { value: "roadster", label: "Roadster" },
];

const DEFAULT_STATE: CalculatorState = {
  make: "",
  model: "",
  year: 0,
  vehicleKm: 0,
  bodyType: "",
  displacement: "",
  comps: [
    { price: 0, km: 0 },
    { price: 0, km: 0 },
    { price: 0, km: 0 },
  ],
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
  bodyType: "",
  displacement: "",
  comps: [
    { price: 18900, km: 65000 },
    { price: 17500, km: 82000 },
    { price: 16900, km: 95000 },
  ],
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
// grants another 5. Logged-in users are metered server-side via /api/valuation/*
// (3/mo free, then the quota of their garage package). Only automatic searches
// count; manual entry and "Neuberechnung" are always free.
const ANON_FREE_SEARCHES = 3;
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

// Lineares Interpolations-Quantil (p in [0,1]) über bereits SORTIERTE Werte.
const quantileSorted = (sorted: number[], p: number): number => {
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
};

function compute(state: CalculatorState): CalcResult | null {
  const validComps = state.comps.filter((c) => c.price > 0);
  if (validComps.length === 0) return null;

  // Laufleistungs-Angleich: hat das Vergleichsfahrzeug MEHR km als unseres,
  // ist unser Fahrzeug entsprechend mehr wert (und umgekehrt). Die Korrektur
  // skaliert mit dem Fahrzeugwert (KM_ADJUST_PCT_PER_10K), gedeckelt auf ±50%.
  const adjustedPrices = validComps.map((c) => {
    const factor = 1 + (KM_ADJUST_PCT_PER_10K / 100) * ((c.km - state.vehicleKm) / 10_000);
    const clamped = Math.min(1 + KM_ADJUST_CAP, Math.max(1 - KM_ADJUST_CAP, factor));
    return c.price * clamped;
  });

  const marketValue = median(adjustedPrices);
  const sortedAdjusted = [...adjustedPrices].sort((a, b) => a - b);
  const fullMin = sortedAdjusted[0];
  const fullMax = sortedAdjusted[sortedAdjusted.length - 1];

  // Ab 4 Comps ist die gezeigte Spanne P25–P75 ("typische Spanne") statt
  // min–max: die Extremwerte sind sonst wortwörtlich die zwei schlechtesten
  // Datenpunkte. Die absolute min–max-Spanne bleibt als fullMin/fullMax
  // sichtbar, und die Unsicherheits-Warnung urteilt weiterhin über die VOLLE
  // Streuung — die engere Anzeige darf echte Ausreisser nie verstecken.
  const bandIsIqr = validComps.length >= 4;
  const marketMin = bandIsIqr ? quantileSorted(sortedAdjusted, 0.25) : fullMin;
  const marketMax = bandIsIqr ? quantileSorted(sortedAdjusted, 0.75) : fullMax;

  const spreadFactor = fullMin > 0 ? fullMax / fullMin : null;
  const lowConfidence =
    validComps.length < MIN_CONFIDENT_COMPS ||
    spreadFactor === null ||
    spreadFactor > MAX_CONFIDENT_SPREAD;

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
    fullMin,
    fullMax,
    bandIsIqr,
    spreadFactor,
    lowConfidence,
  };
}

// The valuation / Typenschein APIs answer in German. Fixed messages are
// dictionary keys as they are; the few that embed a value (count, TG number,
// model) are matched here so they translate as ONE key with placeholders.
// Anything unknown falls back to the German text.
const SERVER_MESSAGE_PATTERNS: Array<[RegExp, string, string[]]> = [
  [
    /^Keine Typengenehmigung (.+) gefunden – prüf Feld 24 im Fahrzeugausweis \(vor 1995 ist keine automatische Abfrage möglich\)\.$/,
    "Keine Typengenehmigung {tg} gefunden – prüf Feld 24 im Fahrzeugausweis (vor 1995 ist keine automatische Abfrage möglich).",
    ["tg"],
  ],
  [
    /^Die Suche fand (\d+) Web-Treffer, aber keine einzelnen Inserate auf Occasions-Portalen\.$/,
    "Die Suche fand {n} Web-Treffer, aber keine einzelnen Inserate auf Occasions-Portalen.",
    ["n"],
  ],
  [
    /^Die Suche fand (\d+) Inserat\(e\), auch nach Seitenabruf ohne lesbaren Preis \+ Kilometerstand\.$/,
    "Die Suche fand {n} Inserat(e), auch nach Seitenabruf ohne lesbaren Preis + Kilometerstand.",
    ["n"],
  ],
  [
    /^Die Suche fand (\d+) Inserat\(e\) ohne lesbaren Preis \+ Kilometerstand\.$/,
    "Die Suche fand {n} Inserat(e) ohne lesbaren Preis + Kilometerstand.",
    ["n"],
  ],
  [
    /^Es wurden (.+)-Inserate gefunden, aber keine mit passender Motorisierung \((.+)\)\. Erfasse 3–5 Vergleichsfahrzeuge mit gleicher Motorisierung manuell\.$/,
    "Es wurden {model}-Inserate gefunden, aber keine mit passender Motorisierung ({variant}). Erfasse 3–5 Vergleichsfahrzeuge mit gleicher Motorisierung manuell.",
    ["model", "variant"],
  ],
  [
    /^Es wurden (.+)-Inserate gefunden, aber keine mit passender Karosserie-Variante \((.+)\)\. Erfasse 3–5 passende Vergleichsfahrzeuge manuell\.$/,
    "Es wurden {model}-Inserate gefunden, aber keine mit passender Karosserie-Variante ({variant}). Erfasse 3–5 passende Vergleichsfahrzeuge manuell.",
    ["model", "variant"],
  ],
];

function translateServerMessage(t: TFunction, message: string | null | undefined): string | undefined {
  if (typeof message !== "string") return undefined;
  for (const [pattern, key, names] of SERVER_MESSAGE_PATTERNS) {
    const match = pattern.exec(message);
    if (match) {
      const vars: Record<string, string> = {};
      names.forEach((name, i) => {
        vars[name] = match[i + 1];
      });
      return t(key, vars);
    }
  }
  return t(message);
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
  const { user, profile } = useAuth();
  const router = useRouter();
  const t = useT();
  const isGarage = profile?.role === "garage";
  // After checkout the garage lands back where it hit the gate — the dashboard
  // Rechner tab when embedded there, the public page everywhere else.
  const gateReturnPath = router.pathname.startsWith("/dashboard")
    ? "/dashboard/garage?tab=rechner"
    : "/eintauschwert-rechner";
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
  // Typenschein quick-fill (Fahrzeugausweis Feld 24 -> exakte Fahrzeugdaten).
  const [tgInput, setTgInput] = useState("");
  const [tgLoading, setTgLoading] = useState(false);
  // Vehicle identity at calculation time — changing the car invalidates comps.
  const searchedVehicleRef = useRef("");

  // GA4 generate_lead (valuation): a completed Eintauschwert result rendered.
  // Once per vehicle — recalculating the same car with edited deductions or
  // comps is not a new valuation.
  const reportedValuationsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!result) return;
    const vehicleKey = `${state.make}|${state.model}|${state.year}|${state.bodyType}|${state.displacement}`;
    if (reportedValuationsRef.current.has(vehicleKey)) return;
    reportedValuationsRef.current.add(vehicleKey);
    track("generate_lead", { lead_type: "valuation", value: 0, currency: "CHF" });
    // Only a new result counts; state edits without a result are not leads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  // Latest committed values for async handlers: the search response must merge
  // into what the user sees NOW, not into a snapshot from click time.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    setIsClient(true);
    // localStorage access throws (SecurityError) in storage-blocked contexts —
    // notably a sandboxed / third-party-cookie-blocked iframe, which is exactly
    // how the /embed route runs on a garage's own site. Guard the READ like the
    // WRITE below so the calculator never crashes there.
    try {
      const raw = Number(window.localStorage.getItem(ANON_SEARCH_KEY) ?? 0);
      setAnonSearchesUsed(Number.isFinite(raw) && raw > 0 ? raw : 0);
    } catch {
      setAnonSearchesUsed(0);
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
    toast.success(t("Beispielwerte geladen"), {
      description: t("Manuelle Vergleichswerte für einen VW Golf (2020)."),
    });
  };

  const handleReset = () => {
    setState({ ...DEFAULT_STATE, comps: DEFAULT_STATE.comps.map((c) => ({ ...c })) });
    setResult(null);
    setGateKind(null);
    setFoundListings([]);
    setMakeId("");
    setModelId("");
    setTgInput("");
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

  // When an automatic search finds nothing, we fall the user back to manual entry
  // in step 1 — bring the comparison rows into view (on mobile they'd otherwise
  // sit below the fold).
  const scrollToComps = () => {
    if (typeof document === "undefined") return;
    setTimeout(() => {
      document.getElementById("comps-anchor")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
  };

  // Typenschein-Lookup: füllt Marke/Modell/Karosserie/Hubraum aus der
  // ASTRA-Typengenehmigung (Feld 24). Kostenlos, kein Kontingent.
  const handleTgLookup = async () => {
    const tg = tgInput.trim().toUpperCase().replace(/[\s.\-]/g, "");
    setTgInput(tg);
    if (!/^[A-Z0-9]{6}$/.test(tg)) {
      toast.error(t("Ungültige Typenschein-Nr."), {
        description: t("6 Zeichen aus Feld 24 des Fahrzeugausweises, z.B. 1TD812."),
      });
      return;
    }
    setTgLoading(true);
    try {
      const res = await fetch(tgDecodeUrl(tg));
      const data = (await res.json().catch(() => ({}))) as {
        provider_make?: string | null;
        provider_model?: string | null;
        body_key?: string | null;
        body_label?: string | null;
        displacement_l?: string | null;
        message?: string;
      };
      if (!res.ok) {
        toast.error(t("Typenschein nicht gefunden"), {
          description:
            translateServerMessage(t, data?.message) ?? t("Prüf die Nummer oder erfasse das Fahrzeug manuell."),
        });
        return;
      }
      // Karosserie-Wörter ("LIM", "KOMBI") gehören nicht in den Modell-Suchstring
      // — die Karosserie kommt separat als bodyType mit.
      const model = (data.provider_model ?? "")
        .split(/\s+/)
        .filter(
          (t) =>
            !/^(lim|limousine|kombi|coupe|coupé|cabriolet|cabrio|roadster|targa|suv|schr(ä|ae)gheck|stufenheck)$/i.test(
              t
            )
        )
        .join(" ")
        .trim();
      const bodyKey =
        data.body_key && BODY_TYPE_OPTIONS.some((o) => o.value === data.body_key)
          ? data.body_key
          : "";
      setVehicleFieldMode('text');
      setMakeId("");
      setModelId("");
      setState((prev) => ({
        ...prev,
        make: data.provider_make ?? prev.make,
        model: model || prev.model,
        bodyType: bodyKey,
        displacement: data.displacement_l ?? "",
      }));
      toast.success(t("Typenschein erkannt"), {
        description: [
          data.provider_make,
          model,
          data.body_label,
          data.displacement_l ? `${data.displacement_l}l` : null,
        ]
          .filter(Boolean)
          .join(" · "),
      });
    } catch {
      toast.error(t("Abfrage fehlgeschlagen"), {
        description: t("Typenschein konnte nicht geladen werden – erfasse das Fahrzeug manuell."),
      });
    } finally {
      setTgLoading(false);
    }
  };

  const validateVehicle = (): boolean => {
    if (!state.make.trim() || !state.model.trim()) {
      toast.error(t("Marke und Modell fehlen"), {
        description: t("Marke und Modell sind Pflichtfelder."),
      });
      return false;
    }
    if (state.year < 1980 || state.year > CURRENT_YEAR + 1) {
      toast.error(t("Jahrgang fehlt"), {
        description: t("Gib einen Jahrgang zwischen 1980 und {max} ein.", { max: CURRENT_YEAR + 1 }),
      });
      return false;
    }
    if (state.vehicleKm <= 0) {
      toast.error(t("Kilometerstand fehlt"), {
        description: t("Trag den Kilometerstand des Eintausch-Fahrzeugs ein."),
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
      toast.error(t("Keine Vergleichspreise vorhanden"), {
        description: t("Trag mindestens ein Vergleichsfahrzeug mit Preis ein."),
      });
      return false;
    }
    setResult(computed);
    setGateKind(null);
    searchedVehicleRef.current = `${nextState.make}|${nextState.model}|${nextState.year}|${nextState.bodyType}|${nextState.displacement}`;
    return true;
  };

  // Recompute with edited deductions/comps — the comps are already paid for, so
  // no new search, no gate, no freebie consumption.
  const handleRecalculate = () => {
    const computed = compute(state);
    if (!computed) {
      toast.error(t("Keine Vergleichspreise vorhanden"), {
        description: t("Trag mindestens ein Vergleichsfahrzeug mit Preis ein."),
      });
      return;
    }
    setResult(computed);
    toast.success(t("Neu berechnet"));
  };

  // Fresh car, same garage: vehicle and comps reset, the Abzüge (the garage's
  // own cost structure) are kept.
  const handleNewCar = () => {
    setState((prev) => ({
      ...DEFAULT_STATE,
      comps: DEFAULT_STATE.comps.map((c) => ({ ...c })),
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
    setTgInput("");
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
    // Manual mode: the comparison rows live here in step 1, so require at least
    // one before advancing. Auto mode has no rows yet — the search runs on the
    // step-2 "Inserate suchen & Eintauschwert berechnen" button.
    if (compsMode === 'manual' && !state.comps.some((c) => c.price > 0)) {
      toast.info(t("Noch keine Vergleichsfahrzeuge"), {
        description: t("Trag den Inseratspreis von mindestens einem vergleichbaren Fahrzeug ein."),
      });
      return;
    }
    const key = `${state.make}|${state.model}|${state.year}|${state.bodyType}|${state.displacement}`;
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

  // Step 2: compute the Eintauschwert from the comps already gathered in step 1
  // (auto-searched or manually entered) plus the deductions. No portal call, no
  // quota — the search (if any) already happened in step 1.
  const handleCompute = () => {
    const validComps = state.comps.filter((c) => c.price > 0);
    if (validComps.length === 0) {
      toast.error(t("Mindestens 1 Vergleichsfahrzeug nötig"), {
        description: t("Trag den Inseratspreis von mindestens einem vergleichbaren Fahrzeug ein."),
      });
      return;
    }
    if (validComps.length < 3) {
      toast.info(t("Tipp: 3–5 Vergleichsfahrzeuge"), {
        description: t("Je mehr Vergleichsinserate, desto belastbarer der Marktwert."),
      });
    }
    finishWithComputation(state);
  };

  // Step 2, AUTO mode: the single "Inserate suchen & Eintauschwert berechnen"
  // action. Nothing is triggered separately — once the vehicle and deductions are
  // filled, this one call searches the Swiss portals AND computes the result in
  // one go. On success the result is shown; when the search finds nothing (or
  // fails), the user is dropped into manual entry in step 1 to complete the
  // comparison by hand. Consumes one search from quota.
  const handleSearchAndCompute = async () => {
    if (!validateVehicle()) return;
    if (!gateBeforeSearch()) return;

    // No automatic comps: send the user to manual entry in step 1 (where the
    // comparison rows live) so they can finish the lookup themselves.
    const fallbackToManual = () => {
      setCompsMode('manual');
      setStep(1);
      scrollToComps();
    };

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
          body: state.bodyType || undefined,
          displacement: state.displacement || undefined,
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
          toast.error(t("Automatische Suche momentan nicht verfügbar"), {
            description: t("Erfasse die Vergleichsfahrzeuge manuell – der Rechner funktioniert weiterhin."),
          });
          fallbackToManual();
        } else if (res.status === 429) {
          toast.error(t("Zu viele Anfragen"), {
            description:
              translateServerMessage(t, body?.message) ?? t("Bitte versuch es in einer Stunde nochmals."),
          });
          fallbackToManual();
        } else {
          toast.error(t("Suche fehlgeschlagen"), {
            description:
              translateServerMessage(t, body?.message) ?? t("Bitte prüf deine Eingaben und versuch es nochmals."),
          });
          fallbackToManual();
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

      if (comps.length === 0) {
        toast.warning(t("Keine Vergleichsinserate gefunden"), {
          description:
            translateServerMessage(t, data.diagnosis) ??
            t("Erfasse 3–5 Vergleichsfahrzeuge manuell – z.B. von AutoScout24 oder tutti."),
          duration: 10000,
        });
        fallbackToManual();
        return;
      }

      // Fill the comps from the search, then compute the result in the SAME action.
      setFoundListings(comps);
      // Merge into the LATEST state, not the click-time snapshot — the user may
      // have corrected the deductions while the search was running.
      const nextState: CalculatorState = {
        ...stateRef.current,
        comps: comps.map((c) => ({ price: c.price, km: c.km })),
      };
      setState(nextState);

      if (data.warning) {
        toast.warning(t("Wenige Treffer"), { description: translateServerMessage(t, data.warning) });
      } else {
        toast.success(t("{n} Vergleichsinserate gefunden", { n: comps.length }));
      }
      finishWithComputation(nextState);
    } catch {
      toast.error(t("Suche fehlgeschlagen"), {
        description: t("Netzwerkfehler – erfasse die Vergleichsfahrzeuge manuell oder versuch es erneut."),
      });
      fallbackToManual();
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
                label={i === 0 ? t("Inseratspreis") : ""}
                value={comp.price}
                onChange={(v) => updateComp(i, 'price', v)}
              />
            </div>
            <div className="flex-1">
              <MoneyInput
                label={i === 0 ? t("Kilometerstand") : ""}
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
              title={t("Zeile entfernen")}
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
        {t("Vergleichsfahrzeug")}
      </Button>
    </>
  );

  const foundListingsBlock = foundListings.length > 0 && (
    <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200 space-y-2">
      <p className="text-xs font-bold text-neutral-500 uppercase tracking-wide">
        {t("Gefundene Inserate")}
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

  // The km correction is applied silently (KM_ADJUST_PCT_PER_10K) — an editable
  // factor confused every tester, so it's explained, not asked.
  const kmAdjustNote = (
    <p className="text-xs text-neutral-500 leading-relaxed">
      <T
        k="<0>Kilometerstand wird automatisch berücksichtigt:</0> Vergleichsautos mit mehr Kilometern als deins sind entsprechend günstiger – der Rechner gleicht das mit rund {pct}% des Inseratspreises pro 10'000 km Differenz aus. Beispiel: CHF 20'000-Auto, 20'000 km Unterschied ≈ CHF 2'000."
        vars={{ pct: KM_ADJUST_PCT_PER_10K }}
        c={[<strong key="0" className="text-neutral-700" />]}
      />
    </p>
  );

  // Remaining-search counter, shared by the step-1 note (which adds a period)
  // and the step-2 line under the search button. Rendered only while > 0.
  const searchesLeftStrong = <strong key="0" className="text-neutral-800" />;
  const searchesLeftText =
    searchesLimit !== null ? (
      user ? (
        <T
          k="Noch <0>{n}</0> von {limit} Suchen diesen Monat übrig"
          vars={{ n: searchesRemaining, limit: searchesLimit }}
          c={[searchesLeftStrong]}
        />
      ) : (
        <T
          k="Noch <0>{n}</0> von {limit} gratis Suchen übrig"
          vars={{ n: searchesRemaining, limit: searchesLimit }}
          c={[searchesLeftStrong]}
        />
      )
    ) : user ? (
      <T k="Noch <0>{n}</0> Suchen diesen Monat übrig" vars={{ n: searchesRemaining }} c={[searchesLeftStrong]} />
    ) : (
      <T k="Noch <0>{n}</0> gratis Suchen übrig" vars={{ n: searchesRemaining }} c={[searchesLeftStrong]} />
    );

  return (
    <div className="w-full space-y-8" id="calculator-tool">

      {/* --- PRESETS --- */}
      <div className="flex flex-wrap gap-3 items-center justify-center p-4 bg-neutral-50 rounded-xl border border-neutral-200">
        <span className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mr-2">
          {t("Beispiel laden:")}
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
          <RotateCcw className="w-4 h-4 mr-2" /> {t("Reset")}
        </Button>
      </div>

      {/* --- STEP 1: Vehicle & Market --- */}
      {step === 1 && (
        <Card className="max-w-2xl mx-auto border-neutral-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-neutral-50 border-b border-neutral-100 pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center text-sm font-bold">1</div>
              {t("Fahrzeug & Marktlage")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Typenschein-Schnell-Erfassung: ein 6-stelliger Code aus dem
                Fahrzeugausweis identifiziert das Fahrzeug exakt (ASTRA-Daten). */}
            <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-red-600" />
                <Label className="text-sm font-bold text-neutral-900">
                  {t("Schnell-Erfassung mit Typenschein-Nr.")}
                </Label>
                <span className="text-xs text-neutral-400">{t("(optional)")}</span>
              </div>
              <div className="flex gap-2">
                <Input
                  value={tgInput}
                  onChange={(e) => setTgInput(e.target.value.toUpperCase())}
                  placeholder={t("z.B. 1TD812")}
                  className="uppercase bg-white"
                  maxLength={10}
                  autoComplete="off"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTgLookup}
                  disabled={tgLoading}
                  className="shrink-0 border-neutral-300"
                >
                  {tgLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {t("Übernehmen")}
                </Button>
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed">
                {t("Feld 24 im Fahrzeugausweis – füllt Marke, Modell, Karosserie und Motorisierung exakt aus (ASTRA-Typengenehmigung, gratis). Steht dort «IVI» oder «X», erfasse das Fahrzeug manuell.")}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-bold text-neutral-900">{t("Marke *")}</Label>
                {useSelectFields ? (
                  <Select value={makeId} onValueChange={handleMakeSelect}>
                    <SelectTrigger className="border-neutral-400 bg-white shadow-sm font-semibold">
                      <SelectValue placeholder={t("Marke wählen")} />
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
                    placeholder={t("z.B. VW")}
                    className="border-neutral-400 bg-white shadow-sm font-semibold"
                  />
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-bold text-neutral-900">{t("Modell *")}</Label>
                {useSelectFields ? (
                  modelSelectReady ? (
                    <Select value={modelId} onValueChange={handleModelSelect}>
                      <SelectTrigger className="border-neutral-400 bg-white shadow-sm font-semibold">
                        <SelectValue placeholder={t("Modell wählen")} />
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
                        <SelectValue placeholder={t("Modelle laden…")} />
                      </SelectTrigger>
                      <SelectContent />
                    </Select>
                  ) : makeId ? (
                    <Input
                      type="text"
                      value={state.model}
                      onChange={(e) => updateState('model', e.target.value)}
                      placeholder={t("z.B. Golf")}
                      className="border-neutral-400 bg-white shadow-sm font-semibold"
                    />
                  ) : (
                    <Select value="" disabled>
                      <SelectTrigger className="border-neutral-400 bg-white shadow-sm font-semibold">
                        <SelectValue placeholder={t("Zuerst Marke wählen")} />
                      </SelectTrigger>
                      <SelectContent />
                    </Select>
                  )
                ) : (
                  <Input
                    type="text"
                    value={state.model}
                    onChange={(e) => updateState('model', e.target.value)}
                    placeholder={t("z.B. Golf")}
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
                    {t("Marke oder Modell nicht in der Liste? Manuell eingeben")}
                  </button>
                ) : makes.length > 0 ? (
                  <button
                    type="button"
                    onClick={switchToSelectFields}
                    className="text-xs text-neutral-400 hover:text-red-600 underline underline-offset-2 transition-colors"
                  >
                    {t("Aus Liste wählen")}
                  </button>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-bold text-neutral-900">{t("Jahrgang *")}</Label>
                <Input
                  type="number"
                  min={1980}
                  max={CURRENT_YEAR + 1}
                  value={state.year === 0 ? "" : state.year}
                  onChange={(e) => updateState('year', Number(e.target.value))}
                  placeholder={t("z.B. {year}", { year: CURRENT_YEAR - 5 })}
                  className="border-neutral-400 bg-white shadow-sm font-semibold"
                />
              </div>
              <MoneyInput
                label={t("Kilometerstand *")}
                value={state.vehicleKm}
                onChange={(v) => updateState('vehicleKm', v)}
                unit="km"
                highlight
                placeholder={t("z.B. 80'000")}
                tooltip={t("Kilometerstand des Fahrzeugs, das du in Eintausch nimmst.")}
              />
              <div className="sm:col-span-2 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium text-neutral-600">
                    {t("Karosserie (optional)")}
                  </Label>
                  <TooltipProvider>
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-neutral-400 hover:text-neutral-600 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs bg-neutral-900 text-white border-neutral-800">
                        <p className="text-xs">
                          {t("Existiert das Modell in mehreren Varianten (z.B. Coupé und Roadster), macht die Angabe die automatische Suche deutlich präziser – nur passende Varianten fliessen in die Bewertung ein.")}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Select
                  value={state.bodyType === "" ? "any" : state.bodyType}
                  onValueChange={(v) => updateState('bodyType', v === "any" ? "" : v)}
                >
                  <SelectTrigger className="bg-neutral-50/50">
                    <SelectValue placeholder={t("Weiss nicht / egal")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">{t("Weiss nicht / egal")}</SelectItem>
                    {BODY_TYPE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {t(o.label)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div id="comps-anchor" className="flex items-center justify-between gap-4 flex-wrap scroll-mt-4">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-bold text-neutral-900">
                  {t("Vergleichsfahrzeuge")}
                </Label>
                <TooltipProvider>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-neutral-400 hover:text-neutral-600 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs bg-neutral-900 text-white border-neutral-800">
                      <p className="text-xs">
                        {t("Automatisch: der Rechner durchsucht öffentliche Schweizer Occasions-Portale nach passenden Inseraten. Manuell: trag Preis und Kilometerstand von 3–5 Inseraten selbst ein. Gefundene Werte kannst du immer noch anpassen.")}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Tabs
                value={compsMode}
                onValueChange={(v) => {
                  const mode = v as CompsMode;
                  if (mode === compsMode) return;
                  setCompsMode(mode);
                  // Leaving auto mode dismisses an auto-search quota gate — manual
                  // entry is always free and must not sit behind a gate.
                  if (mode === 'manual') setGateKind(null);
                  // Switching the comparison source invalidates any previous
                  // result: its comps belong to the OTHER mode. Clear it so the
                  // next action recomputes correctly — a stale "Neuberechnung"
                  // must never reuse the wrong comps.
                  setResult(null);
                  if (mode === 'auto') {
                    // Auto fetches its own comps: drop the manually entered rows
                    // and the previous search tag so step 2 offers a fresh
                    // "Inserate suchen & Eintauschwert berechnen" search instead
                    // of recomputing with the manual values.
                    setFoundListings([]);
                    setState((prev) => ({
                      ...prev,
                      comps: DEFAULT_STATE.comps.map((c) => ({ ...c })),
                    }));
                    searchedVehicleRef.current = "";
                  }
                }}
              >
                <TabsList className="h-9 bg-neutral-100 p-1">
                  <TabsTrigger
                    value="auto"
                    className="data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm font-semibold text-xs px-3"
                  >
                    {t("Automatisch suchen")}
                  </TabsTrigger>
                  <TabsTrigger
                    value="manual"
                    className="data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm font-semibold text-xs px-3"
                  >
                    {t("Manuell erfassen")}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* AUTO MODE: no comps here and no separate search action — the search
                runs together with the calculation on the step-2 button, once the
                vehicle AND deductions are filled. This is just an explainer. */}
            {compsMode === 'auto' && (
              <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200 text-sm text-neutral-600 leading-relaxed">
                <Search className="w-4 h-4 inline-block mr-2 text-red-600" />
                {t("Sobald du auf «Inserate suchen & Eintauschwert berechnen» klickst, durchsucht der Rechner Schweizer Occasions-Portale (AutoScout24, tutti & Co.), gleicht die Kilometer an und berechnet den Eintauschwert – alles in einem Schritt.")}
                {searchesRemaining !== null && (
                  <span className="block mt-2" aria-live="polite">
                    {searchesRemaining > 0 ? (
                      <>{searchesLeftText}.</>
                    ) : (
                      <strong className="text-red-600">
                        {user ? t("Monatskontingent aufgebraucht") : t("Gratis-Suchen aufgebraucht")}.
                      </strong>
                    )}
                  </span>
                )}
              </div>
            )}

            {/* MANUAL MODE: the comparison rows live here in step 1. */}
            {compsMode === 'manual' && (
              <>
                {compRowsEditor}
                {kmAdjustNote}
              </>
            )}

            {/* Primary CTA — identical in both modes: proceed to the deductions. */}
            <Button
              size="lg"
              onClick={handleContinue}
              className="w-full bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30 py-6 text-base font-semibold rounded-xl"
            >
              {t("Weiter zu den Abzügen")}
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
              <p className="font-bold text-neutral-900 truncate">{vehicleLabel || t("Fahrzeug")}</p>
              <p className="text-xs text-neutral-500">
                {chf(state.vehicleKm)} km · {compsMode === 'auto' ? t("Automatische Suche") : t("Manuelle Vergleichswerte")}
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
            {t("Bearbeiten")}
          </Button>
        </div>

        <Card className="border-neutral-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-neutral-50 border-b border-neutral-100 pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <div className="w-8 h-8 rounded-full bg-white border-2 border-neutral-900 text-neutral-900 flex items-center justify-center text-sm font-bold">2</div>
              {t("Deine Abzüge als Garage")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <MoneyInput
                label={t("Aufbereitung & Reparaturen")}
                value={state.reconCost}
                onChange={(v) => updateState('reconCost', v)}
                tooltip={t("Reinigung, Politur, kleine Instandstellungen, MFK falls nötig. Üblich: 300–1'500 CHF.")}
              />
              <MoneyInput
                label={t("Garantie-Rückstellung")}
                value={state.warrantyCost}
                onChange={(v) => updateState('warrantyCost', v)}
                tooltip={t("Rückstellung für die gesetzliche Gewährleistung beim Weiterverkauf. Üblich: 300–800 CHF.")}
              />
              <div className="sm:col-span-2">
                <MoneyInput
                  label={t("Standzeit & Kapitalbindung")}
                  value={state.standingCost}
                  onChange={(v) => updateState('standingCost', v)}
                  tooltip={t("Platzkosten, Inserate und gebundenes Kapital bis zum Weiterverkauf. Faustregel: ca. 10–30 CHF pro Standtag.")}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-bold text-neutral-900">{t("Deine Marge")}</Label>
                  <TooltipProvider>
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-neutral-400 hover:text-neutral-600 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs bg-neutral-900 text-white border-neutral-800">
                        <p className="text-xs">
                          {t("Branchenüblich sind 10–20% vom Marktwert – oder ein fixes Ertragsziel pro Fahrzeug (z.B. 1'500 CHF). Prozent skaliert mit dem Fahrzeugwert, Fixbetrag eignet sich für günstige Fahrzeuge.")}
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
                      {t("Prozent")}
                    </TabsTrigger>
                    <TabsTrigger
                      value="fixed"
                      className="data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm font-semibold text-xs px-3"
                    >
                      {t("Fixbetrag")}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {state.marginMode === 'percent' ? (
                <MoneyInput
                  label={t("Marge in % vom Marktwert")}
                  value={state.marginPercent}
                  onChange={(v) => updateState('marginPercent', v)}
                  unit="%"
                  highlight
                />
              ) : (
                <MoneyInput
                  label={t("Marge als Fixbetrag")}
                  value={state.marginFixed}
                  onChange={(v) => updateState('marginFixed', v)}
                  highlight
                />
              )}
            </div>

            <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
              <p className="text-xs text-neutral-500 leading-relaxed">
                <T
                  k="<0>Faustregel:</0> Der Eintauschwert liegt am Ende meist bei <1>80–90% des Marktwerts</1>. Liegt dein Ergebnis deutlich darunter oder darüber, prüfe Abzüge und Vergleichspreise."
                  c={[<strong key="0" className="text-neutral-700" />, <strong key="1" className="text-neutral-700" />]}
                />
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Comps stay editable after a calculation — "Neuberechnung" reuses them. */}
        {result && state.comps.some((c) => c.price > 0) && (
          <Card className="border-neutral-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-neutral-50 border-b border-neutral-100 pb-4">
              <CardTitle className="text-base font-bold text-neutral-700">
                {t("Vergleichsinserate (anpassbar)")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {foundListingsBlock}
              {compRowsEditor}
              {kmAdjustNote}
            </CardContent>
          </Card>
        )}

        {/* --- SEARCH + CALCULATE / RECALCULATE --- */}
        {/* The single action once everything is filled: in auto mode it searches
            the portals AND computes in one step; in manual mode it just computes.
            After a result, it becomes a free "Neuberechnung" (no new search). */}
        <div className="flex flex-col items-center gap-3">
          <Button
            size="lg"
            onClick={
              result
                ? handleRecalculate
                : compsMode === 'auto'
                  ? handleSearchAndCompute
                  : handleCompute
            }
            disabled={searching}
            className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30 px-10 py-6 text-base font-semibold rounded-xl w-full max-w-md"
          >
            {searching ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {t("Suche & berechne…")}
              </>
            ) : result ? (
              <>
                <RotateCcw className="w-5 h-5 mr-2" />
                {t("Neuberechnung")}
              </>
            ) : compsMode === 'auto' ? (
              <>
                <Search className="w-5 h-5 mr-2" />
                {t("Inserate suchen & Eintauschwert berechnen")}
              </>
            ) : (
              <>
                <Calculator className="w-5 h-5 mr-2" />
                {t("Eintauschwert berechnen")}
              </>
            )}
          </Button>
          {/* Search counter — auto mode, before the first result. */}
          {compsMode === 'auto' && !result && searchesRemaining !== null && (
            <p className="text-sm text-center" aria-live="polite">
              {searchesRemaining > 0 ? (
                <span className="text-neutral-500">{searchesLeftText}</span>
              ) : (
                <span className="text-red-600 font-medium">
                  {user ? t("Monatskontingent aufgebraucht") : t("Gratis-Suchen aufgebraucht")}
                </span>
              )}
            </p>
          )}
          {result && (
            <Button
              variant="outline"
              size="lg"
              onClick={handleNewCar}
              className="border-neutral-300 text-neutral-700 hover:text-red-600 hover:border-red-300 rounded-xl w-full max-w-md"
            >
              <Car className="w-5 h-5 mr-2" />
              {t("Neues Auto berechnen")}
            </Button>
          )}
          {result && (
            <p className="text-xs text-neutral-400 text-center">
              {t("Neuberechnungen mit angepassten Abzügen sind gratis und zählen nicht zu deinen Suchen.")}
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
                <h3 className="text-2xl md:text-3xl font-bold">
                  {t("{n} gratis Suchen erreicht", { n: ANON_FREE_SEARCHES })}
                </h3>
                <p className="text-neutral-300 leading-relaxed">
                  {t("Registriere dich kostenlos als Garage und rechne weiter – der Rechner ist dann auch direkt in deinem Konto verfügbar.")}
                </p>
                <ul className="text-sm text-neutral-300 space-y-2 text-left max-w-sm mx-auto">
                  <li className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    {t("{free} Suchen pro Monat gratis – mit einem Garagen-Paket bis zu {max} pro Monat", {
                      free: FREE_MONTHLY_LIMIT,
                      max: MAX_PLAN_VALUATIONS,
                    })}
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    {t("Rechner in deinem Konto & manuelle Berechnung ohne Limit")}
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    {t("Fahrzeuge inserieren – plus eigene Garagen-Seite mit deinem ganzen Bestand")}
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    {t("Alle Informationen und Dokumente bleiben an einem zentralen Ort in der App")}
                  </li>
                </ul>
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  <Button asChild size="lg" className="bg-red-600 hover:bg-red-700 text-white border-none">
                    <Link href={SIGNUP_HREF}>{t("Kostenlos als Garage registrieren")}</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-white/20 hover:bg-white/10 hover:text-white bg-transparent text-white">
                    <Link href="/auth?redirect=/eintauschwert-rechner">{t("Ich habe schon ein Konto")}</Link>
                  </Button>
                </div>
                <p className="text-xs text-neutral-500">
                  {t(
                    "Automatische Suchen je nach Paket: Starter {starter}, Growth {growth}, Pro {pro} pro Monat. Manuelle Berechnungen immer unbegrenzt.",
                    {
                      starter: GARAGE_PLANS.starter.valuationsPerMonth,
                      growth: GARAGE_PLANS.growth.valuationsPerMonth,
                      pro: GARAGE_PLANS.pro.valuationsPerMonth,
                    }
                  )}
                </p>
              </>
            )}

            {gateKind === "free_plan" && (
              <>
                <h3 className="text-2xl md:text-3xl font-bold">{t("Monatslimit erreicht")}</h3>
                <p className="text-neutral-300 leading-relaxed">
                  <T
                    k="Du hast diesen Monat alle <0>{free} Gratis-Suchen</0> genutzt. Weitere automatische Suchen sind nicht gratis – mit einem <1>Garagen-Paket sind bis zu {max} Suchen pro Monat</1> inklusive. Dazu inserierst du deine Fahrzeuge und bekommst eine eigene Garagen-Seite mit deinem ganzen Bestand – alle Informationen und Dokumente bleiben an einem zentralen Ort in der App."
                    vars={{ free: FREE_MONTHLY_LIMIT, max: MAX_PLAN_VALUATIONS }}
                    c={[<strong key="0" className="text-white" />, <strong key="1" className="text-white" />]}
                  />
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  {/* /garage-plan ejects non-garage accounts, so private users go
                      through the Garage-werden upgrade modal on their dashboard. */}
                  <Button asChild size="lg" className="bg-red-600 hover:bg-red-700 text-white border-none">
                    {isGarage ? (
                      <Link href={`/garage-plan?redirect=${encodeURIComponent(gateReturnPath)}`}>
                        {t("Paket wählen")}
                      </Link>
                    ) : (
                      <Link href="/dashboard/private?upgrade=1">{t("Jetzt Garage werden")}</Link>
                    )}
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-white/20 hover:bg-white/10 hover:text-white bg-transparent text-white">
                    <Link href="/preise">{t("Preise vergleichen")}</Link>
                  </Button>
                </div>
                <p className="text-xs text-neutral-500">
                  {t(
                    "Manuelle Berechnungen bleiben unbegrenzt gratis. Automatische Suchen je nach Paket: Starter {starter}, Growth {growth}, Pro {pro} pro Monat.",
                    {
                      starter: GARAGE_PLANS.starter.valuationsPerMonth,
                      growth: GARAGE_PLANS.growth.valuationsPerMonth,
                      pro: GARAGE_PLANS.pro.valuationsPerMonth,
                    }
                  )}
                </p>
              </>
            )}

            {gateKind === "paid_limit" && (
              <>
                <h3 className="text-2xl md:text-3xl font-bold">{t("Monatskontingent erreicht")}</h3>
                <p className="text-neutral-300 leading-relaxed">
                  {t(
                    "Du hast diesen Monat {n} automatische Suchen genutzt – das Kontingent deines Pakets. Ein grösseres Paket bringt mehr Bewertungen; melde dich, wir schalten dir auch einzelne Kontingente frei. Manuelle Berechnungen bleiben unbegrenzt.",
                    { n: quota?.limit ?? PAID_MONTHLY_LIMIT }
                  )}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  {isGarage && (
                    <Button asChild size="lg" className="bg-red-600 hover:bg-red-700 text-white border-none">
                      <Link href={`/garage-plan?redirect=${encodeURIComponent(gateReturnPath)}`}>
                        {t("Paket vergrössern")}
                      </Link>
                    </Button>
                  )}
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-white/20 hover:bg-white/10 hover:text-white bg-transparent text-white"
                  >
                    <Link href="/#kontakt">{t("Kontakt aufnehmen")}</Link>
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
              {vehicleLabel ? t("Ergebnis – {vehicle}", { vehicle: vehicleLabel }) : t("Ergebnis")}
            </h3>

            {/* Zu dünne oder zu breit streuende Datenbasis: die Spanne IST das
                Ergebnis — ein einzelner selbstbewusster Punktwert wäre gelogen. */}
            {result.lowConfidence && (
              <div className="max-w-2xl mx-auto mb-8 bg-amber-500/10 border border-amber-500/40 rounded-xl p-4 sm:p-5 flex gap-3 text-left">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-sm text-neutral-200 leading-relaxed">
                  <p className="font-bold text-amber-300 mb-1">
                    {t("Unsichere Bewertung – nimm die Spanne, nicht den Mittelwert")}
                  </p>
                  <p>
                    {result.compCount < MIN_CONFIDENT_COMPS &&
                      `${
                        result.compCount === 1
                          ? t("Nur {n} Vergleichsfahrzeug vorhanden.", { n: result.compCount })
                          : t("Nur {n} Vergleichsfahrzeuge vorhanden.", { n: result.compCount })
                      } `}
                    {result.spreadFactor !== null &&
                      result.spreadFactor > MAX_CONFIDENT_SPREAD &&
                      `${t(
                        "Die angeglichenen Preise liegen um Faktor {factor} auseinander – vermutlich stecken unterschiedliche Varianten oder Ausstattungen in den Treffern.",
                        { factor: result.spreadFactor.toFixed(1) }
                      )} `}
                    {t("Prüf die Vergleichsinserate, entferne unpassende und ergänze 3–5 wirklich vergleichbare – die Neuberechnung ist gratis.")}
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-col md:flex-row items-stretch justify-center gap-4 md:gap-8 mb-10">
              {/* MARKET VALUE */}
              <div className="flex-1 bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="text-sm font-medium text-neutral-400 mb-4">
                  {t("Marktwert (Verkaufspreis)")}
                </div>
                {result.lowConfidence ? (
                  <>
                    <div className="text-2xl sm:text-3xl font-bold">
                      CHF {chf(result.marketMin)} – {chf(result.marketMax)}
                    </div>
                    <div className="text-xs text-neutral-500 mt-1">
                      {result.bandIsIqr
                        ? result.compCount === 1
                          ? t("Typische Spanne (P25–P75) aus {n} Vergleichsfahrzeug, km-bereinigt", { n: result.compCount })
                          : t("Typische Spanne (P25–P75) aus {n} Vergleichsfahrzeugen, km-bereinigt", { n: result.compCount })
                        : result.compCount === 1
                          ? t("Spanne aus {n} Vergleichsfahrzeug, km-bereinigt", { n: result.compCount })
                          : t("Spanne aus {n} Vergleichsfahrzeugen, km-bereinigt", { n: result.compCount })}
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/10 text-sm text-neutral-300">
                      {t("Median: CHF {value}", { value: chf(result.marketValue) })}
                      {result.bandIsIqr && (
                        <span className="block text-xs text-neutral-500 mt-1">
                          {t("Alle Inserate: CHF {min} – {max}", { min: chf(result.fullMin), max: chf(result.fullMax) })}
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-3xl font-bold">CHF {chf(result.marketValue)}</div>
                    <div className="text-xs text-neutral-500 mt-1">
                      {result.compCount === 1
                        ? t("Median aus {n} Vergleichsfahrzeug, km-bereinigt", { n: result.compCount })
                        : t("Median aus {n} Vergleichsfahrzeugen, km-bereinigt", { n: result.compCount })}
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/10 text-sm text-neutral-300">
                      {result.bandIsIqr
                        ? t("Typische Spanne (P25–P75): CHF {min} – {max}", {
                            min: chf(result.marketMin),
                            max: chf(result.marketMax),
                          })
                        : t("Spanne: CHF {min} – {max}", { min: chf(result.marketMin), max: chf(result.marketMax) })}
                      {result.bandIsIqr && (
                        <span className="block text-xs text-neutral-500 mt-1">
                          {t("Alle Inserate: CHF {min} – {max}", { min: chf(result.fullMin), max: chf(result.fullMax) })}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* VS Divider */}
              <div className="hidden md:flex flex-col items-center justify-center gap-2">
                <div className="h-full w-px bg-neutral-800/50"></div>
                <div className="text-neutral-600 font-bold text-sm bg-neutral-900 z-10 py-2">−</div>
                <div className="h-full w-px bg-neutral-800/50"></div>
              </div>

              {/* OFFER */}
              <div
                className={`flex-1 rounded-xl p-6 border shadow-lg ${
                  result.lowConfidence
                    ? "bg-amber-500/5 border-amber-500/50 shadow-amber-900/20"
                    : "bg-green-500/5 border-green-500/50 shadow-green-900/20"
                }`}
              >
                <div className="text-sm font-medium text-neutral-400 mb-4 flex justify-between items-start">
                  {result.lowConfidence ? t("Dein Eintauschwert (Spanne)") : t("Dein Eintauschwert (Angebot)")}
                  {result.lowConfidence ? (
                    <Badge className="bg-amber-500 hover:bg-amber-600 text-neutral-950 border-none">
                      {t("Grobe Schätzung")}
                    </Badge>
                  ) : (
                    <Badge className="bg-green-500 hover:bg-green-600 text-white border-none">
                      {t("{pct}% vom Marktwert", { pct: result.offerShare.toFixed(0) })}
                    </Badge>
                  )}
                </div>
                {result.lowConfidence ? (
                  <>
                    <div className="text-2xl sm:text-3xl font-bold text-amber-400">
                      CHF {chf(result.offerMin)} – {chf(result.offerMax)}
                    </div>
                    <div className="text-xs text-neutral-500 mt-1">
                      {t("Marktwert-Spanne minus Abzüge, gerundet auf CHF 50")}
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/10 text-sm text-neutral-300">
                      {t("Rechnerischer Mittelwert: CHF {value}", { value: chf(result.offer) })}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-4xl font-bold text-green-400">CHF {chf(result.offer)}</div>
                    <div className="text-xs text-neutral-500 mt-1">
                      {t("Marktwert minus Abzüge, gerundet auf CHF 50")}
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/10 text-sm text-neutral-300">
                      {t("Verhandlungs-Spanne: CHF {min} – {max}", { min: chf(result.offerMin), max: chf(result.offerMax) })}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* BREAKDOWN TABLE */}
            <div className="max-w-2xl mx-auto text-sm bg-neutral-950/50 rounded-lg p-3 sm:p-4 md:p-6 border border-white/5">
              <div className="flex justify-between items-center text-neutral-500 font-bold uppercase text-xs tracking-wider mb-4 border-b border-white/10 pb-2">
                <span>{t("Rechenweg")}</span>
                <span className="text-right">CHF</span>
              </div>

              <div className="flex justify-between items-center py-1.5 text-white font-medium">
                <span>{t("Marktwert (Median, km-bereinigt)")}</span>
                <span className="font-mono">{chf(result.marketValue)}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 text-neutral-400">
                <span>{t("− Aufbereitung & Reparaturen")}</span>
                <span className="font-mono">{chf(result.reconCost)}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 text-neutral-400">
                <span>{t("− Garantie-Rückstellung")}</span>
                <span className="font-mono">{chf(result.warrantyCost)}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 text-neutral-400">
                <span>{t("− Standzeit & Kapitalbindung")}</span>
                <span className="font-mono">{chf(result.standingCost)}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 text-neutral-400">
                <span>
                  {state.marginMode === 'percent'
                    ? t("− Marge ({pct}% vom Marktwert)", { pct: state.marginPercent })
                    : t("− Marge (Fixbetrag)")}
                </span>
                <span className="font-mono">{chf(result.marginValue)}</span>
              </div>

              <div className="border-t border-white/20 mt-3 pt-3 flex justify-between items-center font-bold text-base">
                <span>{t("Eintauschwert (gerundet)")}</span>
                <span className="font-mono text-green-400">CHF {chf(result.offer)}</span>
              </div>
            </div>

            <div className="flex justify-center mt-6">
              <Button variant="link" className="text-neutral-400 hover:text-white" onClick={() => setShowFormulas(!showFormulas)}>
                {showFormulas ? <ChevronUp className="w-4 h-4 mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
                {t("Berechnungsdetails anzeigen")}
              </Button>
            </div>

            {showFormulas && (
              <div className="max-w-2xl mx-auto mt-4 p-4 bg-black/20 rounded-lg text-xs text-neutral-400 font-mono">
                <p className="mb-2 font-bold text-white">{t("Berechnungslogik:")}</p>
                <div className="space-y-1">
                  <p>
                    {t("Angeglichener Preis = Inseratspreis ± {pct}% pro 10'000 km Differenz (max. ±{cap}%)", {
                      pct: KM_ADJUST_PCT_PER_10K,
                      cap: Math.round(KM_ADJUST_CAP * 100),
                    })}
                  </p>
                  <p>{t("Marktwert = Median der angeglichenen Preise")}</p>
                  <p>{t("Eintauschwert = Marktwert − Aufbereitung − Garantie − Standzeit − Marge")}</p>
                  <p>
                    {t("Ab 4 Inseraten zeigt die Spanne das mittlere Preisfeld (P25–P75); die absolute Streuung aller Inserate bleibt separat sichtbar")}
                  </p>
                  <p>
                    {t(
                      "Unter {min} Inseraten oder ab Faktor {factor} zwischen günstigstem und teuerstem Inserat wird die Spanne statt des Medians gezeigt",
                      { min: MIN_CONFIDENT_COMPS, factor: MAX_CONFIDENT_SPREAD }
                    )}
                  </p>
                </div>
                <p className="mt-3 text-neutral-500">
                  {t("Angeglichene Vergleichspreise: {prices}", {
                    prices: result.adjustedPrices.map((p) => chf(p)).join(" / "),
                  })}
                </p>
              </div>
            )}

            {/* CTA */}
            <div className="max-w-2xl mx-auto mt-8 bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10 text-center">
              <p className="text-neutral-300 mb-4">
                <T
                  k="Fahrzeug übernommen? <0>Verkauf es schneller mit BuyAuto.</0> Als Garage zeigst du deinen ganzen Fahrzeugbestand auf einer eigenen Garagen-Seite und erreichst tausende Käufer. Alle Informationen und Dokumente bleiben an einem zentralen Ort in der App – kürzere Standzeit, mehr Marge."
                  c={[<strong key="0" className="text-white" />]}
                />
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild className="bg-red-600 hover:bg-red-700 text-white border-none">
                  <Link href="/preise#plaene">{t("Garagen-Pakete & Preise")}</Link>
                </Button>
                <Button asChild variant="outline" className="border-white/20 hover:bg-white/10 hover:text-white bg-transparent text-white">
                  <Link href="/inserat-erstellen">{t("Occasion inserieren")}</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
