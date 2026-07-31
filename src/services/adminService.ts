import { supabase } from "@/integrations/supabase/client";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export interface AdminListingFilters {
  status?: 'pending' | 'published' | 'rejected' | 'expired' | 'archived' | 'all';
  brand?: string;
  canton?: string;
  premium?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AdminListing {
  id: string;
  brand: string;
  model: string;
  title: string | null;
  year: number;
  price_paid_chf: number | null;
  remaining_months: number | null;
  location: string;
  canton_code: string;
  premium: boolean;
  premium_until: string | null;
  status: "pending" | "published" | "rejected" | "expired" | "archived" | "active";
  moderation_note: string | null;
  mileage_km: number | null;
  fuel: string | null;
  gearbox: string | null;
  body: string | null;
  deal_type: string | null;
  financing_type: string | null;
  purchase_price_chf: number | null;
  price_per_month_chf: number | null;
  deposit_chf: number | null;
  power_hp: number | null;
  drivetrain: string | null;
  first_registration: string | null;
  vin: string | null;
  created_at: string;
  created_by: string | null;
  user_id: string | null;
  garage_id?: string | null;
  expires_at: string | null;
  duration_days: number | null;
  price_plan: string;
  images: any[];
  cover_image_index: number;
  cover_image_url: string | null;
  description: string | null;
  remaining_km: number | null;
  archived_at?: string | null;
  owner_profile?: { id: string; email: string | null; full_name: string | null; role?: string | null } | null;
}

/** An unfinished draft, from either of the two places drafts live. */
export interface AdminDraft {
  id: string;
  /** 'wizard' = listing_drafts row, 'listing' = listings row with status draft. */
  source: "wizard" | "listing";
  brand: string | null;
  model: string | null;
  year: number | null;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  /** The sweep's deletion deadline (listing-source drafts only). */
  draft_delete_at?: string | null;
  owner_id: string;
  resume_url: string;
  owner_profile?: { id: string; email: string | null; full_name: string | null; role?: string | null } | null;
}

export interface AdminStats {
  total: number;
  pending: number;
  published: number;
  rejected: number;
  expired: number;
}

export type PrivateListingType = "free" | "extended" | "unlimited";

export interface AdminBusinessEditableListingUpdate {
  brand?: string;
  model?: string;
  title?: string | null;
  description?: string | null;
  year?: number;
  location?: string;
  canton_code?: string;
  mileage_km?: number | null;
  fuel?: string | null;
  gearbox?: string | null;
  body?: string | null;
  deal_type?: string | null;
  financing_type?: string | null;
  purchase_price_chf?: number | null;
  price_per_month_chf?: number | null;
  deposit_chf?: number | null;
  remaining_months?: number | null;
  remaining_km?: number | null;
  power_hp?: number | null;
  drivetrain?: string | null;
  first_registration?: string | null;
  vin?: string | null;

  premium?: boolean;
  premium_until?: string | null;
  status?: "pending" | "published" | "rejected" | "expired" | "archived" | "active";
  moderation_note?: string | null;

  images?: any[];
  cover_image_index?: number;
  cover_image_url?: string | null;

  duration_days?: number | null;
  expires_at?: string | null;

  price_plan?: string | null;
  /** Legacy mirror of price_plan; dual-written until the column is dropped. */
  pricing_plan?: string | null;
  user_id?: string | null;
  created_by?: string | null;
  garage_id?: string | null;
}

function computeExpiresAtFromDuration(durationDays: number | null): string | null {
  if (!durationDays || durationDays <= 0) return null;
  const d = new Date();
  d.setDate(d.getDate() + durationDays);
  return d.toISOString();
}

function addMonthsIso(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString();
}

export const adminService = {
  /**
   * Get Supabase admin client with service role key for bypassing RLS
   */
  getSupabaseAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    return createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  },

  /**
   * Get admin statistics
   */
  async getStats(): Promise<AdminStats> {
    const { data, error } = await supabase
      .from('listings')
      .select('status');

    if (error) throw error;

    const stats = (data as any).reduce((acc: AdminStats, listing: any) => {
      acc.total++;
      const key = listing.status as keyof AdminStats;
      if (key in acc && key !== "total") {
        acc[key]++;
      }
      return acc;
    }, { total: 0, pending: 0, published: 0, rejected: 0, expired: 0 } as AdminStats);

    return stats;
  },

  /**
   * Get listings for admin with filters and pagination
   */
  async getListings(filters: AdminListingFilters = {}): Promise<{
    listings: AdminListing[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const {
      status = 'all',
      brand,
      canton,
      premium,
      search,
      page = 1,
      limit = 25
    } = filters;

    let query = supabase
      .from('listings')
      .select('*', { count: 'exact' });

    // Apply filters. archived and expired are distinct statuses and filtered separately.
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (brand) {
      query = query.ilike('brand', `%${brand}%`);
    }

    if (canton) {
      query = query.eq('canton_code', canton);
    }

    if (premium !== undefined) {
      query = query.eq('premium', premium);
    }

    if (search) {
      query = query.or(`brand.ilike.%${search}%,model.ilike.%${search}%,location.ilike.%${search}%`);
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    const listings = (data as AdminListing[]) || [];

    const ownerIds = Array.from(
      new Set(
        listings
          .map((l) => l.created_by)
          .filter((id): id is string => typeof id === "string" && id.length > 0)
      )
    );

    if (ownerIds.length === 0) {
      return { listings, total, page, totalPages };
    }

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id,email,full_name,role")
      .in("id", ownerIds);

    if (!profilesError && Array.isArray(profiles)) {
      const map = new Map(profiles.map((p) => [p.id, p]));
      for (const listing of listings) {
        const ownerId = listing.created_by;
        listing.owner_profile = ownerId ? (map.get(ownerId) as any) : null;
      }
    }

    return {
      listings,
      total,
      page,
      totalPages
    };
  },

  /**
   * Every unfinished draft on the platform, regardless of owner.
   *
   * Drafts live in two places: listing_drafts holds wizard drafts that never
   * became a listing, and listings.status='draft' holds ones that did. Both are
   * shown together here. Admin-only: the RLS policies behind both reads are
   * gated on get_my_role() = 'admin', so a non-admin session gets its own rows
   * (or nothing) rather than everyone's.
   */
  async getDrafts(): Promise<AdminDraft[]> {
    const [wizardRes, listingRes] = await Promise.all([
      supabase
        .from("listing_drafts")
        .select("id,user_id,data,created_at,updated_at,archived_at")
        .order("updated_at", { ascending: false }),
      supabase
        .from("listings")
        .select("id,brand,model,year,status,created_at,updated_at,archived_at,archived_reason,draft_delete_at,created_by,user_id,cover_image_url")
        .or("status.eq.draft,and(status.eq.archived,archived_reason.eq.draft_expired)")
        .order("updated_at", { ascending: false }),
    ]);

    if (wizardRes.error) throw wizardRes.error;
    if (listingRes.error) throw listingRes.error;

    const drafts: AdminDraft[] = [];

    // A wizard draft that points at a listing is only skipped when that
    // listing actually still exists — it is then represented by the listing
    // row (draft/archived) or is stale junk next to a live listing. If the
    // linked listing was deleted, the wizard draft is all that's left and
    // must not silently vanish from the admin view.
    const linkedIds = Array.from(
      new Set(
        (wizardRes.data ?? [])
          .map((row) => (((row as any).data ?? {}) as Record<string, unknown>).id)
          .filter((id): id is string => typeof id === "string" && id.length > 0)
      )
    );

    const existingLinkedIds = new Set<string>();
    if (linkedIds.length > 0) {
      const { data: linkedRows, error: linkedError } = await supabase
        .from("listings")
        .select("id")
        .in("id", linkedIds);
      if (!linkedError) {
        for (const r of linkedRows ?? []) existingLinkedIds.add((r as { id: string }).id);
      }
    }

    for (const row of wizardRes.data ?? []) {
      const data = ((row as any).data ?? {}) as Record<string, unknown>;
      if (typeof data.id === "string" && data.id.length > 0 && existingLinkedIds.has(data.id)) continue;

      drafts.push({
        id: row.id,
        source: "wizard",
        brand: typeof data.brand === "string" ? data.brand : null,
        model: typeof data.model === "string" ? data.model : null,
        year: typeof data.year === "number" ? data.year : null,
        cover_image_url: null,
        created_at: row.created_at,
        updated_at: row.updated_at,
        archived_at: (row as any).archived_at ?? null,
        owner_id: row.user_id,
        resume_url: `/inserat-erstellen?draft=${row.id}`,
      });
    }

    for (const row of listingRes.data ?? []) {
      const ownerId = ((row as any).created_by ?? (row as any).user_id) as string | null;
      if (!ownerId) continue;

      drafts.push({
        id: row.id,
        source: "listing",
        brand: (row as any).brand ?? null,
        model: (row as any).model ?? null,
        year: typeof (row as any).year === "number" ? (row as any).year : null,
        cover_image_url: (row as any).cover_image_url ?? null,
        created_at: (row as any).created_at,
        updated_at: (row as any).updated_at,
        archived_at: (row as any).archived_at ?? null,
        // The sweep's real deadline: getDraftLifecycle treats it as
        // authoritative, which also covers revived drafts (deadline kept,
        // archived_at cleared) without a synthetic archived_at stamp.
        draft_delete_at: ((row as any).draft_delete_at as string | null) ?? null,
        owner_id: ownerId,
        resume_url: `/inserat-erstellen?edit=${row.id}`,
      });
    }

    drafts.sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at));

    const ownerIds = Array.from(new Set(drafts.map((d) => d.owner_id)));
    if (ownerIds.length === 0) return drafts;

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id,email,full_name,role")
      .in("id", ownerIds);

    if (!profilesError && Array.isArray(profiles)) {
      const map = new Map(profiles.map((p) => [p.id, p]));
      for (const draft of drafts) {
        draft.owner_profile = (map.get(draft.owner_id) as any) ?? null;
      }
    }

    return drafts;
  },

  async approveListing(id: string, options: {
    activatePremium?: boolean;
    premiumDays?: number;
  } = {}): Promise<AdminListing> {
    const updates: any = {
      status: "published",
      moderation_note: null,
      archived_at: null,
    };

    // Expiry is owned by the database. set_listing_expires_at anchors expires_at
    // from duration_days at the moment the listing becomes published, and
    // ensure_listing_expiry_defaults fills duration_days from the plan when it is
    // missing. This used to re-derive the 90/30/60 plan durations in TypeScript,
    // a second copy of the same table that could silently drift from the SQL one.
    if (options.activatePremium) {
      const premiumDays = options.premiumDays || 30;
      const premiumUntil = new Date();
      premiumUntil.setDate(premiumUntil.getDate() + premiumDays);

      updates.premium = true;
      updates.premium_until = premiumUntil.toISOString();
    }

    const { data, error } = await supabase
      .from("listings")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as AdminListing;
  },

  /**
   * Refund a listing's payment if it has one. Safe to call for any listing: the
   * endpoint is idempotent and returns 400 for listings that were never paid, so
   * an unpaid rejection is a no-op. Never throws — a failed refund must not block
   * the moderation decision itself; it is surfaced in the return value instead.
   */
  async refundListingIfPaid(id: string, reason: string): Promise<{ refunded: boolean; error?: string }> {
    try {
      const response = await fetch("/api/billing/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing_id: id, reason }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; refund_id?: string; message?: string; error?: string }
        | null;

      if (!response.ok) {
        // 400 = "not eligible for a refund", i.e. a free or unpaid listing.
        if (response.status === 400) return { refunded: false };
        return { refunded: false, error: payload?.error || `HTTP ${response.status}` };
      }

      return { refunded: Boolean(payload?.refund_id) };
    } catch (e) {
      return { refunded: false, error: e instanceof Error ? e.message : "Refund request failed" };
    }
  },

  async rejectListing(id: string, reason: string): Promise<AdminListing> {
    // Refund before flipping status: a rejected listing never goes live, so the
    // seller must get their money back. Previously the only caller of
    // /api/billing/refund was the dead bulkReject helper, so rejecting a paid
    // listing silently kept the payment.
    const refund = await this.refundListingIfPaid(id, "requested_by_customer");
    if (refund.error) {
      console.error(`rejectListing: refund failed for ${id}`, refund.error);
    }

    const listing = await this.adminUpdateListingStatus(id, {
      status: "rejected",
      moderationNote: reason,
      notificationStatus: "rejected",
    });

    if (listing) return listing;

    const { data, error } = await supabase.from("listings").select("*").eq("id", id).single();
    if (error) throw error;
    return data as AdminListing;
  },

  async adminUpdateListingStatus(
    listingId: string,
    input: { status: "pending" | "published" | "rejected" | "archived" | "expired"; moderationNote?: string | null; notificationStatus?: "published" | "rejected" | "archived" | null }
  ): Promise<AdminListing | null> {
    const response = await fetch("/api/admin/listings/update-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listing_id: listingId,
        status: input.status,
        moderation_note: input.moderationNote ?? null,
        notification_status: input.notificationStatus ?? null,
      }),
    });

    const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string; listing?: AdminListing } | null;

    if (!response.ok) {
      throw new Error(payload?.error || `Failed to update listing status (HTTP ${response.status})`);
    }

    return payload?.listing ?? null;
  },

  async updateListingBusinessEditableFields(id: string, updates: AdminBusinessEditableListingUpdate): Promise<AdminListing> {
    const { data, error } = await supabase
      .from("listings")
      .update(updates as any)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as AdminListing;
  },

  async setPrivateListingType(id: string, type: PrivateListingType, durationDaysForFree: number, durationDaysForExtended: number): Promise<AdminListing> {
    let duration_days: number | null = null;
    if (type === "free") duration_days = durationDaysForFree;
    if (type === "extended") duration_days = durationDaysForExtended;
    if (type === "unlimited") duration_days = null;

    const expires_at = type === "unlimited" ? null : computeExpiresAtFromDuration(duration_days);

    return await this.updateListingBusinessEditableFields(id, { duration_days, expires_at });
  },

  async togglePremium(id: string, isPremium: boolean, days?: number): Promise<AdminListing> {
    // Keep is_premium in lockstep with premium. The two columns are written
    // together everywhere else (billing webhook, garage credit RPC), and leaving
    // is_premium=true behind on deactivation left the pair contradicting itself.
    const updates: any = {
      premium: isPremium,
      is_premium: isPremium,
    };

    if (isPremium) {
      // Always refresh the window when enabling, so re-enabling never leaves a
      // premium_until that is already in the past (premium=true + lapsed date,
      // which the expiry sweep would immediately clear again).
      const premiumUntil = new Date();
      premiumUntil.setDate(premiumUntil.getDate() + (days ?? 30));
      updates.premium_until = premiumUntil.toISOString();
    } else {
      updates.premium_until = null;
    }

    const { data, error } = await supabase
      .from('listings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as AdminListing;
  },

  async extendExpiry(id: string, days: number): Promise<AdminListing> {
    const { data: listing } = await supabase
      .from('listings')
      .select('expires_at')
      .eq('id', id)
      .single();

    // Extend from whichever is later: the current expiry, or now. Anchoring
    // blindly on a past expires_at meant "extend by 30 days" on a listing that
    // lapsed 40 days ago produced another past date — the extension silently did
    // nothing and the maintenance sweep would re-archive it immediately.
    const existing = listing?.expires_at ? new Date(listing.expires_at) : null;
    const now = new Date();
    const baseDate = existing && existing.getTime() > now.getTime() ? existing : now;
    baseDate.setDate(baseDate.getDate() + days);

    const { data, error } = await supabase
      .from('listings')
      .update({ expires_at: baseDate.toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as AdminListing;
  },

  async deleteListing(id: string): Promise<void> {
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async declineListing(id: string, reason: string): Promise<AdminListing> {
    return await this.rejectListing(id, reason);
  },

  async declineToArchiveAndSendRejectionEmail(id: string, reason: string): Promise<AdminListing> {
    const trimmed = reason.trim();
    if (!trimmed) {
      throw new Error("Decline reason is required");
    }

    const listing = await this.adminUpdateListingStatus(id, {
      status: "archived",
      moderationNote: trimmed,
      notificationStatus: "rejected",
    });

    if (listing) return listing;

    const { data, error } = await supabase.from("listings").select("*").eq("id", id).single();
    if (error) throw error;
    return data as AdminListing;
  }
};
