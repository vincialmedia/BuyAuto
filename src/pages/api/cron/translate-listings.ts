import type { NextApiRequest, NextApiResponse } from "next";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { TRANSLATED_LOCALES } from "@/i18n/config";
import {
  listingNeedsTranslation,
  listingSourceHash,
  translateAndStore,
  translatorConfigured,
  type TranslatedLocale,
} from "@/lib/i18n/listingTranslations";

// Nightly backfill (vercel.json → crons): translates every published listing
// whose fr/it/en translation is missing or stale (the seller edited the text).
// Page views schedule translations too; this catches listings nobody opened in
// that language yet, so they become indexable there without waiting.
//
// Requires CRON_SECRET (Vercel sends it as a Bearer token), ANTHROPIC_API_KEY
// and SUPABASE_SERVICE_ROLE_KEY. Without CRON_SECRET the route refuses to run.

export const config = { maxDuration: 60 };

const DEADLINE_MS = 55_000; // stop in time for the 60 s function limit
const MIN_CALL_MS = 15_000; // don't start a translation with less time left
const MAX_CALL_MS = 40_000;
const CONCURRENCY = 4;
const PAGE_SIZE = 1000; // PostgREST returns at most this many rows per request

type Row = { id: string; title: string | null; description: string | null };
type Stored = { listing_id: string; locale: string; source_hash: string };

async function fetchAll<T>(
  client: SupabaseClient,
  table: string,
  columns: string,
  orderBy: string[],
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    let query = client.from(table).select(columns);
    for (const column of orderBy) query = query.order(column);
    const { data, error } = await query.range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...((data ?? []) as T[]));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}

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

  let listings: Row[];
  let stored: Stored[];
  try {
    [listings, stored] = await Promise.all([
      fetchAll<Row>(supabase, "listings_public", "id, title, description", ["id"]),
      fetchAll<Stored>(supabase, "listing_translations", "listing_id, locale, source_hash", ["listing_id", "locale"]),
    ]);
  } catch (error) {
    res.status(500).json({ ok: false, error: (error as Error).message });
    return;
  }

  const have = new Set(stored.map((s) => `${s.listing_id}:${s.locale}:${s.source_hash}`));
  const todo: { row: Row; locale: TranslatedLocale }[] = [];
  for (const row of listings) {
    if (!listingNeedsTranslation(row)) continue;
    const hash = listingSourceHash(row.title, row.description);
    for (const locale of TRANSLATED_LOCALES) {
      if (!have.has(`${row.id}:${locale}:${hash}`)) todo.push({ row, locale });
    }
  }
  // Random order: items that keep failing (they also back off via their
  // claim) can't starve the rest night after night.
  for (let i = todo.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [todo[i], todo[j]] = [todo[j], todo[i]];
  }

  let translated = 0;
  let skipped = 0;
  const failed: string[] = [];
  let next = 0;
  const worker = async () => {
    while (next < todo.length) {
      const remaining = DEADLINE_MS - (Date.now() - started);
      if (remaining < MIN_CALL_MS) return;
      const { row, locale } = todo[next];
      next += 1;
      const result = await translateAndStore(row.id, locale, row, { timeoutMs: Math.min(MAX_CALL_MS, remaining - 5_000) });
      if (result.outcome === "translated") translated += 1;
      else if (result.outcome === "skipped") skipped += 1;
      else failed.push(`${row.id}:${locale}: ${result.error}`);
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  res.status(200).json({ ok: true, pending: todo.length, translated, skipped, failed });
}
