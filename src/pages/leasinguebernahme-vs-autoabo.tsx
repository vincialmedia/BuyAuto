import Head from "next/head";
import Link from "next/link";
import { Check, ChevronRight, AlertTriangle, FileText, Info, ShieldCheck, TrendingDown, Clock, Zap, Users, BadgeCheck, MapPin, Calendar, DollarSign, FileCheck, Search, ArrowRight, RefreshCw, UserCheck, AlertCircle, CheckCircle, XCircle, Sparkles, TrendingUp } from "lucide-react";
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

export default function LeasingVsAutoAboPage() {
  return (
    <>
      <Head>
        <title>Leasingübernahme vs. Auto Abo – Was lohnt sich 2025 wirklich? | BuyAuto</title>
        <meta
          name="description"
          content="Auto Abo oder Leasingübernahme? Wir vergleichen Kosten, Flexibilität, Vertragsbindung, Risiken und Vorteile. Finde heraus, welche Option 2025 in der Schweiz günstiger & sinnvoller ist."
        />
        <link rel="canonical" href="https://www.buyauto.ch/leasinguebernahme-vs-autoabo" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Leasingübernahme vs. Auto Abo – Was lohnt sich 2025 wirklich?" />
        <meta property="og:description" content="Auto Abo oder Leasingübernahme? Wir vergleichen Kosten, Flexibilität, Vertragsbindung, Risiken und Vorteile. Finde heraus, welche Option 2025 in der Schweiz günstiger & sinnvoller ist." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://www.buyauto.ch/leasinguebernahme-vs-autoabo" />
      </Head>

      <main className="bg-neutral-50 min-h-screen">
        
        {/* HERO SECTION - With Image Background */}
        <section className="relative min-h-[500px] md:min-h-[550px] flex items-center overflow-hidden pt-16">
          {/* Background Image */}
          <div className="absolute inset-0">
            <img 
              src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1600&q=80" 
              alt="Leasingübernahme vs. Auto Abo Vergleich" 
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
                  <Sparkles className="w-4 h-4" />
                  Kompletter Vergleich 2025
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight mb-6">
                  Leasingübernahme vs. Auto Abo – Die beste Wahl für 2025?
                </h1>
                <p className="text-xl md:text-2xl text-red-400 font-semibold mb-4">
                  Der direkte Vergleich mit echten Zahlen aus der Schweiz
                </p>
                <p className="text-lg text-neutral-200 leading-relaxed mb-8 max-w-2xl">
                  Du überlegst, ob ein Auto Abo oder eine <Link href="/leasinguebernahme" className="text-white underline hover:text-red-400 transition-colors">Leasingübernahme</Link> besser zu deinem Budget, deinem Alltag und deiner Flexibilität passt? Hier findest du den direkten Vergleich – klar, verständlich und mit echten Zahlen aus der Schweiz.
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
                      Mehr zur Leasingübernahme
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 1 - Overview */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <TrendingUp className="w-8 h-8 text-red-600" />
                  <h2 className="text-3xl font-bold text-neutral-900">
                    Überblick: Auto Abo oder Leasingübernahme?
                  </h2>
                </div>
                <div className="space-y-6 text-lg text-neutral-700 leading-relaxed">
                  <p>
                    Auto Abos sind in der Schweiz stark im Trend – besonders bei Anbietern wie <strong>Clyde, Carvolution, Carify</strong> oder <strong>Mobility</strong>.
                  </p>
                  <p>
                    Auf der anderen Seite bietet die <Link href="/leasinguebernahme" className="text-red-600 font-semibold underline hover:text-red-700 transition-colors">Leasingübernahme</Link> eine Möglichkeit, ein bestehendes Leasing günstig zu übernehmen.
                  </p>
                  <p>
                    Beide Modelle richten sich an Fahrer, die ein flexibles Auto wollen – aber die Kostenstrukturen unterscheiden sich massiv.
                  </p>
                  
                  <div className="bg-red-50 border-l-4 border-red-600 p-6 rounded-r-xl mt-6">
                    <p className="font-semibold text-neutral-900 text-xl mb-3">Kurz gesagt:</p>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                        <p className="text-neutral-700">Ein <strong>Auto Abo</strong> ist bequemer</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                        <p className="text-neutral-700">Eine <Link href="/leasinguebernahme" className="text-red-600 font-semibold underline hover:text-red-700 transition-colors">Leasingübernahme</Link> ist <strong>fast immer viel günstiger</strong></p>
                      </div>
                    </div>
                  </div>

                  <p className="font-medium text-neutral-900 pt-4">
                    Diese Seite zeigt dir die Unterschiede auf einen Blick.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2 - Comparison Table */}
        <section className="py-16 px-4 bg-neutral-50">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <FileCheck className="w-8 h-8 text-red-600" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Direkter Vergleich: Leasingübernahme vs. Auto Abo
              </h2>
            </div>
            
            <div className="overflow-x-auto rounded-xl border-2 border-red-600 shadow-lg">
              <table className="w-full bg-white text-left">
                <thead className="bg-red-600 text-white">
                  <tr>
                    <th className="p-4 md:p-6 font-bold text-base md:text-lg">Kriterium</th>
                    <th className="p-4 md:p-6 font-bold text-base md:text-lg">Leasingübernahme</th>
                    <th className="p-4 md:p-6 font-bold text-base md:text-lg">Auto Abo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  <tr className="hover:bg-red-50 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Monatskosten</td>
                    <td className="p-4 md:p-6 text-green-700 font-semibold">deutlich tiefer</td>
                    <td className="p-4 md:p-6 text-red-700 font-semibold">sehr hoch (alles inklusive)</td>
                  </tr>
                  <tr className="hover:bg-red-50 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Anzahlung</td>
                    <td className="p-4 md:p-6 text-neutral-700">selten nötig</td>
                    <td className="p-4 md:p-6 text-neutral-700">keine</td>
                  </tr>
                  <tr className="hover:bg-red-50 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Laufzeit</td>
                    <td className="p-4 md:p-6 text-neutral-700">kürzere Restlaufzeit</td>
                    <td className="p-4 md:p-6 text-neutral-700">flexibel (1–12 Monate)</td>
                  </tr>
                  <tr className="hover:bg-red-50 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Versicherung & Service</td>
                    <td className="p-4 md:p-6 text-neutral-700">separat</td>
                    <td className="p-4 md:p-6 text-neutral-700">inklusive</td>
                  </tr>
                  <tr className="hover:bg-red-50 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Kilometerlimit</td>
                    <td className="p-4 md:p-6 text-neutral-700">vertraglich fix</td>
                    <td className="p-4 md:p-6 text-neutral-700">flexibel, aber teuer</td>
                  </tr>
                  <tr className="hover:bg-red-50 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Gesamtkosten</td>
                    <td className="p-4 md:p-6 text-green-700 font-semibold">meist am günstigsten</td>
                    <td className="p-4 md:p-6 text-red-700 font-semibold">am teuersten</td>
                  </tr>
                  <tr className="hover:bg-red-50 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Flexibilität</td>
                    <td className="p-4 md:p-6 text-neutral-700">mittel</td>
                    <td className="p-4 md:p-6 text-neutral-700">sehr hoch</td>
                  </tr>
                  <tr className="hover:bg-red-50 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Verfügbarkeit</td>
                    <td className="p-4 md:p-6 text-neutral-700">sofort</td>
                    <td className="p-4 md:p-6 text-neutral-700">sofort, je nach Abo-Anbieter</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <Info className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-blue-900 font-semibold mb-1">Mehr Details zum Ablauf</p>
                  <p className="text-blue-800">
                    Erfahre mehr über den <Link href="/leasinguebernahme" className="underline hover:text-blue-600 font-semibold">Ablauf der Leasingübernahme</Link> und alle Schritte zur Vertragsübertragung.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3 - Advantages Leasingübernahme */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Vorteile einer Leasingübernahme
              </h2>
            </div>
            
            <div className="bg-green-50 border-2 border-green-600 rounded-xl p-8">
              <div className="space-y-4">
                {[
                  "Tiefere monatliche Kosten",
                  "Oft keine oder geringe Anzahlung",
                  "Kürzere Bindung (Restlaufzeit)",
                  "Grosses Einsparpotenzial gegenüber Auto Abos",
                  "Auto sofort verfügbar",
                  "Keine teuren Abo-Kilometerpakete"
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 bg-white rounded-lg border border-green-200">
                    <div className="flex-shrink-0">
                      <Check className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="text-neutral-900 font-medium text-lg">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <Info className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-blue-900 font-semibold mb-1">Mehr erfahren</p>
                  <p className="text-blue-800">
                    Entdecke alle Details zum <Link href="/leasinguebernahme" className="underline hover:text-blue-600 font-semibold">Ablauf der Leasingübernahme</Link> und wie du sofort starten kannst.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4 - Advantages Auto Abo */}
        <section className="py-16 px-4 bg-neutral-50">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <Sparkles className="w-8 h-8 text-red-600" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Vorteile eines Auto Abos
              </h2>
            </div>
            
            <div className="bg-white border-2 border-neutral-300 rounded-xl p-8">
              <h3 className="text-xl font-bold text-neutral-900 mb-6">Vorteile:</h3>
              <div className="space-y-4 mb-8">
                {[
                  "Alles inklusive (Versicherung, Service, Reifen, Steuern)",
                  "Maximale Flexibilität",
                  "Ideal für kurzfristige Nutzung",
                  "Keine Anzahlung",
                  "Auto auf Knopfdruck verfügbar"
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                    <div className="flex-shrink-0">
                      <Check className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="text-neutral-900 font-medium text-lg">{item}</p>
                  </div>
                ))}
              </div>

              <Separator className="my-8" />

              <h3 className="text-xl font-bold text-neutral-900 mb-6">Nachteile:</h3>
              <div className="space-y-4">
                {[
                  "höhere Kosten als jede andere Option",
                  "Zusatzkosten für Kilometerpakete",
                  "keine langfristige Vermögensbildung",
                  "kein Wiederverkaufswert"
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex-shrink-0">
                      <XCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <p className="text-neutral-900 font-medium text-lg">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5 - Cost Comparison */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <DollarSign className="w-8 h-8 text-red-600" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Kostenvergleich (echte Beispiele aus der Schweiz)
              </h2>
            </div>

            <div className="space-y-8">
              {/* Example 1 - VW Golf */}
              <div className="bg-neutral-50 rounded-xl p-8 border-2 border-neutral-200">
                <h3 className="text-2xl font-bold text-neutral-900 mb-6">Beispiel 1: Kompaktwagen (VW Golf)</h3>
                
                <div className="overflow-x-auto rounded-xl border-2 border-red-600 shadow-lg">
                  <table className="w-full bg-white text-left">
                    <thead className="bg-red-600 text-white">
                      <tr>
                        <th className="p-4 md:p-6 font-bold text-base md:text-lg">Kriterium</th>
                        <th className="p-4 md:p-6 font-bold text-base md:text-lg">Leasingübernahme</th>
                        <th className="p-4 md:p-6 font-bold text-base md:text-lg">Auto Abo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      <tr className="hover:bg-red-50 transition-colors">
                        <td className="p-4 md:p-6 font-medium text-neutral-900">Monatskosten</td>
                        <td className="p-4 md:p-6 text-green-700 font-bold text-lg">CHF 350</td>
                        <td className="p-4 md:p-6 text-red-700 font-bold text-lg">CHF 890</td>
                      </tr>
                      <tr className="hover:bg-red-50 transition-colors">
                        <td className="p-4 md:p-6 font-medium text-neutral-900">Anzahlung</td>
                        <td className="p-4 md:p-6 text-neutral-700">CHF 0</td>
                        <td className="p-4 md:p-6 text-neutral-700">CHF 0</td>
                      </tr>
                      <tr className="hover:bg-red-50 transition-colors">
                        <td className="p-4 md:p-6 font-medium text-neutral-900">Laufzeit</td>
                        <td className="p-4 md:p-6 text-neutral-700">18 Monate</td>
                        <td className="p-4 md:p-6 text-neutral-700">flexibel</td>
                      </tr>
                      <tr className="hover:bg-red-50 transition-colors bg-neutral-50">
                        <td className="p-4 md:p-6 font-bold text-neutral-900 text-lg">Gesamtkosten</td>
                        <td className="p-4 md:p-6 text-green-700 font-bold text-xl">ca. CHF 6'300</td>
                        <td className="p-4 md:p-6 text-red-700 font-bold text-xl">ca. CHF 16'020</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-900 font-bold text-lg">
                        → Auto Abo: fast 10'000 CHF teurer.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Example 2 - Tesla Model 3 */}
              <div className="bg-neutral-50 rounded-xl p-8 border-2 border-neutral-200">
                <h3 className="text-2xl font-bold text-neutral-900 mb-6">Beispiel 2: Elektroauto (z. B. Tesla Model 3)</h3>
                
                <div className="overflow-x-auto rounded-xl border-2 border-red-600 shadow-lg">
                  <table className="w-full bg-white text-left">
                    <thead className="bg-red-600 text-white">
                      <tr>
                        <th className="p-4 md:p-6 font-bold text-base md:text-lg">Kriterium</th>
                        <th className="p-4 md:p-6 font-bold text-base md:text-lg">Leasingübernahme</th>
                        <th className="p-4 md:p-6 font-bold text-base md:text-lg">Auto Abo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      <tr className="hover:bg-red-50 transition-colors">
                        <td className="p-4 md:p-6 font-medium text-neutral-900">Monatskosten</td>
                        <td className="p-4 md:p-6 text-green-700 font-bold text-lg">CHF 560</td>
                        <td className="p-4 md:p-6 text-red-700 font-bold text-lg">CHF 1'450</td>
                      </tr>
                      <tr className="hover:bg-red-50 transition-colors">
                        <td className="p-4 md:p-6 font-medium text-neutral-900">Anzahlung</td>
                        <td className="p-4 md:p-6 text-neutral-700">CHF 0</td>
                        <td className="p-4 md:p-6 text-neutral-700">CHF 0</td>
                      </tr>
                      <tr className="hover:bg-red-50 transition-colors">
                        <td className="p-4 md:p-6 font-medium text-neutral-900">Laufzeit</td>
                        <td className="p-4 md:p-6 text-neutral-700">20 Monate</td>
                        <td className="p-4 md:p-6 text-neutral-700">flexibel</td>
                      </tr>
                      <tr className="hover:bg-red-50 transition-colors bg-neutral-50">
                        <td className="p-4 md:p-6 font-bold text-neutral-900 text-lg">Gesamtkosten</td>
                        <td className="p-4 md:p-6 text-green-700 font-bold text-xl">ca. CHF 11'200</td>
                        <td className="p-4 md:p-6 text-red-700 font-bold text-xl">ca. CHF 29'000</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-900 font-bold text-lg">
                        → Auto Abo: fast 18'000 CHF teurer.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <CheckCircle className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-green-900 font-semibold mb-1">Fazit</p>
                  <p className="text-green-800">
                    Eine <Link href="/leasinguebernahme" className="underline hover:text-green-600 font-semibold">Leasingübernahme</Link> bietet in beiden Beispielen ein <strong>massives Einsparpotenzial</strong> gegenüber Auto Abos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 6 - Target Audience */}
        <section className="py-16 px-4 bg-neutral-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-neutral-900 mb-3">
                Für wen eignet sich welche Option?
              </h2>
              <p className="text-lg text-neutral-600">
                Finde heraus, welches Modell besser zu dir passt
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Leasingübernahme Target Audience */}
              <div className="bg-white p-8 rounded-3xl shadow-lg border-2 border-green-600">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-green-50 p-3 rounded-xl">
                    <CheckCircle className="w-7 h-7 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-900">
                    Leasingübernahme ist ideal für dich, wenn:
                  </h3>
                </div>
                <ul className="space-y-4">
                  {[
                    "du Geld sparen willst",
                    "du keine hohe Anzahlung leisten möchtest",
                    "du ein Auto für 1–3 Jahre brauchst",
                    "du ein gutes Preis-Leistungs-Verhältnis willst",
                    "du sofort verfügbare Fahrzeuge suchst"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-neutral-700">
                      <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                      <span className="font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <Button asChild className="w-full bg-green-600 hover:bg-green-700 text-white">
                    <Link href="/leasinguebernahme">
                      Mehr zur Leasingübernahme
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Auto Abo Target Audience */}
              <div className="bg-white p-8 rounded-3xl shadow-lg border-2 border-neutral-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-neutral-50 p-3 rounded-xl">
                    <Sparkles className="w-7 h-7 text-neutral-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-900">
                    Auto Abo ist ideal für dich, wenn:
                  </h3>
                </div>
                <ul className="space-y-4">
                  {[
                    "du maximale Flexibilität willst",
                    "du eine All-inclusive-Lösung bevorzugst",
                    "du nur kurzfristig ein Auto brauchst",
                    "dir der Preis nicht so wichtig ist"
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

        {/* SECTION 7 - Risks Comparison */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Risiken im Vergleich
              </h2>
            </div>

            <div className="space-y-8">
              {/* Risks Leasingübernahme */}
              <div className="bg-neutral-50 rounded-xl p-8 border-2 border-neutral-200">
                <h3 className="text-xl font-bold text-neutral-900 mb-6 flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                  Risiken der Leasingübernahme:
                </h3>
                <ul className="space-y-3">
                  {[
                    "Bonitätsprüfung nötig",
                    "Vertrag darf nicht verletzt sein",
                    "Kilometer & Zustand müssen passen"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-neutral-700">
                      <span className="text-yellow-600 mt-1">•</span>
                      <span className="font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Risks Auto Abo */}
              <div className="bg-red-50 rounded-xl p-8 border-2 border-red-200">
                <h3 className="text-xl font-bold text-neutral-900 mb-6 flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                  Risiken beim Auto Abo:
                </h3>
                <ul className="space-y-3">
                  {[
                    "extrem hohe monatliche Kosten",
                    "Kilometerüberschreitungen sind teuer",
                    "keine Kapitalbildung",
                    "langfristig die teuerste Lösung"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-neutral-700">
                      <span className="text-red-600 mt-1">•</span>
                      <span className="font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <Info className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-blue-900 font-semibold mb-1">Tipp</p>
                  <p className="text-blue-800">
                    Wenn du deine Kosten langfristig senken möchtest, ist eine <Link href="/leasinguebernahme" className="underline hover:text-blue-600 font-semibold">Leasingübernahme</Link> in den meisten Fällen die beste Lösung.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 8 - FAQ */}
        <section className="py-16 px-4 bg-neutral-50">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-neutral-900 mb-3">
                FAQ: Leasingübernahme vs. Auto Abo
              </h2>
              <p className="text-neutral-600 text-lg">
                Die wichtigsten Fragen und Antworten im Überblick
              </p>
            </div>
            
            <Accordion type="single" collapsible className="w-full space-y-4">
              <AccordionItem 
                value="item-1" 
                className="bg-white rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-red-600 transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Was ist günstiger: Auto Abo oder Leasingübernahme?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Eine <Link href="/leasinguebernahme" className="text-red-600 font-semibold underline hover:text-red-700">Leasingübernahme</Link> ist fast immer deutlich günstiger als ein Auto Abo. Bei einem VW Golf kannst du mit einer <Link href="/leasinguebernahme" className="text-red-600 font-semibold underline hover:text-red-700">Leasingübernahme</Link> über 18 Monate rund <strong>10'000 CHF sparen</strong>. Auto Abos beinhalten zwar alle Services, aber die Gesamtkosten sind massiv höher.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem 
                value="item-2" 
                className="bg-white rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-red-600 transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Muss ich bei einer Leasingübernahme eine Anzahlung leisten?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Nein, in den meisten Fällen ist keine Anzahlung nötig. Die ursprüngliche Anzahlung wurde bereits vom Vorbesitzer geleistet und bleibt im Vertrag. Das ist einer der grössten Vorteile beim <Link href="/leasinguebernahme" className="text-red-600 font-semibold underline hover:text-red-700">Leasing übernehmen</Link> – du profitierst von den niedrigeren monatlichen Raten ohne hohe Einstiegskosten.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem 
                value="item-3" 
                className="bg-white rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-red-600 transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Warum sind Auto Abos immer teurer?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Auto Abos sind All-inclusive-Lösungen und beinhalten Versicherung, Service, Reifen, Steuern und oft auch Zusatzleistungen. Diese Bequemlichkeit hat ihren Preis – die monatlichen Kosten sind oft <strong>doppelt so hoch</strong> wie bei einer <Link href="/leasinguebernahme" className="text-red-600 font-semibold underline hover:text-red-700">Leasingübernahme</Link>. Wer Geld sparen will, ist mit dem <Link href="/leasinguebernahme" className="text-red-600 font-semibold underline hover:text-red-700">Ablauf der Leasingübernahme</Link> besser beraten.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem 
                value="item-4" 
                className="bg-white rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-red-600 transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Ist eine Leasingübernahme auch ohne perfekte Bonität möglich?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Die Leasingbank prüft deine Bonität, aber die Anforderungen sind oft etwas flexibler als bei einem Neuvertrag. Solange du ein stabiles Einkommen und keine gravierenden ZEK-Einträge hast, stehen die Chancen gut. Mehr Details zum Prozess findest du auf unserer Seite <Link href="/leasinguebernahme" className="text-red-600 font-semibold underline hover:text-red-700">Leasingübernahme Schweiz</Link>.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="item-5" 
                className="bg-white rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-red-600 transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Was passiert, wenn ich mehr Kilometer fahre als erlaubt?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Sowohl bei der <Link href="/leasinguebernahme" className="text-red-600 font-semibold underline hover:text-red-700">Leasingübernahme</Link> als auch beim Auto Abo fallen Mehrkilometerkosten an. Bei der <Link href="/leasinguebernahme" className="text-red-600 font-semibold underline hover:text-red-700">Leasingübernahme</Link> sind diese Kosten vertraglich fix und oft günstiger. Bei Auto Abos können sie schnell teuer werden, besonders wenn du ein kleines Kilometerpaket gewählt hast.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="item-6" 
                className="bg-white rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-red-600 transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Welche Option ist flexibler?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Ein Auto Abo bietet die maximale Flexibilität – du kannst monatlich kündigen oder wechseln. Eine <Link href="/leasinguebernahme" className="text-red-600 font-semibold underline hover:text-red-700">Leasingübernahme</Link> bindet dich an die Restlaufzeit (oft 12–30 Monate), ist aber dafür <strong>massiv günstiger</strong>. Für mittelfristige Planung (1–3 Jahre) ist die <Link href="/leasinguebernahme" className="text-red-600 font-semibold underline hover:text-red-700">Leasingübernahme als beste Lösung</Link> klar im Vorteil.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* SECTION 9 - Final CTA */}
        <section className="py-20 bg-neutral-900 px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Die beste Wahl für 2025: Leasingübernahme
            </h2>
            <div className="max-w-2xl mx-auto space-y-4">
              <p className="text-neutral-300 text-lg leading-relaxed">
                Ein Auto Abo bietet Flexibilität – aber zu hohen Preisen.
              </p>
              <p className="text-white text-xl font-semibold">
                Wenn du ein günstiges, sofort verfügbares Fahrzeug willst, ist die <Link href="/leasinguebernahme" className="text-red-400 underline hover:text-red-300 transition-colors">Leasingübernahme</Link> in der Schweiz die klar beste Option.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <Button asChild size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg shadow-red-600/30 transition-all">
                <Link href="/leasinguebernahme">
                  Mehr zur Leasingübernahme
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg font-semibold border-2 border-white text-white hover:bg-white hover:text-neutral-900 rounded-xl bg-transparent transition-all">
                <Link href="/suche">
                  <Search className="w-5 h-5 mr-2" />
                  Angebote durchsuchen
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
                  Leasingübernahme Schweiz
                </Link>
                <Link 
                  href="/leasing-abgeben-schweiz" 
                  className="text-neutral-300 hover:text-white transition-colors text-sm font-medium inline-flex items-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  Leasing abgeben
                </Link>
                <Link 
                  href="/leasinguebernahme-kosten" 
                  className="text-neutral-300 hover:text-white transition-colors text-sm font-medium inline-flex items-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  Kosten im Detail
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