/**
 * Checks for the Sign in with Google helpers: `npx tsx scripts/test-google-sign-in.ts`.
 * Exits non-zero on the first failed assertion.
 */
import assert from "node:assert/strict";
import {
  FRESH_ACCOUNT_WINDOW_MS,
  isEmbeddedBrowser,
  isFreshAccount,
  readGoogleNames,
} from "../src/lib/buyauto/googleSignIn";
import { parsePendingLogin } from "../src/lib/analytics";

// --- In-app browsers and web views get no Google button ---------------------
const UA = {
  chromeDesktop:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
  safariIphone:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1",
  chromeIphone:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0.7390.41 Mobile/15E148 Safari/604.1",
  chromeAndroid:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36",
  androidWebView:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/141.0.0.0 Mobile Safari/537.36",
  instagramIphone:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 400.0.0.0.0",
  facebookAndroid:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/141.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/480.0.0.0;]",
  iosWebView:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
};

assert.equal(isEmbeddedBrowser(UA.chromeDesktop), false);
assert.equal(isEmbeddedBrowser(UA.safariIphone), false);
assert.equal(isEmbeddedBrowser(UA.chromeIphone), false);
assert.equal(isEmbeddedBrowser(UA.chromeAndroid), false);
assert.equal(isEmbeddedBrowser(UA.androidWebView), true);
assert.equal(isEmbeddedBrowser(UA.instagramIphone), true);
assert.equal(isEmbeddedBrowser(UA.facebookAndroid), true);
assert.equal(isEmbeddedBrowser(UA.iosWebView), true);
assert.equal(isEmbeddedBrowser(""), false);
assert.equal(isEmbeddedBrowser(null), false);

// --- A Google sign-in that created the account counts as a sign-up ----------
const created = "2026-10-21T08:00:00.000Z";
const createdMs = Date.parse(created);
assert.equal(isFreshAccount({ created_at: created, last_sign_in_at: "2026-10-21T08:00:00.400Z" }), true);
assert.equal(isFreshAccount({ created_at: created, last_sign_in_at: "2026-10-21T09:00:00.000Z" }), false);
// Server timestamps decide; the device clock doesn't matter when both exist.
assert.equal(
  isFreshAccount({ created_at: created, last_sign_in_at: "2026-10-21T08:00:01.000Z" }, createdMs + 10 * 24 * 3600 * 1000),
  true
);
// Without last_sign_in_at the device clock is the fallback.
assert.equal(isFreshAccount({ created_at: created }, createdMs + 5_000), true);
assert.equal(isFreshAccount({ created_at: created }, createdMs + FRESH_ACCOUNT_WINDOW_MS + 1), false);
assert.equal(isFreshAccount({ created_at: "nonsense" }), false);
assert.equal(isFreshAccount(null), false);

// --- Names from Google's ID token -------------------------------------------
function fakeIdToken(payload: Record<string, unknown>): string {
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value), "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${encode({ alg: "RS256", typ: "JWT" })}.${encode(payload)}.signature`;
}

assert.deepEqual(readGoogleNames(fakeIdToken({ given_name: "Vincent", family_name: "Hänggi", name: "Vincent Hänggi" })), {
  firstName: "Vincent",
  lastName: "Hänggi",
});
// Umlauts survive the base64url decoding.
assert.deepEqual(readGoogleNames(fakeIdToken({ given_name: "Zoë", family_name: "Müller-Lüdenscheidt" })), {
  firstName: "Zoë",
  lastName: "Müller-Lüdenscheidt",
});
// No given_name: split the full name, last word as the last name.
assert.deepEqual(readGoogleNames(fakeIdToken({ name: "Anna Maria Keller" })), { firstName: "Anna Maria", lastName: "Keller" });
assert.deepEqual(readGoogleNames(fakeIdToken({ name: "Cher" })), { firstName: "Cher", lastName: "" });
// Control characters and runs of spaces are cleaned, length is capped.
assert.deepEqual(readGoogleNames(fakeIdToken({ given_name: "  Max\u0000 \n ", family_name: "Muster\tmann" })), {
  firstName: "Max",
  lastName: "Muster mann",
});
assert.equal(readGoogleNames(fakeIdToken({ given_name: "A".repeat(200) }))?.firstName.length, 80);
// Nothing usable.
assert.equal(readGoogleNames(fakeIdToken({ email: "a@b.ch" })), null);
assert.equal(readGoogleNames("not-a-jwt"), null);
assert.equal(readGoogleNames("a.%%%.c"), null);

// --- The queued login keeps its method; old queue entries still read ---------
const now = Date.parse("2026-10-21T10:00:00.000Z");
assert.deepEqual(parsePendingLogin(`google:${now - 1_000}`, now), { method: "google" });
assert.deepEqual(parsePendingLogin(`email:${now - 1_000}`, now), { method: "email" });
assert.deepEqual(parsePendingLogin(String(now - 1_000), now), { method: "email" });
assert.equal(parsePendingLogin(`google:${now - 6 * 60 * 1000}`, now), null);
assert.equal(parsePendingLogin("google:", now), null);
assert.equal(parsePendingLogin(null, now), null);

console.log("test-google-sign-in: all checks passed");
