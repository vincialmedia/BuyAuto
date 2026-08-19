/**
 * Copy for the Padkos landing page in both languages.
 *
 * German strings are verbatim from `Padkos 3 - Padstal Heritage Desktop.dc.html`
 * / the mobile `…v2` design; English strings from `Padkos EN - Landing.dc.html`.
 * Layout lives in PadkosLanding.tsx — this file is only words.
 */

export type PadkosLang = "de" | "en";

export interface LandingTestimonial {
  quote: string;
  author: string;
}

export interface LandingFaq {
  question: string;
  answer: string;
}

export interface LandingCopy {
  eyebrow: string;
  /** Hero title, around the accented word. */
  titleBefore: string;
  titleAccent: string;
  titleAfter: string;
  lead: string;
  ctaShop: string;
  ctaHeimweh: string;
  heroPhotoCaption: string;
  heroPhotoAlt: string;
  sticker: string;
  stamp: string;
  bestsellerTitle: string;
  bestsellerSub: string;
  productStamp: string;
  addToCart: string;
  justAdded: string;
  categoriesTitle: string;
  /** Category tile name + subtitle by catKey. */
  categoryNames: Record<string, { name: string; sub: string }>;
  storyTitle: string;
  storyP1: string;
  storyP2: string;
  storySignature: string;
  storyStamp: string;
  storyPhotoCaption: string;
  storyPhotoAlt: string;
  guestbookTitle: string;
  starsLabel: string;
  testimonials: LandingTestimonial[];
  heimwehBadge: string;
  heimwehTitle: string;
  heimwehText: string;
  heimwehCta: string;
  heimwehInsideLink?: string;
  heimwehPhotoCaption: string;
  heimwehPhotoAlt: string;
  faqTitle: string;
  faqs: LandingFaq[];
  newsletterTitle: string;
  newsletterText: string;
  newsletterPlaceholder: string;
  newsletterCta: string;
  newsletterSuccessBefore: string;
  newsletterSuccessCode: string;
  newsletterSuccessAfter: string;
  newsletterFine: string;
  newsletterEmailLabel: string;
  stickyFreeFrom: string;
  stickyFreeLabel: string;
  stickyCta: string;
  /** EN sub-lines per bestseller sku (DE uses the catalogue's own). */
  productSubs?: Record<string, string>;
  /** "€ 7,50" vs "€ 7.50". */
  formatPrice: (n: number) => string;
}

export const LANDING_COPY: Record<PadkosLang, LandingCopy> = {
  de: {
    eyebrow: "EST. 2026 · KAAPSTAD — WIEN",
    titleBefore: "Ein Stück ",
    titleAccent: "Südafrika",
    titleAfter: ", mitten in Österreich.",
    lead: "Wie ein Padstal an der R62 – nur mit Lieferung bis vor deine Tür. Snacks, Speisekammer-Klassiker und Heimweh-Pakete, direkt importiert.",
    ctaShop: "In den Laden",
    ctaHeimweh: "Heimweh-Paket",
    heroPhotoCaption: "FOTO · PADSTAL-REGAL MIT KLASSIKERN",
    heroPhotoAlt:
      "Padstal-Regal mit Chappies, Fizzers, Mrs Ball's Chutney und Creme Soda Dosen",
    sticker: "lekker!",
    stamp: "PROUDLY SOUTH AFRICAN ★",
    bestsellerTitle: "Bestseller",
    bestsellerSub: "The taste of home – direkt importiert.",
    productStamp: "PADKOS · KAAPSTAD",
    addToCart: "In den Warenkorb",
    justAdded: "✓ Dazugelegt",
    categoriesTitle: "Die Regale",
    categoryNames: {
      biltong: { name: "Biltong & Wors", sub: "Luftgetrocknet & gekühlt" },
      suesses: { name: "Süsses & Snacks", sub: "Chappies, Fizzers, NikNaks" },
      speisekammer: { name: "Speisekammer", sub: "Mrs Ball's, All Gold, Gewürze" },
      getraenke: { name: "Getränke", sub: "Rooibos, Creme Soda, Amarula" },
      braai: { name: "Braai", sub: "Gewürze, Saucen & alles fürs Feuer" },
    },
    storyTitle: "Vom Padstal nach Wien.",
    storyP1:
      "Ein Padstal ist der kleine Hofladen am Straßenrand: selbstgemachtes Chutney, Biltong im Glas, Rusks für die Fahrt. Padkos – wörtlich „Proviant“ – ist genau das, nur für Österreich.",
    storyP2:
      "Ich bin in Kapstadt aufgewachsen und lebe seit sechs Jahren in Wien. Alles hier kommt direkt von südafrikanischen Herstellern – ohne Zwischenhändler, dafür mit gekühltem Versand für Boerewors.",
    storySignature: "— Retha, Gründerin · danke fürs Vorbeischauen!",
    storyStamp: "DIREKT IMPORTIERT",
    storyPhotoCaption: "FOTO · RETHA IM LADEN",
    storyPhotoAlt: "Retha im Laden, hinter der Theke mit Biltong und Chutney-Regal",
    guestbookTitle: "Gästebuch",
    starsLabel: "5 von 5 Sternen",
    testimonials: [
      {
        quote:
          "Schmeckt wie zuhause! Beim Auspacken hab ich sofort an die Ferien bei Ouma gedacht.",
        author: "Anje · Linz",
      },
      {
        quote: "Das Heimweh-Paket hat meine Frau zum Weinen gebracht – im allerbesten Sinn.",
        author: "Johan · Wien",
      },
      {
        quote: "Chappies für die Kinder, Biltong für mich, Mrs Ball's für alle. Lekker!",
        author: "Sarah · Graz",
      },
    ],
    heimwehBadge: "GESCHENK-KISTE",
    heimwehTitle: "Das Heimweh-Paket",
    heimwehText:
      "Biltong, NikNaks, Chappies, Fizzers, Mrs Ball's und eine Creme Soda – verpackt wie ein Packerl von Ouma. Zum Verschenken oder Selberbehalten.",
    heimwehCta: "Kiste in den Warenkorb",
    heimwehPhotoCaption: "FOTO · OFFENE GESCHENK-KISTE",
    heimwehPhotoAlt:
      "Heimweh-Paket: Kraftkarton mit Stroh, gefüllt mit südafrikanischen Klassikern",
    faqTitle: "Gut zu wissen",
    faqs: [
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
    ],
    newsletterTitle: "10 % Willkommensrabatt",
    newsletterText: "Neuigkeiten aus dem Padstal, neue Produkte, Rezepte. Gute Post, versprochen.",
    newsletterPlaceholder: "deine@email.at",
    newsletterCta: "Rabatt sichern",
    newsletterSuccessBefore: "Danke! Dein Code: ",
    newsletterSuccessCode: "WELKOM10",
    newsletterSuccessAfter: " – gleich beim ersten Einkauf einlösen.",
    newsletterFine: "Kein Spam. Abmeldung jederzeit.",
    newsletterEmailLabel: "E-Mail-Adresse",
    stickyFreeFrom: "Ab € 59",
    stickyFreeLabel: "versandkostenfrei",
    stickyCta: "Jetzt einkaufen",
    formatPrice: (n) => "€ " + n.toFixed(2).replace(".", ","),
  },
  en: {
    eyebrow: "EST. 2026 · KAAPSTAD — VIENNA",
    titleBefore: "A piece of ",
    titleAccent: "South Africa",
    titleAfter: ", right here in Austria.",
    lead: "Like a padstal on the R62 – delivered to your door. Snacks, pantry classics and homesick-cure gift boxes, imported straight from home.",
    ctaShop: "Browse the shop",
    ctaHeimweh: "The Heimweh Box",
    heroPhotoCaption: "PHOTO · PADSTAL SHELF WITH THE CLASSICS",
    heroPhotoAlt:
      "Padstal shelf with Chappies, Fizzers, Mrs Ball's chutney and Creme Soda cans",
    sticker: "lekker!",
    stamp: "PROUDLY SOUTH AFRICAN ★",
    bestsellerTitle: "Bestsellers",
    bestsellerSub: "The taste of home.",
    productStamp: "PADKOS · KAAPSTAD",
    addToCart: "Add to cart",
    justAdded: "✓ Added",
    categoriesTitle: "The Shelves",
    categoryNames: {
      biltong: { name: "Biltong & Wors", sub: "Air-dried & chilled" },
      suesses: { name: "Sweets & Snacks", sub: "Chappies, Fizzers, NikNaks" },
      speisekammer: { name: "Pantry", sub: "Mrs Ball's, All Gold, spices" },
      getraenke: { name: "Drinks", sub: "Rooibos, Creme Soda, Amarula" },
      braai: { name: "Braai", sub: "Spices, sauces & everything for the fire" },
    },
    storyTitle: "From the padstal to Vienna.",
    storyP1:
      "A padstal is the little farm stall at the side of the road: homemade chutney, biltong in a jar, rusks for the drive. Padkos – literally “food for the road” – is exactly that, just for Austria.",
    storyP2:
      "I grew up in Cape Town and have lived in Vienna for six years. Everything here comes straight from South African producers – no middlemen, but with chilled shipping for the boerewors.",
    storySignature: "— Retha, founder · thanks for stopping by!",
    storyStamp: "IMPORTED DIRECTLY",
    storyPhotoCaption: "PHOTO · RETHA IN THE SHOP",
    storyPhotoAlt: "Retha in the shop, behind the counter with biltong and chutney shelves",
    guestbookTitle: "Guestbook",
    starsLabel: "5 out of 5 stars",
    testimonials: [
      {
        quote: "Tastes like home! Unpacking it took me straight back to holidays at Ouma's.",
        author: "Anje · Linz",
      },
      {
        quote: "The Heimweh Box made my wife cry – in the best possible way.",
        author: "Johan · Vienna",
      },
      {
        quote: "Chappies for the kids, biltong for me, Mrs Ball's for everyone. Lekker!",
        author: "Sarah · Graz",
      },
    ],
    heimwehBadge: "GIFT BOX",
    heimwehTitle: "The Heimweh Box",
    heimwehText:
      "Biltong, NikNaks, Chappies, Fizzers, Mrs Ball's and a Creme Soda – packed like a parcel from Ouma. “Heimweh” is German for homesickness; this is the cure. For gifting or keeping.",
    heimwehCta: "Add the box to cart",
    heimwehInsideLink: "See what's inside →",
    heimwehPhotoCaption: "PHOTO · OPEN GIFT BOX",
    heimwehPhotoAlt: "Heimweh Box: kraft carton with straw, filled with South African classics",
    faqTitle: "Good to know",
    faqs: [
      {
        question: "What is biltong?",
        answer:
          "Biltong is air-dried, spiced beef – South Africa's most famous snack. Unlike beef jerky it's never heated: it's marinated in vinegar and coriander, then slowly dried. Tender, savoury, high in protein.",
      },
      {
        question: "Do you deliver across Austria?",
        answer:
          "Yes. We ship with Austrian Post to every province in 1–3 working days. Free from € 59 – and in Vienna you can collect your order in person.",
      },
      {
        question: "How is boerewors shipped?",
        answer:
          "Chilled only: vacuum-sealed, with ice packs in an insulated box, shipped Monday to Wednesday – so your wors never spends a weekend in a depot.",
      },
      {
        question: "Where do the products come from?",
        answer:
          "Mrs Ball's, Ouma Rusks, Chappies & co. are imported directly from South African producers. Biltong and boerewors are made to Cape recipes in the EU from European beef.",
      },
    ],
    newsletterTitle: "10 % welcome discount",
    newsletterText: "News from the padstal, new arrivals, recipes. Good post, promise.",
    newsletterPlaceholder: "your@email.at",
    newsletterCta: "Get my discount",
    newsletterSuccessBefore: "Thank you! Your code: ",
    newsletterSuccessCode: "WELKOM10",
    newsletterSuccessAfter: " – use it on your first order.",
    newsletterFine: "No spam. Unsubscribe anytime.",
    newsletterEmailLabel: "Email address",
    stickyFreeFrom: "From € 59",
    stickyFreeLabel: "free shipping",
    stickyCta: "Shop now",
    productSubs: {
      mrsballs: "Original · 470 g jar",
      ouma: "Buttermilk · 500 g",
      biltong: "100 g · air-dried",
      chappies: "Bubblegum · 100 pieces",
      fizzers: "Toffee · 4-pack",
      cremesoda: "Sparletta · 300 ml",
    },
    formatPrice: (n) => "€ " + n.toFixed(2),
  },
};
