/**
 * Marketing copy for the pricing surfaces.
 *
 * The garage tiers moved to `@/lib/buyauto/garagePlans` so API routes and lib
 * code can read the same numbers without importing from the component tree.
 * The re-exports below keep the old import path working.
 */

export {
  GARAGE_CORE_FEATURES,
  GARAGE_COMPARISON_ROWS,
  GARAGE_TRUST_POINTS,
  GARAGE_PLANS,
  GARAGE_PLAN_ORDER,
  garagePlans,
  garagePlanFor,
  planValueLine,
  premiumValueChf,
  pricePerVehicleChf,
  formatChf,
  type GaragePlan,
  type GaragePlanCode,
  type GarageFeature,
  type GarageComparisonRow,
} from "@/lib/buyauto/garagePlans";

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
    "Jederzeit pausierbar",
    "Prioritäts-Support",
  ],
};
