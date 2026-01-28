import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useWizard } from "../ListingWizard";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { createOrUpdateListing, type ListingUpdatePayload } from "@/services/createListingService";
import { createListingDraft, deleteListingDraft, updateListingDraft } from "@/services/listingDraftService";
import { fetchMakes, fetchModelsForMake, searchMakes, searchModelsForMake } from "@/services/vehicleService";

import { Button } from "@/components/ui/button";
import { VehicleBasicsSection, type VehicleStepFormValues } from "./VehicleBasicsSection";
import type { DealType, FinancingType, ListingData } from "@/lib/buyauto/types";

const vehicleStepSchema = z.object({
  brand: z.string().min(1, "Marke ist erforderlich"),
  model: z.string().min(1, "Modell ist erforderlich"),
  year: z.number().int().min(1900, "Bitte ein gültiges Jahr eingeben"),
  km: z.number().int().min(0, "Kilometerstand ist erforderlich"),
  gearbox: z.string().min(1, "Getriebe ist erforderlich"),
  body: z.string().min(1, "Karosserie ist erforderlich"),
  fuel: z.string().min(1, "Antrieb ist erforderlich"),
  description: z.string().max(2000, "Maximal 2000 Zeichen").optional(),
});

export function Step1Form() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, profileLoading } = useAuth();

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

  const defaultYear = useMemo(() => {
    return typeof data.year === "number" && Number.isFinite(data.year) ? data.year : new Date().getFullYear();
  }, [data.year]);

  const form = useForm<VehicleStepFormValues>({
    resolver: zodResolver(vehicleStepSchema),
    defaultValues: {
      brand: data.brand || "",
      model: data.model || "",
      year: defaultYear,
      km: typeof data.km === "number" ? data.km : typeof (data as any).mileage === "number" ? (data as any).mileage : 0,
      body: (data.body as any) || "",
      fuel: (data.fuel as any) || "",
      gearbox: (data.gearbox as any) || "",
      description: data.description || "",
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

  const selectedMake = watch("brand");

  useEffect(() => {
    updateData({
      brand: watch("brand") || "",
      model: watch("model") || "",
      year: watch("year"),
      km: watch("km"),
      body: watch("body") || "",
      fuel: watch("fuel") || "",
      gearbox: watch("gearbox") || "",
      description: watch("description") || "",
    } as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const onSubmit = async (values: VehicleStepFormValues) => {
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
      const generatedTitle = `${values.brand} ${values.model} ${values.year}`;
      const isNewListing = !data.id;

      const nextDealType: DealType = data.deal_type === "lease_takeover" ? "lease_takeover" : "direct_purchase";
      const nextFinancingType: FinancingType | null = nextDealType === "lease_takeover" ? null : (data.financing_type ?? "cash");

      // Always keep wizard state in sync
      updateData({
        deal_type: nextDealType,
        financing_type: nextFinancingType,
        leasing_offer: nextDealType === "lease_takeover" ? null : data.leasing_offer,
        brand: values.brand,
        model: values.model,
        year: Number(values.year),
        km: Number(values.km),
        fuel: values.fuel,
        gearbox: values.gearbox,
        body: values.body,
        description: values.description || "",
        title: generatedTitle,
      } as any);

      // ✅ NEW LISTINGS: don't insert into public.listings yet (can violate DB constraints)
      // Persist to listing_drafts (best-effort), then continue to Step 2 where financing details exist.
      if (isNewListing) {
        const nextDraftData: Partial<ListingData> = {
          ...data,
          deal_type: nextDealType,
          financing_type: nextFinancingType,
          leasing_offer: nextDealType === "lease_takeover" ? null : (data as any).leasing_offer,
          brand: values.brand,
          model: values.model,
          year: Number(values.year),
          km: Number(values.km),
          fuel: values.fuel,
          gearbox: values.gearbox,
          body: values.body,
          description: values.description || "",
          title: generatedTitle,
        };

        try {
          if (!draftId) {
            const created = await createListingDraft({ user, data: nextDraftData });
            setDraftId(created.id);
            await router.replace(
              { pathname: router.pathname, query: { ...router.query, draft: created.id } },
              undefined,
              { shallow: true }
            );
          } else {
            await updateListingDraft({ user, draftId, data: nextDraftData });
          }
        } catch {
          // Best-effort only: user can still continue; manual "Speichern (Entwurf)" remains available.
        }

        toast({
          title: "Gespeichert",
          description: "Fahrzeugdaten wurden gespeichert.",
        });

        nextStep();
        return;
      }

      // ✅ EDIT EXISTING LISTING: update listing row
      const payload: ListingUpdatePayload = {
        id: data.id ?? undefined,
        deal_type: nextDealType,
        financing_type: nextFinancingType,
        leasing_offer: nextDealType === "lease_takeover" ? null : ((data as any).leasing_offer ?? null),
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

      const result = await createOrUpdateListing(payload, user);

      updateData({
        ...payload,
        id: result.id,
      } as any);

      toast({
        title: "Gespeichert",
        description: "Fahrzeugdaten wurden gespeichert.",
      });

      if (draftId) {
        try {
          await updateListingDraft({ user, draftId, data: { ...data, ...payload } });
        } catch {
          setIsSubmitting(false);
          return;
        }
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

  const onBack = () => {
    router.back();
  };

  if (profileLoading) {
    return <div className="text-sm text-neutral-600">Lade Profil...</div>;
  }

  const dealTypeValue = data.deal_type === "lease_takeover" ? "lease_takeover" : "direct_purchase";

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h2 className="text-2xl font-light text-neutral-900 tracking-tight">Inserat-Typ</h2>
        <p className="text-neutral-600 font-light">Wähle, ob du einen Direktkauf oder eine Leasingübernahme anbieten möchtest.</p>

        <RadioGroup
          value={dealTypeValue}
          onValueChange={(value) => {
            if (value === "lease_takeover") {
              updateData({
                deal_type: "lease_takeover",
                financing_type: null,
                leasing_offer: null,
              });
              return;
            }

            updateData({
              deal_type: "direct_purchase",
              financing_type: data.financing_type ?? "cash",
            });
          }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          <label className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm hover:shadow-md transition-all cursor-pointer">
            <RadioGroupItem value="direct_purchase" className="mt-1" />
            <span className="space-y-1">
              <span className="block text-sm font-medium text-neutral-900">Direktkauf</span>
              <span className="block text-sm text-neutral-600">Kaufpreis angeben. Optional (Garage): Leasing anbieten.</span>
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm hover:shadow-md transition-all cursor-pointer">
            <RadioGroupItem value="lease_takeover" className="mt-1" />
            <span className="space-y-1">
              <span className="block text-sm font-medium text-neutral-900">Leasingübernahme</span>
              <span className="block text-sm text-neutral-600">Monatsrate & Restlaufzeit angeben.</span>
            </span>
          </label>
        </RadioGroup>
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-light text-neutral-900 mb-2 tracking-tight">Fahrzeugdaten</h2>
        <p className="text-neutral-600 font-light leading-relaxed">Basisdaten zum Fahrzeug</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
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

        <div className="flex items-center justify-between pt-2">
          <Button type="button" variant="outline" onClick={onBack} className="rounded-2xl">
            Zurück
          </Button>
          <Button type="submit" className="rounded-2xl" disabled={isSubmitting}>
            {isSubmitting ? "Speichern..." : "Weiter zu Finanzierungsdetails"}
          </Button>
        </div>
      </form>
    </div>
  );
}