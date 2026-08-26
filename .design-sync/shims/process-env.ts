// Installs a `process.env` global before any component module evaluates.
//
// WHY: the app is bundled for the browser by esbuild, which only substitutes
// the literal `process.env.NODE_ENV`. Every other `process.env.*` read survives
// as a real property access on a global that does not exist in a browser, and
// two of them run at MODULE scope:
//
//   - src/integrations/supabase/client.ts calls createPagesBrowserClient() at
//     import time, which reads NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY.
//   - src/lib/analytics/gtag.ts computes GA_MEASUREMENT_ID / RAW_ADS_ID at
//     import time.
//
// Either one throws `process is not defined` while _ds_bundle.js is still
// initialising, so the IIFE never finishes and `window.BuyAuto` stays
// undefined — i.e. EVERY component fails to render, not just those two.
//
// This module is wired in through cfg.extraEntries. package-build.mjs emits
// `export * from <extraEntry>` BEFORE `export * from <mainEntry>`, and ES
// module evaluation follows that order, so this runs first by construction.
//
// The values are deliberately inert. The host is a reserved .invalid domain
// (RFC 2606) which can never resolve, so a component that fires a data fetch
// on mount fails fast into its own error branch instead of hanging the render
// check or reaching a real backend.

type MutableGlobal = typeof globalThis & {
  process?: { env?: Record<string, string | undefined> };
};

const g = globalThis as MutableGlobal;

if (!g.process) g.process = { env: {} };
if (!g.process.env) g.process.env = {};

Object.assign(g.process.env, {
  NODE_ENV: 'development',
  // Parseable but unresolvable — the Supabase client constructs without
  // throwing, and any request it makes dies immediately.
  NEXT_PUBLIC_SUPABASE_URL: 'https://design-preview.invalid',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'design-preview-anon-key',
  NEXT_PUBLIC_SITE_URL: 'https://www.buyauto.ch',
  // Empty: src/lib/stripe.ts treats a falsy key as "Stripe not configured" and
  // skips loading Stripe.js entirely, which is what a preview card wants.
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: '',
  NEXT_PUBLIC_GA_MEASUREMENT_ID: '',
  NEXT_PUBLIC_GOOGLE_ADS_ID: '',
});

// A named export keeps the module unambiguously live: `export * from` a module
// with nothing exported is the shape a bundler is most tempted to drop, and
// this module is nothing BUT its side effect. Lowercase so the component
// scanner never mistakes it for a component.
export const dsProcessEnvInstalled = true;
