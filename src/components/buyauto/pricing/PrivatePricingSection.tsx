import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  calculateTotal,
  planIncludesPremium,
  PREMIUM_BOOST_PRICE,
  pricingPlans,
  type Plan,
} from "@/lib/buyauto/stripe_config";
import { privatePlanMarketingFeatures } from "@/components/buyauto/pricing/pricingData";

export function PrivatePricingSection() {
  const [selectedPlan, setSelectedPlan] = useState<Plan>("extended");
  const [isPremium, setIsPremium] = useState<boolean>(true);

  const premiumIncluded = planIncludesPremium(selectedPlan);
  const total = useMemo(
    () => calculateTotal(selectedPlan, isPremium),
    [selectedPlan, isPremium]
  );

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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {(Object.keys(pricingPlans) as Plan[]).map((planKey) => {
          const isPopular = planKey === "extended";
          const isSelected = selectedPlan === planKey;

          return (
            <button
              key={planKey}
              type="button"
              onClick={() => setSelectedPlan(planKey)}
              className={cn(
                "group relative text-left",
                "rounded-3xl transition-all duration-300",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              )}
            >
              {isPopular && (
                <div className="absolute -top-3 left-6 z-10">
                  <span className="inline-flex items-center gap-1 rounded-full bg-neutral-900 text-white text-xs font-semibold px-3 py-1 shadow-sm">
                    <Sparkles className="h-3.5 w-3.5" />
                    Beliebt
                  </span>
                </div>
              )}

              <Card
                className={cn(
                  "h-full rounded-3xl border bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70",
                  "shadow-[0_10px_30px_rgba(0,0,0,0.06)]",
                  "transition-all duration-300",
                  isSelected
                    ? "border-primary/40 ring-1 ring-primary/25 shadow-[0_18px_60px_rgba(0,0,0,0.10)]"
                    : "border-neutral-200/70 hover:border-neutral-300 hover:shadow-[0_14px_50px_rgba(0,0,0,0.08)]"
                )}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-neutral-900">
                        {pricingPlans[planKey].name}
                      </h3>
                      <p className="mt-1 text-sm text-neutral-500">
                        {pricingPlans[planKey].duration_days
                          ? `${pricingPlans[planKey].duration_days} Tage`
                          : "Unlimitiert"}
                      </p>
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
                  </div>
                </div>
              </Card>
            </button>
          );
        })}
      </div>

      <Card className="rounded-3xl border border-neutral-200/70 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
        <div className="p-6 md:p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="premium-boost"
                  className="text-base font-bold text-neutral-900"
                >
                  Premium Boost
                </Label>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                  Bis zu 3x höhere Verkaufschancen
                </span>
              </div>
              <p className="mt-1 text-sm text-neutral-600">
                {premiumIncluded
                  ? "In diesem Plan inklusive – dein Inserat wird während der gesamten Laufzeit hervorgehoben."
                  : "Dein Inserat wird für 30 Tage hervorgehoben."}
              </p>
            </div>

            <div className="flex items-center gap-4">
              {premiumIncluded ? (
                <div className="text-right">
                  <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
                    <Check className="h-4 w-4" />
                    Gratis inklusive
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-neutral-900">
                      + CHF {PREMIUM_BOOST_PRICE}
                    </div>
                    <div className="text-xs text-neutral-500">optional</div>
                  </div>
                  <Switch
                    id="premium-boost"
                    checked={isPremium}
                    onCheckedChange={setIsPremium}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </Card>

      <div className="rounded-3xl border border-neutral-200/70 bg-gradient-to-br from-white to-neutral-50 p-6 md:p-7 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm text-neutral-600">Total (Vorschau)</div>
            <div className="text-3xl font-bold tracking-tight text-neutral-900">
              CHF {total}
            </div>
            <div className="mt-1 text-xs text-neutral-500">
              Bezahlung erfolgt im Inserat-Flow.
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild size="lg" className="h-12 px-6 rounded-full">
              <Link href="/inserat-erstellen">Inserat erstellen</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 px-6 rounded-full"
            >
              <Link href="/suche">Fahrzeuge ansehen</Link>
            </Button>
          </div>
        </div>
      </div>
    </motion.section>
  );
}