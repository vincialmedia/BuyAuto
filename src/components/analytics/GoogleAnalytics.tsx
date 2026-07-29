import { useEffect } from "react";
import { useRouter } from "next/router";
import Script from "next/script";
import {
  CONSENT_STORAGE_KEY,
  GA_MEASUREMENT_ID,
  isGaEnabled,
  pageview,
} from "@/lib/analytics/gtag";

/**
 * Loads gtag.js and reports client-side navigations.
 *
 * Consent Mode defaults are NOT set here — they live in `_document.tsx` so they
 * are in the server HTML and provably run before this tag loads. Setting them
 * after gtag.js would leak an unconsented hit.
 */
export function GoogleAnalytics() {
  const router = useRouter();

  useEffect(() => {
    if (!isGaEnabled) return;

    // The `config` call below fires the page view for the initial load — or
    // holds it for setConsent when the banner has not been answered yet — so
    // only subsequent route changes are sent from here.
    const handleRouteChange = (url: string) => pageview(url);

    router.events.on("routeChangeComplete", handleRouteChange);
    // Hash-only navigations don't emit routeChangeComplete but are real page
    // views for our anchor-heavy SEO pages.
    router.events.on("hashChangeComplete", handleRouteChange);

    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
      router.events.off("hashChangeComplete", handleRouteChange);
    };
  }, [router.events]);

  if (!isGaEnabled) return null;

  return (
    <>
      <Script
        id="ga-lib"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-config" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            anonymize_ip: true,
            // Only let gtag.js fire its automatic page view when the visitor
            // has already decided. Sent before that, the hit goes out
            // cookieless and is never re-sent once they accept — setConsent
            // releases exactly one hit at the moment they choose instead.
            // Storage is read inline because this runs as a raw script.
            send_page_view: (function () {
              try {
                var c = window.localStorage.getItem('${CONSENT_STORAGE_KEY}');
                return c === 'granted' || c === 'denied';
              } catch (e) {
                return false;
              }
            })()
          });
        `}
      </Script>
    </>
  );
}

export default GoogleAnalytics;
