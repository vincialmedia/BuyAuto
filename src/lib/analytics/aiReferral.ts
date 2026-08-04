// AI-assistant referral attribution. When a visit lands with a referrer from an AI
// surface (ChatGPT, Perplexity, Claude, Copilot, Gemini, You.com), the source is
// remembered for the session and reported as an `ai_referral` gtag event — the
// measurement half of the GEO work: without it, traffic that AI answers send us is
// indistinguishable from Direct.

import { trackEvent } from "@/lib/analytics/gtag";

export const AI_SOURCE_STORAGE_KEY = "buyauto:ai-source";

// Hostname (incl. subdomains) → stable source label reported to analytics.
const AI_REFERRER_HOSTS: ReadonlyArray<readonly [host: string, source: string]> = [
  ["chatgpt.com", "chatgpt"],
  ["chat.openai.com", "chatgpt"],
  ["perplexity.ai", "perplexity"],
  ["claude.ai", "claude"],
  ["copilot.microsoft.com", "copilot"],
  ["gemini.google.com", "gemini"],
  ["you.com", "you"],
];

/** Source label for a referrer URL, or null when it is not an AI surface. */
export function detectAiSource(referrer: string | null | undefined): string | null {
  if (!referrer) return null;

  let host: string;
  try {
    host = new URL(referrer).hostname.toLowerCase();
  } catch {
    return null;
  }

  for (const [refHost, source] of AI_REFERRER_HOSTS) {
    if (host === refHost || host.endsWith(`.${refHost}`)) return source;
  }
  return null;
}

/** The session's stored AI source, if this visit came from one. */
export function getStoredAiSource(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(AI_SOURCE_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Call once on first load. document.referrer only carries the external origin on the
 * landing document, so this must run before any client-side navigation. The stored key
 * doubles as the dedupe guard: a session reports ai_referral at most once, surviving
 * hard reloads. Fired through trackEvent, which no-ops without a configured tag and is
 * kept cookieless by Consent Mode until the visitor accepts.
 */
export function rememberAiReferral(): void {
  if (typeof window === "undefined") return;

  const source = detectAiSource(document.referrer);
  if (!source) return;

  let alreadyReported = false;
  try {
    alreadyReported = window.sessionStorage.getItem(AI_SOURCE_STORAGE_KEY) !== null;
    if (!alreadyReported) window.sessionStorage.setItem(AI_SOURCE_STORAGE_KEY, source);
  } catch {
    // Storage unavailable (private-mode Safari): still report the event, at the cost of
    // a possible duplicate on reload.
  }

  if (alreadyReported) return;

  trackEvent("ai_referral", {
    ai_source: source,
    page_referrer: document.referrer,
  });
}
