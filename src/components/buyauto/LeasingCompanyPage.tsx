import Head from "next/head";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  ClipboardList,
  ExternalLink,
  FileText,
  Handshake,
  PenLine,
  Search,
  ShieldCheck,
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
import {
  otherLeasingCompanies,
  type LeasingCompany,
  type SourcedFact,
} from "@/lib/buyauto/leasingCompanies";

// Template for the per-Leasinggesellschaft pages. Everything company-specific
// (Gebühren, Dauer, Dokumente, Übertragungsweg) comes from the registry in
// leasingCompanies.ts as SourcedFacts with visible attribution; fields without
// a verifiable source stay null (ERFAHRUNGSWERT-VINCE) and the sections below
// render honest generic copy instead of invented numbers.
//
// TODO: matching live listings per Gesellschaft cannot be rendered yet — the
// Supabase listings schema has no Leasinggesellschaft field (checked
// 2026-08-13: neither a flat column nor a key inside
// leasing_offer.lease_takeover_offer). Once the field exists, add a
// searchListings filter + ISR listings grid here, like the brand pages.

// All four Gesellschaft pages went live together — real publish date for the
// Article schema; dateModified keeps moving via CONTENT_LAST_UPDATED.
const PAGES_PUBLISHED_ISO = "2026-08-13";

type Faq = { q: string; a: string; href?: string; linkText?: string };

// Interleaves a link between every occurrence of linkText so a phrase that
// appears twice never silently drops the trailing text.
function withInlineLink(text: string, href?: string, linkText?: string) {
  if (!href || !linkText || !text.includes(linkText)) return text;
  return text.split(linkText).map((part, i, parts) => (
    <span key={i}>
      {part}
      {i < parts.length - 1 && (
        <Link href={href} className="text-red-600 font-semibold hover:underline">
          {linkText}
        </Link>
      )}
    </span>
  ));
}

// Renders a SourcedFact: the visible attribution phrase inside the text
// becomes an external source link (Quellenangabe — exempt from the
// no-external-contacts rule for body copy).
function SourcedText({ fact }: { fact: SourcedFact }) {
  if (!fact.sourceUrl || !fact.sourceLinkText || !fact.text.includes(fact.sourceLinkText)) {
    return <>{fact.text}</>;
  }
  return (
    <>
      {fact.text.split(fact.sourceLinkText).map((part, i, parts) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && (
            <a
              href={fact.sourceUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="underline decoration-neutral-300 underline-offset-2 hover:text-neutral-900"
            >
              {fact.sourceLinkText}
            </a>
          )}
        </span>
      ))}
    </>
  );
}

function buildFaqs(company: LeasingCompany): Faq[] {
  const { name, compoundName } = company;
  return [
    {
      q: `Kann ich meinen ${compoundName}-Leasingvertrag auf eine andere Person übertragen?`,
      a: `Eine Übertragung ist grundsätzlich nur mit Zustimmung von ${name} möglich. Die Übernehmerin oder der Übernehmer durchläuft die gleiche Bonitätsprüfung wie bei einem Neuvertrag – erst nach der Bewilligung wird der Vertrag umgeschrieben.`,
    },
    {
      q: "Wer prüft die Bonität des Übernehmers?",
      // Company-specific where sourced facts exist — keeps the FAQ schema of
      // the four pages from being name-swapped duplicates of each other.
      a: company.facts.documents
        ? `${name} selbst – wie bei jedem neuen Leasingvertrag. ${company.facts.documents.text} BuyAuto ersetzt diese Prüfung nicht.`
        : `${name} selbst – wie bei jedem neuen Leasingvertrag. BuyAuto ersetzt diese Prüfung nicht.`,
    },
    {
      q: `Was kostet die Übertragung bei ${name}?`,
      a: company.facts.transferFee
        ? `${company.facts.transferFee.text} Welche Kostenblöcke bei einer Leasingübernahme generell anfallen, zeigt unser Ratgeber zu den Leasingübernahme-Kosten.`
        : `Die Umschreibegebühr legt ${name} fest – sie steht in deinem Leasingvertrag oder du erfragst sie direkt bei der Gesellschaft. Welche Kostenblöcke bei einer Leasingübernahme generell anfallen, zeigt unser Ratgeber zu den Leasingübernahme-Kosten.`,
      href: "/leasinguebernahme-kosten",
      linkText: "Leasingübernahme-Kosten",
    },
    {
      q: `Wie inseriere ich meinen ${compoundName}-Vertrag auf BuyAuto?`,
      a: `Erstelle in wenigen Minuten ein Inserat mit Monatsrate, Restlaufzeit und Kilometerstand. Interessenten melden sich direkt bei dir – die eigentliche Übertragung läuft anschliessend über ${name}.`,
    },
  ];
}

export function LeasingCompanyPage({ company }: { company: LeasingCompany }) {
  const { name, compoundName, slug, facts } = company;
  const path = `/${slug}`;
  const url = `https://www.buyauto.ch${path}`;
  const lastUpdatedIso = CONTENT_LAST_UPDATED[path];

  const title = `${compoundName}-Leasing übernehmen oder abgeben | BuyAuto`;
  const description = `So überträgst du einen ${compoundName}-Leasingvertrag: ${company.descriptionDetail} – was Abgeber wie Übernehmer wissen müssen.`;

  const faqs = buildFaqs(company);

  const steps = [
    {
      icon: ClipboardList,
      title: "Inserat erstellen oder Angebot finden",
      text: `Als Abgeber inserierst du deinen ${compoundName}-Vertrag mit Monatsrate, Restlaufzeit und Kilometerstand auf BuyAuto. Als Übernehmer durchsuchst du die aktuellen Angebote.`,
    },
    {
      icon: Handshake,
      title: "Sich einig werden",
      text: "Abgeber und Übernehmer klären die Eckpunkte: Übergabetermin, Zustand des Fahrzeugs und wer eine allfällige Umschreibegebühr trägt – das ist Verhandlungssache.",
    },
    {
      icon: FileText,
      title: `Übertragung bei ${name} beantragen`,
      text: `Beide Seiten melden die geplante Übernahme bei ${name} an. Die Gesellschaft nennt euch die nötigen Angaben und Unterlagen für den Antrag.`,
    },
    {
      icon: ShieldCheck,
      title: "Bonitätsprüfung",
      text: `${name} prüft die Übernehmerin oder den Übernehmer wie bei jedem Neuvertrag. Erst mit der Bewilligung ist die Übertragung verbindlich.`,
    },
    {
      icon: BadgeCheck,
      title: "Umschreibung und Übergabe",
      text: "Nach der Bewilligung wird der Vertrag umgeschrieben: Die bisherige Leasingnehmerin oder der bisherige Leasingnehmer wird entlassen, danach wird das Fahrzeug übergeben.",
    },
  ];

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={url} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: `${compoundName}-Leasing übernehmen oder abgeben`,
              description,
              author: { "@type": "Person", name: "Vincent Hänggi" },
              publisher: {
                "@type": "Organization",
                name: "BuyAuto",
                logo: { "@type": "ImageObject", url: "https://www.buyauto.ch/share-logo.jpg" },
              },
              datePublished: PAGES_PUBLISHED_ISO,
              dateModified: lastUpdatedIso,
              mainEntityOfPage: url,
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faqs.map((faq) => ({
                "@type": "Question",
                name: faq.q,
                acceptedAnswer: { "@type": "Answer", text: faq.a },
              })),
            }),
          }}
        />

        {/* Open Graph */}
        <meta property="og:title" content={`${compoundName}-Leasing übernehmen oder abgeben`} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={url} />
      </Head>

      <div className="bg-white">
        {/* Breadcrumbs (visible + BreadcrumbList JSON-LD) */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <Breadcrumbs
            items={[
              { name: "Home", href: "/" },
              { name: "Leasingübernahme", href: "/leasinguebernahme" },
              { name: name, href: path },
            ]}
          />
        </div>

        {/* HERO */}
        <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 text-red-600 text-sm font-bold uppercase tracking-wider mb-5">
              <BadgeCheck className="w-4 h-4" />
              Leasinggesellschaft
              {lastUpdatedIso ? ` · Aktualisiert am ${formatSwissDate(lastUpdatedIso)}` : null}
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-neutral-900 tracking-tight leading-[1.05] mb-6">
              {compoundName}-Leasing <span className="text-red-500">übernehmen oder abgeben</span>
            </h1>
            {/* Answer-first: the first sentences answer «wie funktioniert die
                Übertragung eines Vertrags bei dieser Gesellschaft». */}
            <p className="text-lg sm:text-xl text-neutral-600 leading-relaxed max-w-3xl">
              Einen laufenden {compoundName}-Leasingvertrag kannst du übernehmen oder an eine Nachfolgerin
              oder einen Nachfolger übertragen – grundsätzlich nur mit Zustimmung von {name}. Die Übernehmerin
              oder der Übernehmer durchläuft die gleiche Bonitätsprüfung wie bei einem Neuvertrag; erst nach
              der Bewilligung wird der Vertrag umgeschrieben. Auf BuyAuto findest du beide Seiten: aktuelle
              Leasingübernahmen aller Gesellschaften und einen einfachen Weg, deinen eigenen Vertrag zur
              Übernahme auszuschreiben.
            </p>

            {/* Per-company differentiator — derived from the sourced facts so
                the answer-first block isn't identical across the four pages. */}
            <p className="mt-4 text-lg text-neutral-700 font-medium leading-relaxed max-w-3xl">
              {company.heroNote}
            </p>

            {company.introNote && (
              <p className="mt-4 text-base text-neutral-500 leading-relaxed max-w-3xl">
                <SourcedText fact={company.introNote} />
              </p>
            )}

            {company.financedBrands && (
              <p className="mt-3 text-base text-neutral-500 leading-relaxed max-w-3xl">
                {company.financedBrands.lead}{" "}
                {company.financedBrands.brands.map((brand, i, arr) => (
                  <span key={brand.name}>
                    {brand.href ? (
                      <Link href={brand.href} className="text-red-600 font-semibold hover:underline">
                        {brand.name}
                      </Link>
                    ) : (
                      brand.name
                    )}
                    {i < arr.length - 2 ? ", " : i === arr.length - 2 ? " und " : ""}
                  </span>
                ))}{" "}
                (
                <a
                  href={company.financedBrands.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="underline decoration-neutral-300 underline-offset-2 hover:text-neutral-900"
                >
                  {company.financedBrands.sourceLabel}
                </a>
                ).
              </p>
            )}

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Button
                asChild
                size="lg"
                className="bg-red-500 text-white hover:bg-red-600 font-bold rounded-xl px-8 h-14 shadow-lg shadow-red-500/25 hover:scale-105 transition-all duration-300"
              >
                <Link href="/inserat-erstellen">
                  <PenLine className="w-5 h-5 mr-2" />
                  Leasing abgeben
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-2 border-neutral-300 text-neutral-700 hover:border-red-500 hover:text-red-600 font-bold rounded-xl px-8 h-14 hover:scale-105 transition-all duration-300"
              >
                <Link href="/suche?dealType=lease_takeover">
                  <Search className="w-5 h-5 mr-2" />
                  Leasing übernehmen
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* PROZESS */}
        <section id="prozess" className="py-16 px-4 sm:px-6 lg:px-8 bg-neutral-50 scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 tracking-tight mb-10">
              So läuft die Übertragung bei {name}
            </h2>
            <ol className="space-y-6">
              {steps.map((step, index) => (
                <li
                  key={index}
                  className="flex items-start gap-5 bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm"
                >
                  <div className="flex-shrink-0 relative">
                    <div className="w-12 h-12 rounded-xl bg-neutral-900 flex items-center justify-center">
                      <step.icon className="w-6 h-6 text-white" strokeWidth={2} />
                    </div>
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900 mb-1.5">{step.title}</h3>
                    <p className="text-neutral-600 leading-relaxed">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            {facts.transferProcess && (
              <div className="mt-8 bg-red-500/5 border-l-4 border-red-500 p-6 rounded-r-xl">
                <h3 className="text-lg font-bold text-neutral-900 mb-2">So regelt es {name}</h3>
                <p className="text-neutral-600 leading-relaxed">
                  <SourcedText fact={facts.transferProcess} />
                </p>
              </div>
            )}
            <p className="mt-8 text-neutral-600">
              Den allgemeinen Ablauf mit allen Details findest du im Ratgeber{" "}
              <Link href="/leasingvertrag-uebertragen" className="text-red-600 font-semibold hover:underline">
                Leasingvertrag übertragen
              </Link>
              .
            </p>
          </div>
        </section>

        {/* GEBÜHREN / DAUER / DOKUMENTE */}
        <section id="konditionen" className="py-16 px-4 sm:px-6 lg:px-8 bg-white scroll-mt-20">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 tracking-tight mb-4">
              Gebühren, Dauer und Dokumente bei {name}
            </h2>
            <p className="text-neutral-600 mb-10 max-w-3xl">
              Massgebend sind dein Leasingvertrag und die Auskunft von {name} – wir nennen hier bewusst nur,
              was verbindlich belegt ist.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-200">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-4">
                  <Wallet className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900 mb-2">Gebühren</h3>
                <p className="text-neutral-600 leading-relaxed">
                  {facts.transferFee ? (
                    <SourcedText fact={facts.transferFee} />
                  ) : (
                    `Die Umschreibegebühr legt ${name} fest – sie steht in deinem Leasingvertrag oder du erfragst sie direkt bei der Gesellschaft. Alle generellen Kostenblöcke zeigt unser Kosten-Ratgeber.`
                  )}
                </p>
              </div>
              <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-200">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-4">
                  <CalendarClock className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900 mb-2">Typische Dauer</h3>
                {/* ERFAHRUNGSWERT-VINCE: typische Übertragungsdauer — bleibt
                    beim generischen Fallback, bis ein belegter Wert vorliegt. */}
                <p className="text-neutral-600 leading-relaxed">
                  {facts.typicalDuration ? (
                    <SourcedText fact={facts.typicalDuration} />
                  ) : (
                    `Die Dauer hängt vor allem von der Bonitätsprüfung und der Rückmeldung von ${name} ab. Plane die Fahrzeugübergabe erst nach der Bewilligung.`
                  )}
                </p>
              </div>
              <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-200">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900 mb-2">Benötigte Dokumente</h3>
                <p className="text-neutral-600 leading-relaxed">
                  {facts.documents ? (
                    <SourcedText fact={facts.documents} />
                  ) : (
                    `Für die Bonitätsprüfung verlangt ${name} in der Regel Angaben zu Identität, Einkommen und Wohnsitz. Die verbindliche Liste bekommst du direkt von ${name}.`
                  )}
                </p>
              </div>
            </div>
            {/* Fixed disclaimer per Vince: keeps every figure above honest even
                if the Gesellschaft changes its terms between our updates. The
                Stand derives from CONTENT_LAST_UPDATED so it can never
                contradict the «Aktualisiert am» badge or the Article schema. */}
            <p className="mt-8 text-sm text-neutral-500">
              Massgeblich sind die aktuellen Bedingungen der Leasinggesellschaft.
              {lastUpdatedIso ? ` Stand der Angaben: ${formatSwissDate(lastUpdatedIso)}.` : null} Die
              kantonalen Gebühren des Strassenverkehrsamts kommen hinzu – Details im Ratgeber{" "}
              <Link href="/leasinguebernahme-kosten" className="text-red-600 font-semibold hover:underline">
                Leasingübernahme-Kosten
              </Link>
              .
            </p>
          </div>
        </section>

        {/* ANGEBOTE CTA — live listings per Gesellschaft folgen, sobald das
            Schema-Feld existiert (siehe Kommentar am Dateianfang). */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-neutral-50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 tracking-tight mb-4">
              Aktuelle Leasingübernahmen auf BuyAuto
            </h2>
            <p className="text-neutral-600 mb-8 max-w-2xl mx-auto">
              Durchsuche alle Übernahme-Angebote – jedes Inserat weist Monatsrate und Restlaufzeit
              transparent aus.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-red-500 text-white hover:bg-red-600 font-bold rounded-xl px-8 h-14 shadow-lg shadow-red-500/25 hover:scale-105 transition-all duration-300"
            >
              <Link href="/suche?dealType=lease_takeover">
                Angebote durchsuchen
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-16 px-4 sm:px-6 lg:px-8 bg-white scroll-mt-20">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 tracking-tight mb-10 text-center">
              Häufige Fragen zu {name}
            </h2>
            <Accordion type="single" collapsible className="w-full space-y-3">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`faq-${index}`}
                  className="bg-neutral-50 rounded-2xl border border-neutral-200 px-6 data-[state=open]:bg-white data-[state=open]:shadow-md transition-all"
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
          </div>
        </section>

        {/* BEIDE SEITEN CTA */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-neutral-900">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-neutral-800 rounded-3xl p-8 border border-neutral-700">
                <h3 className="text-2xl font-bold text-white mb-3">
                  Du willst deinen {compoundName}-Vertrag abgeben?
                </h3>
                <p className="text-neutral-300 mb-6">
                  Erstelle dein Inserat in wenigen Minuten – Interessenten melden sich direkt bei dir.
                </p>
                <Button
                  asChild
                  size="lg"
                  className="bg-red-500 text-white hover:bg-red-600 font-bold rounded-xl px-8 h-12"
                >
                  <Link href="/inserat-erstellen">
                    Inserat erstellen
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
              <div className="bg-neutral-800 rounded-3xl p-8 border border-neutral-700">
                <h3 className="text-2xl font-bold text-white mb-3">
                  Du willst ein {compoundName}-Leasing übernehmen?
                </h3>
                <p className="text-neutral-300 mb-6">
                  Durchsuche die aktuellen Übernahme-Angebote – oft ohne hohe Anzahlung und mit kürzerer
                  Laufzeit als bei einem Neuvertrag.
                </p>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-2 border-neutral-500 bg-white text-neutral-900 hover:bg-neutral-100 font-bold rounded-xl px-8 h-12"
                >
                  <Link href="/suche?dealType=lease_takeover">
                    Angebote ansehen
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Interlinks: Ratgeber + andere Gesellschaften. Der Link zur
                Gesellschaft steht bewusst NACH den BuyAuto-CTAs (Funnel-Regel:
                erst das BuyAuto-Inserat, dann externe Nachfrage). */}
            <div className="mt-10 text-center text-sm text-neutral-400 space-y-3">
              <p>
                Direkt bei der Gesellschaft nachfragen:{" "}
                <a
                  href={company.infoUrl ?? company.officialSite}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="text-neutral-300 underline hover:text-white inline-flex items-center gap-1"
                >
                  offizielle Website von {name}
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </p>
              <p>
                Mehr zum Thema:{" "}
                <Link href="/leasingvertrag-uebertragen" className="text-neutral-300 underline hover:text-white">
                  Leasingvertrag übertragen
                </Link>{" "}
                ·{" "}
                <Link href="/leasinguebernahme-kosten" className="text-neutral-300 underline hover:text-white">
                  Leasingübernahme-Kosten
                </Link>{" "}
                ·{" "}
                <Link href="/leasinguebernahme" className="text-neutral-300 underline hover:text-white">
                  Leasingübernahme nach Marke
                </Link>
              </p>
              <p>
                Andere Leasinggesellschaften:{" "}
                {otherLeasingCompanies(slug).map((other, index, arr) => (
                  <span key={other.slug}>
                    <Link href={`/${other.slug}`} className="text-neutral-300 underline hover:text-white">
                      {other.name}
                    </Link>
                    {index < arr.length - 1 ? " · " : ""}
                  </span>
                ))}
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
