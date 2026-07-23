import type { GetServerSideProps } from "next";
import { supabase } from "@/integrations/supabase/client";
import { buildListingHref } from "@/lib/buyauto/listingUrl";
import { LEASING_BRANDS } from "@/lib/buyauto/leasingBrands";

type ListingSitemapRow = {
  id: string;
  brand: string;
  model: string;
  deal_type: string | null;
  updated_at: string | null;
  created_at: string | null;
};

function toSitemapLastmod(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const baseUrl = "https://www.buyauto.ch";

  // Source from the listings_public view so the sitemap equals exactly what renders:
  // it already filters to status='published', not expired, and (via the is_internal
  // safeguard) excludes internal/test accounts. No manual status filter here.
  const { data: listings, error: listingsError } = await supabase
    .from("listings_public")
    .select("id, brand, model, deal_type, updated_at, created_at");

  if (listingsError) {
    console.error("Sitemap: failed to load listings", listingsError);
  }

  const { data: garageRows, error: garageError } = await supabase.rpc("get_public_garage_slugs");

  if (garageError) {
    console.error("Sitemap: failed to load garage slugs", garageError);
  }

  const garages = (garageRows || [])
    .map((g) => (typeof g?.slug === "string" ? g.slug.trim() : ""))
    .filter((slug) => slug.length > 0);

  const staticPages = [
    "",
    "/suche",
    "/preise",
    "/leasing-concierge",
    "/leasinguebernahme",
    "/leasinguebernahme-kosten",
    "/leasingvertrag-uebertragen",
    "/leasinguebernahme-vs-neues-leasing",
    "/leasinguebernahme-vs-autoabo",
    "/auto-abo-kuendigen",
    "/auto-abo-vs-leasing-kosten",
    "/eintauschwert-rechner",
    "/leasing-abgeben-schweiz",
    "/autoscout24-alternative-leasinguebernahme",
    "/carify-alternativen",
    "/auto-abos-im-vergleich",
    "/datenschutz",
    "/agb",
  ];

  const staticUrls = staticPages
    .map((page) => {
      return `
      <url>
        <loc>${baseUrl}${page}</loc>
        <changefreq>weekly</changefreq>
        <priority>${page === "" ? "1.0" : "0.8"}</priority>
      </url>
    `;
    })
    .join("");

  const listingUrls = ((listings as ListingSitemapRow[] | null) || [])
    .map((listing) => {
      const href = buildListingHref({ id: listing.id, brand: listing.brand, model: listing.model });
      const lastmod = toSitemapLastmod(listing.updated_at ?? listing.created_at);
      const lastmodTag = lastmod ? `<lastmod>${lastmod}</lastmod>` : "";

      return `
      <url>
        <loc>${baseUrl}${href}</loc>
        ${lastmodTag}
        <changefreq>daily</changefreq>
        <priority>0.9</priority>
      </url>
    `;
    })
    .join("");

  const garageUrls = garages
    .map((slug) => {
      return `
      <url>
        <loc>${baseUrl}/${slug}</loc>
        <changefreq>weekly</changefreq>
        <priority>0.7</priority>
      </url>
    `;
    })
    .join("");

  // NOTE: the indexable category views (/suche?dealType=lease_takeover &
  // /suche?dealType=direct_purchase) are intentionally NOT submitted here. Parameterized
  // URLs in a sitemap read as index-bloat; these pages stay self-canonical and are reached
  // via strong internal links (header, footer, home, hub, brand pages), so Google still
  // crawls and indexes them — without the faceted-URL signal.

  // Programmatic brand landing pages — only the brands that actually have at least one
  // live lease_takeover listing (others render noindex, so we keep them out of the map).
  const takeoverBrandSet = new Set(
    ((listings as ListingSitemapRow[] | null) || [])
      .filter((l) => l.deal_type === "lease_takeover" && typeof l.brand === "string" && l.brand.trim() !== "")
      .map((l) => l.brand)
  );

  const brandUrls = LEASING_BRANDS.filter((b) => takeoverBrandSet.has(b.name))
    .map((b) => {
      return `
      <url>
        <loc>${baseUrl}/leasinguebernahme/${b.slug}</loc>
        <changefreq>daily</changefreq>
        <priority>0.7</priority>
      </url>
    `;
    })
    .join("");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${staticUrls}
      ${brandUrls}
      ${garageUrls}
      ${listingUrls}
    </urlset>
  `;

  res.setHeader("Content-Type", "text/xml");
  res.write(sitemap);
  res.end();

  return { props: {} };
};

export default function Sitemap() {
  return null;
}