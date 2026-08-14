import Link from "next/link";
import { Check, Loader2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  GARAGE_PLAN_ORDER,
  GARAGE_PLANS,
  formatChf,
  perVehicleLine,
  type GaragePlanCode,
} from "@/lib/buyauto/garagePlans";

export interface GaragePlanCardsProps {
  /** Where the CTA links to. Omit when using onSelect (button instead of link). */
  hrefFor?: (code: GaragePlanCode) => string;
  /** Checkout handler for the signed-in surfaces (/garage-plan, dashboard). */
  onSelect?: (code: GaragePlanCode) => void;
  /** Plan the garage is already on — rendered as "Aktives Paket". */
  activeCode?: GaragePlanCode | null;
  /** Plan whose CTA is currently opening Stripe. */
  loadingCode?: GaragePlanCode | null;
  disabled?: boolean;
}

/**
 * The garage packages, in the same visual language as the private plans:
 * rounded cards on a soft shadow, the recommended tier lifted by the brand
 * gold halo and a "Beliebt" badge, and what a tier does *not* include spelled
 * out with a grey X rather than left to inference.
 *
 * Used by /preise, /garage-plan and the dashboard billing tab so the three
 * surfaces can never drift apart again.
 */
export function GaragePlanCards({
  hrefFor,
  onSelect,
  activeCode = null,
  loadingCode = null,
  disabled = false,
}: GaragePlanCardsProps) {
  return (
    <div className="flex flex-col gap-5 md:grid md:grid-cols-3">
      {GARAGE_PLAN_ORDER.map((code) => {
        const plan = GARAGE_PLANS[code];
        const isPopular = Boolean(plan.popular);
        const isActive = activeCode === code;
        const isLoading = loadingCode === code;

        return (
          <div
            key={code}
            className={cn(
              "group relative",
              // The centre-stage effect needs an actual centre. Stacked on a
              // phone there is none, so the recommended tier leads instead of
              // sitting second where it reads as "the middle one".
              isPopular && "order-first md:order-none"
            )}
          >
            {isPopular && !isActive && (
              <div className="absolute -top-3 left-6 z-10">
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-white text-xs font-semibold px-3 py-1 shadow-sm">
                  <Sparkles className="h-3.5 w-3.5" />
                  Beliebt
                </span>
              </div>
            )}

            {isActive && (
              <div className="absolute -top-3 left-6 z-10">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 text-white text-xs font-semibold px-3 py-1 shadow-sm">
                  <Check className="h-3.5 w-3.5" />
                  Aktiv
                </span>
              </div>
            )}

            <Card
              className={cn(
                "flex h-full flex-col rounded-3xl border bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70",
                "transition-all duration-300",
                isActive
                  ? "border-emerald-300 ring-1 ring-emerald-300/70 shadow-[0_10px_40px_rgba(16,185,129,0.18)]"
                  : isPopular
                    ? "border-amber-300 ring-1 ring-amber-300/70 shadow-[0_0_40px_rgba(251,191,36,0.35)] hover:shadow-[0_0_55px_rgba(251,191,36,0.45)]"
                    : "border-neutral-200/70 shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:border-neutral-300 hover:shadow-[0_14px_50px_rgba(0,0,0,0.08)]"
              )}
            >
              <div className="flex h-full flex-col p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-neutral-900">{plan.name}</h3>
                    <p className="mt-1 text-sm text-neutral-500">{plan.tagline}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-3xl font-bold tracking-tight text-neutral-900">
                      CHF {formatChf(plan.monthlyPriceChf)}
                    </div>
                    <div className="text-xs text-neutral-500">pro Monat</div>
                  </div>
                </div>

                {/* Two headline entitlements, so the ladder is readable at a glance. */}
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <div className="rounded-2xl bg-neutral-900/5 px-3 py-2.5 text-center">
                    <div className="text-lg font-bold text-neutral-900">{plan.listingLimit}</div>
                    <div className="text-[11px] leading-tight text-neutral-600">Fahrzeuge online</div>
                  </div>
                  <div
                    className={cn(
                      "rounded-2xl px-3 py-2.5 text-center",
                      isPopular ? "bg-amber-50 border border-amber-100" : "bg-primary/5 border border-primary/10"
                    )}
                  >
                    <div
                      className={cn(
                        "text-lg font-bold",
                        isPopular ? "text-amber-700" : "text-primary"
                      )}
                    >
                      {plan.premiumPerMonth}
                    </div>
                    <div className="text-[11px] leading-tight text-neutral-600">Premium-Boosts / Mt.</div>
                  </div>
                </div>

                <p className="mt-3 text-xs text-neutral-500">{perVehicleLine(plan)}</p>

                <div className="mt-5 space-y-2">
                  {plan.highlights.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-start gap-2 text-sm text-neutral-700"
                    >
                      <Check className="mt-0.5 h-4 w-4 text-primary flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}

                  {plan.notIncluded.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-start gap-2 text-sm text-neutral-400"
                    >
                      <X className="mt-0.5 h-4 w-4 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-auto pt-6">
                  {isActive ? (
                    <Button
                      size="lg"
                      disabled
                      className="h-11 w-full rounded-full bg-emerald-600 text-white hover:bg-emerald-600"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Aktives Paket
                    </Button>
                  ) : onSelect ? (
                    <Button
                      size="lg"
                      onClick={() => onSelect(code)}
                      disabled={disabled || isLoading}
                      className={cn(
                        "h-11 w-full rounded-full",
                        isPopular
                          ? "bg-gradient-to-r from-amber-400 to-amber-500 text-white hover:from-amber-500 hover:to-amber-600"
                          : ""
                      )}
                      variant={isPopular ? "default" : "outline"}
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : plan.cta}
                    </Button>
                  ) : (
                    <Button
                      asChild
                      size="lg"
                      className={cn(
                        "h-11 w-full rounded-full",
                        isPopular
                          ? "bg-gradient-to-r from-amber-400 to-amber-500 text-white hover:from-amber-500 hover:to-amber-600"
                          : ""
                      )}
                      variant={isPopular ? "default" : "outline"}
                    >
                      <Link href={hrefFor ? hrefFor(code) : "/auth?view=register&type=garage"}>
                        {plan.cta}
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
