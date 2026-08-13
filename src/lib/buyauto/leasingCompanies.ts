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
  /** Official company website (root URL only — no deep-link claims). */
  officialSite: string;
  /** Official info/FAQ page for the after-CTA «Direkt bei der Gesellschaft
   *  nachfragen» link. Falls back to officialSite. Per the funnel rule this
   *  link renders only AFTER the BuyAuto CTAs. */
  infoUrl?: string;
  /** Sourced company status/size fact rendered under the hero intro. */
  introNote?: SourcedFact;
  /** Brands the company finances (AMAG only for now), with links to the
   *  brand pages that exist. */
  financedBrands?: {
    lead: string;
    brands: { name: string; href?: string }[];
    sourceLabel: string;
    sourceUrl: string;
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
    facts: {
      transferFee: {
        text:
          "Cembra verrechnet für den Halterwechsel CHF 500.– plus CHF 75.– für die Umschreibung des Fahrzeugausweises, jeweils exkl. MWST (gemäss Gebührenübersicht Leasing der Cembra, gültig ab 1.9.2023). Dazu kommen die kantonalen Gebühren des Strassenverkehrsamts. Zum Vergleich: Allein die Kündigungsabrechnung bei einer vorzeitigen Auflösung kostet CHF 250.– exkl. MWST (gleiche Quelle) – hinzu kommt die eigentliche Auflösungsentschädigung gemäss Vertrag.",
        sourceLinkText: "Gebührenübersicht Leasing der Cembra",
        sourceUrl: "https://www.cembra.ch/assets/cembra/leasing/gebuehren-de.pdf",
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
    introNote: {
      text:
        "AMAG Leasing zählt nach eigenen Angaben über 160'000 Privat- und Firmenkunden (Quelle: AMAG Group, Stand August 2026).",
      sourceLinkText: "AMAG Group",
      sourceUrl: "https://www.amag-group.ch/de/ueber-uns/Geschaeftsfelder/leasing.html",
    },
    financedBrands: {
      lead: "AMAG Leasing finanziert die Marken",
      // Nur Marken mit existierender Brand-Page verlinken: volkswagen und audi
      // sind kuratiert, skoda läuft als dynamische Seite mit Live-Inventar.
      // Seat und Cupra haben noch keine Seiten — nur Nennung im Text.
      // Porsche ist in ALB 01/25 Ziff. 9.1.1 NICHT aufgeführt.
      brands: [
        { name: "VW", href: "/leasinguebernahme/volkswagen" },
        { name: "VW Nutzfahrzeuge" },
        { name: "Audi", href: "/leasinguebernahme/audi" },
        { name: "Seat" },
        { name: "Cupra" },
        { name: "Škoda", href: "/leasinguebernahme/skoda" },
      ],
      sourceLabel: "gemäss ALB 01/25, Ziff. 9.1.1",
      sourceUrl:
        "https://www.amag-leasing.ch/content/dam/amag-leasingportal/documents/allgemeine-leasingbestimmungen/deutsch/ALB_Autos_0125_DE_fin.pdf",
    },
    facts: {
      transferFee: {
        // ERFAHRUNGSWERT-VINCE: real verrechnete Übernahmegebühr bei AMAG Leasing
        text:
          "AMAG Leasing publiziert keinen Tarif für die Vertragsübernahme – die Konditionen werden auf Anfrage festgelegt. Zum Vergleich: Die vorzeitige Vertragsauflösung kostet gemäss den Allgemeinen Leasingbestimmungen (Ausgabe 01/25, Ziff. 14.1 und 18) pauschal CHF 800.– exkl. MWST, zusätzlich werden die Leasingraten rückwirkend auf die effektive Laufzeit neu berechnet – die Übernahme ist deshalb in der Regel der deutlich günstigere Ausstieg.",
        sourceLinkText: "Allgemeinen Leasingbestimmungen",
        sourceUrl:
          "https://www.amag-leasing.ch/content/dam/amag-leasingportal/documents/allgemeine-leasingbestimmungen/deutsch/ALB_Autos_0125_DE_fin.pdf",
      },
      // ERFAHRUNGSWERT-VINCE: typische Dauer einer AMAG-Übertragung
      typicalDuration: null,
      documents: {
        text:
          "AMAG Leasing prüft Kreditfähigkeit und Kreditwürdigkeit der übernehmenden Person mit Abfrage bei ZEK/IKO (gemäss ALB 01/25, Ziff. 19.1). Das Fahrzeug muss grundsätzlich auf die Leasingnehmerin oder den Leasingnehmer immatrikuliert sein (Ziff. 8.1); bei Neufahrzeugen ist Vollkasko Pflicht (Ziff. 5.1).",
        sourceLinkText: "ALB 01/25",
        sourceUrl:
          "https://www.amag-leasing.ch/content/dam/amag-leasingportal/documents/allgemeine-leasingbestimmungen/deutsch/ALB_Autos_0125_DE_fin.pdf",
      },
      transferProcess: {
        text:
          "AMAG Leasing arbeitet mit indirektem Leasing: Neben dir und der Leasinggeberin ist die Liefergarage Vertragspartei mit Rücknahmepflicht zum Restwert (gemäss AMAG-Leasing-Ablauf). Kläre eine Übernahme deshalb gemeinsam mit AMAG Leasing und der Liefergarage. Leasingfahrzeuge tragen Code 178 im Fahrzeugausweis (ALB Ziff. 16.9) – ohne Freigabe der AMAG läuft beim Strassenverkehrsamt nichts.",
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
    introNote: {
      text:
        "BANK-now ist eine hundertprozentige Tochtergesellschaft der UBS Switzerland. Das Porsche-Leasing-Neugeschäft wechselte im Juli 2025 zu Porsche Financial Services; bestehende BANK-now-Verträge laufen bei BANK-now weiter (Quelle: finews, Stand August 2026).",
      sourceLinkText: "finews",
      sourceUrl:
        "https://www.finews.com/news/english-news/68246-porsche-switzerland-porsche-financial-services-bank-now-ubs-credit-suisse-leasing-business",
    },
    facts: {
      transferFee: {
        // ERFAHRUNGSWERT-VINCE: real verrechnete Gebühr bei BANK-now
        text:
          "BANK-now publiziert keinen Übernahme-Tarif; die Konditionen werden im Einzelfall mit dem Kundendienst geklärt (gemäss BANK-now-FAQ).",
        sourceLinkText: "BANK-now-FAQ",
        sourceUrl:
          "https://www.credit-now.ch/de/faq/faq-detail/15336-Kann_ich_einen_Leasingvertrag_nach_Ablauf_verlngern_lassen_",
      },
      // ERFAHRUNGSWERT-VINCE: typische Dauer einer BANK-now-Übertragung
      typicalDuration: null,
      documents: {
        // ERFAHRUNGSWERT-VINCE: verbindliche Dokumentenliste von BANK-now ergänzen
        text:
          "Die Bonität der übernehmenden Person wird nach Konsumkreditgesetz geprüft – wie beim Neuvertrag inklusive Abfrage bei ZEK/IKO.",
      },
      transferProcess: {
        text:
          "Die Übernahme-Anfrage geht an den BANK-now-Kundendienst – am einfachsten, wenn bereits eine konkrete übernehmende Person feststeht. Wie bei allen Leasinggesellschaften gilt: Code 178 im Fahrzeugausweis, Umschreibung nur mit Freigabe der Bank.",
      },
    },
    // Interne Notiz (NICHT publizieren, Quelle 2016 veraltet): Übernahmen
    // grundsätzlich möglich, u.a. Mindest-Restlaufzeit 12 Monate —
    // telefonisch verifizieren.
  },
];

// Backlog-Notiz: Porsche Financial Services (Porsche-Leasing-Neugeschäft seit
// Juli 2025) als Kandidat für eine fünfte Gesellschaftsseite vormerken.

export function otherLeasingCompanies(slug: string): LeasingCompany[] {
  return LEASING_COMPANIES.filter((c) => c.slug !== slug);
}

/** Registry lookup for the page files — fails loudly at build time on a typo. */
export function leasingCompanyBySlug(slug: string): LeasingCompany {
  const company = LEASING_COMPANIES.find((c) => c.slug === slug);
  if (!company) throw new Error(`Unknown leasing company slug: ${slug}`);
  return company;
}
