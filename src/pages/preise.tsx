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
import { PrivatVsGarageSection } from "@/components/buyauto/pricing/PrivatVsGarageSection";
import { BreadcrumbJsonLd } from "@/components/buyauto/Breadcrumbs";

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

  // CTA in the Privat-vs-Garage block below: switch the toggle and bring the
  // plans back into view so the change is visible.
  const handleSelectPersona = (next: PricingPersona) => {
    setPersona(next);
    document.getElementById("plaene")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <Head>
        <title>Preise – Inserate & Pakete für Private & Garagen | BuyAuto</title>
        <meta
          name="description"
          content="BuyAuto Preise für Privatkunden & Garagen. Transparente Pakete für Inserate, Premium Boost, Garage-Profil & Deal-Chat pro Fahrzeug."
        />
        <link rel="canonical" href="https://www.buyauto.ch/preise" />
        <meta property="og:title" content="Preise – Inserate & Pakete für Private & Garagen | BuyAuto" />
        <meta property="og:description" content="Transparente Pakete für Inserate, Premium Boost, Garage-Profil & Deal-Chat pro Fahrzeug." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.buyauto.ch/preise" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Schema-only: hero layout has no room for a visible crumb bar. */}
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Preise", href: "/preise" },
        ]}
      />

      <div className="min-h-screen bg-white">
        <PricingHero persona={persona} onPersonaChange={setPersona} />

        <main className="relative">
          <div id="plaene" className="container py-10 sm:py-12 scroll-mt-6">
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

            {/* The toggle above shows one persona at a time — this block is
                where both stand side by side, whatever the toggle says. */}
            <div className="mt-14 border-t border-neutral-200 pt-12">
              <PrivatVsGarageSection onSelectPersona={handleSelectPersona} />
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

// ISR so /preise joins the prerender path (was served as a frozen static file).
export const getStaticProps = async () => {
  return { props: {}, revalidate: 300 };
};