import { useEffect, useMemo } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useWizard } from "../ListingWizard";
import { createOrUpdateListing, type LeasingOfferPayload, type ListingUpdatePayload } from "@/services/createListingService";

const DEFAULT_KM_OPTIONS = [10000, 15000, 20000, 25000];

const directPurchaseFinancingSchema = z
  .object({
    leasing_enabled: z.boolean().default(false),
    interest_rate_pct: z.number().min(0.01, "Leasingzins ist erforderlich").max(99, "Bitte einen realistischen Wert eingeben").optional(),
    down_payment_pct: z.number().min(0).max(100).optional(),
    no_down_payment: z.boolean().default(false),
    min_term_months: z.number().int().min(1, "Mindestlaufzeit ist erforderlich").optional(),
    max_term_months: z.number().int().min(1, "Maximallaufzeit ist erforderlich").optional(),
  })
  .superRefine((values, ctx) => {
    if (!values.leasing_enabled) return;

    if (values.interest_rate_pct === undefined || !Number.isFinite(values.interest_rate_pct)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["interest_rate_pct"], message: "Leasingzins ist erforderlich" });
    }

    if (values.no_down_payment) {
      if ((values.down_payment_pct ?? 0) !== 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["down_payment_pct"],
          message: "Bei 'Keine Anzahlung' muss die Anzahlung 0% sein",
        });
      }
    } else {
      if (values.down_payment_pct === undefined || !Number.isFinite(values.down_payment_pct)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["down_payment_pct"], message: "Anzahlung ist erforderlich" });
      }
    }

    if (values.min_term_months === undefined || !Number.isFinite(values.min_term_months)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["min_term_months"], message: "Mindestlaufzeit ist erforderlich" });
    }

    if (values.max_term_months === undefined || !Number.isFinite(values.max_term_months)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["max_term_months"], message: "Maximallaufzeit ist erforderlich" });
    }

    if (
      values.min_term_months !== undefined &&
      values.max_term_months !== undefined &&
      values.min_term_months > values.max_term_months
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["max_term_months"],
        message: "Maximallaufzeit muss >= Mindestlaufzeit sein",
      });
    }
  });

type DirectPurchaseFinancingForm = z.infer<typeof directPurchaseFinancingSchema>;

function toNumberOrUndefined(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return parsed;
}

export function DirectPurchaseFinancingDetails() {
  const { data, updateData, nextStep, prevStep } = useWizard();
  const { user, profile, profileLoading } = useAuth();
  const { toast } = useToast();

  const isGarage = profile?.role === "garage";
  const nextLabel = isGarage ? "Weiter zu Fotos" : "Weiter zu Plan-Auswahl";

  const existingOffer = useMemo(() => {
    const anyData = data as unknown as { leasing_offer?: LeasingOfferPayload | null };
    return anyData.leasing_offer ?? null;
  }, [data]);

  const leasingEnabledInitial =
    data.deal_type === "direct_purchase" && data.financing_type === "leasing" && existingOffer?.enabled === true;

  // IMPORTANT: Hooks must run unconditionally (no early returns above this line)
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<DirectPurchaseFinancingForm>({
    resolver: zodResolver(directPurchaseFinancingSchema),
    defaultValues: {
      leasing_enabled: leasingEnabledInitial,
      interest_rate_pct: toNumberOrUndefined(existingOffer?.interest_rate_pct) ?? 4.9,
      down_payment_pct: toNumberOrUndefined(existingOffer?.down_payment_pct) ?? 10,
      no_down_payment: existingOffer?.no_down_payment ?? false,
      min_term_months: toNumberOrUndefined(existingOffer?.min_term_months) ?? 24,
      max_term_months: toNumberOrUndefined(existingOffer?.max_term_months) ?? 60,
    },
  });

  const leasingEnabled = watch("leasing_enabled");
  const noDownPayment = watch("no_down_payment");

  useEffect(() => {
    if (!isGarage) return;
    if (noDownPayment) {
      setValue("down_payment_pct", 0, { shouldValidate: true });
    }
  }, [isGarage, noDownPayment, setValue]);

  const persistCashAndContinue = async () => {
    if (!user) {
      toast({
        title: "Nicht angemeldet",
        description: "Sie müssen angemeldet sein.",
        variant: "destructive",
      });
      return;
    }

    if (!data.id) {
      toast({
        title: "Fehler",
        description: "Keine Inserat-ID gefunden. Bitte gehen Sie zurück zu Schritt 1 und versuchen Sie es erneut.",
        variant: "destructive",
      });
      return;
    }

    try {
      const updatePayload: ListingUpdatePayload = {
        id: data.id,
        deal_type: "direct_purchase",
        financing_type: "cash",
        leasing_offer: null,
      };

      const result = await createOrUpdateListing(updatePayload, user);

      updateData({
        ...updatePayload,
        id: result.id,
      });

      nextStep();
    } catch (error) {
      console.error("Error saving direct purchase defaults:", error);
      toast({
        title: "Fehler",
        description: "Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (formData: DirectPurchaseFinancingForm) => {
    if (!user) {
      toast({
        title: "Nicht angemeldet",
        description: "Sie müssen angemeldet sein.",
        variant: "destructive",
      });
      return;
    }

    if (!data.id) {
      toast({
        title: "Fehler",
        description: "Keine Inserat-ID gefunden. Bitte gehen Sie zurück zu Schritt 1 und versuchen Sie es erneut.",
        variant: "destructive",
      });
      return;
    }

    try {
      const leasingOffer: LeasingOfferPayload | null = formData.leasing_enabled
        ? {
            enabled: true,
            interest_rate_pct: Number(formData.interest_rate_pct),
            down_payment_pct: formData.no_down_payment ? 0 : Number(formData.down_payment_pct),
            no_down_payment: formData.no_down_payment === true,
            min_term_months: Math.floor(Number(formData.min_term_months)),
            max_term_months: Math.floor(Number(formData.max_term_months)),
            km_options:
              Array.isArray(existingOffer?.km_options) && existingOffer.km_options.length > 0
                ? existingOffer.km_options
                : DEFAULT_KM_OPTIONS,
          }
        : null;

      const updatePayload: ListingUpdatePayload = {
        id: data.id,
        deal_type: "direct_purchase",
        financing_type: formData.leasing_enabled ? "leasing" : "cash",
        leasing_offer: leasingOffer,
      };

      const result = await createOrUpdateListing(updatePayload, user);

      updateData({
        ...updatePayload,
        id: result.id,
      });

      toast({
        title: "Finanzierungsdetails gespeichert",
        description: formData.leasing_enabled ? "Leasing-Angebot wurde gespeichert." : "Keine Finanzierung ausgewählt (Direktkauf).",
      });

      nextStep();
    } catch (error) {
      console.error("Error saving direct purchase financing details:", error);
      toast({
        title: "Fehler",
        description: "Finanzierungsdetails konnten nicht gespeichert werden. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    }
  };

  if (profileLoading) {
    return <div className="text-sm text-neutral-600">Lade Profil...</div>;
  }

  // Private sellers: no access to leasing config (garage-only feature)
  if (!isGarage) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-light text-neutral-900 mb-2 tracking-tight">Finanzierungsdetails</h2>
          <p className="text-neutral-600 font-light leading-relaxed">Direktkauf: keine zusätzlichen Finanzierungsdetails.</p>
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
            type="button"
            onClick={persistCashAndContinue}
            className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
          >
            {nextLabel}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-light text-neutral-900 mb-2 tracking-tight">Finanzierungsdetails</h2>
        <p className="text-neutral-600 font-light leading-relaxed">
          Optional (nur Garagen): Bieten Sie Leasing an, damit Käufer eine unverbindliche Rate berechnen können
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200/60 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-neutral-900">Leasing anbieten</p>
              <p className="text-sm text-neutral-600">Wenn aktiv, sehen Käufer einen Leasingrechner auf der Detailseite.</p>
            </div>
            <Switch checked={leasingEnabled} onCheckedChange={(checked) => setValue("leasing_enabled", checked)} />
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
                  {...register("interest_rate_pct", { valueAsNumber: true })}
                  className="bg-white border border-neutral-200/40 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm"
                />
                {errors.interest_rate_pct && <p className="text-sm text-red-500 font-light">{errors.interest_rate_pct.message}</p>}
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
                {errors.down_payment_pct && <p className="text-sm text-red-500 font-light">{errors.down_payment_pct.message}</p>}
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
                {errors.min_term_months && <p className="text-sm text-red-500 font-light">{errors.min_term_months.message}</p>}
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
                {errors.max_term_months && <p className="text-sm text-red-500 font-light">{errors.max_term_months.message}</p>}
              </div>

              <div className="md:col-span-2">
                <p className="text-xs text-neutral-500">
                  KM/Jahr Optionen werden in V1 automatisch auf 10’000 / 15’000 / 20’000 / 25’000 gesetzt (sofern nicht anders konfiguriert).
                </p>
              </div>
            </div>
          )}
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
            className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
          >
            {nextLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}