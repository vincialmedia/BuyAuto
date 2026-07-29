import { useEffect, useRef } from "react";
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

  // /embed pages are iframed onto dealer sites, where MainLayout strips the
  // cookie banner — so consent can never be asked for or given there. Don't
  // load the tag at all rather than load it and stay permanently silent.
  const isEmbed =
    router.pathname === "/embed" || router.pathname.startsWith("/embed/");
  const enabled = isGaEnabled && !isEmbed;

  const pendingNavigationIsShallow = useRef(false);
  const initialPageViewHandled = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    // Recorded on *Start*, not *Complete*: Next emits Complete only after the
    // React commit (router.js awaits set() first), so a Complete handler would
    // run after the asPath effect below had already read a stale flag.
    const recordShallow = (_url: string, opts?: { shallow?: boolean }) => {
      pendingNavigationIsShallow.current = Boolean(opts?.shallow);
    };

    router.events.on("routeChangeStart", recordShallow);
    // Hash-only navigations take a separate branch in the router but do update
    // asPath, so they reach the effect below too.
    router.events.on("hashChangeStart", recordShallow);

    return () => {
      router.events.off("routeChangeStart", recordShallow);
      router.events.off("hashChangeStart", recordShallow);
    };
  }, [router.events, enabled]);

  // Keyed on asPath rather than driven straight off the router event so the hit
  // is built after the page has committed: next/head writes document.title in a
  // passive effect belonging to the page, and this component is mounted after
  // <Component/> in _app, so that title is already in the DOM by the time this
  // runs. Reading it in a routeChangeComplete handler gave the *previous*
  // page's title whenever the incoming page was slow to commit.
  useEffect(() => {
    if (!enabled) return;

    // The initial page view comes from the `config` call below, or from
    // setConsent once the banner is answered.
    if (!initialPageViewHandled.current) {
      initialPageViewHandled.current = true;
      return;
    }

    // Shallow navigations are the same page with new query state: /suche
    // filters, pagination and reset, plus every step of the listing wizard.
    // Counting them as page views multiplies those pages' traffic. Reach for
    // trackEvent if a particular one is worth reporting.
    if (pendingNavigationIsShallow.current) return;

    pageview(router.asPath);
  }, [router.asPath, enabled]);

  if (!enabled) return null;

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
