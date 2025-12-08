import Head from "next/head";
import Link from "next/link";
import { Check, ChevronRight, AlertTriangle, FileText, Info, ShieldCheck, TrendingDown, Clock, Zap, Users, BadgeCheck, MapPin, Calendar, DollarSign, FileCheck, Search, ArrowRight, RefreshCw, UserCheck, AlertCircle, CheckCircle, XCircle, Eye, CreditCard, Calculator } from "lucide-react";
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

export default function LeasinguebernahmeKostenPage() {
  return (
    <>
      <Head>
        <title>Leasingübernahme Kosten – Alle Gebühren & Kosten einer Leasingübertragung in der Schweiz | BuyAuto</title>
        <meta
          name="description"
          content="Was kostet eine Leasingübernahme wirklich? Vollständige, transparente Übersicht zu allen Kosten – inklusive Bankgebühren, Transferkosten, Ummeldung, Versicherung und versteckten Gebühren. Gilt auch für Leasing Transfers."
        />
        <link rel="canonical" href="https://www.buyauto.ch/leasinguebernahme-kosten" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Leasingübernahme Kosten – Alle Gebühren & Kosten einer Leasingübertragung in der Schweiz" />
        <meta property="og:description" content="Was kostet eine Leasingübernahme wirklich? Vollständige, transparente Übersicht zu allen Kosten – inklusive Bankgebühren, Transferkosten, Ummeldung und versteckten Gebühren." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://www.buyauto.ch/leasinguebernahme-kosten" />
      </Head>

      <main className="bg-neutral-50 min-h-screen">
        
        {/* HERO SECTION - With Image Background */}
        <section className="relative min-h-[500px] md:min-h-[550px] flex items-center overflow-hidden pt-16">
          {/* Background Image */}
          <div className="absolute inset-0">
            <img 
              src="https://images.unsplash.com/photo-1554224311-beee460c201f?w=1600&q=80" 
              alt="Leasingübernahme Kosten Schweiz" 
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
                  <Calculator className="w-4 h-4" />
                  Kostenübersicht
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight mb-6">
                  Leasingübernahme Kosten – Alle Gebühren & Kosten einer Leasingübertragung in der Schweiz
                </h1>
                <p className="text-xl md:text-2xl text-red-400 font-semibold mb-4">
                  Transparente Kostenübersicht für Leasingübernahme & Leasing Transfer
                </p>
                <p className="text-lg text-neutral-200 leading-relaxed mb-8 max-w-2xl">
                  Was kostet eine Leasingübernahme wirklich? Hier findest du eine vollständige, transparente Übersicht zu allen Kosten – inklusive Bankgebühren, Transferkosten, Ummeldung, Versicherung und versteckten Gebühren. Gilt auch für Leasing Transfers.
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

        {/* WHY DO COSTS OCCUR SECTION */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <Info className="w-8 h-8 text-red-600" />
                  <h2 className="text-3xl font-bold text-neutral-900">
                    Warum entstehen Kosten bei einer Leasingübernahme?
                  </h2>
                </div>
                <div className="bg-red-50 border-l-4 border-red-600 p-6 rounded-r-xl mb-6">
                  <p className="text-lg text-neutral-700 leading-relaxed mb-4">
                    Bei einer <strong>Leasingübernahme</strong>, auch <strong>Leasing Transfer</strong> genannt, wird ein bestehender Leasingvertrag auf eine neue Person übertragen.
                  </p>
                  <p className="text-lg text-neutral-700 leading-relaxed">
                    Dafür entstehen administrative Arbeiten wie:
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {[
                    { icon: ShieldCheck, text: "Bonitätsprüfung" },
                    { icon: FileText, text: "Vertragsumschreibung" },
                    { icon: FileCheck, text: "Dokumentenerstellung" },
                    { icon: RefreshCw, text: "Halterwechsel / Ummeldung" }
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

                <h3 className="text-2xl font-bold text-neutral-900 mb-4">
                  Die tatsächlichen Kosten hängen ab von:
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    "Der Leasinggesellschaft",
                    "Der Höhe der ursprünglichen Anzahlung",
                    "Service- und Reifenpaketen",
                    "Restkilometer",
                    "Ob ein Händler involviert ist",
                    "Ob ein Kantonswechsel erfolgt"
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 bg-neutral-50 border border-neutral-200 p-4 rounded-lg">
                      <Check className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      <span className="text-neutral-700 font-medium">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <Info className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-blue-900 font-semibold mb-1">Wichtig zu wissen</p>
                      <p className="text-blue-800">
                        Diese Seite erklärt klar, welche Kosten wirklich anfallen, wer sie übernimmt und wie man unnötige Gebühren vermeidet.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MAIN COST OVERVIEW TABLE */}
        <section className="py-16 px-4 bg-neutral-50">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <DollarSign className="w-8 h-8 text-red-600" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Kostenübersicht: Leasingübernahme & Leasing Transfer (Schweiz)
              </h2>
            </div>
            
            <p className="text-lg text-neutral-600 mb-8">
              Hier ist die vollständige Übersicht aller Kosten, die bei einer Leasingübernahme oder einem Leasing Transfer entstehen können:
            </p>
            
            <div className="overflow-x-auto rounded-xl border-2 border-red-600 shadow-lg mb-6">
              <table className="w-full bg-white text-left">
                <thead className="bg-red-600 text-white">
                  <tr>
                    <th className="p-4 md:p-6 font-bold text-base md:text-lg">Kostenart</th>
                    <th className="p-4 md:p-6 font-bold text-base md:text-lg">Typische Kosten</th>
                    <th className="p-4 md:p-6 font-bold text-base md:text-lg">Wer zahlt?</th>
                    <th className="p-4 md:p-6 font-bold text-base md:text-lg">Beschreibung</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  <tr className="hover:bg-red-50 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Übernahme-/Transfergebühr</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">100–400 CHF</td>
                    <td className="p-4 md:p-6 text-neutral-700">Abgeber oder Übernehmer</td>
                    <td className="p-4 md:p-6 text-neutral-600">Verwaltungsgebühr der Leasingbank für die Vertragsübertragung</td>
                  </tr>
                  <tr className="hover:bg-red-50 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Bonitätsprüfung</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">0 CHF</td>
                    <td className="p-4 md:p-6 text-neutral-700">Übernehmer</td>
                    <td className="p-4 md:p-6 text-neutral-600">Pflichtprüfung durch die Bank</td>
                  </tr>
                  <tr className="hover:bg-red-50 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Händler-/Wechselgebühr</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">100–250 CHF</td>
                    <td className="p-4 md:p-6 text-neutral-700">optional</td>
                    <td className="p-4 md:p-6 text-neutral-600">Wenn ein Händler miteinbezogen wird</td>
                  </tr>
                  <tr className="hover:bg-red-50 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Ummeldung / Fahrzeugausweis</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">50–150 CHF</td>
                    <td className="p-4 md:p-6 text-neutral-700">Übernehmer</td>
                    <td className="p-4 md:p-6 text-neutral-600">Kantonsabhängige Gebühren</td>
                  </tr>
                  <tr className="hover:bg-red-50 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Versicherung (Vollkasko)</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">80–250 CHF / Monat</td>
                    <td className="p-4 md:p-6 text-neutral-700">Übernehmer</td>
                    <td className="p-4 md:p-6 text-neutral-600">Meist obligatorisch beim Leasing</td>
                  </tr>
                  <tr className="hover:bg-red-50 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Mehrkilometerkosten</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">variabel</td>
                    <td className="p-4 md:p-6 text-neutral-700">Übernehmer</td>
                    <td className="p-4 md:p-6 text-neutral-600">10–40 Rp./km, je nach Marke</td>
                  </tr>
                  <tr className="hover:bg-red-50 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Service-/Reifenpakete</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">variabel</td>
                    <td className="p-4 md:p-6 text-neutral-700">Übernehmer</td>
                    <td className="p-4 md:p-6 text-neutral-600">Vorteil, wenn bereits enthalten</td>
                  </tr>
                  <tr className="hover:bg-red-50 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Kaution / Depot</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">selten</td>
                    <td className="p-4 md:p-6 text-neutral-700">Übernehmer</td>
                    <td className="p-4 md:p-6 text-neutral-600">Nur bei bestimmten Leasingbanken</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <Info className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-green-900 font-semibold mb-1">Hinweis</p>
                  <p className="text-green-800">
                    Viele Abgeber übernehmen die Übernahmegebühr, um den Leasing Transfer attraktiver zu machen.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* COSTS FOR BUYERS */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-8 h-8 text-red-600" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Kosten für Übernehmer (Käufer)
              </h2>
            </div>
            
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-8">
              <p className="text-lg text-neutral-700 mb-6">
                Übernehmer profitieren von günstigen Konditionen, haben aber folgende Kosten:
              </p>

              <div className="space-y-4 mb-8">
                {[
                  { icon: Calendar, text: "Monatliche Leasingrate" },
                  { icon: ShieldCheck, text: "Versicherung (oft Vollkasko)" },
                  { icon: TrendingDown, text: "Mehrkilometer (falls überschritten)" },
                  { icon: FileCheck, text: "Kosten für Ummeldung" },
                  { icon: DollarSign, text: "Eventuelle Händlergebühren" }
                ].map((item, i) => {
                  const IconComponent = item.icon;
                  return (
                    <div key={i} className="flex items-start gap-4 p-4 bg-white rounded-lg border border-neutral-200">
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

              <div className="bg-green-50 border-2 border-green-600 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-green-600 shrink-0 mt-1" />
                  <div>
                    <p className="text-green-900 font-bold text-lg mb-2">Vorteil für Übernehmer:</p>
                    <p className="text-green-800 leading-relaxed">
                      Wenn der ursprüngliche Leasingnehmer eine hohe Anzahlung geleistet hat, profitiert der Übernehmer von <strong>tieferen Monatsraten</strong>, ohne selbst eine Anzahlung leisten zu müssen.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* COSTS FOR SELLERS */}
        <section className="py-16 px-4 bg-neutral-50">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <RefreshCw className="w-8 h-8 text-red-600" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Kosten für Abgeber (Vertrag abgeben / Leasing Transfer)
              </h2>
            </div>
            
            <div className="bg-white border-2 border-red-600 rounded-xl p-8">
              <p className="text-lg text-neutral-700 mb-6">
                Abgeber übernehmen häufig einige oder alle Gebühren, um den Vertrag schneller loszuwerden.
              </p>

              <h3 className="text-xl font-bold text-neutral-900 mb-4">
                Typische Kosten für Abgeber:
              </h3>

              <div className="space-y-4 mb-8">
                {[
                  "Übernahme-/Transfergebühr",
                  "Allfällige Händlerkosten",
                  "Vorbereitungskosten (Reinigung, Dokumente, Service)"
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                    <DollarSign className="w-5 h-5 text-red-600 mt-0.5" />
                    <span className="text-neutral-700 font-medium">{item}</span>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <Info className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-blue-900 font-bold text-lg mb-2">Warum Abgeber zahlen:</p>
                    <p className="text-blue-800">
                      Ein attraktives Angebot führt zu <strong>schnelleren Übernahmen</strong> und <strong>weniger Vertragsrisiko</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HIDDEN COSTS */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <Eye className="w-8 h-8 text-red-600" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Versteckte Kosten, die oft übersehen werden
              </h2>
            </div>
            
            <p className="text-lg text-neutral-600 mb-8">
              Diese wichtigen Kostenpunkte werden häufig unterschätzt oder übersehen:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  number: "1",
                  title: "Mehrkilometer",
                  desc: "Eine der häufigsten Zusatzkosten.",
                  detail: "Je nach Marke: 10–40 Rappen pro km.",
                  icon: TrendingDown
                },
                {
                  number: "2",
                  title: "Vorschäden / Kratzer / Dellen",
                  desc: "Wenn der Zustand nicht sauber dokumentiert ist, können Nachforderungen entstehen.",
                  detail: "",
                  icon: AlertTriangle
                },
                {
                  number: "3",
                  title: "Versicherungsausschlüsse",
                  desc: "Einige Fahrzeuge erfordern teurere Policen.",
                  detail: "",
                  icon: ShieldCheck
                },
                {
                  number: "4",
                  title: "Fehlende Serviceeinträge",
                  desc: "Kann Unsicherheit bei Bank & Käufer schaffen → Verzögerungen.",
                  detail: "",
                  icon: FileText
                },
                {
                  number: "5",
                  title: "Hohe Leasingrate bei kurzer Restlaufzeit",
                  desc: "Die Rate ist fix – keine Neuverhandlung möglich.",
                  detail: "",
                  icon: Calendar
                },
                {
                  number: "6",
                  title: "Kantonswechsel-Gebühren",
                  desc: "Zusätzliche Ummelde- und Verwaltungskosten bei Umzug in anderen Kanton.",
                  detail: "",
                  icon: MapPin
                }
              ].map((item) => {
                const IconComponent = item.icon;
                return (
                  <div key={item.number} className="bg-neutral-50 border-2 border-neutral-200 rounded-xl p-6 hover:border-red-600 transition-colors">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-lg">
                        {item.number}
                      </div>
                      <IconComponent className="w-6 h-6 text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold text-neutral-900 mb-2">{item.title}</h3>
                    <p className="text-neutral-700 mb-2">{item.desc}</p>
                    {item.detail && (
                      <p className="text-neutral-600 text-sm font-medium">{item.detail}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* COST COMPARISON TABLE */}
        <section className="py-16 px-4 bg-neutral-50">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <Calculator className="w-8 h-8 text-red-600" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Kostenvergleich: Leasingübernahme vs. neuer Leasingvertrag
              </h2>
            </div>
            
            <div className="overflow-x-auto rounded-xl border-2 border-red-600 shadow-lg">
              <table className="w-full bg-white text-left">
                <thead className="bg-red-600 text-white">
                  <tr>
                    <th className="p-4 md:p-6 font-bold text-base md:text-lg">Kategorie</th>
                    <th className="p-4 md:p-6 font-bold text-base md:text-lg">Leasingübernahme</th>
                    <th className="p-4 md:p-6 font-bold text-base md:text-lg">Neues Leasing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  <tr className="hover:bg-red-50 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Startkosten</td>
                    <td className="p-4 md:p-6 text-green-600 font-semibold">sehr niedrig</td>
                    <td className="p-4 md:p-6 text-neutral-700">oft hohe Anzahlung</td>
                  </tr>
                  <tr className="hover:bg-red-50 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Restlaufzeit</td>
                    <td className="p-4 md:p-6 text-green-600 font-semibold">kurz</td>
                    <td className="p-4 md:p-6 text-neutral-700">36–48 Monate</td>
                  </tr>
                  <tr className="hover:bg-red-50 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Monatliche Rate</td>
                    <td className="p-4 md:p-6 text-green-600 font-semibold">oft tiefer</td>
                    <td className="p-4 md:p-6 text-neutral-700">höher</td>
                  </tr>
                  <tr className="hover:bg-red-50 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Risiko</td>
                    <td className="p-4 md:p-6 text-green-600 font-semibold">geringer</td>
                    <td className="p-4 md:p-6 text-neutral-700">langfristiger Vertrag</td>
                  </tr>
                  <tr className="hover:bg-red-50 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Verfügbarkeit</td>
                    <td className="p-4 md:p-6 text-green-600 font-semibold">sofort</td>
                    <td className="p-4 md:p-6 text-neutral-700">Wartezeiten möglich</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6 bg-green-50 border-2 border-green-600 rounded-xl p-8 text-center">
              <div className="flex items-center justify-center gap-3 mb-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <h3 className="text-2xl font-bold text-green-900">Fazit:</h3>
              </div>
              <p className="text-green-800 text-lg leading-relaxed max-w-2xl mx-auto">
                Eine Leasingübernahme ist oft <strong>deutlich günstiger</strong>, besonders wegen der fehlenden Anzahlung und der kürzeren Restlaufzeit.
              </p>
            </div>
          </div>
        </section>

        {/* LEGAL NOTES */}
        <section className="py-16 px-4 bg-neutral-900 text-white">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <ShieldCheck className="w-8 h-8 text-red-500" />
              <h2 className="text-3xl font-bold">
                Rechtliche Hinweise zu Kosten & Vertrag
              </h2>
            </div>
            
            <div className="space-y-6">
              <Card className="bg-neutral-800 border-neutral-700">
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {[
                      {
                        title: "Eigentumsverhältnisse",
                        text: "Die Leasingbank bleibt Eigentümer des Fahrzeugs",
                        icon: ShieldCheck
                      },
                      {
                        title: "Anzahlung",
                        text: "Die Anzahlung wird nicht zurückerstattet",
                        icon: DollarSign
                      },
                      {
                        title: "Vertragskonditionen",
                        text: "Der Vertrag bleibt unverändert – Rate, Kilometer, Restlaufzeit",
                        icon: FileText
                      },
                      {
                        title: "Bankgenehmigung",
                        text: "Die Bank kann die Übertragung ablehnen (Bonität!)",
                        icon: XCircle
                      },
                      {
                        title: "Übergabeprotokoll",
                        text: "Ein Übergabeprotokoll wird empfohlen",
                        icon: FileCheck
                      },
                      {
                        title: "Schadendokumentation",
                        text: "Schäden müssen dokumentiert werden",
                        icon: AlertTriangle
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
                FAQ – Häufige Fragen zu Leasingübernahme Kosten
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
                  Was kostet eine Leasingübernahme in der Schweiz?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Typischerweise <strong>100–400 CHF</strong> plus allfällige Ummeldegebühren (50–150 CHF). Die genauen Kosten hängen von der Leasinggesellschaft und den Vertragskonditionen ab.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem 
                value="item-2" 
                className="bg-neutral-50 rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-red-600 transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Wer bezahlt die Leasingübernahme-Gebühren?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Das kann frei vereinbart werden. Oft übernimmt der Abgeber die Gebühren, um den Transfer attraktiver zu machen und schneller einen Übernehmer zu finden.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem 
                value="item-3" 
                className="bg-neutral-50 rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-red-600 transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Was kostet ein Leasing Transfer?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Die Kosten sind identisch mit einer Leasingübernahme – meist <strong>100–400 CHF</strong> für die Transfergebühr plus Ummeldung und allfällige Händlerkosten. Es handelt sich um denselben Prozess.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem 
                value="item-4" 
                className="bg-neutral-50 rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-red-600 transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Gibt es versteckte Kosten?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Ja, häufig: <strong>Mehrkilometer</strong> (10–40 Rp./km), <strong>Schäden</strong> am Fahrzeug, <strong>höhere Versicherungen</strong> oder <strong>fehlende Servicepakete</strong>. Diese sollten vor der Übernahme genau geprüft werden.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="item-5" 
                className="bg-neutral-50 rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-red-600 transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Kann ich ein Leasingauto verkaufen?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Nein – du bist nicht Eigentümer. Aber du kannst den <strong>Leasingvertrag übertragen</strong> und dabei die oben genannten Kosten übernehmen oder weitergeben. Das ist der Leasing Transfer.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="item-6" 
                className="bg-neutral-50 rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-red-600 transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Ist eine Leasingübernahme günstiger als ein neues Leasing?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  In der Regel <strong>ja</strong> – wegen <strong>tieferen Monatsraten</strong> (dank Anzahlung des Vorbesitzers) und <strong>fehlender Anzahlung</strong> für den Übernehmer. Zudem ist die Restlaufzeit meist kürzer und das Risiko geringer.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="item-7" 
                className="bg-neutral-50 rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-red-600 transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Was kostet die Ummeldung bei einer Leasingübernahme?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Die Ummeldung kostet je nach Kanton <strong>50–150 CHF</strong>. Diese Gebühr deckt den neuen Fahrzeugausweis und die administrative Umschreibung beim Strassenverkehrsamt.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-20 bg-neutral-900 px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Bereit für eine transparente Leasingübernahme?
            </h2>
            <p className="text-neutral-300 max-w-2xl mx-auto text-lg leading-relaxed">
              Lass dir die realen Kosten erklären oder starte direkt mit deinem Leasing Transfer. Schnell, unkompliziert und vollständig online.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <Button asChild size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg shadow-red-600/30 transition-all">
                <Link href="/suche">
                  <Search className="w-5 h-5 mr-2" />
                  Leasingübernahme starten
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
                  href="/leasinguebernahme" 
                  className="text-neutral-300 hover:text-white transition-colors text-sm font-medium inline-flex items-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  Leasingübernahme (Hauptseite)
                </Link>
                <Link 
                  href="/leasing-abgeben-schweiz" 
                  className="text-neutral-300 hover:text-white transition-colors text-sm font-medium inline-flex items-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  Leasing abgeben
                </Link>
                <Link 
                  href="/suche" 
                  className="text-neutral-300 hover:text-white transition-colors text-sm font-medium inline-flex items-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  Angebote ansehen
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