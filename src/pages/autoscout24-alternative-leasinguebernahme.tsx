import Head from "next/head";
import Link from "next/link";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useState, useEffect } from "react";
import { 
  Check, 
  ArrowRight, 
  X,
  Sparkles,
  TrendingUp,
  Search,
  ShieldCheck,
  CheckCircle,
  FileText,
  Users,
  LayoutGrid,
  Zap,
  Eye,
  MousePointerClick,
  FileCheck,
  ChevronRight
} from "lucide-react";

// Dynamic import for below-the-fold content
const PremiumListings = dynamic(() => import("@/components/buyauto/PremiumListings"), {
  loading: () => <div className="w-full h-96 bg-neutral-100 animate-pulse rounded-xl" />,
  ssr: false
});

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function AutoscoutAlternativeLeasinguebernahmePage() {
  const [showStickyCTA, setShowStickyCTA] = useState(false);
  
  // Handle sticky CTA visibility
  useEffect(() => {
    const handleScroll = () => {
      const heroHeight = 600; // Approximate hero section height
      setShowStickyCTA(window.scrollY > heroHeight);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Structured Data
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://www.buyauto.ch"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Leasingübernahme",
            "item": "https://www.buyauto.ch/leasinguebernahme"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": "Alternative zu AutoScout24",
            "item": "https://www.buyauto.ch/autoscout24-alternative-leasinguebernahme"
          }
        ]
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Muss der Leasinggeber einer Leasingübernahme zustimmen?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Ja, der Leasinggeber (die Bank) muss der Übernahme zustimmen. Er prüft in der Regel die Bonität des neuen Leasingnehmers."
            }
          },
          {
            "@type": "Question",
            "name": "Wird eine Bonitätsprüfung gemacht?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Ja, absolut. Der neue Leasingnehmer übernimmt die finanziellen Verpflichtungen, daher prüft die Bank dessen Zahlungsfähigkeit."
            }
          },
          {
            "@type": "Question",
            "name": "Welche Kosten entstehen bei einer Leasingübernahme?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Meistens fällt eine Umschreibegebühr der Bank an (ca. CHF 300–600). Diese ist oft deutlich geringer als die Kosten einer vorzeitigen Vertragskündigung."
            }
          },
          {
            "@type": "Question",
            "name": "Wie lange dauert eine Leasingübernahme?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Sobald ein Nachfolger gefunden ist und die Unterlagen vollständig eingereicht sind, dauert die Prüfung durch die Bank oft nur wenige Tage bis eine Woche."
            }
          },
          {
            "@type": "Question",
            "name": "Kann ich mein Leasing-Auto einfach verkaufen?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Nein, da das Auto der Bank gehört, kannst du es nicht einfach verkaufen. Du müsstest es erst aus dem Vertrag herauskaufen (was teuer ist) oder eben den Leasingvertrag übertragen."
            }
          },
          {
            "@type": "Question",
            "name": "Welche Angaben gehören ins Inserat, damit es schneller geht?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Wichtig sind: Monatliche Rate, Restlaufzeit, aktuelle Kilometer, Restkilometer, Anzahlung (falls gewünscht) und der Name der Leasingbank."
            }
          },
          {
            "@type": "Question",
            "name": "Was passiert nach der Bewilligung?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Die Bank erstellt einen Umschreibungsvertrag. Wenn beide Parteien unterschrieben haben, kann das Fahrzeug übergeben werden."
            }
          },
          {
            "@type": "Question",
            "name": "Worauf sollte man bei der Fahrzeugübergabe achten?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Erstellt unbedingt ein Übergabeprotokoll, haltet den genauen Zustand und Kilometerstand fest und übergebt alle Schlüssel und Dokumente."
            }
          }
        ]
      }
    ]
  };

  return (
    <>
      <Head>
        <title>Alternative zu AutoScout24 für Leasingübernahmen | BuyAuto</title>
        <meta
          name="description"
          content="BuyAuto ist auf Leasingübernahmen spezialisiert: Inserat in Minuten erstellen, relevante Leasingdaten klar sichtbar, fairer Ablauf. Jetzt Leasing abgeben/übernehmen."
        />
        <link rel="canonical" href="https://www.buyauto.ch/autoscout24-alternative-leasinguebernahme" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: "Die Alternative zu AutoScout24 für Leasingübernahmen",
              author: { "@type": "Person", name: "Vincent Hänggi" },
              publisher: {
                "@type": "Organization",
                name: "BuyAuto",
                logo: { "@type": "ImageObject", url: "https://www.buyauto.ch/share-logo.jpg" },
              },
              dateModified: "2026-06-08",
              mainEntityOfPage: "https://www.buyauto.ch/autoscout24-alternative-leasinguebernahme",
            }),
          }}
        />
        
        {/* Open Graph */}
        <meta property="og:title" content="Alternative zu AutoScout24 für Leasingübernahmen | BuyAuto" />
        <meta property="og:description" content="BuyAuto ist auf Leasingübernahmen spezialisiert: Inserat in Minuten erstellen, relevante Leasingdaten klar sichtbar, fairer Ablauf." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://www.buyauto.ch/autoscout24-alternative-leasinguebernahme" />

        {/* JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <main className="bg-white min-h-screen">
        
        {/* STICKY CTA BAR */}
        <div 
          className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ${
            showStickyCTA ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="bg-gradient-to-r from-primary via-primary/95 to-primary backdrop-blur-lg border-t border-primary/20 shadow-2xl">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="hidden md:block">
                  <p className="text-white font-bold text-lg">Spezialisiert auf Leasingübernahmen</p>
                  <p className="text-white/80 text-sm">Die moderne Alternative</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <Button
                    asChild
                    size="lg"
                    className="flex-1 md:flex-none bg-white hover:bg-white/90 text-primary font-black shadow-xl px-8 py-6 rounded-xl"
                  >
                    <Link href="/inserat-erstellen">
                      Leasing abgeben
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                  <button
                    onClick={() => setShowStickyCTA(false)}
                    className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                    aria-label="Schliessen"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* HERO SECTION */}
        <section className="relative min-h-[700px] flex items-center overflow-hidden pt-16">
          {/* Background with gradient overlay */}
          <div className="absolute inset-0">
            {/* Hero Image */}
            <div className="absolute inset-0">
              <Image
                src="/20251209_0003_Handshake_in_Zurich_simple_compose_01kc036j1cff881r0wzwemf48h.png"
                alt="Handshake - Leasing Übernahme"
                fill
                className="object-cover object-center"
                priority
                quality={90}
              />
            </div>
            
            {/* Gradient Overlays for readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/80" />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
            
            {/* Decorative mesh gradients */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/20 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3" />
            </div>
          </div>

          {/* Hero Content */}
          <div className="relative z-10 w-full px-4 py-20">
            <div className="max-w-6xl mx-auto">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-6 border border-primary/20 backdrop-blur-sm">
                  <Sparkles className="w-4 h-4" />
                  Der Spezialist für Leasingübernahmen
                </div>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-neutral-900 tracking-tight leading-[1.1] mb-6">
                  Die Alternative zu AutoScout24 für <span className="text-primary">Leasingübernahmen</span>
                </h1>
                <p className="text-xl md:text-2xl text-neutral-600 font-medium mb-8 leading-relaxed">
                  AutoScout24 ist top, wenn du ein Auto suchst. Aber wenn du dein <Link href="/leasing-abgeben-schweiz" className="text-primary hover:underline underline-offset-4 decoration-primary/30">Leasing loswerden</Link> willst, brauchst du eine Plattform, die Leasingübernahmen wirklich versteht.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <Button
                    asChild
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30 transition-all duration-300 px-8 py-7 text-lg font-bold rounded-2xl group"
                  >
                    <Link href="/inserat-erstellen">
                      Leasing abgeben (Inserat erstellen)
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-2 border-neutral-300 text-neutral-900 hover:bg-neutral-100 transition-all duration-300 px-8 py-7 text-lg font-bold rounded-2xl backdrop-blur-sm bg-white/80"
                  >
                    <Link href="/suche">
                      Leasing übernehmen (Inserate)
                    </Link>
                  </Button>
                </div>

                <div className="flex items-center gap-2 text-sm text-neutral-500 font-medium">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span>Leasingübernahmen benötigen in der Regel die Zustimmung des Leasinggebers und oft eine Bonitätsprüfung – wir zeigen dir den Ablauf klar und transparent.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: WHY ALTERNATIVE */}
        <section className="py-20 px-4 bg-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-black text-neutral-900 mb-8">
              Warum viele für Leasingübernahmen etwas anderes suchen
            </h2>
            <div className="bg-neutral-50 rounded-3xl p-8 md:p-12 border border-neutral-200 shadow-sm">
              <p className="text-xl md:text-2xl text-neutral-700 font-medium leading-relaxed mb-8">
                "Auf einem riesigen Marktplatz geht die <Link href="/leasinguebernahme" className="text-primary hover:underline underline-offset-4 decoration-primary/30">Leasingübernahme</Link> oft unter. Du willst nicht durch 'Top Occasion!' scrollen, nur um am Ende eine Anzeige zu finden, bei der irgendwo steht: <span className="italic text-neutral-500">'Leasing kann evtl. übernommen werden.'</span>"
              </p>
              <div className="inline-flex items-center gap-3 bg-white px-6 py-3 rounded-xl border border-neutral-200 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="font-bold text-neutral-900">Darum gibt’s BuyAuto: Leasingübernahmen als Hauptgericht, nicht als Beilage.</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: BENEFITS */}
        <section id="benefits" className="py-20 px-4 bg-neutral-50 scroll-mt-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full text-sm font-semibold mb-4 shadow-sm border border-neutral-100">
                <TrendingUp className="w-4 h-4 text-primary" />
                Deine Vorteile
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-neutral-900 mb-4">
                Was BuyAuto als Alternative besser löst
              </h2>
            </div>
            
            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: LayoutGrid, title: "Spezialisiert auf Leasing", desc: "Kein Mischmasch mit Kauf-Inseraten. Hier geht es zu 100% um Leasingübernahmen." },
                { icon: FileText, title: "Daten sofort sichtbar", desc: "Rate, Laufzeit, Kilometer und Anzahlung stehen im Fokus, nicht im Kleingedruckten." },
                { icon: Zap, title: "Übersichtlich & schnell", desc: "Keine Marktplatz-Safari. Finde in Sekunden, was du suchst." },
                { icon: Eye, title: "Sofort vergleichbar", desc: "Interessenten erkennen auf einen Blick, ob das Leasing ins Budget passt." },
                { icon: Search, title: "Transparenter Ablauf", desc: "Wir erklären Schritt für Schritt, was als Nächstes passiert." },
                { icon: MousePointerClick, title: "Modern & einfach", desc: "Benutzerfreundliches Design ohne alte Altlasten." }
              ].map((item, i) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={i}
                    className="group bg-white rounded-3xl p-8 border border-neutral-200 hover:border-primary transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                  >
                    <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                      <IconComponent className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-black text-neutral-900 mb-3">{item.title}</h3>
                    <p className="text-neutral-600 leading-relaxed">{item.desc}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-12 text-center">
              <Button
                asChild
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white font-bold px-10 py-6 text-lg rounded-2xl shadow-xl shadow-primary/20"
              >
                <Link href="/inserat-erstellen">
                  Jetzt Inserat erstellen
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* SECTION: PROCESS */}
        <section id="ablauf" className="py-20 px-4 bg-white scroll-mt-20">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black text-neutral-900 mb-4">
                So funktioniert eine Leasingübernahme
              </h2>
              <p className="text-neutral-600 text-lg">In 5 einfachen Schritten in der Schweiz</p>
            </div>

            <div className="space-y-8">
              {[
                {
                  step: 1,
                  title: "Inserat erstellen",
                  desc: "Erstelle dein Inserat vollständig & ehrlich mit allen Leasingdaten auf BuyAuto.",
                  icon: FileText,
                  color: "blue"
                },
                {
                  step: 2,
                  title: "Interessenten finden",
                  desc: "Wähle einen geeigneten Nachfolger aus den Anfragen aus.",
                  icon: Users,
                  color: "purple"
                },
                {
                  step: 3,
                  title: "Prüfung durch Leasinggeber",
                  desc: "Die Bank prüft die Bonität des neuen Leasingnehmers und stimmt zu.",
                  icon: ShieldCheck,
                  color: "primary"
                },
                {
                  step: 4,
                  title: "Vertrag übertragen",
                  desc: "Der Umschreibungsvertrag wird von allen Parteien unterzeichnet.",
                  icon: FileCheck,
                  color: "orange"
                },
                {
                  step: 5,
                  title: "Fahrzeugübergabe",
                  desc: "Übergabe mit Protokoll, Schlüssel und allen Unterlagen.",
                  icon: CheckCircle,
                  color: "green"
                }
              ].map((item) => {
                const IconComponent = item.icon;
                return (
                  <div key={item.step} className="relative">
                    <div className="flex items-start gap-6 md:gap-8">
                      <div className="flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-gradient-to-br from-primary to-primary/80 text-white flex flex-col items-center justify-center font-black text-2xl shadow-xl ring-4 ring-primary/20">
                        {item.step}
                      </div>
                      
                      <div className="flex-1 bg-neutral-50 rounded-3xl p-8 border-2 border-neutral-100 hover:border-primary/30 transition-all duration-300 hover:shadow-lg group">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-primary/20 transition-colors">
                            <IconComponent className="w-6 h-6 text-primary" />
                          </div>
                          <h3 className="text-2xl font-black text-neutral-900">{item.title}</h3>
                        </div>
                        <p className="text-neutral-600 text-lg">
                          {item.step === 4 ? (
                            <>Der <Link href="/leasingvertrag-uebertragen" className="text-primary hover:underline underline-offset-4">Umschreibungsvertrag</Link> wird von allen Parteien unterzeichnet.</>
                          ) : item.desc}
                        </p>
                      </div>
                    </div>

                    {item.step < 5 && (
                      <div className="ml-10 my-4 h-8 w-1 bg-gradient-to-b from-primary/30 to-transparent rounded-full" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION: COSTS */}
        <section className="py-20 px-4 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-8">
              Was kostet eine Leasingübernahme?
            </h2>
            
            <div className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl text-left">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                  <p className="text-xl text-neutral-700 leading-relaxed mb-6">
                    Oft fallen Gebühren für die Umschreibung/Übertragung an. Die genaue Höhe hängt vom Leasinggeber ab (oft zwischen CHF 300 und CHF 600) – eine detaillierte Aufschlüsselung, <Link href="/leasinguebernahme-kosten" className="text-primary hover:underline underline-offset-4 decoration-primary/30">was eine Leasingübernahme kostet</Link>, findest du in unserem Kosten-Ratgeber.
                  </p>
                  <p className="text-xl text-neutral-700 leading-relaxed font-medium">
                    Im Vergleich zu <span className="text-red-600">"vorzeitig kündigen und alles zahlen"</span> ist die Übernahme für viele der deutlich sinnvollere und günstigere Exit.
                  </p>
                </div>
                <div className="w-full md:w-1/3 bg-primary/5 border-2 border-primary/20 rounded-2xl p-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <p className="font-bold text-neutral-900 mb-2">Pro-Tipp:</p>
                  <p className="text-sm text-neutral-600">
                    Je vollständiger die Angaben im Inserat, desto schneller geht’s.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: COMPARISON */}
        <section className="py-20 px-4 bg-neutral-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black text-neutral-900 mb-4">
                BuyAuto vs. AutoScout24
              </h2>
              <p className="text-neutral-600 text-lg">Ein fairer Vergleich für Leasingübernahmen</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* AutoScout24 */}
              <Card className="border-2 border-neutral-200 rounded-3xl overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="bg-neutral-100 p-8 border-b border-neutral-200">
                    <h3 className="text-2xl font-black text-neutral-600">AutoScout24</h3>
                    <p className="text-neutral-500 font-medium">Der Platzhirsch für Alles</p>
                  </div>
                  <div className="p-8 bg-white h-full">
                    <p className="font-bold text-neutral-900 mb-4 text-lg">Stark, wenn...</p>
                    <ul className="space-y-4">
                      <li className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-neutral-400 mt-0.5 shrink-0" />
                        <span className="text-neutral-600">du ein Auto kaufen oder verkaufen willst.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-neutral-400 mt-0.5 shrink-0" />
                        <span className="text-neutral-600">du maximale Reichweite für Occasionen suchst.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-neutral-400 mt-0.5 shrink-0" />
                        <span className="text-neutral-600">Leasingübernahme nur eine Option unter vielen ist.</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* BuyAuto */}
              <Card className="border-2 border-primary/20 rounded-3xl overflow-hidden shadow-xl ring-4 ring-primary/5">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-r from-primary to-primary/90 p-8 border-b border-primary/20">
                    <h3 className="text-2xl font-black text-white">BuyAuto</h3>
                    <p className="text-white/80 font-medium">Der Spezialist für Leasing</p>
                  </div>
                  <div className="p-8 bg-white h-full">
                    <p className="font-bold text-neutral-900 mb-4 text-lg">Stärker, wenn...</p>
                    <ul className="space-y-4">
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                        <span className="text-neutral-900 font-medium">du gezielt ein Leasing abgeben oder übernehmen willst.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                        <span className="text-neutral-900 font-medium">Leasingdaten (Rate, KM, Laufzeit) sofort sichtbar sein müssen.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                        <span className="text-neutral-900 font-medium">du eine transparente, spezialisierte Plattform suchst.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                        <span className="text-neutral-900 font-medium">du nicht in der Masse untergehen willst.</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="mt-12 text-center bg-primary/5 rounded-2xl p-6 border border-primary/10 mx-auto max-w-3xl">
              <p className="text-lg text-neutral-700 font-medium">
                "Wenn du Leasingübernahme suchst, willst du kein 'Marktplatz mit Leasing-Option irgendwo im Text'. Du willst Leasingübernahme als Fokus." Genau dafür gibt es die <Link href="/suche?dealType=lease_takeover" className="text-primary hover:underline underline-offset-4 decoration-primary/30">Leasingübernahme-Angebote auf BuyAuto</Link> – gefiltert, vergleichbar, ohne Umwege.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION: CHECKLIST */}
        <section className="py-20 px-4 bg-white">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-neutral-900 mb-8 text-center">
              Damit es schnell klappt
            </h2>
            <div className="bg-neutral-50 rounded-3xl p-8 border border-neutral-200">
              <ul className="space-y-6">
                {[
                  "Alle Leasingdaten vollständig (Rate, Laufzeit, KM, Anzahlung, Leasinggeber)",
                  "Gute Fotos machen (innen/aussen, auch Mängel ehrlich zeigen)",
                  "Übergabe-Details klären (Ort, Datum, Winterräder etc.)",
                  "Realistische Konditionen anbieten (evtl. Umschreibegebühr übernehmen)"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <div className="bg-green-100 p-1.5 rounded-full shrink-0 mt-0.5">
                      <Check className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="text-lg text-neutral-700 font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* SECTION: TRUST / FOUNDER */}
        <section className="py-20 px-4 bg-neutral-900 text-white">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="w-32 h-32 md:w-48 md:h-48 relative shrink-0">
                <div className="absolute inset-0 bg-neutral-800 rounded-full overflow-hidden border-4 border-primary/30">
                  <Image
                     src="/Vince.jpeg"
                     alt="Vincent Hänggi"
                     fill
                     className="object-cover"
                  />
                </div>
                <div className="absolute -bottom-3 -right-3 bg-primary text-white p-2 rounded-xl shadow-lg">
                  <Sparkles className="w-6 h-6" />
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl font-black mb-6">Über BuyAuto</h2>
                <div className="space-y-4 text-neutral-300 text-lg leading-relaxed">
                  <p>
                    "BuyAuto habe ich gebaut, weil ich selbst mein Leasing abgeben wollte – und keine Plattform in der Schweiz gefunden habe, die modern, benutzerfreundlich und klar auf Leasingübernahmen ausgerichtet ist. Also habe ich eine gebaut."
                  </p>
                  <p>
                    BuyAuto wurde von VincialMedia, meiner eigenen Agentur, entwickelt. Wir bauen digitale Produkte, die echte Probleme lösen – und BuyAuto ist genau so entstanden: aus echter Erfahrung, nicht aus PowerPoint.
                  </p>
                </div>
                <div className="mt-8 pt-8 border-t border-neutral-800">
                  <p className="font-bold text-white text-xl">— Vincent Hänggi</p>
                  <p className="text-primary/80">Gründer von BuyAuto</p>
                </div>
              </div>
            </div>
            <div className="mt-16 text-center">
              <p className="text-xs text-neutral-500 uppercase tracking-widest">
                Hinweis: BuyAuto ist eine unabhängige Plattform und steht in keiner offiziellen Verbindung zu AutoScout24.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-20 px-4 bg-white scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-black text-neutral-900 mb-4">
                Häufige Fragen
              </h2>
              <p className="text-neutral-600 text-lg">Alles zur Leasingübernahme</p>
            </div>
            
            <Accordion type="single" collapsible className="w-full space-y-4">
              {[
                {
                  q: "Muss der Leasinggeber einer Leasingübernahme zustimmen?",
                  a: "Ja, der Leasingvertrag besteht zwischen dir und der Bank. Ein Wechsel des Vertragspartners bedarf immer der Zustimmung der Bank. Diese prüft vor allem die Bonität des neuen Leasingnehmers."
                },
                {
                  q: "Wird eine Bonitätsprüfung gemacht?",
                  a: "Absolut. Der neue Leasingnehmer muss finanziell in der Lage sein, die Raten zu tragen. Ein Betreibungsauszug und Lohnausweis sind Standard."
                },
                {
                  q: "Welche Kosten entstehen bei einer Leasingübernahme?",
                  a: "Die Bank verrechnet meist eine Umschreibegebühr (ca. CHF 300–600). Wer diese übernimmt (alter oder neuer Leasingnehmer), ist Verhandlungssache. Dies ist aber fast immer günstiger als eine vorzeitige Kündigung."
                },
                {
                  q: "Wie lange dauert eine Leasingübernahme?",
                  a: "Wenn ein Interessent gefunden ist und alle Unterlagen (Betreibungsauszug, Lohnausweis etc.) vorliegen, braucht die Bank oft nur wenige Tage bis eine Woche für die Prüfung und Vertragserstellung."
                },
                {
                  q: "Kann ich mein Leasing-Auto einfach verkaufen?",
                  a: "Nein, das Auto gehört der Leasingbank. Du kannst es nicht verkaufen, es sei denn, du kaufst es vorher aus dem Vertrag heraus (was teuer ist). Die Leasingübernahme ist der Weg, den Vertrag zu übertragen."
                },
                {
                  q: "Welche Angaben gehören ins Inserat, damit es schneller geht?",
                  a: "Sei transparent: Monatliche Rate, genaue Restlaufzeit, aktuelle Kilometer, Restkilometer, allfällige Anzahlung und der Name der Leasingbank sind entscheidend für Interessenten."
                },
                {
                  q: "Was passiert nach der Bewilligung?",
                  a: "Die Bank schickt den Umschreibungsvertrag. Wenn beide Parteien unterschrieben haben (und die Umschreibegebühr bezahlt ist), kann das Fahrzeug offiziell übergeben werden."
                },
                {
                  q: "Worauf sollte man bei der Fahrzeugübergabe achten?",
                  a: "Erstellt ein Übergabeprotokoll! Haltet Schäden, Kilometerstand und Zubehör schriftlich fest. Informiert auch die Versicherung über den Halterwechsel."
                }
              ].map((faq, i) => (
                <AccordionItem 
                  key={i}
                  value={`item-${i}`} 
                  className="bg-neutral-50 rounded-2xl border-2 border-neutral-200 px-8 hover:border-primary/50 transition-all duration-300 data-[state=open]:bg-white data-[state=open]:shadow-lg"
                >
                  <AccordionTrigger className="text-left font-bold text-neutral-900 hover:no-underline py-6 text-lg">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-neutral-600 leading-relaxed pb-6 text-base">
                    <div dangerouslySetInnerHTML={{ __html: faq.a }} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-24 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 px-4 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-primary rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary rounded-full blur-3xl" />
          </div>

          <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <Sparkles className="w-4 h-4" />
              Bereit für den Wechsel?
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
              Die spezialisierte Alternative<br />
              <span className="text-primary">für Leasingübernahmen</span>
            </h2>
            <p className="text-neutral-300 max-w-2xl mx-auto text-xl leading-relaxed">
              Erstelle jetzt dein Inserat auf der Plattform, die Leasing versteht.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <Button 
                asChild 
                size="lg" 
                className="w-full sm:w-auto h-16 px-10 text-xl font-black bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-2xl shadow-primary/40 transition-all group"
              >
                <Link href="/inserat-erstellen">
                  Leasing abgeben (Inserat erstellen)
                  <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button 
                asChild 
                size="lg" 
                variant="outline" 
                className="w-full sm:w-auto h-16 px-10 text-xl font-black border-2 border-white text-white hover:bg-white hover:text-neutral-900 rounded-2xl bg-transparent transition-all"
              >
                <Link href="/suche">
                  Leasing übernehmen (Inserate)
                </Link>
              </Button>
            </div>
            
            {/* Trust Indicators */}
            <div className="pt-12 flex flex-wrap items-center justify-center gap-8 text-neutral-400 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>100% spezialisiert</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-green-400" />
                <span>Sicher & transparent</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-green-400" />
                <span>Klare Daten</span>
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