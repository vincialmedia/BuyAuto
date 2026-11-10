/**
 * Checks for the post-login / post-checkout redirect guard: `npx tsx scripts/test-safe-next-path.ts`.
 * Exits non-zero on the first failed assertion.
 */
import assert from "node:assert/strict";
import { isSafeNextPath, resolveSameOriginUrl } from "../src/lib/safe-next-path";

const ORIGIN = "https://www.example.test";

// Paths on this site.
for (const path of ["/", "/dashboard/garage", "/dashboard/garage?tab=subscription", "/garage-plan?redirect=%2Finserat-erstellen", "/a#b"]) {
  assert.equal(isSafeNextPath(path), true, path);
  assert.equal(resolveSameOriginUrl(path, ORIGIN)?.origin, ORIGIN, path);
}
assert.equal(resolveSameOriginUrl("/dashboard/garage?tab=subscription", ORIGIN)?.toString(), `${ORIGIN}/dashboard/garage?tab=subscription`);

// Everything that could leave the site, including the forms a URL parser quietly rewrites to "//host".
for (const path of [
  "//evil.test",
  "//evil.test/path",
  "/\\evil.test",
  "/\\\\evil.test",
  "/\t/evil.test",
  "/\n/evil.test",
  "/\r/evil.test",
  "https://evil.test",
  "javascript:alert(1)",
  "evil.test",
  "",
  " /dashboard",
]) {
  assert.equal(isSafeNextPath(path), false, JSON.stringify(path));
  assert.equal(resolveSameOriginUrl(path, ORIGIN), null, JSON.stringify(path));
}

// Not a string at all.
for (const value of [undefined, null, 42, {}, ["/dashboard"]]) {
  assert.equal(isSafeNextPath(value), false);
  assert.equal(resolveSameOriginUrl(value, ORIGIN), null);
}

// The parser behaviour the guard exists for: without it these would resolve to another origin.
assert.equal(new URL("/\\evil.test", ORIGIN).origin, "https://evil.test");
assert.equal(new URL("/\t/evil.test", ORIGIN).origin, "https://evil.test");

// A broken origin never yields a URL.
assert.equal(resolveSameOriginUrl("/dashboard", "not a url"), null);

console.log("test-safe-next-path: all checks passed");
