import Head from "next/head";
import Link from "next/link";
import { Check, ChevronRight, AlertCircle, FileText, Info, ShieldCheck, Clock, Users, BadgeCheck, MapPin, Calendar, DollarSign, FileCheck, Search, ArrowRight, RefreshCw, UserCheck, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
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

export default function LeasingTransferPage() {
  return (
    <>
      <Head>
        <title>Leasing Transfer Schweiz – So überträgst du deinen Leasingvertrag korrekt | BuyAuto</title>
        <meta
          name="description"
          content="Ein klar strukturierter Leitfaden für alle, die einen bestehenden Leasingvertrag übertragen möchten. Transparent, sachlich und Schritt für Schritt erklärt."
        />
        <link rel="canonical" href="https://www.buyauto.ch/leasing-transfer" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Leasing Transfer Schweiz – So überträgst du deinen Leasingvertrag korrekt" />
        <meta property="og:description" content="Ein klar strukturierter Leitfaden für die Übertragung deines Leasingvertrags. Transparent, sachlich und Schritt für Schritt erklärt." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://www.buyauto.ch/leasing-transfer" />
      </Head>

      <main className="bg-white min-h-screen">
        
        {/* HERO SECTION - Minimalist Professional Style */}
        <section className="bg-gradient-to-b from-neutral-100 to-white pt-16 pb-12 md:pt-24 md:pb-16 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center space-y-6 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-neutral-900 text-white px-5 py-2 rounded-full text-sm font-medium">
                <FileCheck className="w-4 h-4" />
                Vertragsübertragung
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-900 tracking-tight leading-tight">
                Leasing Transfer in der Schweiz
              </h1>
              <p className="text-xl md:text-2xl text-neutral-600 font-medium">
                So überträgst du deinen Leasingvertrag korrekt
              </p>
              <p className="text-lg text-neutral-600 leading-relaxed max-w-2xl mx-auto">
                Ein klar strukturierter Leitfaden für alle, die einen bestehenden Leasingvertrag übertragen möchten. Transparent, sachlich und Schritt für Schritt erklärt.
              </p>
              
              <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  asChild
                  size="lg"
                  className="bg-neutral-900 hover:bg-neutral-800 text-white shadow-lg transition-all duration-300 px-8 py-6 text-base font-semibold rounded-lg"
                >
                  <Link href="/inserat-erstellen">
                    Leasing Transfer starten
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-2 border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white transition-all duration-300 px-8 py-6 text-base font-semibold rounded-lg"
                >
                  <Link href="/suche">
                    Angebote durchsuchen
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* DEFINITION SECTION */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-neutral-900 mb-6">
                  Was bedeutet ein Leasing Transfer?
                </h2>
                <div className="bg-neutral-50 border-l-4 border-neutral-900 p-6 rounded-r-xl">
                  <p className="text-lg text-neutral-700 leading-relaxed mb-4">
                    Ein <strong>Leasing Transfer</strong> beschreibt die Übertragung eines bestehenden Leasingvertrags von einer Person oder Firma auf eine neue Vertragspartei.
                  </p>
                  <p className="text-lg text-neutral-700 leading-relaxed">
                    Der bestehende Vertrag bleibt dabei unverändert – lediglich der Vertragspartner ändert sich.
                  </p>
                </div>
              </div>

              {/* Typical Reasons - Grid Layout */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-neutral-900">
                  Typische Gründe für einen Leasing Transfer:
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { icon: MapPin, text: "Umzug ins Ausland oder Kantonswechsel" },
                    { icon: DollarSign, text: "Finanzielle Veränderungen" },
                    { icon: Users, text: "Firmenfahrzeug wird nicht mehr benötigt" },
                    { icon: RefreshCw, text: "Familien- oder Lebenssituation hat sich geändert" },
                    { icon: Search, text: "Wunsch nach einem anderen Fahrzeug" },
                    { icon: AlertCircle, text: "Vermeidung von hohen Ausstiegskosten" }
                  ].map((item, i) => {
                    const IconComponent = item.icon;
                    return (
                      <div key={i} className="flex items-start gap-3 bg-white border border-neutral-200 p-4 rounded-lg hover:border-neutral-900 transition-colors">
                        <div className="mt-0.5">
                          <IconComponent className="w-5 h-5 text-neutral-900" />
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

        {/* WHEN DOES IT MAKE SENSE */}
        <section className="py-16 px-4 bg-neutral-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-neutral-900 mb-8">
              Wann macht ein Leasing Transfer Sinn?
            </h2>
            <div className="bg-white border border-neutral-200 rounded-xl p-8">
              <p className="text-lg text-neutral-700 mb-6">
                Ein Leasing Transfer ist besonders sinnvoll, wenn:
              </p>
              <div className="space-y-4">
                {[
                  "du dein Auto schneller und günstiger loswerden möchtest",
                  "jemand anderes bessere Konditionen nutzen möchte",
                  "du deine monatliche Belastung reduzieren musst",
                  "der Vertrag noch lange läuft und eine Kündigung teuer wäre",
                  "du ein Fahrzeug kurzfristig abgeben musst (z. B. Jobwechsel, Auslandjahr)"
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-1">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="text-neutral-700 text-lg">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Link to Leasing Abgeben */}
            <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <Info className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-blue-900 font-medium mb-2">
                    Möchtest du deinen Leasingvertrag abgeben?
                  </p>
                  <Link 
                    href="/leasing-abgeben-schweiz" 
                    className="text-blue-700 hover:text-blue-800 font-semibold underline inline-flex items-center gap-2 transition-colors"
                  >
                    Praktischer Leitfaden zum Leasing abgeben
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PROCESS TIMELINE */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-neutral-900 mb-4">
                Ablauf eines Leasing Transfers
              </h2>
              <p className="text-lg text-neutral-600">
                Schritt für Schritt zum erfolgreichen Transfer
              </p>
            </div>

            {/* Timeline Design */}
            <div className="relative">
              {/* Vertical Line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-neutral-200 hidden md:block"></div>
              
              <div className="space-y-8">
                {[
                  {
                    step: 1,
                    title: "Vertragsprüfung",
                    desc: "Überprüfe die wichtigsten Vertragsdaten",
                    items: [
                      "Restlaufzeit",
                      "Monatliche Leasingrate",
                      "Anzahlung / Vorauszahlung",
                      "Kilometerlimit & Mehrkilometerkosten",
                      "Service- und Reifenpakete",
                      "Zustand des Fahrzeugs"
                    ],
                    icon: FileCheck
                  },
                  {
                    step: 2,
                    title: "Übernehmer finden",
                    desc: "Das kann eine Privatperson, ein Unternehmen oder eine Leasing-Community sein. Ein Inserat beschleunigt den Prozess erheblich.",
                    items: [],
                    icon: Users
                  },
                  {
                    step: 3,
                    title: "Bonitätsprüfung des neuen Vertragspartners",
                    desc: "Die Leasingbank prüft:",
                    items: [
                      "Einkommen",
                      "Budget",
                      "ZEK-Einträge",
                      "Allgemeine Kreditwürdigkeit"
                    ],
                    note: "Ohne positive Prüfung ist ein Transfer nicht möglich.",
                    icon: ShieldCheck
                  },
                  {
                    step: 4,
                    title: "Bankgenehmigung & Vertragsübertragung",
                    desc: "Nach Freigabe erstellt die Bank neue Vertragsunterlagen. Der Vertrag bleibt inhaltlich identisch – nur der Name ändert sich.",
                    items: [],
                    icon: BadgeCheck
                  },
                  {
                    step: 5,
                    title: "Fahrzeug- und Dokumentenübergabe",
                    desc: "Nach Vertragsübertragung:",
                    items: [
                      "Fahrzeugzustand dokumentieren",
                      "Kilometerstand notieren",
                      "Fahrzeugausweis übergeben",
                      "Schlüssel übergeben"
                    ],
                    icon: Check
                  }
                ].map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <div key={item.step} className="relative flex gap-6 md:gap-8">
                      {/* Step Number Circle */}
                      <div className="flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-full bg-neutral-900 text-white flex flex-col items-center justify-center font-bold border-4 border-white shadow-lg z-10">
                        <span className="text-2xl">{item.step}</span>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl p-6 md:p-8">
                        <div className="flex items-start gap-3 mb-3">
                          <IconComponent className="w-6 h-6 text-neutral-900 mt-1" />
                          <h3 className="text-xl md:text-2xl font-bold text-neutral-900">{item.title}</h3>
                        </div>
                        <p className="text-neutral-700 mb-4">{item.desc}</p>
                        
                        {item.items.length > 0 && (
                          <ul className="space-y-2 ml-4">
                            {item.items.map((listItem, i) => (
                              <li key={i} className="flex items-start gap-2 text-neutral-600">
                                <span className="text-neutral-400 mt-1">•</span>
                                <span>{listItem}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        
                        {item.note && (
                          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <p className="text-sm text-yellow-900 font-medium flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                              {item.note}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="text-center mt-12">
              <Button
                asChild
                size="lg"
                className="bg-neutral-900 hover:bg-neutral-800 text-white shadow-lg transition-all duration-300 px-8 py-6 text-base font-semibold rounded-lg"
              >
                <Link href="/inserat-erstellen">
                  Jetzt Leasing Transfer durchführen
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* PREREQUISITES CHECKLIST */}
        <section className="py-16 px-4 bg-neutral-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-neutral-900 mb-8">
              Voraussetzungen für einen Leasing Transfer
            </h2>
            
            <div className="bg-white border-2 border-neutral-900 rounded-xl p-8">
              <div className="space-y-4">
                {[
                  { text: "Zustimmung der Leasingbank", required: true },
                  { text: "Positive Bonität des neuen Vertragspartners", required: true },
                  { text: "Keine offenen Rechnungen oder Mahnungen", required: true },
                  { text: "Fahrzeug in ordentlichem Zustand", required: true },
                  { text: "Vertrag erlaubt die Übertragung", required: true },
                  { text: "Beide Parteien stimmen der Übertragung zu", required: true }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 rounded border-2 border-neutral-900 flex items-center justify-center">
                        <Check className="w-4 h-4 text-neutral-900" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-neutral-900 font-medium text-lg">{item.text}</p>
                      {item.required && (
                        <p className="text-sm text-neutral-500 mt-1">Erforderlich</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* COSTS TABLE */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-neutral-900 mb-8">
              Kosten eines Leasing Transfers
            </h2>
            
            <div className="overflow-x-auto rounded-xl border-2 border-neutral-900 shadow-lg">
              <table className="w-full bg-white text-left">
                <thead className="bg-neutral-900 text-white">
                  <tr>
                    <th className="p-4 md:p-6 font-bold text-base md:text-lg">Kostenart</th>
                    <th className="p-4 md:p-6 font-bold text-base md:text-lg">Typische Kosten</th>
                    <th className="p-4 md:p-6 font-bold text-base md:text-lg">Wer zahlt?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  <tr className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Transfer-/Übernahmegebühr</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">100–400 CHF</td>
                    <td className="p-4 md:p-6 text-neutral-700">Abgeber oder Übernehmer</td>
                  </tr>
                  <tr className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Händler-/Wechselgebühr</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">100–250 CHF</td>
                    <td className="p-4 md:p-6 text-neutral-700">Optional</td>
                  </tr>
                  <tr className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Ummeldung / Kontrollschilder</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">50–150 CHF</td>
                    <td className="p-4 md:p-6 text-neutral-700">Übernehmer</td>
                  </tr>
                  <tr className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Versicherung / laufende Kosten</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">individuell</td>
                    <td className="p-4 md:p-6 text-neutral-700">Übernehmer</td>
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
                    Viele Abgeber übernehmen die Transfergebühren, um den Prozess zu beschleunigen.
                  </p>
                </div>
              </div>
            </div>

            {/* Link to Costs Page */}
            <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <Info className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-blue-900 font-medium mb-2">
                    Detaillierte Kostenübersicht gewünscht?
                  </p>
                  <Link 
                    href="/leasinguebernahme" 
                    className="text-blue-700 hover:text-blue-800 font-semibold underline inline-flex items-center gap-2 transition-colors"
                  >
                    Alle Kosten einer Leasingübernahme
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* LEGAL NOTES - UNIQUE SECTION */}
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
                        text: "Eigentümer des Fahrzeugs bleibt immer die Leasingbank.",
                        icon: ShieldCheck
                      },
                      {
                        title: "Anzahlung",
                        text: "Die Anzahlung wird nicht ausgezahlt oder zurückerstattet.",
                        icon: DollarSign
                      },
                      {
                        title: "Vertragskonditionen",
                        text: "Der Vertrag bleibt unverändert – Laufzeit, Kilometerlimit und Konditionen bleiben bestehen.",
                        icon: FileText
                      },
                      {
                        title: "Bankentscheidung",
                        text: "Die Bank hat immer das letzte Wort und kann Transfers ablehnen.",
                        icon: XCircle
                      },
                      {
                        title: "Übergabeprotokoll",
                        text: "Ein Übergabeprotokoll wird dringend empfohlen.",
                        icon: FileCheck
                      },
                      {
                        title: "Schadensdokumentation",
                        text: "Schäden müssen klar dokumentiert werden, bevor der Transfer abgeschlossen wird.",
                        icon: AlertCircle
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

        {/* SEARCH SECTION */}
        <section id="search-section" className="py-16 px-4 bg-neutral-50">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border-2 border-neutral-900 p-6 md:p-10">
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-3">
                  Leasing-Angebote durchsuchen
                </h2>
                <p className="text-neutral-600 text-base md:text-lg">
                  Finde passende Leasingübernahmen oder erstelle dein eigenes Inserat.
                </p>
              </div>
              <SearchForm />
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-neutral-900 mb-3">
                Häufige Fragen zum Leasing Transfer
              </h2>
              <p className="text-neutral-600 text-lg">
                Die wichtigsten Antworten auf einen Blick
              </p>
            </div>
            
            <Accordion type="single" collapsible className="w-full space-y-4">
              <AccordionItem 
                value="item-1" 
                className="bg-neutral-50 rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-neutral-900 transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Kann jeder einen Leasingvertrag übertragen?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Ja, fast alle Leasingverträge in der Schweiz erlauben einen Transfer – solange die Bank zustimmt.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem 
                value="item-2" 
                className="bg-neutral-50 rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-neutral-900 transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Wie lange dauert der Leasing Transfer?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  In der Regel 2–5 Werktage, abhängig von der Bonitätsprüfung und der Bearbeitungszeit der Bank.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem 
                value="item-3" 
                className="bg-neutral-50 rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-neutral-900 transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Was passiert mit der Anzahlung?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Die Anzahlung bleibt Bestandteil des Vertrags. Sie wird nicht ausbezahlt, sondern reduziert indirekt die Monatsrate des Übernehmers.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem 
                value="item-4" 
                className="bg-neutral-50 rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-neutral-900 transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Kann die Bank den Transfer ablehnen?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Ja – meist aufgrund ungenügender Bonität des Übernehmers oder offener Beträge beim Abgeber.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="item-5" 
                className="bg-neutral-50 rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-neutral-900 transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Welche Unterlagen braucht man?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Identitätsnachweis, aktueller Vertrag, Fahrzeugausweis, Serviceheft und allfällige Rechnungen.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-20 bg-neutral-900 px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Leasing Transfer schnell & unkompliziert durchführen
            </h2>
            <p className="text-neutral-300 max-w-2xl mx-auto text-lg leading-relaxed">
              Erstelle dein Inserat oder finde passende Übernehmer. Der Transferprozess ist einfacher, als viele denken.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <Button asChild size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-semibold bg-white hover:bg-neutral-100 text-neutral-900 rounded-lg transition-all">
                <Link href="/inserat-erstellen">
                  Leasing Transfer starten
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg font-semibold border-2 border-white text-white hover:bg-white hover:text-neutral-900 rounded-lg bg-transparent transition-all">
                <Link href="/suche">
                  <Search className="w-5 h-5 mr-2" />
                  Angebote durchsuchen
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