// Google Ads conversion tracking for the listing funnel.
//
// A thin layer over the shared gtag.js wiring in @/lib/analytics/gtag — GA4 and
// Google Ads ride on the ONE tag instance loaded by GoogleAnalytics.tsx; this
// module never injects a script of its own. The conversion ID comes from
// NEXT_PUBLIC_GADS_ID (format "AW-XXXXXXXXX") via GOOGLE_ADS_ID in gtag.ts,
// which also keeps the legacy NEXT_PUBLIC_GOOGLE_ADS_ID and the compiled
// production default working.
//
// Labels are the per-action half of Google Ads' "AW-XXXXXXXXX/LabelHere" send_to
// string (Google Ads → Ziele → Conversions → action → "Tag einrichten"):
//
//   NEXT_PUBLIC_GADS_LABEL_START    — listing creation form: first meaningful
//                                     interaction on /inserat-erstellen
//   NEXT_PUBLIC_GADS_LABEL_PUBLISH  — listing published (with the paid CHF
//                                     amount when a paid tier/upgrade was bought)
//
// Everything here no-ops safely when gtag.js is unavailable or the Ads ID is
// unset/invalid.

import { isAdsEnabled, trackAdsConversion } from "@/lib/analytics/gtag";

// Surrounding quotes are stripped for the same reason as the IDs in gtag.ts:
// pasting `"abc"` into a Vercel env var is an easy mistake and would otherwise
// silently send a malformed label.
const cleanLabel = (raw: string | undefined) =>
  (raw || "").trim().replace(/^["']|["']$/g, "");

// Compiled-in defaults, same reasoning as the Ads ID in gtag.ts: the campaigns
// depend on these conversions firing in production, so a missing env var on a
// deployment must not silently switch them off. They belong to the
// "Inserat gestartet" / "Inserat veröffentlicht" actions in the
// AW-18317910859 account; labels ship in the public bundle either way, so they
// are not secrets. The env vars override — set one to an empty string to
// disable that conversion (e.g. on a fork or a test deployment).
const DEFAULT_LABEL_START = "-f3wCPWDmeQcEMvG1J5E";
const DEFAULT_LABEL_PUBLISH = "nB-nCPKDmeQcEMvG1J5E";

// Env vars must be referenced as full literals — Next.js inlines NEXT_PUBLIC_*
// at build time and a computed lookup comes back undefined in the browser.
const RAW_LABEL_START = process.env.NEXT_PUBLIC_GADS_LABEL_START;
const RAW_LABEL_PUBLISH = process.env.NEXT_PUBLIC_GADS_LABEL_PUBLISH;

export const GADS_LABEL_START = cleanLabel(
  RAW_LABEL_START === undefined ? DEFAULT_LABEL_START : RAW_LABEL_START,
);
export const GADS_LABEL_PUBLISH = cleanLabel(
  RAW_LABEL_PUBLISH === undefined ? DEFAULT_LABEL_PUBLISH : RAW_LABEL_PUBLISH,
);

/**
 * Reports a Google Ads conversion for `label`. When `value` is given it is sent
 * as a CHF conversion value (the actual amount paid); omit it for value-less
 * conversions. No-ops on the server, when gtag/the Ads ID is unavailable, or
 * when the label is empty (its env var set to an empty string to disable it).
 */
export function trackConversion(label: string, value?: number): void {
  if (typeof window === "undefined" || !isAdsEnabled || !label) return;
  const params: Record<string, unknown> = {};
  if (typeof value === "number" && Number.isFinite(value)) {
    params.value = value;
    params.currency = "CHF";
  }
  trackAdsConversion(label, params);
}

const FIRED_STORAGE_PREFIX = "buyauto:gads-fired:";

// Fallback when sessionStorage is unavailable (private-mode Safari, hardened
// browsers): dedupe at least within the current page's lifetime.
const firedInMemory = new Set<string>();

function alreadyFired(dedupeKey: string): boolean {
  if (firedInMemory.has(dedupeKey)) return true;
  try {
    return window.sessionStorage.getItem(FIRED_STORAGE_PREFIX + dedupeKey) !== null;
  } catch {
    return false;
  }
}

function markFired(dedupeKey: string): void {
  firedInMemory.add(dedupeKey);
  try {
    window.sessionStorage.setItem(FIRED_STORAGE_PREFIX + dedupeKey, "1");
  } catch {
    /* in-memory set already covers this page */
  }
}

/**
 * Like trackConversion, but fires at most once per browser session for a given
 * `dedupeKey`. This is the guard against double-counting one real-world event
 * that is observable from more than one code path or page load:
 *
 * - the publish conversion for a paid listing and the payment-success handling
 *   of that same payment (key it by the Stripe payment-intent / checkout-session
 *   id and both observations collapse into one conversion);
 * - success URLs that keep their query params, where a reload or the back
 *   button re-runs the confirmation effect.
 *
 * sessionStorage survives the Stripe redirect round trip and reloads in the
 * same tab. The key is also sent as the conversion's transaction_id, so Google
 * Ads itself dedupes any repeat that slips past (e.g. the same success URL
 * reopened in a fresh tab).
 */
export function trackConversionOnce(dedupeKey: string, label: string, value?: number): void {
  if (typeof window === "undefined" || !isAdsEnabled || !label) return;
  if (alreadyFired(dedupeKey)) return;
  markFired(dedupeKey);
  const params: Record<string, unknown> = { transaction_id: dedupeKey };
  if (typeof value === "number" && Number.isFinite(value)) {
    params.value = value;
    params.currency = "CHF";
  }
  trackAdsConversion(label, params);
}
