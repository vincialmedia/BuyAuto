import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { Check, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const includedFeatures = [
  "Garage-Profilseite + Inventar-Seite",
  "Inserate erstellen & verwalten",
  "VIN-PreFill (wo verfügbar)",
  "Leasing-Rechner direkt im Inserat",
  "Deal-Chat pro Fahrzeug (Chat + Dokumente)",
  "Basis-Statistiken: Views & Anfragen",
];

const packages = [
  {
    code: "starter",
    name: "Starter",
    price: "CHF 149",
    period: "/ Monat",
    limit: "bis zu 15 Inserate",
    premiumIncluded: "1 Premium Inserat / Monat inklusive",
    features: ["Alles aus 'Inklusive'"],
    cta: "Starter wählen",
    popular: false,
  },
  {
    code: "growth",
    name: "Growth",
    price: "CHF 349",
    period: "/ Monat",
    limit: "bis zu 50 Inserate",
    premiumIncluded: "5 Premium Inserate / Monat inklusive",
    features: [
      "Alles aus Starter",
      "Done-for-you Onboarding",
      "Du schickst uns dein Inventar, wir erledigen den Rest.",
    ],
    cta: "Growth wählen",
    popular: true,
  },
  {
    code: "pro",
    name: "Pro",
    price: "CHF 599",
    period: "/ Monat",
    limit: "bis zu 100 Inserate",
    premiumIncluded: "10 Premium Inserate / Monat inklusive",
    features: ["Alles aus Growth", "Done-for-you Onboarding (priorisiert)"],
    cta: "Pro wählen",
    popular: false,
  },
];

const onboardingSteps = [
  {
    step: 1,
    title: "Du schickst uns dein Inventar",
    items: [
      "Fahrzeugliste (CSV/Excel oder Link)",
      "Fotos (Ordner/Drive/WeTransfer)",
      "Welche Fahrzeuge leasingfähig sind",
      "Leasing-Konditionen (Monate, KM, Anzahlung, Rate/Zins falls vorhanden)",
    ],
  },
  {
    step: 2,
    title: "Wir erstellen die Inserate",
    items: [
      "Wir übernehmen Struktur, Grunddaten, Bilder-Reihenfolge und setzen den Leasing-Rechner korrekt.",
    ],
  },
  {
    step: 3,
    title: "Du bekommst Anfragen",
    items: [
      "Anfragen landen im Deal-Chat pro Fahrzeug – inkl. Dokumentenversand.",
    ],
  },
];

const faqs = [
  {
    question: "Was zählt als Inserat?",
    answer:
      "Ein Inserat = ein Fahrzeug. Jedes aktive Fahrzeug zählt zu deinem Limit.",
  },
  {
    question: "Kann ich upgraden/downgraden?",
    answer:
      "Ja, jederzeit. Upgrades sind sofort aktiv. Downgrades greifen am Ende der aktuellen Abrechnungsperiode.",
  },
  {
    question: "Gibt es eine Mindestlaufzeit?",
    answer:
      "Nein. Alle Pakete sind monatlich kündbar. Keine Setup-Gebühren, keine Mindestlaufzeit.",
  },
  {
    question: "Wie funktioniert der Deal-Chat?",
    answer:
      "Jedes Inserat hat einen eigenen Chat. Interessenten können Fragen stellen, Dokumente anfragen. Du kannst direkt Verträge, Gutachten etc. hochladen – alles in einem Thread.",
  },
  {
    question: "Welche Daten braucht ihr fürs Onboarding?",
    answer:
      "Fahrzeugliste (Excel/CSV), Fotos, Leasing-Infos (welche Autos leasingfähig sind + Konditionen). Wir melden uns nach deiner Anmeldung mit einem Onboarding-Formular.",
  },
  {
    question: "Garantiert BuyAuto Leads?",
    answer:
      "Nein. BuyAuto ist ein Marktplatz – keine Lead-Garantie. Du bekommst eine saubere Präsenz, Tools (VIN-PreFill, Leasing-Rechner, Deal-Chat) und direkten Kanal für Anfragen. Leads hängen von deinem Inventar, Preisen und Marktlage ab.",
  },
  {
    question: "Wie setze ich Premium Inserate ein?",
    answer:
      "Premium Inserate bekommen ein Badge + visuelle Hervorhebung. Sie können in Premium-Sektionen (z.B. Startseite) erscheinen – keine garantierte Suchplatzierung. Nutze Premium für deine wichtigsten Fahrzeuge.",
  },
  {
    question: "Welche Zahlungsarten gibt es?",
    answer:
      "Kreditkarte (Visa, Mastercard, Amex). Zahlung wird monatlich automatisch abgebucht.",
  },
  {
    question: "Was passiert bei Kündigung?",
    answer:
      "Deine Inserate bleiben bis zum Ende der bezahlten Periode aktiv. Danach werden sie automatisch deaktiviert. Du behältst Zugriff auf deine Daten und kannst sie exportieren.",
  },
];

export default function GaragePreisePage() {
  const [email, setEmail] = useState("");

  return (
    <>
      <Head>
        <title>BuyAuto – Preise für Garagen</title>
        <meta
          name="description"
          content="Pakete für Garagen: Inserate, VIN-PreFill, Leasing-Rechner und Deal-Chat pro Fahrzeug. Done-for-you Onboarding ab Growth."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
        {/* Hero */}
        <section className="relative pt-32 pb-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-neutral-900 mb-6">
              Preise für Garagen
            </h1>
            <p className="text-3xl md:text-4xl font-bold text-neutral-800 mb-4">
              Mehr Anfragen. Weniger Aufwand.
            </p>
            <p className="text-xl text-neutral-600 mb-3 max-w-3xl mx-auto">
              Dein Inventar online – mit VIN-PreFill, Leasing-Rechner und
              Deal-Chat pro Fahrzeug.
            </p>
            <p className="text-base text-neutral-500 mb-8 max-w-2xl mx-auto">
              Marketplace für Direktkauf & Leasing – mit klaren Inseraten und
              direktem Kontakt.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" className="text-lg px-8" asChild>
                <Link href="/auth?mode=register&type=garage">
                  Jetzt starten
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8"
                onClick={() => {
                  document
                    .getElementById("packages")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Preise ansehen
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {[
                "VIN-PreFill (wo verfügbar)",
                "Leasing-Rechner im Inserat",
                "Deal-Chat inkl. Dokumentenversand",
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-center gap-2 text-neutral-700"
                >
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Included in every package */}
        <section className="py-20 px-4 bg-neutral-50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-neutral-900 mb-4">
              In jedem Paket inklusive
            </h2>
            <p className="text-center text-neutral-600 mb-12 max-w-2xl mx-auto">
              Diese Features bekommst du in allen Paketen – von Starter bis
              Pro.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {includedFeatures.map((feature, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 bg-white p-6 rounded-2xl shadow-sm"
                >
                  <Check className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-neutral-700 font-medium">
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
              <p className="text-sm text-amber-900">
                <strong>Wichtig:</strong> Leads können nicht garantiert werden
                – aber du bekommst eine saubere Präsenz + direkten Kanal für
                Anfragen.
              </p>
            </div>
          </div>
        </section>

        {/* Packages */}
        <section id="packages" className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-bold text-center text-neutral-900 mb-4">
              Wähle dein Paket
            </h2>
            <p className="text-center text-neutral-600 mb-16 max-w-2xl mx-auto">
              Transparent, fair, monatlich kündbar.
            </p>

            {/* Main 3 cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              {packages.map((pkg) => (
                <div
                  key={pkg.code}
                  className={`relative bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-shadow duration-300 p-8 flex flex-col ${
                    pkg.popular ? "ring-2 ring-primary" : ""
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-sm font-bold px-4 py-1 rounded-full">
                      Meist gewählt
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-neutral-900 mb-2">
                      {pkg.name}
                    </h3>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-4xl font-bold text-neutral-900">
                        {pkg.price}
                      </span>
                      <span className="text-neutral-600">{pkg.period}</span>
                    </div>
                    <p className="text-sm text-neutral-600 font-medium">
                      {pkg.limit}
                    </p>
                    <p className="text-sm text-primary font-semibold mt-1">
                      {pkg.premiumIncluded}
                    </p>
                  </div>

                  <div className="flex-1 mb-6">
                    <ul className="space-y-3">
                      {pkg.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-neutral-700">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    size="lg"
                    className="w-full h-12"
                    variant={pkg.popular ? "default" : "outline"}
                    asChild
                  >
                    <Link href="/auth?mode=register&type=garage">
                      {pkg.cta}
                    </Link>
                  </Button>
                </div>
              ))}
            </div>

            {/* 100+ floating bar */}
            <div className="bg-gradient-to-r from-neutral-800 to-neutral-900 rounded-3xl shadow-2xl p-8 text-white">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">
                    100+ Inserate oder Spezialanforderungen?
                  </h3>
                  <p className="text-neutral-300">
                    Für grosse Bestände, mehrere Standorte oder
                    Spezialprozesse. Individuelles Angebot auf Anfrage.
                  </p>
                </div>
                <Button
                  size="lg"
                  variant="secondary"
                  className="flex-shrink-0 h-12 px-8"
                  asChild
                >
                  <a href="mailto:kontakt@buyauto.ch">
                    <Mail className="w-5 h-5 mr-2" />
                    Kontakt aufnehmen
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Premium section */}
        <section className="py-20 px-4 bg-neutral-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-neutral-900 mb-6">
              Was ist ein Premium Inserat?
            </h2>
            <p className="text-neutral-600 mb-8 text-center max-w-2xl mx-auto">
              Ein Premium Inserat ist visuell hervorgehoben (Premium-Badge +
              Highlight) und kann zusätzlich in separaten Premium-Bereichen
              erscheinen (z.B. Startseite / Premium-Sektion), ohne dass wir
              eine bessere Suchplatzierung versprechen.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[
                "Premium-Badge + visuelle Hervorhebung",
                "Optional: Platzierung in Premium-Sektionen, wenn verfügbar",
                "Monatliches Premium-Kontingent je nach Paket",
              ].map((item, i) => (
                <div
                  key={i}
                  className="bg-white p-6 rounded-2xl shadow-sm flex items-start gap-3"
                >
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-neutral-700">{item}</span>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
              <p className="text-sm text-blue-900">
                <strong>Hinweis:</strong> Premium = Hervorhebung, nicht
                garantierte Leads.
              </p>
            </div>
          </div>
        </section>

        {/* Done-for-you onboarding */}
        <section className="py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-neutral-900 mb-4">
              So bist du schnell live
            </h2>
            <p className="text-center text-neutral-600 mb-12 max-w-2xl mx-auto">
              Mit Done-for-you Onboarding (ab Growth) übernehmen wir das Setup
              für dich.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {onboardingSteps.map((step) => (
                <div
                  key={step.step}
                  className="bg-white rounded-2xl shadow-lg p-8"
                >
                  <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold mb-4">
                    {step.step}
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900 mb-4">
                    {step.title}
                  </h3>
                  <ul className="space-y-2">
                    {step.items.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-neutral-600"
                      >
                        <ArrowRight className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 px-4 bg-neutral-50">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-neutral-900 mb-12">
              Häufige Fragen
            </h2>

            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`item-${i}`}
                  className="bg-white rounded-2xl shadow-sm px-6"
                >
                  <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:text-primary py-6">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-neutral-600 pb-6">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-primary to-primary/80 rounded-3xl shadow-2xl p-12 text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Bereit, dein Inventar live zu bringen?
            </h2>
            <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
              Monatlich kündbar. Keine Setup-Falle. Starte noch heute.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                className="text-lg px-8 h-12"
                asChild
              >
                <Link href="/auth?mode=register&type=garage">
                  Jetzt starten
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 h-12 bg-white/10 text-white border-white/30 hover:bg-white/20"
                asChild
              >
                <a href="mailto:kontakt@buyauto.ch">Kontakt aufnehmen</a>
              </Button>
            </div>

            <p className="text-sm text-white/70 mt-8">
              Monatlich kündbar. Keine Setup-Falle.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}