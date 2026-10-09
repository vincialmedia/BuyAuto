/**
 * Facts module — the ONLY place fee numbers and lender facts live.
 *
 * Every figure the site states must be built from the constants below, each
 * tied to a published source (URL + «Stand», printed on the page next to the
 * number). If a sentence needs a number that is not here, it does not get a
 * number. Live inventory figures (median rate, Kaution
 * spread, …) come from computeInventoryStats() over the current
 * Leasingübernahme listings, never from hand-typed copy.
 */
import { formatChf, formatChfRange, formatChfRappen } from "@/lib/buyauto/format";

/** Schweizer Mehrwertsteuer-Normalsatz. */
export const VAT_RATE = 0.081;

/**
 * A visible citation. Every figure a page prints shows the title (as the link
 * text), the URL and the «Stand» of the document it comes from.
 */
export interface FactSource {
  /** Visible link text, e.g. "AMAG Leasing AG, Allgemeine Leasingbestimmungen Autos". */
  title: string;
  url: string;
  /**
   * Version or date of the document as printed on the page, e.g. "Ausgabe 01/26".
   * Required for every source behind a printed number; only the KKG reference
   * (article numbers, no figures) goes without.
   */
  stand?: string;
}

/** Date the lender documents, cantonal tariffs and provider pages below were checked. */
export const FACTS_CHECKED_ON = "9.10.2026";

/** Amount incl. MWST, rounded to the Rappen (integer arithmetic: 575 × 1.081 = 621.58, not 621.57). */
export function withVat(chfExclVat: number): number {
  const vatFactorPermille = Math.round((1 + VAT_RATE) * 1000);
  return Math.round((chfExclVat * vatFactorPermille) / 10) / 100;
}

// ── Lenders (Leasinggesellschaften) ────────────────────────────────────────

/** Cembra Money Bank — Gebühren Leasing (PDF), gültig ab 1.9.2023. All CHF exkl. MWST. */
export const CEMBRA = {
  name: "Cembra",
  sourceUrl: "https://cembra.ch/assets/cembra/leasing/gebuehren-de.pdf",
  validFrom: "1.9.2023",
  source: {
    title: "Cembra, Gebühren Leasing",
    url: "https://cembra.ch/assets/cembra/leasing/gebuehren-de.pdf",
    stand: "gültig ab 1.9.2023",
  },
  feesExclVatChf: {
    halterwechsel: 500,
    fahrzeugausweisUmschreibung: 75,
    kuendigungsabrechnung: 250,
    kuendigungsschreiben: 25,
  },
} as const;

/**
 * AMAG Leasing AG — Allgemeine Leasingbestimmungen Autos (ALB), Ausgabe 01/26.
 * No takeover fee is listed (Ziff. 18 only covers early termination). All CHF exkl. MWST.
 *
 * Ziff. 9.1.1 names VW, VW Nutzfahrzeuge, Audi, Seat, Cupra and Škoda only as the
 * service-partner network for additional services. It is NOT a source for which
 * brands AMAG Leasing finances; that comes from the Geschäftsbericht 2025 below.
 */
export const AMAG_LEASING = {
  name: "AMAG Leasing",
  legalName: "AMAG Leasing AG",
  sourceUrl:
    "https://www.amag-leasing.ch/content/dam/amag-leasingportal/documents/allgemeine-leasingbestimmungen/deutsch/ALB_Autos_0126_D.pdf",
  edition: "Ausgabe 01/26",
  documentTitle: "Allgemeine Leasingbestimmungen Autos (ALB), Ausgabe 01/26",
  source: {
    title: "AMAG Leasing AG, Allgemeine Leasingbestimmungen Autos (ALB)",
    url: "https://www.amag-leasing.ch/content/dam/amag-leasingportal/documents/allgemeine-leasingbestimmungen/deutsch/ALB_Autos_0126_D.pdf",
    stand: "Ausgabe 01/26",
  },
  takeoverFeeChf: null,
  feesExclVatChf: {
    /** Ziff. 18: vorzeitige Vertragsauflösung, pauschal. */
    vorzeitigeVertragsaufloesung: 900,
    /** Ziff. 18: Berechnung der provisorischen Auflösungskosten. */
    provisorischeAufloesungskosten: 250,
  },
  clauses: {
    /** Vollkasko for new vehicles; Teilkasko for Occasionen by agreement with the lessor. */
    versicherung: "Ziff. 5.1",
    /** Vehicle registered on the lessee as a rule (exceptions: same household; employees for company cars). */
    immatrikulation: "Ziff. 8.1",
    /** The lessor obtains information from ZEK and IKO (among others) when checking an application. */
    bonitaetspruefung: "Ziff. 19.1",
    /** Fees for early termination and the provisional calculation. */
    aufloesungsgebuehren: "Ziff. 18",
    /** On early termination the rates are recalculated retroactively. */
    rueckwirkendeNeuberechnung: "Ziff. 14.1",
  },
  /** Customer count as stated by AMAG Group (research Stand August 2026). */
  customers: {
    moreThan: 160000,
    source: {
      title: "AMAG Group",
      url: "https://www.amag-group.ch/de/ueber-uns/Geschaeftsfelder/leasing.html",
      stand: "Stand August 2026",
    },
  },
  /** Which brands AMAG Leasing covers: Geschäftsbericht 2025, quoted verbatim. */
  brandStatement: {
    quote:
      "Von den Kernmarken Volkswagen, Audi, SEAT, CUPRA, Škoda und VW Nutzfahrzeuge bis hin zu innovativen Mikromobilitätslösungen wie dem Microlino oder E-Bikes verschiedener Marken deckt sie heute ein breites Spektrum ab.",
    source: {
      title: "AMAG Leasing AG, Geschäftsbericht 2025",
      url: "https://www.amag-leasing.ch/content/dam/amag-leasingportal/documents/investor-relations/AMAG_Leasing_Geschaeftsbericht_2025.pdf.coredownload.pdf",
      stand: "Geschäftsbericht 2025",
    },
  },
} as const;

/**
 * CA Auto Finance Suisse SA, Wallisellen — Fiat's Leasingpartner. Call it that:
 * it is not a Stellantis company. All CHF exkl. MWST
 * ("zuzüglich der aktuellen gesetzlichen Mehrwertsteuer", AVB R.2).
 */
export const CA_AUTO_FINANCE = {
  name: "CA Auto Finance",
  legalName: "CA Auto Finance Suisse SA",
  seat: "Wallisellen",
  /** How to describe it: Fiat's Leasingpartner (owned by Crédit Agricole, not Stellantis). */
  role: "Leasingpartner von Fiat",
  /** FAQ: the brands it specialises in, quoted verbatim. */
  brandsQuote: "Fiat, Abarth, Fiat Professional, Alfa Romeo, Jeep und Maserati",
  faqSource: {
    title: "CA Auto Finance, FAQ",
    url: "https://www.ca-autofinance.ch/faq/",
    stand: `abgerufen am ${FACTS_CHECKED_ON}`,
  },
  source: {
    title: "CA Auto Finance Suisse SA, AVB Leasing",
    url: "https://www.ca-autofinance.ch/wp-content/uploads/sites/14/2026/02/AVB_Leasing_1.2023.pdf",
    stand: "Version 2023_1 (PDF publiziert 02/2026)",
  },
  feesExclVatChf: {
    /** R.2: contract transfer to a new lessee. */
    vertragsumschreibung: 400,
    /** R.2 */
    schlussabrechnung: 200,
    /**
     * R.2: keeper change within the same household only (FAQ). Not a contract
     * transfer; never present it as one.
     */
    halterwechsel: 50,
  },
  clauses: {
    gebuehren: "R.2",
    /** Credit checks with IKO and ZEK. */
    bonitaetspruefung: "O.1",
  },
} as const;

/**
 * BMW Finanzdienstleistungen (Schweiz) AG, Dielsdorf. Publishes no takeover fee
 * and no transfer rules for BMW (conditions not online). The ALPHERA quote
 * belongs to ALPHERA (second brand of the same company, other car brands) and
 * is never attributed to BMW.
 */
export const BMW_FINANCIAL_SERVICES = {
  name: "BMW Finanzdienstleistungen",
  legalName: "BMW Finanzdienstleistungen (Schweiz) AG",
  seat: "Dielsdorf",
  source: {
    title: "BMW Group Switzerland, Medienmitteilung",
    url: "https://www.press.bmwgroup.com/switzerland/article/attachment/T0456615DE/646062",
    stand: "26.3.2026",
  },
  takeoverFeeChf: null,
  alphera: {
    name: "ALPHERA",
    quote: "Der Vertrag kann auch auf einen neuen Leasingnehmer umgeschrieben werden.",
    source: {
      title: "ALPHERA, FAQ",
      url: "https://alphera.ch/de/faq/",
      stand: `abgerufen am ${FACTS_CHECKED_ON}`,
    },
  },
} as const;

/**
 * Porsche Financial Services Schweiz AG — own leasing company since 1.7.2025.
 * ALB Ausgabe 07/25. No takeover fee listed. All CHF exkl. MWST.
 */
export const PORSCHE_FINANCIAL_SERVICES = {
  name: "Porsche Financial Services",
  legalName: "Porsche Financial Services Schweiz AG",
  startedOn: "1.7.2025",
  newsroomSource: {
    title: "Porsche Schweiz Newsroom, Porsche Financial Services Schweiz AG",
    url: "https://newsroom.porsche.com/de_CH/2025/unternehmen/porsche-financial-services-schweiz-ag-geschaftesmodell-39901.html",
    stand: `abgerufen am ${FACTS_CHECKED_ON}`,
  },
  source: {
    title: "Porsche Financial Services Schweiz AG, ALB",
    url: "https://files.porsche.com/f/332100/95af9b20b6/20250625-alb-de-pfs.pdf",
    stand: "Ausgabe 07/25",
  },
  takeoverFeeChf: null,
  /** Ziff. 25.5, verbatim. */
  transferQuote:
    "Ansprüche, sonstige Rechte sowie Pflichten des Leasingnehmers aus diesem Leasingvertrag können nur mit vorheriger schriftlicher Zustimmung der Leasinggeberin abgetreten oder auf einen Dritten übertragen werden.",
  transferClause: "Ziff. 25.5",
  feesExclVatChf: {
    /** Ziff. 4.8 b */
    provisorischeAufloesungsberechnung: 125,
    /** Ziff. 4.8 k: only when the LESSOR terminates early. */
    schlussabrechnungAufloesungDurchLeasinggeberin: 900,
  },
  /** Verbatim fee lines. */
  feeQuotes: {
    provisorischeAufloesungsberechnung: {
      clause: "Ziff. 4.8 b",
      quote: "Provisorische Berechnung einer vorzeitigen Vertragsauflösung: CHF 125 exkl. MWST",
    },
    schlussabrechnungAufloesungDurchLeasinggeberin: {
      clause: "Ziff. 4.8 k",
      quote: "Schlussabrechnung bei vorzeitiger Vertragsauflösung durch die Leasinggeberin: CHF 900 exkl. MWST",
    },
  },
} as const;

/** Mercedes-Benz Financial Services Schweiz AG, Schlieren-Zürich. Publishes nothing on takeovers. */
export const MERCEDES_BENZ_FINANCIAL_SERVICES = {
  name: "Mercedes-Benz Financial Services",
  legalName: "Mercedes-Benz Financial Services Schweiz AG",
  seat: "Schlieren-Zürich",
  takeoverFeeChf: null,
  /** Verbatim (the "Ihrem" is the lender's wording, rendered as a quote). */
  terminationQuote:
    'Eine Kündigung des Leasingvertrags ist bei privaten Leasingverträgen möglich. Massgebend sind die Ihrem Vertrag beiliegende "Amortisationstabelle" sowie die allgemeinen Vertragsbedingungen.',
  source: {
    title: "Mercedes-Benz Schweiz, Finanzierung und Leasing",
    url: "https://www.mercedes-benz.ch/de/passengercars/finance/financing-leasing.html",
    stand: `abgerufen am ${FACTS_CHECKED_ON}`,
  },
} as const;

/** Multilease and BANK-now publish no takeover fee. */
export const MULTILEASE = { name: "Multilease", takeoverFeeChf: null } as const;
export const BANK_NOW = { name: "BANK-now", takeoverFeeChf: null } as const;

/** Cembra transfer = Halterwechsel + Umschreibung Fahrzeugausweis, exkl. MWST (CHF 575). */
export const CEMBRA_TRANSFER_EXCL_VAT_CHF =
  CEMBRA.feesExclVatChf.halterwechsel + CEMBRA.feesExclVatChf.fahrzeugausweisUmschreibung;

/** (500 + 75) × 1.081 = CHF 621.58. */
export const CEMBRA_TRANSFER_INCL_VAT_CHF = withVat(CEMBRA_TRANSFER_EXCL_VAT_CHF);

/** Displayed as "rund CHF 622 inkl. MWST". */
export const CEMBRA_TRANSFER_INCL_VAT_ROUNDED_CHF = Math.round(CEMBRA_TRANSFER_INCL_VAT_CHF);

/** CA Auto Finance Vertragsumschreibung incl. MWST: 400 × 1.081 = CHF 432.40. */
export const CA_AUTO_FINANCE_TRANSFER_INCL_VAT_CHF = withVat(CA_AUTO_FINANCE.feesExclVatChf.vertragsumschreibung);

/**
 * The takeover fee each lender publishes, in one list: the lender table on the
 * cost page and the Ausstiegsrechner both read it. `null` = not published.
 * Only F1–F7 sources; the founder's own BMW fee (FOUNDER_TAKEOVER) is NOT a
 * published tariff and is never listed here.
 */
export interface LenderTakeoverFee {
  key: "cembra" | "ca-auto-finance" | "amag" | "bmw" | "porsche" | "mercedes-benz" | "multilease" | "bank-now";
  name: string;
  /** Published takeover fee exkl. MWST, or null when the lender publishes none. */
  feeExclVatChf: number | null;
  /** Same fee incl. MWST (computed). */
  feeInclVatChf: number | null;
  /** What the fee consists of, e.g. "Halterwechsel + Umschreibung Fahrzeugausweis". */
  feeLabel: string | null;
  /** Where the fee (or the absence of one) is documented; null when nothing is published at all. */
  source: FactSource | null;
}

export const LENDER_TAKEOVER_FEES: readonly LenderTakeoverFee[] = [
  {
    key: "cembra",
    name: CEMBRA.name,
    feeExclVatChf: CEMBRA_TRANSFER_EXCL_VAT_CHF,
    feeInclVatChf: CEMBRA_TRANSFER_INCL_VAT_CHF,
    feeLabel: "Halterwechsel plus Umschreibung des Fahrzeugausweises",
    source: CEMBRA.source,
  },
  {
    key: "ca-auto-finance",
    name: CA_AUTO_FINANCE.name,
    feeExclVatChf: CA_AUTO_FINANCE.feesExclVatChf.vertragsumschreibung,
    feeInclVatChf: CA_AUTO_FINANCE_TRANSFER_INCL_VAT_CHF,
    feeLabel: "Vertragsumschreibung",
    source: CA_AUTO_FINANCE.source,
  },
  { key: "amag", name: AMAG_LEASING.name, feeExclVatChf: null, feeInclVatChf: null, feeLabel: null, source: AMAG_LEASING.source },
  { key: "bmw", name: BMW_FINANCIAL_SERVICES.name, feeExclVatChf: null, feeInclVatChf: null, feeLabel: null, source: null },
  {
    key: "porsche",
    name: PORSCHE_FINANCIAL_SERVICES.name,
    feeExclVatChf: null,
    feeInclVatChf: null,
    feeLabel: null,
    source: PORSCHE_FINANCIAL_SERVICES.source,
  },
  {
    key: "mercedes-benz",
    name: MERCEDES_BENZ_FINANCIAL_SERVICES.name,
    feeExclVatChf: null,
    feeInclVatChf: null,
    feeLabel: null,
    source: null,
  },
  { key: "multilease", name: MULTILEASE.name, feeExclVatChf: null, feeInclVatChf: null, feeLabel: null, source: null },
  { key: "bank-now", name: BANK_NOW.name, feeExclVatChf: null, feeInclVatChf: null, feeLabel: null, source: null },
];

export function lenderTakeoverFee(key: LenderTakeoverFee["key"]): LenderTakeoverFee {
  const entry = LENDER_TAKEOVER_FEES.find((l) => l.key === key);
  if (!entry) throw new Error(`Unknown lender key: ${key}`);
  return entry;
}

// ── Getting out early: the law ─────────────────────────────────────────────

/**
 * Konsumkreditgesetz: a private (consumer) leasing contract can be terminated
 * early; the lessor is then owed compensation per the table in the contract.
 * Only the article references are printed (no paraphrased numbers).
 */
export const KKG = {
  name: "Konsumkreditgesetz (KKG)",
  sr: "SR 221.214.1",
  terminationArticle: "Art. 17 Abs. 3",
  compensationTableArticle: "Art. 11 Abs. 2 lit. g",
  source: {
    title: "Bundesgesetz über den Konsumkredit (KKG), SR 221.214.1",
    url: "https://www.fedlex.admin.ch/eli/cc/2002/536/de#art_17",
  },
} as const;

// ── The founder's own takeover (F8) ────────────────────────────────────────

/**
 * Vincent Hänggi's own Leasingübernahme in 2024, before BuyAuto existed.
 * Founder experience, NEVER a BuyAuto case, customer story or testimonial.
 * Not known and never stated: how he found the taker, how long it took,
 * which documents were needed.
 */
export const FOUNDER_TAKEOVER = {
  person: "Vincent Hänggi",
  role: "Gründer von BuyAuto",
  photo: "/Vince.jpeg",
  year: 2024,
  car: "BMW i8",
  /** "rund 30 Monate" left on the contract. */
  monthsLeftApprox: 30,
  /** Buying out or terminating and selling: roughly the gap between what he still owed and the car's value. */
  exitCostApproxChf: 20000,
  /** Charged by BMW's leasing company: the full fee, paid by him as the outgoing lessee. */
  takeoverFeeChf: 550,
  label: "Eigene Erfahrung des Gründers",
} as const;

// ── Cantonal fees (Strassenverkehrsämter) ──────────────────────────────────

export interface CantonalFee {
  code: string;
  name: string;
  /** New Fahrzeugausweis on change of holder (CHF). */
  fahrzeugausweisChf: number;
  /** New plate pair if the new lessee has no own plates (CHF); null = no fixed amount published. */
  kontrollschilderChf: number | null;
  /** Version of the tariff as printed on the page. */
  stand: string;
  sourceUrl: string;
  /** Footnote shown under the table. */
  note?: string;
}

/** Jura publishes its tariff in points; CHF = points × the official point value. */
export const JURA_POINT_VALUE_CHF = 1.05;
export const JURA_POINTS = { fahrzeugausweis: 71, kontrollschilder: 60 } as const;
const juraChf = (points: number) => Math.round(points * JURA_POINT_VALUE_CHF * 100) / 100;

/** In the Federal Chancellery's canton order. Checked against the official tariffs on 9.10.2026. */
export const CANTONAL_FEES: readonly CantonalFee[] = [
  {
    code: "ZH",
    name: "Zürich",
    fahrzeugausweisChf: 42,
    kontrollschilderChf: 40,
    stand: "gültig ab 1.1.2026",
    sourceUrl:
      "https://www.zh.ch/content/dam/zhweb/bilder-dokumente/organisation/sicherheitsdirektion/strassenverkehrsamt/organisation/ueber-uns-grundlagen/Geb%C3%BChrenverf%C3%BCgung,%20g%C3%BCltig%20ab%201.%20Januar%202026.pdf",
    note: "Der Tarif nennt zusätzlich eine «Kontrollschildereinlösung» von CHF 30.00. Ob sie bei neuen Kontrollschildern dazukommt, geht aus dem Tarif nicht eindeutig hervor.",
  },
  {
    code: "BE",
    name: "Bern",
    fahrzeugausweisChf: 55,
    kontrollschilderChf: 45,
    stand: "Stand Juli 2025",
    sourceUrl: "https://www.svsa.sid.be.ch/content/dam/svsa_sid/dokumente/de/gebuehrentarife/svsa-gebuehren-vz-d.pdf",
  },
  {
    code: "LU",
    name: "Luzern",
    fahrzeugausweisChf: 30,
    kontrollschilderChf: 40,
    stand: "Stand 1.1.2026",
    sourceUrl: "https://srl.lu.ch/api/de/versions/4618/pdf_file_with_annexes",
  },
  {
    code: "UR",
    name: "Uri",
    fahrzeugausweisChf: 50,
    kontrollschilderChf: 40,
    stand: "in Kraft ab 1.1.2026",
    sourceUrl: "https://www.ur.ch/_rtr/publikation_4903",
  },
  {
    code: "SZ",
    name: "Schwyz",
    fahrzeugausweisChf: 50,
    kontrollschilderChf: 35,
    stand: "Stand 1.1.2025",
    sourceUrl: "https://www.sz.ch/public/upload/assets/29546/782_311.pdf?fp=14",
  },
  {
    code: "OW",
    name: "Obwalden",
    fahrzeugausweisChf: 50,
    kontrollschilderChf: 40,
    stand: "Stand 1.1.2026",
    sourceUrl: "https://www.vsz.ch/10-strasse/40-steuern-und-gebuehren/Gebuehren.pdf",
  },
  {
    code: "NW",
    name: "Nidwalden",
    fahrzeugausweisChf: 50,
    kontrollschilderChf: 40,
    stand: "Stand 1.1.2026",
    sourceUrl: "https://www.vsz.ch/10-strasse/40-steuern-und-gebuehren/Gebuehren.pdf",
  },
  {
    code: "GL",
    name: "Glarus",
    fahrzeugausweisChf: 50,
    kontrollschilderChf: 40,
    stand: "Stand 1.1.2024 (aktuelle Fassung)",
    sourceUrl: "https://gesetze.gl.ch/api/de/versions/2461/pdf_file_with_annexes",
  },
  {
    code: "ZG",
    name: "Zug",
    fahrzeugausweisChf: 30,
    kontrollschilderChf: 30,
    stand: "Stand 1.1.2026",
    sourceUrl: "https://bgs.zg.ch/api/de/versions/2696/pdf_file_with_annexes",
    note: "Die Verordnung nennt zusätzlich eine Grundgebühr von CHF 30.00 für Gesuche um einen Fahrzeugausweis. Ob sie hier anfällt, geht aus der Verordnung nicht eindeutig hervor.",
  },
  {
    code: "FR",
    name: "Freiburg",
    fahrzeugausweisChf: 40,
    kontrollschilderChf: 50,
    stand: "in Kraft seit 1.9.2025",
    sourceUrl: "https://bdlf.fr.ch/api/fr/versions/8201/pdf_file_with_annexes",
  },
  {
    code: "SO",
    name: "Solothurn",
    fahrzeugausweisChf: 50,
    kontrollschilderChf: 50,
    stand: "Stand 15.7.2016 (aktuelle Fassung)",
    sourceUrl: "https://bgs.so.ch/api/de/versions/4558/pdf_file_with_annexes",
  },
  {
    code: "BS",
    name: "Basel-Stadt",
    fahrzeugausweisChf: 52,
    kontrollschilderChf: 40,
    stand: "Stand 1.7.2025",
    sourceUrl: "https://www.gesetzessammlung.bs.ch/api/de/versions/6583/pdf_file_with_annexes",
  },
  {
    code: "BL",
    name: "Basel-Landschaft",
    fahrzeugausweisChf: 52,
    kontrollschilderChf: 40,
    stand: "Stand 1.7.2026",
    sourceUrl: "https://bl.clex.ch/api/de/versions/4479/pdf_file_with_annexes",
  },
  {
    code: "SH",
    name: "Schaffhausen",
    fahrzeugausweisChf: 45,
    kontrollschilderChf: null,
    stand: "Stand 1.7.2015 (aktuelle Fassung)",
    sourceUrl: "https://rechtsbuch.sh.ch/api/de/versions/1525/pdf_file_with_annexes",
    note: "Für Kontrollschilder nennt die Verordnung nur einen Rahmen von CHF 5.00 bis CHF 50.00, keinen festen Betrag.",
  },
  {
    code: "AR",
    name: "Appenzell Ausserrhoden",
    fahrzeugausweisChf: 50,
    kontrollschilderChf: 45,
    stand: "Stand 1.4.2025",
    sourceUrl: "https://ar.clex.ch/api/de/versions/1563/pdf_file_with_annexes",
  },
  {
    code: "AI",
    name: "Appenzell Innerrhoden",
    fahrzeugausweisChf: 50,
    kontrollschilderChf: 40,
    stand: "Stand 1.1.2026",
    sourceUrl: "https://ai.clex.ch/api/de/versions/2422/pdf_file_with_annexes",
  },
  {
    code: "SG",
    name: "St. Gallen",
    fahrzeugausweisChf: 40,
    kontrollschilderChf: 30,
    stand: "Stand 1.4.2026",
    sourceUrl: "https://www.gesetzessammlung.sg.ch/api/de/versions/3887/pdf_file_with_annexes",
  },
  {
    code: "GR",
    name: "Graubünden",
    fahrzeugausweisChf: 40,
    kontrollschilderChf: 40,
    stand: "Stand 1.1.2023 (aktuelle Fassung)",
    sourceUrl: "https://www.gr-lex.gr.ch/api/de/versions/3276/pdf_file_with_annexes",
  },
  {
    code: "AG",
    name: "Aargau",
    fahrzeugausweisChf: 20,
    kontrollschilderChf: 20,
    stand: "Stand 1.8.2026",
    sourceUrl: "https://gesetzessammlungen.ag.ch/api/de/versions/4011/pdf_file_with_annexes",
  },
  {
    code: "TG",
    name: "Thurgau",
    fahrzeugausweisChf: 40,
    kontrollschilderChf: 30,
    stand: "Stand 1.1.2023 (aktuelle Fassung)",
    sourceUrl: "https://www.rechtsbuch.tg.ch/api/de/versions/2561/pdf_file_with_annexes",
  },
  {
    code: "TI",
    name: "Tessin",
    fahrzeugausweisChf: 50,
    kontrollschilderChf: 40,
    stand: "Stand 1.8.2026",
    sourceUrl: "https://m3.ti.ch/CAN/RLeggi/public/index.php/raccolta-leggi/pdfatto/atto/12705",
  },
  {
    code: "VD",
    name: "Waadt",
    fahrzeugausweisChf: 45,
    kontrollschilderChf: 60,
    stand: "in Kraft ab 1.9.2026",
    sourceUrl:
      "https://prestations.vd.ch/pub/blv-publication/actes/consolide/741.15.1?key=1548060725137&id=a98c496b-c044-447f-9229-6303629369f0",
    note: "CHF 45.00 gilt für die Ausstellung bei einer Immatrikulation («établissement lors d'une immatriculation»). Für eine Änderung im Fahrzeugausweis («un changement sur le permis de circulation») nennt der Tarif CHF 25.00. Einen Halterwechsel nennt er nicht ausdrücklich.",
  },
  {
    code: "VS",
    name: "Wallis",
    fahrzeugausweisChf: 50,
    kontrollschilderChf: 40,
    stand: "Stand 1.7.2025",
    sourceUrl: "https://lex.vs.ch/api/fr/versions/3481/pdf_file_with_annexes",
  },
  {
    code: "NE",
    name: "Neuenburg",
    fahrzeugausweisChf: 50,
    kontrollschilderChf: 50,
    stand: "Stand 1.1.2026",
    sourceUrl: "https://rsn.ne.ch/DATA/program/books/rsne/pdf/761.43.pdf",
  },
  {
    code: "GE",
    name: "Genf",
    fahrzeugausweisChf: 55,
    kontrollschilderChf: 30,
    stand: "Änderungen per 1.1.2026",
    sourceUrl: "https://silgeneve.ch/legis/data/rsg_h1_05p08.htm",
  },
  {
    code: "JU",
    name: "Jura",
    fahrzeugausweisChf: juraChf(JURA_POINTS.fahrzeugausweis),
    kontrollschilderChf: juraChf(JURA_POINTS.kontrollschilder),
    stand: `abgerufen am ${FACTS_CHECKED_ON}`,
    sourceUrl: "https://rsju.jura.ch/fr/viewdocument.html?idn=20021&id=36992&download=1",
    note: `Jura rechnet in Punkten: Fahrzeugausweis ${JURA_POINTS.fahrzeugausweis} Punkte, zwei Kontrollschilder ${JURA_POINTS.kontrollschilder} Punkte, jeweils mal den offiziellen Punktwert von CHF ${JURA_POINT_VALUE_CHF.toFixed(2)}.`,
  },
];

export interface CantonalFeeExtreme {
  chf: number;
  /** Canton codes at this amount (ties included). */
  codes: string[];
}

function extremes(values: { code: string; chf: number | null }[]): { min: CantonalFeeExtreme; max: CantonalFeeExtreme } {
  const known = values.filter((v): v is { code: string; chf: number } => typeof v.chf === "number");
  if (known.length === 0) throw new Error("CANTONAL_FEES: no amounts");
  const minChf = Math.min(...known.map((v) => v.chf));
  const maxChf = Math.max(...known.map((v) => v.chf));
  return {
    min: { chf: minChf, codes: known.filter((v) => v.chf === minChf).map((v) => v.code) },
    max: { chf: maxChf, codes: known.filter((v) => v.chf === maxChf).map((v) => v.code) },
  };
}

/** Lowest/highest Fahrzeugausweis fee, computed from CANTONAL_FEES (never typed by hand). */
export const FAHRZEUGAUSWEIS_RANGE = extremes(
  CANTONAL_FEES.map((c) => ({ code: c.code, chf: c.fahrzeugausweisChf }))
);

/** Lowest/highest plate-pair fee among cantons that publish a fixed amount. */
export const KONTROLLSCHILDER_RANGE = extremes(
  CANTONAL_FEES.map((c) => ({ code: c.code, chf: c.kontrollschilderChf }))
);

/** Cantons without a fixed plate fee (SH). */
export const CANTONS_WITHOUT_FIXED_PLATE_FEE = CANTONAL_FEES.filter((c) => c.kontrollschilderChf === null).map(
  (c) => c.code
);

/** "CHF 20.00 (AG)" */
export function cantonalExtremeLabel(extreme: CantonalFeeExtreme): string {
  return `${formatChfRappen(extreme.chf)} (${extreme.codes.join(", ")})`;
}

/**
 * One-line summary computed from the table, e.g.
 * "Der neue Fahrzeugausweis kostet je nach Kanton zwischen CHF 20.00 (AG) und CHF 74.55 (JU)."
 */
export const CANTONAL_FAHRZEUGAUSWEIS_SUMMARY =
  `Der neue Fahrzeugausweis kostet je nach Kanton zwischen ${cantonalExtremeLabel(FAHRZEUGAUSWEIS_RANGE.min)} ` +
  `und ${cantonalExtremeLabel(FAHRZEUGAUSWEIS_RANGE.max)}.`;

/** "Brauchst du neue Kontrollschilder, kommen CHF 20.00 (AG) bis CHF 63.00 (JU) dazu; SH publiziert keinen festen Betrag." */
export const CANTONAL_KONTROLLSCHILDER_SUMMARY =
  `Brauchst du neue Kontrollschilder, weil du keine eigenen hast, kommen ${cantonalExtremeLabel(KONTROLLSCHILDER_RANGE.min)} ` +
  `bis ${cantonalExtremeLabel(KONTROLLSCHILDER_RANGE.max)} dazu` +
  (CANTONS_WITHOUT_FIXED_PLATE_FEE.length
    ? `; ${CANTONS_WITHOUT_FIXED_PLATE_FEE.join(", ")} publiziert keinen festen Betrag.`
    : ".");

/** Short form for tables and FAQs: "CHF 20.00 (AG) bis CHF 74.55 (JU)". */
export const CANTONAL_FAHRZEUGAUSWEIS_RANGE_LABEL =
  `${cantonalExtremeLabel(FAHRZEUGAUSWEIS_RANGE.min)} bis ${cantonalExtremeLabel(FAHRZEUGAUSWEIS_RANGE.max)}`;

/** Anchor of the cantonal table on the cost page. */
export const CANTONAL_FEES_HREF = "/leasinguebernahme-kosten#kantone";

// ── Auto-Abo examples (F10) ────────────────────────────────────────────────

export interface AutoAboOffer {
  model: string;
  /** Brand as stored on BuyAuto listings, to find a live takeover of the same model. */
  brand: string;
  /** Model as stored on BuyAuto listings (matched case-insensitively). */
  listingModel: string;
  monthlyChf: number;
  termMonths: number;
  kmPerMonth: number;
  url: string;
  /** Offer-specific condition, e.g. "ohne Anzahlung, Preis für den Kanton VD". */
  detail?: string;
}

export interface AutoAboProvider {
  name: string;
  /** e.g. "nur Elektroautos". */
  scope?: string;
  offers: AutoAboOffer[];
  /** One-off and conditional costs as printed by the provider. */
  oneOffCosts: string[];
  included: string;
  selbstbehalt: string;
  /** Extra-km price as published; omitted when the brief has none for the provider. */
  extraKm?: string;
  /** Page the conditions come from; when omitted they come from the offer pages themselves. */
  conditionsUrl?: string;
}

/** Prices change: always print AUTO_ABO_STAND and link each offer. */
export const AUTO_ABO_STAND = FACTS_CHECKED_ON;

export const AUTO_ABO_PROVIDERS: readonly AutoAboProvider[] = [
  {
    name: "Carvolution",
    offers: [
      {
        model: "Opel Corsa Hybrid Edition 110",
        brand: "Opel",
        listingModel: "Corsa",
        monthlyChf: 409,
        termMonths: 48,
        kmPerMonth: 350,
        url: "https://www.carvolution.com/de/fahrzeuge/corsa-hybrid-edition-110",
        detail: "ohne Anzahlung (beworben als CHF 246 pro Monat plus CHF 7'680 Anzahlung), Preis für den Kanton VD",
      },
    ],
    oneOffCosts: ["Anfangspauschale CHF 390 für Neukunden", "Depot CHF 1'000, rückerstattbar"],
    included:
      "Haftpflicht und Vollkasko, Immatrikulation und Verkehrssteuer im eigenen Kanton, Reifen, Service und Unterhalt, erste Vignette",
    selbstbehalt: "CHF 250 bis CHF 1'000",
    extraKm: "fahrzeugabhängig",
    conditionsUrl: "https://drive.carvolution.com/de/de/was-ist-im-auto-abo-alles-inklusive",
  },
  {
    name: "Clyde",
    scope: "nur Elektroautos",
    offers: [
      {
        model: "VW ID.3 Pro Performance",
        brand: "Volkswagen",
        listingModel: "ID.3",
        monthlyChf: 459,
        termMonths: 24,
        kmPerMonth: 250,
        url: "https://clyde.ch/de/unsere-autos/vw/id.3-pro-performance/a00Vj00000d3j3rIAA",
        detail: "Aktion «Herbst-Deal»",
      },
    ],
    oneOffCosts: ["Ablieferungspauschale CHF 290"],
    included: "Versicherung, Verkehrssteuer, Immatrikulation, Reifen inklusive Einlagerung, jährliche Vignette, Service",
    selbstbehalt: "CHF 1'500",
    extraKm: "CHF 0.50 (Basic) bzw. CHF 0.60 (Premium) pro Mehrkilometer",
    conditionsUrl: "https://clyde.ch/de/gebuehrenkatalog",
  },
  {
    name: "FlatDrive",
    offers: [
      {
        model: "Peugeot 208 Allure Mild-Hybrid",
        brand: "Peugeot",
        listingModel: "208",
        monthlyChf: 435,
        termMonths: 48,
        kmPerMonth: 500,
        url: "https://flatdrive.ch/vehicle/peugeot-208-1-2-hybrid-allure-110ps-autom/",
      },
      {
        model: "BMW X3 xDrive 20d",
        brand: "BMW",
        listingModel: "X3",
        monthlyChf: 895,
        termMonths: 48,
        kmPerMonth: 500,
        url: "https://flatdrive.ch/vehicle/bmw-x3-xdrive-20d-190ps-diesel-autom/",
      },
    ],
    oneOffCosts: ["Kaution CHF 500", "Lieferung CHF 190, optional"],
    included:
      "Immatrikulation, Vignette, Verkehrssteuern, Haftpflicht, Teil- und Vollkasko, Pannendienst, Reifen, Service und Reparaturen",
    selbstbehalt: "CHF 1'000",
  },
];

// ── Copy helpers ────────────────────────────────────────────────────────────

/** "CHF 622" */
export const CEMBRA_TRANSFER_DISPLAY = formatChf(CEMBRA_TRANSFER_INCL_VAT_ROUNDED_CHF);

/** "bei Cembra rund CHF 622 inkl. MWST" */
export const FEE_SHORT = `bei ${CEMBRA.name} rund ${CEMBRA_TRANSFER_DISPLAY} inkl. MWST`;

/**
 * Kept word for word because /lp/leasing-abgeben (Google Ads, untouched in Phase 2)
 * renders it. Organic pages cite the lender table and the cantonal table instead.
 */
export const FEE_SENTENCE =
  `Für die Übertragung verrechnet die Leasinggesellschaft eine Gebühr. ${CEMBRA.name} publiziert sie: ` +
  `${formatChf(CEMBRA.feesExclVatChf.halterwechsel)} für den Halterwechsel plus ` +
  `${formatChf(CEMBRA.feesExclVatChf.fahrzeugausweisUmschreibung)} für die Umschreibung des Fahrzeugausweises, ` +
  `jeweils exkl. MWST – zusammen rund ${CEMBRA_TRANSFER_DISPLAY} inkl. MWST. ` +
  `${AMAG_LEASING.name}, ${MULTILEASE.name} und ${BANK_NOW.name} publizieren keinen Übernahme-Tarif ` +
  `und legen die Konditionen auf Anfrage fest. Dazu kommen die kantonalen Gebühren des Strassenverkehrsamts.`;

// ── Live inventory stats ────────────────────────────────────────────────────

export interface InventoryStats {
  /** Live Leasingübernahme listings. */
  count: number;
  medianRate: number | null;
  medianMonths: number | null;
  /** Listings whose seller asks a Kaution (> 0). */
  withKaution: number;
  kautionMin: number | null;
  kautionMax: number | null;
}

export interface InventoryStatsInput {
  rateChf: number | null;
  months: number | null;
  kautionChf: number | null;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const value = sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  return Math.round(value);
}

/** Stats over the live Leasingübernahme offers (pass only those). */
export function computeInventoryStats(offers: InventoryStatsInput[]): InventoryStats {
  const rates = offers.map((o) => o.rateChf).filter((v): v is number => typeof v === "number" && v > 0);
  const months = offers.map((o) => o.months).filter((v): v is number => typeof v === "number" && v >= 0);
  const kautionen = offers.map((o) => o.kautionChf).filter((v): v is number => typeof v === "number" && v > 0);

  return {
    count: offers.length,
    medianRate: median(rates),
    medianMonths: median(months),
    withKaution: kautionen.length,
    kautionMin: kautionen.length ? Math.min(...kautionen) : null,
    kautionMax: kautionen.length ? Math.max(...kautionen) : null,
  };
}

/** Shown only when live stats could not be loaded (no number without a source). */
const KAUTION_FALLBACK_SENTENCE = "Ob der Abgeber eine Kaution verlangt, steht im jeweiligen Inserat auf BuyAuto.";

/** "Bei 8 von 36 aktuellen Angeboten auf BuyAuto verlangt der Abgeber eine Kaution von CHF 2'000–15'000." */
export function kautionSentence(stats: InventoryStats | null): string {
  if (!stats || stats.count === 0) return KAUTION_FALLBACK_SENTENCE;
  if (stats.withKaution === 0 || stats.kautionMin === null || stats.kautionMax === null) {
    return "Bei den aktuellen Angeboten auf BuyAuto verlangt kein Abgeber eine Kaution.";
  }
  return (
    `Bei ${stats.withKaution} von ${stats.count} aktuellen Angeboten auf BuyAuto verlangt der Abgeber ` +
    `eine Kaution von ${formatChfRange(stats.kautionMin, stats.kautionMax)}.`
  );
}

/** Comparison-table cell: "Keine Anzahlung; Kaution bei 8 von 36 Angeboten (CHF 2'000–15'000)". */
export function kautionTableCell(stats: InventoryStats | null): string {
  if (!stats || stats.count === 0) return "Keine Anzahlung; Kaution gemäss Inserat";
  if (stats.withKaution === 0 || stats.kautionMin === null || stats.kautionMax === null) {
    return "Keine Anzahlung; bei keinem aktuellen Angebot eine Kaution";
  }
  return (
    `Keine Anzahlung; Kaution bei ${stats.withKaution} von ${stats.count} Angeboten ` +
    `(${formatChfRange(stats.kautionMin, stats.kautionMax)})`
  );
}

