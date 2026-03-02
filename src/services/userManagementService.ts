import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { formatDealerEntitlementLabel } from "@/services/dealerEntitlementService";

export type UserRole = "private" | "garage" | "admin";

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}

export interface UserWithStats extends UserProfile {
  listings_count: number;
  active_listings: number;
  pending_listings: number;
  plan_label?: string | null;
}

export interface GarageDetails {
  garage_name: string;
  city: string | null;
  contact_email: string | null;
}

export interface UserFilters {
  search: string;
  role: "all" | "user" | "admin";
  page: number;
  limit: number;
}

function safeIlikeQuery(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return `%${trimmed}%`;
}

type ListingsLikeRow = {
  id: string;
  created_at: string;
  brand: string | null;
  model: string | null;
  status: string | null;
  created_by: string | null;
  user_id: string | null;
  price_paid_chf: number | null;
};

function getListingOwnerId(listing: ListingsLikeRow): string | null {
  return listing.created_by ?? listing.user_id ?? null;
}

type GarageLikeRow = Pick<
  Database["public"]["Tables"]["garages"]["Row"],
  "id" | "owner_user_id" | "plan"
>;

type DealerAdminOverrideLikeRow = Pick<
  Database["public"]["Tables"]["dealer_admin_overrides"]["Row"],
  "dealer_id" | "ends_at"
> & {
  dealer_plans?: Pick<Database["public"]["Tables"]["dealer_plans"]["Row"], "code" | "name"> | null;
};

type DealerSubscriptionLikeRow = Pick<
  Database["public"]["Tables"]["dealer_subscriptions"]["Row"],
  "dealer_id" | "status" | "current_period_end"
> & {
  dealer_plans?: Pick<Database["public"]["Tables"]["dealer_plans"]["Row"], "code" | "name"> | null;
};

function safeLower(input: unknown): string {
  return typeof input === "string" ? input.trim().toLowerCase() : "";
}

function safeNameFromCode(code: string): string {
  const c = safeLower(code);
  if (!c) return "";
  return c.charAt(0).toUpperCase() + c.slice(1);
}

export const userManagementService = {
  async getProfile(userId: string): Promise<UserProfile> {
    const { data, error } = await supabase
      .from("profiles")
      .select("id,email,full_name,role,created_at")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data as unknown as UserProfile;
  },

  async updateProfile(userId: string, updates: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async upgradeToGarage(details: GarageDetails) {
    const { data, error } = await supabase.rpc("upgrade_to_garage", {
      p_garage_name: details.garage_name,
      p_city: details.city,
      p_contact_email: details.contact_email,
    });

    if (error) throw error;

    if (data && typeof data === "object" && "error" in (data as Record<string, unknown>)) {
      const err = (data as Record<string, unknown>).error;
      if (typeof err === "string" && err) throw new Error(err);
    }

    return data;
  },

  async getUsers(filters: UserFilters): Promise<{
    users: UserWithStats[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 25;

    let query = supabase
      .from("profiles")
      .select("id,email,full_name,role,created_at", { count: "exact" })
      .order("created_at", { ascending: false });

    if (filters.role === "admin") {
      query = query.eq("role", "admin");
    } else if (filters.role === "user") {
      query = query.neq("role", "admin");
    }

    const pattern = safeIlikeQuery(filters.search);
    if (pattern) {
      query = query.or(`full_name.ilike.${pattern},email.ilike.${pattern}`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: profiles, error, count } = await query.range(from, to);

    if (error) throw error;

    const safeProfiles = Array.isArray(profiles) ? profiles : [];
    const profileIds = safeProfiles.map((p) => p.id).filter(Boolean);

    // Resolve plan labels for garage users (batch queries)
    const garageUserIds = safeProfiles
      .filter((p) => (p as any)?.role === "garage")
      .map((p) => p.id)
      .filter(Boolean);

    let garageByOwner: Record<string, GarageLikeRow> = {};
    let planLabelByOwner: Record<string, string> = {};

    if (garageUserIds.length > 0) {
      const { data: garages, error: garagesError } = await supabase
        .from("garages")
        .select("id,owner_user_id,plan")
        .in("owner_user_id", garageUserIds);

      if (!garagesError && Array.isArray(garages)) {
        garageByOwner = garages.reduce<Record<string, GarageLikeRow>>((acc, g) => {
          const row = g as unknown as GarageLikeRow;
          if (!row.owner_user_id) return acc;
          acc[row.owner_user_id] = row;
          return acc;
        }, {});
      }

      const garageIds = Object.values(garageByOwner).map((g) => g.id).filter(Boolean);
      const nowIso = new Date().toISOString();

      let overrideByDealer: Record<string, DealerAdminOverrideLikeRow> = {};
      let subByDealer: Record<string, DealerSubscriptionLikeRow> = {};

      if (garageIds.length > 0) {
        const { data: overrides } = await supabase
          .from("dealer_admin_overrides")
          .select("dealer_id,ends_at,dealer_plans(code,name)")
          .in("dealer_id", garageIds)
          .gt("ends_at", nowIso)
          .order("ends_at", { ascending: false });

        if (Array.isArray(overrides)) {
          overrideByDealer = overrides.reduce<Record<string, DealerAdminOverrideLikeRow>>((acc, o) => {
            const row = o as unknown as DealerAdminOverrideLikeRow;
            if (!row.dealer_id) return acc;
            if (!acc[row.dealer_id]) acc[row.dealer_id] = row;
            return acc;
          }, {});
        }

        const { data: subs } = await supabase
          .from("dealer_subscriptions")
          .select("dealer_id,status,current_period_end,dealer_plans(code,name)")
          .in("dealer_id", garageIds)
          .eq("status", "active");

        if (Array.isArray(subs)) {
          subByDealer = subs.reduce<Record<string, DealerSubscriptionLikeRow>>((acc, s) => {
            const row = s as unknown as DealerSubscriptionLikeRow;
            if (!row.dealer_id) return acc;
            if (!acc[row.dealer_id]) acc[row.dealer_id] = row;
            return acc;
          }, {});
        }
      }

      planLabelByOwner = garageUserIds.reduce<Record<string, string>>((acc, ownerId) => {
        const g = garageByOwner[ownerId];
        if (!g?.id) return acc;

        const ov = overrideByDealer[g.id];
        if (ov?.dealer_plans?.code && ov.ends_at) {
          const code = safeLower(ov.dealer_plans.code);
          acc[ownerId] = formatDealerEntitlementLabel({
            kind: "trial",
            planCode: code,
            planName: ov.dealer_plans.name ?? safeNameFromCode(code),
            endsAt: ov.ends_at,
          });
          return acc;
        }

        const sub = subByDealer[g.id];
        if (sub?.dealer_plans?.code) {
          const code = safeLower(sub.dealer_plans.code);
          acc[ownerId] = formatDealerEntitlementLabel({
            kind: "subscription",
            planCode: code,
            planName: sub.dealer_plans.name ?? safeNameFromCode(code),
            endsAt: sub.current_period_end ?? null,
          });
          return acc;
        }

        const raw = safeLower(g.plan);
        if (raw && raw !== "no_plan") {
          acc[ownerId] = formatDealerEntitlementLabel({
            kind: "garage_plan_field",
            planCode: raw,
            planName: safeNameFromCode(raw),
          });
          return acc;
        }

        acc[ownerId] = "Kein Plan";
        return acc;
      }, {});
    }

    let listingsByOwner: Record<string, ListingsLikeRow[]> = {};

    if (profileIds.length > 0) {
      const { data: listings, error: listingsError } = await supabase
        .from("listings")
        .select("id,created_at,brand,model,status,created_by,user_id,price_paid_chf")
        .in("created_by", profileIds);

      if (!listingsError && Array.isArray(listings)) {
        listingsByOwner = listings.reduce<Record<string, ListingsLikeRow[]>>((acc, row) => {
          const ownerId = getListingOwnerId(row as ListingsLikeRow);
          if (!ownerId) return acc;
          acc[ownerId] = acc[ownerId] ?? [];
          acc[ownerId].push(row as ListingsLikeRow);
          return acc;
        }, {});
      }
    }

    const users: UserWithStats[] = safeProfiles.map((p) => {
      const raw = p as unknown as UserProfile;
      const ownedListings = listingsByOwner[raw.id] ?? [];
      const active = ownedListings.filter((l) => l.status === "published" || l.status === "active").length;
      const pending = ownedListings.filter((l) => l.status === "pending").length;

      return {
        ...raw,
        listings_count: ownedListings.length,
        active_listings: active,
        pending_listings: pending,
        plan_label: raw.role === "garage" ? planLabelByOwner[raw.id] ?? null : null,
      };
    });

    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return { users, total, page, totalPages };
  },

  async getUserDetails(userId: string): Promise<{
    listings: ListingsLikeRow[];
  }> {
    const { data, error } = await supabase
      .from("listings")
      .select("id,created_at,brand,model,status,created_by,user_id,price_paid_chf")
      .or(`created_by.eq.${userId},user_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return {
      listings: Array.isArray(data) ? (data as ListingsLikeRow[]) : [],
    };
  },

  async resetUserPassword(email: string | null): Promise<void> {
    if (!email) throw new Error("Missing email");
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },

  async deleteUser(userId: string): Promise<void> {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) throw sessionError;
    const token = session?.access_token;
    if (!token) throw new Error("Not authenticated");

    const response = await fetch("/api/admin/delete-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string; details?: string } | null;
      const message = payload?.error || "Failed to delete user";
      throw new Error(payload?.details ? `${message}: ${payload.details}` : message);
    }
  },

  async updateUser(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as UserProfile;
  },

  async updateUsers(updates: Partial<UserProfile>[], userIds: string[]): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .in("id", userIds)
      .select();

    if (error) throw error;
    return Array.isArray(data) ? (data as unknown as UserProfile[]) : [];
  },

  async setUserRole(userId: string, role: "private" | "garage"): Promise<void> {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) throw sessionError;
    const token = session?.access_token;
    if (!token) throw new Error("Not authenticated");

    const response = await fetch("/api/admin/set-user-role", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ user_id: userId, role }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error || "Failed to update user role");
    }
  },
};