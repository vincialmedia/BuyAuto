import Head from "next/head";
import type { GetStaticPropsContext } from "next";
import { Breadcrumbs } from "@/components/buyauto/Breadcrumbs";
import { CONTENT_LAST_UPDATED, formatSwissDate } from "@/lib/buyauto/contentDates";
import { LEASING_COMPANIES } from "@/lib/buyauto/leasingCompanies";
import { useT, T, useLocale } from "@/i18n/runtime";
import { absoluteUrl } from "@/i18n/config";
import { withI18n } from "@/i18n/server";
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

// Single source for the visible «Aktualisiert am» badge and the Article dateModified.
const LAST_UPDATED_ISO = CONTENT_LAST_UPDATED["/leasinguebernahme-kosten"];

export default function LeasinguebernahmeKostenPage() {
  const t = useT();
  const locale = useLocale();
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <Head>
        <title>{t("Leasingübernahme Kosten Schweiz: Gebühren-Überblick | BuyAuto")}</title>
        <meta
          name="description"
          content={t("Was kostet eine Leasingübernahme in der Schweiz? Alle Gebühren, versteckte Kosten und Spartipps im Detail – transparent und verständlich erklärt.")}
        />
        <link rel="canonical" href={absoluteUrl("/leasinguebernahme-kosten", locale)} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: t("Leasingübernahme Kosten in der Schweiz"),
              author: { "@type": "Person", name: "Vincent Hänggi" },
              publisher: {
                "@type": "Organization",
                name: "BuyAuto",
                logo: { "@type": "ImageObject", url: "https://www.buyauto.ch/share-logo.jpg" },
              },
              dateModified: LAST_UPDATED_ISO,
              mainEntityOfPage: absoluteUrl("/leasinguebernahme-kosten", locale),
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
                  name: t("Wie viel kostet eine Leasingübernahme insgesamt?"),
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: t("Die Gesamtkosten liegen typischerweise zwischen 200 und 650 CHF für den Einstieg (Transfer, Ummeldung, Administration). Hinzu kommen monatliche Kosten wie Leasingrate und Versicherung."),
                  },
                },
                {
                  "@type": "Question",
                  name: t("Wer zahlt die Transfergebühr?"),
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: t("Das ist frei verhandelbar. In den meisten Fällen übernimmt der Abgeber die Transfergebühr, um den Vertrag attraktiver zu machen. Manchmal teilen sich beide Parteien die Kosten."),
                  },
                },
                {
                  "@type": "Question",
                  name: t("Gibt es versteckte Kosten?"),
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: t("Ja, achte auf: eventuelle Reparaturen, fällige Services, Kilometerüberschreitungen und nicht übertragbare Servicepakete. Ein detailliertes Übergabeprotokoll schützt dich vor Überraschungen."),
                  },
                },
                {
                  "@type": "Question",
                  name: t("Ist eine Leasingübernahme günstiger als ein neues Leasing?"),
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: t("Ja, deutlich! Du sparst die hohe Anzahlung (3'000–10'000 CHF) und zahlst nur 200–650 CHF Einstiegskosten. Zudem profitierst du von kürzeren Restlaufzeiten."),
                  },
                },
                {
                  "@type": "Question",
                  name: t("Wie viel kostet die Ummeldung?"),
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: t("Die Ummeldung beim Strassenverkehrsamt kostet je nach Kanton 50–150 CHF. Hinzu kommen eventuell Kosten für einen neuen Fahrzeugausweis (ca. 50 CHF)."),
                  },
                },
                {
                  "@type": "Question",
                  name: t("Kann ich die Kosten mit dem Abgeber teilen?"),
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: t("Ja, absolut. Die Kostenaufteilung ist Verhandlungssache. Viele Abgeber sind bereit, Kosten zu übernehmen, um den Transfer zu beschleunigen."),
                  },
                },
              ],
            }),
          }}
        />
        
        {/* Open Graph */}
        <meta property="og:title" content={t("Leasingübernahme Kosten Schweiz – Kompletter Gebühren-Überblick")} />
        <meta property="og:description" content={t("Was kostet eine Leasingübernahme in der Schweiz? Alle Gebühren, versteckte Kosten und Spartipps im Detail.")} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={absoluteUrl("/leasinguebernahme-kosten", locale)} />
      </Head>

      <main className="bg-neutral-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <Breadcrumbs
            items={[
              { name: t("Home"), href: "/" },
              { name: t("Leasingübernahme"), href: "/leasinguebernahme" },
              { name: t("Kosten"), href: "/leasinguebernahme-kosten" },
            ]}
          />
        </div>
        
        {/* HERO SECTION */}
        <section className="relative min-h-[500px] md:min-h-[550px] flex items-center overflow-hidden pt-16">
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=2400&q=80"
              alt={t("Leasingübernahme Kosten Schweiz")}
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
                  {t("Kostenübersicht · Aktualisiert am {date}", { date: formatSwissDate(LAST_UPDATED_ISO) })}
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight mb-6">
                  {t("Leasingübernahme Kosten in der Schweiz")}
                </h1>
                <p className="text-xl md:text-2xl text-primary-foreground font-semibold mb-4">
                  {t("Der komplette Gebühren-Überblick")}
                </p>
                <p className="text-lg text-neutral-200 leading-relaxed mb-8 max-w-2xl">
                  {t("Eine Leasingübernahme kostet dich in der Schweiz einmalig rund 200–650 CHF – je nach Leasinggeber für Umschreibung, Bonitätsprüfung und Administration. Danach zahlst du einfach die bestehende Monatsrate weiter; eine Anzahlung wie beim Neuleasing entfällt. Alle Gebühren, versteckte Kosten und Spartipps findest du im Detail weiter unten.")}
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    asChild
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30 transition-all duration-300 px-8 py-6 text-base font-semibold rounded-xl"
                  >
                    <Link href="/suche">
                      {t("Angebote durchsuchen")}
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
                      {t("Inserat erstellen")}
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
                {t("Kurz gesagt: Was kostet eine Leasingübernahme?")}
              </h2>
            </div>
            
            <div className="bg-primary/5 border-l-4 border-primary p-8 rounded-r-xl shadow-sm">
              <p className="text-lg text-neutral-700 leading-relaxed mb-4">
                <T
                  k="Eine <0>Leasingübernahme kostet in der Schweiz typischerweise zwischen 200–650 CHF</0>, abhängig von der Bank, dem Fahrzeugtyp und eventuellen Zusatzleistungen."
                  c={[<strong key={0} />]}
                />
              </p>
              <p className="text-lg text-neutral-700 leading-relaxed">
                {t("Viele Abgeber übernehmen diese Kosten freiwillig, um den Transfer attraktiver zu gestalten.")}
              </p>
              
              <div className="mt-6 pt-6 border-t border-primary/20">
                <p className="text-primary font-medium flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  <T
                    k="<0>Wichtig:</0> Versteckte Kosten wie Ummeldung, Versicherung und eventuelle Reparaturen können zusätzlich anfallen."
                    c={[<strong key={0} />]}
                  />
                </p>
              </div>
              
              <div className="mt-4">
                <Link href="/leasinguebernahme" className="inline-flex items-center gap-2 text-primary font-semibold hover:underline">
                  <ArrowRight className="w-4 h-4" />
                  {t("Alles zur Leasingübernahme")}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* TOC SECTION */}
        <section className="py-10 px-4 bg-neutral-50">
          <div className="max-w-4xl mx-auto">
            <h3 className="font-bold text-neutral-900 mb-6 text-xl text-center">{t("Inhaltsverzeichnis")}</h3>
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
                    <span className="font-medium">{t(item.label)}</span>
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
                {t("Kostenübersicht im Detail")}
              </h2>
            </div>
            
            <div className="overflow-x-auto rounded-xl border-2 border-primary shadow-lg">
              <table className="w-full bg-white text-left">
                <thead className="bg-primary text-white">
                  <tr>
                    <th className="p-4 md:p-6 font-bold text-base md:text-lg">{t("Kostenart")}</th>
                    <th className="p-4 md:p-6 font-bold text-base md:text-lg">{t("Typische Kosten")}</th>
                    <th className="p-4 md:p-6 font-bold text-base md:text-lg">{t("Wird bezahlt von")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  <tr className="hover:bg-primary/5 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">{t("Transfergebühr (Bank)")}</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">{t("100–400 CHF")}</td>
                    <td className="p-4 md:p-6 text-neutral-700">{t("Meist Abgeber oder frei verhandelbar")}</td>
                  </tr>
                  <tr className="hover:bg-primary/5 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">{t("Händler-/Wechselgebühr")}</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">{t("100–250 CHF")}</td>
                    <td className="p-4 md:p-6 text-neutral-700">{t("Optional (falls über Händler)")}</td>
                  </tr>
                  <tr className="hover:bg-primary/5 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">{t("Ummeldung beim Strassenverkehrsamt")}</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">{t("50–150 CHF")}</td>
                    <td className="p-4 md:p-6 text-neutral-700">{t("Übernehmer")}</td>
                  </tr>
                  <tr className="hover:bg-primary/5 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">{t("Neuer Fahrzeugausweis")}</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">{t("ca. 50 CHF")}</td>
                    <td className="p-4 md:p-6 text-neutral-700">{t("Übernehmer")}</td>
                  </tr>
                  <tr className="hover:bg-primary/5 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">{t("Versicherung (pro Monat)")}</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">{t("variabel (150–400 CHF/Monat)")}</td>
                    <td className="p-4 md:p-6 text-neutral-700">{t("Übernehmer")}</td>
                  </tr>
                  <tr className="hover:bg-primary/5 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">{t("Eventuelle Reparaturen")}</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">{t("variabel")}</td>
                    <td className="p-4 md:p-6 text-neutral-700">{t("Nach Vereinbarung")}</td>
                  </tr>
                  <tr className="hover:bg-primary/5 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">{t("Administrationskosten (Bank)")}</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">{t("0–100 CHF")}</td>
                    <td className="p-4 md:p-6 text-neutral-700">{t("Abgeber oder Übernehmer")}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-8 bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <Info className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-green-900 font-semibold mb-1">{t("Spartipp")}</p>
                  <p className="text-green-800">
                    {t("Verhandle mit dem Abgeber! Viele sind bereit, die Transfergebühr zu übernehmen, um den Vertrag schneller loszuwerden.")}
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
                {t("Transfergebühr im Detail")}
              </h2>
            </div>
            
            <div className="space-y-6">
              <Card className="border-2 border-primary/20">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-neutral-900 mb-4">
                    {t("Was ist die Transfergebühr?")}
                  </h3>
                  <p className="text-neutral-700 leading-relaxed mb-4">
                    <T
                      k="Die <0>Transfergebühr</0> ist die Hauptgebühr bei einer Leasingübernahme. Sie wird von der Leasingbank erhoben und deckt die administrativen Kosten der Vertragsübertragung ab."
                      c={[<strong key={0} />]}
                    />
                  </p>
                  <p className="text-neutral-700 leading-relaxed">
                    <T
                      k="Diese Gebühr variiert je nach Bank und kann zwischen <0>100 und 400 CHF</0> liegen. Wie die Übertragung selbst Schritt für Schritt abläuft, zeigt unser Ratgeber <1>Leasingvertrag übertragen – so funktioniert es</1>."
                      c={[<strong key={0} />, <Link key={1} href="/leasingvertrag-uebertragen" className="text-primary font-semibold hover:underline" />]}
                    />
                  </p>
                </CardContent>
              </Card>

              <div className="bg-white p-6 rounded-xl border border-neutral-200">
                <h3 className="text-xl font-bold text-neutral-900 mb-4">{t("Faktoren, die die Höhe beeinflussen:")}</h3>
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
                        <span className="text-neutral-700 font-medium">{t(item.text)}</span>
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
                {t("Ummeldung & Fahrzeugausweis")}
              </h2>
            </div>
            
            <Card className="border-2 border-primary/20">
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-neutral-900 mb-3">{t("Was kostet die Ummeldung?")}</h3>
                    <p className="text-neutral-700 leading-relaxed">
                      <T
                        k="Nach der Vertragsübertragung muss das Fahrzeug beim <0>Strassenverkehrsamt</0> auf den neuen Halter umgemeldet werden. Die Kosten variieren je nach Kanton, liegen aber typischerweise bei <1>50–150 CHF</1>."
                        c={[<strong key={0} />, <strong key={1} />]}
                      />
                    </p>
                  </div>

                  <div className="bg-primary/5 p-6 rounded-lg">
                    <h4 className="font-bold text-neutral-900 mb-3">{t("Benötigte Dokumente:")}</h4>
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
                          <span>{t(doc)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-amber-900 font-semibold mb-1">{t("Wichtig")}</p>
                        <p className="text-amber-800">
                          <T
                            k="Die Ummeldung muss innerhalb von <0>14 Tagen</0> nach der Übernahme erfolgen, sonst drohen Bussen."
                            c={[<strong key={0} />]}
                          />
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
                {t("Versicherungskosten")}
              </h2>
            </div>
            
            <div className="space-y-6">
              <Card className="border-2 border-primary/20">
                <CardContent className="p-8">
                  <p className="text-lg text-neutral-700 leading-relaxed mb-6">
                    <T
                      k="Bei einer Leasingübernahme musst du eine <0>eigene Vollkaskoversicherung</0> abschliessen. Die Kosten hängen von mehreren Faktoren ab:"
                      c={[<strong key={0} />]}
                    />
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
                            <h4 className="font-bold text-neutral-900">{t(item.title)}</h4>
                          </div>
                          <p className="text-neutral-600 text-sm">{t(item.desc)}</p>
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
                    <p className="text-green-900 font-semibold mb-1">{t("Spartipp")}</p>
                    <p className="text-green-800">
                      <T k="Vergleiche mehrere Versicherungsangebote! Die Prämien können um <0>20–40%</0> variieren." c={[<strong key={0} />]} />
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
                {t("Versteckte Kosten – Darauf musst du achten")}
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
                          <h3 className="font-bold text-neutral-900 text-lg mb-2">{t(item.title)}</h3>
                          <p className="text-neutral-700">{t(item.desc)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="mt-8 bg-primary text-white p-8 rounded-xl">
              <h3 className="text-xl font-bold mb-3">{t("💡 Profi-Tipp")}</h3>
              <p className="leading-relaxed">
                <T
                  k="Erstelle vor der Übernahme ein <0>detailliertes Übergabeprotokoll</0> mit Fotos. So vermeidest du nachträgliche Überraschungen bei Schäden oder Mängeln."
                  c={[<strong key={0} />]}
                />
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
                {t("Spartipps für die Leasingübernahme")}
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
                          <h3 className="font-bold text-neutral-900 mb-2">{t(tip.title)}</h3>
                          <p className="text-neutral-700 text-sm">{t(tip.desc)}</p>
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
                {t("Kostenvergleich: Leasingübernahme vs. Neues Leasing")}
              </h2>
            </div>
            
            <div className="overflow-x-auto rounded-xl border-2 border-primary shadow-lg">
              <table className="w-full bg-white text-left">
                <thead className="bg-primary text-white">
                  <tr>
                    <th className="p-4 md:p-6 font-bold text-base md:text-lg">{t("Kostenart")}</th>
                    <th className="p-4 md:p-6 font-bold text-base md:text-lg">{t("Leasingübernahme")}</th>
                    <th className="p-4 md:p-6 font-bold text-base md:text-lg">{t("Neues Leasing")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  <tr className="hover:bg-primary/5 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">{t("Anzahlung")}</td>
                    <td className="p-4 md:p-6 text-green-600 font-semibold">{t("0–100 CHF")}</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">{t("3'000–10'000 CHF")}</td>
                  </tr>
                  <tr className="hover:bg-primary/5 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">{t("Transfergebühr")}</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">{t("100–400 CHF")}</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">—</td>
                  </tr>
                  <tr className="hover:bg-primary/5 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">{t("Ummeldung")}</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">{t("50–150 CHF")}</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">{t("50–150 CHF")}</td>
                  </tr>
                  <tr className="hover:bg-primary/5 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">{t("Versicherung (Monat)")}</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">{t("150–400 CHF")}</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">{t("150–400 CHF")}</td>
                  </tr>
                  <tr className="hover:bg-primary/5 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">{t("Laufzeit")}</td>
                    <td className="p-4 md:p-6 text-green-600 font-semibold">{t("6–24 Monate (kürzer)")}</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">{t("36–48 Monate")}</td>
                  </tr>
                  <tr className="bg-green-50 hover:bg-green-100 transition-colors">
                    <td className="p-4 md:p-6 font-bold text-neutral-900">{t("TOTAL (Einstieg)")}</td>
                    <td className="p-4 md:p-6 text-green-600 font-bold text-lg">{t("200–650 CHF")}</td>
                    <td className="p-4 md:p-6 text-neutral-900 font-bold text-lg">{t("3'200–10'550 CHF")}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-8 bg-primary text-white p-8 rounded-xl">
              <div className="flex items-start gap-4">
                <CheckCircle className="w-8 h-8 shrink-0" />
                <div>
                  <h3 className="text-xl font-bold mb-2">{t("Fazit")}</h3>
                  <p className="leading-relaxed text-lg">
                    <T
                      k="Eine Leasingübernahme ist <0>deutlich günstiger</0> im Einstieg als ein neues Leasing. Du sparst die hohe Anzahlung und hast mehr Flexibilität durch kürzere Restlaufzeiten."
                      c={[<strong key={0} />]}
                    />
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
                  {t("Finde jetzt günstige Leasingübernahmen")}
                </h2>
                <p className="text-neutral-600 text-base md:text-lg">
                  <T
                    k="Durchsuche <0>aktuelle Leasingübernahme-Angebote</0> und spare bei deinem nächsten Vertrag."
                    c={[<Link key={0} href="/suche?dealType=lease_takeover" className="text-primary font-semibold hover:underline" />]}
                  />
                </p>
              </div>
              <SearchForm />
            </div>
          </div>
        </section>

        {/* KONDITIONEN NACH GESELLSCHAFT */}
        <section className="py-16 px-4 bg-neutral-50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-neutral-900 mb-3">
              {t("Konditionen nach Leasinggesellschaft")}
            </h2>
            <p className="text-neutral-600 mb-8 max-w-2xl mx-auto">
              {t("Die Umschreibegebühr legt deine Leasinggesellschaft fest – hier findest du den Ablauf pro Anbieter:")}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {LEASING_COMPANIES.map((company) => (
                <Link
                  key={company.slug}
                  href={`/${company.slug}`}
                  className="inline-flex items-center px-5 py-2.5 rounded-full bg-white border border-neutral-200 text-neutral-700 text-sm font-semibold hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors duration-200"
                >
                  {company.name}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section id="faq" className="py-16 px-4 bg-white scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-neutral-900 mb-3">
                {t("FAQ – Häufige Fragen zu Leasingübernahme-Kosten")}
              </h2>
              <p className="text-neutral-600 text-lg">
                {t("Die wichtigsten Antworten auf einen Blick")}
              </p>
            </div>
            
            <Accordion type="single" collapsible className="w-full space-y-4">
              <AccordionItem 
                value="item-1" 
                className="bg-neutral-50 rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-primary transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  {t("Wie viel kostet eine Leasingübernahme insgesamt?")}
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  <T
                    k="Die Gesamtkosten liegen typischerweise zwischen <0>200 und 650 CHF</0> für den Einstieg (Transfer, Ummeldung, Administration). Hinzu kommen monatliche Kosten wie Leasingrate und Versicherung."
                    c={[<strong key={0} />]}
                  />
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem 
                value="item-2" 
                className="bg-neutral-50 rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-primary transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  {t("Wer zahlt die Transfergebühr?")}
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  <T
                    k="Das ist frei verhandelbar. In den meisten Fällen übernimmt der <0>Abgeber</0> die Transfergebühr, um den Vertrag attraktiver zu machen. Manchmal teilen sich beide Parteien die Kosten."
                    c={[<strong key={0} />]}
                  />
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem 
                value="item-3" 
                className="bg-neutral-50 rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-primary transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  {t("Gibt es versteckte Kosten?")}
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  {t("Ja, achte auf: eventuelle Reparaturen, fällige Services, Kilometerüberschreitungen und nicht übertragbare Servicepakete. Ein detailliertes Übergabeprotokoll schützt dich vor Überraschungen.")}
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem 
                value="item-4" 
                className="bg-neutral-50 rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-primary transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  {t("Ist eine Leasingübernahme günstiger als ein neues Leasing?")}
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  <T
                    k="Ja, deutlich! Du sparst die hohe Anzahlung (3'000–10'000 CHF) und zahlst nur 200–650 CHF Einstiegskosten. Zudem profitierst du von kürzeren Restlaufzeiten. Alle Unterschiede im Detail zeigt <0>Leasingübernahme vs. neues Leasing im Vergleich</0>."
                    c={[<Link key={0} href="/leasinguebernahme-vs-neues-leasing" className="text-primary font-semibold hover:underline" />]}
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="item-5" 
                className="bg-neutral-50 rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-primary transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  {t("Wie viel kostet die Ummeldung?")}
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  <T
                    k="Die Ummeldung beim Strassenverkehrsamt kostet je nach Kanton <0>50–150 CHF</0>. Hinzu kommen eventuell Kosten für einen neuen Fahrzeugausweis (ca. 50 CHF)."
                    c={[<strong key={0} />]}
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="item-6" 
                className="bg-neutral-50 rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-primary transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  {t("Kann ich die Kosten mit dem Abgeber teilen?")}
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  {t("Ja, absolut. Die Kostenaufteilung ist Verhandlungssache. Viele Abgeber sind bereit, Kosten zu übernehmen, um den Transfer zu beschleunigen.")}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-20 bg-neutral-900 px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              {t("Spare jetzt bei deiner Leasingübernahme")}
            </h2>
            <p className="text-neutral-300 max-w-2xl mx-auto text-lg leading-relaxed">
              {t("Finde transparente Angebote ohne versteckte Kosten oder erstelle dein eigenes Inserat – kostenlos und unkompliziert.")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <Button asChild size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-semibold bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/30 transition-all">
                <Link href="/suche">
                  <Search className="w-5 h-5 mr-2" />
                  {t("Angebote durchsuchen")}
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg font-semibold border-2 border-white text-white hover:bg-white hover:text-neutral-900 rounded-xl bg-transparent transition-all">
                <Link href="/inserat-erstellen">
                  {t("Inserat erstellen")}
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
export const getStaticProps = async (context: GetStaticPropsContext) => {
  return { props: { ...(await withI18n(context.locale, ["pages/leasinguebernahme-kosten"])) }, revalidate: 300 };
};