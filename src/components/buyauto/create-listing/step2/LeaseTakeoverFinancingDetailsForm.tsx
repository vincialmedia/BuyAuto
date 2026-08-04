import { format } from "date-fns";
import { de } from "date-fns/locale";
import { CalendarIcon, ChevronLeft } from "lucide-react";
import type {
  FieldErrors,
  UseFormHandleSubmit,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { LeaseTakeoverFinancingForm } from "./leaseTakeoverFinancingTypes";

function formatCurrency(value: string) {
  const numericValue = value.replace(/[^\d]/g, "");
  return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, "'");
}

export interface LeaseTakeoverFinancingDetailsFormProps {
  data: any;
  contractEndDate: Date | undefined;
  errors: FieldErrors<LeaseTakeoverFinancingForm>;
  handleSubmit: UseFormHandleSubmit<LeaseTakeoverFinancingForm>;
  isUpdatingListing: boolean;
  onInvalid: (errors: FieldErrors<LeaseTakeoverFinancingForm>) => void;
  onSubmit: (data: LeaseTakeoverFinancingForm) => Promise<void>;
  prevStep: () => void;
  register: UseFormRegister<LeaseTakeoverFinancingForm>;
  setValue: UseFormSetValue<LeaseTakeoverFinancingForm>;
  submitAttempted: boolean;
  submitError: string | null;
  watchedDeposit: unknown;
  watchedPricePerMonth: unknown;
  watchedRemainingKm: unknown;
  watchedRemainingMonths: unknown;
  watch: UseFormWatch<LeaseTakeoverFinancingForm>;
  onDateSelect: (date: Date | undefined) => void;
}

export function LeaseTakeoverFinancingDetailsForm({
  data,
  contractEndDate,
  errors,
  handleSubmit,
  isUpdatingListing,
  onInvalid,
  onSubmit,
  prevStep,
  register,
  submitAttempted,
  submitError,
  watchedDeposit,
  watchedPricePerMonth,
  watchedRemainingKm,
  watchedRemainingMonths,
  watch,
  onDateSelect,
}: LeaseTakeoverFinancingDetailsFormProps) {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-light text-neutral-900 mb-2 tracking-tight">Finanzierungsdetails</h2>
        <p className="text-neutral-600 font-light leading-relaxed">Konditionen Ihres Leasingvertrags</p>
      </div>

      {submitError && (
        <Alert variant="destructive">
          <AlertTitle>Fehler beim Speichern</AlertTitle>
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      {submitAttempted && Object.keys(errors ?? {}).length > 0 && (
        <Alert variant="destructive">
          <AlertTitle>Bitte prüfe die Angaben</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-5 space-y-1">
              {Object.entries(errors ?? {}).map(([key, value]) => {
                const msg = (value as any)?.message as string | undefined;
                if (!msg) return null;
                return <li key={key}>{msg}</li>;
              })}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="price_per_month_chf" className="text-sm font-medium text-neutral-700">
              Monatliche Rate *
            </Label>
            <div className="relative">
              <Input
                id="price_per_month_chf"
                type="number"
                step="0.01"
                {...register("price_per_month_chf", { valueAsNumber: true })}
                placeholder="z.B. 599"
                className="bg-white border border-neutral-200/40 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm pl-12"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500 font-medium">CHF</span>
            </div>
            {errors.price_per_month_chf && (
              <p className="text-sm text-red-500 font-light">{errors.price_per_month_chf.message}</p>
            )}
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
                  onSelect={onDateSelect}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  locale={de}
                />
              </PopoverContent>
            </Popover>

            <div className="mt-3 space-y-2">
              <Label htmlFor="remaining_months" className="text-sm font-medium text-neutral-700">
                Restlaufzeit (Monate) *
              </Label>
              <div className="relative">
                <Input
                  id="remaining_months"
                  type="number"
                  min="1"
                  {...register("remaining_months", { valueAsNumber: true })}
                  className="bg-white border border-neutral-200/40 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm pr-20"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500 font-light">
                  Monate
                </span>
              </div>
              <p className="text-xs text-neutral-500 font-light">
                Falls du das Vertragsende nicht mehr genau weisst, kannst du die Restlaufzeit hier manuell eingeben.
              </p>
              {errors.remaining_months && (
                <p className="text-sm text-red-500 font-light">{errors.remaining_months.message}</p>
              )}
            </div>

            {typeof watch("remaining_months") === "number" && Number.isFinite(watch("remaining_months")) && (
              <div className="flex items-center gap-2 text-sm">
                <div className="inline-flex items-center px-3 py-1.5 bg-green-50 text-green-700 rounded-md border border-green-200/40">
                  <span className="font-medium">
                    {watch("remaining_months") || 0} {watch("remaining_months") === 1 ? "Monat" : "Monate"} Restlaufzeit
                  </span>
                </div>
              </div>
            )}

            <p className="text-xs text-neutral-500 font-light">
              Wähle das Enddatum deines Leasingvertrags. Die Restlaufzeit wird automatisch berechnet.
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
            {errors.deposit_chf && <p className="text-sm text-red-500 font-light">{errors.deposit_chf.message}</p>}
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
            {errors.remaining_km && <p className="text-sm text-red-500 font-light">{errors.remaining_km.message}</p>}
          </div>
        </div>

        <div className="bg-gradient-to-br from-neutral-50 to-red-50/30 rounded-lg p-6 border border-neutral-200/40">
          <h3 className="text-lg font-medium text-neutral-900 mb-4 tracking-tight">Übersicht</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center p-3 bg-white/60 rounded-lg border border-neutral-200/30">
              <p className="text-neutral-500 mb-1 font-light">Monatlich</p>
              <p className="text-xl font-semibold text-neutral-900">
                CHF {watchedPricePerMonth ? formatCurrency(String(watchedPricePerMonth)) : "0"}
              </p>
            </div>
            <div className="text-center p-3 bg-white/60 rounded-lg border border-neutral-200/30">
              <p className="text-neutral-500 mb-1 font-light">Restlaufzeit</p>
              <p className="text-xl font-semibold text-neutral-900">{(watchedRemainingMonths as any) || 0} Monate</p>
            </div>
            <div className="text-center p-3 bg-white/60 rounded-lg border border-neutral-200/30">
              <p className="text-neutral-500 mb-1 font-light">Standort</p>
              <p className="text-lg font-semibold text-neutral-900">
                {data?.canton_code ? data.canton_code : data?.location ? data.location : "Nicht ausgewählt"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-between pt-6">
          <Button
            type="button"
            onClick={prevStep}
            variant="outline"
            className="px-6 py-3 bg-transparent hover:bg-neutral-50 border-neutral-200/40 text-neutral-600 rounded-lg transition-all duration-200"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>

          <Button
            type="submit"
            disabled={isUpdatingListing}
            className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg shadow-sm transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdatingListing ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Speichere Details...
              </>
            ) : (
              "Weiter zu Plan-Auswahl"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}