/**
 * Facts module — the ONLY place fee numbers live.
 *
 * Every fee figure the site states must be built from the constants below,
 * each tied to a published source. If a sentence needs a number that is not
 * here, it does not get a number. Live inventory figures (median rate, Kaution
 * spread, …) come from computeInventoryStats() over the current
 * Leasingübernahme listings, never from hand-typed copy.
 */
import { formatChf, formatChfRange } from "@/lib/buyauto/format";

/** Schweizer Mehrwertsteuer-Normalsatz. */
export const VAT_RATE = 0.081;

/** Cembra Money Bank — Gebühren Leasing (PDF), gültig ab 1.9.2023. All CHF exkl. MWST. */
export const CEMBRA = {
  name: "Cembra",
  sourceUrl: "https://cembra.ch/assets/cembra/leasing/gebuehren-de.pdf",
  validFrom: "1.9.2023",
  feesExclVatChf: {
    halterwechsel: 500,
    fahrzeugausweisUmschreibung: 75,
    kuendigungsabrechnung: 250,
    kuendigungsschreiben: 25,
  },
} as const;

/**
 * AMAG Leasing — Allgemeine Leasingbestimmungen Autos (ALB), Ausgabe 01/26.
 * No published takeover fee (Konditionen auf Anfrage). All CHF exkl. MWST.
 */
export const AMAG_LEASING = {
  name: "AMAG Leasing",
  sourceUrl:
    "https://www.amag-leasing.ch/content/dam/amag-leasingportal/documents/allgemeine-leasingbestimmungen/deutsch/ALB_Autos_0126_D.pdf",
  edition: "Ausgabe 01/26",
  documentTitle: "Allgemeine Leasingbestimmungen Autos (ALB), Ausgabe 01/26",
  takeoverFeeChf: null,
  feesExclVatChf: {
    /** Ziff. 18: vorzeitige Vertragsauflösung, pauschal. */
    vorzeitigeVertragsaufloesung: 900,
    /** Ziff. 18: Berechnung der provisorischen Auflösungskosten. */
    provisorischeAufloesungskosten: 250,
  },
  clauses: {
    /** Fees for early termination and the provisional calculation. */
    aufloesungsgebuehren: "Ziff. 18",
    /** On early termination the rates are recalculated retroactively from the contract start. */
    rueckwirkendeNeuberechnung: "Ziff. 14.1",
  },
} as const;

/** Multilease and BANK-now publish no takeover fee. */
export const MULTILEASE = { name: "Multilease", takeoverFeeChf: null } as const;
export const BANK_NOW = { name: "BANK-now", takeoverFeeChf: null } as const;

/** Amount incl. MWST, rounded to the Rappen (integer arithmetic: 575 × 1.081 = 621.58, not 621.57). */
export function withVat(chfExclVat: number): number {
  const vatFactorPermille = Math.round((1 + VAT_RATE) * 1000);
  return Math.round((chfExclVat * vatFactorPermille) / 10) / 100;
}

/** Cembra transfer = Halterwechsel + Umschreibung Fahrzeugausweis, exkl. MWST (CHF 575). */
export const CEMBRA_TRANSFER_EXCL_VAT_CHF =
  CEMBRA.feesExclVatChf.halterwechsel + CEMBRA.feesExclVatChf.fahrzeugausweisUmschreibung;

/** (500 + 75) × 1.081 = CHF 621.58. */
export const CEMBRA_TRANSFER_INCL_VAT_CHF = withVat(CEMBRA_TRANSFER_EXCL_VAT_CHF);

/** Displayed as "rund CHF 622 inkl. MWST". */
export const CEMBRA_TRANSFER_INCL_VAT_ROUNDED_CHF = Math.round(CEMBRA_TRANSFER_INCL_VAT_CHF);

// ── Copy helpers ────────────────────────────────────────────────────────────

/** "CHF 622" */
export const CEMBRA_TRANSFER_DISPLAY = formatChf(CEMBRA_TRANSFER_INCL_VAT_ROUNDED_CHF);

/** "bei Cembra rund CHF 622 inkl. MWST" */
export const FEE_SHORT = `bei ${CEMBRA.name} rund ${CEMBRA_TRANSFER_DISPLAY} inkl. MWST`;

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

