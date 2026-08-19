// Google tag (gtag.js) wiring — GA4 and Google Ads share one tag.
//
// The measurement ID is inlined at build time, so it must be referenced as a
// full literal `process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID` — a computed lookup
// would come back undefined in the browser bundle.
// Ships with the buyauto.ch property's ID compiled in, same reasoning as the
// Ads ID below: the GA4 property exists and reporting depends on the tag, so a
// missing env var on a deployment must not silently switch it off. The env var
// overrides (set it to an empty string to disable GA, e.g. on a fork or in
// local dev).
// Surrounding quotes are stripped: pasting `"G-XXXX"` into a Vercel env var is
// an easy mistake and would otherwise fail the check below and disable GA with
// no visible symptom.
const RAW_GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
export const GA_MEASUREMENT_ID = (RAW_GA_ID === undefined ? "G-6GJ6D58G1S" : RAW_GA_ID)
  .trim()
  .replace(/^["']|["']$/g, "");

// Everything below no-ops when the resolved ID is empty or malformed (env var
// explicitly set to "" — the local-dev default via .env.local — or a typo'd
// override), so such builds behave exactly as they did before GA existed.
export const isGaEnabled = /^G-[A-Z0-9]+$/i.test(GA_MEASUREMENT_ID);

if (typeof window !== "undefined" && GA_MEASUREMENT_ID && !isGaEnabled) {
  // Set but unusable. Silence here means an hour of staring at an empty GA
  // dashboard, so say it out loud in the one place someone will look.
  console.warn(
    `[analytics] NEXT_PUBLIC_GA_MEASUREMENT_ID is set to "${GA_MEASUREMENT_ID}" but is not a valid GA4 ID (expected G-XXXXXXXXXX). Google Analytics is disabled.`,
  );
}

// Google Ads conversion/remarketing tag. Ships with a default for the same
// reason as the GA4 ID above: the account it belongs to is fixed for buyauto.ch
// and the campaigns depend on it being live in production, so it must not
// silently vanish when an env var is missing from a deployment. The override
// exists so a fork or a test account can point somewhere else — set it to an
// empty string to switch Ads off.
// NEXT_PUBLIC_GADS_ID is the canonical override (format "AW-XXXXXXXXX");
// NEXT_PUBLIC_GOOGLE_ADS_ID is honoured for backwards compatibility. Every
// consumer — the base tag config and each conversion's send_to — resolves the
// ID from this one value, so the two can never diverge.
const RAW_ADS_ID = process.env.NEXT_PUBLIC_GADS_ID ?? process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
export const GOOGLE_ADS_ID = (RAW_ADS_ID === undefined ? "AW-18317910859" : RAW_ADS_ID)
  .trim()
  .replace(/^["']|["']$/g, "");

export const isAdsEnabled = /^AW-[0-9]+$/i.test(GOOGLE_ADS_ID);

if (typeof window !== "undefined" && GOOGLE_ADS_ID && !isAdsEnabled) {
  console.warn(
    `[analytics] NEXT_PUBLIC_GADS_ID / NEXT_PUBLIC_GOOGLE_ADS_ID is set to "${GOOGLE_ADS_ID}" but is not a valid Google Ads ID (expected AW-XXXXXXXXX). Google Ads tracking is disabled.`,
  );
}

// gtag.js is loaded once and configured per destination, so the script itself is
// needed as soon as either product is switched on.
export const isTagEnabled = isGaEnabled || isAdsEnabled;

// Bumped from the legacy `buyauto_cookie_consent` key on purpose: that banner
// had no reject path and gated nothing, so a "true" stored under it is not
// consent to analytics cookies. Returning visitors are asked once more.
export const CONSENT_STORAGE_KEY = "buyauto_consent_v2";

// Same-tab notification so the consent banner and any other listener stay in
// sync without a reload (the `storage` event only fires in *other* tabs).
export const CONSENT_CHANGE_EVENT = "buyauto:consent-change";

// Raised by reopenConsent() so a footer link can bring the banner back.
export const CONSENT_REOPEN_EVENT = "buyauto:consent-reopen";

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
  // Must go through the shim rather than pushing onto dataLayer directly:
  // gtag.js only recognises a pushed `arguments` object, and an Array is NOT
  // equivalent — it lands on the queue and is silently ignored. Calling the
  // shim (installed in _document, later replaced by gtag.js itself) is what
  // constructs a real arguments object.
  window.gtag?.(...args);
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

// True until the visitor answers the banner. While it holds, the `config` call
// in GoogleAnalytics is told `send_page_view: false`, because a page view sent
// before the choice goes out cookieless and gtag.js never re-sends it once
// consent arrives — which is why accepting used to register nothing until the
// visitor reloaded or navigated. setConsent owns that held-back hit and
// releases exactly one, so a page load still yields one page_view either way.
let pageViewHeldForConsent =
  typeof window !== "undefined" && readStoredConsent() === null;

/**
 * Tells Google Consent Mode the choice and releases the page view that was held
 * back while it was pending. Storage is deliberately not touched here — the
 * cross-tab path arrives with storage already written by the other tab.
 */
function applyConsent(choice: ConsentChoice) {
  gtag("consent", "update", {
    ad_storage: choice,
    ad_user_data: choice,
    ad_personalization: choice,
    analytics_storage: choice,
  });

  // Both commands land on the same dataLayer queue and gtag.js drains it in
  // order, so this hit is built with the state above already applied: cookied
  // on "granted", a cookieless ping on "denied" — the same hit a returning
  // visitor with that choice already stored would have sent at load. Sent on
  // "denied" too on purpose; that path produces one ping today and must keep
  // producing one.
  if (pageViewHeldForConsent) {
    pageViewHeldForConsent = false;
    // First cookied hit of the session, so GA4 derives acquisition from it.
    // Without the referrer every consented visit from Google reports as Direct.
    pageview(
      window.location.pathname + window.location.search + window.location.hash,
      document.referrer,
    );
  }
}

/** Persists the visitor's choice and applies it. */
export function setConsent(choice: ConsentChoice) {
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
  } catch {
    // Honour the choice for this page view anyway, but say something: the
    // banner will reappear on every load for this visitor and that looks like
    // a bug rather than a locked-down browser.
    console.warn(
      "[analytics] Could not persist the cookie choice — storage is unavailable. It applies to this page view only and the banner will reappear.",
    );
  }

  applyConsent(choice);
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT, { detail: choice }));
}

/**
 * Adopts a choice another tab just made. Storage already holds it, so this only
 * catches this tab's tag up — and releases its held page view, so a visitor who
 * decides in one tab is still counted once in each open tab.
 */
export function adoptConsentFromOtherTab(choice: ConsentChoice) {
  applyConsent(choice);
}

/**
 * Reopens the banner so a decision can be changed. Deliberately does NOT clear
 * CONSENT_STORAGE_KEY: an empty key stops the _document snippet matching
 * "granted", which would silently downgrade a consenting visitor on their next
 * load if they close the banner without choosing again.
 */
export function reopenConsent() {
  window.dispatchEvent(new Event(CONSENT_REOPEN_EVENT));
}

/**
 * SPA page view. gtag.js only auto-tracks the initial load, so every subsequent
 * client-side navigation has to be sent by hand or the whole site looks like a
 * single-page session.
 */
export function pageview(url: string, referrer?: string) {
  if (!isGaEnabled) return;
  // Navigating before the banner is answered stays silent too, or the visitor
  // gets a cookieless hit here and a second, cookied one from setConsent.
  if (pageViewHeldForConsent) return;
  gtag("event", "page_view", {
    // Addressed at the GA4 property only. An untargeted event reaches *every*
    // configured destination, which would send each client-side navigation to
    // Google Ads as well — the Ads tag counts the landing hit from its own
    // `config` call and nothing else, exactly as the stock snippet does.
    send_to: GA_MEASUREMENT_ID,
    page_path: url,
    page_location: typeof window !== "undefined" ? window.location.href : undefined,
    page_title: typeof document !== "undefined" ? document.title : undefined,
    // Only set by the consent-triggered send. On a route change
    // document.referrer still points at the external entry page and would
    // misattribute the source.
    ...(referrer ? { page_referrer: referrer } : {}),
  });
}

/**
 * Custom event helper, for funnel tracking (`trackEvent("listing_published")`).
 * Reaches every configured destination, so an event named as a Google Ads
 * conversion action is picked up there as well as in GA4.
 */
export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (!isTagEnabled) return;
  gtag("event", name, params);
}

// Guards against double-injection across route changes and the React 18
// strict-mode double-mount in dev.
let gtagLoadRequested = false;

/**
 * Injects gtag.js on the first user interaction (or after a generous idle
 * delay) instead of during page load.
 *
 * Why: the tag is ~115 KB of third-party JavaScript whose evaluation lands in
 * the exact window Lighthouse scores as TBT, and it delays the LCP paint on
 * mobile. Every command issued before the script arrives — the Consent Mode
 * defaults from _document, the `config` calls, page views, conversions — is
 * queued on `window.dataLayer` and drained in order the moment it loads, so
 * nothing is lost and consent ordering is preserved; hits are merely sent a
 * beat later.
 *
 * The one case that must NOT wait is an ad-click landing: the hit fired by the
 * Ads `config` captures the click ID, and a visitor can bounce without ever
 * interacting. When the URL carries gclid/gbraid/wbraid/gclsrc the script
 * loads immediately, exactly as before.
 *
 * Returns a cleanup that removes the listeners (the injected script itself is
 * global and survives route changes by design).
 */
export function loadGtagOnInteraction(scriptId: string): () => void {
  if (typeof window === "undefined" || gtagLoadRequested) return () => {};

  const inject = () => {
    if (gtagLoadRequested) return;
    gtagLoadRequested = true;
    removeListeners();
    window.clearTimeout(idleTimer);
    const s = document.createElement("script");
    s.src = `https://www.googletagmanager.com/gtag/js?id=${scriptId}`;
    s.async = true;
    document.head.appendChild(s);
  };

  // Scroll is included: it is the earliest signal most real sessions produce.
  const events: (keyof WindowEventMap)[] = [
    "pointerdown",
    "keydown",
    "touchstart",
    "scroll",
  ];
  const removeListeners = () =>
    events.forEach((e) => window.removeEventListener(e, inject));

  const hasAdClickId = /[?&](gclid|gbraid|wbraid|gclsrc)=/.test(
    window.location.search,
  );

  // Fallback for visitors who genuinely never interact, kept long enough to
  // stay outside the lab trace window. Sessions shorter than this without a
  // single scroll or tap were never going to convert anyway. Created before
  // inject can possibly run so the closure never reads it uninitialised.
  const idleTimer = hasAdClickId
    ? undefined
    : window.setTimeout(inject, 8000);

  if (hasAdClickId) {
    inject();
    return () => {};
  }

  events.forEach((e) =>
    window.addEventListener(e, inject, { passive: true }),
  );

  return () => {
    removeListeners();
    window.clearTimeout(idleTimer);
  };
}

/**
 * Conversion action labels, copied from Google Ads → Ziele → Conversions →
 * (action) → *Tag einrichten*. The label is the part after the slash in
 * `AW-XXXXXXXXX/LabelHere`; the account half comes from GOOGLE_ADS_ID.
 *
 * Google Ads reports a conversion action as "not detected" until something on
 * the site actually fires it — the base tag alone is never enough.
 */
export const ADS_CONVERSIONS = {
  /** "Submit lead form" — a stranger hands over their contact details. */
  submitLeadForm: "2cMYCM6u8tgcEMvG1J5E",
  /**
   * "Premium purchase" — a seller pays for Premium placement (the boost, or a
   * plan that includes it). The conversion action does not exist in Google Ads
   * yet: create it, then paste its label here. While the label is empty,
   * trackAdsConversion no-ops, so the call sites can already ship.
   */
  premiumPurchase: "",
} as const;

/**
 * Reports a Google Ads conversion. Pass a label from ADS_CONVERSIONS.
 *
 * Fires regardless of consent state: Consent Mode keeps the hit cookieless while
 * `ad_storage` is denied, which is what conversion modelling expects to see.
 */
export function trackAdsConversion(
  label: string,
  params: Record<string, unknown> = {},
) {
  // An empty label is a conversion action that has not been created in Google
  // Ads yet (see ADS_CONVERSIONS) — sending `AW-XXX/` would be malformed.
  if (!isAdsEnabled || !label) return;
  gtag("event", "conversion", {
    send_to: `${GOOGLE_ADS_ID}/${label}`,
    ...params,
  });
}
