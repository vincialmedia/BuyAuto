import { Check, Info, Minus } from "lucide-react";
import { HoverTooltip } from "@/components/ui/hover-tooltip";
import { cn } from "@/lib/utils";
import { pricingPlans, type Plan } from "@/lib/buyauto/stripe_config";
import { PRIVATE_COMPARISON_ROWS } from "@/components/buyauto/pricing/pricingData";

const PLAN_ORDER: Plan[] = ["standard", "extended", "unlimited"];

/** Verlängert carries the same "recommended" highlight as on the plan cards. */
const POPULAR_PLAN: Plan = "extended";

function ValueCell({ value }: { value: string | false }) {
  if (value === false) {
    return (
      <span className="inline-flex items-center gap-1 text-neutral-300">
        <Minus className="h-4 w-4" />
        <span className="sr-only">nicht enthalten</span>
      </span>
    );
  }

  if (value === "inklusive") {
    return (
      <span className="inline-flex items-center gap-1 text-primary">
        <Check className="h-4 w-4" />
        <span className="sr-only">inklusive</span>
      </span>
    );
  }

  return <span className="text-sm font-medium text-neutral-800">{value}</span>;
}

/**
 * Feature × plan table for the private one-time plans — the counterpart to
 * GarageFeatureMatrix, in the same visual language. The cards sell the plan;
 * this answers "what exactly do I lose if I take the cheaper one".
 */
export function PrivateFeatureMatrix() {
  return (
    <section className="rounded-3xl border border-neutral-200/70 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
      <div className="p-6 md:p-7">
        <h3 className="text-xl font-bold tracking-tight text-neutral-900 text-center">
          Private Inserate im Vergleich
        </h3>
        <p className="mt-2 text-center text-sm text-neutral-600 max-w-2xl mx-auto">
          Einmal zahlen pro Inserat – kein Abo. Unterschiedlich sind Laufzeit,
          Fotos und Sichtbarkeit.
        </p>

        <div className="mt-6 -mx-6 overflow-x-auto px-6 md:mx-0 md:px-0">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead>
              <tr className="border-b border-neutral-200">
                <th scope="col" className="py-3 pr-4 text-sm font-semibold text-neutral-500">
                  Leistung
                </th>
                {PLAN_ORDER.map((plan) => (
                  <th
                    key={plan}
                    scope="col"
                    className={cn(
                      "px-3 py-3 text-center",
                      plan === POPULAR_PLAN && "rounded-t-2xl bg-amber-50/70"
                    )}
                  >
                    <div className="text-sm font-bold text-neutral-900">
                      {pricingPlans[plan].name}
                    </div>
                    <div className="text-xs font-normal text-neutral-500">
                      {pricingPlans[plan].price === 0
                        ? "gratis"
                        : `CHF ${pricingPlans[plan].price} einmalig`}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {PRIVATE_COMPARISON_ROWS.map((row) => (
                <tr key={row.key} className="border-b border-neutral-100 last:border-b-0">
                  <th
                    scope="row"
                    className="py-3 pr-4 text-sm font-medium text-neutral-700 align-middle"
                  >
                    <span className="inline-flex items-center gap-1">
                      {row.label}
                      {row.tooltip && (
                        <HoverTooltip
                          side="top"
                          sideOffset={6}
                          content={row.tooltip}
                          contentClassName="max-w-xs border-primary/30 bg-primary py-1.5 text-primary-foreground"
                        >
                          <button
                            type="button"
                            aria-label={`Info: ${row.label}`}
                            className="inline-flex h-6 w-6 items-center justify-center rounded-full text-neutral-400 hover:text-primary hover:bg-primary/5 transition-colors"
                          >
                            <Info className="h-3.5 w-3.5" />
                          </button>
                        </HoverTooltip>
                      )}
                    </span>
                  </th>

                  {PLAN_ORDER.map((plan) => (
                    <td
                      key={plan}
                      className={cn(
                        "px-3 py-3 text-center align-middle",
                        plan === POPULAR_PLAN && "bg-amber-50/70"
                      )}
                    >
                      <ValueCell value={row.values[plan]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
