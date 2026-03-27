import React from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import {
  Shield, Zap, CheckCircle, TrendingUp,
  CreditCard, Clock, Search, FileCheck, Car, ArrowRight, Users, MessageCircle, ChevronRight
} from "lucide-react";
import { SearchBarV2 } from "@/components/buyauto/SearchBarV2";
import PremiumListings from "@/components/buyauto/PremiumListings";
import { FounderStory } from "@/components/buyauto/FounderStory";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";

const FAQSection = dynamic(() => import("@/components/buyauto/FAQSection"));
const SeoCopyBlock = dynamic(() => import("@/components/buyauto/SeoCopyBlock").then(m => ({ default: m.SeoCopyBlock })));

export default function V2Home() {
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
            {/* Subtext */}
            <p className="animate-fade-up-2 text-lg sm:text-xl md:text-2xl text-white/80 font-medium max-w-2xl mx-auto drop-shadow-md">
              Kauf, Leasing, Leasingübernahmen und Abos – finde das passende Auto in der Schweiz.
            </p>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          SEARCH BAR - Floating
      ════════════════════════════════════════════════════════════ */}
      <div className="relative z-20 w-full px-4 sm:px-6 lg:px-8 -mt-10 md:-mt-14">
        <div className="animate-fade-up-3 max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl shadow-black/15 p-3 md:p-4">
            <SearchBarV2 />
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════
          STATS BAR - Sleek horizontal trust indicators
      ════════════════════════════════════════════════════════════ */}
      <section className="py-8 md:py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between md:justify-center md:gap-16 text-center">
            {[
              { value: "500+", label: "Fahrzeuge" },
              { value: "50+", label: "Garagen" },
              { value: "100%", label: "Schweiz" },
              { value: "24/7", label: "Online" },
            ].map((stat, i) => (
              <div key={i} className="group">
                <p className="text-2xl sm:text-3xl md:text-4xl font-black text-neutral-900 group-hover:text-red-500 transition-colors">
                  {stat.value}
                </p>
                <p className="text-xs sm:text-sm text-neutral-500 font-medium mt-1">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          VALUE PROPS - Horizontal scroll on mobile, grid on desktop
      ════════════════════════════════════════════════════════════ */}
      <section className="py-6 md:py-12">
        <div className="max-w-6xl mx-auto">
          {/* Mobile: Horizontal scroll */}
          <div className="md:hidden">
            <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-4" style={{ scrollSnapType: "x mandatory" }}>
              {[
                { 
                  icon: Shield, 
                  title: "Geprüfte Angebote", 
                  desc: "Jedes Inserat wird von uns überprüft",
                  gradient: "from-red-500 to-rose-600"
                },
                { 
                  icon: MessageCircle, 
                  title: "Direkter Kontakt", 
                  desc: "Kommuniziere direkt mit Anbietern",
                  gradient: "from-neutral-800 to-neutral-900"
                },
                { 
                  icon: Zap, 
                  title: "Schnell & Einfach", 
                  desc: "In wenigen Minuten zum Traumauto",
                  gradient: "from-red-500 to-rose-600"
                },
                { 
                  icon: CheckCircle, 
                  title: "Swiss Made", 
                  desc: "Deine Daten bleiben in der Schweiz",
                  gradient: "from-neutral-800 to-neutral-900"
                },
              ].map((item, i) => (
                <div 
                  key={i} 
                  className={`flex-shrink-0 w-[280px] bg-gradient-to-br ${item.gradient} rounded-2xl p-5 text-white`}
                  style={{ scrollSnapAlign: "start" }}
                >
                  <item.icon className="w-8 h-8 mb-3 opacity-90" />
                  <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                  <p className="text-white/80 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-1.5 mt-2">
              {[0,1,2,3].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
              ))}
            </div>
          </div>

          {/* Desktop: Grid */}
          <div className="hidden md:grid md:grid-cols-4 gap-4 px-4 sm:px-6 lg:px-8">
            {[
              { icon: Shield, title: "Geprüfte Angebote", desc: "Qualitätskontrolle" },
              { icon: MessageCircle, title: "Direkter Kontakt", desc: "Ohne Zwischenhändler" },
              { icon: Zap, title: "Schnell & Einfach", desc: "In Minuten online" },
              { icon: CheckCircle, title: "Swiss Made", desc: "Daten in der Schweiz" },
            ].map((item, i) => (
              <div 
                key={i} 
                className="group bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-50 to-rose-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <item.icon className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="font-bold text-neutral-900 mb-1">{item.title}</h3>
                <p className="text-sm text-neutral-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          PREMIUM LISTINGS
      ════════════════════════════════════════════════════════════ */}
      <PremiumListings />

      {/* ════════════════════════════════════════════════════════════
          WHY BUYAUTO - Bold 3-card layout
      ════════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-10 md:mb-14">
            <span className="inline-block px-4 py-1.5 rounded-full bg-red-100 text-red-600 text-xs font-bold uppercase tracking-wider mb-4">
              Deine Vorteile
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-neutral-900 tracking-tight">
              Alles unter einem Dach
            </h2>
          </div>

          {/* 3 Bold Feature Cards */}
          <div className="grid md:grid-cols-3 gap-4 md:gap-6">
            {/* Card 1 - Cost Transparency */}
            <div className="group relative bg-neutral-900 rounded-3xl p-6 md:p-8 overflow-hidden min-h-[280px] flex flex-col justify-end">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/20 rounded-full blur-[60px] group-hover:bg-red-500/30 transition-all duration-500" />
              <div className="absolute top-6 right-6">
                <CreditCard className="w-10 h-10 text-white/10 group-hover:text-white/20 transition-colors" />
              </div>
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Transparente Kosten</h3>
                <p className="text-white/60 text-sm md:text-base">
                  Monatsrate, Restlaufzeit, Kilometer – alles auf einen Blick.
                </p>
              </div>
            </div>

            {/* Card 2 - Flexibility */}
            <div className="group relative bg-gradient-to-br from-red-500 to-rose-600 rounded-3xl p-6 md:p-8 overflow-hidden min-h-[280px] flex flex-col justify-end">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-[50px]" />
              <div className="absolute top-6 right-6">
                <Clock className="w-10 h-10 text-white/20" />
              </div>
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Flexible Laufzeiten</h3>
                <p className="text-white/80 text-sm md:text-base">
                  Von wenigen Monaten bis mehrere Jahre – du entscheidest.
                </p>
              </div>
            </div>

            {/* Card 3 - Direct Contact */}
            <div className="group relative bg-white rounded-3xl p-6 md:p-8 overflow-hidden min-h-[280px] flex flex-col justify-end shadow-xl shadow-neutral-200/50">
              <div className="absolute top-0 right-0 w-32 h-32 bg-neutral-100 rounded-full blur-[40px]" />
              <div className="absolute top-6 right-6">
                <MessageCircle className="w-10 h-10 text-neutral-100 group-hover:text-neutral-200 transition-colors" />
              </div>
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4 group-hover:bg-neutral-200 transition-colors">
                  <Users className="w-6 h-6 text-neutral-700" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-neutral-900 mb-2">Direkter Kontakt</h3>
                <p className="text-neutral-500 text-sm md:text-base">
                  Kommuniziere direkt mit Anbietern – ohne Umwege.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          HOW IT WORKS - Connected Timeline
      ════════════════════════════════════════════════════════════ */}
      <section className="relative mx-4 sm:mx-6 lg:mx-8 rounded-[2rem] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-red-500/10 rounded-full blur-[100px]" />

        <div className="relative z-10 px-6 sm:px-10 lg:px-16 py-16 md:py-24">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12 md:mb-16">
              <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-white/80 text-xs font-bold uppercase tracking-wider mb-4">
                So einfach geht&apos;s
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
                In 3 Schritten zum Auto
              </h2>
            </div>

            {/* Timeline Steps */}
            <div className="relative">
              <div className="hidden md:block absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

              <div className="grid md:grid-cols-3 gap-8 md:gap-6">
                {[
                  { icon: Search, step: "01", title: "Durchsuchen", desc: "Finde dein Traumauto mit unseren intelligenten Filtern." },
                  { icon: FileCheck, step: "02", title: "Anfragen", desc: "Sende eine unverbindliche Anfrage an den Anbieter." },
                  { icon: Car, step: "03", title: "Losfahren", desc: "Nach erfolgreicher Prüfung übernimmst du das Auto." },
                ].map((item, i) => (
                  <div key={i} className="relative group">
                    <div className="flex justify-center mb-6">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:bg-white/20 group-hover:scale-110 transition-all duration-300">
                          <item.icon className="w-6 h-6 text-white" />
                        </div>
                        <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                          {item.step}
                        </span>
                      </div>
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                      <p className="text-white/60 text-sm max-w-[250px] mx-auto">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-12 md:mt-16 text-center">
              <Link href="/suche">
                <Button size="lg" className="bg-white text-neutral-900 hover:bg-neutral-100 font-bold rounded-xl px-8 shadow-2xl shadow-white/10 h-12">
                  Fahrzeuge entdecken
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          CTA BANNER - Full width gradient
      ════════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="relative bg-gradient-to-r from-red-500 via-red-500 to-rose-600 rounded-3xl p-8 md:p-12 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-[60px]" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-2">
                  Bereit loszufahren?
                </h2>
                <p className="text-white/80 text-base md:text-lg max-w-md">
                  Erstelle jetzt dein Inserat oder finde dein nächstes Traumauto.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/inserat-erstellen">
                  <Button size="lg" className="bg-white text-red-600 hover:bg-neutral-100 font-bold rounded-xl px-6 shadow-xl h-12 w-full sm:w-auto">
                    Inserat erstellen
                  </Button>
                </Link>
                <Link href="/suche">
                  <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 font-bold rounded-xl px-6 h-12 w-full sm:w-auto">
                    Alle Fahrzeuge
                    <ChevronRight className="w-4 h-4 ml-1" />
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