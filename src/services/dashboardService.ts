import { supabase } from "@/integrations/supabase/client";
import type { ListingDetail, ListingStatus } from "@/lib/buyauto/types";

export type DashboardListingStatus = ListingStatus;

export interface DashboardListingTombstone {
  id: string;
  original_listing_id: string;
  garage_id: string | null;
  seller_user_id: string | null;
  brand: string;
  model: string;
  year: number | null;
  location: string | null;
  deal_type: string | null;
  financing_type: string | null;
  price_per_month_chf: number | null;
  purchase_price_chf: number | null;
  cover_image_url: string | null;
  sold_at: string | null;
  deleted_at: string;
}

export interface DashboardListing {
  id: string;
  brand: string;
  model: string;
  title?: string;
  description: string | null;
  year: number;
  price_per_month_chf: number;
  price_paid_chf: number | null;
  listing_price: number | null;
  remaining_months: number;
  location: string;
  canton_code: string;
  mileage_km: number;
  fuel: string;
  gearbox: string;
  body: string;
  premium: boolean;
  premium_until: string | null;
  paused_at?: string | null;
  pause_until?: string | null;
  expires_at: string | null;
  status: DashboardListingStatus;
  created_at: string;
  updated_at?: string;
  duration_days: number | null;
  price_plan: string | null;
  cover_image_url: string | null;
  images: unknown;
  cover_image_index: number;
  moderation_note: string | null;
  created_by: string | null;
  user_id: string | null;
  deposit_chf: number | null;
  view_count: number;
  sold_at?: string | null;
  sold_delete_at?: string | null;
  status_before_sold?: ListingStatus | null;
}

export interface DashboardStats {
  active: number;
  pending: number;
  sold: number;
  expired: number;
  totalViews: number;
}

export type ListingTombstone = {
  id: string;
  original_listing_id: string;
  garage_id: string | null;
  seller_user_id: string | null;
  brand: string;
  model: string;
  year: number | null;
  location: string | null;
  deal_type: string | null;
  financing_type: string | null;
  price_per_month_chf: number | null;
  purchase_price_chf: number | null;
  cover_image_url: string | null;
  sold_at: string | null;
  deleted_at: string;
};

export type ListingInquiryCounts = Record<
  string,
  {
    total: number;
    last7d: number;
    last30d: number;
  }
>;

function mapDbListingToListingDetail(dbListing: any): ListingDetail {
  return {
    ...dbListing,
    pricePerMonthCHF: dbListing.price_per_month_chf,
    remainingMonths: dbListing.remaining_months,
    mileageKm: dbListing.mileage_km,
    depositCHF: dbListing.deposit_chf,
    image_urls: dbListing.images || [],
    imageUrl:
      dbListing.cover_image_url ||
      (Array.isArray(dbListing.images) && dbListing.images.length > 0
        ? dbListing.images[dbListing.cover_image_index || 0]
        : ""),
    view_count: Number(dbListing.view_count || 0),
  } as ListingDetail;
}

async function getAuthedUserId(): Promise<string | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  return user?.id ?? null;
}

async function getUserListings(): Promise<ListingDetail[]> {
  try {
    const userId = await getAuthedUserId();

    if (!userId) {
      console.log("No user session found for dashboard.");
      return [];
    }

    const { data: createdByData, error: createdByError } = await supabase
      .from("listings")
      .select("*")
      .eq("created_by", userId)
      .order("created_at", { ascending: false });

    if (createdByError) {
      console.error("Error fetching listings (created_by) for current user:", createdByError);
    }

    const { data: userIdData, error: userIdError } = await supabase
      .from("listings")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (userIdError) {
      console.error("Error fetching listings (user_id) for current user:", userIdError);
    }

    const combined = [
      ...(Array.isArray(createdByData) ? createdByData : []),
      ...(Array.isArray(userIdData) ? userIdData : []),
    ];

    const byId = new Map<string, any>();
    combined.forEach((row) => {
      if (row?.id) byId.set(row.id, row);
    });

    const merged = Array.from(byId.values()).sort((a, b) => {
      const aDate = a?.created_at ? new Date(a.created_at).getTime() : 0;
      const bDate = b?.created_at ? new Date(b.created_at).getTime() : 0;
      return bDate - aDate;
    });

    return merged.map(mapDbListingToListingDetail);
  } catch (error) {
    console.error("Dashboard getUserListings unexpected error:", error);
    return [];
  }
}

async function getListingsByGarageId(garageId: string): Promise<ListingDetail[]> {
  if (!garageId) return [];

  try {
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("garage_id", garageId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching listings by garage_id for dashboard stats:", error);
      return [];
    }

    return (Array.isArray(data) ? data : []).map(mapDbListingToListingDetail);
  } catch (error) {
    console.error("Dashboard getListingsByGarageId unexpected error:", error);
    return [];
  }
}

async function getListingTombstones(): Promise<DashboardListingTombstone[]> {
  const userId = await getAuthedUserId();
  if (!userId) return [];

  const { data: garage, error: garageError } = await supabase
    .from("garages")
    .select("id")
    .eq("owner_user_id", userId)
    .maybeSingle();

  if (garageError) throw garageError;
  if (!garage?.id) return [];

  const { data, error } = await supabase
    .from("listing_tombstones")
    .select("*")
    .eq("garage_id", garage.id)
    .order("deleted_at", { ascending: false });

  if (error) throw error;

  return (Array.isArray(data) ? data : []).map((r: any) => ({
    id: String(r.id),
    original_listing_id: String(r.original_listing_id),
    garage_id: r.garage_id ? String(r.garage_id) : null,
    seller_user_id: r.seller_user_id ? String(r.seller_user_id) : null,
    brand: String(r.brand ?? ""),
    model: String(r.model ?? ""),
    year: typeof r.year === "number" ? r.year : null,
    location: typeof r.location === "string" ? r.location : null,
    deal_type: typeof r.deal_type === "string" ? r.deal_type : null,
    financing_type: typeof r.financing_type === "string" ? r.financing_type : null,
    price_per_month_chf: typeof r.price_per_month_chf === "number" ? r.price_per_month_chf : null,
    purchase_price_chf: typeof r.purchase_price_chf === "number" ? r.purchase_price_chf : null,
    cover_image_url: typeof r.cover_image_url === "string" ? r.cover_image_url : null,
    sold_at: typeof r.sold_at === "string" ? r.sold_at : null,
    deleted_at: String(r.deleted_at),
  }));
}

async function markListingSold(listingId: string): Promise<void> {
  const { error } = await supabase.rpc("mark_listing_sold", { p_listing_id: listingId });
  if (error) throw error;
}

async function markListingAvailable(listingId: string): Promise<void> {
  const { error } = await supabase.rpc("mark_listing_available", { p_listing_id: listingId });
  if (error) throw error;
}

async function archiveListing(listingId: string): Promise<void> {
  const { error } = await supabase.rpc("archive_listing", { p_listing_id: listingId });
  if (error) throw error;
}

async function pauseListing(listingId: string, pauseDays: number): Promise<void> {
  const { error } = await supabase.rpc("pause_listing", { p_listing_id: listingId, p_pause_days: pauseDays });
  if (error) throw error;
}

async function unpauseListing(listingId: string): Promise<void> {
  const { error } = await supabase.rpc("unpause_listing", { p_listing_id: listingId });
  if (error) throw error;
}

async function getDashboardStats(): Promise<DashboardStats> {
  const userId = await getAuthedUserId();
  if (!userId) throw new Error("User not authenticated");

  const { data, error } = await supabase
    .from("listings")
    .select("status, view_count")
    .or(`created_by.eq.${userId},user_id.eq.${userId}`);

  if (error) throw error;

  const stats: DashboardStats = {
    active: 0,
    pending: 0,
    sold: 0,
    expired: 0,
    totalViews: 0,
  };

  data?.forEach((listing: any) => {
    if (listing.status === "active" || listing.status === "published") stats.active++;
    else if (listing.status === "pending") stats.pending++;
    else if (listing.status === "sold") stats.sold++;
    else if (listing.status === "expired" || listing.status === "archived") stats.expired++;

    stats.totalViews += Number(listing.view_count || 0);
  });

  return stats;
}

async function updateListing(id: string, updates: unknown) {
  const { data, error } = await supabase.from("listings").update(updates as any).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

async function deleteListing(id: string) {
  const { error } = await supabase.from("listings").delete().eq("id", id);
  if (error) {
    console.error("Error deleting listing:", error);
    return { success: false, error };
  }
  return { success: true };
}

async function upgradeToPremium(id: string) {
  console.log("Upgrade to premium requested for", id);
  return { success: false, message: "Payment integration required" };
}

async function extendListing(id: string) {
  const nextMonth = new Date();
  nextMonth.setDate(nextMonth.getDate() + 30);

  const { error } = await supabase
    .from("listings")
    .update({
      expires_at: nextMonth.toISOString(),
      status: "active",
    })
    .eq("id", id);

  if (error) {
    console.error("Error extending listing:", error);
    return { success: false, error };
  }
  return { success: true };
}

async function getListingInquiryCounts(listingIds: string[]): Promise<ListingInquiryCounts> {
  if (!Array.isArray(listingIds) || listingIds.length === 0) return {};

  try {
    const { data, error } = await supabase.rpc("get_listing_inquiry_counts", {
      p_listing_ids: listingIds,
    });

    if (!error && Array.isArray(data)) {
      const counts: ListingInquiryCounts = {};
      data.forEach((row: any) => {
        const listingId = typeof row?.listing_id === "string" ? row.listing_id : null;
        if (!listingId) return;

        const total = typeof row?.total === "number" ? row.total : Number(row?.total ?? 0);
        const last7d = typeof row?.last7d === "number" ? row.last7d : Number(row?.last7d ?? 0);
        const last30d = typeof row?.last30d === "number" ? row.last30d : Number(row?.last30d ?? 0);

        counts[listingId] = {
          total: Number.isFinite(total) ? total : 0,
          last7d: Number.isFinite(last7d) ? last7d : 0,
          last30d: Number.isFinite(last30d) ? last30d : 0,
        };
      });

      return counts;
    }
  } catch (err) {
    console.error("getListingInquiryCounts rpc unexpected error:", err);
  }

  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);

  const { data, error } = await supabase
    .from("listing_inquiries")
    .select("listing_id, created_at")
    .in("listing_id", listingIds)
    .gte("created_at", since30.toISOString());

  if (error) throw error;

  const counts: ListingInquiryCounts = {};
  const now = Date.now();
  const ms7d = 7 * 24 * 60 * 60 * 1000;
  const ms30d = 30 * 24 * 60 * 60 * 1000;

  (Array.isArray(data) ? data : []).forEach((row: any) => {
    const listingId = typeof row?.listing_id === "string" ? row.listing_id : null;
    if (!listingId) return;

    const createdAtMs = row?.created_at ? new Date(row.created_at).getTime() : NaN;
    const ageMs = Number.isFinite(createdAtMs) ? now - createdAtMs : ms30d + 1;

    if (!counts[listingId]) counts[listingId] = { total: 0, last7d: 0, last30d: 0 };

    counts[listingId].total += 1;
    counts[listingId].last30d += ageMs <= ms30d ? 1 : 0;
    counts[listingId].last7d += ageMs <= ms7d ? 1 : 0;
  });

  try {
    const { data: convRows, error: convError } = await supabase
      .from("conversations")
      .select("id, listing_id")
      .in("listing_id", listingIds);

    if (convError) {
      console.error("getListingInquiryCounts conversations error:", convError);
      return counts;
    }

    const convMap = new Map<string, string>();
    const convIds: string[] = [];

    (Array.isArray(convRows) ? convRows : []).forEach((row: any) => {
      const convId = typeof row?.id === "string" ? row.id : null;
      const listingId = typeof row?.listing_id === "string" ? row.listing_id : null;
      if (!convId || !listingId) return;
      convMap.set(convId, listingId);
      convIds.push(convId);
    });

    if (convIds.length === 0) return counts;

    const { data: msgRows, error: msgError } = await supabase
      .from("messages")
      .select("conversation_id, created_at")
      .in("conversation_id", convIds)
      .gte("created_at", since30.toISOString());

    if (msgError) {
      console.error("getListingInquiryCounts messages error:", msgError);
      return counts;
    }

    const perConversationLastMs = new Map<string, number>();

    (Array.isArray(msgRows) ? msgRows : []).forEach((row: any) => {
      const convId = typeof row?.conversation_id === "string" ? row.conversation_id : null;
      if (!convId) return;

      const createdAtMs = row?.created_at ? new Date(row.created_at).getTime() : NaN;
      if (!Number.isFinite(createdAtMs)) return;

      const prev = perConversationLastMs.get(convId) ?? -1;
      if (createdAtMs > prev) perConversationLastMs.set(convId, createdAtMs);
    });

    perConversationLastMs.forEach((lastMs, convId) => {
      const listingId = convMap.get(convId);
      if (!listingId) return;

      const ageMs = now - lastMs;

      if (!counts[listingId]) counts[listingId] = { total: 0, last7d: 0, last30d: 0 };

      counts[listingId].total += 1;
      counts[listingId].last30d += 1;
      counts[listingId].last7d += ageMs <= ms7d ? 1 : 0;
    });
  } catch (err) {
    console.error("getListingInquiryCounts chat aggregation unexpected error:", err);
  }

  return counts;
}

export const dashboardService = {
  getUserListings,
  getListingsByGarageId,
  getListingTombstones,
  markListingSold,
  markListingAvailable,
  archiveListing,
  pauseListing,
  unpauseListing,
  getDashboardStats,
  getListingInquiryCounts,
  updateListing,
  deleteListing,
  upgradeToPremium,
  extendListing,
};