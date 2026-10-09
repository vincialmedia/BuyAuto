/**
 * Checks for the Ausstiegsrechner logic: `npx tsx scripts/test-exit-calculator.ts`.
 * Exits non-zero on the first failed assertion.
 *
 * Covers each scenario, missing inputs, a lender without a published fee,
 * the founder's own 2024 example (F8) and the wording the calculator shows
 * (exitCalculatorText.ts).
 */
import assert from "node:assert/strict";
import {
  computeBuyoutAndSell,
  computeEarlyTermination,
  computeExitOptions,
  computeTakeover,
  parseChfInput,
} from "../src/lib/buyauto/exitCalculator";
import {
  AMAG_LEASING,
  CA_AUTO_FINANCE,
  CEMBRA,
  CEMBRA_TRANSFER_EXCL_VAT_CHF,
  CEMBRA_TRANSFER_INCL_VAT_CHF,
  FOUNDER_TAKEOVER,
  LENDER_TAKEOVER_FEES,
  PORSCHE_FINANCIAL_SERVICES,
} from "../src/lib/buyauto/facts";
import { pricingPlans } from "../src/lib/buyauto/stripe_config";
import {
  amountInputError,
  describeBuyoutAndSell,
  describeEarlyTermination,
  describeTakeover,
  ESTIMATE_LABEL,
  FEE_NOT_PUBLISHED,
  FEE_UNKNOWN,
  formatExitAmount,
  INVALID_AMOUNT,
  LENDER_OPTIONS,
  LENDER_OTHER_LABEL,
  MISSING_BUYOUT,
  MISSING_BUYOUT_AND_VALUE,
  MISSING_LENDER,
  MISSING_TERMINATION,
  MISSING_VALUE,
  type ExitResultView,
} from "../src/lib/buyauto/exitCalculatorText";

// --- Übernahme: lender with a published fee ---------------------------------
{
  const r = computeTakeover("cembra");
  assert.equal(r.status, "fee-published");
  if (r.status !== "fee-published") throw new Error("unreachable");
  assert.equal(r.lenderFeeExclVatChf, CEMBRA_TRANSFER_EXCL_VAT_CHF); // 575
  assert.equal(r.lenderFeeExclVatChf, 575);
  assert.equal(r.lenderFeeInclVatChf, CEMBRA_TRANSFER_INCL_VAT_CHF); // 621.58
  assert.equal(r.lenderFeeInclVatChf, 621.58);
  assert.equal(r.plan, "standard");
  assert.equal(r.listingFeeChf, pricingPlans.standard.price);
  assert.equal(r.totalChf, 621.58 + pricingPlans.standard.price);
}
{
  const r = computeTakeover("ca-auto-finance");
  assert.equal(r.status, "fee-published");
  if (r.status !== "fee-published") throw new Error("unreachable");
  assert.equal(r.lenderFeeExclVatChf, CA_AUTO_FINANCE.feesExclVatChf.vertragsumschreibung); // 400
  assert.equal(r.lenderFeeInclVatChf, 432.4);
}
// BuyAuto plan price comes from the pricing source of truth
{
  const r = computeTakeover("cembra", "extended");
  if (r.status !== "fee-published") throw new Error("expected published fee");
  assert.equal(r.listingFeeChf, pricingPlans.extended.price);
  assert.equal(r.totalChf, Math.round((621.58 + pricingPlans.extended.price) * 100) / 100);
}

// --- Übernahme: lenders without a published fee -> never a number ----------
for (const key of ["amag", "bmw", "porsche", "mercedes-benz", "multilease", "bank-now"] as const) {
  const r = computeTakeover(key);
  assert.equal(r.status, "fee-unpublished", key);
  if (r.status !== "fee-unpublished") throw new Error("unreachable");
  assert.equal(r.lender?.key, key);
  assert.equal(r.listingFeeChf, pricingPlans.standard.price);
  assert.equal("totalChf" in r, false, `${key} must not get a total`);
}
{
  const r = computeTakeover("andere");
  assert.equal(r.status, "fee-unpublished");
  if (r.status !== "fee-unpublished") throw new Error("unreachable");
  assert.equal(r.lender, null);
}
// Every lender in the fee list resolves to exactly one of the two outcomes.
for (const lender of LENDER_TAKEOVER_FEES) {
  const r = computeTakeover(lender.key);
  assert.equal(r.status, lender.feeExclVatChf === null ? "fee-unpublished" : "fee-published", lender.key);
}

// --- Missing inputs ----------------------------------------------------------
assert.deepEqual(computeTakeover(null), { status: "missing-input", missing: ["lender"] });
assert.deepEqual(computeEarlyTermination(null), { status: "missing-input", missing: ["terminationPaymentChf"] });
assert.deepEqual(computeEarlyTermination(undefined), { status: "missing-input", missing: ["terminationPaymentChf"] });
assert.deepEqual(computeEarlyTermination(-100), { status: "missing-input", missing: ["terminationPaymentChf"] });
assert.deepEqual(computeEarlyTermination(Number.NaN), { status: "missing-input", missing: ["terminationPaymentChf"] });
assert.deepEqual(computeBuyoutAndSell(30000, null), { status: "missing-input", missing: ["vehicleValueChf"] });
assert.deepEqual(computeBuyoutAndSell(null, 25000), { status: "missing-input", missing: ["buyoutAmountChf"] });
assert.deepEqual(computeBuyoutAndSell(null, null), {
  status: "missing-input",
  missing: ["buyoutAmountChf", "vehicleValueChf"],
});
{
  const empty = computeExitOptions({ lender: null });
  assert.equal(empty.takeover.status, "missing-input");
  assert.equal(empty.earlyTermination.status, "missing-input");
  assert.equal(empty.buyoutAndSell.status, "missing-input");
}

// --- Each scenario with inputs ------------------------------------------------
assert.deepEqual(computeEarlyTermination(8450), { status: "ok", amountChf: 8450 });
assert.deepEqual(computeEarlyTermination(0), { status: "ok", amountChf: 0 });
assert.deepEqual(computeBuyoutAndSell(42000, 35500), { status: "ok", amountChf: 6500 });
// Car worth more than the buyout: negative = you keep the difference.
assert.deepEqual(computeBuyoutAndSell(30000, 31200), { status: "ok", amountChf: -1200 });
{
  const all = computeExitOptions({
    lender: "cembra",
    terminationPaymentChf: 9000,
    buyoutAmountChf: 40000,
    vehicleValueChf: 33000,
  });
  assert.equal(all.takeover.status, "fee-published");
  assert.deepEqual(all.earlyTermination, { status: "ok", amountChf: 9000 });
  assert.deepEqual(all.buyoutAndSell, { status: "ok", amountChf: 7000 });
}

// --- The founder's own example (F8): BMW i8, 2024 ------------------------------
{
  // He only knows the gap (about CHF 20'000), not the two amounts; any pair with
  // that gap must give it back, and BMW publishes no takeover fee.
  const gap = FOUNDER_TAKEOVER.exitCostApproxChf;
  assert.equal(gap, 20000);
  const r = computeExitOptions({ lender: "bmw", buyoutAmountChf: 80000, vehicleValueChf: 80000 - gap });
  assert.deepEqual(r.buyoutAndSell, { status: "ok", amountChf: 20000 });
  assert.equal(r.takeover.status, "fee-unpublished"); // the CHF 550 he paid is not a published tariff
  assert.equal(FOUNDER_TAKEOVER.takeoverFeeChf, 550);
  assert.equal(FOUNDER_TAKEOVER.year, 2024);
  assert.equal(FOUNDER_TAKEOVER.monthsLeftApprox, 30);
}

// --- Input parsing -------------------------------------------------------------
assert.equal(parseChfInput("12'500"), 12500);
assert.equal(parseChfInput("12’500"), 12500);
assert.equal(parseChfInput("12 500"), 12500);
assert.equal(parseChfInput("CHF 9000"), 9000);
assert.equal(parseChfInput("432.40"), 432.4);
assert.equal(parseChfInput("432,40"), 432.4);
assert.equal(parseChfInput(""), null);
assert.equal(parseChfInput("abc"), null);
assert.equal(parseChfInput("-500"), null);
assert.equal(parseChfInput("20'000.–"), 20000);
assert.equal(parseChfInput("20'000.-"), 20000);
assert.equal(parseChfInput("Fr. 20'000"), 20000);
assert.equal(parseChfInput("Fr 1'250.50"), 1250.5);
assert.equal(parseChfInput("20'000.–.–"), null);

// --- Wording shown by the calculator (exitCalculatorText.ts) ---------------------
const viewText = (v: ExitResultView) => [v.caption ?? "", v.headline, ...v.lines.map((l) => l.text)].join(" | ");

assert.equal(ESTIMATE_LABEL, "Schätzung aus deinen Angaben");
assert.equal(FEE_NOT_PUBLISHED, "nicht publiziert – frag nach");

// Amount formatting: whole francs without Rappen, otherwise with Rappen, Swiss apostrophe.
assert.equal(formatExitAmount(8450), "CHF 8'450");
assert.equal(formatExitAmount(20000), "CHF 20'000");
assert.equal(formatExitAmount(0), "CHF 0");
assert.equal(formatExitAmount(432.4), "CHF 432.40");
assert.equal(formatExitAmount(621.58), "CHF 621.58");
assert.equal(formatExitAmount(12500.5), "CHF 12'500.50");

// Lender select: every lender of the fee list, by name, then "Andere / weiss ich nicht".
assert.equal(LENDER_OPTIONS.length, LENDER_TAKEOVER_FEES.length + 1);
LENDER_TAKEOVER_FEES.forEach((lender, i) => {
  assert.equal(LENDER_OPTIONS[i].value, lender.key);
  assert.equal(LENDER_OPTIONS[i].label, lender.name);
});
assert.deepEqual(LENDER_OPTIONS[LENDER_OPTIONS.length - 1], { value: "andere", label: LENDER_OTHER_LABEL });
assert.equal(LENDER_OTHER_LABEL, "Andere / weiss ich nicht");

// Input errors only for something typed that is not an amount; empty is "not entered".
assert.equal(amountInputError(""), null);
assert.equal(amountInputError("   "), null);
assert.equal(amountInputError("12'500"), null);
assert.equal(amountInputError("abc"), INVALID_AMOUNT);
assert.equal(amountInputError("-500"), INVALID_AMOUNT);

// Übernahme: missing lender
{
  const v = describeTakeover(computeTakeover(null));
  assert.equal(v.kind, "missing");
  assert.equal(v.headline, MISSING_LENDER);
}
// Übernahme: published fee (Cembra) -> total, incl. and exkl. MWST, source, listing fee
{
  const v = describeTakeover(computeTakeover("cembra"));
  assert.equal(v.kind, "amount");
  assert.equal(v.headline, "CHF 621.58");
  assert.equal(
    v.lines[0].text,
    "Cembra, Halterwechsel plus Umschreibung des Fahrzeugausweises: CHF 621.58 inkl. MWST (CHF 575 exkl. MWST)"
  );
  assert.equal(v.lines[0].source, CEMBRA.source);
  assert.equal(v.lines[1].text, "BuyAuto-Inserat Standard: CHF 0");
}
{
  const v = describeTakeover(computeTakeover("ca-auto-finance", "extended"));
  assert.equal(v.headline, formatExitAmount(432.4 + pricingPlans.extended.price)); // CHF 482.40
  assert.equal(v.headline, "CHF 482.40");
  assert.equal(v.lines[0].text, "CA Auto Finance, Vertragsumschreibung: CHF 432.40 inkl. MWST (CHF 400 exkl. MWST)");
  assert.equal(v.lines[1].text, `BuyAuto-Inserat Verlängert: CHF ${pricingPlans.extended.price}`);
}
// Übernahme: no published fee -> the exact phrase, never a total
for (const key of ["amag", "bmw", "porsche", "mercedes-benz", "multilease", "bank-now"] as const) {
  const v = describeTakeover(computeTakeover(key));
  assert.equal(v.kind, "text", key);
  assert.equal(v.headline, FEE_NOT_PUBLISHED, key);
  const amounts = viewText(v).match(/CHF [\d'.]+/g) ?? [];
  assert.deepEqual(amounts, ["CHF 0"], `${key}: only the listing fee may be printed`);
}
{
  const amag = describeTakeover(computeTakeover("amag"));
  assert.equal(amag.lines.find((l) => l.source)?.source, AMAG_LEASING.source);
  const porsche = describeTakeover(computeTakeover("porsche"));
  assert.equal(porsche.lines.find((l) => l.source)?.source, PORSCHE_FINANCIAL_SERVICES.source);
  const bmw = describeTakeover(computeTakeover("bmw"));
  assert.equal(bmw.lines.some((l) => l.source), false, "BMW publishes nothing to cite");
}
{
  const v = describeTakeover(computeTakeover("andere"));
  assert.equal(v.headline, FEE_UNKNOWN);
  assert.deepEqual(viewText(v).match(/CHF [\d'.]+/g), ["CHF 0"]);
}

// Vorzeitige Auflösung
{
  const missing = describeEarlyTermination(computeEarlyTermination(null));
  assert.equal(missing.kind, "missing");
  assert.equal(missing.headline, "Trag die Nachzahlung aus deiner Auflösungsofferte ein.");
  assert.equal(missing.headline, MISSING_TERMINATION);
  const ok = describeEarlyTermination(computeEarlyTermination(parseChfInput("8'450")));
  assert.equal(ok.kind, "amount");
  assert.equal(ok.headline, "CHF 8'450");
}

// Rauskaufen und verkaufen
assert.equal(describeBuyoutAndSell(computeBuyoutAndSell(null, null), null, null).headline, MISSING_BUYOUT_AND_VALUE);
assert.equal(describeBuyoutAndSell(computeBuyoutAndSell(null, 25000), null, 25000).headline, MISSING_BUYOUT);
assert.equal(describeBuyoutAndSell(computeBuyoutAndSell(30000, null), 30000, null).headline, MISSING_VALUE);
{
  const v = describeBuyoutAndSell(computeBuyoutAndSell(42000, 35500), 42000, 35500);
  assert.equal(v.kind, "amount");
  assert.equal(v.headline, "CHF 6'500");
  assert.equal(v.lines[0].text, "Ablösesumme CHF 42'000 minus Fahrzeugwert CHF 35'500.");
}
{
  // Car worth more than the buyout: say so, with the positive difference.
  const v = describeBuyoutAndSell(computeBuyoutAndSell(30000, 31200), 30000, 31200);
  assert.equal(v.headline, "CHF 1'200");
  assert.ok(v.lines.some((l) => l.text === "Das Auto ist rund CHF 1'200 mehr wert als die Ablösesumme."));
  assert.ok(!viewText(v).includes("-"), "no negative sign shown");
}
{
  const v = describeBuyoutAndSell(computeBuyoutAndSell(30000, 30000), 30000, 30000);
  assert.equal(v.headline, "CHF 0");
}

// The calculator never says "gratis"/"kostenlos" (the page uses its one mention elsewhere).
{
  const all = [
    ...LENDER_TAKEOVER_FEES.map((l) => describeTakeover(computeTakeover(l.key))),
    describeTakeover(computeTakeover("andere")),
    describeTakeover(computeTakeover(null)),
    describeEarlyTermination(computeEarlyTermination(1000)),
    describeBuyoutAndSell(computeBuyoutAndSell(1000, 2000), 1000, 2000),
    describeBuyoutAndSell(computeBuyoutAndSell(2000, 1000), 2000, 1000),
  ];
  for (const v of all) assert.ok(!/gratis|kostenlos/i.test(viewText(v)), viewText(v));
}

console.log("exitCalculator: all checks passed");
