import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { CalendarIcon, ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useWizard } from "../ListingWizard";
import { createOrUpdateListing, type ListingUpdatePayload } from "@/services/createListingService";
import { createListingDraft, updateListingDraft } from "@/services/listingDraftService";

const leasingDetailsSchema = z.object({
  price_per_month_chf: z.number().min(1, "Monatliche Rate ist erforderlich"),
  remaining_months: z.number().min(1, "Restlaufzeit muss mindestens 1 Monat betragen"),
  deposit_chf: z.number().min(0, "Kaution kann nicht negativ sein"),
  remaining_km: z.number().min(0, "Verbleibende KM muss mindestens 0 sein").optional(),
});

type LeasingDetailsForm = z.infer<typeof leasingDetailsSchema>;

function getErrorDetailsForToast(error: unknown): string | null {
  if (!error) return null;
  if (typeof error === "string") return error;

  if (typeof error === "object") {
    const anyErr = error as any;

    const message = typeof anyErr?.message === "string" ? anyErr.message : null;
    const details = typeof anyErr?.details === "string" ? anyErr.details : null;
    const hint = typeof anyErr?.hint === "string" ? anyErr.hint : null;
    const code = typeof anyErr?.code === "string" ? anyErr.code : null;

    const parts = [message, details, hint, code ? `Code: ${code}` : null].filter(Boolean);
    return parts.length ? parts.join(" · ") : null;
  }

  return null;
}

function focusFirstInvalidField<T extends Record<string, any>>(errors: FieldErrors<T>) {
  const firstKey = Object.keys(errors ?? {})[0];
  if (!firstKey) return;

  const byName = document.querySelector(`[name="${firstKey}"]`) as HTMLElement | null;
  const byId = document.getElementById(firstKey);

  const el = byName ?? byId;
  if (!el) return;

  if (typeof (el as any).focus === "function") {
    (el as any).focus();
  }

  if (typeof (el as any).scrollIntoView === "function") {
    (el as any).scrollIntoView({ behavior: "smooth", block: "center" });
  }
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

function toFiniteNumber(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

export function LeaseTakeoverFinancingDetails() {
  const router = useRouter();
  const { data, updateData, nextStep, prevStep, draftId, setDraftId, registerDraftSnapshotter } = useWizard();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const isGarage = profile?.role === "garage";
  const isEditingExistingListing = typeof router.query.edit === "string" && router.query.edit.length > 0;
  const [isUpdatingListing, setIsUpdatingListing] = useState(false);
  const [contractEndDate, setContractEndDate] = useState<Date | undefined>(undefined);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues,
  } = useForm<LeasingDetailsForm>({
    resolver: zodResolver(leasingDetailsSchema),
    defaultValues: {
      price_per_month_chf: toFiniteNumber((data as any)?.price_per_month_chf, 0),
      remaining_months: toFiniteNumber((data as any)?.remaining_months, 12),
      deposit_chf: toFiniteNumber((data as any)?.deposit_chf, 0),
      remaining_km: toFiniteNumber((data as any)?.remaining_km, 0),
    },
  });

  const watchedPricePerMonth = watch("price_per_month_chf");
  const watchedRemainingMonths = watch("remaining_months");
  const watchedDeposit = watch("deposit_chf");
  const watchedRemainingKm = watch("remaining_km");

  useEffect(() => {
    const listingIdKey = typeof (data as any)?.id === "string" ? String((data as any).id) : "";
    const key = `${draftId ?? ""}|${listingIdKey}`;
    (window as any).__buyautoLeaseTakeoverHydrated = (window as any).__buyautoLeaseTakeoverHydrated ?? {};

    const hydratedMap = (window as any).__buyautoLeaseTakeoverHydrated as Record<string, boolean>;
    if (hydratedMap[key]) return;

    const nextPrice = toFiniteNumber((data as any)?.price_per_month_chf, 0);
    const nextMonths = toFiniteNumber((data as any)?.remaining_months, 12);
    const nextDeposit = toFiniteNumber((data as any)?.deposit_chf, 0);
    const nextRemainingKm = toFiniteNumber((data as any)?.remaining_km, 0);

    const current = getValues();

    if ((!current.price_per_month_chf || current.price_per_month_chf <= 0) && nextPrice > 0) {
      setValue("price_per_month_chf", nextPrice, { shouldValidate: false, shouldDirty: false });
    }
    if ((!current.remaining_months || current.remaining_months <= 0) && nextMonths > 0) {
      setValue("remaining_months", nextMonths, { shouldValidate: false, shouldDirty: false });
    }
    if ((current.deposit_chf === undefined || current.deposit_chf === null) && nextDeposit >= 0) {
      setValue("deposit_chf", nextDeposit, { shouldValidate: false, shouldDirty: false });
    }
    if ((current.remaining_km === undefined || current.remaining_km === null) && nextRemainingKm >= 0) {
      setValue("remaining_km", nextRemainingKm, { shouldValidate: false, shouldDirty: false });
    }

    hydratedMap[key] = true;
  }, [data, draftId, getValues, setValue]);

  useEffect(() => {
    const t = setTimeout(() => {
      const pricePerMonth =
        typeof watchedPricePerMonth === "number" && Number.isFinite(watchedPricePerMonth) && watchedPricePerMonth > 0
          ? watchedPricePerMonth
          : undefined;

      const remainingMonths =
        typeof watchedRemainingMonths === "number" && Number.isFinite(watchedRemainingMonths) && watchedRemainingMonths > 0
          ? watchedRemainingMonths
          : undefined;

      const depositChf =
        typeof watchedDeposit === "number" && Number.isFinite(watchedDeposit) && watchedDeposit >= 0
          ? watchedDeposit
          : undefined;

      const remainingKm =
        typeof watchedRemainingKm === "number" && Number.isFinite(watchedRemainingKm) && watchedRemainingKm >= 0
          ? watchedRemainingKm
          : undefined;

      const contractEnd = contractEndDate ? format(contractEndDate, "yyyy-MM-dd") : (data as any)?.contract_end_date ?? null;

      updateData({
        deal_type: "lease_takeover",
        financing_type: null,
        leasing_offer: null,
        purchase_price_chf: null,
        price_per_month_chf: pricePerMonth,
        remaining_months: remainingMonths,
        deposit_chf: depositChf,
        remaining_km: remainingKm,
        contract_end_date: contractEnd,
      } as any);
    }, 250);

    return () => clearTimeout(t);
  }, [contractEndDate, data, updateData, watchedDeposit, watchedPricePerMonth, watchedRemainingKm, watchedRemainingMonths]);

  useEffect(() => {
    const raw = (data as any)?.contract_end_date;
    if (contractEndDate) return;

    if (typeof raw === "string" && raw.length >= 10) {
      const parsed = new Date(`${raw.slice(0, 10)}T00:00:00`);
      if (!Number.isNaN(parsed.getTime())) {
        setContractEndDate(parsed);
        const existingRemaining =
          typeof (data as any)?.remaining_months === "number" && Number.isFinite((data as any).remaining_months)
            ? Number((data as any).remaining_months)
            : null;

        if (existingRemaining !== null) {
          setValue("remaining_months", existingRemaining, { shouldValidate: false, shouldDirty: false });
        } else {
          const months = calculateRemainingMonths(parsed);
          setValue("remaining_months", months, { shouldValidate: false, shouldDirty: false });
        }
      }
    }
  }, [contractEndDate, data, setValue]);

  useEffect(() => {
    registerDraftSnapshotter(() => {
      const values = getValues();
      const contractEnd = contractEndDate ? format(contractEndDate, "yyyy-MM-dd") : (data as any)?.contract_end_date ?? null;

      return {
        deal_type: "lease_takeover",
        financing_type: null,
        leasing_offer: null,
        purchase_price_chf: null,
        price_per_month_chf:
          typeof values.price_per_month_chf === "number" && Number.isFinite(values.price_per_month_chf)
            ? values.price_per_month_chf
            : undefined,
        remaining_months:
          typeof values.remaining_months === "number" && Number.isFinite(values.remaining_months)
            ? values.remaining_months
            : undefined,
        deposit_chf:
          typeof values.deposit_chf === "number" && Number.isFinite(values.deposit_chf) ? values.deposit_chf : undefined,
        remaining_km:
          typeof values.remaining_km === "number" && Number.isFinite(values.remaining_km) ? values.remaining_km : undefined,
        contract_end_date: contractEnd,
      } as any;
    });

    return () => {
      registerDraftSnapshotter(() => ({}));
    };
  }, [contractEndDate, data, getValues, registerDraftSnapshotter]);

  const onSubmit = async (formData: LeasingDetailsForm) => {
    if (!user) {
      toast({
        title: "Nicht eingeloggt",
        description: "Bitte logge dich ein, um fortzufahren.",
        variant: "destructive",
      });
      return;
    }

    setSubmitAttempted(true);
    setSubmitError(null);

    setIsUpdatingListing(true);
    try {
      const anyData = data as any;
      const mileageKm = typeof anyData?.km === "number" ? anyData.km : typeof anyData?.mileage === "number" ? anyData.mileage : null;

      const depositChf = Number.isFinite(Number(formData.deposit_chf)) ? Number(formData.deposit_chf) : 0;
      const remainingKm =
        typeof formData.remaining_km === "number" && Number.isFinite(formData.remaining_km) ? Number(formData.remaining_km) : 0;

      const contractEnd = contractEndDate ? format(contractEndDate, "yyyy-MM-dd") : (data as any)?.contract_end_date ?? null;

      const financingPatch: Partial<typeof data> = {
        deal_type: "lease_takeover",
        financing_type: null,
        leasing_offer: null,
        purchase_price_chf: null,
        price_per_month_chf: Number(formData.price_per_month_chf),
        remaining_months: Number(formData.remaining_months),
        deposit_chf: depositChf,
        remaining_km: remainingKm,
        contract_end_date: contractEnd,
      };

      if (isGarage && !isEditingExistingListing) {
        updateData({ ...financingPatch, id: undefined } as any);

        const nextDraftData = {
          ...data,
          ...financingPatch,
        };
        (nextDraftData as any).id = undefined;

        let nextDraftId = draftId;
        if (!nextDraftId) {
          const created = await createListingDraft({ user, data: nextDraftData });
          nextDraftId = created.id;
          setDraftId(created.id);
          if (router.isReady) {
            await router.replace(
              { pathname: router.pathname, query: { ...router.query, draft: created.id } },
              undefined,
              { shallow: true }
            );
          }
        } else {
          await updateListingDraft({ user, draftId: nextDraftId, data: nextDraftData });
        }

        toast({
          title: "Gespeichert",
          description: "Finanzierungsdetails wurden als Entwurf gespeichert.",
        });

        nextStep();
        return;
      }

      const payload: ListingUpdatePayload = {
        id: data.id,
        deal_type: "lease_takeover",
        financing_type: null,
        leasing_offer: null,
        purchase_price_chf: null,
        brand: data.brand,
        model: data.model,
        year: data.year,
        mileage_km: mileageKm,
        fuel: data.fuel,
        gearbox: data.gearbox,
        body: data.body,
        description: data.description,
        location: data.location,
        canton_code: data.canton_code,
        title: data.title,
        price_plan: data.price_plan,
        premium: data.premium,
        images: data.images,
        cover_image_index: data.cover_image_index,

        price_per_month_chf: Number(formData.price_per_month_chf),
        remaining_months: Number(formData.remaining_months),
        deposit_chf: depositChf,
        remaining_km: remainingKm,
        contract_end_date: contractEnd,
      };

      const saved = await createOrUpdateListing(payload, user);

      const nextListingId = saved?.id ?? data.id;

      const financingPatchWithId: Partial<typeof data> = {
        ...financingPatch,
        id: nextListingId,
      };

      updateData(financingPatchWithId);

      if (draftId) {
        try {
          await updateListingDraft({
            user,
            draftId,
            data: {
              ...data,
              ...financingPatchWithId,
            },
          });
        } catch (e) {
          console.warn("Could not update listing draft with financing details:", e);
        }
      }

      toast({
        title: "Gespeichert",
        description: "Finanzierungsdetails wurden gespeichert.",
      });

      nextStep();
    } catch (error) {
      const details = getErrorDetailsForToast(error);
      setSubmitError(details ?? "Unbekannter Fehler.");

      console.error("Error submitting Step 2 (lease takeover):", {
        message: (error as any)?.message,
        code: (error as any)?.code,
        details: (error as any)?.details,
        hint: (error as any)?.hint,
        error,
      });

      toast({
        title: "Fehler beim Speichern",
        description: details
          ? `Finanzierungsdetails konnten nicht gespeichert werden: ${details}`
          : "Finanzierungsdetails konnten nicht gespeichert werden. Bitte prüfen Sie die Angaben und versuchen Sie es erneut.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingListing(false);
    }
  };

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, "");
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, "'");
  };

  const handleDateSelect = (date: Date | undefined) => {
    setContractEndDate(date);
    if (date) {
      const months = calculateRemainingMonths(date);
      setValue("remaining_months", months, { shouldValidate: true });
      updateData({ contract_end_date: format(date, "yyyy-MM-dd") } as any);
    }
  };

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

      <form
        onSubmit={handleSubmit(onSubmit, (formErrors) => {
          setSubmitAttempted(true);
          setSubmitError(null);

          focusFirstInvalidField(formErrors);
          toast({
            title: "Bitte prüfe die Angaben",
            description: "Einige Pflichtfelder sind noch nicht korrekt ausgefüllt.",
            variant: "destructive",
          });
        })}
        className="space-y-6"
      >
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
                  onSelect={handleDateSelect}
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
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500 font-light">Monate</span>
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
                CHF {watch("price_per_month_chf") ? formatCurrency(watch("price_per_month_chf").toString()) : "0"}
              </p>
            </div>
            <div className="text-center p-3 bg-white/60 rounded-lg border border-neutral-200/30">
              <p className="text-neutral-500 mb-1 font-light">Restlaufzeit</p>
              <p className="text-xl font-semibold text-neutral-900">{watch("remaining_months") || 0} Monate</p>
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