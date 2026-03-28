import React, { useState, useRef } from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import {
  Shield, Zap, CheckCircle, TrendingUp,
  CreditCard, Clock, Search, FileCheck, Car, ArrowRight, Users, MessageCircle, ChevronRight, Sparkles, MapPin, Calculator
} from "lucide-react";
import { SearchBarV2 } from "@/components/buyauto/SearchBarV2";
import PremiumListings from "@/components/buyauto/PremiumListings";
import { FounderStory } from "@/components/buyauto/FounderStory";
import { WhyBuyAutoSection } from "@/components/buyauto/WhyBuyAutoSection";
import { BuyerGarageSection } from "@/components/buyauto/BuyerGarageSection";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";

const FAQSection = dynamic(() => import("@/components/buyauto/FAQSection"));
const SeoCopyBlock = dynamic(() => import("@/components/buyauto/SeoCopyBlock").then(m => ({ default: m.SeoCopyBlock })));

type FilterCategory = "all" | "direct_purchase" | "leasing" | "lease_takeover" | "auto_abo";

export default function V2Home() {
  const [premiumFilter, setPremiumFilter] = useState<FilterCategory>("all");
  const premiumSectionRef = useRef<HTMLDivElement>(null);

  const handleKeywordClick = (filter: FilterCategory) => {
    setPremiumFilter(filter);
    setTimeout(() => {
      premiumSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  return (
    <div className="bg-[#fafafa] min-h-screen font-sans overflow-x-hidden">
      <Head>
        <title>BuyAuto – Der einfachere Weg zum nächsten Auto</title>
        <meta name="description" content="Ob Kauf, Leasing, Auto-Abo oder Leasingübernahme – entdecke Fahrzeuge und Garagen aus der ganzen Schweiz auf BuyAuto." />
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
          @keyframes count-up {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-up-1 { animation: fadeUp 0.6s ease-out 0.1s both; }
          .animate-fade-up-2 { animation: fadeUp 0.6s ease-out 0.2s both; }
          .animate-fade-up-3 { animation: fadeUp 0.6s ease-out 0.3s both; }
          .animate-float { animation: float 6s ease-in-out infinite; }
          .animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
          .animate-gradient { 
            background-size: 200% 200%;
            animation: gradient-shift 3s ease infinite;
          }
          
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

      {/* ════════════════════════════════════════════════════════════
          HERO SECTION
      ════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[60vh] md:min-h-[70vh] flex flex-col overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/Gemini_Generated_Image_rpm31frpm31frpm3.png"
            alt="Red Porsche Macan on Swiss mountain road"
            fill
            priority
            className="object-cover object-[center_30%]"
            sizes="100vw"
            quality={90}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-900/50 to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="animate-fade-up-1 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.05] mb-4 max-w-4xl mx-auto">
              Der einfachere Weg
              <br />
              zum nächsten <span className="text-red-500">Auto.</span>
            </h1>
            <p className="animate-fade-up-2 text-lg sm:text-xl md:text-2xl text-white/80 font-medium max-w-2xl mx-auto drop-shadow-md">
              <button
                onClick={() => handleKeywordClick("direct_purchase")}
                className="text-white hover:text-red-400 underline decoration-white/40 hover:decoration-red-400 underline-offset-4 transition-colors duration-200"
              >
                Kauf
              </button>
              {", "}
              <button
                onClick={() => handleKeywordClick("leasing")}
                className="text-white hover:text-red-400 underline decoration-white/40 hover:decoration-red-400 underline-offset-4 transition-colors duration-200"
              >
                Leasing
              </button>
              {", "}
              <button
                onClick={() => handleKeywordClick("lease_takeover")}
                className="text-white hover:text-red-400 underline decoration-white/40 hover:decoration-red-400 underline-offset-4 transition-colors duration-200"
              >
                Leasingübernahmen
              </button>
              {" und "}
              <button
                onClick={() => handleKeywordClick("auto_abo")}
                className="text-white hover:text-red-400 underline decoration-white/40 hover:decoration-red-400 underline-offset-4 transition-colors duration-200"
              >
                Abos
              </button>
              {" – finde das passende Auto in der Schweiz."}
            </p>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          SEARCH BAR - Floating with hover animation
      ════════════════════════════════════════════════════════════ */}
      <div className="relative z-20 w-full px-4 sm:px-6 lg:px-8 -mt-8 md:-mt-10">
        <div className="animate-fade-up-3 max-w-5xl mx-auto">
          <div className="search-bar-hover bg-white rounded-2xl shadow-2xl shadow-black/15 p-3 md:p-4 relative overflow-hidden group">
            {/* Subtle shimmer effect on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_ease-in-out]" />
            </div>
            <div className="relative z-10">
              <SearchBarV2 />
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════
          PREMIUM LISTINGS
      ════════════════════════════════════════════════════════════ */}
      <div ref={premiumSectionRef} className="scroll-mt-4">
        <PremiumListings 
          externalFilter={premiumFilter} 
          onFilterChange={setPremiumFilter} 
        />
      </div>

      {/* ════════════════════════════════════════════════════════════
          WHY BUYAUTO - 6-Card Value Proposition Grid
      ════════════════════════════════════════════════════════════ */}
      <WhyBuyAutoSection />

      {/* ════════════════════════════════════════════════════════════
          BUYER & GARAGE SECTION - Two Column Value Props
      ════════════════════════════════════════════════════════════ */}
      <BuyerGarageSection />

      {/* ════════════════════════════════════════════════════════════
          HOW IT WORKS - 3 Steps
      ════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-50 to-white" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-red-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "4s" }} />
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-neutral-200/50 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "5s", animationDelay: "1s" }} />
        
        <div className="max-w-5xl mx-auto relative z-10">
          {/* Section Header */}
          <div className="text-center mb-14 md:mb-20">
            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-red-500/10 text-red-600 text-sm font-bold uppercase tracking-wider mb-5 hover:bg-red-500/20 transition-colors cursor-default">
              <Zap className="w-4 h-4" />
              So einfach geht&apos;s
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-neutral-900 tracking-tight">
              So funktioniert <span className="text-red-500">BuyAuto</span>
            </h2>
          </div>

          {/* 3 Steps */}
          <div className="relative">
            {/* Connecting line - desktop */}
            <div className="hidden md:block absolute top-16 left-[16.67%] right-[16.67%] h-0.5 bg-neutral-200">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-red-500 to-transparent w-0 group-hover:w-full transition-all duration-1000" />
            </div>

            <div className="grid md:grid-cols-3 gap-8 md:gap-6">
              {[
                { 
                  step: "01", 
                  title: "Weg wählen", 
                  desc: "Entscheide, ob du kaufen, leasen, im Auto-Abo fahren oder eine Leasingübernahme suchst.",
                  icon: Car
                },
                { 
                  step: "02", 
                  title: "Angebote vergleichen", 
                  desc: "Filtere nach Marke, Modell, Preis, Laufzeit und Anbieter.",
                  icon: Search
                },
                { 
                  step: "03", 
                  title: "Kontakt aufnehmen", 
                  desc: "Tritt direkt mit dem Anbieter oder der Garage in Kontakt und bring den Deal ins Rollen.",
                  icon: MessageCircle
                },
              ].map((item, i) => (
                <div key={i} className="group relative">
                  {/* Card */}
                  <div className="relative bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl border border-neutral-200 hover:border-red-200 transition-all duration-500 hover:-translate-y-2 overflow-hidden">
                    {/* Hover glow */}
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    {/* Step number badge */}
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
                    
                    {/* Content */}
                    <div className="text-center relative z-10">
                      <h3 className="text-xl font-bold text-neutral-900 mb-3 group-hover:text-red-600 transition-colors duration-300">{item.title}</h3>
                      <p className="text-neutral-500 text-sm leading-relaxed max-w-[280px] mx-auto">{item.desc}</p>
                    </div>

                    {/* Bottom accent line */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 text-center">
            <Link href="/suche">
              <Button size="lg" className="bg-neutral-900 text-white hover:bg-neutral-800 font-bold rounded-2xl px-10 shadow-xl hover:shadow-2xl h-14 text-base group hover:scale-105 transition-all duration-300">
                Jetzt Fahrzeuge entdecken
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          CTA BANNER - Red with clean design
      ════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="relative bg-red-500 rounded-[2rem] p-10 md:p-14 overflow-hidden group hover:shadow-2xl hover:shadow-red-500/20 transition-all duration-500">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-[100px] group-hover:scale-150 transition-transform duration-700" />
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-black/10 rounded-full blur-[80px] group-hover:scale-125 transition-transform duration-700" />
            
            {/* Shimmer effect */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_4s_ease-in-out_infinite]" />
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3">
                  Bereit loszufahren?
                </h2>
                <p className="text-white/80 text-lg md:text-xl max-w-lg">
                  Erstelle jetzt dein Inserat oder finde dein nächstes passendes Auto.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/inserat-erstellen">
                  <Button size="lg" className="bg-white text-red-600 hover:bg-neutral-100 font-bold rounded-2xl px-8 shadow-2xl shadow-black/20 h-14 w-full sm:w-auto hover:scale-105 transition-all duration-300 group/btn">
                    Inserat erstellen
                    <Sparkles className="w-4 h-4 ml-2 group-hover/btn:rotate-12 transition-transform" />
                  </Button>
                </Link>
                <Link href="/suche">
                  <Button size="lg" className="bg-white/20 border-2 border-white text-white hover:bg-white hover:text-red-600 font-bold rounded-2xl px-8 h-14 w-full sm:w-auto hover:scale-105 transition-all duration-300 backdrop-blur-sm">
                    Alle Fahrzeuge
                    <ChevronRight className="w-5 h-5 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          FOUNDER + FAQ + SEO
      ════════════════════════════════════════════════════════════ */}
      <FounderStory />
      <FAQSection />
      <SeoCopyBlock />
    </div>
  );
}