import Head from "next/head";

interface StructuredDataProps {
  type?: "homepage" | "listing" | "search";
  listingData?: {
    id: string;
    brand: string;
    model: string;
    year: number;
    price: number;
    images?: string[];
  };
}

export function StructuredData({ type = "homepage", listingData }: StructuredDataProps) {
  const baseUrl = process.env.NODE_ENV === "production" 
    ? "https://www.buyauto.ch" 
    : "http://localhost:3000";

  // Organization Schema - Critical for Google logo display
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "BuyAuto",
    "alternateName": "BuyAuto Schweiz",
    "url": baseUrl,
    "logo": `${baseUrl}/buyauto-logo.png`,
    "image": `${baseUrl}/buyauto-logo.png`,
    "description": "Die Schweizer Plattform für Leasingübernahmen. Auto-Leasing übernehmen oder vorzeitig verkaufen – schnell, sicher, transparent.",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "CH"
    },
    "sameAs": [
      // Add your social media profiles here when available
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "availableLanguage": ["German", "French", "Italian"]
    }
  };

  // WebSite Schema - Helps with site-wide search presence
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "BuyAuto",
    "alternateName": "BuyAuto Schweiz",
    "url": baseUrl,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${baseUrl}/suche?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  // BreadcrumbList Schema - For homepage navigation
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": baseUrl
      }
    ]
  };

  // Product Schema for individual listings
  const productSchema = listingData ? {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": `${listingData.brand} ${listingData.model} (${listingData.year})`,
    "brand": {
      "@type": "Brand",
      "name": listingData.brand
    },
    "model": listingData.model,
    "image": listingData.images?.map(img => img) || [],
    "offers": {
      "@type": "Offer",
      "price": listingData.price,
      "priceCurrency": "CHF",
      "availability": "https://schema.org/InStock",
      "priceSpecification": {
        "@type": "UnitPriceSpecification",
        "price": listingData.price,
        "priceCurrency": "CHF",
        "unitText": "MON"
      }
    }
  } : null;

  return (
    <Head>
      {/* Organization Schema - Always include for logo display */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />

      {/* WebSite Schema - For homepage */}
      {type === "homepage" && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      )}

      {/* BreadcrumbList Schema - For navigation */}
      {type === "homepage" && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      )}

      {/* Product Schema - For individual listings */}
      {productSchema && type === "listing" && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
      )}
    </Head>
  );
}
