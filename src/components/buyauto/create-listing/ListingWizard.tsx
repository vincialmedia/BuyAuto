import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ProgressBar from "./ProgressBar";
import Step1_VehicleData from "./Step1_VehicleData";
import Step2_LeasingDetails from "./Step2_LeasingDetails";
import Step3_PlanSelection from "./Step3_PlanSelection";
import { Step4_Images } from "./Step4_Images";
import Step5_PreviewAndPay from "./Step5_PreviewAndPay";
import SuccessScreen from "./SuccessScreen";
import type { DealType, ListingData } from "@/lib/buyauto/types";
import { useAuth } from "@/contexts/AuthContext";
import { getListingByIdForOwner, type ListingUpdatePayload } from "@/services/createListingService";
import { createListingDraft, getListingDraftById, updateListingDraft } from "@/services/listingDraftService";
import { Save } from "lucide-react";

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
  guestImageFiles: File[];
  setGuestImageFiles: (files: File[]) => void;
  draftId: string | null;
  setDraftId: (id: string | null) => void;
}

const WizardContext = createContext<WizardContextType | undefined>(undefined);

export const useWizard = () => {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error("useWizard must be used within a WizardProvider");
  }
  return context;
};

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
  location: "",
  description: "",
  price_plan: "standard",
  premium: false,
  duration_days: 30,
  plan_price: 0,
  images: [],
  cover_image_index: 0,
  ui_version: "v2",
});

const hasAnyUserInput = (data: ListingData) => {
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
      (Array.isArray(data.images) && data.images.length > 0) ||
      ((data as any)?.leasing_offer?.lease_takeover_offer?.enabled === true)
  );
};

const toListingUpdatePayload = (wizardData: ListingData): ListingUpdatePayload => {
  const mileageKm =
    typeof wizardData.km === "number"
      ? wizardData.km
      : typeof wizardData.mileage === "number"
        ? wizardData.mileage
        : undefined;

  const dealType: DealType = wizardData.deal_type ?? "direct_purchase";

  return {
    id: wizardData.id,
    deal_type: dealType,
    financing_type: dealType === "direct_purchase" ? (wizardData.financing_type ?? "cash") : null,
    brand: wizardData.brand,
    model: wizardData.model,
    year: wizardData.year,
    mileage_km: mileageKm,
    remaining_km: wizardData.remaining_km ?? null,
    fuel: wizardData.fuel,
    gearbox: wizardData.gearbox ?? wizardData.transmission,
    body: wizardData.body,
    description: wizardData.description,
    price_per_month_chf: wizardData.price_per_month_chf,
    remaining_months: wizardData.remaining_months,
    deposit_chf: wizardData.deposit_chf ?? null,
    location: wizardData.location,
    canton_code: wizardData.canton_code,
    title: wizardData.title,
    price_plan: wizardData.price_plan,
    premium: wizardData.premium,
    images: wizardData.images,
    cover_image_index: wizardData.cover_image_index,
    leasing_offer: (wizardData as unknown as { leasing_offer?: unknown }).leasing_offer as any,
  };
};

const toWizardPatchFromListing = (listing: any, prev: ListingData): Partial<ListingData> => {
  const dealType: DealType = (listing?.deal_type ?? prev.deal_type ?? "direct_purchase") as DealType;

  const financingType =
    dealType === "direct_purchase"
      ? ((listing?.financing_type ?? prev.financing_type ?? "cash") as any)
      : null;

  const leasingOffer = dealType === "direct_purchase" ? (listing?.leasing_offer ?? null) : null;

  return {
    id: listing?.id ?? prev.id,
    deal_type: dealType,
    financing_type: financingType,

    leasing_offer: leasingOffer,

    brand: listing?.brand ?? prev.brand,
    model: listing?.model ?? prev.model,
    year: typeof listing?.year === "number" ? listing.year : prev.year,
    km: typeof listing?.mileage_km === "number" ? listing.mileage_km : prev.km,
    remaining_km: listing?.remaining_km ?? prev.remaining_km,

    fuel: listing?.fuel ?? prev.fuel,
    gearbox: listing?.gearbox ?? prev.gearbox,
    body: listing?.body ?? prev.body,
    description: listing?.description ?? prev.description,

    price_per_month_chf: typeof listing?.price_per_month_chf === "number" ? listing.price_per_month_chf : prev.price_per_month_chf,
    remaining_months: typeof listing?.remaining_months === "number" ? listing.remaining_months : prev.remaining_months,
    deposit_chf: typeof listing?.deposit_chf === "number" ? listing.deposit_chf : prev.deposit_chf,

    location: listing?.location ?? prev.location,
    canton_code: listing?.canton_code ?? prev.canton_code,
    title: listing?.title ?? prev.title,

    price_plan: (listing?.price_plan ?? prev.price_plan) as any,
    premium: typeof listing?.premium === "boolean" ? listing.premium : prev.premium,

    images: Array.isArray(listing?.images) ? (listing.images as string[]) : prev.images,
    cover_image_index:
      typeof listing?.cover_image_index === "number" ? listing.cover_image_index : prev.cover_image_index,

    status: listing?.status ?? prev.status,
  };
};

export default function ListingWizard() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const isGarage = profile?.role === "garage";

  const [currentStep, setCurrentStep] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const [guestImageFiles, setGuestImageFiles] = useState<File[]>([]);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [data, setData] = useState<ListingData>(() => createEmptyListingData());
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isLoadingFromQuery, setIsLoadingFromQuery] = useState(true);

  const updateData = useCallback((updates: Partial<ListingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  }, []);

  const getMaxPhotos = useCallback(() => {
    if (data.price_plan === "standard") {
      return 5;
    }
    if (data.price_plan === "extended" || data.price_plan === "unlimited") {
      return 15;
    }
    return 5;
  }, [data.price_plan]);

  useEffect(() => {
    if (isGarage && currentStep === 3) {
      setCurrentStep(4);
    }
  }, [currentStep, isGarage]);

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
    ]
  );

  useEffect(() => {
    if (!router.isReady) return;

    const run = async () => {
      try {
        const draftQuery = router.query.draft;
        const editQuery = router.query.edit;

        if (!user) {
          setIsLoadingFromQuery(false);
          return;
        }

        if (typeof draftQuery === "string" && draftQuery.length > 0) {
          const draft = await getListingDraftById({ user, draftId: draftQuery });
          if (draft) {
            setDraftId(draft.id);
            setData((prev) => ({ ...prev, ...draft.data }));

            const draftListingId = (draft.data as any)?.id;
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
  }, [router.isReady, router.query.draft, router.query.edit, toast, user]);

  const onSaveDraft = useCallback(async () => {
    if (isSavingDraft) return;

    if (!user) {
      toast({
        title: "Bitte anmelden",
        description: "Um einen Entwurf zu speichern, musst du eingeloggt sein.",
        variant: "destructive",
      });
      return;
    }

    if (!hasAnyUserInput(data)) {
      toast({
        title: "Noch nichts zu speichern",
        description: "Fülle mindestens ein Feld aus, um einen Entwurf zu speichern.",
      });
      return;
    }

    setIsSavingDraft(true);
    try {
      let draftData: Partial<ListingData> = data;

      if (draftId) {
        try {
          const existing = await getListingDraftById({ user, draftId });
          if (existing?.data) {
            draftData = { ...existing.data, ...draftData };
          }
        } catch (e) {
          console.warn("Could not load existing draft before saving:", e);
        }
      }

      const listingId =
        typeof (draftData as any)?.id === "string" && (draftData as any).id.length > 0
          ? ((draftData as any).id as string)
          : typeof data.id === "string" && data.id.length > 0
            ? data.id
            : null;

      if (listingId) {
        try {
          const listing = await getListingByIdForOwner(listingId, user);
          if (listing) {
            const patch = toWizardPatchFromListing(listing, draftData as ListingData);

            const safePatch = { ...(patch as any) };
            if ("images" in safePatch) delete safePatch.images;
            if ("cover_image_index" in safePatch) delete safePatch.cover_image_index;

            draftData = { ...draftData, ...safePatch };

            updateData(draftData);
          }
        } catch (e) {
          console.warn("Could not refresh listing before saving draft:", e);
        }
      }

      if (!draftId) {
        const created = await createListingDraft({ user, data: draftData });
        setDraftId(created.id);
        await router.replace(
          { pathname: router.pathname, query: { ...router.query, draft: created.id } },
          undefined,
          { shallow: true }
        );
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
  }, [data, draftId, isSavingDraft, router, toast, updateData, user]);

  if (isComplete) {
    return <SuccessScreen draft={data} />;
  }

  return (
    <WizardContext.Provider value={contextValue}>
      <div className="min-h-screen bg-neutral-50">
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <Card className="bg-white border border-neutral-200/60 shadow-lg rounded-3xl overflow-hidden">
            <div className="px-6 sm:px-8 pt-7 pb-6 border-b border-neutral-200/60">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
                    Inserat erstellen
                  </h1>
                  <p className="mt-2 text-sm sm:text-base text-neutral-600">
                    In wenigen Schritten zum fertigen Inserat.
                  </p>
                </div>

                <div className="shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-2xl"
                    onClick={onSaveDraft}
                    disabled={isSavingDraft || isLoadingFromQuery || !hasAnyUserInput(data)}
                  >
                    <Save className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">
                      {isSavingDraft ? "Speichern..." : "Entwurf speichern"}
                    </span>
                    <span className="sr-only sm:hidden">
                      {isSavingDraft ? "Speichern..." : "Entwurf speichern"}
                    </span>
                  </Button>
                </div>
              </div>

              <div className="mt-6">
                <ProgressBar />
              </div>
            </div>

            <div className="px-6 sm:px-8 py-6 sm:py-8">
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
        </div>
      </div>
    </WizardContext.Provider>
  );
}