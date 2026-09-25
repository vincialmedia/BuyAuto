import type { GetServerSideProps } from "next";
import { supabase } from "@/integrations/supabase/client";
import { buildListingHref } from "@/lib/buyauto/listingUrl";
import { brandPagesForInventory } from "@/lib/buyauto/leasingBrands";
import { CONTENT_LAST_UPDATED } from "@/lib/buyauto/contentDates";
import { toLocale, type Locale } from "@/i18n/config";
import { listingNeedsTranslation, listingSourceHash } from "@/lib/i18n/listingTranslations";

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

function urlTag(loc: string, lastmod: string | null): string {
  const lastmodTag = lastmod ? `<lastmod>${lastmod}</lastmod>` : "";
  return `
      <url>
        <loc>${loc}</loc>
        ${lastmodTag}
      </url>
    `;
}

// One sitemap per language: /sitemap.xml (German, unchanged) and
// /fr/sitemap.xml, /it/sitemap.xml, /en/sitemap.xml — separate files so each
// language can be submitted and monitored on its own in Search Console.
// hreflang lives in the pages' <head> only (one source, no risk of the two
// disagreeing).
async function localizedSitemap(locale: Exclude<Locale, "de">): Promise<string> {
  const baseUrl = `https://www.buyauto.ch/${locale}`;

  const [{ data: listings, error: listingsError }, { data: translations, error: translationsError }, { data: garageRows }] =
    await Promise.all([
      supabase.from("listings_public").select("id, brand, model, deal_type, title, description, updated_at, created_at"),
      supabase.from("listing_translations").select("listing_id, source_hash").eq("locale", locale),
      supabase.rpc("get_public_garage_slugs"),
    ]);
  if (listingsError) console.error("Sitemap: failed to load listings", listingsError);
  if (translationsError) console.error("Sitemap: failed to load listing translations", translationsError);

  type Row = ListingSitemapRow & { title: string | null; description: string | null };
  const rows = (listings as Row[] | null) || [];
  const translated = new Set(
    ((translations as { listing_id: string; source_hash: string }[] | null) || []).map((t) => `${t.listing_id}:${t.source_hash}`),
  );
  const lastmodOf = (l: ListingSitemapRow) => toSitemapLastmod(l.updated_at ?? l.created_at);
  const newest = rows.map(lastmodOf).filter(Boolean).sort().pop() ?? null;

  const staticUrls = Object.keys(CONTENT_LAST_UPDATED)
    .map((page) => {
      const lastmod = page === "/" || page === "/suche" ? newest ?? CONTENT_LAST_UPDATED[page] : CONTENT_LAST_UPDATED[page];
      return urlTag(`${baseUrl}${page === "/" ? "" : page}`, lastmod);
    })
    .join("");

  // Only listings whose main content exists in this language — the same rule
  // the listing page uses to decide between index and noindex.
  const indexableRows = rows.filter(
    (l) => !listingNeedsTranslation(l) || translated.has(`${l.id}:${listingSourceHash(l.title, l.description)}`),
  );
  const listingUrls = indexableRows
    .map((l) => urlTag(`${baseUrl}${buildListingHref({ id: l.id, brand: l.brand, model: l.model })}`, lastmodOf(l)))
    .join("");

  const takeoverRows = rows.filter((l) => l.deal_type === "lease_takeover");
  const brandUrls = brandPagesForInventory(takeoverRows.map((l) => ({ brand: l.brand, model: null, deal_type: l.deal_type })))
    .map((b) => {
      const brandLastmod =
        takeoverRows.filter((l) => b.dbBrands.includes(l.brand)).map(lastmodOf).filter(Boolean).sort().pop() ?? null;
      return urlTag(`${baseUrl}/leasinguebernahme/${b.slug}`, brandLastmod);
    })
    .join("");

  const garageUrls = (garageRows || [])
    .map((g) => ({ slug: typeof g?.slug === "string" ? g.slug.trim() : "", lastmod: toSitemapLastmod(g?.updated_at ?? null) }))
    .filter((g) => g.slug.length > 0)
    .map((g) => urlTag(`${baseUrl}/${g.slug}`, g.lastmod))
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${staticUrls}
      ${brandUrls}
      ${garageUrls}
      ${listingUrls}
    </urlset>
  `;
}

export const getServerSideProps: GetServerSideProps = async ({ res, locale: requestLocale }) => {
  const locale = toLocale(requestLocale);
  if (locale !== "de") {
    const xml = await localizedSitemap(locale);
    res.setHeader("Content-Type", "text/xml");
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    res.write(xml);
    res.end();
    return { props: {} };
  }

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
    .map((g) => ({
      slug: typeof g?.slug === "string" ? g.slug.trim() : "",
      lastmod: toSitemapLastmod(g?.updated_at ?? null),
    }))
    .filter((g) => g.slug.length > 0);

  const listingRows = (listings as ListingSitemapRow[] | null) || [];

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
      const href = buildListingHref({ id: listing.id, brand: listing.brand, model: listing.model });
      return urlTag(`${baseUrl}${href}`, listingLastmod(listing));
    })
    .join("");

  const garageUrls = garages.map((g) => urlTag(`${baseUrl}/${g.slug}`, g.lastmod)).join("");

  // NOTE: the indexable category views (/suche?dealType=lease_takeover &
  // /suche?dealType=direct_purchase) are intentionally NOT submitted here. Parameterized
  // URLs in a sitemap read as index-bloat; these pages stay self-canonical and are reached
  // via strong internal links (header, footer, home, hub, brand pages), so Google still
  // crawls and indexes them — without the faceted-URL signal.

  // Programmatic brand landing pages — only the brands that actually have at least one
  // live lease_takeover listing (others render noindex, so we keep them out of the map).
  // brandPagesForInventory is alias-aware (Mercedes rows → mercedes-benz page) and adds
  // auto-generated pages for live brands without a curated entry. lastmod = that brand's
  // newest listing change, since the page body is its inventory.
  const takeoverRows = listingRows.filter((l) => l.deal_type === "lease_takeover");

  const brandUrls = brandPagesForInventory(
    takeoverRows.map((l) => ({ brand: l.brand, model: null, deal_type: l.deal_type }))
  )
    .map((b) => {
      const brandLastmod =
        takeoverRows
          .filter((l) => b.dbBrands.includes(l.brand))
          .map(listingLastmod)
          .filter(Boolean)
          .sort()
          .pop() ?? null;
      return urlTag(`${baseUrl}/leasinguebernahme/${b.slug}`, brandLastmod);
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
