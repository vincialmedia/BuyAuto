import Head from "next/head";
import Link from "next/link";
import dynamic from "next/dynamic";
import Image from "next/image";
import { 
  Check, 
  ChevronRight, 
  AlertTriangle, 
  FileText, 
  Info, 
  ShieldCheck, 
  TrendingDown, 
  Clock, 
  Zap, 
  Users, 
  BadgeCheck, 
  MapPin, 
  Calendar, 
  DollarSign, 
  FileCheck, 
  Search, 
  ArrowRight, 
  RefreshCw, 
  UserCheck, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Phone
} from "lucide-react";

// Dynamic import for below-the-fold content
const PremiumListings = dynamic(() => import("@/components/buyauto/PremiumListings"), {
  loading: () => <div className="w-full h-96 bg-neutral-100 animate-pulse rounded-xl" />,
  ssr: false
});

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function LeasingAbgebenSchweiz() {
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

      <main className="bg-neutral-50 min-h-screen">
        
        {/* HERO SECTION */}
        <section className="relative min-h-[500px] md:min-h-[550px] flex items-center overflow-hidden pt-16">
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src="/ChatGPT_Image_Dec_11_2025_12_15_22_AM.png"
              alt="Leasing abgeben Schweiz"
              fill
              className="object-cover"
              priority
              quality={85}
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
            <div className="max-w-5xl mx-auto">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-full text-sm font-semibold mb-6">
                  <TrendingDown className="w-4 h-4" />
                  Guide 2025
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight mb-6">
                  Leasing abgeben in der Schweiz: Deine Möglichkeiten, Kosten & die beste Lösung
                </h1>
                <p className="text-xl md:text-2xl text-primary-foreground font-semibold mb-4">
                  Der komplette Leitfaden zum Ausstieg aus dem Leasingvertrag
                </p>
                <p className="text-lg text-neutral-200 leading-relaxed mb-8 max-w-2xl">
                  Möchtest du dein Leasing in der Schweiz abgeben? Viele Leasingnehmer stehen irgendwann vor der Frage, wie sie legal und ohne hohe Zusatzkosten aus ihrem Vertrag aussteigen können. Auf dieser Seite findest du alle Optionen – und warum die Leasingübernahme in den meisten Fällen die günstigste und stressfreieste Lösung ist.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    asChild
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30 transition-all duration-300 px-8 py-6 text-base font-semibold rounded-xl"
                  >
                    <Link href="/leasinguebernahme">
                      Mehr zur Leasingübernahme
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
                      Jetzt Inserat erstellen
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TOC SECTION */}
        <section className="py-10 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <h3 className="font-bold text-neutral-900 mb-6 text-xl text-center">Inhaltsverzeichnis</h3>
            <div className="bg-neutral-50 p-6 rounded-xl border border-neutral-200 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8">
                {[
                  { id: "warum", label: "Warum Leasing abgeben?" },
                  { id: "option1", label: "Option 1: Vorzeitige Beendigung" },
                  { id: "option2", label: "Option 2: Auto verkaufen" },
                  { id: "option3", label: "Option 3: Leasingübernahme" },
                  { id: "kosten", label: "Kostenvergleich" },
                  { id: "ablauf", label: "Ablauf der Übergabe" },
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

        {/* SECTION 1 - Warum möchten Fahrer ihr Leasing abgeben? */}
        <section id="warum" className="py-16 px-4 bg-neutral-50 scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <Users className="w-8 h-8 text-primary" />
                  <h2 className="text-3xl font-bold text-neutral-900">
                    Warum möchten Fahrer ihr Leasing abgeben?
                  </h2>
                </div>
                
                <p className="text-lg text-neutral-700 leading-relaxed mb-6">
                  Ein Leasing abzugeben ist in der Schweiz keine Seltenheit. Häufige Gründe sind:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {[
                    { icon: DollarSign, text: "Monatliche Raten werden zu hoch" },
                    { icon: UserCheck, text: "Lebenssituation verändert sich (z. B. Baby, Umzug)" },
                    { icon: MapPin, text: "Höherer Kilometerverbrauch als geplant" },
                    { icon: FileText, text: "Versicherungskosten zu teuer" },
                    { icon: Check, text: "Auto wird nicht mehr benötigt" }
                  ].map((item, i) => {
                    const IconComponent = item.icon;
                    return (
                      <div key={i} className="flex items-start gap-3 bg-white border border-neutral-200 p-4 rounded-lg hover:border-primary transition-colors">
                        <div className="mt-0.5">
                          <IconComponent className="w-5 h-5 text-primary" />
                        </div>
                        <span className="text-neutral-700 font-medium">{item.text}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-primary/5 border-l-4 border-primary p-6 rounded-r-xl">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-lg text-neutral-900 font-semibold mb-1">Wichtig:</p>
                      <p className="text-neutral-800">
                        Ein Leasingvertrag ist rechtlich bindend – einfach zurückgeben ist nicht möglich. Aber es gibt legale Alternativen.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2 - Option 1: Leasing vorzeitig beenden */}
        <section id="option1" className="py-16 px-4 bg-white scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <XCircle className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Option 1: Leasing vorzeitig beenden (meist die teuerste Lösung)
              </h2>
            </div>
            
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-8">
              <p className="text-lg text-neutral-700 leading-relaxed mb-6">
                Ein vorzeitiges Beenden eines Leasingvertrags ist in der Schweiz nur in Ausnahmefällen möglich. Dabei entstehen meist hohe Kosten:
              </p>
              
              <ul className="space-y-3 mb-6">
                {[
                  "Restschuld für die verbleibende Vertragsdauer",
                  "Vorfälligkeitsentschädigung",
                  "Rücknahmekosten",
                  "Kosten bei Schäden oder Mehrkilometern"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-neutral-700">
                    <span className="text-primary font-bold mt-1">•</span>
                    <span className="text-lg">{item}</span>
                  </li>
                ))}
              </ul>

              <div className="p-4 bg-neutral-100 rounded-lg border-l-4 border-neutral-500">
                <p className="text-neutral-700 font-medium">
                  Diese Option ist fast immer die teuerste und für Privatpersonen meistens unattraktiv.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3 - Option 2: Auto verkaufen */}
        <section id="option2" className="py-16 px-4 bg-neutral-50 scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <DollarSign className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Option 2: Auto verkaufen & Leasing ablösen (unsicher)
              </h2>
            </div>
            
            <div className="bg-white border border-neutral-200 rounded-xl p-8">
              <p className="text-lg text-neutral-700 leading-relaxed mb-6">
                Einige Händler bieten an, dein Auto unter Marktwert zu kaufen und die Leasingrestschuld separat abzurechnen. Dabei entstehen Nachteile:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {[
                  "Niedriger Ankaufpreis",
                  "Risiko eines Wertverlusts",
                  "Weiterlaufende Leasingraten bis zur Abwicklung",
                  "Unerwartete Zusatzgebühren"
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                    <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-neutral-700">{item}</span>
                  </div>
                ))}
              </div>

              <p className="text-neutral-700 italic">
                Diese Methode ist nur sinnvoll, wenn der Marktwert deutlich über dem Restwert liegt – was bei Leasing selten der Fall ist.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 4 - Option 3: Leasingübernahme (The Best Solution) */}
        <section id="option3" className="py-16 px-4 bg-white scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="bg-primary/5 rounded-2xl shadow-lg border-2 border-primary p-8 md:p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full -mr-16 -mt-16 z-0"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-primary text-white p-2 rounded-lg">
                    <BadgeCheck className="w-8 h-8" />
                  </div>
                  <h2 className="text-3xl font-bold text-neutral-900">
                    Option 3: Leasingübernahme – Die beste Lösung zum Leasing abgeben
                  </h2>
                </div>

                <p className="text-lg text-neutral-700 leading-relaxed mb-8">
                  Die effektivste und finanziell sinnvollste Methode, ein <Link href="/leasinguebernahme" className="text-primary hover:underline font-semibold">Leasing in der Schweiz</Link> abzugeben, ist die <Link href="/leasinguebernahme" className="text-primary hover:underline font-semibold">Leasingübernahme</Link>. Dabei übernimmt eine neue Person deinen bestehenden Vertrag mit allen Pflichten – legal, schnell und ohne hohe Zusatzkosten.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <h3 className="font-bold text-xl text-neutral-900 mb-4 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Vorteile:
                    </h3>
                    <ul className="space-y-3">
                      {[
                        "Schneller & unkomplizierter Ausstieg",
                        "Keine teuren Strafzahlungen",
                        "Kein Fahrzeugverkauf nötig",
                        "Der Übernehmer profitiert von attraktiven Konditionen"
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-neutral-700">
                          <Check className="w-4 h-4 text-green-600 mt-1 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-bold text-xl text-neutral-900 mb-4 flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-blue-600" />
                      Unterstützte Anbieter:
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "AMAG Leasing", "Cembra", "MultiLease", "Santander", "BANQUE PSA", "AXA", "Emil Frey Leasing"
                      ].map((bank, i) => (
                        <span key={i} className="bg-white text-neutral-700 px-3 py-1 rounded-full text-sm font-medium border border-neutral-200">
                          {bank}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 border-t border-neutral-200">
                  <Button
                    asChild
                    className="bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl px-8 py-6 h-auto text-lg w-full sm:w-auto"
                  >
                    <Link href="/leasinguebernahme">
                      Ablauf der Leasingübernahme
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="border-2 border-primary text-primary hover:bg-primary hover:text-white font-semibold rounded-xl px-8 py-6 h-auto text-lg w-full sm:w-auto"
                  >
                    <Link href="/inserat-erstellen">
                      Jetzt Inserat erstellen
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5 - Kosten beim Leasing abgeben */}
        <section id="kosten" className="py-16 px-4 bg-neutral-50 scroll-mt-20">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <DollarSign className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Kosten beim Leasing abgeben
              </h2>
            </div>
            
            <p className="text-lg text-neutral-600 mb-8">
              Je nach Methode entstehen unterschiedliche Kosten:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Option 1 Card */}
              <Card className="border-red-100 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <XCircle className="w-6 h-6 text-red-500" />
                    <h3 className="font-bold text-lg text-neutral-900">Kündigung</h3>
                  </div>
                  <div className="text-sm font-medium text-red-600 mb-4 bg-red-50 inline-block px-2 py-1 rounded">Hohe Kosten</div>
                  <ul className="space-y-3">
                    <li className="text-neutral-600 flex gap-2"><span className="text-red-400">•</span> Restschuld</li>
                    <li className="text-neutral-600 flex gap-2"><span className="text-red-400">•</span> Vorfälligkeitsgebühr</li>
                    <li className="text-neutral-600 flex gap-2"><span className="text-red-400">•</span> Rücknahmekosten</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Option 2 Card */}
              <Card className="border-orange-100 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-6 h-6 text-orange-500" />
                    <h3 className="font-bold text-lg text-neutral-900">Auto verkaufen</h3>
                  </div>
                  <div className="text-sm font-medium text-orange-600 mb-4 bg-orange-50 inline-block px-2 py-1 rounded">Unsicher</div>
                  <ul className="space-y-3">
                    <li className="text-neutral-600 flex gap-2"><span className="text-orange-400">•</span> Wertverlust</li>
                    <li className="text-neutral-600 flex gap-2"><span className="text-orange-400">•</span> Verzögerte Abwicklung</li>
                    <li className="text-neutral-600 flex gap-2"><span className="text-orange-400">•</span> Risiko offener Restbeträge</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Option 3 Card - Highlighted */}
              <Card className="border-green-200 shadow-md ring-1 ring-green-100 bg-green-50/30">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <h3 className="font-bold text-lg text-neutral-900">Leasingübernahme</h3>
                  </div>
                  <div className="text-sm font-medium text-green-700 mb-4 bg-green-100 inline-block px-2 py-1 rounded">Optimal & Günstig</div>
                  <ul className="space-y-3">
                    <li className="text-neutral-700 flex gap-2"><span className="text-green-500">•</span> Übernahmegebühr (CHF 150–500)</li>
                    <li className="text-neutral-700 flex gap-2"><span className="text-green-500">•</span> Bonitätsprüfung (kostenlos)</li>
                    <li className="text-neutral-700 flex gap-2"><span className="text-green-500">•</span> Kleine Ummeldegebühren</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="mt-8 text-center">
              <p className="text-neutral-500 italic">
                Mehr Details findest du auf unserer Seite{" "}
                <Link href="/leasinguebernahme-kosten" className="text-primary hover:underline font-semibold">
                  Leasingübernahme Kosten
                </Link>.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 6 - Ablauf: So gibst du dein Leasing korrekt ab */}
        <section id="ablauf" className="py-16 px-4 bg-white scroll-mt-20">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <ChevronRight className="w-8 h-8 text-primary" />
                <h2 className="text-3xl font-bold text-neutral-900">
                  Ablauf: So gibst du dein Leasing korrekt ab
                </h2>
              </div>
            </div>

            {/* Timeline Design */}
            <div className="relative">
              {/* Vertical Line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-primary/20 hidden md:block"></div>
              
              <div className="space-y-8">
                {[
                  {
                    step: 1,
                    title: "Vertragsdetails prüfen",
                    desc: "Prüfe Restwert, Laufzeit und aktuellen Kilometerstand in deinem Vertrag.",
                    icon: FileText
                  },
                  {
                    step: 2,
                    title: "Möglichkeit klären",
                    desc: "Kontaktiere deinen Leasinggeber und frage nach den Konditionen für eine Leasingübernahme.",
                    icon: Phone
                  },
                  {
                    step: 3,
                    title: "Übernehmer finden",
                    desc: "Erstelle ein Inserat auf BuyAuto.ch, um schnell einen geeigneten Nachfolger zu finden.",
                    icon: Search
                  },
                  {
                    step: 4,
                    title: "Bonitätsprüfung",
                    desc: "Der potenzielle Übernehmer muss von der Leasingbank geprüft werden.",
                    icon: ShieldCheck
                  },
                  {
                    step: 5,
                    title: "Umschreibung & Übergabe",
                    desc: "Nach Genehmigung wird der Vertrag umgeschrieben und du übergibst das Fahrzeug.",
                    icon: CheckCircle
                  }
                ].map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <div key={item.step} className="relative flex gap-6 md:gap-8">
                      {/* Step Number Circle */}
                      <div className="flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary text-white flex flex-col items-center justify-center font-bold border-4 border-white shadow-lg z-10">
                        <span className="text-2xl">{item.step}</span>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl p-6 md:p-8 hover:border-primary transition-colors">
                        <div className="flex items-start gap-3 mb-3">
                          <IconComponent className="w-6 h-6 text-primary mt-1" />
                          <h3 className="text-xl md:text-2xl font-bold text-neutral-900">{item.title}</h3>
                        </div>
                        <p className="text-neutral-700">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-12 text-center">
                <Button
                  asChild
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-white shadow-lg transition-all rounded-xl px-8 py-6 h-auto text-lg"
                >
                  <Link href="/leasinguebernahme">
                    Detaillierter Ablauf der Leasingübernahme
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 7 - FAQ */}
        <section id="faq" className="py-16 px-4 bg-neutral-50 scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-neutral-900 mb-3">
                FAQ – Leasing abgeben Schweiz
              </h2>
              <p className="text-neutral-600 text-lg">
                Häufige Fragen und Antworten
              </p>
            </div>
            
            <Accordion type="single" collapsible className="w-full space-y-4">
              {[
                {
                  q: "Kann ich mein Leasing einfach zurückgeben?",
                  a: "Nein, ein Leasingvertrag ist bindend. Eine vorzeitige Rückgabe ist meist mit sehr hohen Kosten (Vorfälligkeitsentschädigung) verbunden. Die <a href='/leasinguebernahme' class='text-primary hover:underline'>Leasingübernahme</a> ist oft die einzige kostengünstige Alternative."
                },
                {
                  q: "Wie schnell kann ich mein Leasing abgeben?",
                  a: "Das hängt davon ab, wie schnell du einen Übernehmer findest. Mit einem attraktiven Inserat auf BuyAuto oft in wenigen Wochen. Die bankseitige Abwicklung dauert dann meist nur wenige Tage."
                },
                {
                  q: "Was passiert, wenn ich nicht mehr zahlen kann?",
                  a: "Kontaktiere sofort deine Leasingbank. Eine <a href='/leasinguebernahme' class='text-primary hover:underline'>Leasingübernahme</a> kann helfen, aus den Zahlungsverpflichtungen herauszukommen, bevor Schulden entstehen."
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
                  className="bg-white rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-primary transition-colors"
                >
                  <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                    <div dangerouslySetInnerHTML={{ __html: faq.a }} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* SECTION 8 - FINAL CTA */}
        <section className="py-20 bg-neutral-900 px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Fazit: Die Leasingübernahme ist die beste Lösung für die meisten Fahrer in der Schweiz
            </h2>
            <p className="text-neutral-300 max-w-2xl mx-auto text-lg leading-relaxed">
              Wenn du dein Leasing abgeben möchtest, ist die Leasingübernahme der schnellste, fairste und günstigste Weg. Gib dein Leasing legal & stressfrei ab – oft in nur wenigen Tagen.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <Button asChild size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-semibold bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/30 transition-all">
                <Link href="/leasinguebernahme">
                  Mehr zur Leasingübernahme
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg font-semibold border-2 border-white text-white hover:bg-white hover:text-neutral-900 rounded-xl bg-transparent transition-all">
                <Link href="/inserat-erstellen">
                  Jetzt Inserat erstellen
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
            
            {/* Additional Internal Links */}
            <div className="pt-8 border-t border-neutral-700">
              <p className="text-neutral-400 text-sm mb-4">Weitere hilfreiche Ressourcen:</p>
              <div className="flex flex-wrap items-center justify-center gap-6">
                <Link 
                  href="/leasinguebernahme" 
                  className="text-neutral-300 hover:text-white transition-colors text-sm font-medium inline-flex items-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  Leasingübernahme
                </Link>
                <Link 
                  href="/leasinguebernahme-kosten" 
                  className="text-neutral-300 hover:text-white transition-colors text-sm font-medium inline-flex items-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  Kosten im Detail
                </Link>
                <Link 
                  href="/leasing-transfer" 
                  className="text-neutral-300 hover:text-white transition-colors text-sm font-medium inline-flex items-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  Leasing Transfer
                </Link>
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