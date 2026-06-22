import Head from "next/head";
import { Breadcrumbs } from "@/components/buyauto/Breadcrumbs";
import Link from "next/link";
import dynamic from "next/dynamic";
import { 
  Check, 
  ChevronRight, 
  AlertTriangle, 
  FileText, 
  Info, 
  ShieldCheck, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  Zap, 
  Users, 
  BadgeCheck, 
  ArrowRight, 
  FileCheck, 
  Search, 
  CheckCircle, 
  XCircle,
  Calculator,
  RefreshCw
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

export default function LeasinguebernahmeKostenPage() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <Head>
        <title>Leasingübernahme Kosten Schweiz: Gebühren-Überblick | BuyAuto</title>
        <meta
          name="description"
          content="Was kostet eine Leasingübernahme in der Schweiz? Alle Gebühren, versteckte Kosten und Spartipps im Detail – transparent und verständlich erklärt."
        />
        <link rel="canonical" href="https://www.buyauto.ch/leasinguebernahme-kosten" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: "Leasingübernahme Kosten in der Schweiz",
              author: { "@type": "Person", name: "Vincent Hänggi" },
              publisher: {
                "@type": "Organization",
                name: "BuyAuto",
                logo: { "@type": "ImageObject", url: "https://www.buyauto.ch/share-logo.jpg" },
              },
              dateModified: "2026-06-08",
              mainEntityOfPage: "https://www.buyauto.ch/leasinguebernahme-kosten",
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "Wie viel kostet eine Leasingübernahme insgesamt?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Die Gesamtkosten liegen typischerweise zwischen 200 und 650 CHF für den Einstieg (Transfer, Ummeldung, Administration). Hinzu kommen monatliche Kosten wie Leasingrate und Versicherung.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Wer zahlt die Transfergebühr?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Das ist frei verhandelbar. In den meisten Fällen übernimmt der Abgeber die Transfergebühr, um den Vertrag attraktiver zu machen. Manchmal teilen sich beide Parteien die Kosten.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Gibt es versteckte Kosten?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Ja, achte auf: eventuelle Reparaturen, fällige Services, Kilometerüberschreitungen und nicht übertragbare Servicepakete. Ein detailliertes Übergabeprotokoll schützt dich vor Überraschungen.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Ist eine Leasingübernahme günstiger als ein neues Leasing?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Ja, deutlich! Du sparst die hohe Anzahlung (3'000–10'000 CHF) und zahlst nur 200–650 CHF Einstiegskosten. Zudem profitierst du von kürzeren Restlaufzeiten.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Wie viel kostet die Ummeldung?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Die Ummeldung beim Strassenverkehrsamt kostet je nach Kanton 50–150 CHF. Hinzu kommen eventuell Kosten für einen neuen Fahrzeugausweis (ca. 50 CHF).",
                  },
                },
                {
                  "@type": "Question",
                  name: "Kann ich die Kosten mit dem Abgeber teilen?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Ja, absolut. Die Kostenaufteilung ist Verhandlungssache. Viele Abgeber sind bereit, Kosten zu übernehmen, um den Transfer zu beschleunigen.",
                  },
                },
              ],
            }),
          }}
        />
        
        {/* Open Graph */}
        <meta property="og:title" content="Leasingübernahme Kosten Schweiz – Kompletter Gebühren-Überblick" />
        <meta property="og:description" content="Was kostet eine Leasingübernahme in der Schweiz? Alle Gebühren, versteckte Kosten und Spartipps im Detail." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://www.buyauto.ch/leasinguebernahme-kosten" />
      </Head>

      <main className="bg-neutral-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <Breadcrumbs
            items={[
              { name: "Home", href: "/" },
              { name: "Leasingübernahme", href: "/leasinguebernahme" },
              { name: "Kosten", href: "/leasinguebernahme-kosten" },
            ]}
          />
        </div>
        
        {/* HERO SECTION */}
        <section className="relative min-h-[500px] md:min-h-[550px] flex items-center overflow-hidden pt-16">
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=2400&q=80"
              alt="Leasingübernahme Kosten Schweiz"
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
                  <DollarSign className="w-4 h-4" />
                  Kostenübersicht
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight mb-6">
                  Leasingübernahme Kosten in der Schweiz
                </h1>
                <p className="text-xl md:text-2xl text-primary-foreground font-semibold mb-4">
                  Der komplette Gebühren-Überblick
                </p>
                <p className="text-lg text-neutral-200 leading-relaxed mb-8 max-w-2xl">
                  Was kostet eine Leasingübernahme in der Schweiz? Alle Gebühren, versteckte Kosten und Spartipps im Detail – transparent und verständlich erklärt.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    asChild
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30 transition-all duration-300 px-8 py-6 text-base font-semibold rounded-xl"
                  >
                    <Link href="/suche">
                      Angebote durchsuchen
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
                Kurz gesagt: Was kostet eine Leasingübernahme?
              </h2>
            </div>
            
            <div className="bg-primary/5 border-l-4 border-primary p-8 rounded-r-xl shadow-sm">
              <p className="text-lg text-neutral-700 leading-relaxed mb-4">
                Eine <strong>Leasingübernahme kostet in der Schweiz typischerweise zwischen 200–600 CHF</strong>, abhängig von der Bank, dem Fahrzeugtyp und eventuellen Zusatzleistungen.
              </p>
              <p className="text-lg text-neutral-700 leading-relaxed">
                Viele Abgeber übernehmen diese Kosten freiwillig, um den Transfer attraktiver zu gestalten.
              </p>
              
              <div className="mt-6 pt-6 border-t border-primary/20">
                <p className="text-primary font-medium flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  <strong>Wichtig:</strong> Versteckte Kosten wie Ummeldung, Versicherung und eventuelle Reparaturen können zusätzlich anfallen.
                </p>
              </div>
              
              <div className="mt-4">
                <Link href="/leasinguebernahme" className="inline-flex items-center gap-2 text-primary font-semibold hover:underline">
                  <ArrowRight className="w-4 h-4" />
                  Alles zur Leasingübernahme
                </Link>
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
                  { id: "uebersicht", label: "Kostenübersicht im Detail" },
                  { id: "transfergebuehr", label: "Transfergebühr" },
                  { id: "ummeldung", label: "Ummeldung & Fahrzeugausweis" },
                  { id: "versicherung", label: "Versicherungskosten" },
                  { id: "versteckte", label: "Versteckte Kosten" },
                  { id: "spartipps", label: "Spartipps" },
                  { id: "vergleich", label: "Kostenvergleich" },
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

        {/* COSTS OVERVIEW */}
        <section id="uebersicht" className="py-16 px-4 bg-white scroll-mt-20">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <Calculator className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Kostenübersicht im Detail
              </h2>
            </div>
            
            <div className="overflow-x-auto rounded-xl border-2 border-primary shadow-lg">
              <table className="w-full bg-white text-left">
                <thead className="bg-primary text-white">
                  <tr>
                    <th className="p-4 md:p-6 font-bold text-base md:text-lg">Kostenart</th>
                    <th className="p-4 md:p-6 font-bold text-base md:text-lg">Typische Kosten</th>
                    <th className="p-4 md:p-6 font-bold text-base md:text-lg">Wird bezahlt von</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  <tr className="hover:bg-primary/5 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Transfergebühr (Bank)</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">100–400 CHF</td>
                    <td className="p-4 md:p-6 text-neutral-700">Meist Abgeber oder frei verhandelbar</td>
                  </tr>
                  <tr className="hover:bg-primary/5 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Händler-/Wechselgebühr</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">100–250 CHF</td>
                    <td className="p-4 md:p-6 text-neutral-700">Optional (falls über Händler)</td>
                  </tr>
                  <tr className="hover:bg-primary/5 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Ummeldung beim Strassenverkehrsamt</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">50–150 CHF</td>
                    <td className="p-4 md:p-6 text-neutral-700">Übernehmer</td>
                  </tr>
                  <tr className="hover:bg-primary/5 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Neuer Fahrzeugausweis</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">ca. 50 CHF</td>
                    <td className="p-4 md:p-6 text-neutral-700">Übernehmer</td>
                  </tr>
                  <tr className="hover:bg-primary/5 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Versicherung (pro Monat)</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">variabel (150–400 CHF/Monat)</td>
                    <td className="p-4 md:p-6 text-neutral-700">Übernehmer</td>
                  </tr>
                  <tr className="hover:bg-primary/5 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Eventuelle Reparaturen</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">variabel</td>
                    <td className="p-4 md:p-6 text-neutral-700">Nach Vereinbarung</td>
                  </tr>
                  <tr className="hover:bg-primary/5 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Administrationskosten (Bank)</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">0–100 CHF</td>
                    <td className="p-4 md:p-6 text-neutral-700">Abgeber oder Übernehmer</td>
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
                    Verhandle mit dem Abgeber! Viele sind bereit, die Transfergebühr zu übernehmen, um den Vertrag schneller loszuwerden.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TRANSFER FEE DETAILS */}
        <section id="transfergebuehr" className="py-16 px-4 bg-neutral-50 scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <DollarSign className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Transfergebühr im Detail
              </h2>
            </div>
            
            <div className="space-y-6">
              <Card className="border-2 border-primary/20">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-neutral-900 mb-4">
                    Was ist die Transfergebühr?
                  </h3>
                  <p className="text-neutral-700 leading-relaxed mb-4">
                    Die <strong>Transfergebühr</strong> ist die Hauptgebühr bei einer Leasingübernahme. Sie wird von der Leasingbank erhoben und deckt die administrativen Kosten der Vertragsübertragung ab.
                  </p>
                  <p className="text-neutral-700 leading-relaxed">
                    Diese Gebühr variiert je nach Bank und kann zwischen <strong>100 und 400 CHF</strong> liegen. Wie die Übertragung selbst Schritt für Schritt abläuft, zeigt unser Ratgeber{" "}
                    <Link href="/leasingvertrag-uebertragen" className="text-primary font-semibold hover:underline">
                      Leasingvertrag übertragen – so funktioniert es
                    </Link>.
                  </p>
                </CardContent>
              </Card>

              <div className="bg-white p-6 rounded-xl border border-neutral-200">
                <h3 className="text-xl font-bold text-neutral-900 mb-4">Faktoren, die die Höhe beeinflussen:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { icon: BadgeCheck, text: "Leasingbank-Richtlinien" },
                    { icon: DollarSign, text: "Restwert des Fahrzeugs" },
                    { icon: Clock, text: "Restlaufzeit des Vertrags" },
                    { icon: FileCheck, text: "Verwaltungsaufwand" }
                  ].map((item, i) => {
                    const IconComponent = item.icon;
                    return (
                      <div key={i} className="flex items-start gap-3 bg-neutral-50 border border-neutral-200 p-4 rounded-lg">
                        <IconComponent className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-neutral-700 font-medium">{item.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* REGISTRATION COSTS */}
        <section id="ummeldung" className="py-16 px-4 bg-white scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <FileText className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Ummeldung & Fahrzeugausweis
              </h2>
            </div>
            
            <Card className="border-2 border-primary/20">
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-neutral-900 mb-3">Was kostet die Ummeldung?</h3>
                    <p className="text-neutral-700 leading-relaxed">
                      Nach der Vertragsübertragung muss das Fahrzeug beim <strong>Strassenverkehrsamt</strong> auf den neuen Halter umgemeldet werden. Die Kosten variieren je nach Kanton, liegen aber typischerweise bei <strong>50–150 CHF</strong>.
                    </p>
                  </div>

                  <div className="bg-primary/5 p-6 rounded-lg">
                    <h4 className="font-bold text-neutral-900 mb-3">Benötigte Dokumente:</h4>
                    <ul className="space-y-2">
                      {[
                        "Fahrzeugausweis (Original)",
                        "Personalausweis oder Pass",
                        "Versicherungsbestätigung",
                        "Unterschriebener Kaufvertrag oder Übertragungsvereinbarung",
                        "Kontrollschildnummern (falls nicht übernommen)"
                      ].map((doc, i) => (
                        <li key={i} className="flex items-start gap-2 text-neutral-700">
                          <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <span>{doc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-amber-900 font-semibold mb-1">Wichtig</p>
                        <p className="text-amber-800">
                          Die Ummeldung muss innerhalb von <strong>14 Tagen</strong> nach der Übernahme erfolgen, sonst drohen Bussen.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* INSURANCE COSTS */}
        <section id="versicherung" className="py-16 px-4 bg-neutral-50 scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <ShieldCheck className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Versicherungskosten
              </h2>
            </div>
            
            <div className="space-y-6">
              <Card className="border-2 border-primary/20">
                <CardContent className="p-8">
                  <p className="text-lg text-neutral-700 leading-relaxed mb-6">
                    Bei einer Leasingübernahme musst du eine <strong>eigene Vollkaskoversicherung</strong> abschliessen. Die Kosten hängen von mehreren Faktoren ab:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { icon: DollarSign, title: "Fahrzeugwert", desc: "Höherer Wert = höhere Prämie" },
                      { icon: Users, title: "Alter & Erfahrung", desc: "Junge Fahrer zahlen mehr" },
                      { icon: BadgeCheck, title: "Unfallhistorie", desc: "Schadenfreie Jahre senken Kosten" },
                      { icon: FileCheck, title: "Deckungsumfang", desc: "Vollkasko vs. Teilkasko" }
                    ].map((item, i) => {
                      const IconComponent = item.icon;
                      return (
                        <div key={i} className="bg-white border border-neutral-200 p-5 rounded-lg">
                          <div className="flex items-center gap-3 mb-2">
                            <IconComponent className="w-6 h-6 text-primary" />
                            <h4 className="font-bold text-neutral-900">{item.title}</h4>
                          </div>
                          <p className="text-neutral-600 text-sm">{item.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <Info className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-green-900 font-semibold mb-1">Spartipp</p>
                    <p className="text-green-800">
                      Vergleiche mehrere Versicherungsangebote! Die Prämien können um <strong>20–40%</strong> variieren.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HIDDEN COSTS */}
        <section id="versteckte" className="py-16 px-4 bg-white scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <AlertTriangle className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Versteckte Kosten – Darauf musst du achten
              </h2>
            </div>
            
            <div className="space-y-4">
              {[
                {
                  title: "Zustandsbedingte Reparaturen",
                  desc: "Verschleiss, der erst bei der Übergabe auffällt (z.B. abgefahrene Reifen, Kratzer, Steinschläge)",
                  icon: AlertTriangle
                },
                {
                  title: "Service & Wartung fällig",
                  desc: "Wenn der nächste Service kurz bevorsteht, musst du ihn übernehmen (200–800 CHF)",
                  icon: Clock
                },
                {
                  title: "Kilometerüberschreitung",
                  desc: "Falls das Fahrzeug bereits über dem vereinbarten Kilometerlimit liegt, können nachträglich Kosten anfallen",
                  icon: TrendingDown
                },
                {
                  title: "Nicht übertragene Servicepakete",
                  desc: "Manche Services (z.B. Winterreifen-Einlagerung) laufen auf den Abgeber und sind nicht übertragbar",
                  icon: XCircle
                }
              ].map((item, i) => {
                const IconComponent = item.icon;
                return (
                  <Card key={i} className="border-2 border-amber-200 bg-amber-50">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="bg-amber-100 p-3 rounded-lg">
                          <IconComponent className="w-6 h-6 text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-neutral-900 text-lg mb-2">{item.title}</h3>
                          <p className="text-neutral-700">{item.desc}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="mt-8 bg-primary text-white p-8 rounded-xl">
              <h3 className="text-xl font-bold mb-3">💡 Profi-Tipp</h3>
              <p className="leading-relaxed">
                Erstelle vor der Übernahme ein <strong>detailliertes Übergabeprotokoll</strong> mit Fotos. So vermeidest du nachträgliche Überraschungen bei Schäden oder Mängeln.
              </p>
            </div>
          </div>
        </section>

        {/* COST SAVINGS TIPS */}
        <section id="spartipps" className="py-16 px-4 bg-neutral-50 scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <Zap className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Spartipps für die Leasingübernahme
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  title: "Verhandle die Transfergebühr",
                  desc: "Viele Abgeber übernehmen die Gebühr freiwillig",
                  icon: DollarSign
                },
                {
                  title: "Vergleiche Versicherungen",
                  desc: "20–40% Ersparnis durch Prämienvergleich",
                  icon: ShieldCheck
                },
                {
                  title: "Prüfe den Fahrzeugzustand genau",
                  desc: "Vermeide teure Nachbesserungen",
                  icon: CheckCircle
                },
                {
                  title: "Achte auf die Restlaufzeit",
                  desc: "Kürzere Verträge = weniger Risiko",
                  icon: Clock
                },
                {
                  title: "Nutze Plattformen wie BuyAuto",
                  desc: "Transparente Angebote ohne Händleraufschlag",
                  icon: Search
                },
                {
                  title: "Frage nach inkludierten Services",
                  desc: "Reifenwechsel, Wartungen können Kosten sparen",
                  icon: FileCheck
                }
              ].map((tip, i) => {
                const IconComponent = tip.icon;
                return (
                  <Card key={i} className="border-2 border-green-200 bg-green-50">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="bg-green-100 p-3 rounded-lg shrink-0">
                          <IconComponent className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-neutral-900 mb-2">{tip.title}</h3>
                          <p className="text-neutral-700 text-sm">{tip.desc}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* COST COMPARISON */}
        <section id="vergleich" className="py-16 px-4 bg-white scroll-mt-20">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <RefreshCw className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Kostenvergleich: Leasingübernahme vs. Neues Leasing
              </h2>
            </div>
            
            <div className="overflow-x-auto rounded-xl border-2 border-primary shadow-lg">
              <table className="w-full bg-white text-left">
                <thead className="bg-primary text-white">
                  <tr>
                    <th className="p-4 md:p-6 font-bold text-base md:text-lg">Kostenart</th>
                    <th className="p-4 md:p-6 font-bold text-base md:text-lg">Leasingübernahme</th>
                    <th className="p-4 md:p-6 font-bold text-base md:text-lg">Neues Leasing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  <tr className="hover:bg-primary/5 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Anzahlung</td>
                    <td className="p-4 md:p-6 text-green-600 font-semibold">0–100 CHF</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">3'000–10'000 CHF</td>
                  </tr>
                  <tr className="hover:bg-primary/5 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Transfergebühr</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">100–400 CHF</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">—</td>
                  </tr>
                  <tr className="hover:bg-primary/5 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Ummeldung</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">50–150 CHF</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">50–150 CHF</td>
                  </tr>
                  <tr className="hover:bg-primary/5 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Versicherung (Monat)</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">150–400 CHF</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">150–400 CHF</td>
                  </tr>
                  <tr className="hover:bg-primary/5 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Laufzeit</td>
                    <td className="p-4 md:p-6 text-green-600 font-semibold">6–24 Monate (kürzer)</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">36–48 Monate</td>
                  </tr>
                  <tr className="bg-green-50 hover:bg-green-100 transition-colors">
                    <td className="p-4 md:p-6 font-bold text-neutral-900">TOTAL (Einstieg)</td>
                    <td className="p-4 md:p-6 text-green-600 font-bold text-lg">200–650 CHF</td>
                    <td className="p-4 md:p-6 text-neutral-900 font-bold text-lg">3'200–10'550 CHF</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-8 bg-primary text-white p-8 rounded-xl">
              <div className="flex items-start gap-4">
                <CheckCircle className="w-8 h-8 shrink-0" />
                <div>
                  <h3 className="text-xl font-bold mb-2">Fazit</h3>
                  <p className="leading-relaxed text-lg">
                    Eine Leasingübernahme ist <strong>deutlich günstiger</strong> im Einstieg als ein neues Leasing. Du sparst die hohe Anzahlung und hast mehr Flexibilität durch kürzere Restlaufzeiten.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SEARCH SECTION */}
        <section className="py-16 px-4 bg-neutral-50">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border-2 border-primary p-6 md:p-10">
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-3">
                  Finde jetzt günstige Leasingübernahmen
                </h2>
                <p className="text-neutral-600 text-base md:text-lg">
                  Durchsuche{" "}
                  <Link href="/suche?dealType=lease_takeover" className="text-primary font-semibold hover:underline">
                    aktuelle Leasingübernahme-Angebote
                  </Link>{" "}
                  und spare bei deinem nächsten Vertrag.
                </p>
              </div>
              <SearchForm />
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section id="faq" className="py-16 px-4 bg-white scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-neutral-900 mb-3">
                FAQ – Häufige Fragen zu Leasingübernahme-Kosten
              </h2>
              <p className="text-neutral-600 text-lg">
                Die wichtigsten Antworten auf einen Blick
              </p>
            </div>
            
            <Accordion type="single" collapsible className="w-full space-y-4">
              <AccordionItem 
                value="item-1" 
                className="bg-neutral-50 rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-primary transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Wie viel kostet eine Leasingübernahme insgesamt?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Die Gesamtkosten liegen typischerweise zwischen <strong>200 und 650 CHF</strong> für den Einstieg (Transfer, Ummeldung, Administration). Hinzu kommen monatliche Kosten wie Leasingrate und Versicherung.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem 
                value="item-2" 
                className="bg-neutral-50 rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-primary transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Wer zahlt die Transfergebühr?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Das ist frei verhandelbar. In den meisten Fällen übernimmt der <strong>Abgeber</strong> die Transfergebühr, um den Vertrag attraktiver zu machen. Manchmal teilen sich beide Parteien die Kosten.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem 
                value="item-3" 
                className="bg-neutral-50 rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-primary transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Gibt es versteckte Kosten?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Ja, achte auf: eventuelle Reparaturen, fällige Services, Kilometerüberschreitungen und nicht übertragbare Servicepakete. Ein detailliertes Übergabeprotokoll schützt dich vor Überraschungen.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem 
                value="item-4" 
                className="bg-neutral-50 rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-primary transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Ist eine Leasingübernahme günstiger als ein neues Leasing?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Ja, deutlich! Du sparst die hohe Anzahlung (3'000–10'000 CHF) und zahlst nur 200–650 CHF Einstiegskosten. Zudem profitierst du von kürzeren Restlaufzeiten. Alle Unterschiede im Detail zeigt{" "}
                  <Link href="/leasinguebernahme-vs-neues-leasing" className="text-primary font-semibold hover:underline">
                    Leasingübernahme vs. neues Leasing im Vergleich
                  </Link>.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="item-5" 
                className="bg-neutral-50 rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-primary transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Wie viel kostet die Ummeldung?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Die Ummeldung beim Strassenverkehrsamt kostet je nach Kanton <strong>50–150 CHF</strong>. Hinzu kommen eventuell Kosten für einen neuen Fahrzeugausweis (ca. 50 CHF).
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="item-6" 
                className="bg-neutral-50 rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-primary transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Kann ich die Kosten mit dem Abgeber teilen?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Ja, absolut. Die Kostenaufteilung ist Verhandlungssache. Viele Abgeber sind bereit, Kosten zu übernehmen, um den Transfer zu beschleunigen.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-20 bg-neutral-900 px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Spare jetzt bei deiner Leasingübernahme
            </h2>
            <p className="text-neutral-300 max-w-2xl mx-auto text-lg leading-relaxed">
              Finde transparente Angebote ohne versteckte Kosten oder erstelle dein eigenes Inserat – kostenlos und unkompliziert.
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

// Served via ISR (static + periodic revalidation) instead of a frozen build-time file,
// so the page refreshes without a redeploy and shares the prerender path of its siblings.
export const getStaticProps = async () => {
  return { props: {}, revalidate: 300 };
};