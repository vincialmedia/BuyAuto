/**
 * Checks for the contract end date helpers: `npx tsx scripts/test-contract-end-date.ts`.
 * Exits non-zero on the first failed assertion.
 *
 * Covers what a listing write sends as contract_end_date (wizard Step 2 and
 * Step 5) and when the seller dashboard shows "Vertrag abgelaufen – Inserat
 * prüfen" (contract_end_date before today in Zurich).
 */
import assert from "node:assert/strict";
import {
  contractEndDateForListingWrite,
  contractEndDateForMonths,
  hasEnabledTakeoverOffer,
  isTakeoverListingWrite,
  normalizeContractEndDate,
  parseContractEndDate,
  showContractEndedBadge,
} from "../src/lib/buyauto/contractEndDate";

// --- normalizeContractEndDate ------------------------------------------------
assert.equal(normalizeContractEndDate("2027-03-15"), "2027-03-15");
assert.equal(normalizeContractEndDate(" 2027-03-15 "), "2027-03-15");
assert.equal(normalizeContractEndDate("2028-02-29"), "2028-02-29"); // leap year
assert.equal(normalizeContractEndDate("2027-02-29"), null);
assert.equal(normalizeContractEndDate("2027-02-30"), null);
assert.equal(normalizeContractEndDate("2027-13-01"), null);
assert.equal(normalizeContractEndDate("2027-3-5"), null);
assert.equal(normalizeContractEndDate("15.03.2027"), null);
assert.equal(normalizeContractEndDate("2027-03-15T00:00:00Z"), null);
assert.equal(normalizeContractEndDate(""), null);
assert.equal(normalizeContractEndDate(null), null);
assert.equal(normalizeContractEndDate(undefined), null);
assert.equal(normalizeContractEndDate(20270315), null);

// --- parseContractEndDate (local midnight, for the date pickers) -------------
const parsed = parseContractEndDate("2027-03-15");
assert.ok(parsed instanceof Date);
assert.equal(parsed.getFullYear(), 2027);
assert.equal(parsed.getMonth(), 2);
assert.equal(parsed.getDate(), 15);
assert.equal(parsed.getHours(), 0);
assert.equal(parseContractEndDate(""), undefined);
assert.equal(parseContractEndDate("2027-02-30"), undefined);

// --- takeover detection --------------------------------------------------------
const takeoverOffer = {
  enabled: false,
  interest_rate_pct: 0,
  down_payment_pct: 0,
  no_down_payment: false,
  min_term_months: 0,
  max_term_months: 0,
  lease_takeover_offer: {
    enabled: true,
    price_per_month_chf: 590,
    remaining_months: 17,
    deposit_chf: 2000,
    pickup_canton_code: "ZH",
  },
};
const newLeasingOffer = {
  enabled: true,
  interest_rate_pct: 4.9,
  down_payment_pct: 0,
  no_down_payment: false,
  min_term_months: 24,
  max_term_months: 60,
};
const disabledTakeoverOffer = {
  ...takeoverOffer,
  lease_takeover_offer: { ...takeoverOffer.lease_takeover_offer, enabled: false },
};

assert.equal(hasEnabledTakeoverOffer(takeoverOffer), true);
assert.equal(hasEnabledTakeoverOffer(disabledTakeoverOffer), false);
assert.equal(hasEnabledTakeoverOffer(newLeasingOffer), false);
assert.equal(hasEnabledTakeoverOffer(null), false);
assert.equal(hasEnabledTakeoverOffer(undefined), false);

assert.equal(isTakeoverListingWrite({ deal_type: "lease_takeover" }), true);
assert.equal(isTakeoverListingWrite({ deal_type: "lease_takeover", leasing_offer: null }), true);
assert.equal(isTakeoverListingWrite({ deal_type: "direct_purchase", leasing_offer: takeoverOffer }), true);
assert.equal(isTakeoverListingWrite({ deal_type: "direct_purchase", leasing_offer: disabledTakeoverOffer }), false);
assert.equal(isTakeoverListingWrite({ deal_type: "direct_purchase", leasing_offer: newLeasingOffer }), false);
assert.equal(isTakeoverListingWrite({ deal_type: "direct_purchase", leasing_offer: null }), false);

// --- contractEndDateForListingWrite --------------------------------------------
// Takeover with the seller's date: send it (the trigger keeps it).
assert.equal(
  contractEndDateForListingWrite({ deal_type: "lease_takeover", contract_end_date: "2027-08-20" }),
  "2027-08-20"
);
assert.equal(
  contractEndDateForListingWrite({
    deal_type: "direct_purchase",
    leasing_offer: takeoverOffer,
    contract_end_date: "2027-08-20",
  }),
  "2027-08-20"
);
// Takeover without a (valid) date: not sent, the trigger counts from the months.
assert.equal(contractEndDateForListingWrite({ deal_type: "lease_takeover", contract_end_date: null }), undefined);
assert.equal(contractEndDateForListingWrite({ deal_type: "lease_takeover" }), undefined);
assert.equal(contractEndDateForListingWrite({ deal_type: "lease_takeover", contract_end_date: "garbage" }), undefined);
assert.equal(
  contractEndDateForListingWrite({ deal_type: "direct_purchase", leasing_offer: takeoverOffer, contract_end_date: "" }),
  undefined
);
// No takeover: a stale date is cleared.
assert.equal(
  contractEndDateForListingWrite({ deal_type: "direct_purchase", leasing_offer: null, contract_end_date: "2027-08-20" }),
  null
);
assert.equal(
  contractEndDateForListingWrite({
    deal_type: "direct_purchase",
    leasing_offer: disabledTakeoverOffer,
    contract_end_date: "2027-08-20",
  }),
  null
);
assert.equal(
  contractEndDateForListingWrite({
    deal_type: "direct_purchase",
    leasing_offer: newLeasingOffer,
    contract_end_date: "2027-08-20",
  }),
  null
);

// --- contractEndDateForMonths (legacy takeover form: date vs. months typed) -----
assert.equal(contractEndDateForMonths({ contractEndDate: "2027-08-20", dateMonths: 10, months: 10 }), "2027-08-20");
assert.equal(contractEndDateForMonths({ contractEndDate: "2027-08-20", dateMonths: 10, months: "10" }), "2027-08-20");
// Months typed by hand after the date: no date.
assert.equal(contractEndDateForMonths({ contractEndDate: "2027-08-20", dateMonths: 10, months: 14 }), null);
assert.equal(contractEndDateForMonths({ contractEndDate: "2027-08-20", dateMonths: 10, months: Number.NaN }), null);
assert.equal(contractEndDateForMonths({ contractEndDate: "2027-08-20", dateMonths: null, months: 10 }), null);
assert.equal(contractEndDateForMonths({ contractEndDate: null, dateMonths: 10, months: 10 }), null);
assert.equal(contractEndDateForMonths({ contractEndDate: "2027-02-30", dateMonths: 10, months: 10 }), null);

// --- showContractEndedBadge ------------------------------------------------------
// Today in Zurich: 2026-10-09.
const now = new Date("2026-10-09T10:00:00Z");
const takeoverRow = (contract_end_date: string | null, extra: Record<string, unknown> = {}) => ({
  deal_type: "lease_takeover",
  financing_type: null,
  price_per_month_chf: 590,
  deposit_chf: 0,
  remaining_months: 17,
  contract_end_date,
  leasing_offer: null,
  status: "published",
  ...extra,
});

// The date has passed.
assert.equal(showContractEndedBadge(takeoverRow("2026-09-01"), now), true);
assert.equal(showContractEndedBadge(takeoverRow("2025-12-01"), now), true);
assert.equal(showContractEndedBadge(takeoverRow("2026-10-01"), now), true);
assert.equal(showContractEndedBadge(takeoverRow("2026-10-08"), now), true);
// Today and later: not passed, even with less than a month left.
assert.equal(showContractEndedBadge(takeoverRow("2026-10-09"), now), false);
assert.equal(showContractEndedBadge(takeoverRow("2026-10-20"), now), false);
assert.equal(showContractEndedBadge(takeoverRow("2026-10-31"), now), false);
assert.equal(showContractEndedBadge(takeoverRow("2026-11-01"), now), false);
assert.equal(showContractEndedBadge(takeoverRow("2026-11-08"), now), false);
assert.equal(showContractEndedBadge(takeoverRow("2027-08-20"), now), false);
// No (valid) end date: no badge, whatever the stored months say.
assert.equal(showContractEndedBadge(takeoverRow(null), now), false);
assert.equal(showContractEndedBadge(takeoverRow(null, { remaining_months: 0 }), now), false);
assert.equal(showContractEndedBadge(takeoverRow("2026-02-30"), now), false);
// Any status but sold.
assert.equal(showContractEndedBadge(takeoverRow("2026-09-01", { status: "draft" }), now), true);
assert.equal(showContractEndedBadge(takeoverRow("2026-09-01", { status: "paused" }), now), true);
assert.equal(showContractEndedBadge(takeoverRow("2026-09-01", { status: "sold" }), now), false);

// Direktkauf with a takeover offer (rate in the JSON offer): a takeover too.
const directWithTakeover = {
  deal_type: "direct_purchase",
  financing_type: "cash",
  price_per_month_chf: null,
  remaining_months: null,
  contract_end_date: "2026-09-01",
  leasing_offer: takeoverOffer,
  status: "published",
};
assert.equal(showContractEndedBadge(directWithTakeover, now), true);
assert.equal(showContractEndedBadge({ ...directWithTakeover, contract_end_date: "2027-03-01" }, now), false);

// Not a takeover: never a badge, whatever date the row carries.
assert.equal(
  showContractEndedBadge(
    {
      deal_type: "direct_purchase",
      financing_type: "cash",
      price_per_month_chf: null,
      contract_end_date: "2026-09-01",
      leasing_offer: null,
      status: "published",
    },
    now
  ),
  false
);
// New-leasing offer (monthly teaser price, no takeover offer): stays a Direktkauf.
assert.equal(
  showContractEndedBadge(
    {
      deal_type: "direct_purchase",
      financing_type: "leasing",
      price_per_month_chf: 450,
      remaining_months: 12,
      contract_end_date: "2026-09-01",
      leasing_offer: newLeasingOffer,
      status: "published",
    },
    now
  ),
  false
);

// Europe/Zurich, not UTC: 2026-10-31T23:30Z is already 1 November in Zurich.
const zurichNovember = new Date("2026-10-31T23:30:00Z");
assert.equal(showContractEndedBadge(takeoverRow("2026-10-31"), zurichNovember), true);
assert.equal(showContractEndedBadge(takeoverRow("2026-10-31"), new Date("2026-10-31T22:30:00Z")), false);

console.log("All contract-end-date checks passed.");
