/**
 * Marketing copy for the pricing surfaces.
 *
 * The garage tiers moved to `@/lib/buyauto/garagePlans` so API routes and lib
 * code can read the same numbers without importing from the component tree.
 * The re-exports below keep the old import path working.
 */

import {
  PREMIUM_BOOST_PRICE,
  RELIST_PRICE_CHF,
  RELIST_PRICE_EXTENDED_CHF,
  pricingPlans,
  type Plan,
} from "@/lib/buyauto/stripe_config";

export {
  GARAGE_CORE_FEATURES,
  GARAGE_COMPARISON_ROWS,
  GARAGE_TRUST_POINTS,
  GARAGE_PLANS,
  GARAGE_PLAN_ORDER,
  garagePlans,
  garagePlanFor,
  perVehicleLine,
  pricePerVehicleChf,
  formatChf,
  type GaragePlan,
  type GaragePlanCode,
  type GarageFeature,
  type GarageComparisonRow,
} from "@/lib/buyauto/garagePlans";

export interface PrivateComparisonRow {
  key: string;
  label: string;
  tooltip?: string;
  /** false = not included in that plan, string = the value shown. */
  values: Record<Plan, string | false>;
}

/**
 * Feature × plan matrix for the private one-time plans — the private
 * counterpart to GARAGE_COMPARISON_ROWS. Values interpolate from
 * stripe_config so the table can never drift from checkout.
 */
export const PRIVATE_COMPARISON_ROWS: PrivateComparisonRow[] = [
  {
    key: "price",
    label: "Preis (einmalig pro Inserat)",
    values: {
      standard: "gratis",
      extended: `CHF ${pricingPlans.extended.price}`,
      unlimited: `CHF ${pricingPlans.unlimited.price}`,
    },
  },
  {
    key: "duration",
    label: "Laufzeit",
    values: {
      standard: `${pricingPlans.standard.duration_days} Tage`,
      extended: `${pricingPlans.extended.duration_days} Tage`,
      unlimited: "online bis verkauft",
    },
  },
  {
    key: "photos",
    label: "Fotos pro Inserat",
    values: { standard: "bis 5", extended: "bis 15", unlimited: "bis 15" },
  },
  {
    key: "premium",
    label: "Premium-Platzierung",
    tooltip: `Ein Premium-Boost hebt dein Inserat 30 Tage zuoberst in der Suche hervor – einzeln CHF ${PREMIUM_BOOST_PRICE}.`,
    values: {
      standard: false,
      extended: "30 Tage inklusive",
      unlimited: "dauerhaft inklusive",
    },
  },
  {
    key: "relist",
    label: "Wiedereinstellen nach Ablauf",
    values: {
      standard: `CHF ${RELIST_PRICE_CHF}`,
      extended: `CHF ${RELIST_PRICE_EXTENDED_CHF}`,
      unlimited: "entfällt – läuft nicht ab",
    },
  },
  {
    key: "pause",
    label: "Inserat pausieren",
    tooltip:
      "Pausieren geht in jedem Plan. In Unlimitiert läuft dabei keine Frist ab – du verlierst keine Laufzeit.",
    values: {
      standard: "möglich",
      extended: "möglich",
      unlimited: "ohne Zeitverlust",
    },
  },
  {
    key: "support",
    label: "Support",
    values: {
      standard: "Standard",
      extended: "Standard",
      unlimited: "Priorität",
    },
  },
];

export const privatePlanMarketingFeatures: Record<
  "standard" | "extended" | "unlimited",
  string[]
> = {
  standard: ["60 Tage Laufzeit", "Standard-Platzierung"],
  extended: [
    "90 Tage Laufzeit",
    "Gratis Premium Boost",
    "15 statt 5 Fotos",
    "Verlängerung: CHF 15 statt CHF 30",
  ],
  unlimited: [
    "Online bis verkauft – einmal zahlen",
    "Premium-Platzierung dauerhaft inklusive",
    "15 statt 5 Fotos",
    "Keine Ablauf- und Verlängerungsgebühren",
    // Pausing itself works on every plan — what is unique here is that pausing
    // costs nothing, because there is no clock running down.
    "Pausieren ohne Zeitverlust – es läuft keine Frist",
    "Prioritäts-Support",
  ],
};
