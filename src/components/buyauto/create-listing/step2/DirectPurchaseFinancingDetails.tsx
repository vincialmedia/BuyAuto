import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useWizard } from "../ListingWizard";
import { createOrUpdateListing, type ListingUpdatePayload } from "@/services/createListingService";
import { updateListingDraft } from "@/services/listingDraftService";

import { LeaseTakeoverOfferSection, type LeaseTakeoverOfferFormValues } from "./LeaseTakeoverOfferSection";
import { GarageLeasingOfferSection, type GarageLeasingOfferFormValues } from "./GarageLeasingOfferSection";

const DEFAULT_KM_OPTIONS = [10000, 15000, 20000, 25000];

type DirectPurchaseFinancingForm = {
  purchase_price_chf?: number;

  lease_takeover_enabled: boolean;
  lease_takeover_price_per_month_chf?: number;
  lease_takeover_remaining_months?: number;
  lease_takeover_deposit_chf?: number;
  lease_takeover_remaining_km?: number;
  lease_takeover_pickup_canton_code?: string;

  leasing_enabled: boolean;
  interest_rate_pct?: number;
  down_payment_pct?: number;
  no_down_payment: boolean;
  min_term_months?: number;
  max_term_months?: number;
  residual_pct_adjustment_pp?: number;
};

function toNumberOrUndefined(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return parsed;
}

function clampPp(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(-20, Math.min(20, value));
}

function getMileageKmFromWizardData(data: unknown): number | null {
  const anyData = data as any;
  const kmNum = Number(anyData?.km ?? anyData?.mileage ?? anyData?.mileage_km);
  if (!Number.isFinite(kmNum) || kmNum < 0) return null;
  return kmNum;
}

const directPurchaseFinancingSchema = z
  .object({
    purchase_price_chf: z.number().optional(),

    lease_takeover_enabled: z.boolean().default(false),
    lease_takeover_price_per_month_chf: z.number().min(1, "Monatliche Rate ist erforderlich").optional(),
    lease_takeover_remaining_months: z.number().min(1, "Restlaufzeit muss mindestens 1 Monat betragen").optional(),
    lease_takeover_deposit_chf: z.number().min(0, "Kaution kann nicht negativ sein").optional(),
    lease_takeover_remaining_km: z.number().min(0, "Verbleibende KM muss mindestens 0 sein").optional(),
    lease_takeover_pickup_canton_code: z.string().min(1, "Standort ist erforderlich").optional(),

    leasing_enabled: z.boolean().default(false),
    interest_rate_pct: z.number().min(0.01, "Leasingzins ist erforderlich").max(99, "Bitte einen realistischen Wert eingeben").optional(),
    down_payment_pct: z.number().min(0).max(100).optional(),
    no_down_payment: z.boolean().default(false),
    min_term_months: z.number().int().min(1, "Mindestlaufzeit ist erforderlich").optional(),
    max_term_months: z.number().int().min(1, "Maximallaufzeit ist erforderlich").optional(),
    residual_pct_adjustment_pp: z
      .number()
      .min(-20, "Bitte zwischen -20 und +20 eingeben")
      .max(20, "Bitte zwischen -20 und +20 eingeben")
      .optional(),
  })
  .superRefine((values, ctx) => {
    if (!values.lease_takeover_enabled) {
      if (values.purchase_price_chf === undefined || !Number.isFinite(values.purchase_price_chf) || values.purchase_price_chf <= 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["purchase_price_chf"], message: "Kaufpreis ist erforderlich" });
      }
    } else {
      if (
        values.lease_takeover_price_per_month_chf === undefined ||
        !Number.isFinite(values.lease_takeover_price_per_month_chf) ||
        values.lease_takeover_price_per_month_chf <= 0
      ) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["lease_takeover_price_per_month_chf"], message: "Monatliche Rate ist erforderlich" });
      }

      if (
        values.lease_takeover_remaining_months === undefined ||
        !Number.isFinite(values.lease_takeover_remaining_months) ||
        values.lease_takeover_remaining_months <= 0
      ) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["lease_takeover_remaining_months"], message: "Restlaufzeit ist erforderlich" });
      }

      if (values.lease_takeover_deposit_chf === undefined || !Number.isFinite(values.lease_takeover_deposit_chf) || values.lease_takeover_deposit_chf < 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["lease_takeover_deposit_chf"], message: "Kaution ist erforderlich" });
      }

      if (!values.lease_takeover_pickup_canton_code || values.lease_takeover_pickup_canton_code.trim().length === 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["lease_takeover_pickup_canton_code"], message: "Standort ist erforderlich" });
      }
    }

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

    if (values.residual_pct_adjustment_pp !== undefined && !Number.isFinite(values.residual_pct_adjustment_pp)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["residual_pct_adjustment_pp"],
        message: "Bitte einen gültigen Wert eingeben",
      });
    }
  });

export function DirectPurchaseFinancingDetails() {
  const { data, updateData, nextStep, prevStep, draftId } = useWizard();
  const { user, profile, profileLoading } = useAuth();
  const { toast } = useToast();

  const isGarage = profile?.role === "garage";
  const nextLabel = isGarage ? "Weiter zu Fotos" : "Weiter zu Plan-Auswahl";

  const existingOffer = useMemo(() => {
    const anyData = data as unknown as { leasing_offer?: any | null };
    return anyData.leasing_offer ?? null;
  }, [data]);

  const existingTakeover = existingOffer?.lease_takeover_offer ?? null;

  const leasingEnabledInitial =
    isGarage === true &&
    data.deal_type === "direct_purchase" &&
    data.financing_type === "leasing" &&
    existingOffer?.enabled === true;

  const [hasMounted, setHasMounted] = useState(false);
  const [isUpdatingListing, setIsUpdatingListing] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const listingInputs = useMemo(() => {
    const yearNum = Number(data.year);
    const mileageKm = getMileageKmFromWizardData(data);

    return {
      year: Number.isFinite(yearNum) && yearNum > 1900 ? yearNum : null,
      mileageKm,
    };
  }, [data]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger,
  } = useForm<DirectPurchaseFinancingForm>({
    resolver: zodResolver(directPurchaseFinancingSchema),
    defaultValues: {
      purchase_price_chf: toNumberOrUndefined(data.price_per_month_chf) ?? 0,

      lease_takeover_enabled: existingTakeover?.enabled === true,
      lease_takeover_price_per_month_chf: toNumberOrUndefined(existingTakeover?.price_per_month_chf) ?? 0,
      lease_takeover_remaining_months: toNumberOrUndefined(existingTakeover?.remaining_months) ?? 0,
      lease_takeover_deposit_chf: toNumberOrUndefined(existingTakeover?.deposit_chf) ?? 0,
      lease_takeover_remaining_km: toNumberOrUndefined(existingTakeover?.remaining_km) ?? 0,
      lease_takeover_pickup_canton_code: typeof existingTakeover?.pickup_canton_code === "string" ? existingTakeover.pickup_canton_code : "",

      leasing_enabled: leasingEnabledInitial,
      interest_rate_pct: toNumberOrUndefined(existingOffer?.interest_rate_pct) ?? 4.9,
      down_payment_pct: toNumberOrUndefined(existingOffer?.down_payment_pct) ?? 10,
      no_down_payment: existingOffer?.no_down_payment ?? false,
      min_term_months: toNumberOrUndefined(existingOffer?.min_term_months) ?? 24,
      max_term_months: toNumberOrUndefined(existingOffer?.max_term_months) ?? 60,
      residual_pct_adjustment_pp: clampPp(toNumberOrUndefined(existingOffer?.residual_pct_adjustment_pp) ?? 0),
    },
    mode: "onBlur",
  });

  const leasingEnabled = Boolean(watch("leasing_enabled"));
  const noDownPayment = Boolean(watch("no_down_payment"));
  const residualAdjustmentPp = clampPp(toNumberOrUndefined(watch("residual_pct_adjustment_pp")) ?? 0);
  const leaseTakeoverEnabled = Boolean(watch("lease_takeover_enabled"));

  useEffect(() => {
    if (!isGarage) {
      setValue("leasing_enabled", false, { shouldValidate: false });
    }
  }, [isGarage, setValue]);

  useEffect(() => {
    if (!isGarage) return;
    if (noDownPayment) {
      setValue("down_payment_pct", 0, { shouldValidate: true });
    }
  }, [isGarage, noDownPayment, setValue]);

  useEffect(() => {
    if (leaseTakeoverEnabled) return;

    setValue("lease_takeover_price_per_month_chf", 0, { shouldValidate: false });
    setValue("lease_takeover_remaining_months", 0, { shouldValidate: false });
    setValue("lease_takeover_deposit_chf", 0, { shouldValidate: false });
    setValue("lease_takeover_remaining_km", 0, { shouldValidate: false });
    setValue("lease_takeover_pickup_canton_code", "", { shouldValidate: false });

    const currentOffer = (data as any)?.leasing_offer;
    if (currentOffer?.lease_takeover_offer) {
      const nextOffer = { ...currentOffer };
      delete nextOffer.lease_takeover_offer;

      if (!leasingEnabled) {
        updateData({ leasing_offer: null } as any);
      } else {
        updateData({ leasing_offer: nextOffer } as any);
      }
    }
  }, [data, leaseTakeoverEnabled, leasingEnabled, setValue, updateData]);

  const purchasePriceChf = toNumberOrUndefined(watch("purchase_price_chf")) ?? 0;

  const onSubmit = async (formData: DirectPurchaseFinancingForm) => {
    if (!user) {
      toast({
        title: "Nicht eingeloggt",
        description: "Bitte logge dich ein, um fortzufahren.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingListing(true);
    try {
      const purchasePriceChfRaw = typeof formData.purchase_price_chf === "number" ? formData.purchase_price_chf : 0;
      const purchasePriceChfClean = purchasePriceChfRaw > 0 ? Math.round(purchasePriceChfRaw) : null;

      const leaseTakeoverOffer =
        formData.lease_takeover_enabled === true
          ? {
              enabled: true,
              price_per_month_chf: Math.round(Number(formData.lease_takeover_price_per_month_chf)),
              remaining_months: Math.floor(Number(formData.lease_takeover_remaining_months)),
              deposit_chf: Math.round(Number(formData.lease_takeover_deposit_chf)),
              remaining_km:
                typeof formData.lease_takeover_remaining_km === "number" && Number.isFinite(formData.lease_takeover_remaining_km)
                  ? Math.round(Number(formData.lease_takeover_remaining_km))
                  : undefined,
              pickup_canton_code: String(formData.lease_takeover_pickup_canton_code ?? "").trim(),
            }
          : undefined;

      const leasingOffer =
        leasingEnabled
          ? {
              enabled: true,
              interest_rate_pct: Number(formData.interest_rate_pct),
              down_payment_pct: formData.no_down_payment ? 0 : Number(formData.down_payment_pct),
              no_down_payment: Boolean(formData.no_down_payment),
              min_term_months: Number(formData.min_term_months),
              max_term_months: Number(formData.max_term_months),
              km_options: DEFAULT_KM_OPTIONS,
              residual_pct_adjustment_pp: clampPp(
                typeof formData.residual_pct_adjustment_pp === "number" ? formData.residual_pct_adjustment_pp : 0
              ),
              lease_takeover_offer: leaseTakeoverOffer,
            }
          : leaseTakeoverOffer
            ? {
                enabled: false,
                interest_rate_pct: 0,
                down_payment_pct: 0,
                no_down_payment: false,
                min_term_months: 0,
                max_term_months: 0,
                lease_takeover_offer: leaseTakeoverOffer,
              }
            : null;

      const payload: ListingUpdatePayload = {
        id: data.id,
        deal_type: "direct_purchase",
        financing_type: leasingEnabled ? "leasing" : "cash",
        leasing_offer: leasingOffer,

        brand: data.brand,
        model: data.model,
        year: data.year,
        mileage_km: getMileageKmFromWizardData(data),
        remaining_km: data.remaining_km ?? null,
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

        price_per_month_chf: purchasePriceChfClean,
      };

      const saved = await createOrUpdateListing(payload, user);
      const nextListingId = saved?.id ?? data.id;

      const financingPatch: Partial<typeof data> = {
        id: nextListingId,
        deal_type: "direct_purchase",
        financing_type: leasingEnabled ? "leasing" : "cash",
        leasing_offer: leasingOffer,
        price_per_month_chf: purchasePriceChfClean ?? undefined,
      };

      updateData(financingPatch);

      if (draftId) {
        try {
          await updateListingDraft({
            user,
            draftId,
            data: {
              ...data,
              ...financingPatch,
            },
          });
        } catch {
          // ignore
        }
      }

      toast({
        title: "Gespeichert",
        description: "Finanzierungsdetails wurden gespeichert.",
      });

      nextStep();
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Finanzierungsdetails konnten nicht gespeichert werden. Bitte prüfen Sie die Angaben und versuchen Sie es erneut.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingListing(false);
    }
  };

  if (profileLoading) {
    return <div className="text-sm text-neutral-600">Lade Profil...</div>;
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="purchase_price_chf" className="text-sm font-medium text-neutral-700">
            Direktkauf Preis (CHF) {leaseTakeoverEnabled ? "" : "*"}
          </Label>
          <div className="relative">
            <Input
              id="purchase_price_chf"
              type="text"
              inputMode="numeric"
              {...register("purchase_price_chf", { valueAsNumber: true })}
              placeholder="z.B. 25'900"
              className="bg-white border border-neutral-200/40 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm pr-16"
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9]/g, "");
                setValue("purchase_price_chf", raw ? parseInt(raw, 10) : (0 as unknown as number), { shouldValidate: true });
                e.target.value = raw;
              }}
              onBlur={(e) => {
                const raw = e.target.value.replace(/[^0-9]/g, "");
                if (raw) {
                  e.target.value = new Intl.NumberFormat("de-CH").format(parseInt(raw, 10));
                }
                void trigger("purchase_price_chf");
              }}
              onFocus={(e) => {
                e.target.value = e.target.value.replace(/[^0-9]/g, "");
              }}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500 font-light">CHF</span>
          </div>
          {(errors as any)?.purchase_price_chf && <p className="text-sm text-red-500 font-light">{(errors as any).purchase_price_chf.message}</p>}
        </div>

        <LeaseTakeoverOfferSection<LeaseTakeoverOfferFormValues & DirectPurchaseFinancingForm>
          register={register as any}
          setValue={setValue as any}
          watch={watch as any}
          errors={errors as any}
        />

        <GarageLeasingOfferSection<GarageLeasingOfferFormValues & DirectPurchaseFinancingForm>
          register={register as any}
          setValue={setValue as any}
          errors={errors as any}
          isGarage={Boolean(isGarage)}
          hasMounted={hasMounted}
          leasingEnabled={leasingEnabled}
          noDownPayment={noDownPayment}
          purchasePriceChf={purchasePriceChf}
          listingInputs={listingInputs}
          residualAdjustmentPp={residualAdjustmentPp}
        />

        <div className="flex items-center justify-between pt-2">
          <Button type="button" variant="outline" onClick={prevStep} className="rounded-2xl">
            Zurück
          </Button>
          <Button type="submit" className="rounded-2xl" disabled={isUpdatingListing}>
            {isUpdatingListing ? "Speichern..." : nextLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}