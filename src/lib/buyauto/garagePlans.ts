/**
 * Single source of truth for the garage (dealer) packages.
 *
 * Everything that describes a tier lives here: the entitlements the backend
 * enforces (listing cap, premium boosts, valuation quota, website tools,
 * onboarding cap) *and* the copy the three pricing surfaces render
 * (/preise, /garage-plan, dashboard billing tab). Before this file each of
 * those surfaces carried its own hardcoded array and they had already drifted
 * apart, so any tier change means editing this file — and only this file.
 *
 * The numbers here mirror public.dealer_plans. The DB stays authoritative for
 * anything money- or entitlement-related at runtime (the Stripe webhook copies
 * listing_limit / premium_included_per_month onto the garage); these constants
 * are what we *show*, plus the fallback for surfaces that render before the
 * plan row is loaded. Keep both in sync — latest migration:
 * `20260814_rebalance_dealer_plans_proportionality.sql` (rationale in
 * GARAGE_PRICING_REBALANCE_AUG_2026.md).
 *
 * Deliberately framework-free so API routes and lib code can import it without
 * dragging React in.
 */

import { PREMIUM_BOOST_PRICE } from "@/lib/buyauto/stripe_config";

export type GaragePlanCode = "starter" | "growth" | "pro";

export interface GaragePlan {
  code: GaragePlanCode;
  name: string;
  /** "Best for" line — one persona per tier, so nobody has to guess. */
  tagline: string;
  monthlyPriceChf: number;
  /** Active listings included. */
  listingLimit: number;
  /** Premium boosts granted every month (worth PREMIUM_BOOST_PRICE each). */
  premiumPerMonth: number;
  /** Automatic Eintauschwert searches per month (each one costs us Firecrawl credits). */
  valuationsPerMonth: number;
  /** Inventory iFrame + Eintauschwert widget for the garage's own website. */
  websiteTools: boolean;
  /** Vehicles we upload for them at onboarding; null = not included. */
  onboardingVehicles: number | null;
  supportLevel: string;
  popular?: boolean;
  cta: string;
  /** Tier-specific selling points, on top of the core features every plan has. */
  highlights: string[];
  /** Shown greyed out with an X — the upgrade reason has to be visible. */
  notIncluded: string[];
}

export const GARAGE_PLAN_ORDER: GaragePlanCode[] = ["starter", "growth", "pro"];

export const GARAGE_PLANS: Record<GaragePlanCode, GaragePlan> = {
  starter: {
    code: "starter",
    name: "Starter",
    tagline: "Für kleine Garagen mit bis zu 15 Fahrzeugen am Platz",
    monthlyPriceChf: 149,
    listingLimit: 15,
    premiumPerMonth: 1,
    valuationsPerMonth: 25,
    websiteTools: false,
    onboardingVehicles: null,
    supportLevel: "E-Mail-Support",
    cta: "Mit Starter loslegen",
    highlights: [
      `1 Premium-Boost pro Monat inklusive – einzeln CHF ${PREMIUM_BOOST_PRICE}`,
      "Eigene Garage-Profilseite mit SEO",
      "25 Eintauschwert-Bewertungen pro Monat",
    ],
    notIncluded: [
      "Keine Website-Tools (Inventar- & Rechner-Widget)",
      "Kein persönliches Onboarding",
    ],
  },
  growth: {
    code: "growth",
    name: "Growth",
    tagline: "Für Garagen mit laufendem Occasionsgeschäft",
    monthlyPriceChf: 349,
    listingLimit: 40,
    premiumPerMonth: 3,
    valuationsPerMonth: 60,
    websiteTools: true,
    onboardingVehicles: null,
    supportLevel: "Priorisierter Support",
    popular: true,
    cta: "Growth wählen",
    highlights: [
      `3 Premium-Boosts pro Monat inklusive – Wert CHF ${3 * PREMIUM_BOOST_PRICE}`,
      "Website-Tools: Inventar- & Eintauschwert-Widget auf deiner eigenen Seite",
      "60 Eintauschwert-Bewertungen pro Monat, priorisierter Support",
    ],
    notIncluded: ["Kein persönliches Onboarding"],
  },
  pro: {
    code: "pro",
    name: "Pro",
    tagline: "Für grosse Bestände und mehrere Standorte",
    monthlyPriceChf: 599,
    listingLimit: 100,
    premiumPerMonth: 6,
    valuationsPerMonth: 150,
    websiteTools: true,
    onboardingVehicles: 100,
    supportLevel: "Persönlicher Ansprechpartner",
    cta: "Pro wählen",
    highlights: [
      "Personalisiertes Onboarding: wir richten dich ein und laden bis zu 100 Fahrzeuge hoch",
      `6 Premium-Boosts pro Monat inklusive – Wert CHF ${6 * PREMIUM_BOOST_PRICE}`,
      "150 Eintauschwert-Bewertungen pro Monat, persönlicher Ansprechpartner",
    ],
    notIncluded: [],
  },
};

/** Above this inventory size we quote individually. */
export const GARAGE_CUSTOM_THRESHOLD = GARAGE_PLANS.pro.listingLimit;

/**
 * Visible floor for the individual "100+" quote. A hidden "auf Anfrage" price
 * destroys the anchor (July research verdict); the floor also keeps pricing
 * headroom above Pro without needing a Stripe price.
 */
export const GARAGE_CUSTOM_FROM_CHF = 999;

/**
 * Photos per listing for a garage. Dealers do not pick a per-listing plan, so
 * their allowance comes from the package — and has to be at least what the
 * paid private plans give (15), otherwise a CHF 599/month dealer is worse off
 * than a CHF 50 private seller.
 */
export const GARAGE_MAX_PHOTOS = 20;

export function garagePlanFor(code: string | null | undefined): GaragePlan | null {
  const normalized = typeof code === "string" ? code.trim().toLowerCase() : "";
  if (normalized === "starter" || normalized === "growth" || normalized === "pro") {
    return GARAGE_PLANS[normalized];
  }
  return null;
}

export const garagePlans: GaragePlan[] = GARAGE_PLAN_ORDER.map((code) => GARAGE_PLANS[code]);

/* ------------------------------------------------------------------ *
 * Derived numbers used in the copy
 * ------------------------------------------------------------------ */

/** "ab CHF 5.99 pro Fahrzeug" — decomposing the price is what makes 599 feel small. */
export function pricePerVehicleChf(plan: GaragePlan): number {
  return plan.monthlyPriceChf / plan.listingLimit;
}

export function formatChf(value: number, decimals = 0): string {
  return new Intl.NumberFormat("de-CH", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * The one line under the price, e.g. "= CHF 8.73 pro Fahrzeug und Monat".
 * Replaces the old two-part value line ("Premium-Wert CHF 180/Monat inklusive
 * · CHF 5.82 pro Fahrzeug") — two calculations glued together read as jargon;
 * the boost value now lives in a plain highlight bullet with its unit price.
 */
export function perVehicleLine(plan: GaragePlan): string {
  return `= CHF ${formatChf(pricePerVehicleChf(plan), 2)} pro Fahrzeug und Monat`;
}

/* ------------------------------------------------------------------ *
 * Copy shared by every pricing surface
 * ------------------------------------------------------------------ */

export interface GarageFeature {
  key: string;
  label: string;
  tooltip?: string;
}

/** In every package — the features a garage needs to reach first value. */
export const GARAGE_CORE_FEATURES: GarageFeature[] = [
  {
    key: "public_profile",
    label: "Garage-Profilseite + Inventar-Seite",
    tooltip:
      "Du hast eine öffentliche Garage-Seite, die du wie eine Website anpassen kannst – inklusive Logo, Team, Öffnungszeiten und deinem kompletten Inventar.",
  },
  {
    key: "manage_listings",
    label: `Inserate erstellen & verwalten – bis ${GARAGE_MAX_PHOTOS} Fotos pro Fahrzeug`,
  },
  {
    key: "vin_prefill",
    label: "VIN-PreFill (wo verfügbar)",
    tooltip:
      "Fahrzeugdaten werden automatisch basierend auf der Fahrgestellnummer ausgefüllt – ein Inserat statt in 15 Minuten in 2.",
  },
  {
    key: "leasing_calculator",
    label: "Leasing-Rechner direkt im Inserat",
    tooltip:
      "Potenzielle Kunden berechnen ihre Leasingrate direkt im Inserat. Daraus entsteht automatisch ein Angebot und eine Leasing-Anfrage bei dir.",
  },
  {
    key: "deal_chat",
    label: "Deal-Chat pro Fahrzeug (Chat + Dokumente)",
    tooltip:
      "Jede Anfrage hängt am Fahrzeug: chatten, Dokumente hochladen und anfordern – ohne E-Mail-Pingpong.",
  },
  {
    key: "eintauschwert_rechner",
    label: "Eintauschwert-Rechner im Dashboard",
    tooltip:
      "Ankaufspreis aus echten Vergleichsinseraten berechnen. Die automatische Suche ist pro Paket kontingentiert, manuelle Berechnungen sind immer gratis.",
  },
  { key: "basic_stats", label: "Statistiken: Views & Anfragen pro Fahrzeug" },
];

/** Risk-reversal row. Placed next to the CTAs, not in the footer. */
export const GARAGE_TRUST_POINTS: { title: string; body: string }[] = [
  {
    title: "Monatlich kündbar",
    body: "Kein Jahresvertrag, keine Kündigungsfrist über den Monat hinaus.",
  },
  {
    title: "Keine Setup-Gebühr",
    body: "Du zahlst den Paketpreis – keine Einrichtungs- oder Freischaltgebühr obendrauf.",
  },
  {
    title: "Fixpreis statt Fahrzeugwert",
    body: "Dein Preis hängt am Paket – nicht am Wert der Autos, die du gerade im Hof hast.",
  },
];

export interface GarageComparisonRow {
  key: string;
  label: string;
  tooltip?: string;
  /** false = not included in that tier, string = the value shown. */
  values: Record<GaragePlanCode, string | false>;
}

/** Feature × tier matrix. Keeps the fences explicit instead of hiding them in prose. */
export const GARAGE_COMPARISON_ROWS: GarageComparisonRow[] = [
  {
    key: "listings",
    label: "Aktive Inserate",
    values: {
      starter: `bis ${GARAGE_PLANS.starter.listingLimit}`,
      growth: `bis ${GARAGE_PLANS.growth.listingLimit}`,
      pro: `bis ${GARAGE_PLANS.pro.listingLimit}`,
    },
  },
  {
    key: "premium",
    label: "Premium-Boosts pro Monat",
    tooltip: `Ein Premium-Boost hebt ein Fahrzeug 30 Tage hervor – einzeln CHF ${PREMIUM_BOOST_PRICE}.`,
    values: {
      starter: `${GARAGE_PLANS.starter.premiumPerMonth}`,
      growth: `${GARAGE_PLANS.growth.premiumPerMonth}`,
      pro: `${GARAGE_PLANS.pro.premiumPerMonth}`,
    },
  },
  {
    key: "profile",
    label: "Garage-Profilseite + Inventar-Seite (SEO)",
    values: { starter: "inklusive", growth: "inklusive", pro: "inklusive" },
  },
  {
    key: "core_tools",
    label: "VIN-PreFill, Leasing-Rechner & Deal-Chat",
    values: { starter: "inklusive", growth: "inklusive", pro: "inklusive" },
  },
  {
    key: "valuations",
    label: "Eintauschwert-Bewertungen pro Monat",
    tooltip:
      "Automatische Suche nach echten Vergleichsinseraten. Manuelle Berechnungen sind in jedem Paket unbegrenzt.",
    values: {
      starter: `${GARAGE_PLANS.starter.valuationsPerMonth}`,
      growth: `${GARAGE_PLANS.growth.valuationsPerMonth}`,
      pro: `${GARAGE_PLANS.pro.valuationsPerMonth}`,
    },
  },
  {
    key: "website_tools",
    label: "Website-Tools: Inventar- & Eintauschwert-Widget",
    tooltip:
      "Dein Inventar und der Eintauschwert-Rechner laufen als Widget auf deiner eigenen Website – ein Snippet einfügen, fertig.",
    values: {
      starter: GARAGE_PLANS.starter.websiteTools ? "inklusive" : false,
      growth: "inklusive",
      pro: "inklusive",
    },
  },
  {
    key: "onboarding",
    label: "Personalisiertes Onboarding & Inventar-Upload",
    tooltip:
      "Wir richten deine Garage gemeinsam mit dir ein: du schickst uns deine Liste oder deinen bestehenden Börsen-Export, wir stellen deinen Bestand ein.",
    values: {
      starter: false,
      growth: false,
      pro: `bis ${GARAGE_PLANS.pro.onboardingVehicles} Fahrzeuge`,
    },
  },
  {
    key: "support",
    label: "Support",
    values: {
      starter: GARAGE_PLANS.starter.supportLevel,
      growth: GARAGE_PLANS.growth.supportLevel,
      pro: GARAGE_PLANS.pro.supportLevel,
    },
  },
];
