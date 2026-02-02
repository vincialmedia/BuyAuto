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

  const currentLabel = steps[currentIndex]?.label ?? "Schritt";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-neutral-600">
          Schritt {currentIndex + 1} von {steps.length}
        </p>
        <p className="text-xs font-medium text-neutral-600 truncate">{currentLabel}</p>
      </div>

      <div className="flex items-center gap-2">
        {steps.map((step, idx) => {
          const isDone = idx < currentIndex;
          const isActive = idx === currentIndex;

          return (
            <div key={step.id} className="flex items-center gap-2 min-w-0 flex-1">
              <div
                aria-current={isActive ? "step" : undefined}
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold border transition-colors shrink-0",
                  isDone
                    ? "bg-gradient-to-r from-primary to-primary/80 border-primary text-white shadow-sm"
                    : isActive
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-white border-neutral-200 text-neutral-500"
                )}
              >
                {idx + 1}
              </div>

              <div className="min-w-0 hidden md:block">
                <p
                  className={cn(
                    "text-xs leading-tight",
                    isDone ? "text-neutral-900" : isActive ? "text-neutral-900" : "text-neutral-500"
                  )}
                >
                  {step.label}
                </p>
              </div>

              {idx < steps.length - 1 && (
                <div
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors",
                    isDone ? "bg-gradient-to-r from-primary to-primary/80" : "bg-neutral-200"
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