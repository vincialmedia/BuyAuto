import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

  const safePrice = Number.isFinite(priceChf) ? priceChf : 0;
  const safeYear = Number.isFinite(year) ? year : currentYear;
  const safeMileage = Number.isFinite(mileageKm) ? Math.max(0, mileageKm) : 0;
  const safeTermMonths = Number.isFinite(termMonths) ? Math.max(1, Math.floor(termMonths)) : 60;
  const safeKmPerYear = Number.isFinite(kmPerYear) ? Math.max(0, kmPerYear) : 15000;

  const ageYears = Math.max(0, currentYear - safeYear);
  const basePct = interpolateBaseResidualPct(safeTermMonths);

  const ageAdj = clamp(0.03 - 0.02 * ageYears, -0.15, 0.03);

  const endKm = safeMileage + safeKmPerYear * (safeTermMonths / 12);
  const typicalEndKm = safeMileage + 15000 * (safeTermMonths / 12);
  const deltaKm = endKm - typicalEndKm;
  const kmAdj = clamp(-deltaKm / 100000, -0.08, 0.04);

  const residualPct = clamp(basePct + ageAdj + kmAdj, 0.15, 0.7);
  const restwertChf = Math.round(safePrice * residualPct);

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

  const safePrice = Number.isFinite(priceChf) ? Math.max(0, priceChf) : 0;
  const safeRestwert = Number.isFinite(restwertChf) ? Math.max(0, restwertChf) : 0;

  const months = Number.isFinite(termMonths) ? Math.max(1, Math.floor(termMonths)) : 60;

  const safeInterestRatePct = Number.isFinite(interestRatePct) ? Math.max(0, interestRatePct) : 0;
  const safeDownPaymentPct = Number.isFinite(downPaymentPct) ? downPaymentPct : 0;

  const downPaymentChf = safePrice * (safeDownPaymentPct / 100);

  const principalRaw = safePrice - downPaymentChf - safeRestwert;
  const principal = Number.isFinite(principalRaw) ? Math.max(0, principalRaw) : 0;
  const monthlyAmort = principal / months;

  const interestBase = (safePrice - downPaymentChf + safeRestwert) / 2;
  const monthlyInterestRaw = interestBase * (safeInterestRatePct / 100) / 12;
  const monthlyInterest = Number.isFinite(monthlyInterestRaw) ? Math.max(0, monthlyInterestRaw) : 0;

  const monthlyRateRaw = monthlyAmort + monthlyInterest;
  const monthlyRateChf = Number.isFinite(monthlyRateRaw) ? Math.max(0, monthlyRateRaw) : 0;

  return {
    restwertChf: safeRestwert,
    residualPct: safePrice > 0 ? safeRestwert / safePrice : 0,
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
  const kmOptions =
    Array.isArray(offer.km_options) && offer.km_options.length > 0 ? offer.km_options : [10000, 15000, 20000, 25000];

  const minTerm = Math.max(1, Math.floor(Number(offer.min_term_months)));
  const maxTerm = Math.max(minTerm, Math.floor(Number(offer.max_term_months)));

  const initialTerm = clamp(36, minTerm, maxTerm);
  const initialDownPaymentPct = offer.no_down_payment ? 0 : clamp(Number(offer.down_payment_pct ?? 0), 0, 40);

  const rawResidualAdj = Number(offer.residual_pct_adjustment_pp ?? 0);
  const residualAdjPp = Number.isFinite(rawResidualAdj) ? clamp(rawResidualAdj, -50, 50) : 0;

  const [termMonths, setTermMonths] = useState<number>(initialTerm);
  const [downPaymentPct, setDownPaymentPct] = useState<number>(initialDownPaymentPct);
  const [kmPerYear, setKmPerYear] = useState<number>(kmOptions.includes(15000) ? 15000 : kmOptions[0]);

  const estimate = useMemo(() => {
    const currentYear = new Date().getUTCFullYear();

    const restwert = estimateRestwert({
      priceChf,
      year,
      mileageKm,
      termMonths,
      kmPerYear,
      currentYear,
    });

    const adjustedResidualPct = clamp(restwert.residualPct + residualAdjPp / 100, 0.15, 0.7);
    const adjustedRestwertChf = Math.round(Math.max(0, priceChf) * adjustedResidualPct);

    const maxDownPaymentPctByResidual =
      priceChf > 0 ? ((priceChf - adjustedRestwertChf) / priceChf) * 100 : 0;

    const maxDownPaymentPct = offer.no_down_payment ? 0 : Math.floor(clamp(maxDownPaymentPctByResidual, 0, 40));
    const effectiveDownPaymentPct = offer.no_down_payment ? 0 : clamp(downPaymentPct, 0, maxDownPaymentPct);

    const rate = estimateMonthlyLeasingRate({
      priceChf,
      interestRatePct: Number(offer.interest_rate_pct),
      downPaymentPct: effectiveDownPaymentPct,
      termMonths,
      restwertChf: adjustedRestwertChf,
    });

    return {
      adjustedResidualPct,
      adjustedRestwertChf,
      rate,
      maxDownPaymentPct,
      effectiveDownPaymentPct,
    };
  }, [
    downPaymentPct,
    kmPerYear,
    mileageKm,
    offer.interest_rate_pct,
    offer.no_down_payment,
    priceChf,
    residualAdjPp,
    termMonths,
    year,
  ]);

  useEffect(() => {
    if (offer.no_down_payment) {
      if (downPaymentPct !== 0) setDownPaymentPct(0);
      return;
    }

    const maxPct = estimate.maxDownPaymentPct;
    if (downPaymentPct > maxPct) {
      setDownPaymentPct(maxPct);
    }
  }, [downPaymentPct, estimate.maxDownPaymentPct, offer.no_down_payment]);

  const monthlyRateSafe = Number.isFinite(estimate.rate.monthlyRateChf) ? estimate.rate.monthlyRateChf : 0;
  const formattedRate = Math.max(0, Math.round(monthlyRateSafe));

  const restwertSafe = Number.isFinite(estimate.adjustedRestwertChf) ? estimate.adjustedRestwertChf : 0;
  const formattedRestwert = Math.max(0, Math.round(restwertSafe));

  const displayedResidualPct = priceChf > 0 ? formattedRestwert / priceChf : 0;
  const isProviderAdjusted = residualAdjPp !== 0;

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
            {isProviderAdjusted ? "Restwert (vom Anbieter angepasst): " : "Geschätzter Restwert: "}
            <span className="font-medium text-neutral-900">CHF {formattedRestwert}.–</span>
            <span className="text-neutral-500"> (≈ {(displayedResidualPct * 100).toFixed(0)}%)</span>
            {isProviderAdjusted && (
              <span className="text-neutral-500">
                {" "}
                • Anbieter-Korrektur: {residualAdjPp > 0 ? "+" : ""}
                {residualAdjPp}pp
              </span>
            )}
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
            <p className="text-xs text-neutral-500">
              Bereich: {minTerm}–{maxTerm} Monate
            </p>
          </div>

          <div className={cn("space-y-2", offer.no_down_payment ? "opacity-60" : "")}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-neutral-900">Anzahlung</p>
              <p className="text-sm text-neutral-600">
                {offer.no_down_payment ? "0%" : `${estimate.effectiveDownPaymentPct.toFixed(0)}%`}
              </p>
            </div>

            {!offer.no_down_payment && (
              <Slider
                value={[estimate.effectiveDownPaymentPct]}
                min={0}
                max={Math.max(0, estimate.maxDownPaymentPct)}
                step={1}
                onValueChange={(v) => setDownPaymentPct(v[0] ?? downPaymentPct)}
              />
            )}

            <p className="text-xs text-neutral-500">
              {offer.no_down_payment
                ? "Keine Anzahlung benötigt (fix)."
                : `Max. Anzahlung für diese Konfiguration: ${estimate.maxDownPaymentPct}%`}
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

          <div className="pt-2 text-xs text-neutral-500 leading-relaxed">
            Fixe Inputs aus Inserat: Kaufpreis CHF {Math.round(priceChf).toLocaleString("de-CH")} • Erstzulassung {year} •
            Aktuell {Math.round(mileageKm).toLocaleString("de-CH")} km
          </div>
        </div>
      </CardContent>
    </Card>
  );
}