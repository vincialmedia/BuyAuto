import React, { useState } from "react";
import type { GetStaticProps } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowRight, Car, ChevronRight, MessageCircle, Search, Sparkles, Zap } from "lucide-react";
import { BuyerGarageSection } from "@/components/buyauto/BuyerGarageSection";
import { FounderStory } from "@/components/buyauto/FounderStory";
import PremiumListings from "@/components/buyauto/PremiumListings";
import { SearchBarV2 } from "@/components/buyauto/SearchBarV2";
import { WhyBuyAutoSection } from "@/components/buyauto/WhyBuyAutoSection";
import { Button } from "@/components/ui/button";
import type { Listing } from "@/lib/buyauto/types";
import { searchListings } from "@/services/listingsService";

const FAQSection = dynamic(() => import("@/components/buyauto/FAQSection"), {
  loading: () => <div className="h-96 bg-white animate-pulse" />,
});
const SeoCopyBlock = dynamic(() => import("@/components/buyauto/SeoCopyBlock").then((m) => ({ default: m.SeoCopyBlock })), {
  loading: () => <div className="h-64 bg-neutral-50 animate-pulse" />,
});

type FilterCategory = "all" | "direct_purchase" | "leasing" | "lease_takeover";

interface HomePageProps {
  premiumListings: Listing[];
}

export default function HomePage({ premiumListings }: HomePageProps) {
  const [premiumFilter, setPremiumFilter] = useState<FilterCategory>("all");

  return (
    <div className="bg-[#fafafa] min-h-screen font-sans overflow-x-hidden">
      <Head>
        <title>Leasingübernahme Schweiz: Leasing übernehmen & abgeben | BuyAuto</title>
        <meta
          name="description"
          content="Leasing übernehmen oder ohne Verlust abgeben – auf BuyAuto, der Schweizer Plattform für Leasingübernahme. Geprüfte Angebote und persönlicher Concierge-Service."
        />
        <link rel="canonical" href="https://www.buyauto.ch/" />

        <meta property="og:title" content="Leasingübernahme Schweiz: Leasing übernehmen & abgeben | BuyAuto" />
        <meta
          property="og:description"
          content="Leasing übernehmen oder ohne Verlust abgeben – auf BuyAuto, der Schweizer Plattform für Leasingübernahme. Geprüfte Angebote und persönlicher Concierge-Service."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.buyauto.ch/" />
        <meta property="og:image" content="https://www.buyauto.ch/share-logo.jpg" />
        <meta property="og:image:width" content="1075" />
        <meta property="og:image:height" content="716" />
        <meta property="og:image:alt" content="BuyAuto Logo" />
        <meta property="og:site_name" content="BuyAuto" />
        <meta property="og:locale" content="de_CH" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Leasingübernahme Schweiz: Leasing übernehmen & abgeben | BuyAuto" />
        <meta
          name="twitter:description"
          content="Leasing übernehmen oder ohne Verlust abgeben – auf BuyAuto, der Schweizer Plattform für Leasingübernahme. Geprüfte Angebote und persönlicher Concierge-Service."
        />
        <meta name="twitter:image" content="https://www.buyauto.ch/share-logo.jpg" />

        <style>{`
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          @keyframes pulse-glow {
            0%, 100% { opacity: 0.5; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.05); }
          }
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          @keyframes gradient-shift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          .animate-fade-up-1 { animation: fadeUp 0.6s ease-out 0.1s both; }
          .animate-fade-up-2 { animation: fadeUp 0.6s ease-out 0.2s both; }
          .animate-fade-up-3 { animation: fadeUp 0.6s ease-out 0.3s both; }

          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }

          .search-bar-hover {
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .search-bar-hover:hover {
            transform: translateY(-4px) scale(1.01);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 40px rgba(239, 68, 68, 0.1);
          }
        `}</style>
      </Head>

      <section className="relative min-h-[60vh] md:min-h-[70vh] flex flex-col overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/Gemini_Generated_Image_rpm31frpm31frpm3.png"
            alt="Red Porsche Macan on Swiss mountain road"
            fill
            priority
            fetchPriority="high"
            className="object-cover object-[center_30%]"
            sizes="100vw"
            quality={75}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-900/70 to-neutral-900/40" />
        </div>

        <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="animate-fade-up-1 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.05] mb-4 max-w-4xl mx-auto">
              Raus aus dem Leasing.
              <br />
              Ohne <span className="text-red-500">Verlust.</span>
            </h1>
            <p className="animate-fade-up-2 text-lg sm:text-xl md:text-2xl text-white/80 font-medium max-w-2xl mx-auto drop-shadow-md">
              Die Schweizer Plattform für Leasingübernahme – übernimm ein bestehendes Leasing oder gib deins ohne Verlust ab.
            </p>
          </div>
        </div>
      </section>

      <div className="relative z-20 w-full px-4 sm:px-6 lg:px-8 -mt-8 md:-mt-10">
        <div className="animate-fade-up-3 max-w-5xl mx-auto">
          <div className="search-bar-hover bg-white rounded-2xl shadow-2xl shadow-black/15 p-3 md:p-4 relative group">
            <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_ease-in-out]" />
              </div>
            </div>
            <div className="relative z-10">
              <SearchBarV2 />
            </div>
          </div>
        </div>
      </div>

      <div className="scroll-mt-4">
        <PremiumListings initialListings={premiumListings} externalFilter={premiumFilter} onFilterChange={setPremiumFilter} />
      </div>

      <WhyBuyAutoSection />
      <BuyerGarageSection />

      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-50 to-white" />
        <div
          className="absolute top-20 left-10 w-72 h-72 bg-red-500/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "4s" }}
        />
        <div
          className="absolute bottom-20 right-10 w-72 h-72 bg-neutral-200/50 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "5s", animationDelay: "1s" }}
        />

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-14 md:mb-20">
            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-red-500/10 text-red-600 text-sm font-bold uppercase tracking-wider mb-5 hover:bg-red-500/20 transition-colors cursor-default">
              <Zap className="w-4 h-4" />
              So einfach geht&apos;s
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-neutral-900 tracking-tight">
              So funktioniert <span className="text-red-500">BuyAuto</span>
            </h2>
          </div>

          <div className="relative">
            <div className="grid md:grid-cols-3 gap-8 md:gap-6">
              {[
                {
                  step: "01",
                  title: "Weg wählen",
                  desc: "Entscheide, ob du kaufen, leasen oder eine Leasingübernahme suchst.",
                  icon: Car,
                },
                {
                  step: "02",
                  title: "Angebote vergleichen",
                  desc: "Filtere nach Marke, Modell, Preis, Laufzeit und Anbieter.",
                  icon: Search,
                },
                {
                  step: "03",
                  title: "Kontakt aufnehmen",
                  desc: "Tritt direkt mit dem Anbieter oder der Garage in Kontakt und bring den Deal ins Rollen.",
                  icon: MessageCircle,
                },
              ].map((item, i) => (
                <div key={i} className="group relative">
                  <div className="relative bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl border border-neutral-200 hover:border-red-200 transition-all duration-500 hover:-translate-y-2 overflow-hidden">
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="flex justify-center mb-6">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-2xl bg-neutral-100 group-hover:bg-red-500 flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                          <item.icon className="w-7 h-7 text-neutral-600 group-hover:text-white transition-colors duration-300" />
                        </div>
                        <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          {item.step}
                        </span>
                      </div>
                    </div>

                    <div className="text-center relative z-10">
                      <h3 className="text-xl font-bold text-neutral-900 mb-3 group-hover:text-red-600 transition-colors duration-300">
                        {item.title}
                      </h3>
                      <p className="text-neutral-500 text-sm leading-relaxed max-w-[280px] mx-auto">{item.desc}</p>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link href="/suche">
              <Button
                size="lg"
                className="bg-neutral-900 text-white hover:bg-neutral-800 font-bold rounded-2xl px-10 shadow-xl hover:shadow-2xl h-14 text-base group hover:scale-105 transition-all duration-300"
              >
                Jetzt Fahrzeuge entdecken
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="relative bg-red-500 rounded-[2rem] p-10 md:p-14 overflow-hidden group hover:shadow-2xl hover:shadow-red-500/20 transition-all duration-500">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-[100px] group-hover:scale-150 transition-transform duration-700" />
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-black/10 rounded-full blur-[80px] group-hover:scale-125 transition-transform duration-700" />

            <div className="absolute inset-0 opacity-30">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_4s_ease-in-out_infinite]" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3">Bereit loszufahren?</h2>
                <p className="text-white/80 text-lg md:text-xl max-w-lg">
                  Erstelle jetzt dein Inserat oder finde dein nächstes passendes Auto.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/inserat-erstellen">
                  <Button
                    size="lg"
                    className="bg-white text-red-600 hover:bg-neutral-100 font-bold rounded-2xl px-8 shadow-2xl shadow-black/20 h-14 w-full sm:w-auto hover:scale-105 transition-all duration-300 group/btn"
                  >
                    Inserat erstellen
                    <Sparkles className="w-4 h-4 ml-2 group-hover/btn:rotate-12 transition-transform" />
                  </Button>
                </Link>
                <Link href="/suche">
                  <Button
                    size="lg"
                    className="bg-white/20 border-2 border-white text-white hover:bg-white hover:text-red-600 font-bold rounded-2xl px-8 h-14 w-full sm:w-auto hover:scale-105 transition-all duration-300 backdrop-blur-sm"
                  >
                    Alle Fahrzeuge
                    <ChevronRight className="w-5 h-5 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <FounderStory />
      <FAQSection />
      <SeoCopyBlock />

      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-neutral-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">Bereit für dein nächstes Auto?</h2>
          <p className="text-lg md:text-xl text-neutral-300 mb-8 max-w-2xl mx-auto">
            Finde passende Fahrzeuge aus der ganzen Schweiz oder erstelle dein Inserat in wenigen Schritten.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/suche">
              <Button
                size="lg"
                className="bg-red-500 text-white hover:bg-red-600 font-bold rounded-xl px-10 h-14 w-full sm:w-auto hover:scale-105 transition-all duration-300 shadow-lg shadow-red-500/25"
              >
                Fahrzeuge suchen
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/inserat-erstellen">
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-neutral-600 bg-white text-neutral-900 hover:bg-neutral-100 hover:text-neutral-900 font-bold rounded-xl px-10 h-14 w-full sm:w-auto hover:scale-105 transition-all duration-300"
              >
                Inserat erstellen
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

// ISR: premium listings are part of the static HTML (no client fetch, no
// layout shift) and refresh in the background every 5 minutes.
export const getStaticProps: GetStaticProps<HomePageProps> = async () => {
  try {
    const [directPurchaseResult, leaseTakeoverResult] = await Promise.all([
      searchListings({ page: 1, premiumOnly: true, dealType: "direct_purchase" }),
      searchListings({ page: 1, premiumOnly: true, dealType: "lease_takeover" }),
    ]);

    const ordered = [...directPurchaseResult.items, ...leaseTakeoverResult.items];
    const uniqueById = new Map<string, Listing>();
    for (const l of ordered) uniqueById.set(l.id, l);

    // Strip undefined fields so Next can serialize.
    const premiumListings = JSON.parse(JSON.stringify(Array.from(uniqueById.values()))) as Listing[];

    return { props: { premiumListings }, revalidate: 300 };
  } catch (error) {
    console.error("Homepage premium listings fetch failed:", error);
    return { props: { premiumListings: [] }, revalidate: 60 };
  }
};