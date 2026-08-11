/**
 * Content for the Padkos "Padstal Heritage" landing page.
 *
 * Every string, price and photo caption here is lifted verbatim from the
 * design file (`Padkos 3 - Padstal Heritage Desktop.dc.html`); the SKUs and
 * prices match the shop-wide `padkos-data.js` that ships alongside it, so the
 * landing page and the (not yet built) shop screens agree on the catalogue.
 *
 * Only the six products the landing page actually renders live here. The full
 * fifteen-product catalogue is in the design bundle and belongs in a shared
 * module once the Shop/Produkt screens exist.
 */

/**
 * Cross-screen links. The landing page is the only Padkos screen implemented
 * so far, so everything except the in-page anchors points at a route that does
 * not exist yet — collected here so wiring up the rest of the shop is a single
 * edit rather than a hunt through the markup.
 */
export const PADKOS_ROUTES = {
  shop: "/padkos/shop",
  versand: "/padkos/versand",
  kontakt: "/padkos/kontakt",
  english: "/padkos/en",
  heimwehProdukt: "/padkos/produkt/heimweh",
  impressum: "/padkos/rechtliches#impressum",
  agb: "/padkos/rechtliches#agb",
  datenschutz: "/padkos/rechtliches#datenschutz",
} as const;

export interface PadkosProduct {
  sku: string;
  name: string;
  /** Weight / variant line under the title. */
  sub: string;
  price: string;
  /** Caption shown inside the photo placeholder. */
  photoCaption: string;
  /** Describes the photograph that will replace the placeholder. */
  photoAlt: string;
  /** Each card's placeholder is tinted slightly differently, as in the design. */
  photoFrom: string;
  photoTo: string;
}

export const BESTSELLERS: PadkosProduct[] = [
  {
    sku: "mrsballs",
    name: "Mrs Ball's Chutney",
    sub: "Original · 470 g Glas",
    price: "€ 7,50",
    photoCaption: "FOTO · MRS BALL'S",
    photoAlt: "Mrs Ball's Chutney Original im Glas mit Vintage-Etikett",
    photoFrom: "#EDDFBC",
    photoTo: "#E6D3A8",
  },
  {
    sku: "ouma",
    name: "Ouma Rusks",
    sub: "Buttermilk · 500 g",
    price: "€ 6,90",
    photoCaption: "FOTO · OUMA RUSKS",
    photoAlt: "Ouma Rusks Buttermilk Packung, ein Rusk in Kaffee getunkt",
    photoFrom: "#EBDDBE",
    photoTo: "#E3D0A4",
  },
  {
    sku: "biltong",
    name: "Biltong Original",
    sub: "100 g · luftgetrocknet",
    price: "€ 8,90",
    photoCaption: "FOTO · BILTONG",
    photoAlt: "Biltong Original, dünn geschnitten auf Kraftpapier",
    photoFrom: "#E8D8B4",
    photoTo: "#E0CBA0",
  },
  {
    sku: "chappies",
    name: "Chappies",
    sub: "Kaugummi · 100 Stück",
    price: "€ 5,90",
    photoCaption: "FOTO · CHAPPIES-GLAS",
    photoAlt: "Chappies Kaugummi, bunte Einzelstücke im Glas",
    photoFrom: "#EDE0C2",
    photoTo: "#E5D2A9",
  },
  {
    sku: "fizzers",
    name: "Fizzers",
    sub: "Toffee · 4er-Pack",
    price: "€ 2,90",
    photoCaption: "FOTO · FIZZERS",
    photoAlt: "Fizzers Toffees in Original-Verpackung",
    photoFrom: "#ECDEC0",
    photoTo: "#E4D1A6",
  },
  {
    sku: "cremesoda",
    name: "Creme Soda",
    sub: "Sparletta · 300 ml",
    price: "€ 2,50",
    photoCaption: "FOTO · CREME SODA",
    photoAlt: "Sparletta Creme Soda Dose, grün, mit Retro-Schriftzug",
    photoFrom: "#E3DDB6",
    photoTo: "#DACE9E",
  },
];

export interface PadkosCategory {
  name: string;
  sub: string;
  /** Each shelf tile has its own paper tone. */
  background: string;
}

export const CATEGORIES: PadkosCategory[] = [
  { name: "Biltong & Wors", sub: "Luftgetrocknet & gekühlt", background: "#EBDCB8" },
  { name: "Süsses & Snacks", sub: "Chappies, Fizzers, NikNaks", background: "#F0E2BE" },
  { name: "Speisekammer", sub: "Mrs Ball's, All Gold, Gewürze", background: "#EDDFC0" },
  { name: "Getränke", sub: "Rooibos, Creme Soda, Amarula", background: "#E7DBB9" },
  { name: "Braai", sub: "Gewürze, Saucen & alles fürs Feuer", background: "#EBD9AF" },
];

export interface PadkosTestimonial {
  quote: string;
  author: string;
}

export const TESTIMONIALS: PadkosTestimonial[] = [
  {
    quote:
      "Schmeckt wie zuhause! Beim Auspacken hab ich sofort an die Ferien bei Ouma gedacht.",
    author: "Anje · Linz",
  },
  {
    quote:
      "Das Heimweh-Paket hat meine Frau zum Weinen gebracht – im allerbesten Sinn.",
    author: "Johan · Wien",
  },
  {
    quote: "Chappies für die Kinder, Biltong für mich, Mrs Ball's für alle. Lekker!",
    author: "Sarah · Graz",
  },
];

export interface PadkosFaq {
  question: string;
  answer: string;
}

export const FAQS: PadkosFaq[] = [
  {
    question: "Was ist Biltong?",
    answer:
      "Biltong ist luftgetrocknetes, gewürztes Rindfleisch – Südafrikas bekanntester Snack. Anders als Beef Jerky wird er nicht erhitzt, sondern in Essig und Koriander mariniert und langsam getrocknet: zart, würzig, proteinreich.",
  },
  {
    question: "Liefert ihr nach ganz Österreich?",
    answer:
      "Ja. Wir versenden mit der Österreichischen Post in alle Bundesländer, in 1–3 Werktagen. Ab € 59 kostenlos, in Wien auch Selbstabholung.",
  },
  {
    question: "Wie wird Boerewors versendet?",
    answer:
      "Nur gekühlt: vakuumverpackt, mit Kühlakkus in isolierter Box, Versand Montag bis Mittwoch – so ist die Wurst nie übers Wochenende unterwegs.",
  },
  {
    question: "Woher kommen die Produkte?",
    answer:
      "Mrs Ball's, Ouma Rusks, Chappies & Co. importieren wir direkt von südafrikanischen Herstellern. Biltong und Boerewors werden nach Kap-Rezepten in der EU aus europäischem Rindfleisch gefertigt.",
  },
];

export const PAYMENT_METHODS = [
  "EPS",
  "Klarna",
  "PayPal",
  "Visa",
  "Mastercard",
  "Apple Pay",
];
