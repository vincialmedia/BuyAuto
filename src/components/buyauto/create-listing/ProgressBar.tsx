import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useWizard } from "./ListingWizard";

interface StepDef {
  id: number;
  label: string;
}

export default function ProgressBar() {
  const { currentStep } = useWizard();
  const { profile } = useAuth();
  const isGarage = profile?.role === "garage";

  const steps = useMemo<StepDef[]>(() => {
    if (isGarage) {
      return [
        { id: 1, label: "Fahrzeug" },
        { id: 2, label: "Verkaufsart & Finanzierung" },
        { id: 4, label: "Fotos" },
        { id: 5, label: "Vorschau & Zahlung" },
      ];
    }

    return [
      { id: 1, label: "Fahrzeug" },
      { id: 2, label: "Verkaufsart & Finanzierung" },
      { id: 3, label: "Plan" },
      { id: 4, label: "Fotos" },
      { id: 5, label: "Vorschau & Zahlung" },
    ];
  }, [isGarage]);

  const currentIndex = useMemo(() => {
    const idx = steps.findIndex((s) => s.id === currentStep);
    return idx >= 0 ? idx : 0;
  }, [currentStep, steps]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-3">
        {steps.map((step, idx) => {
          const isDone = idx < currentIndex;
          const isActive = idx === currentIndex;

          return (
            <div key={step.id} className="flex items-center gap-3 flex-1 min-w-0">
              <div
                className={cn(
                  "h-9 w-9 rounded-full flex items-center justify-center text-sm font-medium border transition-colors shrink-0",
                  isDone
                    ? "bg-red-500 border-red-500 text-white"
                    : isActive
                      ? "bg-white border-red-500 text-red-600"
                      : "bg-white border-neutral-200 text-neutral-500"
                )}
              >
                {idx + 1}
              </div>

              <div className="min-w-0">
                <p
                  className={cn(
                    "text-sm truncate",
                    isDone ? "text-neutral-900" : isActive ? "text-neutral-900" : "text-neutral-500"
                  )}
                >
                  {step.label}
                </p>
              </div>

              {idx < steps.length - 1 && (
                <div
                  className={cn(
                    "h-[2px] flex-1 rounded-full transition-colors",
                    isDone ? "bg-red-500" : "bg-neutral-200"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}