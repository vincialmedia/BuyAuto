import { useMemo } from "react";
import type { FieldErrors, UseFormRegister, UseFormSetValue } from "react-hook-form";

import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { estimateRestwert } from "@/lib/buyauto/leasingMath";

export interface GarageLeasingOfferFormValues {
  leasing_enabled: boolean;
  interest_rate_pct?: number;
  down_payment_pct?: number;
  no_down_payment: boolean;
  min_term_months?: number;
  max_term_months?: number;
  residual_pct_adjustment_pp?: number;
}

export interface ListingInputsForRestwert {
  year: number | null;
  mileageKm: number | null;
}

function formatChf(amountChf: number): string {
  return new Intl.NumberFormat("de-CH", { maximumFractionDigits: 0 }).format(Math.round(amountChf));
}

export interface GarageLeasingOfferSectionProps<T extends GarageLeasingOfferFormValues> {
  register: UseFormRegister<T>;
  setValue: UseFormSetValue<T>;
  errors: FieldErrors<T>;

  hasMounted: boolean;

  leasingEnabled: boolean;
  noDownPayment: boolean;

  purchasePriceChf: number;
  listingInputs: ListingInputsForRestwert;
  residualAdjustmentPp: number;
}

export function GarageLeasingOfferSection<T extends GarageLeasingOfferFormValues>(props: GarageLeasingOfferSectionProps<T>) {
  const {
    register,
    setValue,
    errors,
    hasMounted,
    leasingEnabled,
    purchasePriceChf,
    listingInputs,
    residualAdjustmentPp,
  } = props;

  const exampleRestwert = useMemo(() => {
    if (!hasMounted) return null;
    if (!leasingEnabled) return null;

    if (!purchasePriceChf || purchasePriceChf <= 0) return null;
    if (!listingInputs.year || listingInputs.mileageKm === null) return null;

    const base = estimateRestwert({
      priceChf: purchasePriceChf,
      year: listingInputs.year,
      mileageKm: listingInputs.mileageKm,
      termMonths: 48,
      kmPerYear: 10000,
      currentYear: new Date().getFullYear(),
    });

    const adjustedPct = Math.max(0.15, Math.min(0.7, base.residualPct + residualAdjustmentPp / 100));
    const adjustedChf = Math.round(purchasePriceChf * adjustedPct);

    return {
      base,
      adjustedPct,
      adjustedChf,
    };
  }, [hasMounted, leasingEnabled, listingInputs, purchasePriceChf, residualAdjustmentPp]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-200/60 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-neutral-900">Leasing anbieten</p>
          <p className="text-sm text-neutral-600">Wenn aktiv, sehen Käufer einen Leasingrechner auf der Detailseite.</p>
          <p className="mt-1 text-xs text-neutral-500">Tipp: Nach dem Aktivieren kannst du den Restwert optional um ±20pp korrigieren.</p>
        </div>
        <Switch checked={leasingEnabled} onCheckedChange={(checked) => setValue("leasing_enabled" as any, checked as any)} />
      </div>

      {leasingEnabled && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="interest_rate_pct" className="text-sm font-medium text-neutral-700">
              Leasingzins (%) *
            </Label>
            <Input
              id="interest_rate_pct"
              type="number"
              step="0.1"
              {...register("interest_rate_pct" as any, { valueAsNumber: true })}
              className="bg-white border border-neutral-200/40 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm"
            />
            {(errors as any)?.interest_rate_pct && <p className="text-sm text-red-500 font-light">{(errors as any).interest_rate_pct.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="down_payment_pct" className="text-sm font-medium text-neutral-700">
              Mindestanzahlung (%) *
            </Label>
            <Input
              id="down_payment_pct"
              type="number"
              step="1"
              min="0"
              max="40"
              {...register("down_payment_pct" as any, { valueAsNumber: true })}
              className="bg-white border border-neutral-200/40 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm"
            />
            <p className="text-xs text-neutral-500">
              Empfohlen: 0% (0% = keine Mindestanzahlung. Käufer können optional mehr anzahlen.)
            </p>
            {(errors as any)?.down_payment_pct && <p className="text-sm text-red-500 font-light">{(errors as any).down_payment_pct.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="min_term_months" className="text-sm font-medium text-neutral-700">
              Mindestlaufzeit (Monate) *
            </Label>
            <Input
              id="min_term_months"
              type="number"
              step="1"
              {...register("min_term_months" as any, { valueAsNumber: true })}
              className="bg-white border border-neutral-200/40 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm"
            />
            {(errors as any)?.min_term_months && <p className="text-sm text-red-500 font-light">{(errors as any).min_term_months.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="max_term_months" className="text-sm font-medium text-neutral-700">
              Maximallaufzeit (Monate) *
            </Label>
            <Input
              id="max_term_months"
              type="number"
              step="1"
              {...register("max_term_months" as any, { valueAsNumber: true })}
              className="bg-white border border-neutral-200/40 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm"
            />
            {(errors as any)?.max_term_months && <p className="text-sm text-red-500 font-light">{(errors as any).max_term_months.message}</p>}
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-4 md:p-6 space-y-4 md:col-span-2">
            <div className="space-y-1">
              <h3 className="text-base font-medium text-neutral-900">Restwertkorrektur</h3>
              <p className="text-sm text-neutral-600">Optional. Passt die automatische Restwert-Schätzung an (z.B. +3 = +3 Prozentpunkte).</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="residual_pct_adjustment_pp" className="text-sm font-medium text-neutral-700">
                Restwertkorrektur (± Prozentpunkte)
              </Label>
              <Input
                id="residual_pct_adjustment_pp"
                type="number"
                step="1"
                min="-20"
                max="20"
                {...register("residual_pct_adjustment_pp" as any, { valueAsNumber: true })}
                className="bg-white border border-neutral-200/40 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm"
              />
              {(errors as any)?.residual_pct_adjustment_pp && (
                <p className="text-sm text-red-500 font-light">{(errors as any).residual_pct_adjustment_pp.message}</p>
              )}
            </div>
          </div>

          <div className="md:col-span-2 rounded-2xl border border-red-200/60 bg-gradient-to-br from-red-50/50 via-white to-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-neutral-900">Geschätzter Restwert</p>
                <p className="mt-0.5 text-xs text-neutral-600">Beispiel: 48 Monate, 10’000 km/Jahr</p>
              </div>
              {residualAdjustmentPp !== 0 && (
                <span className="inline-flex items-center rounded-full bg-red-600/10 px-2.5 py-1 text-xs font-medium text-red-700">
                  Vom Anbieter angepasst ({residualAdjustmentPp > 0 ? "+" : ""}{residualAdjustmentPp}pp)
                </span>
              )}
            </div>

            <div className="mt-3">
              {exampleRestwert ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <p className="text-sm text-neutral-600">Automatisch geschätzt</p>
                    <p className="text-lg font-semibold text-neutral-900">CHF {formatChf(exampleRestwert.base.restwertChf)}.–</p>
                    <p className="text-sm text-neutral-600">ca. {Math.round(exampleRestwert.base.residualPct * 100)}%</p>
                  </div>

                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <p className="text-sm text-neutral-600">Nach Korrektur</p>
                    <p className="text-xl font-semibold text-neutral-900">CHF {formatChf(exampleRestwert.adjustedChf)}.–</p>
                    <p className="text-sm text-neutral-600">ca. {Math.round(exampleRestwert.adjustedPct * 100)}%</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-neutral-500">—</p>
              )}
            </div>

            <div className="mt-3 space-y-1">
              <p className="text-xs text-neutral-500">Automatische Schätzung basiert auf Kaufpreis, Fahrzeugalter, Kilometerstand, Laufzeit und KM/Jahr.</p>
              <p className="text-xs text-neutral-500">Unverbindliche Richtofferte. Finale Rate hängt von Bonität, Leasingpartner und Fahrzeugbewertung ab.</p>
            </div>
          </div>

          <div className="md:col-span-2">
            <p className="text-xs text-neutral-500">KM/Jahr Optionen werden in V1 automatisch auf 10’000 / 15’000 / 20’000 / 25’000 gesetzt (sofern nicht anders konfiguriert).</p>
          </div>
        </div>
      )}
    </div>
  );
}