import type { GetServerSideProps } from "next";

import { PRODUCTS } from "@/lib/padkos/catalog";
import { PADKOS, PADKOS_INDEXABLE, padkosCanonical } from "@/lib/padkos/routes";

/**
 * Padkos-only sitemap (separate from BuyAuto's /sitemap.xml — different
 * brand, and on its own domain this becomes the whole sitemap). Lists only
 * indexable pages: checkout, account, wishlist, order, login, dashboard and
 * the 404 are noindex by design. While the shop is not indexable at all
 * (NEXT_PUBLIC_PADKOS_INDEXABLE unset) the sitemap is served empty.
 */
const PAGES = [
  PADKOS.home,
  PADKOS.en,
  PADKOS.shop,
  PADKOS.versand,
  PADKOS.kontakt,
  PADKOS.rechtliches,
];

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const urls = PADKOS_INDEXABLE
    ? [...PAGES, ...PRODUCTS.map((p) => PADKOS.produkt(p.sku))]
    : [];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((path) => `  <url><loc>${padkosCanonical(path)}</loc></url>`).join("\n")}
</urlset>`;

  res.setHeader("Content-Type", "application/xml");
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  res.write(xml);
  res.end();
  return { props: {} };
};

export default function PadkosSitemap() {
  return null;
}
