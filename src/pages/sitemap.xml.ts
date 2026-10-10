import type { GetServerSideProps } from "next";
import { supabase } from "@/integrations/supabase/client";
import { buildListingHref } from "@/lib/buyauto/listingUrl";
import { indexableBrandPages } from "@/lib/buyauto/leasingBrands";
import { BRAND_PAGES_CONTENT_UPDATED, CONTENT_LAST_UPDATED } from "@/lib/buyauto/contentDates";
import { getPublicOfferIndex, liveTakeovers, type PublicOffer } from "@/services/listingsService";

/** Canonical Leasingübernahme hub (self-canonical category view of /suche). */
const LEASE_TAKEOVER_HUB_PATH = "/suche?dealType=lease_takeover";

type ListingSitemapRow = Pick<PublicOffer, "id" | "brand" | "model" | "updated_at" | "created_at">;

function toSitemapLastmod(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function urlTag(loc: string, lastmod: string | null): string {
  const lastmodTag = lastmod ? `<lastmod>${lastmod}</lastmod>` : "";
  return `
      <url>
        <loc>${loc}</loc>
        ${lastmodTag}
      </url>
    `;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const baseUrl = "https://www.buyauto.ch";

  // Source from the listings_public view (via the Kaufart-resolving offer index) so the
  // sitemap equals exactly what renders: published, not expired. A Leasingübernahme
  // whose contract has run out is no live offer and is left out.
  let offers: PublicOffer[];
  try {
    offers = await getPublicOfferIndex();
  } catch (listingsError) {
    // Never serve (and let the CDN cache) a sitemap without listings and brand pages.
    console.error("Sitemap: failed to load listings", listingsError);
    res.statusCode = 503;
    res.setHeader("Retry-After", "300");
    res.setHeader("Cache-Control", "no-store");
    res.end();
    return { props: {} };
  }
  const listings = offers.filter((o) => o.offer.isLiveOffer);

  const { data: garageRows, error: garageError } = await supabase.rpc("get_public_garage_slugs");

  if (garageError) {
    // Same rule as above: no partial sitemap (here: without the dealer pages).
    console.error("Sitemap: failed to load garage slugs", garageError);
    res.statusCode = 503;
    res.setHeader("Retry-After", "300");
    res.setHeader("Cache-Control", "no-store");
    res.end();
    return { props: {} };
  }

  const garages = (garageRows || [])
    .map((g) => ({
      slug: typeof g?.slug === "string" ? g.slug.trim() : "",
      lastmod: toSitemapLastmod(g?.updated_at ?? null),
    }))
    .filter((g) => g.slug.length > 0);

  const listingRows: ListingSitemapRow[] = listings;

  const listingLastmod = (l: ListingSitemapRow) => toSitemapLastmod(l.updated_at ?? l.created_at);

  // Home and /suche are inventory surfaces: their content moves with the newest listing,
  // which is a more honest freshness signal than a hand-maintained date.
  const newestListingLastmod = listingRows.map(listingLastmod).filter(Boolean).sort().pop() ?? null;

  const staticPages = Object.keys(CONTENT_LAST_UPDATED);

  const staticUrls = staticPages
    .map((page) => {
      const lastmod =
        page === "/" || page === "/suche"
          ? newestListingLastmod ?? CONTENT_LAST_UPDATED[page]
          : CONTENT_LAST_UPDATED[page];
      return urlTag(`${baseUrl}${page === "/" ? "" : page}`, lastmod);
    })
    .join("");

  const listingUrls = listingRows
    .map((listing) => {
      const href = buildListingHref({ id: listing.id, brand: listing.brand ?? "", model: listing.model ?? "" });
      return urlTag(`${baseUrl}${href}`, listingLastmod(listing));
    })
    .join("");

  const garageUrls = garages.map((g) => urlTag(`${baseUrl}/${g.slug}`, g.lastmod)).join("");

  // Programmatic brand landing pages — only the INDEXABLE ones (enough live
  // Leasingübernahmen by the Kaufart rule; thinner pages render noindex and stay out
  // of the map). indexableBrandPages is alias-aware (Mercedes rows -> mercedes-benz).
  // lastmod = the later of that brand's newest takeover change (the page body is its
  // inventory) and the last edit of the brand page content (BRAND_PAGES_CONTENT_UPDATED).
  const takeoverRows = liveTakeovers(offers);

  const brandUrls = indexableBrandPages(takeoverRows)
    .map((b) => {
      const brandLastmod =
        [
          BRAND_PAGES_CONTENT_UPDATED,
          ...takeoverRows
            .filter((l) => typeof l.brand === "string" && b.dbBrands.includes(l.brand))
            .map(listingLastmod),
        ]
          .filter(Boolean)
          .sort()
          .pop() ?? null;
      return urlTag(`${baseUrl}/leasinguebernahme/${b.slug}`, brandLastmod);
    })
    .join("");

  // The Leasingübernahme hub is the canonical takeover category page
  // (/suche?dealType=lease_takeover is self-canonical), so it is submitted like
  // any content page. Its body is the live takeover inventory, so lastmod is the
  // newest takeover change. The "&" must be escaped in XML. An empty hub renders
  // noindex (soft-404 guard in suche.tsx), so it is only listed with live takeovers.
  const hubLastmod = takeoverRows.map(listingLastmod).filter(Boolean).sort().pop() ?? null;
  const hubUrl =
    takeoverRows.length > 0
      ? urlTag(`${baseUrl}${LEASE_TAKEOVER_HUB_PATH.replace(/&/g, "&amp;")}`, hubLastmod)
      : "";

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${staticUrls}
      ${hubUrl}
      ${brandUrls}
      ${garageUrls}
      ${listingUrls}
    </urlset>
  `;

  res.setHeader("Content-Type", "text/xml");
  // The two Supabase queries above run per uncached hit; crawlers poll sitemaps often,
  // so let the CDN absorb repeats.
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  res.write(sitemap);
  res.end();

  return { props: {} };
};

export default function Sitemap() {
  return null;
}
