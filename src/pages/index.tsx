import React, { useState } from "react";
import type { GetStaticProps } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowRight, Car, MessageCircle, Search, Zap } from "lucide-react";
import { BuyerGarageSection } from "@/components/buyauto/BuyerGarageSection";
import { FounderStory } from "@/components/buyauto/FounderStory";
import PremiumListings from "@/components/buyauto/PremiumListings";
import { SearchBarV2 } from "@/components/buyauto/SearchBarV2";
import { SourceCitation } from "@/components/buyauto/SourceCitation";
import { WhyBuyAutoSection } from "@/components/buyauto/WhyBuyAutoSection";
import { LazyHydrate } from "@/components/layout/LazyHydrate";
import { Button } from "@/components/ui/button";
import { CEMBRA, FEE_SHORT } from "@/lib/buyauto/facts";
import { countLabel, pluralize } from "@/lib/buyauto/format";
import type { Listing } from "@/lib/buyauto/types";
import { getLiveInventoryStats, loadPremiumCarouselListings } from "@/services/listingsService";

const FAQSection = dynamic(() => import("@/components/buyauto/FAQSection"), {
  loading: () => <div className="h-96 bg-white animate-pulse" />,
});
const SeoCopyBlock = dynamic(() => import("@/components/buyauto/SeoCopyBlock").then((m) => ({ default: m.SeoCopyBlock })), {
  loading: () => <div className="h-64 bg-neutral-50 animate-pulse" />,
});

type FilterCategory = "all" | "direct_purchase" | "leasing" | "lease_takeover";

interface HomePageProps {
  premiumListings: Listing[];
  /** Live Leasingübernahmen right now (same rule as the hub); null when the read failed. */
  liveTakeoverCount: number | null;
}

export default function HomePage({ premiumListings, liveTakeoverCount }: HomePageProps) {
  const [premiumFilter, setPremiumFilter] = useState<FilterCategory>("all");
  // No number without live data: a failed read (null) or an empty inventory hides the line.
  const liveCount = liveTakeoverCount && liveTakeoverCount > 0 ? liveTakeoverCount : null;

  return (
    <div className="bg-[#fafafa] min-h-screen font-sans overflow-x-hidden">
      <Head>
        <title>Leasingübernahme Schweiz: Leasing übernehmen & abgeben | BuyAuto</title>
        <meta
          name="description"
          content="Leasing übernehmen oder abgeben auf BuyAuto, einem Schweizer Marktplatz für Leasingübernahmen von Privatpersonen und Garagen."
        />
        <link rel="canonical" href="https://www.buyauto.ch/" />

        <meta property="og:title" content="Leasingübernahme Schweiz: Leasing übernehmen & abgeben | BuyAuto" />
        <meta
          property="og:description"
          content="Leasing übernehmen oder abgeben auf BuyAuto, einem Schweizer Marktplatz für Leasingübernahmen von Privatpersonen und Garagen."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.buyauto.ch/" />
        {/* key matches _app's fallback og:image so next/head dedupes them. */}
        <meta key="og:image" property="og:image" content="https://www.buyauto.ch/share-logo.jpg" />
        <meta property="og:image:width" content="1075" />
        <meta property="og:image:height" content="716" />
        <meta property="og:image:alt" content="BuyAuto Logo" />
        <meta property="og:site_name" content="BuyAuto" />
        <meta property="og:locale" content="de_CH" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Leasingübernahme Schweiz: Leasing übernehmen & abgeben | BuyAuto" />
        <meta
          name="twitter:description"
          content="Leasing übernehmen oder abgeben auf BuyAuto, einem Schweizer Marktplatz für Leasingübernahmen von Privatpersonen und Garagen."
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
            // q60 AVIF/WebP is visually indistinguishable under the dark
            // gradient overlay and cuts the LCP payload by roughly a third.
            quality={60}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-900/70 to-neutral-900/40" />
        </div>

        {/* pt-14 on phones keeps the live count and the fee line inside the
            60vh hero, so the search bar stays where it was (y ≈ 540 at 390×844). */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-14 sm:pt-20 pb-16">
          <div className="text-center">
            <h1 className="animate-fade-up-1 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.05] mb-4 max-w-4xl mx-auto">
              Raus aus dem Leasing.
              <br />
              Per <span className="text-red-500">Übernahme.</span>
            </h1>
            <p className="animate-fade-up-2 text-lg sm:text-xl md:text-2xl text-white/90 font-medium max-w-2xl mx-auto drop-shadow-md">
              Ein Schweizer Marktplatz für Leasingübernahmen: Übernimm ein laufendes Leasing oder gib deins ab.
            </p>
            {/* SourceLink hovers to neutral-900, unreadable on the dark hero; the arbitrary variant wins on specificity. */}
            <div className="animate-fade-up-2 mt-5 sm:mt-6 max-w-xl mx-auto space-y-1 text-sm sm:text-base text-white/80 drop-shadow-md [&_a:hover]:text-white">
              {liveCount !== null && (
                <p className="text-white">
                  <span aria-hidden="true" className="inline-block w-2 h-2 rounded-full bg-red-500 mr-2 align-middle" />
                  Auf BuyAuto {pluralize(liveCount, "wartet", "warten")} gerade{" "}
                  <strong className="font-bold">{countLabel(liveCount, "Leasingvertrag", "Leasingverträge")}</strong> auf eine
                  Übernahme
                </p>
              )}
              <p>
                Übertragungsgebühr {FEE_SHORT}
                <span className="block mt-0.5 text-xs text-white/60">
                  <SourceCitation source={CEMBRA.source} />
                </span>
              </p>
            </div>
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
        <PremiumListings
          initialListings={premiumListings}
          externalFilter={premiumFilter}
          onFilterChange={setPremiumFilter}
        />
      </div>

      {/* Everything below the premium carousel is out of the first viewport on
          every device; LazyHydrate keeps it fully in the server HTML (SEO
          unchanged) but spares the load-time main thread its hydration. */}
      <LazyHydrate>
        <WhyBuyAutoSection />
      </LazyHydrate>
      <LazyHydrate>
        <BuyerGarageSection />
      </LazyHydrate>

      <LazyHydrate>
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
            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-red-500/10 text-red-700 text-sm font-bold uppercase tracking-wider mb-5 hover:bg-red-500/20 transition-colors cursor-default">
              <Zap className="w-4 h-4" />
              Ablauf
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
                  title: "Seite wählen",
                  desc: "Entscheide, ob du ein laufendes Leasing übernehmen oder dein eigenes abgeben willst.",
                  icon: Car,
                },
                {
                  step: "02",
                  title: "Angebote vergleichen",
                  desc: "Filtere nach Marke, Modell, Monatsrate und Restlaufzeit. Die Übernahme-Inserate zeigen die Vertragsdaten.",
                  icon: Search,
                },
                {
                  step: "03",
                  title: "Kontakt aufnehmen",
                  desc: "Tritt direkt mit dem Anbieter in Kontakt. Die Übertragung läuft über die Leasinggesellschaft.",
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
                        <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
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
        </div>
      </section>
      </LazyHydrate>

      <LazyHydrate>
        <FounderStory />
      </LazyHydrate>
      <FAQSection />
      <SeoCopyBlock />

      <LazyHydrate>
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-neutral-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">Dein Leasing zur Übernahme anbieten</h2>
          <p className="text-lg md:text-xl text-neutral-300 mb-8 max-w-2xl mx-auto">
            Erstelle ein Inserat für deinen Leasingvertrag. Interessenten melden sich über den Chat auf BuyAuto direkt bei dir.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/inserat-erstellen">
              <Button
                size="lg"
                className="bg-red-600 text-white hover:bg-red-700 font-bold rounded-xl px-10 h-14 w-full sm:w-auto hover:scale-105 transition-all duration-300 shadow-lg shadow-red-500/25"
              >
                Inserat erstellen
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      </LazyHydrate>
    </div>
  );
}

/** Number of live Leasingübernahmen, or null when the read fails (the hero then shows no count). */
async function loadLiveTakeoverCount(): Promise<number | null> {
  try {
    const stats = await getLiveInventoryStats();
    return stats.count;
  } catch (error) {
    console.error("Live takeover count failed:", error);
    return null;
  }
}

// ISR: premium listings and the live count are part of the static HTML (no
// client fetch, no layout shift) and refresh in the background every 5 minutes.
export const getStaticProps: GetStaticProps<HomePageProps> = async () => {
  // A failed premium fetch throws, so ISR keeps the last good page instead of
  // caching an empty carousel. Takeovers first, newest first — see
  // orderPremiumListings. The live count never throws (null on failure).
  const [premiumListings, liveTakeoverCount] = await Promise.all([
    loadPremiumCarouselListings(),
    loadLiveTakeoverCount(),
  ]);

  return { props: { premiumListings, liveTakeoverCount }, revalidate: 300 };
};