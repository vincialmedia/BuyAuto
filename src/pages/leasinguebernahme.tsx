import type { GetStaticProps } from "next";
import type { ReactNode } from "react";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BreadcrumbJsonLd } from "@/components/buyauto/Breadcrumbs";
import { AuthorBox } from "@/components/buyauto/AuthorBox";
import { FounderTakeoverNote } from "@/components/buyauto/FounderTakeoverNote";
import { SourceCitation, SourcesList } from "@/components/buyauto/SourceCitation";
import { getPublicOfferIndex, liveTakeovers } from "@/services/listingsService";
import { indexableBrandPages } from "@/lib/buyauto/leasingBrands";
import { CONTENT_LAST_UPDATED } from "@/lib/buyauto/contentDates";
import { pricingPlans } from "@/lib/buyauto/stripe_config";
import { countLabel, formatChf, formatChfRappen } from "@/lib/buyauto/format";
import {
  AMAG_LEASING,
  BMW_FINANCIAL_SERVICES,
  CA_AUTO_FINANCE,
  CA_AUTO_FINANCE_TRANSFER_INCL_VAT_CHF,
  CANTONAL_FAHRZEUGAUSWEIS_RANGE_LABEL,
  CANTONAL_FAHRZEUGAUSWEIS_RANGE_SOURCES,
  CANTONAL_FEES,
  CANTONAL_FEES_HREF,
  CANTONAL_KONTROLLSCHILDER_RANGE_SOURCES,
  CANTONAL_KONTROLLSCHILDER_SUMMARY,
  CEMBRA,
  CEMBRA_TRANSFER_DISPLAY,
  CEMBRA_TRANSFER_EXCL_VAT_CHF,
  KKG,
  LENDER_TAKEOVER_FEES,
  MERCEDES_BENZ_FINANCIAL_SERVICES,
  PORSCHE_FINANCIAL_SERVICES,
  computeInventoryStats,
  kautionSentence,
  type FactSource,
  type InventoryStats,
} from "@/lib/buyauto/facts";

const PAGE_PATH = "/leasinguebernahme";
const PAGE_URL = `https://www.buyauto.ch${PAGE_PATH}`;
const HUB_HREF = "/suche?dealType=lease_takeover";

const H1 = "So funktioniert eine Leasingübernahme";
const TITLE = "So funktioniert eine Leasingübernahme: der Ablauf | BuyAuto";
const DESCRIPTION =
  "Ablauf einer Leasingübernahme für Abgeber und Übernehmer: was die Leasinggesellschaft prüft, welche Gebühren sie publiziert und was der Kanton verlangt.";

// Single source for the author box date and the Article dateModified.
const LAST_UPDATED_ISO = CONTENT_LAST_UPDATED[PAGE_PATH];

/** The cantonal tariffs behind the lowest and highest Fahrzeugausweis and plate fee (one entry per tariff). */
const CANTONAL_RANGE_SOURCES: FactSource[] = [
  ...CANTONAL_FAHRZEUGAUSWEIS_RANGE_SOURCES,
  ...CANTONAL_KONTROLLSCHILDER_RANGE_SOURCES,
].filter((source, i, all) => all.findIndex((s) => s.url === source.url) === i);

/** Every source a figure or clause on this page comes from, in the order the page cites them. */
const SOURCES: FactSource[] = [
  CEMBRA.source,
  CA_AUTO_FINANCE.source,
  CA_AUTO_FINANCE.faqSource,
  PORSCHE_FINANCIAL_SERVICES.source,
  AMAG_LEASING.source,
  BMW_FINANCIAL_SERVICES.source,
  BMW_FINANCIAL_SERVICES.alphera.source,
  MERCEDES_BENZ_FINANCIAL_SERVICES.source,
  ...CANTONAL_RANGE_SOURCES,
  KKG.source,
];

const ARTICLE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: H1,
  description: DESCRIPTION,
  author: { "@type": "Person", name: "Vincent Hänggi", jobTitle: "Gründer von BuyAuto" },
  publisher: {
    "@type": "Organization",
    name: "BuyAuto",
    logo: { "@type": "ImageObject", url: "https://www.buyauto.ch/share-logo.jpg" },
  },
  dateModified: LAST_UPDATED_ISO,
  mainEntityOfPage: PAGE_URL,
} as const;

/** "A, B und C" */
function joinGerman(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} und ${items[items.length - 1]}`;
}

/** Lenders that publish no takeover fee, read from the shared lender list (never typed by hand). */
const LENDERS_WITHOUT_PUBLISHED_FEE = joinGerman(
  LENDER_TAKEOVER_FEES.filter((l) => l.feeExclVatChf === null).map((l) => l.name)
);

const CEMBRA_FEES = CEMBRA.feesExclVatChf;
const CA_TRANSFER_EXCL = formatChf(CA_AUTO_FINANCE.feesExclVatChf.vertragsumschreibung);
const CA_TRANSFER_INCL = formatChfRappen(CA_AUTO_FINANCE_TRANSFER_INCL_VAT_CHF);
const STANDARD_PLAN = pricingPlans.standard;

/** Inline link to the document a clause comes from. */
function Ref({ source, children }: { source: FactSource; children: ReactNode }) {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="underline decoration-neutral-300 underline-offset-2 hover:text-neutral-900"
    >
      {children}
    </a>
  );
}

const STEPS: { role: string; text: ReactNode }[] = [
  {
    role: "Abgeber",
    text: (
      <>
        Du fragst deine Leasinggesellschaft, ob sie einer Übertragung zustimmt und was sie dafür verlangt. Ohne ihre
        Zustimmung geht es nicht: {PORSCHE_FINANCIAL_SERVICES.name} etwa verlangt eine vorherige schriftliche
        Zustimmung (
        <Ref source={PORSCHE_FINANCIAL_SERVICES.source}>ALB {PORSCHE_FINANCIAL_SERVICES.transferClause}</Ref>).
      </>
    ),
  },
  {
    role: "Abgeber",
    text: (
      <>
        Du suchst eine Person, die den Vertrag übernimmt, zum Beispiel mit einem Inserat auf BuyAuto, das Monatsrate,
        Restlaufzeit und eine allfällige Kaution zeigt.
      </>
    ),
  },
  {
    role: "Übernehmer",
    text: (
      <>
        Du stellst einen Antrag. Die Leasinggesellschaft prüft deine Bonität und holt dafür Auskünfte bei der
        ZEK und der IKO ein (
        <Ref source={AMAG_LEASING.source}>
          {AMAG_LEASING.name}, ALB {AMAG_LEASING.clauses.bonitaetspruefung}
        </Ref>
        ;{" "}
        <Ref source={CA_AUTO_FINANCE.source}>
          {CA_AUTO_FINANCE.name}, AVB {CA_AUTO_FINANCE.clauses.bonitaetspruefung}
        </Ref>
        ).
      </>
    ),
  },
  {
    role: "Leasinggesellschaft",
    text: (
      <>
        Stimmt die Leasinggesellschaft zu, schreibt sie den Vertrag auf die neue Person um. Eine allfällige Gebühr stellt sie in Rechnung.
        Die publizierten Beträge stehen weiter unten.
      </>
    ),
  },
  {
    role: "Übernehmer",
    text: (
      <>
        Du versicherst das Auto und löst es auf dich ein (
        <Ref source={AMAG_LEASING.source}>
          {AMAG_LEASING.name}, ALB {AMAG_LEASING.clauses.versicherung} und {AMAG_LEASING.clauses.immatrikulation}
        </Ref>
        ). Das Strassenverkehrsamt stellt dir dafür einen neuen Fahrzeugausweis aus. Danach übernimmst du das Auto und
        zahlst die Monatsrate.
      </>
    ),
  },
];

const LENDERS: { name: string; text: ReactNode; sources: FactSource[] }[] = [
  {
    name: AMAG_LEASING.name,
    text: (
      <>
        Bei der Prüfung eines Antrags holt {AMAG_LEASING.name} unter anderem Auskünfte bei ZEK und IKO ein (
        {AMAG_LEASING.clauses.bonitaetspruefung}). Das Auto wird in der Regel auf die Leasingnehmerin oder den
        Leasingnehmer eingelöst ({AMAG_LEASING.clauses.immatrikulation}). Für Neuwagen verlangt sie eine Vollkasko,
        bei Occasionen ist nach Absprache eine Teilkasko möglich ({AMAG_LEASING.clauses.versicherung}). Eine Gebühr
        für die Übernahme nennen die ALB nicht.
      </>
    ),
    sources: [AMAG_LEASING.source],
  },
  {
    name: CA_AUTO_FINANCE.name,
    text: (
      <>
        {CA_AUTO_FINANCE.legalName} in {CA_AUTO_FINANCE.seat} ist der {CA_AUTO_FINANCE.role}. Für die Prüfung holt
        sie Auskünfte bei IKO und ZEK ein (AVB {CA_AUTO_FINANCE.clauses.bonitaetspruefung}). Für die
        Vertragsumschreibung verrechnet sie {CA_TRANSFER_EXCL} exkl. MWST, also {CA_TRANSFER_INCL} inkl. MWST (AVB{" "}
        {CA_AUTO_FINANCE.clauses.gebuehren}).
      </>
    ),
    sources: [CA_AUTO_FINANCE.source, CA_AUTO_FINANCE.faqSource],
  },
  {
    name: PORSCHE_FINANCIAL_SERVICES.name,
    text: (
      <>
        {PORSCHE_FINANCIAL_SERVICES.transferClause} der ALB: «{PORSCHE_FINANCIAL_SERVICES.transferQuote}» Eine Gebühr
        für die Übernahme nennen die ALB nicht.
      </>
    ),
    sources: [PORSCHE_FINANCIAL_SERVICES.source],
  },
  {
    name: BMW_FINANCIAL_SERVICES.name,
    text: (
      <>
        Publiziert für BMW keine Übernahmegebühr und keine Regeln zur Übertragung. {BMW_FINANCIAL_SERVICES.alphera.name},
        die zweite Marke der {BMW_FINANCIAL_SERVICES.legalName} für Autos anderer Marken, schreibt in ihren FAQ: «
        {BMW_FINANCIAL_SERVICES.alphera.quote}» Diese Aussage betrifft {BMW_FINANCIAL_SERVICES.alphera.name}-Verträge.
      </>
    ),
    sources: [BMW_FINANCIAL_SERVICES.source, BMW_FINANCIAL_SERVICES.alphera.source],
  },
  {
    name: MERCEDES_BENZ_FINANCIAL_SERVICES.name,
    text: <>Publiziert keine Gebühr und keine Regeln zur Leasingübernahme.</>,
    sources: [MERCEDES_BENZ_FINANCIAL_SERVICES.source],
  },
];

function SmallSources({ sources, label = "Quelle" }: { sources: FactSource[]; label?: string }) {
  return (
    <p className="mt-2 text-xs leading-snug text-neutral-500">
      {sources.length > 1 ? `${label}n: ` : `${label}: `}
      {sources.map((source, i) => (
        <span key={source.url}>
          {i > 0 ? "; " : null}
          <SourceCitation source={source} prefix="" />
        </span>
      ))}
    </p>
  );
}

type LeasingUebernahmePageProps = {
  /** Live Leasingübernahme stats; null when the live read failed (numbers are then hidden). */
  stats: InventoryStats | null;
  /** Indexable brand pages (enough live Leasingübernahmen); empty when the live read failed. */
  availableBrands: { slug: string; name: string }[];
};

export default function LeasingUebernahmePage({ stats, availableBrands }: LeasingUebernahmePageProps) {
  const liveStats = stats && stats.count > 0 ? stats : null;

  return (
    <>
      <Head>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <link rel="canonical" href={PAGE_URL} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_JSON_LD) }} />
        <meta property="og:title" content={H1} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={PAGE_URL} />
      </Head>

      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Leasingübernahme", href: PAGE_PATH },
        ]}
      />

      <main className="bg-white">
        <article className="mx-auto max-w-3xl px-4 py-8 md:py-12 text-neutral-800 leading-relaxed">
          {/* 1. Answer first */}
          <header>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-neutral-900">{H1}</h1>
            <p className="mt-4 text-lg">
              Bei einer Leasingübernahme übernimmst du einen laufenden Leasingvertrag mit seiner Monatsrate und seiner
              Restlaufzeit. Die Leasinggesellschaft muss der Übertragung zustimmen und prüft vorher die Bonität der
              Person, die übernimmt. Einmalig kostet das eine Gebühr der Leasinggesellschaft, bei {CEMBRA.name} rund{" "}
              {CEMBRA_TRANSFER_DISPLAY}, bei {CA_AUTO_FINANCE.name} {CA_TRANSFER_INCL} (jeweils inkl. MWST), und die
              Gebühr des Strassenverkehrsamts für den neuen Fahrzeugausweis.
            </p>
            <SmallSources sources={[CEMBRA.source, CA_AUTO_FINANCE.source]} />
            <AuthorBox path={PAGE_PATH} className="mt-6" />
          </header>

          {/* 2. Steps for both sides */}
          <section id="ablauf" aria-labelledby="ablauf-heading" className="mt-10 scroll-mt-24">
            <h2 id="ablauf-heading" className="text-2xl font-bold tracking-tight text-neutral-900">
              Der Ablauf in fünf Schritten
            </h2>
            <ol className="mt-5 space-y-5">
              {STEPS.map((step, i) => (
                <li key={i} className="relative pl-11">
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm font-bold text-white"
                  >
                    {i + 1}
                  </span>
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{step.role}</p>
                  <p className="mt-0.5">{step.text}</p>
                </li>
              ))}
            </ol>

            <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <p>
                Du gibst deinen Vertrag ab? Die Schritte für Abgeber im Detail stehen in der Anleitung{" "}
                <Link href="/leasingvertrag-uebertragen" className="font-medium text-primary underline underline-offset-2">
                  Leasingvertrag übertragen
                </Link>
                .
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                <Button asChild className="rounded-xl font-semibold">
                  <Link href="/inserat-erstellen">Inserat erstellen</Link>
                </Button>
                <p className="text-sm text-neutral-600">
                  Ein {STANDARD_PLAN.name}-Inserat für Privatpersonen kostet {formatChf(STANDARD_PLAN.price)} und ist{" "}
                  {STANDARD_PLAN.duration_days} Tage online.
                </p>
              </div>
            </div>
          </section>

          {/* 3. What each lender checks and publishes */}
          <section id="leasinggesellschaften" aria-labelledby="leasinggesellschaften-heading" className="mt-10 scroll-mt-24">
            <h2 id="leasinggesellschaften-heading" className="text-2xl font-bold tracking-tight text-neutral-900">
              Was die Leasinggesellschaften prüfen und publizieren
            </h2>
            <p className="mt-3">
              Was genau gilt, steht in den Vertragsbedingungen deiner Leasinggesellschaft. Fünf Leasinggesellschaften im
              Vergleich:
            </p>
            <dl className="mt-4 divide-y divide-neutral-200 border-y border-neutral-200">
              {LENDERS.map((lender) => (
                <div key={lender.name} className="py-4">
                  <dt className="font-semibold text-neutral-900">{lender.name}</dt>
                  <dd className="mt-1">
                    {lender.text}
                    <SmallSources sources={lender.sources} />
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-4">
              Publiziert deine Leasinggesellschaft nichts dazu, frag sie vor dem Inserat nach Zustimmung und Gebühr.
            </p>
          </section>

          {/* 4. Costs in short */}
          <section id="kosten" aria-labelledby="kosten-heading" className="mt-10 scroll-mt-24">
            <h2 id="kosten-heading" className="text-2xl font-bold tracking-tight text-neutral-900">
              Was eine Übernahme kostet
            </h2>
            <ul className="mt-4 list-disc space-y-3 pl-5 marker:text-neutral-400">
              <li>
                {CEMBRA.name} verrechnet {formatChf(CEMBRA_FEES.halterwechsel)} für den Halterwechsel und{" "}
                {formatChf(CEMBRA_FEES.fahrzeugausweisUmschreibung)} für die Umschreibung des Fahrzeugausweises,
                zusammen {formatChf(CEMBRA_TRANSFER_EXCL_VAT_CHF)} exkl. oder rund {CEMBRA_TRANSFER_DISPLAY} inkl. MWST.{" "}
                {CA_AUTO_FINANCE.name} verrechnet für die Vertragsumschreibung {CA_TRANSFER_EXCL} exkl. oder{" "}
                {CA_TRANSFER_INCL} inkl. MWST. {LENDERS_WITHOUT_PUBLISHED_FEE} publizieren keine Übernahmegebühr.
              </li>
              <li>
                Den neuen Fahrzeugausweis stellt das Strassenverkehrsamt aus, für {CANTONAL_FAHRZEUGAUSWEIS_RANGE_LABEL}{" "}
                je nach Kanton. {CANTONAL_KONTROLLSCHILDER_SUMMARY}{" "}
                <Link href={CANTONAL_FEES_HREF} className="font-medium text-primary underline underline-offset-2">
                  Alle {CANTONAL_FEES.length} Kantone mit Tarif und Quelle
                </Link>
                .
              </li>
              <li>{kautionSentence(stats)}</li>
              <li>Wer welche Kosten trägt, klären Abgeber und Übernehmer untereinander, am besten schriftlich.</li>
            </ul>
            <SmallSources sources={[CEMBRA.source, CA_AUTO_FINANCE.source, ...CANTONAL_RANGE_SOURCES]} />
            <p className="mt-4">
              Die Gebühren aller Leasinggesellschaften im Vergleich:{" "}
              <Link
                href="/leasinguebernahme-kosten#leasinggesellschaften"
                className="font-medium text-primary underline underline-offset-2"
              >
                Kosten einer Leasingübernahme
              </Link>
              .
            </p>
          </section>

          {/* 5. Getting out early */}
          <section id="vorzeitig-kuendigen" aria-labelledby="vorzeitig-kuendigen-heading" className="mt-10 scroll-mt-24">
            <h2 id="vorzeitig-kuendigen-heading" className="text-2xl font-bold tracking-tight text-neutral-900">
              Vorzeitig aus dem Leasing aussteigen
            </h2>
            <p className="mt-3">
              Findest du niemanden oder willst du den Vertrag ganz beenden, kannst du einen privaten Leasingvertrag
              vorzeitig kündigen (<Ref source={KKG.source}>{KKG.terminationArticle} KKG</Ref>). Was du dann noch bezahlst,
              berechnet deine Leasinggesellschaft. Ein Beispiel: {AMAG_LEASING.name}{" "}
              verrechnet für eine vorzeitige Vertragsauflösung pauschal{" "}
              {formatChf(AMAG_LEASING.feesExclVatChf.vorzeitigeVertragsaufloesung)} exkl. MWST (
              {AMAG_LEASING.clauses.aufloesungsgebuehren}) und berechnet die Raten rückwirkend neu (
              {AMAG_LEASING.clauses.rueckwirkendeNeuberechnung}).
            </p>
            <SmallSources sources={[KKG.source, AMAG_LEASING.source]} />
            <p className="mt-4">
              Übernahme, Kündigung und Rauskaufen mit Verkauf im Vergleich:{" "}
              <Link href="/leasing-abgeben-schweiz" className="font-medium text-primary underline underline-offset-2">
                Leasing abgeben in der Schweiz
              </Link>
              .
            </p>
          </section>

          {/* 6. Live numbers from the inventory */}
          <section id="angebote" aria-labelledby="angebote-heading" className="mt-10 scroll-mt-24">
            <h2 id="angebote-heading" className="text-2xl font-bold tracking-tight text-neutral-900">
              Leasingübernahmen auf BuyAuto
            </h2>
            {liveStats ? (
              <>
                <p className="mt-3">
                  Die Zahlen sind aus allen aktuellen Leasingübernahmen auf BuyAuto berechnet. Beim Median liegt die
                  Hälfte der Angebote darunter, die Hälfte darüber.
                </p>
                <dl className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
                  <div className="rounded-xl border border-neutral-200 p-2.5 sm:p-3">
                    <dt className="text-xs leading-snug text-neutral-500">Aktuelle Leasing&shy;übernahmen</dt>
                    <dd className="mt-1 text-base font-bold text-neutral-900 sm:text-xl">{liveStats.count}</dd>
                  </div>
                  {liveStats.medianRate !== null ? (
                    <div className="rounded-xl border border-neutral-200 p-2.5 sm:p-3">
                      <dt className="text-xs leading-snug text-neutral-500">Median der Monatsraten</dt>
                      <dd className="mt-1 text-base font-bold text-neutral-900 sm:text-xl">
                        {formatChf(liveStats.medianRate)}
                      </dd>
                    </div>
                  ) : null}
                  {liveStats.medianMonths !== null ? (
                    <div className="rounded-xl border border-neutral-200 p-2.5 sm:p-3">
                      <dt className="text-xs leading-snug text-neutral-500">Median der Restlaufzeit</dt>
                      <dd className="mt-1 text-base font-bold text-neutral-900 sm:text-xl">
                        {countLabel(liveStats.medianMonths, "Monat", "Monate")}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </>
            ) : (
              <p className="mt-3">Alle laufenden Angebote mit Monatsrate und Restlaufzeit findest du in der Suche.</p>
            )}

            {availableBrands.length > 0 ? (
              <div className="mt-5">
                <p className="text-sm font-semibold text-neutral-900">Nach Marke</p>
                <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
                  {availableBrands.map((b) => (
                    <li key={b.slug}>
                      <Link
                        href={`/leasinguebernahme/${b.slug}`}
                        className="text-primary underline underline-offset-2 hover:text-primary/80"
                      >
                        Leasingübernahme {b.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <Button asChild size="lg" className="mt-6 h-auto whitespace-normal rounded-xl py-3 font-semibold">
              <Link href={HUB_HREF}>
                Alle Leasingübernahmen ansehen
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </section>

          {/* 7. The founder's own takeover (F8) */}
          <aside className="mt-10 rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
            <FounderTakeoverNote variant="inline" />
          </aside>

          {/* 9. Sources */}
          <div className="mt-10 border-t border-neutral-200 pt-8">
            <SourcesList sources={SOURCES} />
            <p className="mt-3 text-sm text-neutral-600">
              Die {CANTONAL_FEES.length} kantonalen Tarife für Fahrzeugausweis und Kontrollschilder stehen mit Quelle und
              Stand in der{" "}
              <Link href={CANTONAL_FEES_HREF} className="underline decoration-neutral-300 underline-offset-2">
                Tabelle der Kantone
              </Link>
              .
            </p>
          </div>
        </article>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps<LeasingUebernahmePageProps> = async () => {
  // One read feeds both the stats (same computation as getLiveInventoryStats) and the
  // brand links. On failure the page hides every live number and shows no brand links:
  // no fallback value is ever rendered.
  let stats: InventoryStats | null = null;
  let availableBrands: { slug: string; name: string }[] = [];
  try {
    const takeovers = liveTakeovers(await getPublicOfferIndex());
    stats = computeInventoryStats(takeovers.map((o) => o.offer));
    // Only indexable brand pages (Kaufart rule, live Leasingübernahmen) are linked.
    availableBrands = indexableBrandPages(takeovers).map((b) => ({ slug: b.slug, name: b.name }));
  } catch (error) {
    console.error("[leasinguebernahme] live inventory read failed", error);
    stats = null;
    availableBrands = [];
  }

  return { props: { stats, availableBrands }, revalidate: 300 };
};
