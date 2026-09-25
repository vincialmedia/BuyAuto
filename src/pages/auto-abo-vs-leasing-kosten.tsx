import Head from "next/head";
import { CONTENT_LAST_UPDATED, formatSwissDate } from "@/lib/buyauto/contentDates";
import Link from "next/link";
import { 
  Check, 
  AlertTriangle, 
  FileText, 
  Info, 
  Calendar, 
  Clock, 
  ArrowRight, 
  Mail, 
  ShieldCheck, 
  AlertCircle,
  ChevronRight,
  Copy,
  TrendingDown,
  FileCheck,
  Search,
  Users,
  Calculator,
  Car
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Image from "next/image";
import dynamic from "next/dynamic";
import { BreadcrumbJsonLd } from "@/components/buyauto/Breadcrumbs";
import type { GetStaticPropsContext } from "next";
import { absoluteUrl } from "@/i18n/config";
import { T, useLocale, useT } from "@/i18n/runtime";
import { withI18n } from "@/i18n/server";

// Mirrors CalculatorSkeleton in AutoAboVsLeasingCalculator.tsx (duplicated here so the
// calculator chunk stays code-split); the calculator renders the same skeleton until its
// own isClient effect runs, so the chunk-load swap causes no layout shift.
const CalculatorSkeleton = () => (
  <div className="w-full space-y-8 animate-pulse" aria-hidden="true">
    {/* Presets bar */}
    <div className="h-28 sm:h-16 bg-neutral-50 rounded-xl border border-neutral-200" />
    {/* Controls bar */}
    <div className="h-40 md:h-28 bg-white rounded-xl border border-neutral-200 shadow-sm" />
    {/* Shared inputs */}
    <div className="h-52 md:h-32 bg-neutral-50/50 rounded-xl border border-neutral-200" />
    {/* Abo / Leasing input cards */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="h-[440px] bg-white rounded-xl border border-neutral-200 shadow-sm" />
      <div className="h-[560px] bg-white rounded-xl border border-neutral-200 shadow-sm" />
    </div>
    {/* Results: two result cards + summary + breakdown */}
    <div className="bg-neutral-900 rounded-2xl p-4 sm:p-6 md:p-10">
      <div className="flex flex-col md:flex-row items-stretch gap-4 md:gap-8 mb-10">
        <div className="flex-1 h-44 bg-white/5 rounded-xl border border-white/10" />
        <div className="flex-1 h-44 bg-white/5 rounded-xl border border-white/10" />
      </div>
      <div className="max-w-3xl mx-auto h-24 bg-white/10 rounded-xl mb-8" />
      <div className="max-w-3xl mx-auto h-72 bg-neutral-950/50 rounded-lg border border-white/5" />
    </div>
  </div>
);

// The calculator is fully client-gated (it renders only a placeholder until hydration),
// so load it as a client-only chunk instead of shipping it in the initial page bundle.
// ssr: false matches its existing SSR output (placeholder markup, no calculator).
const AutoAboVsLeasingCalculator = dynamic(
  () =>
    import("@/components/buyauto/calculator/AutoAboVsLeasingCalculator").then(
      (mod) => mod.AutoAboVsLeasingCalculator
    ),
  {
    ssr: false,
    loading: () => <CalculatorSkeleton />,
  }
);

interface PageProps {
  updatedDate: string;
}

// Honest last-edit date (was a fake daily-refreshing new Date() — a freshness-spoofing
// signal). Maintained in contentDates.ts, shared with the sitemap lastmod and the
// Article schema dateModified below.

// Single source of truth for the FAQ: feeds BOTH the visible accordion and the FAQPage
// JSON-LD, so the schema can never drift from what the user (and Google) actually sees.
const FAQ_ITEMS = [
  {
    q: "Ist Versicherung im Leasing wirklich nie dabei?",
    a: "Meistens nicht. Es gibt 'Full-Service-Leasing' Angebote, wo Versicherung und Service inkludiert sind. Diese sind aber teurer. Unser Rechner geht vom Standard-Leasing (ohne Versicherung) aus, du kannst den Versicherungswert aber auf 0 setzen, falls inkludiert."
  },
  {
    q: "Kann ich das Auto nach dem Abo behalten?",
    a: "Manchmal ja. Viele Abo-Anbieter bieten eine Kaufoption am Ende der Laufzeit an. Das ist aber meist nicht der Hauptzweck des Modells. Beim Leasing ist die Übernahme am Ende oft vertraglich als Option geregelt."
  },
  {
    q: "Was ist mit der Anzahlung?",
    a: "Beim Leasing ist eine Anzahlung ('Leasing-Sonderzahlung') üblich, um die monatliche Rate zu senken. Beim Auto-Abo gibt es fast nie eine Anzahlung, nur manchmal eine Startgebühr."
  },
  {
    q: "Für wen ist Abo das Richtige?",
    a: "Für Expats, Projektmitarbeiter, Leute die gerne oft das Auto wechseln oder unsicher sind, welches Auto (z.B. Elektro) zu ihnen passt."
  },
  {
    q: "Zählt die Bonität bei beiden gleich?",
    a: "Ja. Sowohl Abo-Anbieter als auch Leasingbanken prüfen die Bonität (Betreibungsauskunft). Ein negativer Eintrag führt meist bei beiden zur Ablehnung."
  }
];

export async function getStaticProps({ locale }: GetStaticPropsContext) {
  return {
    props: {
      updatedDate: formatSwissDate(CONTENT_LAST_UPDATED["/auto-abo-vs-leasing-kosten"]),
      ...(await withI18n(locale, ["calculator", "pages/auto-abo-vs-leasing-kosten"])),
    },
    revalidate: 86400,
  };
}

// Single source for the visible «Aktualisiert am» badge and the Article dateModified.
const LAST_UPDATED_ISO = CONTENT_LAST_UPDATED["/auto-abo-vs-leasing-kosten"];

export default function AutoAboVsLeasingKostenPage({ updatedDate }: PageProps) {
  const t = useT();
  const locale = useLocale();
  const canonical = absoluteUrl("/auto-abo-vs-leasing-kosten", locale);

  // FAQ schema generated from the same array the accordion renders.
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": FAQ_ITEMS.map((f) => ({
      "@type": "Question",
      "name": t(f.q),
      "acceptedAnswer": { "@type": "Answer", "text": t(f.a) },
    })),
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <Head>
        <title>{t("Auto-Abo vs Leasing Kosten (Schweiz): Rechner & Vollkostenvergleich | BuyAuto")}</title>
        <meta
          name="description"
          content={t(
            "Vergleiche Auto-Abo vs Leasing mit Vollkostenrechnung: Rate, Versicherung, Service, Reifen, Steuern, Kilometer & Gebühren. In 2 Minuten wissen, was günstiger ist."
          )}
        />
        <link rel="canonical" href={canonical} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: t("Auto-Abo vs Leasing Kosten: der Vollkosten-Rechner für die Schweiz"),
              author: { "@type": "Person", name: "Vincent Hänggi" },
              publisher: {
                "@type": "Organization",
                name: "BuyAuto",
                logo: { "@type": "ImageObject", url: "https://www.buyauto.ch/share-logo.jpg" },
              },
              dateModified: LAST_UPDATED_ISO,
              mainEntityOfPage: canonical,
            }),
          }}
        />
        
        {/* Open Graph */}
        <meta property="og:title" content={t("Auto-Abo vs Leasing Kosten (Schweiz): Rechner & Vollkostenvergleich")} />
        <meta
          property="og:description"
          content={t(
            "Vergleiche Auto-Abo vs Leasing mit Vollkostenrechnung: Rate, Versicherung, Service, Reifen, Steuern, Kilometer & Gebühren. In 2 Minuten wissen, was günstiger ist."
          )}
        />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonical} />
        <meta property="og:site_name" content="BuyAuto" />
        
        {/* FAQ Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      </Head>

      {/* Schema-only: hero layout has no room for a visible crumb bar. */}
      <BreadcrumbJsonLd
        items={[
          { name: t("Home"), href: "/" },
          { name: t("Auto-Abos im Vergleich"), href: "/auto-abos-im-vergleich" },
          { name: t("Auto-Abo vs. Leasing Kosten"), href: "/auto-abo-vs-leasing-kosten" },
        ]}
      />

      <main className="bg-neutral-50 min-h-screen">
        
        {/* HERO SECTION */}
        <section className="relative min-h-[500px] md:min-h-[550px] flex items-center overflow-hidden pt-16">
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=2400&q=80"
              alt={t("Auto-Abo vs Leasing Kosten Vergleich Schweiz")}
              fill
              className="object-cover"
              priority
              quality={75}
              sizes="100vw"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/70 via-neutral-900/60 to-neutral-900/80" />
            <div className="absolute inset-0 bg-gradient-to-r from-red-900/20 via-transparent to-neutral-900/30" />
          </div>

          {/* Geometric Accents */}
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 left-1/5 w-64 h-64 bg-red-400/5 rounded-full blur-2xl" />

          {/* Hero Content */}
          <div className="relative z-10 w-full px-4 py-16 md:py-20">
            <div className="max-w-5xl mx-auto">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 bg-red-600 text-white px-5 py-2 rounded-full text-sm font-semibold mb-6">
                  <Calculator className="w-4 h-4" />
                  <span>{t("Kosten-Rechner • Aktualisiert am {date}", { date: updatedDate })}</span>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight mb-6">
                  {t("Auto-Abo vs Leasing Kosten: der Vollkosten-Rechner für die Schweiz")}
                </h1>
                <p className="text-xl md:text-2xl text-red-300 font-semibold mb-4">
                  {t("Rate ist nicht alles. Vergleiche die echten Gesamtkosten.")}
                </p>
                <p className="text-lg text-neutral-200 leading-relaxed mb-8 max-w-2xl">
                  {t("Kurz gesagt: Ein Auto-Abo lohnt sich meist bei Laufzeiten unter 2–3 Jahren, weil Versicherung, Steuern und Service im Fixpreis enthalten sind. Ab etwa 3 Jahren fährst du mit Leasing plus Eigenregie in der Regel günstiger – trotz Anzahlung und Nebenkosten. Der Rechner unten vergleicht beide Modelle mit deinen echten Zahlen, inklusive versteckter Gebühren.")}
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    asChild
                    size="lg"
                    className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30 transition-all duration-300 px-8 py-6 text-base font-semibold rounded-xl"
                  >
                    <Link href="#rechner">
                      {t("Zum Rechner")}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                   <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-2 border-white text-white hover:bg-white hover:text-neutral-900 transition-all duration-300 px-8 py-6 text-base font-semibold rounded-xl bg-transparent"
                  >
                    <Link href="/suche">
                      {t("Leasingübernahmen ansehen")}
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
              <Info className="w-8 h-8 text-red-600" />
              <h2 className="text-3xl font-bold text-neutral-900">
                {t("Kurz gesagt: Die Faustregel")}
              </h2>
            </div>
            
            <div className="bg-red-50 border-l-4 border-red-600 p-8 rounded-r-xl shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-bold text-neutral-900 text-lg mb-2 flex items-center gap-2">
                    <Check className="w-5 h-5 text-red-600" />
                    {t("Auto-Abo lohnt sich meist, wenn...")}
                  </h3>
                  <ul className="space-y-2 text-neutral-700 list-disc list-inside pl-2">
                     <li><T k="Du das Auto <0>kürzer als 2-3 Jahre</0> brauchst." c={[<strong key="0" />]} /></li>
                     <li>{t("Du Junglenker bist (teure Versicherung inkl.).")}</li>
                     <li>{t("Du 0 CHF Anzahlung leisten willst.")}</li>
                     <li>{t("Du volle Kostenkontrolle ohne böse Überraschungen suchst.")}</li>
                  </ul>
                </div>
                <div>
                   <h3 className="font-bold text-neutral-900 text-lg mb-2 flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-red-600" />
                    {t("Leasing lohnt sich meist, wenn...")}
                  </h3>
                  <ul className="space-y-2 text-neutral-700 list-disc list-inside pl-2">
                     <li><T k="Du das Auto <0>3 Jahre oder länger</0> fährst." c={[<strong key="0" />]} /></li>
                     <li>{t("Du bereits eine sehr günstige Versicherungseinstufung hast.")}</li>
                     <li>{t("Du das Auto nach Vertrag individuell konfigurieren willst.")}</li>
                     <li>{t("Du eine Anzahlung leisten kannst, um die Rate zu drücken.")}</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-red-200">
                <p className="text-red-900 font-medium flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  <T
                    k="Achtung: Das Ergebnis hängt extrem von <0>Versicherung, Laufleistung und Servicekosten</0> ab. Nutze den Rechner unten für dein Szenario."
                    c={[<strong key="0" />]}
                  />
                </p>
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
                  { id: "rechner", label: t("Der Kosten-Rechner") },
                  { id: "lesen", label: t("So liest du den Vergleich") },
                  { id: "fallen", label: t("Typische Kostenfallen") },
                  { id: "option3", label: t("Leasingübernahme als 3. Option") },
                  { id: "faq", label: t("Häufige Fragen") },
                  { id: "disclaimer", label: t("Disclaimer") },
                ].map((item, i) => (
                  <button 
                    key={i}
                    onClick={() => scrollToSection(item.id)}
                    className="flex items-center gap-2 text-neutral-600 hover:text-red-600 transition-colors text-left group"
                  >
                    <ChevronRight className="w-4 h-4 text-red-400 group-hover:text-red-600 transition-colors" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CALCULATOR SECTION */}
        <section id="rechner" className="py-16 px-4 bg-white scroll-mt-20">
          <div className="max-w-7xl mx-auto">
             <div className="text-center mb-10">
               <div className="inline-flex items-center justify-center p-3 bg-red-100 rounded-full mb-4">
                 <Calculator className="w-8 h-8 text-red-600" />
               </div>
               <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
                 {t("Auto-Abo vs. Leasing Rechner")}
               </h2>
               <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
                 <T
                   k="Gib deine Daten ein oder nutze unsere Beispielwerte. <0/>Wir berechnen die <1>Vollkosten</1> (TCO) über die gesamte Laufzeit."
                   c={[<br key="0" className="hidden md:block" />, <strong key="1" />]}
                 />
               </p>
             </div>

             <AutoAboVsLeasingCalculator />

          </div>
        </section>

        {/* HOW TO READ SECTION */}
        <section id="lesen" className="py-16 px-4 bg-neutral-50 scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <Search className="w-8 h-8 text-red-600" />
              <h2 className="text-3xl font-bold text-neutral-900">
                {t("So liest du den Vergleich")}
              </h2>
            </div>
            
            <div className="prose prose-lg text-neutral-700 max-w-none">
              <p>
                <T
                  k="Der häufigste Fehler ist der reine Blick auf die <0>Monatsrate</0>. Eine Leasingrate von CHF 300 sieht unschlagbar günstig aus gegen ein Abo für CHF 600. Doch das täuscht gewaltig."
                  c={[<strong key="0" />]}
                />
              </p>
              <p>
                {t("Beim Leasing musst du zwingend folgende Kosten dazu addieren, um Äpfel mit Äpfeln zu vergleichen:")}
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 list-none pl-0">
                <li className="bg-white p-4 rounded-lg border border-neutral-200 flex items-start gap-3">
                  <span className="text-red-600 font-bold text-xl">•</span>
                  <span><T k="<0>Versicherung:</0> Vollkasko ist beim Leasing Pflicht. Für Junge oder in Städten oft 150-200 CHF/Mt." c={[<strong key="0" />]} /></span>
                </li>
                <li className="bg-white p-4 rounded-lg border border-neutral-200 flex items-start gap-3">
                  <span className="text-red-600 font-bold text-xl">•</span>
                  <span><T k="<0>Reifen:</0> Ein Satz Winterreifen + Wechsel + Einlagerung kostet schnell 600-800 CHF pro Jahr." c={[<strong key="0" />]} /></span>
                </li>
                 <li className="bg-white p-4 rounded-lg border border-neutral-200 flex items-start gap-3">
                  <span className="text-red-600 font-bold text-xl">•</span>
                  <span><T k="<0>Steuern:</0> Die Verkehrssteuer (je nach Kanton 200-800 CHF) zahlt beim Leasing der Halter (= Du)." c={[<strong key="0" />]} /></span>
                </li>
                 <li className="bg-white p-4 rounded-lg border border-neutral-200 flex items-start gap-3">
                  <span className="text-red-600 font-bold text-xl">•</span>
                  <span><T k="<0>Service:</0> Ölwechsel und Inspektionen gehen beim Leasing auf deine Kappe." c={[<strong key="0" />]} /></span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* TYPICAL TRAPS SECTION */}
        <section id="fallen" className="py-16 px-4 bg-white scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <AlertTriangle className="w-8 h-8 text-red-600" />
              <h2 className="text-3xl font-bold text-neutral-900">
                {t("Typische Kostenfallen")}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-neutral-50 rounded-xl p-8 border border-neutral-200">
                <h3 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
                   <span className="w-2 h-8 bg-neutral-900 rounded-full"></span>
                   {t("Beim Auto-Abo")}
                </h3>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <Check className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <span className="text-neutral-700"><T k="<0>Mehrkilometer:</0> Wer mehr fährt als gebucht, zahlt oft teuer nach (z.B. 0.45 CHF/km)." c={[<strong key="0" />]} /></span>
                  </li>
                  <li className="flex gap-3">
                    <Check className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <span className="text-neutral-700"><T k="<0>Startgebühr:</0> Manche Anbieter verlangen 300-500 CHF nur für die Bereitstellung." c={[<strong key="0" />]} /></span>
                  </li>
                  <li className="flex gap-3">
                    <Check className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <span className="text-neutral-700"><T k="<0>Selbstbehalt:</0> Prüfe den Selbstbehalt bei der Versicherung (oft 1'000 CHF)." c={[<strong key="0" />]} /></span>
                  </li>
                </ul>
              </div>

              <div className="bg-neutral-50 rounded-xl p-8 border border-neutral-200">
                <h3 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
                   <span className="w-2 h-8 bg-white border border-neutral-900 rounded-full"></span>
                   {t("Beim Leasing")}
                </h3>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <Check className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <span className="text-neutral-700"><T k="<0>Rückgabeschäden:</0> Kleine Kratzer werden oft teuer verrechnet." c={[<strong key="0" />]} /></span>
                  </li>
                  <li className="flex gap-3">
                    <Check className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <span className="text-neutral-700"><T k="<0>Vertragsbindung:</0> Du kommst vorzeitig fast nicht raus." c={[<strong key="0" />]} /></span>
                  </li>
                  <li className="flex gap-3">
                    <Check className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <span className="text-neutral-700"><T k={"<0>Anzahlung:</0> Die \"tiefe Rate\" ist oft mit 3'000–5'000 CHF Anzahlung erkauft."} c={[<strong key="0" />]} /></span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* LEASINGUEBERNAHME OPTION */}
        <section id="option3" className="py-16 px-4 bg-gradient-to-br from-neutral-900 to-neutral-800 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">
              {t("Die 3. Option: Leasingübernahme")}
            </h2>
            <p className="text-xl text-neutral-300 mb-8 max-w-2xl mx-auto">
              <T
                k="Du willst kurze Laufzeiten wie beim Abo, aber günstige Raten wie beim Leasing? <0/>Übernimm einen laufenden Leasingvertrag von jemand anderem – wann sich das gegenüber dem Abo lohnt, zeigt dir <1>Leasingübernahme vs. Auto-Abo – der grosse Vergleich</1>."
                c={[
                  <br key="0" />,
                  <Link key="1" href="/leasinguebernahme-vs-autoabo" className="text-red-400 font-semibold hover:underline" />,
                ]}
              />
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10 text-left">
              <div className="bg-white/10 p-6 rounded-xl border border-white/10">
                <Clock className="w-8 h-8 text-red-400 mb-4" />
                <h3 className="font-bold text-lg mb-2">{t("Kurze Restlaufzeit")}</h3>
                <p className="text-sm text-neutral-400">{t("Oft nur noch 12–24 Monate übrig. Ideal zum Überbrücken.")}</p>
              </div>
              <div className="bg-white/10 p-6 rounded-xl border border-white/10">
                <TrendingDown className="w-8 h-8 text-red-400 mb-4" />
                <h3 className="font-bold text-lg mb-2">{t("Keine Anzahlung")}</h3>
                <p className="text-sm text-neutral-400">
                  <T
                    k="Die Anzahlung hat meist der Vorbesitzer schon geleistet. Welche Gebühren trotzdem anfallen, zeigen dir die <0>Leasingübernahme-Kosten im Überblick</0>."
                    c={[<Link key="0" href="/leasinguebernahme-kosten" className="text-red-400 font-semibold hover:underline" />]}
                  />
                </p>
              </div>
              <div className="bg-white/10 p-6 rounded-xl border border-white/10">
                <Car className="w-8 h-8 text-red-400 mb-4" />
                <h3 className="font-bold text-lg mb-2">{t("Sofort verfügbar")}</h3>
                <p className="text-sm text-neutral-400">{t("Keine Lieferfristen. Das Auto steht schon bereit.")}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
               <Button asChild size="lg" className="bg-red-600 hover:bg-red-700 text-white shadow-lg border-none">
                <Link href="/suche">
                  <Search className="w-4 h-4 mr-2" />
                  {t("Leasingübernahmen finden")}
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/20 hover:bg-white/10 hover:text-white bg-transparent text-white">
                <Link href="/leasinguebernahme">
                  {t("Mehr zur Leasingübernahme")}
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section id="faq" className="py-16 px-4 bg-neutral-50 scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-neutral-900 mb-3">
                {t("Häufige Fragen (FAQ)")}
              </h2>
              <p className="text-neutral-600 text-lg">
                <T
                  k="Expertenwissen kurz & knapp – oder direkt <0>aktuelle Leasingübernahme-Angebote ansehen</0>"
                  c={[<Link key="0" href="/suche?dealType=lease_takeover" className="text-primary font-semibold hover:underline" />]}
                />
              </p>
            </div>
            
            <Accordion type="single" collapsible className="w-full space-y-4">
              {FAQ_ITEMS.map((faq, i) => (
                <AccordionItem 
                  key={i} 
                  value={`item-${i}`}
                  className="bg-white border border-neutral-200 rounded-xl px-6 md:px-8 hover:border-red-600 transition-colors"
                >
                  <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 text-base md:text-lg">
                    {t(faq.q)}
                  </AccordionTrigger>
                  <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                    {t(faq.a)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

         {/* DISCLAIMER SECTION */}
         <section id="disclaimer" className="py-12 px-4 bg-neutral-100 text-sm text-neutral-500">
           <div className="max-w-4xl mx-auto text-center space-y-2">
             <p>
               <T
                 k="<0>Disclaimer:</0> Dieser Rechner dient lediglich als Orientierungshilfe und Modellrechnung. Die tatsächlichen Kosten hängen von individuellen Faktoren (Versicherungseinstufung, Wohnkanton, Fahrstil) und den konkreten Vertragsbedingungen der Anbieter ab."
                 c={[<strong key="0" />]}
               />
             </p>
             <p>
               {t("BuyAuto.ch übernimmt keine Gewähr für die Richtigkeit der Ergebnisse. Keine Finanzberatung. Bitte prüfe vor Abschluss immer das konkrete Angebot.")}
             </p>
           </div>
         </section>

      </main>
    </>
  );
}