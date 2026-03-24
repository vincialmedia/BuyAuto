import React from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles, Database, Shield, Zap, CheckCircle,
  CreditCard, Clock, FileText, Search, FileCheck, Car, ArrowRight, ChevronDown
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
        <style>{`
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(24px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
          }
          @keyframes slideUp {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          .animate-fade-up-1 { animation: fadeUp 0.7s ease-out 0.1s both; }
          .animate-fade-up-2 { animation: fadeUp 0.7s ease-out 0.2s both; }
          .animate-fade-up-3 { animation: fadeUp 0.7s ease-out 0.35s both; }
          .animate-fade-up-4 { animation: fadeUp 0.7s ease-out 0.5s both; }
          .animate-float { animation: float 6s ease-in-out infinite; }
          .animate-slide-up { animation: slideUp 0.5s ease-out 2s both; }
        `}</style>
      </Head>

      {/* ════════════════════════════════════════════════════════════
          HERO SECTION
      ════════════════════════════════════════════════════════════ */}
      <section className="relative w-full min-h-[90vh] flex flex-col">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero-porsche.png"
            alt="Roter Porsche auf Schweizer Bergstrasse"
            fill
            className="object-cover object-center"
            priority
            quality={90}
          />
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/20" />
          {/* Bottom fade to page background */}
          <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#fafafa] to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pt-24 pb-40 text-center">
          {/* Pill Badge */}
          <div className="animate-fade-up-1 inline-flex items-center gap-2 bg-neutral-800/70 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-medium mb-6 border border-white/10">
            <Sparkles className="w-4 h-4 text-red-400" />
            Schweizer Auto Plattform
          </div>

          {/* Main Heading */}
          <h1 className="animate-fade-up-2 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] mb-6 max-w-4xl">
            Der einfachere Weg
            <br className="hidden sm:block" />
            zum nächsten <span className="text-red-500">Auto.</span>
          </h1>

          {/* Subheading */}
          <p className="animate-fade-up-3 text-lg sm:text-xl text-white/80 font-medium mb-8 max-w-2xl leading-relaxed">
            Ob Kauf, Leasing, Auto-Abo oder Leasingübernahme – entdecke Fahrzeuge und Garagen aus der ganzen Schweiz.
          </p>

          {/* Scroll indicator */}
          <div className="animate-fade-up-4 flex flex-col items-center gap-2 text-white/50 mt-4">
            <span className="text-xs font-medium uppercase tracking-wider">Entdecken</span>
            <ChevronDown className="w-5 h-5 animate-bounce" />
          </div>
        </div>

        {/* OVERLAPPING SEARCH CARD */}
        <div className="absolute -bottom-20 sm:-bottom-16 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-30">
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] border border-neutral-100">
            <SearchBarV2 />
          </div>
        </div>
      </section>

      {/* SPACING FOR SEARCH CARD OVERLAP */}
      <div className="h-28 sm:h-24" />

      {/* ════════════════════════════════════════════════════════════
          USP STRIP
      ════════════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[
            { icon: Database, label: "Swiss Data", sub: "Daten in der Schweiz", color: "bg-blue-50 text-blue-600" },
            { icon: Shield, label: "Sichere Bezahlung", sub: "Powered by Stripe", color: "bg-emerald-50 text-emerald-600" },
            { icon: Zap, label: "Schneller Prozess", sub: "In wenigen Minuten", color: "bg-amber-50 text-amber-600" },
            { icon: CheckCircle, label: "Geprüfte Inserate", sub: "Qualität garantiert", color: "bg-red-50 text-red-500" },
          ].map((usp, i) => (
            <div
              key={i}
              className="group bg-white rounded-2xl p-5 sm:p-6 border border-neutral-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-xl ${usp.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <usp.icon className="w-6 h-6" />
              </div>
              <p className="font-bold text-neutral-900 text-base mb-1">{usp.label}</p>
              <p className="text-sm text-neutral-500">{usp.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          PREMIUM LISTINGS
      ════════════════════════════════════════════════════════════ */}
      <div className="bg-white border-y border-neutral-100">
        <PremiumListings />
      </div>

      {/* ════════════════════════════════════════════════════════════
          WHY BUYAUTO - BENTO GRID
      ════════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="mb-12 sm:mb-16 text-center sm:text-left">
            <p className="text-sm font-bold tracking-widest uppercase text-red-500 mb-3">Warum BuyAuto</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-neutral-900 tracking-tight leading-tight">
              Alles unter einem Dach.
            </h2>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Large Feature Card */}
            <div className="md:col-span-2 lg:col-span-2 bg-neutral-900 rounded-3xl p-8 sm:p-10 relative overflow-hidden group min-h-[280px] flex flex-col justify-end">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-red-500/20 rounded-full blur-[80px] group-hover:bg-red-500/30 transition-colors duration-500" />
              <CreditCard className="absolute top-8 right-8 w-12 h-12 text-white/10 group-hover:text-white/20 transition-colors duration-500" />
              <div className="relative z-10">
                <span className="inline-block bg-white/10 text-white/80 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full mb-4">
                  Kostentransparenz
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                  Übersichtliche Kosten
                </h3>
                <p className="text-white/60 text-base max-w-md">
                  Monatsrate, Restlaufzeit, Kilometer – alles transparent auf einen Blick.
                </p>
              </div>
            </div>

            {/* Flexible Laufzeiten */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[200px]">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-neutral-900 mb-2">Flexible Laufzeiten</h3>
                <p className="text-neutral-500 text-sm">Von wenigen Monaten bis mehrere Jahre – passend für dich.</p>
              </div>
            </div>

            {/* Günstiger als Neu */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[200px]">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-neutral-900 mb-2">Günstiger als Neu</h3>
                <p className="text-neutral-500 text-sm">Oft mehrere Hundert Franken pro Monat günstiger.</p>
              </div>
            </div>

            {/* CTA Card */}
            <div className="md:col-span-2 bg-gradient-to-br from-red-500 to-red-600 rounded-3xl p-8 sm:p-10 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-[60px]" />
              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div>
                  <FileText className="w-10 h-10 text-white/80 mb-4" />
                  <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                    Direkter Kontakt zum Anbieter
                  </h3>
                  <p className="text-white/80 text-base max-w-md">
                    Ohne Zwischenhändler. Kommuniziere direkt mit der Person, die den Vertrag abgeben möchte.
                  </p>
                </div>
                <Link href="/suche" className="shrink-0">
                  <Button size="lg" className="bg-white text-red-600 hover:bg-neutral-100 font-bold rounded-xl px-6 shadow-lg">
                    Fahrzeuge entdecken <ArrowRight className="w-4 h-4 ml-2" />
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
      <section className="relative mx-4 sm:mx-6 lg:mx-8 mb-20 sm:mb-28 rounded-[2rem] sm:rounded-[3rem] overflow-hidden">
        <div className="absolute inset-0 bg-neutral-950" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4" />

        <div className="relative z-10 px-6 sm:px-10 lg:px-16 py-16 sm:py-24">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
              {/* Left Column */}
              <div className="lg:w-5/12">
                <p className="text-xs font-bold tracking-widest uppercase text-red-400 mb-4">Einfacher Prozess</p>
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] mb-6">
                  So funktioniert&apos;s
                </h2>
                <p className="text-neutral-400 text-lg mb-8 max-w-sm">
                  In nur 3 einfachen Schritten zu deinem neuen Fahrzeug.
                </p>
                <Link href="/inserat-erstellen">
                  <Button size="lg" className="bg-white text-neutral-900 hover:bg-neutral-100 font-bold rounded-xl shadow-xl">
                    Inserat erstellen <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>

              {/* Right Column - Steps */}
              <div className="lg:w-7/12 flex flex-col gap-4">
                {[
                  { icon: Search, step: "01", title: "Suche & wähle", desc: "Durchsuche unsere Fahrzeugdatenbank und finde das perfekte Auto.", color: "bg-blue-500/20 text-blue-400" },
                  { icon: FileCheck, step: "02", title: "Anfrage & Inspektion", desc: "Stelle eine unverbindliche Anfrage und besichtige das Fahrzeug.", color: "bg-amber-500/20 text-amber-400" },
                  { icon: Car, step: "03", title: "Übernahme & Übergabe", desc: "Nach erfolgreicher Prüfung übernimmst du den Leasingvertrag.", color: "bg-emerald-500/20 text-emerald-400" },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="relative bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 hover:bg-white/10 transition-colors duration-300 group"
                  >
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-6xl sm:text-7xl font-black text-white/5 select-none">
                      {s.step}
                    </span>
                    <div className="flex items-start gap-4 relative z-10">
                      <div className={`w-12 h-12 rounded-xl ${s.color} flex items-center justify-center shrink-0`}>
                        <s.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-1">Schritt {s.step}</p>
                        <h3 className="text-xl font-bold text-white mb-1">{s.title}</h3>
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

      {/* ════════════════════════════════════════════════════════════
          STICKY BOTTOM CTA
      ════════════════════════════════════════════════════════════ */}
      <div className="animate-slide-up fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 pointer-events-none">
        <div className="pointer-events-auto max-w-2xl mx-auto bg-neutral-900/95 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-center sm:text-left">
            <p className="font-bold text-white text-sm">Bereit für dein nächstes Auto?</p>
            <p className="text-xs text-white/50">Entdecke Top-Deals oder erstelle ein Inserat.</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button asChild variant="outline" size="sm" className="flex-1 sm:flex-none rounded-xl border-white/20 text-white bg-white/10 hover:bg-white/20">
              <Link href="/suche">Suchen</Link>
            </Button>
            <Button asChild size="sm" className="flex-1 sm:flex-none rounded-xl bg-red-500 hover:bg-red-600 text-white shadow-lg">
              <Link href="/inserat-erstellen">Inserieren</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}