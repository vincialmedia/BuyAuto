/**
 * Live data for the MCP connector: the site's own inventory engine and the
 * public (anon) Supabase client, so the connector sees exactly what a visitor
 * of buyauto.ch sees.
 *
 * Results are kept for 60 seconds per query in the function's memory, so a
 * burst of identical calls (an assistant retrying, many users asking the same
 * thing) reads the database once. Failed reads are not kept.
 */
import { supabase } from "@/integrations/supabase/client";
import { searchListingsOrThrow, transformPublicRowToListingDetail } from "@/services/listingsService";
import { getGaragePublicById } from "@/services/garageService";
import type { SearchQuery, SearchResult } from "@/lib/buyauto/search";
import type { ListingDataSource, ListingWithCanton } from "@/lib/mcp/dataSource";

const PUBLIC_LISTINGS_VIEW = "listings_public";
const CACHE_TTL_MS = 60 * 1000;
const CACHE_MAX_ENTRIES = 200;

type Entry<T> = { at: number; value: Promise<T> };

function createCache<T>() {
  const entries = new Map<string, Entry<T>>();
  return (key: string, load: () => Promise<T>): Promise<T> => {
    const now = Date.now();
    const hit = entries.get(key);
    if (hit && now - hit.at < CACHE_TTL_MS) return hit.value;
    const value = load();
    entries.delete(key);
    entries.set(key, { at: now, value });
    value.catch(() => {
      if (entries.get(key)?.value === value) entries.delete(key);
    });
    while (entries.size > CACHE_MAX_ENTRIES) {
      const oldest = entries.keys().next().value;
      if (oldest === undefined) break;
      entries.delete(oldest);
    }
    return value;
  };
}

/** Stable cache key: object keys sorted, undefined dropped. */
function keyOf(value: unknown): string {
  return JSON.stringify(value, (_key, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)))
      : v
  );
}

const searchCache = createCache<SearchResult>();
const listingCache = createCache<ReturnType<typeof transformPublicRowToListingDetail> | null>();
const garageCache = createCache<{ name: string | null; slug: string | null } | null>();
const brandsCache = createCache<string[]>();

/** Adds listings_public.canton_code to search items (the shared transform leaves it out). */
async function withCantonCodes(result: SearchResult): Promise<SearchResult> {
  const ids = result.items.map((item) => item.id).filter(Boolean);
  if (ids.length === 0) return result;
  const { data, error } = await supabase.from(PUBLIC_LISTINGS_VIEW).select("id, canton_code").in("id", ids);
  if (error) throw new Error(`listings_public canton read failed: ${error.code ?? ""} ${error.message}`);
  const byId = new Map<string, string | null>();
  for (const row of (data ?? []) as Array<{ id: string; canton_code: string | null }>) byId.set(String(row.id), row.canton_code);
  const items: ListingWithCanton[] = result.items.map((item) => ({ ...item, canton_code: byId.get(item.id) ?? null }));
  return { ...result, items };
}

export const liveListingData: ListingDataSource = {
  search: (query: SearchQuery) => searchCache(keyOf(query), async () => withCantonCodes(await searchListingsOrThrow(query))),

  getListing: (id) =>
    listingCache(id, async () => {
      const { data, error } = await supabase
        .from(PUBLIC_LISTINGS_VIEW)
        .select("*")
        .eq("id", id)
        .eq("status", "published")
        .maybeSingle();
      if (error) throw new Error(`listings_public read failed: ${error.code ?? ""} ${error.message}`);
      if (!data) return null;
      return transformPublicRowToListingDetail(data as Parameters<typeof transformPublicRowToListingDetail>[0]);
    }),

  getGarage: (garageId) =>
    garageCache(garageId, async () => {
      const garage = await getGaragePublicById(garageId);
      return garage ? { name: garage.name ?? null, slug: garage.slug ?? null } : null;
    }),

  liveBrands: () =>
    brandsCache("all", async () => {
      const { data, error } = await supabase.from(PUBLIC_LISTINGS_VIEW).select("brand").eq("status", "published");
      if (error) throw new Error(`listings_public brands read failed: ${error.code ?? ""} ${error.message}`);
      const brands = new Set<string>();
      for (const row of (data ?? []) as Array<{ brand?: string | null }>) {
        const brand = typeof row.brand === "string" ? row.brand.trim() : "";
        if (brand) brands.add(brand);
      }
      return Array.from(brands);
    }),
};
