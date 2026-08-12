/**
 * The Padkos product catalogue.
 *
 * Ported from the design bundle's `padkos-data.js` — the single shared data
 * file every design screen reads. SKUs, names, prices, categories and
 * descriptions are verbatim from there; the photo placeholder tints and alt
 * texts extend the six the landing design specifies to the full range, staying
 * inside the same kraft-paper family.
 *
 * This module is the client-side fallback catalogue. When Supabase is plugged
 * in, `backend.ts` serves the same shape from the `padkos_products` table
 * (see `supabase/padkos/schema.sql`, which seeds exactly this data).
 */

export type PadkosCategoryKey =
  | "biltong"
  | "suesses"
  | "speisekammer"
  | "getraenke"
  | "braai"
  | "geschenke";

export interface PadkosProduct {
  sku: string;
  name: string;
  /** Weight / variant line under the title, e.g. "Original · 470 g Glas". */
  sub: string;
  /** Price in EUR. */
  price: number;
  /** Struck-through compare-at price, only on the Heimweh-Paket. */
  was?: number;
  cat: string;
  catKey: PadkosCategoryKey;
  badge?: string;
  /** Requires chilled shipping (Mon–Wed only). */
  cooled?: boolean;
  desc: string;
  /** Contents list, only on the Heimweh-Paket. */
  inhalt?: string[];
  /**
   * Unit price ("Grundpreis") per Preisauszeichnungsgesetz — mandatory for
   * food retail in Austria. Pre-computed strings; per 100 g up to 250 g,
   * per kg/l above, per Stück for count-based packs. The bundle has none.
   */
  grundpreis?: string;
  /** 17 % vol. — sale to adults (18+) only. */
  ageRestricted?: boolean;
  /** Kraft-paper placeholder gradient, until photography is shot. */
  photoFrom: string;
  photoTo: string;
  photoCaption: string;
  photoAlt: string;
}

export const PRODUCTS: PadkosProduct[] = [
  {
    sku: "heimweh",
    name: "Das Heimweh-Paket",
    sub: "Geschenk-Kiste · 6 Klassiker",
    price: 49.9,
    was: 56.4,
    cat: "Geschenke",
    catKey: "geschenke",
    badge: "Geschenk-Kiste",
    desc: "Unsere Kiste gegen Heimweh: sechs südafrikanische Klassiker, verpackt wie ein Packerl von Ouma – mit Stroh, Kraftpapier und handgeschriebener Karte.",
    inhalt: [
      "Biltong Original 100 g",
      "Mrs Ball’s Chutney Original 470 g",
      "Ouma Rusks Buttermilk 500 g",
      "Chappies Kaugummi (20 Stück)",
      "Fizzers Toffee 4er-Pack",
      "Sparletta Creme Soda 300 ml",
    ],
    photoFrom: "#EDDCB4",
    photoTo: "#E2CD9E",
    photoCaption: "FOTO · OFFENE GESCHENK-KISTE",
    photoAlt:
      "Heimweh-Paket: Kraftkarton mit Stroh, gefüllt mit südafrikanischen Klassikern",
  },
  {
    sku: "biltong",
    grundpreis: "€ 8,90 / 100 g",
    name: "Biltong Original",
    sub: "100 g · luftgetrocknet",
    price: 8.9,
    cat: "Biltong & Wors",
    catKey: "biltong",
    badge: "Bestseller",
    desc: "Nach Kap-Rezept in Essig und Koriander mariniert und langsam luftgetrocknet. Zart, würzig, proteinreich – dünn geschnitten.",
    photoFrom: "#E8D8B4",
    photoTo: "#E0CBA0",
    photoCaption: "FOTO · BILTONG",
    photoAlt: "Biltong Original, dünn geschnitten auf Kraftpapier",
  },
  {
    sku: "biltong-chili",
    grundpreis: "€ 9,20 / 100 g",
    name: "Biltong Chili",
    sub: "100 g · peri-peri",
    price: 9.2,
    cat: "Biltong & Wors",
    catKey: "biltong",
    desc: "Wie das Original, nur mit ordentlich Peri-Peri. Für alle, die es im Bakkie gern heiß haben.",
    photoFrom: "#E9D5AC",
    photoTo: "#E0C797",
    photoCaption: "FOTO · BILTONG CHILI",
    photoAlt: "Biltong Chili mit Peri-Peri-Gewürz auf Kraftpapier",
  },
  {
    sku: "droewors",
    grundpreis: "€ 6,60 / 100 g",
    name: "Droëwors",
    sub: "150 g · Trockenwurst",
    price: 9.9,
    cat: "Biltong & Wors",
    catKey: "biltong",
    desc: "Die dünne, luftgetrocknete Schwester der Boerewors – der klassische Padkos-Snack für unterwegs.",
    photoFrom: "#E6D3AE",
    photoTo: "#DDC69A",
    photoCaption: "FOTO · DROËWORS",
    photoAlt: "Droëwors Trockenwurst, gebündelt auf Kraftpapier",
  },
  {
    sku: "boerewors",
    grundpreis: "€ 25,80 / kg",
    name: "Boerewors",
    sub: "500 g · gekühlt",
    price: 12.9,
    cat: "Biltong & Wors",
    catKey: "biltong",
    badge: "Gekühlt",
    cooled: true,
    desc: "Traditionelle Bratwurst-Spirale mit Koriander, nach Familienrezept in der EU gefertigt. Versand nur Montag bis Mittwoch, gekühlt.",
    photoFrom: "#E7D6B2",
    photoTo: "#DEC99E",
    photoCaption: "FOTO · BOEREWORS",
    photoAlt: "Boerewors Bratwurst-Spirale, vakuumverpackt",
  },
  {
    sku: "mrsballs",
    grundpreis: "€ 15,96 / kg",
    name: "Mrs Ball's Chutney",
    sub: "Original · 470 g Glas",
    price: 7.5,
    cat: "Speisekammer",
    catKey: "speisekammer",
    badge: "Bestseller",
    desc: "Das berühmteste Chutney Südafrikas, seit 1918. Fruchtig-würzig – gehört auf jedes Braaibrötchen und in jede Bobotie.",
    photoFrom: "#EDDFBC",
    photoTo: "#E6D3A8",
    photoCaption: "FOTO · MRS BALL'S",
    photoAlt: "Mrs Ball's Chutney Original im Glas mit Vintage-Etikett",
  },
  {
    sku: "allgold",
    grundpreis: "€ 8,43 / l",
    name: "All Gold Tomatensauce",
    sub: "700 ml Flasche",
    price: 5.9,
    cat: "Speisekammer",
    catKey: "speisekammer",
    desc: "Südafrikas Ketchup-Ikone: dickflüssig, tomatiger als alles, was du kennst. Slap chips brauchen nichts anderes.",
    photoFrom: "#EEDDB6",
    photoTo: "#E5CFA0",
    photoCaption: "FOTO · ALL GOLD",
    photoAlt: "All Gold Tomatensauce Flasche mit rotem Etikett",
  },
  {
    sku: "ouma",
    grundpreis: "€ 13,80 / kg",
    name: "Ouma Rusks",
    sub: "Buttermilk · 500 g",
    price: 6.9,
    cat: "Speisekammer",
    catKey: "speisekammer",
    desc: "Zwieback nach Ouma-Art zum Eintunken in Kaffee oder Rooibos. Seit 1939 der Start in jeden südafrikanischen Morgen.",
    photoFrom: "#EBDDBE",
    photoTo: "#E3D0A4",
    photoCaption: "FOTO · OUMA RUSKS",
    photoAlt: "Ouma Rusks Buttermilk Packung, ein Rusk in Kaffee getunkt",
  },
  {
    sku: "chappies",
    grundpreis: "€ 0,06 / Stück",
    name: "Chappies",
    sub: "Kaugummi · 100 Stück",
    price: 5.9,
    cat: "Süsses & Snacks",
    catKey: "suesses",
    badge: "Klassiker",
    desc: "Der Kult-Kaugummi mit „Did you know?“-Fakten auf jedem Wickel. Eine Kindheit in 100 Stück.",
    photoFrom: "#EDE0C2",
    photoTo: "#E5D2A9",
    photoCaption: "FOTO · CHAPPIES-GLAS",
    photoAlt: "Chappies Kaugummi, bunte Einzelstücke im Glas",
  },
  {
    sku: "fizzers",
    grundpreis: "€ 0,73 / Stück",
    name: "Fizzers",
    sub: "Toffee · 4er-Pack",
    price: 2.9,
    cat: "Süsses & Snacks",
    catKey: "suesses",
    desc: "Zäh-cremiges Brausetoffee – der Pausenhof-Klassiker vom Kap.",
    photoFrom: "#ECDEC0",
    photoTo: "#E4D1A6",
    photoCaption: "FOTO · FIZZERS",
    photoAlt: "Fizzers Toffees in Original-Verpackung",
  },
  {
    sku: "niknaks",
    grundpreis: "€ 2,59 / 100 g",
    name: "NikNaks Cheese",
    sub: "135 g Beutel",
    price: 3.5,
    cat: "Süsses & Snacks",
    catKey: "suesses",
    desc: "Knusprige Mais-Snacks mit ordentlich Käsestaub an den Fingern. Genau wie früher.",
    photoFrom: "#F0E1BC",
    photoTo: "#E7D2A2",
    photoCaption: "FOTO · NIKNAKS",
    photoAlt: "NikNaks Cheese Beutel, knusprige Mais-Snacks",
  },
  {
    sku: "cremesoda",
    grundpreis: "€ 8,33 / l",
    name: "Creme Soda",
    sub: "Sparletta · 300 ml",
    price: 2.5,
    cat: "Getränke",
    catKey: "getraenke",
    desc: "Das grüne Kultgetränk – süß, cremig, eiskalt am besten. The green ambulance.",
    photoFrom: "#E3DDB6",
    photoTo: "#DACE9E",
    photoCaption: "FOTO · CREME SODA",
    photoAlt: "Sparletta Creme Soda Dose, grün, mit Retro-Schriftzug",
  },
  {
    sku: "rooibos",
    grundpreis: "€ 0,10 / Beutel",
    name: "Rooibos Tee",
    sub: "Freshpak · 80 Beutel",
    price: 7.9,
    cat: "Getränke",
    catKey: "getraenke",
    desc: "Koffeinfreier Buschtee aus den Zederbergen. Mit Milch und Honig wie bei Ouma.",
    photoFrom: "#EADAB2",
    photoTo: "#E1CC9C",
    photoCaption: "FOTO · ROOIBOS",
    photoAlt: "Freshpak Rooibos Tee Packung mit 80 Beuteln",
  },
  {
    sku: "amarula",
    ageRestricted: true,
    grundpreis: "€ 28,43 / l",
    name: "Amarula Cream",
    sub: "700 ml · 17 % vol.",
    price: 19.9,
    cat: "Getränke",
    catKey: "getraenke",
    desc: "Cremelikör aus der Marula-Frucht. Auf Eis nach dem Braai – oder im Don Pedro.",
    photoFrom: "#E8D4A8",
    photoTo: "#DFC694",
    photoCaption: "FOTO · AMARULA",
    photoAlt: "Amarula Cream Likörflasche mit Elefanten-Etikett",
  },
  {
    sku: "braaispice",
    grundpreis: "€ 3,25 / 100 g",
    name: "Braai-Gewürz",
    sub: "Safari Rub · 200 g",
    price: 6.5,
    cat: "Braai",
    catKey: "braai",
    desc: "Die Allzweck-Würzmischung für Fleisch, Mielies und alles, was übers Feuer geht.",
    photoFrom: "#EBD9AF",
    photoTo: "#E2CB9A",
    photoCaption: "FOTO · BRAAI-GEWÜRZ",
    photoAlt: "Braai-Gewürz Safari Rub Streuer",
  },
];

export interface PadkosCategory {
  key: PadkosCategoryKey;
  name: string;
  /** Subtitle on the landing "Die Regale" tiles. */
  sub: string;
  /** Paper tone of the landing tile. */
  background: string;
}

/**
 * The five shelves shown on the landing page. "Geschenke" (the Heimweh-Paket)
 * exists as a filter chip in the shop but has no landing tile — as designed.
 */
export const CATEGORIES: PadkosCategory[] = [
  { key: "biltong", name: "Biltong & Wors", sub: "Luftgetrocknet & gekühlt", background: "#EBDCB8" },
  { key: "suesses", name: "Süsses & Snacks", sub: "Chappies, Fizzers, NikNaks", background: "#F0E2BE" },
  { key: "speisekammer", name: "Speisekammer", sub: "Mrs Ball's, All Gold, Gewürze", background: "#EDDFC0" },
  { key: "getraenke", name: "Getränke", sub: "Rooibos, Creme Soda, Amarula", background: "#E7DBB9" },
  { key: "braai", name: "Braai", sub: "Gewürze, Saucen & alles fürs Feuer", background: "#EBD9AF" },
];

/** Filter chips in the shop: Alle + the five shelves + Geschenke. */
export const SHOP_FILTERS: Array<{ key: PadkosCategoryKey | "alle"; label: string }> = [
  { key: "alle", label: "Alle" },
  { key: "biltong", label: "Biltong & Wors" },
  { key: "suesses", label: "Süsses & Snacks" },
  { key: "speisekammer", label: "Speisekammer" },
  { key: "getraenke", label: "Getränke" },
  { key: "braai", label: "Braai" },
  { key: "geschenke", label: "Geschenke" },
];

/** The six products the landing page shows as bestsellers, in design order. */
export const BESTSELLER_SKUS = [
  "mrsballs",
  "ouma",
  "biltong",
  "chappies",
  "fizzers",
  "cremesoda",
] as const;

/** Free shipping from this subtotal (EUR). */
export const SHIP_FREE = 59;
/** Standard Post shipping (EUR). */
export const SHIP_COST = 4.9;
/**
 * Surcharge for chilled shipping (EUR), from the published price table on the
 * Versand page. The design's checkout never charged it — an inconsistency the
 * implementation resolves in favour of the published prices: it applies
 * whenever a cooled product ships by post (pickup avoids it), independent of
 * the free-shipping threshold, which waives only the base rate.
 */
export const COOLED_SURCHARGE = 3.9;

/** "€ 7,50" — Austrian format, as used across every design screen. */
export function fmtEUR(n: number): string {
  return "€ " + n.toFixed(2).replace(".", ",");
}

export function findProduct(sku: string | undefined | null): PadkosProduct | undefined {
  return PRODUCTS.find((p) => p.sku === sku);
}

export function findCategory(key: string | undefined | null): PadkosCategory | undefined {
  return CATEGORIES.find((c) => c.key === key);
}
