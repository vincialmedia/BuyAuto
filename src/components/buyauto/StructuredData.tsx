import Head from "next/head";

interface StructuredDataProps {
  type?: "homepage" | "listing" | "search" | "dealer";
  listingData?: {
    id: string;
    brand: string;
    model: string;
    year: number;
    price: number;
    images?: string[];
  };
  dealerData?: {
    name: string;
    slug: string;
    description?: string | null;
    city?: string | null;
    websiteUrl?: string | null;
    phoneNumber?: string | null;
    contactEmail?: string | null;
    headerImageUrl?: string | null;
    logoUrl?: string | null;
    openingHours?: unknown;
  };
}

function getBaseUrl(): string {
  const env = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  if (env) return env.replace(/\/$/, "");
  return process.env.NODE_ENV === "production" ? "https://www.buyauto.ch" : "http://localhost:3000";
}

function normalizeOpeningHours(value: unknown): Record<string, { from?: string | null; to?: string | null; closed?: boolean | null }> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, { from?: string | null; to?: string | null; closed?: boolean | null }>;
}

export function StructuredData({ type = "homepage", listingData, dealerData }: StructuredDataProps) {
  const baseUrl = getBaseUrl();

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "BuyAuto",
    alternateName: "BuyAuto Schweiz",
    url: baseUrl,
    logo: `${baseUrl}/buyauto-logo.png`,
    image: `${baseUrl}/buyauto-logo.png`,
    description:
      "Leasingübernahme in der Schweiz leicht gemacht: Finde bestehende Leasingverträge, sichere dir starke Deals und wechsle dein Auto stressfrei mit BuyAuto.",
    address: {
      "@type": "PostalAddress",
      addressCountry: "CH",
    },
    sameAs: [],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: ["German", "French", "Italian"],
    },
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "BuyAuto",
    alternateName: "BuyAuto Schweiz",
    url: baseUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/suche?query={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: baseUrl,
      },
    ],
  };

  const productSchema = listingData
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: `${listingData.brand} ${listingData.model} (${listingData.year})`,
        brand: {
          "@type": "Brand",
          name: listingData.brand,
        },
        model: listingData.model,
        image: listingData.images?.map((img) => img) || [],
        offers: {
          "@type": "Offer",
          price: listingData.price,
          priceCurrency: "CHF",
          availability: "https://schema.org/InStock",
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: listingData.price,
            priceCurrency: "CHF",
            unitText: "MON",
          },
        },
      }
    : null;

  const dealerSchema = dealerData
    ? (() => {
        const url = `${baseUrl}/${dealerData.slug}`;
        const hours = normalizeOpeningHours(dealerData.openingHours);

        const openingHoursSpecification = hours
          ? Object.entries(hours)
              .map(([dayKey, v]) => {
                const closed = Boolean(v?.closed);
                const from = (v?.from ?? "").toString().trim();
                const to = (v?.to ?? "").toString().trim();
                if (closed || (!from && !to)) return null;

                const dayMap: Record<string, string> = {
                  monday: "Monday",
                  tuesday: "Tuesday",
                  wednesday: "Wednesday",
                  thursday: "Thursday",
                  friday: "Friday",
                  saturday: "Saturday",
                  sunday: "Sunday",
                };

                const dayOfWeek = dayMap[dayKey];
                if (!dayOfWeek) return null;

                return {
                  "@type": "OpeningHoursSpecification",
                  dayOfWeek: `https://schema.org/${dayOfWeek}`,
                  opens: from || undefined,
                  closes: to || undefined,
                };
              })
              .filter(Boolean)
          : [];

        return {
          "@context": "https://schema.org",
          "@type": "AutoDealer",
          name: dealerData.name,
          url,
          image: dealerData.headerImageUrl || dealerData.logoUrl || `${baseUrl}/buyauto-logo.png`,
          logo: dealerData.logoUrl || `${baseUrl}/buyauto-logo.png`,
          description: dealerData.description?.trim() || undefined,
          telephone: dealerData.phoneNumber?.trim() || undefined,
          email: dealerData.contactEmail?.trim() || undefined,
          address: {
            "@type": "PostalAddress",
            addressCountry: "CH",
            addressLocality: dealerData.city?.trim() || undefined,
          },
          sameAs: dealerData.websiteUrl?.trim() ? [dealerData.websiteUrl.trim()] : [],
          openingHoursSpecification,
        };
      })()
    : null;

  return (
    <Head>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />

      {type === "homepage" ? (
        <>
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
        </>
      ) : null}

      {productSchema && type === "listing" ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      ) : null}

      {dealerSchema && type === "dealer" ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(dealerSchema) }} />
      ) : null}
    </Head>
  );
}