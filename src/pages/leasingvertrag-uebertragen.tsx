import Head from "next/head";
import Link from "next/link";
import dynamic from "next/dynamic";
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
  XCircle 
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

export default function LeasingvertragUebertragenPage() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <Head>
        <title>Leasingvertrag übertragen Schweiz – So funktioniert die Vertragsübertragung | BuyAuto</title>
        <meta
          name="description"
          content="Leasingvertrag übertragen in der Schweiz: Alles zu Voraussetzungen, Ablauf, Kosten und rechtlichen Aspekten der Vertragsübertragung."
        />
        <link rel="canonical" href="https://www.buyauto.ch/leasingvertrag-uebertragen" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: "Leasingvertrag übertragen in der Schweiz",
              author: { "@type": "Person", name: "Vincent Hänggi" },
              publisher: {
                "@type": "Organization",
                name: "BuyAuto",
                logo: { "@type": "ImageObject", url: "https://www.buyauto.ch/share-logo.jpg" },
              },
              dateModified: "2026-06-08",
              mainEntityOfPage: "https://www.buyauto.ch/leasingvertrag-uebertragen",
            }),
          }}
        />
        
        {/* Open Graph */}
        <meta property="og:title" content="Leasingvertrag übertragen Schweiz – So funktioniert die Vertragsübertragung" />
        <meta property="og:description" content="Leasingvertrag übertragen: Alle Infos zu Voraussetzungen, Ablauf und Kosten." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://www.buyauto.ch/leasingvertrag-uebertragen" />
      </Head>

      <main className="bg-neutral-50 min-h-screen">
        
        {/* HERO SECTION */}
        <section className="relative min-h-[500px] md:min-h-[550px] flex items-center overflow-hidden pt-16">
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=2400&q=80"
              alt="Leasingvertrag übertragen"
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
            <div className="max-w-5xl mx-auto">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-full text-sm font-semibold mb-6">
                  <FileCheck className="w-4 h-4" />
                  Kompletter Ratgeber
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight mb-6">
                  Leasingvertrag übertragen in der Schweiz
                </h1>
                <p className="text-xl md:text-2xl text-primary-foreground font-semibold mb-4">
                  Ihr Leitfaden zur erfolgreichen Vertragsübertragung
                </p>
                <p className="text-lg text-neutral-200 leading-relaxed mb-8 max-w-2xl">
                  Alles Wichtige zur Übertragung Ihres Leasingvertrags: Ablauf, Voraussetzungen, Kosten und rechtliche Hinweise.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    asChild
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30 transition-all duration-300 px-8 py-6 text-base font-semibold rounded-xl"
                  >
                    <Link href="/suche">
                      Jetzt Vertrag übertragen
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
        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <Info className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Kurz gesagt: Leasingvertrag übertragen
              </h2>
            </div>
            
            <div className="bg-primary/5 border-l-4 border-primary p-8 rounded-r-xl shadow-sm">
              <p className="text-lg text-neutral-700 leading-relaxed mb-4">
                Die Übertragung eines <strong>Leasingvertrags</strong> bedeutet, dass Sie Ihre laufende Leasing-Verpflichtung an eine andere Person weitergeben. Der neue Vertragspartner übernimmt alle Rechte und Pflichten aus dem bestehenden Vertrag.
              </p>
              <p className="text-lg text-neutral-700 leading-relaxed">
                Dieser Prozess wird auch als <strong>Leasingübernahme</strong> oder <strong>Leasing Transfer</strong> bezeichnet.
              </p>
              
              <div className="mt-6 pt-6 border-t border-primary/20">
                <p className="text-primary font-medium flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  <strong>Wichtig:</strong> Die Übertragung benötigt die Zustimmung der Leasingbank.
                </p>
              </div>
              
              <div className="mt-4">
                <Link href="/leasinguebernahme" className="inline-flex items-center gap-2 text-primary font-semibold hover:underline">
                  <ArrowRight className="w-4 h-4" />
                  Leasingübernahme im Detail
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* TOC SECTION */}
        <section className="py-10 px-4 bg-neutral-50">
          <div className="max-w-4xl mx-auto">
            <h3 className="font-bold text-neutral-900 mb-6 text-xl text-center">Inhaltsverzeichnis</h3>
            <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8">
                {[
                  { id: "was-bedeutet", label: "Was bedeutet Vertrag übertragen?" },
                  { id: "voraussetzungen", label: "Voraussetzungen" },
                  { id: "search", label: "Angebote entdecken" },
                  { id: "ablauf", label: "Ablauf Schritt für Schritt" },
                  { id: "kosten", label: "Kosten im Überblick" },
                  { id: "vorteile", label: "Vorteile für beide Seiten" },
                  { id: "rechtliches", label: "Rechtliche Hinweise" },
                  { id: "tipps", label: "Praktische Tipps" },
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

        {/* DEFINITION SECTION */}
        <section id="was-bedeutet" className="py-16 px-4 bg-white scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <FileCheck className="w-8 h-8 text-primary" />
                  <h2 className="text-3xl font-bold text-neutral-900">
                    Was bedeutet „Leasingvertrag übertragen"?
                  </h2>
                </div>

                <Card className="border-2 border-primary/20 mb-8">
                  <CardContent className="p-8">
                    <p className="text-lg text-neutral-700 leading-relaxed mb-4">
                      Wenn Sie Ihren <strong>Leasingvertrag übertragen</strong>, geben Sie alle Rechte und Pflichten aus dem Vertrag an eine andere Person weiter. Diese übernimmt:
                    </p>
                    <ul className="space-y-3 ml-4">
                      {[
                        "Die monatlichen Leasingraten",
                        "Das Fahrzeug inklusive aller Bedingungen",
                        "Die verbleibende Vertragslaufzeit",
                        "Das vereinbarte Kilometerlimit",
                        "Eventuelle Service-Pakete"
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-neutral-700">
                          <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <span className="font-medium">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <h3 className="text-2xl font-bold text-neutral-900 mb-4">
                  Typische Gründe für eine Vertragsübertragung:
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { icon: DollarSign, text: "Finanzielle Entlastung" },
                    { icon: RefreshCw, text: "Wechsel zu einem anderen Fahrzeug" },
                    { icon: MapPin, text: "Umzug ins Ausland" },
                    { icon: TrendingDown, text: "Geänderte Lebenssituation" }
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
              </div>
            </div>
          </div>
        </section>

        {/* PREREQUISITES CHECKLIST */}
        <section id="voraussetzungen" className="py-16 px-4 bg-neutral-50 scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <BadgeCheck className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Voraussetzungen für die Vertragsübertragung
              </h2>
            </div>
            
            <div className="bg-white border-2 border-primary rounded-xl p-8">
              <div className="space-y-4">
                {[
                  { text: "Zustimmung der Leasingbank erforderlich", icon: ShieldCheck },
                  { text: "Positive Bonität des neuen Vertragspartners", icon: CheckCircle },
                  { text: "Keine offenen Zahlungen des bisherigen Leasingnehmers", icon: DollarSign },
                  { text: "Fahrzeug in vertragsgemäßem Zustand", icon: Check },
                  { text: "Leasingvertrag erlaubt die Übertragung", icon: FileText },
                  { text: "Beide Parteien einverstanden", icon: Users }
                ].map((item, i) => {
                  const IconComponent = item.icon;
                  return (
                    <div key={i} className="flex items-start gap-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 rounded border-2 border-primary flex items-center justify-center">
                          <Check className="w-4 h-4 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1 flex items-center gap-3">
                        <IconComponent className="w-5 h-5 text-primary" />
                        <p className="text-neutral-900 font-medium text-lg">{item.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* SEARCH SECTION */}
        <section id="search" className="py-16 px-4 bg-white scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border-2 border-primary p-6 md:p-10">
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-3">
                  Angebote Entdecken
                </h2>
                <p className="text-neutral-600 text-base md:text-lg">
                  Finde verfügbare Leasingverträge oder erstelle dein eigenes Inserat.
                </p>
              </div>
              <SearchForm />
            </div>
          </div>
        </section>

        {/* PROCESS TIMELINE */}
        <section id="ablauf" className="py-16 px-4 bg-neutral-50 scroll-mt-20">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <ChevronRight className="w-8 h-8 text-primary" />
                <h2 className="text-3xl font-bold text-neutral-900">
                  Ablauf: So übertragen Sie Ihren Leasingvertrag
                </h2>
              </div>
              <p className="text-lg text-neutral-600">
                Schritt für Schritt zur erfolgreichen Übertragung
              </p>
            </div>

            {/* Timeline Design */}
            <div className="relative">
              {/* Vertical Line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-primary/20 hidden md:block"></div>
              
              <div className="space-y-8">
                {[
                  {
                    step: 1,
                    title: "Vertragsprüfung",
                    desc: "Prüfen Sie zunächst die Details Ihres Leasingvertrags:",
                    items: [
                      "Restlaufzeit",
                      "Monatliche Rate",
                      "Kilometerlimit",
                      "Geleistete Anzahlung",
                      "Übertragungsklausel im Vertrag"
                    ],
                    icon: FileCheck
                  },
                  {
                    step: 2,
                    title: "Neuen Vertragspartner finden",
                    desc: "Erstellen Sie ein Inserat oder kontaktieren Sie Interessenten. Je transparenter Ihre Angaben, desto schneller die Übertragung.",
                    items: [],
                    icon: Search
                  },
                  {
                    step: 3,
                    title: "Kontakt zur Leasingbank",
                    desc: "Informieren Sie Ihre Leasingbank über die geplante Übertragung. Die Bank wird:",
                    items: [
                      "Die Bonität des neuen Vertragspartners prüfen",
                      "Erforderliche Dokumente anfordern",
                      "Die Übertragung genehmigen oder ablehnen"
                    ],
                    icon: ShieldCheck
                  },
                  {
                    step: 4,
                    title: "Vertragsübertragung",
                    desc: "Nach Genehmigung durch die Bank werden neue Vertragsunterlagen erstellt. Der Vertrag bleibt inhaltlich gleich.",
                    items: [],
                    icon: BadgeCheck
                  },
                  {
                    step: 5,
                    title: "Fahrzeugübergabe",
                    desc: "Wichtige Schritte bei der Übergabe:",
                    items: [
                      "Übergabeprotokoll erstellen",
                      "Kilometerstand dokumentieren",
                      "Schäden festhalten",
                      "Servicehefte & Dokumente übergeben"
                    ],
                    icon: Check
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
                      <div className="flex-1 bg-white border border-neutral-200 rounded-xl p-6 md:p-8">
                        <div className="flex items-start gap-3 mb-3">
                          <IconComponent className="w-6 h-6 text-primary mt-1" />
                          <h3 className="text-xl md:text-2xl font-bold text-neutral-900">{item.title}</h3>
                        </div>
                        <p className="text-neutral-700 mb-4">{item.desc}</p>
                        
                        {item.items.length > 0 && (
                          <ul className="space-y-2 ml-4">
                            {item.items.map((listItem, i) => (
                              <li key={i} className="flex items-start gap-2 text-neutral-600">
                                <span className="text-primary mt-1">•</span>
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

        {/* COSTS TABLE */}
        <section id="kosten" className="py-16 px-4 bg-white scroll-mt-20">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <DollarSign className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Kosten der Vertragsübertragung
              </h2>
            </div>
            
            <p className="text-lg text-neutral-600 mb-8">
              Die Kosten variieren je nach Leasingbank und Vereinbarung:
            </p>
            
            <div className="overflow-x-auto rounded-xl border-2 border-primary shadow-lg">
              <table className="w-full bg-white text-left">
                <thead className="bg-primary text-white">
                  <tr>
                    <th className="p-4 md:p-6 font-bold text-base md:text-lg">Kostenart</th>
                    <th className="p-4 md:p-6 font-bold text-base md:text-lg">Typische Kosten</th>
                    <th className="p-4 md:p-6 font-bold text-base md:text-lg">Zahlt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  <tr className="hover:bg-primary/5 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Übertragungsgebühr</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">100–400 CHF</td>
                    <td className="p-4 md:p-6 text-neutral-700">Verhandelbar</td>
                  </tr>
                  <tr className="hover:bg-primary/5 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Administrationskosten</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">50–200 CHF</td>
                    <td className="p-4 md:p-6 text-neutral-700">Meist Abgeber</td>
                  </tr>
                  <tr className="hover:bg-primary/5 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Fahrzeugausweis / Ummeldung</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">50–150 CHF</td>
                    <td className="p-4 md:p-6 text-neutral-700">Übernehmer</td>
                  </tr>
                  <tr className="hover:bg-primary/5 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Versicherung</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">variabel</td>
                    <td className="p-4 md:p-6 text-neutral-700">Übernehmer</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <Info className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-green-900 font-semibold mb-1">Tipp</p>
                  <p className="text-green-800">
                    Viele Abgeber übernehmen die Übertragungsgebühren, um den Vertrag schneller loszuwerden.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ADVANTAGES SECTION */}
        <section id="vorteile" className="py-16 px-4 bg-neutral-50 scroll-mt-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-neutral-900 mb-3">
                Vorteile der Vertragsübertragung
              </h2>
              <p className="text-lg text-neutral-600">
                Win-Win-Situation für beide Parteien
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Advantages for Buyers */}
              <div className="bg-white p-8 rounded-3xl shadow-lg border border-neutral-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-primary/10 p-3 rounded-xl">
                    <Users className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-900">
                    Für Übernehmer
                  </h3>
                </div>
                <ul className="space-y-4">
                  {[
                    "Oft günstigere Raten dank hoher Anzahlung",
                    "Keine oder geringe Einstiegskosten",
                    "Sofortige Verfügbarkeit",
                    "Kürzere Restlaufzeit",
                    "Bestehende Konditionen bleiben"
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
                  <div className="bg-primary/10 p-3 rounded-xl">
                    <RefreshCw className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-900">
                    Für Abgeber
                  </h3>
                </div>
                <ul className="space-y-4">
                  {[
                    "Vertrag schnell loswerden",
                    "Keine hohen Ausstiegskosten",
                    "Finanzielle Entlastung",
                    "Schnelle Abwicklung möglich"
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
        <section id="rechtliches" className="py-16 px-4 bg-neutral-900 text-white scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <ShieldCheck className="w-8 h-8 text-primary" />
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
                        text: "Das Fahrzeug bleibt Eigentum der Leasingbank.",
                        icon: ShieldCheck
                      },
                      {
                        title: "Anzahlung",
                        text: "Geleistete Anzahlungen werden nicht rückerstattet.",
                        icon: DollarSign
                      },
                      {
                        title: "Vertragskonditionen",
                        text: "Alle Bedingungen bleiben unverändert.",
                        icon: FileText
                      },
                      {
                        title: "Bankgenehmigung",
                        text: "Die Bank kann die Übertragung ablehnen.",
                        icon: XCircle
                      },
                      {
                        title: "Haftung",
                        text: "Der neue Vertragspartner haftet für alle Verpflichtungen.",
                        icon: AlertTriangle
                      }
                    ].map((item, i) => {
                      const IconComponent = item.icon;
                      return (
                        <div key={i} className="flex items-start gap-4 pb-6 border-b border-neutral-700 last:border-0 last:pb-0">
                          <div className="mt-1">
                            <IconComponent className="w-6 h-6 text-primary" />
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

        {/* PRACTICAL TIPS */}
        <section id="tipps" className="py-16 px-4 bg-white scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <Zap className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Praktische Tipps für eine erfolgreiche Übertragung
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  title: "Transparente Kommunikation",
                  desc: "Seien Sie ehrlich über Zustand und Konditionen",
                  icon: Users
                },
                {
                  title: "Dokumentation",
                  desc: "Erstellen Sie ein detailliertes Übergabeprotokoll",
                  icon: FileCheck
                },
                {
                  title: "Zeitplanung",
                  desc: "Rechnen Sie mit 1-2 Wochen Bearbeitungszeit",
                  icon: Clock
                },
                {
                  title: "Vertragscheck",
                  desc: "Prüfen Sie alle Vertragsbedingungen genau",
                  icon: ShieldCheck
                }
              ].map((item, i) => {
                const IconComponent = item.icon;
                return (
                  <div key={i} className="bg-neutral-50 border border-neutral-200 rounded-xl p-6 hover:border-primary transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="bg-primary/10 p-3 rounded-lg">
                        <IconComponent className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-neutral-900 mb-2">{item.title}</h3>
                        <p className="text-neutral-600">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section id="faq" className="py-16 px-4 bg-neutral-50 scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-neutral-900 mb-3">
                FAQ – Häufige Fragen
              </h2>
              <p className="text-neutral-600 text-lg">
                Antworten auf die wichtigsten Fragen
              </p>
            </div>
            
            <Accordion type="single" collapsible className="w-full space-y-4">
              <AccordionItem 
                value="item-1" 
                className="bg-white rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-primary transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Wie lange dauert die Vertragsübertragung?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  In der Regel 5–10 Werktage, abhängig von der Bonitätsprüfung und der Bearbeitungszeit der Bank.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem 
                value="item-2" 
                className="bg-white rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-primary transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Wer zahlt die Übertragungsgebühren?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Das wird zwischen den Parteien frei vereinbart. Oft übernimmt der Abgeber die Kosten, um die Übertragung attraktiver zu machen.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem 
                value="item-3" 
                className="bg-white rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-primary transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Kann die Bank die Übertragung ablehnen?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Ja, die Leasingbank prüft die Bonität des neuen Vertragspartners und kann die Übertragung bei negativer Bonität ablehnen.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem 
                value="item-4" 
                className="bg-white rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-primary transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Was passiert mit der Anzahlung?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Die Anzahlung bleibt im Vertrag und wird nicht rückerstattet. Der neue Vertragspartner profitiert von den dadurch oft günstigeren Monatsraten.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="item-5" 
                className="bg-white rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-primary transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Muss ich das Fahrzeug vor der Übergabe prüfen lassen?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Es ist ratsam, ein Übergabeprotokoll zu erstellen und den Zustand des Fahrzeugs zu dokumentieren. So vermeiden Sie spätere Streitigkeiten.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="item-6" 
                className="bg-white rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-primary transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Ändert sich die Versicherung bei der Übertragung?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Der neue Vertragspartner muss eine eigene Versicherung abschließen. Die Konditionen können sich je nach Fahrerprofil ändern.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-20 bg-neutral-900 px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Bereit für die Vertragsübertragung?
            </h2>
            <p className="text-neutral-300 max-w-2xl mx-auto text-lg leading-relaxed">
              Erstellen Sie jetzt ein kostenloses Inserat oder entdecken Sie verfügbare Angebote.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <Button asChild size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-semibold bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/30 transition-all">
                <Link href="/suche">
                  <Search className="w-5 h-5 mr-2" />
                  Angebote durchsuchen
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg font-semibold border-2 border-white text-white hover:bg-white hover:text-neutral-900 rounded-xl bg-transparent transition-all">
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