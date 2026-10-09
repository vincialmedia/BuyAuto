import type { GetStaticProps } from "next";
import Head from "next/head";
import { Breadcrumbs } from "@/components/buyauto/Breadcrumbs";
import { CONTENT_LAST_UPDATED, formatSwissDate } from "@/lib/buyauto/contentDates";
import { LEASING_COMPANIES } from "@/lib/buyauto/leasingCompanies";
import {
  AMAG_LEASING,
  CA_AUTO_FINANCE,
  CA_AUTO_FINANCE_TRANSFER_INCL_VAT_CHF,
  CANTONAL_FAHRZEUGAUSWEIS_RANGE_LABEL,
  CANTONAL_FEES,
  CANTONAL_KONTROLLSCHILDER_SUMMARY,
  CANTONS_WITHOUT_FIXED_PLATE_FEE,
  CEMBRA,
  CEMBRA_TRANSFER_DISPLAY,
  CEMBRA_TRANSFER_EXCL_VAT_CHF,
  FAHRZEUGAUSWEIS_RANGE,
  FEE_SHORT,
  KONTROLLSCHILDER_RANGE,
  cantonalExtremeLabel,
  kautionSentence,
  kautionTableCell,
  type InventoryStats,
} from "@/lib/buyauto/facts";
import { formatChf, formatChfRappen } from "@/lib/buyauto/format";
import { CantonalFeesTable } from "@/components/buyauto/CantonalFeesTable";
import { SourceCitation } from "@/components/buyauto/SourceCitation";
import { getLiveInventoryStats, getPremiumCarouselListings } from "@/services/listingsService";
import type { Listing } from "@/lib/buyauto/types";
import Link from "next/link";
import dynamic from "next/dynamic";
import { 
  ChevronRight, 
  AlertTriangle, 
  FileText, 
  Info, 
  ShieldCheck, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  Zap, 
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

interface LeasinguebernahmeKostenPageProps {
  stats: InventoryStats | null;
  /** Server-rendered premium carousel; null falls back to the client fetch. */
  premiumListings: Listing[] | null;
}

// FAQ answers shared by the FAQPage JSON-LD and the visible accordion, so both always match.
const TRANSFER_FEE_SENTENCE =
  `Für die Übertragung verrechnet die Leasinggesellschaft eine Gebühr. ${CEMBRA.name} verlangt ` +
  `${formatChf(CEMBRA_TRANSFER_EXCL_VAT_CHF)} exkl. MWST (rund ${CEMBRA_TRANSFER_DISPLAY} inkl. MWST), ` +
  `${CA_AUTO_FINANCE.name} ${formatChf(CA_AUTO_FINANCE.feesExclVatChf.vertragsumschreibung)} exkl. MWST ` +
  `(${formatChfRappen(CA_AUTO_FINANCE_TRANSFER_INCL_VAT_CHF)} inkl. MWST). ${AMAG_LEASING.name}, Multilease und BANK-now ` +
  `publizieren keinen Übernahme-Tarif.`;

const CANTONAL_SENTENCE =
  `Dazu kommt die Gebühr des Strassenverkehrsamts für den neuen Fahrzeugausweis: ${CANTONAL_FAHRZEUGAUSWEIS_RANGE_LABEL}, ` +
  `je nach Kanton.`;

const FAQ_TOTAL_COST_ANSWER = `${TRANSFER_FEE_SENTENCE} ${CANTONAL_SENTENCE} Monatlich kommen Leasingrate und Versicherung dazu.`;

const FAQ_REGISTRATION_ANSWER =
  `Der neue Fahrzeugausweis kostet je nach Kanton ${CANTONAL_FAHRZEUGAUSWEIS_RANGE_LABEL}. ${CANTONAL_KONTROLLSCHILDER_SUMMARY} ` +
  `In ZH und ZG können Zusatzgebühren dazukommen (siehe Fussnoten). Die Tarife aller Kantone mit Quelle stehen ` +
  `in der Tabelle auf dieser Seite.`;

function faqCheaperAnswer(stats: InventoryStats | null): string {
  return (
    "Beim Einstieg meistens: Statt einer Anzahlung für einen Neuvertrag fällt die Übertragungsgebühr an, " +
    `${FEE_SHORT}. ${kautionSentence(stats)}`
  );
}

export default function LeasinguebernahmeKostenPage({ stats, premiumListings }: LeasinguebernahmeKostenPageProps) {
  const faqCheaper = faqCheaperAnswer(stats);

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
              dateModified: LAST_UPDATED_ISO,
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
                    text: FAQ_TOTAL_COST_ANSWER,
                  },
                },
                {
                  "@type": "Question",
                  name: "Wer zahlt die Transfergebühr?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Das legt ihr selbst fest: Abgeber und Übernehmer können die Gebühr auch teilen. Kläre es, bevor ihr den Antrag bei der Leasinggesellschaft stellt.",
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
                    text: faqCheaper,
                  },
                },
                {
                  "@type": "Question",
                  name: "Wie viel kostet die Ummeldung?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: FAQ_REGISTRATION_ANSWER,
                  },
                },
                {
                  "@type": "Question",
                  name: "Kann ich die Kosten mit dem Abgeber teilen?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Ja. Wie ihr die einmaligen Kosten aufteilt, legt ihr zu zweit fest.",
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
                  Kostenübersicht · Aktualisiert am {formatSwissDate(LAST_UPDATED_ISO)}
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight mb-6">
                  Leasingübernahme Kosten in der Schweiz
                </h1>
                <p className="text-xl md:text-2xl text-primary-foreground font-semibold mb-4">
                  Der komplette Gebühren-Überblick
                </p>
                <p className="text-lg text-neutral-200 leading-relaxed mb-8 max-w-2xl">
                  Du zahlst die bestehende monatliche Leasingrate weiter; eine Anzahlung wie beim Neuleasing
                  entfällt. Einmalig fallen die Übertragungsgebühr der Leasinggesellschaft ({FEE_SHORT}) und
                  die kantonalen Gebühren für den neuen Fahrzeugausweis an. Alle Gebühren,
                  versteckte Kosten und Spartipps findest du im Detail weiter unten.
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
                Du zahlst die bestehende monatliche Leasingrate weiter. Einmalig fallen die <strong>Übertragungsgebühr der Leasinggesellschaft ({FEE_SHORT})</strong> und die kantonalen Gebühren für den neuen Fahrzeugausweis an.
              </p>
              <p className="text-lg text-neutral-700 leading-relaxed">
                Wer diese Kosten bezahlt, legen Abgeber und Übernehmer selbst fest.
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
                  { id: "kantone", label: "Gebühren nach Kanton" },
                  { id: "versicherung", label: "Versicherung" },
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
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Übertragungsgebühr der Leasinggesellschaft</td>
                    <td className="p-4 md:p-6 text-neutral-700">
                      <span className="font-semibold">
                        {CEMBRA.name}: {formatChf(CEMBRA_TRANSFER_EXCL_VAT_CHF)} exkl. MWST (rund {CEMBRA_TRANSFER_DISPLAY} inkl.)
                      </span>
                      <span className="block text-xs text-neutral-500 mt-1">
                        <SourceCitation source={CEMBRA.source} />
                      </span>
                      <span className="block font-semibold mt-3">
                        {CA_AUTO_FINANCE.name}: {formatChf(CA_AUTO_FINANCE.feesExclVatChf.vertragsumschreibung)} exkl. MWST (
                        {formatChfRappen(CA_AUTO_FINANCE_TRANSFER_INCL_VAT_CHF)} inkl.)
                      </span>
                      <span className="block text-xs text-neutral-500 mt-1">
                        <SourceCitation source={CA_AUTO_FINANCE.source} />
                      </span>
                      <span className="block mt-3">{AMAG_LEASING.name}, Multilease, BANK-now: kein Tarif publiziert</span>
                    </td>
                    <td className="p-4 md:p-6 text-neutral-700">nach Absprache zwischen Abgeber und Übernehmer</td>
                  </tr>
                  <tr className="hover:bg-primary/5 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Neuer Fahrzeugausweis (Strassenverkehrsamt)</td>
                    <td className="p-4 md:p-6 text-neutral-700">
                      <span className="font-semibold">
                        {cantonalExtremeLabel(FAHRZEUGAUSWEIS_RANGE.min)} bis {cantonalExtremeLabel(FAHRZEUGAUSWEIS_RANGE.max)}
                      </span>
                      <a href="#kantone" className="block text-xs text-primary font-semibold hover:underline mt-1">
                        Alle Kantone mit Quelle
                      </a>
                    </td>
                    <td className="p-4 md:p-6 text-neutral-700">Übernehmer</td>
                  </tr>
                  <tr className="hover:bg-primary/5 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Neue Kontrollschilder, falls du keine eigenen hast</td>
                    <td className="p-4 md:p-6 text-neutral-700">
                      <span className="font-semibold">
                        {cantonalExtremeLabel(KONTROLLSCHILDER_RANGE.min)} bis {cantonalExtremeLabel(KONTROLLSCHILDER_RANGE.max)}
                      </span>
                      <span className="block text-xs text-neutral-500 mt-1">
                        {CANTONS_WITHOUT_FIXED_PLATE_FEE.length > 0
                          ? `${CANTONS_WITHOUT_FIXED_PLATE_FEE.join(", ")} ohne festen Betrag; zu ZH siehe Fussnoten`
                          : "Zu ZH siehe Fussnoten"}
                      </span>
                      <a href="#kantone" className="block text-xs text-primary font-semibold hover:underline mt-1">
                        Alle Kantone mit Quelle
                      </a>
                    </td>
                    <td className="p-4 md:p-6 text-neutral-700">Übernehmer</td>
                  </tr>
                  <tr className="hover:bg-primary/5 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Versicherung</td>
                    <td className="p-4 md:p-6 text-neutral-700">
                      Du versicherst das Auto selbst. AMAG Leasing verlangt für Neufahrzeuge eine Vollkasko, bei
                      Occasionen ist nach Absprache eine Teilkasko möglich ({AMAG_LEASING.clauses.versicherung}).
                      <span className="block text-xs text-neutral-500 mt-1">
                        <SourceCitation source={AMAG_LEASING.source} />
                      </span>
                    </td>
                    <td className="p-4 md:p-6 text-neutral-700">Übernehmer</td>
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
                    Wer die Übertragungsgebühr bezahlt, legt ihr selbst fest. Kläre das, bevor ihr den Antrag bei der
                    Leasinggesellschaft stellt.
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
                  <p className="text-neutral-700 leading-relaxed">
                    {TRANSFER_FEE_SENTENCE} Wie die Übertragung selbst Schritt für Schritt abläuft, zeigt unser Ratgeber{" "}
                    <Link href="/leasingvertrag-uebertragen" className="text-primary font-semibold hover:underline">
                      Leasingvertrag übertragen – so funktioniert es
                    </Link>.
                  </p>
                </CardContent>
              </Card>
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
                      Nach der Vertragsübertragung stellt dir das <strong>Strassenverkehrsamt</strong> einen neuen
                      Fahrzeugausweis aus. Das kostet je nach Kanton {CANTONAL_FAHRZEUGAUSWEIS_RANGE_LABEL}. Die Tarife aller{" "}
                      {CANTONAL_FEES.length} Kantone mit Quelle findest du in der{" "}
                      <a href="#kantone" className="text-primary font-semibold hover:underline">Tabelle nach Kanton</a>.
                    </p>
                  </div>

                  <p className="text-neutral-700 leading-relaxed">
                    Welche Unterlagen nötig sind, sagen dir die Leasinggesellschaft und das Strassenverkehrsamt deines
                    Kantons.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* KANTONALE GEBÜHREN (#kantone) */}
        <div className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <CantonalFeesTable />
          </div>
        </div>

        {/* INSURANCE COSTS */}
        <section id="versicherung" className="py-16 px-4 bg-neutral-50 scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <ShieldCheck className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Versicherung
              </h2>
            </div>
            
            <div className="space-y-6">
              <Card className="border-2 border-primary/20">
                <CardContent className="p-8">
                  <p className="text-lg text-neutral-700 leading-relaxed">
                    Bei einer Leasingübernahme versicherst du das Auto selbst. Welche Deckung du brauchst, legt der
                    Leasingvertrag fest: {AMAG_LEASING.name} verlangt für Neufahrzeuge eine Vollkasko, bei Occasionen ist
                    nach Absprache eine Teilkasko möglich ({AMAG_LEASING.clauses.versicherung},{" "}
                    <SourceCitation source={AMAG_LEASING.source} prefix="" />
                    ).
                  </p>
                </CardContent>
              </Card>

              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <Info className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-green-900 font-semibold mb-1">Spartipp</p>
                    <p className="text-green-800">
                      Vergleiche mehrere Versicherungsangebote, bevor du den Vertrag übernimmst.
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
                  desc: "Wenn der nächste Service kurz bevorsteht, kläre vor der Übernahme, wer ihn bezahlt",
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
                  desc: "Wer die Gebühr bezahlt, legt ihr zu zweit fest",
                  icon: DollarSign
                },
                {
                  title: "Vergleiche Versicherungen",
                  desc: "Prämien mehrerer Anbieter vor der Übernahme vergleichen",
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
                    <td className="p-4 md:p-6 text-green-600 font-semibold">{kautionTableCell(stats)}</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">je nach Vertrag</td>
                  </tr>
                  <tr className="hover:bg-primary/5 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Übertragungsgebühr</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">
                      {CEMBRA.name} rund {CEMBRA_TRANSFER_DISPLAY} inkl. MWST, {CA_AUTO_FINANCE.name}{" "}
                      {formatChfRappen(CA_AUTO_FINANCE_TRANSFER_INCL_VAT_CHF)} inkl. MWST, andere nicht publiziert
                    </td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">keine</td>
                  </tr>
                  <tr className="hover:bg-primary/5 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Laufzeit</td>
                    <td className="p-4 md:p-6 text-green-600 font-semibold">
                      {stats?.medianMonths != null
                        ? `Restlaufzeit des bestehenden Vertrags (Median der aktuellen Angebote: ${stats.medianMonths} Monate)`
                        : "Restlaufzeit des bestehenden Vertrags, siehe Inserat"}
                    </td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">volle Laufzeit des neuen Vertrags</td>
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
                    Bei einer Leasingübernahme zahlst du keine Anzahlung für einen neuen Vertrag und bindest dich nur
                    für die Restlaufzeit. Einmalig kommen die Übertragungsgebühr und die Gebühr des Strassenverkehrsamts dazu.
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

        {/* KONDITIONEN NACH GESELLSCHAFT */}
        <section className="py-16 px-4 bg-neutral-50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-neutral-900 mb-3">
              Konditionen nach Leasinggesellschaft
            </h2>
            <p className="text-neutral-600 mb-8 max-w-2xl mx-auto">
              Die Umschreibegebühr legt deine Leasinggesellschaft fest – hier findest du den Ablauf pro
              Anbieter:
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
                  {FAQ_TOTAL_COST_ANSWER}
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
                  Das legt ihr selbst fest: Abgeber und Übernehmer können die Gebühr auch teilen. Kläre es, bevor ihr den Antrag bei der Leasinggesellschaft stellt.
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
                  {faqCheaper}
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
                  {FAQ_REGISTRATION_ANSWER}
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
                  Ja. Wie ihr die einmaligen Kosten aufteilt, legt ihr zu zweit fest.
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
        <PremiumListings initialListings={premiumListings ?? undefined} />
        
      </main>
    </>
  );
}

// Served via ISR (static + periodic revalidation) instead of a frozen build-time file,
// so the page refreshes without a redeploy and shares the prerender path of its siblings.
// Live inventory stats (Kaution spread) and the premium carousel refresh every 5 minutes, like
// the sibling guide pages; null stats render the no-number fallbacks.
export const getStaticProps: GetStaticProps<LeasinguebernahmeKostenPageProps> = async () => {
  let stats: InventoryStats | null = null;
  try {
    stats = await getLiveInventoryStats();
  } catch (error) {
    console.error("Leasingübernahme Kosten: live inventory stats failed:", error);
  }
  const premiumListings = await getPremiumCarouselListings();
  return { props: { stats, premiumListings }, revalidate: 300 };
};