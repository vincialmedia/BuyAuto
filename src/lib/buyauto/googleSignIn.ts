/**
 * Sign in with Google: configuration and the pure helpers shared by the
 * button, the auth service and the tests. Loading Google's library and the
 * nonce live in googleIdentityClient.ts (browser only).
 *
 * Flow: Google's own button (Google Identity Services, popup mode) returns an
 * ID token, and Supabase signs the person in with it (signInWithIdToken). No
 * redirect through <project>.supabase.co, so Google's popup names buyauto.ch,
 * the page keeps its state (listing wizard, typed message), and no client
 * secret is involved.
 */

/**
 * OAuth web client ID from Google Cloud. Public by design: Google sends it with
 * every sign-in request. Unset means no Google button anywhere, which is how
 * the feature stays off until the client exists.
 */
export const GOOGLE_CLIENT_ID = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "").trim();

export function isGoogleSignInConfigured(): boolean {
  return GOOGLE_CLIENT_ID.length > 0;
}

// In-app browsers of social apps and generic web views. Google refuses
// sign-in inside embedded web views ("disallowed_useragent"), so the button
// would only lead to an error page there.
const IN_APP_BROWSER_RE =
  /\b(?:FBAN|FBAV|FB_IAB|FBIOS|Instagram|Line\/|musical_ly|BytedanceWebview|TikTok|Snapchat|LinkedInApp|Pinterest)\b/i;
const ANDROID_WEBVIEW_RE = /; wv\)/;
const IOS_DEVICE_RE = /\b(?:iPhone|iPad|iPod)\b/;

/** True where Google sign-in can't work: in-app browsers and web views. */
export function isEmbeddedBrowser(userAgent: string | null | undefined): boolean {
  const ua = userAgent ?? "";
  if (!ua) return false;
  if (IN_APP_BROWSER_RE.test(ua)) return true;
  if (ANDROID_WEBVIEW_RE.test(ua)) return true;
  // iOS web views drop the "Safari/" token that Safari, Chrome, Firefox and
  // Edge on iOS all send.
  if (IOS_DEVICE_RE.test(ua) && !/Safari\//.test(ua)) return true;
  return false;
}

/** Whether this browser gets the Google button. Browser only. */
export function canOfferGoogleSignIn(): boolean {
  if (!isGoogleSignInConfigured() || typeof navigator === "undefined") return false;
  return !isEmbeddedBrowser(navigator.userAgent);
}

/** How close account creation and this sign-in must be to count as a sign-up. */
export const FRESH_ACCOUNT_WINDOW_MS = 10 * 1000;
/** A Google identity created this close to its account came with it (same sign-up). */
export const SAME_SIGNUP_GAP_MS = 5 * 1000;

type AccountTimes = {
  created_at?: string | null;
  last_sign_in_at?: string | null;
  identities?: Array<{ provider?: string | null; created_at?: string | null }> | null;
};

/**
 * A Google sign-in that created the account is a sign-up (GA4 `sign_up`),
 * anything else a login, including Google being linked to an account made
 * minutes earlier with e-mail. Compares server timestamps, so a wrong clock on
 * the visitor's device can't flip it; without `last_sign_in_at` it falls back
 * to the device clock.
 */
export function isFreshAccount(user: AccountTimes | null | undefined, now: number = Date.now()): boolean {
  const created = Date.parse(user?.created_at ?? "");
  if (!Number.isFinite(created)) return false;
  const lastSignIn = Date.parse(user?.last_sign_in_at ?? "");
  const reference = Number.isFinite(lastSignIn) ? lastSignIn : now;
  if (Math.abs(reference - created) >= FRESH_ACCOUNT_WINDOW_MS) return false;

  const google = user?.identities?.find((identity) => identity.provider === "google");
  const googleCreated = Date.parse(google?.created_at ?? "");
  if (Number.isFinite(googleCreated) && Math.abs(googleCreated - created) >= SAME_SIGNUP_GAP_MS) return false;
  return true;
}

const NAME_MAX = 80;

function cleanName(value: unknown): string {
  if (typeof value !== "string") return "";
  // Whitespace (tabs, line breaks) to single spaces, other control characters
  // out, length capped like the forms.
  return value
    .replace(/\s+/g, " ")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, NAME_MAX);
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const part = token.split(".")[1];
  if (!part) return null;
  try {
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export type GoogleNames = { firstName: string; lastName: string };

/**
 * First and last name from Google's ID token. Supabase keeps only the full
 * name, while the header and the profile form read first_name/last_name like
 * an e-mail sign-up stores them. Display data only: the token itself has
 * already been verified by Supabase at this point.
 */
export function readGoogleNames(idToken: string): GoogleNames | null {
  const payload = decodeJwtPayload(idToken);
  if (!payload) return null;

  const given = cleanName(payload.given_name);
  if (given) return { firstName: given, lastName: cleanName(payload.family_name) };

  const full = cleanName(payload.name);
  if (!full) return null;
  const parts = full.split(" ");
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts.slice(0, -1).join(" "), lastName: parts[parts.length - 1] };
}
