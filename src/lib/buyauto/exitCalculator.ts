/**
 * Ausstiegsrechner (/leasing-abgeben-schweiz): the three ways out of a lease,
 * computed ONLY from what the user enters plus published figures.
 *
 *   Übernahme              = the lender's published transfer fee (facts.ts,
 *                            LENDER_TAKEOVER_FEES; "nicht publiziert" when the
 *                            lender publishes none) + BuyAuto's listing fee
 *                            (stripe_config.pricingPlans, the pricing source of truth)
 *   Vorzeitige Auflösung   = the Nachzahlung from the lender's Auflösungsofferte
 *   Rauskaufen + verkaufen = Ablösesumme − Fahrzeugwert
 *
 * A result exists only when its inputs exist. Nothing is estimated or filled
 * in: a missing input yields "missing-input", never a default number.
 */
import { LENDER_TAKEOVER_FEES, type LenderTakeoverFee } from "@/lib/buyauto/facts";
import { pricingPlans, type Plan } from "@/lib/buyauto/stripe_config";

export type ExitLenderKey = LenderTakeoverFee["key"] | "andere";

export interface ExitCalculatorInput {
  /** Selected Leasinggesellschaft; null = not chosen yet. */
  lender: ExitLenderKey | null;
  /** Nachzahlung laut Auflösungsofferte (CHF). */
  terminationPaymentChf?: number | null;
  /** Ablösesumme fürs Rauskaufen (CHF). */
  buyoutAmountChf?: number | null;
  /** Fahrzeugwert (CHF), e.g. from the Eintauschwert-Rechner. */
  vehicleValueChf?: number | null;
  /** BuyAuto plan for the listing; defaults to the free Standard plan. */
  plan?: Plan;
}

export type TakeoverResult =
  | { status: "missing-input"; missing: ("lender")[] }
  | {
      status: "fee-published";
      lender: LenderTakeoverFee;
      lenderFeeExclVatChf: number;
      lenderFeeInclVatChf: number;
      plan: Plan;
      listingFeeChf: number;
      /** Lender fee incl. MWST + BuyAuto listing fee. */
      totalChf: number;
    }
  | {
      status: "fee-unpublished";
      /** null when the user picked "andere". */
      lender: LenderTakeoverFee | null;
      plan: Plan;
      listingFeeChf: number;
    };

export type AmountResult =
  | { status: "missing-input"; missing: string[] }
  | { status: "ok"; amountChf: number };

export interface ExitCalculatorResult {
  takeover: TakeoverResult;
  earlyTermination: AmountResult;
  buyoutAndSell: AmountResult;
}

/** A usable CHF amount: finite and not negative. Anything else counts as not entered. */
export function validAmount(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

/** "12'500" / "12 500" / "12500.50" / "" -> number or null (Swiss input habits). */
export function parseChfInput(raw: string): number | null {
  const cleaned = raw.replace(/[’'\s]/g, "").replace(/^CHF/i, "").replace(",", ".");
  if (cleaned === "") return null;
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  return validAmount(Number(cleaned));
}

export function listingFeeChf(plan: Plan): number {
  return pricingPlans[plan].price;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function computeTakeover(lender: ExitLenderKey | null, plan: Plan = "standard"): TakeoverResult {
  if (lender === null) return { status: "missing-input", missing: ["lender"] };
  const fee = listingFeeChf(plan);
  const entry = lender === "andere" ? null : LENDER_TAKEOVER_FEES.find((l) => l.key === lender) ?? null;
  if (entry && entry.feeExclVatChf !== null && entry.feeInclVatChf !== null) {
    return {
      status: "fee-published",
      lender: entry,
      lenderFeeExclVatChf: entry.feeExclVatChf,
      lenderFeeInclVatChf: entry.feeInclVatChf,
      plan,
      listingFeeChf: fee,
      totalChf: round2(entry.feeInclVatChf + fee),
    };
  }
  return { status: "fee-unpublished", lender: entry, plan, listingFeeChf: fee };
}

export function computeEarlyTermination(terminationPaymentChf: number | null | undefined): AmountResult {
  const amount = validAmount(terminationPaymentChf);
  if (amount === null) return { status: "missing-input", missing: ["terminationPaymentChf"] };
  return { status: "ok", amountChf: round2(amount) };
}

/**
 * Ablösesumme minus Fahrzeugwert. Positive = what getting out costs you;
 * negative = the car is worth more than the buyout (you would keep the difference).
 */
export function computeBuyoutAndSell(
  buyoutAmountChf: number | null | undefined,
  vehicleValueChf: number | null | undefined
): AmountResult {
  const buyout = validAmount(buyoutAmountChf);
  const value = validAmount(vehicleValueChf);
  const missing: string[] = [];
  if (buyout === null) missing.push("buyoutAmountChf");
  if (value === null) missing.push("vehicleValueChf");
  if (buyout === null || value === null) return { status: "missing-input", missing };
  return { status: "ok", amountChf: round2(buyout - value) };
}

export function computeExitOptions(input: ExitCalculatorInput): ExitCalculatorResult {
  return {
    takeover: computeTakeover(input.lender, input.plan ?? "standard"),
    earlyTermination: computeEarlyTermination(input.terminationPaymentChf),
    buyoutAndSell: computeBuyoutAndSell(input.buyoutAmountChf, input.vehicleValueChf),
  };
}
