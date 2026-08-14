import { useEffect, useMemo, useState } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useRouter } from "next/router";

import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useWizard } from "../ListingWizard";
import { createOrUpdateListing, vehicleCoreFieldsFromWizard, type ListingUpdatePayload } from "@/services/createListingService";
import { createListingDraft, updateListingDraft } from "@/services/listingDraftService";
import {
  leaseTakeoverFinancingSchema,
  type LeaseTakeoverFinancingForm,
} from "./leaseTakeoverFinancingTypes";
import { LeaseTakeoverFinancingDetailsForm } from "./LeaseTakeoverFinancingDetailsForm";

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

function normalizeWizardPatch(params: {
  values: LeaseTakeoverFinancingForm;
  contractEndDate: Date | undefined;
  existing: any;
}) {
  const { values, contractEndDate, existing } = params;

  const patch: Record<string, unknown> = {
    deal_type: "lease_takeover",
    financing_type: null,
    leasing_offer: null,
    purchase_price_chf: null,
  };

  const monthly =
    typeof values.price_per_month_chf === "number" && Number.isFinite(values.price_per_month_chf) && values.price_per_month_chf > 0
      ? values.price_per_month_chf
      : undefined;

  const months =
    typeof values.remaining_months === "number" && Number.isFinite(values.remaining_months) && values.remaining_months >= 1
      ? values.remaining_months
      : undefined;

  const deposit =
    typeof values.deposit_chf === "number" && Number.isFinite(values.deposit_chf) && values.deposit_chf >= 0
      ? values.deposit_chf
      : undefined;

  const remainingKm =
    typeof values.remaining_km === "number" && Number.isFinite(values.remaining_km) && values.remaining_km >= 0
      ? values.remaining_km
      : undefined;

  if (typeof monthly === "number") patch.price_per_month_chf = monthly;
  if (typeof months === "number") patch.remaining_months = months;
  if (typeof deposit === "number") patch.deposit_chf = deposit;
  if (typeof remainingKm === "number") patch.remaining_km = remainingKm;

  const contractEnd =
    contractEndDate ? format(contractEndDate, "yyyy-MM-dd") : typeof existing?.contract_end_date === "string" ? existing.contract_end_date : null;

  if (typeof contractEnd === "string" && contractEnd.length > 0) {
    patch.contract_end_date = contractEnd;
  }

  return patch;
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
    formState: { errors, isDirty },
    watch,
    setValue,
    getValues,
    reset,
  } = useForm<LeaseTakeoverFinancingForm>({
    resolver: zodResolver(leaseTakeoverFinancingSchema),
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
    if (isDirty) return;

    reset(
      {
        price_per_month_chf: toFiniteNumber((data as any)?.price_per_month_chf, 0),
        remaining_months: toFiniteNumber((data as any)?.remaining_months, 12),
        deposit_chf: toFiniteNumber((data as any)?.deposit_chf, 0),
        remaining_km: toFiniteNumber((data as any)?.remaining_km, 0),
      },
      { keepDirty: false, keepTouched: false }
    );
  }, [data, draftId, isDirty, reset]);

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
    const t = setTimeout(() => {
      if (!isDirty) return;

      const patch = normalizeWizardPatch({
        values: getValues(),
        contractEndDate,
        existing: data as any,
      });

      updateData(patch as any);
    }, 250);

    return () => clearTimeout(t);
  }, [contractEndDate, data, getValues, isDirty, updateData, watchedDeposit, watchedPricePerMonth, watchedRemainingKm, watchedRemainingMonths]);

  useEffect(() => {
    registerDraftSnapshotter(() => {
      const patch = normalizeWizardPatch({
        values: getValues(),
        contractEndDate,
        existing: data as any,
      });
      return patch as any;
    });

    return () => {
      registerDraftSnapshotter(() => ({}));
    };
  }, [contractEndDate, data, getValues, registerDraftSnapshotter]);

  useEffect(() => {
    return () => {
      if (!isDirty) return;
      const patch = normalizeWizardPatch({
        values: getValues(),
        contractEndDate,
        existing: data as any,
      });
      updateData(patch as any);
    };
  }, [contractEndDate, data, getValues, isDirty, updateData]);

  const onSubmit = async (formData: LeaseTakeoverFinancingForm) => {
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

      if (!user) {
        // Deferred login: keep the details in wizard state (mirrored to
        // localStorage) — server writes happen after sign-in at Step 5.
        updateData(financingPatch as any);
        nextStep();
        return;
      }

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
        // Only persist a plan the user actually chose — see the identical
        // comment in DirectPurchaseFinancingDetails.
        price_plan: (data as any).plan_choice_v2 ? data.price_plan : undefined,
        // premium is a paid entitlement and is never written from the client —
        // see ListingUpdatePayload in createListingService.
        images: data.images,
        cover_image_index: data.cover_image_index,

        // Carry the Step-1 technical fields so this INSERT never drops them (U4).
        ...vehicleCoreFieldsFromWizard(data),

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
          : "Finanzierungsdetails konnten nicht gespeichert werden. Bitte prüfe die Angaben und versuche es erneut.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingListing(false);
    }
  };

  const onInvalid = (formErrors: FieldErrors<LeaseTakeoverFinancingForm>) => {
    setSubmitAttempted(true);
    setSubmitError(null);

    focusFirstInvalidField(formErrors);
    toast({
      title: "Bitte prüfe die Angaben",
      description: "Einige Pflichtfelder sind noch nicht korrekt ausgefüllt.",
      variant: "destructive",
    });
  };

  const onDateSelect = (date: Date | undefined) => {
    setContractEndDate(date);

    if (!date) return;

    const months = calculateRemainingMonths(date);
    setValue("remaining_months", months, { shouldValidate: true });

    const patch: Record<string, unknown> = {
      deal_type: "lease_takeover",
      financing_type: null,
      leasing_offer: null,
      purchase_price_chf: null,
      contract_end_date: format(date, "yyyy-MM-dd"),
    };

    updateData(patch as any);
  };

  return (
    <LeaseTakeoverFinancingDetailsForm
      data={data as any}
      contractEndDate={contractEndDate}
      errors={errors}
      handleSubmit={handleSubmit}
      isUpdatingListing={isUpdatingListing}
      onInvalid={onInvalid}
      onSubmit={onSubmit}
      prevStep={prevStep}
      register={register}
      setValue={setValue}
      submitAttempted={submitAttempted}
      submitError={submitError}
      watchedDeposit={watchedDeposit}
      watchedPricePerMonth={watchedPricePerMonth}
      watchedRemainingKm={watchedRemainingKm}
      watchedRemainingMonths={watchedRemainingMonths}
      watch={watch}
      onDateSelect={onDateSelect}
    />
  );
}