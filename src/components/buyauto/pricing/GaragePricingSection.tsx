import { motion } from "framer-motion";
import { Check, Info, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HoverTooltip } from "@/components/ui/hover-tooltip";
import { GaragePlanCards } from "@/components/buyauto/pricing/GaragePlanCards";
import { GarageFeatureMatrix } from "@/components/buyauto/pricing/GarageFeatureMatrix";
import { GarageTrustRow } from "@/components/buyauto/pricing/GarageTrustRow";
import {
  GARAGE_CORE_FEATURES,
  GARAGE_CUSTOM_FROM_CHF,
  GARAGE_CUSTOM_THRESHOLD,
  GARAGE_PLANS,
  formatChf,
  pricePerVehicleChf,
} from "@/lib/buyauto/garagePlans";

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
          Ein Fixpreis pro Monat – unabhängig davon, wie teuer die Autos in
          deinem Hof sind. Inklusive Profilseite, VIN-PreFill, Leasing-Rechner
          und Deal-Chat pro Fahrzeug.
        </p>
        <p className="mt-3 text-sm font-medium text-neutral-800">
          Ab CHF {formatChf(pricePerVehicleChf(GARAGE_PLANS.pro), 2)} pro Fahrzeug
          und Monat.
        </p>
      </div>

      <GaragePlanCards />

      <GarageTrustRow />

      <GarageFeatureMatrix />

      <Card className="rounded-3xl border border-neutral-200/70 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
        <div className="p-6 md:p-7">
          <h3 className="text-xl font-bold tracking-tight text-neutral-900 text-center">
            In jedem Paket inklusive
          </h3>
          <p className="mt-2 text-center text-sm text-neutral-600 max-w-2xl mx-auto">
            Die Basis bekommst du überall – auch im Starter. Du zahlst mehr für
            Volumen und dafür, dass wir dir Arbeit abnehmen, nicht für
            Grundfunktionen.
          </p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
            {GARAGE_CORE_FEATURES.map((item) => (
              <div key={item.key} className="flex items-start gap-2">
                <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-neutral-800">
                    {item.label}
                  </span>

                  {item.tooltip && (
                    <HoverTooltip
                      side="top"
                      sideOffset={6}
                      content={item.tooltip}
                      contentClassName="max-w-xs border-primary/30 bg-primary py-1.5 text-primary-foreground"
                    >
                      <button
                        type="button"
                        aria-label={`Info: ${item.label}`}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-neutral-500 hover:text-primary hover:bg-primary/5 transition-colors"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </HoverTooltip>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/50 px-4 py-3 text-center text-xs text-blue-900">
            <span className="font-semibold">Ehrlich gesagt:</span> Leads können
            wir nicht garantieren. Was du bekommst, ist eine saubere Präsenz und
            einen direkten Kanal für Anfragen – ohne Jahresvertrag.
          </div>
        </div>
      </Card>

      <div className="rounded-3xl bg-gradient-to-r from-neutral-900 to-neutral-800 p-6 md:p-7 text-white shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex-1">
            <h3 className="text-xl md:text-2xl font-bold tracking-tight">
              Mehr als {GARAGE_CUSTOM_THRESHOLD} Fahrzeuge oder mehrere Standorte?
            </h3>
            <p className="mt-2 text-white/80">
              Für grosse Bestände, mehrere Betriebe oder Spezialprozesse machen
              wir dir ein individuelles Angebot ab{" "}
              CHF {formatChf(GARAGE_CUSTOM_FROM_CHF)}/Monat – weiterhin als Fixpreis.
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
                Angebot anfragen
              </a>
            </Button>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
