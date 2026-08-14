import type { GetStaticProps } from "next";
import Head from "next/head";
import { CONTENT_LAST_UPDATED, formatSwissDate } from "@/lib/buyauto/contentDates";
import { Breadcrumbs } from "@/components/buyauto/Breadcrumbs";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Check,
  AlertTriangle,
  FileText,
  ShieldCheck,
  TrendingDown,
  Clock,
  Users,
  BadgeCheck,
  MapPin,
  DollarSign,
  Search,
  ArrowRight,
  UserCheck,
  AlertCircle,
  CheckCircle,
  XCircle,
  Phone,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ModernListingCard } from "@/components/buyauto/search/ModernListingCard";
import { searchListings } from "@/services/listingsService";
import type { Listing } from "@/lib/buyauto/types";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { trackEvent } from "@/lib/analytics/gtag";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type LeasingAbgebenPageProps = {
  takeoverListings: Listing[];
};

// Typical re-registration/transfer fee charged by Swiss leasing banks — a guide
// value, not a quote; the disclaimer under the calculator says so.
const TRANSFER_FEE_CHF = 350;

// Single source for the visible «Aktualisiert am» badge and the Article dateModified.
const LAST_UPDATED_ISO = CONTENT_LAST_UPDATED["/leasing-abgeben-schweiz"];

const CTA_HREF = "/inserat-erstellen";
const CTA_LABEL = "Gratis Inserat erstellen";

// Single source of truth for the FAQ: feeds BOTH the visible accordion and the
// FAQPage JSON-LD, so the structured data can never drift from the page text.
// `linkText` must appear verbatim in `a` — it is what the answer is split on to
// turn that phrase into an internal link without duplicating the copy.
type Faq = { q: string; a: string; href?: string; linkText?: string };

const FAQS: Faq[] = [
  {
    q: "Kann ich mein Leasing einfach zurückgeben?",
    a: "Nein, ein Leasingvertrag ist bindend. Eine vorzeitige Rückgabe ist meist mit sehr hohen Kosten (Vorfälligkeitsentschädigung) verbunden. Die Leasingübernahme ist oft die einzige kostengünstige Alternative.",
    href: "/leasinguebernahme",
    linkText: "Leasingübernahme",
  },
  {
    q: "Wie schnell kann ich mein Leasing abgeben?",
    a: "Das hängt davon ab, wie schnell du einen Übernehmer findest. Mit einem attraktiven Inserat auf BuyAuto oft in wenigen Wochen. Die bankseitige Abwicklung dauert dann meist nur wenige Tage.",
  },
  {
    q: "Was kostet mich die Leasingübernahme?",
    a: `In der Regel nur die Umschreibegebühr deiner Leasingbank – typischerweise rund CHF ${TRANSFER_FEE_CHF}. Die verbleibenden Raten zahlt ab der Umschreibung dein Nachfolger. Das Inserat auf BuyAuto ist gratis.`,
  },
  {
    q: "Was passiert, wenn ich nicht mehr zahlen kann?",
    a: "Kontaktiere sofort deine Leasingbank. Eine Leasingübernahme kann helfen, aus den Zahlungsverpflichtungen herauszukommen, bevor Schulden entstehen.",
    href: "/leasinguebernahme",
    linkText: "Leasingübernahme",
  },
  {
    q: "Wer trägt die Kosten bei einer Vertragsübernahme?",
    a: "Das ist Verhandlungssache. Oft übernimmt der Abgeber die Umschreibegebühren, um das Angebot für den Übernehmer attraktiver zu machen.",
  },
  {
    q: "Was prüft der Leasinggeber?",
    a: "Vor allem die Bonität des neuen Leasingnehmers. Er muss die Raten genauso sicher zahlen können wie du.",
  },
  {
    q: "Warum ist die Leasingübernahme günstiger als die Kündigung?",
    a: "Bei einer Kündigung musst du die Bank für den Zinsausfall entschädigen. Bei einer Leasingübernahme läuft der Vertrag einfach weiter – die Bank verliert kein Geld, daher fallen kaum Strafgebühren an.",
  },
];

/**
 * Every conversion click on this page goes through here, so GA4/Ads can tell
 * which slot actually produced the listing (hero vs. calculator vs. sticky bar).
 */
function CtaButton({
  location,
  className = "",
  children = CTA_LABEL,
}: {
  location: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <Button asChild size="lg" className={className}>
      <Link
        href={CTA_HREF}
        onClick={() => trackEvent("cta_click", { cta_location: location, page: "leasing-abgeben-schweiz" })}
      >
        {children}
        <ArrowRight className="w-5 h-5 ml-2" />
      </Link>
    </Button>
  );
}

export default function LeasingAbgebenSchweiz({ takeoverListings }: LeasingAbgebenPageProps) {
  const [months, setMonths] = useState(24);
  const [monthlyRate, setMonthlyRate] = useState(450);
  const [showStickyCTA, setShowStickyCTA] = useState(false);
  const [stickyDismissed, setStickyDismissed] = useState(false);

  // The one number the calculator can state honestly: a takeover moves exactly
  // these rates to the successor. Cancellation costs vary by bank and contract,
  // so they are itemised qualitatively instead of invented as a precise figure.
  const remainingObligation = months * monthlyRate;

  // The hero CTA is visible for roughly the first screen; the bar takes over
  // just after it scrolls away rather than waiting a full hero-height.
  useEffect(() => {
    const handleScroll = () => setShowStickyCTA(window.scrollY > 320);

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <Head>
        <title>Leasing abgeben Schweiz 2026: legal & ohne Verlust raus | BuyAuto</title>
        <meta
          name="description"
          content="Leasing abgeben in der Schweiz leicht gemacht: Erfahre, wie du legal aus dem Leasing aussteigst, welche Optionen du hast, welche Kosten entstehen – und warum die Leasingübernahme oft die günstigste Lösung ist."
        />
        <link rel="canonical" href="https://www.buyauto.ch/leasing-abgeben-schweiz" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: "Leasing abgeben ohne teure Kündigung.",
              author: { "@type": "Person", name: "Vincent Hänggi" },
              publisher: {
                "@type": "Organization",
                name: "BuyAuto",
                logo: { "@type": "ImageObject", url: "https://www.buyauto.ch/share-logo.jpg" },
              },
              dateModified: LAST_UPDATED_ISO,
              mainEntityOfPage: "https://www.buyauto.ch/leasing-abgeben-schweiz",
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: FAQS.map((faq) => ({
                "@type": "Question",
                name: faq.q,
                acceptedAnswer: { "@type": "Answer", text: faq.a },
              })),
            }),
          }}
        />

        {/* Open Graph */}
        <meta property="og:title" content="Leasing abgeben Schweiz 2026: legal & ohne Verlust raus" />
        <meta property="og:description" content="Leasing abgeben in der Schweiz leicht gemacht: Erfahre, wie du legal aus dem Leasing aussteigst, welche Optionen du hast, welche Kosten entstehen." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://www.buyauto.ch/leasing-abgeben-schweiz" />
      </Head>

      <div className="bg-white">
        {/* STICKY CTA BAR */}
        <div
          className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ${
            showStickyCTA && !stickyDismissed ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="bg-neutral-900 border-t border-white/10 shadow-2xl">
            <div className="max-w-6xl mx-auto px-4 py-3">
              <div className="flex items-center justify-between gap-4">
                <div className="hidden md:block">
                  <p className="text-white font-bold">Bereit, dein Leasing abzugeben?</p>
                  <p className="text-white/60 text-sm">Gratis inserieren · 60 Tage online</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <CtaButton
                    location="sticky_bar"
                    className="flex-1 md:flex-none bg-primary hover:bg-primary/90 text-white font-bold px-6 py-6 rounded-xl"
                  />
                  <button
                    onClick={() => setStickyDismissed(true)}
                    className="md:hidden p-2 text-white/70 hover:bg-white/10 rounded-lg transition-colors shrink-0"
                    aria-label="Schliessen"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BREADCRUMBS — kept for SEO, but as a thin bar so it costs the hero
            almost no vertical space. */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-3">
          <Breadcrumbs
            items={[
              { name: "Home", href: "/" },
              { name: "Leasingübernahme", href: "/leasinguebernahme" },
              { name: "Leasing abgeben", href: "/leasing-abgeben-schweiz" },
            ]}
          />
        </div>

        {/* HERO — the whole offer (headline, promise, CTA, proof) plus the
            calculator must land in the first screenful. Nothing decorative is
            allowed to push the CTA below the fold. */}
        <section className="relative overflow-hidden">
          {/* Light, cheap background. The previous 2.5 MB handshake PNG was the
              LCP element and sat under a near-opaque white gradient, so it cost
              load time and read as empty space. */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-neutral-50 to-white" />
          <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 lg:pt-8 lg:pb-16">
            <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-12 items-center">
              {/* Left: offer */}
              <div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-neutral-900 tracking-tight leading-[1.05] mb-5">
                  Leasing abgeben –<br />
                  <span className="text-primary">ohne teure Kündigung.</span>
                </h1>

                <p className="text-lg md:text-xl text-neutral-600 leading-relaxed mb-7">
                  Übergib deinen Leasingvertrag an eine Nachfolgerin oder einen Nachfolger: Sie übernehmen die
                  Restraten, du zahlst nur die Umschreibegebühr von typischerweise rund CHF {TRANSFER_FEE_CHF}.
                </p>

                <CtaButton
                  location="hero"
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 px-8 py-7 text-lg font-bold rounded-2xl"
                />
                <p className="mt-3 text-sm text-neutral-500">
                  Gratis · 60 Tage online · Login erst beim Veröffentlichen
                </p>

                <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-neutral-700">
                  {[
                    "Keine Vorfälligkeitsentschädigung",
                    "Bankseitige Abwicklung in wenigen Tagen",
                    "100% legal – der Vertrag läuft weiter",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right: the calculator, promoted out of the middle of the page.
                  It is the one element that makes the offer personal ("these are
                  YOUR CHF 10'800"), so it belongs next to the CTA, not 1000px
                  below it. */}
              <div id="calculator" className="scroll-mt-24">
                <div className="bg-white rounded-3xl border border-neutral-200 shadow-xl shadow-neutral-900/5 p-6 md:p-8">
                  <h2 className="text-xl font-black text-neutral-900 mb-1">Was kostet dich der Ausstieg?</h2>
                  <p className="text-sm text-neutral-500 mb-6">
                    Stell deinen Vertrag ein – transparent, ohne Schönrechnen.
                  </p>

                  <div className="space-y-5 mb-6">
                    <div>
                      <div className="flex items-baseline justify-between mb-2">
                        <label className="text-sm font-semibold text-neutral-700">Restlaufzeit</label>
                        <span className="text-lg font-black text-neutral-900">{months} Monate</span>
                      </div>
                      <Slider
                        value={[months]}
                        onValueChange={(value) => setMonths(value[0])}
                        min={6}
                        max={48}
                        step={6}
                        aria-label="Restlaufzeit in Monaten"
                      />
                    </div>
                    <div>
                      <div className="flex items-baseline justify-between mb-2">
                        <label className="text-sm font-semibold text-neutral-700">Monatsrate</label>
                        <span className="text-lg font-black text-neutral-900">CHF {monthlyRate}</span>
                      </div>
                      <Slider
                        value={[monthlyRate]}
                        onValueChange={(value) => setMonthlyRate(value[0])}
                        min={150}
                        max={1500}
                        step={50}
                        aria-label="Monatsrate in Franken"
                      />
                    </div>
                  </div>

                  {/* The honest anchor both options are measured against */}
                  <div className="rounded-2xl bg-neutral-900 p-5 text-center mb-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-1">
                      Restraten, die dein Nachfolger übernimmt
                    </p>
                    <p className="text-3xl md:text-4xl font-black text-white">
                      CHF {remainingObligation.toLocaleString("de-CH")}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="rounded-2xl border-2 border-green-300 bg-green-50 p-4">
                      <div className="flex items-center gap-1.5 mb-1">
                        <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                        <span className="text-xs font-bold text-neutral-900">Übernahme</span>
                      </div>
                      <p className="text-xl font-black text-green-700">~ CHF {TRANSFER_FEE_CHF}</p>
                      <p className="text-xs text-neutral-600 mt-0.5">Umschreibegebühr</p>
                    </div>
                    <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-4">
                      <div className="flex items-center gap-1.5 mb-1">
                        <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                        <span className="text-xs font-bold text-neutral-900">Kündigung</span>
                      </div>
                      <p className="text-xl font-black text-red-600">Mehrere tausend</p>
                      <p className="text-xs text-neutral-600 mt-0.5">je nach Bank & Vertrag</p>
                    </div>
                  </div>

                  <CtaButton
                    location="calculator"
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-6 rounded-2xl"
                  />
                  <p className="mt-3 text-xs text-neutral-500 text-center">
                    Richtwerte zur Orientierung. Massgebend sind dein Leasingvertrag und die Konditionen deiner
                    Leasingbank.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* OPTIONS COMPARISON — the decision the visitor came to make, so it is
            the first thing under the hero. */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-black text-neutral-900 mb-4">
                Deine 3 Optionen im Vergleich
              </h2>
              <p className="text-neutral-600 text-lg leading-relaxed">
                Du hast drei Wege aus dem Leasing: die Übernahme durch eine Nachfolgerin oder einen Nachfolger, die
                vorzeitige Kündigung (teuer) oder den Verkauf mit Ablösung. Am günstigsten ist meist die
                Leasingübernahme.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Option 1: Cancellation */}
              <Card className="border-2 border-red-100 rounded-3xl overflow-hidden">
                <CardContent className="p-0">
                  <div className="bg-red-50 p-6">
                    <div className="bg-red-600 text-white w-11 h-11 rounded-2xl flex items-center justify-center mb-4">
                      <XCircle className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-black text-neutral-900 mb-2">Vorzeitige Kündigung</h3>
                    <div className="text-xs font-bold text-red-600 bg-red-200 inline-block px-3 py-1 rounded-full">
                      TEUERSTE OPTION
                    </div>
                  </div>
                  <div className="p-6 bg-white">
                    <ul className="space-y-3">
                      {[
                        "Restschuld für verbleibende Vertragsdauer",
                        "Vorfälligkeitsentschädigung",
                        "Rücknahmekosten",
                        "Kosten bei Schäden",
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 shrink-0" />
                          <span className="text-neutral-700 text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-sm text-neutral-500 italic mt-5">Fast immer die teuerste Lösung</p>
                  </div>
                </CardContent>
              </Card>

              {/* Option 2: Selling */}
              <Card className="border-2 border-orange-100 rounded-3xl overflow-hidden">
                <CardContent className="p-0">
                  <div className="bg-orange-50 p-6">
                    <div className="bg-orange-600 text-white w-11 h-11 rounded-2xl flex items-center justify-center mb-4">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-black text-neutral-900 mb-2">Auto verkaufen</h3>
                    <div className="text-xs font-bold text-orange-600 bg-orange-200 inline-block px-3 py-1 rounded-full">
                      UNSICHER
                    </div>
                  </div>
                  <div className="p-6 bg-white">
                    <ul className="space-y-3">
                      {[
                        "Niedriger Ankaufpreis",
                        "Risiko eines Wertverlusts",
                        "Weiterlaufende Raten",
                        "Unerwartete Zusatzgebühren",
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-2 shrink-0" />
                          <span className="text-neutral-700 text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-sm text-neutral-500 italic mt-5">Nur bei hohem Marktwert sinnvoll</p>
                  </div>
                </CardContent>
              </Card>

              {/* Option 3: Transfer — the recommended path, visually dominant */}
              <Card className="border-2 border-green-400 rounded-3xl overflow-hidden shadow-xl relative lg:-mt-3">
                <div className="absolute top-4 right-4 z-10">
                  <div className="bg-green-600 text-white text-xs font-black px-3 py-1.5 rounded-full">EMPFOHLEN</div>
                </div>
                <CardContent className="p-0">
                  <div className="bg-green-50 p-6">
                    <div className="bg-green-600 text-white w-11 h-11 rounded-2xl flex items-center justify-center mb-4">
                      <BadgeCheck className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-black text-neutral-900 mb-2">Leasingübernahme</h3>
                    <div className="text-xs font-bold text-green-700 bg-green-200 inline-block px-3 py-1 rounded-full">
                      BESTE LÖSUNG
                    </div>
                  </div>
                  <div className="p-6 bg-white">
                    <ul className="space-y-3 mb-6">
                      {[
                        "Schneller Ausstieg",
                        "Keine Strafzahlungen",
                        "Kein Verkauf nötig",
                        "Win-Win für beide Seiten",
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-3">
                          <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                          <span className="text-neutral-700 text-sm font-medium">{item}</span>
                        </li>
                      ))}
                    </ul>
                    <CtaButton
                      location="options_compare"
                      className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-6 rounded-2xl"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <p className="text-center text-neutral-600 mt-8">
              Wie die Übernahme im Detail funktioniert, liest du unter{" "}
              <Link href="/leasinguebernahme" className="text-primary font-semibold hover:underline">
                Leasingübernahme
              </Link>
              .
            </p>
          </div>
        </section>

        {/* PROCESS — five steps in one horizontal band instead of five
            full-width stacked cards. */}
        <section id="ablauf" className="py-16 px-4 bg-neutral-50 scroll-mt-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-black text-neutral-900 mb-4">So funktioniert&apos;s</h2>
              <p className="text-neutral-600 text-lg">
                In 5 Schritten zum Ziel –{" "}
                <Link href="/leasingvertrag-uebertragen" className="text-primary font-semibold hover:underline">
                  so wird der Leasingvertrag übertragen
                </Link>
              </p>
            </div>

            <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
              {[
                { step: 1, title: "Vertrag prüfen", desc: "Restwert, Laufzeit und Kilometerstand checken", icon: FileText },
                { step: 2, title: "Bank kontaktieren", desc: "Konditionen für die Übernahme klären", icon: Phone },
                { step: 3, title: "Inserat erstellen", desc: "Auf BuyAuto.ch veröffentlichen und Nachfolger finden", icon: Search },
                { step: 4, title: "Bonitätsprüfung", desc: "Leasingbank prüft den Übernehmer", icon: ShieldCheck },
                { step: 5, title: "Umschreibung", desc: "Vertrag umschreiben, Fahrzeug übergeben – fertig!", icon: CheckCircle },
              ].map((item) => {
                const IconComponent = item.icon;
                return (
                  <li
                    key={item.step}
                    className="bg-white rounded-2xl p-6 border border-neutral-200 hover:border-primary/40 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <span className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center font-black shrink-0">
                        {item.step}
                      </span>
                      <IconComponent className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-black text-neutral-900 mb-2">{item.title}</h3>
                    <p className="text-neutral-600 text-sm leading-relaxed">{item.desc}</p>
                  </li>
                );
              })}
            </ol>

            <div className="mt-10 text-center">
              <CtaButton
                location="process"
                className="bg-primary hover:bg-primary/90 text-white font-bold px-10 py-7 text-lg rounded-2xl shadow-lg shadow-primary/25"
              />
            </div>
          </div>
        </section>

        {/* LIVE TAKEOVER LISTINGS — real, current social proof. Deliberately no
            link to /suche here: this page's job is to produce inserate. */}
        {takeoverListings.length > 0 && (
          <section className="py-16 px-4 bg-white">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-4">
                  <Users className="w-4 h-4" />
                  Live auf BuyAuto
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-neutral-900 mb-4">
                  Diese Fahrer geben gerade ihr Leasing ab
                </h2>
                <p className="text-neutral-600 text-lg max-w-2xl mx-auto">
                  Echte, aktuelle Inserate – so präsentiert sich dein Leasing möglichen Übernehmern.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {takeoverListings.map((listing) => (
                  <ModernListingCard key={listing.id} listing={listing} />
                ))}
              </div>

              <div className="mt-10 text-center">
                <CtaButton
                  location="live_listings"
                  className="bg-primary hover:bg-primary/90 text-white font-bold px-10 py-7 text-lg rounded-2xl shadow-lg shadow-primary/25"
                />
              </div>
            </div>
          </section>
        )}

        {/* WHY — kept for topical coverage, compressed from six large cards to a
            compact grid so it costs a fraction of the scroll depth. */}
        <section id="warum" className="py-16 px-4 bg-neutral-50 scroll-mt-20">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-black text-neutral-900 mb-3">Warum Leasing abgeben?</h2>
              <p className="text-neutral-600 text-lg">Die häufigsten Gründe in der Schweiz</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: DollarSign, title: "Finanzielle Belastung", desc: "Raten werden zu hoch oder Budget ändert sich" },
                { icon: UserCheck, title: "Lebenssituation", desc: "Baby, Umzug, neue Prioritäten" },
                { icon: MapPin, title: "Kilometer überschritten", desc: "Höherer Verbrauch als geplant" },
                { icon: FileText, title: "Versicherung zu teuer", desc: "Unerwartete Zusatzkosten" },
                { icon: TrendingDown, title: "Auto nicht nötig", desc: "Homeoffice oder ÖV reicht" },
                { icon: AlertCircle, title: "Vertrag läuft aus", desc: "Neue Modelle bevorzugt" },
              ].map((item) => {
                const IconComponent = item.icon;
                return (
                  <div key={item.title} className="flex items-start gap-3 bg-white rounded-2xl p-5 border border-neutral-200">
                    <div className="bg-primary/10 w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                      <IconComponent className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-neutral-900 mb-1">{item.title}</h3>
                      <p className="text-neutral-600 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 bg-white border-l-4 border-primary p-6 rounded-2xl">
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-black text-neutral-900 mb-1">Wichtig zu wissen:</p>
                  <p className="text-neutral-700 leading-relaxed">
                    Ein Leasingvertrag ist rechtlich bindend – einfach zurückgeben ist nicht möglich. Aber es gibt
                    legale, kostengünstige Alternativen: Die wichtigste ist die Übertragung an eine Nachfolgerin
                    oder einen Nachfolger – wie das geht, zeigt dieser Leitfaden Schritt für Schritt.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ — the last objections before the closing CTA. */}
        <section id="faq" className="py-16 px-4 bg-white scroll-mt-20">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-black text-neutral-900 mb-3">Häufige Fragen</h2>
              <p className="text-neutral-600 text-lg">Alles, was du wissen musst</p>
            </div>

            <Accordion type="single" collapsible className="w-full space-y-3">
              {FAQS.map((faq, i) => (
                <AccordionItem
                  key={faq.q}
                  value={`item-${i}`}
                  className="bg-neutral-50 rounded-2xl border border-neutral-200 px-6 data-[state=open]:bg-white data-[state=open]:shadow-md transition-all"
                >
                  <AccordionTrigger className="text-left font-bold text-neutral-900 hover:no-underline py-5">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-neutral-600 leading-relaxed pb-5 text-base">
                    {faq.href ? (
                      <>
                        {faq.a.split(faq.linkText)[0]}
                        <Link href={faq.href} className="text-primary font-semibold hover:underline">
                          {faq.linkText}
                        </Link>
                        {faq.a.split(faq.linkText)[1]}
                      </>
                    ) : (
                      faq.a
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <p className="text-center text-sm text-neutral-400 mt-8">
              Aktualisiert am {formatSwissDate(LAST_UPDATED_ISO)}
            </p>
          </div>
        </section>

        {/* FINAL CTA — one action, no competing button. */}
        <section className="py-20 bg-neutral-900 px-4 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-primary rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary rounded-full blur-3xl" />
          </div>

          <div className="max-w-3xl mx-auto text-center relative z-10">
            <h2 className="text-3xl md:text-5xl font-black text-white leading-tight mb-5">
              Gib dein Leasing ab –<br />
              <span className="text-primary">legal, schnell & günstig</span>
            </h2>
            <p className="text-neutral-300 text-lg leading-relaxed mb-8">
              Die Leasingübernahme ist für die meisten Fahrer die beste Lösung. Keine versteckten Kosten, keine
              Komplikationen.
            </p>
            <CtaButton
              location="final"
              className="w-full sm:w-auto h-16 px-10 text-xl font-black bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-2xl shadow-primary/30"
            />
            <p className="mt-4 text-sm text-neutral-400">
              Gratis · 60 Tage online ·{" "}
              <Link href="/leasinguebernahme" className="text-neutral-300 underline hover:text-white">
                Mehr über die Leasingübernahme
              </Link>
            </p>

            <div className="pt-12 flex flex-wrap items-center justify-center gap-8 text-neutral-400 text-sm">
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

        {/* The sticky bar overlaps the page bottom; keep the last section clear
            of it so the footer links stay reachable on mobile. */}
        <div className="h-20" aria-hidden />
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps<LeasingAbgebenPageProps> = async () => {
  try {
    const results = await searchListings({ dealType: "lease_takeover", sort: "dateDesc" });
    // Newest three takeovers; strip undefined fields so Next can serialize.
    const takeoverListings = JSON.parse(JSON.stringify(results.items.slice(0, 3))) as Listing[];
    return { props: { takeoverListings }, revalidate: 3600 };
  } catch (error) {
    console.error("Leasing abgeben landing: takeover fetch failed:", error);
    return { props: { takeoverListings: [] }, revalidate: 3600 };
  }
};
