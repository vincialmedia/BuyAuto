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
        </main>
      </div>
    </>
  );
}