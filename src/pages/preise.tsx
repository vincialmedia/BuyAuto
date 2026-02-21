import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { AnimatePresence } from "framer-motion";
import { PricingHero } from "@/components/buyauto/pricing/PricingHero";
import {
  PricingToggle,
  type PricingPersona,
} from "@/components/buyauto/pricing/PricingToggle";
import { PrivatePricingSection } from "@/components/buyauto/pricing/PrivatePricingSection";
import { GaragePricingSection } from "@/components/buyauto/pricing/GaragePricingSection";

export default function GaragePreisePage() {
  const router = useRouter();

  const initialPersona = useMemo<PricingPersona>(() => {
    const t = router.query.type;
    if (t === "garage") return "garage";
    if (t === "private") return "private";
    return "private";
  }, [router.query.type]);

  const [persona, setPersona] = useState<PricingPersona>("private");

  useEffect(() => {
    setPersona(initialPersona);
  }, [initialPersona]);

  return (
    <>
      <Head>
        <title>BuyAuto – Preise</title>
        <meta
          name="description"
          content="BuyAuto Preise für Privatkunden & Garagen. Transparente Pakete für Inserate, Premium Boost, Garage-Profil & Deal-Chat pro Fahrzeug."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-white">
        <PricingHero persona={persona} onPersonaChange={setPersona} />

        <main className="relative">
          <div className="container py-10 sm:py-12">
            <div className="flex justify-center sm:hidden mb-8">
              <div className="rounded-3xl bg-neutral-900 px-4 py-3 text-white w-full max-w-[520px]">
                <div className="flex justify-center">
                  <PricingToggle value={persona} onChange={setPersona} />
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {persona === "private" ? (
                <PrivatePricingSection key="private" />
              ) : (
                <GaragePricingSection key="garage" />
              )}
            </AnimatePresence>
          </div>

          <section className="relative overflow-hidden bg-neutral-50">
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(800px 360px at 20% 0%, rgba(239,68,68,0.10), transparent 55%), radial-gradient(700px 420px at 80% 20%, rgba(10,10,10,0.06), transparent 60%)",
              }}
            />
            <div className="relative container py-14 sm:py-16">
              <div className="mx-auto max-w-3xl text-center">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
                  Fragen?
                </h2>
                <p className="mt-3 text-neutral-600">
                  Schreib uns kurz – wir antworten schnell und helfen dir beim
                  passenden Setup.
                </p>

                <div className="mt-6 flex justify-center">
                  <a
                    href="mailto:kontakt@buyauto.ch"
                    className="inline-flex items-center justify-center rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-neutral-800 transition-colors"
                  >
                    kontakt@buyauto.ch
                  </a>
                </div>

                <p className="mt-6 text-xs text-neutral-500">
                  © {new Date().getFullYear()} BuyAuto. Alle Rechte vorbehalten.
                </p>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}