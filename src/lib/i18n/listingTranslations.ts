// Server-only. Stored translations of a listing's free text (title +
// description) for the fr / it / en pages. The German original in `listings`
// is never touched, and nothing here translates: rows in listing_translations
// are written outside the app (currently a one-time set for the listings that
// were live when the languages were added).
//
// A row counts only while its source_hash still matches the listing's current
// text, so an edited listing falls back to the original. A listing without a
// fresh translation shows its original text in fr/it/en, marked as such, and
// that language version is noindexed (see the listing page) so Google never
// indexes a page whose main content is untranslated.
import { createHash } from "crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
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

function readClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
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
