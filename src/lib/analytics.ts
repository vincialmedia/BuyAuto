// The one analytics module: GA4 (+ the Google Ads base tag riding on the same
// gtag.js), Consent Mode, page views and a typed event API.
//
// Rules this file enforces for every caller:
// - Nothing runs on the server. Every export no-ops without `window`.
// - Nothing is sent, and gtag.js is never loaded, for internal traffic (see
//   isTrackingDisabled): previews, localhost, /admin, test routes, embeds,
//   admins, the `ba_no_track` browser flag and Vercel-dashboard visits.
// - Events go to the GA4 property only (`send_to`). Google Ads receives its
//   conversions by importing the GA4 key events `listing_published` and
//   `purchase`; sending events to the Ads tag as well would count them twice.
// - No PII: URLs are sanitised before they reach GA4, free text is dropped
//   when it looks like an e-mail, phone number, plate or VIN, and `user_id`
//   (the pseudonymous Supabase UUID) is only set once the visitor consented.
//
// The event catalogue with triggers lives in docs/analytics-events.md.

// ---------------------------------------------------------------------------
// IDs
// ---------------------------------------------------------------------------

// Env vars must be referenced as full literals — Next.js inlines NEXT_PUBLIC_*
// at build time and a computed lookup comes back undefined in the browser.
// Surrounding quotes are stripped: pasting `"G-XXXX"` into Vercel is an easy
// mistake that would otherwise silently disable GA.
const clean = (raw: string) => raw.trim().replace(/^["']|["']$/g, "");

// The web stream of GA4 property 437300642 ("BUYAUTO"). The override exists
// for forks; set it to "" to switch GA off.
const RAW_GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
export const GA_MEASUREMENT_ID = clean(RAW_GA_ID === undefined ? "G-KXKPFFXV3E" : RAW_GA_ID);
const isGaEnabled = /^G-[A-Z0-9]+$/i.test(GA_MEASUREMENT_ID);

// Google Ads base tag (gclid capture + remarketing). Unchanged from before:
// same ID, same bare `config` command, no conversion calls.
const RAW_ADS_ID = process.env.NEXT_PUBLIC_GADS_ID ?? process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
const GOOGLE_ADS_ID = clean(RAW_ADS_ID === undefined ? "AW-18317910859" : RAW_ADS_ID);
const isAdsEnabled = /^AW-[0-9]+$/i.test(GOOGLE_ADS_ID);

// Production hosts. Tracking only ever runs here, whatever the env vars say:
// NEXT_PUBLIC_VERCEL_ENV is not guaranteed to be exposed to the bundle, and
// relying on it alone would switch production tracking off if it is missing.
const PRODUCTION_HOSTS = new Set(["www.buyauto.ch", "buyauto.ch"]);

// ---------------------------------------------------------------------------
// gtag plumbing
// ---------------------------------------------------------------------------

type GtagArgs =
  | ["js", Date]
  | ["config", string, Record<string, unknown>?]
  | ["event", string, Record<string, unknown>?]
  | ["set", Record<string, unknown>]
  | ["set", "user_properties", Record<string, unknown>]
  | ["consent", "default" | "update", Record<string, unknown>];

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: GtagArgs) => void;
  }
}

function gtag(...args: GtagArgs) {
  if (typeof window === "undefined") return;
  // Must go through the shim installed in _document: gtag.js only recognises
  // a pushed `arguments` object — a plain Array pushed onto dataLayer is
  // silently ignored.
  window.gtag?.(...args);
}

// ---------------------------------------------------------------------------
// Storage (every access wrapped: Safari private mode and hardened browsers
// throw on localStorage/sessionStorage)
// ---------------------------------------------------------------------------

function readStorage(kind: "local" | "session", key: string): string | null {
  try {
    return (kind === "local" ? window.localStorage : window.sessionStorage).getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(kind: "local" | "session", key: string, value: string | null): void {
  try {
    const store = kind === "local" ? window.localStorage : window.sessionStorage;
    if (value === null) store.removeItem(key);
    else store.setItem(key, value);
  } catch {
    /* storage unavailable — callers fall back to in-memory state */
  }
}

// ---------------------------------------------------------------------------
// Consent (behaviour unchanged — see docs/analytics-audit.md)
// ---------------------------------------------------------------------------

// Bumped from the legacy `buyauto_cookie_consent` key on purpose: that banner
// had no reject path and gated nothing. Duplicated in _document.tsx, which
// runs outside the bundle.
export const CONSENT_STORAGE_KEY = "buyauto_consent_v2";
export const CONSENT_CHANGE_EVENT = "buyauto:consent-change";
export const CONSENT_REOPEN_EVENT = "buyauto:consent-reopen";
export type ConsentChoice = "granted" | "denied";

export function readStoredConsent(): ConsentChoice | null {
  if (typeof window === "undefined") return null;
  const stored = readStorage("local", CONSENT_STORAGE_KEY);
  return stored === "granted" || stored === "denied" ? stored : null;
}

// True until the visitor answers the banner. A page view sent before the
// choice goes out cookieless and gtag.js never re-sends it once consent
// arrives, so the landing page view is held and released exactly once when
// the visitor decides (either way). Navigations while undecided stay silent.
let pageViewHeldForConsent = false;

function applyConsent(choice: ConsentChoice) {
  gtag("consent", "update", {
    ad_storage: choice,
    ad_user_data: choice,
    ad_personalization: choice,
    analytics_storage: choice,
  });

  // user_id is a persistent identifier: only attach it with consent.
  applyUserToGtag();

  if (pageViewHeldForConsent && initialized && !isTrackingDisabled()) {
    pageViewHeldForConsent = false;
    // First cookied hit of the session, so GA4 derives acquisition from it.
    sendPageView(window.location.pathname + window.location.search, landingReferrer());
  }
}

/** Persists the visitor's choice and applies it. */
export function setConsent(choice: ConsentChoice) {
  writeStorage("local", CONSENT_STORAGE_KEY, choice);
  if (readStoredConsent() !== choice) {
    console.warn(
      "[analytics] Could not persist the cookie choice — storage is unavailable. It applies to this page view only and the banner will reappear.",
    );
  }
  applyConsent(choice);
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT, { detail: choice }));
}

/** Adopts a choice another tab just made (storage already holds it). */
export function adoptConsentFromOtherTab(choice: ConsentChoice) {
  applyConsent(choice);
}

/**
 * Reopens the banner. Deliberately does NOT clear the stored choice: an empty
 * key would silently downgrade a consenting visitor on their next load if they
 * close the banner without choosing again.
 */
export function reopenConsent() {
  window.dispatchEvent(new Event(CONSENT_REOPEN_EVENT));
}

// ---------------------------------------------------------------------------
// Internal-traffic guard
// ---------------------------------------------------------------------------

export const NO_TRACK_STORAGE_KEY = "ba_no_track";
const INTERNAL_SESSION_KEY = "ba_internal_session";
const DEBUG_SESSION_KEY = "ba_ga_debug";

export type UserRole = "private" | "dealer" | "admin";

let currentUserId: string | null = null;
let currentRole: UserRole | null = null;

// /admin, iframe embeds (no consent banner there, so consent can never be
// given) and throwaway test pages such as the removed /tg-test.
function isExcludedPath(pathname: string): boolean {
  if (/^\/(admin|embed)(\/|$)/.test(pathname)) return true;
  if (/^\/(?:[a-z0-9]+-)?test(?:-[a-z0-9-]+)?(\/|$)/i.test(pathname)) return true;
  return false;
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function hostMatches(host: string | null, domain: string): boolean {
  return host !== null && (host === domain || host.endsWith(`.${domain}`));
}

// Landing-time signals that only exist on the first document of a visit.
const ENTRY_PAGE_KEY = "ba_entry_page";
let landingContextCaptured = false;
function captureLandingContext() {
  if (landingContextCaptured || typeof window === "undefined") return;
  landingContextCaptured = true;

  const refHost = hostOf(document.referrer);
  // Arriving from the Vercel dashboard is always the owner checking a deploy.
  if (hostMatches(refHost, "vercel.com")) writeStorage("session", INTERNAL_SESSION_KEY, "1");

  // Debug mode for this browser session, without a rebuild: ?ga_debug=1 turns
  // it on, ?ga_debug=0 off. Tag Assistant sessions are debug sessions too, so
  // GA4's "Developer traffic" data filter can keep them out of reports.
  const params = new URLSearchParams(window.location.search);
  const debugParam = params.get("ga_debug");
  if (debugParam === "1") writeStorage("session", DEBUG_SESSION_KEY, "1");
  if (debugParam === "0") writeStorage("session", DEBUG_SESSION_KEY, null);
  if (hostMatches(refHost, "tagassistant.google.com") || params.has("gtm_debug")) {
    writeStorage("session", DEBUG_SESSION_KEY, "1");
  }

  if (readStorage("session", ENTRY_PAGE_KEY) === null) {
    writeStorage("session", ENTRY_PAGE_KEY, window.location.pathname);
  }
}

// Runs once when the bundle evaluates in the browser, i.e. on the landing
// document, before any client-side navigation can change location/referrer.
if (typeof window !== "undefined") captureLandingContext();

/**
 * True when nothing may be sent. When it holds, every helper is a silent no-op
 * and initAnalytics never loads gtag.js.
 */
export function isTrackingDisabled(pathname?: string): boolean {
  if (typeof window === "undefined") return true;
  if (!isGaEnabled && !isAdsEnabled) return true;

  const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV;
  if (vercelEnv !== undefined && vercelEnv !== "production") return true;
  if (!PRODUCTION_HOSTS.has(window.location.hostname)) return true;

  if (isExcludedPath(pathname ?? window.location.pathname)) return true;
  if (currentRole === "admin") return true;
  if (readStorage("local", NO_TRACK_STORAGE_KEY) === "1") return true;

  captureLandingContext();
  if (readStorage("session", INTERNAL_SESSION_KEY) === "1") return true;

  return false;
}

function isDebugMode(): boolean {
  return process.env.NEXT_PUBLIC_GA_DEBUG === "1" || readStorage("session", DEBUG_SESSION_KEY) === "1";
}

// ---------------------------------------------------------------------------
// PII guards
// ---------------------------------------------------------------------------

const EMAIL_RE = /[^\s@]+@[^\s@]+\.[^\s@]+/;
// 8+ digits, optionally separated: phone numbers, IBAN fragments, …
const LONG_NUMBER_RE = /\+?\d(?:[\s./-]?\d){7,}/;
// Swiss number plates ("ZH 123456"): canton code followed by digits.
const PLATE_RE =
  /\b(?:AG|AI|AR|BE|BL|BS|FR|GE|GL|GR|JU|LU|NE|NW|OW|SG|SH|SO|SZ|TG|TI|UR|VD|VS|ZG|ZH)\s?\d{1,6}\b/i;
const VIN_RE = /\b[A-HJ-NPR-Z0-9]{17}\b/i;

function looksLikePii(value: string): boolean {
  return EMAIL_RE.test(value) || LONG_NUMBER_RE.test(value) || PLATE_RE.test(value) || VIN_RE.test(value);
}

/**
 * Free text (a search term) as it may be sent: trimmed, capped at GA4's
 * 100-character limit, or undefined when it looks like personal data.
 */
export function safeFreeText(raw: string | null | undefined): string | undefined {
  const text = (raw ?? "").replace(/\s+/g, " ").trim();
  if (!text || looksLikePii(text)) return undefined;
  return text.slice(0, 100);
}

// Query parameters that must never reach GA4: payment and auth secrets from
// Stripe / Supabase redirects, and anything personal.
const DROPPED_PARAMS = new Set([
  "payment_intent",
  "payment_intent_client_secret",
  "setup_intent",
  "setup_intent_client_secret",
  "redirect_status",
  "session_id",
  "code",
  "token",
  "token_hash",
  "access_token",
  "refresh_token",
  "email",
  "phone",
  "vin",
  "ga_debug",
  "gtm_debug",
]);
const FREE_TEXT_PARAMS = new Set(["q", "s", "query", "search", "keyword"]);

/** Absolute, sanitised URL for page_location. The fragment is always dropped. */
function sanitizeUrl(pathWithQuery: string): string {
  const url = new URL(pathWithQuery, window.location.origin);
  const kept = new URLSearchParams();
  url.searchParams.forEach((value, key) => {
    const k = key.toLowerCase();
    if (DROPPED_PARAMS.has(k)) return;
    if (FREE_TEXT_PARAMS.has(k)) {
      const safe = safeFreeText(value);
      if (safe) kept.append(key, safe);
      return;
    }
    if (looksLikePii(value)) return;
    kept.append(key, value);
  });
  const qs = kept.toString();
  return `${window.location.origin}${url.pathname}${qs ? `?${qs}` : ""}`;
}

// Listing titles carry a seller-written suffix, and gtag would otherwise send
// document.title with every hit. Replaced (not omitted — gtag would fall back
// to document.title) when it looks personal.
function safePageTitle(): string {
  const title = document.title;
  return looksLikePii(title) ? "(redacted)" : title;
}

// A return from Stripe (card 3DS, TWINT, Checkout) would otherwise start a new
// session with source checkout.stripe.com and steal the attribution of the
// purchase from the ad click that brought the seller. Reporting our own
// origin as the referrer makes GA4 treat it as an internal hop.
function landingReferrer(): string {
  const ref = document.referrer;
  return hostMatches(hostOf(ref), "stripe.com") ? `${window.location.origin}/` : ref;
}

// ---------------------------------------------------------------------------
// Loader
// ---------------------------------------------------------------------------

let initialized = false;
let gtagLoadRequested = false;

// Events raised before initAnalytics ran (e.g. a Stripe return confirming a
// payment while auth is still resolving). Replayed right after init — through
// the full guard again, so an admin's queued events are still dropped — and
// discarded if tracking turns out to be disabled.
const MAX_PENDING = 50;
let pendingEvents: Array<() => void> = [];

function deferUntilInit(send: () => void): void {
  if (pendingEvents.length < MAX_PENDING) pendingEvents.push(send);
}

function flushPendingEvents() {
  const queued = pendingEvents;
  pendingEvents = [];
  queued.forEach((send) => send());
}

/**
 * Injects gtag.js on the first interaction (scroll, tap, key) or after 8 s,
 * instead of during page load — it is ~115 KB of third-party JS that would
 * otherwise land in the TBT/LCP window. Every command issued before it
 * arrives is queued on dataLayer and replayed in order. Ad-click landings
 * (gclid & co.) load immediately so the click ID is captured even on a bounce.
 */
function loadGtagOnInteraction(scriptId: string) {
  if (gtagLoadRequested) return;

  const events: (keyof WindowEventMap)[] = ["pointerdown", "keydown", "touchstart", "scroll"];
  const removeListeners = () => events.forEach((e) => window.removeEventListener(e, inject));
  const hasAdClickId = /[?&](gclid|gbraid|wbraid|gclsrc)=/.test(window.location.search);
  // Created before inject can possibly run, so it is never read uninitialised.
  const idleTimer = hasAdClickId ? undefined : window.setTimeout(inject, 8000);

  function inject() {
    if (gtagLoadRequested) return;
    gtagLoadRequested = true;
    removeListeners();
    window.clearTimeout(idleTimer);
    const s = document.createElement("script");
    s.src = `https://www.googletagmanager.com/gtag/js?id=${scriptId}`;
    s.async = true;
    document.head.appendChild(s);
  }

  if (hasAdClickId) {
    inject();
    return;
  }
  events.forEach((e) => window.addEventListener(e, inject, { passive: true }));
}

/**
 * Configures GA4 (+ the Ads base tag) and schedules gtag.js. Idempotent.
 * Returns true only on the call that actually initialised — the caller sends
 * the landing page view then. Returns false when tracking is disabled, in
 * which case gtag.js is never requested.
 */
export function initAnalytics(): boolean {
  if (initialized || isTrackingDisabled()) return false;
  initialized = true;

  pageViewHeldForConsent = readStoredConsent() === null;
  const location = sanitizeUrl(window.location.pathname + window.location.search);

  gtag("js", new Date());
  if (isGaEnabled) {
    gtag("config", GA_MEASUREMENT_ID, {
      // Every page view is sent by trackPageView, exactly once per page.
      send_page_view: false,
      page_location: location,
      page_title: safePageTitle(),
      ...(landingReferrer() ? { page_referrer: landingReferrer() } : {}),
      // Only ever `true`: any value, even false, switches gtag into debug mode.
      ...(isDebugMode() ? { debug_mode: true } : {}),
    });
  }
  if (isAdsEnabled) {
    gtag("config", GOOGLE_ADS_ID);
  }
  applyUserToGtag();

  loadGtagOnInteraction(isGaEnabled ? GA_MEASUREMENT_ID : GOOGLE_ADS_ID);
  // After the caller's landing page_view, which it sends synchronously.
  queueMicrotask(flushPendingEvents);
  return true;
}

export function isAnalyticsInitialized(): boolean {
  return initialized;
}

// ---------------------------------------------------------------------------
// Page views
// ---------------------------------------------------------------------------

const pathOf = (url: string) => url.split(/[?#]/)[0];

function sendPageView(pathWithQuery: string, referrer?: string) {
  if (!isGaEnabled) return;
  const pageLocation = sanitizeUrl(pathWithQuery);
  const pageTitle = safePageTitle();
  // Later events on this page inherit the sanitised URL and title instead of
  // the raw document values (the URL can carry Stripe client secrets or auth
  // codes).
  gtag("set", { page_location: pageLocation, page_title: pageTitle });
  gtag("event", "page_view", {
    send_to: GA_MEASUREMENT_ID,
    // page_location only — never page_path. Sending both is what produced the
    // doubled "/suche?dealType=x?dealType=x" URLs in the reports.
    page_location: pageLocation,
    page_title: pageTitle,
    ...(referrer ? { page_referrer: referrer } : {}),
  });
}

/** Sends one page_view for `url` (a path with query, e.g. router.asPath). */
export function trackPageView(url: string) {
  if (!initialized || isTrackingDisabled(pathOf(url))) return;
  // Undecided visitor: the landing view is released by setConsent; further
  // navigations stay silent so a visit never yields a cookieless hit plus a
  // cookied one.
  if (pageViewHeldForConsent) return;
  sendPageView(url);
}

/**
 * Keeps page_location in sync on URL changes that are not page views
 * (shallow filter/pagination updates), so events carry the current URL.
 */
export function updatePageLocation(url: string) {
  if (!initialized || !isGaEnabled || isTrackingDisabled(pathOf(url))) return;
  gtag("set", { page_location: sanitizeUrl(url), page_title: safePageTitle() });
}

/** Path the visitor landed on in this browser session. */
export function getEntryPage(): string {
  if (typeof window === "undefined") return "";
  captureLandingContext();
  return readStorage("session", ENTRY_PAGE_KEY) ?? window.location.pathname;
}

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------

function applyUserToGtag() {
  if (!initialized || !isGaEnabled || isTrackingDisabled()) return;
  gtag("set", { user_id: readStoredConsent() === "granted" ? currentUserId : null });
  gtag("set", "user_properties", { user_role: currentRole });
}

/**
 * Sets GA4's user_id (the pseudonymous Supabase UUID — attached only with
 * analytics consent) and the `user_role` user property. `admin` switches all
 * tracking off for the rest of the page's lifetime.
 */
export function setUser(userId: string | null, role: UserRole | null) {
  if (typeof window === "undefined") return;
  currentUserId = userId;
  currentRole = role;
  applyUserToGtag();
}

/** Maps profiles.role to the reported user_role. */
export function toUserRole(profileRole: string | null | undefined): UserRole {
  if (profileRole === "admin") return "admin";
  if (profileRole === "garage") return "dealer";
  return "private";
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export type DealType = "lease_takeover" | "direct_purchase";

export type PurchaseItem = {
  item_name: "Premium Inserat" | "Inserat Reaktivierung" | "Unterstützung";
  item_id: string;
  /** Product variant: standard_boost, extended, unlimited, relist_standard … */
  item_variant?: string;
  price: number;
  quantity: 1;
};

export interface EventMap {
  sign_up: { method: "email" };
  login: { method: "email" };
  listing_start: { deal_type: DealType; entry_page: string };
  listing_step: { funnel_step: number; step_name: string; deal_type: DealType };
  listing_published: {
    listing_id: string;
    deal_type: DealType;
    brand: string;
    model: string;
    plan: "free" | "premium";
    // Always 0: revenue lives on `purchase` only, or Google Ads (which imports
    // both as primary conversions) would count every Premium sale twice.
    value: 0;
    currency: "CHF";
  };
  purchase: {
    transaction_id: string;
    value: number;
    currency: "CHF";
    items: PurchaseItem[];
  };
  view_item: {
    listing_id: string;
    deal_type: DealType;
    brand: string;
    model: string;
    price: number;
    currency: "CHF";
  };
  search: {
    search_term?: string;
    deal_type?: DealType;
    results_count: number;
    page: number;
  };
  generate_lead: {
    lead_type: "inquiry" | "conversation" | "dealer_partner" | "valuation";
    listing_id?: string;
    deal_type?: DealType;
    value: 0;
    currency: "CHF";
  };
  contact_click: { contact_method: "phone" | "whatsapp" | "email"; listing_id?: string };
  cta_click: { cta_id: string; page_path: string };
}

export type AnalyticsEvent = keyof EventMap;

/** Sends a typed event to GA4. Unknown event names fail type-checking. */
export function track<E extends AnalyticsEvent>(event: E, params: EventMap[E]): void {
  if (!isGaEnabled || isTrackingDisabled()) return;
  if (!initialized) return deferUntilInit(() => track(event, params));
  const payload: Record<string, unknown> = { send_to: GA_MEASUREMENT_ID };
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") payload[key] = value;
  }
  gtag("event", event, payload);
}

// Dedupe that survives reloads (localStorage), with an in-memory fallback for
// browsers where storage throws.
const firedInMemory = new Set<string>();

/**
 * Sends `event` only if `dedupeKey` has never fired in this browser, then
 * records it. Nothing is recorded while tracking is disabled, so a test with
 * `ba_no_track` cannot swallow a later real event.
 */
export function trackOnce<E extends AnalyticsEvent>(dedupeKey: string, event: E, params: EventMap[E]): void {
  if (!isGaEnabled || isTrackingDisabled()) return;
  if (!initialized) return deferUntilInit(() => trackOnce(dedupeKey, event, params));
  if (firedInMemory.has(dedupeKey) || readStorage("local", dedupeKey) !== null) return;
  firedInMemory.add(dedupeKey);
  writeStorage("local", dedupeKey, "1");
  track(event, params);
}

/** Same as trackOnce, scoped to the browser session (sessionStorage). */
export function trackOncePerSession<E extends AnalyticsEvent>(dedupeKey: string, event: E, params: EventMap[E]): void {
  if (!isGaEnabled || isTrackingDisabled()) return;
  if (!initialized) return deferUntilInit(() => trackOncePerSession(dedupeKey, event, params));
  if (firedInMemory.has(dedupeKey) || readStorage("session", dedupeKey) !== null) return;
  firedInMemory.add(dedupeKey);
  writeStorage("session", dedupeKey, "1");
  track(event, params);
}

// A login is reported once the profile (and therefore the role) is known, so
// an admin signing in never produces a `login` hit and the event carries the
// user_id. AnalyticsProvider flushes it.
const PENDING_LOGIN_KEY = "ba_pending_login";

export function queueLoginEvent() {
  if (typeof window === "undefined") return;
  writeStorage("session", PENDING_LOGIN_KEY, String(Date.now()));
}

export function flushLoginEvent() {
  if (typeof window === "undefined") return;
  const queuedAt = Number(readStorage("session", PENDING_LOGIN_KEY));
  if (!queuedAt) return;
  writeStorage("session", PENDING_LOGIN_KEY, null);
  if (Date.now() - queuedAt > 5 * 60 * 1000) return;
  track("login", { method: "email" });
}

/** Deal type as the business reads it: a Direktkauf with an enabled takeover offer is a Leasingübernahme. */
export function toDealType(listing: {
  deal_type?: string | null;
  leasing_offer?: unknown;
}): DealType {
  const offer = listing.leasing_offer as { lease_takeover_offer?: { enabled?: boolean } } | null | undefined;
  if (listing.deal_type === "lease_takeover" || offer?.lease_takeover_offer?.enabled === true) return "lease_takeover";
  return "direct_purchase";
}
