import type { GetStaticProps } from "next";
import Head from "next/head";
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
  Clock, 
  Zap, 
  Users, 
  BadgeCheck, 
  MapPin, 
  Calendar, 
  DollarSign, 
  FileCheck, 
  Search, 
  ArrowRight, 
  RefreshCw, 
  UserCheck, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Sparkles,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ModernListingCard } from "@/components/buyauto/search/ModernListingCard";
import { searchListings } from "@/services/listingsService";
import type { Listing } from "@/lib/buyauto/types";
import { supabase } from "@/integrations/supabase/client";
import { brandPagesForInventory, type BrandInventoryRow } from "@/lib/buyauto/leasingBrands";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Image from "next/image";
import { useState, useEffect } from "react";
import { BreadcrumbJsonLd } from "@/components/buyauto/Breadcrumbs";
import { CONTENT_LAST_UPDATED, formatSwissDate } from "@/lib/buyauto/contentDates";

// Dynamically import heavy interactive components that are below the fold
const SearchForm = dynamic(() => import("@/components/buyauto/SearchForm"), {
  loading: () => <div className="min-h-[600px] bg-white rounded-2xl border-2 border-neutral-100 animate-pulse" />
});

const PremiumListings = dynamic(() => import("@/components/buyauto/PremiumListings"), {
  loading: () => <div className="min-h-[900px] bg-neutral-50 animate-pulse" />
});

type LeasingUebernahmePageProps = {
  takeoverListings: Listing[];
  takeoverTotal: number;
  // Brand landing pages that currently have live takeover inventory. Only these are
  // linked from the brand section — empty brand pages are noindex and must stay unlinked.
  availableBrands: { slug: string; name: string }[];
};

// Single source for the visible «Aktualisiert am» badge and the Article dateModified.
const LAST_UPDATED_ISO = CONTENT_LAST_UPDATED["/leasinguebernahme"];

export default function LeasingUebernahmePage({ takeoverListings, takeoverTotal, availableBrands }: LeasingUebernahmePageProps) {
  const [showStickyCTA, setShowStickyCTA] = useState(false);
  const hasTakeoverListings = Array.isArray(takeoverListings) && takeoverListings.length > 0;

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
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <Head>
        <title>Leasingübernahme: Ablauf, Voraussetzungen & Kosten – Ratgeber | BuyAuto</title>
        <meta
          name="description"
          content="Leasingübernahme in der Schweiz Schritt für Schritt: Ablauf, Voraussetzungen, Kosten und Tipps, um einen laufenden Leasingvertrag ohne hohe Anzahlung zu übernehmen – der Ratgeber von BuyAuto."
        />
        <link rel="canonical" href="https://www.buyauto.ch/leasinguebernahme" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: "Leasingübernahme & Leasing Transfer in der Schweiz",
              author: { "@type": "Person", name: "Vincent Hänggi" },
              publisher: {
                "@type": "Organization",
                name: "BuyAuto",
                logo: { "@type": "ImageObject", url: "https://www.buyauto.ch/share-logo.jpg" },
              },
              dateModified: LAST_UPDATED_ISO,
              mainEntityOfPage: "https://www.buyauto.ch/leasinguebernahme",
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
                  name: "Gibt es einen Unterschied zwischen Leasingübernahme und Leasing Transfer?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Nein. Beide Begriffe beschreiben denselben Vorgang der Vertragsübertragung. „Leasingübernahme“ ist der gängige Verbraucherbegriff, während „Leasing Transfer“ der formale Begriff ist, der oft von Banken und Leasinggesellschaften verwendet wird.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Wie lange dauert der Prozess?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Meist 2–5 Werktage, abhängig von der Bonitätsprüfung und der Bearbeitungszeit der Leasingbank.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Wer übernimmt die Gebühren?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Das wird frei vereinbart. Oft übernimmt der Abgeber die Transferkosten, um den Transfer attraktiver zu machen.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Kann ich ein Leasingauto verkaufen?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Nein. Du bist nicht Eigentümer. Aber du kannst den Vertrag übertragen – genau darum geht es beim Leasing Transfer bzw. der Leasingübernahme.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Was passiert mit der Anzahlung?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Sie bleibt im Vertrag und kommt dem Übernehmer zugute. Die Anzahlung wird nicht ausbezahlt oder zurückerstattet.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Kann eine Leasingübernahme abgelehnt werden?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Ja – meistens wegen fehlender Bonität oder offener Zahlungen. Die Leasingbank hat immer das letzte Wort bei der Genehmigung.",
                  },
                },
              ],
            }),
          }}
        />
        {hasTakeoverListings && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "ItemList",
                name: "Aktuelle Leasingübernahme-Angebote in der Schweiz",
                numberOfItems: takeoverListings.length,
                itemListElement: takeoverListings.map((l, index) => {
                  const price = typeof l.pricePerMonthCHF === "number" && l.pricePerMonthCHF > 0 ? l.pricePerMonthCHF : null;
                  return {
                    "@type": "ListItem",
                    position: index + 1,
                    item: {
                      "@type": "Car",
                      name: `${l.brand} ${l.model} ${l.year}`,
                      brand: { "@type": "Brand", name: l.brand },
                      model: l.model,
                      vehicleModelDate: l.year,
                      ...(l.mileageKm
                        ? { mileageFromOdometer: { "@type": "QuantitativeValue", value: l.mileageKm, unitCode: "KMT" } }
                        : {}),
                      ...(l.fuel ? { fuelType: l.fuel } : {}),
                      ...(l.gearbox ? { vehicleTransmission: l.gearbox } : {}),
                      ...(price
                        ? {
                            offers: {
                              "@type": "Offer",
                              // No top-level price: this is a recurring monthly lease rate, not
                              // a one-time sale price. Express it only via priceSpecification.
                              availability: "https://schema.org/InStock",
                              itemCondition: "https://schema.org/UsedCondition",
                              priceSpecification: {
                                "@type": "UnitPriceSpecification",
                                price,
                                priceCurrency: "CHF",
                                unitText: "MONTH",
                              },
                            },
                          }
                        : {}),
                    },
                  };
                }),
              }),
            }}
          />
        )}

        {/* Open Graph */}
        <meta property="og:title" content="Leasingübernahme: Ablauf, Voraussetzungen & Kosten – Ratgeber" />
        <meta property="og:description" content="Leasingübernahme in der Schweiz Schritt für Schritt: Ablauf, Voraussetzungen, Kosten und Tipps, um einen laufenden Leasingvertrag ohne hohe Anzahlung zu übernehmen." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://www.buyauto.ch/leasinguebernahme" />
      </Head>

      {/* Schema-only: hero layout has no room for a visible crumb bar. */}
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Leasingübernahme", href: "/leasinguebernahme" },
        ]}
      />

      <main className={`bg-white min-h-screen ${showStickyCTA ? "pb-24 md:pb-0" : ""}`}>
        
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
                  <p className="text-white font-bold text-lg">Bereit für deine Leasingübernahme?</p>
                  <p className="text-white/80 text-sm">Schnell, legal & kostengünstig</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <Button
                    asChild
                    size="lg"
                    className="flex-1 md:flex-none bg-white hover:bg-white/90 text-primary font-black shadow-xl whitespace-normal h-auto px-4 sm:px-8 py-6 rounded-xl"
                  >
                    <Link href="/suche?dealType=lease_takeover">
                      Jetzt Angebote durchsuchen
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
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=2400&q=80"
              alt="Leasingübernahme & Leasing Transfer Schweiz"
              fill
              className="object-cover"
              priority
              fetchPriority="high"
              quality={75}
              sizes="100vw"
            />
            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/80 via-neutral-900/70 to-neutral-900/90" />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-neutral-900/30" />
          </div>

          {/* Decorative mesh gradients */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/20 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3" />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 w-full px-4 py-20">
            <div className="max-w-6xl mx-auto text-center">
              <div className="max-w-3xl mx-auto">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-white px-5 py-2 rounded-full text-sm font-semibold mb-6 backdrop-blur-sm border border-primary/20">
                  <Sparkles className="w-4 h-4" />
                  Kompletter Leitfaden · Aktualisiert am {formatSwissDate(LAST_UPDATED_ISO)}
                </div>
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] mb-6">
                  Leasingübernahme & Leasing Transfer in der Schweiz
                </h1>
                <p className="text-xl md:text-2xl text-white font-semibold mb-4">
                  Der komplette Leitfaden zur Vertragsübertragung
                </p>
                <p className="text-lg text-neutral-200 leading-relaxed mb-8">
                  Bei einer Leasingübernahme übernimmst du einen laufenden Leasingvertrag samt Monatsrate und
                  Restlaufzeit von der bisherigen Leasingnehmerin oder dem bisherigen Leasingnehmer. Die
                  Leasinggesellschaft prüft deine Bonität und stimmt der Übernahme zu – eine hohe Anzahlung wie
                  beim Neuleasing entfällt. Einmalig fallen je nach Leasinggeber rund 200–650 CHF für Transfer
                  und Umschreibung an.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    asChild
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30 transition-all duration-300 whitespace-normal h-auto px-6 sm:px-8 py-7 text-base sm:text-lg font-bold rounded-2xl"
                  >
                    <Link href="/suche?dealType=lease_takeover">
                      Jetzt Leasingübernahme starten
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-2 border-white text-white hover:bg-white hover:text-neutral-900 transition-all duration-300 px-8 py-7 text-lg font-bold rounded-2xl bg-transparent backdrop-blur-sm"
                  >
                    <Link href="/inserat-erstellen">
                      Leasingvertrag übertragen
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* QUICK ANSWER BOX */}
        <section className="py-20 px-4 bg-neutral-50">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-4">
                <Info className="w-4 h-4" />
                Kurz erklärt
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-neutral-900 tracking-tight mb-4">
                Was ist eine Leasingübernahme?
              </h2>
            </div>
            
            <div className="bg-white border-2 border-primary/20 p-8 md:p-12 rounded-3xl shadow-lg">
              <p className="text-lg text-neutral-700 leading-relaxed mb-6">
                Eine <strong>Leasingübernahme</strong> bedeutet, dass eine Person oder Firma einen bestehenden Leasingvertrag vollständig übernimmt – inklusive monatlicher Raten, Kilometerlimit, Restlaufzeit und Pflichten.
              </p>
              <p className="text-lg text-neutral-700 leading-relaxed mb-8">
                Der ursprüngliche Leasingnehmer wird aus dem Vertrag entlassen und der neue Vertragspartner tritt ein.
              </p>
              
              <div className="bg-primary/5 border-l-4 border-primary p-6 rounded-r-2xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                  <p className="text-primary font-semibold text-lg">
                    <strong>Leasing Transfer</strong> und <strong>Leasingübernahme</strong> bedeuten das Gleiche – beide Begriffe beschreiben die Übertragung eines bestehenden Vertrags.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* LIVE TAKEOVER LISTINGS (SSR — crawlable on the head-term page) */}
        {hasTakeoverListings && (
          <section id="angebote" className="py-20 px-4 bg-white scroll-mt-20">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-4">
                  <Zap className="w-4 h-4" />
                  Live auf BuyAuto
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-neutral-900 tracking-tight mb-4">
                  Aktuelle Leasingübernahme-Angebote
                </h2>
                <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
                  {takeoverTotal}{" "}
                  {takeoverTotal === 1 ? "laufender Leasingvertrag wartet" : "laufende Leasingverträge warten"} auf eine
                  Übernahme – ohne hohe Anzahlung, mit kurzer Restlaufzeit.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {takeoverListings.map((listing) => (
                  <ModernListingCard key={listing.id} listing={listing} />
                ))}
              </div>

              <div className="mt-10 text-center">
                <Button
                  asChild
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30 whitespace-normal h-auto px-6 sm:px-8 py-7 text-base sm:text-lg font-bold rounded-2xl"
                >
                  <Link href="/suche?dealType=lease_takeover">
                    Alle Leasingübernahmen ansehen
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              </div>

              {/* Brand drill-downs — only brands with live inventory (empty brand
                  pages are noindex and must not receive internal links). */}
              {availableBrands.length > 0 && (
                <div className="mt-12 border-t border-neutral-200 pt-8">
                  <h3 className="text-xl font-bold text-neutral-900 mb-4 text-center">
                    Leasingübernahme nach Marke
                  </h3>
                  <div className="flex flex-wrap justify-center gap-3">
                    {availableBrands.map((b) => (
                      <Link
                        key={b.slug}
                        href={`/leasinguebernahme/${b.slug}`}
                        className="inline-flex items-center gap-1.5 bg-neutral-50 border-2 border-neutral-200 hover:border-primary hover:text-primary transition-colors rounded-full px-5 py-2.5 text-sm font-semibold text-neutral-700"
                      >
                        Leasingübernahme {b.name}
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* TOC SECTION */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <h3 className="font-bold text-neutral-900 mb-8 text-2xl text-center">Inhaltsverzeichnis</h3>
            <div className="bg-neutral-50 p-8 rounded-3xl border-2 border-neutral-200 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: "angebote", label: "Aktuelle Angebote" },
                  { id: "definition", label: "Was ist eine Leasingübernahme?" },
                  { id: "transfer", label: "Leasing Transfer (Synonym)" },
                  { id: "search", label: "Angebote entdecken" },
                  { id: "ablauf", label: "Ablauf der Vertragsübertragung" },
                  { id: "voraussetzungen", label: "Voraussetzungen" },
                  { id: "kosten", label: "Kosten im Überblick" },
                  { id: "vorteile", label: "Vorteile für beide Seiten" },
                  { id: "rechtliches", label: "Rechtliche Hinweise" },
                  { id: "faq", label: "Häufige Fragen" },
                ].map((item, i) => (
                  <button 
                    key={i}
                    onClick={() => scrollToSection(item.id)}
                    className="flex items-center gap-3 text-neutral-600 hover:text-primary transition-colors text-left group p-4 rounded-2xl hover:bg-white"
                  >
                    <ChevronRight className="w-5 h-5 text-primary/60 group-hover:text-primary transition-colors" />
                    <span className="font-semibold">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* DEFINITION SECTION */}
        <section id="definition" className="py-20 px-4 bg-neutral-50 scroll-mt-20">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-4">
                <FileCheck className="w-4 h-4" />
                Definition
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-neutral-900 tracking-tight mb-4">
                Was bedeutet eine Leasingübernahme?
              </h2>
            </div>

            <Card className="border-2 border-primary/20 mb-12 rounded-3xl shadow-lg">
              <CardContent className="p-8 md:p-12">
                <p className="text-lg text-neutral-700 leading-relaxed mb-6">
                  Bei einer <strong>Leasingübernahme</strong> (auch <strong>Leasing Transfer</strong> genannt) wird ein laufender Leasingvertrag vollständig auf eine neue Person übertragen. Diese übernimmt:
                </p>
                <ul className="space-y-4">
                  {[
                    "Die monatlichen Leasingraten",
                    "Das vereinbarte Kilometerlimit",
                    "Die Restlaufzeit des Vertrags",
                    "Alle Rechte und Pflichten aus dem Vertrag"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-neutral-700">
                      <div className="bg-primary/10 p-1 rounded-full mt-0.5">
                        <Check className="w-5 h-5 text-primary shrink-0" />
                      </div>
                      <span className="font-medium text-lg">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <h3 className="text-3xl font-black text-neutral-900 mb-8 text-center">
              Typische Gründe für eine Leasingübernahme:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: DollarSign, text: "Vorzeitige Vertragsauflösung ohne hohe Kosten" },
                { icon: RefreshCw, text: "Geänderte Lebenssituation (Umzug, neuer Job)" },
                { icon: TrendingDown, text: "Finanzielle Entlastung" },
                { icon: Users, text: "Wechsel zu einem anderen Fahrzeug" },
                { icon: Calendar, text: "Kürzere Restlaufzeit statt langem Neuvertrag" },
                { icon: Zap, text: "Attraktive Leasingbedingungen ohne hohe Einstiegskosten" }
              ].map((item, i) => {
                const IconComponent = item.icon;
                return (
                  <div key={i} className="bg-white border-2 border-neutral-200 p-6 rounded-3xl hover:border-primary transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
                    <div className="bg-primary/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <IconComponent className="w-7 h-7 text-primary" />
                    </div>
                    <span className="text-neutral-700 font-semibold">{item.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* LEASING TRANSFER DEFINITION */}
        <section id="transfer" className="py-20 px-4 bg-white scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-4">
                <RefreshCw className="w-4 h-4" />
                Synonym erklärt
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-neutral-900 tracking-tight mb-4">
                Leasing Transfer (Synonym von Leasingübernahme)
              </h2>
            </div>
            
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary rounded-3xl p-8 md:p-12 shadow-lg">
              <div className="text-center mb-8">
                <p className="text-3xl font-black text-primary mb-2">Leasing Transfer und Leasingübernahme bedeuten das Gleiche.</p>
              </div>
              
              <div className="space-y-6 max-w-2xl mx-auto mb-8">
                <div className="flex items-start gap-4 p-6 bg-white rounded-2xl border-2 border-primary/20">
                  <CheckCircle className="w-7 h-7 text-green-600 shrink-0 mt-1" />
                  <div>
                    <p className="font-black text-neutral-900 mb-2 text-lg">„Leasingübernahme"</p>
                    <p className="text-neutral-600">ist der übliche Verbrauchsbegriff in der Schweiz.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-6 bg-white rounded-2xl border-2 border-primary/20">
                  <CheckCircle className="w-7 h-7 text-green-600 shrink-0 mt-1" />
                  <div>
                    <p className="font-black text-neutral-900 mb-2 text-lg">„Leasing Transfer"</p>
                    <p className="text-neutral-600">ist der formale/englische Begriff und wird oft von Banken, Garagen und Plattformen verwendet.</p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white border-2 border-primary rounded-2xl mb-8">
                <p className="text-xl text-neutral-900 font-bold text-center">
                  Beide Begriffe beschreiben: <span className="text-primary">Die Übertragung eines bestehenden Leasingvertrags auf eine neue Person.</span>
                </p>
              </div>

              <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <Info className="w-7 h-7 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-blue-900 font-black mb-2 text-lg">Warum zwei Begriffe?</p>
                    <p className="text-blue-800 leading-relaxed">
                      Der Begriff „Transfer" stammt aus dem Finanzwesen und wird besonders im professionellen Kontext (Banken, Leasinggesellschaften) verwendet. 
                      „Übernahme" ist hingegen das deutsche Wort, das Verbraucher intuitiv verstehen. 
                      In der Praxis werden beide Begriffe synonym verwendet – der Prozess, die Voraussetzungen und die Kosten sind identisch.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SEARCH SECTION */}
        <section id="search" className="py-20 px-4 bg-neutral-50 scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl shadow-2xl border-2 border-primary/20 p-6 md:p-10">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-4">
                  <Search className="w-4 h-4" />
                  Jetzt starten
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-neutral-900 mb-4 tracking-tight">
                  Angebote Entdecken
                </h2>
                <p className="text-neutral-600 text-lg">
                  Finde jetzt verfügbare Leasingübernahmen oder erstelle dein eigenes Inserat.
                </p>
              </div>
              <SearchForm />
            </div>
          </div>
        </section>

        {/* PROCESS TIMELINE */}
        <section id="ablauf" className="py-20 px-4 bg-white scroll-mt-20">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-4">
                <ChevronRight className="w-4 h-4" />
                Schritt für Schritt
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-neutral-900 tracking-tight mb-4">
                Ablauf: So funktioniert die Leasingübernahme
              </h2>
              <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
                Schritt für Schritt zur erfolgreichen Vertragsübertragung
              </p>
            </div>

            <div className="space-y-8">
              {[
                {
                  step: 1,
                  title: "Vertragsprüfung",
                  desc: "Vor der Übertragung sollten folgende Punkte geprüft werden:",
                  items: [
                    "Laufzeit & Restmonate",
                    "Monatliche Rate",
                    "Anzahlung / Vorauszahlung",
                    "Kilometerlimit",
                    "Mehrkilometerkosten",
                    "Servicepakete",
                    "Versicherungsauflagen"
                  ],
                  icon: FileCheck
                },
                {
                  step: 2,
                  title: "Übernehmer finden",
                  desc: "Inserat erstellen oder Interessenten kontaktieren. Gute Fotos und transparente Informationen beschleunigen die Übernahme.",
                  items: [],
                  icon: Search
                },
                {
                  step: 3,
                  title: "Bonitätsprüfung durch die Leasingbank",
                  desc: "Der neue Vertragspartner muss kreditwürdig sein.",
                  items: [
                    "Einkommen & Budget",
                    "ZEK-Einträge",
                    "Finanzielle Stabilität"
                  ],
                  icon: ShieldCheck
                },
                {
                  step: 4,
                  title: "Bankgenehmigung & Vertragsübertragung",
                  desc: "Die Leasingbank erstellt neue Unterlagen. Der Vertrag bleibt identisch – lediglich der Name ändert sich.",
                  items: [],
                  icon: BadgeCheck
                },
                {
                  step: 5,
                  title: "Fahrzeug- & Dokumentenübergabe",
                  desc: "Empfohlen:",
                  items: [
                    "Übergabeprotokoll erstellen",
                    "Kilometerstand notieren",
                    "Schäden dokumentieren",
                    "Servicehefte bereitstellen"
                  ],
                  icon: Check
                }
              ].map((item) => {
                const IconComponent = item.icon;
                return (
                  <div key={item.step} className="relative">
                    <div className="flex items-start gap-6 md:gap-8">
                      <div className="flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-gradient-to-br from-primary to-primary/80 text-white flex flex-col items-center justify-center font-black text-2xl shadow-xl ring-4 ring-primary/20">
                        {item.step}
                      </div>
                      
                      <div className="flex-1 bg-neutral-50 border-2 border-neutral-200 rounded-3xl p-8 hover:border-primary/30 transition-all duration-300 hover:shadow-lg group">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-primary/20 transition-colors">
                            <IconComponent className="w-6 h-6 text-primary" />
                          </div>
                          <h3 className="text-2xl font-black text-neutral-900">{item.title}</h3>
                        </div>
                        <p className="text-neutral-700 mb-4 text-lg">{item.desc}</p>
                        
                        {item.items.length > 0 && (
                          <ul className="space-y-2">
                            {item.items.map((listItem, i) => (
                              <li key={i} className="flex items-start gap-2 text-neutral-600">
                                <span className="text-primary mt-1 font-bold">•</span>
                                <span>{listItem}</span>
                              </li>
                            ))}
                          </ul>
                        )}
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

        {/* PREREQUISITES CHECKLIST */}
        <section id="voraussetzungen" className="py-20 px-4 bg-neutral-50 scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-4">
                <BadgeCheck className="w-4 h-4" />
                Checkliste
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-neutral-900 tracking-tight mb-4">
                Voraussetzungen für eine Leasingübernahme
              </h2>
            </div>
            
            <div className="bg-white border-2 border-primary/20 rounded-3xl p-8 md:p-12 shadow-lg">
              <div className="space-y-4">
                {[
                  { text: "Zustimmung der Leasingbank", icon: ShieldCheck },
                  { text: "Positive Bonität des Übernehmers", icon: CheckCircle },
                  { text: "Keine offenen Rechnungen des Abgebers", icon: DollarSign },
                  { text: "Fahrzeug in ordentlichem Zustand", icon: Check },
                  { text: "Vertrag erlaubt die Übertragung", icon: FileText },
                  { text: "Beide Parteien unterzeichnen die Übertragung", icon: Users }
                ].map((item, i) => {
                  const IconComponent = item.icon;
                  return (
                    <div key={i} className="flex items-start gap-4 p-6 bg-neutral-50 rounded-2xl border-2 border-neutral-200 hover:border-primary/30 transition-colors">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full border-2 border-primary flex items-center justify-center bg-primary/10">
                          <Check className="w-5 h-5 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1 flex items-center gap-3">
                        <IconComponent className="w-6 h-6 text-primary" />
                        <p className="text-neutral-900 font-bold text-lg">{item.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* COSTS TABLE */}
        <section id="kosten" className="py-20 px-4 bg-white scroll-mt-20">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-4">
                <DollarSign className="w-4 h-4" />
                Transparenz
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-neutral-900 tracking-tight mb-4">
                Kosten der Leasingübernahme
              </h2>
              <p className="text-lg text-neutral-600">
                Dies ist ein zentraler Punkt für alle, die eine Vertragsübertragung planen:
              </p>
            </div>
            
            <div className="overflow-x-auto rounded-3xl border-2 border-primary/20 shadow-2xl">
              <table className="w-full bg-white text-left">
                <thead className="bg-gradient-to-r from-primary to-primary/90 text-white">
                  <tr>
                    <th className="p-6 font-black text-lg">Kostenart</th>
                    <th className="p-6 font-black text-lg">Typische Kosten</th>
                    <th className="p-6 font-black text-lg">Wird bezahlt von</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  <tr className="hover:bg-primary/5 transition-colors">
                    <td className="p-6 font-semibold text-neutral-900">Übernahme-/Transfergebühr</td>
                    <td className="p-6 text-neutral-700 font-bold">100–400 CHF</td>
                    <td className="p-6 text-neutral-700">Abgeber oder Übernehmer</td>
                  </tr>
                  <tr className="hover:bg-primary/5 transition-colors">
                    <td className="p-6 font-semibold text-neutral-900">Händler-/Wechselgebühr</td>
                    <td className="p-6 text-neutral-700 font-bold">100–250 CHF</td>
                    <td className="p-6 text-neutral-700">Optional</td>
                  </tr>
                  <tr className="hover:bg-primary/5 transition-colors">
                    <td className="p-6 font-semibold text-neutral-900">Ummeldung / Fahrzeugausweis</td>
                    <td className="p-6 text-neutral-700 font-bold">50–150 CHF</td>
                    <td className="p-6 text-neutral-700">Übernehmer</td>
                  </tr>
                  <tr className="hover:bg-primary/5 transition-colors">
                    <td className="p-6 font-semibold text-neutral-900">Versicherungskosten</td>
                    <td className="p-6 text-neutral-700 font-bold">variabel</td>
                    <td className="p-6 text-neutral-700">Übernehmer</td>
                  </tr>
                  <tr className="hover:bg-primary/5 transition-colors">
                    <td className="p-6 font-semibold text-neutral-900">Administrationskosten</td>
                    <td className="p-6 text-neutral-700 font-bold">je nach Bank</td>
                    <td className="p-6 text-neutral-700">Abgeber oder Übernehmer</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-8 bg-green-50 border-2 border-green-200 rounded-3xl p-8">
              <div className="flex items-start gap-4">
                <Info className="w-7 h-7 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-green-900 font-black mb-2 text-lg">Hinweis</p>
                  <p className="text-green-800 text-lg">
                    Viele Abgeber übernehmen die Gebühren, um den Transfer attraktiver zu machen. Eine
                    detaillierte Aufschlüsselung aller Gebühren und Spartipps findest du im{" "}
                    <Link href="/leasinguebernahme-kosten" className="font-bold underline hover:text-green-700">
                      kompletten Kosten-Überblick zur Leasingübernahme
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ADVANTAGES SECTION */}
        <section id="vorteile" className="py-20 px-4 bg-gradient-to-b from-neutral-50 to-white scroll-mt-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-4">
                <CheckCircle className="w-4 h-4" />
                Win-Win
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-neutral-900 tracking-tight mb-4">
                Vorteile der Leasingübernahme
              </h2>
              <p className="text-lg text-neutral-600">
                Warum sich die Vertragsübertragung für beide Seiten lohnt
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Advantages for Buyers */}
              <div className="bg-white p-10 rounded-3xl shadow-xl border-2 border-neutral-200 hover:border-primary/30 transition-all duration-300 hover:shadow-2xl">
                <div className="flex items-center gap-3 mb-8">
                  <div className="bg-gradient-to-br from-primary to-primary/80 p-4 rounded-2xl shadow-lg">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-neutral-900">
                    Vorteile für Übernehmer
                  </h3>
                </div>
                <ul className="space-y-5">
                  {[
                    "Oft tiefere Monatsraten dank hoher Anzahlung des Vorbesitzers",
                    "Keine oder geringe Einstiegskosten",
                    "Sofort verfügbare Fahrzeuge",
                    "Kürzere Restlaufzeit → geringeres Risiko",
                    "Leasingbedingungen bleiben bestehen"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-neutral-700">
                      <div className="bg-green-100 p-1 rounded-full mt-0.5">
                        <Check className="w-5 h-5 text-green-600 shrink-0" />
                      </div>
                      <span className="font-medium text-lg">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Advantages for Sellers */}
              <div className="bg-white p-10 rounded-3xl shadow-xl border-2 border-neutral-200 hover:border-primary/30 transition-all duration-300 hover:shadow-2xl">
                <div className="flex items-center gap-3 mb-8">
                  <div className="bg-gradient-to-br from-primary to-primary/80 p-4 rounded-2xl shadow-lg">
                    <RefreshCw className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-neutral-900">
                    Vorteile für Abgeber
                  </h3>
                </div>
                <ul className="space-y-5">
                  {[
                    "Vertrag schnell und günstig loswerden",
                    "Keine hohen Ausstiegskosten",
                    "Entlastung bei geänderter Lebenssituation",
                    "Vertragsübertragung meist in wenigen Tagen möglich"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-neutral-700">
                      <div className="bg-green-100 p-1 rounded-full mt-0.5">
                        <Check className="w-5 h-5 text-green-600 shrink-0" />
                      </div>
                      <span className="font-medium text-lg">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* LEGAL NOTES */}
        <section id="rechtliches" className="py-20 px-4 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-white scroll-mt-20 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-primary rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary rounded-full blur-3xl" />
          </div>

          <div className="max-w-4xl mx-auto relative z-10">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4 backdrop-blur-sm">
                <ShieldCheck className="w-4 h-4" />
                Wichtig zu wissen
              </div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                Rechtliche Hinweise
              </h2>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm border-2 border-white/10 rounded-3xl p-8 md:p-12">
              <div className="space-y-8">
                {[
                  {
                    title: "Eigentumsverhältnisse",
                    text: "Eigentümer bleibt immer die Leasingbank.",
                    icon: ShieldCheck
                  },
                  {
                    title: "Anzahlung",
                    text: "Die Anzahlung wird nicht rückerstattet.",
                    icon: DollarSign
                  },
                  {
                    title: "Vertragskonditionen",
                    text: "Der Vertrag bleibt unverändert.",
                    icon: FileText
                  },
                  {
                    title: "Bankentscheidung",
                    text: "Die Bank kann Transfers ablehnen.",
                    icon: XCircle
                  },
                  {
                    title: "Übergabeprotokoll",
                    text: "Ein Übergabeprotokoll wird dringend empfohlen.",
                    icon: FileCheck
                  }
                ].map((item, i) => {
                  const IconComponent = item.icon;
                  return (
                    <div key={i} className="flex items-start gap-4 pb-8 border-b border-white/10 last:border-0 last:pb-0">
                      <div className="bg-primary/20 p-3 rounded-xl">
                        <IconComponent className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-black text-white text-xl mb-2">{item.title}</h3>
                        <p className="text-neutral-300 text-lg">{item.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section id="faq" className="py-20 px-4 bg-white scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-4">
                <AlertCircle className="w-4 h-4" />
                FAQ
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-neutral-900 tracking-tight mb-4">
                Häufige Fragen zur Leasingübernahme
              </h2>
              <p className="text-neutral-600 text-lg">
                Die wichtigsten Antworten auf einen Blick
              </p>
            </div>
            
            <Accordion type="single" collapsible className="w-full space-y-4">
              <AccordionItem 
                value="item-1" 
                className="bg-neutral-50 rounded-3xl border-2 border-neutral-200 px-8 hover:border-primary/50 transition-all duration-300 data-[state=open]:bg-white data-[state=open]:shadow-lg"
              >
                <AccordionTrigger className="text-left font-black text-neutral-900 hover:no-underline py-6 text-lg">
                  Gibt es einen Unterschied zwischen Leasingübernahme und Leasing Transfer?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6 text-base">
                  Nein. Beide Begriffe beschreiben denselben Vorgang der Vertragsübertragung. „Leasingübernahme" ist der gängige Verbraucherbegriff, während „Leasing Transfer" der formale Begriff ist, der oft von Banken und Leasinggesellschaften verwendet wird.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem 
                value="item-2" 
                className="bg-neutral-50 rounded-3xl border-2 border-neutral-200 px-8 hover:border-primary/50 transition-all duration-300 data-[state=open]:bg-white data-[state=open]:shadow-lg"
              >
                <AccordionTrigger className="text-left font-black text-neutral-900 hover:no-underline py-6 text-lg">
                  Wie lange dauert der Prozess?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6 text-base">
                  Meist 2–5 Werktage, abhängig von der Bonitätsprüfung und der Bearbeitungszeit der Leasingbank.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem 
                value="item-3" 
                className="bg-neutral-50 rounded-3xl border-2 border-neutral-200 px-8 hover:border-primary/50 transition-all duration-300 data-[state=open]:bg-white data-[state=open]:shadow-lg"
              >
                <AccordionTrigger className="text-left font-black text-neutral-900 hover:no-underline py-6 text-lg">
                  Wer übernimmt die Gebühren?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6 text-base">
                  Das wird frei vereinbart. Oft übernimmt der Abgeber die Transferkosten, um den Transfer attraktiver zu machen.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem 
                value="item-4" 
                className="bg-neutral-50 rounded-3xl border-2 border-neutral-200 px-8 hover:border-primary/50 transition-all duration-300 data-[state=open]:bg-white data-[state=open]:shadow-lg"
              >
                <AccordionTrigger className="text-left font-black text-neutral-900 hover:no-underline py-6 text-lg">
                  Kann ich ein Leasingauto verkaufen?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6 text-base">
                  Nein. Du bist nicht Eigentümer. Aber du kannst den Vertrag übertragen – genau darum geht es beim Leasing Transfer bzw. der Leasingübernahme.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="item-5" 
                className="bg-neutral-50 rounded-3xl border-2 border-neutral-200 px-8 hover:border-primary/50 transition-all duration-300 data-[state=open]:bg-white data-[state=open]:shadow-lg"
              >
                <AccordionTrigger className="text-left font-black text-neutral-900 hover:no-underline py-6 text-lg">
                  Was passiert mit der Anzahlung?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6 text-base">
                  Sie bleibt im Vertrag und kommt dem Übernehmer zugute. Die Anzahlung wird nicht ausbezahlt oder zurückerstattet.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="item-6" 
                className="bg-neutral-50 rounded-3xl border-2 border-neutral-200 px-8 hover:border-primary/50 transition-all duration-300 data-[state=open]:bg-white data-[state=open]:shadow-lg"
              >
                <AccordionTrigger className="text-left font-black text-neutral-900 hover:no-underline py-6 text-lg">
                  Kann eine Leasingübernahme abgelehnt werden?
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-6 text-base">
                  Ja – meistens wegen fehlender Bonität oder offener Zahlungen. Die Leasingbank hat immer das letzte Wort bei der Genehmigung.
                </AccordionContent>
              </AccordionItem>
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
            <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4 backdrop-blur-sm">
              <Sparkles className="w-4 h-4" />
              Bereit für den nächsten Schritt?
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
              Starte jetzt deine Leasingübernahme
            </h2>
            <p className="text-neutral-300 max-w-2xl mx-auto text-xl leading-relaxed">
              Kostenloses Inserat erstellen, Übernehmer finden oder Angebote entdecken – schnell, transparent und unkompliziert.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <Button asChild size="lg" className="w-full sm:w-auto h-16 px-6 sm:px-10 text-lg sm:text-xl font-black bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-2xl shadow-primary/40 transition-all group">
                <Link href="/suche">
                  <Search className="w-6 h-6 mr-2" />
                  Angebote durchsuchen
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto h-16 px-6 sm:px-10 text-lg sm:text-xl font-black border-2 border-white text-white hover:bg-white hover:text-neutral-900 rounded-2xl transition-all">
                <Link href="/inserat-erstellen">
                  Jetzt starten
                  <ArrowRight className="w-6 h-6 ml-2" />
                </Link>
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="pt-8 flex flex-wrap items-center justify-center gap-8 text-neutral-400 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>100% legal</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-green-400" />
                <span>Sicher & geprüft</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-green-400" />
                <span>In wenigen Tagen</span>
              </div>
            </div>
          </div>
        </section>

        {/* RELATED ARTICLES SECTION */}
        <section className="py-20 px-4 bg-neutral-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-4">
                <FileText className="w-4 h-4" />
                Weiterführende Artikel
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-neutral-900 tracking-tight mb-4">
                Mehr zum Thema Leasing & Auto-Abo
              </h2>
              <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
                Hier findest du alle wichtigen Themen rund um Leasingübernahme, Kosten, Alternativen und Vergleiche – kompakt erklärt.
              </p>
            </div>

            {/* Leasingübernahme Guides */}
            <div className="mb-14">
              <h3 className="text-xl font-black text-neutral-900 mb-6 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-primary" />
                Leasingübernahme Ratgeber
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <article className="bg-white border-2 border-neutral-200 rounded-2xl p-6 hover:border-primary hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-xl shrink-0">
                      <DollarSign className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-neutral-900 mb-2 text-lg">Kosten einer Leasingübernahme in der Schweiz</h4>
                      <p className="text-neutral-600 text-sm mb-3 leading-relaxed">
                        Erfahre, welche Gebühren bei einer Leasingübernahme anfallen – von der Transfergebühr bis zur Ummeldung. So planst du dein Budget richtig.
                      </p>
                      <Link href="/leasinguebernahme-kosten" className="inline-flex items-center gap-1 text-primary font-semibold hover:underline text-sm">
                        Leasingübernahme Kosten im Detail
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </article>

                <article className="bg-white border-2 border-neutral-200 rounded-2xl p-6 hover:border-primary hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-xl shrink-0">
                      <UserCheck className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-neutral-900 mb-2 text-lg">Leasing abgeben in der Schweiz</h4>
                      <p className="text-neutral-600 text-sm mb-3 leading-relaxed">
                        Du möchtest deinen Leasingvertrag loswerden? Hier erfährst du, wie du dein Leasing legal und ohne hohe Kosten abgeben kannst.
                      </p>
                      <Link href="/leasing-abgeben-schweiz" className="inline-flex items-center gap-1 text-primary font-semibold hover:underline text-sm">
                        Leasing abgeben Schweiz: Ablauf & Tipps
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </article>

                <article className="bg-white border-2 border-neutral-200 rounded-2xl p-6 hover:border-primary hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-xl shrink-0">
                      <FileCheck className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-neutral-900 mb-2 text-lg">Leasingvertrag übertragen – Schritt für Schritt</h4>
                      <p className="text-neutral-600 text-sm mb-3 leading-relaxed">
                        Die komplette Anleitung zur Vertragsübertragung: Welche Dokumente du brauchst, wie die Bank zustimmt und was du beachten musst.
                      </p>
                      <Link href="/leasingvertrag-uebertragen" className="inline-flex items-center gap-1 text-primary font-semibold hover:underline text-sm">
                        Leasingvertrag übertragen: Anleitung
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </article>

                <article className="bg-white border-2 border-neutral-200 rounded-2xl p-6 hover:border-primary hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-xl shrink-0">
                      <BadgeCheck className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-neutral-900 mb-2 text-lg">Leasing abgeben in der Schweiz</h4>
                      <p className="text-neutral-600 text-sm mb-3 leading-relaxed">
                        Du willst raus aus deinem Vertrag? Der Leitfaden zeigt alle legalen Wege aus dem Leasing – und was sie kosten.
                      </p>
                      <Link href="/leasing-abgeben-schweiz" className="inline-flex items-center gap-1 text-primary font-semibold hover:underline text-sm">
                        Leasing abgeben: der Leitfaden
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </article>
              </div>
            </div>

            {/* Vergleiche */}
            <div className="mb-14">
              <h3 className="text-xl font-black text-neutral-900 mb-6 flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-primary" />
                Vergleiche
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <article className="bg-white border-2 border-neutral-200 rounded-2xl p-6 hover:border-primary hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-xl shrink-0">
                      <Zap className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-neutral-900 mb-2 text-lg">Leasingübernahme vs. Auto-Abo</h4>
                      <p className="text-neutral-600 text-sm mb-3 leading-relaxed">
                        Was lohnt sich mehr – ein bestehendes Leasing übernehmen oder ein flexibles Auto-Abo? Wir vergleichen Kosten, Laufzeit und Flexibilität.
                      </p>
                      <Link href="/leasinguebernahme-vs-autoabo" className="inline-flex items-center gap-1 text-primary font-semibold hover:underline text-sm">
                        Auto-Abo vs. Leasingübernahme Vergleich
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </article>

                <article className="bg-white border-2 border-neutral-200 rounded-2xl p-6 hover:border-primary hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-xl shrink-0">
                      <RefreshCw className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-neutral-900 mb-2 text-lg">Leasingübernahme vs. Neues Leasing</h4>
                      <p className="text-neutral-600 text-sm mb-3 leading-relaxed">
                        Lohnt sich ein neuer Leasingvertrag oder ist die Übernahme günstiger? Hier findest du alle Vor- und Nachteile im direkten Vergleich.
                      </p>
                      <Link href="/leasinguebernahme-vs-neues-leasing" className="inline-flex items-center gap-1 text-primary font-semibold hover:underline text-sm">
                        Neues Leasing vs. Übernahme
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </article>

                <article className="bg-white border-2 border-neutral-200 rounded-2xl p-6 hover:border-primary hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-xl shrink-0">
                      <DollarSign className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-neutral-900 mb-2 text-lg">Auto-Abo vs. Leasing Kosten</h4>
                      <p className="text-neutral-600 text-sm mb-3 leading-relaxed">
                        Was kostet mehr – Auto-Abo oder Leasing? Nutze unseren Kostenrechner und finde die günstigste Option für dein Budget.
                      </p>
                      <Link href="/auto-abo-vs-leasing-kosten" className="inline-flex items-center gap-1 text-primary font-semibold hover:underline text-sm">
                        Kostenvergleich Auto-Abo & Leasing
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </article>
              </div>
            </div>

            {/* Auto-Abo Guides */}
            <div>
              <h3 className="text-xl font-black text-neutral-900 mb-6 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Auto-Abo Ratgeber
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <article className="bg-white border-2 border-neutral-200 rounded-2xl p-6 hover:border-primary hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-xl shrink-0">
                      <Search className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-neutral-900 mb-2 text-lg">Auto-Abos im Vergleich Schweiz</h4>
                      <p className="text-neutral-600 text-sm mb-3 leading-relaxed">
                        Welcher Auto-Abo-Anbieter ist der beste? Wir vergleichen Preise, Fahrzeuge und Konditionen der grössten Anbieter in der Schweiz.
                      </p>
                      <Link href="/auto-abos-im-vergleich" className="inline-flex items-center gap-1 text-primary font-semibold hover:underline text-sm">
                        Beste Auto-Abo Anbieter Schweiz
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </article>

                <article className="bg-white border-2 border-neutral-200 rounded-2xl p-6 hover:border-primary hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-xl shrink-0">
                      <XCircle className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-neutral-900 mb-2 text-lg">Auto-Abo kündigen</h4>
                      <p className="text-neutral-600 text-sm mb-3 leading-relaxed">
                        Du willst dein Auto-Abo beenden? Hier erfährst du, wie du richtig kündigst und welche Alternativen es gibt.
                      </p>
                      <Link href="/auto-abo-kuendigen" className="inline-flex items-center gap-1 text-primary font-semibold hover:underline text-sm">
                        Auto-Abo kündigen: Anleitung & Alternativen
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </article>

                <article className="bg-white border-2 border-neutral-200 rounded-2xl p-6 hover:border-primary hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-xl shrink-0">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-neutral-900 mb-2 text-lg">Carify Alternativen</h4>
                      <p className="text-neutral-600 text-sm mb-3 leading-relaxed">
                        Carify ist nicht die einzige Option. Entdecke die besten Alternativen für Auto-Abos und Leasingübernahmen in der Schweiz.
                      </p>
                      <Link href="/carify-alternativen" className="inline-flex items-center gap-1 text-primary font-semibold hover:underline text-sm">
                        Carify Alternativen im Überblick
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </article>
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

export const getStaticProps: GetStaticProps<LeasingUebernahmePageProps> = async () => {
  try {
    const [results, brandRows] = await Promise.all([
      searchListings({ dealType: "lease_takeover", sort: "dateDesc" }),
      // listings_public already filters to published + not expired; we only need the
      // distinct brands that currently have a live takeover listing.
      supabase.from("listings_public").select("brand, model, deal_type").eq("deal_type", "lease_takeover"),
    ]);

    // Curated pages (alias-aware) plus auto-generated pages for uncovered DB brands.
    const availableBrands = brandPagesForInventory(((brandRows.data ?? []) as BrandInventoryRow[])).map((b) => ({
      slug: b.slug,
      name: b.name,
    }));

    // 6 newest takeovers in the hub; strip undefined fields so Next can serialize.
    const takeoverListings = JSON.parse(JSON.stringify(results.items.slice(0, 6))) as Listing[];
    return { props: { takeoverListings, takeoverTotal: results.total, availableBrands }, revalidate: 300 };
  } catch (error) {
    console.error("Leasinguebernahme hub SSR search failed:", error);
    return { props: { takeoverListings: [], takeoverTotal: 0, availableBrands: [] }, revalidate: 300 };
  }
};