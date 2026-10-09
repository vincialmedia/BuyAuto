import Head from "next/head";
import Link from "next/link";
import type { GetStaticProps } from "next";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BreadcrumbJsonLd } from "@/components/buyauto/Breadcrumbs";
import { AuthorBox } from "@/components/buyauto/AuthorBox";
import { SourceCitation, SourceLink, SourcesList } from "@/components/buyauto/SourceCitation";
import { CONTENT_LAST_UPDATED } from "@/lib/buyauto/contentDates";
import {
  AMAG_LEASING,
  AUTO_ABO_PROVIDERS,
  AUTO_ABO_STAND,
  CA_AUTO_FINANCE,
  CA_AUTO_FINANCE_TRANSFER_INCL_VAT_CHF,
  CANTONAL_FAHRZEUGAUSWEIS_RANGE_LABEL,
  CANTONAL_FAHRZEUGAUSWEIS_RANGE_SOURCES,
  CANTONAL_FAHRZEUGAUSWEIS_SUMMARY,
  CANTONAL_FEES,
  CANTONAL_FEES_HREF,
  CEMBRA,
  CEMBRA_TRANSFER_DISPLAY,
  PORSCHE_FINANCIAL_SERVICES,
  computeInventoryStats,
  kautionSentence,
  type AutoAboOffer,
  type AutoAboProvider,
  type FactSource,
  type InventoryStats,
} from "@/lib/buyauto/facts";
import { countLabel, formatChf, formatChfRappen, formatSwissInt } from "@/lib/buyauto/format";
import { matchSameModel, type MatchedTakeover, type TakeoverCandidate } from "@/lib/buyauto/autoAboMatch";
import { getPublicOfferIndex, liveTakeovers } from "@/services/listingsService";

const PAGE_PATH = "/leasinguebernahme-vs-autoabo";
const PAGE_URL = `https://www.buyauto.ch${PAGE_PATH}`;
// Single source for the AuthorBox «Aktualisiert am» and the Article dateModified.
const LAST_UPDATED_ISO = CONTENT_LAST_UPDATED[PAGE_PATH];

const H1 = "Leasingübernahme oder Auto-Abo: was kostet was?";
const META_TITLE = `${H1} | BuyAuto`;

const HUB_HREF = "/suche?dealType=lease_takeover";
const LENDER_TABLE_HREF = "/leasinguebernahme-kosten#leasinggesellschaften";

// ── Auto-Abo examples (F10), all derived from facts.ts ────────────────────────

const ABO_STAND_LABEL = `Stand ${AUTO_ABO_STAND}`;

const ABO_OFFERS: { provider: AutoAboProvider; offer: AutoAboOffer }[] = AUTO_ABO_PROVIDERS.flatMap((provider) =>
  provider.offers.map((offer) => ({ provider, offer }))
);

/** "Carvolution, Clyde und FlatDrive" */
function joinGerman(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} und ${items[items.length - 1]}`;
}

const PROVIDER_NAMES = joinGerman(AUTO_ABO_PROVIDERS.map((p) => p.name));

const ABO_TERMS = ABO_OFFERS.map(({ offer }) => offer.termMonths);
const ABO_TERM_MIN = Math.min(...ABO_TERMS);
const ABO_TERM_MAX = Math.max(...ABO_TERMS);
/** "24 bis 48 Monate" */
const ABO_TERM_RANGE =
  ABO_TERM_MIN === ABO_TERM_MAX ? `${ABO_TERM_MIN} Monate` : `${ABO_TERM_MIN} bis ${ABO_TERM_MAX} Monate`;

const META_DESCRIPTION =
  `Auto-Abo oder Leasingübernahme? Abo-Preise von ${PROVIDER_NAMES}, was zur Leasingrate dazukommt ` +
  "und welche Gebühren anfallen.";
const OG_DESCRIPTION =
  `Was ein Auto-Abo enthält und kostet (${ABO_STAND_LABEL}) und was bei einer Leasingübernahme zur Rate dazukommt.`;

/** "Carvolution: Anfangspauschale CHF 390 für Neukunden, Depot CHF 1'000, rückerstattbar; Clyde: …" */
const ABO_ONE_OFF_SUMMARY = AUTO_ABO_PROVIDERS.map((p) => `${p.name}: ${p.oneOffCosts.join(", ")}`).join("; ");

const ABO_SOURCES: FactSource[] = [
  ...ABO_OFFERS.map(({ provider, offer }) => ({
    title: `${provider.name}: ${offer.model}`,
    url: offer.url,
    stand: ABO_STAND_LABEL,
  })),
  ...AUTO_ABO_PROVIDERS.filter((p) => p.conditionsUrl).map((p) => ({
    title: `${p.name}: Konditionen`,
    url: p.conditionsUrl as string,
    stand: ABO_STAND_LABEL,
  })),
];

// ── Takeover costs (lender and cantonal facts) ───────────────────────────────

const CEMBRA_FEE_TEXT =
  `Bei ${CEMBRA.name} sind es rund ${CEMBRA_TRANSFER_DISPLAY} inkl. MWST: ` +
  `${formatChf(CEMBRA.feesExclVatChf.halterwechsel)} für den Halterwechsel plus ` +
  `${formatChf(CEMBRA.feesExclVatChf.fahrzeugausweisUmschreibung)} für die Umschreibung des Fahrzeugausweises, ` +
  `jeweils exkl. MWST.`;

const CA_FEE_TEXT =
  `Bei ${CA_AUTO_FINANCE.name}, dem ${CA_AUTO_FINANCE.role}, kostet die Vertragsumschreibung ` +
  `${formatChf(CA_AUTO_FINANCE.feesExclVatChf.vertragsumschreibung)} exkl. MWST, also ` +
  `${formatChfRappen(CA_AUTO_FINANCE_TRANSFER_INCL_VAT_CHF)} inkl. MWST (AVB ${CA_AUTO_FINANCE.clauses.gebuehren}).`;

/** What a takeover rate leaves out. Used in the cost section and the FAQ. */
const TAKEOVER_EXTRA_COSTS =
  "Versicherung und Verkehrssteuer zahlst du bei einer Leasingübernahme zusätzlich zur Rate, Reifen und Service " +
  "ebenfalls, sofern der übernommene Vertrag kein Servicepaket enthält.";

// ── FAQ: visible text and FAQPage JSON-LD come from these strings ─────────────

const FAQ: { question: string; answer: string }[] = [
  {
    question: "Wie lange läuft ein Auto-Abo?",
    answer:
      `Die Abo-Beispiele auf dieser Seite haben feste Laufzeiten: ${ABO_TERM_RANGE} (${ABO_STAND_LABEL}). ` +
      "Was bei einem vorzeitigen Ausstieg gilt, steht in den Konditionen des jeweiligen Anbieters.",
  },
  {
    question: "Welche einmaligen Kosten hat ein Auto-Abo?",
    answer: `Die Beispiele auf dieser Seite nennen diese einmaligen Kosten (${ABO_STAND_LABEL}). ${ABO_ONE_OFF_SUMMARY}.`,
  },
  {
    question: "Was kommt bei einer Leasingübernahme zur Rate dazu?",
    answer:
      `${TAKEOVER_EXTRA_COSTS} Einmalig kommen die Gebühr der Leasinggesellschaft für die Übertragung ` +
      `(bei ${CEMBRA.name} rund ${CEMBRA_TRANSFER_DISPLAY} inkl. MWST, bei ${CA_AUTO_FINANCE.name} ` +
      `${formatChfRappen(CA_AUTO_FINANCE_TRANSFER_INCL_VAT_CHF)} inkl. MWST) und der neue Fahrzeugausweis dazu: ` +
      `${CANTONAL_FAHRZEUGAUSWEIS_RANGE_LABEL}, je nach Kanton.`,
  },
];

const PAGE_SOURCES: FactSource[] = [
  ...ABO_SOURCES,
  CEMBRA.source,
  CA_AUTO_FINANCE.source,
  AMAG_LEASING.source,
  PORSCHE_FINANCIAL_SERVICES.source,
  ...CANTONAL_FAHRZEUGAUSWEIS_RANGE_SOURCES,
];

// ── Live data (getStaticProps) ────────────────────────────────────────────────

/** Live BuyAuto takeovers of the same model as one Auto-Abo example. */
interface SameModelRow {
  offerUrl: string;
  total: number;
  listings: MatchedTakeover[];
}

interface PageProps {
  /** Live Leasingübernahme stats; null when the read failed (numbers hidden). */
  stats: InventoryStats | null;
  /** Abo examples with at least one live takeover of the same model; null when the read failed. */
  sameModel: SameModelRow[] | null;
}

function SectionHeading({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-24 text-2xl font-bold tracking-tight text-neutral-900">
      {children}
    </h2>
  );
}

function AboProviderCard({ provider }: { provider: AutoAboProvider }) {
  return (
    <article className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5">
      <h3 className="text-lg font-semibold text-neutral-900">
        {provider.name}
        {provider.scope ? (
          <span className="text-sm font-normal text-neutral-500"> ({provider.scope})</span>
        ) : null}
      </h3>

      <ul className="mt-3 space-y-3">
        {provider.offers.map((offer) => (
          <li key={offer.url}>
            <SourceLink source={{ title: offer.model, url: offer.url }} className="font-medium text-neutral-900" />
            <p className="mt-0.5 text-neutral-800">
              <span className="text-lg font-bold">{formatChf(offer.monthlyChf)}</span> pro Monat ·{" "}
              {offer.termMonths} Monate · {formatSwissInt(offer.kmPerMonth)} km pro Monat
            </p>
            {offer.detail ? <p className="text-sm text-neutral-500">{offer.detail}</p> : null}
          </li>
        ))}
      </ul>

      <dl className="mt-4 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[8.5rem_1fr] sm:gap-y-2">
        <dt className="text-neutral-500">Einmalige Kosten</dt>
        <dd className="mb-2 text-neutral-800 sm:mb-0">{provider.oneOffCosts.join(", ")}</dd>
        <dt className="text-neutral-500">Inbegriffen</dt>
        <dd className="mb-2 text-neutral-800 sm:mb-0">{provider.included}</dd>
        <dt className="text-neutral-500">Selbstbehalt</dt>
        <dd className="mb-2 text-neutral-800 sm:mb-0">{provider.selbstbehalt}</dd>
        {provider.extraKm ? (
          <>
            <dt className="text-neutral-500">Mehrkilometer</dt>
            <dd className="mb-2 text-neutral-800 sm:mb-0">{provider.extraKm}</dd>
          </>
        ) : null}
        <dt className="text-neutral-500">Konditionen</dt>
        <dd className="text-neutral-800">
          {provider.conditionsUrl ? (
            <SourceLink source={{ title: `Konditionen von ${provider.name}`, url: provider.conditionsUrl }} />
          ) : (
            "auf den verlinkten Angebotsseiten"
          )}
        </dd>
      </dl>
    </article>
  );
}

function SameModelCard({ row }: { row: SameModelRow }) {
  const entry = ABO_OFFERS.find(({ offer }) => offer.url === row.offerUrl);
  if (!entry || row.listings.length === 0) return null;
  const { provider, offer } = entry;

  return (
    <article className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5">
      <h3 className="text-lg font-semibold text-neutral-900">{offer.model}</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-neutral-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Auto-Abo bei {provider.name}</p>
          <p className="mt-1 text-neutral-800">
            <span className="text-xl font-bold">{formatChf(offer.monthlyChf)}</span> pro Monat
          </p>
          <p className="text-sm text-neutral-700">
            {offer.termMonths} Monate Laufzeit, {formatSwissInt(offer.kmPerMonth)} km pro Monat
          </p>
          <p className="mt-2 text-sm text-neutral-600">Inbegriffen: {provider.included}</p>
          <p className="mt-2 text-xs text-neutral-500">
            <SourceLink source={{ title: `Angebot von ${provider.name}`, url: offer.url }} />, {ABO_STAND_LABEL}
          </p>
        </div>

        <div className="rounded-lg border border-neutral-200 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {countLabel(row.total, "Leasingübernahme", "Leasingübernahmen")} aktuell auf BuyAuto
          </p>
          <ul className="mt-1 divide-y divide-neutral-100">
            {row.listings.map((listing) => (
              <li key={listing.id} className="py-2">
                <Link href={listing.href} className="font-medium text-neutral-900 underline underline-offset-2">
                  {listing.title}
                </Link>
                {listing.year !== null ? <span className="text-neutral-600">, Jahrgang {listing.year}</span> : null}{" "}
                <span className="block text-sm text-neutral-800">
                  <span className="font-bold">{formatChf(listing.rateChf)}</span> pro Monat
                  {listing.months !== null ? `, noch ${countLabel(listing.months, "Monat", "Monate")}` : ""}
                  {listing.kautionChf !== null && listing.kautionChf > 0
                    ? `, Kaution ${formatChf(listing.kautionChf)}`
                    : ""}
                </span>
              </li>
            ))}
          </ul>
          {row.total > row.listings.length ? (
            <p className="text-xs text-neutral-500">
              Gezeigt: {row.listings.length} von {row.total} Inseraten, neueste Jahrgänge zuerst.
            </p>
          ) : null}
          <p className="mt-2 text-sm text-neutral-600">
            Ohne Versicherung und Verkehrssteuer; Reifen und Service je nach Vertrag.
          </p>
        </div>
      </div>
    </article>
  );
}

export default function LeasinguebernahmeVsAutoAboPage({ stats, sameModel }: PageProps) {
  const liveStats = stats && stats.count > 0 && stats.medianRate !== null ? stats : null;
  const sameModelRows = (sameModel ?? []).filter((row) => row.listings.length > 0);

  return (
    <>
      <Head>
        <title>{META_TITLE}</title>
        <meta name="description" content={META_DESCRIPTION} />
        <link rel="canonical" href={PAGE_URL} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: H1,
              author: { "@type": "Person", name: "Vincent Hänggi", jobTitle: "Gründer von BuyAuto" },
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
              mainEntity: FAQ.map((item) => ({
                "@type": "Question",
                name: item.question,
                acceptedAnswer: { "@type": "Answer", text: item.answer },
              })),
            }),
          }}
        />

        <meta property="og:title" content={H1} />
        <meta property="og:description" content={OG_DESCRIPTION} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={PAGE_URL} />
      </Head>

      {/* Schema only, as before: the page has no visible crumb bar. */}
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Leasingübernahme", href: "/leasinguebernahme" },
          { name: "Übernahme vs. Auto-Abo", href: PAGE_PATH },
        ]}
      />

      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
          {/* 1. Answer first */}
          <header>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">{H1}</h1>
            <p className="mt-4 text-lg leading-relaxed text-neutral-700">
              Ein Auto-Abo bündelt Versicherung, Verkehrssteuer, Reifen und Service in einem Monatspreis für eine
              feste Laufzeit. Bei einer Leasingübernahme zahlst du die bestehende Rate eines laufenden
              Leasingvertrags für dessen Restlaufzeit weiter und organisierst Versicherung und Service selbst. Was
              das in Franken heisst, zeigen unten die Abo-Preise von {PROVIDER_NAMES} und die Kosten einer
              Übernahme.
            </p>
            <AuthorBox path={PAGE_PATH} className="mt-5" />
          </header>

          {/* 2. Auto-Abo: what it includes and costs (F10) */}
          <section aria-labelledby="auto-abo" className="py-8 sm:py-10">
            <SectionHeading id="auto-abo">Was ein Auto-Abo enthält und kostet</SectionHeading>
            <p className="mt-3 leading-relaxed text-neutral-700">
              {countLabel(ABO_OFFERS.length, "Angebot", "Angebote")} von {PROVIDER_NAMES},{" "}
              <strong className="font-semibold text-neutral-900">{ABO_STAND_LABEL}</strong>. Die Preise können sich
              seither geändert haben. Massgebend ist die verlinkte Angebotsseite des Anbieters.
            </p>
            <div className="mt-5 space-y-4">
              {AUTO_ABO_PROVIDERS.map((provider) => (
                <AboProviderCard key={provider.name} provider={provider} />
              ))}
            </div>
          </section>

          {/* 3. Takeover: what it costs */}
          <section aria-labelledby="kosten-uebernahme" className="border-t border-neutral-200 py-8 sm:py-10">
            <SectionHeading id="kosten-uebernahme">Was eine Leasingübernahme kostet</SectionHeading>
            <p className="mt-3 leading-relaxed text-neutral-700">
              Du übernimmst die Monatsrate des laufenden Vertrags bis zu dessen Ende. Wie hoch sie ist und wie
              lange der Vertrag noch läuft, steht im jeweiligen Inserat.
            </p>

            {liveStats ? (
              <div className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Aktuell auf BuyAuto</p>
                <dl className="mt-2 grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm text-neutral-600">
                      Median der Monatsraten der{" "}
                      {countLabel(liveStats.count, "aktuellen Leasingübernahme", "aktuellen Leasingübernahmen")}
                    </dt>
                    <dd className="text-2xl font-bold text-neutral-900">{formatChf(liveStats.medianRate as number)}</dd>
                  </div>
                  {liveStats.medianMonths !== null ? (
                    <div>
                      <dt className="text-sm text-neutral-600">Median der Restlaufzeit dieser Angebote</dt>
                      <dd className="text-2xl font-bold text-neutral-900">
                        {countLabel(liveStats.medianMonths, "Monat", "Monate")}
                      </dd>
                    </div>
                  ) : null}
                </dl>
                <p className="mt-2 text-xs text-neutral-500">Über alle Modelle und Jahrgänge, ohne Versicherung und Steuer.</p>
              </div>
            ) : null}

            <h3 className="mt-6 text-lg font-semibold text-neutral-900">Laufende Kosten neben der Rate</h3>
            <p className="mt-2 leading-relaxed text-neutral-700">
              {TAKEOVER_EXTRA_COSTS} Diese Kosten hängen von Fahrzeug, Kanton und Versicherung ab, deshalb nennt
              diese Seite keine Beträge dafür. Was der Vertrag verlangt, steht in den Leasingbedingungen: AMAG
              Leasing schreibt für Neuwagen eine Vollkaskoversicherung vor, bei Occasionen nach Absprache eine
              Teilkasko ({AMAG_LEASING.clauses.versicherung}), und das Fahrzeug wird in der Regel auf dich eingelöst (
              {AMAG_LEASING.clauses.immatrikulation}).{" "}
              <SourceCitation source={AMAG_LEASING.source} className="mt-1 block text-sm text-neutral-500" />
            </p>

            <h3 className="mt-6 text-lg font-semibold text-neutral-900">Einmalige Kosten</h3>
            <ul className="mt-2 list-disc space-y-3 pl-5 leading-relaxed text-neutral-700">
              <li>
                Die Leasinggesellschaft kann für die Übertragung eine Gebühr verlangen. {CEMBRA_FEE_TEXT} {CA_FEE_TEXT}{" "}
                Die übrigen Leasinggesellschaften in unserer Übersicht publizieren keinen Tarif für die Übernahme:{" "}
                <Link href={LENDER_TABLE_HREF} className="font-medium text-primary underline underline-offset-2">
                  Gebühren nach Leasinggesellschaft
                </Link>
                .{" "}
                <span className="mt-1 block text-sm text-neutral-500">
                  Quellen: <SourceCitation source={CEMBRA.source} prefix="" />;{" "}
                  <SourceCitation source={CA_AUTO_FINANCE.source} prefix="" />
                </span>
              </li>
              <li>
                Beim Strassenverkehrsamt fällt eine eigene Gebühr an.{" "}
                {CANTONAL_FAHRZEUGAUSWEIS_SUMMARY}{" "}
                <Link href={CANTONAL_FEES_HREF} className="font-medium text-primary underline underline-offset-2">
                  Alle {CANTONAL_FEES.length} Kantone im Überblick
                </Link>
                .{" "}
                <span className="mt-1 block text-sm text-neutral-500">
                  Quellen:{" "}
                  {CANTONAL_FAHRZEUGAUSWEIS_RANGE_SOURCES.map((source, i) => (
                    <span key={source.url}>
                      {i > 0 ? "; " : null}
                      <SourceCitation source={source} prefix="" />
                    </span>
                  ))}
                </span>
              </li>
              <li>{kautionSentence(stats)}</li>
            </ul>
          </section>

          {/* 4. Same model, both ways (live; hidden without a match) */}
          {sameModelRows.length > 0 ? (
            <section aria-labelledby="gleiches-modell" className="border-t border-neutral-200 py-8 sm:py-10">
              <SectionHeading id="gleiches-modell">Dasselbe Modell als Abo und als Übernahme</SectionHeading>
              <p className="mt-3 leading-relaxed text-neutral-700">
                {sameModelRows.length === 1 ? "Für dieses Abo-Beispiel" : "Für diese Abo-Beispiele"} gibt es gerade
                mindestens eine Leasingübernahme desselben Modells auf BuyAuto. Der
                Abo-Preis enthält Versicherung, Verkehrssteuer, Reifen und Service. Bei der Übernahme kommen
                Versicherung und Verkehrssteuer zur Rate dazu, Reifen und Service ebenfalls, sofern der Vertrag kein
                Servicepaket enthält. Jahrgang, Motor, Kilometerstand und Restlaufzeit unterscheiden sich von Inserat
                zu Inserat.
              </p>
              <div className="mt-5 space-y-4">
                {sameModelRows.map((row) => (
                  <SameModelCard key={row.offerUrl} row={row} />
                ))}
              </div>
            </section>
          ) : null}

          {/* 5. When each fits */}
          <section aria-labelledby="wann-was-passt" className="border-t border-neutral-200 py-8 sm:py-10">
            <SectionHeading id="wann-was-passt">Wann was passt</SectionHeading>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-neutral-200 p-4">
                <h3 className="font-semibold text-neutral-900">Ein Auto-Abo passt eher, wenn …</h3>
                <p className="mt-2 leading-relaxed text-neutral-700">
                  du für eine feste Laufzeit ein Auto suchst und Versicherung, Verkehrssteuer, Reifen und Service
                  mit einem Monatspreis bezahlen willst. Bei den Beispielen oben laufen die Abos {ABO_TERM_RANGE}.
                  Dazu kommen einmalige Kosten und im Schadenfall der Selbstbehalt.
                </p>
              </div>
              <div className="rounded-xl border border-neutral-200 p-4">
                <h3 className="font-semibold text-neutral-900">Eine Leasingübernahme passt eher, wenn …</h3>
                <p className="mt-2 leading-relaxed text-neutral-700">
                  dir die Restlaufzeit eines laufenden Vertrags passt und du Versicherung, Verkehrssteuer und
                  Service selbst organisierst. Ob die Übernahme günstiger ist, zeigt erst die Summe: Rate plus deine
                  eigenen Kosten für Versicherung, Steuer und Service, verglichen mit dem Abo-Preis für ein
                  ähnliches Auto.
                </p>
              </div>
            </div>
            <p className="mt-4 leading-relaxed text-neutral-700">
              Bei der Übernahme muss die Leasinggesellschaft zustimmen, und sie prüft deine Bonität. Bei Porsche
              Financial Services ist eine Übertragung nur mit vorheriger schriftlicher Zustimmung möglich (ALB{" "}
              {PORSCHE_FINANCIAL_SERVICES.transferClause}), AMAG Leasing holt unter anderem Auskünfte bei ZEK und
              IKO ein (ALB {AMAG_LEASING.clauses.bonitaetspruefung}).{" "}
              <span className="text-sm text-neutral-500">
                Quellen: <SourceCitation source={PORSCHE_FINANCIAL_SERVICES.source} prefix="" />;{" "}
                <SourceCitation source={AMAG_LEASING.source} prefix="" />
              </span>
            </p>
            <p className="mt-3 leading-relaxed text-neutral-700">
              Wie eine Übernahme Schritt für Schritt abläuft, steht im{" "}
              <Link href="/leasinguebernahme" className="font-medium text-primary underline underline-offset-2">
                Ratgeber zur Leasingübernahme
              </Link>
              . Alle Gebühren findest du unter{" "}
              <Link href="/leasinguebernahme-kosten" className="font-medium text-primary underline underline-offset-2">
                Kosten der Leasingübernahme
              </Link>
              .
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg" className="h-auto whitespace-normal py-3 font-semibold">
                <Link href={HUB_HREF}>
                  Aktuelle Leasingübernahmen ansehen
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-auto whitespace-normal py-3 font-semibold">
                <Link href="/inserat-erstellen">Eigenen Leasingvertrag inserieren</Link>
              </Button>
            </div>
          </section>

          {/* FAQ: same strings as the FAQPage JSON-LD */}
          <section aria-labelledby="faq" className="border-t border-neutral-200 py-8 sm:py-10">
            <SectionHeading id="faq">Häufige Fragen</SectionHeading>
            <div className="mt-4 space-y-5">
              {FAQ.map((item) => (
                <div key={item.question}>
                  <h3 className="font-semibold text-neutral-900">{item.question}</h3>
                  <p className="mt-1 leading-relaxed text-neutral-700">{item.answer}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 6. Sources */}
          <SourcesList sources={PAGE_SOURCES} className="border-t border-neutral-200 pt-8" />
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps<PageProps> = async () => {
  let stats: InventoryStats | null = null;
  let sameModel: SameModelRow[] | null = null;

  try {
    // One read of the live index for both: the stats are getLiveInventoryStats()'s computation.
    const takeovers = liveTakeovers(await getPublicOfferIndex());
    stats = computeInventoryStats(takeovers.map((o) => o.offer));

    const candidates: TakeoverCandidate[] = takeovers.map((o) => ({
      id: o.id,
      brand: o.brand,
      model: o.model,
      variant: o.variant,
      year: o.year,
      rateChf: o.offer.rateChf,
      months: o.offer.months,
      kautionChf: o.offer.kautionChf,
    }));
    sameModel = ABO_OFFERS.map(({ offer }) => ({ offerUrl: offer.url, ...matchSameModel(offer, candidates) })).filter(
      (row) => row.total > 0
    );
  } catch (error) {
    console.error("Auto-Abo page: live inventory read failed:", error);
    stats = null;
    sameModel = null;
  }

  return { props: { stats, sameModel }, revalidate: 300 };
};
