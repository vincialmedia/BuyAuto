import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

  const minDownPaymentPctFromOffer = clamp(Number(offer.down_payment_pct ?? 0), 0, 40);

  const initialTerm = clamp(36, minTerm, maxTerm);
  const initialDownPaymentPct = minDownPaymentPctFromOffer;

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

    const maxDownPaymentPct = Math.floor(clamp(maxDownPaymentPctByResidual, 0, 40));
    const minDownPaymentPct = Math.min(minDownPaymentPctFromOffer, maxDownPaymentPct);

    const effectiveDownPaymentPct = clamp(downPaymentPct, minDownPaymentPct, maxDownPaymentPct);

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
      minDownPaymentPct,
      maxDownPaymentPct,
      effectiveDownPaymentPct,
    };
  }, [
    downPaymentPct,
    kmPerYear,
    mileageKm,
    offer.interest_rate_pct,
    priceChf,
    residualAdjPp,
    termMonths,
    year,
    minDownPaymentPctFromOffer,
  ]);

  useEffect(() => {
    const minPct = estimate.minDownPaymentPct;
    const maxPct = estimate.maxDownPaymentPct;
    const next = clamp(downPaymentPct, minPct, maxPct);
    if (next !== downPaymentPct) setDownPaymentPct(next);
  }, [downPaymentPct, estimate.maxDownPaymentPct, estimate.minDownPaymentPct]);

  const monthlyRateSafe = Number.isFinite(estimate.rate.monthlyRateChf) ? estimate.rate.monthlyRateChf : 0;
  const formattedRate = Math.max(0, Math.round(monthlyRateSafe));

  const restwertSafe = Number.isFinite(estimate.adjustedRestwertChf) ? estimate.adjustedRestwertChf : 0;
  const formattedRestwert = Math.max(0, Math.round(restwertSafe));

  const displayedResidualPct = priceChf > 0 ? formattedRestwert / priceChf : 0;
  const isProviderAdjusted = residualAdjPp !== 0;

  const calculationBreakdown = useMemo(() => {
    const priceSafe = Number.isFinite(priceChf) ? Math.max(0, priceChf) : 0;
    const downPaymentPctSafe = Number.isFinite(estimate.effectiveDownPaymentPct) ? estimate.effectiveDownPaymentPct : 0;
    const downPaymentChf = priceSafe * (downPaymentPctSafe / 100);
    const restwertChf = Number.isFinite(estimate.adjustedRestwertChf) ? Math.max(0, estimate.adjustedRestwertChf) : 0;
    const months = Number.isFinite(termMonths) ? Math.max(1, Math.floor(termMonths)) : 1;
    const interestRatePct = Number.isFinite(Number(offer.interest_rate_pct)) ? Math.max(0, Number(offer.interest_rate_pct)) : 0;

    const principal = Math.max(0, priceSafe - downPaymentChf - restwertChf);
    const monthlyAmort = Number.isFinite(estimate.rate.monthlyAmort) ? Math.max(0, estimate.rate.monthlyAmort) : 0;

    const interestBase = (priceSafe - downPaymentChf + restwertChf) / 2;
    const monthlyInterest = Number.isFinite(estimate.rate.monthlyInterest) ? Math.max(0, estimate.rate.monthlyInterest) : 0;

    const monthlyRate = monthlyAmort + monthlyInterest;

    return {
      priceSafe,
      downPaymentPctSafe,
      downPaymentChf,
      restwertChf,
      principal,
      months,
      interestRatePct,
      interestBase,
      monthlyAmort,
      monthlyInterest,
      monthlyRate,
    };
  }, [
    estimate.adjustedRestwertChf,
    estimate.effectiveDownPaymentPct,
    estimate.rate.monthlyAmort,
    estimate.rate.monthlyInterest,
    offer.interest_rate_pct,
    priceChf,
    termMonths,
  ]);

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
          <div className="text-sm font-medium text-neutral-600">Geschätzte Monatsrate</div>
          <div className="mt-2 text-5xl font-bold tracking-tight text-neutral-900">
            CHF {formattedRate}.–
          </div>

          {typeof Number(offer.interest_rate_pct) === "number" &&
            Number.isFinite(Number(offer.interest_rate_pct)) ? (
            <div className="mt-3 flex items-center gap-2">
              <div className="rounded-full bg-primary/10 px-4 py-2 text-base font-semibold text-primary ring-1 ring-primary/25 shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_10px_30px_rgba(0,0,0,0.08)] cursor-default select-none">
                Garage-Zinssatz: {Number(offer.interest_rate_pct).toFixed(1)}%
              </div>
            </div>
          ) : null}

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

          <div className="mt-3">
            <Dialog>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="text-xs font-medium text-primary underline underline-offset-4 hover:text-primary/80 focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-md"
                >
                  Wie berechnet sich die Monatsrate?
                </button>
              </DialogTrigger>
              <DialogContent className="w-[calc(100vw-2rem)] max-w-[720px] max-h-[calc(100dvh-2rem)] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>So berechnen wir die Richtofferte</DialogTitle>
                  <DialogDescription>
                    Kurz erklärt: Die Monatsrate setzt sich aus <span className="font-medium">Abschreibung</span> (über die
                    Laufzeit verteilt) und <span className="font-medium">Zins</span> (auf den durchschnittlich
                    finanzierten Betrag) zusammen.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-5">
                  <div className="rounded-2xl border border-neutral-200/60 bg-neutral-50 p-4">
                    <div className="text-sm font-semibold text-neutral-900">In einfachen Worten</div>
                    <ul className="mt-2 space-y-2 text-sm text-neutral-700 leading-relaxed list-disc pl-5">
                      <li>
                        <span className="font-medium">Restwert</span> ist der geschätzte Wert des Autos am Ende der Laufzeit.
                        Je länger die Laufzeit und je mehr KM/Jahr, desto tiefer ist der Restwert typischerweise.
                      </li>
                      <li>
                        <span className="font-medium">Finanzierter Betrag (Abschreibung)</span> = Kaufpreis − Anzahlung − Restwert.
                        Dieser Betrag wird gleichmässig auf die Monate verteilt.
                      </li>
                      <li>
                        <span className="font-medium">Zins</span> fällt auf den durchschnittlich finanzierten Betrag an. Als
                        einfache Näherung nutzen wir den Mittelwert aus Start- und Endsaldo.
                      </li>
                      <li>
                        <span className="font-medium">Monatsrate</span> = Abschreibung/Monat + Zins/Monat.
                      </li>
                      {calculationBreakdown.principal <= 0 ? (
                        <li>
                          In diesem Beispiel ist Kaufpreis − Anzahlung − Restwert ≈ 0. Dadurch ist die Abschreibung praktisch
                          null und die Rate besteht fast nur aus Zins.
                        </li>
                      ) : null}
                    </ul>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-neutral-200/60 p-4">
                      <div className="text-sm font-semibold text-neutral-900">Inputs (aus Inserat + Auswahl)</div>
                      <dl className="mt-3 space-y-2 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <dt className="text-neutral-600">Kaufpreis</dt>
                          <dd className="font-medium text-neutral-900">CHF {Math.round(calculationBreakdown.priceSafe).toLocaleString("de-CH")}</dd>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <dt className="text-neutral-600">Laufzeit</dt>
                          <dd className="font-medium text-neutral-900">{calculationBreakdown.months} Monate</dd>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <dt className="text-neutral-600">Anzahlung</dt>
                          <dd className="font-medium text-neutral-900">
                            {calculationBreakdown.downPaymentPctSafe.toFixed(0)}% (CHF {Math.round(calculationBreakdown.downPaymentChf).toLocaleString("de-CH")})
                          </dd>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <dt className="text-neutral-600">Zinssatz</dt>
                          <dd className="font-medium text-neutral-900">{calculationBreakdown.interestRatePct.toFixed(1)}%</dd>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <dt className="text-neutral-600">KM/Jahr</dt>
                          <dd className="font-medium text-neutral-900">{kmPerYear.toLocaleString("de-CH")} km</dd>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <dt className="text-neutral-600">Restwert (Endwert)</dt>
                          <dd className="font-medium text-neutral-900">CHF {Math.round(calculationBreakdown.restwertChf).toLocaleString("de-CH")}</dd>
                        </div>
                      </dl>
                    </div>

                    <div className="rounded-2xl border border-neutral-200/60 p-4">
                      <div className="text-sm font-semibold text-neutral-900">Rechenweg (Näherung)</div>
                      <dl className="mt-3 space-y-2 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <dt className="text-neutral-600">Finanzierter Betrag</dt>
                          <dd className="font-medium text-neutral-900">
                            CHF {Math.round(calculationBreakdown.principal).toLocaleString("de-CH")}
                          </dd>
                        </div>
                        <div className="text-xs text-neutral-500 -mt-1">
                          Kaufpreis − Anzahlung − Restwert
                        </div>

                        <div className="flex items-center justify-between gap-3 pt-1">
                          <dt className="text-neutral-600">Abschreibung / Monat</dt>
                          <dd className="font-medium text-neutral-900">
                            CHF {Math.round(calculationBreakdown.monthlyAmort).toLocaleString("de-CH")}
                          </dd>
                        </div>
                        <div className="text-xs text-neutral-500 -mt-1">
                          Finanzierter Betrag ÷ Laufzeit
                        </div>

                        <div className="flex items-center justify-between gap-3 pt-1">
                          <dt className="text-neutral-600">Zinsbasis (Ø Saldo)</dt>
                          <dd className="font-medium text-neutral-900">
                            CHF {Math.round(calculationBreakdown.interestBase).toLocaleString("de-CH")}
                          </dd>
                        </div>
                        <div className="text-xs text-neutral-500 -mt-1">
                          (Kaufpreis − Anzahlung + Restwert) ÷ 2
                        </div>

                        <div className="flex items-center justify-between gap-3 pt-1">
                          <dt className="text-neutral-600">Zins / Monat</dt>
                          <dd className="font-medium text-neutral-900">
                            CHF {Math.round(calculationBreakdown.monthlyInterest).toLocaleString("de-CH")}
                          </dd>
                        </div>
                        <div className="text-xs text-neutral-500 -mt-1">
                          Zinsbasis × (Zinssatz ÷ 12)
                        </div>

                        <div className="mt-4 rounded-xl bg-neutral-50 border border-neutral-200/60 p-3">
                          <div className="flex items-center justify-between gap-3 text-sm">
                            <div className="font-semibold text-neutral-900">Monatsrate</div>
                            <div className="font-bold text-neutral-900">
                              CHF {Math.round(calculationBreakdown.monthlyRate).toLocaleString("de-CH")}
                            </div>
                          </div>
                          <div className="mt-1 text-xs text-neutral-500">
                            Abschreibung/Monat + Zins/Monat
                          </div>
                        </div>
                      </dl>
                    </div>
                  </div>

                  <div className="text-xs text-neutral-500 leading-relaxed">
                    Hinweis: Diese Berechnung ist eine vereinfachte Richtofferte. In der Praxis können Leasingpartner (Restwert)
                    und Bonität (Zinssatz) die finale Rate beeinflussen.
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
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

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-neutral-900">Anzahlung</p>
              <p className="text-sm text-neutral-600">{estimate.effectiveDownPaymentPct.toFixed(0)}%</p>
            </div>

            <Slider
              value={[estimate.effectiveDownPaymentPct]}
              min={estimate.minDownPaymentPct}
              max={Math.max(estimate.minDownPaymentPct, estimate.maxDownPaymentPct)}
              step={1}
              onValueChange={(v) => setDownPaymentPct(v[0] ?? downPaymentPct)}
            />

            <p className="text-xs text-neutral-500">
              Minimum: {estimate.minDownPaymentPct}%
              {estimate.minDownPaymentPct === 0 ? " (optional)" : ""} • Maximum: {estimate.maxDownPaymentPct}%
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