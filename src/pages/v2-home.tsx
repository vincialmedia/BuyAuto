import React from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles, Shield, Zap, CheckCircle,
  CreditCard, Clock, FileText, Search, FileCheck, Car, ArrowRight, Users
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
          .animate-fade-up-4 { animation: fadeUp 0.6s ease-out 0.4s both; }
        `}</style>
      </Head>

      {/* ════════════════════════════════════════════════════════════
          HERO SECTION
      ════════════════════════════════════════════════════════════ */}
      <section className="relative w-full min-h-[75vh] sm:min-h-[80vh] flex flex-col">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero-g-class.png"
            alt="Mercedes G-Class"
            fill
            className="object-cover object-center"
            priority
            quality={90}
          />
          {/* Lighter gradient overlay - lets image show through */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/50" />
          {/* Bottom fade to page background */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#fafafa] to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pt-16 pb-32 text-center">
          {/* Pill Badge */}
          <div className="animate-fade-up-1 inline-flex items-center gap-2 bg-white/15 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-medium mb-6 border border-white/20">
            <Sparkles className="w-4 h-4 text-red-400" />
            Schweizer Auto Plattform
          </div>

          {/* Main Heading */}
          <h1 className="animate-fade-up-2 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.05] mb-5 max-w-4xl drop-shadow-lg">
            Der einfachere Weg
            <br />
            zum nächsten <span className="text-red-500">Auto.</span>
          </h1>

          {/* Subheading */}
          <p className="animate-fade-up-3 text-lg sm:text-xl text-white/90 font-medium mb-10 max-w-xl leading-relaxed drop-shadow-md">
            Kauf, Leasing oder Leasingübernahme – alles auf einer Plattform.
          </p>
        </div>

        {/* SEARCH CARD - Overlapping */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-full max-w-4xl px-4 z-30">
          <div className="group bg-white rounded-2xl p-5 sm:p-6 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] border border-neutral-200/50 transition-all duration-300 hover:shadow-[0_30px_70px_-15px_rgba(0,0,0,0.35)] hover:-translate-y-1">
            <SearchBarV2 />
          </div>
        </div>
      </section>

      {/* Spacing for search card overlap */}
      <div className="h-28 sm:h-24" />

      {/* ════════════════════════════════════════════════════════════
          USP STRIP - BuyAuto branded colors
      ════════════════════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { icon: Shield, label: "Geprüfte Angebote", sub: "Qualitätskontrolle", color: "text-red-500 bg-red-50" },
            { icon: Users, label: "Direkter Kontakt", sub: "Ohne Zwischenhändler", color: "text-neutral-700 bg-neutral-100" },
            { icon: Zap, label: "Schneller Prozess", sub: "In wenigen Minuten", color: "text-red-500 bg-red-50" },
            { icon: CheckCircle, label: "Swiss Made", sub: "Daten in der Schweiz", color: "text-neutral-700 bg-neutral-100" },
          ].map((usp, i) => (
            <div
              key={i}
              className="group bg-white rounded-2xl p-4 sm:p-5 border border-neutral-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl ${usp.color} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform duration-300`}>
                <usp.icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <p className="font-bold text-neutral-900 text-sm sm:text-base mb-0.5">{usp.label}</p>
              <p className="text-xs sm:text-sm text-neutral-500">{usp.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          PREMIUM LISTINGS
      ════════════════════════════════════════════════════════════ */}
      <PremiumListings />

      {/* ════════════════════════════════════════════════════════════
          WHY BUYAUTO - BENTO GRID
      ════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="mb-10 sm:mb-12 text-center">
            <p className="text-sm font-bold tracking-widest uppercase text-red-500 mb-2">Warum BuyAuto</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-neutral-900 tracking-tight">
              Alles unter einem Dach.
            </h2>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Large Feature Card */}
            <div className="md:col-span-2 bg-neutral-900 rounded-2xl p-6 sm:p-8 relative overflow-hidden group min-h-[220px] flex flex-col justify-end">
              <div className="absolute -top-16 -right-16 w-48 h-48 bg-red-500/20 rounded-full blur-[60px] group-hover:bg-red-500/30 transition-colors duration-500" />
              <CreditCard className="absolute top-6 right-6 w-10 h-10 text-white/10 group-hover:text-white/20 transition-colors duration-500" />
              <div className="relative z-10">
                <span className="inline-block bg-red-500/20 text-red-400 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full mb-3">
                  Kostentransparenz
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  Übersichtliche Kosten
                </h3>
                <p className="text-white/60 text-sm max-w-md">
                  Monatsrate, Restlaufzeit, Kilometer – alles transparent auf einen Blick.
                </p>
              </div>
            </div>

            {/* Flexible Laufzeiten */}
            <div className="bg-neutral-50 rounded-2xl p-5 sm:p-6 border border-neutral-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between min-h-[180px]">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mb-3">
                <Clock className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-neutral-900 mb-1">Flexible Laufzeiten</h3>
                <p className="text-neutral-500 text-sm">Von wenigen Monaten bis mehrere Jahre.</p>
              </div>
            </div>

            {/* Günstiger als Neu */}
            <div className="bg-neutral-50 rounded-2xl p-5 sm:p-6 border border-neutral-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between min-h-[180px]">
              <div className="w-10 h-10 bg-neutral-200 rounded-xl flex items-center justify-center mb-3">
                <CheckCircle className="w-5 h-5 text-neutral-700" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-neutral-900 mb-1">Günstiger als Neu</h3>
                <p className="text-neutral-500 text-sm">Oft mehrere Hundert Franken pro Monat günstiger.</p>
              </div>
            </div>

            {/* CTA Card */}
            <div className="md:col-span-2 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-48 h-48 bg-white/10 rounded-full blur-[50px]" />
              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <FileText className="w-8 h-8 text-white/80 mb-3" />
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">
                    Direkter Kontakt
                  </h3>
                  <p className="text-white/80 text-sm max-w-sm">
                    Kommuniziere direkt mit Anbietern – ohne Zwischenhändler.
                  </p>
                </div>
                <Link href="/suche" className="shrink-0">
                  <Button size="lg" className="bg-white text-red-600 hover:bg-neutral-100 font-bold rounded-xl px-5 shadow-lg">
                    Entdecken <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          HOW IT WORKS - DARK SECTION
      ════════════════════════════════════════════════════════════ */}
      <section className="relative mx-3 sm:mx-6 lg:mx-8 my-8 rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden">
        <div className="absolute inset-0 bg-neutral-950" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-red-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3" />

        <div className="relative z-10 px-5 sm:px-8 lg:px-12 py-12 sm:py-16">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
              {/* Left Column */}
              <div className="lg:w-5/12">
                <p className="text-xs font-bold tracking-widest uppercase text-red-400 mb-3">Einfacher Prozess</p>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.1] mb-4">
                  So funktioniert&apos;s
                </h2>
                <p className="text-neutral-400 text-base mb-6 max-w-sm">
                  In nur 3 Schritten zu deinem neuen Fahrzeug.
                </p>
                <Link href="/inserat-erstellen">
                  <Button size="lg" className="bg-white text-neutral-900 hover:bg-neutral-100 font-bold rounded-xl shadow-xl">
                    Inserat erstellen <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>

              {/* Right Column - Steps */}
              <div className="lg:w-7/12 flex flex-col gap-3">
                {[
                  { icon: Search, step: "01", title: "Suche & wähle", desc: "Finde das perfekte Auto in unserer Datenbank.", color: "bg-red-500/20 text-red-400" },
                  { icon: FileCheck, step: "02", title: "Anfrage senden", desc: "Stelle eine unverbindliche Anfrage beim Anbieter.", color: "bg-neutral-500/20 text-neutral-400" },
                  { icon: Car, step: "03", title: "Fahrzeug übernehmen", desc: "Nach erfolgreicher Prüfung übernimmst du das Auto.", color: "bg-red-500/20 text-red-400" },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="relative bg-white/5 border border-white/10 rounded-xl p-5 sm:p-6 hover:bg-white/10 transition-colors duration-300 group"
                  >
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-5xl sm:text-6xl font-black text-white/5 select-none">
                      {s.step}
                    </span>
                    <div className="flex items-start gap-4 relative z-10">
                      <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center shrink-0`}>
                        <s.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-0.5">Schritt {s.step}</p>
                        <h3 className="text-lg font-bold text-white mb-0.5">{s.title}</h3>
                        <p className="text-neutral-400 text-sm">{s.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
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