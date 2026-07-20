import Head from "next/head";
import Link from "next/link";
import {
  Check,
  Info,
  ArrowRight,
  AlertCircle,
  ChevronRight,
  Calculator,
  Car,
  Search,
  Percent,
  Banknote,
  Building2,
  Scale,
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

// Mirrors CalculatorSkeleton in EintauschwertRechner.tsx (duplicated here so the
// calculator chunk stays code-split); the calculator renders the same skeleton until
// its own isClient effect runs, so the chunk-load swap causes no layout shift.
const CalculatorSkeleton = () => (
  <div className="w-full space-y-8 animate-pulse" aria-hidden="true">
    {/* Presets bar */}
    <div className="h-24 sm:h-16 bg-neutral-50 rounded-xl border border-neutral-200" />
    {/* Vehicle + comps card / deductions card */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="h-[520px] bg-white rounded-xl border border-neutral-200 shadow-sm" />
      <div className="h-[520px] bg-white rounded-xl border border-neutral-200 shadow-sm" />
    </div>
    {/* Calculate button */}
    <div className="h-16 max-w-md mx-auto bg-neutral-100 rounded-xl" />
    {/* Results */}
    <div className="h-[420px] bg-neutral-900 rounded-2xl" />
  </div>
);

// The calculator is fully client-gated (localStorage free-lookup flag + auth state),
// so load it as a client-only chunk instead of shipping it in the initial page bundle.
const EintauschwertRechner = dynamic(
  () =>
    import("@/components/buyauto/calculator/EintauschwertRechner").then(
      (mod) => mod.EintauschwertRechner
    ),
  {
    ssr: false,
    loading: () => <CalculatorSkeleton />,
  }
);

interface PageProps {
  updatedDate: string;
}

// Honest last-edit date. Bump this when the content actually changes; keep in sync
// with the Article schema dateModified below.
const LAST_UPDATED = "20.07.2026";

// Single source of truth for the FAQ: feeds BOTH the visible accordion and the FAQPage
// JSON-LD, so the schema can never drift from what the user (and Google) actually sees.
const FAQ_ITEMS = [
  {
    q: "Was ist der Eintauschwert eines Autos?",
    a: "Der Eintauschwert (auch Ankaufspreis oder Händlereinkaufspreis) ist der Betrag, den eine Garage für ein Fahrzeug bezahlt, das sie in Eintausch nimmt. Er liegt unter dem Marktwert (Verkaufspreis), weil die Garage Aufbereitung, Garantie, Standzeit und ihre Marge einrechnen muss."
  },
  {
    q: "Wie viel liegt der Eintauschwert unter dem Marktwert?",
    a: "Als Faustregel liegt der Eintauschwert bei 80–90% des Marktwerts, also 10–20% darunter. Bei Fahrzeugen mit hohem Aufbereitungsbedarf, langer erwarteter Standzeit oder schwacher Nachfrage kann der Abschlag auch grösser sein."
  },
  {
    q: "Soll ich die Marge in Prozent oder als Fixbetrag rechnen?",
    a: "Beides ist verbreitet – darum kann der Rechner beides. Eine prozentuale Marge (üblich: 10–20% vom Marktwert) skaliert automatisch mit dem Fahrzeugwert. Ein Fixbetrag (z.B. 1'500 CHF pro Fahrzeug) eignet sich für günstige Occasionen, bei denen eine Prozent-Marge zu wenig Deckungsbeitrag ergibt. Kosten wie Aufbereitung, Garantie-Rückstellung und Standzeit rechnest du dagegen immer als Fixbeträge, weil sie kaum vom Fahrzeugwert abhängen."
  },
  {
    q: "Wie viele Vergleichsfahrzeuge brauche ich für eine belastbare Occasionsbewertung?",
    a: "3–5 vergleichbare Inserate (gleiches Modell, ähnliches Alter, ähnliche Ausstattung) reichen in der Praxis. Der Rechner nutzt den Median der km-bereinigten Preise – so verzerrt ein einzelnes überteuertes oder verschleudertes Inserat das Ergebnis nicht."
  },
  {
    q: "Ist der Eintauschwert-Rechner gratis?",
    a: "Ja. Eine Berechnung ist ohne Konto möglich. Danach brauchst du ein kostenloses BuyAuto-Konto und rechnest unbegrenzt weiter – der Rechner selbst bleibt gratis."
  },
  {
    q: "Ersetzt der Rechner eine Eurotax-Bewertung?",
    a: "Nein, er ergänzt sie. Eurotax liefert einen katalogbasierten Richtwert (kostenpflichtig), unser Rechner arbeitet mit echten, aktuellen Inseratspreisen aus deiner Region. Viele Händler nutzen bewusst beide Quellen: Katalogwert als Anker, Marktpreise als Realitätscheck."
  },
  {
    q: "Was ist der Unterschied zwischen Eintausch und Inzahlungnahme?",
    a: "Es ist dasselbe: In der Schweiz spricht man vom Eintausch (Eintauschwert), in Deutschland von der Inzahlungnahme. Gemeint ist immer, dass die Garage das bisherige Auto des Kunden übernimmt und den Wert an den Kauf des nächsten Fahrzeugs anrechnet."
  }
];

export async function getStaticProps() {
  return {
    props: {
      updatedDate: LAST_UPDATED,
    },
    revalidate: 86400,
  };
}

export default function EintauschwertRechnerPage({ updatedDate }: PageProps) {
  // FAQ schema generated from the same array the accordion renders.
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": FAQ_ITEMS.map((f) => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a },
    })),
  };

  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Eintauschwert-Rechner",
    url: "https://www.buyauto.ch/eintauschwert-rechner",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "CHF" },
    description:
      "Gratis-Rechner für Garagen und Händler: Eintauschwert und Ankaufspreis aus Vergleichsinseraten berechnen – inklusive Aufbereitung, Garantie, Standzeit und Marge.",
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
        <title>Eintauschwert berechnen (Schweiz): Ankaufsrechner für Garagen | BuyAuto</title>
        <meta
          name="description"
          content="Eintauschwert & Ankaufspreis in 2 Minuten berechnen: Marktwert aus Vergleichsinseraten, minus Aufbereitung, Garantie, Standzeit & Marge. Gratis für Garagen & Händler."
        />
        <link rel="canonical" href="https://www.buyauto.ch/eintauschwert-rechner" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: "Eintauschwert berechnen: der Ankaufsrechner für Garagen in der Schweiz",
              author: { "@type": "Person", name: "Vincent Hänggi" },
              publisher: {
                "@type": "Organization",
                name: "BuyAuto",
                logo: { "@type": "ImageObject", url: "https://www.buyauto.ch/share-logo.jpg" },
              },
              dateModified: "2026-07-20",
              mainEntityOfPage: "https://www.buyauto.ch/eintauschwert-rechner",
            }),
          }}
        />

        {/* Open Graph */}
        <meta property="og:title" content="Eintauschwert berechnen (Schweiz): Ankaufsrechner für Garagen" />
        <meta property="og:description" content="Eintauschwert & Ankaufspreis in 2 Minuten berechnen: Marktwert aus Vergleichsinseraten, minus Aufbereitung, Garantie, Standzeit & Marge. Gratis für Garagen & Händler." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://www.buyauto.ch/eintauschwert-rechner" />
        <meta property="og:site_name" content="BuyAuto" />

        {/* FAQ + WebApplication Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
        />
      </Head>

      <main className="bg-neutral-50 min-h-screen">

        {/* HERO SECTION */}
        <section className="relative min-h-[500px] md:min-h-[550px] flex items-center overflow-hidden pt-16">
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src="/20251209_0003_Handshake_in_Zurich_simple_compose_01kc036j1cff881r0wzwemf48h.png"
              alt="Eintauschwert berechnen: Garage übernimmt Occasion in der Schweiz"
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
                  <span>Ankaufs-Rechner • Aktualisiert am {updatedDate}</span>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight mb-6">
                  Eintauschwert berechnen: der Ankaufsrechner für Garagen
                </h1>
                <p className="text-xl md:text-2xl text-red-300 font-semibold mb-4">
                  Schluss mit Bauchgefühl beim Autoankauf.
                </p>
                <p className="text-lg text-neutral-200 leading-relaxed mb-8 max-w-2xl">
                  Vergleichsinserate suchen, Kilometer im Kopf umrechnen und dann eine Zahl schätzen?
                  Unser Rechner macht daraus eine saubere Occasionsbewertung: Marktwert aus echten
                  Inseratspreisen, minus deine Kosten und Marge – fertig ist der Ankaufspreis.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    asChild
                    size="lg"
                    className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30 transition-all duration-300 px-8 py-6 text-base font-semibold rounded-xl"
                  >
                    <Link href="#rechner">
                      Zum Rechner
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-2 border-white text-white hover:bg-white hover:text-neutral-900 transition-all duration-300 px-8 py-6 text-base font-semibold rounded-xl bg-transparent"
                  >
                    <Link href="/garage-plan">
                      Angebot für Garagen
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
                Kurz gesagt: So wird der Eintauschwert berechnet
              </h2>
            </div>

            <div className="bg-red-50 border-l-4 border-red-600 p-8 rounded-r-xl shadow-sm">
              <p className="text-lg text-neutral-800 font-semibold mb-4">
                Eintauschwert = Marktwert − Aufbereitung − Garantie-Rückstellung − Standzeit − Marge
              </p>
              <ul className="space-y-2 text-neutral-700 list-disc list-inside pl-2 mb-6">
                <li><strong>Marktwert:</strong> Median aus 3–5 vergleichbaren Inseraten, um die Kilometer-Differenz bereinigt.</li>
                <li><strong>Fixe Abzüge:</strong> Aufbereitung & Reparaturen (üblich 300–1&apos;500 CHF), Garantie-Rückstellung (300–800 CHF), Standzeit & Kapitalbindung.</li>
                <li><strong>Marge:</strong> branchenüblich 10–20% vom Marktwert – oder ein fixes Ertragsziel pro Fahrzeug.</li>
              </ul>
              <div className="pt-4 border-t border-red-200">
                <p className="text-red-900 font-medium flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  Faustregel: Am Ende liegt der Eintauschwert meist bei <strong>80–90% des Marktwerts</strong>. Der Händlereinkaufspreis liegt also typischerweise 10–20% unter dem Verkaufspreis.
                </p>
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
                  { id: "rechner", label: "Der Eintauschwert-Rechner" },
                  { id: "methode", label: "So funktioniert die Berechnung" },
                  { id: "prozent-oder-fix", label: "Prozent oder Fixbetrag?" },
                  { id: "vergleich", label: "Rechner vs. Eurotax & Co." },
                  { id: "garagen", label: "Für Garagen & Händler" },
                  { id: "faq", label: "Häufige Fragen" },
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
                Der Eintauschwert-Rechner
              </h2>
              <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
                Trag 3–5 Vergleichsinserate und deine Kosten ein. <br className="hidden md:block" />
                Der Rechner liefert <strong>Marktwert, Rechenweg und Ankaufspreis</strong> – transparent und nachvollziehbar.
              </p>
            </div>

            <EintauschwertRechner />

          </div>
        </section>

        {/* METHOD SECTION */}
        <section id="methode" className="py-16 px-4 bg-neutral-50 scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <Search className="w-8 h-8 text-red-600" />
              <h2 className="text-3xl font-bold text-neutral-900">
                So funktioniert die Berechnung
              </h2>
            </div>

            <div className="prose prose-lg text-neutral-700 max-w-none">
              <p>
                Die meisten Garagen bewerten ein Eintausch-Fahrzeug genau so: Vergleichbare Occasionen
                auf den Portalen suchen, Preise nach Kilometerstand einordnen – und dann einen
                Ankaufspreis schätzen. Das Prinzip ist richtig. Was fehlt, ist ein sauberer,
                wiederholbarer Rechenweg. Genau den bildet dieser Rechner ab:
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 list-none pl-0">
                <li className="bg-white p-4 rounded-lg border border-neutral-200 flex items-start gap-3">
                  <span className="text-red-600 font-bold text-xl">1.</span>
                  <span><strong>Vergleichsfahrzeuge erfassen:</strong> 3–5 Inserate mit gleichem Modell, ähnlichem Alter und Ausstattung – Preis und Kilometerstand genügen.</span>
                </li>
                <li className="bg-white p-4 rounded-lg border border-neutral-200 flex items-start gap-3">
                  <span className="text-red-600 font-bold text-xl">2.</span>
                  <span><strong>Kilometer angleichen:</strong> Jeder Vergleichspreis wird um die km-Differenz korrigiert (Standard: 0.10 CHF/km, einstellbar).</span>
                </li>
                <li className="bg-white p-4 rounded-lg border border-neutral-200 flex items-start gap-3">
                  <span className="text-red-600 font-bold text-xl">3.</span>
                  <span><strong>Marktwert bilden:</strong> Der Median der bereinigten Preise – robust gegen einzelne Ausreisser-Inserate.</span>
                </li>
                <li className="bg-white p-4 rounded-lg border border-neutral-200 flex items-start gap-3">
                  <span className="text-red-600 font-bold text-xl">4.</span>
                  <span><strong>Abzüge & Marge:</strong> Aufbereitung, Garantie-Rückstellung, Standzeit und deine Marge – übrig bleibt der Eintauschwert als faires, verteidigbares Angebot.</span>
                </li>
              </ul>
              <p>
                Das Ergebnis ist kein &quot;Katalogwert&quot;, sondern eine <strong>marktbasierte
                Fahrzeugbewertung</strong>: Sie zeigt, was das Auto in deiner Region heute tatsächlich
                kostet – und was du dafür bezahlen kannst, ohne deine Marge zu opfern. Den Rechenweg
                kannst du dem Kunden offen zeigen: Ein transparenter Abzug überzeugt mehr als eine
                Zahl aus dem Bauch.
              </p>
            </div>
          </div>
        </section>

        {/* PERCENT OR FIXED SECTION */}
        <section id="prozent-oder-fix" className="py-16 px-4 bg-white scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <Scale className="w-8 h-8 text-red-600" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Marge: Prozent oder Fixbetrag?
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-neutral-50 rounded-xl p-8 border border-neutral-200">
                <h3 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
                  <Percent className="w-6 h-6 text-red-600" />
                  Prozent vom Marktwert
                </h3>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <Check className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <span className="text-neutral-700"><strong>Branchenüblich: 10–20%.</strong> Skaliert automatisch mit dem Fahrzeugwert.</span>
                  </li>
                  <li className="flex gap-3">
                    <Check className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <span className="text-neutral-700">Sinnvoll ab ca. 10&apos;000 CHF Fahrzeugwert – die Marge deckt Risiko und Aufwand proportional.</span>
                  </li>
                  <li className="flex gap-3">
                    <Check className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <span className="text-neutral-700">Vorsicht bei teuren Fahrzeugen: 15% von 60&apos;000 CHF sind 9&apos;000 CHF – das Angebot wird schnell unattraktiv.</span>
                  </li>
                </ul>
              </div>

              <div className="bg-neutral-50 rounded-xl p-8 border border-neutral-200">
                <h3 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
                  <Banknote className="w-6 h-6 text-red-600" />
                  Fixbetrag pro Fahrzeug
                </h3>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <Check className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <span className="text-neutral-700"><strong>Ertragsziel pro Auto</strong> (z.B. 1&apos;500–2&apos;500 CHF) – einfach zu kalkulieren und zu kontrollieren.</span>
                  </li>
                  <li className="flex gap-3">
                    <Check className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <span className="text-neutral-700">Besser bei günstigen Occasionen: 12% von 8&apos;000 CHF wären nur 960 CHF – zu wenig für den gleichen Aufwand.</span>
                  </li>
                  <li className="flex gap-3">
                    <Check className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <span className="text-neutral-700">Kombinier-Tipp: Fixbetrag als Untergrenze, Prozent als Standard.</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 bg-red-50 border-l-4 border-red-600 p-6 rounded-r-xl">
              <p className="text-neutral-800">
                <strong>Wichtig:</strong> Aufbereitung, Garantie-Rückstellung und Standzeit sind{" "}
                <strong>echte Kosten</strong> und gehören immer als Fixbeträge in die Rechnung – sie
                hängen kaum vom Fahrzeugwert ab. Nur die <strong>Marge</strong> ist eine strategische
                Grösse, bei der Prozent oder Fixbetrag beides funktioniert. Darum trennt der Rechner
                die beiden sauber.
              </p>
            </div>
          </div>
        </section>

        {/* COMPARISON SECTION */}
        <section id="vergleich" className="py-16 px-4 bg-neutral-50 scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <Scale className="w-8 h-8 text-red-600" />
              <h2 className="text-3xl font-bold text-neutral-900">
                Rechner vs. Eurotax, auto-i-dat & Gratis-Bewertungen
              </h2>
            </div>

            <div className="prose prose-lg text-neutral-700 max-w-none mb-8">
              <p>
                Für die professionelle Occasionsbewertung gibt es in der Schweiz etablierte,
                kostenpflichtige Kataloglösungen wie <strong>Eurotax</strong> oder{" "}
                <strong>auto-i-dat</strong> – und daneben Gratis-Bewertungen für Privatpersonen
                (z.B. von grossen Portalen), die aber auf den Verkauf zugeschnitten sind, nicht auf
                deinen Ankauf. Dieser Rechner schliesst die Lücke dazwischen:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
                <h3 className="font-bold text-lg mb-2 text-neutral-900">Katalog-Tools</h3>
                <p className="text-sm text-neutral-600">
                  Eurotax & Co. liefern Richtwerte aus historischen Daten – im Abo oder pro Bewertung
                  kostenpflichtig. Stark als Anker, aber Marktpreise schwanken je nach Region und Saison.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
                <h3 className="font-bold text-lg mb-2 text-neutral-900">Gratis-Bewertungen</h3>
                <p className="text-sm text-neutral-600">
                  Verbraucher-Tools schätzen den Verkaufspreis für Private – ohne Händler-Abzüge.
                  Für den Ankauf fehlt der ganze Rechenweg von Marktwert zu Ankaufspreis.
                </p>
              </div>
              <div className="bg-red-50 p-6 rounded-xl border border-red-200 shadow-sm">
                <h3 className="font-bold text-lg mb-2 text-red-900">Dieser Rechner</h3>
                <p className="text-sm text-red-900/80">
                  Gratis, marktbasiert und für den Händler-Alltag gebaut: echte Inseratspreise rein,
                  deine Kosten und Marge drauf – transparenter Eintauschwert raus.
                </p>
              </div>
            </div>

            <p className="text-sm text-neutral-500 mt-6">
              Profi-Tipp: Nutze mindestens zwei Quellen. Katalogwert als Anker, Marktpreise als
              Realitätscheck – weichen die beiden stark ab, lohnt sich ein zweiter Blick auf
              Ausstattung, Nachfrage und Standzeit-Risiko.
            </p>
          </div>
        </section>

        {/* GARAGE CTA SECTION */}
        <section id="garagen" className="py-16 px-4 bg-gradient-to-br from-neutral-900 to-neutral-800 text-white scroll-mt-20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">
              Für Garagen: vom Ankauf bis zum Verkauf
            </h2>
            <p className="text-xl text-neutral-300 mb-8 max-w-2xl mx-auto">
              Der Rechner ist erst der Anfang. Mit BuyAuto inserierst du deine Occasionen,
              bekommst eine eigene Garagen-Microsite und erreichst Käufer in der ganzen Schweiz.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10 text-left">
              <div className="bg-white/10 p-6 rounded-xl border border-white/10">
                <Calculator className="w-8 h-8 text-red-400 mb-4" />
                <h3 className="font-bold text-lg mb-2">Sauber ankaufen</h3>
                <p className="text-sm text-neutral-400">Eintauschwert marktbasiert berechnen – mit nachvollziehbarem Rechenweg für das Kundengespräch.</p>
              </div>
              <div className="bg-white/10 p-6 rounded-xl border border-white/10">
                <Car className="w-8 h-8 text-red-400 mb-4" />
                <h3 className="font-bold text-lg mb-2">Direkt inserieren</h3>
                <p className="text-sm text-neutral-400">Übernommene Fahrzeuge in Minuten auf BuyAuto listen – Occasionen und Leasingübernahmen.</p>
              </div>
              <div className="bg-white/10 p-6 rounded-xl border border-white/10">
                <Building2 className="w-8 h-8 text-red-400 mb-4" />
                <h3 className="font-bold text-lg mb-2">Eigene Microsite</h3>
                <p className="text-sm text-neutral-400">Dein Bestand auf deiner eigenen BuyAuto-Seite – teilbar, auffindbar, ohne Website-Projekt.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-red-600 hover:bg-red-700 text-white shadow-lg border-none">
                <Link href="/garage-plan">
                  <Building2 className="w-4 h-4 mr-2" />
                  Garagen-Angebot ansehen
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/20 hover:bg-white/10 hover:text-white bg-transparent text-white">
                <Link href="/inserat-erstellen">
                  Occasion inserieren
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
                Häufige Fragen (FAQ)
              </h2>
              <p className="text-neutral-600 text-lg">
                Eintauschwert, Ankaufspreis & Occasionsbewertung – kurz erklärt
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
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                    {faq.a}
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
              <strong>Disclaimer:</strong> Dieser Rechner dient lediglich als Orientierungshilfe und
              Modellrechnung. Der tatsächliche Wert eines Fahrzeugs hängt von Zustand, Ausstattung,
              Unfallhistorie, Nachfrage und Region ab und kann nur durch eine Begutachtung
              verbindlich bestimmt werden.
            </p>
            <p>
              BuyAuto.ch übernimmt keine Gewähr für die Richtigkeit der Ergebnisse. Keine
              Kauf- oder Finanzberatung.
            </p>
          </div>
        </section>

      </main>
    </>
  );
}
