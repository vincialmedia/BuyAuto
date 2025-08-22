import Head from "next/head";
import { SearchQuery, SearchResult, formatPrice } from "@/lib/buyauto/search";

interface SeoHeadProps {
  searchResults: SearchResult | null;
  searchQuery: SearchQuery;
}

export default function SeoHead({ searchResults, searchQuery }: SeoHeadProps) {
  // Generate JSON-LD structured data for search results
  const generateJsonLd = () => {
    if (!searchResults || searchResults.items.length === 0) return null;

    const itemListElement = searchResults.items.map((listing, index) => ({
      "@type": "ListItem",
      "position": (searchResults.page - 1) * searchResults.pageSize + index + 1,
      "url": `${process.env.NODE_ENV === 'production' ? 'https://buyauto.ch' : 'http://localhost:3000'}/fahrzeug/${listing.id}`,
      "name": `${listing.brand} ${listing.model}${listing.title ? ` ${listing.title}` : ''} (${listing.year})`,
      "item": {
        "@type": "Car",
        "name": `${listing.brand} ${listing.model}`,
        "brand": {
          "@type": "Brand",
          "name": listing.brand
        },
        "model": listing.model,
        "vehicleModelDate": listing.year,
        "mileageFromOdometer": {
          "@type": "QuantitativeValue",
          "value": listing.mileageKm,
          "unitText": "km"
        },
        "fuelType": listing.fuel,
        "vehicleTransmission": listing.gearbox,
        "bodyType": listing.body,
        "offers": {
          "@type": "Offer",
          "price": listing.pricePerMonthCHF,
          "priceCurrency": "CHF",
          "availability": "https://schema.org/InStock",
          "priceSpecification": {
            "@type": "UnitPriceSpecification",
            "price": listing.pricePerMonthCHF,
            "priceCurrency": "CHF",
            "unitText": "MON"
          }
        }
      }
    }));

    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "numberOfItems": searchResults.total,
      "itemListElement": itemListElement
    };
  };

  const jsonLd = generateJsonLd();

  return (
    <>
      {jsonLd && (
        <Head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        </Head>
      )}
    </>
  );
}