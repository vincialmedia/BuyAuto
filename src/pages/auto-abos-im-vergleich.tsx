import Head from "next/head";
import Link from "next/link";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useState, useEffect } from "react";
import { 
  Check, 
  ChevronRight, 
  AlertTriangle, 
  FileText, 
  ShieldCheck, 
  TrendingDown, 
  Clock, 
  Zap, 
  Users, 
  BadgeCheck, 
  MapPin, 
  DollarSign, 
  FileCheck, 
  Search, 
  ArrowRight, 
  UserCheck, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Phone,
  Sparkles,
  TrendingUp,
  X,
  Car,
  Calendar,
  Settings,
  Coins
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
import { Badge } from "@/components/ui/badge";

export default function AutoAbosImVergleich() {
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

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const providers = [
    {
      name: "Carvolution",
      type: "Auto-Abo",
      strength: "Marktführer, grosse Auswahl, digitaler Prozess",
      catch: "Oft Mindestlaufzeiten, Zusatzkilometer teuer",
      target: "Der Klassiker-Sucher"
    },
    {
      name: "Carify",
      type: "Plattform",
      strength: "Grosse Auswahl (Partnergaragen), alles in einem",
      catch: "Preis variiert je nach Partnergarage",
      target: "Der Vielfalt-Sucher"
    },
    {
      name: "Clyde",
      type: "Auto-Abo (AMAG)",
      strength: "Inkl. Strom (bei EVs), Premium-Service",
      catch: "Eher gehobenes Preissegment",
      target: "E-Auto Einsteiger"
    },
    {
      name: "FlatDrive",
      type: "Sorglos-Abo",
      strength: "Fokus auf Fixpreis & Transparenz",
      catch: "Kleinere Flotte als die Riesen",
      target: "Preisbewusste Planer"
    },
    {
      name: "Emil Frey move",
      type: "Marken-Abo",
      strength: "Riesiges Händlernetz, Top-Service",
      catch: "Markengebunden",
      target: "Service-Liebhaber"
    },
    {
      name: "SIXT+",
      type: "Flex-Abo",
      strength: "Monatlich kündbar, weltweit bekannt",
      catch: "Startgebühr, teuer bei kurzer Dauer",
      target: "Ultra-Flexible"
    }
  ];

  // Additional providers for text listing
  const otherProviders = [
    "Enterprise Minilease", "Hertz Minilease", "Abo@Europcar", "Toyota Rent", 
    "Astara Move", "Upto", "Vivelacar", "e-Joy"
  ];

  return (
    <>
      <Head>
        <title>Auto-Abos im Vergleich 2026: Die besten Anbieter in der Schweiz | BuyAuto</title>
        <meta
          name="description"
          content="Auto-Abos im Vergleich (Schweiz): Carify, Carvolution, Clyde, FlatDrive, SIXT+ & mehr. Unterschiede bei Laufzeit, Leistungen & Flexibilität – plus Alternative."
        />
        <link rel="canonical" href="https://www.buyauto.ch/auto-abos-im-vergleich" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Auto-Abos im Vergleich 2026: Die besten Anbieter in der Schweiz | BuyAuto" />
        <meta property="og:description" content="Auto-Abos im Vergleich (Schweiz): Carify, Carvolution, Clyde, FlatDrive, SIXT+ & mehr. Unterschiede bei Laufzeit, Leistungen & Flexibilität – plus Alternative." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://www.buyauto.ch/auto-abos-im-vergleich" />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
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
                      "name": "Auto-Abo",
                      "item": "https://www.buyauto.ch/auto-abos-im-vergleich"
                    },
                    {
                      "@type": "ListItem",
                      "position": 3,
                      "name": "Auto-Abos im Vergleich"
                    }
                  ]
                },
                {
                  "@type": "FAQPage",
                  "mainEntity": [
                    {
                      "@type": "Question",
                      "name": "Was ist ein Auto-Abo?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Ein Auto-Abo ist eine Art 'All-inclusive'-Miete für ein Auto. Sie zahlen eine monatliche Fixrate, die in der Regel alles ausser Treibstoff/Strom abdeckt: Versicherung, Steuern, Service, Reifen und Wartung."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "Welche Auto-Abo Anbieter gibt es in der Schweiz?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Zu den bekanntesten gehören Carvolution, Carify, Clyde, FlatDrive, Emil Frey move, SIXT+, Hertz Minilease, Enterprise Minilease und Toyota Rent."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "Was ist bei einem Auto-Abo normalerweise inklusive?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Meistens sind Versicherung (Vollkasko), Verkehrsabgaben (Steuern), Service & Wartung, Bereifung (inkl. Wechsel) und Vignette im Preis enthalten. Treibstoff, Parkgebühren und Bussen zahlen Sie selbst."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "Ist ein Auto-Abo günstiger als Leasing?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Nicht zwingend. Auto-Abos bieten mehr Flexibilität und 'All-inclusive'-Komfort, sind aber auf den Monat gerechnet oft teurer als ein Leasing, bei dem Sie Versicherung und Service selbst organisieren können."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "Warum sind Auto-Abos oft teurer pro Monat?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Weil der Anbieter das Risiko für Versicherung, Reparaturen und Wertverlust übernimmt und diesen Service (sowie die administrative Abwicklung) in die Rate einpreist. Sie zahlen für die Bequemlichkeit."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "Welche Anbieter sind besonders flexibel (kurze Laufzeiten)?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "SIXT+, Enterprise Minilease oder Hertz Minilease bieten oft sehr flexible Modelle (z.B. monatlich kündbar). Auch Clyde und Carvolution haben teils kurze Mindestlaufzeiten, oft gegen Aufpreis."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "Worauf muss ich beim Kilometerpaket achten?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Prüfen Sie genau, wie viele Kilometer inklusive sind und was Mehrkilometer kosten. Die Nachzahlung am Ende kann teuer werden. Viele Anbieter erlauben, das Paket monatlich anzupassen."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "Was bedeutet Selbstbehalt bei der Versicherung?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Das ist der Betrag, den Sie im Schadenfall selbst zahlen müssen. Auto-Abos haben oft fixierte Selbstbehalte (z.B. CHF 1000). Vergleichen Sie das, besonders wenn Sie Junglenker sind."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "Was sind Carify Alternativen?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Direkte Alternativen sind Carvolution, Clyde oder FlatDrive. Wenn Sie günstiger fahren wollen und auf das 'Abo-Label' verzichten können, ist eine Leasingübernahme oft eine starke Alternative."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "Wann ist Leasingübernahme die bessere Wahl?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Wenn Sie die monatlichen Fixkosten senken wollen und bereit sind, Versicherung und Service selbst zu managen. Sie übernehmen oft Verträge mit sehr attraktiven 'alten' Konditionen."
                      }
                    }
                  ]
                }
              ]
            })
          }}
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
                  <p className="text-white font-bold text-lg">Vergleich abgeschlossen?</p>
                  <p className="text-white/80 text-sm">Finde jetzt dein Traumauto</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <Button
                    asChild
                    size="lg"
                    className="flex-1 md:flex-none bg-white hover:bg-white/90 text-primary font-black shadow-xl px-8 py-6 rounded-xl"
                  >
                    <Link href="/leasinguebernahme">
                      Leasingübernahmen ansehen
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                  <button
                    onClick={() => setShowStickyCTA(false)}
                    className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                    aria-label="Schließen"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* HERO SECTION - Modern with Image */}
        <section className="relative min-h-[700px] flex items-center overflow-hidden pt-16">
          {/* Background with gradient overlay */}
          <div className="absolute inset-0">
            {/* Hero Image - abstract driving/car theme */}
            <div className="absolute inset-0">
              <Image
                src="/20251209_0003_Handshake_in_Zurich_simple_compose_01kc036j1cff881r0wzwemf48h.png"
                alt="Auto Abos Vergleich Schweiz"
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
                  Marktübersicht 2026
                </div>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-neutral-900 tracking-tight leading-[1.1] mb-6">
                  Auto-Abos im Vergleich:<br />
                  <span className="text-primary">Anbieter & Alternativen</span>
                </h1>
                <p className="text-xl md:text-2xl text-neutral-600 font-medium mb-8 leading-relaxed">
                  Auto-Abo ist das Sorglos-Paket: Fixpreis, wenig Aufwand, schnell. Aber: All-inclusive ist bequem — und genau deshalb oft nicht die günstigste Option. Hier ist der faire Vergleich.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 mb-12">
                  <Button
                    onClick={() => scrollToSection("vergleich")}
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30 transition-all duration-300 px-8 py-7 text-lg font-bold rounded-2xl group"
                  >
                    Auto-Abos vergleichen
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-2 border-neutral-300 text-neutral-900 hover:bg-neutral-100 transition-all duration-300 px-8 py-7 text-lg font-bold rounded-2xl backdrop-blur-sm bg-white/80"
                  >
                    <Link href="/leasinguebernahme">
                      Leasingübernahmen ansehen
                    </Link>
                  </Button>
                </div>

                {/* Mini Trust */}
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-neutral-200/50 shadow-lg max-w-xl">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-6 h-6 text-primary mt-1 shrink-0" />
                    <p className="text-neutral-700 text-sm font-medium leading-relaxed">
                      Anbieter unterscheiden sich stark bei Mindestlaufzeit, Kilometerpaketen, Versicherung/Selbstbehalt und Leistungen — vergleichen lohnt sich.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: WAS IST EIN AUTO-ABO */}
        <section className="py-20 px-4 bg-white scroll-mt-20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-black text-neutral-900 mb-8 leading-tight">
              Was ist ein Auto-Abo <span className="text-primary block text-2xl md:text-3xl mt-2 font-bold">(und warum unterscheiden sie sich so?)</span>
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8 text-left mb-12">
              <div className="bg-neutral-50 p-8 rounded-3xl border border-neutral-100">
                <div className="flex items-center gap-3 mb-4">
                  <BadgeCheck className="w-8 h-8 text-primary" />
                  <h3 className="text-xl font-bold">Das Prinzip</h3>
                </div>
                <p className="text-neutral-600 leading-relaxed">
                  Eine monatliche Pauschale, die (fast) alles abdeckt: Versicherung, Service, Steuern, Reifen. Sie zahlen nur noch den Treibstoff oder Strom. Je nach Anbieter und Paket variieren die Leistungen.
                </p>
              </div>
              
              <div className="bg-neutral-50 p-8 rounded-3xl border border-neutral-100">
                <div className="flex items-center gap-3 mb-4">
                  <Settings className="w-8 h-8 text-primary" />
                  <h3 className="text-xl font-bold">Die Unterschiede</h3>
                </div>
                <ul className="space-y-2 text-neutral-600">
                  <li className="flex gap-2"><Check className="w-4 h-4 text-primary mt-1" /> Mindestlaufzeit & Kündigungsfrist</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 text-primary mt-1" /> Kilometerpakete & Mehrkilometer</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 text-primary mt-1" /> Versicherung: Deckung & Selbstbehalt</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 text-primary mt-1" /> Verfügbarkeit & Fahrzeugwahl</li>
                </ul>
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 inline-block">
              <p className="text-lg text-primary-900 font-medium italic">
                “Auto-Abo ist wie Hotel mit Frühstück: entspannt — aber du zahlst halt auch für Dinge, die du vielleicht gar nicht brauchst.”
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 3: ANBIETER KARTEN */}
        <section className="py-20 px-4 bg-neutral-50 border-t border-neutral-200 scroll-mt-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-black text-neutral-900 mb-4">
                Auto-Abo Anbieter in der Schweiz
              </h2>
              <p className="text-neutral-600 text-lg">Eine Auswahl der wichtigsten Player</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {providers.map((p, i) => (
                <Card key={i} className="border-none shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white">
                  <CardContent className="p-8">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-2xl font-black text-neutral-900">{p.name}</h3>
                      <Badge variant="secondary" className="bg-neutral-100 text-neutral-600 hover:bg-neutral-200">
                        {p.type}
                      </Badge>
                    </div>
                    <div className="space-y-4 mb-6">
                      <div>
                        <span className="text-sm font-bold text-green-600 flex items-center gap-2 mb-1">
                          <CheckCircle className="w-4 h-4" /> Stärke
                        </span>
                        <p className="text-neutral-600 text-sm leading-relaxed">{p.strength}</p>
                      </div>
                      <div>
                        <span className="text-sm font-bold text-amber-600 flex items-center gap-2 mb-1">
                          <AlertCircle className="w-4 h-4" /> Beachten
                        </span>
                        <p className="text-neutral-600 text-sm leading-relaxed">{p.catch}</p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-neutral-100">
                      <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">Passt für</p>
                      <p className="text-neutral-900 font-bold">{p.target}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Other Mentions */}
              <Card className="border-2 border-dashed border-neutral-300 bg-transparent shadow-none flex flex-col justify-center items-center text-center p-8">
                <p className="text-neutral-500 font-bold mb-4">Weitere Anbieter:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {otherProviders.map((op, i) => (
                    <span key={i} className="text-neutral-500 text-sm bg-neutral-100 px-2 py-1 rounded-md">
                      {op}
                    </span>
                  ))}
                </div>
              </Card>
            </div>
            
            <p className="text-center text-sm text-neutral-400 mt-8 italic max-w-3xl mx-auto">
              Hinweis: Der Markt ist dynamisch. Angebote, Mindestlaufzeiten und Inklusivleistungen ändern sich je nach Anbieter, Fahrzeug und Paket.
            </p>
          </div>
        </section>

        {/* SECTION 4: VERGLEICHSTABELLE */}
        <section id="vergleich" className="py-20 px-4 bg-white scroll-mt-20">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-black text-neutral-900 text-center mb-12">
              Auto-Abos im Vergleich (Schweiz) — auf einen Blick
            </h2>
            
            <div className="overflow-x-auto rounded-3xl border border-neutral-200 shadow-lg bg-white mb-12">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 text-neutral-900 border-b border-neutral-200">
                    <th className="p-6 font-black whitespace-nowrap">Anbieter</th>
                    <th className="p-6 font-black whitespace-nowrap">Modell</th>
                    <th className="p-6 font-black min-w-[200px]">Typische Stärke</th>
                    <th className="p-6 font-black min-w-[200px]">Zu beachten</th>
                    <th className="p-6 font-black min-w-[200px]">Für wen?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {providers.map((p, i) => (
                    <tr key={i} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="p-6 font-bold text-lg text-primary">{p.name}</td>
                      <td className="p-6 text-neutral-600 font-medium">{p.type}</td>
                      <td className="p-6 text-neutral-700">{p.strength}</td>
                      <td className="p-6 text-neutral-500 text-sm">{p.catch}</td>
                      <td className="p-6 text-neutral-900 font-medium">{p.target}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild size="lg" className="rounded-full h-14 px-8 text-lg font-bold bg-primary hover:bg-primary/90 shadow-lg">
                <Link href="/leasinguebernahme">Leasingübernahmen ansehen</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full h-14 px-8 text-lg font-bold">
                <Link href="/inserat-erstellen">Leasing abgeben</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* SECTION 5: CHECKLISTE */}
        <section className="py-20 px-4 bg-neutral-900 text-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black mb-10 text-center">
              Worauf du beim Auto-Abo Vergleich wirklich achten solltest
            </h2>
            
            <div className="grid md:grid-cols-2 gap-x-12 gap-y-6">
              {[
                "Mindestlaufzeit & Kündigungsfrist",
                "Kilometerpaket & Mehrkilometer-Kosten",
                "Versicherung: Deckung & Selbstbehalt",
                "Fahrer:innen-Regelung (wer darf fahren?)",
                "Verfügbarkeit / Lieferzeit",
                "Zusatzkosten/Startgebühren (je nach Anbieter)"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0 text-white font-bold">
                    {i + 1}
                  </div>
                  <span className="font-medium text-lg text-neutral-200">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 6: CARIFY ALTERNATIVEN */}
        <section className="py-20 px-4 bg-white">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="outline" className="mb-4 border-neutral-300 text-neutral-500">Keyword Fokus</Badge>
            <h2 className="text-3xl font-black text-neutral-900 mb-6">
              Carify Alternativen: Welche Anbieter sind ähnlich?
            </h2>
            <p className="text-neutral-600 text-lg leading-relaxed mb-8">
              Wenn du nach "Carify Alternativen" suchst, meinst du meistens: ein ähnliches Auto-Abo, aber mit anderer Laufzeit, Auswahl oder Konditionen. 
              Die naheliegendsten Alternativen sind <strong>Carvolution</strong>, <strong>Clyde</strong>, <strong>FlatDrive</strong>, <strong>SIXT+</strong> oder <strong>Emil Frey move</strong>.
              Wirf einen Blick in unsere Vergleichstabelle oben, um den besten Match zu finden.
            </p>
            <div className="bg-amber-50 border-l-4 border-amber-400 p-6 text-left rounded-r-xl">
              <p className="text-amber-900 font-medium">
                <span className="font-bold">Pro-Tipp:</span> Für den besten Match lohnt sich der Vergleich nach Mindestlaufzeit, Inklusiv-Kilometern und dem Versicherungs-Selbstbehalt.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 7: PLOT TWIST */}
        <section className="py-20 px-4 bg-gradient-to-br from-primary/10 to-transparent relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 bg-white text-primary px-4 py-2 rounded-full text-sm font-bold shadow-sm mb-6">
              <Zap className="w-4 h-4" />
              Der Geheimtipp
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-neutral-900 mb-6">
              Günstigere Alternative zum Auto-Abo:<br />
              <span className="text-primary">Leasingübernahme</span>
            </h2>
            
            <div className="prose prose-lg mx-auto text-neutral-600 mb-10">
              <p>
                Auto-Abo folgt einer <strong>Paketlogik</strong> (Komfort, Fixpreis). Eine Leasingübernahme bedeutet, dass du einen <strong>bestehenden Leasingvertrag</strong> übernimmst. 
                Du profitierst von der (oft kurzen) Restlaufzeit und den originalen Konditionen, regelst aber die Versicherung separat. 
                Dadurch hast du oft mehr Kontrolle über dein Monatsbudget.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-xl border border-neutral-100 mb-10 transform rotate-1 hover:rotate-0 transition-transform duration-300">
              <p className="text-2xl font-black text-primary-900 italic">
                “Wenn du keine Lust hast, die Komfort-Steuer zu zahlen: Leasingübernahme ist für viele der Cheatcode.”
              </p>
            </div>

            <p className="text-sm text-neutral-500 max-w-2xl mx-auto italic">
              Ob es günstiger ist, hängt vom Auto, Vertrag und deiner Versicherung ab — aber wenn du den Monatsbetrag optimieren willst, lohnt sich Leasingübernahme fast immer als erster Check.
            </p>
          </div>
        </section>

        {/* SECTION 8: COMPARISON BOX */}
        <section className="py-20 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-black text-neutral-900 text-center mb-16">
              Auto-Abo oder Leasingübernahme? <br className="hidden md:block"/>
              <span className="text-neutral-400">Der ehrliche Vergleich</span>
            </h2>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
              {/* Left: Auto-Abo */}
              <Card className="rounded-3xl border-2 border-neutral-100 bg-neutral-50 hover:border-neutral-200 transition-all">
                <CardContent className="p-8 md:p-10">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-black text-neutral-900">Auto-Abo</h3>
                    <Badge variant="secondary" className="bg-neutral-200 text-neutral-700 px-3 py-1 text-sm font-bold">Sorglos-Modus ✅</Badge>
                  </div>
                  <ul className="space-y-6 mb-8">
                    <li className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 border border-neutral-200 shadow-sm text-xl">📦</div>
                      <div>
                        <span className="font-bold text-neutral-900 block text-lg">Fixpreis-Logik</span>
                        <span className="text-neutral-600">Viele Kosten sind gebündelt (je nach Anbieter/Paket).</span>
                      </div>
                    </li>
                    <li className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 border border-neutral-200 shadow-sm text-xl">🛋️</div>
                      <div>
                        <span className="font-bold text-neutral-900 block text-lg">Bequem</span>
                        <span className="text-neutral-600">Weniger Organisieren (Versicherung/Service oft inkludiert).</span>
                      </div>
                    </li>
                    <li className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 border border-neutral-200 shadow-sm text-xl">🎯</div>
                      <div>
                        <span className="font-bold text-neutral-900 block text-lg">Planbar</span>
                        <span className="text-neutral-600">Passt, wenn Komfort & Planbarkeit Priorität haben.</span>
                      </div>
                    </li>
                  </ul>
                  <div className="p-4 bg-white rounded-xl text-sm text-neutral-500 italic border border-neutral-200/50">
                    “Komfort ist selten gratis: du zahlst oft eine Paketlogik, auch wenn du nicht alles ausnutzt.”
                  </div>
                </CardContent>
              </Card>

              {/* Right: BuyAuto */}
              <Card className="rounded-3xl border-4 border-primary/20 bg-primary/5 relative overflow-hidden ring-4 ring-primary/5 shadow-xl">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Coins className="w-32 h-32 text-primary" />
                </div>
                <CardContent className="p-8 md:p-10 relative z-10">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-black text-primary-900">Leasingübernahme</h3>
                    <Badge className="bg-primary text-white px-3 py-1 text-sm font-bold">Preis-Optimierer 🧠</Badge>
                  </div>
                  <ul className="space-y-6 mb-8">
                    <li className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 border border-primary/20 shadow-sm text-primary text-xl">🤝</div>
                      <div>
                        <span className="font-bold text-neutral-900 block text-lg">Vertrag übernehmen</span>
                        <span className="text-neutral-600">Bestehenden Leasingvertrag übernehmen (Restlaufzeit + Konditionen transparent).</span>
                      </div>
                    </li>
                    <li className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 border border-primary/20 shadow-sm text-primary text-xl">⚙️</div>
                      <div>
                        <span className="font-bold text-neutral-900 block text-lg">Mehr Kontrolle</span>
                        <span className="text-neutral-600">Rate/Laufzeit/Kilometer wählen statt Paket.</span>
                      </div>
                    </li>
                    <li className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 border border-primary/20 shadow-sm text-primary text-xl">📉</div>
                      <div>
                        <span className="font-bold text-neutral-900 block text-lg">Oft günstiger</span>
                        <span className="text-neutral-600">Besonders wenn du Versicherung separat regelst.</span>
                      </div>
                    </li>
                  </ul>
                  <div className="p-4 bg-white/60 backdrop-blur-sm rounded-xl text-sm text-primary-900/70 italic border border-primary/10">
                    “Konditionen hängen vom Inserat & Vertrag ab — darum lohnt sich der Vergleich.”
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="text-center mb-12">
              <p className="text-xl md:text-2xl font-medium text-neutral-800 italic max-w-3xl mx-auto leading-relaxed">
                “Auto-Abo ist wie Hotel mit Frühstück. Leasingübernahme ist wie eine gute Wohnung: weniger inklusive — aber oft günstiger, wenn du’s schlau machst.”
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild size="lg" className="rounded-full h-14 px-8 text-lg font-bold bg-primary hover:bg-primary/90 shadow-lg">
                <Link href="/leasinguebernahme">Leasingübernahmen ansehen</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full h-14 px-8 text-lg font-bold">
                <Link href="/inserat-erstellen">Leasing abgeben</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* SECTION 9: TRUST */}
        <section className="py-20 px-4 bg-neutral-50">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-black text-neutral-900 mb-6">
              Warum BuyAuto hier überhaupt mitredet
            </h2>
            <p className="text-lg text-neutral-600 leading-relaxed mb-8">
              BuyAuto ist auf <Link href="/leasinguebernahme" className="text-primary font-bold hover:underline">Leasingübernahmen</Link> spezialisiert. 
              Wenn du nach dem besten Auto-Abo suchst, ist die Frage dahinter oft: "Wie komme ich günstig und flexibel zu einem Auto?"
              Auto-Abo ist bequem — Leasingübernahme ist für viele die unterschätzte Option, um die Monatsrate zu optimieren.
            </p>
            <div className="text-neutral-900 font-bold mb-12">
              — Vincent Hänggi, Gründer von BuyAuto
            </div>
            <p className="text-xs text-neutral-400">
              Disclaimer: BuyAuto ist unabhängig und steht in keiner Verbindung zu den genannten Anbietern (Carify, Carvolution, etc.).
            </p>
          </div>
        </section>

        {/* SECTION 10: FAQ */}
        <section className="py-20 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-black text-neutral-900 mb-4">
                FAQ: Auto-Abos im Vergleich (Schweiz)
              </h2>
              <p className="text-neutral-600 text-lg">Schnelle Antworten auf deine Fragen</p>
            </div>
            
            <Accordion type="single" collapsible className="w-full space-y-4">
              {[
                {
                  q: "Was ist ein Auto-Abo?",
                  a: "Ein Auto-Abo ist eine Art 'All-inclusive'-Miete für ein Auto. Sie zahlen eine monatliche Fixrate, die in der Regel alles ausser Treibstoff/Strom abdeckt: Versicherung, Steuern, Service, Reifen und Wartung."
                },
                {
                  q: "Welche Auto-Abo Anbieter gibt es in der Schweiz?",
                  a: "Zu den bekanntesten gehören Carvolution, Carify, Clyde, FlatDrive, Emil Frey move, SIXT+, Hertz Minilease, Enterprise Minilease und Toyota Rent."
                },
                {
                  q: "Was ist bei einem Auto-Abo normalerweise inklusive?",
                  a: "Meistens sind Versicherung (Vollkasko), Verkehrsabgaben (Steuern), Service & Wartung, Bereifung (inkl. Wechsel) und Vignette im Preis enthalten. Treibstoff, Parkgebühren und Bussen zahlen Sie selbst."
                },
                {
                  q: "Ist ein Auto-Abo günstiger als Leasing?",
                  a: "Nicht zwingend. Auto-Abos bieten mehr Flexibilität und 'All-inclusive'-Komfort, sind aber auf den Monat gerechnet oft teurer als ein Leasing, bei dem Sie Versicherung und Service selbst organisieren können."
                },
                {
                  q: "Warum sind Auto-Abos oft teurer pro Monat?",
                  a: "Weil der Anbieter das Risiko für Versicherung, Reparaturen und Wertverlust übernimmt und diesen Service (sowie die administrative Abwicklung) in die Rate einpreist. Sie zahlen für die Bequemlichkeit."
                },
                {
                  q: "Welche Anbieter sind besonders flexibel (kurze Laufzeiten)?",
                  a: "SIXT+, Enterprise Minilease oder Hertz Minilease bieten oft sehr flexible Modelle (z.B. monatlich kündbar). Auch Clyde und Carvolution haben teils kurze Mindestlaufzeiten, oft gegen Aufpreis."
                },
                {
                  q: "Worauf muss ich beim Kilometerpaket achten?",
                  a: "Prüfen Sie genau, wie viele Kilometer inklusive sind und was Mehrkilometer kosten. Die Nachzahlung am Ende kann teuer werden. Viele Anbieter erlauben, das Paket monatlich anzupassen."
                },
                {
                  q: "Was bedeutet Selbstbehalt bei der Versicherung?",
                  a: "Das ist der Betrag, den Sie im Schadenfall selbst zahlen müssen. Auto-Abos haben oft fixierte Selbstbehalte (z.B. CHF 1000). Vergleichen Sie das, besonders wenn Sie Junglenker sind."
                },
                {
                  q: "Was sind Carify Alternativen?",
                  a: "Direkte Alternativen sind Carvolution, Clyde oder FlatDrive. Wenn Sie günstiger fahren wollen und auf das 'Abo-Label' verzichten können, ist eine <Link href='/leasinguebernahme' class='text-primary hover:underline font-bold'>Leasingübernahme</Link> oft eine starke Alternative."
                },
                {
                  q: "Wann ist Leasingübernahme die bessere Wahl?",
                  a: "Wenn Sie die monatlichen Fixkosten senken wollen und bereit sind, Versicherung und Service selbst zu managen. Sie übernehmen oft Verträge mit sehr attraktiven 'alten' Konditionen."
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

        {/* FINAL CTA - Premium Dark Section */}
        <section className="py-24 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 px-4 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-primary rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary rounded-full blur-3xl" />
          </div>

          <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <Sparkles className="w-4 h-4" />
              Fazit
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
              Vergleich gemacht —<br />
              <span className="text-primary">jetzt die Monatsrate optimieren.</span>
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <Button 
                asChild 
                size="lg" 
                className="w-full sm:w-auto h-16 px-10 text-xl font-black bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-2xl shadow-primary/40 transition-all group"
              >
                <Link href="/leasinguebernahme">
                  Leasingübernahmen ansehen
                  <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button 
                asChild 
                size="lg" 
                variant="outline" 
                className="w-full sm:w-auto h-16 px-10 text-xl font-black border-2 border-white text-white hover:bg-white hover:text-neutral-900 rounded-2xl bg-transparent transition-all"
              >
                <Link href="/inserat-erstellen">
                  Leasing abgeben
                </Link>
              </Button>
            </div>
            
            {/* Trust Indicators */}
            <div className="pt-12 flex flex-wrap items-center justify-center gap-8 text-neutral-400 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>Unabhängig</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-green-400" />
                <span>Fairer Vergleich</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-green-400" />
                <span>Schweizer Plattform</span>
              </div>
            </div>
          </div>
        </section>

        {/* PREMIUM LISTINGS - Dynamic Load */}
        <PremiumListings />
        
      </main>
    </>
  );
}