import type { GetServerSideProps } from "next";
import { supabase } from "@/integrations/supabase/client";
import { buildListingHref } from "@/lib/buyauto/listingUrl";

type ListingSitemapRow = {
  id: string;
  brand: string;
  model: string;
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
    .select("id, brand, model, updated_at, created_at");

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
    "/leasing-concierge",
    "/leasinguebernahme",
    "/leasinguebernahme-kosten",
    "/leasingvertrag-uebertragen",
    "/leasinguebernahme-vs-neues-leasing",
    "/leasinguebernahme-vs-autoabo",
    "/auto-abo-kuendigen",
    "/auto-abo-vs-leasing-kosten",
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

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${staticUrls}
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