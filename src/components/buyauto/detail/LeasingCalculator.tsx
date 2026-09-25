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
// Single source of truth for the leasing math — the same functions the search
// cards (teaser) and the garage offer form use. Never copy them inline here.
import { estimateRestwert, estimateMonthlyLeasingRate } from "@/lib/buyauto/leasingMath";
import { T, useT } from "@/i18n/runtime";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export interface LeasingCalculatorProps {
  priceChf: number;
  year: number;
  mileageKm: number;
  offer: LeasingOffer;
}

export function LeasingCalculator({ priceChf, year, mileageKm, offer }: LeasingCalculatorProps) {
  const t = useT();
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
          <h3 className="text-lg font-semibold text-neutral-900 tracking-tight">{t("Leasingrechner (Richtofferte)")}</h3>
          <p className="text-sm text-neutral-600 mt-1">
            {t("Unverbindliche Richtofferte. Finale Rate hängt von Bonität, Leasingpartner und Fahrzeugbewertung ab.")}
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200/60 bg-neutral-50 p-4">
          <div className="text-sm font-medium text-neutral-600">{t("Geschätzte Monatsrate")}</div>
          <div className="mt-2 text-4xl sm:text-5xl font-bold tracking-tight text-neutral-900">
            CHF {formattedRate}.–
          </div>

          {typeof Number(offer.interest_rate_pct) === "number" &&
            Number.isFinite(Number(offer.interest_rate_pct)) ? (
            <div className="mt-3 flex items-center gap-2">
              <div className="rounded-full bg-primary/10 px-4 py-2 text-base font-semibold text-primary ring-1 ring-primary/25 shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_10px_30px_rgba(0,0,0,0.08)] cursor-default select-none">
                {t("Garage-Zinssatz: {rate}%", { rate: Number(offer.interest_rate_pct).toFixed(1) })}
              </div>
            </div>
          ) : null}

          <p className="text-sm text-neutral-600 mt-2">
            {isProviderAdjusted ? t("Restwert (vom Anbieter angepasst): ") : t("Geschätzter Restwert: ")}
            <span className="font-medium text-neutral-900">CHF {formattedRestwert}.–</span>
            <span className="text-neutral-500"> (≈ {(displayedResidualPct * 100).toFixed(0)}%)</span>
            {isProviderAdjusted && (
              <span className="text-neutral-500">
                {" "}
                {t("• Anbieter-Korrektur: {value}pp", { value: `${residualAdjPp > 0 ? "+" : ""}${residualAdjPp}` })}
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
                  {t("Wie berechnet sich die Monatsrate?")}
                </button>
              </DialogTrigger>
              <DialogContent className="w-[calc(100vw-2rem)] max-w-[720px] max-h-[calc(100dvh-2rem)] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{t("So berechnen wir die Richtofferte")}</DialogTitle>
                  <DialogDescription>
                    <T
                      k="Kurz erklärt: Die Monatsrate setzt sich aus <0>Abschreibung</0> (über die Laufzeit verteilt) und <1>Zins</1> (auf den durchschnittlich finanzierten Betrag) zusammen."
                      c={[<span key="0" className="font-medium" />, <span key="1" className="font-medium" />]}
                    />
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-5">
                  <div className="rounded-2xl border border-neutral-200/60 bg-neutral-50 p-4">
                    <div className="text-sm font-semibold text-neutral-900">{t("In einfachen Worten")}</div>
                    <ul className="mt-2 space-y-2 text-sm text-neutral-700 leading-relaxed list-disc pl-5">
                      <li>
                        <T
                          k="<0>Restwert</0> ist der geschätzte Wert des Autos am Ende der Laufzeit. Je länger die Laufzeit und je mehr KM/Jahr, desto tiefer ist der Restwert typischerweise."
                          c={[<span key="0" className="font-medium" />]}
                        />
                      </li>
                      <li>
                        <T
                          k="<0>Finanzierter Betrag (Abschreibung)</0> = Kaufpreis − Anzahlung − Restwert. Dieser Betrag wird gleichmässig auf die Monate verteilt."
                          c={[<span key="0" className="font-medium" />]}
                        />
                      </li>
                      <li>
                        <T
                          k="<0>Zins</0> fällt auf den durchschnittlich finanzierten Betrag an. Als einfache Näherung nutzen wir den Mittelwert aus Start- und Endsaldo."
                          c={[<span key="0" className="font-medium" />]}
                        />
                      </li>
                      <li>
                        <T k="<0>Monatsrate</0> = Abschreibung/Monat + Zins/Monat." c={[<span key="0" className="font-medium" />]} />
                      </li>
                      {calculationBreakdown.principal <= 0 ? (
                        <li>
                          {t("In diesem Beispiel ist Kaufpreis − Anzahlung − Restwert ≈ 0. Dadurch ist die Abschreibung praktisch null und die Rate besteht fast nur aus Zins.")}
                        </li>
                      ) : null}
                    </ul>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-neutral-200/60 p-4">
                      <div className="text-sm font-semibold text-neutral-900">{t("Inputs (aus Inserat + Auswahl)")}</div>
                      <dl className="mt-3 space-y-2 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <dt className="text-neutral-600">{t("Kaufpreis")}</dt>
                          <dd className="font-medium text-neutral-900">CHF {Math.round(calculationBreakdown.priceSafe).toLocaleString("de-CH")}</dd>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <dt className="text-neutral-600">{t("Laufzeit")}</dt>
                          <dd className="font-medium text-neutral-900">{t("{n} Monate", { n: calculationBreakdown.months })}</dd>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <dt className="text-neutral-600">{t("Anzahlung")}</dt>
                          <dd className="font-medium text-neutral-900">
                            {calculationBreakdown.downPaymentPctSafe.toFixed(0)}% (CHF {Math.round(calculationBreakdown.downPaymentChf).toLocaleString("de-CH")})
                          </dd>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <dt className="text-neutral-600">{t("Zinssatz")}</dt>
                          <dd className="font-medium text-neutral-900">{calculationBreakdown.interestRatePct.toFixed(1)}%</dd>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <dt className="text-neutral-600">{t("KM/Jahr")}</dt>
                          <dd className="font-medium text-neutral-900">{kmPerYear.toLocaleString("de-CH")} km</dd>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <dt className="text-neutral-600">{t("Restwert (Endwert)")}</dt>
                          <dd className="font-medium text-neutral-900">CHF {Math.round(calculationBreakdown.restwertChf).toLocaleString("de-CH")}</dd>
                        </div>
                      </dl>
                    </div>

                    <div className="rounded-2xl border border-neutral-200/60 p-4">
                      <div className="text-sm font-semibold text-neutral-900">{t("Rechenweg (Näherung)")}</div>
                      <dl className="mt-3 space-y-2 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <dt className="text-neutral-600">{t("Finanzierter Betrag")}</dt>
                          <dd className="font-medium text-neutral-900">
                            CHF {Math.round(calculationBreakdown.principal).toLocaleString("de-CH")}
                          </dd>
                        </div>
                        <div className="text-xs text-neutral-500 -mt-1">
                          {t("Kaufpreis − Anzahlung − Restwert")}
                        </div>

                        <div className="flex items-center justify-between gap-3 pt-1">
                          <dt className="text-neutral-600">{t("Abschreibung / Monat")}</dt>
                          <dd className="font-medium text-neutral-900">
                            CHF {Math.round(calculationBreakdown.monthlyAmort).toLocaleString("de-CH")}
                          </dd>
                        </div>
                        <div className="text-xs text-neutral-500 -mt-1">
                          {t("Finanzierter Betrag ÷ Laufzeit")}
                        </div>

                        <div className="flex items-center justify-between gap-3 pt-1">
                          <dt className="text-neutral-600">{t("Zinsbasis (Ø Saldo)")}</dt>
                          <dd className="font-medium text-neutral-900">
                            CHF {Math.round(calculationBreakdown.interestBase).toLocaleString("de-CH")}
                          </dd>
                        </div>
                        <div className="text-xs text-neutral-500 -mt-1">
                          {t("(Kaufpreis − Anzahlung + Restwert) ÷ 2")}
                        </div>

                        <div className="flex items-center justify-between gap-3 pt-1">
                          <dt className="text-neutral-600">{t("Zins / Monat")}</dt>
                          <dd className="font-medium text-neutral-900">
                            CHF {Math.round(calculationBreakdown.monthlyInterest).toLocaleString("de-CH")}
                          </dd>
                        </div>
                        <div className="text-xs text-neutral-500 -mt-1">
                          {t("Zinsbasis × (Zinssatz ÷ 12)")}
                        </div>

                        <div className="mt-4 rounded-xl bg-neutral-50 border border-neutral-200/60 p-3">
                          <div className="flex items-center justify-between gap-3 text-sm">
                            <div className="font-semibold text-neutral-900">{t("Monatsrate")}</div>
                            <div className="font-bold text-neutral-900">
                              CHF {Math.round(calculationBreakdown.monthlyRate).toLocaleString("de-CH")}
                            </div>
                          </div>
                          <div className="mt-1 text-xs text-neutral-500">
                            {t("Abschreibung/Monat + Zins/Monat")}
                          </div>
                        </div>
                      </dl>
                    </div>
                  </div>

                  <div className="text-xs text-neutral-500 leading-relaxed">
                    {t("Hinweis: Diese Berechnung ist eine vereinfachte Richtofferte. In der Praxis können Leasingpartner (Restwert) und Bonität (Zinssatz) die finale Rate beeinflussen.")}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-neutral-900">{t("Laufzeit")}</p>
              <p className="text-sm text-neutral-600">{t("{n} Monate", { n: termMonths })}</p>
            </div>
            <Slider
              value={[termMonths]}
              min={minTerm}
              max={maxTerm}
              step={1}
              onValueChange={(v) => setTermMonths(Math.floor(v[0] ?? termMonths))}
            />
            <p className="text-xs text-neutral-500">
              {t("Bereich: {min}–{max} Monate", { min: minTerm, max: maxTerm })}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-neutral-900">{t("Anzahlung")}</p>
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
              {estimate.minDownPaymentPct === 0
                ? t("Minimum: {min}% (optional) • Maximum: {max}%", { min: estimate.minDownPaymentPct, max: estimate.maxDownPaymentPct })
                : t("Minimum: {min}% • Maximum: {max}%", { min: estimate.minDownPaymentPct, max: estimate.maxDownPaymentPct })}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-neutral-900">{t("KM/Jahr")}</p>
            <Select value={String(kmPerYear)} onValueChange={(v) => setKmPerYear(Number(v))}>
              <SelectTrigger className="bg-white border border-neutral-200/60">
                <SelectValue placeholder={t("KM/Jahr wählen")} />
              </SelectTrigger>
              <SelectContent>
                {kmOptions.map((km) => (
                  <SelectItem key={km} value={String(km)}>
                    {t("{km} km/Jahr", { km: km.toLocaleString("de-CH") })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="pt-2 text-xs text-neutral-500 leading-relaxed">
            {t("Fixe Inputs aus Inserat: Kaufpreis CHF {price} • Erstzulassung {year} • Aktuell {km} km", {
              price: Math.round(priceChf).toLocaleString("de-CH"),
              year,
              km: Math.round(mileageKm).toLocaleString("de-CH"),
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}