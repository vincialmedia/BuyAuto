import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useWizard } from "../ListingWizard";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

import { listingStep1Schema, type ListingStep1Form } from "@/lib/buyauto/schemas";
import type { DealType, LeasingOffer } from "@/lib/buyauto/types";
import { createOrUpdateListing, type ListingUpdatePayload } from "@/services/createListingService";
import { deleteListingDraft } from "@/services/listingDraftService";

import { Button } from "@/components/ui/button";
import { VehicleBasicsSection } from "@/components/buyauto/create-listing/step1/VehicleBasicsSection";
import { FinancingDetailsSection } from "@/components/buyauto/create-listing/step1/FinancingDetailsSection";
import { fetchMakes, fetchModelsForMake, searchMakes, searchModelsForMake } from "@/services/vehicleService";

const DEFAULT_KM_OPTIONS = [10000, 15000, 20000, 25000];

function toNumberOrUndefined(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return undefined;
}

export function Step1Form() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, profile, profileLoading } = useAuth();
  const isGarage = profile?.role === "garage";

  const { data, updateData, nextStep, draftId, setDraftId } = useWizard();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [loadingMakes, setLoadingMakes] = useState(true);
  const [loadingModels, setLoadingModels] = useState(false);
  const [makeOpen, setMakeOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [makeSearch, setMakeSearch] = useState("");
  const [modelSearch, setModelSearch] = useState("");

  const existingOffer = useMemo<LeasingOffer | null>(() => {
    const anyData = data as unknown as { leasing_offer?: LeasingOffer | null };
    return anyData.leasing_offer ?? null;
  }, [data]);

  const initialDealType = (data.deal_type ?? "direct_purchase") as DealType;

  const leasingEnabledInitial =
    isGarage &&
    initialDealType === "direct_purchase" &&
    data.financing_type === "leasing" &&
    existingOffer?.enabled === true;

  const form = useForm<ListingStep1Form>({
    resolver: zodResolver(listingStep1Schema),
    defaultValues: {
      deal_type: initialDealType,
      brand: data.brand || "",
      model: data.model || "",
      year: data.year || new Date().getFullYear(),
      km: typeof data.km === "number" ? data.km : typeof data.mileage === "number" ? data.mileage : 0,
      body: (data.body as any) || "",
      fuel: (data.fuel as any) || "",
      gearbox: (data.gearbox as any) || "",
      description: data.description || "",

      purchase_price_chf:
        initialDealType === "direct_purchase"
          ? (typeof data.price_per_month_chf === "number" ? data.price_per_month_chf : undefined)
          : undefined,

      takeover_rate_chf:
        initialDealType === "lease_takeover"
          ? (typeof data.price_per_month_chf === "number" ? data.price_per_month_chf : undefined)
          : undefined,
      contract_end_date: undefined,
      remaining_months: data.remaining_months || 12,
      deposit_chf: toNumberOrUndefined(data.deposit_chf) ?? 0,
      remaining_km: toNumberOrUndefined(data.remaining_km) ?? 0,
      canton_code: data.canton_code ?? undefined,

      leasing_enabled: leasingEnabledInitial,
      interest_rate_pct: toNumberOrUndefined(existingOffer?.interest_rate_pct) ?? 4.9,
      down_payment_pct: toNumberOrUndefined(existingOffer?.down_payment_pct) ?? 10,
      no_down_payment: existingOffer?.no_down_payment ?? false,
      min_term_months: toNumberOrUndefined(existingOffer?.min_term_months) ?? 24,
      max_term_months: toNumberOrUndefined(existingOffer?.max_term_months) ?? 60,
    },
    mode: "onBlur",
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
  } = form;

  const dealType = watch("deal_type");
  const selectedMake = watch("brand");
  const leasingEnabled = watch("leasing_enabled");
  const noDownPayment = watch("no_down_payment");

  useEffect(() => {
    if (!isGarage) {
      setValue("leasing_enabled", false, { shouldValidate: false });
    }
  }, [isGarage, setValue]);

  useEffect(() => {
    if (dealType === "lease_takeover") {
      setValue("leasing_enabled", false, { shouldValidate: false });
    }
  }, [dealType, setValue]);

  useEffect(() => {
    if (!isGarage) return;
    if (dealType !== "direct_purchase") return;

    if (noDownPayment) {
      setValue("down_payment_pct", 0, { shouldValidate: true });
    }
  }, [dealType, isGarage, noDownPayment, setValue]);

  useEffect(() => {
    updateData({
      deal_type: dealType ?? "direct_purchase",
      brand: watch("brand") || "",
      model: watch("model") || "",
      year: watch("year"),
      km: watch("km"),
      body: watch("body") || "",
      fuel: watch("fuel") || "",
      gearbox: watch("gearbox") || "",
      description: watch("description") || "",
      canton_code: watch("canton_code"),
      remaining_months: watch("remaining_months"),
      remaining_km: watch("remaining_km") as any,
      deposit_chf: watch("deposit_chf") as any,
      price_per_month_chf:
        dealType === "lease_takeover"
          ? (watch("takeover_rate_chf") as any) ?? 0
          : (watch("purchase_price_chf") as any) ?? 0,
      financing_type:
        dealType === "direct_purchase"
          ? isGarage && leasingEnabled
            ? "leasing"
            : "cash"
          : null,
      leasing_offer:
        dealType === "direct_purchase" && isGarage && leasingEnabled
          ? ({
              enabled: true,
              interest_rate_pct: Number(watch("interest_rate_pct")),
              down_payment_pct: noDownPayment ? 0 : Number(watch("down_payment_pct")),
              no_down_payment: noDownPayment,
              min_term_months: Math.floor(Number(watch("min_term_months"))),
              max_term_months: Math.floor(Number(watch("max_term_months"))),
              km_options: DEFAULT_KM_OPTIONS,
            } satisfies LeasingOffer)
          : null,
    } as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealType, isGarage, leasingEnabled, noDownPayment]);

  useEffect(() => {
    const loadMakes = async () => {
      try {
        setLoadingMakes(true);
        const nextMakes = await fetchMakes();
        setMakes(nextMakes);
      } catch {
        toast({
          title: "Fehler",
          description: "Fehler beim Laden der Fahrzeugmarken.",
          variant: "destructive",
        });
      } finally {
        setLoadingMakes(false);
      }
    };
    void loadMakes();
  }, [toast]);

  useEffect(() => {
    const loadModels = async () => {
      if (!selectedMake) {
        setModels([]);
        return;
      }

      try {
        setLoadingModels(true);
        const nextModels = await fetchModelsForMake(selectedMake);
        setModels(nextModels);
      } catch {
        toast({
          title: "Fehler",
          description: "Fehler beim Laden der Fahrzeugmodelle.",
          variant: "destructive",
        });
      } finally {
        setLoadingModels(false);
      }
    };
    void loadModels();
  }, [selectedMake, toast]);

  useEffect(() => {
    const run = async () => {
      if (!makeSearch) {
        const nextMakes = await fetchMakes();
        setMakes(nextMakes);
        return;
      }
      try {
        const next = await searchMakes(makeSearch);
        setMakes(next);
      } catch {
        return;
      }
    };

    const timeoutId = setTimeout(() => void run(), 300);
    return () => clearTimeout(timeoutId);
  }, [makeSearch]);

  useEffect(() => {
    const run = async () => {
      if (!selectedMake) return;

      if (!modelSearch) {
        const nextModels = await fetchModelsForMake(selectedMake);
        setModels(nextModels);
        return;
      }

      try {
        const next = await searchModelsForMake(selectedMake, modelSearch);
        setModels(next);
      } catch {
        return;
      }
    };

    const timeoutId = setTimeout(() => void run(), 300);
    return () => clearTimeout(timeoutId);
  }, [modelSearch, selectedMake]);

  const onSubmit = async (values: ListingStep1Form) => {
    if (!user) {
      toast({
        title: "Nicht angemeldet",
        description: "Sie müssen angemeldet sein, um ein Inserat zu erstellen.",
        variant: "destructive",
      });
      return;
    }

    if (profileLoading) return;

    setIsSubmitting(true);
    try {
      const nextDealType = values.deal_type as DealType;

      const generatedTitle = `${values.brand} ${values.model} ${values.year}`;

      const payload: ListingUpdatePayload = {
        id: data.id ?? undefined,
        deal_type: nextDealType,
        brand: values.brand,
        model: values.model,
        year: Number(values.year),
        mileage_km: Number(values.km),
        fuel: values.fuel,
        gearbox: values.gearbox,
        body: values.body,
        description: values.description || undefined,
        title: generatedTitle,
      };

      if (nextDealType === "lease_takeover") {
        payload.financing_type = null;
        payload.leasing_offer = null;

        payload.price_per_month_chf = Math.round(Number(values.takeover_rate_chf));
        payload.remaining_months = Math.floor(Number(values.remaining_months));
        payload.deposit_chf = values.deposit_chf !== undefined ? Math.round(Number(values.deposit_chf)) : null;
        payload.remaining_km = values.remaining_km !== undefined ? Math.round(Number(values.remaining_km)) : null;

        payload.canton_code = values.canton_code;
        payload.location = values.canton_code;
      } else {
        payload.price_per_month_chf = Math.round(Number(values.purchase_price_chf));

        const allowLeasingOffer = isGarage === true && values.leasing_enabled === true;

        if (allowLeasingOffer) {
          payload.financing_type = "leasing";
          payload.leasing_offer = {
            enabled: true,
            interest_rate_pct: Number(values.interest_rate_pct),
            down_payment_pct: values.no_down_payment ? 0 : Number(values.down_payment_pct),
            no_down_payment: values.no_down_payment === true,
            min_term_months: Math.floor(Number(values.min_term_months)),
            max_term_months: Math.floor(Number(values.max_term_months)),
            km_options: DEFAULT_KM_OPTIONS,
          };
        } else {
          payload.financing_type = "cash";
          payload.leasing_offer = null;
        }
      }

      const result = await createOrUpdateListing(payload, user);

      updateData({
        ...payload,
        id: result.id,
      } as any);

      toast({
        title: "Gespeichert",
        description: "Deine Angaben wurden gespeichert.",
      });

      if (draftId) {
        try {
          await deleteListingDraft({ user, draftId });
        } catch {
          return;
        }
        setDraftId(null);
        const nextQuery = { ...router.query };
        delete nextQuery.draft;
        await router.replace({ pathname: router.pathname, query: nextQuery }, undefined, { shallow: true });
      }

      nextStep();
    } catch (error) {
      console.error("Error submitting step 1:", error);
      toast({
        title: "Fehler",
        description: "Bitte versuche es erneut.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextLabel = isGarage ? "Weiter zu Fotos" : "Weiter zu Plan-Auswahl";

  if (profileLoading) {
    return <div className="text-sm text-neutral-600">Lade Profil...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-light text-neutral-900 mb-2 tracking-tight">Fahrzeugdaten</h2>
        <p className="text-neutral-600 font-light leading-relaxed">Fahrzeug & Finanzierung in einem Schritt</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <VehicleBasicsSection
          register={register}
          setValue={setValue}
          trigger={trigger}
          watch={watch}
          errors={errors}
          makes={makes}
          models={models}
          loadingMakes={loadingMakes}
          loadingModels={loadingModels}
          makeOpen={makeOpen}
          setMakeOpen={setMakeOpen}
          modelOpen={modelOpen}
          setModelOpen={setModelOpen}
          makeSearch={makeSearch}
          setMakeSearch={setMakeSearch}
          modelSearch={modelSearch}
          setModelSearch={setModelSearch}
        />

        <FinancingDetailsSection
          dealType={dealType as DealType}
          isGarage={isGarage}
          register={register}
          setValue={setValue}
          trigger={trigger}
          watch={watch}
          errors={errors}
        />

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg shadow-sm transition-all duration-200 hover:shadow-md disabled:opacity-50"
          >
            {isSubmitting ? "Wird gespeichert..." : nextLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}