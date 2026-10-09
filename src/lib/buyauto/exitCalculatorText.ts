/**
 * Wording for the Ausstiegsrechner (src/components/buyauto/ExitCalculator.tsx).
 *
 * Turns the results of exitCalculator.ts into the text the calculator shows.
 * It does no arithmetic of its own: every amount it prints is a value
 * computeExitOptions() returned, a value the user typed, or a published figure
 * already carried by the result. Checked in scripts/test-exit-calculator.ts.
 */
import type { AmountResult, ExitLenderKey, TakeoverResult } from "@/lib/buyauto/exitCalculator";
import { parseChfInput } from "@/lib/buyauto/exitCalculator";
import { LENDER_TAKEOVER_FEES, type FactSource } from "@/lib/buyauto/facts";
import { formatChf, formatChfRappen } from "@/lib/buyauto/format";
import { pricingPlans, type Plan } from "@/lib/buyauto/stripe_config";

/** Label on every result: the figures come from what the user entered. */
export const ESTIMATE_LABEL = "Schätzung aus deinen Angaben";

/** Shown for a lender in the list that publishes no takeover fee. */
export const FEE_NOT_PUBLISHED = "nicht publiziert – frag nach";

/** Shown for "Andere / weiss ich nicht": BuyAuto has no tariff to look up. */
export const FEE_UNKNOWN = "Gebühr unbekannt";

export const LENDER_OTHER_LABEL = "Andere / weiss ich nicht";

export const MISSING_LENDER = "Wähl oben deine Leasinggesellschaft.";
export const MISSING_TERMINATION = "Trag die Nachzahlung aus deiner Auflösungsofferte ein.";
export const MISSING_BUYOUT_AND_VALUE = "Trag die Ablösesumme und den Fahrzeugwert ein.";
export const MISSING_BUYOUT = "Trag die Ablösesumme ein, die dir deine Leasinggesellschaft nennt.";
export const MISSING_VALUE = "Trag den Fahrzeugwert deines Autos ein.";

export const INVALID_AMOUNT = "Gib den Betrag in Franken ein, zum Beispiel 12'500.";

/** The lender select: every lender of the fee list by name, then "Andere / weiss ich nicht". */
export const LENDER_OPTIONS: readonly { value: ExitLenderKey; label: string }[] = [
  ...LENDER_TAKEOVER_FEES.map((lender) => ({ value: lender.key, label: lender.name })),
  { value: "andere", label: LENDER_OTHER_LABEL },
];

/** Whole francs as "CHF 8'450", amounts with Rappen as "CHF 432.40". */
export function formatExitAmount(value: number): string {
  return Number.isInteger(value) ? formatChf(value) : formatChfRappen(value);
}

/** Inline hint under an amount field: only when something was typed that is not an amount. */
export function amountInputError(raw: string): string | null {
  return raw.trim() !== "" && parseChfInput(raw) === null ? INVALID_AMOUNT : null;
}

export interface ExitResultLine {
  text: string;
  source?: FactSource;
}

export interface ExitResultView {
  /** missing: `headline` says what to enter. amount: a CHF figure. text: a phrase in place of a figure. */
  kind: "missing" | "amount" | "text";
  headline: string;
  /** Small label above the headline. */
  caption?: string;
  lines: ExitResultLine[];
}

function listingLine(plan: Plan, listingFeeChf: number): ExitResultLine {
  return { text: `BuyAuto-Inserat ${pricingPlans[plan].name}: ${formatExitAmount(listingFeeChf)}` };
}

export function describeTakeover(result: TakeoverResult): ExitResultView {
  if (result.status === "missing-input") return { kind: "missing", headline: MISSING_LENDER, lines: [] };

  if (result.status === "fee-published") {
    const { lender } = result;
    const label = lender.feeLabel ? `${lender.name}, ${lender.feeLabel}` : lender.name;
    return {
      kind: "amount",
      caption: "Gebühr plus Inserat",
      headline: formatExitAmount(result.totalChf),
      lines: [
        {
          text:
            `${label}: ${formatExitAmount(result.lenderFeeInclVatChf)} inkl. MWST ` +
            `(${formatExitAmount(result.lenderFeeExclVatChf)} exkl. MWST)`,
          source: lender.source ?? undefined,
        },
        listingLine(result.plan, result.listingFeeChf),
      ],
    };
  }

  const { lender } = result;
  if (lender === null) {
    return {
      kind: "text",
      headline: FEE_UNKNOWN,
      lines: [
        { text: "Frag deine Leasinggesellschaft nach der Gebühr für die Vertragsübernahme." },
        listingLine(result.plan, result.listingFeeChf),
      ],
    };
  }
  const lines: ExitResultLine[] = [{ text: `Frag ${lender.name} nach der Gebühr für die Vertragsübernahme.` }];
  if (lender.source) {
    lines.push({ text: "Die Leasingbestimmungen nennen keine Gebühr dafür.", source: lender.source });
  }
  lines.push(listingLine(result.plan, result.listingFeeChf));
  return { kind: "text", headline: FEE_NOT_PUBLISHED, lines };
}

export function describeEarlyTermination(result: AmountResult): ExitResultView {
  if (result.status === "missing-input") return { kind: "missing", headline: MISSING_TERMINATION, lines: [] };
  return {
    kind: "amount",
    caption: "Nachzahlung",
    headline: formatExitAmount(result.amountChf),
    lines: [{ text: "Betrag aus der Auflösungsofferte deiner Leasinggesellschaft." }],
  };
}

/**
 * `buyoutChf` and `vehicleValueChf` are the parsed inputs the result was
 * computed from; they are only echoed back in the breakdown line.
 */
export function describeBuyoutAndSell(
  result: AmountResult,
  buyoutChf: number | null,
  vehicleValueChf: number | null,
): ExitResultView {
  if (result.status === "missing-input") {
    const needsBuyout = result.missing.includes("buyoutAmountChf");
    const needsValue = result.missing.includes("vehicleValueChf");
    const headline =
      needsBuyout && needsValue ? MISSING_BUYOUT_AND_VALUE : needsBuyout ? MISSING_BUYOUT : MISSING_VALUE;
    return { kind: "missing", headline, lines: [] };
  }

  const breakdown: ExitResultLine[] =
    buyoutChf !== null && vehicleValueChf !== null
      ? [
          {
            text: `Ablösesumme ${formatExitAmount(buyoutChf)} minus Fahrzeugwert ${formatExitAmount(vehicleValueChf)}.`,
          },
        ]
      : [];
  const amount = result.amountChf;

  if (amount > 0) {
    return {
      kind: "amount",
      caption: "Fehlt dir nach dem Verkauf",
      headline: formatExitAmount(amount),
      lines: [
        ...breakdown,
        {
          text: `Verkaufst du das Auto zu diesem Wert, zahlst du rund ${formatExitAmount(amount)} aus eigener Tasche.`,
        },
      ],
    };
  }
  if (amount < 0) {
    const surplus = formatExitAmount(Math.abs(amount));
    return {
      kind: "amount",
      caption: "Bleibt dir nach dem Verkauf",
      headline: surplus,
      lines: [...breakdown, { text: `Das Auto ist rund ${surplus} mehr wert als die Ablösesumme.` }],
    };
  }
  return {
    kind: "amount",
    caption: "Differenz",
    headline: formatExitAmount(0),
    lines: [...breakdown, { text: "Ablösesumme und Fahrzeugwert sind gleich hoch." }],
  };
}
