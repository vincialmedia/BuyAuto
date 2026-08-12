/**
 * Every Padkos route in one place. All internal links go through this map so
 * a moved page is a one-line change and dead links cannot hide in markup.
 */

import type { PadkosCategoryKey } from "./catalog";

export const PADKOS = {
  home: "/padkos",
  en: "/padkos/en",
  shop: "/padkos/shop",
  kasse: "/padkos/kasse",
  merkliste: "/padkos/merkliste",
  bestellung: "/padkos/bestellung",
  konto: "/padkos/konto",
  login: "/padkos/login",
  versand: "/padkos/versand",
  kontakt: "/padkos/kontakt",
  rechtliches: "/padkos/rechtliches",
  impressum: "/padkos/rechtliches#impressum",
  agb: "/padkos/rechtliches#agb",
  datenschutz: "/padkos/rechtliches#datenschutz",
  dashboard: "/padkos/dashboard",
  produkt: (sku: string) => `/padkos/produkt/${encodeURIComponent(sku)}`,
  shopCategory: (key: PadkosCategoryKey) => `/padkos/shop?regal=${key}`,
} as const;

/**
 * Where Padkos is canonically served. While the shop lives inside buyauto.ch
 * it is noindex anyway; once it moves to its own domain, set
 * NEXT_PUBLIC_PADKOS_SITE_URL (e.g. https://www.padkos.at) — canonicals then
 * point there, with the /padkos prefix stripped (the standalone domain serves
 * the shop at the root via rewrites).
 */
export function padkosCanonical(path: string): string {
  const own = (process.env.NEXT_PUBLIC_PADKOS_SITE_URL || "").trim().replace(/\/$/, "");
  if (own) {
    const stripped = path === "/padkos" ? "/" : path.replace(/^\/padkos/, "");
    return own + stripped;
  }
  const rawBase = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  const base =
    !rawBase || rawBase.includes("vercel.app")
      ? process.env.NODE_ENV === "production"
        ? "https://www.buyauto.ch"
        : "http://localhost:3000"
      : rawBase;
  return base.replace(/\/$/, "") + path;
}

/**
 * The shop stays out of search indexes until it runs on its own domain:
 * flip with NEXT_PUBLIC_PADKOS_INDEXABLE=true.
 */
export const PADKOS_INDEXABLE = process.env.NEXT_PUBLIC_PADKOS_INDEXABLE === "true";
