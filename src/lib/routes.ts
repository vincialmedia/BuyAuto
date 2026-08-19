/**
 * Route predicates shared by the layout, the app shell and the analytics tag.
 *
 * They live here rather than in a component so that non-visual consumers (the
 * gtag loader) do not have to import a layout to ask a question about the URL.
 */

/**
 * Routes belonging to a brand that is not BuyAuto — currently Padkos, a South
 * African grocer in Vienna, whose landing page lives in this repo.
 *
 * These pages get none of BuyAuto's identity: no header, and no BuyAuto
 * structured data, share image, or product analytics, all of which would
 * otherwise claim another company's page for buyauto.ch.
 */
export function isOtherBrandRoute(pathname: string): boolean {
  return pathname === "/padkos" || pathname.startsWith("/padkos/");
}

/**
 * Routes that render their own document shell and must get no BuyAuto chrome —
 * no site header, footer, cookie banner, route-progress bar, or wrapping
 * <main> (these pages render their own): other-brand pages, plus /embed, which
 * is iframed onto dealers' own sites.
 *
 * Each segment is matched exactly so a greedy prefix like "/embedded-..." does
 * not silently lose its chrome.
 *
 * Note for anything consent-dependent: these are exactly the routes with no
 * cookie banner, so consent can never be asked for or given on them.
 */
export function isChromeFreeRoute(pathname: string): boolean {
  return (
    isOtherBrandRoute(pathname) ||
    pathname === "/embed" ||
    pathname.startsWith("/embed/")
  );
}
