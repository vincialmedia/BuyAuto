import type { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight, Check, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModernListingCard } from "@/components/buyauto/search/ModernListingCard";
import { searchListings } from "@/services/listingsService";
import type { Listing } from "@/lib/buyauto/types";
import {
  dbBrandsFor,
  LEASING_BRANDS,
  resolveBrandSlug,
  type BrandInventoryRow,
  type LeasingBrand,
} from "@/lib/buyauto/leasingBrands";
import { supabase } from "@/integrations/supabase/client";

const SITE_URL = "https://www.buyauto.ch";

type BrandPageProps = {
  brand: LeasingBrand;
  listings: Listing[];
  total: number;
};

type FaqItem = { question: string; answer: string };

// Honest, brand-injected FAQ. Rendered visibly below AND emitted as FAQPage schema —
// Google requires the schema text to match what the user can actually see on the page.
function buildFaq(brand: LeasingBrand): FaqItem[] {
  const models = brand.popularModels.slice(0, 3).join(", ");
  return [
    {
      question: `Wie funktioniert eine Leasingübernahme bei einem ${brand.name}?`,
      answer: `Du übernimmst einen laufenden ${brand.name}-Leasingvertrag von der bisherigen Leasingnehmerin oder dem bisherigen Leasingnehmer. Die Leasinggesellschaft prüft deine Bonität und stimmt der Übernahme zu – danach führst du den Vertrag zu den bestehenden Konditionen für die Restlaufzeit weiter. Eine hohe Anzahlung wie bei einem neuen Leasing entfällt.`,
    },
    {
      question: `Was kostet die Leasingübernahme eines ${brand.name}?`,
      answer: `Du zahlst die bestehende monatliche Leasingrate weiter. Einmalig fallen je nach Leasinggeber und Kanton rund 200–650 CHF für Transfer, Ummeldung und Administration an. Die ursprüngliche Anzahlung bleibt im Vertrag und kommt dir als Übernehmer zugute.`,
    },
    {
      question: `Welche ${brand.name}-Modelle kann ich übernehmen?`,
      answer: `Das hängt vom aktuellen Angebot ab. Beliebte ${brand.name}-Modelle für eine Leasingübernahme sind ${models}. Sieh dir die aktuell verfügbaren ${brand.name}-Angebote weiter oben an oder durchsuche alle Leasingübernahmen auf BuyAuto.`,
    },
  ];
}

export default function LeasingBrandPage({ brand, listings, total }: BrandPageProps) {
  const canonical = `${SITE_URL}/leasinguebernahme/${brand.slug}`;
  // /suche filters on the exact stored brand string, which can differ from the display
  // name (Mercedes-Benz page ↔ "Mercedes" rows) — link with the primary DB spelling.
  const searchHref = `/suche?dealType=lease_takeover&brand=${encodeURIComponent(dbBrandsFor(brand)[0])}`;
  const hasListings = total > 0;
  const faq = buildFaq(brand);

  const pageTitle = `Leasingübernahme ${brand.name} – Angebote in der Schweiz | BuyAuto`;
  const metaDescription = hasListings
    ? `Leasingübernahme ${brand.name} in der Schweiz: ${total} aktuelle Angebote – übernimm einen laufenden ${brand.name}-Leasingvertrag ohne hohe Anzahlung. Jetzt auf BuyAuto entdecken.`
    : `Leasingübernahme ${brand.name} in der Schweiz: übernimm einen laufenden ${brand.name}-Leasingvertrag ohne hohe Anzahlung – geprüfte Angebote von Privatpersonen und Garagen auf BuyAuto.`;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Leasingübernahme", item: `${SITE_URL}/leasinguebernahme` },
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
        name: `Leasingübernahme ${brand.name} – Angebote in der Schweiz`,
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
        <meta property="og:locale" content="de_CH" />

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

      <main className="bg-white min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm text-neutral-500 mb-6" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-neutral-900">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/leasinguebernahme" className="hover:text-neutral-900">Leasingübernahme</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-neutral-900 font-medium">{brand.name}</span>
          </nav>

          {/* Hero */}
          <header className="max-w-3xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-neutral-900">
              Leasingübernahme {brand.name} in der Schweiz
            </h1>
            <p className="mt-4 text-lg text-neutral-600 leading-relaxed">{brand.intro}</p>

            <ul className="mt-6 grid sm:grid-cols-2 gap-2 text-sm text-neutral-700">
              {[
                "Keine hohe Anzahlung",
                "Kurze Restlaufzeit statt 48 Monate",
                "Geprüfte Angebote von Privat & Garagen",
                "Transparente monatliche Rate",
              ].map((point) => (
                <li key={point} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  {point}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="font-bold whitespace-normal h-auto text-center">
                <Link href={searchHref}>
                  Alle {brand.name} Leasingübernahmen ansehen
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="font-bold whitespace-normal h-auto text-center">
                <Link href="/leasinguebernahme">So funktioniert die Leasingübernahme</Link>
              </Button>
            </div>
          </header>

          {/* Listings */}
          <section className="mt-14">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
              <h2 className="min-w-0 text-2xl font-bold text-neutral-900">
                {hasListings
                  ? `${total} ${brand.name}-${total === 1 ? "Angebot" : "Angebote"} zur Leasingübernahme`
                  : `Aktuell keine ${brand.name}-Leasingübernahmen verfügbar`}
              </h2>
              {hasListings && (
                <Link href={searchHref} className="text-sm font-semibold text-primary hover:underline whitespace-nowrap">
                  Alle ansehen →
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
                  Momentan sind keine {brand.name}-Fahrzeuge zur Leasingübernahme inseriert. Stöbere in allen
                  verfügbaren Leasingübernahmen oder lass dich benachrichtigen, sobald ein {brand.name} verfügbar ist.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Button asChild className="font-bold">
                    <Link href="/suche?dealType=lease_takeover">Alle Leasingübernahmen ansehen</Link>
                  </Button>
                  <Button asChild variant="outline" className="font-bold">
                    <Link href="/leasing-concierge">Concierge benachrichtigen lassen</Link>
                  </Button>
                </div>
              </div>
            )}
          </section>

          {/* FAQ — visible content that mirrors the FAQPage schema above */}
          <section className="mt-16 max-w-3xl">
            <h2 className="text-2xl font-bold text-neutral-900 mb-6">
              Häufige Fragen zur Leasingübernahme von {brand.name}
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
            <p className="text-sm text-neutral-500 mb-3">Weiterlesen</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <Link href="/leasinguebernahme" className="text-primary hover:underline">Leasingübernahme – kompletter Leitfaden</Link>
              <Link href="/leasinguebernahme-kosten" className="text-primary hover:underline">Was kostet eine Leasingübernahme?</Link>
              <Link href="/leasingvertrag-uebertragen" className="text-primary hover:underline">Leasingvertrag übertragen</Link>
              <Link href="/suche?dealType=lease_takeover" className="text-primary hover:underline">Alle Leasingübernahmen</Link>
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
    return {
      redirect: { destination: `/leasinguebernahme/${resolved.redirectTo}`, permanent: true },
      revalidate: 300,
    };
  }

  const brand = resolved.brand;

  try {
    const results = await searchListings({ dealType: "lease_takeover", brands: dbBrandsFor(brand), sort: "dateDesc" });
    // Strip undefined fields so Next can serialize the props.
    const listings = JSON.parse(JSON.stringify(results.items)) as Listing[];
    return { props: { brand, listings, total: results.total }, revalidate: 300 };
  } catch (error) {
    console.error("Brand page SSR search failed:", { slug, error });
    return { props: { brand, listings: [], total: 0 }, revalidate: 300 };
  }
};
