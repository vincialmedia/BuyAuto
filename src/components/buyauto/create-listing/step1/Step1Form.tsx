import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useWizard } from "../ListingWizard";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

import { supabase } from "@/integrations/supabase/client";
import { createOrUpdateListing, type ListingUpdatePayload } from "@/services/createListingService";
import { createListingDraft, updateListingDraft } from "@/services/listingDraftService";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VehicleBasicsSection, type CanonicalOption, type VehicleStepFormValues } from "./VehicleBasicsSection";
import type { DealType, FinancingType, ListingData } from "@/lib/buyauto/types";

const vehicleStepSchema = z.object({
  vin: z
    .string()
    .min(17, "VIN muss 17 Zeichen haben")
    .max(17, "VIN muss 17 Zeichen haben")
    .regex(/^[A-Z0-9]{17}$/, "VIN muss 17 Zeichen (A-Z, 0-9) haben"),

  make_id: z.string().min(1, "Marke ist erforderlich"),
  model_id: z.string().min(1, "Modell ist erforderlich"),
  variant_id: z.string().min(1, "Variante ist erforderlich"),

  year: z.number().int().min(1900, "Bitte ein gültiges Jahr eingeben"),
  km: z.number().int().min(0, "Kilometerstand ist erforderlich"),

  fuel: z.string().min(1, "Treibstoff ist erforderlich"),
  gearbox: z.string().min(1, "Getriebe ist erforderlich"),
  body: z.string().min(1, "Karosserie ist erforderlich"),

  location: z.string().min(1, "Standort ist erforderlich"),

  power_hp: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z
      .number()
      .int()
      .min(1, "Leistung ist erforderlich")
      .max(2000, "Bitte eine gültige Leistung eingeben")
  ),

  drivetrain: z.string().min(1, "Antrieb ist erforderlich"),

  first_registration: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Bitte im Format YYYY-MM")
    .nullable()
    .optional(),

  description: z.string().max(2000, "Maximal 2000 Zeichen").optional(),
});

type VinDecodeResponse = {
  vin: string;
  make_id: string | null;
  model_id: string | null;
  variant_id: string | null;

  year?: number | null;
  fuel?: string | null;
  transmission?: string | null;
  drivetrain?: string | null;
  power_hp?: number | null;
  body_type?: string | null;
  first_registration?: string | null;

  cached?: boolean;
};

async function fetchJson<T>(url: string): Promise<T> {
  const resp = await fetch(url, { method: "GET" });
  if (!resp.ok) throw new Error(`Request failed: ${resp.status}`);
  return (await resp.json()) as T;
}

function isEmptyValue(v: unknown): boolean {
  if (v == null) return true;
  if (typeof v === "string") return v.trim().length === 0;
  return false;
}

export function Step1Form() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, profileLoading } = useAuth();

  const { data, updateData, nextStep, draftId, setDraftId, registerDraftSnapshotter } = useWizard();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [vinInput, setVinInput] = useState<string>(typeof (data as any)?.vin === "string" ? (data as any).vin : "");
  const [vinLoading, setVinLoading] = useState(false);
  const [vinStatus, setVinStatus] = useState<"idle" | "loading" | "success" | "error">(
    typeof (data as any)?.vin === "string" && (data as any)?.make_id && (data as any)?.model_id
      ? "success"
      : "idle"
  );
  const [vinError, setVinError] = useState<string | null>(null);

  const [makes, setMakes] = useState<CanonicalOption[]>([]);
  const [models, setModels] = useState<CanonicalOption[]>([]);
  const [variants, setVariants] = useState<CanonicalOption[]>([]);

  const [loadingMakes, setLoadingMakes] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingVariants, setLoadingVariants] = useState(false);

  const [pendingModelId, setPendingModelId] = useState<string | null>(null);
  const [pendingVariantId, setPendingVariantId] = useState<string | null>(null);

  const defaultYear = useMemo(() => {
    return typeof data.year === "number" && Number.isFinite(data.year) ? data.year : new Date().getFullYear();
  }, [data.year]);

  const form = useForm<VehicleStepFormValues>({
    resolver: zodResolver(vehicleStepSchema),
    defaultValues: {
      vin: (data as any).vin || "",

      make_id: (data as any).make_id || "",
      model_id: (data as any).model_id || "",
      variant_id: (data as any).variant_id || "",

      year: typeof data.year === "number" ? data.year : defaultYear,
      km: typeof data.km === "number" ? data.km : typeof (data as any).mileage === "number" ? (data as any).mileage : 0,

      fuel: (data as any).fuel || "",
      gearbox: (data as any).gearbox || "",
      body: (data as any).body || "",

      location: (data as any).location || "",

      power_hp: typeof (data as any).power_hp === "number" ? (data as any).power_hp : undefined,
      drivetrain: typeof (data as any).drivetrain === "string" ? (data as any).drivetrain : "",
      first_registration: typeof (data as any).first_registration === "string" ? (data as any).first_registration : null,

      description: data.description || "",
    },
    mode: "onBlur",
  });

  const initialValuesRef = useRef<VehicleStepFormValues | null>(null);
  if (!initialValuesRef.current) {
    initialValuesRef.current = form.getValues();
  }

  const {
    register,
    handleSubmit,
    formState: { errors, dirtyFields },
    setValue,
    watch,
    trigger,
    getValues,
  } = form;

  const selectedMakeId = watch("make_id");
  const selectedModelId = watch("model_id");

  const selectedMake = useMemo(() => makes.find((m) => m.id === selectedMakeId) ?? null, [makes, selectedMakeId]);
  const selectedModel = useMemo(() => models.find((m) => m.id === selectedModelId) ?? null, [models, selectedModelId]);
  const selectedVariant = useMemo(() => variants.find((v) => v.id === watch("variant_id")) ?? null, [variants, watch]);

  const isVinReady = vinStatus === "success";
  const fieldsDisabled = !isVinReady;

  useEffect(() => {
    const loadMakes = async () => {
      try {
        setLoadingMakes(true);
        const res = await fetchJson<{ makes: CanonicalOption[] }>("/api/vehicles/makes");
        setMakes(res.makes ?? []);
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
      if (!selectedMakeId) {
        setModels([]);
        setVariants([]);
        return;
      }

      try {
        setLoadingModels(true);
        const res = await fetchJson<{ models: CanonicalOption[] }>(`/api/vehicles/models?make_id=${encodeURIComponent(selectedMakeId)}`);
        setModels(res.models ?? []);
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
  }, [selectedMakeId, toast]);

  useEffect(() => {
    const loadVariants = async () => {
      if (!selectedModelId) {
        setVariants([]);
        return;
      }

      try {
        setLoadingVariants(true);
        const res = await fetchJson<{ variants: CanonicalOption[] }>(
          `/api/vehicles/variants?model_id=${encodeURIComponent(selectedModelId)}`
        );
        setVariants(res.variants ?? []);
      } catch {
        toast({
          title: "Fehler",
          description: "Fehler beim Laden der Varianten.",
          variant: "destructive",
        });
      } finally {
        setLoadingVariants(false);
      }
    };

    void loadVariants();
  }, [selectedModelId, toast]);

  useEffect(() => {
    if (!pendingModelId) return;
    if (!selectedMakeId) return;

    const exists = models.some((m) => m.id === pendingModelId);
    if (!exists) return;

    if (!shouldAutofill("model_id")) {
      setPendingModelId(null);
      return;
    }

    setValue("model_id", pendingModelId, { shouldValidate: true });
    setValue("variant_id", "", { shouldValidate: false });
    setPendingModelId(null);
  }, [models, pendingModelId, selectedMakeId, setValue]);

  useEffect(() => {
    if (!pendingVariantId) return;
    if (!selectedModelId) return;

    const exists = variants.some((v) => v.id === pendingVariantId);
    if (!exists) return;

    if (!shouldAutofill("variant_id")) {
      setPendingVariantId(null);
      return;
    }

    setValue("variant_id", pendingVariantId, { shouldValidate: true });
    setPendingVariantId(null);
  }, [pendingVariantId, selectedModelId, setValue, variants]);

  const shouldAutofill = (field: keyof VehicleStepFormValues): boolean => {
    const dirty = (dirtyFields as any)?.[field] === true;
    if (dirty) return false;

    const current = getValues(field);
    const initial = initialValuesRef.current ? (initialValuesRef.current as any)[field] : undefined;

    if (field === "km" || field === "power_hp") {
      const c = typeof current === "number" ? current : Number(current);
      const i = typeof initial === "number" ? initial : Number(initial);
      const isCurrentEmpty = !Number.isFinite(c) || c === 0 || c === null;
      if (isCurrentEmpty) return true;
      return Number.isFinite(i) && c === i;
    }

    if (field === "year") {
      const c = typeof current === "number" ? current : Number(current);
      const i = typeof initial === "number" ? initial : Number(initial);
      if (!Number.isFinite(c)) return true;
      return Number.isFinite(i) && c === i;
    }

    if (isEmptyValue(current)) return true;
    return current === initial;
  };

  const applyVinAutofill = (payload: VinDecodeResponse, vin: string) => {
    setValue("vin", vin, { shouldValidate: true, shouldDirty: true });

    if (payload.make_id) {
      setValue("make_id", payload.make_id, { shouldValidate: true });
      setValue("model_id", "", { shouldValidate: false });
      setValue("variant_id", "", { shouldValidate: false });

      setPendingModelId(payload.model_id ?? null);
      setPendingVariantId(payload.variant_id ?? null);
    } else {
      if (payload.model_id) setPendingModelId(payload.model_id);
      if (payload.variant_id) setPendingVariantId(payload.variant_id);
    }

    if (typeof payload.year === "number" && Number.isFinite(payload.year)) {
      setValue("year", payload.year, { shouldValidate: true });
    }

    if (typeof payload.power_hp === "number" && Number.isFinite(payload.power_hp)) {
      setValue("power_hp", Math.round(payload.power_hp), { shouldValidate: true });
    }

    if (payload.fuel) {
      setValue("fuel", payload.fuel, { shouldValidate: true });
    }

    if (payload.transmission) {
      setValue("gearbox", payload.transmission, { shouldValidate: true });
    }

    if (payload.body_type) {
      setValue("body", payload.body_type, { shouldValidate: true });
    }

    if (payload.drivetrain) {
      setValue("drivetrain", payload.drivetrain, { shouldValidate: true });
    }

    if (payload.first_registration) {
      setValue("first_registration", payload.first_registration, { shouldValidate: true });
    }
  };

  const onDecodeVin = async () => {
    if (!user) {
      toast({
        title: "Bitte anmelden",
        description: "Um ein Inserat zu erstellen, musst du eingeloggt sein.",
        variant: "destructive",
      });
      return;
    }

    const vin = vinInput.trim().toUpperCase();
    setVinInput(vin);
    setVinError(null);

    if (!vin) {
      setVinStatus("error");
      setVinError("Bitte gib deine VIN ein.");
      toast({
        title: "VIN fehlt",
        description: "Bitte gib die VIN (17 Zeichen) ein.",
        variant: "destructive",
      });
      return;
    }

    if (!/^[A-Z0-9]{17}$/.test(vin)) {
      setVinStatus("error");
      setVinError("VIN muss 17 Zeichen (A-Z, 0-9) haben.");
      toast({
        title: "Ungültige VIN",
        description: "Die VIN muss genau 17 Zeichen haben (A–Z, 0–9).",
        variant: "destructive",
      });
      return;
    }

    setVinLoading(true);
    setVinStatus("loading");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        setVinStatus("error");
        setVinError("Bitte melde dich erneut an.");
        toast({
          title: "Nicht angemeldet",
          description: "Bitte melde dich erneut an.",
          variant: "destructive",
        });
        return;
      }

      const resp = await fetch("/api/vehicles/decode-vin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ vin }),
      });

      const json = (await resp.json()) as VinDecodeResponse & { error?: string; message?: string };

      if (!resp.ok) {
        const msg = json?.message || json?.error || "Bitte prüfe die VIN und versuche es erneut.";
        setVinStatus("error");
        setVinError(msg);

        toast({
          title: "VIN Decode fehlgeschlagen",
          description: msg,
          variant: "destructive",
        });
        return;
      }

      applyVinAutofill(json, vin);

      setVinStatus("success");
      setVinError(null);

      toast({
        title: "Fahrzeugdaten geladen",
        description: json.cached ? "VIN-Daten aus dem Cache geladen." : "VIN-Daten erfolgreich geladen.",
      });

      if (!json.make_id || !json.model_id) {
        setVinStatus("error");
        setVinError("Die VIN konnte nicht eindeutig auf Marke/Modell gemappt werden. Bitte kontaktiere den Support.");
        return;
      }

      if (!json.variant_id) {
        toast({
          title: "Variante fehlt",
          description: "Bitte wähle jetzt eine Variante aus, bevor du weitergehst.",
          variant: "destructive",
        });
      }
    } catch {
      setVinStatus("error");
      setVinError("VIN-Daten konnten nicht geladen werden.");
      toast({
        title: "Fehler",
        description: "VIN-Daten konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setVinLoading(false);
    }
  };

  useEffect(() => {
    registerDraftSnapshotter(() => {
      const values = getValues();

      const makeName = makes.find((m) => m.id === values.make_id)?.name ?? "";
      const modelName = models.find((m) => m.id === values.model_id)?.name ?? "";
      const variantName = variants.find((v) => v.id === values.variant_id)?.name ?? "";

      const title = makeName ? `${makeName} ${variantName || modelName}`.trim() : (data as any)?.title;

      return {
        ...values,
        brand: makeName || (data as any)?.brand,
        model: modelName || (data as any)?.model,
        title,
      } as any;
    });

    return () => {
      registerDraftSnapshotter(() => ({}));
    };
  }, [data, getValues, makes, models, registerDraftSnapshotter, variants]);

  useEffect(() => {
    const values = getValues();
    updateData(values as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (values: VehicleStepFormValues) => {
    if (!user) {
      toast({
        title: "Bitte anmelden",
        description: "Um ein Inserat zu erstellen, musst du eingeloggt sein.",
        variant: "destructive",
      });
      return;
    }

    if (profileLoading) return;

    if (vinStatus !== "success") {
      toast({
        title: "VIN erforderlich",
        description: "Bitte zuerst die VIN eingeben und „Daten laden“ klicken.",
        variant: "destructive",
      });
      return;
    }

    if (!values.vin || !/^[A-Z0-9]{17}$/.test(values.vin)) {
      toast({
        title: "Ungültige VIN",
        description: "Bitte lade die Fahrzeugdaten erneut über die VIN.",
        variant: "destructive",
      });
      return;
    }

    if (!values.make_id || !values.model_id) {
      toast({
        title: "Fahrzeugdaten fehlen",
        description: "Bitte VIN erneut laden.",
        variant: "destructive",
      });
      return;
    }

    if (!values.variant_id) {
      toast({
        title: "Variante fehlt",
        description: "Bitte eine Variante auswählen.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const makeName = makes.find((m) => m.id === values.make_id)?.name ?? "";
      const modelName = models.find((m) => m.id === values.model_id)?.name ?? "";
      const variantName = variants.find((v) => v.id === values.variant_id)?.name ?? "";

      const generatedTitle = `${makeName} ${variantName || modelName}`.trim();
      const isNewListing = !(data as any).id;

      const nextDealType: DealType = (data as any).deal_type === "lease_takeover" ? "lease_takeover" : "direct_purchase";
      const nextFinancingType: FinancingType | null = nextDealType === "lease_takeover" ? null : ((data as any).financing_type ?? "cash");

      updateData({
        ...values,
        vin: values.vin,

        deal_type: nextDealType,
        financing_type: nextFinancingType,
        leasing_offer: nextDealType === "lease_takeover" ? null : (data as any).leasing_offer,

        make_id: values.make_id,
        model_id: values.model_id,
        variant_id: values.variant_id,

        brand: makeName,
        model: modelName,
        title: generatedTitle,

        year: Number(values.year),
        km: Number(values.km),
        fuel: values.fuel,
        gearbox: values.gearbox,
        body: values.body,
        location: values.location,
        power_hp: typeof values.power_hp === "number" && Number.isFinite(values.power_hp) ? Number(values.power_hp) : null,
        drivetrain: values.drivetrain,
        first_registration: values.first_registration ?? null,
        description: values.description || "",
      } as any);

      if (isNewListing) {
        const nextDraftData: Partial<ListingData> = {
          ...(data as any),
          vin: values.vin,

          deal_type: nextDealType,
          financing_type: nextFinancingType,
          leasing_offer: nextDealType === "lease_takeover" ? null : (data as any).leasing_offer,

          make_id: values.make_id as any,
          model_id: values.model_id as any,
          variant_id: values.variant_id as any,

          brand: makeName as any,
          model: modelName as any,

          year: Number(values.year) as any,
          km: Number(values.km) as any,
          fuel: values.fuel as any,
          gearbox: values.gearbox as any,
          body: values.body as any,
          location: values.location as any,
          title: generatedTitle as any,

          power_hp: typeof values.power_hp === "number" && Number.isFinite(values.power_hp) ? Math.round(Number(values.power_hp)) : null,
          drivetrain: values.drivetrain as any,
          first_registration: values.first_registration ?? null,

          description: values.description || "",
        };

        try {
          if (!draftId) {
            const created = await createListingDraft({ user, data: nextDraftData });
            setDraftId(created.id);
            await router.replace({ pathname: router.pathname, query: { ...router.query, draft: created.id } }, undefined, { shallow: true });
          } else {
            await updateListingDraft({ user, draftId, data: nextDraftData });
          }
        } catch {
          // Best-effort only
        }

        toast({
          title: "Gespeichert",
          description: "Fahrzeugdaten wurden gespeichert.",
        });

        nextStep();
        return;
      }

      const payload: ListingUpdatePayload = {
        id: (data as any).id ?? undefined,
        deal_type: nextDealType,
        financing_type: nextFinancingType,
        leasing_offer: nextDealType === "lease_takeover" ? null : ((data as any).leasing_offer ?? null),

        vin: values.vin,
        make_id: values.make_id as any,
        model_id: values.model_id as any,
        variant_id: values.variant_id as any,

        brand: makeName,
        model: modelName,
        year: Number(values.year),
        mileage_km: Number(values.km),
        fuel: values.fuel,
        gearbox: values.gearbox,
        body: values.body,
        location: values.location,
        power_hp: typeof values.power_hp === "number" && Number.isFinite(values.power_hp) ? Math.round(Number(values.power_hp)) : null,
        drivetrain: values.drivetrain,
        first_registration: values.first_registration ?? null,
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
          await updateListingDraft({ user, draftId, data: { ...(data as any), ...payload } });
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

  const canProceed = isVinReady && Boolean(watch("make_id")) && Boolean(watch("model_id")) && Boolean(watch("variant_id"));

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-light text-neutral-900 mb-2 tracking-tight">Fahrzeugdaten</h2>
        <p className="text-neutral-600 font-light leading-relaxed">Wir laden die Fahrzeugdaten per VIN – danach kannst du alles prüfen.</p>
      </div>

      <div className="rounded-3xl border border-primary/25 bg-gradient-to-r from-primary/10 to-primary/5 p-4 md:p-6 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
          <div className="space-y-2">
            <div className="text-sm font-medium text-neutral-900">VIN (Fahrgestellnummer) *</div>
            <Input
              value={vinInput}
              onChange={(e) => setVinInput(e.target.value)}
              placeholder="z.B. WBA... (17 Zeichen)"
              className="uppercase bg-white border border-primary/30 hover:border-primary/50 focus:border-primary transition-colors shadow-sm h-12 text-base rounded-2xl"
              autoComplete="off"
              inputMode="text"
            />
            <div className="text-xs text-neutral-700/80 font-light">
              Pflichtfeld – wir laden die Fahrzeugdaten automatisch.
            </div>
            {vinError ? <div className="text-sm text-red-600">{vinError}</div> : null}
          </div>

          <Button type="button" onClick={onDecodeVin} disabled={vinLoading} className="rounded-2xl h-12 px-6">
            {vinLoading ? "Lade..." : "Daten laden"}
          </Button>
        </div>
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
          variants={variants}
          loadingMakes={loadingMakes}
          loadingModels={loadingModels}
          loadingVariants={loadingVariants}
          disableAllFields={fieldsDisabled}
          lockMakeModel={isVinReady}
        />

        <div className="flex items-center justify-between pt-2">
          <Button type="button" variant="outline" onClick={onBack} className="rounded-2xl">
            Zurück
          </Button>
          <Button type="submit" className="rounded-2xl" disabled={isSubmitting || !canProceed}>
            {isSubmitting ? "Speichern..." : "Weiter zu Finanzierungsdetails"}
          </Button>
        </div>

        {!canProceed ? (
          <div className="text-sm text-neutral-600">
            {isVinReady ? "Bitte wähle eine Variante aus, bevor du weitergehst." : "Bitte zuerst VIN eingeben und Daten laden."}
          </div>
        ) : null}
      </form>
    </div>
  );
}

function LabelVin() {
  return <div className="text-sm font-medium text-neutral-700">VIN (optional)</div>;
}