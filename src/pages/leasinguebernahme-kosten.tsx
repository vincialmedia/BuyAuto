import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
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
        <title>Leasingübernahme Kosten Schweiz 2025 – Komplette Gebühren-Übersicht | BuyAuto</title>
        <meta 
          name="description" 
          content="Leasingübernahme Kosten in der Schweiz: 100-400 CHF Transfergebühr + Ummeldung. Alle Gebühren transparent erklärt. Versteckte Kosten vermeiden. Jetzt informieren!" 
        />
        <meta name="keywords" content="leasingübernahme kosten, leasingübernahme gebühren, leasing transfer kosten, leasingvertrag übernehmen kosten, leasingübernahme schweiz kosten" />
        <link rel="canonical" href="https://www.buyauto.ch/leasinguebernahme-kosten" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Leasingübernahme Kosten Schweiz 2025 – Komplette Gebühren-Übersicht" />
        <meta property="og:description" content="Leasingübernahme Kosten in der Schweiz: 100-400 CHF Transfergebühr + Ummeldung. Alle Gebühren transparent erklärt. Versteckte Kosten vermeiden." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.buyauto.ch/leasinguebernahme-kosten" />
        <meta property="og:image" content="https://www.buyauto.ch/pexels-maitree-rimthong-444156-1602726.jpg" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Leasingübernahme Kosten Schweiz 2025 – Komplette Gebühren-Übersicht" />
        <meta name="twitter:description" content="Leasingübernahme Kosten in der Schweiz: 100-400 CHF Transfergebühr + Ummeldung. Alle Gebühren transparent erklärt." />
        <meta name="twitter:image" content="https://www.buyauto.ch/pexels-maitree-rimthong-444156-1602726.jpg" />
      </Head>

      <main className="bg-neutral-50 min-h-screen">
        
        {/* HERO SECTION - With Image Background */}
        <section className="relative min-h-[500px] md:min-h-[550px] flex items-center overflow-hidden pt-16">
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src="/pexels-maitree-rimthong-444156-1602726.jpg"
              alt="Leasingübernahme Kosten Schweiz"
              fill
              className="object-cover"
              priority
              quality={85}
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
                  <Calculator className="w-4 h-4" />
                  Klar & Transparent
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight mb-6">
                  Leasingübernahme Kosten – Klar & Transparent erklärt
                </h1>
                <p className="text-xl md:text-2xl text-red-400 font-semibold mb-4">
                  Ehrliche Kostenübersicht für deine Leasingübernahme
                </p>
                <p className="text-lg text-neutral-200 leading-relaxed mb-8 max-w-2xl">
                  Was kostet eine Leasingübernahme wirklich? Hier findest du eine verständliche, ehrliche und komplette Übersicht aller Gebühren – inklusive Bankkosten, Transfergebühren, Ummeldung, Versicherung und möglichen Zusatzkosten. Gilt auch für Leasing Transfers.
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
                    Warum fallen bei einer Leasingübernahme überhaupt Kosten an?
                  </h2>
                </div>
                <div className="bg-red-50 border-l-4 border-red-600 p-6 rounded-r-xl mb-6">
                  <p className="text-lg text-neutral-700 leading-relaxed mb-4">
                    Bei einer <Link href="/leasinguebernahme" className="text-red-600 hover:text-red-700 font-semibold underline decoration-red-600/30 hover:decoration-red-700 transition-colors">Leasingübernahme</Link> (auch <strong>Leasing Transfer</strong>) wird ein bestehender Vertrag auf eine neue Person übertragen.
                  </p>
                  <p className="text-lg text-neutral-700 leading-relaxed">
                    Banken und Behörden müssen den Halterwechsel, die Bonitätsprüfung und die Vertragsumschreibung durchführen – deshalb entstehen Gebühren.
                  </p>
                </div>

                <h3 className="text-2xl font-bold text-neutral-900 mb-4">
                  Die wichtigsten Faktoren für die Gesamtkosten:
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { icon: BadgeCheck, text: "Welche Leasingbank beteiligt ist" },
                    { icon: DollarSign, text: "Ob der Abgeber Gebühren übernimmt" },
                    { icon: TrendingDown, text: "Kilometerstand & Restkilometer" },
                    { icon: FileCheck, text: "Service- und Reifenpakete" },
                    { icon: MapPin, text: "Kanton des Halterwechsels" },
                    { icon: ShieldCheck, text: "Zustand des Fahrzeugs" }
                  ].map((item, i) => {
                    const IconComponent = item.icon;
                    return (
                      <div key={i} className="flex items-start gap-3 bg-neutral-50 border border-neutral-200 p-4 rounded-lg hover:border-red-600 transition-colors">
                        <div className="mt-0.5">
                          <IconComponent className="w-5 h-5 text-red-600" />
                        </div>
                        <span className="text-neutral-700 font-medium">{item.text}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <CheckCircle className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-blue-900 font-semibold mb-1">Kurz gesagt:</p>
                      <p className="text-blue-800">
                        Die Kosten hängen stark vom Vertrag und der Situation ab – hier findest du alle Szenarien.
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
                Kostenübersicht: Was kostet eine Leasingübernahme in der Schweiz?
              </h2>
            </div>
            
            <p className="text-lg text-neutral-600 mb-8">
              Hier ist die vollständige Übersicht aller Kosten bei einer Leasingübernahme oder einem Leasing Transfer:
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
                    <td className="p-4 md:p-6 text-neutral-600">Gebühr der Leasingbank für die Vertragsübertragung</td>
                  </tr>
                  <tr className="hover:bg-red-50 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Bonitätsprüfung</td>
                    <td className="p-4 md:p-6 text-green-600 font-semibold">0 CHF</td>
                    <td className="p-4 md:p-6 text-neutral-700">Übernehmer</td>
                    <td className="p-4 md:p-6 text-neutral-600">Obligatorisch, aber kostenlos</td>
                  </tr>
                  <tr className="hover:bg-red-50 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Händlerwechsel</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">100–250 CHF</td>
                    <td className="p-4 md:p-6 text-neutral-700">optional</td>
                    <td className="p-4 md:p-6 text-neutral-600">Wenn ein Händler involviert wird</td>
                  </tr>
                  <tr className="hover:bg-red-50 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Ummeldung / Fahrzeugausweis</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">50–150 CHF</td>
                    <td className="p-4 md:p-6 text-neutral-700">Übernehmer</td>
                    <td className="p-4 md:p-6 text-neutral-600">Je nach Kanton</td>
                  </tr>
                  <tr className="hover:bg-red-50 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Versicherung (Vollkasko)</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">80–250 CHF / Monat</td>
                    <td className="p-4 md:p-6 text-neutral-700">Übernehmer</td>
                    <td className="p-4 md:p-6 text-neutral-600">Pflicht beim Leasing</td>
                  </tr>
                  <tr className="hover:bg-red-50 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Mehrkilometer</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">variabel</td>
                    <td className="p-4 md:p-6 text-neutral-700">Übernehmer</td>
                    <td className="p-4 md:p-6 text-neutral-600">10–40 Rp./km</td>
                  </tr>
                  <tr className="hover:bg-red-50 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Service / Reifenpakete</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">variabel</td>
                    <td className="p-4 md:p-6 text-neutral-700">Übernehmer</td>
                    <td className="p-4 md:p-6 text-neutral-600">Je nach Vertrag</td>
                  </tr>
                  <tr className="hover:bg-red-50 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Depot / Kaution</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">selten</td>
                    <td className="p-4 md:p-6 text-neutral-700">Übernehmer</td>
                    <td className="p-4 md:p-6 text-neutral-600">Nur bei einigen Banken</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <CheckCircle className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-green-900 font-semibold mb-1">Gut zu wissen:</p>
                  <p className="text-green-800">
                    Viele Abgeber übernehmen die Transfergebühr, damit der Vertrag schneller übernommen wird.
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
                Kosten für Übernehmer (die neuen Fahrer)
              </h2>
            </div>
            
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-8">
              <div className="mb-8">
                <h3 className="text-xl font-bold text-neutral-900 mb-4">
                  Übernehmer profitieren oft von:
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { icon: TrendingDown, text: "Tiefen Monatsraten (wegen vorhandener Anzahlung)" },
                    { icon: DollarSign, text: "Keiner einmaligen Anzahlung" },
                    { icon: Clock, text: "Kurzer Restlaufzeit" },
                    { icon: Zap, text: "Sofortiger Verfügbarkeit" }
                  ].map((item, i) => {
                    const IconComponent = item.icon;
                    return (
                      <div key={i} className="flex items-start gap-3 bg-white border border-neutral-200 p-4 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                        <div className="flex items-start gap-2">
                          <IconComponent className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                          <span className="text-neutral-700 font-medium">{item.text}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <h3 className="text-xl font-bold text-neutral-900 mb-4">
                Typische Kosten:
              </h3>
              <div className="space-y-4 mb-8">
                {[
                  { icon: Calendar, text: "Leasingrate" },
                  { icon: ShieldCheck, text: "Versicherung" },
                  { icon: FileCheck, text: "Ummeldung" },
                  { icon: TrendingDown, text: "Mehrkilometer (falls überschritten)" }
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
                    <p className="text-green-900 font-bold text-lg mb-2">Wenn der Abgeber die Transfergebühr übernimmt, wird der Einstieg noch günstiger.</p>
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
                Kosten für Abgeber (die den Vertrag abgeben)
              </h2>
            </div>
            
            <div className="bg-white border-2 border-red-600 rounded-xl p-8">
              <p className="text-lg text-neutral-700 mb-6">
                Viele Abgeber zahlen Gebühren, um die Übernahme attraktiver zu machen – und die monatliche Belastung schnell loszuwerden.
              </p>

              <h3 className="text-xl font-bold text-neutral-900 mb-4">
                Typische Kosten:
              </h3>

              <div className="space-y-4 mb-8">
                {[
                  { icon: DollarSign, text: "Übernahme-/Transfergebühr" },
                  { icon: Users, text: "Allfällige Händlergebühren" },
                  { icon: FileCheck, text: "Fahrzeugaufbereitung (optional)" }
                ].map((item, i) => {
                  const IconComponent = item.icon;
                  return (
                    <div key={i} className="flex items-start gap-3 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                      <IconComponent className="w-5 h-5 text-red-600 mt-0.5" />
                      <span className="text-neutral-700 font-medium">{item.text}</span>
                    </div>
                  );
                })}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <Info className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-blue-900 font-bold text-lg mb-2">Warum Abgeber zahlen:</p>
                    <p className="text-blue-800">
                      Ein attraktives Angebot bedeutet: <strong>schneller raus aus dem Vertrag</strong>.
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
                Versteckte Kosten, auf die du achten solltest
              </h2>
            </div>
            
            <p className="text-lg text-neutral-600 mb-8">
              Diese Punkte sind wichtig – sie beeinflussen die echten Gesamtkosten:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  number: "1",
                  title: "Mehrkilometer",
                  desc: "12'000 km Vertrag → Auto hat 15'000 km gefahren? → Du zahlst pro Mehrkilometer.",
                  detail: "",
                  icon: TrendingDown
                },
                {
                  number: "2",
                  title: "Vorschäden",
                  desc: "Nicht dokumentiert = Streitfälle bei Rückgabe. Immer ein Übergabeprotokoll erstellen.",
                  detail: "",
                  icon: AlertTriangle
                },
                {
                  number: "3",
                  title: "Versicherungskosten",
                  desc: "Einige Fahrzeuge sind deutlich teurer zu versichern.",
                  detail: "",
                  icon: ShieldCheck
                },
                {
                  number: "4",
                  title: "Fehlende Services",
                  desc: "Übernehmen = Nachzahlen.",
                  detail: "",
                  icon: FileText
                },
                {
                  number: "5",
                  title: "Hohe Rate trotz kurzer Laufzeit",
                  desc: "Klingt günstig – kann es aber nicht sein. Immer Rate + Restlaufzeit zusammen betrachten.",
                  detail: "",
                  icon: Calendar
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
                    <p className="text-neutral-700">{item.desc}</p>
                    {item.detail && (
                      <p className="text-neutral-600 text-sm font-medium mt-2">{item.detail}</p>
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
                Was ist günstiger: Leasingübernahme oder neuer Leasingvertrag?
              </h2>
            </div>
            
            <div className="overflow-x-auto rounded-xl border-2 border-red-600 shadow-lg">
              <table className="w-full bg-white text-left">
                <thead className="bg-red-600 text-white">
                  <tr>
                    <th className="p-4 md:p-6 font-bold text-base md:text-lg">Vergleichspunkt</th>
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
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Monatsrate</td>
                    <td className="p-4 md:p-6 text-green-600 font-semibold">oft tiefer</td>
                    <td className="p-4 md:p-6 text-neutral-700">höher</td>
                  </tr>
                  <tr className="hover:bg-red-50 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Laufzeit</td>
                    <td className="p-4 md:p-6 text-green-600 font-semibold">kurz</td>
                    <td className="p-4 md:p-6 text-neutral-700">3–4 Jahre</td>
                  </tr>
                  <tr className="hover:bg-red-50 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Risiko</td>
                    <td className="p-4 md:p-6 text-green-600 font-semibold">tiefer</td>
                    <td className="p-4 md:p-6 text-neutral-700">höher</td>
                  </tr>
                  <tr className="hover:bg-red-50 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Verfügbarkeit</td>
                    <td className="p-4 md:p-6 text-green-600 font-semibold">sofort</td>
                    <td className="p-4 md:p-6 text-neutral-700">Wartezeit möglich</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6 bg-green-50 border-2 border-green-600 rounded-xl p-8 text-center">
              <div className="flex items-center justify-center gap-3 mb-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <h3 className="text-2xl font-bold text-green-900">Kurz gesagt:</h3>
              </div>
              <p className="text-green-800 text-lg leading-relaxed max-w-2xl mx-auto">
                Wenn du ein gutes Angebot findest, ist eine Leasingübernahme meist <strong>deutlich günstiger</strong> als ein neues Leasing.
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
                Rechtliches zu Kosten & Übertragung
              </h2>
            </div>
            
            <div className="space-y-6">
              <Card className="bg-neutral-800 border-neutral-700">
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {[
                      {
                        title: "Eigentümer bleibt immer die Leasingbank",
                        icon: ShieldCheck
                      },
                      {
                        title: "Die Anzahlung wird nicht zurückerstattet",
                        icon: DollarSign
                      },
                      {
                        title: "Vertrag bleibt identisch (Rate, Kilometer, Laufzeit)",
                        icon: FileText
                      },
                      {
                        title: "Bank muss die neue Person genehmigen",
                        icon: BadgeCheck
                      },
                      {
                        title: "Übergabeprotokoll dringend empfohlen",
                        icon: FileCheck
                      },
                      {
                        title: "Schäden müssen dokumentiert werden",
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
                            <p className="text-white text-lg font-medium">{item.title}</p>
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
                FAQ – Häufig gestellte Fragen
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
                  In der Regel <strong>100–400 CHF</strong>, plus allfällige Ummeldegebühren.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem 
                value="item-2" 
                className="bg-neutral-50 rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-red-600 transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Was kostet ein Leasing Transfer?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Die gleichen Gebühren wie bei einer Leasingübernahme.
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
                  Oft der Abgeber – um den Transfer attraktiver zu machen.
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
                  Ja: <strong>Mehrkilometer, Schäden, fehlende Services, Versicherung</strong>. Diese sollten vor der Übernahme genau geprüft werden.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="item-5" 
                className="bg-neutral-50 rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-red-600 transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Ist Leasingübernahme günstiger als neues Leasing?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Ja, meistens deutlich – wegen <strong>tieferen Monatsraten</strong> und <strong>fehlender Anzahlung</strong>.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="item-6" 
                className="bg-neutral-50 rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-red-600 transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Kann ich ein Leasingauto verkaufen?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Nein. Aber du kannst den <strong>Vertrag übertragen</strong>, und genau dafür dient dieser Kostenüberblick.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-20 bg-neutral-900 px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Lass dir jetzt ein transparentes Leasingübernahme-Angebot anzeigen
            </h2>
            <p className="text-neutral-300 max-w-2xl mx-auto text-lg leading-relaxed">
              Finde passende Übernahmen oder gib deinen Leasingvertrag einfach weiter – schnell, zuverlässig und kostenlos.
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
                  href="/" 
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