import type { ReactNode } from "react";
import type { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CONTENT_LAST_UPDATED } from "@/lib/buyauto/contentDates";
import {
  AMAG_LEASING,
  BMW_FINANCIAL_SERVICES,
  CA_AUTO_FINANCE,
  CA_AUTO_FINANCE_TRANSFER_INCL_VAT_CHF,
  CANTONAL_FAHRZEUGAUSWEIS_RANGE_SOURCES,
  CANTONAL_FAHRZEUGAUSWEIS_SUMMARY,
  CANTONAL_FEES,
  CANTONAL_FEES_HREF,
  CEMBRA,
  CEMBRA_TRANSFER_DISPLAY,
  CEMBRA_TRANSFER_EXCL_VAT_CHF,
  FOUNDER_TAKEOVER,
  LENDER_TAKEOVER_FEES,
  PORSCHE_FINANCIAL_SERVICES,
  kautionSentence,
  type FactSource,
  type InventoryStats,
} from "@/lib/buyauto/facts";
import { formatChf, formatChfRappen } from "@/lib/buyauto/format";
import { pricingPlans } from "@/lib/buyauto/stripe_config";
import { getLiveInventoryStats } from "@/services/listingsService";
import { Breadcrumbs } from "@/components/buyauto/Breadcrumbs";
import { AuthorBox } from "@/components/buyauto/AuthorBox";
import { FounderTakeoverNote } from "@/components/buyauto/FounderTakeoverNote";
import { SourceCitation, SourcesList } from "@/components/buyauto/SourceCitation";
import { Button } from "@/components/ui/button";

const PAGE_PATH = "/leasingvertrag-uebertragen";
const CANONICAL_URL = `https://www.buyauto.ch${PAGE_PATH}`;
const LAST_UPDATED_ISO = CONTENT_LAST_UPDATED[PAGE_PATH];

const TITLE = "Leasingvertrag übertragen: So gehst du vor | BuyAuto";
const H1 = "Leasingvertrag übertragen: So gehst du vor";
const META_DESCRIPTION =
  "Deinen Leasingvertrag in der Schweiz an jemanden übertragen: Vertrag prüfen, Gebühr der Leasinggesellschaft klären, Inserat, Bonitätsprüfung, Übergabe.";
const OG_TITLE = "Leasingvertrag übertragen: So gehst du als Abgeber vor";

/** Cost page anchor of the lender table (owned by the cost page). */
const LENDER_TABLE_HREF = "/leasinguebernahme-kosten#leasinggesellschaften";
/** Ausstiegsrechner on the exit page. */
const EXIT_CALCULATOR_HREF = "/leasing-abgeben-schweiz#rechner";

// ── Copy built from facts.ts (no hand-typed numbers) ───────────────────────

/** "A, B und C" */
function joinGerman(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} und ${items[items.length - 1]}`;
}

/** Lenders in the facts module that publish no transfer fee. */
const LENDERS_WITHOUT_PUBLISHED_FEE = joinGerman(
  LENDER_TAKEOVER_FEES.filter((l) => l.feeExclVatChf === null).map((l) => l.name)
);

const STANDARD_PLAN = pricingPlans.standard;
/** "gratis" only while the Standard plan really costs CHF 0 (stripe_config is the pricing source). */
const STANDARD_PLAN_PRICE_LABEL = STANDARD_PLAN.price === 0 ? "gratis" : `für ${formatChf(STANDARD_PLAN.price)}`;

const PAGE_SOURCES: FactSource[] = [
  PORSCHE_FINANCIAL_SERVICES.source,
  CEMBRA.source,
  CA_AUTO_FINANCE.source,
  AMAG_LEASING.source,
  BMW_FINANCIAL_SERVICES.alphera.source,
  ...CANTONAL_FAHRZEUGAUSWEIS_RANGE_SOURCES,
];

const ARTICLE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: H1,
  description: META_DESCRIPTION,
  author: { "@type": "Person", name: FOUNDER_TAKEOVER.person, jobTitle: FOUNDER_TAKEOVER.role },
  publisher: {
    "@type": "Organization",
    name: "BuyAuto",
    logo: { "@type": "ImageObject", url: "https://www.buyauto.ch/share-logo.jpg" },
  },
  dateModified: LAST_UPDATED_ISO,
  mainEntityOfPage: CANONICAL_URL,
};

// ── Small layout pieces ─────────────────────────────────────────────────────

const linkClass = "font-semibold text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary";

function Cite({ sources }: { sources: FactSource[] }) {
  return (
    <p className="mt-2 text-xs text-neutral-500">
      {sources.map((source, i) => (
        <span key={source.url}>
          {i > 0 ? "; " : null}
          <SourceCitation source={source} prefix={i === 0 ? (sources.length > 1 ? "Quellen:" : "Quelle:") : ""} />
        </span>
      ))}
    </p>
  );
}

function Step({ n, title, id, children }: { n: number; title: string; id?: string; children: ReactNode }) {
  return (
    <li id={id} className="relative scroll-mt-24 pl-12">
      <span
        aria-hidden="true"
        className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white"
      >
        {n}
      </span>
      <h3 className="text-lg font-bold leading-8 text-neutral-900">{title}</h3>
      <div className="mt-2 space-y-3 text-neutral-700 leading-relaxed">{children}</div>
    </li>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

interface LeasingvertragUebertragenProps {
  /** Live Leasingübernahme stats; null when the query failed (the live sentence is then hidden). */
  stats: InventoryStats | null;
}

export default function LeasingvertragUebertragenPage({ stats }: LeasingvertragUebertragenProps) {
  const liveKaution = stats && stats.count > 0 ? kautionSentence(stats) : null;

  return (
    <>
      <Head>
        <title>{TITLE}</title>
        <meta name="description" content={META_DESCRIPTION} />
        <link rel="canonical" href={CANONICAL_URL} />
        <meta property="og:title" content={OG_TITLE} />
        <meta property="og:description" content={META_DESCRIPTION} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={CANONICAL_URL} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_JSON_LD) }} />
      </Head>

      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-4xl px-4 pb-12 pt-6 sm:px-6">
          <Breadcrumbs
            items={[
              { name: "Home", href: "/" },
              { name: "Leasingübernahme", href: "/leasinguebernahme" },
              { name: "Vertrag übertragen", href: PAGE_PATH },
            ]}
          />

          <article className="mt-6">
            <header className="max-w-3xl">
              <h1 className="text-3xl font-bold tracking-tight text-neutral-900 md:text-4xl">{H1}</h1>
              <p className="mt-4 text-lg leading-relaxed text-neutral-700">
                Du willst aus deinem Leasing aussteigen und den Vertrag an jemanden weitergeben, der ihn mit Rate und
                Restlaufzeit übernimmt. Hier stehen die Schritte aus deiner Sicht als bisheriger Leasingnehmer, belegt
                mit den Regeln und Gebühren, die die Leasinggesellschaften selbst publizieren. Wie eine
                Leasingübernahme grundsätzlich funktioniert, erklärt der Ratgeber{" "}
                <Link href="/leasinguebernahme" className={linkClass}>
                  Leasingübernahme
                </Link>
                .
              </p>
              <AuthorBox path={PAGE_PATH} className="mt-6" />
            </header>

            <section id="ablauf" aria-labelledby="ablauf-heading" className="mt-10 max-w-3xl scroll-mt-24">
              <h2 id="ablauf-heading" className="text-2xl font-bold tracking-tight text-neutral-900">
                Der Ablauf in sechs Schritten
              </h2>

              <ol className="mt-6 space-y-10">
                <Step n={1} title="Vertrag prüfen">
                  <p>Nimm deinen Leasingvertrag und die Allgemeinen Bedingungen deiner Leasinggesellschaft zur Hand. Notiere dir:</p>
                  <ul className="list-disc space-y-1 pl-5">
                    <li>die Monatsrate</li>
                    <li>das Vertragsende und damit die Restlaufzeit</li>
                    <li>die vereinbarten Kilometer und den aktuellen Kilometerstand</li>
                    <li>was der Vertrag zur Übertragung an eine andere Person sagt</li>
                  </ul>
                  <p>
                    Die Leasinggesellschaft muss der Übertragung zustimmen. {PORSCHE_FINANCIAL_SERVICES.name} schreibt
                    das in {PORSCHE_FINANCIAL_SERVICES.transferClause} der ALB so:
                  </p>
                  <blockquote className="border-l-4 border-neutral-200 pl-4 italic text-neutral-600">
                    «{PORSCHE_FINANCIAL_SERVICES.transferQuote}»
                  </blockquote>
                  <Cite sources={[PORSCHE_FINANCIAL_SERVICES.source]} />
                </Step>

                <Step n={2} title="Leasinggesellschaft anfragen und Gebühr klären">
                  <p>
                    Melde deiner Leasinggesellschaft, dass du den Vertrag übertragen willst. Frag nach dem Ablauf und
                    nach der Gebühr. Diese Gesellschaften publizieren ihren Tarif:
                  </p>
                  <ul className="list-disc space-y-2 pl-5">
                    <li>
                      {CEMBRA.name}: {formatChf(CEMBRA.feesExclVatChf.halterwechsel)} für den Halterwechsel plus{" "}
                      {formatChf(CEMBRA.feesExclVatChf.fahrzeugausweisUmschreibung)} für die Umschreibung des
                      Fahrzeugausweises, zusammen {formatChf(CEMBRA_TRANSFER_EXCL_VAT_CHF)} exkl. MWST, rund{" "}
                      {CEMBRA_TRANSFER_DISPLAY} inkl. MWST.
                      <Cite sources={[CEMBRA.source]} />
                    </li>
                    <li>
                      {CA_AUTO_FINANCE.name}, der {CA_AUTO_FINANCE.role}:{" "}
                      {formatChf(CA_AUTO_FINANCE.feesExclVatChf.vertragsumschreibung)} exkl. MWST für die
                      Vertragsumschreibung (AVB {CA_AUTO_FINANCE.clauses.gebuehren}), also{" "}
                      {formatChfRappen(CA_AUTO_FINANCE_TRANSFER_INCL_VAT_CHF)} inkl. MWST.
                      <Cite sources={[CA_AUTO_FINANCE.source]} />
                    </li>
                  </ul>
                  <p>
                    {LENDERS_WITHOUT_PUBLISHED_FEE} publizieren keine Gebühr für die Übertragung. Dort fragst du direkt
                    nach. Alle Gesellschaften im Überblick stehen in der{" "}
                    <Link href={LENDER_TABLE_HREF} className={linkClass}>
                      Tabelle der Leasinggesellschaften
                    </Link>
                    .
                  </p>
                  <p>Kläre mit der Person, die übernimmt, wer die Gebühr bezahlt, und haltet es schriftlich fest.</p>
                  <FounderTakeoverNote
                    variant="inline"
                    className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700"
                  />
                </Step>

                <Step n={3} title="Inserat auf BuyAuto erstellen">
                  <p>
                    Im Inserat gibst du die Monatsrate und das Vertragsende an, dazu, ob du eine Kaution verlangst, und
                    auf Wunsch die verbleibenden Kilometer. Das Standard-Inserat ist {STANDARD_PLAN_PRICE_LABEL} und{" "}
                    {STANDARD_PLAN.duration_days} Tage online (
                    <Link href="/preise" className={linkClass}>
                      Preise
                    </Link>
                    ).
                  </p>
                  {liveKaution ? <p>{liveKaution}</p> : null}
                  <div>
                    <Button asChild size="lg" className="h-12 rounded-xl px-6 text-base font-semibold">
                      <Link href="/inserat-erstellen">
                        Inserat erstellen
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                  </div>
                </Step>

                <Step n={4} title="Die Leasinggesellschaft prüft die übernehmende Person">
                  <p>
                    Wer deinen Vertrag übernehmen will, stellt bei deiner Leasinggesellschaft einen Antrag. Die
                    Leasinggesellschaft prüft die Bonität und holt dafür Auskünfte bei der ZEK und der IKO ein. So steht es bei{" "}
                    {AMAG_LEASING.name} in {AMAG_LEASING.clauses.bonitaetspruefung} der ALB und bei{" "}
                    {CA_AUTO_FINANCE.name} in den AVB unter {CA_AUTO_FINANCE.clauses.bonitaetspruefung}. Danach entscheidet
                    sie, ob sie der Übertragung zustimmt.
                  </p>
                  <p>Bis der Vertrag umgeschrieben ist, bleibst du Leasingnehmer und zahlst die Raten.</p>
                  <Cite sources={[AMAG_LEASING.source, CA_AUTO_FINANCE.source]} />
                </Step>

                <Step n={5} title="Vertrag umschreiben, neuer Fahrzeugausweis">
                  <p>
                    Stimmt die Leasinggesellschaft zu, schreibt sie den Vertrag auf die neue Person um. Bei{" "}
                    {BMW_FINANCIAL_SERVICES.alphera.name} heisst es dazu: «{BMW_FINANCIAL_SERVICES.alphera.quote}» Lass
                    dir schriftlich bestätigen, ab welchem Datum der Vertrag auf die neue Person läuft.
                  </p>
                  <Cite sources={[BMW_FINANCIAL_SERVICES.alphera.source]} />
                  <p>
                    Das Auto wird in der Regel auf die Person eingelöst, die es least (bei {AMAG_LEASING.name}{" "}
                    {AMAG_LEASING.clauses.immatrikulation} der ALB). Das Strassenverkehrsamt stellt deshalb einen neuen
                    Fahrzeugausweis auf die übernehmende Person aus. {CANTONAL_FAHRZEUGAUSWEIS_SUMMARY} Die Tarife aller{" "}
                    {CANTONAL_FEES.length} Kantone mit Quellen stehen in der{" "}
                    <Link href={CANTONAL_FEES_HREF} className={linkClass}>
                      Tabelle der kantonalen Gebühren
                    </Link>
                    .
                  </p>
                  <Cite sources={[AMAG_LEASING.source, ...CANTONAL_FAHRZEUGAUSWEIS_RANGE_SOURCES]} />
                  <p>
                    Neue Kontrollschilder braucht die übernehmende Person nur, wenn sie keine eigenen hat. Deine
                    Schilder zu übernehmen, ist in den meisten Kantonen eingeschränkt oder kostet extra. Die übernehmende Person
                    braucht deshalb eigene oder neue Schilder.
                  </p>
                </Step>

                <Step n={6} title="Auto übergeben, mit Protokoll" id="tipps">
                  <p>
                    Gib das Auto ab, wenn die schriftliche Zustimmung der Leasinggesellschaft vorliegt und der Vertrag
                    umgeschrieben ist. Haltet die Übergabe in einem Protokoll fest, das ihr beide unterschreibt:
                  </p>
                  <ul className="list-disc space-y-1 pl-5">
                    <li>Datum und Kilometerstand</li>
                    <li>Schäden und Mängel, mit Fotos</li>
                    <li>Schlüssel, Serviceheft und Zubehör wie Winterräder</li>
                  </ul>
                  <p>
                    Frag deine Versicherung, ab wann deine Police für dieses Auto endet, und dein Strassenverkehrsamt,
                    was mit deinen Kontrollschildern passiert.
                  </p>
                </Step>
              </ol>
            </section>

            <section
              id="andere-wege"
              aria-labelledby="andere-wege-heading"
              className="mt-12 max-w-3xl rounded-2xl border border-neutral-200 bg-neutral-50 p-5 scroll-mt-24"
            >
              <h2 id="andere-wege-heading" className="text-xl font-bold tracking-tight text-neutral-900">
                Lieber auf einem anderen Weg aus dem Vertrag?
              </h2>
              <p className="mt-2 leading-relaxed text-neutral-700">
                Die anderen Wege aus dem Vertrag sind die vorzeitige Auflösung und das Rauskaufen mit anschliessendem
                Verkauf. Der{" "}
                <Link href={EXIT_CALCULATOR_HREF} className={linkClass}>
                  Ausstiegsrechner
                </Link>{" "}
                vergleicht die drei Wege mit deinen eigenen Zahlen.
              </p>
            </section>

            <SourcesList sources={PAGE_SOURCES} className="mt-12 max-w-3xl" />
          </article>
        </div>
      </main>
    </>
  );
}

// ISR: static HTML refreshed every 5 minutes. The live Kaution sentence in step 3 comes from
// the current Leasingübernahme listings; on a failed query it is left out (no fallback number).
export const getStaticProps: GetStaticProps<LeasingvertragUebertragenProps> = async () => {
  let stats: InventoryStats | null = null;
  try {
    stats = await getLiveInventoryStats();
  } catch (error) {
    console.error("Leasingvertrag übertragen: live inventory stats failed:", error);
  }
  return { props: { stats }, revalidate: 300 };
};
