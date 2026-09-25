import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { TRANSLATED_LOCALES } from "@/i18n/config";
import {
  listingNeedsTranslation,
  listingSourceHash,
  storeTranslation,
  translateListingText,
  translatorConfigured,
  type TranslatedLocale,
} from "@/lib/i18n/listingTranslations";

// Nightly backfill (vercel.json → crons): translates every published listing
// whose fr/it/en translation is missing or stale (the seller edited the text).
// Page views translate on demand too; this catches listings nobody opened in
// that language yet, so they become indexable there without waiting.
//
// Requires CRON_SECRET (Vercel sends it as a Bearer token), ANTHROPIC_API_KEY
// and SUPABASE_SERVICE_ROLE_KEY. Without CRON_SECRET the route refuses to run.

export const config = { maxDuration: 60 };

const TIME_BUDGET_MS = 50_000;
const MAX_TRANSLATIONS_PER_RUN = 60;

type Row = { id: string; title: string | null; description: string | null };
type Stored = { listing_id: string; locale: string; source_hash: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");

  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    res.status(401).json({ ok: false, error: "unauthorized" });
    return;
  }
  if (!translatorConfigured()) {
    res.status(503).json({ ok: false, error: "translator_not_configured" });
    return;
  }

  const started = Date.now();
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const [{ data: listings, error: listingsError }, { data: stored, error: storedError }] = await Promise.all([
    supabase.from("listings_public").select("id, title, description"),
    supabase.from("listing_translations").select("listing_id, locale, source_hash"),
  ]);
  if (listingsError || storedError) {
    res.status(500).json({ ok: false, error: (listingsError || storedError)?.message });
    return;
  }

  const have = new Set((stored as Stored[] | null ?? []).map((s) => `${s.listing_id}:${s.locale}:${s.source_hash}`));
  const todo: { row: Row; locale: TranslatedLocale }[] = [];
  for (const row of (listings as Row[] | null) ?? []) {
    if (!listingNeedsTranslation(row)) continue;
    const hash = listingSourceHash(row.title, row.description);
    for (const locale of TRANSLATED_LOCALES) {
      if (!have.has(`${row.id}:${locale}:${hash}`)) todo.push({ row, locale });
    }
  }

  let done = 0;
  const failed: string[] = [];
  for (const { row, locale } of todo.slice(0, MAX_TRANSLATIONS_PER_RUN)) {
    if (Date.now() - started > TIME_BUDGET_MS) break;
    try {
      const translated = await translateListingText(row, locale, { timeoutMs: 25_000 });
      await storeTranslation(row.id, locale, row, translated);
      done += 1;
    } catch (error) {
      failed.push(`${row.id}:${locale}: ${(error as Error).message}`);
    }
  }

  res.status(200).json({ ok: true, pending: todo.length, translated: done, failed });
}
