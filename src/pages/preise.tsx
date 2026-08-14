import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { AnimatePresence } from "framer-motion";
import { PricingHero } from "@/components/buyauto/pricing/PricingHero";
import {
  PricingToggle,
  type PricingPersona,
} from "@/components/buyauto/pricing/PricingToggle";
import { PrivatePricingSection } from "@/components/buyauto/pricing/PrivatePricingSection";
import { GaragePricingSection } from "@/components/buyauto/pricing/GaragePricingSection";
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

            {/* The toggle shows one persona at a time — the side-by-side view
                lives on its own page. */}
            <p className="mt-10 text-center text-sm text-neutral-600">
              Du willst alles nebeneinander sehen?{" "}
              <Link
                href="/preise/vergleich"
                className="font-semibold text-neutral-900 underline underline-offset-4 hover:text-primary"
              >
                Private Pläne & Garagen-Pakete im Vergleich
              </Link>
            </p>
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