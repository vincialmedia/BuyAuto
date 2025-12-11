import Head from "next/head";
import Link from "next/link";
import { 
  Check, 
  ChevronRight, 
  AlertTriangle, 
  FileText, 
  Info, 
  ShieldCheck, 
  TrendingDown, 
  Zap, 
  Users, 
  BadgeCheck, 
  Calendar, 
  DollarSign, 
  FileCheck, 
  Search, 
  ArrowRight, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  AlertCircle
} from "lucide-react";
import SearchForm from "@/components/buyauto/SearchForm";
import PremiumListings from "@/components/buyauto/PremiumListings";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function LeasingVertragUebertragenPage() {
  return (
    <>
      <Head>
        <title>Leasingvertrag übertragen in der Schweiz – Ablauf, Kosten & Voraussetzungen (2025)</title>
        <meta
          name="description"
          content="So überträgst du deinen Leasingvertrag in der Schweiz: Ablauf, Kosten, Voraussetzungen, Bonitätsprüfung und wichtige Tipps. Erfahre, warum die Leasingübernahme oft die einfachste und günstigste Lösung ist."
        />
        <link rel="canonical" href="https://www.buyauto.ch/leasingvertrag-uebertragen" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Leasingvertrag übertragen in der Schweiz – Ablauf, Kosten & Voraussetzungen (2025)" />
        <meta property="og:description" content="So überträgst du deinen Leasingvertrag in der Schweiz: Ablauf, Kosten, Voraussetzungen, Bonitätsprüfung und wichtige Tipps." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://www.buyauto.ch/leasingvertrag-uebertragen" />
      </Head>

      <main className="bg-neutral-50 min-h-screen">
        
        {/* HERO SECTION */}
        <section className="relative min-h-[500px] md:min-h-[550px] flex items-center overflow-hidden pt-16">
          {/* Background Image */}
          <div className="absolute inset-0">
            <img 
              src="/ChatGPT_Image_Dec_11_2025_05_10_08_PM.png" 
              alt="Leasingvertrag übertragen Schweiz" 
              className="w-full h-full object-cover"
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
                  Guide 2025
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight mb-6">
                  Leasingvertrag übertragen in der Schweiz – So funktioniert die Vertragsübernahme richtig
                </h1>
                <p className="text-xl md:text-2xl text-red-400 font-semibold mb-4">
                  Der komplette Leitfaden zur Vertragsübertragung
                </p>
                <p className="text-lg text-neutral-200 leading-relaxed mb-8 max-w-2xl">
                  Du möchtest deinen bestehenden Leasingvertrag an eine andere Person übertragen? Hier erfährst du, wie eine Vertragsübernahme abläuft, welche Voraussetzungen erfüllt sein müssen und warum die Leasingübernahme für viele Fahrer die günstigste und schnellste Lösung ist.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    asChild
                    size="lg"
                    className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30 transition-all duration-300 px-8 py-6 text-base font-semibold rounded-xl"
                  >
                    <Link href="/suche">
                      Jetzt Möglichkeiten prüfen
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-2 border-white text-white hover:bg-white hover:text-neutral-900 transition-all duration-300 px-8 py-6 text-base font-semibold rounded-xl bg-transparent"
                  >
                    <Link href="/leasinguebernahme">
                      Mehr zur Leasingübernahme
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 1: DEFINITION */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <FileText className="w-8 h-8 text-red-600" />
                  <h2 className="text-3xl font-bold text-neutral-900">
                    Was bedeutet es, einen Leasingvertrag zu übertragen?
                  </h2>
                </div>
                <div className="bg-red-50 border-l-4 border-red-600 p-6 rounded-r-xl mb-6">
                  <p className="text-lg text-neutral-700 leading-relaxed mb-4">
                    Einen Leasingvertrag zu übertragen bedeutet, dass dein bestehender Leasingvertrag auf eine andere Person überschrieben wird. Das Fahrzeug, die Konditionen und die Restlaufzeit bleiben gleich – nur der Vertragspartner ändert sich.
                  </p>
                  <p className="text-lg text-neutral-700 leading-relaxed">
                    Diese Methode ist in der Schweiz sehr beliebt, weil sie <strong>schnell</strong>, <strong>legal</strong>, <strong>kostengünstig</strong> und <strong>unkompliziert</strong> ist.
                  </p>
                </div>

                <p className="text-lg text-neutral-700 leading-relaxed mb-6">
                  Viele Leasingnehmer entscheiden sich dafür, wenn sie:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {[
                    "ihr Fahrzeug nicht mehr benötigen",
                    "die Raten zu hoch werden",
                    "ihre Lebenssituation sich verändert",
                    "oder sie einfach früher aus dem Vertrag raus möchten"
                  ].map((text, i) => (
                    <div key={i} className="flex items-center gap-3 bg-white border border-neutral-200 p-4 rounded-lg">
                      <Check className="w-5 h-5 text-red-600 shrink-0" />
                      <span className="text-neutral-700 font-medium">{text}</span>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg text-center">
                  <p className="text-blue-900 text-lg">
                    Hier kommt die <Link href="/leasinguebernahme" className="text-red-600 font-semibold hover:underline">Leasingübernahme</Link> ins Spiel.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: VORAUSSETZUNGEN */}
        <section className="py-16 px-4 bg-neutral-50">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <BadgeCheck className="w-8 h-8 text-red-600" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Voraussetzungen für die Vertragsübertragung
              </h2>
            </div>
            
            <p className="text-lg text-neutral-600 mb-8">
              Damit der Leasingvertrag übertragen werden darf, müssen folgende Bedingungen erfüllt sein:
            </p>
            
            <div className="bg-white border-2 border-red-600 rounded-xl p-8">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold">1</div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-neutral-900 mb-2">Zustimmung des Leasinggebers</h3>
                    <p className="text-neutral-600">Jede Leasinggesellschaft prüft und muss die Übertragung freigeben.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold">2</div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-neutral-900 mb-2">Bonitätsprüfung des neuen Vertragspartners</h3>
                    <p className="text-neutral-600 mb-2">Der Übernehmer muss:</p>
                    <ul className="list-disc pl-5 space-y-1 text-neutral-600">
                      <li>ein regelmässiges Einkommen nachweisen</li>
                      <li>keine Betreibungen haben</li>
                      <li>eine solide Bonität besitzen</li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold">3</div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-neutral-900 mb-2">Fahrzeugzustand muss vertragskonform sein</h3>
                    <p className="text-neutral-600">Service, Reifen und Kilometerstand müssen zum Vertrag passen.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold">4</div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-neutral-900 mb-2">Alle offenen Rechnungen müssen beglichen sein</h3>
                    <p className="text-neutral-600">Keine offenen Raten, Mahnungen oder Gebühren.</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-neutral-100 text-center">
                <p className="text-neutral-600">
                  Erfülle diese Punkte, um erfolgreich dein <Link href="/leasinguebernahme" className="text-red-600 font-medium hover:underline">Leasing übernehmen</Link> zu lassen.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: ABLAUF */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <ChevronRight className="w-8 h-8 text-red-600" />
                <h2 className="text-3xl font-bold text-neutral-900">
                  Ablauf: Wie überträgt man einen Leasingvertrag?
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
                    title: "Vertrag prüfen",
                    desc: "Restwert, Laufzeit, Kilometer, Rückgabekonditionen.",
                    icon: FileCheck
                  },
                  {
                    step: 2,
                    title: "Leasinggeber kontaktieren",
                    desc: "Viele Anbieter haben Online-Formulare.",
                    icon: Users
                  },
                  {
                    step: 3,
                    title: "Übernehmer finden",
                    desc: "Der neue Fahrer übernimmt deinen Vertrag zu denselben Konditionen.",
                    icon: Search
                  },
                  {
                    step: 4,
                    title: "Bonitätsprüfung",
                    desc: "Der Leasinggeber prüft den neuen Vertragspartner.",
                    icon: ShieldCheck
                  },
                  {
                    step: 5,
                    title: "Vertragsumschreibung",
                    desc: "Der Leasingvertrag wird offiziell übertragen.",
                    icon: FileText
                  },
                  {
                    step: 6,
                    title: "Fahrzeugübergabe",
                    desc: "Schlüssel, Papiere und Protokoll übergeben.",
                    icon: CheckCircle
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
                        <p className="text-neutral-700">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-12 text-center">
                 <Link href="/leasinguebernahme" className="text-red-600 font-semibold text-lg hover:underline inline-flex items-center">
                    Mehr zum Ablauf der Leasingübernahme <ArrowRight className="w-4 h-4 ml-2" />
                 </Link>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: KOSTEN */}
        <section className="py-16 px-4 bg-neutral-50">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <DollarSign className="w-8 h-8 text-red-600" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Welche Kosten entstehen bei einer Vertragsübertragung?
              </h2>
            </div>
            
            <p className="text-lg text-neutral-600 mb-8">
              Die Kosten für das Übertragen eines Leasingvertrags sind überschaubar. Im Vergleich zur Kündigung des Leasings ist die Vertragsübertragung oft deutlich günstiger.
            </p>
            
            <div className="overflow-x-auto rounded-xl border-2 border-red-600 shadow-lg bg-white">
              <table className="w-full text-left">
                <thead className="bg-red-600 text-white">
                  <tr>
                    <th className="p-4 md:p-6 font-bold text-base md:text-lg">Kostenpunkt</th>
                    <th className="p-4 md:p-6 font-bold text-base md:text-lg">Höhe / Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  <tr className="hover:bg-red-50 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Übertragungskosten</td>
                    <td className="p-4 md:p-6 text-neutral-700">CHF 150–500</td>
                  </tr>
                  <tr className="hover:bg-red-50 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Ummeldegebühren</td>
                    <td className="p-4 md:p-6 text-neutral-700">gering, kantonal abhängig</td>
                  </tr>
                  <tr className="hover:bg-red-50 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Bonitätsprüfung</td>
                    <td className="p-4 md:p-6 text-neutral-700">kostenlos</td>
                  </tr>
                  <tr className="hover:bg-red-50 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Service / Reifen</td>
                    <td className="p-4 md:p-6 text-neutral-700">falls im Vertrag enthalten</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* SECTION 5: COMPARISON */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <RefreshCw className="w-8 h-8 text-red-600" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Leasingvertrag übertragen vs. Leasingübernahme
              </h2>
            </div>
            
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-8">
              <div className="overflow-x-auto mb-6">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-neutral-200">
                      <th className="text-left py-3 px-4 font-bold text-neutral-900">Begriff</th>
                      <th className="text-left py-3 px-4 font-bold text-neutral-900">Bedeutung</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    <tr>
                      <td className="py-4 px-4 font-medium text-red-600">Leasingvertrag übertragen</td>
                      <td className="py-4 px-4 text-neutral-700">Der Vertrag wird offiziell auf eine andere Person überschrieben</td>
                    </tr>
                    <tr>
                      <td className="py-4 px-4 font-medium text-red-600">Leasingübernahme</td>
                      <td className="py-4 px-4 text-neutral-700">Der neue Fahrer übernimmt denselben Vertrag inkl. Konditionen & Pflichten</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-white p-6 rounded-lg border-l-4 border-red-600 shadow-sm">
                <p className="text-lg text-neutral-800 font-medium">
                  In der Praxis bedeuten beide Begriffe dasselbe: <br/>
                  <span className="text-neutral-600 font-normal">Der bestehende Vertrag wird übernommen.</span>
                </p>
                <div className="mt-4">
                  <Link href="/leasinguebernahme" className="text-red-600 hover:underline font-semibold inline-flex items-center">
                    Mehr zur Leasingübernahme Schweiz <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 6: VORTEILE */}
        <section className="py-16 px-4 bg-neutral-50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-neutral-900 mb-3">
                Vorteile der Vertragsübertragung
              </h2>
              <p className="text-lg text-neutral-600">
                Warum sich dieser Weg lohnt
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-lg border border-neutral-200 max-w-3xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-red-50 p-3 rounded-xl">
                  <Check className="w-7 h-7 text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-neutral-900">
                  Deine Vorteile auf einen Blick
                </h3>
              </div>
              <ul className="space-y-4">
                {[
                  "Schnell & unkompliziert",
                  "Geringe Kosten",
                  "Keine teuren Kündigungsstrafen",
                  "Attraktiv für den Übernehmer",
                  "Ideale Lösung bei Lebensveränderungen"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-neutral-700">
                    <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* SECTION 7: HÄUFIGE FEHLER (New Section) */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <AlertTriangle className="w-8 h-8 text-red-600" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Häufige Fehler bei der Vertragsübertragung
              </h2>
            </div>
            
            <div className="bg-red-50 border border-red-100 rounded-xl p-8">
              <p className="text-lg text-neutral-800 mb-6 font-medium">
                Viele Fahrer unterschätzen folgende Punkte:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  "Kilometerstand nicht korrekt geprüft",
                  "Fahrzeug nicht vorbereitet (Service fällig)",
                  "Übernehmer ohne Bonität",
                  "Falsche oder fehlende Dokumente",
                  "Übergabeprotokoll vergessen"
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 bg-white p-4 rounded-lg border border-red-100">
                    <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <span className="text-neutral-700">{item}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-neutral-700 font-medium">
                  Ein sauberer Prozess verhindert Streit bei der Rückgabe.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 8: FAQ */}
        <section className="py-16 px-4 bg-neutral-50">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-neutral-900 mb-3">
                FAQ: Leasingvertrag übertragen in der Schweiz
              </h2>
              <p className="text-neutral-600 text-lg">
                Die wichtigsten Fragen und Antworten
              </p>
            </div>
            
            <Accordion type="single" collapsible className="w-full space-y-4">
              <AccordionItem 
                value="item-1" 
                className="bg-white rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-red-600 transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Ist das Übertragen eines Leasingvertrags in der Schweiz legal?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Ja, absolut. Es ist ein Standardprozess bei den meisten Leasinggesellschaften. Wichtig ist die Zustimmung der Bank.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem 
                value="item-2" 
                className="bg-white rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-red-600 transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Wie lange dauert die Vertragsübertragung?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  In der Regel dauert der Prozess zwischen wenigen Tagen und zwei Wochen, abhängig von der Bearbeitungszeit der Bank und der Bonitätsprüfung.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem 
                value="item-3" 
                className="bg-white rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-red-600 transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Wer trägt die Gebühren?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Das ist Verhandlungssache. Oft übernimmt der Abgeber die Kosten, um die <Link href="/leasinguebernahme" className="text-red-600 hover:underline">Leasingübernahme</Link> attraktiver zu gestalten.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem 
                value="item-4" 
                className="bg-white rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-red-600 transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Kann jeder mein Leasing übernehmen?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Nein. Der neue Leasingnehmer muss eine positive Bonitätsprüfung durch die Leasingbank bestehen. Erfahre mehr zum Thema <Link href="/leasinguebernahme" className="text-red-600 hover:underline">Leasing übernehmen</Link>.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="item-5" 
                className="bg-white rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-red-600 transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Was passiert, wenn die Bonität abgelehnt wird?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Dann kann der Vertrag nicht an diese Person übertragen werden. Du musst einen anderen Interessenten finden.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="item-6" 
                className="bg-white rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-red-600 transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Ist Leasingübernahme dasselbe wie Leasingvertrag übertragen?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Ja. <Link href="/leasinguebernahme" className="text-red-600 hover:underline">Ablauf der Leasingübernahme</Link> und Vertragsübertragung beschreiben denselben Vorgang.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-20 bg-neutral-900 px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Bereit, deinen Leasingvertrag zu übertragen?
            </h2>
            <p className="text-neutral-300 max-w-2xl mx-auto text-lg leading-relaxed">
              Ein Leasingvertrag lässt sich in der Schweiz unkompliziert übertragen – oft in wenigen Tagen. Wenn du wissen möchtest, ob eine <Link href="/leasinguebernahme" className="text-white underline hover:text-red-400">Leasingübernahme als beste Lösung</Link> für dich in Frage kommt, findest du hier alle wichtigen Informationen.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <Button asChild size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg shadow-red-600/30 transition-all">
                <Link href="/leasinguebernahme">
                  Mehr zur Leasingübernahme
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* SEARCH FORM SECTION - Keeping consistent with layout reuse */}
        <section id="search-section" className="py-16 px-4 bg-neutral-50 border-t border-neutral-200">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border-2 border-red-600 p-6 md:p-10">
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-3">
                  Angebote Entdecken
                </h2>
                <p className="text-neutral-600 text-base md:text-lg">
                  Finde jetzt verfügbare Fahrzeuge oder inseriere dein Auto.
                </p>
              </div>
              <SearchForm />
            </div>
          </div>
        </section>

        {/* PREMIUM LISTINGS */}
        <PremiumListings />
        
      </main>
    </>
  );
}