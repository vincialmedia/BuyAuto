import type { ReactNode } from "react";
import { FACTS_CHECKED_ON, lenderTakeoverFee } from "@/lib/buyauto/facts";
import { LENDER_SECTIONS, type SourcedFact } from "@/lib/buyauto/leasingCompanies";

/**
 * What Cembra, AMAG Leasing, Multilease and BANK-now say about a transfer, one
 * section each (#cembra, #amag, #multilease, #bank-now: the former lender
 * pages 308 here). Every paragraph links its source inside the text and names
 * its Stand (guarded in leasingCompanies.ts).
 */

/** "Cembra, AMAG Leasing, Multilease und BANK-now" */
const SECTION_NAMES = LENDER_SECTIONS.map((s) => s.name)
  .join(", ")
  .replace(/, ([^,]+)$/, " und $1");

function SourcedText({ fact }: { fact: SourcedFact }) {
  const parts = fact.text.split(fact.sourceLinkText);
  return (
    <>
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 ? (
            <a
              href={fact.source.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="underline decoration-neutral-300 underline-offset-2 hover:text-neutral-900"
            >
              {fact.sourceLinkText}
            </a>
          ) : null}
        </span>
      ))}
    </>
  );
}

function Labelled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</h4>
      <p className="mt-1 text-neutral-700 leading-relaxed">{children}</p>
    </div>
  );
}

export function LenderSections() {
  return (
    <section aria-labelledby="leasinggesellschaften-details-heading">
      <h2
        id="leasinggesellschaften-details-heading"
        className="text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight mb-6"
      >
        {SECTION_NAMES} im Detail
      </h2>
      <div className="space-y-8">
        {LENDER_SECTIONS.map((section) => {
          const feeUnpublished = lenderTakeoverFee(section.anchor).feeExclVatChf === null;
          return (
            <section
              key={section.anchor}
              id={section.anchor}
              aria-labelledby={`${section.anchor}-heading`}
              className="scroll-mt-24 rounded-2xl border border-neutral-200 p-4 sm:p-5"
            >
              <h3 id={`${section.anchor}-heading`} className="text-xl font-bold text-neutral-900">
                {section.name}
              </h3>
              <div className="mt-3 space-y-4">
                {section.notes.map((note) => (
                  <p key={note.text} className="text-neutral-700 leading-relaxed">
                    <SourcedText fact={note} />
                  </p>
                ))}
                {section.fee ? (
                  <Labelled label="Gebühren">
                    <SourcedText fact={section.fee} />
                  </Labelled>
                ) : feeUnpublished ? (
                  <Labelled label="Gebühren">
                    {section.name} publiziert keinen Übernahme-Tarif (geprüft am {FACTS_CHECKED_ON}). Die Konditionen
                    klärst du direkt mit {section.name}.
                  </Labelled>
                ) : null}
                {section.checks ? (
                  <Labelled label="Voraussetzungen">
                    <SourcedText fact={section.checks} />
                  </Labelled>
                ) : null}
                {section.process ? (
                  <Labelled label="Ablauf">
                    <SourcedText fact={section.process} />
                  </Labelled>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}
