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
  Users,
  Calculator
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Image from "next/image";
import { AutoAboVsLeasingCalculator } from "@/components/buyauto/calculator/AutoAboVsLeasingCalculator";

interface PageProps {
  updatedDate: string;
}

export async function getStaticProps() {
  const now = new Date();
  const day = now.getDate().toString().padStart(2, '0');
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const year = now.getFullYear();
  const updatedDate = `${day}.${month}.${year}`;
  
  return {
    props: {
      updatedDate,
    },
    revalidate: 86400,
  };
}

export default function AutoAboVsLeasingKostenPage({ updatedDate }: PageProps) {
  // FAQ Schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Ist ein Auto-Abo teurer als Leasing?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Auf den ersten Blick wirkt die Abo-Rate höher als die Leasingrate. Aber: Im Abo sind Versicherung, Steuern, Reifen und Service inklusive. Rechnet man beim Leasing alle diese Nebenkosten dazu ('Vollkosten'), ist das Abo oft konkurrenzfähig oder bei kurzen Laufzeiten sogar günstiger."
        }
      },
      {
        "@type": "Question",
        "name": "Wann lohnt sich ein Auto-Abo?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Ein Auto-Abo lohnt sich meist bei Laufzeiten unter 24 Monaten, für Fahranfänger mit teurer Versicherung oder wenn man volle Flexibilität braucht. Ab 3–4 Jahren Laufzeit ist Leasing oft günstiger."
        }
      },
      {
        "@type": "Question",
        "name": "Welche versteckten Kosten gibt es beim Leasing?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Neben der monatlichen Rate fallen an: Anzahlung, Vollkasko-Versicherung, Verkehrssteuer, Service/Wartung, Reifenwechsel & Einlagerung sowie oft hohe Kosten bei der Rückgabe für kleine Schäden."
        }
      },
      {
        "@type": "Question",
        "name": "Kann ich Leasing vorzeitig kündigen?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Leasingverträge sind schwer vorzeitig zu kündigen und wenn, dann nur gegen hohe Entschädigungszahlungen. Eine Leasingübernahme (Weitergabe des Vertrags an Dritte) ist oft die günstigere Lösung."
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
        <title>Auto-Abo vs Leasing Kosten (Schweiz): Rechner & Vollkostenvergleich | BuyAuto</title>
        <meta
          name="description"
          content="Vergleiche Auto-Abo vs Leasing mit Vollkostenrechnung: Rate, Versicherung, Service, Reifen, Steuern, Kilometer & Gebühren. In 2 Minuten wissen, was günstiger ist."
        />
        <link rel="canonical" href="https://www.buyauto.ch/auto-abo-vs-leasing-kosten" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Auto-Abo vs Leasing Kosten (Schweiz): Rechner & Vollkostenvergleich" />
        <meta property="og:description" content="Vergleiche Auto-Abo vs Leasing mit Vollkostenrechnung: Rate, Versicherung, Service, Reifen, Steuern, Kilometer & Gebühren. In 2 Minuten wissen, was günstiger ist." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://www.buyauto.ch/auto-abo-vs-leasing-kosten" />
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
              src="https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=2400&q=80"
              alt="Auto-Abo vs Leasing Kosten Vergleich Schweiz"
              fill
              className="object-cover"
              priority
              quality={75}
              sizes="100vw"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/70 via-neutral-900/60 to-neutral-900/80" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 via-transparent to-neutral-900/30" />
          </div>

          {/* Geometric Accents */}
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 left-1/5 w-64 h-64 bg-blue-400/5 rounded-full blur-2xl" />

          {/* Hero Content */}
          <div className="relative z-10 w-full px-4 py-16 md:py-20">
            <div className="max-w-5xl mx-auto">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-full text-sm font-semibold mb-6">
                  <Calculator className="w-4 h-4" />
                  <span>Kosten-Rechner • Aktualisiert am {updatedDate}</span>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight mb-6">
                  Auto-Abo vs Leasing Kosten: der Vollkosten-Rechner für die Schweiz
                </h1>
                <p className="text-xl md:text-2xl text-blue-300 font-semibold mb-4">
                  Rate ist nicht alles. Vergleiche die echten Gesamtkosten.
                </p>
                <p className="text-lg text-neutral-200 leading-relaxed mb-8 max-w-2xl">
                  Leasing lockt mit tiefen Raten, das Abo mit &quot;Alles Inklusive&quot;. Doch was lohnt sich wirklich? Unser Rechner zeigt dir gnadenlose Wahrheit – inklusive Versicherung, Steuern und versteckten Gebühren.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    asChild
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30 transition-all duration-300 px-8 py-6 text-base font-semibold rounded-xl"
                  >
                    <Link href="#rechner">
                      Zum Rechner
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
                      Leasingübernahmen ansehen
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* QUICK ANSWER BOX */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <Info className="w-8 h-8 text-blue-600" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Kurz gesagt: Die Faustregel
              </h2>
            </div>
            
            <div className="bg-blue-50 border-l-4 border-blue-600 p-8 rounded-r-xl shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-bold text-neutral-900 text-lg mb-2 flex items-center gap-2">
                    <Check className="w-5 h-5 text-blue-600" />
                    Auto-Abo lohnt sich meist, wenn...
                  </h3>
                  <ul className="space-y-2 text-neutral-700 list-disc list-inside pl-2">
                     <li>Du das Auto <strong>kürzer als 2-3 Jahre</strong> brauchst.</li>
                     <li>Du Junglenker bist (teure Versicherung inkl.).</li>
                     <li>Du 0 CHF Anzahlung leisten willst.</li>
                     <li>Du volle Kostenkontrolle ohne böse Überraschungen suchst.</li>
                  </ul>
                </div>
                <div>
                   <h3 className="font-bold text-neutral-900 text-lg mb-2 flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-blue-600" />
                    Leasing lohnt sich meist, wenn...
                  </h3>
                  <ul className="space-y-2 text-neutral-700 list-disc list-inside pl-2">
                     <li>Du das Auto <strong>3 Jahre oder länger</strong> fährst.</li>
                     <li>Du bereits eine sehr günstige Versicherungseinstufung hast.</li>
                     <li>Du das Auto nach Vertrag individuell konfigurieren willst.</li>
                     <li>Du eine Anzahlung leisten kannst, um die Rate zu drücken.</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-blue-200">
                <p className="text-blue-900 font-medium flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Achtung: Das Ergebnis hängt extrem von <strong>Versicherung, Laufleistung und Servicekosten</strong> ab. Nutze den Rechner unten für dein Szenario.
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
                  { id: "rechner", label: "Der Kosten-Rechner" },
                  { id: "lesen", label: "So liest du den Vergleich" },
                  { id: "fallen", label: "Typische Kostenfallen" },
                  { id: "option3", label: "Leasingübernahme als 3. Option" },
                  { id: "faq", label: "Häufige Fragen" },
                  { id: "disclaimer", label: "Disclaimer" },
                ].map((item, i) => (
                  <button 
                    key={i}
                    onClick={() => scrollToSection(item.id)}
                    className="flex items-center gap-2 text-neutral-600 hover:text-blue-600 transition-colors text-left group"
                  >
                    <ChevronRight className="w-4 h-4 text-blue-400 group-hover:text-blue-600 transition-colors" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CALCULATOR SECTION */}
        <section id="rechner" className="py-16 px-4 bg-white scroll-mt-20">
          <div className="max-w-7xl mx-auto">
             <div className="text-center mb-10">
               <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-4">
                 <Calculator className="w-8 h-8 text-blue-600" />
               </div>
               <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
                 Auto-Abo vs. Leasing Rechner
               </h2>
               <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
                 Gib deine Daten ein oder nutze unsere Beispielwerte. <br className="hidden md:block"/>
                 Wir berechnen die <strong>Vollkosten</strong> (TCO) über die gesamte Laufzeit.
               </p>
             </div>

             <AutoAboVsLeasingCalculator />

          </div>
        </section>

        {/* HOW TO READ SECTION */}
        <section id="lesen" className="py-16 px-4 bg-neutral-50 scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <Search className="w-8 h-8 text-blue-600" />
              <h2 className="text-3xl font-bold text-neutral-900">
                So liest du den Vergleich
              </h2>
            </div>
            
            <div className="prose prose-lg text-neutral-700 max-w-none">
              <p>
                Der häufigste Fehler ist der reine Blick auf die <strong>Monatsrate</strong>. Eine Leasingrate von CHF 300 sieht unschlagbar günstig aus gegen ein Abo für CHF 600.
                Doch das täuscht gewaltig.
              </p>
              <p>
                Beim Leasing musst du zwingend folgende Kosten dazu addieren, um Äpfel mit Äpfeln zu vergleichen:
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 list-none pl-0">
                <li className="bg-white p-4 rounded-lg border border-neutral-200 flex items-start gap-3">
                  <span className="text-blue-600 font-bold text-xl">•</span>
                  <span><strong>Versicherung:</strong> Vollkasko ist beim Leasing Pflicht. Für Junge oder in Städten oft 150-200 CHF/Mt.</span>
                </li>
                <li className="bg-white p-4 rounded-lg border border-neutral-200 flex items-start gap-3">
                  <span className="text-blue-600 font-bold text-xl">•</span>
                  <span><strong>Reifen:</strong> Ein Satz Winterreifen + Wechsel + Einlagerung kostet schnell 600-800 CHF pro Jahr.</span>
                </li>
                 <li className="bg-white p-4 rounded-lg border border-neutral-200 flex items-start gap-3">
                  <span className="text-blue-600 font-bold text-xl">•</span>
                  <span><strong>Steuern:</strong> Die Verkehrssteuer (je nach Kanton 200-800 CHF) zahlt beim Leasing der Halter (= Du).</span>
                </li>
                 <li className="bg-white p-4 rounded-lg border border-neutral-200 flex items-start gap-3">
                  <span className="text-blue-600 font-bold text-xl">•</span>
                  <span><strong>Service:</strong> Ölwechsel und Inspektionen gehen beim Leasing auf deine Kappe.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* TYPICAL TRAPS SECTION */}
        <section id="fallen" className="py-16 px-4 bg-white scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <AlertTriangle className="w-8 h-8 text-red-600" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Typische Kostenfallen
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-neutral-50 rounded-xl p-8 border border-neutral-200">
                <h3 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
                   <span className="w-2 h-8 bg-neutral-900 rounded-full"></span>
                   Beim Auto-Abo
                </h3>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <Check className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <span className="text-neutral-700"><strong>Mehrkilometer:</strong> Wer mehr fährt als gebucht, zahlt oft teuer nach (z.B. 0.45 CHF/km).</span>
                  </li>
                  <li className="flex gap-3">
                    <Check className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <span className="text-neutral-700"><strong>Startgebühr:</strong> Manche Anbieter verlangen 300-500 CHF nur für die Bereitstellung.</span>
                  </li>
                  <li className="flex gap-3">
                    <Check className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <span className="text-neutral-700"><strong>Selbstbehalt:</strong> Prüfe den Selbstbehalt bei der Versicherung (oft 1000 CHF).</span>
                  </li>
                </ul>
              </div>

              <div className="bg-neutral-50 rounded-xl p-8 border border-neutral-200">
                <h3 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
                   <span className="w-2 h-8 bg-white border border-neutral-900 rounded-full"></span>
                   Beim Leasing
                </h3>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <Check className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <span className="text-neutral-700"><strong>Rückgabeschäden:</strong> Kleine Kratzer werden oft teuer verrechnet.</span>
                  </li>
                  <li className="flex gap-3">
                    <Check className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <span className="text-neutral-700"><strong>Vertragsbindung:</strong> Du kommst vorzeitig fast nicht raus.</span>
                  </li>
                  <li className="flex gap-3">
                    <Check className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <span className="text-neutral-700"><strong>Anzahlung:</strong> Die &quot;tiefe Rate&quot; ist oft mit 3000-5000 CHF Anzahlung erkauft.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* LEASINGUEBERNAHME OPTION */}
        <section id="option3" className="py-16 px-4 bg-gradient-to-br from-neutral-900 to-neutral-800 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">
              Die 3. Option: Leasingübernahme
            </h2>
            <p className="text-xl text-neutral-300 mb-8 max-w-2xl mx-auto">
              Du willst kurze Laufzeiten wie beim Abo, aber günstige Raten wie beim Leasing? <br/>
              Übernimm einen laufenden Leasingvertrag von jemand anderem.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10 text-left">
              <div className="bg-white/10 p-6 rounded-xl border border-white/10">
                <Clock className="w-8 h-8 text-blue-400 mb-4" />
                <h3 className="font-bold text-lg mb-2">Kurze Restlaufzeit</h3>
                <p className="text-sm text-neutral-400">Oft nur noch 12–24 Monate übrig. Ideal zum Überbrücken.</p>
              </div>
              <div className="bg-white/10 p-6 rounded-xl border border-white/10">
                <TrendingDown className="w-8 h-8 text-blue-400 mb-4" />
                <h3 className="font-bold text-lg mb-2">Keine Anzahlung</h3>
                <p className="text-sm text-neutral-400">Die Anzahlung hat meist der Vorbesitzer schon geleistet.</p>
              </div>
              <div className="bg-white/10 p-6 rounded-xl border border-white/10">
                <Car className="w-8 h-8 text-blue-400 mb-4" />
                <h3 className="font-bold text-lg mb-2">Sofort verfügbar</h3>
                <p className="text-sm text-neutral-400">Keine Lieferfristen. Das Auto steht schon bereit.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
               <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg border-none">
                <Link href="/suche">
                  <Search className="w-4 h-4 mr-2" />
                  Leasingübernahmen finden
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/20 hover:bg-white/10 hover:text-white bg-transparent text-white">
                <Link href="/leasinguebernahme-vs-autoabo">
                  Mehr zur Leasingübernahme
                </Link>
              </Button>
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
                Expertenwissen kurz & knapp
              </p>
            </div>
            
            <Accordion type="single" collapsible className="w-full space-y-4">
              {[
                {
                  q: "Ist Versicherung im Leasing wirklich nie dabei?",
                  a: "Meistens nicht. Es gibt 'Full-Service-Leasing' Angebote, wo Versicherung und Service inkludiert sind. Diese sind aber teurer. Unser Rechner geht vom Standard-Leasing (ohne Versicherung) aus, du kannst den Versicherungswert aber auf 0 setzen, falls inkludiert."
                },
                {
                  q: "Kann ich das Auto nach dem Abo behalten?",
                  a: "Manchmal ja. Viele Abo-Anbieter bieten eine Kaufoption am Ende der Laufzeit an. Das ist aber meist nicht der Hauptzweck des Modells. Beim Leasing ist die Übernahme am Ende oft vertraglich als Option geregelt."
                },
                {
                  q: "Was ist mit der Anzahlung?",
                  a: "Beim Leasing ist eine Anzahlung ('Leasing-Sonderzahlung') üblich, um die monatliche Rate zu senken. Beim Auto-Abo gibt es fast nie eine Anzahlung, nur manchmal eine Startgebühr."
                },
                {
                  q: "Für wen ist Abo das Richtige?",
                  a: "Für Expats, Projektmitarbeiter, Leute die gerne oft das Auto wechseln oder unsicher sind, welches Auto (z.B. Elektro) zu ihnen passt."
                },
                {
                  q: "Zählt die Bonität bei beiden gleich?",
                  a: "Ja. Sowohl Abo-Anbieter als auch Leasingbanken prüfen die Bonität (Betreibungsauskunft). Ein negativer Eintrag führt meist bei beiden zur Ablehnung."
                }
              ].map((faq, i) => (
                <AccordionItem 
                  key={i} 
                  value={`item-${i}`}
                  className="bg-white border border-neutral-200 rounded-xl px-6 md:px-8 hover:border-blue-600 transition-colors"
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

         {/* DISCLAIMER SECTION */}
         <section id="disclaimer" className="py-12 px-4 bg-neutral-100 text-sm text-neutral-500">
           <div className="max-w-4xl mx-auto text-center space-y-2">
             <p>
               <strong>Disclaimer:</strong> Dieser Rechner dient lediglich als Orientierungshilfe und Modellrechnung. 
               Die tatsächlichen Kosten hängen von individuellen Faktoren (Versicherungseinstufung, Wohnkanton, Fahrstil) und den konkreten Vertragsbedingungen der Anbieter ab.
             </p>
             <p>
               BuyAuto.ch übernimmt keine Gewähr für die Richtigkeit der Ergebnisse. Keine Finanzberatung. Bitte prüfe vor Abschluss immer das konkrete Angebot.
             </p>
           </div>
         </section>

      </main>
    </>
  );
}