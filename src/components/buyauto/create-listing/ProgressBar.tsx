import { useMemo } from "react";
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
  const progressPct = useMemo(() => {
    const denom = steps.length;
    if (denom <= 0) return 0;
    return Math.round(((currentIndex + 1) / denom) * 100);
  }, [currentIndex, steps.length]);

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-neutral-600">
            Schritt <span className="text-neutral-900">{currentIndex + 1}</span> von{" "}
            <span className="text-neutral-900">{steps.length}</span>
          </p>
        </div>
        <p className="text-xs font-medium text-neutral-600 text-right leading-snug">{currentLabel}</p>
      </div>

      <div className="h-2.5 w-full rounded-full bg-neutral-200/80 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-primary to-primary/80" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="hidden lg:flex items-center justify-between gap-3">
        {steps.map((step, idx) => {
          const isActive = idx === currentIndex;
          const isDone = idx < currentIndex;

          return (
            <div key={step.id} className="flex items-center gap-2 min-w-0">
              <div
                aria-current={isActive ? "step" : undefined}
                className={[
                  "h-2.5 w-2.5 rounded-full",
                  isDone ? "bg-primary" : isActive ? "bg-primary/70" : "bg-neutral-300",
                ].join(" ")}
              />
              <p
                className={[
                  "text-xs leading-tight min-w-0",
                  isActive ? "text-neutral-900 font-medium" : isDone ? "text-neutral-700" : "text-neutral-500",
                ].join(" ")}
              >
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}