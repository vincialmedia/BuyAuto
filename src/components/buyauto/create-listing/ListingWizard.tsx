import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ProgressBar from "./ProgressBar";
import Step1_VehicleData from "./Step1_VehicleData";
import Step2_LeasingDetails from "./Step2_LeasingDetails";
import type { DealType, ListingData } from "@/lib/buyauto/types";
import { useAuth } from "@/contexts/AuthContext";
import { getListingByIdForOwner, type ListingUpdatePayload } from "@/services/createListingService";
import { createListingDraft, getListingDraftById, updateListingDraft } from "@/services/listingDraftService";
import { Check, Loader2, Save } from "lucide-react";

const StepLoading = () => (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
  </div>
);

// Steps 3-5 and the success screen only render after user interaction,
// so load them lazily to keep them out of the initial bundle.
const Step3_PlanSelection = dynamic(() => import("./Step3_PlanSelection"), {
  loading: StepLoading,
});
const Step4_Images = dynamic(() => import("./Step4_Images").then((mod) => mod.Step4_Images), {
  loading: StepLoading,
});
const Step5_PreviewAndPay = dynamic(() => import("./Step5_PreviewAndPay"), {
  loading: StepLoading,
});
const SuccessScreen = dynamic(() => import("./SuccessScreen"), {
  loading: StepLoading,
});

interface WizardContextType {
  data: ListingData;
  updateData: (updates: Partial<ListingData>) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  isComplete: boolean;
  setIsComplete: (complete: boolean) => void;
  getMaxPhotos: () => number;
  /** Guest images awaiting upload: File plus its blob preview URL (the URL is
   *  what sits in data.images until the post-sign-in upload swaps it out). */
  guestImageFiles: { url: string; file: File }[];
  setGuestImageFiles: (files: { url: string; file: File }[]) => void;
  draftId: string | null;
  setDraftId: (id: string | null) => void;
  registerDraftSnapshotter: (snapshotter: () => Partial<ListingData> | Promise<Partial<ListingData>>) => void;
}

const WizardContext = createContext<WizardContextType | undefined>(undefined);

export const useWizard = () => {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error("useWizard must be used within a WizardProvider");
  }
  return context;
};

// Guests (not logged in) can't write server-side drafts, so their in-progress
// listing is mirrored to localStorage and restored on return.
const GUEST_DRAFT_KEY = "buyauto:guest-listing-draft";

const createEmptyListingData = (): ListingData => ({
  id: undefined,
  deal_type: "direct_purchase",
  financing_type: "cash",
  brand: "",
  model: "",
  year: new Date().getFullYear(),
  km: 0,
  body: "",
  fuel: "",
  gearbox: "",
  price_per_month_chf: 0,
  remaining_months: 12,
  deposit_chf: 0,
  contract_end_date: null,
  location: "",
  description: "",
  price_plan: "standard",
  premium: false,
  duration_days: 30,
  plan_price: 0,
  images: [],
  cover_image_index: 0,

  purchase_price_chf: null,

  vin: "",
  power_hp: null,
  drivetrain: "",
  first_registration: null,
  make_id: null,
  model_id: null,
  variant_id: null,

  donation_enabled: false as any,
  donation_amount_chf: 5 as any,
});

const hasAnyUserInput = (data: ListingData) => {
  const anyData = data as any;

  return Boolean(
    (data.brand && data.brand.trim().length > 0) ||
      (data.model && data.model.trim().length > 0) ||
      (data.body && data.body.trim().length > 0) ||
      (data.fuel && data.fuel.trim().length > 0) ||
      (data.gearbox && data.gearbox.trim().length > 0) ||
      (data.location && data.location.trim().length > 0) ||
      (data.description && data.description.trim().length > 0) ||
      (typeof data.km === "number" && data.km > 0) ||
      (typeof data.price_per_month_chf === "number" && data.price_per_month_chf > 0) ||
      (typeof data.deposit_chf === "number" && data.deposit_chf > 0) ||
      (typeof anyData?.purchase_price_chf === "number" && anyData.purchase_price_chf > 0) ||
      (data.price_plan && data.price_plan !== "standard") ||
      data.premium === true ||
      (anyData?.donation_enabled === true) ||
      (typeof anyData?.donation_amount_chf === "number" && anyData.donation_amount_chf > 0) ||
      (Array.isArray(data.images) && data.images.length > 0) ||
      (anyData?.leasing_offer?.enabled === true) ||
      (anyData?.leasing_offer?.lease_takeover_offer?.enabled === true)
  );
};


const toWizardPatchFromListing = (listing: any, prev: ListingData): Partial<ListingData> => {
  const dealType: DealType = (listing?.deal_type ?? prev.deal_type ?? "direct_purchase") as DealType;

  const financingType =
    dealType === "direct_purchase"
      ? ((listing?.financing_type ?? prev.financing_type ?? "cash") as any)
      : null;

  const leasingOffer = dealType === "direct_purchase" ? (listing?.leasing_offer ?? null) : null;

  const toNumberOrNull = (value: unknown): number | null => {
    const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
    return Number.isFinite(n) ? n : null;
  };

  return {
    id: listing?.id ?? prev.id,
    deal_type: dealType,
    financing_type: financingType,
    leasing_offer: leasingOffer,

    brand: listing?.brand ?? prev.brand,
    model: listing?.model ?? prev.model,
    year: toNumberOrNull(listing?.year) ?? prev.year,
    km: toNumberOrNull(listing?.mileage_km) ?? prev.km,
    remaining_km: listing?.remaining_km ?? (prev as any)?.remaining_km,

    purchase_price_chf:
      toNumberOrNull(listing?.purchase_price_chf) ??
      (typeof (prev as any)?.purchase_price_chf === "number" ? (prev as any).purchase_price_chf : null),

    fuel: listing?.fuel ?? prev.fuel,
    gearbox: listing?.gearbox ?? prev.gearbox,
    body: listing?.body ?? prev.body,
    description: listing?.description ?? prev.description,

    price_per_month_chf: toNumberOrNull(listing?.price_per_month_chf) ?? prev.price_per_month_chf,
    remaining_months: toNumberOrNull(listing?.remaining_months) ?? prev.remaining_months,
    deposit_chf: toNumberOrNull(listing?.deposit_chf) ?? prev.deposit_chf,
    contract_end_date:
      typeof listing?.contract_end_date === "string"
        ? listing.contract_end_date
        : typeof (prev as any)?.contract_end_date === "string"
          ? (prev as any).contract_end_date
          : null,

    location: listing?.location ?? prev.location,
    canton_code: listing?.canton_code ?? (prev as any)?.canton_code,
    title: listing?.title ?? (prev as any)?.title,

    price_plan: (listing?.price_plan ?? prev.price_plan) as any,
    premium: typeof listing?.premium === "boolean" ? listing.premium : prev.premium,

    images: Array.isArray(listing?.images) ? (listing.images as string[]) : prev.images,
    cover_image_index: toNumberOrNull(listing?.cover_image_index) ?? prev.cover_image_index,

    status: listing?.status ?? (prev as any)?.status,

    vin: listing?.vin ?? (prev as any)?.vin,
    make_id: listing?.make_id ?? (prev as any)?.make_id,
    model_id: listing?.model_id ?? (prev as any)?.model_id,
    variant_id: listing?.variant_id ?? (prev as any)?.variant_id,
    power_hp: toNumberOrNull(listing?.power_hp) ?? (prev as any)?.power_hp,
    drivetrain: listing?.drivetrain ?? (prev as any)?.drivetrain,
    first_registration: listing?.first_registration ?? (prev as any)?.first_registration,
  };
};

export default function ListingWizard() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const isGarage = profile?.role === "garage";
  const isEditingExistingListing = typeof router.query.edit === "string" && router.query.edit.length > 0;

  const [currentStep, setCurrentStep] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const [guestImageFiles, setGuestImageFiles] = useState<{ url: string; file: File }[]>([]);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [data, setData] = useState<ListingData>(() => createEmptyListingData());
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isLoadingFromQuery, setIsLoadingFromQuery] = useState(true);
  const [autosaveState, setAutosaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const draftSnapshotterRef = useRef<() => Partial<ListingData> | Promise<Partial<ListingData>>>(() => ({}));
  const autosaveInFlightRef = useRef(false);
  const lastAutosavedRef = useRef<string>("");

  const registerDraftSnapshotter = useCallback(
    (snapshotter: () => Partial<ListingData> | Promise<Partial<ListingData>>) => {
      draftSnapshotterRef.current = snapshotter;
    },
    []
  );

  const updateData = useCallback((updates: Partial<ListingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  }, []);

  const getMaxPhotos = useCallback(() => {
    if (data.price_plan === "standard") return 5;
    if (data.price_plan === "extended" || data.price_plan === "unlimited") return 15;
    return 5;
  }, [data.price_plan]);

  useEffect(() => {
    if (isGarage && currentStep === 3) setCurrentStep(4);
  }, [currentStep, isGarage]);

  // Returning from a Stripe redirect (TWINT, some 3DS cards): Stripe sends the
  // buyer back to /inserat-erstellen?payment_confirmed=true&payment_intent_...
  // Jump straight to Step 5 so its payment-confirmation effect runs and shows
  // the success screen, instead of dumping the user on an empty Step 1.
  useEffect(() => {
    if (!router.isReady) return;
    if (router.query.payment_confirmed === "true") {
      setCurrentStep(5);
    }
  }, [router.isReady, router.query.payment_confirmed]);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev >= 5) return prev;

      if (prev === 1) return 2;
      if (prev === 2) return isGarage ? 4 : 3;
      if (prev === 3) return 4;
      if (prev === 4) return 5;

      return prev + 1;
    });
  }, [isGarage]);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev <= 1) return prev;

      if (prev === 5) return 4;
      if (prev === 4) return isGarage ? 2 : 3;
      if (prev === 3) return 2;
      if (prev === 2) return 1;

      return prev - 1;
    });
  }, [isGarage]);

  const contextValue: WizardContextType = useMemo(
    () => ({
      data,
      updateData,
      currentStep,
      setCurrentStep,
      nextStep,
      prevStep,
      isComplete,
      setIsComplete,
      getMaxPhotos,
      guestImageFiles,
      setGuestImageFiles,
      draftId,
      setDraftId,
      registerDraftSnapshotter,
    }),
    [
      data,
      updateData,
      currentStep,
      nextStep,
      prevStep,
      isComplete,
      getMaxPhotos,
      guestImageFiles,
      draftId,
      registerDraftSnapshotter,
    ]
  );

  useEffect(() => {
    if (!router.isReady) return;

    const run = async () => {
      try {
        const draftQuery = router.query.draft;
        const editQuery = router.query.edit;

        if (!user) {
          // Guest: restore an in-progress listing from localStorage (if any) so
          // reopening the page — or returning after email confirmation — resumes
          // where they left off. Only applies to a fresh, non-edit visit.
          if (typeof editQuery !== "string" && typeof window !== "undefined") {
            try {
              const raw = window.localStorage.getItem(GUEST_DRAFT_KEY);
              if (raw) {
                const parsed = JSON.parse(raw) as { data?: Partial<ListingData> };
                const restored = parsed?.data;
                if (restored && hasAnyUserInput({ ...createEmptyListingData(), ...restored } as ListingData)) {
                  setData((prev) => ({ ...prev, ...restored, id: undefined }));
                }
              }
            } catch {
              /* ignore malformed local draft */
            }
          }
          setIsLoadingFromQuery(false);
          return;
        }

        if (typeof draftQuery === "string" && draftQuery.length > 0) {
          const draft = await getListingDraftById({ user, draftId: draftQuery });
          if (draft) {
            setDraftId(draft.id);
            const draftDataRaw = (draft.data as any) ?? {};
            if (isGarage) {
              const { id: _id, status: _status, ...rest } = draftDataRaw ?? {};
              setData((prev) => ({ ...prev, ...(rest as any), id: undefined }));
            } else {
              setData((prev) => ({ ...prev, ...(draftDataRaw as any) }));

              const draftListingId = draftDataRaw?.id;
              if (typeof draftListingId === "string" && draftListingId.length > 0) {
                try {
                  const listing = await getListingByIdForOwner(draftListingId, user);
                  if (listing) {
                    setData((prev) => ({ ...prev, ...toWizardPatchFromListing(listing, prev) }));
                  }
                } catch (e) {
                  console.warn("Could not refresh listing while loading draft:", e);
                }
              }
            }
          }
          setIsLoadingFromQuery(false);
          return;
        }

        if (typeof editQuery === "string" && editQuery.length > 0) {
          const listing = await getListingByIdForOwner(editQuery, user);
          if (listing) {
            setDraftId(null);
            setData((prev) => ({ ...prev, ...toWizardPatchFromListing(listing, prev) }));
          }
          setIsLoadingFromQuery(false);
          return;
        }

        // Clean create (no draft, no edit): every new listing is a Direktkauf —
        // a Leasingübernahme is offered as an option inside Step 2, so the old
        // ?deal_type= deep-link no longer seeds a pure lease_takeover.
        setIsLoadingFromQuery(false);
      } catch (e) {
        setIsLoadingFromQuery(false);
        toast({
          title: "Entwurf konnte nicht geladen werden",
          description: "Bitte versuche es erneut.",
          variant: "destructive",
        });
      }
    };

    void run();
  }, [isGarage, router.isReady, router.query.draft, router.query.edit, router.query.deal_type, toast, user]);

  const onSaveDraft = useCallback(async () => {
    if (isSavingDraft) return;

    if (!user) {
      // Guests: the wizard mirrors state to localStorage continuously, so a
      // manual save just captures the live form state and confirms — the
      // server-side draft is created after sign-in at Step 5.
      try {
        const livePatch = (await Promise.resolve(draftSnapshotterRef.current?.() ?? {})) ?? {};
        const draftData = { ...data, ...livePatch };
        if (!hasAnyUserInput(draftData as ListingData)) {
          toast({
            title: "Noch nichts zu speichern",
            description: "Fülle mindestens ein Feld aus, um einen Entwurf zu speichern.",
          });
          return;
        }
        updateData(draftData);
        toast({
          title: "Entwurf gespeichert",
          description: "Dein Entwurf ist auf diesem Gerät gespeichert und wird beim Anmelden übernommen.",
        });
      } catch {
        toast({
          title: "Entwurf konnte nicht gespeichert werden",
          description: "Bitte versuche es erneut.",
          variant: "destructive",
        });
      }
      return;
    }

    setIsSavingDraft(true);
    try {
      let livePatch: Partial<ListingData> = {};
      try {
        livePatch = (await Promise.resolve(draftSnapshotterRef.current?.() ?? {})) ?? {};
      } catch (e) {
        console.warn("Could not capture live draft snapshot:", e);
      }

      let draftData: Partial<ListingData> = { ...data, ...livePatch };
      if (!isGarage || isEditingExistingListing) {
        if (typeof data.id === "string" && data.id.length > 0) {
          (draftData as any).id = data.id;
        }
      } else {
        delete (draftData as any).id;
      }

      if (draftId) {
        try {
          const existing = await getListingDraftById({ user, draftId });
          if (existing?.data) {
            draftData = { ...(existing.data as any), ...(draftData as any) };
          }
        } catch (e) {
          console.warn("Could not load existing draft before saving:", e);
        }
      }

      if (!hasAnyUserInput(draftData as ListingData)) {
        toast({
          title: "Noch nichts zu speichern",
          description: "Fülle mindestens ein Feld aus, um einen Entwurf zu speichern.",
        });
        return;
      }

      updateData(draftData);

      if (!draftId) {
        const created = await createListingDraft({ user, data: draftData });
        setDraftId(created.id);
        await router.replace({ pathname: router.pathname, query: { ...router.query, draft: created.id } }, undefined, {
          shallow: true,
        });
        toast({ title: "Entwurf gespeichert" });
        return;
      }

      await updateListingDraft({ user, draftId, data: draftData });
      toast({ title: "Entwurf gespeichert" });
    } catch (e) {
      toast({
        title: "Speichern fehlgeschlagen",
        description: "Bitte versuche es erneut.",
        variant: "destructive",
      });
    } finally {
      setIsSavingDraft(false);
    }
  }, [data, draftId, isEditingExistingListing, isGarage, isSavingDraft, router, toast, updateData, user]);

  // Continuous autosave: periodically capture the active step's live form values
  // (via the snapshotter) plus committed wizard data, and upsert the draft with
  // last-write-wins. Purely additive — the explicit "Entwurf speichern" button
  // and per-step draft writes keep working; this just means work is never lost.
  const runAutosave = useCallback(async () => {
    if (isLoadingFromQuery || isEditingExistingListing || isComplete) return;
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("payment_confirmed") === "true") {
      return;
    }
    if (autosaveInFlightRef.current) return;

    let livePatch: Partial<ListingData> = {};
    try {
      livePatch = (await Promise.resolve(draftSnapshotterRef.current?.() ?? {})) ?? {};
    } catch {
      livePatch = {};
    }

    const draftData: Partial<ListingData> = { ...data, ...livePatch };
    if ((isGarage && !isEditingExistingListing) || !user) {
      delete (draftData as any).id;
    } else if (typeof data.id === "string" && data.id.length > 0) {
      (draftData as any).id = data.id;
    }

    if (!hasAnyUserInput(draftData as ListingData)) return;

    const snapshot = JSON.stringify(draftData);
    if (snapshot === lastAutosavedRef.current) return;

    // Guest (not logged in): keep the draft in localStorage so nothing is lost
    // before they sign in at the final step. Server-side drafts need a user_id.
    if (!user) {
      try {
        window.localStorage.setItem(GUEST_DRAFT_KEY, JSON.stringify({ savedAt: new Date().toISOString(), data: draftData }));
        lastAutosavedRef.current = snapshot;
        setAutosaveState("saved");
      } catch {
        setAutosaveState("error");
      }
      return;
    }

    autosaveInFlightRef.current = true;
    setAutosaveState("saving");
    try {
      if (!draftId) {
        const created = await createListingDraft({ user, data: draftData });
        setDraftId(created.id);
        if (router.isReady && router.query.draft !== created.id) {
          await router.replace(
            { pathname: router.pathname, query: { ...router.query, draft: created.id } },
            undefined,
            { shallow: true }
          );
        }
      } else {
        await updateListingDraft({ user, draftId, data: draftData });
      }
      lastAutosavedRef.current = snapshot;
      setAutosaveState("saved");
    } catch (e) {
      console.warn("Autosave failed:", e);
      setAutosaveState("error");
    } finally {
      autosaveInFlightRef.current = false;
    }
  }, [data, draftId, isComplete, isEditingExistingListing, isGarage, isLoadingFromQuery, router, user]);

  useEffect(() => {
    const interval = setInterval(() => {
      void runAutosave();
    }, 4000);
    return () => clearInterval(interval);
  }, [runAutosave]);

  // Once the listing is published, the guest draft has served its purpose.
  useEffect(() => {
    if (isComplete && typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(GUEST_DRAFT_KEY);
      } catch {
        /* ignore */
      }
    }
  }, [isComplete]);

  if (isComplete) {
    return <SuccessScreen draft={data} />;
  }

  const canSaveDraft = Boolean(user && !isLoadingFromQuery);
  const autosaveLabel =
    autosaveState === "saving"
      ? "Speichert…"
      : autosaveState === "saved"
        ? "Automatisch gespeichert"
        : autosaveState === "error"
          ? "Speichern fehlgeschlagen"
          : "";

  return (
    <WizardContext.Provider value={contextValue}>
      <div className="min-h-[100svh] bg-gradient-to-b from-white to-neutral-50">
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <Card className="bg-white border border-neutral-200/60 shadow-[0_24px_70px_-40px_rgba(0,0,0,0.45)] rounded-3xl overflow-hidden">
            <div className="px-5 sm:px-8 py-5 sm:py-7 border-b border-neutral-200/60">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
                    Inserat erstellen
                  </h1>
                  <p className="mt-2 text-sm sm:text-base text-neutral-600">
                    Schritt für Schritt – klar, sicher, professionell.
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-3 sm:pt-1">
                  {autosaveLabel && (
                    <span
                      className={`hidden sm:flex items-center gap-1.5 text-xs ${
                        autosaveState === "error" ? "text-red-500" : "text-neutral-500"
                      }`}
                      aria-live="polite"
                    >
                      {autosaveState === "saving" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : autosaveState === "saved" ? (
                        <Check className="h-3.5 w-3.5 text-green-600" />
                      ) : null}
                      {autosaveLabel}
                    </span>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-2xl h-10 px-3 sm:px-4 border-neutral-200 bg-white hover:bg-neutral-50"
                    onClick={onSaveDraft}
                    disabled={!canSaveDraft || isSavingDraft}
                  >
                    <Save className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">{isSavingDraft ? "Speichern..." : "Entwurf speichern"}</span>
                    <span className="sr-only sm:hidden">{isSavingDraft ? "Speichern..." : "Entwurf speichern"}</span>
                  </Button>
                </div>
              </div>

              <div className="mt-5 sm:mt-6">
                <ProgressBar />
              </div>
            </div>

            <div className="px-5 sm:px-8 py-6 sm:py-8">
              {isLoadingFromQuery ? (
                <div className="text-sm text-neutral-600">Lade Entwurf...</div>
              ) : (
                <>
                  {currentStep === 1 && <Step1_VehicleData />}
                  {currentStep === 2 && <Step2_LeasingDetails />}
                  {currentStep === 3 && !isGarage && <Step3_PlanSelection />}
                  {currentStep === 4 && <Step4_Images />}
                  {currentStep === 5 && <Step5_PreviewAndPay />}
                </>
              )}
            </div>
          </Card>

          <div className="mt-4 text-xs text-neutral-500">
            Tipp: Speichere zwischendurch deinen Entwurf – du kannst später jederzeit weitermachen.
          </div>
        </div>
      </div>
    </WizardContext.Provider>
  );
}