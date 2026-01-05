import Head from "next/head";
import Link from "next/link";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useState, useEffect } from "react";
import { 
  Check, 
  ChevronRight, 
  AlertTriangle, 
  FileText, 
  ShieldCheck, 
  TrendingDown, 
  Clock, 
  Zap, 
  Users, 
  BadgeCheck, 
  MapPin, 
  DollarSign, 
  FileCheck, 
  Search, 
  ArrowRight, 
  UserCheck, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Phone,
  Sparkles,
  TrendingUp,
  X
} from "lucide-react";

// Dynamic import for below-the-fold content
const PremiumListings = dynamic(() => import("@/components/buyauto/PremiumListings"), {
  loading: () => <div className="w-full h-96 bg-neutral-100 animate-pulse rounded-xl" />,
  ssr: false
});

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function LeasingAbgebenSchweiz() {
  const [months, setMonths] = useState(24);
  const [showStickyCTA, setShowStickyCTA] = useState(false);
  
  // Calculate costs based on months remaining
  const calculateCosts = (remainingMonths: number) => {
    const cancellationCost = remainingMonths * 450 + 1500; // Monthly rate + penalty
    const transferCost = 350;
    return { cancellationCost, transferCost };
  };

  const costs = calculateCosts(months);

  // Handle sticky CTA visibility
  useEffect(() => {
    const handleScroll = () => {
      const heroHeight = 600; // Approximate hero section height
      setShowStickyCTA(window.scrollY > heroHeight);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <Head>
        <title>Leasing abgeben in der Schweiz (2025): So wirst du dein Auto-Leasing legal & stressfrei los</title>
        <meta
          name="description"
          content="Leasing abgeben in der Schweiz leicht gemacht: Erfahre, wie du legal aus dem Leasing aussteigst, welche Optionen du hast, welche Kosten entstehen – und warum die Leasingübernahme oft die günstigste Lösung ist."
        />
        <link rel="canonical" href="https://www.buyauto.ch/leasing-abgeben-schweiz" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Leasing abgeben in der Schweiz (2025): So wirst du dein Auto-Leasing legal & stressfrei los" />
        <meta property="og:description" content="Leasing abgeben in der Schweiz leicht gemacht: Erfahre, wie du legal aus dem Leasing aussteigst, welche Optionen du hast, welche Kosten entstehen." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://www.buyauto.ch/leasing-abgeben-schweiz" />
      </Head>

      <main className="bg-white min-h-screen">
        
        {/* STICKY CTA BAR */}
        <div 
          className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ${
            showStickyCTA ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="bg-gradient-to-r from-primary via-primary/95 to-primary backdrop-blur-lg border-t border-primary/20 shadow-2xl">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="hidden md:block">
                  <p className="text-white font-bold text-lg">Bereit, dein Leasing abzugeben?</p>
                  <p className="text-white/80 text-sm">Schnell, legal & kostengünstig</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <Button
                    asChild
                    size="lg"
                    className="flex-1 md:flex-none bg-white hover:bg-white/90 text-primary font-black shadow-xl px-8 py-6 rounded-xl"
                  >
                    <Link href="/inserat-erstellen">
                      Jetzt Inserat erstellen
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                  <button
                    onClick={() => setShowStickyCTA(false)}
                    className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                    aria-label="Schließen"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* HERO SECTION - Modern with Image */}
        <section className="relative min-h-[700px] flex items-center overflow-hidden pt-16">
          {/* Background with gradient overlay */}
          <div className="absolute inset-0">
            {/* Hero Image */}
            <div className="absolute inset-0">
              <Image
                src="/20251209_0003_Handshake_in_Zurich_simple_compose_01kc036j1cff881r0wzwemf48h.png"
                alt="Handshake - Leasing Übernahme"
                fill
                className="object-cover object-center"
                priority
                quality={90}
              />
            </div>
            
            {/* Gradient Overlays for readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/80" />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
            
            {/* Decorative mesh gradients */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/20 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3" />
            </div>
          </div>

          {/* Hero Content */}
          <div className="relative z-10 w-full px-4 py-20">
            <div className="max-w-6xl mx-auto">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-6 border border-primary/20 backdrop-blur-sm">
                  <Sparkles className="w-4 h-4" />
                  Der ultimative Guide 2025
                </div>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-neutral-900 tracking-tight leading-[1.1] mb-6">
                  Leasing abgeben<br />
                  <span className="text-primary">ohne Stress.</span>
                </h1>
                <p className="text-xl md:text-2xl text-neutral-600 font-medium mb-8 leading-relaxed">
                  Legal aussteigen, Kosten minimieren & schnell einen Nachfolger finden – so funktioniert's.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 mb-12">
                  <Button
                    asChild
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30 transition-all duration-300 px-8 py-7 text-lg font-bold rounded-2xl group"
                  >
                    <Link href="/inserat-erstellen">
                      Jetzt Inserat erstellen
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                  <Button
                    onClick={() => scrollToSection("calculator")}
                    size="lg"
                    variant="outline"
                    className="border-2 border-neutral-300 text-neutral-900 hover:bg-neutral-100 transition-all duration-300 px-8 py-7 text-lg font-bold rounded-2xl backdrop-blur-sm bg-white/80"
                  >
                    Kosten berechnen
                  </Button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { value: "< 1 Woche", label: "Durchschnittliche Dauer" },
                    { value: "CHF 350", label: "Typische Kosten" },
                    { value: "100%", label: "Legal & sicher" }
                  ].map((stat, i) => (
                    <div key={i} className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 border border-neutral-200/50 shadow-lg">
                      <div className="text-2xl md:text-3xl font-black text-primary mb-1">{stat.value}</div>
                      <div className="text-xs md:text-sm text-neutral-600 font-medium">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* INTERACTIVE COST CALCULATOR - The "Reality Check" */}
        <section id="calculator" className="py-20 px-4 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 scroll-mt-20">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
                <TrendingUp className="w-4 h-4" />
                Interaktiver Rechner
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                Was kostet dein Ausstieg?
              </h2>
              <p className="text-neutral-300 text-lg max-w-2xl mx-auto">
                Schiebe den Regler und sieh sofort, wie viel du mit einer Leasingübernahme sparst.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl">
              {/* Slider */}
              <div className="mb-12">
                <label className="text-neutral-900 font-bold text-xl mb-6 block">
                  Wie lange läuft dein Leasing noch?
                </label>
                <div className="space-y-4">
                  <Slider
                    value={[months]}
                    onValueChange={(value) => setMonths(value[0])}
                    min={6}
                    max={48}
                    step={6}
                    className="w-full"
                  />
                  <div className="text-center">
                    <span className="text-5xl font-black text-primary">{months}</span>
                    <span className="text-2xl text-neutral-600 font-bold ml-2">Monate</span>
                  </div>
                </div>
              </div>

              {/* Cost Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Option 1: Cancellation */}
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-8 border-2 border-red-200 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-200/50 rounded-full blur-3xl -mr-16 -mt-16" />
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-4">
                      <XCircle className="w-6 h-6 text-red-600" />
                      <h3 className="font-black text-xl text-neutral-900">Vorzeitige Kündigung</h3>
                    </div>
                    <div className="mb-2">
                      <span className="text-5xl font-black text-red-600">
                        CHF {costs.cancellationCost.toLocaleString("de-CH")}
                      </span>
                    </div>
                    <p className="text-neutral-700 font-medium">
                      Restschuld + Vorfälligkeitsgebühr + Rücknahmekosten
                    </p>
                  </div>
                </div>

                {/* Option 2: Transfer */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-8 border-2 border-green-300 relative overflow-hidden ring-4 ring-green-200/50">
                  <div className="absolute top-2 right-2">
                    <div className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">BESTE WAHL</div>
                  </div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-200/50 rounded-full blur-3xl -mr-16 -mt-16" />
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      <h3 className="font-black text-xl text-neutral-900">Leasingübernahme</h3>
                    </div>
                    <div className="mb-2">
                      <span className="text-5xl font-black text-green-600">
                        CHF {costs.transferCost.toLocaleString("de-CH")}
                      </span>
                    </div>
                    <p className="text-neutral-700 font-medium">
                      Nur Ummeldegebühren – keine versteckten Kosten
                    </p>
                  </div>
                </div>
              </div>

              {/* Savings Badge */}
              <div className="mt-8 text-center">
                <div className="inline-flex items-center gap-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-2xl shadow-lg">
                  <Zap className="w-6 h-6" />
                  <span className="text-2xl font-black">
                    Du sparst CHF {(costs.cancellationCost - costs.transferCost).toLocaleString("de-CH")}!
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* WHY PEOPLE GIVE UP LEASING - Bento Grid Style */}
        <section id="warum" className="py-20 px-4 bg-neutral-50 scroll-mt-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-black text-neutral-900 mb-4">
                Warum Leasing abgeben?
              </h2>
              <p className="text-neutral-600 text-lg">Die häufigsten Gründe in der Schweiz</p>
            </div>
            
            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: DollarSign, title: "Finanzielle Belastung", desc: "Raten werden zu hoch oder Budget ändert sich" },
                { icon: UserCheck, title: "Lebenssituation", desc: "Baby, Umzug, neue Prioritäten" },
                { icon: MapPin, title: "Kilometer überschritten", desc: "Höherer Verbrauch als geplant" },
                { icon: FileText, title: "Versicherung zu teuer", desc: "Unerwartete Zusatzkosten" },
                { icon: TrendingDown, title: "Auto nicht nötig", desc: "Homeoffice oder ÖV reicht" },
                { icon: AlertCircle, title: "Vertrag läuft aus", desc: "Neue Modelle bevorzugt" }
              ].map((item, i) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={i}
                    className="group bg-white rounded-3xl p-8 border border-neutral-200 hover:border-primary transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                  >
                    <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                      <IconComponent className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-black text-neutral-900 mb-3">{item.title}</h3>
                    <p className="text-neutral-600 leading-relaxed">{item.desc}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-12 bg-gradient-to-br from-primary/5 to-primary/10 border-l-4 border-primary p-8 rounded-3xl">
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-8 h-8 text-primary shrink-0 mt-1" />
                <div>
                  <p className="text-xl font-black text-neutral-900 mb-2">Wichtig zu wissen:</p>
                  <p className="text-neutral-700 text-lg leading-relaxed">
                    Ein Leasingvertrag ist rechtlich bindend – einfach zurückgeben ist nicht möglich. Aber es gibt legale, kostengünstige Alternativen.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* OPTIONS COMPARISON - Premium Bento Layout */}
        <section className="py-20 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black text-neutral-900 mb-4">
                Deine 3 Optionen im Vergleich
              </h2>
              <p className="text-neutral-600 text-lg">Legal aussteigen – aber welcher Weg ist der beste?</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Option 1: Cancellation - Red Theme */}
              <Card className="border-2 border-red-100 hover:border-red-200 transition-all duration-300 rounded-3xl overflow-hidden group hover:shadow-2xl">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-br from-red-50 to-red-100 p-8">
                    <div className="bg-red-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
                      <XCircle className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-black text-neutral-900 mb-2">Vorzeitige Kündigung</h3>
                    <div className="text-sm font-bold text-red-600 bg-red-200 inline-block px-3 py-1 rounded-full">TEUERSTE OPTION</div>
                  </div>
                  <div className="p-8 bg-white">
                    <div className="space-y-4 mb-6">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-red-400 mt-2 shrink-0" />
                        <span className="text-neutral-700">Restschuld für verbleibende Vertragsdauer</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-red-400 mt-2 shrink-0" />
                        <span className="text-neutral-700">Vorfälligkeitsentschädigung</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-red-400 mt-2 shrink-0" />
                        <span className="text-neutral-700">Rücknahmekosten</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-red-400 mt-2 shrink-0" />
                        <span className="text-neutral-700">Kosten bei Schäden</span>
                      </div>
                    </div>
                    <p className="text-sm text-neutral-500 italic">Fast immer die teuerste Lösung</p>
                  </div>
                </CardContent>
              </Card>

              {/* Option 2: Selling - Orange Theme */}
              <Card className="border-2 border-orange-100 hover:border-orange-200 transition-all duration-300 rounded-3xl overflow-hidden group hover:shadow-2xl">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-8">
                    <div className="bg-orange-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-black text-neutral-900 mb-2">Auto verkaufen</h3>
                    <div className="text-sm font-bold text-orange-600 bg-orange-200 inline-block px-3 py-1 rounded-full">UNSICHER</div>
                  </div>
                  <div className="p-8 bg-white">
                    <div className="space-y-4 mb-6">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-orange-400 mt-2 shrink-0" />
                        <span className="text-neutral-700">Niedriger Ankaufpreis</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-orange-400 mt-2 shrink-0" />
                        <span className="text-neutral-700">Risiko eines Wertverlusts</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-orange-400 mt-2 shrink-0" />
                        <span className="text-neutral-700">Weiterlaufende Raten</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-orange-400 mt-2 shrink-0" />
                        <span className="text-neutral-700">Unerwartete Zusatzgebühren</span>
                      </div>
                    </div>
                    <p className="text-sm text-neutral-500 italic">Nur bei hohem Marktwert sinnvoll</p>
                  </div>
                </CardContent>
              </Card>

              {/* Option 3: Transfer - Green Theme (HERO) */}
              <Card className="border-4 border-green-300 rounded-3xl overflow-hidden ring-4 ring-green-100 shadow-2xl relative">
                <div className="absolute top-4 right-4 z-10">
                  <div className="bg-green-600 text-white text-xs font-black px-4 py-2 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    EMPFOHLEN
                  </div>
                </div>
                <CardContent className="p-0">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-8">
                    <div className="bg-green-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
                      <BadgeCheck className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-black text-neutral-900 mb-2">Leasingübernahme</h3>
                    <div className="text-sm font-bold text-green-700 bg-green-200 inline-block px-3 py-1 rounded-full">BESTE LÖSUNG</div>
                  </div>
                  <div className="p-8 bg-white">
                    <div className="space-y-4 mb-6">
                      <div className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                        <span className="text-neutral-700 font-medium">Schneller Ausstieg</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                        <span className="text-neutral-700 font-medium">Keine Strafzahlungen</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                        <span className="text-neutral-700 font-medium">Kein Verkauf nötig</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                        <span className="text-neutral-700 font-medium">Win-Win für beide Seiten</span>
                      </div>
                    </div>
                    <Button
                      asChild
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-6 rounded-2xl text-lg"
                    >
                      <Link href="/leasinguebernahme">
                        Mehr erfahren
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* PROCESS TIMELINE - Modern Steps */}
        <section id="ablauf" className="py-20 px-4 bg-gradient-to-b from-neutral-50 to-white scroll-mt-20">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black text-neutral-900 mb-4">
                So funktioniert's
              </h2>
              <p className="text-neutral-600 text-lg">In 5 einfachen Schritten zum Ziel</p>
            </div>

            <div className="space-y-8">
              {[
                {
                  step: 1,
                  title: "Vertragsdetails prüfen",
                  desc: "Restwert, Laufzeit und Kilometerstand checken",
                  icon: FileText,
                  color: "blue"
                },
                {
                  step: 2,
                  title: "Leasinggeber kontaktieren",
                  desc: "Konditionen für Übernahme klären",
                  icon: Phone,
                  color: "purple"
                },
                {
                  step: 3,
                  title: "Inserat erstellen",
                  desc: "Auf BuyAuto.ch veröffentlichen und Nachfolger finden",
                  icon: Search,
                  color: "primary"
                },
                {
                  step: 4,
                  title: "Bonitätsprüfung",
                  desc: "Leasingbank prüft den Übernehmer",
                  icon: ShieldCheck,
                  color: "orange"
                },
                {
                  step: 5,
                  title: "Umschreibung & Übergabe",
                  desc: "Vertrag umschreiben, Fahrzeug übergeben – fertig!",
                  icon: CheckCircle,
                  color: "green"
                }
              ].map((item) => {
                const IconComponent = item.icon;
                return (
                  <div key={item.step} className="relative">
                    <div className="flex items-start gap-6 md:gap-8">
                      <div className="flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-gradient-to-br from-primary to-primary/80 text-white flex flex-col items-center justify-center font-black text-2xl shadow-xl ring-4 ring-primary/20">
                        {item.step}
                      </div>
                      
                      <div className="flex-1 bg-white rounded-3xl p-8 border-2 border-neutral-100 hover:border-primary/30 transition-all duration-300 hover:shadow-lg group">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-primary/20 transition-colors">
                            <IconComponent className="w-6 h-6 text-primary" />
                          </div>
                          <h3 className="text-2xl font-black text-neutral-900">{item.title}</h3>
                        </div>
                        <p className="text-neutral-600 text-lg">{item.desc}</p>
                      </div>
                    </div>

                    {item.step < 5 && (
                      <div className="ml-10 my-4 h-8 w-1 bg-gradient-to-b from-primary/30 to-transparent rounded-full" />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-12 text-center">
              <Button
                asChild
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white font-bold px-10 py-7 text-lg rounded-2xl shadow-xl shadow-primary/30"
              >
                <Link href="/inserat-erstellen">
                  Jetzt starten
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* FAQ - Clean Accordion */}
        <section id="faq" className="py-20 px-4 bg-white scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-black text-neutral-900 mb-4">
                Häufige Fragen
              </h2>
              <p className="text-neutral-600 text-lg">Alles, was du wissen musst</p>
            </div>
            
            <Accordion type="single" collapsible className="w-full space-y-4">
              {[
                {
                  q: "Kann ich mein Leasing einfach zurückgeben?",
                  a: "Nein, ein Leasingvertrag ist bindend. Eine vorzeitige Rückgabe ist meist mit sehr hohen Kosten (Vorfälligkeitsentschädigung) verbunden. Die <a href='/leasinguebernahme' class='text-primary hover:underline font-semibold'>Leasingübernahme</a> ist oft die einzige kostengünstige Alternative."
                },
                {
                  q: "Wie schnell kann ich mein Leasing abgeben?",
                  a: "Das hängt davon ab, wie schnell du einen Übernehmer findest. Mit einem attraktiven Inserat auf BuyAuto oft in wenigen Wochen. Die bankseitige Abwicklung dauert dann meist nur wenige Tage."
                },
                {
                  q: "Was passiert, wenn ich nicht mehr zahlen kann?",
                  a: "Kontaktiere sofort deine Leasingbank. Eine <a href='/leasinguebernahme' class='text-primary hover:underline font-semibold'>Leasingübernahme</a> kann helfen, aus den Zahlungsverpflichtungen herauszukommen, bevor Schulden entstehen."
                },
                {
                  q: "Wer trägt die Kosten bei einer Vertragsübernahme?",
                  a: "Das ist Verhandlungssache. Oft übernimmt der Abgeber die Umschreibegebühren, um das Angebot für den Übernehmer attraktiver zu machen."
                },
                {
                  q: "Was prüft der Leasinggeber?",
                  a: "Vor allem die Bonität des neuen Leasingnehmers. Er muss die Raten genauso sicher zahlen können wie du."
                },
                {
                  q: "Warum ist die Leasingübernahme günstiger als die Kündigung?",
                  a: "Bei einer Kündigung musst du die Bank für den Zinsausfall entschädigen. Bei einer Leasingübernahme läuft der Vertrag einfach weiter – die Bank verliert kein Geld, daher fallen kaum Strafgebühren an."
                }
              ].map((faq, i) => (
                <AccordionItem 
                  key={i}
                  value={`item-${i}`} 
                  className="bg-neutral-50 rounded-2xl border-2 border-neutral-200 px-8 hover:border-primary/50 transition-all duration-300 data-[state=open]:bg-white data-[state=open]:shadow-lg"
                >
                  <AccordionTrigger className="text-left font-bold text-neutral-900 hover:no-underline py-6 text-lg">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-neutral-600 leading-relaxed pb-6 text-base">
                    <div dangerouslySetInnerHTML={{ __html: faq.a }} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* FINAL CTA - Premium Dark Section */}
        <section className="py-24 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 px-4 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-primary rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary rounded-full blur-3xl" />
          </div>

          <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <Sparkles className="w-4 h-4" />
              Bereit für den nächsten Schritt?
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
              Gib dein Leasing ab –<br />
              <span className="text-primary">legal, schnell & günstig</span>
            </h2>
            <p className="text-neutral-300 max-w-2xl mx-auto text-xl leading-relaxed">
              Die Leasingübernahme ist die beste Lösung für 95% aller Fahrer. Keine versteckten Kosten, keine Komplikationen.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <Button 
                asChild 
                size="lg" 
                className="w-full sm:w-auto h-16 px-10 text-xl font-black bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-2xl shadow-primary/40 transition-all group"
              >
                <Link href="/inserat-erstellen">
                  Jetzt Inserat erstellen
                  <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button 
                asChild 
                size="lg" 
                variant="outline" 
                className="w-full sm:w-auto h-16 px-10 text-xl font-black border-2 border-white text-white hover:bg-white hover:text-neutral-900 rounded-2xl bg-transparent transition-all"
              >
                <Link href="/leasinguebernahme">
                  Mehr erfahren
                </Link>
              </Button>
            </div>
            
            {/* Trust Indicators */}
            <div className="pt-12 flex flex-wrap items-center justify-center gap-8 text-neutral-400 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>100% legal</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-green-400" />
                <span>Sicher & geprüft</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-green-400" />
                <span>In wenigen Tagen</span>
              </div>
            </div>
          </div>
        </section>

        {/* PREMIUM LISTINGS */}
        <PremiumListings />
        
      </main>
    </>
  );
}