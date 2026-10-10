import type { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

import { AuthorBox } from "@/components/buyauto/AuthorBox";
import { Breadcrumbs } from "@/components/buyauto/Breadcrumbs";
import { CantonalFeesTable } from "@/components/buyauto/CantonalFeesTable";
import { FounderTakeoverNote } from "@/components/buyauto/FounderTakeoverNote";
import { LENDER_FEE_TABLE_SOURCES, LenderFeeTable } from "@/components/buyauto/LenderFeeTable";
import { LenderSections } from "@/components/buyauto/LenderSections";
import { SourceCitation, SourcesList } from "@/components/buyauto/SourceCitation";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CONTENT_LAST_UPDATED } from "@/lib/buyauto/contentDates";
import {
  AMAG_LEASING,
  CA_AUTO_FINANCE,
  CA_AUTO_FINANCE_TRANSFER_INCL_VAT_CHF,
  CANTONAL_FAHRZEUGAUSWEIS_RANGE_LABEL,
  CANTONAL_FEES,
  CANTONS_WITH_POSSIBLE_EXTRA_FEE,
  CANTONS_WITHOUT_FIXED_PLATE_FEE,
  CEMBRA,
  CEMBRA_TRANSFER_DISPLAY,
  FEE_SHORT,
  FOUNDER_TAKEOVER,
  KKG,
  KONTROLLSCHILDER_RANGE,
  LENDER_TAKEOVER_FEES,
  PORSCHE_FINANCIAL_SERVICES,
  cantonalExtremeLabel,
  possibleExtraFeeClause,
  kautionSentence,
  type FactSource,
  type InventoryStats,
} from "@/lib/buyauto/facts";
import { countLabel, formatChf, formatChfRappen } from "@/lib/buyauto/format";
import { LENDER_SECTION_SOURCES } from "@/lib/buyauto/leasingCompanies";
import { pricingPlans } from "@/lib/buyauto/stripe_config";
import { getLiveInventoryStats } from "@/services/listingsService";

const PATH = "/leasinguebernahme-kosten";
const PAGE_URL = `https://www.buyauto.ch${PATH}`;
const LAST_UPDATED_ISO = CONTENT_LAST_UPDATED[PATH];

const TITLE = "Leasingübernahme Kosten: Gebühren je Leasinggeber | BuyAuto";
const H1 = "Was kostet eine Leasingübernahme?";
const DESCRIPTION =
  `Leasingübernahme Kosten in der Schweiz: was ${LENDER_TAKEOVER_FEES.length} Leasinggesellschaften zur ` +
  `Übernahmegebühr publizieren (${FEE_SHORT}) und die Tarife aller ${CANTONAL_FEES.length} Kantone, mit Quelle.`;

const HUB_HREF = "/suche?dealType=lease_takeover";
const LISTING_HREF = "/inserat-erstellen";
const EXIT_CALCULATOR_HREF = "/leasing-abgeben-schweiz#rechner";

const LINK_CLASS = "font-semibold text-red-600 hover:underline";

// ── Copy built from facts.ts (defined once: visible text and JSON-LD share it) ──

const PUBLISHED_FEE_SUMMARY =
  `${CEMBRA.name} rund ${CEMBRA_TRANSFER_DISPLAY}, ${CA_AUTO_FINANCE.name} ` +
  `${formatChfRappen(CA_AUTO_FINANCE_TRANSFER_INCL_VAT_CHF)}, je inkl. MWST`;

const UNPUBLISHED_FEE_COUNT = LENDER_TAKEOVER_FEES.filter((l) => l.feeExclVatChf === null).length;

/** "Cembra und CA Auto Finance": the lenders that publish a takeover fee. */
const PUBLISHING_LENDERS = LENDER_TAKEOVER_FEES.filter((l) => l.feeExclVatChf !== null)
  .map((l) => l.name)
  .join(" und ");

/** "; in ZH kann eine Zusatzgebühr dazukommen (siehe Fussnote)" for a summary row, "" when none applies. */
function extraFeeNote(codes: readonly string[]): string {
  const clause = possibleExtraFeeClause(codes);
  return clause ? `; ${clause} (siehe ${codes.length > 1 ? "Fussnoten" : "Fussnote"})` : "";
}

const PLATES_RANGE_LABEL =
  `${cantonalExtremeLabel(KONTROLLSCHILDER_RANGE.min)} bis ${cantonalExtremeLabel(KONTROLLSCHILDER_RANGE.max)}` +
  (CANTONS_WITHOUT_FIXED_PLATE_FEE.length ? `; ${CANTONS_WITHOUT_FIXED_PLATE_FEE.join(", ")} ohne festen Betrag` : "") +
  extraFeeNote(CANTONS_WITH_POSSIBLE_EXTRA_FEE.kontrollschilder);

const STANDARD_PLAN = pricingPlans.standard;
const STANDARD_PLAN_PRICE =
  STANDARD_PLAN.price === 0 ? "ist gratis" : `kostet ${formatChf(STANDARD_PLAN.price)}`;

type Faq = { q: string; a: string; href?: string; linkText?: string };

const FAQS: Faq[] = [
  {
    q: "Was kostet eine Leasingübernahme insgesamt?",
    a:
      `Einmalig zahlst du die Gebühr der Leasinggesellschaft und die Gebühr des Strassenverkehrsamts. ${PUBLISHED_FEE_SUMMARY}; ` +
      `die übrigen Leasinggesellschaften in der Tabelle publizieren keine Gebühr. Der neue Fahrzeugausweis kostet je ` +
      `nach Kanton ${CANTONAL_FAHRZEUGAUSWEIS_RANGE_LABEL}. Monatlich zahlst du die bestehende Leasingrate weiter, ` +
      `dazu kommen deine eigene Versicherung und die Verkehrssteuer.`,
  },
  {
    q: "Wer bezahlt die Übertragungsgebühr?",
    a:
      `Kläre das mit der anderen Seite und halte es schriftlich fest. ${FOUNDER_TAKEOVER.label}: ${FOUNDER_TAKEOVER.person} bezahlte ` +
      `${FOUNDER_TAKEOVER.year} als bisheriger Leasingnehmer die volle Gebühr von ` +
      `${formatChf(FOUNDER_TAKEOVER.takeoverFeeChf)}, die die Leasinggesellschaft von BMW verlangte.`,
  },
  {
    q: "Was kostet es, das Leasing vorzeitig aufzulösen?",
    a:
      `Einen privaten Leasingvertrag kannst du vorzeitig kündigen (${KKG.terminationArticle} KKG). Was du dann ` +
      `noch bezahlst, berechnet deine Leasinggesellschaft. Die ALB von ${AMAG_LEASING.name} nennen dafür eine Pauschale von ` +
      `${formatChf(AMAG_LEASING.feesExclVatChf.vorzeitigeVertragsaufloesung)} exkl. MWST, ` +
      `${formatChf(AMAG_LEASING.feesExclVatChf.provisorischeAufloesungskosten)} exkl. MWST für die provisorische ` +
      `Berechnung und eine rückwirkende Neuberechnung der Raten (${AMAG_LEASING.clauses.aufloesungsgebuehren} und ` +
      `${AMAG_LEASING.clauses.rueckwirkendeNeuberechnung}). Was das für deinen Vertrag heisst, vergleichst du im ` +
      `Ausstiegsrechner.`,
    href: EXIT_CALCULATOR_HREF,
    linkText: "Ausstiegsrechner",
  },
];

// ── Sources ──

/** One entry per tariff URL (Obwalden and Nidwalden share one). */
const CANTONAL_SOURCES: FactSource[] = Object.values(
  CANTONAL_FEES.reduce<Record<string, FactSource>>((acc, canton) => {
    const existing = acc[canton.sourceUrl];
    acc[canton.sourceUrl] = existing
      ? { ...existing, title: `${existing.title} und ${canton.name}` }
      : { title: `Tarif ${canton.name}`, url: canton.sourceUrl, stand: canton.stand };
    return acc;
  }, {})
);

const LENDER_SOURCES: FactSource[] = [
  ...LENDER_FEE_TABLE_SOURCES,
  ...LENDER_SECTION_SOURCES,
  AMAG_LEASING.source,
  KKG.source,
];

// ── Helpers ──

function withInlineLink(text: string, href?: string, linkText?: string): ReactNode {
  if (!href || !linkText || !text.includes(linkText)) return text;
  return text.split(linkText).map((part, i, parts) => (
    <span key={i}>
      {part}
      {i < parts.length - 1 ? (
        <Link href={href} className={LINK_CLASS}>
          {linkText}
        </Link>
      ) : null}
    </span>
  ));
}

/** "Bei den 36 aktuellen Leasingübernahmen auf BuyAuto liegt der Median …", or null without live data. */
function liveRateSentence(stats: InventoryStats | null): string | null {
  if (!stats || stats.count === 0) return null;
  const parts: string[] = [];
  if (stats.medianRate !== null) parts.push(`liegt der Median der Monatsraten bei ${formatChf(stats.medianRate)}`);
  if (stats.medianMonths !== null) {
    parts.push(
      `${parts.length ? "" : "liegt "}der Median der Restlaufzeit bei ${countLabel(stats.medianMonths, "Monat", "Monaten")}`
    );
  }
  if (parts.length === 0) return null;
  const subject =
    stats.count === 1 ? "Bei der aktuellen Leasingübernahme" : `Bei den ${stats.count} aktuellen Leasingübernahmen`;
  return `${subject} auf BuyAuto ${parts.join(", ")}.`;
}

function SummaryRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-0.5 py-2.5 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-4">
      <dt className="text-sm text-neutral-500">{label}</dt>
      <dd className="text-neutral-900">{children}</dd>
    </div>
  );
}

/** A page section; `wrapper` renders a div around components that bring their own <section>. */
function Section({
  id,
  wrapper = false,
  children,
  className = "",
}: {
  id?: string;
  wrapper?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const Tag = wrapper ? "div" : "section";
  return (
    <Tag id={id} className={`scroll-mt-24 border-t border-neutral-200 py-8 sm:py-10 ${className}`}>
      {children}
    </Tag>
  );
}

function H2({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h2 id={id} className="text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight mb-3">
      {children}
    </h2>
  );
}

interface LeasinguebernahmeKostenPageProps {
  /** Live Leasingübernahme stats; null when the query failed (no numbers are shown then). */
  stats: InventoryStats | null;
}

export default function LeasinguebernahmeKostenPage({ stats }: LeasinguebernahmeKostenPageProps) {
  const rateSentence = liveRateSentence(stats);

  return (
    <>
      <Head>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <link rel="canonical" href={PAGE_URL} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: H1,
              description: DESCRIPTION,
              author: { "@type": "Person", name: FOUNDER_TAKEOVER.person, jobTitle: FOUNDER_TAKEOVER.role },
              publisher: {
                "@type": "Organization",
                name: "BuyAuto",
                logo: { "@type": "ImageObject", url: "https://www.buyauto.ch/share-logo.jpg" },
              },
              dateModified: LAST_UPDATED_ISO,
              mainEntityOfPage: PAGE_URL,
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
        <meta property="og:title" content={H1} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={PAGE_URL} />
      </Head>

      <main className="bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <Breadcrumbs
            className="pt-6"
            items={[
              { name: "Home", href: "/" },
              { name: "Leasingübernahme", href: "/leasinguebernahme" },
              { name: "Kosten", href: PATH },
            ]}
          />

          {/* 1. Answer first */}
          <header className="pt-5 pb-8 sm:pb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight">{H1}</h1>
            <p className="mt-4 text-lg text-neutral-700 leading-relaxed">
              Einmalig bezahlst du die Gebühr der Leasinggesellschaft für die Übertragung und die Gebühr des
              Strassenverkehrsamts für den neuen Fahrzeugausweis. Hast du keine eigenen Kontrollschilder, kommen neue
              dazu. Verlangt der Abgeber eine Kaution, kommt auch sie dazu. Monatlich zahlst du die bestehende
              Leasingrate weiter, versicherst das Auto selbst und bezahlst die Verkehrssteuer.
            </p>

            <dl className="mt-6 divide-y divide-neutral-200 rounded-2xl border border-neutral-200 px-4">
              <SummaryRow label="Gebühr der Leasinggesellschaft">
                {PUBLISHED_FEE_SUMMARY}. Die übrigen {UNPUBLISHED_FEE_COUNT} in der{" "}
                <a href="#leasinggesellschaften" className={LINK_CLASS}>
                  Tabelle
                </a>{" "}
                publizieren keine.
              </SummaryRow>
              <SummaryRow label="Neuer Fahrzeugausweis">
                {CANTONAL_FAHRZEUGAUSWEIS_RANGE_LABEL}, je nach{" "}
                <a href="#kantone" className={LINK_CLASS}>
                  Kanton
                </a>
                {extraFeeNote(CANTONS_WITH_POSSIBLE_EXTRA_FEE.fahrzeugausweis)}
              </SummaryRow>
              <SummaryRow label="Neue Kontrollschilder, falls du keine eigenen hast">{PLATES_RANGE_LABEL}</SummaryRow>
              <SummaryRow label="Kaution">
                falls der Abgeber eine verlangt (
                <a href="#kaution" className={LINK_CLASS}>
                  aktuelle Angebote
                </a>
                )
              </SummaryRow>
              <SummaryRow label="Monatlich">
                die bestehende Leasingrate, deine{" "}
                <a href="#laufende-kosten" className={LINK_CLASS}>
                  eigene Versicherung
                </a>{" "}
                und die Verkehrssteuer
              </SummaryRow>
            </dl>

            <p className="mt-4 text-neutral-700">
              Wie die Übernahme Schritt für Schritt abläuft, erklärt der Ratgeber zur{" "}
              <Link href="/leasinguebernahme" className={LINK_CLASS}>
                Leasingübernahme
              </Link>
              .
            </p>

            <AuthorBox path={PATH} className="mt-6" />
          </header>

          {/* 2. Lender table (#leasinggesellschaften) */}
          <Section wrapper>
            <LenderFeeTable>
              <p className="text-neutral-700 leading-relaxed mb-6">
                Die Leasinggesellschaft muss der Übertragung zustimmen (bei {PORSCHE_FINANCIAL_SERVICES.name} zum
                Beispiel nur mit vorheriger schriftlicher Zustimmung, {PORSCHE_FINANCIAL_SERVICES.transferClause}) und
                prüft die Bonität der übernehmenden Person (bei {AMAG_LEASING.name} unter anderem mit Auskünften der ZEK
                und IKO, {AMAG_LEASING.clauses.bonitaetspruefung}). Für die Übertragung kann sie eine Gebühr verlangen.
                Einen Tarif dafür publizieren {PUBLISHING_LENDERS}.
              </p>
            </LenderFeeTable>
          </Section>

          {/* 3. Cantonal fees (#kantone) */}
          <Section wrapper>
            <CantonalFeesTable />
          </Section>

          {/* 4. Live data: Kaution, rate, remaining term */}
          <Section id="kaution">
            <H2>{rateSentence ? "Kaution und Raten der aktuellen Angebote" : "Kaution"}</H2>
            <p className="text-neutral-700 leading-relaxed">
              {kautionSentence(stats)}
              {stats && stats.count > 0 && stats.withKaution > 0
                ? " Wie hoch sie im Einzelfall ist, steht im jeweiligen Inserat."
                : null}
            </p>
            {rateSentence ? <p className="mt-3 text-neutral-700 leading-relaxed">{rateSentence}</p> : null}
          </Section>

          {/* 5. Monthly and other costs, who pays */}
          <Section id="laufende-kosten">
            <H2>Was monatlich dazukommt</H2>
            <div className="space-y-3 text-neutral-700 leading-relaxed">
              <p>
                Die Leasingrate läuft weiter: Du übernimmst den bestehenden Vertrag mit seiner Rate und seiner
                Restlaufzeit.
              </p>
              <p>
                Das Auto versicherst du selbst. Welche Deckung nötig ist, steht im Leasingvertrag. Bei{" "}
                {AMAG_LEASING.name} ist für Neufahrzeuge eine Vollkasko Pflicht, bei Occasionen ist nach Absprache mit
                der Leasinggeberin eine Teilkasko möglich ({AMAG_LEASING.clauses.versicherung},{" "}
                <SourceCitation source={AMAG_LEASING.source} prefix="" />
                ).
              </p>
              <p>Die Verkehrssteuer bezahlst du selbst.</p>
              <p>
                Service, Reifen und Unterhalt richten sich nach dem Vertrag. Sind solche Leistungen darin enthalten,
                klär mit der Leasinggesellschaft, ob sie mit dem Vertrag auf dich übergehen.
              </p>
            </div>

            <h3 id="wer-bezahlt" className="mt-8 scroll-mt-24 text-xl font-bold text-neutral-900">
              Wer bezahlt die einmaligen Gebühren?
            </h3>
            <p className="mt-2 text-neutral-700 leading-relaxed">
              Kläre das mit der anderen Seite und halte es schriftlich fest, bevor ihr die Übertragung bei der
              Leasinggesellschaft beantragt. Welche Schritte der Abgeber dafür geht, steht im Ratgeber{" "}
              <Link href="/leasingvertrag-uebertragen" className={LINK_CLASS}>
                Leasingvertrag übertragen
              </Link>
              .
            </p>
            <FounderTakeoverNote className="mt-4 rounded-2xl bg-neutral-50 p-4 text-neutral-700 leading-relaxed" />
          </Section>

          {/* CTAs: buyers to the hub, sellers to the listing flow (2 of max. 3) */}
          <Section>
            <div className="rounded-2xl bg-neutral-900 p-5 sm:p-6 text-neutral-200">
              <h2 className="text-xl sm:text-2xl font-bold text-white">Leasingübernahmen auf BuyAuto</h2>
              <p className="mt-2 leading-relaxed">
                Als Übernehmer findest du die aktuellen Angebote in der Übersicht. Als Abgeber erstellst du ein
                Inserat; das Standard-Inserat für Privatpersonen {STANDARD_PLAN_PRICE} und läuft{" "}
                {STANDARD_PLAN.duration_days} Tage. Was eine Übernahme im Vergleich zu Auflösen oder Rauskaufen
                kostet, zeigt der{" "}
                <Link href={EXIT_CALCULATOR_HREF} className="font-semibold text-white underline hover:text-red-200">
                  Ausstiegsrechner
                </Link>
                .
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl">
                  <Link href={HUB_HREF}>
                    Leasingübernahmen ansehen
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-2 border-white bg-transparent text-white hover:bg-white hover:text-neutral-900 font-semibold rounded-xl"
                >
                  <Link href={LISTING_HREF}>Inserat erstellen</Link>
                </Button>
              </div>
            </div>
          </Section>

          {/* 6. Lender sections (#cembra, #amag, #multilease, #bank-now) */}
          <Section wrapper>
            <LenderSections />
          </Section>

          {/* 7. FAQ */}
          <Section id="faq">
            <H2>Häufige Fragen zu den Kosten</H2>
            <Accordion type="single" collapsible className="w-full space-y-3">
              {FAQS.map((faq, index) => (
                <AccordionItem
                  key={faq.q}
                  value={`faq-${index}`}
                  className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 sm:px-5"
                >
                  <AccordionTrigger className="text-left text-base font-semibold text-neutral-900 hover:no-underline">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-base leading-relaxed text-neutral-700">
                    {withInlineLink(faq.a, faq.href, faq.linkText)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Section>

          {/* 8. Sources */}
          <Section wrapper className="space-y-8">
            <SourcesList sources={LENDER_SOURCES} />
            <SourcesList sources={CANTONAL_SOURCES} heading="Quellen der kantonalen Tarife" id="quellen-kantone" />
          </Section>
        </div>
      </main>
    </>
  );
}

// ISR: the live Kaution and rate figures refresh every 5 minutes. A failed query
// renders the page without live numbers (stats = null), never with a fallback value.
export const getStaticProps: GetStaticProps<LeasinguebernahmeKostenPageProps> = async () => {
  let stats: InventoryStats | null = null;
  try {
    stats = await getLiveInventoryStats();
  } catch (error) {
    console.error("Leasingübernahme Kosten: live inventory stats failed:", error);
  }
  return { props: { stats }, revalidate: 300 };
};
