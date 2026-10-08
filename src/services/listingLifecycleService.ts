/**
 * Server-only: what a listing URL should do once the listing is no longer live.
 *
 * Anonymous reads only see published rows (RLS), which cannot tell "sold" from
 * "paused" from "never existed". This reads status + brand of one row with the
 * service-role key — the same key the billing API routes use — and nothing
 * else. Only ever import it from getServerSideProps.
 */
import { createClient } from "@supabase/supabase-js";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import type { GetServerSidePropsContext } from "next";
import {
  brandPageForDbBrand,
  brandPageForListingSlug,
  isIndexableBrandCount,
} from "@/lib/buyauto/leasingBrands";
import { getPublicOfferIndex, liveTakeovers } from "@/services/listingsService";

/** Statuses whose URL is retired: anonymous and non-owner visitors are redirected (308). */
const ENDED_STATUSES = new Set(["sold", "archived", "expired", "rejected"]);

export const LEASE_TAKEOVER_HUB = "/suche?dealType=lease_takeover";

export type ListingLifecycle =
  /** The lookup could not run (no service-role key) or failed: keep today's behaviour. */
  | { kind: "unknown" }
  /** No row at all. */
  | { kind: "missing" }
  | { kind: "row"; status: string; brand: string; ownerIds: string[]; expiredByDate: boolean };

export async function readListingLifecycle(listingId: string): Promise<ListingLifecycle> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return { kind: "unknown" };

  try {
    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await admin
      .from("listings")
      .select("id, status, brand, created_by, user_id, expires_at")
      .eq("id", listingId)
      .maybeSingle();

    if (error) {
      console.error("Listing lifecycle lookup failed:", { listingId, error });
      return { kind: "unknown" };
    }
    if (!data) return { kind: "missing" };

    const row = data as {
      status: string | null;
      brand: string | null;
      created_by: string | null;
      user_id: string | null;
      expires_at: string | null;
    };
    const expiresAt = row.expires_at ? Date.parse(row.expires_at) : NaN;

    return {
      kind: "row",
      status: String(row.status ?? ""),
      brand: String(row.brand ?? ""),
      ownerIds: [row.created_by, row.user_id].filter((v): v is string => typeof v === "string" && v !== ""),
      expiredByDate: !Number.isNaN(expiresAt) && expiresAt <= Date.now(),
    };
  } catch (error) {
    console.error("Listing lifecycle lookup failed:", { listingId, error });
    return { kind: "unknown" };
  }
}

/** Sold / archived / expired / rejected (incl. published past its expiry), or no row at all. */
export function isRetiredListing(lifecycle: ListingLifecycle): boolean {
  if (lifecycle.kind === "missing") return true;
  if (lifecycle.kind !== "row") return false;
  if (ENDED_STATUSES.has(lifecycle.status)) return true;
  return lifecycle.status === "published" && lifecycle.expiredByDate;
}

/** True when the signed-in visitor owns the listing or is an admin. */
export async function isOwnerOrAdmin(context: GetServerSidePropsContext, ownerIds: string[]): Promise<boolean> {
  try {
    const client = createPagesServerClient(context);
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) return false;
    if (ownerIds.includes(user.id)) return true;

    const { data: profile } = await client.from("profiles").select("role").eq("id", user.id).maybeSingle();
    return (profile as { role?: string } | null)?.role === "admin";
  } catch {
    return false;
  }
}

/**
 * Where a retired listing URL points: the brand page when it is indexable,
 * otherwise the Leasingübernahme hub. Without a row the brand comes from the
 * URL segment ("porsche-cayenne-<id>").
 */
export async function retiredListingDestination(brand: string | null, slugPrefix: string): Promise<string> {
  try {
    const offers = await getPublicOfferIndex();
    const page = brand
      ? brandPageForDbBrand(brand)
      : brandPageForListingSlug(
          slugPrefix,
          Array.from(new Set(offers.map((o) => o.brand).filter((b): b is string => typeof b === "string" && b !== "")))
        );
    if (!page) return LEASE_TAKEOVER_HUB;

    const count = liveTakeovers(offers).filter((o) => typeof o.brand === "string" && page.dbBrands.includes(o.brand)).length;
    return isIndexableBrandCount(count) ? `/leasinguebernahme/${page.slug}` : LEASE_TAKEOVER_HUB;
  } catch (error) {
    console.error("Retired listing destination failed:", { brand, slugPrefix, error });
    return LEASE_TAKEOVER_HUB;
  }
}
