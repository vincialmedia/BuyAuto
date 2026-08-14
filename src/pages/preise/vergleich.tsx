import Head from "next/head";
import Link from "next/link";
import { ArrowRight, Building2, Check, User } from "lucide-react";
import { Breadcrumbs } from "@/components/buyauto/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PrivateFeatureMatrix } from "@/components/buyauto/pricing/PrivateFeatureMatrix";
import { GarageFeatureMatrix } from "@/components/buyauto/pricing/GarageFeatureMatrix";
import { GarageTrustRow } from "@/components/buyauto/pricing/GarageTrustRow";
import { pricingPlans } from "@/lib/buyauto/stripe_config";
import {
  GARAGE_MAX_PHOTOS,
  GARAGE_PLANS,
  GARAGE_PLAN_ORDER,
  formatChf,
  pricePerVehicleChf,
} from "@/lib/buyauto/garagePlans";

/**
 * /preise shows one persona at a time (toggle) — this page is the
 * side-by-side view: private vs. garage, both feature matrices, and the
 * per-vehicle math across both worlds.
 */

// What a private Verlängert listing costs per active month — the honest
// benchmark the garage volume discount is measured against.
const privatePerMonthChf =
  pricingPlans.extended.price / ((pricingPlans.extended.duration_days ?? 90) / 30);

const AUDIENCES = [
  {
    icon: User,
    title: "Du verkaufst dein eigenes Auto",
    subtitle: "Private Inserate",
    points: [
      `Einmal zahlen pro Inserat: gratis, CHF ${pricingPlans.extended.price} oder CHF ${pricingPlans.unlimited.price} – kein Abo`,
      "Laufzeit je nach Plan: 60 Tage, 90 Tage oder online bis verkauft",
      "Bis 15 Fotos, Premium-Platzierung je nach Plan inklusive",
      "Anfragen direkt im Chat am Inserat",
    ],
    cta: { label: "Private Pläne ansehen", href: "/preise?type=private" },
  },
  {
    icon: Building2,
    title: "Du verkaufst als Garage",
    subtitle: "Monatspakete",
    points: [
      `Fixpreis pro Monat ab CHF ${formatChf(GARAGE_PLANS.starter.monthlyPriceChf)} – monatlich kündbar`,
      `Bis ${GARAGE_PLANS.pro.listingLimit} Fahrzeuge gleichzeitig online, ab CHF ${formatChf(pricePerVehicleChf(GARAGE_PLANS.pro), 2)} pro Fahrzeug`,
      `Profilseite, VIN-PreFill, Leasing-Rechner, Deal-Chat & Eintauschwert-Rechner – bis ${GARAGE_MAX_PHOTOS} Fotos`,
      "Premium-Boosts je nach Paket inklusive",
    ],
    cta: { label: "Garagen-Pakete ansehen", href: "/preise?type=garage" },
  },
];

export default function PreisVergleichPage() {
  return (
    <>
      <Head>
        <title>Preisvergleich – Private Inserate & Garagen-Pakete | BuyAuto</title>
        <meta
          name="description"
          content="Alle BuyAuto-Preise nebeneinander: private Inserat-Pläne und Garagen-Monatspakete im direkten Vergleich – Laufzeiten, Fotos, Premium, Kosten pro Fahrzeug."
        />
        <link rel="canonical" href="https://www.buyauto.ch/preise/vergleich" />
        <meta property="og:title" content="Preisvergleich – Private Inserate & Garagen-Pakete | BuyAuto" />
        <meta
          property="og:description"
          content="Private Pläne und Garagen-Pakete side-by-side: Leistungen, Grenzen und was ein aktives Inserat pro Monat wirklich kostet."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.buyauto.ch/preise/vergleich" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-white">
        <div className="container pt-6">
          <Breadcrumbs
            items={[
              { name: "Home", href: "/" },
              { name: "Preise", href: "/preise" },
              { name: "Vergleich", href: "/preise/vergleich" },
            ]}
          />
        </div>

        <main className="container py-10 sm:py-12 space-y-12">
          <header className="text-center max-w-2xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-neutral-900">
              Alle Preise im Vergleich
            </h1>
            <p className="mt-3 text-neutral-600">
              Private zahlen einmal pro Inserat, Garagen einen Fixpreis pro
              Monat. Hier stehen beide Welten nebeneinander – inklusive der
              Rechnung, was ein aktives Inserat pro Monat kostet.
            </p>
          </header>

          {/* Privat vs. Garage, side by side */}
          <section aria-label="Privat oder Garage" className="grid gap-4 md:grid-cols-2">
            {AUDIENCES.map((audience) => (
              <Card
                key={audience.title}
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
                      <h2 className="text-lg font-bold text-neutral-900">{audience.title}</h2>
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
                    <Button asChild size="lg" variant="outline" className="h-11 w-full rounded-full">
                      <Link href={audience.cta.href}>
                        {audience.cta.label}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </section>

          <div className="rounded-2xl border border-blue-100 bg-blue-50/50 px-4 py-3 text-center text-sm text-blue-900 max-w-3xl mx-auto">
            <span className="font-semibold">Faustregel:</span> Wer regelmässig
            oder gewerblich Fahrzeuge verkauft, fährt mit einem Garagen-Paket
            besser – pro Fahrzeug günstiger, mit Händler-Werkzeugen, und der
            Bestand bleibt dauerhaft online.
          </div>

          <PrivateFeatureMatrix />

          <GarageFeatureMatrix />

          <GarageTrustRow />

          {/* The per-vehicle math across both worlds */}
          <section
            aria-label="Kosten pro Fahrzeug und Monat"
            className="rounded-3xl border border-neutral-200/70 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 shadow-[0_10px_30px_rgba(0,0,0,0.06)]"
          >
            <div className="p-6 md:p-7">
              <h3 className="text-xl font-bold tracking-tight text-neutral-900 text-center">
                Was kostet ein aktives Inserat pro Monat?
              </h3>
              <p className="mt-2 text-center text-sm text-neutral-600 max-w-2xl mx-auto">
                Garagen-Pakete sind ein Mengenrabatt: je grösser das Paket,
                desto günstiger das einzelne Fahrzeug – bezahlt bleibt jedes.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-2xl bg-neutral-900/5 px-4 py-4 text-center">
                  <div className="text-xl font-bold text-neutral-900">
                    CHF {formatChf(privatePerMonthChf, 2)}
                  </div>
                  <div className="mt-1 text-xs text-neutral-600">
                    Privat «{pricingPlans.extended.name}» (CHF{" "}
                    {pricingPlans.extended.price} / {pricingPlans.extended.duration_days} Tage)
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
          </section>

          <div className="flex flex-col sm:flex-row justify-center gap-3 pb-4">
            <Button asChild size="lg" className="h-12 rounded-full px-8">
              <Link href="/preise">Zur Preisseite</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-full px-8">
              <Link href="/auth?view=register&type=garage">Als Garage registrieren</Link>
            </Button>
          </div>
        </main>
      </div>
    </>
  );
}

// ISR like /preise — the page renders only config-derived content.
export const getStaticProps = async () => {
  return { props: {}, revalidate: 300 };
};
