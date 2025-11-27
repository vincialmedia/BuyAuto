import { GetServerSideProps } from "next";
import { supabase } from "@/integrations/supabase/client";

function generateSiteMap(listings: any[]) {
  const baseUrl = "https://buyauto.ch";
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Static Pages -->
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/suche</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/leasinguebernahme</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/datenschutz</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${baseUrl}/agb</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  
  <!-- Dynamic Vehicle Listings -->
  ${listings
    .map((listing) => {
      return `
  <url>
    <loc>${baseUrl}/fahrzeug/${listing.id}</loc>
    <lastmod>${new Date(listing.updated_at || listing.created_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    })
    .join("")}
</urlset>`;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  try {
    // Fetch all active listings from Supabase
    const { data: listings, error } = await supabase
      .from("listings")
      .select("id, created_at, updated_at")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching listings for sitemap:", error);
      // Return empty listings array if there's an error
      const sitemap = generateSiteMap([]);
      
      res.setHeader("Content-Type", "text/xml");
      res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
      res.write(sitemap);
      res.end();

      return {
        props: {},
      };
    }

    // Generate the XML sitemap with the listings data
    const sitemap = generateSiteMap(listings || []);

    res.setHeader("Content-Type", "text/xml");
    // Cache for 1 hour, revalidate in background for 24 hours
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    res.write(sitemap);
    res.end();

    return {
      props: {},
    };
  } catch (error) {
    console.error("Sitemap generation error:", error);
    
    // Fallback: generate sitemap with static pages only
    const sitemap = generateSiteMap([]);
    
    res.setHeader("Content-Type", "text/xml");
    res.write(sitemap);
    res.end();

    return {
      props: {},
    };
  }
};

export default function Sitemap() {
  // This component will never be rendered
  return null;
}
