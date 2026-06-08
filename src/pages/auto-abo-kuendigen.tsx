import Head from "next/head";
import Link from "next/link";
import dynamic from "next/dynamic";
import { 
  Check, 
  ChevronRight, 
  Info, 
  Clock, 
  DollarSign, 
  AlertTriangle, 
  Calendar, 
  FileCheck, 
  Zap, 
  ArrowRight, 
  Search,
  Shield,
  FileText,
  Phone
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

export default function AutoAboKuendigenPage() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <Head>
        <title>Auto-Abo kündigen in der Schweiz – Fristen, Kosten & Tipps | BuyAuto</title>
        <meta
          name="description"
          content="Auto-Abo kündigen: Alle Fristen, Kosten und wichtige Tipps für eine reibungslose Kündigung. Jetzt informieren und Alternativen entdecken."
        />
        <link rel="canonical" href="https://www.buyauto.ch/auto-abo-kuendigen" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: "Auto-Abo kündigen",
              author: { "@type": "Person", name: "Vincent Hänggi" },
              publisher: {
                "@type": "Organization",
                name: "BuyAuto",
                logo: { "@type": "ImageObject", url: "https://www.buyauto.ch/share-logo.jpg" },
              },
              dateModified: "2026-06-08",
              mainEntityOfPage: "https://www.buyauto.ch/auto-abo-kuendigen",
            }),
          }}
        />
        
        {/* Open Graph */}
        <meta property="og:title" content="Auto-Abo kündigen in der Schweiz – Fristen, Kosten & Tipps" />
        <meta property="og:description" content="Erfahren Sie alles über Kündigungsfristen, Kosten und Tipps für Ihr Auto-Abo." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://www.buyauto.ch/auto-abo-kuendigen" />
      </Head>

      <main className="bg-neutral-50 min-h-screen">
        
        {/* HERO SECTION */}
        <section className="relative min-h-[500px] md:min-h-[550px] flex items-center overflow-hidden pt-16">
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=2400&q=80"
              alt="Auto-Abo kündigen"
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
                  Kündigungsratgeber
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight mb-6">
                  Auto-Abo kündigen
                </h1>
                <p className="text-xl md:text-2xl text-primary-foreground font-semibold mb-4">
                  Fristen, Kosten & Alternativen
                </p>
                <p className="text-lg text-neutral-200 leading-relaxed mb-8 max-w-2xl">
                  Ihr umfassender Ratgeber zur Kündigung Ihres Auto-Abos in der Schweiz. Erfahren Sie alles über Kündigungsfristen, Kosten und welche Alternativen Sie haben.
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
                Kurz gesagt: Auto-Abo kündigen
              </h2>
            </div>
            
            <div className="bg-primary/5 border-l-4 border-primary p-8 rounded-r-xl shadow-sm">
              <p className="text-lg text-neutral-700 leading-relaxed mb-4">
                Die <strong>Kündigungsfrist</strong> bei Auto-Abos beträgt in der Schweiz üblicherweise <strong>1-3 Monate</strong>. Sie müssen die Kündigung <strong>schriftlich</strong> einreichen und auf die <strong>Mindestlaufzeit</strong> (oft 6-12 Monate) achten.
              </p>
              <p className="text-lg text-neutral-700 leading-relaxed">
                <strong>Wichtig:</strong> Prüfen Sie Ihren Vertrag auf vorzeitige Kündigungsgebühren und planen Sie die Fahrzeugrückgabe rechtzeitig.
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
                  { id: "kuendigungsfristen", label: "Kündigungsfristen" },
                  { id: "kuendigungsprozess", label: "Kündigungsprozess" },
                  { id: "kosten", label: "Kosten & Gebühren" },
                  { id: "search", label: "Alternativen entdecken" },
                  { id: "rueckgabe", label: "Fahrzeugrückgabe" },
                  { id: "sonderkuendigung", label: "Sonderkündigung" },
                  { id: "alternativen", label: "Alternativen" },
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

        {/* KÜNDIGUNGSFRISTEN */}
        <section id="kuendigungsfristen" className="py-16 px-4 bg-white scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <Clock className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Kündigungsfristen bei Auto-Abos
              </h2>
            </div>
            
            <div className="space-y-6">
              <p className="text-lg text-neutral-700 leading-relaxed">
                Die Kündigungsfrist variiert je nach Anbieter und Vertragsmodell. In der Schweiz gelten folgende Richtwerte:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-2 border-primary shadow-lg">
                  <CardContent className="p-6">
                    <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                      <Clock className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-bold text-neutral-900 mb-2 text-xl">1 Monat</h3>
                    <p className="text-neutral-600">
                      Flexible Modelle mit kürzester Kündigungsfrist
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-2 border-primary shadow-lg">
                  <CardContent className="p-6">
                    <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                      <Calendar className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-bold text-neutral-900 mb-2 text-xl">2-3 Monate</h3>
                    <p className="text-neutral-600">
                      Standard bei den meisten Anbietern
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-2 border-neutral-300 shadow-lg">
                  <CardContent className="p-6">
                    <div className="bg-neutral-200 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                      <AlertTriangle className="w-6 h-6 text-neutral-700" />
                    </div>
                    <h3 className="font-bold text-neutral-900 mb-2 text-xl">6+ Monate</h3>
                    <p className="text-neutral-600">
                      Mindestlaufzeit oft 6-12 Monate
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-r-xl">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-yellow-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-yellow-900 font-semibold mb-1">Wichtig</p>
                    <p className="text-yellow-800">
                      Beachten Sie die <strong>Mindestlaufzeit</strong> Ihres Vertrags. Eine vorzeitige Kündigung kann mit erheblichen Gebühren verbunden sein (oft 30-50% der Restkosten).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* KÜNDIGUNGSPROZESS */}
        <section id="kuendigungsprozess" className="py-16 px-4 bg-neutral-50 scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <FileText className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold text-neutral-900">
                So kündigen Sie Ihr Auto-Abo richtig
              </h2>
            </div>
            
            <div className="space-y-6">
              {[
                {
                  step: "1",
                  title: "Vertrag prüfen",
                  desc: "Überprüfen Sie Ihre Kündigungsfrist, Mindestlaufzeit und eventuelle Gebühren im Vertrag.",
                  icon: FileCheck
                },
                {
                  step: "2",
                  title: "Schriftliche Kündigung",
                  desc: "Reichen Sie die Kündigung schriftlich ein (E-Mail, Brief oder Online-Portal). Bewahren Sie eine Kopie auf.",
                  icon: FileText
                },
                {
                  step: "3",
                  title: "Bestätigung einholen",
                  desc: "Fordern Sie eine schriftliche Kündigungsbestätigung mit dem genauen Vertragsende an.",
                  icon: Check
                },
                {
                  step: "4",
                  title: "Fahrzeug vorbereiten",
                  desc: "Reinigen Sie das Fahrzeug und dokumentieren Sie den Zustand mit Fotos vor der Rückgabe.",
                  icon: Shield
                },
                {
                  step: "5",
                  title: "Rückgabe vereinbaren",
                  desc: "Terminieren Sie die Fahrzeugrückgabe rechtzeitig mit dem Anbieter.",
                  icon: Calendar
                },
                {
                  step: "6",
                  title: "Übergabeprotokoll",
                  desc: "Lassen Sie bei der Rückgabe ein detailliertes Übergabeprotokoll erstellen und unterschreiben.",
                  icon: FileCheck
                }
              ].map((item, i) => {
                const IconComponent = item.icon;
                return (
                  <div key={i} className="bg-white border-2 border-primary rounded-xl p-6 hover:shadow-lg transition-all">
                    <div className="flex items-start gap-4">
                      <div className="bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0">
                        {item.step}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <IconComponent className="w-5 h-5 text-primary" />
                          <h3 className="font-bold text-neutral-900 text-lg">{item.title}</h3>
                        </div>
                        <p className="text-neutral-600">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* KOSTEN & GEBÜHREN */}
        <section id="kosten" className="py-16 px-4 bg-white scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <DollarSign className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Kosten bei der Kündigung
              </h2>
            </div>
            
            <div className="space-y-6">
              <p className="text-lg text-neutral-700 leading-relaxed">
                Folgende Kosten können bei der Kündigung eines Auto-Abos anfallen:
              </p>

              <div className="overflow-x-auto rounded-xl border-2 border-primary shadow-lg">
                <table className="w-full bg-white text-left">
                  <thead className="bg-primary text-white">
                    <tr>
                      <th className="p-4 md:p-6 font-bold text-base md:text-lg">Kostenart</th>
                      <th className="p-4 md:p-6 font-bold text-base md:text-lg">Typischer Betrag</th>
                      <th className="p-4 md:p-6 font-bold text-base md:text-lg">Hinweise</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    <tr className="hover:bg-primary/5 transition-colors">
                      <td className="p-4 md:p-6 font-medium text-neutral-900">Vorzeitige Kündigung</td>
                      <td className="p-4 md:p-6 text-neutral-700 font-semibold">30-50% Restkosten</td>
                      <td className="p-4 md:p-6 text-neutral-600">Nur bei Kündigung vor Mindestlaufzeit</td>
                    </tr>
                    <tr className="hover:bg-primary/5 transition-colors">
                      <td className="p-4 md:p-6 font-medium text-neutral-900">Reinigungsgebühren</td>
                      <td className="p-4 md:p-6 text-neutral-700 font-semibold">50-200 CHF</td>
                      <td className="p-4 md:p-6 text-neutral-600">Falls Fahrzeug stark verschmutzt</td>
                    </tr>
                    <tr className="hover:bg-primary/5 transition-colors">
                      <td className="p-4 md:p-6 font-medium text-neutral-900">Reparaturkosten</td>
                      <td className="p-4 md:p-6 text-neutral-700 font-semibold">Nach Aufwand</td>
                      <td className="p-4 md:p-6 text-neutral-600">Bei Schäden über normale Abnutzung hinaus</td>
                    </tr>
                    <tr className="hover:bg-primary/5 transition-colors">
                      <td className="p-4 md:p-6 font-medium text-neutral-900">Kilometer-Überschreitung</td>
                      <td className="p-4 md:p-6 text-neutral-700 font-semibold">0.50-1.00 CHF/km</td>
                      <td className="p-4 md:p-6 text-neutral-600">Falls vereinbarte KM überschritten</td>
                    </tr>
                    <tr className="hover:bg-primary/5 transition-colors">
                      <td className="p-4 md:p-6 font-medium text-neutral-900">Restrate</td>
                      <td className="p-4 md:p-6 text-neutral-700 font-semibold">Volle Monatsrate</td>
                      <td className="p-4 md:p-6 text-neutral-600">Für den laufenden Monat</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <Info className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-green-900 font-semibold mb-1">Spartipp</p>
                    <p className="text-green-800">
                      Kündigen Sie rechtzeitig und halten Sie die Kündigungsfrist ein, um unnötige Kosten zu vermeiden. Dokumentieren Sie den Fahrzeugzustand bei der Rückgabe.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SEARCH SECTION */}
        <section id="search" className="py-16 px-4 bg-neutral-50 scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border-2 border-primary p-6 md:p-10">
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-3">
                  Alternative: Leasingübernahme
                </h2>
                <p className="text-neutral-600 text-base md:text-lg">
                  Günstiger und flexibler als ein neues Auto-Abo – entdecken Sie verfügbare Leasingübernahmen.
                </p>
              </div>
              <SearchForm />
            </div>
          </div>
        </section>

        {/* FAHRZEUGRÜCKGABE */}
        <section id="rueckgabe" className="py-16 px-4 bg-white scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <Shield className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Checkliste für die Fahrzeugrückgabe
              </h2>
            </div>
            
            <div className="space-y-4">
              {[
                "Fahrzeug gründlich innen und außen reinigen",
                "Alle persönlichen Gegenstände entfernen",
                "Zustand des Fahrzeugs mit Fotos dokumentieren",
                "Alle Schlüssel, Papiere und Zubehör bereithalten",
                "Tanken Sie das Fahrzeug voll (falls vertraglich vereinbart)",
                "Prüfen Sie auf sichtbare Schäden und dokumentieren Sie diese",
                "Vereinbaren Sie einen Termin für die Rückgabe",
                "Lassen Sie ein Übergabeprotokoll erstellen und unterschreiben",
                "Fordern Sie eine Kopie des Protokolls an"
              ].map((item, i) => (
                <div key={i} className="bg-neutral-50 border-2 border-primary rounded-xl p-4 hover:shadow-md transition-all">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg shrink-0">
                      <Check className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-neutral-700 font-medium">{item}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-r-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-yellow-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-yellow-900 font-semibold mb-1">Wichtig</p>
                  <p className="text-yellow-800">
                    Fotografieren Sie das Fahrzeug bei der Rückgabe aus allen Winkeln und dokumentieren Sie eventuelle Schäden. Dies schützt Sie vor ungerechtfertigten Nachforderungen.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SONDERKÜNDIGUNG */}
        <section id="sonderkuendigung" className="py-16 px-4 bg-neutral-50 scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <AlertTriangle className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Sonderkündigung: Wann ist sie möglich?
              </h2>
            </div>
            
            <div className="space-y-6">
              <p className="text-lg text-neutral-700 leading-relaxed">
                In bestimmten Fällen können Sie Ihr Auto-Abo außerordentlich kündigen:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    title: "Umzug ins Ausland",
                    desc: "Bei dauerhaftem Wohnsitzwechsel ins Ausland",
                    icon: Zap
                  },
                  {
                    title: "Schwere Krankheit",
                    desc: "Bei langfristiger Fahruntauglichkeit mit ärztlichem Attest",
                    icon: Shield
                  },
                  {
                    title: "Todesfall",
                    desc: "Vertrag kann durch Erben gekündigt werden",
                    icon: FileCheck
                  },
                  {
                    title: "Vertragsbruch Anbieter",
                    desc: "Bei schwerwiegenden Vertragsverletzungen des Anbieters",
                    icon: AlertTriangle
                  }
                ].map((item, i) => {
                  const IconComponent = item.icon;
                  return (
                    <div key={i} className="bg-white border-2 border-primary rounded-xl p-6">
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

              <div className="bg-primary/5 border-l-4 border-primary p-6 rounded-r-xl">
                <p className="text-neutral-700 font-medium">
                  <strong>Hinweis:</strong> Bei Sonderkündigungen müssen Sie entsprechende Nachweise vorlegen. Kontaktieren Sie Ihren Anbieter und erkundigen Sie sich nach den genauen Voraussetzungen.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ALTERNATIVEN */}
        <section id="alternativen" className="py-16 px-4 bg-white scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <Zap className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Alternativen zum Auto-Abo
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-2 border-primary shadow-lg">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-neutral-900 mb-4">Leasingübernahme</h3>
                  <ul className="space-y-3 mb-6">
                    {[
                      "20-30% günstiger als Auto-Abo",
                      "Sofort verfügbar",
                      "Mittelfristige Bindung (6-24 Monate)",
                      "Fixe monatliche Rate",
                      "Große Auswahl an Fahrzeugen"
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-neutral-700">
                        <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <span className="font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Button asChild className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl">
                    <Link href="/leasinguebernahme">
                      Mehr zur Leasingübernahme
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-2 border-neutral-300 shadow-lg">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-neutral-900 mb-4">Neues Leasing</h3>
                  <ul className="space-y-3 mb-6">
                    {[
                      "Wunschfahrzeug konfigurieren",
                      "Neueste Modelle verfügbar",
                      "Flexible Laufzeiten (2-5 Jahre)",
                      "Planbare monatliche Kosten",
                      "Kaufoption am Vertragsende"
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-neutral-700">
                        <Check className="w-5 h-5 text-neutral-600 shrink-0 mt-0.5" />
                        <span className="font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Button asChild variant="outline" className="w-full border-2 border-neutral-300 hover:bg-neutral-100 rounded-xl">
                    <Link href="/suche">
                      Leasingangebote vergleichen
                    </Link>
                  </Button>
                </CardContent>
              </Card>
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
                Antworten auf die wichtigsten Fragen zur Auto-Abo Kündigung
              </p>
            </div>
            
            <Accordion type="single" collapsible className="w-full space-y-4">
              <AccordionItem 
                value="item-1" 
                className="bg-white rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-primary transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Kann ich mein Auto-Abo vorzeitig kündigen?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Ja, aber meist nur gegen Zahlung einer Vorfälligkeitsentschädigung (oft 30-50% der Restkosten). Prüfen Sie Ihren Vertrag auf die genauen Bedingungen.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem 
                value="item-2" 
                className="bg-white rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-primary transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Wie lange ist die Kündigungsfrist bei Auto-Abos?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Die Kündigungsfrist beträgt in der Schweiz üblicherweise 1-3 Monate. Die genaue Frist finden Sie in Ihrem Vertrag.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem 
                value="item-3" 
                className="bg-white rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-primary transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Muss die Kündigung schriftlich erfolgen?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Ja, Kündigungen müssen in der Regel schriftlich eingereicht werden (E-Mail, Brief oder Online-Portal). Bewahren Sie eine Kopie und Kündigungsbestätigung auf.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem 
                value="item-4" 
                className="bg-white rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-primary transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Was passiert, wenn ich die Kündigungsfrist verpasse?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Der Vertrag verlängert sich automatisch um den vereinbarten Zeitraum (oft 6-12 Monate). Achten Sie daher genau auf die Fristen.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="item-5" 
                className="bg-white rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-primary transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Welche Kosten entstehen bei der Fahrzeugrückgabe?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Mögliche Kosten: Reinigungsgebühren (50-200 CHF), Reparaturkosten bei Schäden, Kilometer-Überschreitung (0.50-1.00 CHF/km) und die Restrate für den laufenden Monat.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="item-6" 
                className="bg-white rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-primary transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Kann ich mein Auto-Abo an jemanden anderen übertragen?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  Dies hängt vom Anbieter ab. Einige erlauben eine Vertragsübernahme, andere nicht. Kontaktieren Sie Ihren Anbieter für Details.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-20 bg-neutral-900 px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Bereit für eine günstigere Alternative?
            </h2>
            <p className="text-neutral-300 max-w-2xl mx-auto text-lg leading-relaxed">
              Entdecken Sie Leasingübernahmen als kostengünstige Alternative zum Auto-Abo.
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