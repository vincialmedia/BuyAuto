// Registry for the Leasinggesellschaft pages (cembra-leasing-uebernehmen etc.).
// One entry = one SEO page, rendered by LeasingCompanyPage — same idea as the
// brand registry in leasingBrands.ts, but with flat top-level slugs because
// these are content pages like every other Ratgeber (and a distinct segment
// under /leasinguebernahme/ would collide with the [marke] fallback).
//
// UWG guardrail: every published figure carries a visible source attribution
// and Stand. Fields without a verifiable source stay null — the template then
// renders honest generic copy. Do not fill these from memory; sources are
// linked per fact via sourceLinkText/sourceUrl (Quellenangaben are exempt from
// the no-external-contacts rule for body copy).
//
// Research base: Vince, Stand 13.08.2026. Kernbefund: nur Cembra publiziert
// einen Übernahme-Tarif; AMAG, Multilease und BANK-now regeln die Übertragung
// individuell auf Anfrage.
//
// Fee figures are built from the facts module (facts.ts), never typed here.

import { AMAG_LEASING, CEMBRA, type FactSource } from "@/lib/buyauto/facts";
import { formatChf, formatSwissInt } from "@/lib/buyauto/format";

/** formatChf plus ".–", e.g. 1234 -> "CHF 1'234.–" (Betragsschreibweise im Fliesstext). */
const chfDash = (value: number) => `${formatChf(value)}.–`;

export interface SourcedFact {
  /** Rendered German copy incl. the visible attribution («gemäss …, Stand …»). */
  text: string;
  /** Phrase inside `text` rendered as the source hyperlink (Quellenangabe). */
  sourceLinkText?: string;
  sourceUrl?: string;
}

export interface LeasingCompanyFacts {
  /** Umschreibe-/Halterwechselgebühr with source, or null (no published tariff). */
  transferFee: SourcedFact | null;
  /** Typical transfer duration. Stays null until a documented Erfahrungswert exists. */
  typicalDuration: SourcedFact | null;
  /** What the company checks/requires from the Übernehmer. */
  documents: SourcedFact | null;
  /** Company-specific transfer mechanics (channel, parties, Code 178). */
  transferProcess: SourcedFact | null;
}

export interface LeasingCompany {
  /** Flat page slug, e.g. "cembra-leasing-uebernehmen" → /cembra-leasing-uebernehmen */
  slug: string;
  /** Full display name for standalone mentions («Zustimmung von AMAG Leasing»). */
  name: string;
  /** Name used in hyphen compounds («AMAG-Leasingvertrag») — avoids
   *  «AMAG Leasing-Leasing» when the full name already contains «Leasing». */
  compoundName: string;
  /** Official company website entry point (may carry a language path like
   *  /de when the bare domain redirects to the wrong language). */
  officialSite: string;
  /** Official info/FAQ page for the after-CTA «Direkt bei der Gesellschaft
   *  nachfragen» link. Falls back to officialSite. Per the funnel rule this
   *  link renders only AFTER the BuyAuto CTAs. */
  infoUrl?: string;
  /** One-sentence company differentiator rendered inside the hero block —
   *  derived ONLY from the sourced facts below (keeps the four pages from
   *  sharing an identical answer-first paragraph). */
  heroNote: string;
  /** Company-specific middle segment of the meta description — keeps the four
   *  descriptions unique instead of name-swapped duplicates. */
  descriptionDetail: string;
  /** Sourced company status/size fact rendered under the hero intro. */
  introNote?: SourcedFact;
  /** What the company says about the brands it covers (AMAG only for now):
   *  a verbatim quote with its source, plus links to our brand pages. */
  brandStatement?: {
    /** Copy before the quote, e.g. «Im Geschäftsbericht 2025 schreibt AMAG Leasing:». */
    lead: string;
    quote: string;
    source: FactSource;
    /** Brand pages to link after the quote; only indexable ones render as links. */
    brandLinks: { name: string; href: string }[];
  };
  facts: LeasingCompanyFacts;
}

export const LEASING_COMPANIES: LeasingCompany[] = [
  {
    slug: "cembra-leasing-uebernehmen",
    name: "Cembra",
    compoundName: "Cembra",
    officialSite: "https://www.cembra.ch",
    infoUrl: "https://www.cembra.ch/de/kundencenter/leasing/privatpersonen/",
    heroNote:
      "Besonderheit bei Cembra: Die Gebühren für den Halterwechsel stehen in einer offiziellen Gebührenübersicht – die Zahlen findest du weiter unten.",
    descriptionDetail: "Ablauf, Bonitätsprüfung und der publizierte Halterwechsel-Tarif",
    facts: {
      transferFee: {
        text:
          `Cembra verrechnet für den Halterwechsel ${chfDash(CEMBRA.feesExclVatChf.halterwechsel)} plus ${chfDash(CEMBRA.feesExclVatChf.fahrzeugausweisUmschreibung)} für die Umschreibung des Fahrzeugausweises, jeweils exkl. MWST (gemäss Gebührenübersicht Leasing der Cembra, gültig ab ${CEMBRA.validFrom}). Dazu kommen die kantonalen Gebühren des Strassenverkehrsamts. Zum Vergleich: Allein die Kündigungsabrechnung bei einer vorzeitigen Auflösung kostet ${chfDash(CEMBRA.feesExclVatChf.kuendigungsabrechnung)} exkl. MWST (gleiche Quelle) – hinzu kommt die eigentliche Auflösungsentschädigung gemäss Vertrag.`,
        sourceLinkText: "Gebührenübersicht Leasing der Cembra",
        sourceUrl: CEMBRA.sourceUrl,
      },
      // ERFAHRUNGSWERT-VINCE: typische Dauer einer Cembra-Übertragung
      typicalDuration: null,
      documents: {
        // ERFAHRUNGSWERT-VINCE: exakte Dokumentenliste aus realen Cembra-Übernahmen
        text:
          "Cembra prüft die Bonität der übernehmenden Person wie bei jedem neuen Leasingvertrag – mit Selbstauskunft, Einkommensnachweis und Abfrage bei ZEK/IKO. Eine Vollkaskoversicherung ist bei Cembra-Leasingverträgen zwingend (gemäss Cembra-Kundencenter Leasing).",
        sourceLinkText: "Cembra-Kundencenter Leasing",
        sourceUrl: "https://www.cembra.ch/de/kundencenter/leasing/privatpersonen/",
      },
      transferProcess: {
        text:
          "Die Übernahme wird direkt bei Cembra beantragt; die Gesellschaft schreibt den Vertrag nach bestandener Bonitätsprüfung auf die neue Person um. Leasingfahrzeuge tragen im Fahrzeugausweis den Code 178 («Halterwechsel verboten») – die Umschreibung beim Strassenverkehrsamt läuft deshalb immer über die Freigabe der Leasinggesellschaft (gemäss Cembra-Leasingkonditionen).",
        sourceLinkText: "Cembra-Leasingkonditionen",
        sourceUrl: "https://www.cembra.ch/de/leasing/auto/konditionen/",
      },
    },
    // Interne Notiz (NICHT publizieren, Quelle 2016 veraltet): 20 Minuten
    // berichtete damals Pauschale CHF 540 und Mindest-Restlaufzeit 12 Monate —
    // telefonisch verifizieren.
  },
  {
    slug: "amag-leasing-uebernehmen",
    name: "AMAG Leasing",
    compoundName: "AMAG",
    officialSite: "https://www.amag-leasing.ch",
    infoUrl: "https://www.amag-leasing.ch/de/ablauf-leasing.html",
    heroNote:
      "Besonderheit bei AMAG Leasing: Beim indirekten Leasing ist deine Liefergarage eng eingebunden – kläre die Übernahme deshalb mit beiden.",
    descriptionDetail: "indirektes Leasing, Bonitätsprüfung und die Rolle der Liefergarage",
    introNote: {
      text:
        `AMAG Leasing zählt nach eigenen Angaben über ${formatSwissInt(AMAG_LEASING.customers.moreThan)} Privat- und Firmenkunden (Quelle: ${AMAG_LEASING.customers.source.title}, ${AMAG_LEASING.customers.source.stand}).`,
      sourceLinkText: AMAG_LEASING.customers.source.title,
      sourceUrl: AMAG_LEASING.customers.source.url,
    },
    brandStatement: {
      lead: "Im Geschäftsbericht 2025 beschreibt AMAG Leasing ihr Angebot so:",
      quote: AMAG_LEASING.brandStatement.quote,
      source: AMAG_LEASING.brandStatement.source,
      // Nur Marken mit existierender Brand-Page verlinken (volkswagen, audi, skoda).
      brandLinks: [
        { name: "VW", href: "/leasinguebernahme/volkswagen" },
        { name: "Audi", href: "/leasinguebernahme/audi" },
        { name: "Škoda", href: "/leasinguebernahme/skoda" },
      ],
    },
    facts: {
      transferFee: {
        text:
          `Die Allgemeinen Leasingbestimmungen von ${AMAG_LEASING.name} (${AMAG_LEASING.edition}) nennen keine Gebühr für eine Vertragsübernahme. Für die vorzeitige Vertragsauflösung nennen sie pauschal ${chfDash(AMAG_LEASING.feesExclVatChf.vorzeitigeVertragsaufloesung)} exkl. MWST und für die Berechnung der provisorischen Auflösungskosten ${chfDash(AMAG_LEASING.feesExclVatChf.provisorischeAufloesungskosten)} exkl. MWST (${AMAG_LEASING.clauses.aufloesungsgebuehren}). Bei einer vorzeitigen Auflösung werden die Leasingraten zudem rückwirkend neu berechnet (${AMAG_LEASING.clauses.rueckwirkendeNeuberechnung}).`,
        sourceLinkText: "Allgemeinen Leasingbestimmungen",
        sourceUrl: AMAG_LEASING.sourceUrl,
      },
      // ERFAHRUNGSWERT-VINCE: typische Dauer einer AMAG-Übertragung
      typicalDuration: null,
      // ALB Ausgabe 01/26, Ziff. 19.1, 8.1 und 5.1 (geprüft am 9.10.2026).
      documents: {
        text:
          `Bei der Prüfung eines Leasingantrags holt AMAG Leasing unter anderem Auskünfte bei der ZEK und der IKO ein (${AMAG_LEASING.clauses.bonitaetspruefung}). Das Fahrzeug wird in der Regel auf die Leasingnehmerin oder den Leasingnehmer immatrikuliert; Ausnahmen gelten für eine Person im gleichen Haushalt und für Firmenwagen von Mitarbeitenden (${AMAG_LEASING.clauses.immatrikulation}). Für Neufahrzeuge verlangt AMAG Leasing eine Vollkaskoversicherung, bei Occasionen ist nach Absprache mit der Leasinggeberin eine Teilkasko möglich (${AMAG_LEASING.clauses.versicherung}). Quelle: Allgemeine Leasingbestimmungen Autos, ${AMAG_LEASING.edition}.`,
        sourceLinkText: `Allgemeine Leasingbestimmungen Autos, ${AMAG_LEASING.edition}`,
        sourceUrl: AMAG_LEASING.sourceUrl,
      },
      transferProcess: {
        text:
          "AMAG Leasing arbeitet mit indirektem Leasing: Deine Liefergarage ist eng eingebunden und gegenüber AMAG Leasing zur Rücknahme zum Restwert verpflichtet (gemäss AMAG-Leasing-Ablauf). Kläre eine Übernahme deshalb gemeinsam mit AMAG Leasing und der Liefergarage. Leasingfahrzeuge tragen im Fahrzeugausweis den Eintrag «Halterwechsel verboten» – ohne Freigabe der AMAG läuft beim Strassenverkehrsamt nichts.",
        sourceLinkText: "AMAG-Leasing-Ablauf",
        sourceUrl: "https://www.amag-leasing.ch/de/ablauf-leasing.html",
      },
    },
  },
  {
    slug: "multilease-leasing-uebernehmen",
    name: "Multilease",
    compoundName: "Multilease",
    officialSite: "https://www.multilease.ch",
    infoUrl: "https://www.multilease.ch/de/faq",
    heroNote:
      "Besonderheit bei Multilease: Vieles läuft über den Markenvertreter deiner Liefergarage – binde deine Garage deshalb früh ein.",
    descriptionDetail: "Ablauf über den Markenvertreter und die Bonitätsprüfung",
    facts: {
      transferFee: {
        // ERFAHRUNGSWERT-VINCE: real verrechnete Gebühr bei Multilease
        text:
          "Multilease publiziert keinen Übernahme-Tarif. Die Übertragung auf eine Drittperson ist gemäss Multilease-FAQ ausdrücklich vorgesehen – die Konditionen legt Multilease im Einzelfall fest.",
        sourceLinkText: "Multilease-FAQ",
        sourceUrl: "https://www.multilease.ch/de/faq",
      },
      // ERFAHRUNGSWERT-VINCE: typische Dauer einer Multilease-Übertragung
      typicalDuration: null,
      documents: {
        text:
          "Die Bonität der übernehmenden Person wird gemäss Konsumkreditgesetz geprüft; Multilease bzw. der Markenvertreter holt die nötigen Auskünfte ein (gemäss Multilease-Leasingratgeber).",
        sourceLinkText: "Multilease-Leasingratgeber",
        sourceUrl: "https://www.multilease.ch/was-ist-leasing/",
      },
      transferProcess: {
        text:
          "Multilease arbeitet eng mit den Liefergaragen: Verlängerung, Rückgabe und Fahrzeugübernahme laufen gemäss Multilease-FAQ über den Markenvertreter – nimm für eine Vertragsübertragung direkt mit Multilease Kontakt auf und binde deine Liefergarage früh ein. Auch hier gilt Code 178: Die Umschreibung des Fahrzeugausweises braucht die Freigabe der Leasinggesellschaft.",
        sourceLinkText: "Multilease-FAQ",
        sourceUrl: "https://www.multilease.ch/de/faq",
      },
    },
  },
  {
    slug: "bank-now-leasing-uebernehmen",
    name: "BANK-now",
    compoundName: "BANK-now",
    // Bare domain redirects to English — link the German entry point.
    officialSite: "https://www.bank-now.ch/de",
    infoUrl: "https://www.bank-now.ch/de",
    heroNote:
      "Gut zu wissen: BANK-now gehört heute zur UBS – bestehende Leasingverträge laufen normal bei BANK-now weiter.",
    descriptionDetail: "Ablauf, Bonitätsprüfung und was die UBS-Übernahme bedeutet",
    introNote: {
      text:
        "BANK-now ist eine hundertprozentige Tochtergesellschaft der UBS Switzerland AG. Das Porsche-Leasing-Neugeschäft wechselte im Juli 2025 zu Porsche Financial Services; bestehende BANK-now-Verträge laufen bei BANK-now weiter (Quelle: finews, Stand August 2026).",
      sourceLinkText: "finews",
      sourceUrl:
        "https://www.finews.com/news/english-news/68246-porsche-switzerland-porsche-financial-services-bank-now-ubs-credit-suisse-leasing-business",
    },
    facts: {
      transferFee: {
        // Kein publizierter Tarif = Negativ-Befund aus der Recherche; die
        // ursprünglich zitierte credit-now-FAQ behandelt die Verlängerung
        // nach Ablauf, nicht die Übernahme, und trägt die Aussage darum
        // nicht — Attribution entfernt, URL nur als Referenz:
        // https://www.credit-now.ch/de/faq/faq-detail/15336-Kann_ich_einen_Leasingvertrag_nach_Ablauf_verlngern_lassen_
        // ERFAHRUNGSWERT-VINCE: real verrechnete Gebühr bei BANK-now
        text:
          "BANK-now publiziert keinen Übernahme-Tarif – die Konditionen klärst du direkt mit BANK-now.",
      },
      // ERFAHRUNGSWERT-VINCE: typische Dauer einer BANK-now-Übertragung
      typicalDuration: null,
      documents: {
        // ERFAHRUNGSWERT-VINCE: verbindliche Dokumentenliste von BANK-now ergänzen
        text:
          "Die Bonität der übernehmenden Person wird nach Konsumkreditgesetz geprüft – wie beim Neuvertrag inklusive Abfrage bei ZEK/IKO.",
      },
      transferProcess: {
        // ERFAHRUNGSWERT-VINCE: konkreter Übertragungsweg bei BANK-now
        // (Kundendienst? Formular?) — die Kundendienst-Angabe aus der
        // Recherche hat keine öffentliche Quelle und bleibt deshalb draussen.
        text:
          "Die Übernahme-Anfrage richtest du direkt an BANK-now; die Konditionen werden im Einzelfall geklärt. Wie bei allen Leasinggesellschaften gilt: Code 178 im Fahrzeugausweis – die Umschreibung braucht die Freigabe der Bank.",
      },
    },
    // Interne Notiz (NICHT publizieren, Quelle 2016 veraltet): Übernahmen
    // grundsätzlich möglich, u.a. Mindest-Restlaufzeit 12 Monate —
    // telefonisch verifizieren.
  },
];

// Backlog-Notiz: Porsche Financial Services (Porsche-Leasing-Neugeschäft seit
// Juli 2025) als Kandidat für eine fünfte Gesellschaftsseite vormerken.

// Build-time guard: a SourcedFact whose sourceLinkText is not a verbatim
// substring of its text would silently lose its citation link at render time —
// fail the build instead. Runs at module import, i.e. during next build.
for (const company of LEASING_COMPANIES) {
  const sourced: (SourcedFact | undefined | null)[] = [
    company.introNote,
    company.facts.transferFee,
    company.facts.typicalDuration,
    company.facts.documents,
    company.facts.transferProcess,
  ];
  for (const fact of sourced) {
    if (fact?.sourceLinkText && !fact.text.includes(fact.sourceLinkText)) {
      throw new Error(
        `leasingCompanies: sourceLinkText «${fact.sourceLinkText}» not found in fact text for ${company.slug}`
      );
    }
  }
}

export function otherLeasingCompanies(slug: string): LeasingCompany[] {
  return LEASING_COMPANIES.filter((c) => c.slug !== slug);
}

/** Registry lookup for the page files — fails loudly at build time on a typo. */
export function leasingCompanyBySlug(slug: string): LeasingCompany {
  const company = LEASING_COMPANIES.find((c) => c.slug === slug);
  if (!company) throw new Error(`Unknown leasing company slug: ${slug}`);
  return company;
}
