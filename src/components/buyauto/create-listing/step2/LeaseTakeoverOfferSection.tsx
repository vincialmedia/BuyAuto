import { useEffect, useState } from "react";
import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface LeaseTakeoverOfferFormValues {
  lease_takeover_enabled: boolean;
  lease_takeover_price_per_month_chf?: number;
  lease_takeover_remaining_months?: number;
  lease_takeover_deposit_chf?: number;
  lease_takeover_remaining_km?: number;
  lease_takeover_pickup_canton_code?: string;
}

export interface LeaseTakeoverOfferSectionProps<T extends LeaseTakeoverOfferFormValues> {
  register: UseFormRegister<T>;
  setValue: UseFormSetValue<T>;
  watch: UseFormWatch<T>;
  errors: FieldErrors<T>;
}

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

export function LeaseTakeoverOfferSection<T extends LeaseTakeoverOfferFormValues>(props: LeaseTakeoverOfferSectionProps<T>) {
  const { register, setValue, watch, errors } = props;

  const enabled = Boolean(watch("lease_takeover_enabled"));
  const remainingMonths = Number(watch("lease_takeover_remaining_months") ?? 0) || 0;

  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (!enabled) {
      setEndDate(undefined);
    }
  }, [enabled]);

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 md:p-5 shadow-sm">
      <div className="space-y-2">
        <p className="text-sm font-medium text-neutral-900">Leasingübernahme anbieten</p>
        <p className="text-sm text-neutral-600">
          Optional. Wenn aktiv, kannst du zusätzlich eine Leasingübernahme (Monatsrate & Restlaufzeit) angeben.
        </p>

        <RadioGroup
          value={enabled ? "yes" : "no"}
          onValueChange={(v) => {
            const nextEnabled = v === "yes";
            setValue("lease_takeover_enabled", nextEnabled as any, { shouldValidate: true });

            if (!nextEnabled) return;

            const currentDeposit = Number(watch("lease_takeover_deposit_chf") ?? 0);
            if (!Number.isFinite(currentDeposit)) {
              setValue("lease_takeover_deposit_chf", 0 as any, { shouldValidate: false });
            }
          }}
          className="grid grid-cols-2 gap-3 pt-2"
        >
          <label className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 cursor-pointer hover:bg-neutral-50 transition-colors">
            <RadioGroupItem value="no" />
            <span className="text-sm text-neutral-700">Nein</span>
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 cursor-pointer hover:bg-neutral-50 transition-colors">
            <RadioGroupItem value="yes" />
            <span className="text-sm text-neutral-700">Ja</span>
          </label>
        </RadioGroup>

        {enabled && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="lease_takeover_price_per_month_chf" className="text-sm font-medium text-neutral-700">
                Monatliche Rate *
              </Label>
              <div className="relative">
                <Input
                  id="lease_takeover_price_per_month_chf"
                  type="number"
                  step="1"
                  inputMode="numeric"
                  {...register("lease_takeover_price_per_month_chf" as any, { valueAsNumber: true })}
                  placeholder="z.B. 599"
                  className="bg-white border border-neutral-200/40 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm pl-12"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500 font-medium">CHF</span>
              </div>
              {(errors as any)?.lease_takeover_price_per_month_chf && (
                <p className="text-sm text-red-500 font-light">{(errors as any).lease_takeover_price_per_month_chf.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lease_takeover_contract_end_date" className="text-sm font-medium text-neutral-700">
                Vertragsende *
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-white border border-neutral-200/40 hover:border-neutral-300 hover:bg-white focus:border-red-500 transition-colors shadow-sm",
                      !endDate && "text-neutral-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP", { locale: de }) : <span>Datum auswählen...</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      setEndDate(date);
                      if (date) {
                        const months = calculateRemainingMonths(date);
                        setValue("lease_takeover_remaining_months", months as any, { shouldValidate: true });
                      }
                    }}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    locale={de}
                  />
                </PopoverContent>
              </Popover>

              {remainingMonths > 0 ? (
                <div className="text-xs text-neutral-500">
                  {remainingMonths} {remainingMonths === 1 ? "Monat" : "Monate"} Restlaufzeit
                </div>
              ) : null}

              {(errors as any)?.lease_takeover_remaining_months && (
                <p className="text-sm text-red-500 font-light">{(errors as any).lease_takeover_remaining_months.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lease_takeover_deposit_chf" className="text-sm font-medium text-neutral-700">
                Kaution *
              </Label>
              <div className="relative">
                <Input
                  id="lease_takeover_deposit_chf"
                  type="number"
                  step="1"
                  inputMode="numeric"
                  {...register("lease_takeover_deposit_chf" as any, { valueAsNumber: true })}
                  placeholder="z.B. 2000"
                  className="bg-white border border-neutral-200/40 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm pl-12"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500 font-medium">CHF</span>
              </div>
              {(errors as any)?.lease_takeover_deposit_chf && (
                <p className="text-sm text-red-500 font-light">{(errors as any).lease_takeover_deposit_chf.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lease_takeover_remaining_km" className="text-sm font-medium text-neutral-700">
                Verbleibende KM
              </Label>
              <div className="relative">
                <Input
                  id="lease_takeover_remaining_km"
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  {...register("lease_takeover_remaining_km" as any, { valueAsNumber: true })}
                  placeholder="z.B. 15000 (optional)"
                  className="bg-white border border-neutral-200/40 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500 font-light">km</span>
              </div>
              {(errors as any)?.lease_takeover_remaining_km && (
                <p className="text-sm text-red-500 font-light">{(errors as any).lease_takeover_remaining_km.message}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="lease_takeover_pickup_canton_code" className="text-sm font-medium text-neutral-700">
                Standort (Kanton) *
              </Label>
              <Select
                onValueChange={(value) => setValue("lease_takeover_pickup_canton_code", value as any, { shouldValidate: true })}
                value={String(watch("lease_takeover_pickup_canton_code") ?? "")}
              >
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
              {(errors as any)?.lease_takeover_pickup_canton_code && (
                <p className="text-sm text-red-500 font-light">{(errors as any).lease_takeover_pickup_canton_code.message}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}