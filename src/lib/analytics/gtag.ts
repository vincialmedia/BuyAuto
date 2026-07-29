// Google Analytics 4 (gtag.js) wiring.
//
// The measurement ID is inlined at build time, so it must be referenced as a
// full literal `process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID` — a computed lookup
// would come back undefined in the browser bundle.
export const GA_MEASUREMENT_ID = (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "").trim();

// Everything below no-ops when the ID is unset, so preview/local builds without
// the env var behave exactly as they did before GA existed.
export const isGaEnabled = /^G-[A-Z0-9]+$/i.test(GA_MEASUREMENT_ID);

// Bumped from the legacy `buyauto_cookie_consent` key on purpose: that banner
// had no reject path and gated nothing, so a "true" stored under it is not
// consent to analytics cookies. Returning visitors are asked once more.
export const CONSENT_STORAGE_KEY = "buyauto_consent_v2";

// Same-tab notification so the consent banner and any other listener stay in
// sync without a reload (the `storage` event only fires in *other* tabs).
export const CONSENT_CHANGE_EVENT = "buyauto:consent-change";

export type ConsentChoice = "granted" | "denied";

type GtagArgs =
  | ["js", Date]
  | ["config", string, Record<string, unknown>?]
  | ["event", string, Record<string, unknown>?]
  | ["consent", "default" | "update", Record<string, unknown>];

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: GtagArgs) => void;
  }
}

function gtag(...args: GtagArgs) {
  if (typeof window === "undefined") return;
  // Push directly rather than through window.gtag: the queue exists from the
  // consent bootstrap in _document, while window.gtag is only replaced once
  // gtag.js has actually downloaded. Pushing works in both states.
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(args);
}

export function readStoredConsent(): ConsentChoice | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return stored === "granted" || stored === "denied" ? stored : null;
  } catch {
    // Private-mode Safari and hardened browsers throw on localStorage access.
    // No stored choice means the banner shows again, which is the safe default.
    return null;
  }
}

/**
 * Persists the visitor's choice and tells Google Consent Mode about it. Consent
 * Mode is already defaulted to "denied" in _document, so until this runs GA
 * sends cookieless pings only.
 */
export function setConsent(choice: ConsentChoice) {
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
  } catch {
    // Choice is not persisted, but honour it for this page view regardless.
  }

  gtag("consent", "update", {
    ad_storage: choice,
    ad_user_data: choice,
    ad_personalization: choice,
    analytics_storage: choice,
  });

  window.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT, { detail: choice }));
}

/**
 * SPA page view. gtag.js only auto-tracks the initial load, so every subsequent
 * client-side navigation has to be sent by hand or the whole site looks like a
 * single-page session.
 */
export function pageview(url: string) {
  if (!isGaEnabled) return;
  gtag("event", "page_view", {
    page_path: url,
    page_location: typeof window !== "undefined" ? window.location.href : undefined,
    page_title: typeof document !== "undefined" ? document.title : undefined,
  });
}

/** Custom event helper, for funnel tracking (`trackEvent("listing_published")`). */
export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (!isGaEnabled) return;
  gtag("event", name, params);
}
