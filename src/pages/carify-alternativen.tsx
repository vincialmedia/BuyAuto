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
  Car,
  Calendar,
  CreditCard,
  Sparkles,
  Info,
  LayoutGrid,
  ThumbsUp,
  X
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

export default function CarifyAlternativen() {
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

  // Structured Data (JSON-LD)
  const structuredData = {
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
            "item": "https://www.buyauto.ch/auto-abo"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": "Carify Alternativen",
            "item": "https://www.buyauto.ch/carify-alternativen"
          }
        ]
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Was sind die besten Carify Alternativen in der Schweiz?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Zu den bekanntesten Alternativen gehören Carvolution, Clyde, FlatDrive und SIXT+. Wer jedoch primär auf den Preis achtet und flexible Laufzeiten sucht, sollte auch Leasingübernahmen (z.B. via BuyAuto) prüfen, da diese oft günstigere Raten ohne 'Paket-Aufschlag' bieten."
            }
          },
          {
            "@type": "Question",
            "name": "Was ist bei Carify im Preis enthalten?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Carify bietet klassische Auto-Abos an: Versicherung, Steuern, Zulassung, Service und Wartung sind in der monatlichen Rate enthalten. Nur Tanken/Laden musst du selbst bezahlen. Das ist bequem, aber diese Bequemlichkeit zahlst du über die monatliche Rate mit."
            }
          },
          {
            "@type": "Question",
            "name": "Ist ein Auto-Abo günstiger als Leasing?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Nicht zwingend. Auto-Abos wirken auf den ersten Blick teurer, weil alles inklusive ist. Reines Leasing hat niedrigere Raten, aber du zahlst Versicherung und Service separat. Unterm Strich ist Leasing (oder eine Leasingübernahme) oft günstiger, wenn du Versicherung und Unterhalt selbst optimierst."
            }
          },
          {
            "@type": "Question",
            "name": "Warum sind Auto-Abos oft teurer pro Monat?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Du zahlst für Flexibilität (kurze Laufzeiten) und das 'Sorglos-Paket'. Die Anbieter kalkulieren Risiken und Administrationsaufwand in die Rate ein. Bei einer Leasingübernahme fallen diese Zusatzmargen weg, da du einen bestehenden Vertrag 1:1 übernimmst."
            }
          },
          {
            "@type": "Question",
            "name": "Welche Carify Alternative ist am flexibelsten?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "SIXT+ oder Enterprise Minilease bieten sehr flexible Modelle (oft monatlich kündbar). Carvolution und Clyde haben feste Laufzeiten (3-48 Monate). Leasingübernahmen sind ebenfalls flexibel, da du Verträge mit kurzen Restlaufzeiten (z.B. 12 Monate) gezielt suchen kannst."
            }
          },
          {
            "@type": "Question",
            "name": "Was ist eine Leasingübernahme?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Bei einer Leasingübernahme übernimmst du einen laufenden Leasingvertrag von einer anderen Person. Du steigst zu den bestehenden (oft alten, günstigen) Konditionen ein und übernimmst das Auto für die Restlaufzeit. Ideal für kurze Laufzeiten ohne Anzahlung."
            }
          },
          {
            "@type": "Question",
            "name": "Ist Leasingübernahme riskant?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Nein, wenn man es richtig macht. Der Vertrag wird offiziell über die Leasingbank umgeschrieben. Du solltest das Auto vor Übernahme prüfen (Zustand, Kilometer). BuyAuto hilft dir, transparente Angebote zu finden."
            }
          },
          {
            "@type": "Question",
            "name": "Wie finde ich eine Leasingübernahme mit kurzer Restlaufzeit?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Auf Plattformen wie BuyAuto.ch kannst du gezielt nach Restlaufzeit filtern. Viele Inserenten wollen ihr Leasing nach 1-2 Jahren abgeben, sodass du perfekte Laufzeiten für den Übergang findest."
            }
          },
          {
            "@type": "Question",
            "name": "Welche Angaben sind wichtig beim Vergleich (KM, Selbstbehalt, Inklusivleistungen)?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Achte auf die Freikilometer (Mehrkilometer sind teuer!), den Selbstbehalt bei der Versicherung (oft hoch bei Abos) und die Kündigungsfristen. Beim Leasing: Achte auf den effektiven Zinssatz und Restwert."
            }
          },
          {
            "@type": "Question",
            "name": "Wann ist Auto-Abo trotzdem die bessere Wahl?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Wenn du das Auto nur für sehr kurze Zeit (1-3 Monate) brauchst oder dich absolut nicht um Versicherung und Anmeldung kümmern willst. Für diesen 'Concierge-Service' ist der Aufpreis gerechtfertigt."
            }
          }
        ]
      }
    ]
  };

  return (
    <>
      <Head>
        <title>Carify Alternativen 2026: Auto-Abo Anbieter im Vergleich | BuyAuto</title>
        <meta
          name="description"
          content="Carify Alternativen in der Schweiz: Vergleich von Auto-Abo Anbietern (Carvolution, Clyde, FlatDrive, SIXT+ & mehr) + warum Leasingübernahme oft smarter ist."
        />
        <link rel="canonical" href="https://www.buyauto.ch/carify-alternativen" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Carify Alternativen 2026: Auto-Abo Anbieter im Vergleich | BuyAuto" />
        <meta property="og:description" content="Carify Alternativen in der Schweiz: Vergleich von Auto-Abo Anbietern (Carvolution, Clyde, FlatDrive, SIXT+ & mehr) + warum Leasingübernahme oft smarter ist." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://www.buyauto.ch/carify-alternativen" />

        {/* JSON-LD Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
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
                  <p className="text-white font-bold text-lg">Carify Alternative gesucht?</p>
                  <p className="text-white/80 text-sm">Vergleiche Auto-Abos oder finde Leasingübernahmen</p>
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

        {/* HERO SECTION */}
        <section className="relative min-h-[700px] flex items-center overflow-hidden pt-16">
          {/* Background with gradient overlay */}
          <div className="absolute inset-0">
            {/* Hero Image */}
            <div className="absolute inset-0">
              <Image
                src="/20251209_0003_Handshake_in_Zurich_simple_compose_01kc036j1cff881r0wzwemf48h.png"
                alt="Autoübergabe Schweiz"
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
                  Auto-Abo Vergleich Schweiz (2025)
                </div>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-neutral-900 tracking-tight leading-[1.1] mb-6">
                  Carify Alternativen:<br />
                  <span className="text-primary">Anbieter im Vergleich.</span>
                </h1>
                <p className="text-xl md:text-2xl text-neutral-600 font-medium mb-8 leading-relaxed">
                  Carify ist ein starkes Sorglos-Paket. Aber wenn du Preise, Laufzeiten und Bedingungen vergleichst, merkst du schnell: All-inclusive ist bequem – und genau deshalb nicht immer die günstigste Wahl.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <Button
                    asChild
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30 transition-all duration-300 px-8 py-7 text-lg font-bold rounded-2xl group"
                  >
                    <Link href="/leasinguebernahme">
                      Leasingübernahmen ansehen
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-2 border-neutral-300 text-neutral-900 hover:bg-neutral-100 transition-all duration-300 px-8 py-7 text-lg font-bold rounded-2xl backdrop-blur-sm bg-white/80"
                  >
                    <Link href="/inserat-erstellen">
                      Leasing abgeben
                    </Link>
                  </Button>
                </div>

                <div className="text-sm text-neutral-500 max-w-lg bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-neutral-200">
                  <Info className="w-4 h-4 inline-block mr-2 text-primary" />
                  Auto-Abos bündeln oft Versicherung, Service/Wartung und Steuern in einer Monatsrate. Das schafft Komfort – aber du zahlst dafür meist eine Paketlogik.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: WHY ALTERNATIVES */}
        <section className="py-20 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-black text-neutral-900 mb-4">
                Warum suchen Leute nach Carify Alternativen?
              </h2>
              <p className="text-neutral-600 text-lg max-w-2xl mx-auto">
                Ein Auto-Abo ist wie ein Hotel mit Frühstück: entspannter — aber du zahlst halt auch für Dinge, die du vielleicht gar nicht brauchst.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: DollarSign, title: "Günstigere Rate", desc: "Viele suchen eine reine Fahrzeugrate ohne teure 'All-inclusive' Aufschläge." },
                { icon: Clock, title: "Laufzeit & Flexibilität", desc: "Starre Abo-Laufzeiten passen nicht immer. Manchmal braucht man genau 14 Monate." },
                { icon: Car, title: "Fahrzeugauswahl", desc: "Mehr Modelle, spezifische Ausstattungen oder sofort verfügbare Occasionen." },
                { icon: ShieldCheck, title: "Versicherung", desc: "Wer schon eine gute Versicherungseinstufung hat, zahlt im Abo oft drauf." },
                { icon: Zap, title: "Schnelle Verfügbarkeit", desc: "Nicht alle Abo-Autos sind sofort lieferbar. Leasingübernahmen oft schon." },
                { icon: LayoutGrid, title: "Mehr Kontrolle", desc: "Selbst entscheiden, wo man Service macht und wie hoch der Selbstbehalt ist." }
              ].map((item, i) => (
                <div
                  key={i}
                  className="group bg-neutral-50 rounded-3xl p-8 border border-neutral-100 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                >
                  <div className="bg-white w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                    <item.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-black text-neutral-900 mb-3">{item.title}</h3>
                  <p className="text-neutral-600 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 3: ALTERNATIVES LIST */}
        <section className="py-20 px-4 bg-gradient-to-b from-neutral-50 to-white">
          <div className="max-w-6xl mx-auto">
            <div className="mb-16">
              <h2 className="text-4xl md:text-5xl font-black text-neutral-900 mb-4">
                Die wichtigsten Carify Alternativen (Schweiz)
              </h2>
              <p className="text-neutral-600 text-lg">
                Der Markt ist dynamisch: Angebote, Mindestlaufzeiten und Inklusivleistungen ändern sich je nach Anbieter und Paket.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { 
                  name: "Carvolution", 
                  type: "Auto-Abo Marktführer",
                  desc: "Der bekannteste Player neben Carify. Oft grosse Auswahl an Neuwagen.",
                  fit: "Für alle, die das klassische 'Netflix fürs Auto' suchen."
                },
                { 
                  name: "Clyde", 
                  type: "AMAG Tochter",
                  desc: "Fokus auf E-Mobilität und flexible Laufzeiten. Starke Einbindung ins AMAG-Netz.",
                  fit: "Für Elektro-Einsteiger und AMAG-Fans."
                },
                { 
                  name: "FlatDrive", 
                  type: "Sorglos-Abo",
                  desc: "Fokus auf Fixpreis und All-inclusive, oft auch für jüngere Lenker interessant.",
                  fit: "Wenn Planbarkeit das Wichtigste ist."
                },
                { 
                  name: "Emil Frey move", 
                  type: "Händler-Abo",
                  desc: "Das Abo-Angebot der Emil Frey Gruppe. Riesige Flotte und Händlernetz.",
                  fit: "Wenn du Service direkt beim Händler willst."
                },
                { 
                  name: "SIXT+", 
                  type: "Premium Flexibilität",
                  desc: "Sehr flexibel, oft monatlich kündbar oder pausierbar. Premium-Flotte.",
                  fit: "Für maximale Flexibilität und kurze Überbrückungen."
                },
                { 
                  name: "Enterprise / Hertz Minilease", 
                  type: "Langzeitmiete",
                  desc: "Klassische Autovermieter mit Langzeit-Tarifen (Monatsbasis).",
                  fit: "Für spontanen Bedarf ohne lange Bindung."
                },
                { 
                  name: "Upto / Astara Move", 
                  type: "Weitere Anbieter",
                  desc: "Solide Alternativen mit wechselnden Angeboten und Marken.",
                  fit: "Lohnt sich für den breiten Vergleich."
                },
                { 
                  name: "Toyota Rent / Marken-Abos", 
                  type: "Hersteller-Abos",
                  desc: "Direkt vom Hersteller/Importeur. Oft gute Konditionen für spezifische Modelle.",
                  fit: "Wenn du genau weisst, welche Marke du willst."
                },
                { 
                  name: "Abo@Europcar", 
                  type: "Rental-Abo",
                  desc: "Mietwagen-Logik auf Monatsbasis, oft schnell verfügbar.",
                  fit: "Für unkomplizierte Mobilität zwischendurch."
                }
              ].map((provider, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 hover:border-primary/50 transition-colors">
                  <div className="text-xs font-bold text-primary uppercase tracking-wider mb-2">{provider.type}</div>
                  <h3 className="text-2xl font-black text-neutral-900 mb-2">{provider.name}</h3>
                  <p className="text-neutral-600 text-sm mb-4">{provider.desc}</p>
                  <div className="pt-4 border-t border-neutral-100 flex items-center gap-2 text-sm font-medium text-neutral-800">
                    <ThumbsUp className="w-4 h-4 text-green-500" />
                    {provider.fit}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 4: COMPARISON TABLE */}
        <section className="py-20 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-black text-neutral-900 mb-4">
                Vergleich: Carify vs. Alternativen
              </h2>
              <p className="text-neutral-600 text-lg">
                Auf einen Blick (Preise & Verfügbarkeiten variieren je nach Angebot)
              </p>
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block overflow-hidden rounded-3xl border border-neutral-200 shadow-xl">
              <table className="w-full text-left border-collapse bg-white">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200">
                    <th className="p-6 font-black text-neutral-900 w-1/5">Anbieter</th>
                    <th className="p-6 font-bold text-neutral-600 w-1/5">Modell</th>
                    <th className="p-6 font-bold text-neutral-600 w-1/5">Stärke</th>
                    <th className="p-6 font-bold text-neutral-600 w-1/5">Haken (neutral)</th>
                    <th className="p-6 font-bold text-neutral-600 w-1/5">Für wen?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {[
                    { name: "Carify", model: "Plattform / Abo", strength: "Grosse Auswahl (Partnernetz)", hook: "Preise variieren stark", target: "Allrounder" },
                    { name: "Carvolution", model: "Auto-Abo", strength: "Marktführer, Service", hook: "Oft fixe Laufzeiten", target: "Sorglos-Fahrer" },
                    { name: "Clyde", model: "Auto-Abo (AMAG)", strength: "E-Mobilität, Ökosystem", hook: "Fokus auf AMAG-Marken", target: "E-Auto Fans" },
                    { name: "FlatDrive", model: "All-inclusive Abo", strength: "Transparenz, Fixpreis", hook: "Kleinere Flotte", target: "Budget-Planer" },
                    { name: "SIXT+", model: "Premium Flex", strength: "Monatlich kündbar, Premium", hook: "Eher teurer", target: "Kurzzeit-Nutzer" },
                    { name: "BuyAuto", model: "Leasingübernahme", strength: "Beste Raten (Preis-Leistung)", hook: "Versicherung exklusive", target: "Sparfüchse" },
                  ].map((row, i) => (
                    <tr key={i} className={`hover:bg-neutral-50/50 ${row.name === "BuyAuto" ? "bg-primary/5" : ""}`}>
                      <td className={`p-6 font-black ${row.name === "BuyAuto" ? "text-primary" : "text-neutral-900"}`}>{row.name}</td>
                      <td className="p-6 text-neutral-700">{row.model}</td>
                      <td className="p-6 text-neutral-700 font-medium text-green-700">{row.strength}</td>
                      <td className="p-6 text-neutral-500">{row.hook}</td>
                      <td className="p-6 text-neutral-700 font-medium">{row.target}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4">
              {[
                { name: "Carify", model: "Plattform", text: "Starkes Partnernetz, Preise variieren." },
                { name: "Carvolution", model: "Abo-Marktführer", text: "Guter Service, oft fixe Laufzeiten." },
                { name: "SIXT+", model: "Premium Flex", text: "Monatlich kündbar, aber eher teurer." },
                { name: "BuyAuto (Leasingübernahme)", model: "Preissieger", text: "Beste Raten, Versicherung selber regeln.", highlight: true },
              ].map((card, i) => (
                <div key={i} className={`p-6 rounded-2xl border ${card.highlight ? "border-primary bg-primary/5" : "border-neutral-200 bg-white"} shadow-sm`}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={`text-xl font-black ${card.highlight ? "text-primary" : "text-neutral-900"}`}>{card.name}</h3>
                    <span className="text-xs font-bold uppercase tracking-wider bg-neutral-100 px-2 py-1 rounded text-neutral-600">{card.model}</span>
                  </div>
                  <p className="text-neutral-600">{card.text}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 flex flex-col sm:flex-row justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-6 text-lg rounded-xl shadow-lg"
              >
                <Link href="/leasinguebernahme">
                  Leasingübernahmen ansehen
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="text-neutral-600 hover:text-neutral-900 font-medium"
              >
                <Link href="/inserat-erstellen">
                  Leasing abgeben
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* SECTION 5: PLOT TWIST (Leasingübernahme) */}
        <section className="py-24 px-4 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/50 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3" />
          </div>

          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full text-sm font-semibold mb-6 border border-white/20">
              <Zap className="w-4 h-4" />
              Der Geheimtipp
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
              Die oft günstigere Alternative:<br />
              <span className="text-primary">Leasingübernahme.</span>
            </h2>
            <p className="text-xl text-neutral-300 leading-relaxed mb-8 max-w-2xl mx-auto">
              Auto-Abo ist ein Paket (Komfort, alles gebündelt). Bei der Leasingübernahme übernimmst du einen bestehenden Vertrag, organisierst die Versicherung selbst und hast dadurch volle Kontrolle über dein Budget.
            </p>
            
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-white/20 max-w-2xl mx-auto transform hover:scale-[1.02] transition-transform duration-300">
              <p className="text-lg md:text-xl font-bold text-white italic">
                "Wenn du keine Lust hast, die Komfort-Steuer zu zahlen: Leasingübernahme ist für viele der Cheatcode."
              </p>
            </div>

            <div className="mt-8 text-neutral-400 text-sm font-medium">
              Ob das günstiger ist, hängt vom Fahrzeug, Vertrag und deiner Versicherung ab — aber wenn du den reinen Monatsbetrag optimieren willst, lohnt sich der Vergleich fast immer.
            </div>
          </div>
        </section>

        {/* SECTION 6: COMPARISON BOX (Abo vs BuyAuto) */}
        <section className="py-20 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black text-neutral-900 mb-4">
                Auto-Abo oder Leasingübernahme?
              </h2>
              <p className="text-neutral-600 text-lg">Der ehrliche Vergleich.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left: Auto-Abo */}
              <Card className="border-2 border-blue-100 hover:border-blue-200 transition-all duration-300 rounded-3xl overflow-hidden group hover:shadow-2xl">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8">
                    <div className="bg-blue-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-black text-neutral-900 mb-2">Auto-Abo</h3>
                    <div className="text-sm font-bold text-blue-600 bg-blue-200 inline-block px-3 py-1 rounded-full">SORGLOS-MODUS ✅</div>
                  </div>
                  <div className="p-8 bg-white h-full">
                    <div className="space-y-4 mb-8">
                      <div className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                        <span className="text-neutral-700">Fixpreis-Logik: viele Kosten sind gebündelt</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                        <span className="text-neutral-700">Bequem: weniger Organisieren (Versicherung/Service inkl.)</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                        <span className="text-neutral-700">Passt, wenn du Komfort & Planbarkeit priorisierst</span>
                      </div>
                    </div>
                    <p className="text-sm text-neutral-500 italic border-t border-neutral-100 pt-4">
                      Komfort ist selten gratis: du zahlst oft eine Paketlogik, auch wenn du nicht alles ausnutzt.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Right: Leasingübernahme */}
              <Card className="border-4 border-primary/20 hover:border-primary/40 transition-all duration-300 rounded-3xl overflow-hidden shadow-xl group relative">
                <div className="absolute top-4 right-4 z-10">
                  <div className="bg-primary text-white text-xs font-black px-4 py-2 rounded-full flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3" />
                    PREIS-TIPP
                  </div>
                </div>
                <CardContent className="p-0">
                  <div className="bg-gradient-to-br from-primary/10 to-primary/20 p-8">
                    <div className="bg-primary text-white w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
                      <DollarSign className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-black text-neutral-900 mb-2">Leasingübernahme</h3>
                    <div className="text-sm font-bold text-primary bg-white inline-block px-3 py-1 rounded-full border border-primary/20">PREIS-OPTIMIERER 🧠</div>
                  </div>
                  <div className="p-8 bg-white h-full">
                    <div className="space-y-4 mb-8">
                      <div className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                        <span className="text-neutral-700 font-medium">Vertrag übernehmen (Restlaufzeit + Konditionen)</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                        <span className="text-neutral-700 font-medium">Mehr Kontrolle: Rate/Laufzeit/KM selbst wählen</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                        <span className="text-neutral-700 font-medium">Oft günstiger, wenn du Versicherung separat regelst</span>
                      </div>
                    </div>
                    <p className="text-sm text-neutral-500 italic border-t border-neutral-100 pt-4">
                      Konditionen hängen vom Inserat & Vertrag ab — darum lohnt sich Vergleich.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-12 text-center bg-neutral-50 rounded-2xl p-6 md:p-8 border border-neutral-200">
              <p className="text-lg md:text-xl font-bold text-neutral-800">
                Auto-Abo ist wie Hotel mit Frühstück. Leasingübernahme ist wie eine gute Wohnung: weniger inklusive — aber oft günstiger, wenn du's schlau machst.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-6 rounded-xl"
                >
                  <Link href="/leasinguebernahme">
                    Leasingübernahmen ansehen
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-neutral-300 text-neutral-700 hover:bg-neutral-100 px-8 py-6 rounded-xl"
                >
                  <Link href="/inserat-erstellen">
                    Leasing abgeben
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 7: CHECKLIST */}
        <section className="py-20 px-4 bg-neutral-50">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-black text-neutral-900 mb-4">
                Schnell entscheiden
              </h2>
              <p className="text-neutral-600 text-lg">Auto-Abo oder Leasingübernahme?</p>
            </div>

            <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-neutral-200">
              <div className="space-y-6">
                {[
                  { q: "Willst du Fixpreis & 0 Aufwand?", a: "→ Auto-Abo", icon: Sparkles },
                  { q: "Willst du Monatsrate optimieren?", a: "→ Leasingübernahme prüfen", icon: DollarSign },
                  { q: "Brauchst du das Auto nur 1–2 Monate?", a: "→ Miet-Abo / Langzeitmiete", icon: Calendar },
                  { q: "Brauchst du es 12–36 Monate?", a: "→ Leasingübernahme ideal", icon: CheckCircle },
                  { q: "Stört dich, Versicherung selbst zu organisieren?", a: "→ Wenn ja: Abo. Wenn nein: Leasing.", icon: FileCheck },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-neutral-100 pb-6 last:border-0 last:pb-0">
                    <div className="flex items-center gap-4">
                      <div className="bg-neutral-100 p-2 rounded-lg hidden sm:block">
                        <item.icon className="w-5 h-5 text-neutral-600" />
                      </div>
                      <span className="text-lg md:text-xl font-medium text-neutral-800">{item.q}</span>
                    </div>
                    <span className="text-primary font-black text-right min-w-[140px]">{item.a}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 8: TRUST / ABOUT */}
        <section className="py-20 px-4 bg-white">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-black text-neutral-900 mb-6">
              Warum BuyAuto hier überhaupt mitredet
            </h2>
            <div className="prose prose-lg mx-auto text-neutral-600 leading-relaxed">
              <p>
                BuyAuto ist auf Leasingübernahmen spezialisiert. Wir helfen Leuten, Leasingverträge abzugeben oder zu übernehmen — transparent, modern und ohne Marktplatz-Umwege.
              </p>
              <p>
                Wenn du nach Carify Alternativen suchst, ist das oft die gleiche Frage dahinter: "Wie komme ich günstig und flexibel zu einem Auto?"
                Und genau da ist Leasingübernahme für viele die unterschätzte Option.
              </p>
              <div className="mt-8 font-serif italic text-neutral-800 text-xl">
                — Vincent Hänggi, Gründer von BuyAuto
              </div>
              <p className="mt-12 text-xs text-neutral-400">
                Disclaimer: BuyAuto ist unabhängig und steht in keiner Verbindung zu Carify oder den genannten Anbietern.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 9: FAQ */}
        <section className="py-20 px-4 bg-neutral-50">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-black text-neutral-900 mb-4">
                FAQ zu Carify Alternativen
              </h2>
              <p className="text-neutral-600 text-lg">Alles Wichtige in Kürze</p>
            </div>
            
            <Accordion type="single" collapsible className="w-full space-y-4">
              {[
                {
                  q: "Was sind die besten Carify Alternativen in der Schweiz?",
                  a: "Zu den bekanntesten Alternativen gehören <strong>Carvolution, Clyde, FlatDrive und SIXT+</strong>. Wer jedoch primär auf den Preis achtet und flexible Laufzeiten sucht, sollte auch <strong>Leasingübernahmen (z.B. via BuyAuto)</strong> prüfen, da diese oft günstigere Raten ohne 'Paket-Aufschlag' bieten."
                },
                {
                  q: "Was ist bei Carify im Preis enthalten?",
                  a: "Carify bietet klassische Auto-Abos an: Versicherung, Steuern, Zulassung, Service und Wartung sind in der monatlichen Rate enthalten. Nur Tanken/Laden musst du selbst bezahlen. Das ist bequem, aber diese Bequemlichkeit zahlst du über die monatliche Rate mit."
                },
                {
                  q: "Ist ein Auto-Abo günstiger als Leasing?",
                  a: "Nicht zwingend. Auto-Abos wirken auf den ersten Blick teurer, weil alles inklusive ist. Reines Leasing hat niedrigere Raten, aber du zahlst Versicherung und Service separat. Unterm Strich ist Leasing (oder eine Leasingübernahme) oft günstiger, wenn du Versicherung und Unterhalt selbst optimierst."
                },
                {
                  q: "Warum sind Auto-Abos oft teurer pro Monat?",
                  a: "Du zahlst für Flexibilität (kurze Laufzeiten) und das 'Sorglos-Paket'. Die Anbieter kalkulieren Risiken und Administrationsaufwand in die Rate ein. Bei einer Leasingübernahme fallen diese Zusatzmargen weg, da du einen bestehenden Vertrag 1:1 übernimmst."
                },
                {
                  q: "Welche Carify Alternative ist am flexibelsten?",
                  a: "SIXT+ oder Enterprise Minilease bieten sehr flexible Modelle (oft monatlich kündbar). Carvolution und Clyde haben feste Laufzeiten (3-48 Monate). Leasingübernahmen sind ebenfalls flexibel, da du Verträge mit kurzen Restlaufzeiten (z.B. 12 Monate) gezielt suchen kannst."
                },
                {
                  q: "Was ist eine Leasingübernahme?",
                  a: "Bei einer Leasingübernahme übernimmst du einen laufenden Leasingvertrag von einer anderen Person. Du steigst zu den bestehenden (oft alten, günstigen) Konditionen ein und übernimmst das Auto für die Restlaufzeit. Ideal für kurze Laufzeiten ohne Anzahlung."
                },
                {
                  q: "Ist Leasingübernahme riskant?",
                  a: "Nein, wenn man es richtig macht. Der Vertrag wird offiziell über die Leasingbank umgeschrieben. Du solltest das Auto vor Übernahme prüfen (Zustand, Kilometer). BuyAuto hilft dir, transparente Angebote zu finden."
                },
                {
                  q: "Wie finde ich eine Leasingübernahme mit kurzer Restlaufzeit?",
                  a: "Auf Plattformen wie BuyAuto.ch kannst du gezielt nach Restlaufzeit filtern. Viele Inserenten wollen ihr Leasing nach 1-2 Jahren abgeben, sodass du perfekte Laufzeiten für den Übergang findest."
                }
              ].map((faq, i) => (
                <AccordionItem 
                  key={i}
                  value={`item-${i}`} 
                  className="bg-white rounded-2xl border-2 border-neutral-200 px-8 hover:border-primary/50 transition-all duration-300 data-[state=open]:shadow-lg"
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
              <CheckCircle className="w-4 h-4" />
              Vergleich fertig?
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
              Jetzt die günstige Option checken.
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
          </div>
        </section>

        {/* PREMIUM LISTINGS */}
        <PremiumListings />
        
      </main>
    </>
  );
}