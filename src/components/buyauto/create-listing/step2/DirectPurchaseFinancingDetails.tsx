import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/router";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useWizard } from "../ListingWizard";
import { createOrUpdateListing, type ListingUpdatePayload } from "@/services/createListingService";
import { createListingDraft, updateListingDraft } from "@/services/listingDraftService";

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

function normalizeCantonCode(value: unknown): string | null {
  const v = String(value ?? "").trim().toUpperCase();
  if (!v) return null;
  if (v.length !== 2) return null;
  return v;
}

const directPurchaseFinancingSchema = z
  .object({
    purchase_price_chf: z.number().optional(),

    lease_takeover_enabled: z.boolean().default(false),
    lease_takeover_price_per_month_chf: z.number().optional(),
    lease_takeover_remaining_months: z.number().optional(),
    lease_takeover_deposit_chf: z.number().optional(),
    lease_takeover_remaining_km: z.number().optional(),
    lease_takeover_pickup_canton_code: z.string().optional(),

    leasing_enabled: z.boolean().default(false),
    interest_rate_pct: z.number().optional(),
    down_payment_pct: z.number().optional(),
    no_down_payment: z.boolean().default(false),
    min_term_months: z.number().optional(),
    max_term_months: z.number().optional(),
    residual_pct_adjustment_pp: z.number().optional(),
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

      if (values.lease_takeover_remaining_km !== undefined) {
        const km = Number(values.lease_takeover_remaining_km);
        if (!Number.isFinite(km) || km < 0) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["lease_takeover_remaining_km"], message: "Verbleibende KM muss mindestens 0 sein" });
        }
      }
    }

    if (!values.leasing_enabled) return;

    if (values.interest_rate_pct === undefined || !Number.isFinite(values.interest_rate_pct)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["interest_rate_pct"], message: "Leasingzins ist erforderlich" });
    } else {
      if (values.interest_rate_pct <= 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["interest_rate_pct"], message: "Leasingzins ist erforderlich" });
      }
      if (values.interest_rate_pct > 99) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["interest_rate_pct"], message: "Bitte einen realistischen Wert eingeben" });
      }
    }

    if (values.down_payment_pct === undefined || !Number.isFinite(values.down_payment_pct)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["down_payment_pct"], message: "Mindestanzahlung ist erforderlich" });
    } else if (values.down_payment_pct < 0 || values.down_payment_pct > 40) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["down_payment_pct"], message: "Bitte zwischen 0 und 40 eingeben" });
    }

    if (values.min_term_months === undefined || !Number.isFinite(values.min_term_months)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["min_term_months"], message: "Mindestlaufzeit ist erforderlich" });
    } else if (values.min_term_months < 1) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["min_term_months"], message: "Mindestlaufzeit ist erforderlich" });
    }

    if (values.max_term_months === undefined || !Number.isFinite(values.max_term_months)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["max_term_months"], message: "Maximallaufzeit ist erforderlich" });
    } else if (values.max_term_months < 1) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["max_term_months"], message: "Maximallaufzeit ist erforderlich" });
    }

    if (
      values.min_term_months !== undefined &&
      values.max_term_months !== undefined &&
      Number.isFinite(values.min_term_months) &&
      Number.isFinite(values.max_term_months) &&
      values.min_term_months > values.max_term_months
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["max_term_months"],
        message: "Maximallaufzeit muss >= Mindestlaufzeit sein",
      });
    }

    if (values.residual_pct_adjustment_pp !== undefined) {
      const pp = Number(values.residual_pct_adjustment_pp);
      if (!Number.isFinite(pp)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["residual_pct_adjustment_pp"],
          message: "Bitte einen gültigen Wert eingeben",
        });
      } else if (pp < -20 || pp > 20) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["residual_pct_adjustment_pp"],
          message: "Bitte zwischen -20 und +20 eingeben",
        });
      }
    }
  });

export function DirectPurchaseFinancingDetails() {
  const { data, updateData, nextStep, prevStep, draftId, setDraftId, registerDraftSnapshotter } = useWizard();
  const { user, profile, profileLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const isGarage = profile?.role === "garage";
  const isEditingExistingListing = typeof router.query.edit === "string" && router.query.edit.length > 0;
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
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  const step1CantonCode = useMemo(() => normalizeCantonCode((data as any)?.canton_code), [data]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger,
    clearErrors,
    getValues,
  } = useForm<DirectPurchaseFinancingForm>({
    resolver: zodResolver(directPurchaseFinancingSchema),
    defaultValues: {
      purchase_price_chf:
        toNumberOrUndefined((data as unknown as { purchase_price_chf?: unknown }).purchase_price_chf) ??
        toNumberOrUndefined(data.price_per_month_chf) ??
        0,

      lease_takeover_enabled: existingTakeover?.enabled === true,
      lease_takeover_price_per_month_chf: toNumberOrUndefined(existingTakeover?.price_per_month_chf) ?? 0,
      lease_takeover_remaining_months: toNumberOrUndefined(existingTakeover?.remaining_months) ?? 0,
      lease_takeover_deposit_chf: toNumberOrUndefined(existingTakeover?.deposit_chf) ?? 0,
      lease_takeover_remaining_km: toNumberOrUndefined(existingTakeover?.remaining_km) ?? 0,
      // UI field removed; keep empty for backward compatibility, but we don't rely on it.
      lease_takeover_pickup_canton_code: "",

      leasing_enabled: leasingEnabledInitial,
      interest_rate_pct: toNumberOrUndefined(existingOffer?.interest_rate_pct) ?? 4.9,
      down_payment_pct: toNumberOrUndefined(existingOffer?.down_payment_pct) ?? (existingOffer?.no_down_payment ? 0 : 0),
      no_down_payment: false,
      min_term_months: toNumberOrUndefined(existingOffer?.min_term_months) ?? 24,
      max_term_months: toNumberOrUndefined(existingOffer?.max_term_months) ?? 60,
      residual_pct_adjustment_pp: clampPp(toNumberOrUndefined(existingOffer?.residual_pct_adjustment_pp) ?? 0),
    },
    mode: "onBlur",
  });

  const leasingEnabled = Boolean(watch("leasing_enabled"));
  const residualAdjustmentPp = clampPp(toNumberOrUndefined(watch("residual_pct_adjustment_pp")) ?? 0);
  const leaseTakeoverEnabled = Boolean(watch("lease_takeover_enabled"));

  useEffect(() => {
    if (!hasMounted) return;

    let t: ReturnType<typeof setTimeout> | null = null;

    const subscription = watch((values) => {
      if (t) clearTimeout(t);

      t = setTimeout(() => {
        const leasingEnabledNow = Boolean((values as any)?.leasing_enabled);
        const leaseTakeoverEnabledNow = Boolean((values as any)?.lease_takeover_enabled);

        const takeoverPickupCanton = step1CantonCode ?? "XX";

        const purchasePriceChfRaw = toNumberOrUndefined((values as any)?.purchase_price_chf) ?? 0;
        const purchasePriceChfClean = purchasePriceChfRaw > 0 ? Math.round(purchasePriceChfRaw) : undefined;

        const leaseTakeoverOffer =
          leaseTakeoverEnabledNow === true
            ? {
                enabled: true,
                price_per_month_chf: Math.round(toNumberOrUndefined((values as any)?.lease_takeover_price_per_month_chf) ?? 0),
                remaining_months: Math.floor(toNumberOrUndefined((values as any)?.lease_takeover_remaining_months) ?? 0),
                deposit_chf: Math.round(toNumberOrUndefined((values as any)?.lease_takeover_deposit_chf) ?? 0),
                remaining_km: toNumberOrUndefined((values as any)?.lease_takeover_remaining_km),
                pickup_canton_code: takeoverPickupCanton,
              }
            : undefined;

        const leasingOffer =
          leasingEnabledNow
            ? {
                enabled: true,
                interest_rate_pct: toNumberOrUndefined((values as any)?.interest_rate_pct) ?? 0,
                down_payment_pct: toNumberOrUndefined((values as any)?.down_payment_pct) ?? 0,
                no_down_payment: false,
                min_term_months: toNumberOrUndefined((values as any)?.min_term_months) ?? 0,
                max_term_months: toNumberOrUndefined((values as any)?.max_term_months) ?? 0,
                km_options: DEFAULT_KM_OPTIONS,
                residual_pct_adjustment_pp: clampPp(toNumberOrUndefined((values as any)?.residual_pct_adjustment_pp) ?? 0),
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

        updateData({
          deal_type: "direct_purchase",
          financing_type: leasingEnabledNow ? "leasing" : "cash",
          leasing_offer: leasingOffer as any,
          purchase_price_chf: purchasePriceChfClean,
        } as any);
      }, 250);
    });

    return () => {
      subscription.unsubscribe();
      if (t) clearTimeout(t);
    };
  }, [hasMounted, step1CantonCode, updateData, watch]);

  useEffect(() => {
    registerDraftSnapshotter(() => {
      const values = getValues();

      const leasingEnabledNow = Boolean(values.leasing_enabled);
      const leaseTakeoverEnabledNow = Boolean(values.lease_takeover_enabled);

      const purchasePriceChf =
        typeof values.purchase_price_chf === "number" && Number.isFinite(values.purchase_price_chf)
          ? values.purchase_price_chf
          : undefined;

      const takeoverPickupCanton = step1CantonCode ?? "XX";

      const leaseTakeoverOffer =
        leaseTakeoverEnabledNow === true
          ? {
              enabled: true,
              price_per_month_chf: Math.round(toNumberOrUndefined(values.lease_takeover_price_per_month_chf) ?? 0),
              remaining_months: Math.floor(toNumberOrUndefined(values.lease_takeover_remaining_months) ?? 0),
              deposit_chf: Math.round(toNumberOrUndefined(values.lease_takeover_deposit_chf) ?? 0),
              remaining_km: toNumberOrUndefined(values.lease_takeover_remaining_km),
              pickup_canton_code: takeoverPickupCanton,
            }
          : undefined;

      const leasingOffer =
        leasingEnabledNow
          ? {
              enabled: true,
              interest_rate_pct: toNumberOrUndefined(values.interest_rate_pct) ?? 0,
              down_payment_pct: toNumberOrUndefined(values.down_payment_pct) ?? 0,
              no_down_payment: false,
              min_term_months: toNumberOrUndefined(values.min_term_months) ?? 0,
              max_term_months: toNumberOrUndefined(values.max_term_months) ?? 0,
              km_options: DEFAULT_KM_OPTIONS,
              residual_pct_adjustment_pp: clampPp(toNumberOrUndefined(values.residual_pct_adjustment_pp) ?? 0),
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

      return {
        deal_type: "direct_purchase",
        financing_type: leasingEnabledNow ? "leasing" : "cash",
        leasing_offer: leasingOffer,
        purchase_price_chf: purchasePriceChf,
      } as any;
    });

    return () => {
      registerDraftSnapshotter(() => ({}));
    };
  }, [getValues, registerDraftSnapshotter, step1CantonCode]);

  useEffect(() => {
    if (!isGarage) {
      setValue("leasing_enabled", false, { shouldValidate: false });
    }
  }, [isGarage, setValue]);

  useEffect(() => {
    if (leaseTakeoverEnabled) return;

    clearErrors([
      "lease_takeover_price_per_month_chf",
      "lease_takeover_remaining_months",
      "lease_takeover_deposit_chf",
      "lease_takeover_remaining_km",
      "lease_takeover_pickup_canton_code",
    ] as any);

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
  }, [clearErrors, data, leaseTakeoverEnabled, leasingEnabled, setValue, updateData]);

  useEffect(() => {
    if (leasingEnabled) return;

    clearErrors([
      "interest_rate_pct",
      "down_payment_pct",
      "min_term_months",
      "max_term_months",
      "residual_pct_adjustment_pp",
    ] as any);
  }, [clearErrors, leasingEnabled]);

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

    setSubmitAttempted(true);
    setSubmitError(null);

    setIsUpdatingListing(true);
    try {
      const purchasePriceChfRaw = typeof formData.purchase_price_chf === "number" ? formData.purchase_price_chf : 0;
      const purchasePriceChfClean = purchasePriceChfRaw > 0 ? Math.round(purchasePriceChfRaw) : null;

      const takeoverPickupCanton = step1CantonCode ?? "XX";

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
              pickup_canton_code: takeoverPickupCanton,
            }
          : undefined;

      const leasingOffer =
        leasingEnabled
          ? {
              enabled: true,
              interest_rate_pct: Number(formData.interest_rate_pct),
              down_payment_pct: Number(formData.down_payment_pct ?? 0),
              no_down_payment: false,
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

      const financingPatch: Partial<typeof data> = {
        deal_type: "direct_purchase",
        financing_type: leasingEnabled ? "leasing" : "cash",
        leasing_offer: leasingOffer,
        purchase_price_chf: purchasePriceChfClean ?? undefined,
        price_per_month_chf: undefined,
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

        purchase_price_chf: purchasePriceChfClean,
        price_per_month_chf: null,
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
      const details = getErrorDetailsForToast(error);
      setSubmitError(details ?? "Unbekannter Fehler.");

      console.error("Error submitting Step 2 (direct purchase):", {
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

  if (profileLoading) {
    return <div className="text-sm text-neutral-600">Lade Profil...</div>;
  }

  return (
    <div className="space-y-8">
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
          noDownPayment={false}
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