import { cn } from "@/lib/utils";

export type PricingPersona = "private" | "garage";

export interface PricingToggleProps {
  value: PricingPersona;
  onChange: (value: PricingPersona) => void;
}

export function PricingToggle({ value, onChange }: PricingToggleProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-semibold text-white/90">Ich bin</span>

      <div
        role="radiogroup"
        aria-label="Kundentyp auswählen"
        className="relative flex w-full max-w-[340px] overflow-hidden rounded-full border border-white/30 bg-white/20 p-1 backdrop-blur-xl shadow-2xl"
      >
        <div
          className={cn(
            "absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-white/70 shadow-sm transition-transform duration-300 ease-out",
            value === "private" ? "translate-x-0" : "translate-x-full"
          )}
          aria-hidden="true"
        />

        <button
          type="button"
          role="radio"
          aria-checked={value === "private"}
          onClick={() => onChange("private")}
          className={cn(
            "relative z-10 flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
            value === "private"
              ? "text-neutral-900"
              : "text-white/80 hover:text-white"
          )}
        >
          Privatkunde
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={value === "garage"}
          onClick={() => onChange("garage")}
          className={cn(
            "relative z-10 flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
            value === "garage"
              ? "text-neutral-900"
              : "text-white/80 hover:text-white"
          )}
        >
          Garage
        </button>
      </div>
    </div>
  );
}