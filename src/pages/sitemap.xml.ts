import { GetServerSideProps } from "next";
import { supabase } from "@/integrations/supabase/client";
import { buildListingHref } from "@/lib/buyauto/listingUrl";

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const baseUrl = "https://www.buyauto.ch";
  const lastmod = new Date().toISOString();

  const { data: listings } = await supabase
    .from("listings")
    .select("id")
    .in("status", ["published"]);

  const { data: garageRows } = await supabase.rpc("get_public_garage_slugs");

  const garages = (garageRows || [])
    .map((g) => (typeof g?.slug === "string" ? g.slug.trim() : ""))
    .filter((slug) => slug.length > 0);

  const staticPages = [
    "",
    "/suche",
    "/inserat-erstellen",
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
        <lastmod>${lastmod}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>${page === "" ? "1.0" : "0.8"}</priority>
      </url>
    `;
    })
    .join("");

  const listingUrls = (listings || [])
    .map((listing) => {
      return `
      <url>
        <loc>${baseUrl}/fahrzeug/${listing.id}</loc>
        <lastmod>${lastmod}</lastmod>
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
        <lastmod>${lastmod}</lastmod>
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

  return {
    props: {},
  };
};

export default function Sitemap() {
  return null;
}