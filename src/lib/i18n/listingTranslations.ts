// Server-only. Translations of a listing's free text (title + description) for
// the fr / it / en pages. The German original in `listings` is never touched.
//
// Flow
//  1. The listing page looks up `listing_translations`. A row counts only while
//     its source_hash still matches the listing's current text: an edited
//     listing falls back to the original until it is translated again.
//  2. fr/it/en page without a fresh translation: the page renders at once with
//     the original text, marked as such and noindexed in that language, and
//     schedules the translation in the background (never inside the request).
//     The next render after it is stored shows the translation.
//  3. The nightly cron (/api/cron/translate-listings) backfills whatever no
//     page view triggered.
//  Every translation is "claimed" first (listing_translation_attempts), so
//  parallel requests don't pay for the same text twice and a text that keeps
//  failing is retried with backoff instead of on every page view.
//
// This module must not import the Anthropic SDK: German listing pages and the
// sitemap import it. The translator is loaded lazily in translateAndStore().
import { createHash } from "crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { runInBackground } from "@/lib/runInBackground";
import type { Locale } from "@/i18n/config";

export type TranslatedLocale = Exclude<Locale, "de">;

export type ListingText = { title: string | null; description: string | null };

export type StoredTranslation = { title: string | null; description: string | null };

/** Must stay identical to public.listing_text_hash() in the migration. */
export function listingSourceHash(title: string | null | undefined, description: string | null | undefined): string {
  return createHash("sha256").update(`${title ?? ""}\n\n${description ?? ""}`, "utf8").digest("hex");
}

/**
 * Whether a listing has free text whose translation decides if the page is
 * "translated". Titles are brand/model/trim in practice (the UI chrome around
 * them is translated anyway), so the description is the deciding field.
 */
export function listingNeedsTranslation(text: ListingText): boolean {
  return (text.description ?? "").trim().length > 1;
}

export function translatorConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL);
}

function readClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function writeClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

type StoredRow = { locale: string; source_hash: string; title: string | null; description: string | null };

/** Stored translations of one listing that still match its current text, keyed by locale. */
export async function getFreshTranslations(
  listingId: string,
  text: ListingText,
): Promise<Partial<Record<TranslatedLocale, StoredTranslation>>> {
  const client = readClient();
  if (!client) return {};
  const hash = listingSourceHash(text.title, text.description);
  const { data, error } = await client
    .from("listing_translations")
    .select("locale, source_hash, title, description")
    .eq("listing_id", listingId);
  if (error || !data) {
    if (error) console.error("listing_translations lookup failed:", error.message);
    return {};
  }
  const out: Partial<Record<TranslatedLocale, StoredTranslation>> = {};
  for (const row of data as StoredRow[]) {
    if (row.source_hash !== hash) continue;
    if (row.locale === "fr" || row.locale === "it" || row.locale === "en") {
      out[row.locale] = { title: row.title, description: row.description };
    }
  }
  return out;
}

export async function storeTranslation(
  listingId: string,
  locale: TranslatedLocale,
  text: ListingText,
  translated: { title: string; description: string },
  provider: string,
): Promise<void> {
  const client = writeClient();
  if (!client) throw new Error("SUPABASE_SERVICE_ROLE_KEY missing");
  const { error } = await client.from("listing_translations").upsert(
    {
      listing_id: listingId,
      locale,
      source_hash: listingSourceHash(text.title, text.description),
      title: translated.title,
      description: translated.description,
      provider,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "listing_id,locale" },
  );
  if (error) throw new Error(error.message);
}

/**
 * Reserves one translation attempt for this listing, language and text
 * (public.claim_listing_translation). False while another attempt for the same
 * text is recent (in flight, done, or failed and backing off). Fails closed:
 * if the claim can't be recorded, nothing is translated or paid for.
 */
async function claimTranslation(client: SupabaseClient, listingId: string, locale: TranslatedLocale, hash: string): Promise<boolean> {
  const { data, error } = await client.rpc("claim_listing_translation", {
    p_listing_id: listingId,
    p_locale: locale,
    p_source_hash: hash,
  });
  if (error) {
    console.error(`Listing translation claim failed (${listingId}, ${locale}):`, error.message);
    return false;
  }
  return data === true;
}

async function recordFailure(client: SupabaseClient, listingId: string, locale: TranslatedLocale, message: string): Promise<void> {
  const { error } = await client
    .from("listing_translation_attempts")
    .update({ last_error: message.slice(0, 500) })
    .eq("listing_id", listingId)
    .eq("locale", locale);
  if (error) console.error(`Recording listing translation failure failed (${listingId}, ${locale}):`, error.message);
}

export type TranslateOutcome = "translated" | "skipped" | "failed";

/**
 * Claims, translates and stores one listing in one language. Never throws.
 * "skipped": nothing to translate, translator not configured, or another
 * attempt holds the claim.
 */
export async function translateAndStore(
  listingId: string,
  locale: TranslatedLocale,
  text: ListingText,
  options: { timeoutMs: number },
): Promise<{ outcome: TranslateOutcome; error?: string }> {
  if (!listingNeedsTranslation(text) || !translatorConfigured()) return { outcome: "skipped" };
  const client = writeClient();
  if (!client) return { outcome: "skipped" };
  if (!(await claimTranslation(client, listingId, locale, listingSourceHash(text.title, text.description)))) {
    return { outcome: "skipped" };
  }
  try {
    const { translateListingText, translationModel } = await import("./listingTranslator");
    const translated = await translateListingText(text, locale, { timeoutMs: options.timeoutMs });
    await storeTranslation(listingId, locale, text, translated, translationModel());
    return { outcome: "translated" };
  } catch (error) {
    const message = (error as Error)?.message || String(error);
    console.error(`Listing translation failed (${listingId}, ${locale}):`, message);
    await recordFailure(client, listingId, locale, message);
    return { outcome: "failed", error: message };
  }
}

/**
 * Translates a listing in the background after the current response is sent.
 * Called by the fr/it/en listing page when no fresh translation exists.
 */
export function scheduleListingTranslation(listingId: string, locale: TranslatedLocale, text: ListingText): void {
  if (!listingNeedsTranslation(text) || !translatorConfigured()) return;
  runInBackground(translateAndStore(listingId, locale, text, { timeoutMs: 45_000 }));
}
