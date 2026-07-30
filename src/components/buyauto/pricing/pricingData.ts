export interface GarageIncludedFeature {
  key: string;
  label: string;
  tooltip?: string;
}

export const garageIncludedFeatures: GarageIncludedFeature[] = [
  {
    key: "public_profile",
    label: "Garage-Profilseite + Inventar-Seite",
    tooltip:
      "Du hast eine öffentliche Garage-Seite, die du wie eine Website anpassen und per iFrame auf deiner eigenen Website einbinden kannst.",
  },
  { key: "manage_listings", label: "Inserate erstellen & verwalten" },
  {
    key: "vin_prefill",
    label: "VIN-PreFill (wo verfügbar)",
    tooltip:
      "Fahrzeugdaten werden automatisch basierend auf der Fahrgestellnummer ausgefüllt.",
  },
  {
    key: "leasing_calculator",
    label: "Leasing-Rechner direkt im Inserat",
    tooltip:
      "Potenzielle Kunden können Leasingraten direkt berechnen und Anfragen stellen, was automatisch ein Angebot erstellt und eine Leasing-Anfrage bei dir eröffnet.",
  },
  {
    key: "deal_chat",
    label: "Deal-Chat pro Fahrzeug (Chat + Dokumente)",
    tooltip:
      "Du kannst mit Leads chatten, Dokumente hochladen und direkt pro Fahrzeug anfordern.",
  },
  {
    key: "eintauschwert_rechner",
    label: "Eintauschwert-Rechner: unbegrenzte Suchen*",
    tooltip:
      "Ankaufspreis aus echten Vergleichsinseraten berechnen – direkt im Dashboard und einbettbar auf deiner Website. Unbegrenzte Suchen (faire Nutzung: 100 automatische pro Monat), manuelle Berechnungen immer gratis.",
  },
  { key: "basic_stats", label: "Basis-Statistiken: Views & Anfragen" },
];

export type GaragePackageCode = "starter" | "growth" | "pro";

export const garagePackages: Array<{
  code: GaragePackageCode;
  name: string;
  price: string;
  period: string;
  limit: string;
  premiumIncluded: string;
  features: string[];
  cta: string;
  popular?: boolean;
}> = [
  {
    code: "starter",
    name: "Starter",
    price: "CHF 149",
    period: "/ Monat",
    limit: "bis 15 Inserate",
    premiumIncluded: "1 Premium / Monat",
    features: ["Ideal für kleine Garagen", "Sofort startklar"],
    cta: "Starter wählen",
  },
  {
    code: "growth",
    name: "Growth",
    price: "CHF 349",
    period: "/ Monat",
    limit: "bis 50 Inserate",
    premiumIncluded: "5 Premium / Monat",
    features: ["Für wachsende Bestände", "Kompletter Bestand hochladen"],
    cta: "Growth wählen",
    popular: true,
  },
  {
    code: "pro",
    name: "Pro",
    price: "CHF 599",
    period: "/ Monat",
    limit: "bis 100 Inserate",
    premiumIncluded: "10 Premium / Monat",
    features: ["Für grosse Bestände", "Kompletter Bestand hochladen", "Priorisierter Support"],
    cta: "Pro wählen",
  },
];

export const privatePlanMarketingFeatures: Record<
  "standard" | "extended" | "unlimited",
  string[]
> = {
  standard: ["60 Tage Laufzeit", "Standard-Platzierung"],
  extended: ["90 Tage Laufzeit", "Gratis Premium Boost", "Verlängerung: CHF 15 statt CHF 30"],
  unlimited: [
    "Online bis verkauft – einmal zahlen",
    "Premium-Platzierung dauerhaft inklusive",
    "Keine Ablauf- und Verlängerungsgebühren",
    "Jederzeit pausierbar",
    "Prioritäts-Support",
  ],
};