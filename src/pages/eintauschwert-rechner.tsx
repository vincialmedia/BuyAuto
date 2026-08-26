import Head from "next/head";
import { CONTENT_LAST_UPDATED, formatSwissDate } from "@/lib/buyauto/contentDates";
import { GARAGE_PLANS } from "@/lib/buyauto/garagePlans";
import { FREE_MONTHLY_LIMIT } from "@/lib/buyauto/valuationQuota";
import Link from "next/link";
import {
  Check,
  Info,
  ChevronRight,
  Calculator,
  Search,
  Percent,
  Banknote,
  Building2,
  Scale,
  Gauge,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import dynamic from "next/dynamic";

// Mirrors CalculatorSkeleton in EintauschwertRechner.tsx (duplicated here so the
// calculator chunk stays code-split); the calculator renders the same skeleton until
// its own isClient effect runs, so the chunk-load swap causes no layout shift.
const CalculatorSkeleton = () => (
  <div className="w-full space-y-8 animate-pulse" aria-hidden="true">
    {/* Presets bar */}
    <div className="h-24 sm:h-16 bg-neutral-50 rounded-xl border border-neutral-200" />
    {/* Step-1 vehicle card */}
    <div className="h-[560px] max-w-2xl mx-auto bg-white rounded-xl border border-neutral-200 shadow-sm" />
  </div>
);

// The calculator is fully client-gated (auth + quota state), so load it as a
// client-only chunk instead of shipping it in the initial page bundle.
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

// Honest last-edit date. Maintained in contentDates.ts, shared with the sitemap
// lastmod and the Article schema dateModified below.

// Single source of truth for the FAQ: feeds BOTH the visible accordion and the FAQPage
// JSON-LD, so the schema can never drift from what the user (and Google) actually sees.
const FAQ_ITEMS = [
  {
    q: "Was ist der Eintauschwert eines Autos?",
    a: "Der Eintauschwert (auch Ankaufspreis oder Händlereinkaufspreis) ist der Betrag, den eine Garage für ein Fahrzeug bezahlt, das sie in Eintausch nimmt. Er liegt unter dem Marktwert (Verkaufspreis), weil die Garage Aufbereitung, Garantie, Standzeit und ihre Marge einrechnen muss.",
  },
  {
    q: "Wie viel liegt der Eintauschwert unter dem Marktwert?",
    a: "Als Faustregel liegt der Eintauschwert bei 80–90% des Marktwerts, also 10–20% darunter. Bei Fahrzeugen mit hohem Aufbereitungsbedarf, langer erwarteter Standzeit oder schwacher Nachfrage kann der Abschlag auch grösser sein.",
  },
  {
    q: "Ist die Eintauschwert-Berechnung kostenlos?",
    // Quotas interpolated from the plan config — this answer had drifted once
    // already when the tiers changed underneath a hardcoded copy of the numbers.
    a: `Die ersten ${FREE_MONTHLY_LIMIT} automatischen Suchen pro Monat sind gratis. Danach brauchst du ein Garagen-Paket: Starter ${GARAGE_PLANS.starter.valuationsPerMonth}, Growth ${GARAGE_PLANS.growth.valuationsPerMonth} und Pro ${GARAGE_PLANS.pro.valuationsPerMonth} automatische Suchen pro Monat. Manuelle Berechnungen (eigene Vergleichspreise eintragen) sind in jedem Paket unbegrenzt gratis.`,
  },
  {
    q: "Woher kommen die Vergleichspreise bei der automatischen Suche?",
    a: "Der Rechner durchsucht öffentlich zugängliche Inserate auf Schweizer Occasions-Portalen (z.B. AutoScout24, tutti oder Comparis) nach deinem Modell und Jahrgang und übernimmt bis zu 5 Treffer mit Preis und Kilometerstand. Jeder Treffer ist verlinkt und editierbar – du behältst die Kontrolle über die Vergleichsbasis. Findet die Suche nichts Passendes, erfasst du die Inserate einfach manuell.",
  },
  {
    q: "Soll ich die Marge in Prozent oder als Fixbetrag rechnen?",
    a: "Beides ist verbreitet – darum kann der Rechner beides. Eine prozentuale Marge (üblich: 10–20% vom Marktwert) skaliert automatisch mit dem Fahrzeugwert. Ein Fixbetrag (z.B. 1'500 CHF pro Fahrzeug) eignet sich für günstige Occasionen, bei denen eine Prozent-Marge zu wenig Deckungsbeitrag ergibt. Kosten wie Aufbereitung, Garantie-Rückstellung und Standzeit rechnest du dagegen immer als Fixbeträge, weil sie kaum vom Fahrzeugwert abhängen.",
  },
  {
    q: "Wie viele Vergleichsfahrzeuge brauche ich für eine belastbare Occasionsbewertung?",
    a: "3–5 vergleichbare Inserate (gleiches Modell, ähnliches Alter, ähnliche Ausstattung) reichen in der Praxis. Der Rechner nutzt den Median der km-bereinigten Preise – so verzerrt ein einzelnes überteuertes oder verschleudertes Inserat das Ergebnis nicht.",
  },
  {
    q: "Ersetzt der Rechner eine Eurotax-Bewertung?",
    a: "Nein, er ergänzt sie. Eurotax liefert einen katalogbasierten Richtwert (kostenpflichtig), unser Rechner arbeitet mit echten, aktuellen Inseratspreisen aus deiner Region. Viele Händler nutzen bewusst beide Quellen: Katalogwert als Anker, Marktpreise als Realitätscheck.",
  },
  {
    q: "Was ist der Unterschied zwischen Eintausch und Inzahlungnahme?",
    a: "Es ist dasselbe: In der Schweiz spricht man vom Eintausch (Eintauschwert), in Deutschland von der Inzahlungnahme. Gemeint ist immer, dass die Garage das bisherige Auto des Kunden übernimmt und den Wert an den Kauf des nächsten Fahrzeugs anrechnet.",
  },
];

const FACTORS = [
  { label: "Kilometerstand", text: "Der wichtigste Werthebel nach dem Modell. Der Rechner gleicht die km-Differenz zu den Vergleichsfahrzeugen automatisch an." },
  { label: "Alter & Jahrgang", text: "Erstzulassung und Modellgeneration bestimmen die Basis. Jüngere Fahrzeuge verlieren pro Jahr absolut mehr Wert." },
  { label: "Zustand & Aufbereitung", text: "Kratzer, Innenraum, anstehende MFK: Was du aufbereiten musst, ziehst du als Kosten ab." },
  { label: "Ausstattung & Motorisierung", text: "Ausstattungslinie, Getriebe und Antrieb (Benzin, Diesel, Hybrid) verschieben den Marktwert spürbar." },
  { label: "Nachfrage & Saison", text: "Gefragte Modelle stehen kürzer – tiefere Standzeit-Kosten, höherer Ankaufspreis." },
  { label: "Historie", text: "Serviceheft, Unfallfreiheit und Anzahl Halter beeinflussen Marktwert und Gewährleistungsrisiko." },
];

export async function getStaticProps() {
  return {
    props: {
      updatedDate: formatSwissDate(CONTENT_LAST_UPDATED["/eintauschwert-rechner"]),
    },
    revalidate: 86400,
  };
}

// Single source for the visible «Aktualisiert am» badge and the Article dateModified.
const LAST_UPDATED_ISO = CONTENT_LAST_UPDATED["/eintauschwert-rechner"];

export default function EintauschwertRechnerPage({ updatedDate }: PageProps) {
  const canonical = "https://www.buyauto.ch/eintauschwert-rechner";

  // FAQ schema generated from the same array the accordion renders.
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Eintauschwert-Rechner",
    url: canonical,
    applicationCategory: "FinanceApplication",
    operatingSystem: "All",
    offers: { "@type": "Offer", price: "0", priceCurrency: "CHF" },
    description:
      "Gratis-Rechner für Garagen und Händler: Eintauschwert und Ankaufspreis aus Vergleichsinseraten berechnen – inklusive Aufbereitung, Garantie, Standzeit und Marge.",
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.buyauto.ch/" },
      { "@type": "ListItem", position: 2, name: "Für Garagen", item: "https://www.buyauto.ch/garage-plan" },
      { "@type": "ListItem", position: 3, name: "Eintauschwert-Rechner", item: canonical },
    ],
  };

  return (
    <>
      <Head>
        <title>Eintauschwert berechnen (Schweiz): Ankaufsrechner für Garagen | BuyAuto</title>
        <meta
          name="description"
          content="Eintauschwert & Ankaufspreis in 2 Minuten berechnen: Marktwert aus echten Schweizer Vergleichsinseraten, minus Aufbereitung, Garantie, Standzeit & Marge. Gratis für Garagen & Händler."
        />
        <link rel="canonical" href={canonical} />
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
              dateModified: LAST_UPDATED_ISO,
              mainEntityOfPage: canonical,
            }),
          }}
        />

        {/* Open Graph */}
        <meta property="og:title" content="Eintauschwert berechnen (Schweiz): Ankaufsrechner für Garagen" />
        <meta property="og:description" content="Marktwert aus echten Schweizer Vergleichsinseraten, minus Aufbereitung, Garantie, Standzeit & Marge. Gratis für Garagen & Händler." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonical} />
        <meta property="og:site_name" content="BuyAuto" />

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      </Head>

      <main className="bg-neutral-50 min-h-screen">
        {/* --- COMPACT HEADER (tool is the hero — no big image above it) --- */}
        <section className="bg-gradient-to-b from-neutral-900 to-neutral-800 text-white pt-20 pb-8 px-4">
          <div className="max-w-3xl mx-auto text-center">
            {/* Breadcrumb — real anchors, feeds BreadcrumbList */}
            <nav aria-label="Brotkrumen" className="mb-5 flex items-center justify-center gap-1.5 text-xs text-neutral-400">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight className="w-3 h-3" aria-hidden="true" />
              <Link href="/garage-plan" className="hover:text-white transition-colors">Für Garagen</Link>
              <ChevronRight className="w-3 h-3" aria-hidden="true" />
              <span className="text-neutral-200">Eintauschwert-Rechner</span>
            </nav>

            <div className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-1.5 rounded-full text-xs font-semibold mb-5">
              <Calculator className="w-3.5 h-3.5" />
              <span>Ankaufs-Rechner · Aktualisiert am {updatedDate}</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight mb-4">
              Eintauschwert berechnen
            </h1>
            <p className="text-lg md:text-xl text-neutral-300 leading-relaxed mb-6 max-w-2xl mx-auto">
              Der Eintauschwert ist der Preis, den die Garage beim Eintausch zahlt: Marktwert minus
              Aufbereitung, Garantie-Rückstellung, Standzeit und Marge – als Faustregel 80–90% des
              Marktwerts. Gib Marke, Modell, Jahrgang und Kilometerstand ein; der Rechner zieht echte
              Vergleichsinserate bei und liefert in 2 Minuten den Ankaufspreis samt Rechenweg fürs
              Kundengespräch.
            </p>

            {/* Trust row */}
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-neutral-300">
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-red-400" /> Kostenlos starten</span>
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-red-400" /> Ohne Anmeldung testen</span>
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-red-400" /> Echte CH-Inseratspreise</span>
            </div>
          </div>
        </section>

        {/* --- THE CALCULATOR (above the fold) --- */}
        <section id="rechner" className="py-10 px-4 bg-white scroll-mt-20 border-b border-neutral-100">
          <div className="max-w-5xl mx-auto">
            <EintauschwertRechner />
          </div>
        </section>

        {/* --- HOW IT WORKS --- */}
        <section id="so-funktionierts" className="py-16 px-4 bg-neutral-50 scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-8 flex items-center gap-3">
              <Search className="w-7 h-7 text-red-600" />
              So funktioniert die Eintauschwert-Berechnung
            </h2>
            <ol className="grid grid-cols-1 md:grid-cols-3 gap-4 list-none pl-0">
              <li className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
                <span className="text-red-600 font-bold text-2xl">1.</span>
                <p className="mt-2 text-neutral-700"><strong>Fahrzeug eingeben:</strong> Marke, Modell, Jahrgang, Kilometerstand. Der Rechner sucht automatisch bis zu 5 passende Inserate – oder du erfasst sie manuell.</p>
              </li>
              <li className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
                <span className="text-red-600 font-bold text-2xl">2.</span>
                <p className="mt-2 text-neutral-700"><strong>Abzüge eintragen:</strong> Aufbereitung, Garantie-Rückstellung, Standzeit und deine Marge – die Vorschläge kannst du überschreiben.</p>
              </li>
              <li className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
                <span className="text-red-600 font-bold text-2xl">3.</span>
                <p className="mt-2 text-neutral-700"><strong>Ankaufspreis erhalten:</strong> Marktwert, transparenter Rechenweg und gerundetes Angebot – bereit fürs Kundengespräch.</p>
              </li>
            </ol>
          </div>
        </section>

        {/* --- METHODOLOGY --- */}
        <section id="methode" className="py-16 px-4 bg-white scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-6">
              Wie wird der Eintauschwert berechnet?
            </h2>
            <div className="bg-red-50 border-l-4 border-red-600 p-6 rounded-r-xl mb-6">
              <p className="text-lg text-neutral-800 font-semibold">
                Eintauschwert = Marktwert − Aufbereitung − Garantie-Rückstellung − Standzeit − Marge
              </p>
            </div>
            <div className="prose prose-lg text-neutral-700 max-w-none">
              <p>
                Der <strong>Marktwert</strong> ist der Median von 3–5 vergleichbaren Inseraten. Hat ein
                Vergleichsauto mehr oder weniger Kilometer als deins, wird sein Preis automatisch
                angeglichen (10 Rappen pro Kilometer Differenz – z.B. 20&apos;000 km ≈ CHF 2&apos;000).
                Der Median statt des Durchschnitts sorgt dafür, dass ein einzelnes
                überteuertes oder verschleudertes Inserat das Ergebnis nicht verzerrt.
              </p>
              <p>
                Davon ziehst du deine <strong>echten Kosten</strong> ab (Aufbereitung 300–1'500 CHF,
                Garantie-Rückstellung 300–800 CHF, Standzeit & Kapitalbindung) sowie deine{" "}
                <strong>Marge</strong> (branchenüblich 10–20% vom Marktwert oder ein fixes Ertragsziel).
                Übrig bleibt ein fairer, verteidigbarer Ankaufspreis – den Rechenweg kannst du dem
                Kunden offen zeigen.
              </p>
            </div>
          </div>
        </section>

        {/* --- FACTORS --- */}
        <section id="faktoren" className="py-16 px-4 bg-neutral-50 scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-8 flex items-center gap-3">
              <Gauge className="w-7 h-7 text-red-600" />
              Welche Faktoren beeinflussen den Eintauschwert?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {FACTORS.map((f) => (
                <div key={f.label} className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
                  <h3 className="font-bold text-neutral-900 mb-1">{f.label}</h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- PERCENT OR FIXED --- */}
        <section id="prozent-oder-fix" className="py-16 px-4 bg-white scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-8 flex items-center gap-3">
              <Scale className="w-7 h-7 text-red-600" />
              Marge: Prozent oder Fixbetrag?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <span className="text-neutral-700">Sinnvoll ab ca. 10'000 CHF Fahrzeugwert – die Marge deckt Risiko und Aufwand proportional.</span>
                  </li>
                  <li className="flex gap-3">
                    <Check className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <span className="text-neutral-700">Vorsicht bei teuren Fahrzeugen: 15% von 60'000 CHF sind 9'000 CHF – das Angebot wird schnell unattraktiv.</span>
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
                    <span className="text-neutral-700"><strong>Ertragsziel pro Auto</strong> (z.B. 1'500–2'500 CHF) – einfach zu kalkulieren und zu kontrollieren.</span>
                  </li>
                  <li className="flex gap-3">
                    <Check className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <span className="text-neutral-700">Besser bei günstigen Occasionen: 12% von 8'000 CHF wären nur 960 CHF – zu wenig für den gleichen Aufwand.</span>
                  </li>
                  <li className="flex gap-3">
                    <Check className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <span className="text-neutral-700">Kombinier-Tipp: Fixbetrag als Untergrenze, Prozent als Standard.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* --- EINTAUSCH VS VERKAUF --- */}
        <section id="vs-verkaufswert" className="py-16 px-4 bg-neutral-50 scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-6">
              Eintauschwert vs. Verkaufswert
            </h2>
            <div className="prose prose-lg text-neutral-700 max-w-none">
              <p>
                Der <strong>Verkaufswert</strong> (Marktwert) ist der Preis, zu dem das Fahrzeug am
                Markt inseriert wird. Der <strong>Eintauschwert</strong> ist der Betrag, den du als
                Garage dafür bezahlst – die Differenz ist genau die Summe aus Aufbereitung, Garantie,
                Standzeit und Marge. Diese Spanne (typisch 10–20%) ist keine Willkür, sondern deine
                Kalkulation. Wer sie dem Kunden transparent zeigt, verhandelt souveräner als mit einer
                Zahl aus dem Bauch.
              </p>
            </div>
          </div>
        </section>

        {/* --- COMPARISON --- */}
        <section id="vergleich" className="py-16 px-4 bg-white scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-6">
              Rechner vs. Eurotax, auto-i-dat & Gratis-Bewertungen
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-neutral-50 p-6 rounded-xl border border-neutral-200 shadow-sm">
                <h3 className="font-bold text-lg mb-2 text-neutral-900">Katalog-Tools</h3>
                <p className="text-sm text-neutral-600">
                  Eurotax & Co. liefern Richtwerte aus historischen Daten – im Abo oder pro Bewertung
                  kostenpflichtig. Stark als Anker, aber Marktpreise schwanken je nach Region und Saison.
                </p>
              </div>
              <div className="bg-neutral-50 p-6 rounded-xl border border-neutral-200 shadow-sm">
                <h3 className="font-bold text-lg mb-2 text-neutral-900">Gratis-Bewertungen</h3>
                <p className="text-sm text-neutral-600">
                  Verbraucher-Tools schätzen den Verkaufspreis für Private – ohne Händler-Abzüge.
                  Für den Ankauf fehlt der ganze Rechenweg von Marktwert zu Ankaufspreis.
                </p>
              </div>
              <div className="bg-red-50 p-6 rounded-xl border border-red-200 shadow-sm">
                <h3 className="font-bold text-lg mb-2 text-red-900">Dieser Rechner</h3>
                <p className="text-sm text-red-900/80">
                  Marktbasiert und für den Händler-Alltag gebaut: echte Inseratspreise rein,
                  deine Kosten und Marge drauf – transparenter Eintauschwert raus.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* --- GARAGE CTA --- */}
        <section id="garagen" className="py-16 px-4 bg-gradient-to-br from-neutral-900 to-neutral-800 text-white scroll-mt-20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Für Garagen: vom Ankauf bis zum Verkauf</h2>
            <p className="text-lg text-neutral-300 mb-8 max-w-2xl mx-auto">
              Im Garagen-Paket hast du den Rechner direkt in deinem Konto, ein festes
              Bewertungs-Kontingent pro Monat, inserierst Occasionen und bekommst eine eigene
              Garagen-Seite mit deinem ganzen Bestand.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10 text-left">
              <div className="bg-white/10 p-6 rounded-xl border border-white/10">
                <Calculator className="w-8 h-8 text-red-400 mb-4" />
                <h3 className="font-bold text-lg mb-2">Sauber ankaufen</h3>
                <p className="text-sm text-neutral-400">Eintauschwert marktbasiert berechnen – mit Rechenweg fürs Kundengespräch, auch im Dashboard.</p>
              </div>
              <div className="bg-white/10 p-6 rounded-xl border border-white/10">
                <ShieldCheck className="w-8 h-8 text-red-400 mb-4" />
                <h3 className="font-bold text-lg mb-2">Bewertungen im Paket</h3>
                <p className="text-sm text-neutral-400">25 bis 400 automatische Suchen pro Monat, je nach Garagen-Paket – manuelle Berechnungen immer ohne Limit.</p>
              </div>
              <div className="bg-white/10 p-6 rounded-xl border border-white/10">
                <Building2 className="w-8 h-8 text-red-400 mb-4" />
                <h3 className="font-bold text-lg mb-2">Eigene Garagen-Seite</h3>
                <p className="text-sm text-neutral-400">Dein ganzer Fahrzeugbestand auf einer eigenen Seite – zum Teilen, bei Google auffindbar, ohne Website-Projekt.</p>
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
                <Link href="/preise">Preise vergleichen <ArrowRight className="w-4 h-4 ml-2" /></Link>
              </Button>
            </div>
          </div>
        </section>

        {/* --- FAQ --- */}
        <section id="faq" className="py-16 px-4 bg-neutral-50 scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-3">
                Häufige Fragen zum Eintauschwert
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

        {/* --- RELATED --- */}
        <section className="py-14 px-4 bg-white border-t border-neutral-100">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
              <Info className="w-5 h-5 text-red-600" />
              Weitere Rechner & Ratgeber
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link href="/auto-abo-vs-leasing-kosten" className="flex items-center justify-between gap-2 bg-neutral-50 rounded-xl border border-neutral-200 px-5 py-4 text-neutral-700 hover:border-red-300 hover:text-red-600 transition-colors group">
                <span className="font-medium">Auto-Abo vs. Leasing: Kostenrechner</span>
                <ChevronRight className="w-4 h-4 text-red-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link href="/leasinguebernahme-kosten" className="flex items-center justify-between gap-2 bg-neutral-50 rounded-xl border border-neutral-200 px-5 py-4 text-neutral-700 hover:border-red-300 hover:text-red-600 transition-colors group">
                <span className="font-medium">Was kostet eine Leasingübernahme?</span>
                <ChevronRight className="w-4 h-4 text-red-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link href="/suche?dealType=direct_purchase" className="flex items-center justify-between gap-2 bg-neutral-50 rounded-xl border border-neutral-200 px-5 py-4 text-neutral-700 hover:border-red-300 hover:text-red-600 transition-colors group">
                <span className="font-medium">Occasionen auf BuyAuto durchsuchen</span>
                <ChevronRight className="w-4 h-4 text-red-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link href="/garage-plan" className="flex items-center justify-between gap-2 bg-neutral-50 rounded-xl border border-neutral-200 px-5 py-4 text-neutral-700 hover:border-red-300 hover:text-red-600 transition-colors group">
                <span className="font-medium">BuyAuto für Garagen & Händler</span>
                <ChevronRight className="w-4 h-4 text-red-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </section>

        {/* --- DISCLAIMER --- */}
        <section id="disclaimer" className="py-12 px-4 bg-neutral-100 text-sm text-neutral-500">
          <div className="max-w-4xl mx-auto text-center space-y-2">
            <p>
              <strong>Disclaimer:</strong> Dieser Rechner dient als Orientierungshilfe und
              Modellrechnung. Der tatsächliche Wert eines Fahrzeugs hängt von Zustand, Ausstattung,
              Unfallhistorie, Nachfrage und Region ab und kann nur durch eine Begutachtung
              verbindlich bestimmt werden.
            </p>
            <p>BuyAuto.ch übernimmt keine Gewähr für die Richtigkeit der Ergebnisse. Keine Kauf- oder Finanzberatung.</p>
          </div>
        </section>
      </main>
    </>
  );
}
