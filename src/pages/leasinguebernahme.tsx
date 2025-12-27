import Head from "next/head";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Check, ChevronRight, AlertTriangle, FileText, Info, ShieldCheck, TrendingDown, Clock, Zap, Users, BadgeCheck, MapPin, Calendar, DollarSign, FileCheck, Search, ArrowRight, RefreshCw, UserCheck, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Image from "next/image";

// Dynamically import heavy interactive components that are below the fold
const SearchForm = dynamic(() => import("@/components/buyauto/SearchForm"), {
  loading: () => <div className="h-96 bg-white rounded-2xl border-2 border-neutral-100 animate-pulse" />
});

const PremiumListings = dynamic(() => import("@/components/buyauto/PremiumListings"), {
  loading: () => <div className="h-96 bg-neutral-50 animate-pulse" />
});

export default function LeasingUebernahmePage() {
  return (
    <>
      <Head>
        <title>Leasingübernahme & Leasing Transfer Schweiz – Kompletter Leitfaden | BuyAuto</title>
        <meta
          name="description"
          content="Erfahre, wie du einen bestehenden Leasingvertrag übernehmen oder übertragen kannst – inklusive Ablauf, Voraussetzungen, Kosten und praxisnahen Tipps für Käufer und Abgeber."
        />
        <link rel="canonical" href="https://www.buyauto.ch/leasinguebernahme" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Leasingübernahme & Leasing Transfer Schweiz – Kompletter Leitfaden" />
        <meta property="og:description" content="Erfahre, wie du einen bestehenden Leasingvertrag übernehmen oder übertragen kannst – inklusive Ablauf, Voraussetzungen, Kosten und praxisnahen Tipps." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://www.buyauto.ch/leasinguebernahme" />
      </Head>

      <main className="bg-neutral-50 min-h-screen">
        
        {/* HERO SECTION - With Image Background */}
        <section className="relative min-h-[500px] md:min-h-[550px] flex items-center overflow-hidden pt-16">
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=2400&q=80"
              alt="Leasingübernahme & Leasing Transfer Schweiz"
              fill
              className="object-cover"
              priority
              quality={75}
              sizes="100vw"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/70 via-neutral-900/60 to-neutral-900/80" />
            <div className="absolute inset-0 bg-gradient-to-r from-red-900/20 via-transparent to-neutral-900/30" />
          </div>

          {/* Geometric Accents */}
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 left-1/5 w-64 h-64 bg-red-400/5 rounded-full blur-2xl" />

          {/* Hero Content */}
          <div className="relative z-10 w-full px-4 py-16 md:py-20">
            <div className="max-w-5xl mx-auto">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 bg-red-600 text-white px-5 py-2 rounded-full text-sm font-semibold mb-6">
                  <TrendingDown className="w-4 h-4" />
                  Kompletter Leitfaden
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight mb-6">
                  Leasingübernahme & Leasing Transfer in der Schweiz
                </h1>
                <p className="text-xl md:text-2xl text-red-400 font-semibold mb-4">
                  Der komplette Leitfaden zur Vertragsübertragung
                </p>
                <p className="text-lg text-neutral-200 leading-relaxed mb-8 max-w-2xl">
                  Erfahre, wie du einen bestehenden Leasingvertrag übernehmen oder übertragen kannst – inklusive Ablauf, Voraussetzungen, Kosten und praxisnahen Tipps für Käufer und Abgeber.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    asChild
                    size="lg"
                    className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30 transition-all duration-300 px-8 py-6 text-base font-semibold rounded-xl"
                  >
                    <Link href="/suche">
                      Jetzt Leasingübernahme starten
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
                      Leasingvertrag übertragen
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* DEFINITION SECTION - What is Leasingübernahme */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <FileCheck className="w-8 h-8 text-red-600" />
                  <h2 className="text-3xl font-bold text-neutral-900">
                    Was bedeutet eine Leasingübernahme?
                  </h2>
                </div>
                <div className="bg-red-50 border-l-4 border-red-600 p-6 rounded-r-xl mb-6">
                  <p className="text-lg text-neutral-700 leading-relaxed mb-4">
                    Eine <strong>Leasingübernahme</strong> bedeutet, dass eine Person oder Firma einen bestehenden Leasingvertrag vollständig übernimmt – inklusive monatlicher Raten, Kilometerlimit, Restlaufzeit und Pflichten.
                  </p>
                  <p className="text-lg text-neutral-700 leading-relaxed">
                    Der ursprüngliche Leasingnehmer wird aus dem Vertrag entlassen und der neue Vertragspartner tritt ein.
                  </p>
                </div>

                <h3 className="text-2xl font-bold text-neutral-900 mb-4">
                  Typische Gründe für eine Übernahme:
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { icon: DollarSign, text: "Günstigere Monatsrate dank bereits geleisteter Anzahlung" },
                    { icon: Calendar, text: "Kürzere Restlaufzeit statt langem Neuvertrag" },
                    { icon: Zap, text: "Attraktive Leasingbedingungen ohne hohe Einstiegskosten" },
                    { icon: Check, text: "Sofort verfügbare Fahrzeuge" }
                  ].map((item, i) => {
                    const IconComponent = item.icon;
                    return (
                      <div key={i} className="flex items-start gap-3 bg-white border border-neutral-200 p-4 rounded-lg hover:border-red-600 transition-colors">
                        <div className="mt-0.5">
                          <IconComponent className="w-5 h-5 text-red-600" />
                        </div>
                        <span className="text-neutral-700 font-medium">{item.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* LEASING TRANSFER DEFINITION */}
        <section className="py-16 px-4 bg-neutral-50">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <RefreshCw className="w-8 h-8 text-red-600" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Was bedeutet Leasing Transfer? (Und ist es das Gleiche?)
              </h2>
            </div>
            
            <div className="bg-white border-2 border-red-600 rounded-xl p-8">
              <div className="text-center mb-6">
                <p className="text-2xl font-bold text-red-600 mb-2">Ja – Leasing Transfer und Leasingübernahme bedeuten das Gleiche.</p>
              </div>
              
              <div className="space-y-4 max-w-2xl mx-auto">
                <div className="flex items-start gap-4 p-4 bg-neutral-50 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600 shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-neutral-900 mb-1">„Leasingübernahme"</p>
                    <p className="text-neutral-600">ist der übliche Verbrauchsbegriff.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 bg-neutral-50 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600 shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-neutral-900 mb-1">„Leasing Transfer"</p>
                    <p className="text-neutral-600">ist der formale/englische Begriff und wird oft von Banken, Garagen und Plattformen verwendet.</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-lg text-blue-900 font-medium text-center">
                  Beide Begriffe beschreiben: <strong>Die Übertragung eines bestehenden Leasingvertrags auf eine neue Person.</strong>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* DIFFERENCE SECTION */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Leasingübernahme vs. Leasing Transfer – gibt es Unterschiede?
              </h2>
            </div>
            
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-8">
              <div className="text-center mb-8">
                <p className="text-3xl font-bold text-neutral-900 mb-2">Nein.</p>
                <p className="text-xl text-neutral-600">Es handelt sich um denselben Prozess.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                <div className="bg-white p-6 rounded-xl border-2 border-red-600">
                  <div className="flex items-center gap-3 mb-3">
                    <Users className="w-6 h-6 text-red-600" />
                    <h3 className="font-bold text-neutral-900 text-lg">Übernahme</h3>
                  </div>
                  <p className="text-neutral-600">
                    Bei einer <strong>Übernahme</strong> liegt der Fokus auf dem neuen Fahrer, der das Auto übernimmt.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-xl border-2 border-red-600">
                  <div className="flex items-center gap-3 mb-3">
                    <RefreshCw className="w-6 h-6 text-red-600" />
                    <h3 className="font-bold text-neutral-900 text-lg">Transfer</h3>
                  </div>
                  <p className="text-neutral-600">
                    Beim <strong>Transfer</strong> liegt der Fokus auf dem Abgeber, der den Vertrag weitergeben möchte.
                  </p>
                </div>
              </div>

              <div className="mt-8 text-center">
                <p className="text-lg text-neutral-700 font-medium">
                  Damit deckt diese Seite beide Zielgruppen ab:
                </p>
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                  <div className="bg-red-600 text-white px-6 py-3 rounded-xl font-semibold">
                    Käufer (Übernehmer)
                  </div>
                  <div className="bg-red-600 text-white px-6 py-3 rounded-xl font-semibold">
                    Verkäufer (Abgeber)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SEARCH SECTION */}
        <section id="search-section" className="py-16 px-4 bg-neutral-50">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border-2 border-red-600 p-6 md:p-10">
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-3">
                  Angebote Entdecken
                </h2>
                <p className="text-neutral-600 text-base md:text-lg">
                  Finde jetzt verfügbare Leasingübernahmen oder erstelle dein eigenes Inserat.
                </p>
              </div>
              <SearchForm />
            </div>
          </div>
        </section>

        {/* PROCESS TIMELINE */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <ChevronRight className="w-8 h-8 text-red-600" />
                <h2 className="text-3xl font-bold text-neutral-900">
                  Ablauf: So funktioniert die Leasingübernahme / der Leasing Transfer
                </h2>
              </div>
              <p className="text-lg text-neutral-600">
                Schritt für Schritt zur erfolgreichen Vertragsübertragung
              </p>
            </div>

            {/* Timeline Design */}
            <div className="relative">
              {/* Vertical Line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-red-200 hidden md:block"></div>
              
              <div className="space-y-8">
                {[
                  {
                    step: 1,
                    title: "Vertragsprüfung",
                    desc: "Vor der Übertragung sollten folgende Punkte geprüft werden:",
                    items: [
                      "Laufzeit & Restmonate",
                      "Monatliche Rate",
                      "Anzahlung / Vorauszahlung",
                      "Kilometerlimit",
                      "Mehrkilometerkosten",
                      "Servicepakete",
                      "Versicherungsauflagen"
                    ],
                    icon: FileCheck
                  },
                  {
                    step: 2,
                    title: "Übernehmer finden",
                    desc: "Inserat erstellen oder Interessenten kontaktieren. Gute Fotos und transparente Informationen beschleunigen die Übernahme.",
                    items: [],
                    icon: Search
                  },
                  {
                    step: 3,
                    title: "Bonitätsprüfung durch die Leasingbank",
                    desc: "Der neue Vertragspartner muss kreditwürdig sein.",
                    items: [
                      "Einkommen & Budget",
                      "ZEK-Einträge",
                      "Finanzielle Stabilität"
                    ],
                    icon: ShieldCheck
                  },
                  {
                    step: 4,
                    title: "Bankgenehmigung & Vertragsübertragung",
                    desc: "Die Leasingbank erstellt neue Unterlagen. Der Vertrag bleibt identisch – lediglich der Name ändert sich.",
                    items: [],
                    icon: BadgeCheck
                  },
                  {
                    step: 5,
                    title: "Fahrzeug- & Dokumentenübergabe",
                    desc: "Empfohlen:",
                    items: [
                      "Übergabeprotokoll",
                      "Kilometerstand notieren",
                      "Schäden dokumentieren",
                      "Servicehefte bereitstellen"
                    ],
                    icon: Check
                  }
                ].map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <div key={item.step} className="relative flex gap-6 md:gap-8">
                      {/* Step Number Circle */}
                      <div className="flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-full bg-red-600 text-white flex flex-col items-center justify-center font-bold border-4 border-white shadow-lg z-10">
                        <span className="text-2xl">{item.step}</span>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl p-6 md:p-8">
                        <div className="flex items-start gap-3 mb-3">
                          <IconComponent className="w-6 h-6 text-red-600 mt-1" />
                          <h3 className="text-xl md:text-2xl font-bold text-neutral-900">{item.title}</h3>
                        </div>
                        <p className="text-neutral-700 mb-4">{item.desc}</p>
                        
                        {item.items.length > 0 && (
                          <ul className="space-y-2 ml-4">
                            {item.items.map((listItem, i) => (
                              <li key={i} className="flex items-start gap-2 text-neutral-600">
                                <span className="text-red-600 mt-1">•</span>
                                <span>{listItem}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* PREREQUISITES CHECKLIST */}
        <section className="py-16 px-4 bg-neutral-50">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <BadgeCheck className="w-8 h-8 text-red-600" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Voraussetzungen für eine Leasingübernahme / einen Leasing Transfer
              </h2>
            </div>
            
            <div className="bg-white border-2 border-red-600 rounded-xl p-8">
              <div className="space-y-4">
                {[
                  { text: "Zustimmung der Leasingbank", icon: ShieldCheck },
                  { text: "Positive Bonität des Übernehmers", icon: CheckCircle },
                  { text: "Keine offenen Rechnungen des Abgebers", icon: DollarSign },
                  { text: "Fahrzeug in ordentlichem Zustand", icon: Check },
                  { text: "Vertrag erlaubt die Übertragung", icon: FileText },
                  { text: "Beide Parteien unterzeichnen die Übertragung", icon: Users }
                ].map((item, i) => {
                  const IconComponent = item.icon;
                  return (
                    <div key={i} className="flex items-start gap-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 rounded border-2 border-red-600 flex items-center justify-center">
                          <Check className="w-4 h-4 text-red-600" />
                        </div>
                      </div>
                      <div className="flex-1 flex items-center gap-3">
                        <IconComponent className="w-5 h-5 text-red-600" />
                        <p className="text-neutral-900 font-medium text-lg">{item.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* COSTS TABLE */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <DollarSign className="w-8 h-8 text-red-600" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Kosten der Leasingübernahme & des Leasing Transfers
              </h2>
            </div>
            
            <p className="text-lg text-neutral-600 mb-8">
              Dies ist ein zentraler Punkt für alle, die eine Vertragsübertragung planen:
            </p>
            
            <div className="overflow-x-auto rounded-xl border-2 border-red-600 shadow-lg">
              <table className="w-full bg-white text-left">
                <thead className="bg-red-600 text-white">
                  <tr>
                    <th className="p-4 md:p-6 font-bold text-base md:text-lg">Kostenart</th>
                    <th className="p-4 md:p-6 font-bold text-base md:text-lg">Typische Kosten</th>
                    <th className="p-4 md:p-6 font-bold text-base md:text-lg">Wird bezahlt von</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  <tr className="hover:bg-red-50 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Übernahme-/Transfergebühr</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">100–400 CHF</td>
                    <td className="p-4 md:p-6 text-neutral-700">Abgeber oder Übernehmer</td>
                  </tr>
                  <tr className="hover:bg-red-50 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Händler-/Wechselgebühr</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">100–250 CHF</td>
                    <td className="p-4 md:p-6 text-neutral-700">Optional</td>
                  </tr>
                  <tr className="hover:bg-red-50 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Ummeldung / Fahrzeugausweis</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">50–150 CHF</td>
                    <td className="p-4 md:p-6 text-neutral-700">Übernehmer</td>
                  </tr>
                  <tr className="hover:bg-red-50 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Versicherungskosten</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">variabel</td>
                    <td className="p-4 md:p-6 text-neutral-700">Übernehmer</td>
                  </tr>
                  <tr className="hover:bg-red-50 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Administrationskosten</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">je nach Bank</td>
                    <td className="p-4 md:p-6 text-neutral-700">Abgeber oder Übernehmer</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <Info className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-green-900 font-semibold mb-1">Hinweis</p>
                  <p className="text-green-800">
                    Viele Abgeber übernehmen die Gebühren, um den Transfer attraktiver zu machen.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ADVANTAGES SECTION */}
        <section className="py-16 px-4 bg-neutral-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-neutral-900 mb-3">
                Vorteile der Leasingübernahme & des Leasing Transfers
              </h2>
              <p className="text-lg text-neutral-600">
                Warum sich die Vertragsübertragung für beide Seiten lohnt
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Advantages for Buyers */}
              <div className="bg-white p-8 rounded-3xl shadow-lg border border-neutral-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-red-50 p-3 rounded-xl">
                    <Users className="w-7 h-7 text-red-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-900">
                    Vorteile für Übernehmer (Käufer)
                  </h3>
                </div>
                <ul className="space-y-4">
                  {[
                    "Oft tiefere Monatsraten dank hoher Anzahlung des Vorbesitzers",
                    "Keine Startkosten oder geringe Einstiegskosten",
                    "Sofort verfügbare Fahrzeuge",
                    "Kürzere Restlaufzeit → geringeres Risiko",
                    "Leasingbedingungen bleiben bestehen"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-neutral-700">
                      <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                      <span className="font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Advantages for Sellers */}
              <div className="bg-white p-8 rounded-3xl shadow-lg border border-neutral-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-red-50 p-3 rounded-xl">
                    <RefreshCw className="w-7 h-7 text-red-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-900">
                    Vorteile für Abgeber (Verkäufer)
                  </h3>
                </div>
                <ul className="space-y-4">
                  {[
                    "Vertrag schnell und günstig loswerden",
                    "Keine hohen Ausstiegskosten",
                    "Entlastung bei geänderter Lebenssituation",
                    "Vertragsübertragung meist in wenigen Tagen möglich"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-neutral-700">
                      <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                      <span className="font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* LEGAL NOTES */}
        <section className="py-16 px-4 bg-neutral-900 text-white">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <ShieldCheck className="w-8 h-8 text-red-500" />
              <h2 className="text-3xl font-bold">
                Rechtliche Hinweise
              </h2>
            </div>
            
            <div className="space-y-6">
              <Card className="bg-neutral-800 border-neutral-700">
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {[
                      {
                        title: "Eigentumsverhältnisse",
                        text: "Eigentümer bleibt immer die Leasingbank.",
                        icon: ShieldCheck
                      },
                      {
                        title: "Anzahlung",
                        text: "Die Anzahlung wird nicht rückerstattet.",
                        icon: DollarSign
                      },
                      {
                        title: "Vertragskonditionen",
                        text: "Der Vertrag bleibt unverändert.",
                        icon: FileText
                      },
                      {
                        title: "Bankentscheidung",
                        text: "Die Bank kann Transfers ablehnen.",
                        icon: XCircle
                      },
                      {
                        title: "Übergabeprotokoll",
                        text: "Ein Übergabeprotokoll wird dringend empfohlen.",
                        icon: FileCheck
                      }
                    ].map((item, i) => {
                      const IconComponent = item.icon;
                      return (
                        <div key={i} className="flex items-start gap-4 pb-6 border-b border-neutral-700 last:border-0 last:pb-0">
                          <div className="mt-1">
                            <IconComponent className="w-6 h-6 text-red-500" />
                          </div>
                          <div>
                            <h3 className="font-bold text-white text-lg mb-1">{item.title}</h3>
                            <p className="text-neutral-300">{item.text}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-neutral-900 mb-3">
                FAQ – Häufige Fragen zur Leasingübernahme & zum Leasing Transfer
              </h2>
              <p className="text-neutral-600 text-lg">
                Die wichtigsten Antworten auf einen Blick
              </p>
            </div>
            
            <Accordion type="single" collapsible className="w-full space-y-4">
              <AccordionItem 
                value="item-1" 
                className="bg-neutral-50 rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-red-600 transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Gibt es einen Unterschied zwischen Leasingübernahme und Leasing Transfer?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Nein. Beide Begriffe beschreiben denselben Vorgang der Vertragsübertragung.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem 
                value="item-2" 
                className="bg-neutral-50 rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-red-600 transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Wie lange dauert der Prozess?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Meist 2–5 Werktage, abhängig von der Bonitätsprüfung.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem 
                value="item-3" 
                className="bg-neutral-50 rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-red-600 transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Wer übernimmt die Gebühren?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Das wird frei vereinbart. Oft übernimmt der Abgeber die Transferkosten, um den Transfer attraktiver zu machen.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem 
                value="item-4" 
                className="bg-neutral-50 rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-red-600 transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Kann ich ein Leasingauto verkaufen?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Nein. Du bist nicht Eigentümer. Aber du kannst den Vertrag übertragen – genau darum geht es beim Leasing Transfer.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="item-5" 
                className="bg-neutral-50 rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-red-600 transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Was passiert mit der Anzahlung?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Sie bleibt im Vertrag und kommt dem Übernehmer zugute. Die Anzahlung wird nicht ausbezahlt oder zurückerstattet.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="item-6" 
                className="bg-neutral-50 rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-red-600 transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Kann eine Leasingübernahme abgelehnt werden?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Ja – meistens wegen fehlender Bonität oder offener Zahlungen. Die Leasingbank hat immer das letzte Wort.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-20 bg-neutral-900 px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Starte jetzt deine Leasingübernahme oder übertrage deinen Leasingvertrag
            </h2>
            <p className="text-neutral-300 max-w-2xl mx-auto text-lg leading-relaxed">
              Kostenloses Inserat erstellen, Übernehmer finden oder Angebote entdecken – schnell, transparent und unkompliziert.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <Button asChild size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg shadow-red-600/30 transition-all">
                <Link href="/suche">
                  <Search className="w-5 h-5 mr-2" />
                  Angebote durchsuchen
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg font-semibold border-2 border-white text-white hover:bg-white hover:text-neutral-900 rounded-xl bg-transparent transition-all">
                <Link href="/inserat-erstellen">
                  Jetzt starten
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
            
            {/* Additional Internal Links */}
            <div className="pt-8 border-t border-neutral-700">
              <p className="text-neutral-400 text-sm mb-4">Weitere hilfreiche Ressourcen:</p>
              <div className="flex flex-wrap items-center justify-center gap-6">
                <Link 
                  href="/leasing-abgeben-schweiz" 
                  className="text-neutral-300 hover:text-white transition-colors text-sm font-medium inline-flex items-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  Leasing abgeben
                </Link>
                <Link 
                  href="/leasing-transfer" 
                  className="text-neutral-300 hover:text-white transition-colors text-sm font-medium inline-flex items-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  Leasing Transfer Details
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