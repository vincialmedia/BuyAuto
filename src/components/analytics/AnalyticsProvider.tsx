import { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import {
  flushLoginEvent,
  initAnalytics,
  isAnalyticsInitialized,
  setUser,
  toUserRole,
  track,
  trackPageView,
  updatePageLocation,
} from "@/lib/analytics";
import { extractListingIdFromParam } from "@/lib/buyauto/listingUrl";
import { localizePath, toLocale } from "@/i18n/config";

/**
 * Loads GA4 once and sends exactly one page_view per page.
 *
 * Mounted last inside AuthProvider in _app, so by the time its effects run the
 * page has committed and next/head has written document.title.
 *
 * Initialisation waits until auth has resolved (session + profile). gtag.js is
 * only fetched on first interaction anyway, so nothing is sent later than
 * before — but an admin is recognised before anything is queued, and never
 * produces a hit.
 *
 * Page views: the landing page, then every non-shallow navigation. Shallow URL
 * updates (/suche filters and pagination, the wizard's ?draft= sync) are the
 * same page with new state and are covered by events (`search`,
 * `listing_step`) — counting them as page views is what inflated /suche.
 */
export function AnalyticsProvider() {
  const router = useRouter();
  const { user, profile, loading, profileLoading } = useAuth();

  const authResolved = !loading && (!user || !profileLoading);
  const role = user ? toUserRole(profile?.role) : null;

  const pendingNavigationIsShallow = useRef(false);
  const lastTrackedPath = useRef<string | null>(null);
  const pageRef = useRef({ pathname: router.pathname, query: router.query });
  pageRef.current = { pathname: router.pathname, query: router.query };

  // Identity first: the role decides whether tracking runs at all.
  useEffect(() => {
    if (!authResolved) return;
    setUser(user?.id ?? null, role);
    if (user) flushLoginEvent();
  }, [authResolved, user, role]);

  useEffect(() => {
    // Recorded on *Start*: Next emits Complete only after the React commit, so
    // a Complete handler would run after the asPath effect below.
    const recordShallow = (_url: string, opts?: { shallow?: boolean }) => {
      pendingNavigationIsShallow.current = Boolean(opts?.shallow);
    };
    router.events.on("routeChangeStart", recordShallow);
    router.events.on("hashChangeStart", recordShallow);
    return () => {
      router.events.off("routeChangeStart", recordShallow);
      router.events.off("hashChangeStart", recordShallow);
    };
  }, [router.events]);

  useEffect(() => {
    if (!authResolved || !router.isReady) return;
    // router.asPath has no language prefix (/fr/preise reads "/preise"); put it
    // back so fr/it/en page views keep their real URL, like the landing view,
    // which is read from window.location.
    const path = localizePath(router.asPath, toLocale(router.locale));

    if (initAnalytics()) {
      lastTrackedPath.current = path;
      trackPageView(path);
      return;
    }
    if (!isAnalyticsInitialized() || path === lastTrackedPath.current) return;

    lastTrackedPath.current = path;
    updatePageLocation(path);
    // Hash-only changes and shallow query updates are not new pages.
    if (pendingNavigationIsShallow.current) return;
    trackPageView(path);
  }, [router.asPath, router.locale, router.isReady, authResolved]);

  // tel:, mailto: and WhatsApp links on listing and dealer pages. One
  // delegated listener instead of per-link handlers, so contact options added
  // later are measured without extra code. The href itself is never sent (it
  // is the seller's phone number or e-mail).
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const anchor = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;

      const { pathname, query } = pageRef.current;
      const isListingPage = pathname === "/fahrzeug/[id]";
      if (!isListingPage && pathname !== "/[dealerSlug]") return;

      const href = anchor.getAttribute("href") ?? "";
      let method: "phone" | "whatsapp" | "email" | null = null;
      if (/^tel:/i.test(href)) method = "phone";
      else if (/^mailto:/i.test(href)) method = "email";
      else if (/^(https?:)?\/\/(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)\//i.test(href) || /^whatsapp:/i.test(href)) {
        method = "whatsapp";
      }
      if (!method) return;

      const rawId = typeof query.id === "string" ? query.id : null;
      const listingId = isListingPage && rawId ? extractListingIdFromParam(rawId) || undefined : undefined;
      track("contact_click", { contact_method: method, listing_id: listingId });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}

export default AnalyticsProvider;
