import Head from "next/head";
import Link from "next/link";
import dynamic from "next/dynamic";
import React from "react";
import { 
  Check, 
  ChevronRight, 
  TrendingDown, 
  TrendingUp, 
  Info, 
  Clock, 
  DollarSign, 
  Users, 
  ShieldCheck, 
  AlertTriangle, 
  Calendar, 
  FileCheck, 
  Zap, 
  ArrowRight, 
  Search 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Image from "next/image";

// Dynamically import heavy interactive components
const SearchForm = dynamic(() => import("@/components/buyauto/SearchForm"), {
  loading: () => <div className="h-96 bg-white rounded-2xl border-2 border-neutral-100 animate-pulse" />
});

const PremiumListings = dynamic(() => import("@/components/buyauto/PremiumListings"), {
  loading: () => <div className="h-96 bg-neutral-50 animate-pulse" />
});

export default function LeasingubernahmeVsAutoAboPage() {
  const [showStickyCTA, setShowStickyCTA] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setShowStickyCTA(scrollPosition > 600);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <Head>
        <title>Leasingübernahme vs. Auto-Abo – Der große Vergleich | BuyAuto</title>
        <meta
          name="description"
          content="Leasingübernahme oder Auto-Abo? Vergleichen Sie Kosten, Flexibilität und Vorteile beider Modelle für Ihre ideale Mobilitätslösung."
        />
        <link rel="canonical" href="https://www.buyauto.ch/leasinguebernahme-vs-autoabo" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Leasingübernahme vs. Auto-Abo – Der große Vergleich" />
        <meta property="og:description" content="Vergleichen Sie Leasingübernahme und Auto-Abo: Kosten, Flexibilität und beste Option für Sie." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://www.buyauto.ch/leasinguebernahme-vs-autoabo" />
      </Head>

      <main className="bg-neutral-50 min-h-screen">
        
        {/* STICKY CTA BAR */}
        <div 
          className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ${
            showStickyCTA ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="bg-gradient-to-r from-primary via-primary/95 to-primary/90 backdrop-blur-lg border-t border-white/20 shadow-2xl">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="hidden md:block">
                  <p className="text-white font-bold text-lg">
                    Finden Sie Ihre perfekte Leasingübernahme
                  </p>
                  <p className="text-white/90 text-sm">
                    Vergleichen und sparen Sie bis zu 30%
                  </p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <Button
                    asChild
                    size="lg"
                    className="bg-white text-primary hover:bg-white/90 font-bold shadow-lg flex-1 md:flex-none h-12 px-8 rounded-xl"
                  >
                    <Link href="/suche">
                      <Search className="w-5 h-5 mr-2" />
                      Jetzt Angebote durchsuchen
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowStickyCTA(false)}
                    className="text-white hover:bg-white/20 md:hidden h-12 w-12 rounded-xl"
                  >
                    <span className="sr-only">Schließen</span>
                    ✕
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* HERO SECTION */}
        <section className="relative min-h-[500px] md:min-h-[550px] flex items-center overflow-hidden pt-16">
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=2400&q=80"
              alt="Leasingübernahme vs Auto-Abo"
              fill
              className="object-cover"
              priority
              quality={75}
              sizes="100vw"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/70 via-neutral-900/60 to-neutral-900/80" />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-neutral-900/30" />
          </div>

          {/* Geometric Accents */}
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 left-1/5 w-64 h-64 bg-primary/5 rounded-full blur-2xl" />

          {/* Hero Content */}
          <div className="relative z-10 w-full px-4 py-16 md:py-20">
            <div className="max-w-6xl mx-auto text-center">
              <div className="max-w-3xl mx-auto">
                <div className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-full text-sm font-semibold mb-6">
                  <FileCheck className="w-4 h-4" />
                  Detaillierter Vergleich
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight mb-6">
                  Leasingübernahme vs. Auto-Abo
                </h1>
                <p className="text-xl md:text-2xl text-primary-foreground font-semibold mb-4">
                  Welches Modell passt zu Ihnen?
                </p>
                <p className="text-lg text-neutral-200 leading-relaxed mb-8 max-w-2xl">
                  Umfassender Vergleich von Leasingübernahme und Auto-Abo: Kosten, Flexibilität und Vorteile für Ihre perfekte Mobilitätslösung.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    asChild
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30 transition-all duration-300 px-8 py-6 text-base font-semibold rounded-xl"
                  >
                    <Link href="/suche">
                      Leasingübernahmen entdecken
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-2 border-white text-white hover:bg-white hover:text-neutral-900 transition-all duration-300 px-8 py-6 text-base font-semibold rounded-xl bg-transparent"
                  >
                    <Link href="/inserat-erstellen">
                      Inserat erstellen
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* QUICK ANSWER BOX */}
        <section className="py-20 px-4 bg-white">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-3 bg-primary/10 px-5 py-2 rounded-full mb-8">
              <Info className="w-5 h-5 text-primary" />
              <span className="font-bold text-neutral-900">Kurz gesagt</span>
            </div>
            <h2 className="text-4xl font-bold text-neutral-900 mb-8 tracking-tight">
              Der Hauptunterschied
            </h2>
            
            <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border-2 border-primary/20 p-8 md:p-10 rounded-3xl shadow-lg text-left">
              <p className="text-lg text-neutral-700 leading-relaxed mb-4">
                Bei einer <strong>Leasingübernahme</strong> übernehmen Sie einen bestehenden Vertrag mit fester Laufzeit und oft günstigen Konditionen. Ein <strong>Auto-Abo</strong> bietet maximale Flexibilität mit monatlicher Kündbarkeit und All-Inclusive-Service.
              </p>
              <p className="text-lg text-neutral-700 leading-relaxed">
                <strong>Leasingübernahme:</strong> Kosteneffizient, mittelfristige Bindung<br/>
                <strong>Auto-Abo:</strong> Maximale Flexibilität, höhere Kosten
              </p>
            </div>
          </div>
        </section>

        {/* TOC SECTION */}
        <section className="py-16 px-4 bg-neutral-50">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="font-bold text-neutral-900 mb-8 text-2xl">Inhaltsverzeichnis</h3>
            <div className="bg-white p-8 rounded-3xl border-2 border-neutral-100 shadow-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8">
                {[
                  { id: "unterschiede", label: "Hauptunterschiede" },
                  { id: "kostenvergleich", label: "Kostenvergleich" },
                  { id: "search", label: "Angebote entdecken" },
                  { id: "vorteile-uebernahme", label: "Vorteile Leasingübernahme" },
                  { id: "vorteile-autoabo", label: "Vorteile Auto-Abo" },
                  { id: "fuer-wen", label: "Für wen eignet sich was?" },
                  { id: "entscheidungshilfe", label: "Entscheidungshilfe" },
                  { id: "faq", label: "Häufige Fragen" },
                ].map((item, i) => (
                  <button 
                    key={i}
                    onClick={() => scrollToSection(item.id)}
                    className="flex items-center gap-2 text-neutral-600 hover:text-primary transition-colors text-left group"
                  >
                    <ChevronRight className="w-4 h-4 text-primary/60 group-hover:text-primary transition-colors" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* MAIN DIFFERENCES */}
        <section id="unterschiede" className="py-20 px-4 bg-white scroll-mt-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-neutral-900 mb-4 tracking-tight">
                Hauptunterschiede im Überblick
              </h2>
              <p className="text-xl text-neutral-600">
                Zwei verschiedene Mobilitätskonzepte im direkten Vergleich
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Leasingübernahme */}
              <div className="bg-gradient-to-br from-neutral-50 to-white p-8 md:p-10 rounded-3xl shadow-xl border-2 border-primary hover:shadow-2xl transition-all">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-primary text-white p-3 rounded-xl">
                    <TrendingDown className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-900">
                    Leasingübernahme
                  </h3>
                </div>
                <ul className="space-y-4">
                  {[
                    "Bestehender Vertrag mit Restlaufzeit",
                    "Oft keine oder geringe Anzahlung",
                    "Fixe monatliche Rate",
                    "Mittelfristige Bindung (6-24 Monate)",
                    "Sofortige Verfügbarkeit",
                    "Günstiger als Neuleasing"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-neutral-700">
                      <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Auto-Abo */}
              <div className="bg-gradient-to-br from-neutral-50 to-white p-8 md:p-10 rounded-3xl shadow-xl border-2 border-neutral-300 hover:shadow-2xl transition-all">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-neutral-700 text-white p-3 rounded-xl">
                    <TrendingUp className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-900">
                    Auto-Abo
                  </h3>
                </div>
                <ul className="space-y-4">
                  {[
                    "Monatlich kündbar (oft 1-3 Monate)",
                    "Keine Anzahlung nötig",
                    "All-Inclusive Rate (Versicherung, Service)",
                    "Maximale Flexibilität",
                    "Fahrzeugwechsel möglich",
                    "Höhere monatliche Kosten"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-neutral-700">
                      <Check className="w-5 h-5 text-neutral-600 shrink-0 mt-0.5" />
                      <span className="font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* COST COMPARISON */}
        <section id="kostenvergleich" className="py-20 px-4 bg-gradient-to-br from-neutral-50 via-white to-neutral-50 scroll-mt-20">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-3 bg-primary/10 px-5 py-2 rounded-full mb-8">
              <DollarSign className="w-5 h-5 text-primary" />
              <span className="font-bold text-neutral-900">Kosten im Vergleich</span>
            </div>
            <h2 className="text-4xl font-bold text-neutral-900 mb-12 tracking-tight">
              Kostenvergleich
            </h2>
            
            <div className="overflow-x-auto rounded-3xl border-2 border-primary shadow-2xl">
              <table className="w-full bg-white text-left">
                <thead className="bg-primary text-white">
                  <tr>
                    <th className="p-4 md:p-6 font-bold text-base md:text-lg">Kostenposition</th>
                    <th className="p-4 md:p-6 font-bold text-base md:text-lg">Leasingübernahme</th>
                    <th className="p-4 md:p-6 font-bold text-base md:text-lg">Auto-Abo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  <tr className="hover:bg-primary/5 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Anzahlung</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">0–2'000 CHF</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">0 CHF</td>
                  </tr>
                  <tr className="hover:bg-primary/5 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Monatliche Rate</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">400–800 CHF</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">600–1'200 CHF</td>
                  </tr>
                  <tr className="hover:bg-primary/5 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Versicherung</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">Separat (100-200 CHF)</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">Inklusive</td>
                  </tr>
                  <tr className="hover:bg-primary/5 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Service/Wartung</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">Selbst zahlen</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">Inklusive</td>
                  </tr>
                  <tr className="hover:bg-primary/5 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Laufzeit</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">6–24 Monate fest</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">Monatlich kündbar</td>
                  </tr>
                  <tr className="hover:bg-primary/5 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Gesamtkosten (12 Mo.)</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">6'000–12'000 CHF</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">7'200–14'400 CHF</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-8 bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <Info className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-green-900 font-semibold mb-1">Spartipp</p>
                  <p className="text-green-800">
                    Leasingübernahme ist oft 20-30% günstiger als ein Auto-Abo, da Sie keine All-Inclusive-Services mitfinanzieren und von der bereits geleisteten Anzahlung profitieren.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SEARCH SECTION */}
        <section id="search" className="py-20 px-4 bg-white scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-white to-neutral-50 rounded-3xl shadow-2xl border-2 border-primary p-8 md:p-12">
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-3 bg-primary/10 px-5 py-2 rounded-full mb-6">
                  <Search className="w-5 h-5 text-primary" />
                  <span className="font-bold text-neutral-900">Jetzt entdecken</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4 tracking-tight">
                  Leasingübernahmen Entdecken
                </h2>
                <p className="text-neutral-600 text-lg">
                  Finden Sie attraktive Leasingübernahmen oder erstellen Sie Ihr eigenes Inserat.
                </p>
              </div>
              <SearchForm />
            </div>
          </div>
        </section>

        {/* ADVANTAGES LEASINGÜBERNAHME */}
        <section id="vorteile-uebernahme" className="py-20 px-4 bg-gradient-to-br from-neutral-50 via-white to-neutral-50 scroll-mt-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-3 bg-primary/10 px-5 py-2 rounded-full mb-6">
                <TrendingDown className="w-5 h-5 text-primary" />
                <span className="font-bold text-neutral-900">Vorteile</span>
              </div>
              <h2 className="text-4xl font-bold text-neutral-900 mb-4 tracking-tight">
                Vorteile der Leasingübernahme
              </h2>
              <Link href="/leasinguebernahme" className="inline-flex items-center gap-2 text-primary font-semibold hover:underline">
                Mehr erfahren
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  title: "Niedrigere Kosten",
                  desc: "Oft 20-30% günstiger als Auto-Abo",
                  icon: DollarSign
                },
                {
                  title: "Sofort verfügbar",
                  desc: "Fahrzeug kann innerhalb weniger Tage übernommen werden",
                  icon: Zap
                },
                {
                  title: "Keine hohe Anzahlung",
                  desc: "Meist nur geringe oder keine Anzahlung nötig",
                  icon: TrendingDown
                },
                {
                  title: "Mittelfristige Planung",
                  desc: "Ideal für 6-24 Monate kalkulierbare Bindung",
                  icon: Calendar
                },
                {
                  title: "Fixe Konditionen",
                  desc: "Monatliche Rate bleibt konstant",
                  icon: ShieldCheck
                },
                {
                  title: "Große Auswahl",
                  desc: "Viele verschiedene Fahrzeuge verfügbar",
                  icon: Check
                }
              ].map((item, i) => {
                const IconComponent = item.icon;
                return (
                  <div key={i} className="bg-white border-2 border-primary/20 rounded-3xl p-6 hover:shadow-xl hover:border-primary transition-all hover:-translate-y-1">
                    <div className="flex items-start gap-4">
                      <div className="bg-gradient-to-br from-primary to-primary/80 p-3 rounded-2xl shrink-0 shadow-lg">
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-neutral-900 mb-2 text-lg">{item.title}</h3>
                        <p className="text-neutral-600">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ADVANTAGES AUTO-ABO */}
        <section id="vorteile-autoabo" className="py-20 px-4 bg-white scroll-mt-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-3 bg-neutral-200 px-5 py-2 rounded-full mb-6">
                <TrendingUp className="w-5 h-5 text-neutral-700" />
                <span className="font-bold text-neutral-900">Vorteile</span>
              </div>
              <h2 className="text-4xl font-bold text-neutral-900 mb-4 tracking-tight">
                Vorteile Auto-Abo
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  title: "Maximale Flexibilität",
                  desc: "Monatlich kündbar, kein langfristiges Commitment",
                  icon: Zap
                },
                {
                  title: "All-Inclusive",
                  desc: "Versicherung, Service, Steuern alles inklusive",
                  icon: ShieldCheck
                },
                {
                  title: "Keine Anzahlung",
                  desc: "Sofortiger Start ohne Startkapital",
                  icon: DollarSign
                },
                {
                  title: "Fahrzeugwechsel",
                  desc: "Regelmäßiger Wechsel zu neuen Modellen möglich",
                  icon: TrendingUp
                },
                {
                  title: "Keine versteckten Kosten",
                  desc: "Transparente Preisgestaltung ohne Überraschungen",
                  icon: Check
                },
                {
                  title: "Planungssicherheit",
                  desc: "Fixe Rate deckt alle Kosten ab",
                  icon: Calendar
                }
              ].map((item, i) => {
                const IconComponent = item.icon;
                return (
                  <div key={i} className="bg-neutral-50 border-2 border-neutral-200 rounded-3xl p-6 hover:shadow-xl hover:border-neutral-400 transition-all hover:-translate-y-1">
                    <div className="flex items-start gap-4">
                      <div className="bg-gradient-to-br from-neutral-600 to-neutral-700 p-3 rounded-2xl shrink-0 shadow-lg">
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-neutral-900 mb-2 text-lg">{item.title}</h3>
                        <p className="text-neutral-600">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FOR WHOM SECTION */}
        <section id="fuer-wen" className="py-20 px-4 bg-gradient-to-br from-neutral-50 via-white to-neutral-50 scroll-mt-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-neutral-900 mb-4 tracking-tight">
                Für wen eignet sich was?
              </h2>
              <p className="text-xl text-neutral-600">
                Finden Sie die passende Mobilitätslösung für Ihre Situation
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Leasingübernahme geeignet für */}
              <Card className="border-2 border-primary shadow-2xl hover:shadow-3xl transition-all rounded-3xl overflow-hidden">
                <CardContent className="p-8 md:p-10">
                  <div className="flex items-center gap-3 mb-6">
                    <Users className="w-7 h-7 text-primary" />
                    <h3 className="text-2xl font-bold text-neutral-900">
                      Leasingübernahme passt zu Ihnen, wenn...
                    </h3>
                  </div>
                  <ul className="space-y-4">
                    {[
                      "Sie Kosten sparen möchten",
                      "Sie mittelfristig (6-24 Monate) planen",
                      "Sie das Fahrzeug sofort benötigen",
                      "Sie fixe monatliche Raten bevorzugen",
                      "Sie bereit sind, Versicherung separat zu zahlen",
                      "Sie ein gutes Preis-Leistungs-Verhältnis suchen"
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-neutral-700">
                        <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <span className="font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Auto-Abo geeignet für */}
              <Card className="border-2 border-neutral-300 shadow-2xl hover:shadow-3xl transition-all rounded-3xl overflow-hidden">
                <CardContent className="p-8 md:p-10">
                  <div className="flex items-center gap-3 mb-6">
                    <Users className="w-7 h-7 text-neutral-700" />
                    <h3 className="text-2xl font-bold text-neutral-900">
                      Auto-Abo passt zu Ihnen, wenn...
                    </h3>
                  </div>
                  <ul className="space-y-4">
                    {[
                      "Sie maximale Flexibilität wünschen",
                      "Sie nicht langfristig binden möchten",
                      "Sie All-Inclusive-Service schätzen",
                      "Sie regelmäßig Fahrzeuge wechseln wollen",
                      "Sie keine separate Versicherung abschließen möchten",
                      "Sie bereit sind, mehr für Komfort zu zahlen"
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-neutral-700">
                        <Check className="w-5 h-5 text-neutral-600 shrink-0 mt-0.5" />
                        <span className="font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* DECISION HELPER */}
        <section id="entscheidungshilfe" className="py-20 px-4 bg-white scroll-mt-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-3 bg-primary/10 px-5 py-2 rounded-full mb-8">
              <FileCheck className="w-5 h-5 text-primary" />
              <span className="font-bold text-neutral-900">Entscheidungshilfe</span>
            </div>
            <h2 className="text-4xl font-bold text-neutral-900 mb-12 tracking-tight">
              Entscheidungshilfe: Ihre Checkliste
            </h2>
            
            <div className="bg-gradient-to-br from-neutral-50 to-white border-2 border-primary/20 rounded-3xl p-8 md:p-10 shadow-xl text-left">
              <p className="text-lg text-neutral-700 mb-6">
                Beantworten Sie diese Fragen, um die richtige Wahl zu treffen:
              </p>
              
              <div className="space-y-4">
                {[
                  "Wie wichtig ist Ihnen Flexibilität bei der Laufzeit?",
                  "Möchten Sie eine All-Inclusive-Lösung oder lieber selbst verwalten?",
                  "Wie lange planen Sie, das Fahrzeug zu nutzen?",
                  "Ist Kostenersparnis oder Komfort wichtiger für Sie?",
                  "Benötigen Sie das Fahrzeug sofort oder können Sie warten?",
                  "Möchten Sie regelmäßig verschiedene Fahrzeuge testen?",
                  "Wie wichtig ist Ihnen Planungssicherheit?"
                ].map((question, i) => (
                  <div key={i} className="bg-white border border-neutral-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-primary font-bold text-sm">{i + 1}</span>
                      </div>
                      <p className="text-neutral-900 font-medium">{question}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-primary font-semibold mb-2">
                  💡 Unser Tipp:
                </p>
                <p className="text-neutral-700">
                  Wenn Sie "Kostenersparnis", "Mittelfristig" und "Sofort" priorisieren, ist eine <strong>Leasingübernahme</strong> ideal. Wenn Sie "Flexibilität", "All-Inclusive" und "Fahrzeugwechsel" bevorzugen, ist ein <strong>Auto-Abo</strong> besser geeignet.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section id="faq" className="py-20 px-4 bg-gradient-to-br from-neutral-50 via-white to-neutral-50 scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-3 bg-primary/10 px-5 py-2 rounded-full mb-6">
                <Info className="w-5 h-5 text-primary" />
                <span className="font-bold text-neutral-900">FAQ</span>
              </div>
              <h2 className="text-4xl font-bold text-neutral-900 mb-4 tracking-tight">
                Häufige Fragen
              </h2>
              <p className="text-neutral-600 text-xl">
                Die wichtigsten Fragen im Vergleich
              </p>
            </div>
            
            <Accordion type="single" collapsible className="w-full space-y-4">
              <AccordionItem 
                value="item-1" 
                className="bg-white rounded-3xl border-2 border-neutral-200 px-6 md:px-8 hover:border-primary hover:shadow-lg transition-all"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Was ist günstiger: Leasingübernahme oder Auto-Abo?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Eine Leasingübernahme ist in der Regel 20-30% günstiger als ein Auto-Abo, da Sie keine All-Inclusive-Services mitfinanzieren und oft von einer bereits geleisteten Anzahlung profitieren.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem 
                value="item-2" 
                className="bg-white rounded-3xl border-2 border-neutral-200 px-6 md:px-8 hover:border-primary hover:shadow-lg transition-all"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Welche Option bietet mehr Flexibilität?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Ein Auto-Abo bietet deutlich mehr Flexibilität mit monatlicher Kündigungsfrist. Eine Leasingübernahme bindet Sie für die Restlaufzeit (meist 6-24 Monate).
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem 
                value="item-3" 
                className="bg-white rounded-3xl border-2 border-neutral-200 px-6 md:px-8 hover:border-primary hover:shadow-lg transition-all"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Brauche ich eine Anzahlung bei einem Auto-Abo?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Nein, Auto-Abos erfordern keine Anzahlung. Sie zahlen nur die monatliche All-Inclusive-Rate. Bei einer Leasingübernahme kann eine kleine Anzahlung (0-2'000 CHF) anfallen.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem 
                value="item-4" 
                className="bg-white rounded-3xl border-2 border-neutral-200 px-6 md:px-8 hover:border-primary hover:shadow-lg transition-all"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Welche versteckten Kosten gibt es?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Bei Leasingübernahme: Versicherung, Service, Steuern separat. Bei Auto-Abo: Alles inklusive, nur Tanken/Laden extra. Beide: Kilometerlimit-Überschreitungen kosten extra.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="item-5" 
                className="bg-white rounded-3xl border-2 border-neutral-200 px-6 md:px-8 hover:border-primary hover:shadow-lg transition-all"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Kann ich beim Auto-Abo das Fahrzeug wechseln?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Ja, viele Auto-Abo-Anbieter erlauben nach einer Mindestlaufzeit (oft 6-12 Monate) einen Fahrzeugwechsel. Bei Leasingübernahme ist ein Wechsel nicht möglich.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="item-6" 
                className="bg-white rounded-3xl border-2 border-neutral-200 px-6 md:px-8 hover:border-primary hover:shadow-lg transition-all"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Für wen ist eine Leasingübernahme die bessere Wahl?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Ideal für kostenbewusste Personen mit mittelfristigem Bedarf (6-24 Monate), die bereit sind, Versicherung und Service selbst zu organisieren und Wert auf Kostenersparnis legen.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-24 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 px-4">
          <div className="max-w-4xl mx-auto text-center space-y-10">
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm px-5 py-2 rounded-full mb-4">
              <Zap className="w-5 h-5 text-white" />
              <span className="font-bold text-white">Bereit zum Start</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              Bereit für Ihre Mobilitätslösung?
            </h2>
            <p className="text-neutral-300 max-w-2xl mx-auto text-xl leading-relaxed">
              Entdecken Sie attraktive Leasingübernahmen oder erstellen Sie Ihr eigenes Inserat.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <Button asChild size="lg" className="w-full sm:w-auto h-14 px-10 text-lg font-semibold bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-2xl shadow-primary/30 transition-all hover:-translate-y-1">
                <Link href="/suche">
                  <Search className="w-5 h-5 mr-2" />
                  Angebote durchsuchen
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto h-14 px-10 text-lg font-semibold border-2 border-white text-white hover:bg-white hover:text-neutral-900 rounded-2xl bg-transparent transition-all hover:-translate-y-1">
                <Link href="/inserat-erstellen">
                  Inserat erstellen
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* PREMIUM LISTINGS */}
        <PremiumListings />
        
      </main>
    </>
  );
}