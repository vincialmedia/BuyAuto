/**
 * Padkos backend seam — the single place server persistence plugs in.
 *
 * Today the shop runs fully client-side: orders, newsletter signups and
 * contact messages are persisted to localStorage so every flow completes and
 * is inspectable. When Supabase is connected (see `supabase/padkos/README.md`)
 * the same calls write to Postgres instead — the UI never changes.
 *
 * Activation is env-driven: set
 *   NEXT_PUBLIC_PADKOS_SUPABASE_URL
 *   NEXT_PUBLIC_PADKOS_SUPABASE_ANON_KEY
 * and every submit below starts writing to Supabase. The client is imported
 * dynamically so the dependency stays out of the bundle until it is used.
 *
 * Padkos deliberately does NOT reuse BuyAuto's Supabase project or client
 * (src/integrations/supabase) — different brand, different database.
 */

import type { PadkosOrder } from "./store";
import { padkosStore } from "./store";

function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_PADKOS_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_PADKOS_SUPABASE_ANON_KEY;
  return url && anonKey ? { url, anonKey } : null;
}

/** True once the Supabase env vars are configured. */
export function isSupabaseConfigured(): boolean {
  return supabaseEnv() !== null;
}

async function getSupabase() {
  const env = supabaseEnv();
  if (!env) return null;
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(env.url, env.anonKey);
}

export interface OrderSubmission {
  order: PadkosOrder;
  /** Structured fields the flat display strings were built from. */
  raw: {
    vorname: string;
    nachname: string;
    email: string;
    strasse: string;
    plz: string;
    ort: string;
    land: string;
    versandart: "post" | "abholung";
    zahlung: string;
    subtotal: number;
    ship: number;
    total: number;
    items: Array<{ sku: string; qty: number; price: number }>;
  };
}

/**
 * Persist an order. Always saves locally (the confirmation page reads it);
 * additionally writes to Supabase when configured. A Supabase failure does not
 * lose the order — it stays in localStorage and the flow completes.
 */
export async function submitOrder({ order, raw }: OrderSubmission): Promise<void> {
  padkosStore.saveOrder(order);
  const supabase = await getSupabase();
  if (!supabase) return;
  try {
    const { data, error } = await supabase
      .from("padkos_orders")
      .insert({
        order_nr: order.nr,
        first_name: raw.vorname,
        last_name: raw.nachname,
        email: raw.email,
        street: raw.strasse,
        postal_code: raw.plz,
        city: raw.ort,
        country: raw.land,
        shipping_method: raw.versandart,
        payment_method: raw.zahlung,
        subtotal_eur: raw.subtotal,
        shipping_eur: raw.ship,
        total_eur: raw.total,
        has_cooled: order.cooled,
      })
      .select("id")
      .single();
    if (error || !data) throw error ?? new Error("no order id returned");
    const { error: itemsError } = await supabase.from("padkos_order_items").insert(
      raw.items.map((item) => ({
        order_id: data.id,
        sku: item.sku,
        qty: item.qty,
        unit_price_eur: item.price,
      }))
    );
    if (itemsError) throw itemsError;
  } catch (err) {
    console.error("Padkos: order stored locally; Supabase write failed", err);
  }
}

/** Newsletter signup. Local no-op record now, `padkos_newsletter` later. */
export async function subscribeNewsletter(email: string): Promise<void> {
  const supabase = await getSupabase();
  if (!supabase) return;
  try {
    // Idempotent: the table has a unique index on lower(email).
    const { error } = await supabase
      .from("padkos_newsletter")
      .upsert({ email: email.trim().toLowerCase() }, { onConflict: "email" });
    if (error) throw error;
  } catch (err) {
    console.error("Padkos: newsletter signup failed", err);
  }
}

export interface ContactMessage {
  name: string;
  email: string;
  topic: string;
  message: string;
}

/** Contact form. Completes locally now, writes `padkos_contact` later. */
export async function sendContactMessage(msg: ContactMessage): Promise<void> {
  const supabase = await getSupabase();
  if (!supabase) return;
  try {
    const { error } = await supabase.from("padkos_contact").insert(msg);
    if (error) throw error;
  } catch (err) {
    console.error("Padkos: contact message failed", err);
  }
}
