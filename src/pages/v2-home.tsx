import React from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles, Database, Shield, Zap, CheckCircle,
  CreditCard, Clock, FileText, Search, FileCheck, Car, ArrowRight, ChevronDown
} from "lucide-react";
import SearchForm from "@/components/buyauto/SearchForm";
import PremiumListings from "@/components/buyauto/PremiumListings";
import { FounderStory } from "@/components/buyauto/FounderStory";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";

const FAQSection = dynamic(() => import("@/components/buyauto/FAQSection"));
const SeoCopyBlock = dynamic(() => import("@/components/buyauto/SeoCopyBlock").then(m => ({ default: m.SeoCopyBlock })));

export default function V2Home() {
  return (
    <div className="bg-[#f8f8f6] min-h-screen font-sans overflow-x-hidden">
      <Head>
        <title>BuyAuto – Der einfachere Weg zum nächsten Auto</title>
        <style>{`
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(32px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
          @keyframes floatCard {
            0%, 100% { transform: translateY(-50%) translateY(0px); }
            50%       { transform: translateY(-50%) translateY(-6px); }
          }
          @keyframes slideUp {
            from { transform: translateY(100%); opacity: 0; }
            to   { transform: translateY(0);    opacity: 1; }
          }
          @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.96); }
            to   { opacity: 1; transform: scale(1); }
          }
          .anim-fade-up-1 { animation: fadeUp 0.8s cubic-bezier(.22,1,.36,1) 0.1s both; }
          .anim-fade-up-2 { animation: fadeUp 0.8s cubic-bezier(.22,1,.36,1) 0.25s both; }
          .anim-fade-up-3 { animation: fadeUp 0.8s cubic-bezier(.22,1,.36,1) 0.4s both; }
          .anim-fade-in   { animation: fadeIn 1.2s ease 0.6s both; }
          .anim-scale-in  { animation: scaleIn 0.7s cubic-bezier(.22,1,.36,1) 0.5s both; }
          .anim-sticky-cta { animation: slideUp 0.6s cubic-bezier(.22,1,.36,1) 2.5s both; }
        `}</style>
      </Head>

      {/* ─── HERO ─────────────────────────────────────────────────── */}
      <section className="relative w-full" style={{ height: "100svh", minHeight: 640, maxHeight: 1000 }}>

        {/* Background image */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <Image
            src="/Untitled_design_1_.png"
            alt="Porsche Macan auf einer Schweizer Bergstrasse"
            fill
            className="object-cover object-center"
            priority
            quality={95}
          />
          {/* top-down dark fade for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/30 to-black/10" />
          {/* bottom fade into page background */}
          <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-[#f8f8f6] to-transparent" />
          {/* Warm glow accent */}
          <div className="absolute inset-0 bg-gradient-to-tr from-red-900/20 via-transparent to-transparent" />
        </div>

        {/* Hero content — sits in the upper ~70% of the hero */}
        <div className="relative z-10 flex flex-col items-center justify-start pt-28 sm:pt-32 px-4 sm:px-6 lg:px-8 text-center w-full h-full">

          {/* Pill badge */}
          <div className="anim-fade-up-1 inline-flex items-center gap-2 bg-black/50 backdrop-blur-md text-white px-5 py-2 rounded-full text-sm font-semibold mb-5 border border-white/15 shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-red-400" />
            Schweizer Auto Plattform
          </div>

          {/* Main heading */}
          <h1 className="anim-fade-up-2 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tighter leading-[1.05] mb-5 drop-shadow-2xl max-w-4xl">
            Der einfachere Weg<br className="hidden sm:block" /> zum nächsten{" "}
            <span className="text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.5)]">Auto.</span>
          </h1>

          {/* Subheading */}
          <p className="anim-fade-up-3 text-base sm:text-lg md:text-xl text-white/75 font-medium mb-0 max-w-2xl mx-auto leading-relaxed">
            Ob Kauf, Leasing, Auto-Abo oder Leasingübernahme – entdecke Fahrzeuge und Garagen aus der ganzen Schweiz.
          </p>

          {/* Scroll hint */}
          <div className="anim-fade-in absolute bottom-[42%] sm:bottom-[38%] left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/40">
            <ChevronDown className="w-5 h-5 animate-bounce" />
          </div>
        </div>

        {/* ── FLOATING SEARCH CARD — overlaps hero bottom ── */}
        <div className="anim-scale-in absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-full max-w-5xl px-4 sm:px-6 z-30">
          <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-4 sm:p-7
                          shadow-[0_32px_80px_-12px_rgba(0,0,0,0.22),0_0_0_1px_rgba(0,0,0,0.04)]
                          hover:shadow-[0_40px_100px_-12px_rgba(0,0,0,0.28),0_0_0_1px_rgba(0,0,0,0.06)]
                          transition-shadow duration-500">
            <SearchForm variant="default" />
          </div>
        </div>
      </section>

      {/* Spacer for the overlapping search card */}
      <div className="h-32 sm:h-48 md:h-52" />

      {/* ─── USP STRIP ────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 sm:mb-28">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {[
            { icon: Database, label: "Swiss Data",        sub: "Daten in der Schweiz",   color: "bg-blue-50",    iconColor: "text-blue-600"    },
            { icon: Shield,   label: "Sichere Bezahlung", sub: "Powered by Stripe",       color: "bg-emerald-50", iconColor: "text-emerald-600" },
            { icon: Zap,      label: "Schneller Prozess", sub: "In wenigen Minuten",      color: "bg-amber-50",   iconColor: "text-amber-600"   },
            { icon: CheckCircle, label: "Geprüfte Inserate", sub: "Qualität garantiert", color: "bg-red-50",     iconColor: "text-red-500"     },
          ].map((usp, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7
                         border border-neutral-100
                         shadow-[0_2px_12px_rgba(0,0,0,0.04)]
                         hover:shadow-[0_12px_36px_rgba(0,0,0,0.08)]
                         hover:-translate-y-1.5
                         transition-all duration-300 group"
            >
              <div className={`w-11 h-11 rounded-xl ${usp.color} flex items-center justify-center mb-4`}>
                <usp.icon className={`w-5 h-5 ${usp.iconColor}`} />
              </div>
              <p className="font-bold text-neutral-900 text-base mb-0.5">{usp.label}</p>
              <p className="text-xs sm:text-sm text-neutral-500 font-medium">{usp.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── PREMIUM LISTINGS ─────────────────────────────────────── */}
      <div className="bg-white border-y border-neutral-100 shadow-[0_1px_0_0_rgba(0,0,0,0.03)]">
        <PremiumListings />
      </div>

      {/* ─── WHY BUYAUTO — BENTO GRID ─────────────────────────────── */}
      <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">

          {/* Section header */}
          <div className="mb-12 sm:mb-16">
            <p className="text-sm font-bold tracking-widest uppercase text-red-500 mb-3">Warum BuyAuto</p>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-neutral-900 tracking-tighter leading-tight max-w-2xl">
              Alles unter<br />einem Dach.
            </h2>
          </div>

          {/* Bento grid — asymmetric */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">

            {/* Hero card — dark */}
            <div className="lg:col-span-2 lg:row-span-2 relative bg-neutral-950 rounded-[2rem] sm:rounded-[2.5rem] p-8 sm:p-12
                            overflow-hidden group min-h-[320px] flex flex-col justify-end
                            hover:scale-[1.01] transition-transform duration-500">
              {/* glow orb */}
              <div className="absolute -top-20 -right-20 w-72 h-72 bg-red-500/20 rounded-full blur-[80px] group-hover:bg-red-500/30 transition-colors duration-700" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(239,68,68,0.08),transparent_60%)]" />

              <CreditCard className="w-16 h-16 text-white/8 absolute top-10 right-10 group-hover:scale-110 group-hover:text-white/15 transition-all duration-700" />

              <div className="relative z-10">
                <span className="inline-block bg-white/10 backdrop-blur-sm text-white/80 text-xs font-semibold tracking-wide uppercase px-3 py-1 rounded-full mb-5">
                  Kostentransparenz
                </span>
                <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight mb-4">
                  Übersichtliche<br />Kosten
                </h3>
                <p className="text-white/60 text-base sm:text-lg font-medium leading-relaxed max-w-sm">
                  Monatsrate, Restlaufzeit, Kilometer – alles transparent auf einen Blick.
                </p>
              </div>
            </div>

            {/* Card: Laufzeiten */}
            <div className="bg-white rounded-[2rem] p-7 sm:p-8 border border-neutral-100
                            shadow-[0_2px_12px_rgba(0,0,0,0.04)]
                            hover:shadow-[0_20px_48px_rgba(0,0,0,0.08)]
                            hover:-translate-y-1.5 transition-all duration-300 group flex flex-col justify-between min-h-[220px]">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-5
                              group-hover:bg-blue-500 transition-colors duration-300">
                <Clock className="w-6 h-6 text-blue-500 group-hover:text-white transition-colors duration-300" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-2">Flexible Laufzeiten</h3>
                <p className="text-neutral-500 text-sm sm:text-base font-medium">Von wenigen Monaten bis mehrere Jahre – passend für dich.</p>
              </div>
            </div>

            {/* Card: Günstiger */}
            <div className="bg-white rounded-[2rem] p-7 sm:p-8 border border-neutral-100
                            shadow-[0_2px_12px_rgba(0,0,0,0.04)]
                            hover:shadow-[0_20px_48px_rgba(0,0,0,0.08)]
                            hover:-translate-y-1.5 transition-all duration-300 group flex flex-col justify-between min-h-[220px]">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-5
                              group-hover:bg-emerald-500 transition-colors duration-300">
                <CheckCircle className="w-6 h-6 text-emerald-500 group-hover:text-white transition-colors duration-300" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-2">Günstiger als Neu</h3>
                <p className="text-neutral-500 text-sm sm:text-base font-medium">Oft mehrere Hundert Franken pro Monat günstiger als Leasing-Neuverträge.</p>
              </div>
            </div>

            {/* Wide CTA card */}
            <div className="lg:col-span-3 relative bg-gradient-to-r from-red-600 to-red-500
                            rounded-[2rem] sm:rounded-[2.5rem] p-8 sm:p-12 overflow-hidden
                            hover:scale-[1.005] transition-transform duration-500">
              <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-[80px] pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-black/10 rounded-full blur-[60px] pointer-events-none" />

              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
                <div>
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-5 backdrop-blur-sm">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight mb-3">
                    Direkter Kontakt zum Anbieter
                  </h3>
                  <p className="text-white/80 text-base sm:text-lg font-medium max-w-lg">
                    Ohne Zwischenhändler. Kommuniziere direkt mit der Person, die den Vertrag abgeben möchte.
                  </p>
                </div>
                <div className="shrink-0 w-full sm:w-auto">
                  <Link href="/suche"
                    className="inline-flex items-center justify-center gap-2
                               bg-white text-red-600 font-bold text-base sm:text-lg
                               px-7 py-4 rounded-2xl w-full sm:w-auto
                               hover:bg-neutral-50 hover:scale-105
                               transition-all duration-300 shadow-xl shadow-red-900/20">
                    Fahrzeuge entdecken <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS — DARK FLOWING SECTION ─────────────────── */}
      <section className="relative mx-4 sm:mx-6 lg:mx-8 mb-24 sm:mb-32 overflow-hidden rounded-[2.5rem] sm:rounded-[3rem]">
        {/* Background */}
        <div className="absolute inset-0 bg-neutral-950" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-500/15 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />

        <div className="relative z-10 px-6 sm:px-10 lg:px-16 py-20 sm:py-28">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-16 lg:gap-24">

              {/* Sticky left column */}
              <div className="lg:w-5/12 lg:sticky lg:top-28 h-fit">
                <p className="text-xs font-bold tracking-widest uppercase text-red-400 mb-4">Einfacher Prozess</p>
                <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white tracking-tighter leading-[1.05] mb-6">
                  So<br /><span className="text-red-500">funktioniert&apos;s</span>
                </h2>
                <p className="text-neutral-400 text-lg font-medium leading-relaxed mb-10 max-w-sm">
                  In nur 3 einfachen Schritten zu deinem neuen Leasingfahrzeug.
                </p>
                <Link href="/inserat-erstellen">
                  <button className="inline-flex items-center gap-3 bg-white text-neutral-900 font-bold px-7 py-4 rounded-2xl
                                     hover:bg-neutral-100 hover:-translate-y-0.5
                                     transition-all duration-300
                                     shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_20px_40px_rgba(0,0,0,0.4)]
                                     group">
                    Inserat erstellen
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
              </div>

              {/* Scrolling steps */}
              <div className="lg:w-7/12 flex flex-col gap-4 sm:gap-5">
                {[
                  {
                    icon: Search,
                    step: "01",
                    title: "Suche & wähle",
                    desc: "Durchsuche unsere Fahrzeugdatenbank und finde das perfekte Auto für deine Bedürfnisse.",
                    color: "bg-blue-500/20 text-blue-400",
                  },
                  {
                    icon: FileCheck,
                    step: "02",
                    title: "Anfrage & Inspektion",
                    desc: "Stelle eine unverbindliche Anfrage und besichtige das Fahrzeug vor Ort.",
                    color: "bg-amber-500/20 text-amber-400",
                  },
                  {
                    icon: Car,
                    step: "03",
                    title: "Übernahme & Übergabe",
                    desc: "Nach erfolgreicher Prüfung übernimmst du den Leasingvertrag und erhältst dein Fahrzeug.",
                    color: "bg-emerald-500/20 text-emerald-400",
                  },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="relative bg-white/5 border border-white/8 rounded-[1.75rem] p-7 sm:p-10
                               hover:bg-white/8 hover:border-white/15
                               transition-all duration-400 group overflow-hidden"
                  >
                    {/* Step number watermark */}
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[7rem] font-black text-white/[0.03] leading-none select-none pointer-events-none group-hover:text-white/[0.05] transition-colors duration-500">
                      {s.step}
                    </span>

                    <div className="flex items-start gap-5 relative z-10">
                      <div className={`w-12 h-12 rounded-2xl ${s.color} flex items-center justify-center shrink-0 mt-0.5`}>
                        <s.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-white/40 text-xs font-bold tracking-widest uppercase mb-1">Schritt {s.step}</p>
                        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">{s.title}</h3>
                        <p className="text-neutral-400 text-base leading-relaxed font-medium">{s.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOUNDER + FAQ + SEO ──────────────────────────────────── */}
      <FounderStory />
      <FAQSection />
      <SeoCopyBlock />

      {/* ─── STICKY BOTTOM CTA ────────────────────────────────────── */}
      <div className="anim-sticky-cta fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 pointer-events-none">
        <div className="pointer-events-auto max-w-3xl mx-auto
                        bg-neutral-950/90 backdrop-blur-xl
                        border border-white/10
                        shadow-[0_-8px_40px_rgba(0,0,0,0.3)]
                        rounded-2xl px-5 py-4
                        flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-6">
          <div className="text-center sm:text-left">
            <p className="font-bold text-white text-sm sm:text-base">Bereit für dein nächstes Auto?</p>
            <p className="text-xs sm:text-sm text-white/50 font-medium">Entdecke Top-Deals oder erstelle ein Inserat.</p>
          </div>
          <div className="flex gap-2.5 w-full sm:w-auto">
            <Button asChild variant="outline"
              className="w-full sm:w-auto rounded-xl border-white/15 text-white bg-white/10 hover:bg-white/20 text-sm font-semibold">
              <Link href="/suche">Fahrzeuge finden</Link>
            </Button>
            <Button asChild
              className="w-full sm:w-auto rounded-xl bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 text-sm font-semibold">
              <Link href="/inserat-erstellen">Inserat erstellen</Link>
            </Button>
          </div>
        </div>
      </div>

    </div>
  );
}