import Head from "next/head";
import Link from "next/link";
import { Check, ChevronRight, AlertTriangle, FileText, Info, ShieldCheck, TrendingDown, Clock, Zap, Users, BadgeCheck, MapPin, Calendar, DollarSign, FileCheck, Search, ArrowRight, RefreshCw, UserCheck } from "lucide-react";
import SearchForm from "@/components/buyauto/SearchForm";
import PremiumListings from "@/components/buyauto/PremiumListings";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function LeasingTransferPage() {
  return (
    <>
      <Head>
        <title>Leasing Transfer Schweiz – So funktioniert die Übertragung eines Leasingvertrags | BuyAuto</title>
        <meta
          name="description"
          content="Alles zum Leasing Transfer in der Schweiz: Ablauf, Voraussetzungen, Kosten und wie du deinen Leasingvertrag schnell und einfach übertragen kannst mit BuyAuto"
        />
        <link rel="canonical" href="https://www.buyauto.ch/leasing-transfer" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Leasing Transfer Schweiz – So funktioniert die Übertragung eines Leasingvertrags" />
        <meta property="og:description" content="Erfahre, wie du einen bestehenden Leasingvertrag auf eine andere Person übertragen kannst. Einfach erklärt, transparent und mit klaren Schritten." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://www.buyauto.ch/leasing-transfer" />
      </Head>

      <main className="bg-neutral-50 min-h-screen">
        
        {/* SECTION 1 — HERO (Text + Image Split) */}
        <section className="bg-gradient-to-br from-white via-neutral-50 to-red-50/30 pt-12 pb-8 md:pt-20 md:pb-12 px-4 overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Text Content */}
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-semibold">
                  <RefreshCw className="w-4 h-4" />
                  Schnell & unkompliziert
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-900 tracking-tight leading-tight">
                  Leasing Transfer in der Schweiz
                </h1>
                <p className="text-xl md:text-2xl text-red-600 font-semibold">
                  Ablauf, Voraussetzungen & Kosten erklärt
                </p>
                <p className="text-lg text-neutral-600 leading-relaxed">
                  Erfahre, wie du einen bestehenden Leasingvertrag auf eine andere Person übertragen kannst. Einfach erklärt, transparent und mit klaren Schritten für Verkäufer und Übernehmer.
                </p>
                
                {/* Quick Stats */}
                <div className="flex flex-wrap gap-6 pt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Clock className="w-5 h-5 text-green-700" />
                    </div>
                    <div>
                      <div className="text-sm text-neutral-500">Dauer</div>
                      <div className="font-bold text-neutral-900">2-5 Tage</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-blue-700" />
                    </div>
                    <div>
                      <div className="text-sm text-neutral-500">Gebühren</div>
                      <div className="font-bold text-neutral-900">CHF 100-400</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <UserCheck className="w-5 h-5 text-purple-700" />
                    </div>
                    <div>
                      <div className="text-sm text-neutral-500">Prozess</div>
                      <div className="font-bold text-neutral-900">Einfach</div>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <div className="pt-6">
                  <Button
                    asChild
                    size="lg"
                    className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 transition-all duration-300 px-8 py-6 text-lg font-semibold rounded-xl group"
                  >
                    <Link href="/inserat-erstellen">
                      <Zap className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                      Jetzt Leasing Transfer starten
                      <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
              </div>
              
              {/* Image */}
              <div className="relative lg:block">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                  <img 
                    src="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80" 
                    alt="Leasing Transfer Schweiz - Vertragsübertragung" 
                    className="w-full h-[400px] lg:h-[500px] object-cover"
                  />
                  {/* Overlay Badge */}
                  <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-neutral-500 mb-1">Übertragung in</div>
                        <div className="text-2xl font-bold text-neutral-900">2-5 Tagen</div>
                      </div>
                      <div className="bg-green-500 text-white px-4 py-2 rounded-full font-semibold text-sm flex items-center gap-2">
                        <BadgeCheck className="w-4 h-4" />
                        Einfach
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Floating Elements */}
                <div className="hidden lg:block absolute -top-4 -right-4 bg-red-600 text-white px-6 py-3 rounded-2xl shadow-lg rotate-3 font-bold">
                  Schnell & sicher
                </div>
                <div className="hidden lg:block absolute -bottom-4 -left-4 bg-neutral-900 text-white px-6 py-3 rounded-2xl shadow-lg -rotate-3 font-bold">
                  Bank-geprüft
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2 — WAS IST EIN LEASING TRANSFER */}
        <section className="py-12 md:py-20 px-4">
          <div className="max-w-4xl mx-auto space-y-12">
            
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-neutral-900 flex items-center gap-3">
                <RefreshCw className="w-8 h-8 text-red-600" />
                Was ist ein Leasing Transfer?
              </h2>
              <div className="prose prose-lg text-neutral-700 max-w-none leading-relaxed">
                <p>
                  Ein <strong>Leasing Transfer</strong> bedeutet, dass ein bestehender Leasingvertrag von einer Person (Abgeber) auf eine andere Person (Übernehmer) übertragen wird. Der ursprüngliche Vertrag bleibt bestehen – nur der Vertragspartner ändert sich.
                </p>
                <p>
                  Dies ist eine Win-Win-Situation: Der Abgeber wird flexibel aus seinem Vertrag entlassen, und der Übernehmer profitiert von attraktiven Konditionen ohne hohe Anzahlung.
                </p>
              </div>

              {/* Typische Gründe */}
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-neutral-100">
                <h3 className="text-xl font-bold text-neutral-900 mb-6">Typische Gründe für einen Leasing Transfer:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { icon: MapPin, text: "Umzug ins Ausland" },
                    { icon: Users, text: "Familienzuwachs" },
                    { icon: FileText, text: "Firmenwagen wird nicht mehr benötigt" },
                    { icon: DollarSign, text: "Finanzielle Entlastung" },
                    { icon: RefreshCw, text: "Wunsch nach Fahrzeugwechsel" },
                    { icon: TrendingDown, text: "Reduzierung der monatlichen Kosten" }
                  ].map((item, i) => {
                    const IconComponent = item.icon;
                    return (
                      <div key={i} className="flex items-center gap-3 text-neutral-700 bg-neutral-50 p-4 rounded-xl">
                        <IconComponent className="w-5 h-5 text-red-600 shrink-0" />
                        <span className="font-medium">{item.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                <div className="flex items-start gap-4">
                  <Info className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-blue-900 font-medium mb-2">
                      Mehr zur Perspektive des Übernehmers?
                    </p>
                    <Link 
                      href="/leasinguebernahme" 
                      className="text-blue-700 hover:text-blue-800 font-semibold underline inline-flex items-center gap-2 transition-colors"
                    >
                      Mehr zur Leasingübernahme erfahren
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* ABLAUF SECTION */}
            <div className="space-y-8">
              <h2 className="text-3xl font-bold text-neutral-900 flex items-center gap-3">
                <ChevronRight className="w-8 h-8 text-red-600" />
                Ablauf eines Leasing Transfers – Schritt für Schritt
              </h2>
              <div className="space-y-6 relative before:absolute before:left-4 before:top-4 before:h-full before:w-0.5 before:bg-neutral-200 before:hidden md:before:block">
                {[
                  { 
                    step: 1, 
                    title: "Vertrag prüfen", 
                    desc: "Prüfe Laufzeit, Kilometerlimit, Anzahlung, Servicepakete und Restkilometer. Stelle sicher, dass der Vertrag eine Übertragung erlaubt.",
                    icon: FileCheck
                  },
                  { 
                    step: 2, 
                    title: "Übernehmer finden", 
                    desc: "Erstelle ein Inserat auf BuyAuto oder kontaktiere interessierte Käufer direkt. Je attraktiver die Konditionen, desto schneller findest du jemanden.",
                    icon: Users
                  },
                  { 
                    step: 3, 
                    title: "Bonitätsprüfung durch die Leasingbank", 
                    desc: "Der Übernehmer muss eine positive Bonität vorweisen. Die Bank prüft Kreditwürdigkeit und finanzielle Stabilität.",
                    icon: ShieldCheck
                  },
                  { 
                    step: 4, 
                    title: "Vertragsübertragung", 
                    desc: "Die Bank erstellt die neuen Vertragsunterlagen. Der Vertrag bleibt inhaltlich identisch – nur der Name des Vertragspartners ändert sich.",
                    icon: FileText
                  },
                  { 
                    step: 5, 
                    title: "Fahrzeugübergabe", 
                    desc: "Dokumentiere den Fahrzeugzustand genau, halte den Kilometerstand fest und übergebe alle Schlüssel und Dokumente.",
                    icon: BadgeCheck
                  }
                ].map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <div key={item.step} className="relative flex flex-col md:flex-row gap-6 md:items-start bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 z-10">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-red-200">
                        {item.step}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <IconComponent className="w-5 h-5 text-red-600" />
                          <h3 className="text-lg font-bold text-neutral-900">{item.title}</h3>
                        </div>
                        <p className="text-neutral-600">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="text-center pt-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/30 transition-all duration-300 px-8 py-6 text-base font-semibold rounded-xl group"
                >
                  <Link href="/inserat-erstellen">
                    Jetzt Leasing Transfer durchführen
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* VORAUSSETZUNGEN SECTION */}
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-neutral-900 flex items-center gap-3">
                <BadgeCheck className="w-8 h-8 text-red-600" />
                Voraussetzungen für einen Leasing Transfer
              </h2>
              <p className="text-neutral-700 text-lg">
                Damit ein Leasing Transfer erfolgreich durchgeführt werden kann, müssen folgende Voraussetzungen erfüllt sein:
              </p>
              <Card className="bg-gradient-to-br from-neutral-50 to-white border border-neutral-200 shadow-sm">
                <CardContent className="p-8">
                  <ul className="space-y-4">
                    {[
                      { text: "Positive Bonität des neuen Übernehmers", icon: ShieldCheck },
                      { text: "Zustimmung der Leasinggesellschaft", icon: FileCheck },
                      { text: "Keine offenen Zahlungen oder Mahnungen", icon: AlertTriangle },
                      { text: "Fahrzeug in ordentlichem Zustand", icon: Check },
                      { text: "Vertrag erlaubt explizit eine Übertragung (bei fast allen Schweizer Leasingbanken möglich)", icon: FileText }
                    ].map((req, i) => {
                      const IconComponent = req.icon;
                      return (
                        <li key={i} className="flex items-start gap-4 text-neutral-700 bg-white p-4 rounded-xl border border-neutral-100">
                          <div className="mt-0.5 bg-green-50 p-2 rounded-full shrink-0">
                            <IconComponent className="w-5 h-5 text-green-600" />
                          </div>
                          <span className="font-medium pt-1">{req.text}</span>
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* KOSTEN SECTION */}
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-neutral-900 flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-red-600" />
                Kosten beim Leasing Transfer
              </h2>
              <p className="text-neutral-700 text-lg">
                Je nach Leasinggesellschaft fallen folgende Kosten an:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { 
                    title: "Übernahme-/Verwaltungsgebühr", 
                    cost: "CHF 100–400", 
                    desc: "Gebühr der Leasingbank für die Vertragsübertragung",
                    icon: FileText
                  },
                  { 
                    title: "Wechselgebühr beim Händler", 
                    cost: "CHF 100–250", 
                    desc: "Falls der Händler involviert ist",
                    icon: ShieldCheck
                  },
                  { 
                    title: "Kantonsabhängige Ummeldekosten", 
                    cost: "CHF 50–150", 
                    desc: "Für die Ummeldung des Fahrzeugs",
                    icon: MapPin
                  }
                ].map((item, i) => {
                  const IconComponent = item.icon;
                  return (
                    <Card key={i} className="bg-white border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-6 space-y-4">
                        <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center">
                          <IconComponent className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-neutral-900 mb-1">{item.title}</h3>
                          <p className="text-2xl font-bold text-red-600 mb-2">{item.cost}</p>
                          <p className="text-sm text-neutral-600">{item.desc}</p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
                <div className="flex items-start gap-4">
                  <div className="bg-white p-2 rounded-full shadow-sm shrink-0">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-green-900 font-semibold mb-1">Kostenübernahme flexibel vereinbar</p>
                    <p className="text-green-800">
                      In vielen Fällen übernimmt der Abgeber die Gebühren, um den Transfer zu erleichtern. Dies kann frei zwischen den Parteien vereinbart werden.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                <div className="flex items-start gap-4">
                  <Info className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-blue-900 font-medium mb-2">
                      Interessiert an den Gesamtkosten einer Leasingübernahme?
                    </p>
                    <Link 
                      href="/leasinguebernahme" 
                      className="text-blue-700 hover:text-blue-800 font-semibold underline inline-flex items-center gap-2 transition-colors"
                    >
                      Mehr zu Kosten der Leasingübernahme
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* VORTEILE SECTION */}
            <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 text-white p-10 rounded-3xl shadow-xl">
              <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-red-500" />
                Vorteile eines Leasing Transfers
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Für Abgeber */}
                <div>
                  <h3 className="text-neutral-400 text-sm uppercase tracking-wider font-semibold mb-6">Für Abgeber (Verkäufer)</h3>
                  <ul className="space-y-4">
                    {[
                      "Schnell einen Leasingvertrag abgeben",
                      "Keine teuren Ausstiegskosten",
                      "Flexibler Ausstieg bei Lebensveränderungen",
                      "Kein Wertverlust durch vorzeitige Rückgabe",
                      "Einfacher Prozess über BuyAuto"
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-neutral-200">
                        <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Für Übernehmer */}
                <div>
                  <h3 className="text-neutral-400 text-sm uppercase tracking-wider font-semibold mb-6">Für Übernehmer (Käufer)</h3>
                  <ul className="space-y-4">
                    {[
                      "Profitieren von tieferen Monatsraten",
                      "Dank ursprünglicher Anzahlung bessere Konditionen",
                      "Kürzere Restlaufzeit als bei neuen Leasingverträgen",
                      "Keine hohe Anzahlung erforderlich",
                      "Fahrzeugzustand bereits bekannt"
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-neutral-200">
                        <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-neutral-700">
                <p className="text-neutral-300 text-lg text-center font-medium">
                  Flexiblere Optionen für beide Seiten – eine echte Win-Win-Situation
                </p>
              </div>
            </div>

            {/* SEARCH BAR */}
            <div id="search-section" className="py-8 -mx-4 px-4 bg-neutral-50/80 md:bg-transparent md:p-0 md:mx-0">
              <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 md:p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>
                <div className="text-center mb-8 relative z-10">
                  <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                    Verfügbare Leasing-Angebote
                  </h2>
                  <p className="text-neutral-600 text-sm md:text-base">
                    Finde jetzt passende Leasingübernahmen oder erstelle dein eigenes Inserat.
                  </p>
                </div>
                <div className="relative z-10">
                  <SearchForm />
                </div>
              </div>
            </div>

            {/* FAQ SECTION */}
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-neutral-900 mb-3">
                  Häufige Fragen zum <span className="text-red-600">Leasing Transfer</span>
                </h2>
                <p className="text-neutral-600">Die wichtigsten Antworten auf einen Blick</p>
              </div>
              
              <Accordion type="single" collapsible className="w-full space-y-4">
                <AccordionItem 
                  value="item-1" 
                  className="bg-gradient-to-r from-neutral-50/80 to-white rounded-3xl border border-neutral-200/40 shadow-sm hover:shadow-md transition-all duration-300 px-6 md:px-8 hover:border-neutral-300/60"
                >
                  <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 hover:text-red-600 transition-colors duration-200 text-base md:text-lg">
                    Kann jeder einen Leasingvertrag übertragen?
                  </AccordionTrigger>
                  <AccordionContent className="text-neutral-600 leading-relaxed pb-6 font-light">
                    Ja, sofern die Leasingbank zustimmt und der neue Übernehmer kreditwürdig ist. Die Bank prüft die Bonität des Übernehmers, um sicherzustellen, dass die monatlichen Raten bezahlt werden können.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem 
                  value="item-2" 
                  className="bg-gradient-to-r from-neutral-50/80 to-white rounded-3xl border border-neutral-200/40 shadow-sm hover:shadow-md transition-all duration-300 px-6 md:px-8 hover:border-neutral-300/60"
                >
                  <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 hover:text-red-600 transition-colors duration-200 text-base md:text-lg">
                    Was passiert mit der Anzahlung?
                  </AccordionTrigger>
                  <AccordionContent className="text-neutral-600 leading-relaxed pb-6 font-light">
                    Die ursprüngliche Anzahlung bleibt Bestandteil des Vertrags und kommt dem Übernehmer zugute. Dadurch sind die monatlichen Raten oft deutlich attraktiver als bei einem Neu-Leasing. Der Abgeber erhält die Anzahlung nicht zurück.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem 
                  value="item-3" 
                  className="bg-gradient-to-r from-neutral-50/80 to-white rounded-3xl border border-neutral-200/40 shadow-sm hover:shadow-md transition-all duration-300 px-6 md:px-8 hover:border-neutral-300/60"
                >
                  <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 hover:text-red-600 transition-colors duration-200 text-base md:text-lg">
                    Wie lange dauert der Leasing Transfer?
                  </AccordionTrigger>
                  <AccordionContent className="text-neutral-600 leading-relaxed pb-6 font-light">
                    Meist 2–5 Werktage, abhängig von der Bonitätsprüfung durch die Leasingbank. In Ausnahmefällen kann es auch bis zu 2 Wochen dauern, wenn zusätzliche Unterlagen benötigt werden.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem 
                  value="item-4" 
                  className="bg-gradient-to-r from-neutral-50/80 to-white rounded-3xl border border-neutral-200/40 shadow-sm hover:shadow-md transition-all duration-300 px-6 md:px-8 hover:border-neutral-300/60"
                >
                  <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 hover:text-red-600 transition-colors duration-200 text-base md:text-lg">
                    Wer übernimmt die Gebühren beim Leasing Transfer?
                  </AccordionTrigger>
                  <AccordionContent className="text-neutral-600 leading-relaxed pb-6 font-light">
                    Das kann frei zwischen Abgeber und Übernehmer vereinbart werden. In der Praxis übernehmen viele Abgeber die Gebühren, um den Transfer attraktiver zu gestalten und schneller einen Übernehmer zu finden. Dies ist jedoch keine Pflicht.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem 
                  value="item-5" 
                  className="bg-gradient-to-r from-neutral-50/80 to-white rounded-3xl border border-neutral-200/40 shadow-sm hover:shadow-md transition-all duration-300 px-6 md:px-8 hover:border-neutral-300/60"
                >
                  <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 hover:text-red-600 transition-colors duration-200 text-base md:text-lg">
                    Was ist der Unterschied zwischen Leasing Transfer und Leasingübernahme?
                  </AccordionTrigger>
                  <AccordionContent className="text-neutral-600 leading-relaxed pb-6 font-light">
                    Es ist derselbe Prozess, nur aus unterschiedlicher Perspektive betrachtet. <strong>Leasing Transfer</strong> beschreibt den Vorgang aus Sicht des Abgebers (Verkäufers), während <strong>Leasingübernahme</strong> die Perspektive des Übernehmers (Käufers) darstellt. Beide Begriffe bezeichnen die Übertragung eines bestehenden Leasingvertrags.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

          </div>
        </section>

        {/* ABSCHLUSS CTA */}
        <section className="py-20 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Leasing Transfer schnell und einfach durchführen
            </h2>
            <p className="text-neutral-300 max-w-2xl mx-auto text-lg leading-relaxed">
              Erstelle jetzt kostenlos dein Inserat oder finde passende Leasingübernahmen in der Schweiz. BuyAuto macht den Transfer transparent und sicher.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <Button asChild size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-semibold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/30 rounded-xl transition-all hover:shadow-xl hover:shadow-red-900/40">
                <Link href="/inserat-erstellen">
                  <Zap className="w-5 h-5 mr-2" />
                  Inserat erstellen
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg font-semibold border-neutral-600 text-white hover:bg-white hover:text-neutral-900 rounded-xl bg-transparent hover:border-white transition-all">
                <Link href="/suche">
                  <Search className="w-5 h-5 mr-2" />
                  Fahrzeuge durchsuchen
                </Link>
              </Button>
            </div>
            
            {/* Additional Links */}
            <div className="pt-8 border-t border-neutral-700">
              <p className="text-neutral-400 text-sm mb-4">Weitere hilfreiche Ressourcen:</p>
              <div className="flex flex-wrap items-center justify-center gap-6">
                <Link 
                  href="/leasinguebernahme" 
                  className="text-neutral-300 hover:text-white transition-colors text-sm font-medium inline-flex items-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  Leasingübernahme verstehen
                </Link>
                <Link 
                  href="/leasing-abgeben-schweiz" 
                  className="text-neutral-300 hover:text-white transition-colors text-sm font-medium inline-flex items-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  Leasing abgeben
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