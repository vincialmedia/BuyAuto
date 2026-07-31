import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PREMIUM_BOOST_PRICE, pricingPlans, type Plan } from "@/lib/buyauto/stripe_config";
import { privatePlanMarketingFeatures } from "@/components/buyauto/pricing/pricingData";
import { PrivatePlanExclusions } from "@/components/buyauto/pricing/PrivatePlanExclusions";

export function PrivatePricingSection() {
  return (
    <motion.section
      aria-label="Preise für Privatkunden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className="space-y-10"
    >
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-neutral-900">
          Inserat-Plan auswählen
        </h2>
        <p className="mt-3 text-neutral-600 max-w-xl mx-auto">
          Wähle Laufzeit und Sichtbarkeit. Premium Boost kannst du optional
          dazunehmen.
        </p>
      </div>

      <div className="flex flex-col gap-4 md:grid md:grid-cols-3">
        {(Object.keys(pricingPlans) as Plan[]).map((planKey) => {
          const isPopular = planKey === "extended";

          return (
            <div
              key={planKey}
              className={cn(
                "group relative",
                // Stacked on a phone there is no centre for the centre-stage
                // effect to work on, so the recommended plan leads.
                isPopular && "order-first md:order-none"
              )}
            >
              {isPopular && (
                <div className="absolute -top-3 left-6 z-10">
                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-white text-xs font-semibold px-3 py-1 shadow-sm">
                    <Sparkles className="h-3.5 w-3.5" />
                    Beliebt
                  </span>
                </div>
              )}

              <Card
                className={cn(
                  "flex h-full flex-col rounded-3xl border bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70",
                  "transition-all duration-300",
                  isPopular
                    ? // The brand gold (homepage Premium section amber family)
                      // as a soft halo around Verlängert.
                      "border-amber-300 ring-1 ring-amber-300/70 shadow-[0_0_40px_rgba(251,191,36,0.35)] hover:shadow-[0_0_55px_rgba(251,191,36,0.45)]"
                    : "border-neutral-200/70 shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:border-neutral-300 hover:shadow-[0_14px_50px_rgba(0,0,0,0.08)]"
                )}
              >
                <div className="flex h-full flex-col p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-neutral-900">
                        {pricingPlans[planKey].name}
                      </h3>
                      <p className="mt-1 text-sm text-neutral-500">
                        {pricingPlans[planKey].duration_days
                          ? `${pricingPlans[planKey].duration_days} Tage`
                          : "Online bis verkauft"}
                      </p>
                      {planKey === "extended" && (
                        <p className="mt-1 text-xs text-neutral-500">
                          Premium im Wert von CHF {PREMIUM_BOOST_PRICE} inklusive ·
                          weniger als 60 Rappen pro Tag
                        </p>
                      )}
                      {planKey === "unlimited" && (
                        <p className="mt-1 text-xs text-neutral-500">
                          Premium-Wert CHF {PREMIUM_BOOST_PRICE}/Monat dauerhaft inklusive
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="text-3xl font-bold tracking-tight text-neutral-900">
                        CHF {pricingPlans[planKey].price}
                      </div>
                      <div className="text-xs text-neutral-500">einmalig</div>
                    </div>
                  </div>

                  <div className="mt-5 space-y-2">
                    {privatePlanMarketingFeatures[planKey].map((feature) => (
                      <div
                        key={feature}
                        className="flex items-start gap-2 text-sm text-neutral-700"
                      >
                        <Check className="mt-0.5 h-4 w-4 text-primary flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                    <PrivatePlanExclusions plan={planKey} />
                  </div>

                  <div className="mt-auto pt-6">
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
                      <Link href={`/inserat-erstellen?plan=${planKey}`}>Inserat erstellen</Link>
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          );
        })}
      </div>

      <Card className="rounded-3xl border border-neutral-200/70 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
        <div className="p-6 md:p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-neutral-900">Premium Boost</span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                  Bis zu 3x höhere Verkaufschancen
                </span>
              </div>
              <p className="mt-1 text-sm text-neutral-600">
                Dein Inserat wird 30 Tage hervorgehoben. In Verlängert und
                Unlimitiert bereits inklusive – für Standard im Inserat-Flow
                dazubuchbar.
              </p>
            </div>

            <div className="text-right shrink-0">
              <div className="text-sm font-semibold text-neutral-900">
                + CHF {PREMIUM_BOOST_PRICE}
              </div>
              <div className="text-xs text-neutral-500">optional</div>
            </div>
          </div>
        </div>
      </Card>
    </motion.section>
  );
}
