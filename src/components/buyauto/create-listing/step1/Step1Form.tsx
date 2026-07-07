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
import { getMyGarage } from "@/services/garageService";

import { Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VehicleBasicsSection, type CanonicalOption, type VehicleStepFormValues } from "./VehicleBasicsSection";
import type { DealType, FinancingType, ListingData } from "@/lib/buyauto/types";
import { zBody, zFuel, zGearbox, zYear, isCantonCode } from "@/lib/buyauto/listingContract";

const vehicleStepSchema = z.object({
  vin: z
    .string()
    .trim()
    .toUpperCase()
    .refine((v) => v.length === 0 || /^[A-Z0-9]{17}$/.test(v), "VIN muss 17 Zeichen (A-Z, 0-9) haben"),

  make_id: z.string().min(1, "Marke ist erforderlich"),
  model_id: z.string().min(1, "Modell ist erforderlich"),
  variant_id: z.string().optional(),

  year: zYear,
  km: z.number().int().min(0, "Kilometerstand ist erforderlich"),

  fuel: zFuel,
  gearbox: zGearbox,
  body: zBody,

  location: z.string().min(1, "Standort ist erforderlich"),
  canton_code: z.string().refine(isCantonCode, "Bitte wähle deinen Ort aus der Liste, damit der Kanton erkannt wird."),

  power_hp: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z
      .number({ required_error: "Leistung ist erforderlich", invalid_type_error: "Leistung ist erforderlich" })
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

  variant_text?: string | null;
  catalog_confidence?: "high" | "medium" | "low" | null;
  catalog_needs_review?: boolean | null;

  year?: number | null;
  fuel?: string | null;
  transmission?: string | null;
  drivetrain?: string | null;
  power_hp?: number | null;
  body_type?: string | null;
  first_registration?: string | null;

  provider_make?: string | null;
  provider_model?: string | null;
  provider_trim?: string | null;

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
  const { user, profile, profileLoading } = useAuth();
  const isGarage = profile?.role === "garage";
  const isEditingExistingListing = typeof router.query.edit === "string" && router.query.edit.length > 0;

  const { data, updateData, nextStep, draftId, setDraftId, registerDraftSnapshotter } = useWizard();

  const dealTypeFromWizard: DealType | null =
    (data as any)?.deal_type === "lease_takeover"
      ? "lease_takeover"
      : (data as any)?.deal_type === "direct_purchase"
        ? "direct_purchase"
        : null;

  // New listings are always a Direktkauf (the Übernahme is a Step-2 option);
  // lease_takeover only ever arrives here from an existing legacy listing.
  const effectiveDealType: DealType = dealTypeFromWizard ?? "direct_purchase";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const didPrefillLocationRef = useRef(false);

  const [vinInput, setVinInput] = useState<string>(typeof (data as any)?.vin === "string" ? (data as any).vin : "");
  const [vinLoading, setVinLoading] = useState(false);
  const [vinStatus, setVinStatus] = useState<"idle" | "loading" | "success" | "error">(
    typeof (data as any)?.vin === "string" && (data as any)?.make_id && (data as any)?.model_id
      ? "success"
      : "idle"
  );
  const [vinError, setVinError] = useState<string | null>(null);
  const [vinReview, setVinReview] = useState<VinDecodeResponse | null>(null);

  const [makes, setMakes] = useState<CanonicalOption[]>([]);
  const [models, setModels] = useState<CanonicalOption[]>([]);

  const [loadingMakes, setLoadingMakes] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);

  const [pendingModelId, setPendingModelId] = useState<string | null>(null);

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

      year: Number.isFinite(Number(data.year)) && Number(data.year) > 0 ? Number(data.year) : defaultYear,
      km: Number.isFinite(Number(data.km)) ? Number(data.km) : (Number.isFinite(Number((data as any).mileage)) ? Number((data as any).mileage) : 0),

      fuel: (data as any).fuel || "",
      gearbox: (data as any).gearbox || "",
      body: (data as any).body || "",

      location: (data as any).location || "",
      canton_code: (data as any).canton_code || "",

      power_hp: Number.isFinite(Number((data as any).power_hp)) && Number((data as any).power_hp) > 0 ? Number((data as any).power_hp) : undefined,
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
    setError,
  } = form;

  const selectedMakeId = watch("make_id");
  const selectedModelId = watch("model_id");

  const selectedMake = useMemo(() => makes.find((m) => m.id === selectedMakeId) ?? null, [makes, selectedMakeId]);
  const selectedModel = useMemo(() => models.find((m) => m.id === selectedModelId) ?? null, [models, selectedModelId]);

  const isVinReady = vinStatus === "success";
  const fieldsDisabled = false;

  useEffect(() => {
    const loadMakes = async () => {
      try {
        setLoadingMakes(true);
        const res = await fetchJson<any>("/api/vehicles/makes");
        setMakes(Array.isArray(res) ? res : (res?.makes ?? []));
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
        return;
      }

      try {
        setLoadingModels(true);
        const res = await fetchJson<any>(`/api/vehicles/models?make_id=${encodeURIComponent(selectedMakeId)}`);
        setModels(Array.isArray(res) ? res : (res?.models ?? []));
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
    if (!pendingModelId) return;
    if (!selectedMakeId) return;

    const exists = models.some((m) => m.id === pendingModelId);
    if (!exists) return;

    if (!shouldAutofill("model_id")) {
      setPendingModelId(null);
      return;
    }

    setValue("model_id", pendingModelId, { shouldValidate: true });
    setPendingModelId(null);
  }, [models, pendingModelId, selectedMakeId, setValue]);

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
    if (shouldAutofill("vin")) {
      setValue("vin", vin, { shouldValidate: true, shouldDirty: true });
    }

    if (payload.make_id && shouldAutofill("make_id")) {
      setValue("make_id", payload.make_id, { shouldValidate: true });
      setValue("model_id", "", { shouldValidate: false });

      setPendingModelId(payload.model_id ?? null);
    } else {
      if (payload.model_id && shouldAutofill("model_id")) setPendingModelId(payload.model_id);
    }

    if (typeof payload.year === "number" && Number.isFinite(payload.year) && shouldAutofill("year")) {
      setValue("year", payload.year, { shouldValidate: true });
    }

    if (typeof payload.power_hp === "number" && Number.isFinite(payload.power_hp) && shouldAutofill("power_hp")) {
      setValue("power_hp", Math.round(payload.power_hp), { shouldValidate: true });
    }

    if (payload.fuel && shouldAutofill("fuel")) {
      setValue("fuel", payload.fuel, { shouldValidate: true });
    }

    if (payload.transmission && shouldAutofill("gearbox")) {
      setValue("gearbox", payload.transmission, { shouldValidate: true });
    }

    if (payload.body_type && shouldAutofill("body")) {
      setValue("body", payload.body_type, { shouldValidate: true });
    }

    if (payload.drivetrain && shouldAutofill("drivetrain")) {
      setValue("drivetrain", payload.drivetrain, { shouldValidate: true });
    }

    if (payload.first_registration && shouldAutofill("first_registration")) {
      setValue("first_registration", payload.first_registration, { shouldValidate: true });
    }
  };

  const onDecodeVin = async () => {
    const vin = vinInput.trim().toUpperCase();
    setVinInput(vin);
    setValue("vin", vin, { shouldValidate: true, shouldDirty: true });
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
    setVinReview(null);
    try {
      // Auth is optional here: guests may decode too (they get a small per-IP
      // budget server-side); a signed-in session is sent along when present.
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const resp = await fetch("/api/vehicles/decode-vin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ vin }),
      });

      const json = (await resp.json()) as VinDecodeResponse & { error?: string; message?: string };

      const providerPatch = {
        provider_make: json?.provider_make ?? null,
        provider_model: json?.provider_model ?? null,
        provider_trim: json?.provider_trim ?? null,
        variant_text: json?.variant_text ?? null,
        catalog_confidence: json?.catalog_confidence ?? null,
        catalog_needs_review: json?.catalog_needs_review ?? null,
      };

      if (!resp.ok) {
        updateData(providerPatch as any);

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

      updateData(providerPatch as any);

      applyVinAutofill(json, vin);
      setVinReview(json);

      setVinStatus("success");
      setVinError(null);

      toast({
        title: "VIN-Daten geladen",
        description: json.cached ? "VIN-Daten aus dem Cache geladen." : "VIN-Daten erfolgreich geladen.",
      });

      if (!json.make_id || !json.model_id) {
        toast({
          title: "Bitte prüfen",
          description: "Marke/Modell konnten nicht eindeutig bestimmt werden. Bitte wähle sie manuell aus.",
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

      const title = makeName ? `${makeName} ${modelName}`.trim() : (data as any)?.title;

      return {
        ...values,
        provider_make: (data as any)?.provider_make ?? null,
        provider_model: (data as any)?.provider_model ?? null,
        provider_trim: (data as any)?.provider_trim ?? null,
        variant_text: (data as any)?.variant_text ?? null,
        catalog_confidence: (data as any)?.catalog_confidence ?? null,
        catalog_needs_review: (data as any)?.catalog_needs_review ?? null,
        brand: makeName || (data as any)?.brand,
        model: modelName || (data as any)?.model,
        title,
      } as any;
    });

    return () => {
      registerDraftSnapshotter(() => ({}));
    };
  }, [data, getValues, makes, models, registerDraftSnapshotter]);

  useEffect(() => {
    const values = getValues();
    updateData(values as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user) return;
    if (!isGarage) return;
    if (profileLoading) return;
    if (isEditingExistingListing) return;
    if (didPrefillLocationRef.current) return;

    const currentFormLocation = String(getValues("location") ?? "").trim();
    const wizardLocation = typeof (data as any)?.location === "string" ? String((data as any).location).trim() : "";

    if (currentFormLocation.length > 0 || wizardLocation.length > 0) {
      didPrefillLocationRef.current = true;
      return;
    }

    const run = async () => {
      try {
        const garage = await getMyGarage();
        const city = typeof garage?.city === "string" ? garage.city.trim() : "";

        if (!city) {
          didPrefillLocationRef.current = true;
          return;
        }

        setValue("location", city, { shouldValidate: true, shouldDirty: false });
        updateData({ location: city } as any);
        didPrefillLocationRef.current = true;
      } catch {
        didPrefillLocationRef.current = true;
      }
    };

    void run();
  }, [data, getValues, isEditingExistingListing, isGarage, profileLoading, setValue, updateData, user]);

  const onSubmit = async (values: VehicleStepFormValues) => {
    // Deferred login: guests fill the whole wizard and sign in at Step 5
    // (GuestAuthGate). Guests therefore pass through here — they just skip
    // every server write below; the wizard mirrors their state to localStorage.
    if (user && profileLoading) return;
    const isGarageDraftFlow = Boolean(user && isGarage && !isEditingExistingListing);

    const nextDealType: DealType = effectiveDealType;
    const normalizedLocation = String(values.location ?? "").trim();
    if (nextDealType !== "lease_takeover" && normalizedLocation.length === 0) {
      setError("location", { type: "manual", message: "Standort ist erforderlich" });
      toast({
        title: "Standort fehlt",
        description: "Bitte gib den Standort an, um fortzufahren.",
        variant: "destructive",
      });
      return;
    }

    const normalizedVin = (values.vin ?? "").trim().toUpperCase();
    if (normalizedVin.length > 0 && !/^[A-Z0-9]{17}$/.test(normalizedVin)) {
      toast({
        title: "Ungültige VIN",
        description: "Bitte gib eine gültige VIN ein (17 Zeichen) oder lasse das Feld leer.",
        variant: "destructive",
      });
      return;
    }

    if (!values.make_id || !values.model_id) {
      toast({
        title: "Fahrzeugdaten fehlen",
        description: "Bitte wähle mindestens Marke und Modell aus (oder lade sie per VIN).",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const makeName = makes.find((m) => m.id === values.make_id)?.name ?? "";
      const modelName = models.find((m) => m.id === values.model_id)?.name ?? "";

      const generatedTitle = `${makeName} ${modelName}`.trim();
      const isNewListing = !(data as any).id;

      const nextFinancingType: FinancingType | null = nextDealType === "lease_takeover" ? null : ((data as any).financing_type ?? "cash");

      updateData({
        id: isGarageDraftFlow ? undefined : (data as any).id,
        ...values,
        vin: normalizedVin.length > 0 ? normalizedVin : null,

        deal_type: nextDealType,
        financing_type: nextFinancingType,
        leasing_offer: nextDealType === "lease_takeover" ? null : (data as any).leasing_offer,

        make_id: values.make_id,
        model_id: values.model_id,
        variant_id: values.variant_id ? values.variant_id : null,

        brand: makeName,
        model: modelName,
        title: generatedTitle,

        year: Number(values.year),
        km: Number(values.km),
        fuel: values.fuel,
        gearbox: values.gearbox,
        body: values.body,
        location: values.location,
        canton_code: values.canton_code,
        power_hp: typeof values.power_hp === "number" && Number.isFinite(values.power_hp) ? Number(values.power_hp) : null,
        drivetrain: values.drivetrain,
        first_registration: values.first_registration ?? null,
        description: values.description || "",
      } as any);

      if (!user) {
        // Guest: wizard state is updated above and mirrored to localStorage by
        // the wizard itself; drafts/listings are created after sign-in at Step 5.
        nextStep();
        return;
      }

      if (isGarageDraftFlow) {
        const nextDraftData: Partial<ListingData> = {
          ...(data as any),
          vin: normalizedVin.length > 0 ? normalizedVin : null,

          deal_type: nextDealType,
          financing_type: nextFinancingType,
          leasing_offer: nextDealType === "lease_takeover" ? null : (data as any).leasing_offer,

          make_id: values.make_id as any,
          model_id: values.model_id as any,
          variant_id: values.variant_id ? (values.variant_id as any) : null,

          brand: makeName as any,
          model: modelName as any,

          year: Number(values.year) as any,
          km: Number(values.km) as any,
          fuel: values.fuel as any,
          gearbox: values.gearbox as any,
          body: values.body as any,
          location: values.location as any,
          canton_code: values.canton_code as any,
          title: generatedTitle as any,

          power_hp: typeof values.power_hp === "number" && Number.isFinite(values.power_hp) ? Math.round(Number(values.power_hp)) : null,
          drivetrain: values.drivetrain as any,
          first_registration: values.first_registration ?? null,

          description: values.description || "",
        };

        (nextDraftData as any).id = undefined;

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

      if (isNewListing) {
        const nextDraftData: Partial<ListingData> = {
          ...(data as any),
          vin: normalizedVin.length > 0 ? normalizedVin : null,

          deal_type: nextDealType,
          financing_type: nextFinancingType,
          leasing_offer: nextDealType === "lease_takeover" ? null : (data as any).leasing_offer,

          make_id: values.make_id as any,
          model_id: values.model_id as any,
          variant_id: values.variant_id ? (values.variant_id as any) : null,

          brand: makeName as any,
          model: modelName as any,

          year: Number(values.year) as any,
          km: Number(values.km) as any,
          fuel: values.fuel as any,
          gearbox: values.gearbox as any,
          body: values.body as any,
          location: values.location as any,
          canton_code: values.canton_code as any,
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

        vin: normalizedVin.length > 0 ? normalizedVin : null,
        make_id: values.make_id as any,
        model_id: values.model_id as any,
        variant_id: values.variant_id ? (values.variant_id as any) : null,

        brand: makeName,
        model: modelName,
        year: Number(values.year),
        mileage_km: Number(values.km),
        fuel: values.fuel,
        gearbox: values.gearbox,
        body: values.body,
        location: values.location,
        canton_code: values.canton_code,
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
        vin: normalizedVin.length > 0 ? normalizedVin : null,
      } as any);

      toast({
        title: "Gespeichert",
        description: "Fahrzeugdaten wurden gespeichert.",
      });

      if (draftId) {
        try {
          await updateListingDraft({ user, draftId, data: { ...(data as any), ...payload, vin: normalizedVin.length > 0 ? normalizedVin : null } });
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

  // When "Weiter" is clicked but required fields are missing, react-hook-form
  // silently blocks and only paints per-field errors — which are easy to miss
  // (the Weiter button enables on make+model alone, and errors sit below the
  // fold). Surface a clear toast naming exactly what's still needed.
  const onInvalid = (formErrors: typeof errors) => {
    const FIELD_LABELS: Record<string, string> = {
      make_id: "Marke",
      model_id: "Modell",
      year: "Baujahr",
      km: "Kilometerstand",
      fuel: "Treibstoff",
      gearbox: "Getriebe",
      body: "Karosserie",
      power_hp: "Leistung (PS)",
      drivetrain: "Antrieb",
      location: "Standort",
      canton_code: "Kanton (Standort aus der Liste wählen)",
      vin: "VIN",
    };

    const missing = Array.from(
      new Set(
        Object.keys(formErrors)
          .map((key) => FIELD_LABELS[key])
          .filter((label): label is string => Boolean(label))
      )
    );

    toast({
      title: "Bitte noch ausfüllen",
      description:
        missing.length > 0
          ? `Es fehlt noch: ${missing.join(", ")}.`
          : "Bitte fülle alle rot markierten Pflichtfelder aus, um fortzufahren.",
      variant: "destructive",
    });
  };

  if (profileLoading) {
    return <div className="text-sm text-neutral-600">Lade Profil...</div>;
  }

  const vinOk = typeof vinInput === "string" ? vinInput.trim().length === 0 || /^[A-Z0-9]{17}$/.test(vinInput.trim().toUpperCase()) : true;
  const canProceed = Boolean(watch("make_id")) && Boolean(watch("model_id")) && vinOk;
  const locationRequired = effectiveDealType !== "lease_takeover";

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-light text-neutral-900 mb-2 tracking-tight">Fahrzeugdaten</h2>
        <p className="text-neutral-600 font-light leading-relaxed">
          Gib deine VIN ein – wir füllen so viele Felder wie möglich automatisch aus. Kein VIN? Erfasse die Daten einfach manuell.
        </p>
      </div>

      <div className="rounded-3xl border border-primary/25 bg-gradient-to-r from-primary/10 to-primary/5 p-4 md:p-6 shadow-sm space-y-3">
        <div className="space-y-2">
          <div className="text-sm font-medium text-neutral-900">VIN (Fahrgestellnummer) (optional)</div>

          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto] md:items-stretch">
              <Input
                value={vinInput}
                onChange={(e) => {
                  const next = e.target.value.toUpperCase();
                  setVinInput(next);
                  setValue("vin", next.trim().toUpperCase(), { shouldValidate: true, shouldDirty: true });
                }}
                onBlur={() => {
                  const normalized = vinInput.trim().toUpperCase();
                  setVinInput(normalized);
                  setValue("vin", normalized, { shouldValidate: true, shouldDirty: true });
                }}
                placeholder="z.B. WBA... (17 Zeichen)"
                className="uppercase bg-white border border-primary/30 hover:border-primary/50 focus:border-primary transition-colors shadow-sm h-12 text-base rounded-2xl w-full"
                autoComplete="off"
                inputMode="text"
              />

              <Button
                type="button"
                onClick={onDecodeVin}
                disabled={vinLoading}
                className="rounded-2xl h-12 px-6 w-full md:w-auto whitespace-nowrap"
              >
                {vinLoading ? "Lade..." : "Daten laden"}
              </Button>
            </div>

            <div className="text-xs text-neutral-700/80 font-light">Optional – wenn du deine VIN hast, können wir Marke/Modell automatisch erkennen.</div>
            {!vinOk && vinInput.trim().length > 0 ? (
              <div className="text-xs text-red-600 font-light">
                Ungültige/angefangene VIN. Lösche das Feld, um manuell fortzufahren – oder gib alle 17 Zeichen ein.
              </div>
            ) : null}
            {vinStatus === "success" ? (
              <div className="text-xs text-emerald-700 font-light">VIN erkannt – Felder wurden automatisch vorausgefüllt.</div>
            ) : null}
            {vinError ? <div className="text-sm text-red-600">{vinError}</div> : null}
          </div>
        </div>
      </div>

      {vinReview && vinStatus === "success" ? <VinReviewCard data={vinReview} /> : null}

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-10">
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
          disableAllFields={fieldsDisabled}
          locationRequired={locationRequired}
        />

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
          <Button type="button" variant="outline" onClick={onBack} className="rounded-2xl w-full sm:w-auto">
            Zurück
          </Button>
          <Button type="submit" className="rounded-2xl w-full sm:w-auto" disabled={isSubmitting || !canProceed}>
            {isSubmitting ? "Speichern..." : "Weiter zu Finanzierungsdetails"}
          </Button>
        </div>

        {!canProceed ? (
          <div className="text-sm text-neutral-600">
            Bitte wähle mindestens Marke und Modell aus, bevor du weitergehst. (VIN ist optional.)
          </div>
        ) : null}
      </form>
    </div>
  );
}

function LabelVin() {
  return <div className="text-sm font-medium text-neutral-700">VIN (optional)</div>;
}

function VinReviewCard({ data }: { data: VinDecodeResponse }) {
  const rows: Array<{ label: string; value: string | null }> = [
    { label: "Marke", value: data.provider_make ?? null },
    { label: "Modell", value: data.provider_model ?? null },
    { label: "Ausführung", value: data.provider_trim ?? data.variant_text ?? null },
    { label: "Baujahr", value: typeof data.year === "number" ? String(data.year) : null },
    { label: "Treibstoff", value: data.fuel ?? null },
    { label: "Getriebe", value: data.transmission ?? null },
    { label: "Karosserie", value: data.body_type ?? null },
    { label: "Leistung", value: typeof data.power_hp === "number" ? `${data.power_hp} PS` : null },
    { label: "Antrieb", value: data.drivetrain ?? null },
    { label: "Erstzulassung", value: data.first_registration ?? null },
  ];

  const detected = rows.filter((r) => r.value && r.value.trim().length > 0).length;

  return (
    <div className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-4 md:p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white">
          <Check className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-neutral-900">Aus der VIN erkannt</p>
          <p className="text-xs text-neutral-600">
            {detected} von {rows.length} Feldern automatisch ausgefüllt · bitte unten prüfen und Fehlendes ergänzen.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
        {rows.map((row) => {
          const hasValue = !!row.value && row.value.trim().length > 0;
          return (
            <div key={row.label} className="min-w-0">
              <p className="text-[11px] uppercase tracking-wide text-neutral-500">{row.label}</p>
              {hasValue ? (
                <p className="truncate text-sm font-medium text-neutral-900" title={row.value ?? undefined}>
                  {row.value}
                </p>
              ) : (
                <p className="flex items-center gap-1 text-sm text-amber-600">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>nicht erkannt</span>
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}