import type { ReactNode } from "react";
import type { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModernListingCard } from "@/components/buyauto/search/ModernListingCard";
import { AuthorBox } from "@/components/buyauto/AuthorBox";
import { FounderTakeoverNote } from "@/components/buyauto/FounderTakeoverNote";
import { SourceCitation } from "@/components/buyauto/SourceCitation";
import { getPublicOfferIndex, liveTakeovers, searchListingsOrThrow } from "@/services/listingsService";
import { BRAND_PAGES_CONTENT_UPDATED } from "@/lib/buyauto/contentDates";
import type { Listing } from "@/lib/buyauto/types";
import {
  dbBrandsFor,
  indexableBrandPages,
  isIndexableBrandCount,
  LEASING_BRANDS,
  resolveBrandSlug,
  type BrandInventoryRow,
  type LeasingBrand,
} from "@/lib/buyauto/leasingBrands";
import { brandLenderFor, type BrandLender } from "@/lib/buyauto/brandLenders";
import { supabase } from "@/integrations/supabase/client";
import {
  AMAG_LEASING,
  BMW_FINANCIAL_SERVICES,
  CA_AUTO_FINANCE,
  CA_AUTO_FINANCE_TRANSFER_INCL_VAT_CHF,
  computeInventoryStats,
  FACTS_CHECKED_ON,
  MERCEDES_BENZ_FINANCIAL_SERVICES,
  PORSCHE_FINANCIAL_SERVICES,
  type FactSource,
  type InventoryStats,
} from "@/lib/buyauto/facts";
import { formatChf, formatChfRappen, pluralize } from "@/lib/buyauto/format";

const SITE_URL = "https://www.buyauto.ch";
/** Brand pages list their whole live inventory (far below this today). */
const BRAND_PAGE_MAX_LISTINGS = 120;
const GUIDE_HREF = "/leasinguebernahme";

type BrandPageProps = {
  brand: LeasingBrand;
  listings: Listing[];
  total: number;
  /** Live stats over the brand's Leasingübernahmen; null when the read failed (numbers hidden). */
  stats: InventoryStats | null;
  /** Other indexable brand pages of the same leasing company (AMAG Kernmarken), for in-text links. */
  siblingBrands: { slug: string; name: string }[];
};

// ── Small building blocks ──────────────────────────────────────────────────

const linkClass = "text-primary underline underline-offset-2 hover:no-underline";

function Cite({ source }: { source: FactSource }) {
  // A Stand that only repeats the title ("Geschäftsbericht 2025") is not printed twice.
  const shown = source.stand && source.title.includes(source.stand) ? { title: source.title, url: source.url } : source;
  return (
    <p className="mt-1 text-xs text-neutral-500">
      <SourceCitation source={shown} />
    </p>
  );
}

/** A verbatim lender quote, in «…» (lender wording, e.g. Mercedes-Benz' «Ihrem», stays as published). */
function Quote({ children }: { children: ReactNode }) {
  return <span className="italic">«{children}»</span>;
}

function LenderBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10 max-w-3xl" aria-labelledby="leasinggesellschaft">
      <h2 id="leasinggesellschaft" className="text-xl sm:text-2xl font-bold text-neutral-900">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-neutral-700 leading-relaxed">{children}</div>
    </section>
  );
}

const CHECKED = `geprüft am ${FACTS_CHECKED_ON}`;

// ── Lender sections (facts.ts only, each fact with its source) ─────────────

const AMAG = AMAG_LEASING;
const AMAG_TERMINATION = formatChf(AMAG.feesExclVatChf.vorzeitigeVertragsaufloesung);
const AMAG_PROVISIONAL = formatChf(AMAG.feesExclVatChf.provisorischeAufloesungskosten);
const AMAG_C = AMAG.clauses;

/**
 * AMAG Leasing covers Volkswagen, Audi and Škoda (Geschäftsbericht 2025). The three
 * pages state the same published facts, each in its own words, so they do not repeat
 * one block of text.
 */
function AmagSection({
  brand,
  lender,
  siblingBrands,
}: {
  brand: LeasingBrand;
  lender: BrandLender;
  siblingBrands: { slug: string; name: string }[];
}) {
  const statement = <Quote>{AMAG.brandStatement.quote}</Quote>;
  // The other Kernmarken with an indexable page on BuyAuto (the links the old AMAG page carried).
  const siblings =
    siblingBrands.length > 0 ? (
      <p>
        Weitere Kernmarken mit Angeboten auf BuyAuto:{" "}
        {siblingBrands.map((b, i) => (
          <span key={b.slug}>
            {i > 0 ? (i === siblingBrands.length - 1 ? " und " : ", ") : null}
            <Link href={`/leasinguebernahme/${b.slug}`} className={linkClass}>
              {b.name}
            </Link>
          </span>
        ))}
        .
      </p>
    ) : null;

  if (brand.slug === "volkswagen") {
    return (
      <LenderBlock title="Volkswagen und AMAG Leasing">
        <div>
          <p>
            Im Geschäftsbericht 2025 beschreibt AMAG Leasing, welche Marken sie abdeckt: {statement} Volkswagen ist die
            erste der genannten Kernmarken.
          </p>
          <Cite source={AMAG.brandStatement.source} />
        </div>
        {siblings}
        <p>Ob ein inserierter VW tatsächlich über AMAG Leasing läuft, steht in seinem Leasingvertrag.</p>
        <div>
          <p>
            Die Allgemeinen Leasingbestimmungen Autos von AMAG Leasing ({AMAG.edition}) enthalten keine Gebühr für eine
            Übernahme.
            Für die vorzeitige Auflösung nennt {AMAG_C.aufloesungsgebuehren} pauschal {AMAG_TERMINATION} und für die
            Berechnung der provisorischen Auflösungskosten {AMAG_PROVISIONAL}, beides exkl. MWST; die Raten werden
            dann rückwirkend neu berechnet ({AMAG_C.rueckwirkendeNeuberechnung}). Läuft der Volkswagen über AMAG
            Leasing, prüft sie vor der Übernahme deine Bonität und holt dazu Auskünfte bei ZEK und IKO ein (
            {AMAG_C.bonitaetspruefung}). Für Neuwagen schreibt sie eine Vollkasko vor, für Occasionen kann eine
            Teilkasko vereinbart werden ({AMAG_C.versicherung}).
          </p>
          <Cite source={AMAG.source} />
        </div>
        <p>
          Die Gebühren von AMAG Leasing neben denen anderer Gesellschaften:{" "}
          <Link href={lender.costHref} className={linkClass}>
            Kosten einer Leasingübernahme
          </Link>
          . Den Ablauf Schritt für Schritt erklärt der{" "}
          <Link href={GUIDE_HREF} className={linkClass}>
            Ratgeber zur Leasingübernahme
          </Link>
          .
        </p>
      </LenderBlock>
    );
  }

  if (brand.slug === "audi") {
    return (
      <LenderBlock title="Audi und AMAG Leasing">
        <div>
          <p>Audi steht im Geschäftsbericht 2025 von AMAG Leasing unter den Kernmarken: {statement}</p>
          <Cite source={AMAG.brandStatement.source} />
        </div>
        {siblings}
        <div>
          <p>
            Welche Gesellschaft einen bestimmten Audi least, zeigt erst dessen Vertrag. Läuft er über AMAG Leasing,
            gilt laut ihren ALB {AMAG.edition}:
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>Eine Übernahmegebühr ist darin nicht aufgeführt.</li>
            <li>
              Für eine vorzeitige Auflösung verrechnet AMAG Leasing pauschal {AMAG_TERMINATION} exkl. MWST, plus{" "}
              {AMAG_PROVISIONAL} exkl. MWST für die provisorische Berechnung der Auflösungskosten (
              {AMAG_C.aufloesungsgebuehren}).
            </li>
            <li>
              Bei einer Auflösung rechnet AMAG Leasing die bisherigen Raten rückwirkend neu (
              {AMAG_C.rueckwirkendeNeuberechnung}).
            </li>
            <li>
              Ein neuer Audi muss vollkaskoversichert sein; für Occasionen lässt sich mit AMAG Leasing eine Teilkasko
              vereinbaren ({AMAG_C.versicherung}).
            </li>
            <li>Für die Kreditprüfung fragt sie bei ZEK und IKO nach ({AMAG_C.bonitaetspruefung}).</li>
          </ul>
          <Cite source={AMAG.source} />
        </div>
        <p>
          Wie AMAG Leasing neben Cembra oder CA Auto Finance dasteht, zeigt die{" "}
          <Link href={lender.costHref} className={linkClass}>
            Kostenübersicht
          </Link>
          ; die Schritte einer Übernahme stehen im{" "}
          <Link href={GUIDE_HREF} className={linkClass}>
            Ratgeber
          </Link>
          .
        </p>
      </LenderBlock>
    );
  }

  if (brand.slug === "skoda") {
    const rows: [string, string][] = [
      ["Gebühr für die Übernahme", "nicht aufgeführt"],
      [
        `Vorzeitige Auflösung, ${AMAG_C.aufloesungsgebuehren}`,
        `${AMAG_TERMINATION} exkl. MWST, dazu ${AMAG_PROVISIONAL} exkl. MWST für die Berechnung der provisorischen Auflösungskosten`,
      ],
      [`Raten bei Auflösung, ${AMAG_C.rueckwirkendeNeuberechnung}`, "rückwirkend neu berechnet"],
      [`Bonitätsprüfung, ${AMAG_C.bonitaetspruefung}`, "Auskünfte bei ZEK und IKO"],
      [`Versicherung, ${AMAG_C.versicherung}`, "Vollkasko bei Neuwagen; Teilkasko für Occasionen nach Vereinbarung"],
    ];
    return (
      <LenderBlock title="Škoda und AMAG Leasing">
        <div>
          <p>
            {statement} Mit diesem Satz beschreibt AMAG Leasing im Geschäftsbericht 2025 ihr Angebot; Škoda gehört zu
            den genannten Kernmarken.
          </p>
          <Cite source={AMAG.brandStatement.source} />
        </div>
        {siblings}
        <div>
          <p>
            Für einen Škoda, der über AMAG Leasing läuft, regeln ihre ALB ({AMAG.edition}) Folgendes. Ob das bei einem
            Inserat zutrifft, steht im Vertrag.
          </p>
          <dl className="mt-2 divide-y divide-neutral-200 rounded-xl border border-neutral-200 text-sm">
            {rows.map(([term, value]) => (
              <div key={term} className="grid gap-1 p-3 sm:grid-cols-[14rem_1fr]">
                <dt className="text-neutral-500">{term}</dt>
                <dd className="text-neutral-900">{value}</dd>
              </div>
            ))}
          </dl>
          <Cite source={AMAG.source} />
        </div>
        <p>
          Mehr zu AMAG Leasing und den Gebühren anderer Gesellschaften auf der{" "}
          <Link href={lender.costHref} className={linkClass}>
            Kostenseite
          </Link>
          . Wie du einen Škoda-Vertrag übernimmst, erklärt der{" "}
          <Link href={GUIDE_HREF} className={linkClass}>
            Ratgeber
          </Link>
          .
        </p>
      </LenderBlock>
    );
  }

  // SEAT, CUPRA, VW Nutzfahrzeuge (dynamic pages).
  return (
    <LenderBlock title={`${brand.name} und AMAG Leasing`}>
      <div>
        <p>
          AMAG Leasing nennt {brand.name} im Geschäftsbericht 2025 als Kernmarke: {statement}
        </p>
        <Cite source={AMAG.brandStatement.source} />
      </div>
      {siblings}
      <div>
        <p>
          Ob ein inseriertes Auto über AMAG Leasing läuft, steht im Vertrag. Falls ja, gilt nach ihren ALB{" "}
          {AMAG.edition}: Eine Übernahmegebühr ist nicht aufgeführt. Für eine vorzeitige Rückgabe verrechnet sie nach{" "}
          {AMAG_C.aufloesungsgebuehren} pauschal {AMAG_TERMINATION} und für die provisorische Berechnung{" "}
          {AMAG_PROVISIONAL} (je exkl. MWST); die Raten werden rückwirkend neu berechnet (
          {AMAG_C.rueckwirkendeNeuberechnung}). Die Bonität prüft sie mit Auskünften von ZEK und IKO (
          {AMAG_C.bonitaetspruefung}). Neuwagen sind vollkasko zu versichern, Occasionen nach Absprache teilkasko (
          {AMAG_C.versicherung}).
        </p>
        <Cite source={AMAG.source} />
      </div>
      <p>
        <Link href={lender.costHref} className={linkClass}>
          AMAG Leasing auf der Kostenseite
        </Link>{" "}
        ·{" "}
        <Link href={GUIDE_HREF} className={linkClass}>
          Ratgeber zur Leasingübernahme
        </Link>
      </p>
    </LenderBlock>
  );
}

function BmwSection({ lender }: { lender: BrandLender }) {
  const bmw = BMW_FINANCIAL_SERVICES;
  return (
    <LenderBlock title="BMW Finanzdienstleistungen und die Übernahme">
      <div>
        <p>
          Die Leasinggesellschaft von BMW in der Schweiz ist die {bmw.legalName} in {bmw.seat}.
        </p>
        <Cite source={bmw.source} />
      </div>
      <p>
        Für BMW publiziert sie weder eine Gebühr für die Übernahme noch Regeln zur Übertragung eines Vertrags (
        {CHECKED}). Was
        die Übernahme eines bestimmten BMW kostet, erfährst du deshalb vom bisherigen Leasingnehmer oder direkt bei ihr.
        Ob ein inserierter BMW überhaupt über sie geleast ist, steht im Vertrag.
      </p>
      <FounderTakeoverNote variant="inline" className="rounded-xl bg-neutral-50 p-4 text-sm text-neutral-700" />
      <p>
        Was andere Leasinggesellschaften für eine Übernahme verlangen, listet die{" "}
        <Link href={lender.costHref} className={linkClass}>
          Kostenübersicht
        </Link>
        . Wie eine Übernahme abläuft, erklärt der{" "}
        <Link href={GUIDE_HREF} className={linkClass}>
          Ratgeber zur Leasingübernahme
        </Link>
        .
      </p>
    </LenderBlock>
  );
}

function MercedesSection({ lender }: { lender: BrandLender }) {
  const mb = MERCEDES_BENZ_FINANCIAL_SERVICES;
  return (
    <LenderBlock title="Mercedes-Benz Financial Services">
      <p>
        Zur Leasingübernahme publiziert die {mb.legalName} keine Angaben, weder eine Gebühr noch Regeln zur Übertragung
        ({CHECKED}).
      </p>
      <div>
        <p>
          Zur Kündigung steht auf der Finanzierungsseite von Mercedes-Benz Schweiz: <Quote>{mb.terminationQuote}</Quote>
        </p>
        <Cite source={mb.source} />
      </div>
      <p>
        Für die Übernahme eines Mercedes heisst das: Gebühr und Bedingungen erfährst du beim bisherigen Leasingnehmer
        oder bei der Leasinggesellschaft, die in seinem Vertrag steht.
      </p>
      <p>
        Welche Gesellschaften ihre Übernahmegebühr publizieren, zeigt die{" "}
        <Link href={lender.costHref} className={linkClass}>
          Kostenübersicht
        </Link>
        . Den Ablauf beschreibt der{" "}
        <Link href={GUIDE_HREF} className={linkClass}>
          Ratgeber zur Leasingübernahme
        </Link>
        .
      </p>
    </LenderBlock>
  );
}

function PorscheSection({ lender }: { lender: BrandLender }) {
  const pfs = PORSCHE_FINANCIAL_SERVICES;
  const provisional = pfs.feeQuotes.provisorischeAufloesungsberechnung;
  return (
    <LenderBlock title="Porsche Financial Services">
      <div>
        <p>
          Seit {pfs.startedOn} least Porsche in der Schweiz über eine eigene Gesellschaft, die {pfs.legalName}.
        </p>
        <Cite source={pfs.newsroomSource} />
      </div>
      <div>
        <p>
          Zur Übertragung eines Vertrags auf eine andere Person steht in ihren ALB ({pfs.source.stand}),{" "}
          {pfs.transferClause}: <Quote>{pfs.transferQuote}</Quote>
        </p>
        <p className="mt-3">
          Eine Übernahmegebühr führen die ALB nicht auf. Für die provisorische Berechnung einer vorzeitigen
          Vertragsauflösung nennen sie {formatChf(pfs.feesExclVatChf.provisorischeAufloesungsberechnung)} exkl. MWST (
          {provisional.clause}).
        </p>
        <Cite source={pfs.source} />
      </div>
      <p>
        <Link href={lender.costHref} className={linkClass}>
          Übernahmegebühren der Leasinggesellschaften
        </Link>{" "}
        ·{" "}
        <Link href={GUIDE_HREF} className={linkClass}>
          Ratgeber zur Leasingübernahme
        </Link>
      </p>
    </LenderBlock>
  );
}

function CaAutoFinanceSection({ brand, lender }: { brand: LeasingBrand; lender: BrandLender }) {
  const ca = CA_AUTO_FINANCE;
  const transferExcl = formatChf(ca.feesExclVatChf.vertragsumschreibung);
  const transferIncl = formatChfRappen(CA_AUTO_FINANCE_TRANSFER_INCL_VAT_CHF);
  const isFiat = lender.basis === "fiat-partner";
  return (
    <LenderBlock title={`${brand.name} und CA Auto Finance`}>
      <div>
        <p>
          {isFiat ? (
            <>
              Der {ca.role} ist die {ca.legalName} in {ca.seat}. In ihren FAQ nennt sie die Marken, auf die sie
              spezialisiert ist: <Quote>{ca.brandsQuote}</Quote>.
            </>
          ) : (
            <>
              Die {ca.legalName} in {ca.seat} nennt {brand.name} in ihren FAQ unter den Marken, auf die sie
              spezialisiert ist: <Quote>{ca.brandsQuote}</Quote>.
            </>
          )}
        </p>
        <Cite source={ca.faqSource} />
      </div>
      <div>
        <p>
          Für die Vertragsumschreibung auf eine neue Person verrechnet sie {transferExcl} exkl. MWST, also{" "}
          {transferIncl} inkl. MWST (AVB {ca.clauses.gebuehren}). Die Bonität der übernehmenden Person prüft sie mit
          Auskünften von IKO und ZEK (AVB {ca.clauses.bonitaetspruefung}).
        </p>
        <Cite source={ca.source} />
      </div>
      <p>
        Ob ein inserierter {brand.name} über CA Auto Finance läuft, steht im Vertrag. Die Gebühren anderer
        Gesellschaften zeigt die{" "}
        <Link href={lender.costHref} className={linkClass}>
          Kostenübersicht
        </Link>
        , den Ablauf der{" "}
        <Link href={GUIDE_HREF} className={linkClass}>
          Ratgeber
        </Link>
        .
      </p>
    </LenderBlock>
  );
}

function LenderSection({
  brand,
  lender,
  siblingBrands,
}: {
  brand: LeasingBrand;
  lender: BrandLender;
  siblingBrands: { slug: string; name: string }[];
}) {
  switch (lender.lender) {
    case "amag":
      return <AmagSection brand={brand} lender={lender} siblingBrands={siblingBrands} />;
    case "bmw":
      return <BmwSection lender={lender} />;
    case "mercedes-benz":
      return <MercedesSection lender={lender} />;
    case "porsche":
      return <PorscheSection lender={lender} />;
    case "ca-auto-finance":
      return <CaAutoFinanceSection brand={brand} lender={lender} />;
  }
}

// ── Live numbers ───────────────────────────────────────────────────────────

/** Live models in the brand's listings, alphabetical (no popularity claim). */
function liveModels(listings: Listing[]): string[] {
  return [...new Set(listings.map((l) => l.model?.trim()).filter((m): m is string => Boolean(m)))].sort((a, b) =>
    a.localeCompare(b, "de-CH")
  );
}

/**
 * Count, median rate and median remaining months of the brand's live
 * Leasingübernahmen. Labels change with the count so a single listing is not
 * called a median; the brand and the numbers sit early so no long word run
 * repeats on every brand page.
 */
function LiveStats({ brand, total, stats, models }: { brand: LeasingBrand; total: number; stats: InventoryStats | null; models: string[] }) {
  if (total <= 0) return null;
  const several = total > 1;
  const rows: [string, string][] = [
    ["Aktuell auf BuyAuto", `${total} ${brand.name}-${pluralize(total, "Leasingübernahme", "Leasingübernahmen")}`],
  ];
  if (models.length > 0) {
    const label =
      models.length > 1 ? "Modelle in den Inseraten" : several ? "Modell in den Inseraten" : "Modell im Inserat";
    rows.push([label, models.join(", ")]);
  }
  if (stats?.medianRate != null) rows.push([several ? "Monatsrate im Median" : "Monatsrate", formatChf(stats.medianRate)]);
  if (stats?.medianMonths != null) {
    rows.push([
      several ? "Restlaufzeit im Median" : "Restlaufzeit",
      `${stats.medianMonths} ${pluralize(stats.medianMonths, "Monat", "Monate")}`,
    ]);
  }
  return (
    <dl className="mt-5 grid max-w-3xl grid-cols-1 gap-x-6 gap-y-2 rounded-2xl border border-neutral-200 p-4 text-sm sm:grid-cols-2">
      {rows.map(([term, value]) => (
        <div key={term}>
          <dt className="text-neutral-500">{term}</dt>
          <dd className="font-semibold text-neutral-900">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function LeasingBrandPage({ brand, listings, total, stats, siblingBrands }: BrandPageProps) {
  const canonical = `${SITE_URL}/leasinguebernahme/${brand.slug}`;
  // /suche filters on ONE exact stored brand string (its URL parser has no multi-brand
  // param), which can differ from the display name (Mercedes-Benz page ↔ "Mercedes"
  // rows) — link with the primary DB spelling.
  const searchHref = `/suche?dealType=lease_takeover&brand=${encodeURIComponent(dbBrandsFor(brand)[0])}`;
  const hasListings = total > 0;
  // Indexed from BRAND_PAGE_MIN_INDEXABLE_LISTINGS live Leasingübernahmen on;
  // thinner pages stay reachable but "noindex, follow".
  const indexable = isIndexableBrandCount(total);
  const lender = brandLenderFor(brand);
  const models = liveModels(listings);

  const lenderMetaTail: Record<BrandLender["lender"], string> = {
    amag: `Dazu die Gebühren aus den ALB von ${AMAG_LEASING.name}, mit Quelle.`,
    bmw: `Dazu, was ${BMW_FINANCIAL_SERVICES.name} zur Übernahme publiziert.`,
    "ca-auto-finance": `Dazu die Umschreibungsgebühr von ${CA_AUTO_FINANCE.name}, mit Quelle.`,
    porsche: `Dazu die Klausel von ${PORSCHE_FINANCIAL_SERVICES.name} zur Übertragung, mit Quelle.`,
    "mercedes-benz": `Dazu, was ${MERCEDES_BENZ_FINANCIAL_SERVICES.name} zur Kündigung sagt.`,
  };

  const pageTitle = `Leasingübernahme ${brand.name} – Angebote in der Schweiz | BuyAuto`;
  const descriptionParts = [
    hasListings
      ? `Leasingübernahme ${brand.name}: ${total} ${pluralize(total, "aktuelles Angebot", "aktuelle Angebote")} auf BuyAuto` +
        (stats?.medianRate != null && total > 1 ? `, Monatsrate im Median ${formatChf(stats.medianRate)}.` : ".")
      : `Leasingübernahme ${brand.name}: alle ${brand.name}-Inserate mit laufendem Leasingvertrag auf BuyAuto.`,
    lender ? lenderMetaTail[lender.lender] : "",
  ];
  const metaDescription = descriptionParts.filter(Boolean).join(" ");

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Leasingübernahme", item: `${SITE_URL}/leasinguebernahme` },
      { "@type": "ListItem", position: 3, name: brand.name, item: canonical },
    ],
  };

  const listingsJsonLd = hasListings
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: `Leasingübernahme ${brand.name} – Angebote in der Schweiz`,
        numberOfItems: total,
        itemListElement: listings.map((l, index) => {
          const price = typeof l.pricePerMonthCHF === "number" && l.pricePerMonthCHF > 0 ? l.pricePerMonthCHF : null;
          return {
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": "Car",
              name: `${l.brand} ${l.model} ${l.year}`,
              brand: { "@type": "Brand", name: l.brand },
              model: l.model,
              vehicleModelDate: l.year,
              ...(l.mileageKm
                ? { mileageFromOdometer: { "@type": "QuantitativeValue", value: l.mileageKm, unitCode: "KMT" } }
                : {}),
              ...(l.fuel ? { fuelType: l.fuel } : {}),
              ...(l.gearbox ? { vehicleTransmission: l.gearbox } : {}),
              ...(price
                ? {
                    offers: {
                      "@type": "Offer",
                      // Recurring monthly lease rate, not a sale price — express only via
                      // priceSpecification so Google doesn't read it as the vehicle price.
                      availability: "https://schema.org/InStock",
                      itemCondition: "https://schema.org/UsedCondition",
                      priceSpecification: {
                        "@type": "UnitPriceSpecification",
                        price,
                        priceCurrency: "CHF",
                        unitText: "MONTH",
                      },
                    },
                  }
                : {}),
            },
          };
        }),
      }
    : null;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={metaDescription} />
        {indexable ? (
          <>
            <meta name="robots" content="index, follow" />
            <link rel="canonical" href={canonical} />
          </>
        ) : (
          /* Thin brand views (fewer than BRAND_PAGE_MIN_INDEXABLE_LISTINGS live
             Leasingübernahmen): noindex, follow (crawlable, out of the index) and NO
             self-canonical — so we never send canonical + noindex together. They flip
             to indexable automatically once enough inventory is published. */
          <meta name="robots" content="noindex, follow" />
        )}

        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="website" />
        {indexable && <meta property="og:url" content={canonical} />}
        <meta property="og:image" content={`${SITE_URL}/share-logo.jpg`} />
        <meta property="og:locale" content="de_CH" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
        {listingsJsonLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(listingsJsonLd) }}
          />
        )}
      </Head>

      <main className="bg-white min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm text-neutral-500 mb-5" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-neutral-900">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/leasinguebernahme" className="hover:text-neutral-900">Leasingübernahme</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-neutral-900 font-medium">{brand.name}</span>
          </nav>

          <header>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-neutral-900">
              Leasingübernahme {brand.name} in der Schweiz
            </h1>
            <p className="mt-3 max-w-3xl text-lg text-neutral-600 leading-relaxed">{brand.intro}</p>
            <AuthorBox updatedIso={BRAND_PAGES_CONTENT_UPDATED} className="mt-5 max-w-3xl" />
            <LiveStats brand={brand} total={total} stats={stats} models={models} />
          </header>

          {/* Listings */}
          <section className="mt-8">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
              <h2 className="min-w-0 text-xl sm:text-2xl font-bold text-neutral-900">
                {hasListings
                  ? `${total} ${brand.name}-${total === 1 ? "Angebot" : "Angebote"} zur Leasingübernahme`
                  : `Aktuell keine ${brand.name}-Leasingübernahmen verfügbar`}
              </h2>
              {hasListings && (
                <Link href={searchHref} className="text-sm font-semibold text-primary hover:underline whitespace-nowrap">
                  Alle ansehen →
                </Link>
              )}
            </div>

            {hasListings ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing) => (
                  <ModernListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 p-6 text-center">
                <p className="text-neutral-600">Gerade ist kein {brand.name} zur Übernahme inseriert.</p>
                <div className="mt-4 flex flex-wrap justify-center gap-3">
                  <Button asChild className="font-bold">
                    <Link href="/suche?dealType=lease_takeover">Alle Leasingübernahmen ansehen</Link>
                  </Button>
                  <Button asChild variant="outline" className="font-bold">
                    <Link href="/inserat-erstellen">Eigenes {brand.name}-Leasing abgeben</Link>
                  </Button>
                </div>
              </div>
            )}
          </section>

          {lender ? (
            <LenderSection brand={brand} lender={lender} siblingBrands={siblingBrands} />
          ) : (
            <p className="mt-8 max-w-3xl text-neutral-700">
              Wie die Übernahme eines {brand.name}-Leasings abläuft, erklärt der{" "}
              <Link href={GUIDE_HREF} className={linkClass}>
                Ratgeber zur Leasingübernahme
              </Link>
              .
            </p>
          )}
        </div>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  // Curated slugs are prerendered; brands that only exist in the DB (e.g. Fiat)
  // reach getStaticProps through fallback:"blocking" and are resolved there.
  return {
    paths: LEASING_BRANDS.map((b) => ({ params: { marke: b.slug } })),
    fallback: "blocking",
  };
};

/**
 * Median rate / months over the brand's live Leasingübernahmen, and the other indexable
 * brand pages of the same leasing company. On a failed read the page shows no live
 * numbers and no sibling links.
 */
async function loadBrandLiveFacts(
  brand: LeasingBrand,
  dbBrands: string[]
): Promise<{ stats: InventoryStats | null; siblingBrands: { slug: string; name: string }[] }> {
  try {
    const takeovers = liveTakeovers(await getPublicOfferIndex());
    const offers = takeovers.filter((o) => o.brand !== null && dbBrands.includes(o.brand));
    const lender = brandLenderFor(brand)?.lender ?? null;
    const siblingBrands =
      lender === "amag"
        ? indexableBrandPages(takeovers)
            .filter((b) => b.slug !== brand.slug && brandLenderFor(b)?.lender === "amag")
            .map((b) => ({ slug: b.slug, name: b.name }))
        : [];
    return {
      stats: offers.length > 0 ? computeInventoryStats(offers.map((o) => o.offer)) : null,
      siblingBrands,
    };
  } catch (error) {
    console.error("Brand page live stats failed:", { dbBrands, error });
    return { stats: null, siblingBrands: [] };
  }
}

export const getStaticProps: GetStaticProps<BrandPageProps> = async (context) => {
  const slug = String(context.params?.marke ?? "");

  // A failed query throws: during ISR revalidation Next then keeps serving the last
  // good page instead of caching a 404 or an empty noindex page for the brand.
  const { data, error } = await supabase.from("listings_public").select("brand, model, deal_type");
  if (error) {
    console.error("Brand page inventory query failed:", { slug, error });
    throw error;
  }
  const inventoryRows = (data ?? []) as BrandInventoryRow[];

  const resolved = resolveBrandSlug(slug, inventoryRows);

  if (!resolved) {
    return { notFound: true, revalidate: 300 };
  }

  if ("redirectTo" in resolved) {
    // A DB spelling already covered by a curated page (e.g. /mercedes → /mercedes-benz).
    return {
      redirect: { destination: `/leasinguebernahme/${resolved.redirectTo}`, permanent: true },
      revalidate: 300,
    };
  }

  const brand = resolved.brand;

  // The whole live inventory of the brand (Kaufart rule) — the count and the grid agree.
  // Throws on a failed query (see above): the indexing decision depends on this count.
  const [results, live] = await Promise.all([
    searchListingsOrThrow({
      dealType: "lease_takeover",
      brands: dbBrandsFor(brand),
      sort: "dateDesc",
      pageSize: BRAND_PAGE_MAX_LISTINGS,
    }),
    loadBrandLiveFacts(brand, dbBrandsFor(brand)),
  ]);
  // Strip undefined fields so Next can serialize the props.
  const listings = JSON.parse(JSON.stringify(results.items)) as Listing[];
  return {
    props: { brand, listings, total: results.total, stats: live.stats, siblingBrands: live.siblingBrands },
    revalidate: 300,
  };
};
