// Lender sections of the cost page (/leasinguebernahme-kosten#cembra, #amag,
// #multilease, #bank-now). The former per-lender pages 308 to these anchors.
//
// Every fact carries a visible source link (sourceLinkText inside the text) and
// the Stand of that source, also inside the text. Facts without a source are
// not listed. The fee table itself (all lenders) reads LENDER_TAKEOVER_FEES in
// facts.ts; this module holds the longer, lender-specific notes.
//
// Numbers come from the facts module (facts.ts), never typed here.

import {
  AMAG_LEASING,
  CEMBRA,
  CEMBRA_TRANSFER_DISPLAY,
  CEMBRA_TRANSFER_EXCL_VAT_CHF,
  type FactSource,
  type LenderTakeoverFee,
} from "@/lib/buyauto/facts";
import { formatChf, formatSwissInt } from "@/lib/buyauto/format";

/** Research date of the lender web pages below that are not in facts.ts (Vince, 13.8.2026). */
export const LENDER_RESEARCH_STAND = "Stand 13.8.2026";

/** A source as printed on the page: title (link text in the source list), URL and Stand. */
export type DatedSource = FactSource & { stand: string };

export interface SourcedFact {
  /** German copy; contains sourceLinkText and source.stand verbatim. */
  text: string;
  /** Phrase inside `text` rendered as the link to source.url. */
  sourceLinkText: string;
  source: DatedSource;
}

export type LenderSectionAnchor = Extract<LenderTakeoverFee["key"], "cembra" | "amag" | "multilease" | "bank-now">;

export interface LenderSection {
  /** Element id on the cost page; equals the lender's key in LENDER_TAKEOVER_FEES. */
  anchor: LenderSectionAnchor;
  name: string;
  /** Status or size of the company, shown first. */
  notes: SourcedFact[];
  /** What the lender says about its fees. */
  fee: SourcedFact | null;
  /** Credit check, registration, insurance. */
  checks: SourcedFact | null;
  /** How the transfer runs at this lender. */
  process: SourcedFact | null;
}

const CEMBRA_KUNDENCENTER: DatedSource = {
  title: "Cembra, Kundencenter Leasing für Privatpersonen",
  url: "https://www.cembra.ch/de/kundencenter/leasing/privatpersonen/",
  stand: LENDER_RESEARCH_STAND,
};

const CEMBRA_KONDITIONEN: DatedSource = {
  title: "Cembra, Konditionen Autoleasing",
  url: "https://www.cembra.ch/de/leasing/auto/konditionen/",
  stand: LENDER_RESEARCH_STAND,
};

const AMAG_ABLAUF: DatedSource = {
  title: "AMAG Leasing, Ablauf Leasing",
  url: "https://www.amag-leasing.ch/de/ablauf-leasing.html",
  stand: LENDER_RESEARCH_STAND,
};

const MULTILEASE_FAQ: DatedSource = {
  title: "Multilease, FAQ",
  url: "https://www.multilease.ch/de/faq",
  stand: LENDER_RESEARCH_STAND,
};

const MULTILEASE_RATGEBER: DatedSource = {
  title: "Multilease, Was ist Leasing?",
  url: "https://www.multilease.ch/was-ist-leasing/",
  stand: LENDER_RESEARCH_STAND,
};

const FINEWS_BANK_NOW: DatedSource = {
  title: "finews.com, Porsche Financial Services, BANK-now und UBS (englisch)",
  url: "https://www.finews.com/news/english-news/68246-porsche-switzerland-porsche-financial-services-bank-now-ubs-credit-suisse-leasing-business",
  stand: "Stand August 2026",
};

const AMAG_ALB: DatedSource = { ...AMAG_LEASING.source };
const CEMBRA_GEBUEHREN: DatedSource = { ...CEMBRA.source };
const AMAG_CUSTOMERS: DatedSource = { ...AMAG_LEASING.customers.source, title: "AMAG Group, Geschäftsfeld Leasing" };
// Title without the year: the Stand ("Geschäftsbericht 2025") already names it in the source list.
const AMAG_GESCHAEFTSBERICHT: DatedSource = { ...AMAG_LEASING.brandStatement.source, title: AMAG_LEASING.legalName };

export const LENDER_SECTIONS: readonly LenderSection[] = [
  {
    anchor: "cembra",
    name: CEMBRA.name,
    notes: [],
    fee: {
      text:
        `Laut Gebührenübersicht Leasing der Cembra (${CEMBRA_GEBUEHREN.stand}) kostet der Halterwechsel ` +
        `${formatChf(CEMBRA.feesExclVatChf.halterwechsel)} plus ${formatChf(CEMBRA.feesExclVatChf.fahrzeugausweisUmschreibung)} ` +
        `für die Umschreibung des Fahrzeugausweises, jeweils exkl. MWST. Zusammen sind das ` +
        `${formatChf(CEMBRA_TRANSFER_EXCL_VAT_CHF)} exkl. oder rund ${CEMBRA_TRANSFER_DISPLAY} inkl. MWST. ` +
        `Die Kündigungsabrechnung bei einer vorzeitigen Auflösung kostet dort ` +
        `${formatChf(CEMBRA.feesExclVatChf.kuendigungsabrechnung)} exkl. MWST.`,
      sourceLinkText: "Gebührenübersicht Leasing der Cembra",
      source: CEMBRA_GEBUEHREN,
    },
    checks: {
      text:
        `Laut Cembra-Kundencenter Leasing (${CEMBRA_KUNDENCENTER.stand}) prüft Cembra die Bonität der übernehmenden ` +
        "Person wie bei jedem neuen Leasingvertrag: mit Selbstauskunft, Einkommensnachweis und Abfrage bei ZEK und IKO. " +
        "Eine Vollkaskoversicherung ist bei Cembra-Leasingverträgen Pflicht.",
      sourceLinkText: "Cembra-Kundencenter Leasing",
      source: CEMBRA_KUNDENCENTER,
    },
    process: {
      text:
        `Gemäss Cembra-Leasingkonditionen (${CEMBRA_KONDITIONEN.stand}) wird die Übernahme direkt bei Cembra beantragt. ` +
        "Nach bestandener Bonitätsprüfung schreibt Cembra den Vertrag auf die neue Person um. Leasingfahrzeuge tragen " +
        "im Fahrzeugausweis den Code 178 («Halterwechsel verboten»). Die Umschreibung beim Strassenverkehrsamt läuft " +
        "deshalb immer über die Freigabe der Leasinggesellschaft.",
      sourceLinkText: "Cembra-Leasingkonditionen",
      source: CEMBRA_KONDITIONEN,
    },
  },
  {
    anchor: "amag",
    name: AMAG_LEASING.name,
    notes: [
      {
        text:
          `${AMAG_LEASING.name} zählt nach eigenen Angaben über ${formatSwissInt(AMAG_LEASING.customers.moreThan)} ` +
          `Privat- und Firmenkunden (Quelle: ${AMAG_CUSTOMERS.title}, ${AMAG_CUSTOMERS.stand}).`,
        sourceLinkText: AMAG_CUSTOMERS.title,
        source: AMAG_CUSTOMERS,
      },
      {
        text: `Im Geschäftsbericht 2025 beschreibt ${AMAG_LEASING.name} ihr Angebot so: «${AMAG_LEASING.brandStatement.quote}»`,
        sourceLinkText: AMAG_GESCHAEFTSBERICHT.stand,
        source: AMAG_GESCHAEFTSBERICHT,
      },
    ],
    fee: {
      text:
        `Die Allgemeinen Leasingbestimmungen von ${AMAG_LEASING.name} (${AMAG_ALB.stand}) nennen keine Gebühr für eine ` +
        `Vertragsübernahme. Für die vorzeitige Vertragsauflösung nennen sie pauschal ` +
        `${formatChf(AMAG_LEASING.feesExclVatChf.vorzeitigeVertragsaufloesung)} exkl. MWST und für die Berechnung der ` +
        `provisorischen Auflösungskosten ${formatChf(AMAG_LEASING.feesExclVatChf.provisorischeAufloesungskosten)} exkl. MWST ` +
        `(${AMAG_LEASING.clauses.aufloesungsgebuehren}). Bei einer vorzeitigen Auflösung werden die Leasingraten zudem ` +
        `rückwirkend neu berechnet (${AMAG_LEASING.clauses.rueckwirkendeNeuberechnung}).`,
      sourceLinkText: "Allgemeinen Leasingbestimmungen",
      source: AMAG_ALB,
    },
    checks: {
      text:
        `Bei der Prüfung eines Leasingantrags holt ${AMAG_LEASING.name} unter anderem Auskünfte bei der ZEK und der IKO ein ` +
        `(${AMAG_LEASING.clauses.bonitaetspruefung}). Das Fahrzeug wird in der Regel auf die Leasingnehmerin oder den ` +
        `Leasingnehmer immatrikuliert; Ausnahmen gelten für eine Person im gleichen Haushalt und für Firmenwagen von ` +
        `Mitarbeitenden (${AMAG_LEASING.clauses.immatrikulation}). Für Neufahrzeuge verlangt ${AMAG_LEASING.name} eine ` +
        `Vollkaskoversicherung, bei Occasionen ist nach Absprache mit der Leasinggeberin eine Teilkasko möglich ` +
        `(${AMAG_LEASING.clauses.versicherung}). Quelle: Allgemeine Leasingbestimmungen Autos, ${AMAG_ALB.stand}.`,
      sourceLinkText: "Allgemeine Leasingbestimmungen Autos",
      source: AMAG_ALB,
    },
    process: {
      text:
        `${AMAG_LEASING.name} arbeitet mit indirektem Leasing: Deine Liefergarage ist eng eingebunden und gegenüber ` +
        `${AMAG_LEASING.name} zur Rücknahme zum Restwert verpflichtet (gemäss AMAG-Leasing-Ablauf, ${AMAG_ABLAUF.stand}). ` +
        `Kläre eine Übernahme deshalb gemeinsam mit ${AMAG_LEASING.name} und der Liefergarage.`,
      sourceLinkText: "AMAG-Leasing-Ablauf",
      source: AMAG_ABLAUF,
    },
  },
  {
    anchor: "multilease",
    name: "Multilease",
    notes: [],
    fee: {
      text:
        `Multilease publiziert keinen Übernahme-Tarif. Die Übertragung auf eine Drittperson ist gemäss Multilease-FAQ ` +
        `(${MULTILEASE_FAQ.stand}) ausdrücklich vorgesehen; die Konditionen legt Multilease im Einzelfall fest.`,
      sourceLinkText: "Multilease-FAQ",
      source: MULTILEASE_FAQ,
    },
    checks: {
      text:
        "Die Bonität der übernehmenden Person wird gemäss Konsumkreditgesetz geprüft; Multilease oder der " +
        `Markenvertreter holt die nötigen Auskünfte ein (gemäss Multilease-Leasingratgeber, ${MULTILEASE_RATGEBER.stand}).`,
      sourceLinkText: "Multilease-Leasingratgeber",
      source: MULTILEASE_RATGEBER,
    },
    process: {
      text:
        "Multilease arbeitet eng mit den Liefergaragen zusammen: Verlängerung, Rückgabe und Fahrzeugübernahme laufen " +
        `gemäss Multilease-FAQ (${MULTILEASE_FAQ.stand}) über den Markenvertreter. Für eine Vertragsübertragung nimmst ` +
        "du direkt mit Multilease Kontakt auf und bindest deine Liefergarage früh ein.",
      sourceLinkText: "Multilease-FAQ",
      source: MULTILEASE_FAQ,
    },
  },
  {
    anchor: "bank-now",
    name: "BANK-now",
    notes: [
      {
        text:
          "BANK-now ist eine hundertprozentige Tochtergesellschaft der UBS Switzerland AG. Das Porsche-Leasing-Neugeschäft " +
          "wechselte im Juli 2025 zu Porsche Financial Services; bestehende BANK-now-Verträge laufen bei BANK-now weiter " +
          `(Quelle: finews, ${FINEWS_BANK_NOW.stand}).`,
        sourceLinkText: "finews",
        source: FINEWS_BANK_NOW,
      },
    ],
    fee: null,
    checks: null,
    process: null,
  },
];

/** Every fact of a section in reading order. */
export function lenderSectionFacts(section: LenderSection): SourcedFact[] {
  return [...section.notes, section.fee, section.checks, section.process].filter(
    (fact): fact is SourcedFact => fact !== null
  );
}

/** All sources the lender sections cite, for the page's source list. */
export const LENDER_SECTION_SOURCES: DatedSource[] = LENDER_SECTIONS.flatMap((section) =>
  lenderSectionFacts(section).map((fact) => fact.source)
);

// Build-time guard: a fact whose link phrase or Stand is missing from its text
// would print a number or claim without its visible citation. Runs at module
// import, i.e. during next build.
for (const section of LENDER_SECTIONS) {
  for (const fact of lenderSectionFacts(section)) {
    if (!fact.text.includes(fact.sourceLinkText)) {
      throw new Error(`leasingCompanies: sourceLinkText «${fact.sourceLinkText}» not found in a fact of #${section.anchor}`);
    }
    if (!fact.source.stand || !fact.text.includes(fact.source.stand)) {
      throw new Error(`leasingCompanies: Stand «${fact.source.stand}» not found in a fact of #${section.anchor}`);
    }
  }
}
