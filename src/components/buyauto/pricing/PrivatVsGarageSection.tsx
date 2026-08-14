import { ArrowUp, Building2, Check, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { pricingPlans } from "@/lib/buyauto/stripe_config";
import {
  GARAGE_MAX_PHOTOS,
  GARAGE_PLANS,
  GARAGE_PLAN_ORDER,
  formatChf,
  pricePerVehicleChf,
} from "@/lib/buyauto/garagePlans";
import type { PricingPersona } from "@/components/buyauto/pricing/PricingToggle";

// What a private Verlängert listing costs per active month — the honest
// benchmark the garage volume discount is measured against.
const privatePerMonthChf =
  pricingPlans.extended.price / ((pricingPlans.extended.duration_days ?? 90) / 30);

const AUDIENCES: {
  persona: PricingPersona;
  icon: typeof User;
  title: string;
  subtitle: string;
  points: string[];
  cta: string;
}[] = [
  {
    persona: "private",
    icon: User,
    title: "Du verkaufst dein eigenes Auto",
    subtitle: "Private Inserate",
    points: [
      `Einmal zahlen pro Inserat: gratis, CHF ${pricingPlans.extended.price} oder CHF ${pricingPlans.unlimited.price} – kein Abo`,
      "Laufzeit je nach Plan: 60 Tage, 90 Tage oder online bis verkauft",
      "Bis 15 Fotos, Premium-Platzierung je nach Plan inklusive",
      "Anfragen direkt im Chat am Inserat",
    ],
    cta: "Private Pläne ansehen",
  },
  {
    persona: "garage",
    icon: Building2,
    title: "Du verkaufst als Garage",
    subtitle: "Monatspakete",
    points: [
      `Fixpreis pro Monat ab CHF ${formatChf(GARAGE_PLANS.starter.monthlyPriceChf)} – monatlich kündbar`,
      `Bis ${GARAGE_PLANS.pro.listingLimit} Fahrzeuge gleichzeitig online, ab CHF ${formatChf(pricePerVehicleChf(GARAGE_PLANS.pro), 2)} pro Fahrzeug`,
      `Profilseite, VIN-PreFill, Leasing-Rechner, Deal-Chat & Eintauschwert-Rechner – bis ${GARAGE_MAX_PHOTOS} Fotos`,
      "Premium-Boosts je nach Paket inklusive",
    ],
    cta: "Garagen-Pakete ansehen",
  },
];

/**
 * The side-by-side block under the persona toggle on /preise: who belongs on
 * which side, and what an active listing costs per month across both worlds.
 * The toggle above only ever shows one persona — this is the one place both
 * stand next to each other.
 */
export function PrivatVsGarageSection({
  onSelectPersona,
}: {
  /** Switches the toggle above and scrolls back to the plans. */
  onSelectPersona: (persona: PricingPersona) => void;
}) {
  return (
    <section aria-label="Privat oder Garage im Vergleich" className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900">
          Privat oder Garagen-Paket?
        </h2>
        <p className="mt-2 text-neutral-600 max-w-2xl mx-auto text-sm md:text-base">
          Private zahlen einmal pro Inserat, Garagen einen Fixpreis pro Monat.
          Beide Welten auf einen Blick – inklusive der Rechnung pro Fahrzeug.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {AUDIENCES.map((audience) => (
          <Card
            key={audience.persona}
            className="flex h-full flex-col rounded-3xl border border-neutral-200/70 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 shadow-[0_10px_30px_rgba(0,0,0,0.06)]"
          >
            <div className="flex h-full flex-col p-6 md:p-7">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-900 text-white">
                  <audience.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    {audience.subtitle}
                  </div>
                  <h3 className="text-lg font-bold text-neutral-900">{audience.title}</h3>
                </div>
              </div>

              <div className="mt-5 space-y-2">
                {audience.points.map((point) => (
                  <div key={point} className="flex items-start gap-2 text-sm text-neutral-700">
                    <Check className="mt-0.5 h-4 w-4 text-primary flex-shrink-0" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>

              <div className="mt-auto pt-6">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-11 w-full rounded-full"
                  onClick={() => onSelectPersona(audience.persona)}
                >
                  {audience.cta}
                  <ArrowUp className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50/50 px-4 py-3 text-center text-sm text-blue-900 max-w-3xl mx-auto">
        <span className="font-semibold">Faustregel:</span> Wer regelmässig oder
        gewerblich Fahrzeuge verkauft, fährt mit einem Garagen-Paket besser –
        pro Fahrzeug günstiger, mit Händler-Werkzeugen, und der Bestand bleibt
        dauerhaft online.
      </div>

      <Card className="rounded-3xl border border-neutral-200/70 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
        <div className="p-6 md:p-7">
          <h3 className="text-xl font-bold tracking-tight text-neutral-900 text-center">
            Was kostet ein aktives Inserat pro Monat?
          </h3>
          <p className="mt-2 text-center text-sm text-neutral-600 max-w-2xl mx-auto">
            Garagen-Pakete sind ein Mengenrabatt: je grösser das Paket, desto
            günstiger das einzelne Fahrzeug – bezahlt bleibt jedes.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-neutral-900/5 px-4 py-4 text-center">
              <div className="text-xl font-bold text-neutral-900">
                CHF {formatChf(privatePerMonthChf, 2)}
              </div>
              <div className="mt-1 text-xs text-neutral-600">
                Privat «{pricingPlans.extended.name}» (CHF {pricingPlans.extended.price} /{" "}
                {pricingPlans.extended.duration_days} Tage)
              </div>
            </div>

            {GARAGE_PLAN_ORDER.map((code) => {
              const plan = GARAGE_PLANS[code];
              return (
                <div
                  key={code}
                  className="rounded-2xl border border-primary/10 bg-primary/5 px-4 py-4 text-center"
                >
                  <div className="text-xl font-bold text-primary">
                    CHF {formatChf(pricePerVehicleChf(plan), 2)}
                  </div>
                  <div className="mt-1 text-xs text-neutral-600">
                    Garage «{plan.name}» ({plan.listingLimit} Fahrzeuge)
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </section>
  );
}
