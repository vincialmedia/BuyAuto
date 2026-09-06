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

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VehicleBasicsSection, type CanonicalOption, type VehicleStepFormValues } from "./VehicleBasicsSection";
import type { DealType, FinancingType, ListingData } from "@/lib/buyauto/types";
import {
  zBody,
  zFuel,
  zGearbox,
  zYear,
  isCantonCode,
  composeListingTitle,
  sanitizeTitleSuffix,
  TITLE_SUFFIX_MAX,
} from "@/lib/buyauto/listingContract";

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

  // Freitext hinter dem generierten Titel ("... | Frisch ab MFK"). Die 50er-
  // Grenze gilt zusätzlich serverseitig (DB-CHECK listings_title_suffix_len).
  title_suffix: z.string().max(TITLE_SUFFIX_MAX, `Maximal ${TITLE_SUFFIX_MAX} Zeichen`).optional(),
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

/**
 * Join model + variant for the title without repeating shared tokens.
 * Model "AMG G 63" + variant "G 63 4MATIC" reads "AMG G 63 4MATIC",
 * not "AMG G 63 G 63 4MATIC": the longest model-suffix that equals a
 * variant-prefix is dropped from the variant.
 */
function joinModelAndVariant(modelName: string, variantName: string): string {
  const modelTokens = modelName.split(/\s+/).filter(Boolean);
  const variantTokens = variantName.split(/\s+/).filter(Boolean);

  let overlap = 0;
  const max = Math.min(modelTokens.length, variantTokens.length);
  for (let n = max; n > 0; n--) {
    const suffix = modelTokens.slice(-n).join(" ").toLowerCase();
    const prefix = variantTokens.slice(0, n).join(" ").toLowerCase();
    if (suffix === prefix) {
      overlap = n;
      break;
    }
  }

  const rest = variantTokens.slice(overlap).join(" ");
  return [modelName, rest].filter(Boolean).join(" ").trim();
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

  // Typenschein (Fahrzeugausweis Feld 24) — the quick-fill path, backed by the
  // free ASTRA-TARGA lookup (/api/vehicles/decode-tg).
  const [tgInput, setTgInput] = useState<string>("");
  const [tgLoading, setTgLoading] = useState(false);
  const [tgStatus, setTgStatus] = useState<"idle" | "success" | "error">("idle");
  const [tgError, setTgError] = useState<string | null>(null);

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
      title_suffix: typeof (data as any).title_suffix === "string" ? (data as any).title_suffix : "",
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
    // The cancelled flag drops out-of-order responses: without it, a slow
    // response for the previous make could land after the current one and
    // leave the wrong option list selectable.
    let cancelled = false;

    const loadModels = async () => {
      if (!selectedMakeId) {
        setModels([]);
        return;
      }

      try {
        setLoadingModels(true);
        const res = await fetchJson<any>(`/api/vehicles/models?make_id=${encodeURIComponent(selectedMakeId)}`);
        if (cancelled) return;
        setModels(Array.isArray(res) ? res : (res?.models ?? []));
      } catch {
        if (cancelled) return;
        toast({
          title: "Fehler",
          description: "Fehler beim Laden der Fahrzeugmodelle.",
          variant: "destructive",
        });
      } finally {
        if (!cancelled) setLoadingModels(false);
      }
    };

    void loadModels();
    return () => {
      cancelled = true;
    };
  }, [selectedMakeId, toast]);

  useEffect(() => {
    let cancelled = false;

    const loadVariants = async () => {
      if (!selectedModelId) {
        setVariants([]);
        return;
      }

      try {
        setLoadingVariants(true);
        const res = await fetchJson<any>(`/api/vehicles/variants?model_id=${encodeURIComponent(selectedModelId)}`);
        if (cancelled) return;
        setVariants(Array.isArray(res) ? res : (res?.variants ?? []));
      } catch {
        if (cancelled) return;
        // Variant is optional — a failed load must not block the form, so no toast.
        setVariants([]);
      } finally {
        if (!cancelled) setLoadingVariants(false);
      }
    };

    void loadVariants();
    return () => {
      cancelled = true;
    };
  }, [selectedModelId]);

  useEffect(() => {
    if (!pendingModelId) return;
    if (!selectedMakeId) return;

    const exists = models.some((m) => m.id === pendingModelId);
    if (!exists) return;

    if (!shouldAutofill("model_id")) {
      setPendingModelId(null);
      return;
    }

    // Applying a different model invalidates the selected variant, exactly like
    // the manual model picker does — otherwise a variant_id from the previous
    // model would silently survive and be saved with the new car.
    if (pendingModelId !== getValues("model_id")) {
      applyDecodedValue("variant_id", "", { shouldValidate: false });
    }
    applyDecodedValue("model_id", pendingModelId, { shouldValidate: true });
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

    applyDecodedValue("variant_id", pendingVariantId, { shouldValidate: false });
    setPendingVariantId(null);
  }, [variants, pendingVariantId, selectedModelId, setValue]);

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

  // Values applied from a VIN decode become the new autofill baseline: they are
  // machine input, not user input, so a later decode of a different VIN may
  // overwrite them — while anything the user typed stays protected by the
  // dirty/baseline checks in shouldAutofill.
  const applyDecodedValue = (
    field: keyof VehicleStepFormValues,
    value: any,
    options?: { shouldValidate?: boolean; shouldDirty?: boolean; shouldTouch?: boolean }
  ) => {
    setValue(field, value, options);
    if (initialValuesRef.current) {
      (initialValuesRef.current as any)[field] = value;
    }
  };

  const applyVinAutofill = (payload: VinDecodeResponse, vin: string) => {
    // Empty vin = the payload came from a Typenschein decode, which has no VIN
    // to write — never clear a VIN the user already entered.
    if (vin && shouldAutofill("vin")) {
      setValue("vin", vin, { shouldValidate: true, shouldDirty: true });
      if (initialValuesRef.current) {
        (initialValuesRef.current as any).vin = vin;
      }
    }

    if (payload.make_id && shouldAutofill("make_id")) {
      if (payload.make_id !== getValues("make_id")) {
        applyDecodedValue("make_id", payload.make_id, { shouldValidate: true });
        applyDecodedValue("model_id", "", { shouldValidate: false });
        // A make change invalidates the selected variant exactly like the
        // manual picker does — a variant_id from another model must never
        // silently survive into the saved listing.
        applyDecodedValue("variant_id", "", { shouldValidate: false });
      }
      setPendingModelId(payload.model_id ?? null);
    } else {
      if (payload.model_id && shouldAutofill("model_id")) setPendingModelId(payload.model_id);
    }

    // Variant lands the same way the model does: staged until its option list has
    // loaded for the (possibly just-changed) model, then applied if still untouched.
    if (payload.variant_id) setPendingVariantId(payload.variant_id);

    if (typeof payload.year === "number" && Number.isFinite(payload.year) && shouldAutofill("year")) {
      applyDecodedValue("year", payload.year, { shouldValidate: true });
    }

    if (typeof payload.power_hp === "number" && Number.isFinite(payload.power_hp) && shouldAutofill("power_hp")) {
      applyDecodedValue("power_hp", Math.round(payload.power_hp), { shouldValidate: true });
    }

    if (payload.fuel && shouldAutofill("fuel")) {
      applyDecodedValue("fuel", payload.fuel, { shouldValidate: true });
    }

    if (payload.transmission && shouldAutofill("gearbox")) {
      applyDecodedValue("gearbox", payload.transmission, { shouldValidate: true });
    }

    if (payload.body_type && shouldAutofill("body")) {
      applyDecodedValue("body", payload.body_type, { shouldValidate: true });
    }

    if (payload.drivetrain && shouldAutofill("drivetrain")) {
      applyDecodedValue("drivetrain", payload.drivetrain, { shouldValidate: true });
    }

    if (payload.first_registration && shouldAutofill("first_registration")) {
      applyDecodedValue("first_registration", payload.first_registration, { shouldValidate: true });
    }
  };

  const onDecodeTg = async () => {
    const tg = tgInput.trim().toUpperCase().replace(/[\s.\-]/g, "");
    setTgInput(tg);
    setTgError(null);

    if (!/^[A-Z0-9]{6}$/.test(tg)) {
      setTgStatus("error");
      const msg = "Die Typenschein-Nr. hat 6 Zeichen, z.B. 1TD812 (Fahrzeugausweis Feld 24).";
      setTgError(msg);
      toast({ title: "Ungültige Typenschein-Nr.", description: msg, variant: "destructive" });
      return;
    }

    setTgLoading(true);
    setTgStatus("idle");
    try {
      const resp = await fetch(`/api/vehicles/decode-tg?tg=${encodeURIComponent(tg)}`);
      const json = (await resp.json().catch(() => ({}))) as {
        make_id?: string | null;
        model_id?: string | null;
        variant_text?: string | null;
        provider_make?: string | null;
        provider_model?: string | null;
        fuel?: string | null;
        transmission?: string | null;
        power_hp?: number | null;
        body_type?: string | null;
        error?: string;
        message?: string;
      };

      if (!resp.ok) {
        const msg = json?.message || "Typenschein konnte nicht abgefragt werden.";
        setTgStatus("error");
        setTgError(msg);
        toast({ title: "Typenschein nicht gefunden", description: msg, variant: "destructive" });
        return;
      }

      updateData({
        provider_make: json.provider_make ?? null,
        provider_model: json.provider_model ?? null,
        provider_trim: json.variant_text ?? null,
        provider_model_id: json.model_id ?? null,
        variant_text: json.variant_text ?? null,
        catalog_confidence: null,
        catalog_needs_review: null,
      } as any);

      // Reuse the VIN autofill path with a TG-shaped payload — the Typenschein
      // carries no VIN, year or first registration, so those stay untouched.
      applyVinAutofill(
        {
          vin: "",
          make_id: json.make_id ?? null,
          model_id: json.model_id ?? null,
          variant_id: null,
          variant_text: json.variant_text ?? null,
          fuel: json.fuel ?? null,
          transmission: json.transmission ?? null,
          power_hp: json.power_hp ?? null,
          body_type: json.body_type ?? null,
          provider_make: json.provider_make ?? null,
          provider_model: json.provider_model ?? null,
          provider_trim: json.variant_text ?? null,
        },
        ""
      );

      setTgStatus("success");
      toast({
        title: "Typenschein-Daten geladen",
        description: [json.provider_make, json.provider_model].filter(Boolean).join(" ") || tg,
      });

      if (!json.make_id || !json.model_id) {
        toast({
          title: "Bitte prüfen",
          description: "Marke/Modell konnten nicht eindeutig zugeordnet werden. Bitte wähle sie manuell aus.",
          variant: "destructive",
        });
      }
    } catch {
      setTgStatus("error");
      setTgError("Typenschein-Daten konnten nicht geladen werden.");
      toast({
        title: "Abfrage fehlgeschlagen",
        description: "Typenschein-Daten konnten nicht geladen werden. Bitte versuche es erneut.",
        variant: "destructive",
      });
    } finally {
      setTgLoading(false);
    }
  };


  useEffect(() => {
    registerDraftSnapshotter(() => {
      const values = getValues();

      const makeName = makes.find((m) => m.id === values.make_id)?.name ?? "";
      const modelName = models.find((m) => m.id === values.model_id)?.name ?? "";
      const variantName = values.variant_id ? (variants.find((v) => v.id === values.variant_id)?.name ?? "") : "";

      // Falls back to data.title only when no make is picked — that stored
      // title is already composed, so the suffix must not be appended twice.
      const title = makeName
        ? composeListingTitle(
            [makeName, variantName ? joinModelAndVariant(modelName, variantName) : modelName]
              .filter(Boolean)
              .join(" ")
              .trim(),
            values.title_suffix
          )
        : (data as any)?.title;

      return {
        ...values,
        provider_make: (data as any)?.provider_make ?? null,
        provider_model: (data as any)?.provider_model ?? null,
        provider_trim: (data as any)?.provider_trim ?? null,
        provider_model_id: (data as any)?.provider_model_id ?? null,
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
  }, [data, getValues, makes, models, variants, registerDraftSnapshotter]);

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
        description: "Bitte wähle mindestens Marke und Modell aus (oder lade sie per Typenschein-Nr.).",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Catalog lookups come up empty while the makes/models fetch is loading
      // or after it failed — fall back to the names already in wizard state
      // instead of committing "" and wiping brand/model from the draft.
      const makeName = makes.find((m) => m.id === values.make_id)?.name || ((data as any)?.brand ?? "");
      const modelName = models.find((m) => m.id === values.model_id)?.name || ((data as any)?.model ?? "");

      // The model picker deliberately holds the catalog FAMILY ("5 Series") so
      // search facets group correctly — the engine/version goes into the title.
      // A variant picked from the catalog wins ("320d"); otherwise the decoded
      // trim ("530i xDrive") is folded in, stripping a leading repeat of the
      // model name ("A4 40 TDI" under model "A4" → "40 TDI").
      const selectedVariantName = values.variant_id
        ? (variants.find((v) => v.id === values.variant_id)?.name ?? "")
        : "";
      // The decoded trim belongs to the model the decode mapped to. If the user
      // has since corrected make/model, that text describes a different car and
      // must not end up in this title. (Drafts from before provider_model_id
      // existed have null here and simply get the plain model title.)
      const decodedModelId =
        typeof (data as any)?.provider_model_id === "string" ? (data as any).provider_model_id : null;
      const decodedTrimApplies = decodedModelId !== null && decodedModelId === values.model_id;
      const variantTextRaw = !decodedTrimApplies
        ? ""
        : typeof (data as any)?.variant_text === "string"
          ? (data as any).variant_text.trim()
          : typeof (data as any)?.provider_trim === "string"
            ? (data as any).provider_trim.trim()
            : "";
      const variantForTitle =
        selectedVariantName ||
        (variantTextRaw && modelName && variantTextRaw.toLowerCase() !== modelName.toLowerCase()
          ? variantTextRaw.toLowerCase().startsWith(modelName.toLowerCase())
            ? variantTextRaw.slice(modelName.length).trim()
            : variantTextRaw
          : "");

      const titleSuffix = sanitizeTitleSuffix(values.title_suffix);
      const baseTitle = [makeName, variantForTitle ? joinModelAndVariant(modelName, variantForTitle) : modelName]
        .filter(Boolean)
        .join(" ")
        .trim();
      // The data.title fallback is already composed — never append the suffix
      // onto it a second time.
      const generatedTitle = baseTitle
        ? composeListingTitle(baseTitle, titleSuffix)
        : ((data as any)?.title ?? "");
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
        title_suffix: titleSuffix || null,

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
          title_suffix: (titleSuffix || null) as any,

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
          title_suffix: (titleSuffix || null) as any,

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

  const canProceed = Boolean(watch("make_id")) && Boolean(watch("model_id"));
  const locationRequired = effectiveDealType !== "lease_takeover";

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-light text-neutral-900 mb-2 tracking-tight">Fahrzeugdaten</h2>
        <p className="text-neutral-600 font-light leading-relaxed">
          Gib die Typenschein-Nr. aus Feld 24 deines Fahrzeugausweises ein – wir füllen so viele
          Felder wie möglich automatisch aus. Nicht zur Hand? Erfasse die Daten einfach manuell.
        </p>
      </div>

      <div className="rounded-3xl border border-primary/25 bg-gradient-to-r from-primary/10 to-primary/5 p-4 md:p-6 shadow-sm space-y-3">
        <div className="space-y-2">
          <div className="text-sm font-medium text-neutral-900">
            Typenschein-Nr. (Fahrzeugausweis Feld 24)
          </div>

          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto] md:items-stretch">
              <Input
                value={tgInput}
                onChange={(e) => setTgInput(e.target.value.toUpperCase())}
                placeholder="z.B. 1TD812 (6 Zeichen)"
                className="uppercase bg-white border border-primary/30 hover:border-primary/50 focus:border-primary transition-colors shadow-sm h-12 text-base rounded-2xl w-full"
                autoComplete="off"
                inputMode="text"
                maxLength={10}
              />

              <Button
                type="button"
                onClick={onDecodeTg}
                disabled={tgLoading}
                className="rounded-2xl h-12 px-6 w-full md:w-auto whitespace-nowrap"
              >
                {tgLoading ? "Lade..." : "Daten laden"}
              </Button>
            </div>

            <div className="text-xs text-neutral-700/80 font-light">
              Die 6-stellige Nummer aus Feld 24 des Fahrzeugausweises – erkennt Marke, Modell,
              Karosserie, Treibstoff und Leistung aus der offiziellen ASTRA-Typengenehmigung.
              Steht dort «IVI» oder «X» (Direktimport), erfasse die Daten unten manuell.
            </div>
            {tgStatus === "success" ? (
              <div className="text-xs text-emerald-700 font-light">
                Typenschein erkannt – Felder wurden automatisch vorausgefüllt.
              </div>
            ) : null}
            {tgError ? <div className="text-sm text-red-600">{tgError}</div> : null}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-10">
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
            Bitte wähle mindestens Marke und Modell aus, bevor du weitergehst.
          </div>
        ) : null}
      </form>
    </div>
  );
}
