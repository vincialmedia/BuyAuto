import type { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowDown, ArrowRight } from "lucide-react";

import { AuthorBox } from "@/components/buyauto/AuthorBox";
import { Breadcrumbs } from "@/components/buyauto/Breadcrumbs";
import { ExitCalculator } from "@/components/buyauto/ExitCalculator";
import { FounderTakeoverNote } from "@/components/buyauto/FounderTakeoverNote";
import { SourceCitation, SourcesList } from "@/components/buyauto/SourceCitation";
import { ModernListingCard } from "@/components/buyauto/search/ModernListingCard";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import { CONTENT_LAST_UPDATED } from "@/lib/buyauto/contentDates";
import {
  AMAG_LEASING,
  CA_AUTO_FINANCE,
  CA_AUTO_FINANCE_TRANSFER_INCL_VAT_CHF,
  CANTONAL_FAHRZEUGAUSWEIS_RANGE_LABEL,
  CANTONAL_FEES,
  CANTONAL_FEES_HREF,
  CEMBRA,
  CEMBRA_TRANSFER_DISPLAY,
  FAHRZEUGAUSWEIS_RANGE,
  FOUNDER_TAKEOVER,
  KKG,
  LENDER_TAKEOVER_FEES,
  MERCEDES_BENZ_FINANCIAL_SERVICES,
  PORSCHE_FINANCIAL_SERVICES,
  type FactSource,
} from "@/lib/buyauto/facts";
import { formatChf, formatChfRappen } from "@/lib/buyauto/format";
import { pricingPlans } from "@/lib/buyauto/stripe_config";
import type { Listing } from "@/lib/buyauto/types";
import { searchListingsOrThrow } from "@/services/listingsService";

type LeasingAbgebenPageProps = {
  /** Newest live Leasingübernahmen; empty when there are none or the read failed (block hidden). */
  takeoverListings: Listing[];
};

const PAGE_PATH = "/leasing-abgeben-schweiz";
const PAGE_URL = `https://www.buyauto.ch${PAGE_PATH}`;
const LAST_UPDATED_ISO = CONTENT_LAST_UPDATED[PAGE_PATH];

const TITLE = "Leasing abgeben oder vorzeitig auflösen: Rechner | BuyAuto";
const H1 = "Leasing vorzeitig beenden: abgeben, auflösen oder rauskaufen";
const DESCRIPTION =
  "Leasing abgeben, vorzeitig auflösen oder rauskaufen: Der Ausstiegsrechner vergleicht die drei Wege mit deinen Zahlen und den publizierten Gebühren.";

const CTA_HREF = "/inserat-erstellen";
const CTA_LABEL = "Inserat erstellen";

const LENDER_TABLE_HREF = "/leasinguebernahme-kosten#leasinggesellschaften";

// ── Figures, all from facts.ts / stripe_config.ts ─────────────────────────────

const AMAG_TERMINATION_FEE = formatChf(AMAG_LEASING.feesExclVatChf.vorzeitigeVertragsaufloesung); // CHF 900
const AMAG_PROVISIONAL_FEE = formatChf(AMAG_LEASING.feesExclVatChf.provisorischeAufloesungskosten); // CHF 250
const PORSCHE_PROVISIONAL = PORSCHE_FINANCIAL_SERVICES.feeQuotes.provisorischeAufloesungsberechnung; // 4.8 b, CHF 125
const CA_TRANSFER_INCL = formatChfRappen(CA_AUTO_FINANCE_TRANSFER_INCL_VAT_CHF); // CHF 432.40
const CEMBRA_TRANSFER = `rund ${CEMBRA_TRANSFER_DISPLAY} inkl. MWST`; // (500 + 75) × 1.081, rounded
const STANDARD_PLAN = pricingPlans.standard;

/** Lenders without a published takeover fee, in the order of the fee list. */
const UNPUBLISHED_LENDER_NAMES = (() => {
  const names = LENDER_TAKEOVER_FEES.filter((l) => l.feeExclVatChf === null).map((l) => l.name);
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} und ${names[names.length - 1]}` : names.join("");
})();

/** Official tariffs behind the cheapest and the dearest Fahrzeugausweis (the range printed on the page). */
const CANTONAL_RANGE_SOURCES: FactSource[] = [
  ...FAHRZEUGAUSWEIS_RANGE.min.codes,
  ...FAHRZEUGAUSWEIS_RANGE.max.codes,
].flatMap((code) => {
  const canton = CANTONAL_FEES.find((c) => c.code === code);
  return canton ? [{ title: `Tarif ${canton.name}`, url: canton.sourceUrl, stand: canton.stand }] : [];
});

const STANDARD_PLAN_SENTENCE =
  STANDARD_PLAN.price === 0
    ? `Das Standard-Inserat ist gratis und ${STANDARD_PLAN.duration_days} Tage online.`
    : `Das Standard-Inserat kostet ${formatChf(STANDARD_PLAN.price)}.`;

// ── FAQ: one string feeds the accordion and the FAQPage JSON-LD ───────────────

const FAQS: { q: string; a: string }[] = [
  {
    q: "Kann ich mein Leasing zurückgeben?",
    a:
      `Einen privaten Leasingvertrag, der unter das Konsumkreditgesetz fällt, kannst du vorzeitig kündigen ` +
      `(${KKG.terminationArticle} KKG). Was du dann noch bezahlst, berechnet deine Leasinggesellschaft.`,
  },
  {
    q: "Was kostet es, das Leasing per Übernahme abzugeben?",
    a:
      `${CEMBRA.name} publiziert für die Übertragung ${CEMBRA_TRANSFER}, ${CA_AUTO_FINANCE.name} ` +
      `${CA_TRANSFER_INCL} inkl. MWST für die Vertragsumschreibung. ${UNPUBLISHED_LENDER_NAMES} publizieren ` +
      `keinen Tarif, dort fragst du nach. Das Standard-Inserat auf BuyAuto kostet ${formatChf(STANDARD_PLAN.price)}.`,
  },
  {
    q: "Wer muss einer Leasingübernahme zustimmen?",
    a:
      `Deine Leasinggesellschaft. Bei ${PORSCHE_FINANCIAL_SERVICES.name} steht das in den Leasingbestimmungen ` +
      `(${PORSCHE_FINANCIAL_SERVICES.transferClause}). Vorher prüft die Leasinggesellschaft die Bonität der Person, ` +
      `die den Vertrag übernimmt. ${AMAG_LEASING.name} holt dafür unter anderem Auskünfte bei der ZEK und der IKO ` +
      `ein (ALB ${AMAG_LEASING.clauses.bonitaetspruefung}).`,
  },
];

// Every source behind a figure or rule on this page, for the list at the end.
const PAGE_SOURCES: FactSource[] = [
  CEMBRA.source,
  CA_AUTO_FINANCE.source,
  AMAG_LEASING.source,
  PORSCHE_FINANCIAL_SERVICES.source,
  MERCEDES_BENZ_FINANCIAL_SERVICES.source,
  KKG.source,
  ...CANTONAL_RANGE_SOURCES,
];

const ARTICLE_JSON_LD = {
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
};

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: { "@type": "Answer", text: faq.a },
  })),
};

const LINK_CLASS = "font-semibold text-primary hover:underline";

/**
 * Every conversion click on this page goes through here, so GA4/Ads can tell
 * which slot produced the listing (hero, calculator, final).
 */
function CtaButton({
  location,
  className = "",
  children = CTA_LABEL,
}: {
  location: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <Button asChild size="lg" className={className}>
      <Link href={CTA_HREF} onClick={() => track("cta_click", { cta_id: location, page_path: PAGE_PATH })}>
        {children}
        <ArrowRight className="w-5 h-5 ml-2" />
      </Link>
    </Button>
  );
}

function Quote({ children, source }: { children: ReactNode; source: FactSource }) {
  return (
    <figure className="my-3 border-l-4 border-neutral-200 pl-4">
      <blockquote className="text-neutral-700">{children}</blockquote>
      <figcaption className="mt-1 text-xs text-neutral-500">
        <SourceCitation source={source} />
      </figcaption>
    </figure>
  );
}

export default function LeasingAbgebenSchweiz({ takeoverListings }: LeasingAbgebenPageProps) {
  return (
    <>
      <Head>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <link rel="canonical" href={PAGE_URL} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_JSON_LD) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }} />

        {/* Open Graph */}
        <meta property="og:title" content={H1} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={PAGE_URL} />
      </Head>

      <div className="bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-3">
          <Breadcrumbs
            items={[
              { name: "Home", href: "/" },
              { name: "Leasingübernahme", href: "/leasinguebernahme" },
              { name: "Leasing abgeben", href: PAGE_PATH },
            ]}
          />
        </div>

        {/* 1. ANSWER FIRST */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-[1.75rem] xl:text-3xl font-black text-neutral-900 tracking-tight leading-tight">
            {H1}
          </h1>
          <div className="mt-4 max-w-3xl">
            <p className="text-lg text-neutral-700 leading-relaxed">
              Aus einem laufenden Leasing kommst du auf drei Wegen raus: Jemand übernimmt deinen Vertrag per
              Leasingübernahme, du löst ihn vorzeitig auf, oder du kaufst das Auto raus und verkaufst es. Was dich jeder
              Weg kostet, hängt von deiner Leasinggesellschaft und deinem Vertrag ab. Der Ausstiegsrechner stellt die
              drei Wege mit deinen Zahlen nebeneinander.
            </p>
            <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3">
              <CtaButton
                location="hero"
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white font-bold px-6 rounded-xl"
              />
              <a
                href="#rechner"
                className="inline-flex items-center justify-center gap-1.5 px-2 py-2 text-sm font-semibold text-neutral-700 hover:text-neutral-900 hover:underline"
              >
                Zum Ausstiegsrechner
                <ArrowDown className="w-4 h-4" />
              </a>
            </div>
            <AuthorBox path={PAGE_PATH} className="mt-6" />
          </div>
        </section>

        {/* 2. AUSSTIEGSRECHNER */}
        <section id="rechner" aria-labelledby="rechner-heading" className="scroll-mt-20 bg-neutral-50 py-8 md:py-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 id="rechner-heading" className="text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight">
              Ausstiegsrechner
            </h2>
            <p className="mt-2 max-w-3xl text-neutral-700 leading-relaxed">
              Trag ein, was du von deiner Leasinggesellschaft schon weisst. Jeder Weg rechnet nur mit den Feldern, die
              er braucht, und leere Felder füllt der Rechner nicht mit Annahmen.
            </p>

            <div className="mt-5">
              <ExitCalculator
                footer={
                  <CtaButton
                    location="calculator"
                    className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white font-bold px-6 rounded-xl"
                  />
                }
              />
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-neutral-900">So rechnet der Rechner</h3>
                  <dl className="mt-3 space-y-3 text-sm text-neutral-700 leading-relaxed">
                    <div>
                      <dt className="font-semibold text-neutral-900">Leasingübernahme</dt>
                      <dd>
                        Die Gebühr, die deine Leasinggesellschaft für die Übertragung des Vertrags publiziert, inkl.
                        MWST, plus der Preis deines Inserats auf BuyAuto. Die Gebühren stammen aus den Gebührenlisten
                        und Leasingbestimmungen der Leasinggesellschaften (
                        <Link href={LENDER_TABLE_HREF} className={LINK_CLASS}>
                          Tabelle der Leasinggesellschaften
                        </Link>
                        ). Publiziert eine Leasinggesellschaft keine Gebühr, zeigt der Rechner keinen Betrag dafür.{" "}
                        {STANDARD_PLAN_SENTENCE} Die kantonale Gebühr für den neuen Fahrzeugausweis der übernehmenden
                        Person ist nicht eingerechnet.
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-neutral-900">Vorzeitige Auflösung</dt>
                      <dd>
                        Die Nachzahlung, die deine Leasinggesellschaft in der Auflösungsofferte nennt. Der Rechner
                        übernimmt den Betrag so, wie du ihn eingibst.
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-neutral-900">Rauskaufen und verkaufen</dt>
                      <dd>
                        Ablösesumme minus Fahrzeugwert. Ist die Ablösesumme höher, zeigt der Rechner, was dir nach dem
                        Verkauf fehlt; ist das Auto mehr wert, was dir bleibt. Der Fahrzeugwert ist deine Schätzung, der
                        Verkaufspreis kann davon abweichen.
                      </dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-neutral-900">So kommst du zu den Zahlen</h3>
                  <p className="mt-2 text-sm text-neutral-700 leading-relaxed">
                    Die Nachzahlung und die Ablösesumme kennt nur deine Leasinggesellschaft. Verlang bei ihr eine
                    Auflösungsofferte mit der Nachzahlung, und frag nach der Ablösesumme, wenn du das Auto rauskaufen
                    willst. Die Berechnung kann etwas kosten:
                  </p>
                  <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-neutral-700 leading-relaxed">
                    <li>
                      {AMAG_LEASING.name} verrechnet für die Berechnung der provisorischen Auflösungskosten{" "}
                      {AMAG_PROVISIONAL_FEE} exkl. MWST (ALB {AMAG_LEASING.clauses.aufloesungsgebuehren}).{" "}
                      <SourceCitation source={AMAG_LEASING.source} className="text-xs text-neutral-500" />
                    </li>
                    <li>
                      {PORSCHE_FINANCIAL_SERVICES.name}: «{PORSCHE_PROVISIONAL.quote}» (ALB {PORSCHE_PROVISIONAL.clause}
                      ).{" "}
                      <SourceCitation source={PORSCHE_FINANCIAL_SERVICES.source} className="text-xs text-neutral-500" />
                    </li>
                  </ul>
                </div>
              </div>

              <FounderTakeoverNote variant="box" className="order-first self-start lg:order-none" />
            </div>
          </div>
        </section>

        {/* 3. THE THREE WAYS */}
        <section aria-labelledby="wege-heading" className="py-8 md:py-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <h2 id="wege-heading" className="text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight">
                Drei Wege aus dem Leasing
              </h2>

              <div id="leasinguebernahme" className="scroll-mt-20 mt-6">
                <h3 className="text-xl font-bold text-neutral-900">Leasingübernahme</h3>
                <div className="mt-2 space-y-3 text-neutral-700 leading-relaxed">
                  <p>
                    Eine andere Person übernimmt deinen Leasingvertrag. Deine Leasinggesellschaft muss zustimmen. Bei{" "}
                    {PORSCHE_FINANCIAL_SERVICES.name} steht in den Leasingbestimmungen (
                    {PORSCHE_FINANCIAL_SERVICES.transferClause}):
                  </p>
                  <Quote source={PORSCHE_FINANCIAL_SERVICES.source}>«{PORSCHE_FINANCIAL_SERVICES.transferQuote}»</Quote>
                  <p>
                    Vor der Zustimmung prüft die Leasinggesellschaft die Bonität der Person, die übernimmt.{" "}
                    {AMAG_LEASING.name} holt dafür unter anderem Auskünfte bei der ZEK und der IKO ein (ALB{" "}
                    {AMAG_LEASING.clauses.bonitaetspruefung}), {CA_AUTO_FINANCE.name} prüft bei IKO und ZEK (AVB{" "}
                    {CA_AUTO_FINANCE.clauses.bonitaetspruefung}).{" "}
                    <span className="text-xs text-neutral-500">
                      <SourceCitation source={AMAG_LEASING.source} />;{" "}
                      <SourceCitation source={CA_AUTO_FINANCE.source} prefix="" />
                    </span>
                  </p>
                  <p>
                    {CEMBRA.name} publiziert für die Übertragung {CEMBRA_TRANSFER}, {CA_AUTO_FINANCE.name} (der
                    Leasingpartner von Fiat) {CA_TRANSFER_INCL} inkl. MWST für die Vertragsumschreibung.{" "}
                    {UNPUBLISHED_LENDER_NAMES} publizieren keinen Tarif. Alle Gebühren mit Quellen stehen in der{" "}
                    <Link href={LENDER_TABLE_HREF} className={LINK_CLASS}>
                      Tabelle der Leasinggesellschaften
                    </Link>
                    . Für die übernehmende Person kommt der neue Fahrzeugausweis dazu: je nach Kanton{" "}
                    {CANTONAL_FAHRZEUGAUSWEIS_RANGE_LABEL}, siehe{" "}
                    <Link href={CANTONAL_FEES_HREF} className={LINK_CLASS}>
                      Gebühren nach Kanton
                    </Link>
                    .{" "}
                    <span className="text-xs text-neutral-500">
                      <SourceCitation source={CEMBRA.source} />;{" "}
                      <SourceCitation source={CA_AUTO_FINANCE.source} prefix="" />
                    </span>
                  </p>
                  <p>
                    Wie du als bisheriger Leasingnehmer vorgehst, steht in der Anleitung{" "}
                    <Link href="/leasingvertrag-uebertragen" className={LINK_CLASS}>
                      Leasingvertrag übertragen
                    </Link>
                    . Wie eine Übernahme für beide Seiten abläuft, erklärt der{" "}
                    <Link href="/leasinguebernahme" className={LINK_CLASS}>
                      Ratgeber zur Leasingübernahme
                    </Link>
                    .
                  </p>
                </div>
              </div>

              <div id="vorzeitige-aufloesung" className="scroll-mt-20 mt-8">
                <h3 className="text-xl font-bold text-neutral-900">Vorzeitige Auflösung</h3>
                <div className="mt-2 space-y-3 text-neutral-700 leading-relaxed">
                  <p>
                    Einen privaten Leasingvertrag, der unter das Konsumkreditgesetz fällt, kannst du vorzeitig kündigen
                    ({KKG.terminationArticle} KKG). Was du dann noch bezahlst, berechnet deine Leasinggesellschaft.{" "}
                    <SourceCitation source={KKG.source} className="text-xs text-neutral-500" />
                  </p>
                  <p>
                    {AMAG_LEASING.name} verrechnet bei einer vorzeitigen Vertragsauflösung pauschal{" "}
                    {AMAG_TERMINATION_FEE} exkl. MWST (ALB {AMAG_LEASING.clauses.aufloesungsgebuehren}) und berechnet
                    die Raten rückwirkend neu ({AMAG_LEASING.clauses.rueckwirkendeNeuberechnung}).{" "}
                    <SourceCitation source={AMAG_LEASING.source} className="text-xs text-neutral-500" />
                  </p>
                  <p>{MERCEDES_BENZ_FINANCIAL_SERVICES.name} schreibt zu privaten Leasingverträgen:</p>
                  <Quote source={MERCEDES_BENZ_FINANCIAL_SERVICES.source}>
                    «{MERCEDES_BENZ_FINANCIAL_SERVICES.terminationQuote}»
                  </Quote>
                </div>
              </div>

              <div id="rauskaufen" className="scroll-mt-20 mt-8">
                <h3 className="text-xl font-bold text-neutral-900">Rauskaufen und verkaufen</h3>
                <p className="mt-2 text-neutral-700 leading-relaxed">
                  Du zahlst der Leasinggesellschaft die Ablösesumme und verkaufst das Auto danach selbst. Was dir am
                  Ende fehlt oder bleibt, ist die Differenz zwischen Ablösesumme und Verkaufspreis. Die Ablösesumme
                  nennt dir deine Leasinggesellschaft, den Wert deines Autos schätzt du mit dem{" "}
                  <Link href="/eintauschwert-rechner" className={LINK_CLASS}>
                    Eintauschwert-Rechner
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. LIVE LISTINGS: only with live data, no fallback, no CTA */}
        {takeoverListings.length > 0 && (
          <section aria-labelledby="live-heading" className="bg-neutral-50 py-8 md:py-10">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Live auf BuyAuto</p>
              <h2 id="live-heading" className="mt-1 text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight">
                Aktuelle Leasingübernahmen auf BuyAuto
              </h2>
              <p className="mt-2 max-w-3xl text-neutral-700">
                Die neuesten Inserate für eine Leasingübernahme, so wie Interessierte sie auf BuyAuto sehen.
              </p>
              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {takeoverListings.map((listing) => (
                  <ModernListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 5. FAQ (same strings as the FAQPage JSON-LD) */}
        <section id="faq" aria-labelledby="faq-heading" className="scroll-mt-20 py-8 md:py-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <h2 id="faq-heading" className="text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight">
                Häufige Fragen
              </h2>
              <Accordion type="single" collapsible className="mt-4 w-full space-y-2">
                {FAQS.map((faq, i) => (
                  <AccordionItem
                    key={faq.q}
                    value={`item-${i}`}
                    className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 data-[state=open]:bg-white"
                  >
                    <AccordionTrigger className="text-left text-base font-bold text-neutral-900 hover:no-underline">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-base text-neutral-700 leading-relaxed">{faq.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* 6. FINAL CTA + SOURCES */}
        <section className="pb-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 sm:p-6">
                <h2 className="text-xl font-bold text-neutral-900">Leasing per Übernahme abgeben</h2>
                <p className="mt-2 text-neutral-700 leading-relaxed">
                  Für eine Leasingübernahme brauchst du jemanden, der deinen Vertrag übernehmen will. Auf BuyAuto
                  erstellst du dafür ein Inserat mit Rate, Restlaufzeit und Fahrzeug.
                </p>
                <CtaButton
                  location="final"
                  className="mt-4 w-full sm:w-auto bg-primary hover:bg-primary/90 text-white font-bold px-6 rounded-xl"
                />
              </div>

              <SourcesList sources={PAGE_SOURCES} className="mt-8" />
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps<LeasingAbgebenPageProps> = async () => {
  try {
    const results = await searchListingsOrThrow({ dealType: "lease_takeover", sort: "dateDesc" });
    // Newest three takeovers; strip undefined fields so Next can serialize.
    const takeoverListings = JSON.parse(JSON.stringify(results.items.slice(0, 3))) as Listing[];
    return { props: { takeoverListings }, revalidate: 300 };
  } catch (error) {
    // No live data: the live block is hidden (no fallback values).
    console.error("Leasing abgeben: live takeover read failed:", error);
    return { props: { takeoverListings: [] }, revalidate: 300 };
  }
};
