import Head from "next/head";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CarFront,
  ClipboardList,
  Handshake,
  Mail,
  MessageCircle,
  Repeat,
  UserCheck,
  Wallet,
} from "lucide-react";

import { Breadcrumbs } from "@/components/buyauto/Breadcrumbs";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CONTENT_LAST_UPDATED, formatSwissDate } from "@/lib/buyauto/contentDates";

// Single source for the visible «Aktualisiert am» hint and the sitemap lastmod.
const LAST_UPDATED_ISO = CONTENT_LAST_UPDATED["/fuer-garagen"];

// Direct-outreach landing page for garages (cold email / calls). Kept out of the
// consumer nav on purpose — it is linked from the footer and the homepage's
// garage pointer. Conversion first, but fully index-ready.

// Single source of truth for the FAQ: feeds BOTH the visible accordion and the
// FAQPage JSON-LD, so the structured data can never drift from the page text.
// `linkText` must appear verbatim in `a` — the answer is split on it to render
// that phrase as an internal link without duplicating the copy.
type Faq = { q: string; a: string; href?: string; linkText?: string };

const FAQS: Faq[] = [
  {
    q: "Wer prüft die Bonität des Übernehmers?",
    a: "Die Leasinggesellschaft, wie bei jedem neuen Leasingvertrag. BuyAuto ersetzt diese Prüfung nicht – erst nach der Bewilligung durch die Gesellschaft wird der Vertrag umgeschrieben.",
  },
  {
    q: "Was kostet ein Inserat?",
    // Deliberately no numbers here: /preise (backed by the pricing config) is
    // the single source of truth, so this page can never drift from it.
    a: "Die aktuellen Konditionen für Garagen und Private findest du transparent auf unserer Preisseite – ohne versteckte Gebühren.",
    href: "/preise",
    linkText: "Preisseite",
  },
  {
    q: "Können wir auch normale Occasionen ohne Leasing inserieren?",
    a: "Ja, als Direktkauf-Inserat. Neben Leasingübernahmen kannst du deine Occasionen ganz normal mit Kaufpreis auf BuyAuto anbieten.",
  },
  {
    q: "Wie lange läuft ein Inserat?",
    // Real behaviour from the product config: garage listings hang off the
    // monthly package (garagePlans.ts caps active listings, no per-listing
    // expiry); private one-time plans are 60 / 90 days / unlimited
    // (stripe_config.ts duration_days).
    a: "Garagen-Inserate sind an dein Monatspaket gebunden: Sie bleiben online, solange dein Paket aktiv ist – das Paket begrenzt nur die Anzahl gleichzeitig aktiver Inserate. Private Inserate laufen je nach Plan 60 Tage, 90 Tage oder unlimitiert bis zum Verkauf. Details auf der Preisseite.",
    href: "/preise",
    linkText: "Preisseite",
  },
];

const STEPS = [
  {
    step: "01",
    icon: ClipboardList,
    title: "Inserat erstellen",
    text: "Erfasse das Leasingfahrzeug deines Kunden mit Monatsrate, Restlaufzeit und Kilometerstand. Dauert wenige Minuten.",
  },
  {
    step: "02",
    icon: UserCheck,
    title: "Übernehmer finden",
    text: "Interessenten melden sich direkt. Die Bonitätsprüfung läuft wie bei jedem Leasing über die Leasinggesellschaft.",
  },
  {
    step: "03",
    icon: Handshake,
    title: "Verkauf abschliessen",
    text: "Sobald die Übertragung bewilligt ist, ist dein Kunde aus dem Vertrag – und bereit für den Neuwagen oder die nächste Occasion bei dir.",
  },
];

const BENEFITS = [
  {
    icon: Repeat,
    title: "Gerettete Eintausch-Deals",
    text: "Verkäufe, die sonst am Leasing scheitern, werden abschlussfähig.",
  },
  {
    icon: CarFront,
    title: "Zusätzlicher Kanal",
    text: "Auch Direktkauf-Inserate für deine Occasionen sind möglich.",
  },
  {
    // Wording verified against /preise: garages book monthly packages
    // (garagePlans.ts GARAGE_TRUST_POINTS — «Monatlich kündbar», «Keine
    // Setup-Gebühr», «Fixpreis statt Fahrzeugwert»), so the brief's
    // «Einmalige Inseratspreise: Kein Abo» would be wrong for garages.
    icon: Wallet,
    title: "Transparente Monatspakete",
    text: "Fixpreis statt Fahrzeugwert – monatlich kündbar, keine Setup-Gebühr. Die Konditionen stehen offen auf der Preisseite.",
    href: "/preise",
    linkText: "Preisseite",
  },
  {
    icon: MessageCircle,
    title: "Direkter Draht",
    text: "Du sprichst direkt mit dem Gründer – keine Warteschleife, keine Tickets.",
  },
];

function withInlineLink(text: string, href?: string, linkText?: string) {
  if (!href || !linkText || !text.includes(linkText)) return text;
  const [before, after] = text.split(linkText);
  return (
    <>
      {before}
      <Link href={href} className="text-red-600 font-semibold hover:underline">
        {linkText}
      </Link>
      {after}
    </>
  );
}

export default function FuerGaragen() {
  return (
    <>
      <Head>
        <title>BuyAuto für Garagen – Leasingübernahme als Verkaufschance</title>
        <meta
          name="description"
          content="Ein Kunde steckt im Leasing und der Eintausch scheitert? Inseriere den Vertrag zur Übernahme auf BuyAuto – und mach den Weg frei für den nächsten Verkauf."
        />
        <link rel="canonical" href="https://www.buyauto.ch/fuer-garagen" />
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
        <meta property="og:title" content="BuyAuto für Garagen – Leasingübernahme als Verkaufschance" />
        <meta
          property="og:description"
          content="Ein Kunde steckt im Leasing und der Eintausch scheitert? Inseriere den Vertrag zur Übernahme auf BuyAuto – und mach den Weg frei für den nächsten Verkauf."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.buyauto.ch/fuer-garagen" />
      </Head>

      <div className="bg-white">
        {/* Breadcrumbs (visible + BreadcrumbList JSON-LD) */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <Breadcrumbs
            items={[
              { name: "Home", href: "/" },
              { name: "Für Garagen", href: "/fuer-garagen" },
            ]}
          />
        </div>

        {/* HERO */}
        <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 text-red-600 text-sm font-bold uppercase tracking-wider mb-5">
              <BadgeCheck className="w-4 h-4" />
              Für Garagen
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-neutral-900 tracking-tight leading-[1.05] mb-6">
              Wenn das Leasing deinen <span className="text-red-500">Verkauf blockiert</span>
            </h1>
            {/* Answer-first intro: states problem + solution in the first sentences. */}
            <p className="text-lg sm:text-xl text-neutral-600 leading-relaxed max-w-3xl">
              Ein Kunde will bei dir kaufen – aber sein laufender Leasingvertrag steht im Weg. Die vorzeitige
              Auflösung ist teuer, der Eintausch rechnet sich nicht, und der Deal stirbt. BuyAuto löst genau
              dieses Problem: Der bestehende Vertrag wird zur Übernahme inseriert, eine geprüfte Übernehmerin
              oder ein geprüfter Übernehmer tritt ein – und dein Kunde ist frei für den nächsten Kauf bei dir.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Button
                asChild
                size="lg"
                className="bg-red-500 text-white hover:bg-red-600 font-bold rounded-xl px-8 h-14 shadow-lg shadow-red-500/25 hover:scale-105 transition-all duration-300"
              >
                <Link href="/inserat-erstellen">
                  Inserat erstellen
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-2 border-neutral-300 text-neutral-700 hover:border-red-500 hover:text-red-600 font-bold rounded-xl px-8 h-14 hover:scale-105 transition-all duration-300"
              >
                {/* hello@buyauto.ch is the address shown in the footer contact
                    block and used by the Concierge page. */}
                <a href="mailto:hello@buyauto.ch?subject=Frage%20von%20unserer%20Garage">
                  <Mail className="w-5 h-5 mr-2" />
                  Frage stellen
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* SO FUNKTIONIERT'S */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-neutral-50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 tracking-tight mb-10 text-center">
              So nutzt du BuyAuto als Garage
            </h2>
            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              {STEPS.map((item) => (
                <div
                  key={item.step}
                  className="relative bg-white rounded-3xl p-8 border border-neutral-200 shadow-sm hover:shadow-lg hover:border-red-200 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-neutral-900 flex items-center justify-center">
                      <item.icon className="w-7 h-7 text-white" strokeWidth={2} />
                    </div>
                    <span className="text-4xl font-black text-neutral-200">{item.step}</span>
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900 mb-3">{item.title}</h3>
                  <p className="text-neutral-600 leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* NUTZEN */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 tracking-tight mb-10 text-center">
              Was BuyAuto deiner Garage bringt
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {BENEFITS.map((benefit) => (
                <div
                  key={benefit.title}
                  className="flex items-start gap-4 bg-neutral-50 rounded-2xl p-6 border border-neutral-200"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                    <benefit.icon className="w-6 h-6 text-red-600" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900 mb-1.5">{benefit.title}</h3>
                    <p className="text-neutral-600 leading-relaxed">
                      {withInlineLink(benefit.text, benefit.href, benefit.linkText)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  asChild
                  size="lg"
                  className="bg-red-500 text-white hover:bg-red-600 font-bold rounded-xl px-8 h-14 shadow-lg shadow-red-500/25 hover:scale-105 transition-all duration-300"
                >
                  <Link href="/inserat-erstellen">
                    Inserat erstellen
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-2 border-neutral-300 text-neutral-700 hover:border-red-500 hover:text-red-600 font-bold rounded-xl px-8 h-14 hover:scale-105 transition-all duration-300"
                >
                  <a href="mailto:hello@buyauto.ch?subject=Frage%20von%20unserer%20Garage">
                    <Mail className="w-5 h-5 mr-2" />
                    Frage stellen
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-16 px-4 sm:px-6 lg:px-8 bg-neutral-50 scroll-mt-20">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 tracking-tight mb-10 text-center">
              Häufige Fragen von Garagen
            </h2>
            <Accordion type="single" collapsible className="w-full space-y-3">
              {FAQS.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`faq-${index}`}
                  className="bg-white rounded-2xl border border-neutral-200 px-6 data-[state=open]:shadow-md transition-all"
                >
                  <AccordionTrigger className="text-left font-bold text-neutral-900 hover:no-underline py-5">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-neutral-600 leading-relaxed pb-5 text-base">
                    {withInlineLink(faq.a, faq.href, faq.linkText)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            {LAST_UPDATED_ISO && (
              <p className="mt-8 text-center text-sm text-neutral-400">
                Aktualisiert am {formatSwissDate(LAST_UPDATED_ISO)}
              </p>
            )}
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-neutral-900">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 tracking-tight">
              Mach blockierte Deals wieder abschlussfähig
            </h2>
            <p className="text-lg text-neutral-300 mb-8 max-w-2xl mx-auto">
              Inseriere den Leasingvertrag deines Kunden zur Übernahme – oder stell uns zuerst deine Fragen.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-red-500 text-white hover:bg-red-600 font-bold rounded-xl px-10 h-14 shadow-lg shadow-red-500/25 hover:scale-105 transition-all duration-300"
              >
                <Link href="/inserat-erstellen">
                  Inserat erstellen
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-2 border-neutral-600 bg-white text-neutral-900 hover:bg-neutral-100 font-bold rounded-xl px-10 h-14 hover:scale-105 transition-all duration-300"
              >
                <a href="mailto:hello@buyauto.ch?subject=Frage%20von%20unserer%20Garage">Frage stellen</a>
              </Button>
            </div>
            <p className="mt-8 text-sm text-neutral-400">
              Mehr zur Übertragung:{" "}
              <Link href="/leasingvertrag-uebertragen" className="text-neutral-300 underline hover:text-white">
                Leasingvertrag übertragen
              </Link>{" "}
              ·{" "}
              <Link href="/leasinguebernahme" className="text-neutral-300 underline hover:text-white">
                Leasingübernahme
              </Link>{" "}
              ·{" "}
              <Link href="/eintauschwert-rechner" className="text-neutral-300 underline hover:text-white">
                Eintauschwert-Rechner
              </Link>
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
