import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
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
import { createOrUpdateListing, getListingByIdForOwner, type ListingUpdatePayload } from "@/services/createListingService";
import {
  createListingDraft,
  getListingDraftById,
  updateListingDraft,
} from "@/services/listingDraftService";
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
      (Array.isArray(data.images) && data.images.length > 0)
  );
};

const toListingUpdatePayload = (wizardData: ListingData): ListingUpdatePayload => {
  const mileageKm =
    typeof wizardData.km === "number"
      ? wizardData.km
      : typeof wizardData.mileage === "number"
        ? wizardData.mileage
        : undefined;

  const dealType: DealType = wizardData.deal_type ?? "lease_takeover";

  return {
    id: wizardData.id,
    deal_type: dealType,
    financing_type: dealType === "direct_purchase" ? (wizardData.financing_type ?? null) : null,
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
    status: "draft",
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
    if (!isGarage) return;
    if (isLoadingFromQuery) return;
    if (draftId) return;
    if (data.id) return;

    setData((prev) => ({
      ...prev,
      deal_type: "direct_purchase",
      financing_type: null,
    }));
  }, [data.id, draftId, isGarage, isLoadingFromQuery]);

  useEffect(() => {
    if (isGarage && currentStep === 3) {
      setCurrentStep(4);
    }
  }, [currentStep, isGarage]);

  const nextStep = useCallback(() => {
    if (currentStep < 5) {
      setCurrentStep((prev) => {
        if (prev >= 5) return prev;
        if (isGarage && prev === 2) return 4;
        return prev + 1;
      });
    }
  }, [currentStep, isGarage]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => {
        if (prev <= 1) return prev;
        if (isGarage && prev === 4) return 2;
        return prev - 1;
      });
    }
  }, [currentStep, isGarage]);

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
          }
          setIsLoadingFromQuery(false);
          return;
        }

        if (typeof editQuery === "string" && editQuery.length > 0) {
          const listing = await getListingByIdForOwner(editQuery, user);
          if (listing) {
            const dealType = (listing as any).deal_type ?? "lease_takeover";
            setDraftId(null);
            setData((prev) => ({
              ...prev,
              id: listing.id,
              deal_type: dealType,
              financing_type:
                dealType === "direct_purchase" ? ((listing as any).financing_type ?? null) : null,
              brand: listing.brand ?? "",
              model: listing.model ?? "",
              year: typeof listing.year === "number" ? listing.year : prev.year,
              km: typeof listing.mileage_km === "number" ? listing.mileage_km : prev.km,
              body: listing.body ?? "",
              fuel: listing.fuel ?? "",
              gearbox: listing.gearbox ?? "",
              description: listing.description ?? "",
              price_per_month_chf: listing.price_per_month_chf ?? 0,
              remaining_months: listing.remaining_months ?? 12,
              remaining_km: listing.remaining_km ?? undefined,
              deposit_chf: listing.deposit_chf ?? 0,
              location: listing.location ?? "",
              canton_code: listing.canton_code ?? undefined,
              title: listing.title ?? undefined,
              price_plan: (listing.price_plan ?? prev.price_plan) as any,
              premium: Boolean(listing.premium),
              images: Array.isArray(listing.images) ? (listing.images as string[]) : prev.images,
              cover_image_index: listing.cover_image_index ?? prev.cover_image_index,
              status: listing.status ?? undefined,
            }));
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
      if (data.id) {
        await createOrUpdateListing(toListingUpdatePayload(data), user);
        toast({ title: "Entwurf gespeichert" });
        return;
      }

      if (!draftId) {
        const created = await createListingDraft({ user, data });
        setDraftId(created.id);
        await router.replace(
          { pathname: router.pathname, query: { ...router.query, draft: created.id } },
          undefined,
          { shallow: true }
        );
        toast({ title: "Entwurf gespeichert" });
        return;
      }

      await updateListingDraft({ user, draftId, data });
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
  }, [data, draftId, isSavingDraft, router, toast, user]);

  if (isComplete) {
    return <SuccessScreen />;
  }

  return (
    <WizardContext.Provider value={contextValue}>
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-8">
          <div className="flex items-start justify-between gap-4 mb-8">
            <div className="text-left">
              <h1 className="text-3xl md:text-4xl font-light text-neutral-900 mb-3 tracking-tight">
                Inserat erstellen
              </h1>
              <p className="text-neutral-600 font-light leading-relaxed">
                Erstelle dein Auto-Leasing-Inserat in wenigen Schritten
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
                <Save className="h-4 w-4 mr-2" />
                {isSavingDraft ? "Speichern..." : "Speichern (Entwurf)"}
              </Button>
            </div>
          </div>

          <ProgressBar />

          <div className="mt-8">
            <Card className="bg-white border border-neutral-200/40 shadow-sm rounded-lg overflow-hidden">
              <div className="p-6 md:p-8">
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
      </div>
    </WizardContext.Provider>
  );
}