import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { LeasingOffer } from "@/lib/buyauto/types";
import { cn } from "@/lib/utils";

export interface RestwertEstimate {
  restwertChf: number;
  residualPct: number;
  basePct: number;
  ageAdj: number;
  kmAdj: number;
  endKm: number;
  typicalEndKm: number;
}

const chfFormatter = new Intl.NumberFormat("de-CH", { maximumFractionDigits: 0 });

function formatCurrency(amountChf: number): string {
  return `CHF ${chfFormatter.format(Math.round(amountChf))}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function interpolateBaseResidualPct(termMonths: number): number {
  const points: Array<{ m: number; p: number }> = [
    { m: 24, p: 0.62 },
    { m: 36, p: 0.55 },
    { m: 48, p: 0.48 },
    { m: 60, p: 0.42 },
  ];

  const clamped = clamp(termMonths, points[0].m, points[points.length - 1].m);

  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (clamped >= a.m && clamped <= b.m) {
      const t = (clamped - a.m) / (b.m - a.m);
      return lerp(a.p, b.p, t);
    }
  }

  return points[points.length - 1].p;
}

export function estimateRestwert(args: {
  priceChf: number;
  year: number;
  mileageKm: number;
  termMonths: number;
  kmPerYear: number;
  currentYear: number;
}): RestwertEstimate {
  const { priceChf, year, mileageKm, termMonths, kmPerYear, currentYear } = args;

  const ageYears = Math.max(0, currentYear - year);

  const basePct = interpolateBaseResidualPct(termMonths);

  const ageAdj = clamp(0.03 - 0.02 * ageYears, -0.15, 0.03);

  const endKm = mileageKm + kmPerYear * (termMonths / 12);
  const typicalEndKm = mileageKm + 15000 * (termMonths / 12);
  const deltaKm = endKm - typicalEndKm;
  const kmAdj = clamp(-deltaKm / 100000, -0.08, 0.04);

  const residualPct = clamp(basePct + ageAdj + kmAdj, 0.15, 0.7);

  const restwertChf = Math.round(priceChf * residualPct);

  return {
    restwertChf,
    residualPct,
    basePct,
    ageAdj,
    kmAdj,
    endKm,
    typicalEndKm,
  };
}

export interface LeasingRateEstimate {
  restwertChf: number;
  residualPct: number;
  downPaymentChf: number;
  monthlyAmort: number;
  monthlyInterest: number;
  monthlyRateChf: number;
}

export function estimateMonthlyLeasingRate(args: {
  priceChf: number;
  interestRatePct: number;
  downPaymentPct: number;
  termMonths: number;
  restwertChf: number;
}): LeasingRateEstimate {
  const { priceChf, interestRatePct, downPaymentPct, termMonths, restwertChf } = args;

  const downPaymentChf = priceChf * (downPaymentPct / 100);

  const principal = priceChf - downPaymentChf - restwertChf;
  const monthlyAmort = principal / termMonths;

  const monthlyInterest = ((priceChf - downPaymentChf + restwertChf) / 2) * (interestRatePct / 100) / 12;

  const monthlyRateChf = monthlyAmort + monthlyInterest;

  return {
    restwertChf,
    residualPct: priceChf > 0 ? restwertChf / priceChf : 0,
    downPaymentChf,
    monthlyAmort,
    monthlyInterest,
    monthlyRateChf,
  };
}

export interface LeasingCalculatorProps {
  priceChf: number;
  year: number;
  mileageKm: number;
  offer: LeasingOffer;
}

export function LeasingCalculator({ priceChf, year, mileageKm, offer }: LeasingCalculatorProps) {
  const kmOptions = Array.isArray(offer.km_options) && offer.km_options.length > 0 ? offer.km_options : [10000, 15000, 20000, 25000];

  const minTerm = Math.max(1, Math.floor(offer.min_term_months));
  const maxTerm = Math.max(minTerm, Math.floor(offer.max_term_months));

  const initialTerm = clamp(36, minTerm, maxTerm);
  const initialDownPaymentPct = offer.no_down_payment ? 0 : clamp(Number(offer.down_payment_pct), 0, 100);

  const [termMonths, setTermMonths] = useState<number>(initialTerm);
  const [downPaymentPct, setDownPaymentPct] = useState<number>(initialDownPaymentPct);
  const [kmPerYear, setKmPerYear] = useState<number>(kmOptions.includes(15000) ? 15000 : kmOptions[0]);
  const [restwertOverrideChf, setRestwertOverrideChf] = useState<number | null>(null);

  const estimate = useMemo(() => {
    const currentYear = new Date().getFullYear();

    const restwert = estimateRestwert({
      priceChf,
      year,
      mileageKm,
      termMonths,
      kmPerYear,
      currentYear,
    });

    const exampleRestwert = estimateRestwert({
      priceChf,
      year,
      mileageKm,
      termMonths: 48,
      kmPerYear: 10000,
      currentYear,
    });

    const effectiveRestwertChf = restwertOverrideChf !== null ? clamp(restwertOverrideChf, 0, Math.round(priceChf)) : restwert.restwertChf;

    const rate = estimateMonthlyLeasingRate({
      priceChf,
      interestRatePct: Number(offer.interest_rate_pct),
      downPaymentPct: offer.no_down_payment ? 0 : downPaymentPct,
      termMonths,
      restwertChf: effectiveRestwertChf,
    });

    return { restwert, rate, effectiveRestwertChf, exampleRestwert };
  }, [
    downPaymentPct,
    kmPerYear,
    mileageKm,
    offer.interest_rate_pct,
    offer.no_down_payment,
    priceChf,
    restwertOverrideChf,
    termMonths,
    year,
  ]);

  const formattedRate = Math.round(estimate.rate.monthlyRateChf);
  const formattedRestwert = Math.round(estimate.effectiveRestwertChf);
  const isRestwertOverridden = restwertOverrideChf !== null;

  return (
    <Card className="border-neutral-200/60 shadow-sm bg-white rounded-3xl overflow-hidden">
      <CardContent className="p-6">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-neutral-900 tracking-tight">Leasingrechner (Richtofferte)</h3>
          <p className="text-sm text-neutral-600 mt-1">
            Unverbindliche Richtofferte. Finale Rate hängt von Bonität, Leasingpartner und Fahrzeugbewertung ab.
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200/60 bg-neutral-50 p-4">
          <p className="text-sm text-neutral-600">Geschätzte Monatsrate</p>
          <p className="text-3xl font-bold text-neutral-900 tracking-tight mt-1">CHF {formattedRate}.–</p>
          <p className="text-sm text-neutral-600 mt-2">
            {isRestwertOverridden ? "Restwert (angepasst): " : "Geschätzter Restwert (Schätzung): "}
            <span className="font-medium text-neutral-900">CHF {formattedRestwert}.–</span>
            {!isRestwertOverridden && (
              <span className="text-neutral-500"> (≈ {(estimate.restwert.residualPct * 100).toFixed(0)}%)</span>
            )}
          </p>

          <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
            Beispiel (48 Monate, 10’000 km/Jahr): geschätzter Restwert{" "}
            <span className="font-medium text-neutral-700">
              {formatCurrency(Math.round(estimate.exampleRestwert.restwertChf))}.–
            </span>{" "}
            (ca. {Math.round(estimate.exampleRestwert.residualPct * 100)}% vom Kaufpreis)
          </p>
        </div>

        <div className="mt-6 space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-neutral-900">Laufzeit</p>
              <p className="text-sm text-neutral-600">{termMonths} Monate</p>
            </div>
            <Slider
              value={[termMonths]}
              min={minTerm}
              max={maxTerm}
              step={1}
              onValueChange={(v) => setTermMonths(Math.floor(v[0] ?? termMonths))}
            />
            <p className="text-xs text-neutral-500">Bereich: {minTerm}–{maxTerm} Monate</p>
          </div>

          <div className={cn("space-y-2", offer.no_down_payment ? "opacity-60" : "")}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-neutral-900">Anzahlung</p>
              <p className="text-sm text-neutral-600">{offer.no_down_payment ? "0%" : `${downPaymentPct.toFixed(0)}%`}</p>
            </div>

            {!offer.no_down_payment && (
              <Slider
                value={[downPaymentPct]}
                min={0}
                max={40}
                step={1}
                onValueChange={(v) => setDownPaymentPct(v[0] ?? downPaymentPct)}
              />
            )}

            <p className="text-xs text-neutral-500">
              {offer.no_down_payment ? "Keine Anzahlung benötigt (fix)." : "Schieber steuert die Richtofferte."}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-neutral-900">KM/Jahr</p>
            <Select value={String(kmPerYear)} onValueChange={(v) => setKmPerYear(Number(v))}>
              <SelectTrigger className="bg-white border border-neutral-200/60">
                <SelectValue placeholder="KM/Jahr wählen" />
              </SelectTrigger>
              <SelectContent>
                {kmOptions.map((km) => (
                  <SelectItem key={km} value={String(km)}>
                    {km.toLocaleString("de-CH")} km/Jahr
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-neutral-900">Restwert (Schätzung)</p>
            <Input
              value={isRestwertOverridden ? String(formattedRestwert) : ""}
              placeholder={`Schätzung: CHF ${estimate.restwert.restwertChf}.– (optional überschreiben)`}
              inputMode="numeric"
              className="bg-white border border-neutral-200/60"
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9]/g, "");
                if (!raw) {
                  setRestwertOverrideChf(null);
                  return;
                }
                setRestwertOverrideChf(parseInt(raw, 10));
              }}
            />
            <p className="text-xs text-neutral-500">
              {isRestwertOverridden
                ? "Du hast den Restwert manuell angepasst."
                : "Automatische Schätzung – kann bei Bedarf überschrieben werden."}
            </p>
          </div>

          <div className="pt-2 text-xs text-neutral-500 leading-relaxed">
            Fixe Inputs aus Inserat: Kaufpreis CHF {Math.round(priceChf).toLocaleString("de-CH")} • Erstzulassung {year} • Aktuell {Math.round(mileageKm).toLocaleString("de-CH")} km
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-sm text-neutral-600">Geschätzte Monatsrate</span>
            <span className="text-lg font-semibold text-neutral-900">
              {formatCurrency(formattedRate)}.–
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-4">
            <span className="text-sm text-neutral-600">Geschätzter Restwert</span>
            <span className="text-sm font-medium text-neutral-900">
              {formatCurrency(formattedRestwert)}.– ({Math.round(estimate.restwert.residualPct * 100)}%)
            </span>
          </div>

          <p className="text-xs text-neutral-500">
            Unverbindliche Richtofferte. Finale Rate hängt von Bonität, Leasingpartner und Fahrzeugbewertung ab.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}