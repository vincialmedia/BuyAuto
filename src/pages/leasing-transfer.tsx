import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { Check, ChevronRight, AlertTriangle, FileText, Info, ShieldCheck, TrendingDown, Clock, Zap, Users, BadgeCheck, MapPin, Calendar, DollarSign, FileCheck, Search, ArrowRight, RefreshCw, UserCheck, AlertCircle, CheckCircle, XCircle, Building2 } from "lucide-react";
import PremiumListings from "@/components/buyauto/PremiumListings";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
        <title>Leasing Transfer in der Schweiz (2025): So funktioniert die Vertragsübernahme richtig | BuyAuto</title>
        <meta
          name="description"
          content="Leasing Transfer in der Schweiz einfach erklärt: So überträgst du deinen Leasingvertrag legal und ohne hohe Kosten. Ablauf, Voraussetzungen, Anbieter & warum die Leasingübernahme oft die bessere Lösung ist."
        />
        <link rel="canonical" href="https://www.buyauto.ch/leasing-transfer" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Leasing Transfer in der Schweiz (2025): So funktioniert die Vertragsübernahme richtig" />
        <meta property="og:description" content="Leasing Transfer in der Schweiz einfach erklärt: So überträgst du deinen Leasingvertrag legal und ohne hohe Kosten." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://www.buyauto.ch/leasing-transfer" />
      </Head>

      <main className="bg-neutral-50 min-h-screen">
        
        {/* HERO SECTION */}
        <section className="relative min-h-[500px] md:min-h-[550px] flex items-center overflow-hidden pt-16">
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src="/ChatGPT_Image_Dec_11_2025_12_36_51_AM.png"
              alt="Leasing Transfer Schweiz"
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
                  <TrendingDown className="w-4 h-4" />
                  Leasing Transfer Guide 2025
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight mb-6">
                  Leasing Transfer in der Schweiz – Ablauf, Kosten & die beste Lösung (2025)
                </h1>
                
                <p className="text-lg text-neutral-200 leading-relaxed mb-8 max-w-2xl">
                  Ein Leasing Transfer ermöglicht es dir, deinen bestehenden Leasingvertrag an eine andere Person zu übertragen – legal, schnell und ohne teure Strafen. Hier erfährst du Schritt für Schritt, wie ein Leasing Transfer funktioniert und wann eine <Link href="/leasinguebernahme" className="text-red-400 hover:text-red-300 underline underline-offset-4">Leasingübernahme</Link> die cleverere Alternative ist.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    asChild
                    size="lg"
                    className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30 transition-all duration-300 px-8 py-6 text-base font-semibold rounded-xl"
                  >
                    <Link href="/inserat-erstellen">
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

        {/* SECTION 1 - Was bedeutet Leasing Transfer? */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <FileCheck className="w-8 h-8 text-red-600" />
                  <h2 className="text-3xl font-bold text-neutral-900">
                    Was bedeutet Leasing Transfer?
                  </h2>
                </div>
                <div className="bg-red-50 border-l-4 border-red-600 p-6 rounded-r-xl mb-6">
                  <p className="text-lg text-neutral-700 leading-relaxed mb-4">
                    Ein Leasing Transfer (auch <Link href="/leasinguebernahme" className="text-red-700 hover:text-red-800 font-medium underline decoration-red-300 underline-offset-2">Leasingübernahme</Link> oder Leasingvertrag übertragen genannt) bedeutet, dass eine andere Person deinen laufenden Leasingvertrag übernimmt. Das Fahrzeug bleibt beim gleichen Leasinggeber, nur der Vertragspartner ändert sich.
                  </p>
                </div>

                <h3 className="text-2xl font-bold text-neutral-900 mb-4">
                  Typische Gründe für einen Leasing Transfer:
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {[
                    { icon: DollarSign, text: "Raten zu hoch" },
                    { icon: RefreshCw, text: "Lebenssituation ändert sich" },
                    { icon: TrendingDown, text: "Weniger Bedarf am Auto" },
                    { icon: AlertCircle, text: "Fahrzeug passt nicht mehr zum Alltag" },
                    { icon: Zap, text: "Wunsch nach einem neuen Modell" }
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
                
                <p className="text-lg text-neutral-700">
                  Für viele Fahrer ist der Leasing Transfer der einfachste Weg, schnell aus einem Leasing auszusteigen. Erfahre mehr zum Thema <Link href="/leasinguebernahme" className="text-red-600 hover:text-red-700 font-semibold underline decoration-red-200 underline-offset-2">Leasingübernahme</Link>.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2 - Process Timeline */}
        <section className="py-16 px-4 bg-neutral-50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <ChevronRight className="w-8 h-8 text-red-600" />
                <h2 className="text-3xl font-bold text-neutral-900">
                  Wie funktioniert ein Leasing Transfer?
                </h2>
              </div>
              <p className="text-lg text-neutral-600">
                Der <Link href="/leasinguebernahme" className="text-red-600 hover:text-red-700 underline underline-offset-2">Ablauf der Leasingübernahme</Link> in 5 Schritten
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
                    desc: "Restwert, Laufzeit, Kilometer, Rückgabebedingungen.",
                    items: [],
                    icon: FileText
                  },
                  {
                    step: 2,
                    title: "Leasinggeber informieren",
                    desc: "Fast alle Schweizer Anbieter erlauben Leasing Transfers, benötigen aber eine Freigabe.",
                    items: [],
                    icon: Building2
                  },
                  {
                    step: 3,
                    title: "Übernehmer finden",
                    desc: "Der neue Fahrer übernimmt den Vertrag zu den bestehenden Konditionen.",
                    items: [],
                    icon: Users
                  },
                  {
                    step: 4,
                    title: "Bonitätsprüfung",
                    desc: "Der Leasinggeber prüft, ob der neue Vertragspartner zahlungsfähig ist.",
                    items: [],
                    icon: ShieldCheck
                  },
                  {
                    step: 5,
                    title: "Vertragsumschreibung & Fahrzeugübergabe",
                    desc: "Nach der Bestätigung wird der Vertrag offiziell übertragen und das Auto übergeben.",
                    items: [],
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
                      <div className="flex-1 bg-white border border-neutral-200 rounded-xl p-6 md:p-8">
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
            </div>
          </div>
        </section>

        {/* SECTION 3 - Costs */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <DollarSign className="w-8 h-8 text-red-600" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Kosten eines Leasing Transfers
              </h2>
            </div>
            
            <p className="text-lg text-neutral-600 mb-8">
              Ein Leasing Transfer ist meist deutlich günstiger als eine Kündigung. In vielen Fällen ist der Leasing Transfer die kostengünstigste Variante, um ein Leasing abzugeben.
            </p>
            
            <div className="overflow-x-auto rounded-xl border-2 border-red-600 shadow-lg">
              <table className="w-full bg-white text-left">
                <thead className="bg-red-600 text-white">
                  <tr>
                    <th className="p-4 md:p-6 font-bold text-base md:text-lg">Kostenart</th>
                    <th className="p-4 md:p-6 font-bold text-base md:text-lg">Kostenrahmen</th>
                    <th className="p-4 md:p-6 font-bold text-base md:text-lg">Anmerkung</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  <tr className="hover:bg-red-50 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Übernahmegebühr</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">CHF 150–500</td>
                    <td className="p-4 md:p-6 text-neutral-700">je nach Leasinggeber</td>
                  </tr>
                  <tr className="hover:bg-red-50 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Ummeldegebühr</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">CHF 50–150</td>
                    <td className="p-4 md:p-6 text-neutral-700">kantonal abhängig, klein</td>
                  </tr>
                  <tr className="hover:bg-red-50 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Bonitätsprüfung</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">Kostenlos</td>
                    <td className="p-4 md:p-6 text-neutral-700">meist inklusive</td>
                  </tr>
                  <tr className="hover:bg-red-50 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Service / Reifen</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">Variabel</td>
                    <td className="p-4 md:p-6 text-neutral-700">falls im Vertrag enthalten</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* SECTION 4 - Comparison */}
        <section className="py-16 px-4 bg-neutral-50">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <RefreshCw className="w-8 h-8 text-red-600" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Leasing Transfer vs. Leasingübernahme: Wo liegen die Unterschiede?
              </h2>
            </div>
            
            <div className="bg-white border-2 border-red-600 rounded-xl p-8 mb-6">
              <p className="text-lg text-neutral-700 mb-6">
                Obwohl beide Begriffe oft gleich benutzt werden, gibt es kleine Unterschiede:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-neutral-200 rounded-lg overflow-hidden mb-8">
                 <div className="p-6 bg-red-50 border-b md:border-b-0 md:border-r border-neutral-200">
                    <h3 className="font-bold text-red-900 text-xl mb-2">Leasing Transfer</h3>
                    <p className="text-neutral-700">Vollständige Übertragung eines bestehenden Leasingvertrags</p>
                 </div>
                 <div className="p-6 bg-neutral-50">
                    <h3 className="font-bold text-neutral-900 text-xl mb-2">Leasingübernahme</h3>
                    <p className="text-neutral-700">Der neue Fahrer übernimmt den Vertrag inkl. Konditionen & Pflichten (praktisch identisch)</p>
                 </div>
              </div>

              <div className="p-6 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-lg text-blue-900 font-medium text-center">
                  In der Schweiz werden beide Begriffe gleich verwendet. Für Google & Nutzer: <Link href="/leasinguebernahme" className="text-blue-700 underline font-bold">Leasingübernahme Schweiz</Link> ist der dominante Begriff.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5 - Advantages */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-neutral-900 mb-3">
                Vorteile eines Leasing Transfers
              </h2>
              <p className="text-lg text-neutral-600">
                Warum sich die Vertragsübertragung lohnt
              </p>
            </div>

            <div className="bg-neutral-50 p-8 rounded-3xl border border-neutral-200 shadow-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  "Schnell & unkompliziert",
                  "Keine teuren Vertragsstrafen",
                  "Bestehende Konditionen bleiben erhalten",
                  "Attraktiv für Übernehmer (tieferer Restwert)",
                  "Vertragsübergabe in wenigen Tagen möglich",
                  "Kürzere Laufzeit für den Neuen"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white p-4 rounded-xl border border-neutral-100 shadow-sm">
                    <div className="bg-green-100 p-2 rounded-full">
                      <Check className="w-5 h-5 text-green-700" />
                    </div>
                    <span className="font-medium text-neutral-800">{item}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 text-center border-t border-neutral-200 pt-6">
                <p className="text-lg text-neutral-700">
                  Leasing Transfer lohnt sich besonders, wenn du sofort aus dem Leasing raus willst, aber die Kosten einer Kündigung vermeiden möchtest.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 6 - Prerequisites */}
        <section className="py-16 px-4 bg-neutral-50">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <BadgeCheck className="w-8 h-8 text-red-600" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Voraussetzungen & Bonität
              </h2>
            </div>
            
            <div className="bg-white border-2 border-red-600 rounded-xl p-8">
              <p className="text-lg text-neutral-700 mb-6">
                Damit ein Leasing Transfer funktioniert, prüfen Schweizer Leasinggeber:
              </p>
              
              <div className="space-y-4">
                {[
                  { text: "Einkommen & Bonität des neuen Fahrers", icon: DollarSign },
                  { text: "Schulden & Betreibungen (ZEK-Auszug)", icon: FileText },
                  { text: "Stabilität des Einkommens", icon: TrendingDown },
                  { text: "Vertragskonformität des Fahrzeugs", icon: CheckCircle }
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

              <div className="mt-8 p-4 bg-red-50 border border-red-100 rounded-lg text-center">
                <p className="text-neutral-800">
                  Wenn der Übernehmer nicht genehmigt wird, kann der Leasing Transfer nicht durchgeführt werden. <Link href="/leasinguebernahme" className="font-semibold text-red-700 underline hover:text-red-800">Leasing übernehmen</Link> erfordert immer eine positive Bonitätsprüfung.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 7 - Providers */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-neutral-900 mb-4">
                Welche Anbieter erlauben Leasing Transfers?
              </h2>
              <p className="text-lg text-neutral-600">
                Fast alle grossen Schweizer Leasinggesellschaften unterstützen Leasing Transfers.
                Viele Anbieter haben dafür ein eigenes Formular oder einen Online-Prozess.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {[
                "AMAG Leasing", "Cembra Money Bank", "Santander", "MultiLease",
                "BANQUE PSA", "Emil Frey Leasing", "AXA Leasing", "Ford Credit"
              ].map((provider, i) => (
                <div key={i} className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl font-semibold text-neutral-800 hover:border-red-600 transition-colors cursor-default">
                  {provider}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 8 - FAQ */}
        <section className="py-16 px-4 bg-neutral-50">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-neutral-900 mb-3">
                FAQ: Leasing Transfer Schweiz
              </h2>
              <p className="text-neutral-600 text-lg">
                Häufige Fragen zur Vertragsübernahme
              </p>
            </div>
            
            <Accordion type="single" collapsible className="w-full space-y-4">
              <AccordionItem 
                value="item-1" 
                className="bg-white rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-red-600 transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Ist ein Leasing Transfer in der Schweiz legal?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Ja, ein Leasing Transfer ist in der Schweiz absolut legal und wird von den meisten grossen Leasinggesellschaften unterstützt. Es handelt sich um eine offizielle <Link href="/leasinguebernahme" className="text-red-600 underline">Leasingübernahme</Link> mit Genehmigung der Bank.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem 
                value="item-2" 
                className="bg-white rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-red-600 transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Wer trägt die Kosten beim Leasing Transfer?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Das ist Verhandlungssache. Die offiziellen Umschreibegebühren der Bank werden oft geteilt oder vom Abgeber übernommen, um das Angebot attraktiver zu machen.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem 
                value="item-3" 
                className="bg-white rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-red-600 transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Wie lange dauert ein Leasing Transfer?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Der Prozess dauert in der Regel zwischen 2 und 10 Werktagen, abhängig von der Geschwindigkeit der Bonitätsprüfung und der Ausstellung der neuen Vertragsdokumente.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem 
                value="item-4" 
                className="bg-white rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-red-600 transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Was passiert, wenn die Bonität des Übernehmers abgelehnt wird?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Wenn die Bank den neuen Leasingnehmer ablehnt, kann der Transfer nicht stattfinden. Der Vertrag bleibt beim ursprünglichen Leasingnehmer. Deswegen ist die Bonitätsprüfung beim <Link href="/leasinguebernahme" className="text-red-600 underline">Leasing übernehmen</Link> der wichtigste Schritt.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="item-5" 
                className="bg-white rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-red-600 transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Ist Leasing Transfer dasselbe wie Leasingübernahme?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Ja, praktisch gesehen meinen beide Begriffe das Gleiche: Die Übertragung eines bestehenden Vertrags auf eine neue Person.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="item-6" 
                className="bg-white rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-red-600 transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Kann jeder mein Leasing übernehmen?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Theoretisch ja, solange die Person in der Schweiz wohnhaft ist, einen gültigen Führerausweis besitzt und die Bonitätsprüfung der Bank besteht. Mehr zum <Link href="/leasinguebernahme" className="text-red-600 underline">Ablauf der Leasingübernahme</Link> findest du auf unserer Hauptseite.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* SECTION 9 - Final CTA Block */}
        <section className="py-20 bg-neutral-900 px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Bereit für einen Leasing Transfer?
            </h2>
            <p className="text-neutral-300 max-w-2xl mx-auto text-lg leading-relaxed">
              Ein Leasing Transfer ist einer der schnellsten Wege, dein Leasing legal abzugeben – oft innerhalb weniger Tage. Wenn du wissen möchtest, welche Option für dich die beste ist, erfährst du hier alle Details.
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

        {/* PREMIUM LISTINGS */}
        <PremiumListings />
        
      </main>
    </>
  );
}