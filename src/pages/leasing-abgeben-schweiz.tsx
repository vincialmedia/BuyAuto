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

export default function LeasingAbgebenSchweiz() {
  return (
    <>
      <Head>
        <title>Auto Leasing abgeben in der Schweiz – So wirst du deinen Vertrag stressfrei los | BuyAuto</title>
        <meta 
          name="description" 
          content="Leasing vorzeitig beenden ohne hohe Kosten? Erfahre, wie du dein Auto-Leasing in der Schweiz per Leasingübernahme abgeben kannst. Anleitung & Tipps." 
        />
        <link rel="canonical" href="https://www.buyauto.ch/leasing-abgeben-schweiz" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Auto Leasing abgeben in der Schweiz – So wirst du deinen Vertrag stressfrei los" />
        <meta property="og:description" content="Leasing vorzeitig beenden ohne hohe Kosten? Erfahre, wie du dein Auto-Leasing in der Schweiz per Leasingübernahme abgeben kannst." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://www.buyauto.ch/leasing-abgeben-schweiz" />
      </Head>

      <main className="bg-neutral-50 min-h-screen">
        
        {/* HERO SECTION - With Image Background */}
        <section className="relative min-h-[500px] md:min-h-[550px] flex items-center overflow-hidden pt-16">
          {/* Background Image */}
          <div className="absolute inset-0">
            <img 
              src="/20251209_0003_Handshake_in_Zurich_simple_compose_01kc036j1cff881r0wzwemf48h.png" 
              alt="Leasing abgeben Schweiz - Handshake" 
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
                  Leasing stressfrei beenden
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight mb-6">
                  Auto Leasing abgeben in der Schweiz
                </h1>
                <p className="text-xl md:text-2xl text-red-400 font-semibold mb-4">
                  So wirst du deinen Vertrag stressfrei los
                </p>
                <p className="text-lg text-neutral-200 leading-relaxed mb-8 max-w-2xl">
                  Leasing vorzeitig beenden ohne hohe Kosten? Erfahre, wie du dein Auto-Leasing in der Schweiz per Leasingübernahme abgeben kannst – mit praktischer Anleitung und wertvollen Tipps.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    asChild
                    size="lg"
                    className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30 transition-all duration-300 px-8 py-6 text-base font-semibold rounded-xl"
                  >
                    <Link href="/inserat-erstellen">
                      Jetzt Leasing abgeben
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-2 border-white text-white hover:bg-white hover:text-neutral-900 transition-all duration-300 px-8 py-6 text-base font-semibold rounded-xl bg-transparent"
                  >
                    <Link href="/suche">
                      Angebote durchsuchen
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* INTRO SECTION */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-neutral-900 mb-6">
                  Leasing klingt am Anfang immer simpel.
                </h2>
                <div className="bg-red-50 border-l-4 border-red-600 p-6 rounded-r-xl mb-6">
                  <p className="text-lg text-neutral-700 leading-relaxed mb-4">
                    Fixe Monatsrate, keine grossen Überraschungen, neues Auto, fertig. Doch manchmal passt der Vertrag plötzlich nicht mehr ins Leben. Vielleicht ist ein Baby unterwegs, die Kosten steigen, der Job hat sich geändert oder du willst einfach flexibler sein.
                  </p>
                  <p className="text-lg text-neutral-700 leading-relaxed italic font-semibold">
                    „Wie gebe ich mein Leasing ab, ohne Tausende Franken zu verlieren?"
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <CheckCircle className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-green-900 font-semibold mb-2">Die gute Nachricht:</p>
                      <p className="text-green-800">
                        Leasing abgeben ist möglich – und oft viel einfacher (und günstiger), als die Bank es dir glauben lässt. In diesem Guide zeigen wir dir Schritt für Schritt, wie du deinen Leasingvertrag in der Schweiz korrekt abgibst.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* WHY DO PEOPLE WANT TO CANCEL - REASONS GRID */}
        <section className="py-16 px-4 bg-neutral-50">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <Users className="w-8 h-8 text-red-600" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Warum wollen so viele ihr Auto-Leasing abgeben?
              </h2>
            </div>

            <p className="text-lg text-neutral-600 mb-8">
              In der Schweiz werden jedes Jahr Tausende Leasingverträge abgeschlossen – und genauso viele Menschen wollen sie plötzlich wieder loswerden. Die Gründe sind fast immer nachvollziehbar:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  icon: Users,
                  title: "Lebensumstände ändern sich",
                  items: ["Familienzuwachs", "Kündigung / Jobwechsel", "Umzug in die Stadt (kein Parkplatz)", "Weniger Pendeln, Home Office, ÖV"]
                },
                {
                  icon: DollarSign,
                  title: "Das Leasing wird zu teuer",
                  items: ["Monatsrate + Versicherung + Unterhalt + Reifen + Service…", "Bei vielen summiert sich das schneller als geplant"]
                },
                {
                  icon: AlertTriangle,
                  title: "Kilometerangst & Rückgabestress",
                  items: ["Mehrkilometer?", "Rückgabeschäden?", "Aufbereitungsgebühren?", "Viele merken erst später, welche Risiken im Vertrag lauern"]
                },
                {
                  icon: Clock,
                  title: "Wunsch nach Flexibilität",
                  items: ["Carsharing, Auto-Abo, ÖV – alles wird flexibler", "Ein starrer 36- oder 48-Monatsvertrag fühlt sich wie ein Klotz am Bein an"]
                }
              ].map((item, i) => {
                const IconComponent = item.icon;
                return (
                  <div key={i} className="bg-white border border-neutral-200 p-6 rounded-xl hover:border-red-600 transition-colors">
                    <div className="flex items-center gap-3 mb-4">
                      <IconComponent className="w-6 h-6 text-red-600" />
                      <h3 className="text-xl font-bold text-neutral-900">{item.title}</h3>
                    </div>
                    <ul className="space-y-2">
                      {item.items.map((listItem, j) => (
                        <li key={j} className="flex items-start gap-2 text-neutral-600">
                          <span className="text-red-600 mt-1">•</span>
                          <span>{listItem}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 text-center">
              <p className="text-lg text-neutral-700 font-medium">
                Wenn du dich hier wiedererkennst: du bist nicht allein.
              </p>
            </div>
          </div>
        </section>

        {/* THE PROBLEM: CANCELING IS EXPENSIVE */}
        <section className="py-16 px-4 bg-neutral-900 text-white">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <h2 className="text-3xl font-bold">
                Leasing „einfach kündigen"? In der Schweiz fast unmöglich
              </h2>
            </div>
            
            <div className="space-y-6">
              <Card className="bg-neutral-800 border-neutral-700">
                <CardContent className="p-8">
                  <p className="text-xl text-neutral-200 leading-relaxed mb-6">
                    Das ist der grosse Schockmoment für viele: Du kannst ein Auto-Leasing <strong>nicht einfach kündigen</strong>, wie ein Handy-Abo.
                  </p>
                  
                  <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 mb-6">
                    <h3 className="font-bold text-white text-lg mb-4">Warum?</h3>
                    <ul className="space-y-3">
                      {[
                        "Leasing ist kein Mietvertrag, sondern ein Finanzierungsvertrag",
                        "Die Leasingfirma hat das Auto für dich gekauft und verdient an deiner monatlichen Rate",
                        "Wenn du früh raus willst, musst du fast immer Restwert, Zinsen, Abschreibung und Gebühren zahlen"
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                          <span className="text-neutral-300">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-6">
                    <p className="text-lg font-semibold text-red-300 mb-2">Ergebnis:</p>
                    <p className="text-xl text-white font-bold">
                      Eine Kündigung kostet in vielen Fällen mehrere Tausend Franken – manchmal sogar mehr, als das Auto aktuell wert ist.
                    </p>
                  </div>

                  <p className="text-neutral-300 mt-6">
                    Deshalb suchen Leute nach einer Lösung, die weniger Geld frisst – wie eine{" "}
                    <Link href="/leasinguebernahme" className="text-red-400 hover:text-red-300 font-semibold underline">
                      Leasingübernahme
                    </Link>.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* THE SOLUTION: LEASINGÜBERNAHME */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <RefreshCw className="w-8 h-8 text-red-600" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Die beste Alternative: Leasing abgeben per Leasingübernahme
              </h2>
            </div>
            
            <div className="bg-white border-2 border-red-600 rounded-xl p-8 mb-8">
              <p className="text-xl text-neutral-700 leading-relaxed mb-6">
                Anstatt teuer zu kündigen, kannst du deinen Leasingvertrag einfach an eine andere Person übertragen.
              </p>
              
              <div className="bg-neutral-50 rounded-xl p-6 mb-6">
                <h3 className="font-bold text-neutral-900 text-lg mb-4">Das heisst:</h3>
                <ul className="space-y-3">
                  {[
                    "Jemand übernimmt deine restliche Laufzeit",
                    "Er oder sie zahlt ab sofort die Monatsrate",
                    "Du bist raus aus dem Vertrag"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                      <span className="text-neutral-700 font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-lg text-neutral-700 leading-relaxed">
                Das ist die sogenannte <strong>Leasingübernahme</strong> – und für viele die einzige günstige Möglichkeit, sauber aus dem Vertrag zu kommen. Wenn du erfahren willst, wie das genau funktioniert, schau dir unbedingt unsere Seite zur{" "}
                <Link href="/leasinguebernahme" className="text-red-600 hover:text-red-700 font-semibold underline">
                  Leasingübernahme Schweiz
                </Link>{" "}
                an.
              </p>
            </div>

            {/* Advantages vs Disadvantages */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Advantages */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <h3 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-6 h-6" />
                  Die Vorteile einer Leasingübernahme
                </h3>
                <ul className="space-y-3">
                  {[
                    "Du zahlst keine horrenden Kündigungsgebühren",
                    "Du wirst Fixkosten sofort los",
                    "Keine Rückgabe, keine Aufbereitungskosten",
                    "Keine Mehrkilometer-Abrechnung",
                    "Vertrag läuft einfach weiter – du bist raus",
                    "Schneller Prozess (1–3 Tage)"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-green-800">
                      <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                      <span className="font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Disadvantages */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <h3 className="text-xl font-bold text-yellow-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-6 h-6" />
                  Die Nachteile
                </h3>
                <ul className="space-y-3">
                  {[
                    "Die Leasingfirma muss zustimmen",
                    "Der Übernehmer braucht eine positive Bonität",
                    "Bei sehr exotischen Modellen kann es länger dauern"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-yellow-800">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                      <span className="font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="mt-6 pt-6 border-t border-yellow-200">
                  <p className="text-yellow-900 font-semibold">
                    In 90% der Schweizer Fälle ist eine{" "}
                    <Link href="/leasinguebernahme" className="text-yellow-900 underline hover:text-yellow-800">
                      Leasingübernahme
                    </Link>{" "}
                    aber die klar beste Lösung.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STEP-BY-STEP GUIDE */}
        <section className="py-16 px-4 bg-neutral-50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <ChevronRight className="w-8 h-8 text-red-600" />
                <h2 className="text-3xl font-bold text-neutral-900">
                  Schritt-für-Schritt: Wie gibst du dein Auto-Leasing in der Schweiz ab?
                </h2>
              </div>
              <p className="text-lg text-neutral-600">
                Hier kommt die Anleitung, nach der die Banken nie gefragt werden – aber die du brauchst.
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
                    title: "Leasingvertrag prüfen",
                    desc: "Notiere dir:",
                    items: [
                      "Restlaufzeit",
                      "Monatsrate",
                      "Freikilometer",
                      "Über-Kilometerkosten",
                      "Zustand / Schäden",
                      "Leasinggesellschaft (z. B. Cembra, AMAG, MultiLease, Santander)"
                    ],
                    icon: FileCheck
                  },
                  {
                    step: 2,
                    title: "Inserat erstellen",
                    desc: "Ohne Inserat findest du niemanden, der übernehmen will. Ein gutes Inserat braucht:",
                    items: [
                      "Klare Fotos",
                      "Die wichtigsten Vertragsdaten",
                      "Monatliche Kosten",
                      "Optionale Extras (Allrad, Leder, Assistenzsysteme)"
                    ],
                    note: "Wenn du dein Leasing lieber direkt übertragen möchtest, erfährst du hier, wie das funktioniert: Leasingübernahme Schweiz.",
                    icon: FileText
                  },
                  {
                    step: 3,
                    title: "Interessenten finden",
                    desc: "Der wichtigste Schritt. Viele Plattformen sind langsam oder umständlich – deswegen haben wir BuyAuto gebaut: schlank, schnell, ohne mühsame Prozesse.",
                    items: [],
                    icon: Search
                  },
                  {
                    step: 4,
                    title: "Bonität prüfen lassen",
                    desc: "Die Banken prüfen den Übernehmer:",
                    items: [
                      "Einkommen",
                      "Wohnsitz",
                      "Betreibungsregister",
                      "Ausgaben"
                    ],
                    note: "Wenn's passt → Vertrag wird übertragen.",
                    icon: ShieldCheck
                  },
                  {
                    step: 5,
                    title: "Vertrag unterschreiben & Schlüssel übergeben",
                    desc: "Nach Zustimmung der Bank:",
                    items: [
                      "Du unterschreibst die Abtretung",
                      "Neue Person unterschreibst die Übernahme",
                      "Ihr macht ein Übergabeprotokoll",
                      "Schlüssel übergeben → fertig"
                    ],
                    note: "Dauer: 1–3 Tage in der Regel.",
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
                        
                        {item.note && (
                          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm text-blue-900 font-medium flex items-start gap-2">
                              <Info className="w-4 h-4 mt-0.5 shrink-0" />
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
          </div>
        </section>

        {/* COSTS SECTION */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <DollarSign className="w-8 h-8 text-red-600" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Welche Kosten fallen an, wenn man ein Leasing abgibt?
              </h2>
            </div>
            
            <p className="text-lg text-neutral-600 mb-8">
              Gute Frage – denn hier steckt der grösste Mythos drin: <strong>Viele glauben: „Leasing abgeben kostet ein Vermögen."</strong> Stimmt nicht.
            </p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Cancellation Costs */}
              <div className="bg-red-50 border-2 border-red-600 rounded-xl p-6">
                <h3 className="text-xl font-bold text-red-900 mb-4 flex items-center gap-2">
                  <XCircle className="w-6 h-6" />
                  Kosten beim Abgeben (ohne Übernahme)
                </h3>
                <ul className="space-y-3 mb-6">
                  {[
                    "Rückgabegebühren",
                    "Aufbereitung (oft 500–1'500 CHF)",
                    "Mehrkilometer",
                    "Restwert-Differenz",
                    "Abschreibung"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="text-red-600 mt-1">•</span>
                      <span className="text-red-800 font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="bg-white rounded-lg p-4 border border-red-200">
                  <p className="text-sm text-red-700 font-semibold mb-1">Total:</p>
                  <p className="text-2xl font-bold text-red-900">oft 2'000 – 8'000 CHF</p>
                </div>
              </div>

              {/* Transfer Costs */}
              <div className="bg-green-50 border-2 border-green-600 rounded-xl p-6">
                <h3 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-6 h-6" />
                  Kosten bei einer Leasingübernahme
                </h3>
                <ul className="space-y-3 mb-6">
                  {[
                    "In der Regel 0 – 500 CHF für Administrationsgebühren",
                    "Manchmal übernimmt der neue Fahrer sogar die Gebühr"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                      <span className="text-green-800 font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <p className="text-sm text-green-700 font-semibold mb-1">Total:</p>
                  <p className="text-2xl font-bold text-green-900">0 – 500 CHF</p>
                </div>
                
                <div className="mt-6 pt-6 border-t border-green-200">
                  <p className="text-green-900 text-sm">
                    Die komplette Info findest du hier:{" "}
                    <Link href="/leasinguebernahme" className="font-semibold underline hover:text-green-800">
                      Leasingübernahme Schweiz
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* COMPARISON SECTION */}
        <section className="py-16 px-4 bg-neutral-50">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Leasing abgeben oder Leasingübernahme – was lohnt sich wirklich?
              </h2>
            </div>
            
            <p className="text-lg text-neutral-600 mb-8">
              Hier kommt die ehrliche Antwort:
            </p>

            <div className="space-y-6">
              {/* Cancel Option */}
              <div className="bg-white border border-neutral-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <XCircle className="w-8 h-8 text-red-600 shrink-0 mt-1" />
                  <div>
                    <h3 className="text-2xl font-bold text-neutral-900 mb-3">Leasing kündigen</h3>
                    <p className="text-neutral-700 mb-4">Nur sinnvoll, wenn:</p>
                    <ul className="space-y-2">
                      {[
                        "Das Auto komplett zerstört wurde",
                        "Das Leasing extrem kurz ist (1–3 Monate Restlaufzeit)"
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-red-600 mt-1">•</span>
                          <span className="text-neutral-600">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Transfer Option */}
              <div className="bg-white border-2 border-red-600 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-8 h-8 text-green-600 shrink-0 mt-1" />
                  <div>
                    <h3 className="text-2xl font-bold text-neutral-900 mb-3">Leasingübernahme</h3>
                    <p className="text-neutral-700 mb-4">Sinnvoll, wenn:</p>
                    <ul className="space-y-2">
                      {[
                        "Du Kosten sofort loswerden willst",
                        "Du keine teuren Rückgabegebühren zahlen willst",
                        "Du mehr Kilometer gefahren bist als erlaubt",
                        "Du schnell eine Lösung brauchst"
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                          <span className="text-neutral-600">{item}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 pt-4 border-t border-neutral-200">
                      <p className="text-neutral-700">
                        Mehr Infos über den Prozess findest du in unserem vollständigen Guide zur{" "}
                        <Link href="/leasinguebernahme" className="text-red-600 hover:text-red-700 font-semibold underline">
                          Leasingübernahme
                        </Link>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Auto Abo Option */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <RefreshCw className="w-8 h-8 text-blue-600 shrink-0 mt-1" />
                  <div>
                    <h3 className="text-2xl font-bold text-neutral-900 mb-3">Auto-Abo als neue Lösung</h3>
                    <p className="text-neutral-700 mb-4">Wenn du nach dem Abgeben flexibel bleiben willst:</p>
                    <ul className="space-y-2">
                      {[
                        "Monatlich kündbar",
                        "Keine Rückgabe-Angst",
                        "Versicherung & Service inklusive"
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                          <span className="text-blue-800 font-medium">{item}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-blue-800 text-sm mt-4">
                      Viele steigen nach dem Leasing-Ausstieg auf ein Auto Abo um.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-neutral-900 mb-3">
                FAQ – Häufige Fragen zum Leasing abgeben in der Schweiz
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
                  Kann ich mein Auto-Leasing jederzeit abgeben?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Ja. Die Abgabe via Leasingübernahme ist fast immer möglich, solange der Übernehmer kreditwürdig ist.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem 
                value="item-2" 
                className="bg-neutral-50 rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-red-600 transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Was kostet es, mein Leasing abzugeben?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Mit Leasingübernahme meist 0–500 CHF. Ohne Übernahme kann es schnell mehrere Tausend kosten.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem 
                value="item-3" 
                className="bg-neutral-50 rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-red-600 transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Kann jeder mein Leasing übernehmen?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Nein. Die Leasingfirma prüft Bonität, Einkommen und Betreibungen.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem 
                value="item-4" 
                className="bg-neutral-50 rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-red-600 transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Wie lange dauert die Übergabe?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  1–3 Tage bei motivierten Parteien. 10 Tage, wenn die Bank langsam arbeitet.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="item-5" 
                className="bg-neutral-50 rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-red-600 transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Werden Schäden oder Mehrkilometer verrechnet?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Bei Übernahme: Nein. Diese Themen werden erst bei Vertragsende relevant – das übernimmt der neue Fahrer.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="item-6" 
                className="bg-neutral-50 rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-red-600 transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Muss ich das Auto zurückgeben?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Nein – es wird nicht zurückgegeben, sondern übertragen.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
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

        {/* FINAL CTA */}
        <section className="py-20 bg-neutral-900 px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Fazit: Leasing abgeben ist in der Schweiz einfacher als du denkst
            </h2>
            <p className="text-neutral-300 max-w-2xl mx-auto text-lg leading-relaxed">
              Die Banken wollen oft, dass du denkst, kündigen wäre die einzige Lösung. Ist es nicht. Die clevere, günstige und schnellste Option ist fast immer: <strong className="text-white">Leasingübernahme</strong>.
            </p>
            <p className="text-neutral-300 text-lg">
              Und genau dafür gibt's BuyAuto.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <Button asChild size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg shadow-red-600/30 transition-all">
                <Link href="/inserat-erstellen">
                  Jetzt Leasing kostenlos inserieren
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
                  Leasingübernahme verstehen
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