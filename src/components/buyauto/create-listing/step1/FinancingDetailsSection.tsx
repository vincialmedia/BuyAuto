import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormTrigger, UseFormWatch } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

import type { DealType } from "@/lib/buyauto/types";
import type { ListingStep1Form } from "@/lib/buyauto/schemas";

import { estimateRestwert } from "@/components/buyauto/detail/LeasingCalculator";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const swissCantons = [
  { value: "AG", label: "Aargau (AG)" },
  { value: "AI", label: "Appenzell Innerrhoden (AI)" },
  { value: "AR", label: "Appenzell Ausserrhoden (AR)" },
  { value: "BS", label: "Basel-Stadt (BS)" },
  { value: "BL", label: "Basel-Landschaft (BL)" },
  { value: "BE", label: "Bern (BE)" },
  { value: "FR", label: "Freiburg (FR)" },
  { value: "GE", label: "Genf (GE)" },
  { value: "GL", label: "Glarus (GL)" },
  { value: "GR", label: "Graubünden (GR)" },
  { value: "JU", label: "Jura (JU)" },
  { value: "LU", label: "Luzern (LU)" },
  { value: "NE", label: "Neuenburg (NE)" },
  { value: "NW", label: "Nidwalden (NW)" },
  { value: "OW", label: "Obwalden (OW)" },
  { value: "SH", label: "Schaffhausen (SH)" },
  { value: "SZ", label: "Schwyz (SZ)" },
  { value: "SO", label: "Solothurn (SO)" },
  { value: "SG", label: "St. Gallen (SG)" },
  { value: "TI", label: "Tessin (TI)" },
  { value: "TG", label: "Thurgau (TG)" },
  { value: "UR", label: "Uri (UR)" },
  { value: "VS", label: "Wallis (VS)" },
  { value: "VD", label: "Waadt (VD)" },
  { value: "ZG", label: "Zug (ZG)" },
  { value: "ZH", label: "Zürich (ZH)" },
];

const chfFormatter = new Intl.NumberFormat("de-CH", { maximumFractionDigits: 0 });

function formatChf(amountChf: number): string {
  return chfFormatter.format(Math.round(amountChf));
}

function calculateRemainingMonths(endDate: Date): number {
  const now = new Date();
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth();
  const endYear = endDate.getFullYear();
  const endMonth = endDate.getMonth();

  let months = (endYear - nowYear) * 12 + (endMonth - nowMonth);

  if (endDate.getDate() < now.getDate()) {
    months -= 1;
  }

  return months < 0 ? 0 : months;
}

function formatCurrency(value: string) {
  const numericValue = value.replace(/[^\d]/g, "");
  return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, "'");
}

export interface FinancingDetailsSectionProps {
  dealType: DealType;
  isGarage: boolean;
  register: UseFormRegister<ListingStep1Form>;
  setValue: UseFormSetValue<ListingStep1Form>;
  trigger: UseFormTrigger<ListingStep1Form>;
  watch: UseFormWatch<ListingStep1Form>;
  errors: FieldErrors<ListingStep1Form>;
}

export function FinancingDetailsSection(props: FinancingDetailsSectionProps) {
  const { dealType, isGarage, register, setValue, trigger, watch, errors } = props;

  const leasingEnabled = watch("leasing_enabled");
  const noDownPayment = watch("no_down_payment");

  const purchasePriceChf = watch("purchase_price_chf");
  const vehicleYear = watch("year");
  const vehicleKm = watch("km");

  const [contractEndDate, setContractEndDate] = useState<Date | undefined>(watch("contract_end_date"));
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (dealType !== "lease_takeover") {
      setContractEndDate(undefined);
      setValue("contract_end_date", undefined, { shouldValidate: false });
      return;
    }
  }, [dealType, setValue]);

  const effectiveLeasingEnabled = isGarage && dealType === "direct_purchase" && leasingEnabled === true;

  const nextMonthHint = useMemo(() => {
    const v = watch("remaining_months");
    if (typeof v !== "number" || !Number.isFinite(v)) return 0;
    return v;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch("remaining_months")]);

  const exampleRestwert = useMemo(() => {
    if (!hasMounted) return null;

    const priceNum = typeof purchasePriceChf === "number" ? purchasePriceChf : Number(purchasePriceChf);
    if (!Number.isFinite(priceNum) || priceNum <= 0) return null;
    if (typeof vehicleYear !== "number" || !Number.isFinite(vehicleYear)) return null;
    if (typeof vehicleKm !== "number" || !Number.isFinite(vehicleKm)) return null;

    return estimateRestwert({
      priceChf: priceNum,
      year: vehicleYear,
      mileageKm: vehicleKm,
      termMonths: 48,
      kmPerYear: 10000,
      currentYear: new Date().getFullYear(),
    });
  }, [hasMounted, purchasePriceChf, vehicleKm, vehicleYear]);

  return (
    <div className="space-y-6">
      <div className="border-t border-neutral-200/60 pt-6">
        <h3 className="text-lg font-medium text-neutral-900 tracking-tight">Finanzierungsdetails</h3>
        <p className="text-sm text-neutral-600 mt-1 font-light">
          {dealType === "lease_takeover"
            ? "Leasingübernahme: Konditionen und Standort"
            : "Direktkauf: Kaufpreis und optional (Garagen) Leasing-Angebot"}
        </p>
      </div>

      {dealType === "direct_purchase" && (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="purchase_price_chf" className="text-sm font-medium text-neutral-700">
              Kaufpreis (CHF) *
            </Label>
            <div className="relative">
              <Input
                id="purchase_price_chf"
                {...register("purchase_price_chf")}
                type="text"
                inputMode="numeric"
                placeholder="z.B. 25'900"
                className="bg-white border border-neutral-200/40 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm pr-16"
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, "");
                  setValue("purchase_price_chf", value ? parseInt(value, 10) : (undefined as unknown as number), {
                    shouldValidate: true,
                  });
                  e.target.value = value;
                }}
                onBlur={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, "");
                  if (value) {
                    const num = parseInt(value, 10);
                    e.target.value = new Intl.NumberFormat("de-CH").format(num);
                  }
                  trigger("purchase_price_chf");
                }}
                onFocus={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, "");
                  e.target.value = value;
                }}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500 font-light">CHF</span>
            </div>
            {errors.purchase_price_chf && <p className="text-sm text-red-500 font-light">{errors.purchase_price_chf.message as string}</p>}
          </div>

          {isGarage && (
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200/60 p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-neutral-900">Leasing anbieten</p>
                  <p className="text-sm text-neutral-600">Wenn aktiv, sehen Käufer einen Leasingrechner auf der Detailseite.</p>
                </div>
                <Switch checked={leasingEnabled} onCheckedChange={(checked) => setValue("leasing_enabled", checked)} />
              </div>

              {effectiveLeasingEnabled && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="interest_rate_pct" className="text-sm font-medium text-neutral-700">
                      Leasingzins (%) *
                    </Label>
                    <Input
                      id="interest_rate_pct"
                      type="number"
                      step="0.1"
                      {...register("interest_rate_pct", { valueAsNumber: true })}
                      className="bg-white border border-neutral-200/40 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm"
                    />
                    {errors.interest_rate_pct && <p className="text-sm text-red-500 font-light">{errors.interest_rate_pct.message as string}</p>}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <Label htmlFor="down_payment_pct" className="text-sm font-medium text-neutral-700">
                        Anzahlung (%) *
                      </Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-neutral-600">Keine Anzahlung benötigt</span>
                        <Switch checked={noDownPayment} onCheckedChange={(checked) => setValue("no_down_payment", checked)} />
                      </div>
                    </div>
                    <Input
                      id="down_payment_pct"
                      type="number"
                      step="1"
                      disabled={noDownPayment}
                      {...register("down_payment_pct", { valueAsNumber: true })}
                      className="bg-white border border-neutral-200/40 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm disabled:opacity-60"
                    />
                    {errors.down_payment_pct && <p className="text-sm text-red-500 font-light">{errors.down_payment_pct.message as string}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="min_term_months" className="text-sm font-medium text-neutral-700">
                      Mindestlaufzeit (Monate) *
                    </Label>
                    <Input
                      id="min_term_months"
                      type="number"
                      step="1"
                      {...register("min_term_months", { valueAsNumber: true })}
                      className="bg-white border border-neutral-200/40 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm"
                    />
                    {errors.min_term_months && <p className="text-sm text-red-500 font-light">{errors.min_term_months.message as string}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_term_months" className="text-sm font-medium text-neutral-700">
                      Maximallaufzeit (Monate) *
                    </Label>
                    <Input
                      id="max_term_months"
                      type="number"
                      step="1"
                      {...register("max_term_months", { valueAsNumber: true })}
                      className="bg-white border border-neutral-200/40 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm"
                    />
                    {errors.max_term_months && <p className="text-sm text-red-500 font-light">{errors.max_term_months.message as string}</p>}
                  </div>

                  <div className="md:col-span-2 rounded-2xl border border-red-200/60 bg-gradient-to-br from-red-50/50 via-white to-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-neutral-900">Geschätzter Restwert</p>
                        <p className="mt-0.5 text-xs text-neutral-600">
                          Beispiel: 48 Monate, 10’000 km/Jahr
                        </p>
                      </div>
                    </div>

                    <div className="mt-3">
                      {exampleRestwert ? (
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                          <p className="text-xl font-semibold text-neutral-900">
                            CHF {formatChf(exampleRestwert.restwertChf)}.–
                          </p>
                          <p className="text-sm text-neutral-600">
                            ca. {Math.round(exampleRestwert.residualPct * 100)}% vom Kaufpreis
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-neutral-500">—</p>
                      )}
                    </div>

                    <div className="mt-3 space-y-1">
                      <p className="text-xs text-neutral-500">
                        Restwert wird automatisch anhand von Kaufpreis, Fahrzeugalter, Kilometerstand, Laufzeit und gewählten KM/Jahr geschätzt.
                      </p>
                      <p className="text-xs text-neutral-500">
                        Beispiel: Bei 48 Monaten und 10’000 km/Jahr liegt der geschätzte Restwert typischerweise bei ca. 48% vom Kaufpreis.
                      </p>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <p className="text-xs text-neutral-500">
                      KM/Jahr Optionen sind aktuell fest: 10’000 / 15’000 / 20’000 / 25’000.
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <p className="text-xs text-neutral-500">
                      Unverbindliche Richtofferte. Finale Rate hängt von Bonität, Leasingpartner und Fahrzeugbewertung ab.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {dealType === "lease_takeover" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="takeover_rate_chf" className="text-sm font-medium text-neutral-700">
                Monatliche Rate (CHF) *
              </Label>
              <div className="relative">
                <Input
                  id="takeover_rate_chf"
                  type="number"
                  step="0.01"
                  {...register("takeover_rate_chf", { valueAsNumber: true })}
                  placeholder="z.B. 599"
                  className="bg-white border border-neutral-200/40 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm pl-12"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500 font-medium">CHF</span>
              </div>
              {errors.takeover_rate_chf && <p className="text-sm text-red-500 font-light">{errors.takeover_rate_chf.message as string}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contract_end_date" className="text-sm font-medium text-neutral-700">
                Vertragsende *
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-white border border-neutral-200/40 hover:border-neutral-300 hover:bg-white focus:border-red-500 transition-colors shadow-sm",
                      !contractEndDate && "text-neutral-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {contractEndDate ? format(contractEndDate, "PPP", { locale: de }) : <span>Datum auswählen...</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={contractEndDate}
                    onSelect={(date) => {
                      setContractEndDate(date);
                      setValue("contract_end_date", date, { shouldValidate: true });
                      if (date) {
                        const months = calculateRemainingMonths(date);
                        setValue("remaining_months", months, { shouldValidate: true });
                      }
                    }}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    locale={de}
                  />
                </PopoverContent>
              </Popover>

              {contractEndDate && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="inline-flex items-center px-3 py-1.5 bg-green-50 text-green-700 rounded-md border border-green-200/40">
                    <span className="font-medium">
                      {nextMonthHint} {nextMonthHint === 1 ? "Monat" : "Monate"} Restlaufzeit
                    </span>
                  </div>
                </div>
              )}

              {errors.contract_end_date && <p className="text-sm text-red-500 font-light">{errors.contract_end_date.message as string}</p>}
              {errors.remaining_months && <p className="text-sm text-red-500 font-light">{errors.remaining_months.message as string}</p>}

              <p className="text-xs text-neutral-500 font-light">
                Wählen Sie das Enddatum Ihres Leasingvertrags. Die Restlaufzeit wird automatisch berechnet.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deposit_chf" className="text-sm font-medium text-neutral-700">
                Kaution
              </Label>
              <div className="relative">
                <Input
                  id="deposit_chf"
                  type="number"
                  step="0.01"
                  {...register("deposit_chf", { valueAsNumber: true })}
                  placeholder="z.B. 2000 (optional)"
                  className="bg-white border border-neutral-200/40 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm pl-12"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500 font-medium">CHF</span>
              </div>
              {errors.deposit_chf && <p className="text-sm text-red-500 font-light">{errors.deposit_chf.message as string}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="remaining_km" className="text-sm font-medium text-neutral-700">
                Verbleibende KM
              </Label>
              <div className="relative">
                <Input
                  id="remaining_km"
                  type="number"
                  min="0"
                  {...register("remaining_km", { valueAsNumber: true })}
                  placeholder="z.B. 15000 (optional)"
                  className="bg-white border border-neutral-200/40 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500 font-light">km</span>
              </div>
              <p className="text-xs text-neutral-500 font-light">Wie viele Kilometer sind im Leasingvertrag noch verfügbar?</p>
              {errors.remaining_km && <p className="text-sm text-red-500 font-light">{errors.remaining_km.message as string}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="canton_code" className="text-sm font-medium text-neutral-700">
                Standort (Kanton) *
              </Label>
              <Select onValueChange={(value) => setValue("canton_code", value, { shouldValidate: true })} value={watch("canton_code")}>
                <SelectTrigger className="bg-white border border-neutral-200/40 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm">
                  <SelectValue placeholder="Kanton auswählen..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {swissCantons.map((canton) => (
                    <SelectItem key={canton.value} value={canton.value}>
                      {canton.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-neutral-500 font-light">Wählen Sie den Kanton, in dem das Fahrzeug abgeholt werden kann</p>
              {errors.canton_code && <p className="text-sm text-red-500 font-light">{errors.canton_code.message as string}</p>}
            </div>
          </div>

          <div className="bg-gradient-to-br from-neutral-50 to-red-50/30 rounded-lg p-6 border border-neutral-200/40">
            <h4 className="text-lg font-medium text-neutral-900 mb-4 tracking-tight">Übersicht</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center p-3 bg-white/60 rounded-lg border border-neutral-200/30">
                <p className="text-neutral-500 mb-1 font-light">Monatlich</p>
                <p className="text-xl font-semibold text-neutral-900">
                  CHF {watch("takeover_rate_chf") ? formatCurrency(String(watch("takeover_rate_chf"))) : "0"}
                </p>
              </div>
              <div className="text-center p-3 bg-white/60 rounded-lg border border-neutral-200/30">
                <p className="text-neutral-500 mb-1 font-light">Restlaufzeit</p>
                <p className="text-xl font-semibold text-neutral-900">{watch("remaining_months") || 0} Monate</p>
              </div>
              <div className="text-center p-3 bg-white/60 rounded-lg border border-neutral-200/30">
                <p className="text-neutral-500 mb-1 font-light">Standort</p>
                <p className="text-lg font-semibold text-neutral-900">
                  {watch("canton_code")
                    ? swissCantons.find((c) => c.value === watch("canton_code"))?.label.split(" (")[0] || watch("canton_code")
                    : "Nicht ausgewählt"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}