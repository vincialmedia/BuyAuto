/**
 * Padkos client-side cart, wishlist and last-order state.
 *
 * A faithful port of the design bundle's `padkos-data.js`: the same
 * localStorage keys (`padkos-cart` {sku: qty}, `padkos-wishlist` [sku],
 * `padkos-last-order`), and the same `padkos-cart` window event pinging every
 * listener after each mutation — so the header badge, shop cards, wishlist and
 * checkout all stay in sync, across tabs too (via the `storage` event).
 *
 * Exposed to React through useSyncExternalStore, so the server render and the
 * first client render agree on the empty state and localStorage is only read
 * after hydration.
 */

import { useSyncExternalStore } from "react";

import { COOLED_SURCHARGE, SHIP_COST, SHIP_FREE, findProduct } from "./catalog";

const KEY_CART = "padkos-cart";
const KEY_WISHLIST = "padkos-wishlist";
const KEY_ORDER = "padkos-last-order";
const EVENT = "padkos-cart";

export type PadkosCart = Record<string, number>;

export interface PadkosOrderItem {
  sku: string;
  name: string;
  qty: number;
  totalF: string;
}

export interface PadkosOrder {
  nr: string;
  date: string;
  name: string;
  email: string;
  adresse: string;
  versand: string;
  zahlung: string;
  cooled: boolean;
  items: PadkosOrderItem[];
  subtotalF: string;
  /** Discount line ("−€ 3,28"), present when a voucher was redeemed. */
  rabattF?: string;
  shipF: string;
  totalF: string;
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked (private mode): the UI keeps working off the
    // in-memory snapshot for this page view; persistence is best-effort.
  }
  ping();
}

function ping() {
  window.dispatchEvent(new CustomEvent(EVENT));
}

function subscribe(callback: () => void): () => void {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

/*
 * useSyncExternalStore requires getSnapshot to return a referentially stable
 * value until the store actually changes — a fresh JSON.parse per call would
 * loop the render. Cache by raw string.
 */
function cachedReader<T>(key: string, fallback: T): () => T {
  let lastRaw: string | null | undefined;
  let lastValue: T = fallback;
  return () => {
    if (typeof window === "undefined") return fallback;
    let raw: string | null;
    try {
      raw = window.localStorage.getItem(key);
    } catch {
      return fallback;
    }
    if (raw !== lastRaw) {
      lastRaw = raw;
      try {
        lastValue = raw ? (JSON.parse(raw) as T) : fallback;
      } catch {
        lastValue = fallback;
      }
    }
    return lastValue;
  };
}

const EMPTY_CART: PadkosCart = {};
const EMPTY_WISHLIST: string[] = [];

const readCart = cachedReader<PadkosCart>(KEY_CART, EMPTY_CART);
const readWishlist = cachedReader<string[]>(KEY_WISHLIST, EMPTY_WISHLIST);
const readOrder = cachedReader<PadkosOrder | null>(KEY_ORDER, null);

/* ------------------------------------------------------------- mutations -- */

export const padkosStore = {
  getCart: (): PadkosCart => read(KEY_CART, EMPTY_CART),
  setCart(cart: PadkosCart) {
    write(KEY_CART, cart);
  },
  add(sku: string, qty = 1) {
    const cart = { ...padkosStore.getCart() };
    cart[sku] = (cart[sku] || 0) + qty;
    padkosStore.setCart(cart);
  },
  setQty(sku: string, qty: number) {
    const cart = { ...padkosStore.getCart() };
    if (qty <= 0) delete cart[sku];
    else cart[sku] = qty;
    padkosStore.setCart(cart);
  },
  clearCart() {
    padkosStore.setCart({});
  },
  toggleWish(sku: string) {
    const wish = [...read<string[]>(KEY_WISHLIST, EMPTY_WISHLIST)];
    const i = wish.indexOf(sku);
    if (i >= 0) wish.splice(i, 1);
    else wish.push(sku);
    write(KEY_WISHLIST, wish);
  },
  saveOrder(order: PadkosOrder) {
    write(KEY_ORDER, order);
  },
};

/* ----------------------------------------------------------------- hooks -- */

export function usePadkosCart(): PadkosCart {
  return useSyncExternalStore(subscribe, readCart, () => EMPTY_CART);
}

export function usePadkosWishlist(): string[] {
  return useSyncExternalStore(subscribe, readWishlist, () => EMPTY_WISHLIST);
}

export function usePadkosLastOrder(): PadkosOrder | null {
  return useSyncExternalStore(subscribe, readOrder, () => null);
}

/** Total item count, for the header badge. */
export function useCartCount(): number {
  const cart = usePadkosCart();
  return Object.values(cart).reduce((sum, n) => sum + n, 0);
}

/** The one voucher the shop hands out (newsletter welcome discount). */
export const WELKOM_CODE = "WELKOM10";
export const WELKOM_RATE = 0.1;

export interface CartTotals {
  /** Cart lines resolved against the catalogue (unknown SKUs dropped). */
  skus: string[];
  subtotal: number;
  /** Voucher discount (already rounded to cents). */
  discount: number;
  hasCooled: boolean;
  hasAgeRestricted: boolean;
  freeShip: boolean;
  /** Base shipping for the chosen method (0 for pickup or over threshold). */
  baseShip: number;
  /** Chilled surcharge — applies when cooled items ship by post. */
  cooledShip: number;
  ship: number;
  total: number;
  missingToFree: number;
}

/**
 * One shared implementation of the money math, used by cart page, summary and
 * order submission — so no two screens can ever disagree on a total.
 *
 * The free-shipping threshold is measured against the pre-discount subtotal
 * on purpose: "Ab € 59" stays true to what the customer put in the cart, and
 * a voucher never takes free shipping away again.
 */
export function computeTotals(
  cart: PadkosCart,
  method: "post" | "abholung",
  opts?: { welkom?: boolean }
): CartTotals {
  const skus = Object.keys(cart).filter((sku) => findProduct(sku));
  const subtotal = skus.reduce((sum, sku) => sum + findProduct(sku)!.price * cart[sku], 0);
  const discount = opts?.welkom ? Math.round(subtotal * WELKOM_RATE * 100) / 100 : 0;
  const hasCooled = skus.some((sku) => findProduct(sku)!.cooled);
  const hasAgeRestricted = skus.some((sku) => findProduct(sku)!.ageRestricted);
  const freeShip = subtotal >= SHIP_FREE;
  const shipping = method === "post" && skus.length > 0;
  const baseShip = shipping && !freeShip ? SHIP_COST : 0;
  const cooledShip = shipping && hasCooled ? COOLED_SURCHARGE : 0;
  const ship = baseShip + cooledShip;
  return {
    skus,
    subtotal,
    discount,
    hasCooled,
    hasAgeRestricted,
    freeShip,
    baseShip,
    cooledShip,
    ship,
    total: subtotal - discount + ship,
    missingToFree: Math.max(0, SHIP_FREE - subtotal),
  };
}
