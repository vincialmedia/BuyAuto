import type { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight, Check, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModernListingCard } from "@/components/buyauto/search/ModernListingCard";
import { searchListings } from "@/services/listingsService";
import type { Listing } from "@/lib/buyauto/types";
import {
  DYNAMIC_BRAND_INTRO,
  dbBrandsFor,
  getLeasingBrandBySlug,
  LEASING_BRANDS,
  resolveBrandSlug,
  type BrandInventoryRow,
  type LeasingBrand,
} from "@/lib/buyauto/leasingBrands";
import { supabase } from "@/integrations/supabase/client";
import { absoluteUrl, localizePath, OG_LOCALE, toLocale } from "@/i18n/config";
import { useLocale, useT, type I18nPageProps, type TFunction } from "@/i18n/runtime";
import { withI18n } from "@/i18n/server";
import { Hreflang } from "@/i18n/seo";

const SITE_URL = "https://www.buyauto.ch";

type BrandPageProps = {
  brand: LeasingBrand;
  listings: Listing[];
  total: number;
} & I18nPageProps;

type FaqItem = { question: string; answer: string };

// Curated brands carry hand-written copy (intro, German model designations such
// as "3er"/"C-Klasse") whose German text is the translation key as it stands.
// DB-only brands are built from a template, so their intro is translated via
// that template and their models (raw DB values) stay untouched.
function isCuratedBrand(brand: LeasingBrand): boolean {
  return getLeasingBrandBySlug(brand.slug) !== null;
}

function brandIntro(brand: LeasingBrand, t: TFunction): string {
  return isCuratedBrand(brand) ? t(brand.intro) : t(DYNAMIC_BRAND_INTRO, { brand: brand.name });
}

// Honest, brand-injected FAQ. Rendered visibly below AND emitted as FAQPage schema —
// Google requires the schema text to match what the user can actually see on the page.
function buildFaq(brand: LeasingBrand, t: TFunction): FaqItem[] {
  const curated = isCuratedBrand(brand);
  const models = brand.popularModels
    .slice(0, 3)
    .map((model) => (curated ? t(model) : model))
    .join(", ");
  return [
    {
      question: t("Wie funktioniert eine Leasingübernahme bei einem {brand}?", { brand: brand.name }),
      answer: t(
        "Du übernimmst einen laufenden {brand}-Leasingvertrag von der bisherigen Leasingnehmerin oder dem bisherigen Leasingnehmer. Die Leasinggesellschaft prüft deine Bonität und stimmt der Übernahme zu – danach führst du den Vertrag zu den bestehenden Konditionen für die Restlaufzeit weiter. Eine hohe Anzahlung wie bei einem neuen Leasing entfällt.",
        { brand: brand.name }
      ),
    },
    {
      question: t("Was kostet die Leasingübernahme eines {brand}?", { brand: brand.name }),
      answer: t(
        "Du zahlst die bestehende monatliche Leasingrate weiter. Einmalig fallen je nach Leasinggeber und Kanton rund 200–650 CHF für Transfer, Ummeldung und Administration an. Die ursprüngliche Anzahlung bleibt im Vertrag und kommt dir als Übernehmer zugute."
      ),
    },
    {
      question: t("Welche {brand}-Modelle kann ich übernehmen?", { brand: brand.name }),
      answer: t(
        "Das hängt vom aktuellen Angebot ab. Beliebte {brand}-Modelle für eine Leasingübernahme sind {models}. Sieh dir die aktuell verfügbaren {brand}-Angebote weiter oben an oder durchsuche alle Leasingübernahmen auf BuyAuto.",
        { brand: brand.name, models }
      ),
    },
  ];
}

export default function LeasingBrandPage({ brand, listings, total }: BrandPageProps) {
  const t = useT();
  const locale = useLocale();
  const brandPath = `/leasinguebernahme/${brand.slug}`;
  const canonical = absoluteUrl(brandPath, locale);
  // /suche filters on the exact stored brand string, which can differ from the display
  // name (Mercedes-Benz page ↔ "Mercedes" rows) — link with the primary DB spelling.
  const searchHref = `/suche?dealType=lease_takeover&brand=${encodeURIComponent(dbBrandsFor(brand)[0])}`;
  const hasListings = total > 0;
  const faq = buildFaq(brand, t);

  const pageTitle = t("Leasingübernahme {brand} – Angebote in der Schweiz | BuyAuto", { brand: brand.name });
  const metaDescription = hasListings
    ? t(
        "Leasingübernahme {brand} in der Schweiz: {total} aktuelle Angebote – übernimm einen laufenden {brand}-Leasingvertrag ohne hohe Anzahlung. Jetzt auf BuyAuto entdecken.",
        { brand: brand.name, total }
      )
    : t(
        "Leasingübernahme {brand} in der Schweiz: übernimm einen laufenden {brand}-Leasingvertrag ohne hohe Anzahlung – geprüfte Angebote von Privatpersonen und Garagen auf BuyAuto.",
        { brand: brand.name }
      );

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: t("Home"), item: absoluteUrl("/", locale) },
      { "@type": "ListItem", position: 2, name: t("Leasingübernahme"), item: absoluteUrl("/leasinguebernahme", locale) },
      { "@type": "ListItem", position: 3, name: brand.name, item: canonical },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  const listingsJsonLd = hasListings
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: t("Leasingübernahme {brand} – Angebote in der Schweiz", { brand: brand.name }),
        numberOfItems: total,
        itemListElement: listings.map((l, index) => {
          const price = typeof l.pricePerMonthCHF === "number" && l.pricePerMonthCHF > 0 ? l.pricePerMonthCHF : null;
          return {
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": "Car",
              name: `${l.brand} ${l.model} ${l.year}`,
              brand: { "@type": "Brand", name: l.brand },
              model: l.model,
              vehicleModelDate: l.year,
              ...(l.mileageKm
                ? { mileageFromOdometer: { "@type": "QuantitativeValue", value: l.mileageKm, unitCode: "KMT" } }
                : {}),
              ...(l.fuel ? { fuelType: l.fuel } : {}),
              ...(l.gearbox ? { vehicleTransmission: l.gearbox } : {}),
              ...(price
                ? {
                    offers: {
                      "@type": "Offer",
                      // Recurring monthly lease rate, not a sale price — express only via
                      // priceSpecification so Google doesn't read it as the vehicle price.
                      availability: "https://schema.org/InStock",
                      itemCondition: "https://schema.org/UsedCondition",
                      priceSpecification: {
                        "@type": "UnitPriceSpecification",
                        price,
                        priceCurrency: "CHF",
                        unitText: "MONTH",
                      },
                    },
                  }
                : {}),
            },
          };
        }),
      }
    : null;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={metaDescription} />
        {hasListings ? (
          <link rel="canonical" href={canonical} />
        ) : (
          /* Empty brand views carry no index value yet: noindex,follow (crawlable, out of
             the index) and NO self-canonical — so we never send canonical + noindex
             together. They flip to indexable automatically once inventory is published. */
          <meta name="robots" content="noindex,follow" />
        )}

        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="website" />
        {hasListings && <meta property="og:url" content={canonical} />}
        <meta property="og:image" content={`${SITE_URL}/share-logo.jpg`} />
        <meta property="og:locale" content={OG_LOCALE[locale]} />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
        {listingsJsonLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(listingsJsonLd) }}
          />
        )}
      </Head>
      {/* hreflang only while the page is indexable (same condition as the canonical). */}
      {hasListings && <Hreflang path={brandPath} />}

      <main className="bg-white min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm text-neutral-500 mb-6" aria-label={t("Breadcrumb")}>
            <Link href="/" className="hover:text-neutral-900">{t("Home")}</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/leasinguebernahme" className="hover:text-neutral-900">{t("Leasingübernahme")}</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-neutral-900 font-medium">{brand.name}</span>
          </nav>

          {/* Hero */}
          <header className="max-w-3xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-neutral-900">
              {t("Leasingübernahme {brand} in der Schweiz", { brand: brand.name })}
            </h1>
            <p className="mt-4 text-lg text-neutral-600 leading-relaxed">{brandIntro(brand, t)}</p>

            <ul className="mt-6 grid sm:grid-cols-2 gap-2 text-sm text-neutral-700">
              {[
                "Keine hohe Anzahlung",
                "Kurze Restlaufzeit statt 48 Monate",
                "Geprüfte Angebote von Privat & Garagen",
                "Transparente monatliche Rate",
              ].map((point) => (
                <li key={point} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  {t(point)}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="font-bold whitespace-normal h-auto text-center">
                <Link href={searchHref}>
                  {t("Alle {brand} Leasingübernahmen ansehen", { brand: brand.name })}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="font-bold whitespace-normal h-auto text-center">
                <Link href="/leasinguebernahme">{t("So funktioniert die Leasingübernahme")}</Link>
              </Button>
            </div>
          </header>

          {/* Listings */}
          <section className="mt-14">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
              <h2 className="min-w-0 text-2xl font-bold text-neutral-900">
                {hasListings
                  ? total === 1
                    ? t("{total} {brand}-Angebot zur Leasingübernahme", { total, brand: brand.name })
                    : t("{total} {brand}-Angebote zur Leasingübernahme", { total, brand: brand.name })
                  : t("Aktuell keine {brand}-Leasingübernahmen verfügbar", { brand: brand.name })}
              </h2>
              {hasListings && (
                <Link href={searchHref} className="text-sm font-semibold text-primary hover:underline whitespace-nowrap">
                  {t("Alle ansehen →")}
                </Link>
              )}
            </div>

            {hasListings ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing) => (
                  <ModernListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 p-10 text-center">
                <p className="text-neutral-600">
                  {t(
                    "Momentan sind keine {brand}-Fahrzeuge zur Leasingübernahme inseriert. Stöbere in allen verfügbaren Leasingübernahmen – oder gib dein eigenes {brand}-Leasing zur Übernahme frei.",
                    { brand: brand.name }
                  )}
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Button asChild className="font-bold">
                    <Link href="/suche?dealType=lease_takeover">{t("Alle Leasingübernahmen ansehen")}</Link>
                  </Button>
                  <Button asChild variant="outline" className="font-bold">
                    <Link href="/inserat-erstellen">{t("Eigenes Leasing abgeben")}</Link>
                  </Button>
                </div>
              </div>
            )}
          </section>

          {/* FAQ — visible content that mirrors the FAQPage schema above */}
          <section className="mt-16 max-w-3xl">
            <h2 className="text-2xl font-bold text-neutral-900 mb-6">
              {t("Häufige Fragen zur Leasingübernahme von {brand}", { brand: brand.name })}
            </h2>
            <div className="space-y-6">
              {faq.map((f) => (
                <div key={f.question}>
                  <h3 className="font-bold text-neutral-900">{f.question}</h3>
                  <p className="mt-2 text-neutral-600 leading-relaxed">{f.answer}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Internal links */}
          <section className="mt-16 border-t border-neutral-200 pt-8">
            <p className="text-sm text-neutral-500 mb-3">{t("Weiterlesen")}</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <Link href="/leasinguebernahme" className="text-primary hover:underline">{t("Leasingübernahme – kompletter Leitfaden")}</Link>
              <Link href="/leasinguebernahme-kosten" className="text-primary hover:underline">{t("Was kostet eine Leasingübernahme?")}</Link>
              <Link href="/leasingvertrag-uebertragen" className="text-primary hover:underline">{t("Leasingvertrag übertragen")}</Link>
              <Link href="/suche?dealType=lease_takeover" className="text-primary hover:underline">{t("Alle Leasingübernahmen")}</Link>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  // Curated slugs are prerendered; brands that only exist in the DB (e.g. Fiat, Škoda)
  // reach getStaticProps through fallback:"blocking" and are resolved there.
  return {
    paths: LEASING_BRANDS.map((b) => ({ params: { marke: b.slug } })),
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps<BrandPageProps> = async (context) => {
  const slug = String(context.params?.marke ?? "");

  let inventoryRows: BrandInventoryRow[] = [];
  try {
    const { data, error } = await supabase.from("listings_public").select("brand, model, deal_type");
    if (error) console.error("Brand page inventory query failed:", { slug, error });
    else inventoryRows = (data ?? []) as BrandInventoryRow[];
  } catch (error) {
    console.error("Brand page inventory query failed:", { slug, error });
  }

  const resolved = resolveBrandSlug(slug, inventoryRows);

  if (!resolved) {
    return { notFound: true, revalidate: 300 };
  }

  if ("redirectTo" in resolved) {
    // A DB spelling already covered by a curated page (e.g. /mercedes → /mercedes-benz).
    // Redirect destinations are not locale-prefixed by Next — keep fr/it/en in their language.
    return {
      redirect: {
        destination: localizePath(`/leasinguebernahme/${resolved.redirectTo}`, toLocale(context.locale)),
        permanent: true,
      },
      revalidate: 300,
    };
  }

  const brand = resolved.brand;

  try {
    const results = await searchListings({ dealType: "lease_takeover", brands: dbBrandsFor(brand), sort: "dateDesc" });
    // Strip undefined fields so Next can serialize the props.
    const listings = JSON.parse(JSON.stringify(results.items)) as Listing[];
    return {
      props: { brand, listings, total: results.total, ...(await withI18n(context.locale, ["leasing"])) },
      revalidate: 300,
    };
  } catch (error) {
    console.error("Brand page SSR search failed:", { slug, error });
    return {
      props: { brand, listings: [], total: 0, ...(await withI18n(context.locale, ["leasing"])) },
      revalidate: 300,
    };
  }
};
