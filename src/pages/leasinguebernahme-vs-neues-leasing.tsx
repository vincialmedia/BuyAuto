import Head from "next/head";
import Link from "next/link";
import { 
  Check, 
  ArrowRight, 
  ShieldCheck, 
  DollarSign, 
  Clock, 
  Zap, 
  TrendingDown, 
  FileCheck, 
  Search, 
  AlertCircle,
  XCircle,
  Minus,
  Info
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

export default function LeasingComparisonPage() {
  return (
    <>
      <Head>
        <title>Leasingübernahme vs. Neues Leasing – Was lohnt sich 2025 wirklich? | BuyAuto</title>
        <meta
          name="description"
          content="Leasingübernahme oder neues Leasing? Vergleich der Kosten, Vorteile, Risiken und Laufzeiten. Erfahre, welche Option 2025 in der Schweiz günstiger ist – und wann eine Leasingübernahme deutlich smarter ist."
        />
        <link rel="canonical" href="https://www.buyauto.ch/leasinguebernahme-vs-neues-leasing" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Leasingübernahme vs. Neues Leasing – Was lohnt sich 2025 wirklich?" />
        <meta property="og:description" content="Leasingübernahme oder neues Leasing? Vergleich der Kosten, Vorteile, Risiken und Laufzeiten. Erfahre, welche Option 2025 in der Schweiz günstiger ist." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://www.buyauto.ch/leasinguebernahme-vs-neues-leasing" />
      </Head>

      <main className="bg-neutral-50 min-h-screen">
        
        {/* HERO SECTION */}
        <section className="relative min-h-[500px] md:min-h-[550px] flex items-center overflow-hidden pt-16">
          {/* Background Image */}
          <div className="absolute inset-0">
            <img 
              src="/ChatGPT_Image_Dec_11_2025_05_31_14_PM.png" 
              alt="Leasingübernahme vs Neues Leasing - Vergleich zweier Autos auf der Strasse" 
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
                  Entscheidungshilfe 2025
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight mb-6">
                  Leasingübernahme vs. Neues Leasing – Die klare Entscheidungshilfe (2025)
                </h1>
                <p className="text-lg text-neutral-200 leading-relaxed mb-8 max-w-2xl">
                  Du überlegst, ob du ein neues Leasing starten oder einen bestehenden Leasingvertrag übernehmen sollst? Hier findest du den direkten Vergleich – Kosten, Risiken, Flexibilität und echte Beispiele aus der Praxis.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    asChild
                    size="lg"
                    className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30 transition-all duration-300 px-8 py-6 text-base font-semibold rounded-xl"
                  >
                    <Link href="/suche">
                      Jetzt Leasingübernahme prüfen
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
                      So funktioniert eine Leasingübernahme
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 1 - OVERVIEW */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <Search className="w-8 h-8 text-red-600" />
                  <h2 className="text-3xl font-bold text-neutral-900">
                    Überblick: Leasingübernahme oder neues Leasing?
                  </h2>
                </div>
                <div className="bg-red-50 border-l-4 border-red-600 p-6 rounded-r-xl mb-6">
                  <p className="text-lg text-neutral-700 leading-relaxed mb-4">
                    In der Schweiz stehen Autokäufer oft vor der Frage:
                  </p>
                  <p className="text-xl font-bold text-neutral-900 leading-relaxed mb-4">
                    „Soll ich ein neues Leasing abschliessen – oder ein bestehendes Leasing übernehmen?“
                  </p>
                  <p className="text-lg text-neutral-700 leading-relaxed">
                    Beide Optionen haben Vorteile, aber für viele Fahrer ist die <Link href="/leasinguebernahme" className="text-red-600 font-medium hover:underline">Leasingübernahme</Link> die deutlich günstigere und flexiblere Lösung.
                  </p>
                </div>

                <h3 className="text-2xl font-bold text-neutral-900 mb-4">
                  Warum?
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { icon: Clock, text: "Kürzere Restlaufzeit" },
                    { icon: DollarSign, text: "Keine oder viel tiefere Anzahlung" },
                    { icon: TrendingDown, text: "Bessere Monatsraten" },
                    { icon: ShieldCheck, text: "Weniger Risiko beim Restwert" },
                    { icon: Zap, text: "Schneller verfügbar" }
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
                
                <p className="mt-6 text-neutral-600">
                  Diese Seite zeigt dir alle Unterschiede – klar, objektiv und mit Zahlen.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2 - COST COMPARISON TABLE */}
        <section className="py-16 px-4 bg-neutral-50">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <DollarSign className="w-8 h-8 text-red-600" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Kostenvergleich: Leasingübernahme vs. Neues Leasing
              </h2>
            </div>
            
            <div className="overflow-x-auto rounded-xl border-2 border-red-600 shadow-lg bg-white">
              <table className="w-full text-left">
                <thead className="bg-red-600 text-white">
                  <tr>
                    <th className="p-4 md:p-6 font-bold text-base md:text-lg w-1/3">Kriterium</th>
                    <th className="p-4 md:p-6 font-bold text-base md:text-lg w-1/3">
                      <Link href="/leasinguebernahme" className="hover:underline text-white">
                        Leasingübernahme
                      </Link>
                    </th>
                    <th className="p-4 md:p-6 font-bold text-base md:text-lg w-1/3">Neues Leasing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  <tr className="hover:bg-red-50 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Monatsraten</td>
                    <td className="p-4 md:p-6 text-green-700 font-semibold">oft tiefer, da Vertrag bereits läuft</td>
                    <td className="p-4 md:p-6 text-neutral-700">höher, da neuer Vertragsbeginn</td>
                  </tr>
                  <tr className="hover:bg-red-50 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Anzahlung</td>
                    <td className="p-4 md:p-6 text-green-700 font-semibold">selten nötig</td>
                    <td className="p-4 md:p-6 text-neutral-700">oft CHF 2’000–8’000</td>
                  </tr>
                  <tr className="hover:bg-red-50 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Laufzeit</td>
                    <td className="p-4 md:p-6 text-green-700 font-semibold">kürzere Restlaufzeit</td>
                    <td className="p-4 md:p-6 text-neutral-700">komplette Laufzeit 36–48 Monate</td>
                  </tr>
                  <tr className="hover:bg-red-50 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Restwert-Risiko</td>
                    <td className="p-4 md:p-6 text-green-700 font-semibold">geringer, da kürzere Zeitspanne</td>
                    <td className="p-4 md:p-6 text-neutral-700">höher, da langer Zeithorizont</td>
                  </tr>
                  <tr className="hover:bg-red-50 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Auto sofort verfügbar</td>
                    <td className="p-4 md:p-6 text-green-700 font-semibold">ja</td>
                    <td className="p-4 md:p-6 text-neutral-700">je nach Modell lange Lieferzeiten</td>
                  </tr>
                  <tr className="hover:bg-red-50 transition-colors bg-neutral-50">
                    <td className="p-4 md:p-6 font-bold text-neutral-900">Gesamtkosten</td>
                    <td className="p-4 md:p-6 text-green-700 font-bold">meist niedriger</td>
                    <td className="p-4 md:p-6 text-red-600 font-bold">oft deutlich höher</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* SECTIONS 3 & 4 - ADVANTAGES */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Advantages Leasing Takeover */}
              <div className="bg-white p-8 rounded-3xl shadow-lg border-2 border-green-100 ring-1 ring-green-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-green-100 p-3 rounded-xl">
                    <Check className="w-7 h-7 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-900">
                    Vorteile der <Link href="/leasinguebernahme" className="text-green-700 hover:underline">Leasingübernahme</Link>
                  </h3>
                </div>
                <ul className="space-y-4">
                  {[
                    "Geringere oder keine Anzahlung",
                    "Kürzere Bindung / Restlaufzeit",
                    "Sofort verfügbare Fahrzeuge",
                    "Attraktive Konditionen vom Vorbesitzer",
                    "Oft viel günstiger über die gesamte Laufzeit",
                    "Kein Stress mit Restwertverhandlungen"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-neutral-700">
                      <div className="mt-1 bg-green-100 rounded-full p-0.5">
                        <Check className="w-4 h-4 text-green-700 shrink-0" />
                      </div>
                      <span className="font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 pt-6 border-t border-neutral-100">
                  <Link href="/leasinguebernahme" className="inline-flex items-center text-green-700 font-semibold hover:text-green-800">
                    Ablauf der Leasingübernahme
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </div>
              </div>

              {/* Advantages New Leasing */}
              <div className="bg-neutral-50 p-8 rounded-3xl border border-neutral-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-neutral-200 p-3 rounded-xl">
                    <FileCheck className="w-7 h-7 text-neutral-700" />
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-900">
                    Vorteile eines neuen Leasings
                  </h3>
                </div>
                <ul className="space-y-4 mb-8">
                  {[
                    "Du kannst das exakte Modell und die Ausstattung wählen",
                    "Alles ist neu: Garantie, Kilometer, Servicepakete",
                    "Vollständige Laufzeitplanung",
                    "Keine Gebrauchsspuren vom Vorbesitzer"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-neutral-700">
                      <div className="mt-1 bg-white rounded-full p-0.5 border border-neutral-200">
                        <Check className="w-4 h-4 text-neutral-500 shrink-0" />
                      </div>
                      <span className="font-medium">{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="bg-white p-5 rounded-xl border border-neutral-200">
                  <p className="font-bold text-neutral-900 mb-3">Aber beachte:</p>
                  <ul className="space-y-2">
                    {[
                      "höhere Gesamtkosten",
                      "längere Vertragsbindung",
                      "oft hohe Anfangszahlungen",
                      "Lieferzeiten können Monate dauern"
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-neutral-600 text-sm">
                        <Minus className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5 - FOR WHOM */}
        <section className="py-16 px-4 bg-neutral-50">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-neutral-900">
                Für wen eignet sich welche Option?
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-8 space-y-8 md:space-y-0">
              {/* Left Column */}
              <div className="bg-white p-8 rounded-2xl border-t-4 border-red-600 shadow-sm">
                <h3 className="text-xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
                  <Link href="/leasinguebernahme" className="hover:underline text-red-600">Leasingübernahme</Link> ist ideal für dich, wenn…
                </h3>
                <ul className="space-y-3">
                  {[
                    "du sofort ein Auto brauchst",
                    "du die niedrigsten Gesamtkosten willst",
                    "du keine hohe Anzahlung leisten willst",
                    "du Flexibilität statt lange Bindung suchst",
                    "du ein nahezu neues Auto zu besseren Konditionen willst"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      <span className="text-neutral-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right Column */}
              <div className="bg-white p-8 rounded-2xl border-t-4 border-neutral-400 shadow-sm">
                <h3 className="text-xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
                  Neues Leasing passt zu dir, wenn…
                </h3>
                <ul className="space-y-3">
                  {[
                    "du genau das Modell & die Ausstattung willst",
                    "dir lange Lieferzeiten egal sind",
                    "du planst, das Auto die volle Laufzeit zu fahren",
                    "du bereit bist, mehr zu bezahlen"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-neutral-400 shrink-0 mt-0.5" />
                      <span className="text-neutral-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 6 - PRAXISBEISPIEL */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <Zap className="w-8 h-8 text-red-600" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Praxisbeispiel: Kompaktwagen
              </h2>
            </div>
            
            <div className="bg-white rounded-xl border border-neutral-200 shadow-lg overflow-hidden mb-8">
              <table className="w-full text-left">
                <thead className="bg-neutral-100">
                  <tr>
                    <th className="p-4 font-bold text-neutral-900"></th>
                    <th className="p-4 font-bold text-neutral-900 text-lg">Leasingübernahme</th>
                    <th className="p-4 font-bold text-neutral-900 text-lg">Neues Leasing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  <tr>
                    <td className="p-4 font-medium text-neutral-600">Rate</td>
                    <td className="p-4 font-bold text-neutral-900">CHF 340/Monat</td>
                    <td className="p-4 text-neutral-600">CHF 480/Monat</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-neutral-600">Anzahlung</td>
                    <td className="p-4 font-bold text-green-600">CHF 0</td>
                    <td className="p-4 text-neutral-600">CHF 3’000</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-neutral-600">Restlaufzeit</td>
                    <td className="p-4 font-semibold text-neutral-900">18 Monate</td>
                    <td className="p-4 text-neutral-600">48 Monate</td>
                  </tr>
                  <tr className="bg-red-50">
                    <td className="p-4 font-bold text-red-900">Gesamtkosten</td>
                    <td className="p-4 font-bold text-red-900">ca. CHF 6’120</td>
                    <td className="p-4 font-bold text-neutral-600">ca. CHF 26’040</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-6 bg-green-50 border border-green-200 rounded-xl text-center">
              <p className="text-xl font-bold text-green-800 flex items-center justify-center gap-2">
                <ArrowRight className="w-6 h-6" />
                Leasingübernahme spart fast CHF 20’000.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 7 - RISKS */}
        <section className="py-16 px-4 bg-neutral-50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-neutral-900 mb-8 text-center">
              Risiken im Vergleich
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="border-t-4 border-t-orange-400">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <AlertCircle className="w-6 h-6 text-orange-500" />
                    <h3 className="text-xl font-bold text-neutral-900">Leasingübernahme Risiken</h3>
                  </div>
                  <ul className="space-y-4">
                    {[
                      "Bonität des Übernehmers muss passen",
                      "Fahrzeug muss vertragskonform sein",
                      "Übergabeprozess muss korrekt laufen"
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-neutral-700">
                        <span className="text-orange-500 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-t-4 border-t-red-600">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                    <h3 className="text-xl font-bold text-neutral-900">Neues Leasing Risiken</h3>
                  </div>
                  <ul className="space-y-4">
                    {[
                      "Hoher Restwert am Ende",
                      "Hohe Strafen bei zu vielen Kilometern",
                      "Teure Versicherungsbindung",
                      "Lange Laufzeiten → wenig Flexibilität"
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-neutral-700">
                        <span className="text-red-600 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* SECTION 8 - FAQ */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-neutral-900 mb-3">
                FAQ: Leasingübernahme vs. Neues Leasing
              </h2>
            </div>
            
            <Accordion type="single" collapsible className="w-full space-y-4">
              <AccordionItem 
                value="item-1" 
                className="bg-neutral-50 rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-red-600 transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Was ist günstiger: Leasingübernahme oder ein neues Leasing?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  In fast allen Fällen ist die <Link href="/leasinguebernahme" className="text-red-600 hover:underline">Leasingübernahme</Link> günstiger, da du keine hohe Anzahlung leisten musst und von der bereits geleisteten Anzahlung des Vorbesitzers profitierst. Zudem ist die Laufzeit kürzer, was das finanzielle Risiko senkt.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem 
                value="item-2" 
                className="bg-neutral-50 rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-red-600 transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Brauche ich bei einer Leasingübernahme eine Anzahlung?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Selten. Meistens wurde die Anzahlung bereits vom ersten Leasingnehmer getätigt. Wenn überhaupt, verlangt der Abgeber manchmal eine kleine Abstandszahlung, die aber oft verhandelbar ist.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem 
                value="item-3" 
                className="bg-neutral-50 rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-red-600 transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Ist die Bonität bei beiden gleich wichtig?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Ja. Egal ob du ein <Link href="/leasinguebernahme" className="text-red-600 hover:underline">Leasing übernehmen</Link> oder neu abschliessen willst – die Bank prüft in beiden Fällen deine Kreditwürdigkeit (Einkommen, Betreibungsregister, ZEK).
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem 
                value="item-4" 
                className="bg-neutral-50 rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-red-600 transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Warum sind die Monatsraten bei Übernahmen oft tiefer?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Weil der erste Leasingnehmer oft eine Anzahlung geleistet hat, die die monatlichen Raten über die gesamte Laufzeit senkt. Du profitierst als Übernehmer direkt von dieser Vorleistung. Erfahre mehr zum <Link href="/leasinguebernahme" className="text-red-600 hover:underline">Ablauf der Leasingübernahme</Link>.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="item-5" 
                className="bg-neutral-50 rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-red-600 transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Kann ich beim neuen Leasing den Restwert verhandeln?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Nur bedingt. Der Restwert wird von der Bank basierend auf Modell und Laufleistung festgelegt. Bei einer Übernahme ist der Restwert bereits fixiert – du weisst also genau, worauf du dich einlässt.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* SECTION 9 - FINAL CTA BLOCK */}
        <section className="py-20 bg-neutral-900 px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Die bessere Wahl für 2025: Leasingübernahme
            </h2>
            <p className="text-neutral-300 max-w-2xl mx-auto text-lg leading-relaxed">
              In den meisten Fällen ist eine <span className="text-white font-semibold">Leasingübernahme</span> die klar günstigere und flexiblere Alternative zu einem neuen Leasingvertrag. Kürzere Laufzeiten, tiefere Kosten und sofort verfügbare Fahrzeuge machen sie zur bevorzugten Option vieler Schweizer Fahrer.
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

        <PremiumListings />
        
      </main>
    </>
  );
}