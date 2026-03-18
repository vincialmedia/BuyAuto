import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Info, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  garageIncludedFeatures,
  garagePackages,
} from "@/components/buyauto/pricing/pricingData";

export function GaragePricingSection() {
  return (
    <motion.section
      aria-label="Preise für Garagen"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className="space-y-10"
    >
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-neutral-900">
          Pakete für Garagen
        </h2>
        <p className="mt-3 text-neutral-600 max-w-2xl mx-auto">
          Mehr Anfragen. Weniger Aufwand. Dein Inventar online – mit VIN-PreFill,
          Leasing-Rechner und Deal-Chat pro Fahrzeug.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {garagePackages.map((pkg) => (
          <Card
            key={pkg.code}
            className={cn(
              "relative rounded-3xl border bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70",
              "shadow-[0_10px_30px_rgba(0,0,0,0.06)]",
              "transition-all duration-300",
              pkg.popular
                ? "border-primary/40 ring-1 ring-primary/25 shadow-[0_18px_60px_rgba(0,0,0,0.10)]"
                : "border-neutral-200/70 hover:border-neutral-300 hover:shadow-[0_14px_50px_rgba(0,0,0,0.08)]"
            )}
          >
            {pkg.popular && (
              <div className="absolute -top-3 left-6">
                <span className="inline-flex rounded-full bg-primary text-white text-xs font-bold px-3 py-1 shadow-sm">
                  Empfohlen
                </span>
              </div>
            )}

            <div className="p-6 flex h-full flex-col">
              <div className="text-center mb-5">
                <h3 className="text-lg font-bold text-neutral-900">
                  {pkg.name}
                </h3>

                <div className="mt-2 flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-bold tracking-tight text-neutral-900">
                    {pkg.price}
                  </span>
                  <span className="text-xs text-neutral-500">{pkg.period}</span>
                </div>

                <div className="mt-3 inline-flex items-center rounded-full bg-neutral-900/5 px-3 py-1 text-sm font-medium text-neutral-700">
                  {pkg.limit}
                </div>
              </div>

              <div className="mb-5 rounded-2xl bg-primary/5 border border-primary/10 px-4 py-3 text-sm font-medium text-primary">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  <span>{pkg.premiumIncluded}</span>
                </div>
              </div>

              <div className="flex-1 space-y-2">
                {pkg.features.map((feat) => (
                  <div
                    key={feat}
                    className="flex items-start gap-2 text-sm text-neutral-700"
                  >
                    <Check className="mt-0.5 h-4 w-4 text-neutral-400 flex-shrink-0" />
                    <span>
                      {feat === "Done-for-you Onboarding" || feat === "Done-for-you Onboarding*"
                        ? "Kompletter Bestand hochladen*"
                        : feat === "Kompletter Bestand hochladen"
                          ? "Kompletter Bestand hochladen*"
                          : feat}
                    </span>
                  </div>
                ))}
              </div>

              <Button asChild className="mt-6 h-12 rounded-full">
                <Link href="/auth?mode=register&type=garage">{pkg.cta}</Link>
              </Button>
            </div>
          </Card>
        ))}
      </div>
      <p className="text-center text-xs text-neutral-500">
        * Wir bringen dich komplett an den Start und übernehmen den Upload deines Inventars für dich.
      </p>

      <section className="rounded-3xl border border-neutral-200/70 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
        <div className="p-6 md:p-7">
          <h3 className="text-xl font-bold tracking-tight text-neutral-900 text-center">
            In jedem Paket inklusive
          </h3>
          <p className="mt-2 text-center text-sm text-neutral-600 max-w-2xl mx-auto">
            Diese Features bekommst du in allen Paketen – von Starter bis Pro.
          </p>

          <div className="mt-6">
            <TooltipProvider>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {garageIncludedFeatures.map((item) => (
                  <div key={item.key} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-neutral-800">
                        {item.label}
                      </span>

                      {item.tooltip && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              aria-label={`Info: ${item.label}`}
                              className="inline-flex h-6 w-6 items-center justify-center rounded-full text-neutral-500 hover:text-primary hover:bg-primary/5 transition-colors"
                            >
                              <Info className="h-4 w-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="max-w-xs text-xs"
                          >
                            {item.tooltip}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TooltipProvider>
          </div>
        </div>
      </section>

      <div className="rounded-3xl bg-gradient-to-r from-neutral-900 to-neutral-800 p-6 md:p-7 text-white shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex-1">
            <h3 className="text-xl md:text-2xl font-bold tracking-tight">
              100+ Inserate oder Spezialanforderungen?
            </h3>
            <p className="mt-2 text-white/80">
              Für grosse Bestände, mehrere Standorte oder Spezialprozesse.
              Individuelles Angebot auf Anfrage.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="h-12 px-6 rounded-full"
            >
              <a href="mailto:hello@buyauto.ch">
                <Mail className="h-4 w-4 mr-2" />
                Kontakt aufnehmen
              </a>
            </Button>
          </div>
        </div>
      </div>
    </motion.section>
  );
}