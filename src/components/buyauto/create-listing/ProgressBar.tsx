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
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-neutral-900">
            Schritt {currentIndex + 1} von {steps.length}
          </p>
          <p
            className={[
              "mt-0.5 text-xs font-medium",
              isNearGoal ? "text-primary" : "text-neutral-500",
            ].join(" ")}
          >
            {isLastStep
              ? "Fast geschafft – nur noch veröffentlichen 🎉"
              : isNearGoal
                ? `Fast geschafft! Weiter mit: ${currentLabel}`
                : currentLabel}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary tabular-nums">
          {progressPct}%
        </span>
      </div>

      <div className="h-3 w-full rounded-full bg-neutral-200 overflow-hidden shadow-inner">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-primary/80 transition-[width] duration-500 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Stepper — always visible. Circles on every screen; labels from sm up. */}
      <div className="flex items-start justify-between gap-1">
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
                "flex flex-1 flex-col items-center gap-1.5 min-w-0",
                canJump ? "cursor-pointer group" : "cursor-default",
              ].join(" ")}
              aria-current={isActive ? "step" : undefined}
              aria-label={canJump ? `Zurück zu Schritt: ${step.label}` : step.label}
            >
              <div
                className={[
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold shrink-0 transition-colors",
                  isDone
                    ? "bg-primary text-white group-hover:bg-primary/90"
                    : isActive
                      ? "bg-primary/15 text-primary ring-2 ring-primary/40"
                      : "bg-neutral-200 text-neutral-500",
                ].join(" ")}
              >
                {isDone ? <Check className="h-3.5 w-3.5" /> : idx + 1}
              </div>
              <span
                className={[
                  "hidden sm:block text-[11px] leading-tight text-center min-w-0",
                  isActive ? "text-neutral-900 font-semibold" : isDone ? "text-neutral-600" : "text-neutral-400",
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
