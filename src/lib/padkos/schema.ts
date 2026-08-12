/**
 * JSON-LD builders for the Padkos shop, following current Google guidance:
 * Product + Offer (merchant listing eligibility), BreadcrumbList, and an
 * OnlineStore Organization with return-policy and shipping details. FAQPage
 * is deliberately absent — Google deprecated FAQ rich results.
 */

import type { PadkosProduct } from "./catalog";
import { COOLED_SURCHARGE, SHIP_COST, SHIP_FREE } from "./catalog";
import { PADKOS, padkosCanonical } from "./routes";

export function onlineStoreSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: "Padkos",
    url: padkosCanonical(PADKOS.home),
    description:
      "Südafrikanische Lebensmittel aus Wien: Biltong, Boerewors, Mrs Ball's Chutney, Ouma Rusks & mehr – Versand in ganz Österreich.",
    email: "hallo@padkos.at",
    telephone: "+43 1 907 12 34",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Neubaugasse 12",
      postalCode: "1070",
      addressLocality: "Wien",
      addressCountry: "AT",
    },
    hasMerchantReturnPolicy: {
      "@type": "MerchantReturnPolicy",
      applicableCountry: "AT",
      returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
      merchantReturnDays: 14,
      returnMethod: "https://schema.org/ReturnByMail",
      returnFees: "https://schema.org/ReturnShippingFees",
    },
  };
}

export function webSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Padkos",
    url: padkosCanonical(PADKOS.home),
    inLanguage: "de-AT",
  };
}

export function productSchema(product: PadkosProduct) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    description: product.desc,
    category: product.cat,
    url: padkosCanonical(PADKOS.produkt(product.sku)),
    offers: {
      "@type": "Offer",
      price: product.price.toFixed(2),
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      url: padkosCanonical(PADKOS.produkt(product.sku)),
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "AT",
        },
        shippingRate: {
          "@type": "MonetaryAmount",
          // Cooled products always carry the chilled surcharge on top of the
          // base rate (the threshold below waives only the base rate).
          value: product.cooled ? SHIP_COST + COOLED_SURCHARGE : SHIP_COST,
          currency: "EUR",
        },
        freeShippingThreshold: {
          "@type": "MonetaryAmount",
          value: SHIP_FREE,
          currency: "EUR",
        },
      },
    },
  };
}

export function breadcrumbSchema(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: padkosCanonical(item.path),
    })),
  };
}
