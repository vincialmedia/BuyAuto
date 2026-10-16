import type { GetStaticProps } from "next";
import Head from "next/head";
import type { Listing } from "@/lib/buyauto/types";
import { getLiveInventoryStats, getPremiumCarouselListings } from "@/services/listingsService";
import { CONTENT_LAST_UPDATED, formatSwissDate } from "@/lib/buyauto/contentDates";
import {
  AMAG_LEASING,
  AUTO_ABO_PROVIDERS,
  AUTO_ABO_STAND,
  BANK_NOW,
  CA_AUTO_FINANCE,
  CA_AUTO_FINANCE_TRANSFER_INCL_VAT_CHF,
  CANTONAL_FAHRZEUGAUSWEIS_RANGE_LABEL,
  CANTONAL_FAHRZEUGAUSWEIS_RANGE_SOURCES,
  CANTONAL_FEES_HREF,
  CEMBRA,
  CEMBRA_TRANSFER_DISPLAY,
  CEMBRA_TRANSFER_EXCL_VAT_CHF,
  MULTILEASE,
  kautionSentence,
  kautionTableCell,
  type AutoAboOffer,
  type AutoAboProvider,
  type InventoryStats,
} from "@/lib/buyauto/facts";
import { formatChf, formatChfRappen } from "@/lib/buyauto/format";
import { SourceCitation } from "@/components/buyauto/SourceCitation";
import Link from "next/link";
import dynamic from "next/dynamic";
import React from "react";
import { 
  Check, 
  ChevronRight, 
  TrendingDown, 
  TrendingUp, 
  Info, 
  DollarSign, 
  Users, 
  ShieldCheck, 
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
import { BreadcrumbJsonLd } from "@/components/buyauto/Breadcrumbs";

// Dynamically import heavy interactive components
const SearchForm = dynamic(() => import("@/components/buyauto/SearchForm"), {
  loading: () => <div className="h-96 bg-white rounded-2xl border-2 border-neutral-100 animate-pulse" />
});

const PremiumListings = dynamic(() => import("@/components/buyauto/PremiumListings"), {
  loading: () => <div className="h-96 bg-neutral-50 animate-pulse" />
});

// Single source for the visible «Aktualisiert am» badge and the Article dateModified.
const LAST_UPDATED_ISO = CONTENT_LAST_UPDATED["/leasinguebernahme-vs-autoabo"];

interface LeasingubernahmeVsAutoAboPageProps {
  /** Server-rendered premium carousel; null falls back to the client fetch. */
  premiumListings: Listing[] | null;
  /** Live Leasingübernahme stats; null when they could not be loaded (cells then show no number). */
  stats: InventoryStats | null;
}

// Auto-Abo examples from the facts module: every offer with its provider, the cheapest and the
// most expensive one, and the span of their terms. Computed from the data, never typed by hand.
type AboExample = { provider: AutoAboProvider; offer: AutoAboOffer };
const ABO_EXAMPLES: AboExample[] = AUTO_ABO_PROVIDERS.flatMap((provider) =>
  provider.offers.map((offer) => ({ provider, offer }))
);
const ABO_CHEAPEST = ABO_EXAMPLES.reduce((a, b) => (b.offer.monthlyChf < a.offer.monthlyChf ? b : a));
const ABO_PRICIEST = ABO_EXAMPLES.reduce((a, b) => (b.offer.monthlyChf > a.offer.monthlyChf ? b : a));
const ABO_TERM_MIN = Math.min(...ABO_EXAMPLES.map(({ offer }) => offer.termMonths));
const ABO_TERM_MAX = Math.max(...ABO_EXAMPLES.map(({ offer }) => offer.termMonths));
/** "24 bis 48 Monate" */
const ABO_TERM_LABEL =
  ABO_TERM_MIN === ABO_TERM_MAX ? `${ABO_TERM_MIN} Monate` : `${ABO_TERM_MIN} bis ${ABO_TERM_MAX} Monate`;

const EXTERNAL_LINK_CLASS = "underline decoration-neutral-300 underline-offset-2 hover:text-neutral-900";

/** Link to the provider's offer page: "Carvolution, Opel Corsa Hybrid Edition 110". */
function AboOfferLink({ example }: { example: AboExample }) {
  return (
    <a href={example.offer.url} target="_blank" rel="noopener noreferrer nofollow" className={EXTERNAL_LINK_CLASS}>
      {example.provider.name}, {example.offer.model}
    </a>
  );
}

// FAQ answers shared by the FAQPage JSON-LD and the visible accordion, so both always match.
const FAQ_CHEAPER_ANSWER =
  "Das hängt vom Auto und vom Angebot ab. Bei einer Leasingübernahme finanzierst du keine All-Inclusive-Services mit, " +
  "dafür zahlst du Versicherung und Service separat. Beim Auto-Abo sind diese Leistungen in der Monatsrate enthalten, " +
  "dazu kommen je nach Anbieter einmalige Kosten. Der Kostenvergleich auf dieser Seite zeigt aktuelle Monatsraten " +
  "beider Modelle mit Quelle.";

const FAQ_FLEXIBILITY_ANSWER =
  "Eine Leasingübernahme bindet dich für die Restlaufzeit des bestehenden Vertrags. Beim Auto-Abo hängt die Laufzeit " +
  `vom Anbieter und vom Angebot ab: Bei den Beispielen im Kostenvergleich (Stand ${AUTO_ABO_STAND}) sind es ${ABO_TERM_LABEL}.`;

function faqDepositAnswer(stats: InventoryStats | null): string {
  return (
    "Das hängt vom Anbieter ab. Bei den Auto-Abo-Beispielen im Kostenvergleich kommen zur Monatsrate einmalige Kosten " +
    "wie eine Pauschale, ein Depot oder eine Kaution dazu. Bei einer Leasingübernahme fällt keine Anzahlung für einen " +
    `neuen Vertrag an. ${kautionSentence(stats)}`
  );
}

const FAQ_EXTRA_COSTS_ANSWER =
  "Bei der Leasingübernahme zahlst du Versicherung, Service und Steuern separat. Beim Auto-Abo sind sie in den " +
  "Beispielen auf dieser Seite inbegriffen; dazu kommen je nach Anbieter einmalige Kosten und ein Selbstbehalt im " +
  "Schadenfall. Bei beiden kosten Kilometer über dem vereinbarten Limit extra.";

const FAQ_SWITCH_ANSWER =
  "Das hängt vom Anbieter und seinen Vertragsbedingungen ab. Bei einer Leasingübernahme ist ein Wechsel nicht möglich: " +
  "Du übernimmst den Vertrag für genau dieses Fahrzeug.";

const FAQ_WHO_ANSWER =
  "Wenn du dich nur für die Restlaufzeit eines bestehenden Vertrags binden willst und bereit bist, Versicherung und " +
  "Service selbst zu organisieren.";

export default function LeasingubernahmeVsAutoAboPage({ premiumListings, stats }: LeasingubernahmeVsAutoAboPageProps) {
  const [showStickyCTA, setShowStickyCTA] = React.useState(false);
  const faqDeposit = faqDepositAnswer(stats);

  React.useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setShowStickyCTA(scrollPosition > 600);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <Head>
        <title>Leasingübernahme vs. Auto-Abo – Der grosse Vergleich | BuyAuto</title>
        <meta
          name="description"
          content="Leasingübernahme oder Auto-Abo? Vergleiche Kosten, Laufzeit und Leistungen beider Modelle mit aktuellen Beispielen und Quellen."
        />
        <link rel="canonical" href="https://www.buyauto.ch/leasinguebernahme-vs-autoabo" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: "Leasingübernahme vs. Auto-Abo",
              author: { "@type": "Person", name: "Vincent Hänggi" },
              publisher: {
                "@type": "Organization",
                name: "BuyAuto",
                logo: { "@type": "ImageObject", url: "https://www.buyauto.ch/share-logo.jpg" },
              },
              dateModified: LAST_UPDATED_ISO,
              mainEntityOfPage: "https://www.buyauto.ch/leasinguebernahme-vs-autoabo",
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
                  name: "Was ist günstiger: Leasingübernahme oder Auto-Abo?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: FAQ_CHEAPER_ANSWER,
                  },
                },
                {
                  "@type": "Question",
                  name: "Welche Option bietet mehr Flexibilität?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: FAQ_FLEXIBILITY_ANSWER,
                  },
                },
                {
                  "@type": "Question",
                  name: "Brauche ich eine Anzahlung bei einem Auto-Abo?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: faqDeposit,
                  },
                },
                {
                  "@type": "Question",
                  name: "Welche versteckten Kosten gibt es?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: FAQ_EXTRA_COSTS_ANSWER,
                  },
                },
                {
                  "@type": "Question",
                  name: "Kann ich beim Auto-Abo das Fahrzeug wechseln?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: FAQ_SWITCH_ANSWER,
                  },
                },
                {
                  "@type": "Question",
                  name: "Für wen ist eine Leasingübernahme die bessere Wahl?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: FAQ_WHO_ANSWER,
                  },
                },
              ],
            }),
          }}
        />
        
        {/* Open Graph */}
        <meta property="og:title" content="Leasingübernahme vs. Auto-Abo – Der grosse Vergleich" />
        <meta property="og:description" content="Vergleiche Leasingübernahme und Auto-Abo: Kosten, Laufzeit und Leistungen mit aktuellen Beispielen." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://www.buyauto.ch/leasinguebernahme-vs-autoabo" />
      </Head>

      {/* Schema-only: hero layout has no room for a visible crumb bar. */}
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Leasingübernahme", href: "/leasinguebernahme" },
          { name: "Übernahme vs. Auto-Abo", href: "/leasinguebernahme-vs-autoabo" },
        ]}
      />

      <main className="bg-neutral-50 min-h-screen">
        
        {/* STICKY CTA BAR */}
        <div 
          className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ${
            showStickyCTA ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="bg-gradient-to-r from-primary via-primary/95 to-primary/90 backdrop-blur-lg border-t border-white/20 shadow-2xl">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="hidden md:block">
                  <p className="text-white font-bold text-lg">
                    Finde deine Leasingübernahme
                  </p>
                  <p className="text-white/90 text-sm">
                    Aktuelle Angebote vergleichen
                  </p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <Button
                    asChild
                    size="lg"
                    className="bg-white text-primary hover:bg-white/90 font-bold shadow-lg flex-1 md:flex-none h-12 px-8 rounded-xl"
                  >
                    <Link href="/suche">
                      <Search className="w-5 h-5 mr-2" />
                      Jetzt Angebote durchsuchen
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowStickyCTA(false)}
                    className="text-white hover:bg-white/20 md:hidden h-12 w-12 rounded-xl"
                  >
                    <span className="sr-only">Schliessen</span>
                    ✕
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* HERO SECTION */}
        <section className="relative min-h-[500px] md:min-h-[550px] flex items-center overflow-hidden pt-16">
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=2400&q=80"
              alt="Leasingübernahme vs Auto-Abo"
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
            <div className="max-w-6xl mx-auto text-center">
              <div className="max-w-3xl mx-auto">
                <div className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-full text-sm font-semibold mb-6">
                  <FileCheck className="w-4 h-4" />
                  Detaillierter Vergleich · Aktualisiert am {formatSwissDate(LAST_UPDATED_ISO)}
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight mb-6">
                  Leasingübernahme vs. Auto-Abo
                </h1>
                <p className="text-xl md:text-2xl text-primary-foreground font-semibold mb-4">
                  Welches Modell passt zu dir?
                </p>
                <p className="text-lg text-neutral-200 leading-relaxed mb-8 max-w-2xl">
                  Bei der Leasingübernahme übernimmst du einen laufenden Vertrag für dessen Restlaufzeit und zahlst
                  Versicherung und Service separat. Beim Auto-Abo sind Versicherung, Service und Steuern in der
                  Monatsrate enthalten, dazu kommen je nach Anbieter einmalige Kosten. Welche Variante günstiger ist,
                  hängt vom Auto und vom Angebot ab: Der Kostenvergleich unten zeigt aktuelle Zahlen mit Quelle.
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
        <section className="py-20 px-4 bg-white">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-3 bg-primary/10 px-5 py-2 rounded-full mb-8">
              <Info className="w-5 h-5 text-primary" />
              <span className="font-bold text-neutral-900">Kurz gesagt</span>
            </div>
            <h2 className="text-4xl font-bold text-neutral-900 mb-8 tracking-tight">
              Der Hauptunterschied
            </h2>
            
            <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border-2 border-primary/20 p-8 md:p-10 rounded-3xl shadow-lg text-left">
              <p className="text-lg text-neutral-700 leading-relaxed mb-4">
                Bei einer <strong>Leasingübernahme</strong> übernimmst du einen bestehenden Vertrag für dessen Restlaufzeit. Ein <strong>Auto-Abo</strong> bündelt Auto, Versicherung und Service in einer Monatsrate, Laufzeit und Einmalkosten hängen vom Anbieter ab.
              </p>
              <p className="text-lg text-neutral-700 leading-relaxed">
                <strong>Leasingübernahme:</strong> Bindung nur für die Restlaufzeit, Versicherung und Service separat<br/>
                <strong>Auto-Abo:</strong> Versicherung und Service inklusive, Laufzeit je nach Anbieter
              </p>
            </div>
          </div>
        </section>

        {/* TOC SECTION */}
        <section className="py-16 px-4 bg-neutral-50">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="font-bold text-neutral-900 mb-8 text-2xl">Inhaltsverzeichnis</h3>
            <div className="bg-white p-8 rounded-3xl border-2 border-neutral-100 shadow-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8">
                {[
                  { id: "unterschiede", label: "Hauptunterschiede" },
                  { id: "kostenvergleich", label: "Kostenvergleich" },
                  { id: "search", label: "Angebote entdecken" },
                  { id: "vorteile-uebernahme", label: "Vorteile Leasingübernahme" },
                  { id: "vorteile-autoabo", label: "Vorteile Auto-Abo" },
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
        <section id="unterschiede" className="py-20 px-4 bg-white scroll-mt-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-neutral-900 mb-4 tracking-tight">
                Hauptunterschiede im Überblick
              </h2>
              <p className="text-xl text-neutral-600">
                Zwei verschiedene Mobilitätskonzepte im direkten Vergleich
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Leasingübernahme */}
              <div className="bg-gradient-to-br from-neutral-50 to-white p-8 md:p-10 rounded-3xl shadow-xl border-2 border-primary hover:shadow-2xl transition-all">
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
                    "Bestehender Vertrag mit Restlaufzeit",
                    "Keine Anzahlung für einen neuen Vertrag",
                    "Fixe monatliche Rate",
                    "Bindung nur für die Restlaufzeit"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-neutral-700">
                      <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Auto-Abo */}
              <div className="bg-gradient-to-br from-neutral-50 to-white p-8 md:p-10 rounded-3xl shadow-xl border-2 border-neutral-300 hover:shadow-2xl transition-all">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-neutral-700 text-white p-3 rounded-xl">
                    <TrendingUp className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-900">
                    Auto-Abo
                  </h3>
                </div>
                <ul className="space-y-4">
                  {[
                    "Laufzeit je nach Anbieter und Angebot",
                    "Einmalkosten je nach Anbieter (z. B. Depot oder Kaution)",
                    "All-Inclusive Rate (Versicherung, Service)"
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
        <section id="kostenvergleich" className="py-20 px-4 bg-gradient-to-br from-neutral-50 via-white to-neutral-50 scroll-mt-20">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-3 bg-primary/10 px-5 py-2 rounded-full mb-8">
              <DollarSign className="w-5 h-5 text-primary" />
              <span className="font-bold text-neutral-900">Kosten im Vergleich</span>
            </div>
            <h2 className="text-4xl font-bold text-neutral-900 mb-12 tracking-tight">
              Kostenvergleich
            </h2>
            
            <div className="overflow-x-auto rounded-3xl border-2 border-primary shadow-2xl">
              <table className="w-full bg-white text-left">
                <thead className="bg-primary text-white">
                  <tr>
                    <th className="p-4 md:p-6 font-bold text-base md:text-lg">Kostenposition</th>
                    <th className="p-4 md:p-6 font-bold text-base md:text-lg">Leasingübernahme</th>
                    <th className="p-4 md:p-6 font-bold text-base md:text-lg">Auto-Abo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  <tr className="hover:bg-primary/5 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Anzahlung und Kaution</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">{kautionTableCell(stats)}</td>
                    <td className="p-4 md:p-6 text-neutral-700">
                      <span className="font-semibold">Einmalkosten in den Beispielen, Stand {AUTO_ABO_STAND}:</span>
                      {AUTO_ABO_PROVIDERS.map((provider) => (
                        <span key={provider.name} className="block mt-1">
                          <a
                            href={provider.conditionsUrl ?? provider.offers[0].url}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            className={EXTERNAL_LINK_CLASS}
                          >
                            {provider.name}
                          </a>
                          : {provider.oneOffCosts.join("; ")}
                        </span>
                      ))}
                    </td>
                  </tr>
                  <tr className="hover:bg-primary/5 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Monatliche Rate</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">
                      {stats?.medianRate != null
                        ? `Median der aktuellen Angebote auf BuyAuto: ${formatChf(stats.medianRate)} pro Monat`
                        : "gemäss Inserat"}
                    </td>
                    <td className="p-4 md:p-6 text-neutral-700">
                      <span className="font-semibold">
                        Beispiele, Stand {AUTO_ABO_STAND}: {formatChf(ABO_CHEAPEST.offer.monthlyChf)} (
                        <AboOfferLink example={ABO_CHEAPEST} />, {ABO_CHEAPEST.offer.termMonths} Monate) bis{" "}
                        {formatChf(ABO_PRICIEST.offer.monthlyChf)} (<AboOfferLink example={ABO_PRICIEST} />,{" "}
                        {ABO_PRICIEST.offer.termMonths} Monate)
                      </span>
                      {[ABO_CHEAPEST, ABO_PRICIEST]
                        .filter((example) => example.offer.detail)
                        .map((example) => (
                          <span key={example.offer.url} className="block text-xs text-neutral-500 mt-1">
                            {example.provider.name}: {example.offer.detail}
                          </span>
                        ))}
                    </td>
                  </tr>
                  <tr className="hover:bg-primary/5 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Übertragungsgebühr</td>
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
                      <span className="block font-semibold mt-3">
                        {AMAG_LEASING.name}, {MULTILEASE.name}, {BANK_NOW.name}: kein Tarif publiziert
                      </span>
                    </td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">entfällt</td>
                  </tr>
                  <tr className="hover:bg-primary/5 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Neuer Fahrzeugausweis</td>
                    <td className="p-4 md:p-6 text-neutral-700">
                      <span className="font-semibold">{CANTONAL_FAHRZEUGAUSWEIS_RANGE_LABEL}, je nach Kanton</span>
                      <span className="block text-xs text-neutral-500 mt-1">
                        {CANTONAL_FAHRZEUGAUSWEIS_RANGE_SOURCES.length === 1 ? "Quelle:" : "Quellen:"}{" "}
                        {CANTONAL_FAHRZEUGAUSWEIS_RANGE_SOURCES.map((source, i) => (
                          <span key={source.title}>
                            {i > 0 ? "; " : null}
                            <SourceCitation source={source} prefix="" />
                          </span>
                        ))}
                      </span>
                      <a href={CANTONAL_FEES_HREF} className="block text-xs text-primary font-semibold hover:underline mt-1">
                        Alle Kantone mit Quelle
                      </a>
                    </td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">In den Beispielen inbegriffen (Immatrikulation)</td>
                  </tr>
                  <tr className="hover:bg-primary/5 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Versicherung</td>
                    <td className="p-4 md:p-6 text-neutral-700">
                      <span className="font-semibold">Separat: Du versicherst das Auto selbst.</span> {AMAG_LEASING.name}{" "}
                      verlangt für Neufahrzeuge eine Vollkasko, bei Occasionen ist nach Absprache eine Teilkasko möglich (
                      {AMAG_LEASING.clauses.versicherung}).
                      <span className="block text-xs text-neutral-500 mt-1">
                        <SourceCitation source={AMAG_LEASING.source} />
                      </span>
                    </td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">In den Beispielen inklusive, mit Selbstbehalt</td>
                  </tr>
                  <tr className="hover:bg-primary/5 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Service/Wartung</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">Selbst zahlen</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">In den Beispielen inklusive</td>
                  </tr>
                  <tr className="hover:bg-primary/5 transition-colors">
                    <td className="p-4 md:p-6 font-medium text-neutral-900">Laufzeit</td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">
                      {stats?.medianMonths != null
                        ? `Restlaufzeit des bestehenden Vertrags (Median der aktuellen Angebote: ${stats.medianMonths} Monate)`
                        : "Restlaufzeit des bestehenden Vertrags, gemäss Inserat"}
                    </td>
                    <td className="p-4 md:p-6 text-neutral-700 font-semibold">{ABO_TERM_LABEL} in den Beispielen</td>
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
                    Vergleiche nicht nur die Monatsrate: Bei der Leasingübernahme kommen Versicherung, Service und die einmaligen Gebühren dazu, beim Auto-Abo die Einmalkosten des Anbieters. Eine detaillierte Übersicht über <Link href="/leasinguebernahme-kosten" className="text-primary font-semibold hover:underline">alle Leasingübernahme-Kosten</Link> findest du in unserem separaten Ratgeber.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SEARCH SECTION */}
        <section id="search" className="py-20 px-4 bg-white scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-white to-neutral-50 rounded-3xl shadow-2xl border-2 border-primary p-8 md:p-12">
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-3 bg-primary/10 px-5 py-2 rounded-full mb-6">
                  <Search className="w-5 h-5 text-primary" />
                  <span className="font-bold text-neutral-900">Jetzt entdecken</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4 tracking-tight">
                  Leasingübernahmen Entdecken
                </h2>
                <p className="text-neutral-600 text-lg">
                  Finde eine Leasingübernahme oder erstelle dein eigenes Inserat.
                </p>
              </div>
              <SearchForm />
            </div>
          </div>
        </section>

        {/* ADVANTAGES LEASINGÜBERNAHME */}
        <section id="vorteile-uebernahme" className="py-20 px-4 bg-gradient-to-br from-neutral-50 via-white to-neutral-50 scroll-mt-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-3 bg-primary/10 px-5 py-2 rounded-full mb-6">
                <TrendingDown className="w-5 h-5 text-primary" />
                <span className="font-bold text-neutral-900">Vorteile</span>
              </div>
              <h2 className="text-4xl font-bold text-neutral-900 mb-4 tracking-tight">
                Vorteile der Leasingübernahme
              </h2>
              <Link href="/leasinguebernahme" className="inline-flex items-center gap-2 text-primary font-semibold hover:underline">
                Mehr erfahren
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  title: "Sofort verfügbar",
                  desc: "Das Auto steht bereit, sobald die Leasinggesellschaft der Übernahme zustimmt",
                  icon: Zap
                },
                {
                  title: "Keine Anzahlung",
                  desc: `Für einen neuen Vertrag fällt keine Anzahlung an. ${kautionSentence(stats)}`,
                  icon: TrendingDown
                },
                {
                  title: "Kalkulierbare Bindung",
                  desc: "Du bindest dich nur für die Restlaufzeit des Vertrags",
                  icon: Calendar
                },
                {
                  title: "Fixe Konditionen",
                  desc: "Monatliche Rate bleibt konstant",
                  icon: ShieldCheck
                },
                {
                  title: "Grosse Auswahl",
                  desc: "Viele verschiedene Fahrzeuge verfügbar",
                  icon: Check
                }
              ].map((item, i) => {
                const IconComponent = item.icon;
                return (
                  <div key={i} className="bg-white border-2 border-primary/20 rounded-3xl p-6 hover:shadow-xl hover:border-primary transition-all hover:-translate-y-1">
                    <div className="flex items-start gap-4">
                      <div className="bg-gradient-to-br from-primary to-primary/80 p-3 rounded-2xl shrink-0 shadow-lg">
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-neutral-900 mb-2 text-lg">{item.title}</h3>
                        <p className="text-neutral-600">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ADVANTAGES AUTO-ABO */}
        <section id="vorteile-autoabo" className="py-20 px-4 bg-white scroll-mt-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-3 bg-neutral-200 px-5 py-2 rounded-full mb-6">
                <TrendingUp className="w-5 h-5 text-neutral-700" />
                <span className="font-bold text-neutral-900">Vorteile</span>
              </div>
              <h2 className="text-4xl font-bold text-neutral-900 mb-4 tracking-tight">
                Vorteile Auto-Abo
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  title: "Laufzeit nach Angebot",
                  desc: "Die Laufzeit hängt vom Anbieter ab, Beispiele stehen im Kostenvergleich",
                  icon: Zap
                },
                {
                  title: "All-Inclusive",
                  desc: "Versicherung, Service, Steuern alles inklusive",
                  icon: ShieldCheck
                },
                {
                  title: "Einmalkosten je nach Anbieter",
                  desc: "Pauschale, Depot oder Kaution: Die Beispiele stehen im Kostenvergleich",
                  icon: DollarSign
                },
                {
                  title: "Planungssicherheit",
                  desc: "Fixe Rate mit Versicherung, Service und Steuern",
                  icon: Calendar
                }
              ].map((item, i) => {
                const IconComponent = item.icon;
                return (
                  <div key={i} className="bg-neutral-50 border-2 border-neutral-200 rounded-3xl p-6 hover:shadow-xl hover:border-neutral-400 transition-all hover:-translate-y-1">
                    <div className="flex items-start gap-4">
                      <div className="bg-gradient-to-br from-neutral-600 to-neutral-700 p-3 rounded-2xl shrink-0 shadow-lg">
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-neutral-900 mb-2 text-lg">{item.title}</h3>
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
        <section id="fuer-wen" className="py-20 px-4 bg-gradient-to-br from-neutral-50 via-white to-neutral-50 scroll-mt-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-neutral-900 mb-4 tracking-tight">
                Für wen eignet sich was?
              </h2>
              <p className="text-xl text-neutral-600">
                Finde die passende Mobilitätslösung für deine Situation
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Leasingübernahme geeignet für */}
              <Card className="border-2 border-primary shadow-2xl hover:shadow-3xl transition-all rounded-3xl overflow-hidden">
                <CardContent className="p-8 md:p-10">
                  <div className="flex items-center gap-3 mb-6">
                    <Users className="w-7 h-7 text-primary" />
                    <h3 className="text-2xl font-bold text-neutral-900">
                      Leasingübernahme passt zu dir, wenn...
                    </h3>
                  </div>
                  <ul className="space-y-4">
                    {[
                      "du dich nur für die Restlaufzeit eines Vertrags binden willst",
                      "du fixe monatliche Raten bevorzugst",
                      "du bereit bist, die Versicherung separat zu zahlen"
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-neutral-700">
                        <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <span className="font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Auto-Abo geeignet für */}
              <Card className="border-2 border-neutral-300 shadow-2xl hover:shadow-3xl transition-all rounded-3xl overflow-hidden">
                <CardContent className="p-8 md:p-10">
                  <div className="flex items-center gap-3 mb-6">
                    <Users className="w-7 h-7 text-neutral-700" />
                    <h3 className="text-2xl font-bold text-neutral-900">
                      Auto-Abo passt zu dir, wenn...
                    </h3>
                  </div>
                  <ul className="space-y-4">
                    {[
                      "du All-Inclusive-Service schätzt",
                      "du keine separate Versicherung abschliessen möchtest"
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
        <section id="entscheidungshilfe" className="py-20 px-4 bg-white scroll-mt-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-3 bg-primary/10 px-5 py-2 rounded-full mb-8">
              <FileCheck className="w-5 h-5 text-primary" />
              <span className="font-bold text-neutral-900">Entscheidungshilfe</span>
            </div>
            <h2 className="text-4xl font-bold text-neutral-900 mb-12 tracking-tight">
              Entscheidungshilfe: deine Checkliste
            </h2>
            
            <div className="bg-gradient-to-br from-neutral-50 to-white border-2 border-primary/20 rounded-3xl p-8 md:p-10 shadow-xl text-left">
              <p className="text-lg text-neutral-700 mb-6">
                Diese Fragen helfen dir bei der Wahl:
              </p>
              
              <div className="space-y-4">
                {[
                  "Wie wichtig ist dir Flexibilität bei der Laufzeit?",
                  "Möchtest du eine All-Inclusive-Lösung oder lieber selbst verwalten?",
                  "Wie lange planst du, das Fahrzeug zu nutzen?",
                  "Wie wichtig ist dir Planungssicherheit?"
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
                  Willst du dich nur für die Restlaufzeit eines bestehenden Vertrags binden und Versicherung und Service selbst organisieren, passt eine <strong>Leasingübernahme</strong>: Wirf einen Blick auf die aktuell <Link href="/suche?dealType=lease_takeover" className="text-primary font-semibold hover:underline">verfügbaren Leasingübernahmen</Link>. Willst du Versicherung, Service und Steuern in einer Monatsrate, passt ein <strong>Auto-Abo</strong> besser.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section id="faq" className="py-20 px-4 bg-gradient-to-br from-neutral-50 via-white to-neutral-50 scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-3 bg-primary/10 px-5 py-2 rounded-full mb-6">
                <Info className="w-5 h-5 text-primary" />
                <span className="font-bold text-neutral-900">FAQ</span>
              </div>
              <h2 className="text-4xl font-bold text-neutral-900 mb-4 tracking-tight">
                Häufige Fragen
              </h2>
              <p className="text-neutral-600 text-xl">
                Die wichtigsten Fragen im Vergleich
              </p>
            </div>
            
            <Accordion type="single" collapsible className="w-full space-y-4">
              <AccordionItem 
                value="item-1" 
                className="bg-white rounded-3xl border-2 border-neutral-200 px-6 md:px-8 hover:border-primary hover:shadow-lg transition-all"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Was ist günstiger: Leasingübernahme oder Auto-Abo?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  {FAQ_CHEAPER_ANSWER}
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem 
                value="item-2" 
                className="bg-white rounded-3xl border-2 border-neutral-200 px-6 md:px-8 hover:border-primary hover:shadow-lg transition-all"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Welche Option bietet mehr Flexibilität?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  {FAQ_FLEXIBILITY_ANSWER}
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem 
                value="item-3" 
                className="bg-white rounded-3xl border-2 border-neutral-200 px-6 md:px-8 hover:border-primary hover:shadow-lg transition-all"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Brauche ich eine Anzahlung bei einem Auto-Abo?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  {faqDeposit}
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem 
                value="item-4" 
                className="bg-white rounded-3xl border-2 border-neutral-200 px-6 md:px-8 hover:border-primary hover:shadow-lg transition-all"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Welche versteckten Kosten gibt es?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  {FAQ_EXTRA_COSTS_ANSWER}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="item-5" 
                className="bg-white rounded-3xl border-2 border-neutral-200 px-6 md:px-8 hover:border-primary hover:shadow-lg transition-all"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Kann ich beim Auto-Abo das Fahrzeug wechseln?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  {FAQ_SWITCH_ANSWER}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="item-6" 
                className="bg-white rounded-3xl border-2 border-neutral-200 px-6 md:px-8 hover:border-primary hover:shadow-lg transition-all"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                  Für wen ist eine Leasingübernahme die bessere Wahl?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                  {FAQ_WHO_ANSWER}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-24 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 px-4">
          <div className="max-w-4xl mx-auto text-center space-y-10">
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm px-5 py-2 rounded-full mb-4">
              <Zap className="w-5 h-5 text-white" />
              <span className="font-bold text-white">Bereit zum Start</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              Bereit für deine Mobilitätslösung?
            </h2>
            <p className="text-neutral-300 max-w-2xl mx-auto text-xl leading-relaxed">
              Entdecke aktuelle Leasingübernahmen oder erstelle dein eigenes Inserat.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <Button asChild size="lg" className="w-full sm:w-auto h-14 px-10 text-lg font-semibold bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-2xl shadow-primary/30 transition-all hover:-translate-y-1">
                <Link href="/suche">
                  <Search className="w-5 h-5 mr-2" />
                  Angebote durchsuchen
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto h-14 px-10 text-lg font-semibold border-2 border-white text-white hover:bg-white hover:text-neutral-900 rounded-2xl bg-transparent transition-all hover:-translate-y-1">
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

// ISR so the premium carousel is server-rendered (prices in the HTML, no client fetch).
// Live inventory stats (median rate, median Restlaufzeit, Kaution spread) refresh with it;
// null stats render the no-number fallbacks.
export const getStaticProps: GetStaticProps<LeasingubernahmeVsAutoAboPageProps> = async () => {
  let stats: InventoryStats | null = null;
  try {
    stats = await getLiveInventoryStats();
  } catch (error) {
    console.error("Leasingübernahme vs. Auto-Abo: live inventory stats failed:", error);
  }
  return { props: { premiumListings: await getPremiumCarouselListings(), stats }, revalidate: 300 };
};
