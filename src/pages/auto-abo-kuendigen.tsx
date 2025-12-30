import Head from "next/head";
import Link from "next/link";
import { 
  Check, 
  AlertTriangle, 
  FileText, 
  Info, 
  Calendar, 
  Clock, 
  ArrowRight, 
  Mail, 
  ShieldCheck, 
  AlertCircle,
  ChevronRight,
  Copy,
  TrendingDown,
  FileCheck,
  Search,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Image from "next/image";

interface PageProps {
  updatedDate: string;
}

export async function getStaticProps() {
  // Fix date at build time to prevent hydration mismatch
  // Use manual formatting to ensure absolute consistency
  const now = new Date();
  const day = now.getDate().toString().padStart(2, '0');
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const year = now.getFullYear();
  const updatedDate = `${day}.${month}.${year}`;
  
  return {
    props: {
      updatedDate,
    },
    // Revalidate once per day to keep date current
    revalidate: 86400,
  };
}

export default function AutoAboKuendigenPage({ updatedDate }: PageProps) {
  // FAQ Schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Verlängert sich das Auto-Abo automatisch?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Ja, bei fast allen Anbietern in der Schweiz verlängert sich das Abo nach Ablauf der Mindestlaufzeit automatisch um jeweils einen weiteren Monat, wenn nicht fristgerecht gekündigt wird."
        }
      },
      {
        "@type": "Question",
        "name": "Kann ich das Auto-Abo während der Mindestlaufzeit kündigen?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Grundsätzlich nein. Eine vorzeitige Kündigung ist meist nur gegen eine hohe Gebühr (Early Termination Fee) möglich, die oft 50% bis 100% der ausstehenden Raten beträgt. Prüfe im Zweifel die AGB deines Anbieters."
        }
      },
      {
        "@type": "Question",
        "name": "Was kostet eine vorzeitige Kündigung ungefähr?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Das variiert stark. Einige Anbieter verlangen pauschal 2–3 Monatsraten, andere berechnen die Differenz zum Tarif der kürzeren Laufzeit nach. Es ist fast immer günstiger, das Abo regulär auslaufen zu lassen oder einen Fahrzeugwechsel anzufragen."
        }
      },
      {
        "@type": "Question",
        "name": "Was muss ich bei der Rückgabe beachten?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Das Auto muss sauber (innen & aussen) und vollgetankt/geladen sein. Alle Zubehörteile (Ladekabel, Zweitschlüssel, Hutablage) müssen vorhanden sein. Schäden sollten vorab gemeldet werden. Bestehe auf ein Übergabeprotokoll."
        }
      },
      {
        "@type": "Question",
        "name": "Wie funktioniert die Kilometer-Abrechnung am Ende?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Die meisten Anbieter rechnen die Kilometer über die gesamte Laufzeit ab. Wenn du in einem Monat mehr und im anderen weniger fährst, gleicht sich das aus. Nur am Ende der Gesamtzeit werden Mehrkilometer berechnet. Bei vorzeitiger Rückgabe wird oft anteilig (pro rata) gerechnet."
        }
      },
      {
        "@type": "Question",
        "name": "Muss ich die Versicherung separat kündigen?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Nein. Im Auto-Abo ist die Versicherung inklusive und läuft über den Anbieter. Mit der Kündigung des Abos endet automatisch auch der Versicherungsschutz für das Fahrzeug."
        }
      }
    ]
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <Head>
        <title>Auto-Abo kündigen (Schweiz): Fristen, Kosten & Rückgabe-Checkliste | BuyAuto</title>
        <meta
          name="description"
          content="So kündigst du dein Auto-Abo richtig: Mindestlaufzeit, Kündigungsfristen je Anbieter, vorzeitige Kündigung, Kilometer-Abrechnung & Rückgabe-Checkliste."
        />
        <link rel="canonical" href="https://www.buyauto.ch/auto-abo-kuendigen" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Auto-Abo kündigen (Schweiz): Fristen, Kosten & Rückgabe-Checkliste" />
        <meta property="og:description" content="So kündigst du dein Auto-Abo richtig: Mindestlaufzeit, Kündigungsfristen je Anbieter, vorzeitige Kündigung, Kilometer-Abrechnung & Rückgabe-Checkliste." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://www.buyauto.ch/auto-abo-kuendigen" />
        <meta property="og:site_name" content="BuyAuto" />
        
        {/* FAQ Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      </Head>

      <main className="bg-neutral-50 min-h-screen">
        
        {/* HERO SECTION */}
        <section className="relative min-h-[500px] md:min-h-[550px] flex items-center overflow-hidden pt-16">
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1554743365-a80c1243316e?auto=format&fit=crop&w=2400&q=80"
              alt="Auto-Abo kündigen Schweiz"
              fill
              className="object-cover"
              priority
              quality={75}
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
                  <FileText className="w-4 h-4" />
                  <span>Ratgeber • Aktualisiert am {updatedDate}</span>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight mb-6">
                  Auto-Abo kündigen in der Schweiz: so klappt’s ohne Stress
                </h1>
                <p className="text-xl md:text-2xl text-red-400 font-semibold mb-4">
                  Und ohne teure Überraschungen bei der Rückgabe
                </p>
                <p className="text-lg text-neutral-200 leading-relaxed mb-8 max-w-2xl">
                  Das Auto-Abo klingt einfach – bis man aussteigen will. Ob Kündigungsfrist, Mindestlaufzeit oder der gefürchtete Rückgabeprozess: Hier erfährst du, wie du Fehler vermeidest.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    asChild
                    size="lg"
                    className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30 transition-all duration-300 px-8 py-6 text-base font-semibold rounded-xl"
                  >
                    <Link href="/suche">
                      Leasingübernahmen ansehen
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

        {/* QUICK ANSWER / INTRO BOX */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <Info className="w-8 h-8 text-red-600" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Kurz gesagt: So gehst du vor
              </h2>
            </div>
            
            <div className="bg-red-50 border-l-4 border-red-600 p-8 rounded-r-xl shadow-sm">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center font-bold">1</div>
                  <div>
                    <h3 className="font-bold text-neutral-900 text-lg">Mindestlaufzeit checken</h3>
                    <p className="text-neutral-700">Vor Ablauf kommst du oft nur gegen hohe Gebühren raus.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center font-bold">2</div>
                  <div>
                    <h3 className="font-bold text-neutral-900 text-lg">Kündigungsfrist einhalten</h3>
                    <p className="text-neutral-700">Je nach Anbieter 10, 14 oder 30 Tage – Achtung beim &quot;Abo-Monat&quot;!</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center font-bold">3</div>
                  <div>
                    <h3 className="font-bold text-neutral-900 text-lg">Rückgabe sauber vorbereiten</h3>
                    <p className="text-neutral-700">Protokoll, Fotos und Zubehör entscheiden über Nachzahlungen.</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-red-200">
                <p className="text-red-900 font-medium flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Wichtig: Wenn du nicht aktiv kündigst, verlängern sich die meisten Abos in der Schweiz automatisch (oft monatlich).
                </p>
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
                  { id: "abo-monat", label: "Abo-Monat ≠ Kalender-Monat" },
                  { id: "fristen", label: "Kündigungsfristen: Anbieter-Überblick" },
                  { id: "fahrplan", label: "Dein Kündigungs-Fahrplan" },
                  { id: "vorzeitig", label: "Vorzeitig kündigen & Kosten" },
                  { id: "kilometer", label: "Kilometer & Abschlussrechnung" },
                  { id: "checkliste", label: "Rückgabe-Checkliste" },
                  { id: "email-vorlage", label: "Kündigungs-E-Mail Vorlage" },
                  { id: "faq", label: "Häufige Fragen" },
                ].map((item, i) => (
                  <button 
                    key={i}
                    onClick={() => scrollToSection(item.id)}
                    className="flex items-center gap-2 text-neutral-600 hover:text-red-600 transition-colors text-left group"
                  >
                    <ChevronRight className="w-4 h-4 text-red-400 group-hover:text-red-600 transition-colors" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ABO MONAT SECTION */}
        <section id="abo-monat" className="py-16 px-4 bg-white scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="w-8 h-8 text-red-600" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Was viele Guides vergessen: &quot;Abo-Monat&quot; ≠ Kalender-Monat
              </h2>
            </div>
            
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-8">
              <p className="text-lg text-neutral-700 leading-relaxed mb-6">
                Der häufigste Fehler bei der Auto-Abo Kündigung ist der Blick auf den Kalender. 
                Die meisten Abos laufen <strong>nicht</strong> vom 1. bis zum 30. des Monats, sondern ab dem Tag deiner Fahrzeugübernahme.
              </p>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg mb-8">
                <p className="text-blue-900 text-lg">
                  <strong>Beispiel:</strong> Du hast dein Auto am <strong>14. März</strong> übernommen.<br/>
                  Dein Abo-Monat läuft immer vom 14. bis zum 13. des Folgemonats.<br/>
                  Eine &quot;30 Tage Frist&quot; bezieht sich auf den Stichtag <strong>14.</strong>, nicht auf das Monatsende.
                </p>
              </div>

              <div className="text-center">
                <span className="inline-block bg-neutral-900 text-white px-6 py-3 rounded-xl font-bold text-base shadow-lg">
                  Merksatz: Dein Kündigungstermin hängt vom Übergabe-Datum ab, nicht vom Kalender.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* FRISTEN TABLE SECTION */}
        <section id="fristen" className="py-16 px-4 bg-neutral-50 scroll-mt-20">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <Clock className="w-8 h-8 text-red-600" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Kündigungsfristen in der Schweiz: schneller Überblick
              </h2>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-8 flex gap-3 max-w-3xl">
              <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800">
                <strong>Wichtig:</strong> Bitte prüfe immer deinen individuellen Vertrag. Regeln ändern sich und können je nach gebuchtem Paket (z.B. Flex vs. Fix) abweichen. Stand: 12/2025.
              </p>
            </div>
            
            <div className="overflow-x-auto rounded-xl border-2 border-red-600 shadow-lg bg-white">
              <table className="w-full text-left min-w-[800px]">
                <thead className="bg-red-600 text-white">
                  <tr>
                    <th className="p-4 md:p-6 font-bold text-lg">Anbieter</th>
                    <th className="p-4 md:p-6 font-bold text-lg">Mindestlaufzeit (typisch)</th>
                    <th className="p-4 md:p-6 font-bold text-lg">Kündigungsfrist (typisch)</th>
                    <th className="p-4 md:p-6 font-bold text-lg">Kanal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {[
                    { name: "Clyde", duration: "3–12 Monate (je nach Paket)", notice: "10–30 Tage (Abo-Monat)", channel: "Portal / E-Mail" },
                    { name: "CARIFY", duration: "1, 3, 6+ Monate", notice: "30 Tage (nach Mindestlaufzeit)", channel: "E-Mail" },
                    { name: "Carvolution", duration: "3–36 Monate", notice: "30 Tage (auf Abo-Ende)", channel: "App / Portal" },
                    { name: "UPTO (AXA)", duration: "Oft 6 Monate", notice: "1 Monat", channel: "E-Mail" },
                    { name: "FlatDrive", duration: "Flexibel", notice: "30 Tage (oft auf Monatsende)", channel: "E-Mail" },
                    { name: "e-JOY", duration: "Variabel", notice: "30 Tage", channel: "E-Mail" }
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-red-50 transition-colors">
                      <td className="p-4 md:p-6 font-bold text-neutral-900">{row.name}</td>
                      <td className="p-4 md:p-6 text-neutral-700">{row.duration}</td>
                      <td className="p-4 md:p-6 text-neutral-700 font-medium">{row.notice}</td>
                      <td className="p-4 md:p-6 text-neutral-700">{row.channel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* TIMELINE SECTION (FAHRPLAN) */}
        <section id="fahrplan" className="py-16 px-4 bg-white scroll-mt-20">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <ChevronRight className="w-8 h-8 text-red-600" />
                <h2 className="text-3xl font-bold text-neutral-900">
                  Dein Kündigungs-Fahrplan
                </h2>
              </div>
              <p className="text-lg text-neutral-600">
                Schritt für Schritt zur korrekten Kündigung
              </p>
            </div>

            <div className="relative">
              {/* Vertical Line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-red-200 hidden md:block"></div>
              
              <div className="space-y-8">
                {[
                  {
                    step: 1,
                    title: "\"Darf ich schon kündigen?\"-Check",
                    desc: 'Prüfe in deinem Vertrag oder Dashboard das "Ablaufdatum der Mindestlaufzeit". Wenn du vorher kündigst, wird es teuer.',
                    icon: Search
                  },
                  {
                    step: 2,
                    title: "Kündigung schriftlich einreichen",
                    desc: 'Auch wenn es einen "Kündigen"-Button in der App gibt: Eine Bestätigungs-E-Mail ist Gold wert. Verlange immer eine schriftliche Bestätigung des Rückgabetermins.',
                    icon: Mail
                  },
                  {
                    step: 3,
                    title: "Rückgabe organisieren",
                    desc: 'Kläre: Muss ich das Auto bringen (wohin?) oder wird es abgeholt? (Abholung kostet oft 150–300 CHF extra).',
                    icon: Calendar
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
                      <div className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl p-6 md:p-8 hover:border-red-600 transition-colors">
                        <div className="flex items-start gap-3 mb-3">
                          <IconComponent className="w-6 h-6 text-red-600 mt-1" />
                          <h3 className="text-xl md:text-2xl font-bold text-neutral-900">{item.title}</h3>
                        </div>
                        <p className="text-neutral-700 text-lg leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* VORZEITIG KUENDIGEN SECTION */}
        <section id="vorzeitig" className="py-16 px-4 bg-neutral-50 scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <TrendingDown className="w-8 h-8 text-red-600" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Vorzeitig kündigen: der Preishammer
              </h2>
            </div>
            
            <div className="bg-white p-8 rounded-3xl shadow-lg border border-neutral-200 mb-8">
              <p className="text-lg text-neutral-700 mb-6">
                Eine vorzeitige Kündigung (&quot;Early Termination&quot;) ist oft möglich, aber meist der teuerste Weg.
                Anbieter kalkulieren die günstigen Monatsraten basierend auf der langen Laufzeit. Wenn du früher aussteigst, bricht diese Kalkulation zusammen.
              </p>

              <div className="bg-neutral-100 p-6 rounded-xl border-l-4 border-neutral-500">
                <h4 className="font-bold text-neutral-900 mb-3 text-lg">Konkretes Beispiel (damit du ein Gefühl bekommst):</h4>
                <p className="text-neutral-700 mb-2">
                  Angenommen, du hast ein Abo über 12 Monate für 600 CHF/Monat. Du willst nach 4 Monaten raus.
                </p>
                <ul className="space-y-2 text-neutral-700">
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">•</span>
                    <span><strong>Pauschale:</strong> Oft 2–3 Monatsraten Strafgebühr (z.B. 1&apos;800 CHF).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">•</span>
                    <span><strong>Neuberechnung:</strong> Der Anbieter berechnet rückwirkend den Preis für das &quot;Flex-Abo&quot; (z.B. 850 CHF). Du zahlst die Differenz für 4 Monate nach (1&apos;000 CHF).</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Better Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                <div className="flex items-center gap-3 mb-3">
                  <ShieldCheck className="w-6 h-6 text-green-600" />
                  <h3 className="font-bold text-green-900">Fahrzeugwechsel</h3>
                </div>
                <p className="text-green-800">
                  Oft lassen dich Anbieter kostenlos aus dem Vertrag, wenn du auf ein anderes (oder teureres) Auto wechselst.
                </p>
              </div>
              <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                <div className="flex items-center gap-3 mb-3">
                  <FileText className="w-6 h-6 text-green-600" />
                  <h3 className="font-bold text-green-900">Laufzeit anpassen</h3>
                </div>
                <p className="text-green-800">
                  Frag nach, ob du das Abo offiziell verkürzen kannst (gegen Aufpreis der Rate), was oft billiger ist als die Strafgebühr.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* KM & ABSCHLUSS SECTION */}
        <section id="kilometer" className="py-16 px-4 bg-white scroll-mt-20">
          <div className="max-w-4xl mx-auto">
             <div className="flex items-center gap-3 mb-8">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Kilometer & Abschlussrechnung
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-neutral-50 p-6 rounded-xl border border-neutral-200">
                <h3 className="text-xl font-bold text-neutral-900 mb-3">Das Prinzip</h3>
                <p className="text-neutral-700 mb-4">
                  Die meisten Anbieter rechnen &quot;Total über Laufzeit&quot;.
                  <br /><br />
                  1&apos;000 km/Monat gebucht × 12 Monate = <strong>12&apos;000 km Total</strong>.
                  Egal ob du im Januar 2&apos;000 km fährst und im Februar 0 km.
                </p>
              </div>

              <div className="bg-red-50 p-6 rounded-xl border border-red-200">
                <h3 className="text-xl font-bold text-red-900 mb-3">Die Falle</h3>
                <p className="text-red-900 mb-4">
                  Bei vorzeitiger Kündigung sinkt dein Freibetrag! 
                  <br /><br />
                  Kündigst du nach 6 Monaten, hast du nur 6&apos;000 km frei. Warst du auf &quot;Jahreskurs&quot;, zahlst du jetzt drauf.
                </p>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <p className="text-neutral-600 italic">
                Tipp: Ein Foto vom Kilometerstand bei Übernahme und Rückgabe ist deine Lebensversicherung gegen falsche Abrechnungen.
              </p>
            </div>
          </div>
        </section>

        {/* CHECKLIST SECTION */}
        <section id="checkliste" className="py-16 px-4 bg-neutral-50 scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <FileCheck className="w-8 h-8 text-red-600" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Rückgabe-Checkliste (Die 10 Minuten, die Geld sparen)
              </h2>
            </div>
            
            <div className="bg-white border-2 border-red-600 rounded-xl p-8 shadow-lg">
              <div className="space-y-8">
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-bold text-red-600 uppercase tracking-wide mb-4">
                    <Clock className="w-5 h-5" /> 24h Vor Rückgabe
                  </h3>
                  <div className="space-y-3 pl-2">
                    {[
                      "Auto waschen (aussen) & saugen (innen). Dreckige Autos werden oft pauschal gereinigt (teuer!).",
                      "Persönliche Dinge entfernen (Sonnenbrille, Parkmünzen, Handyhalterung).",
                      "Zubehör zusammensuchen: 2. Schlüssel, Ladekabel, Hutablage, Serviceheft, SD-Karte Navi."
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-neutral-400 mt-0.5 shrink-0" />
                        <span className="text-neutral-700 text-lg">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-neutral-100 pt-6">
                  <h3 className="flex items-center gap-2 text-lg font-bold text-red-600 uppercase tracking-wide mb-4">
                    <Users className="w-5 h-5" /> Bei Übergabe
                  </h3>
                  <div className="space-y-3 pl-2">
                    {[
                      "Protokoll verlangen! Unterschreibe nichts, was du nicht gesehen hast.",
                      "Fotos machen: Rundgang ums Auto + Tacho + Innenraum.",
                      "Schäden abgleichen: Sind das neue Kratzer oder waren die schon da? (Übergabeprotokoll vom Start prüfen!)"
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                        <span className="text-neutral-900 font-medium text-lg">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* EMAIL TEMPLATE SECTION */}
        <section id="email-vorlage" className="py-16 px-4 bg-white scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-neutral-900 mb-6">
              Kündigungs-E-Mail Vorlage
            </h2>
            
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-red-400 rounded-2xl opacity-20 blur"></div>
              <div className="relative bg-neutral-900 rounded-xl p-6 md:p-8 overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="text-neutral-500 text-sm flex items-center gap-1">
                    <Copy className="w-4 h-4" /> Copy
                  </div>
                </div>
                <pre className="font-mono text-sm md:text-base text-neutral-300 whitespace-pre-wrap leading-relaxed">
{`Betreff: Kündigung Auto-Abo / Vertragsnummer: [Deine Nummer]

Sehr geehrte Damen und Herren,

hiermit kündige ich mein Auto-Abo für das Fahrzeug [Marke, Modell, Kennzeichen] fristgerecht zum nächstmöglichen Termin.

Bitte bestätigen Sie mir den Eingang dieser Kündigung sowie das genaue Enddatum des Vertrags schriftlich.

Bitte teilen Sie mir zudem mit, wie der Rückgabeprozess abläuft und wo das Fahrzeug zurückgegeben werden soll.

Freundliche Grüsse,
[Dein Vorname] [Dein Nachname]`}
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section id="faq" className="py-16 px-4 bg-neutral-50 scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-neutral-900 mb-3">
                Häufige Fragen (FAQ)
              </h2>
              <p className="text-neutral-600 text-lg">
                Die wichtigsten Antworten auf einen Blick
              </p>
            </div>
            
            <Accordion type="single" collapsible className="w-full space-y-4">
              {[
                {
                  q: "Verlängert sich das Abo automatisch?",
                  a: "Ja. Wenn du nichts tust, läuft das Abo meist Monat für Monat weiter. Es endet selten automatisch nach der Mindestlaufzeit."
                },
                {
                  q: "Kann ich während der Mindestlaufzeit kündigen?",
                  a: "Nur gegen Gebühr. Rechne mit hohen Kosten. Prüfe, ob du das Auto stattdessen 'swappen' (tauschen) kannst, das ist oft günstiger."
                },
                {
                  q: "Wie funktioniert die km-Abrechnung?",
                  a: "Die Kilometer werden am Ende über die gesamte Laufzeit saldiert. Mehrkilometer kosten meist 0.20 bis 0.50 CHF/km. Minderkilometer werden oft NICHT erstattet."
                },
                {
                  q: "Was muss ich bei Rückgabe beachten?",
                  a: "Das Auto muss im Zustand sein, der dem Alter und der Laufleistung entspricht ('normale Abnutzung'). Kratzer bis zur Grundierung, Beulen oder Flecken im Polster gelten als Schaden."
                },
                {
                  q: "Muss ich die Versicherung separat kündigen?",
                  a: "Nein. Im Auto-Abo ist die Versicherung inklusive und läuft über den Anbieter. Mit der Kündigung des Abos endet automatisch auch der Versicherungsschutz."
                }
              ].map((faq, i) => (
                <AccordionItem 
                  key={i} 
                  value={`item-${i}`}
                  className="bg-white border border-neutral-200 rounded-xl px-6 md:px-8 hover:border-red-600 transition-colors"
                >
                  <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* FINAL CTA & SOURCES */}
        <section className="py-20 bg-neutral-900 px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Keine Lust mehr auf Abo-Fallen?
            </h2>
            <p className="text-neutral-300 max-w-2xl mx-auto text-lg leading-relaxed">
              Entdecke Leasingübernahmen als flexible Alternative. Oft kürzere Laufzeiten, günstigere Raten und transparenter Ausstieg.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <Button asChild size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg shadow-red-600/30 transition-all">
                <Link href="/suche">
                  <Search className="w-5 h-5 mr-2" />
                  Leasingübernahmen ansehen
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg font-semibold border-2 border-white text-white hover:bg-white hover:text-neutral-900 rounded-xl bg-transparent transition-all">
                <Link href="/leasinguebernahme-vs-autoabo">
                  Vergleich: Abo vs. Übernahme
                </Link>
              </Button>
            </div>
            
            {/* SOURCES */}
            <div className="pt-12 border-t border-neutral-800 mt-12 text-left md:text-center">
              <h3 className="font-bold text-neutral-500 mb-6 text-sm uppercase tracking-wide">Quellen & Anbieter-Links (Extern)</h3>
              <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm">
                <a href="https://www.clyde.ch/de/fees" target="_blank" rel="noopener nofollow" className="text-neutral-400 hover:text-white transition-colors hover:underline">Clyde Gebühren</a>
                <a href="https://help.carify.com/" target="_blank" rel="noopener nofollow" className="text-neutral-400 hover:text-white transition-colors hover:underline">CARIFY Help Center</a>
                <a href="https://www.flatdrive.ch/" target="_blank" rel="noopener nofollow" className="text-neutral-400 hover:text-white transition-colors hover:underline">FlatDrive FAQ</a>
                <a href="https://www.upto.ch/" target="_blank" rel="noopener nofollow" className="text-neutral-400 hover:text-white transition-colors hover:underline">UPTO (AXA)</a>
                <a href="https://www.carvolution.com/" target="_blank" rel="noopener nofollow" className="text-neutral-400 hover:text-white transition-colors hover:underline">Carvolution FAQ</a>
                <a href="https://www.e-joy.ch/" target="_blank" rel="noopener nofollow" className="text-neutral-400 hover:text-white transition-colors hover:underline">e-JOY</a>
              </div>
              <p className="text-xs text-neutral-600 mt-8 max-w-2xl mx-auto">
                Disclaimer: Diese Seite dient der Orientierung und ersetzt keine Rechtsberatung. Wir prüfen die Angaben sorgfältig, doch Anbieter können ihre AGB jederzeit ändern.
              </p>
            </div>
          </div>
        </section>

      </main>
    </>
  );
}