
import { useState, createContext, useContext, useCallback } from "react";
import { Card } from "@/components/ui/card";
import ProgressBar from "./ProgressBar";
import Step1_VehicleData from "./Step1_VehicleData";
import Step2_LeasingDetails from "./Step2_LeasingDetails";
import Step3_PlanSelection from "./Step3_PlanSelection";
import Step4_Images from "./Step4_Images";
import Step5_Preview from "./Step5_Preview";
import SuccessScreen from "./SuccessScreen";

export interface ListingData {
  // Vehicle Data
  brand: string;
  model: string;
  year: number;
  km: number;
  body: string;
  fuel: string;
  gearbox: string;
  
  // Leasing Details
  price_per_month_chf: number;
  remaining_months: number;
  deposit_chf: number;
  location: string;
  canton_code: string;
  
  // Plan Selection (before images now)
  price_plan: string;
  is_premium: boolean;
  duration_days: number | null;
  plan_price: number;
  
  // Images (now step 4)
  images: string[];
  cover_image_index: number;
}

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
}

const WizardContext = createContext<WizardContextType | undefined>(undefined);

export const useWizard = () => {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error("useWizard must be used within a WizardProvider");
  }
  return context;
};

export default function ListingWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const [data, setData] = useState<ListingData>({
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
    canton_code: "",
    price_plan: "",
    is_premium: false,
    duration_days: 30,
    plan_price: 0,
    images: [],
    cover_image_index: 0,
  });

  const updateData = useCallback((updates: Partial<ListingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  const getMaxPhotos = useCallback(() => {
    // Free plan gets 5 photos, paid plans get 15 photos
    if (data.price_plan === 'free30') {
      return 5;
    }
    // Extended, Unlimited plans get 15 photos
    if (data.price_plan === 'paid90' || data.price_plan === 'unlimited') {
      return 15;
    }
    // Default to 5 if no plan selected yet
    return 5;
  }, [data.price_plan]);

  const nextStep = useCallback(() => {
    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

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
  };

  if (isComplete) {
    return <SuccessScreen />;
  }

  return (
    <WizardContext.Provider value={contextValue}>
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-8">
          {/* Swiss minimalist header */}
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
                {currentStep === 3 && <Step3_PlanSelection />}
                {currentStep === 4 && <Step4_Images />}
                {currentStep === 5 && <Step5_Preview />}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </WizardContext.Provider>
  );
}
