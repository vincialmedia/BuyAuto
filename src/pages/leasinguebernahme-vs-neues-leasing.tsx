import Head from "next/head";
import Link from "next/link";
import dynamic from "next/dynamic";
import { 
  Check, 
  ChevronRight, 
  TrendingDown, 
  TrendingUp, 
  Info, 
  Clock, 
  DollarSign, 
  Users, 
  ShieldCheck, 
  AlertTriangle, 
  Calendar, 
  FileCheck, 
  Zap, 
  ArrowRight, 
  Search 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Image from "next/image";

// Dynamically import heavy interactive components
const SearchForm = dynamic(() => import("@/components/buyauto/SearchForm"), {
  loading: () => <div className="h-96 bg-white rounded-2xl border-2 border-neutral-100 animate-pulse" />
});

const PremiumListings = dynamic(() => import("@/components/buyauto/PremiumListings"), {
  loading: () => <div className="h-96 bg-neutral-50 animate-pulse" />
});

export default function LeasingubernahmeVsNeuesLeasingPage() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <Head>
        <title>Leasingübernahme vs. Neues Leasing – Was lohnt sich mehr? | BuyAuto</title>
        <meta
          name="description"
          content="Leasingübernahme vs. Neues Leasing: Detaillierter Vergleich der Kosten, Vorteile und Nachteile beider Optionen für Ihre Entscheidung."
        />
        <link rel="canonical" href="https://www.buyauto.ch/leasinguebernahme-vs-neues-leasing" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: "Leasingübernahme vs. Neues Leasing",
              author: { "@type": "Person", name: "Vincent Hänggi" },
              publisher: {
                "@type": "Organization",
                name: "BuyAuto",
                logo: { "@type": "ImageObject", url: "https://www.buyauto.ch/share-logo.jpg" },
              },
              dateModified: "2026-06-08",
              mainEntityOfPage: "https://www.buyauto.ch/leasinguebernahme-vs-neues-leasing",
            }),
          }}
        />
        
        {/* Open Graph */}
        <meta property="og:title" content="Leasingübernahme vs. Neues Leasing – Was lohnt sich mehr?" />
        <meta property="og:description" content="Vergleichen Sie Leasingübernahme und Neues Leasing: Kosten, Vorteile und beste Option für Sie." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://www.buyauto.ch/leasinguebernahme-vs-neues-leasing" />
      </Head>

      <main className="bg-neutral-50 min-h-screen">
        
        {/* HERO SECTION */}
        <section className="relative min-h-[500px] md:min-h-[550px] flex items-center overflow-hidden pt-16">
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=2400&q=80"
              alt="Leasingübernahme vs Neues Leasing"
              fill
              className="object-cover"
              priority
              quality={75}
              sizes="100vw"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/70 via-neutral-900/60 to-neutral-900/80" />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-neutral-900/30" />
          </div>

          {/* Geometric Accents */}
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 left-1/5 w-64 h-64 bg-primary/5 rounded-full blur-2xl" />

          {/* Hero Content */}
          <div className="relative z-10 w-full px-4 py-16 md:py-20">
            <div className="max-w-5xl mx-auto">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-full text-sm font-semibold mb-6">
                  <FileCheck className="w-4 h-4" />
                  Detaillierter Vergleich
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight mb-6">
                  Leasingübernahme vs. Neues Leasing
                </h1>
                <p className="text-xl md:text-2xl text-primary-foreground font-semibold mb-4">
                  Welche Option lohnt sich für Sie?
                </p>
                <p className="text-lg text-neutral-200 leading-relaxed mb-8 max-w-2xl">
                  Umfassender Vergleich der Kosten, Vorteile und Nachteile beider Leasing-Optionen – damit Sie die richtige Entscheidung treffen.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    asChild
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30 transition-all duration-300 px-8 py-6 text-base font-semibold rounded-xl"
                  >
                    <Link href="/suche">
                      Leasingübernahmen entdecken
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

        {/* QUICK ANSWER BOX */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <Info className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Kurz gesagt: Der Hauptunterschied
              </h2>
            </div>
            
            <div className="bg-primary/5 border-l-4 border-primary p-8 rounded-r-xl shadow-sm">
              <p className="text-lg text-neutral-700 leading-relaxed mb-4">
                Bei einer <strong>Leasingübernahme</strong> übernehmen Sie einen bestehenden Vertrag mit verbleibender Laufzeit und oft günstigen Konditionen. Bei einem <strong>neuen Leasing</strong> starten Sie komplett neu mit individuell verhandelbaren Bedingungen.
              </p>
              <p className="text-lg text-neutral-700 leading-relaxed">
                <strong>Leasingübernahme:</strong> Schneller Einstieg, oft ohne Anzahlung<br/>
                <strong>Neues Leasing:</strong> Volle Flexibilität, langfristige Planung
              </p>
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
                  { id: "unterschiede", label: "Hauptunterschiede" },
                  { id: "kostenvergleich", label: "Kostenvergleich" },
                  { id: "search", label: "Angebote entdecken" },
                  { id: "vorteile-uebernahme", label: "Vorteile Leasingübernahme" },
                  { id: "vorteile-neu", label: "Vorteile Neues Leasing" },
                  { id: "fuer-wen", label: "Für wen eignet sich was?" },
                  { id: "entscheidungshilfe", label: "Entscheidungshilfe" },
                  { id: "faq", label: "Häufige Fragen" },
                ].map((item, i) => (
                  <button 
                    key={i}
                    onClick={() => scrollToSection(item.id)}
                    className="flex items-center gap-2 text-neutral-600 hover:text-primary transition-colors text-left group"
                  >
                    <ChevronRight className="w-4 h-4 text-primary/60 group-hover:text-primary transition-colors" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* MAIN DIFFERENCES */}
        <section id="unterschiede" className="py-16 px-4 bg-white scroll-mt-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-neutral-900 mb-3">
                Hauptunterschiede im Überblick
              </h2>
              <p className="text-lg text-neutral-600">
                Zwei unterschiedliche Ansätze mit verschiedenen Vor- und Nachteilen
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Leasingübernahme */}
              <div className="bg-neutral-50 p-8 rounded-3xl shadow-lg border-2 border-primary">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-primary text-white p-3 rounded-xl">
                    <TrendingDown className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-900">
                    Leasingübernahme
                  </h3>
                </div>
                <ul className="space-y-4">
                  {[
                    "Bestehender Vertrag wird übernommen",
                    "Kürzere Restlaufzeit",
                    "Oft keine oder geringe Anzahlung",
                    "Sofortige Verfügbarkeit",
                    "Konditionen sind fix",
                    "Schnellerer Vertragsabschluss"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-neutral-700">
                      <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Neues Leasing */}
              <div className="bg-neutral-50 p-8 rounded-3xl shadow-lg border-2 border-neutral-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-neutral-700 text-white p-3 rounded-xl">
                    <TrendingUp className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-900">
                    Neues Leasing
                  </h3>
                </div>
                <ul className="space-y-4">
                  {[
                    "Brandneuer Vertrag",
                    "Volle Vertragslaufzeit (24-60 Monate)",
                    "Anzahlung oft erforderlich",
                    "Wartezeit für Fahrzeuglieferung",
                    "Alle Konditionen verhandelbar",
                    "Umfangreichere Bonitätsprüfung"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-neutral-700">
                      <Check className="w-5 h-5 text-neutral-600 shrink-0 mt-0.5" />
                      <span className="font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* COST COMPARISON */}
        <section id="kostenvergleich" className="py-16 px-4 bg-neutral-50 scroll-mt-20">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <DollarSign className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Kostenvergleich
              </h2>
            </div>
            
            <div className="overflow-x-auto rounded-xl border-2 border-primary shadow-lg">
              <table className="w-full bg-white text-left">
                <thead className="bg-primary text-white">
                  <tr>
                    <th className="p-4 md:p-6 font-bold text-base md:text-lg">Kostenposition</th>
                    <th className="p-4 md:p-6 font-bold text-base md:text-lg">Leasingübernahme</th>
                    <th className="p-4 md:p-6 font-bold text-base md:text-lg">Neues Leasing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  <tr className="hover:bg-primary/5 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Anzahlung</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">0–2'000 CHF</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">5'000–15'000 CHF</td>
                  </tr>
                  <tr className="hover:bg-primary/5 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Übertragungsgebühr</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">100–400 CHF</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">–</td>
                  </tr>
                  <tr className="hover:bg-primary/5 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Monatliche Rate</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">Oft günstiger</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">Standard-Konditionen</td>
                  </tr>
                  <tr className="hover:bg-primary/5 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Laufzeit</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">6–24 Monate Rest</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">24–60 Monate</td>
                  </tr>
                  <tr className="hover:bg-primary/5 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Gesamtkosten</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">Niedriger</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">Höher</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-8 bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <Info className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-green-900 font-semibold mb-1">Spartipp</p>
                  <p className="text-green-800">
                    Bei Leasingübernahmen können Sie oft 30-50% der Gesamtkosten sparen, da die Anzahlung bereits geleistet wurde und die Restlaufzeit kürzer ist. Welche Gebühren im Einzelnen anfallen, zeigt unsere <Link href="/leasinguebernahme-kosten" className="text-primary font-semibold hover:underline">detaillierte Kostenübersicht zur Leasingübernahme</Link>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SEARCH SECTION */}
        <section id="search" className="py-16 px-4 bg-white scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border-2 border-primary p-6 md:p-10">
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-3">
                  Leasingübernahmen Entdecken
                </h2>
                <p className="text-neutral-600 text-base md:text-lg">
                  Finden Sie attraktive Leasingübernahmen oder erstellen Sie Ihr eigenes Inserat.
                </p>
              </div>
              <SearchForm />
            </div>
          </div>
        </section>

        {/* ADVANTAGES LEASINGÜBERNAHME */}
        <section id="vorteile-uebernahme" className="py-16 px-4 bg-neutral-50 scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <TrendingDown className="w-8 h-8 text-primary" />
              <div>
                <h2 className="text-3xl font-bold text-neutral-900">
                  Vorteile der Leasingübernahme
                </h2>
                <Link href="/leasinguebernahme" className="inline-flex items-center gap-2 text-primary font-semibold hover:underline text-sm mt-1">
                  Mehr erfahren
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  title: "Geringe Einstiegskosten",
                  desc: "Oft keine oder minimale Anzahlung erforderlich",
                  icon: DollarSign
                },
                {
                  title: "Sofortige Verfügbarkeit",
                  desc: "Fahrzeug ist sofort verfügbar, keine Wartezeit",
                  icon: Zap
                },
                {
                  title: "Kürzere Bindung",
                  desc: "Restlaufzeit meist nur noch 6-24 Monate",
                  icon: Clock
                },
                {
                  title: "Günstigere Raten",
                  desc: "Profitieren Sie von der bereits geleisteten Anzahlung",
                  icon: TrendingDown
                },
                {
                  title: "Schnelle Abwicklung",
                  desc: "Vertragsübernahme dauert nur wenige Tage",
                  icon: ShieldCheck
                },
                {
                  title: "Fahrzeug testen",
                  desc: "Kurze Bindung erlaubt Wechsel zu anderem Modell",
                  icon: Check
                }
              ].map((item, i) => {
                const IconComponent = item.icon;
                return (
                  <div key={i} className="bg-white border-2 border-primary rounded-xl p-6 hover:shadow-lg transition-all">
                    <div className="flex items-start gap-4">
                      <div className="bg-primary/10 p-3 rounded-lg shrink-0">
                        <IconComponent className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-neutral-900 mb-2">{item.title}</h3>
                        <p className="text-neutral-600">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ADVANTAGES NEUES LEASING */}
        <section id="vorteile-neu" className="py-16 px-4 bg-white scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <TrendingUp className="w-8 h-8 text-neutral-700" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Vorteile Neues Leasing
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  title: "Freie Fahrzeugwahl",
                  desc: "Wählen Sie Ihr Wunschfahrzeug mit allen Optionen",
                  icon: Check
                },
                {
                  title: "Verhandelbare Konditionen",
                  desc: "Alle Parameter können individuell vereinbart werden",
                  icon: DollarSign
                },
                {
                  title: "Neuwagen-Garantie",
                  desc: "Vollständige Herstellergarantie und keine Vorschäden",
                  icon: ShieldCheck
                },
                {
                  title: "Langfristige Planung",
                  desc: "Planungssicherheit über die gesamte Vertragslaufzeit",
                  icon: Calendar
                },
                {
                  title: "Flexible Laufzeit",
                  desc: "Wählen Sie zwischen 24-60 Monaten nach Ihrem Bedarf",
                  icon: Clock
                },
                {
                  title: "Individuelle Kilometer",
                  desc: "Kilometerlimit frei wählbar und anpassbar",
                  icon: TrendingUp
                }
              ].map((item, i) => {
                const IconComponent = item.icon;
                return (
                  <div key={i} className="bg-neutral-50 border border-neutral-300 rounded-xl p-6 hover:border-neutral-400 transition-all">
                    <div className="flex items-start gap-4">
                      <div className="bg-neutral-200 p-3 rounded-lg shrink-0">
                        <IconComponent className="w-6 h-6 text-neutral-700" />
                      </div>
                      <div>
                        <h3 className="font-bold text-neutral-900 mb-2">{item.title}</h3>
                        <p className="text-neutral-600">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FOR WHOM SECTION */}
        <section id="fuer-wen" className="py-16 px-4 bg-neutral-50 scroll-mt-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-neutral-900 mb-3">
                Für wen eignet sich was?
              </h2>
              <p className="text-lg text-neutral-600">
                Finden Sie die passende Option für Ihre Situation
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Leasingübernahme geeignet für */}
              <Card className="border-2 border-primary shadow-lg">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Users className="w-7 h-7 text-primary" />
                    <h3 className="text-2xl font-bold text-neutral-900">
                      Leasingübernahme passt zu Ihnen, wenn...
                    </h3>
                  </div>
                  <ul className="space-y-4">
                    {[
                      "Sie ein begrenztes Budget haben",
                      "Sie das Fahrzeug sofort benötigen",
                      "Sie keine hohe Anzahlung leisten wollen",
                      "Sie sich nicht langfristig binden möchten",
                      "Sie verschiedene Modelle testen wollen",
                      "Sie Kosten sparen möchten"
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-neutral-700">
                        <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <span className="font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Neues Leasing geeignet für */}
              <Card className="border-2 border-neutral-300 shadow-lg">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Users className="w-7 h-7 text-neutral-700" />
                    <h3 className="text-2xl font-bold text-neutral-900">
                      Neues Leasing passt zu Ihnen, wenn...
                    </h3>
                  </div>
                  <ul className="space-y-4">
                    {[
                      "Sie ein neues Fahrzeug wünschen",
                      "Sie spezielle Ausstattung benötigen",
                      "Sie langfristig planen möchten",
                      "Sie Garantie und Wartung schätzen",
                      "Sie individuelle Konditionen wollen",
                      "Sie auf Ihren Traumwagen warten können"
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-neutral-700">
                        <Check className="w-5 h-5 text-neutral-600 shrink-0 mt-0.5" />
                        <span className="font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* DECISION HELPER */}
        <section id="entscheidungshilfe" className="py-16 px-4 bg-white scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <FileCheck className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Entscheidungshilfe: Ihre Checkliste
              </h2>
            </div>
            
            <div className="bg-neutral-50 border-2 border-primary rounded-xl p-8">
              <p className="text-lg text-neutral-700 mb-6">
                Beantworten Sie diese Fragen, um die richtige Wahl zu treffen:
              </p>
              
              <div className="space-y-4">
                {[
                  "Wie hoch ist Ihr verfügbares Budget für die Anzahlung?",
                  "Wie dringend benötigen Sie das Fahrzeug?",
                  "Wie lange möchten Sie sich an das Fahrzeug binden?",
                  "Ist Ihnen die Fahrzeugwahl wichtiger als die Kosten?",
                  "Benötigen Sie spezielle Ausstattungsmerkmale?",
                  "Wie wichtig ist Ihnen eine Herstellergarantie?",
                  "Möchten Sie die Konditionen selbst verhandeln?"
                ].map((question, i) => (
                  <div key={i} className="bg-white border border-neutral-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-primary font-bold text-sm">{i + 1}</span>
                      </div>
                      <p className="text-neutral-900 font-medium">{question}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-primary font-semibold mb-2">
                  💡 Unser Tipp:
                </p>
                <p className="text-neutral-700">
                  Wenn Sie bei den meisten Fragen auf "Budget", "Sofort" und "Kurz" antworten, ist eine <strong>Leasingübernahme</strong> ideal – werfen Sie am besten direkt einen Blick auf die <Link href="/suche?dealType=lease_takeover" className="text-primary font-semibold hover:underline">aktuellen Leasingübernahme-Angebote</Link>. Wenn Sie auf "Flexibilität", "Geduld" und "Lang" setzen, ist ein <strong>neues Leasing</strong> besser geeignet.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section id="faq" className="py-16 px-4 bg-neutral-50 scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-neutral-900 mb-3">
                FAQ – Häufige Fragen
              </h2>
              <p className="text-neutral-600 text-lg">
                Die wichtigsten Fragen im Vergleich
              </p>
            </div>
            
            <Accordion type="single" collapsible className="w-full space-y-4">
              <AccordionItem 
                value="item-1" 
                className="bg-white rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-primary transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Ist eine Leasingübernahme günstiger als ein neues Leasing?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Ja, in den meisten Fällen sparen Sie durch die bereits geleistete Anzahlung und die kürzere Restlaufzeit erheblich. Die Gesamtkosten können 30-50% niedriger sein.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem 
                value="item-2" 
                className="bg-white rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-primary transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Kann ich bei einer Leasingübernahme die Konditionen ändern?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Nein, bei einer Leasingübernahme übernehmen Sie den Vertrag mit allen bestehenden Konditionen. Änderungen sind nur in Ausnahmefällen und mit Zustimmung der Bank möglich.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem 
                value="item-3" 
                className="bg-white rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-primary transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Welche Option ist besser für Fahranfänger?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Für Fahranfänger ist eine Leasingübernahme oft ideal: Niedrige Einstiegskosten, kürzere Bindung und die Möglichkeit, verschiedene Fahrzeugtypen zu testen, bevor man sich langfristig festlegt.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem 
                value="item-4" 
                className="bg-white rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-primary transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Wie schnell kann ich ein Fahrzeug bei einer Leasingübernahme bekommen?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Nach erfolgreicher Bonitätsprüfung und Vertragsübertragung (ca. 5-10 Werktage) können Sie das Fahrzeug sofort übernehmen. Bei neuem Leasing müssen Sie oft 3-6 Monate auf die Lieferung warten.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="item-5" 
                className="bg-white rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-primary transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Was passiert am Ende einer Leasingübernahme?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Am Ende der Laufzeit geben Sie das Fahrzeug wie bei jedem Leasing zurück. Sie haben die gleichen Optionen: Fahrzeug zurückgeben, verlängern oder (falls vereinbart) kaufen.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="item-6" 
                className="bg-white rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-primary transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Brauche ich bei einem neuen Leasing immer eine hohe Anzahlung?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Nicht zwingend, aber eine Anzahlung senkt die monatlichen Raten erheblich. Üblich sind 10-20% des Fahrzeugwertes. Ohne Anzahlung steigen die Monatsraten entsprechend.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-20 bg-neutral-900 px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Bereit für Ihr nächstes Fahrzeug?
            </h2>
            <p className="text-neutral-300 max-w-2xl mx-auto text-lg leading-relaxed">
              Entdecken Sie attraktive Leasingübernahmen oder erstellen Sie Ihr eigenes Inserat.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <Button asChild size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-semibold bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/30 transition-all">
                <Link href="/suche">
                  <Search className="w-5 h-5 mr-2" />
                  Angebote durchsuchen
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg font-semibold border-2 border-white text-white hover:bg-white hover:text-neutral-900 rounded-xl bg-transparent transition-all">
                <Link href="/inserat-erstellen">
                  Inserat erstellen
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