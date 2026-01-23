import { useMemo } from "react";
import { useWizard } from "./ListingWizard";
import { useAuth } from "@/contexts/AuthContext";

interface DisplayStep {
  wizardStep: number;
  label: string;
  description: string;
}

export default function ProgressBar() {
  const { currentStep } = useWizard();
  const { profile } = useAuth();
  const isGarage = profile?.role === "garage";

  const steps = useMemo<DisplayStep[]>(() => {
    const baseSteps: DisplayStep[] = [
      { wizardStep: 1, label: "Fahrzeugdaten", description: "Fahrzeug & Finanzierung" },
      { wizardStep: 3, label: "Plan wählen", description: "Inseratsdauer & Sichtbarkeit" },
      { wizardStep: 4, label: "Bilder", description: "Fotos hochladen" },
      { wizardStep: 5, label: "Vorschau", description: "Bestätigung und Veröffentlichung" },
    ];

    return isGarage ? baseSteps.filter((s) => s.wizardStep !== 3) : baseSteps;
  }, [isGarage]);

  const rawIndex = steps.findIndex((s) => s.wizardStep === currentStep);
  const activeIndex = rawIndex >= 0 ? rawIndex : 0;

  const progressPercent =
    steps.length > 1 ? (activeIndex / (steps.length - 1)) * 100 : 0;

  const activeStep = steps[activeIndex] ?? steps[0];

  return (
    <div className="w-full">
      <div className="hidden md:block">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-6 left-0 w-full h-px bg-neutral-200 -z-10">
            <div
              className="h-full bg-red-500 transition-all duration-700 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {steps.map((step, index) => {
            const displayNumber = index + 1;
            const isDone = activeIndex > index;
            const isActive = activeIndex === index;

            return (
              <div key={step.wizardStep} className="flex flex-col items-center group">
                <div
                  className={[
                    "relative w-12 h-12 rounded-full flex items-center justify-center font-medium text-sm",
                    "transition-all duration-300 shadow-sm",
                    index <= activeIndex
                      ? "bg-red-500 text-white"
                      : "bg-white text-neutral-400 border border-neutral-200",
                    isActive ? "scale-105 shadow-md" : "",
                  ].join(" ")}
                >
                  {isDone ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    displayNumber
                  )}
                </div>

                <div className="mt-3 text-center min-w-0 max-w-[140px]">
                  <p
                    className={[
                      "text-sm font-medium transition-colors duration-200 tracking-wide",
                      index <= activeIndex ? "text-red-500" : "text-neutral-500",
                    ].join(" ")}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-neutral-400 mt-1 leading-tight font-light">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="md:hidden">
        <div className="flex items-center space-x-3 mb-4">
          <div className="flex-1 bg-neutral-200 rounded-full h-1">
            <div
              className="h-full bg-red-500 rounded-full transition-all duration-700"
              style={{ width: `${(activeIndex / Math.max(steps.length - 1, 1)) * 100}%` }}
            />
          </div>
          <span className="text-sm font-medium text-neutral-600 tracking-wide">
            {activeIndex + 1}/{steps.length}
          </span>
        </div>

        <div className="text-center">
          <h2 className="text-lg font-medium text-neutral-900 tracking-tight">
            {activeStep?.label ?? ""}
          </h2>
          <p className="text-sm text-neutral-500 mt-1 font-light">
            {activeStep?.description ?? ""}
          </p>
        </div>
      </div>
    </div>
  );
}