import type { ReactNode } from "react";
import {
  AMAG_LEASING,
  BMW_FINANCIAL_SERVICES,
  CA_AUTO_FINANCE,
  CEMBRA,
  CEMBRA_TRANSFER_DISPLAY,
  FACTS_CHECKED_ON,
  FOUNDER_TAKEOVER,
  LENDER_TAKEOVER_FEES,
  MERCEDES_BENZ_FINANCIAL_SERVICES,
  PORSCHE_FINANCIAL_SERVICES,
  VAT_RATE,
  type FactSource,
  type LenderTakeoverFee,
} from "@/lib/buyauto/facts";
import { formatChf, formatChfRappen } from "@/lib/buyauto/format";
import { LENDER_SECTIONS } from "@/lib/buyauto/leasingCompanies";
import { SourceCitation } from "@/components/buyauto/SourceCitation";

/**
 * The lender table of the cost page (#leasinggesellschaften): one row per
 * lender in LENDER_TAKEOVER_FEES, each with the published fee (or "keine
 * publiziert") and the documents behind it. Rows without their own section
 * further down carry the anchors #ca-auto-finance, #bmw, #porsche and
 * #mercedes-benz; the other four link to their sections (#cembra, #amag,
 * #multilease, #bank-now). Stacks on phones, two columns from sm upwards.
 */

type CitedSource = { source: FactSource; prefix?: string };

interface RowDetail {
  /** Legal name or role line under the short name. */
  subline?: string;
  /** Fee column when the lender publishes no takeover fee. */
  unpublished?: string;
  details?: ReactNode;
  sources: CitedSource[];
}

const vatPercent = `${(VAT_RATE * 100).toFixed(1)} %`;

const ROW_DETAILS: Record<LenderTakeoverFee["key"], RowDetail> = {
  cembra: {
    details: `Halterwechsel ${formatChf(CEMBRA.feesExclVatChf.halterwechsel)} plus Umschreibung des Fahrzeugausweises ${formatChf(
      CEMBRA.feesExclVatChf.fahrzeugausweisUmschreibung
    )}, jeweils exkl. MWST.`,
    sources: [{ source: CEMBRA.source }],
  },
  "ca-auto-finance": {
    subline: `${CA_AUTO_FINANCE.legalName}, ${CA_AUTO_FINANCE.role}`,
    details: (
      <>
        Vertragsumschreibung (AVB {CA_AUTO_FINANCE.clauses.gebuehren}). Der Halterwechsel für{" "}
        {formatChf(CA_AUTO_FINANCE.feesExclVatChf.halterwechsel)} exkl. MWST gilt nur innerhalb desselben Haushalts und
        ist keine Vertragsübertragung. Marken laut FAQ: «{CA_AUTO_FINANCE.brandsQuote}».
      </>
    ),
    sources: [{ source: CA_AUTO_FINANCE.source }, { source: CA_AUTO_FINANCE.faqSource }],
  },
  amag: {
    subline: AMAG_LEASING.legalName,
    unpublished: "keine Übernahmegebühr publiziert",
    details: `Vorzeitige Auflösung: ${formatChf(AMAG_LEASING.feesExclVatChf.vorzeitigeVertragsaufloesung)} exkl. MWST pauschal plus ${formatChf(
      AMAG_LEASING.feesExclVatChf.provisorischeAufloesungskosten
    )} exkl. MWST für die provisorische Berechnung; die Raten werden rückwirkend neu berechnet (${AMAG_LEASING.clauses.aufloesungsgebuehren} und ${
      AMAG_LEASING.clauses.rueckwirkendeNeuberechnung
    }).`,
    sources: [{ source: AMAG_LEASING.source }],
  },
  bmw: {
    subline: BMW_FINANCIAL_SERVICES.legalName,
    unpublished: "keine Gebühr publiziert",
    details: (
      <>
        <span className="block text-xs font-semibold uppercase tracking-wide text-neutral-500">
          {FOUNDER_TAKEOVER.label}, kein publizierter Tarif
        </span>
        {FOUNDER_TAKEOVER.person} bezahlte {FOUNDER_TAKEOVER.year} für die Übertragung seines Leasingvertrags (
        {FOUNDER_TAKEOVER.car}) {formatChf(FOUNDER_TAKEOVER.takeoverFeeChf)}, als bisheriger Leasingnehmer die volle
        Gebühr. Verlangt hat sie die Leasinggesellschaft von BMW.
      </>
    ),
    sources: [{ source: BMW_FINANCIAL_SERVICES.source, prefix: "Gesellschaft:" }],
  },
  porsche: {
    subline: `${PORSCHE_FINANCIAL_SERVICES.legalName}, seit ${PORSCHE_FINANCIAL_SERVICES.startedOn}`,
    unpublished: "keine Übernahmegebühr publiziert",
    details: (
      <>
        Übertragung nur mit vorheriger schriftlicher Zustimmung der Leasinggeberin (
        {PORSCHE_FINANCIAL_SERVICES.transferClause}). «
        {PORSCHE_FINANCIAL_SERVICES.feeQuotes.provisorischeAufloesungsberechnung.quote}» (
        {PORSCHE_FINANCIAL_SERVICES.feeQuotes.provisorischeAufloesungsberechnung.clause}). Bestehende Porsche-Verträge bei
        BANK-now laufen dort weiter, siehe{" "}
        <a href="#bank-now" className="font-semibold text-red-600 hover:underline">
          BANK-now
        </a>
        .
      </>
    ),
    sources: [
      { source: PORSCHE_FINANCIAL_SERVICES.source },
      { source: PORSCHE_FINANCIAL_SERVICES.newsroomSource, prefix: "Gesellschaft:" },
    ],
  },
  "mercedes-benz": {
    subline: MERCEDES_BENZ_FINANCIAL_SERVICES.legalName,
    unpublished: "keine Gebühr publiziert",
    details: <>Zur Übernahme publiziert sie nichts; zur Kündigung schreibt sie: «{MERCEDES_BENZ_FINANCIAL_SERVICES.terminationQuote}»</>,
    sources: [{ source: MERCEDES_BENZ_FINANCIAL_SERVICES.source }],
  },
  multilease: { unpublished: "kein Übernahme-Tarif publiziert", sources: [] },
  "bank-now": { unpublished: "kein Übernahme-Tarif publiziert", sources: [] },
};

const SECTION_ANCHORS = new Set<string>(LENDER_SECTIONS.map((s) => s.anchor));

function feeText(lender: LenderTakeoverFee, detail: RowDetail): string {
  if (lender.feeExclVatChf === null || lender.feeInclVatChf === null) return detail.unpublished ?? "keine Gebühr publiziert";
  const incl = lender.key === "cembra" ? `rund ${CEMBRA_TRANSFER_DISPLAY}` : formatChfRappen(lender.feeInclVatChf);
  return `${formatChf(lender.feeExclVatChf)} exkl. MWST, ${incl} inkl. MWST`;
}

/** Every source the table cites, for the page's source list. */
export const LENDER_FEE_TABLE_SOURCES: FactSource[] = LENDER_TAKEOVER_FEES.flatMap((lender) =>
  ROW_DETAILS[lender.key].sources.map((s) => s.source)
);

export function LenderFeeTable({ children }: { children?: ReactNode }) {
  return (
    <section id="leasinggesellschaften" className="scroll-mt-24" aria-labelledby="leasinggesellschaften-heading">
      <h2
        id="leasinggesellschaften-heading"
        className="text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight mb-3"
      >
        Gebühr der Leasinggesellschaft
      </h2>
      {children}

      <div className="overflow-x-auto rounded-xl border border-neutral-200">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">
            Übertragungsgebühr bei einer Leasingübernahme pro Leasinggesellschaft, mit Quelle
          </caption>
          <thead className="hidden sm:table-header-group bg-neutral-100 text-neutral-700">
            <tr>
              <th scope="col" className="px-3 py-2 font-semibold w-2/5">
                Leasinggesellschaft
              </th>
              <th scope="col" className="px-3 py-2 font-semibold">
                Gebühr für die Übertragung
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 bg-white">
            {LENDER_TAKEOVER_FEES.map((lender) => {
              const detail = ROW_DETAILS[lender.key];
              const hasSection = SECTION_ANCHORS.has(lender.key);
              return (
                <tr
                  key={lender.key}
                  id={hasSection ? undefined : lender.key}
                  className="block sm:table-row scroll-mt-24 align-top"
                >
                  <th scope="row" className="block sm:table-cell px-3 pt-3 pb-1 sm:pb-3 align-top font-normal">
                    <span className="block font-semibold text-neutral-900">{lender.name}</span>
                    {detail.subline ? (
                      <span className="block text-xs text-neutral-500">{detail.subline}</span>
                    ) : null}
                    {hasSection ? (
                      <a
                        href={`#${lender.key}`}
                        className="mt-1 inline-block text-xs font-semibold text-red-600 hover:underline"
                      >
                        Details zu {lender.name}
                      </a>
                    ) : null}
                  </th>
                  <td className="block sm:table-cell px-3 pb-3 sm:pt-3 align-top text-neutral-700">
                    <span className="block font-semibold text-neutral-900">{feeText(lender, detail)}</span>
                    {detail.details ? <span className="mt-1 block">{detail.details}</span> : null}
                    {detail.sources.map(({ source, prefix }) => (
                      <SourceCitation
                        key={source.url}
                        source={source}
                        prefix={prefix}
                        className="mt-1 block text-xs text-neutral-500"
                      />
                    ))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-neutral-500">
        Geprüft am {FACTS_CHECKED_ON}. Beträge inkl. MWST mit {vatPercent} gerechnet. Massgebend ist dein Vertrag.
      </p>
    </section>
  );
}
