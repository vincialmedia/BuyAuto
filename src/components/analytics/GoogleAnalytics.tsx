import { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Script from "next/script";
import {
  loadGtagOnInteraction,
  CONSENT_STORAGE_KEY,
  GA_MEASUREMENT_ID,
  GOOGLE_ADS_ID,
  isAdsEnabled,
  isGaEnabled,
  isTagEnabled,
  pageview,
} from "@/lib/analytics/gtag";
import { rememberAiReferral } from "@/lib/analytics/aiReferral";
import { isChromeFreeRoute } from "@/lib/routes";

/**
 * Loads gtag.js and reports client-side navigations.
 *
 * One script serves both destinations: the GA4 property and the Google Ads
 * conversion/remarketing tag are `config`d separately on the same gtag.js, which
 * is how Google's own multi-product snippet works. Either can be switched off
 * without affecting the other.
 *
 * Consent Mode defaults are NOT set here — they live in `_document.tsx` so they
 * are in the server HTML and provably run before this tag loads. Setting them
 * after gtag.js would leak an unconsented hit.
 */
export function GoogleAnalytics() {
  const router = useRouter();

  // MainLayout strips the cookie banner from chrome-free routes — /embed, which
  // is iframed onto dealer sites, and the Padkos pages, which are a different
  // brand — so consent can never be asked for or given there. Don't load the
  // tag at all rather than load it and stay permanently silent.
  const enabled = isTagEnabled && !isChromeFreeRoute(router.pathname);

  const pendingNavigationIsShallow = useRef(false);
  const initialPageViewHandled = useRef(false);

  // First load only — document.referrer loses the external origin after the first
  // client-side navigation. Runs even when the tag is off so the session still keeps
  // its ai_source marker (the event itself no-ops without a tag).
  useEffect(() => {
    rememberAiReferral();
  }, []);

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

  // gtag.js is the same file whichever ID requests it; the `id` only decides
  // which destination's settings ride along in the response. Ask for whichever
  // product is on, preferring GA4 when both are.
  const scriptId = isGaEnabled ? GA_MEASUREMENT_ID : GOOGLE_ADS_ID;

  // The library itself loads on first interaction (immediately on ad-click
  // landings) — see loadGtagOnInteraction. The config commands below still run
  // at hydration and queue on dataLayer until it arrives.
  useEffect(() => {
    if (!enabled) return;
    return loadGtagOnInteraction(scriptId);
  }, [enabled, scriptId]);

  if (!enabled) return null;

  return (
    <>
      <Script id="ga-config" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          ${
            isGaEnabled
              ? `gtag('config', '${GA_MEASUREMENT_ID}', {
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
          });`
              : ""
          }
          ${
            isAdsEnabled
              ? `// Google Ads. Left to fire its hit immediately, unlike the GA4
          // config above: this is the hit that captures the gclid of an ad
          // click, and holding it until the banner is answered would lose the
          // click-to-conversion link for anyone who navigates away first.
          // Consent Mode keeps it cookieless until ad_storage is granted, and
          // gtag.js writes the linker cookie itself once that update lands.
          gtag('config', '${GOOGLE_ADS_ID}');`
              : ""
          }
        `}
      </Script>
    </>
  );
}

export default GoogleAnalytics;
