/**
 * Live data for the MCP connector: the site's own inventory engine and the
 * public (anon) Supabase client, so the connector sees exactly what a visitor
 * of buyauto.ch sees.
 */
import { supabase } from "@/integrations/supabase/client";
import { searchListingsOrThrow, transformPublicRowToListingDetail } from "@/services/listingsService";
import { getGaragePublicById } from "@/services/garageService";
import type { ListingDataSource } from "@/lib/mcp/dataSource";

const PUBLIC_LISTINGS_VIEW = "listings_public";

export const liveListingData: ListingDataSource = {
  search: (query) => searchListingsOrThrow(query),

  async getListing(id) {
    const { data, error } = await supabase
      .from(PUBLIC_LISTINGS_VIEW)
      .select("*")
      .eq("id", id)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw new Error(`listings_public read failed: ${error.code ?? ""} ${error.message}`);
    if (!data) return null;
    return transformPublicRowToListingDetail(data as Parameters<typeof transformPublicRowToListingDetail>[0]);
  },

  async getGarage(garageId) {
    const garage = await getGaragePublicById(garageId);
    return garage ? { name: garage.name ?? null, slug: garage.slug ?? null } : null;
  },

  async liveBrands() {
    const { data, error } = await supabase.from(PUBLIC_LISTINGS_VIEW).select("brand").eq("status", "published");
    if (error) throw new Error(`listings_public brands read failed: ${error.code ?? ""} ${error.message}`);
    const brands = new Set<string>();
    for (const row of (data ?? []) as Array<{ brand?: string | null }>) {
      const brand = typeof row.brand === "string" ? row.brand.trim() : "";
      if (brand) brands.add(brand);
    }
    return Array.from(brands);
  },
};
