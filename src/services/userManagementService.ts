import { supabase } from "@/integrations/supabase/client";

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