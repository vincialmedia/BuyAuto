import { useState, createContext, useContext, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import ProgressBar from "./ProgressBar";
import Step1_VehicleData from "./Step1_VehicleData";
import Step2_LeasingDetails from "./Step2_LeasingDetails";
import Step3_PlanSelection from "./Step3_PlanSelection";
import { Step4_Images } from "./Step4_Images";
import Step5_PreviewAndPay from "./Step5_PreviewAndPay";
import SuccessScreen from "./SuccessScreen";
import { ListingData } from "@/lib/buyauto/types";
import { useAuth } from "@/contexts/AuthContext";

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
}

const WizardContext = createContext<WizardContextType | undefined>(undefined);

export const useWizard = () => {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error("useWizard must be used within a WizardProvider");
  }
  return context;
};

const STORAGE_KEY = "listing_wizard_draft";

export default function ListingWizard() {
  const { profile } = useAuth();
  const isGarage = profile?.role === "garage";

  const [currentStep, setCurrentStep] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const [guestImageFiles, setGuestImageFiles] = useState<File[]>([]);
  const [data, setData] = useState<ListingData>({
    id: undefined,
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

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        console.log("✅ Loaded wizard data from localStorage:", parsed);
        setData(parsed);
      } catch (error) {
        console.error("❌ Failed to parse saved wizard data:", error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (data.brand || data.model || data.price_per_month_chf) {
      console.log("💾 Saving wizard data to localStorage:", data);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data]);

  const updateData = useCallback((updates: Partial<ListingData>) => {
    console.log("🔍 ListingWizard updateData called with:", updates);
    
    setData(prev => {
      console.log("🔍 Current data before update:", prev);
      const newData = { ...prev, ...updates };
      console.log("🔍 New data after update:", newData);
      return newData;
    });
  }, []);

  const getMaxPhotos = useCallback(() => {
    if (data.price_plan === 'standard') {
      return 5;
    }
    if (data.price_plan === 'extended' || data.price_plan === 'unlimited') {
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

  const contextValue: WizardContextType = {
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
  };

  if (isComplete) {
    // Clear localStorage on completion
    localStorage.removeItem(STORAGE_KEY);
    return <SuccessScreen />;
  }

  return (
    <WizardContext.Provider value={contextValue}>
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-light text-neutral-900 mb-3 tracking-tight">
              Inserat erstellen
            </h1>
            <p className="text-neutral-600 font-light leading-relaxed">
              Erstelle dein Auto-Leasing-Inserat in wenigen Schritten
            </p>
          </div>

          <ProgressBar />

          <div className="mt-8">
            <Card className="bg-white border border-neutral-200/40 shadow-sm rounded-lg overflow-hidden">
              <div className="p-6 md:p-8">
                {currentStep === 1 && <Step1_VehicleData />}
                {currentStep === 2 && <Step2_LeasingDetails />}
                {currentStep === 3 && !isGarage && <Step3_PlanSelection />}
                {currentStep === 4 && <Step4_Images />}
                {currentStep === 5 && <Step5_PreviewAndPay />}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </WizardContext.Provider>
  );
}