import { useMemo } from "react";
import { Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWizard } from "./ListingWizard";

interface StepDef {
  id: number;
  label: string;
}

export default function ProgressBar() {
  const { currentStep, setCurrentStep } = useWizard();
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
  const isNearGoal = currentIndex >= steps.length - 2;
  const isLastStep = currentIndex === steps.length - 1;

  // Endowed progress: treat the completed account as a pre-credited first
  // segment so the bar never renders at 0% and finishing the first real step
  // already feels like meaningful progress (goal-gradient / Nunes & Drèze).
  const progressPct = useMemo(() => {
    const total = steps.length + 1; // +1 = the "Konto" segment, already done
    const filled = currentIndex + 2; // account + completed steps + current
    return Math.min(100, Math.round((filled / total) * 100));
  }, [currentIndex, steps.length]);

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-neutral-600">
            Schritt <span className="text-neutral-900">{currentIndex + 1}</span> von{" "}
            <span className="text-neutral-900">{steps.length}</span>
          </p>
          {isNearGoal ? (
            <p className="mt-0.5 text-xs font-semibold text-primary">
              {isLastStep ? "Fast geschafft – nur noch veröffentlichen 🎉" : "Fast geschafft!"}
            </p>
          ) : null}
        </div>
        <p className="text-xs font-medium text-neutral-600 text-right leading-snug">{currentLabel}</p>
      </div>

      <div className="h-2.5 w-full rounded-full bg-neutral-200/80 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-primary/80 transition-[width] duration-500 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="hidden lg:flex items-center justify-between gap-3">
        {steps.map((step, idx) => {
          const isActive = idx === currentIndex;
          const isDone = idx < currentIndex;
          const canJump = isDone;

          return (
            <button
              key={step.id}
              type="button"
              disabled={!canJump}
              onClick={canJump ? () => setCurrentStep(step.id) : undefined}
              className={[
                "flex items-center gap-2 min-w-0 text-left",
                canJump ? "cursor-pointer hover:opacity-80" : "cursor-default",
              ].join(" ")}
              aria-current={isActive ? "step" : undefined}
              aria-label={canJump ? `Zurück zu Schritt: ${step.label}` : step.label}
            >
              <div
                className={[
                  "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold shrink-0",
                  isDone
                    ? "bg-primary text-white"
                    : isActive
                      ? "bg-primary/15 text-primary ring-2 ring-primary/40"
                      : "bg-neutral-200 text-neutral-500",
                ].join(" ")}
              >
                {isDone ? <Check className="h-3 w-3" /> : idx + 1}
              </div>
              <span
                className={[
                  "text-xs leading-tight min-w-0",
                  isActive ? "text-neutral-900 font-medium" : isDone ? "text-neutral-700" : "text-neutral-500",
                ].join(" ")}
              >
                {step.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
