import Head from "next/head";
import Link from "next/link";
import { Breadcrumbs } from "@/components/buyauto/Breadcrumbs";
import { CONTENT_LAST_UPDATED, formatSwissDate } from "@/lib/buyauto/contentDates";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BarChart3,
  Calculator,
  CheckCircle,
  Handshake,
  MapPin,
  MessageSquare,
  ScanLine,
  Sparkles,
  Tags,
  UserRound,
} from "lucide-react";

// Single source for the visible «Aktualisiert am» badge and the sitemap <lastmod>.
const LAST_UPDATED_ISO = CONTENT_LAST_UPDATED["/updates"];

type Update = {
  icon: typeof Calculator;
  title: string;
  body: string;
  href?: string;
  linkLabel?: string;
};

// The headline feature gets its own block above the grid; everything else is a card.
const HEADLINE: Update = {
  icon: Calculator,
  title: "Eintauschwert-Rechner",
  body:
    "Für Garagen: Eintauschwerte auf Basis echter Vergleichsinserate statt Bauchgefühl. Die automatische Suche findet passende Fahrzeuge am Markt und rechnet den Ankaufswert daraus ab – Vergleichspreise lassen sich jederzeit selbst anpassen. Die ersten 3 automatischen Suchen pro Monat sind gratis, manuelle Berechnungen bleiben in jedem Paket unbegrenzt.",
  href: "/eintauschwert-rechner",
  linkLabel: "Eintauschwert berechnen",
};

const UPDATES: Update[] = [
  {
    icon: ScanLine,
    title: "VIN-Decode – neu auch ohne Konto",
    body:
      "Fahrgestellnummer eingeben, Fahrzeugdaten übernehmen. Das funktioniert jetzt auch ohne Login, direkt im Inserat-Flow – du musst dich also nicht erst registrieren, um zu sehen, ob deine Daten sauber erkannt werden.",
  },
  {
    icon: Tags,
    title: "Ein Flow für Direktkauf und Leasingübernahme",
    body:
      "Statt zwei getrennter Wege gibt es jetzt einen einzigen Inserat-Flow: Du erfasst dein Fahrzeug und entscheidest unterwegs, ob du es als Direktkauf anbietest, als Leasingübernahme – oder beides kombinierst. Garagen können zusätzlich ein neues Leasingangebot hinterlegen.",
    href: "/inserat-erstellen",
    linkLabel: "Inserat erstellen",
  },
  {
    icon: Handshake,
    title: "Käuferauswahl beim Verkauf",
    body:
      "Wenn du dein Inserat als verkauft markierst, wählst du direkt aus, an wen. Der Käufer bekommt automatisch eine Bestätigung, und bei einer Leasingübernahme erhältst du eine Checkliste mit den Schritten, die für die Vertragsübertragung noch anstehen.",
  },
  {
    icon: UserRound,
    title: "«Privatanbieter» statt Klarname",
    body:
      "Auf Inseraten wird neu dein echter Name angezeigt – das schafft Vertrauen bei Interessenten. Wer das nicht möchte, schaltet im Dashboard einen Toggle um und erscheint stattdessen als «Privatanbieter». Deine Entscheidung, jederzeit änderbar.",
    href: "/dashboard",
    linkLabel: "Im Dashboard einstellen",
  },
  {
    icon: MessageSquare,
    title: "Message Center, überarbeitet",
    body:
      "Anfragen bleiben auf BuyAuto statt zwischen WhatsApp und E-Mail zu verschwinden. Auf dem Handy ist der Bereich jetzt deutlich grösser, das Gegenüber steht sichtbar im Gesprächskopf, und neue Nachrichten lösen wieder zuverlässig eine E-Mail-Benachrichtigung aus.",
  },
  {
    icon: MapPin,
    title: "Standort-Autocomplete für die ganze Schweiz",
    body:
      "PLZ oder Ort eintippen und auswählen – die Vorschläge decken jetzt alle Schweizer Gemeinden ab. Weniger Tippfehler im Inserat und sauberere Treffer, wenn jemand in seiner Region sucht.",
  },
  {
    icon: BarChart3,
    title: "Inserat-Statistiken",
    body:
      "Du siehst, wie oft dein Inserat angeschaut wurde. Damit lässt sich einschätzen, ob ein Fahrzeug zu wenig Sichtbarkeit hat oder ob eher der Preis das Thema ist.",
  },
  {
    icon: Sparkles,
    title: "Neue Garagen-Pakete",
    body:
      "Die Pakete für Garagen wurden neu geschnürt: klarere Abstufungen, ein festes Kontingent an Eintauschwert-Bewertungen pro Paket (Starter 25, Growth 100, Pro 400 pro Monat) und Preisangaben, die sich über alle Seiten hinweg decken.",
    href: "/preise",
    linkLabel: "Pakete ansehen",
  },
];

export default function UpdatesPage() {
  const HeadlineIcon = HEADLINE.icon;

  return (
    <>
      <Head>
        <title>Was ist neu bei BuyAuto – Updates & neue Funktionen | BuyAuto</title>
        <meta
          name="description"
          content="Alle Neuerungen auf BuyAuto auf einen Blick: Eintauschwert-Rechner für Garagen, VIN-Decode ohne Konto, Käuferauswahl beim Verkauf, Message Center und mehr."
        />
        <link rel="canonical" href="https://www.buyauto.ch/updates" />
        <meta property="og:title" content="Was ist neu bei BuyAuto – Updates & neue Funktionen" />
        <meta
          property="og:description"
          content="Eintauschwert-Rechner, VIN-Decode ohne Konto, Käuferauswahl beim Verkauf und mehr – alle Neuerungen auf BuyAuto."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.buyauto.ch/updates" />
      </Head>

      <div className="bg-neutral-50 min-h-screen">
        <main className="container py-10 sm:py-14">
          <Breadcrumbs
            className="mb-8"
            items={[
              { name: "Home", href: "/" },
              { name: "Updates", href: "/updates" },
            ]}
          />

          <header className="max-w-3xl">
            {LAST_UPDATED_ISO && (
              <p className="text-sm text-neutral-500 mb-3">
                Aktualisiert am {formatSwissDate(LAST_UPDATED_ISO)}
              </p>
            )}
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight text-neutral-900 mb-5">
              Was ist neu bei BuyAuto
            </h1>
            <p className="text-lg text-neutral-600 leading-relaxed">
              BuyAuto ist ein kleines Schweizer Projekt aus Schlieren – und wächst Schritt für
              Schritt. Hier findest du die Funktionen, die zuletzt dazugekommen sind, ohne
              Marketing-Nebel: was es macht, für wen es gedacht ist, und wo du es findest.
            </p>
          </header>

          {/* Headline feature — the biggest addition since dem letzten Update. */}
          <section className="mt-12 bg-white rounded-2xl shadow-lg border-2 border-primary p-6 md:p-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <HeadlineIcon className="w-6 h-6 text-primary" aria-hidden="true" />
              </div>
              <span className="text-sm font-semibold uppercase tracking-wide text-primary">
                Neu für Garagen
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-4">
              {HEADLINE.title}
            </h2>
            <p className="text-neutral-700 leading-relaxed max-w-3xl">{HEADLINE.body}</p>
            {HEADLINE.href && (
              <Button
                asChild
                className="mt-6 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30 transition-all duration-300 px-8 py-6 text-base font-semibold rounded-xl"
              >
                <Link href={HEADLINE.href}>
                  {HEADLINE.linkLabel}
                  <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
                </Link>
              </Button>
            )}
          </section>

          <section className="mt-12">
            <h2 className="text-2xl font-bold text-neutral-900 mb-6">Ausserdem neu</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {UPDATES.map((update) => {
                const Icon = update.icon;
                return (
                  <article
                    key={update.title}
                    className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm flex flex-col"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-primary/10 p-2.5 rounded-lg shrink-0">
                        <Icon className="w-5 h-5 text-primary" aria-hidden="true" />
                      </div>
                      <h3 className="font-bold text-neutral-900 text-lg">{update.title}</h3>
                    </div>
                    <p className="text-neutral-600 leading-relaxed flex-1">{update.body}</p>
                    {update.href && (
                      <Link
                        href={update.href}
                        className="mt-4 inline-flex items-center gap-1.5 text-primary font-semibold hover:underline"
                      >
                        {update.linkLabel}
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </Link>
                    )}
                  </article>
                );
              })}
            </div>
          </section>

          <section className="mt-12 bg-primary/5 border-l-4 border-primary p-8 rounded-r-xl shadow-sm max-w-3xl">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
              <h2 className="font-bold text-neutral-900 text-xl">Kurz und ehrlich</h2>
            </div>
            <p className="text-neutral-700 leading-relaxed">
              Hinter BuyAuto steckt aktuell ein One-Man-Team. Wenn dir etwas fehlt oder etwas nicht
              so funktioniert, wie du es erwartest, schreib mir einfach – das meiste hier oben ist
              genau so entstanden.
            </p>
            <p className="text-neutral-700 leading-relaxed mt-3">
              <a href="mailto:hello@buyauto.ch" className="text-primary font-semibold hover:underline">
                hello@buyauto.ch
              </a>
            </p>
          </section>

          <section className="mt-12 text-center">
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">Bereit für dein Inserat?</h2>
            <p className="text-neutral-600 mb-6 max-w-xl mx-auto">
              Fahrzeug erfassen, Angebotsart wählen, veröffentlichen – Leasingübernahme und
              Direktkauf laufen über denselben Flow.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                asChild
                className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30 transition-all duration-300 px-8 py-6 text-base font-semibold rounded-xl"
              >
                <Link href="/inserat-erstellen">
                  Jetzt Inserat erstellen
                  <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="px-8 py-6 text-base font-semibold rounded-xl"
              >
                <Link href="/suche">Fahrzeuge ansehen</Link>
              </Button>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}

// ISR, wie bei den übrigen Content-Seiten, damit /updates im Prerender-Pfad landet.
export const getStaticProps = async () => {
  return { props: {}, revalidate: 300 };
};
