import type { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/integrations/supabase/types";
import { adminService } from "@/services/adminService";

type Body = {
  listing_id?: string;
  status?: "pending" | "published" | "rejected" | "archived" | "expired";
  moderation_note?: string | null;
  notification_status?: "published" | "rejected" | "archived" | null;
};

type ProfileRoleRow = { role: string | null };

function safeString(input: unknown): string | null {
  if (typeof input === "string" && input.trim().length > 0) return input.trim();
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const supabase = createPagesServerClient<Database>({ req, res });
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) return res.status(401).json({ ok: false, error: "Authentication failed" });
  if (!session?.user) return res.status(401).json({ ok: false, error: "Unauthorized" });

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle<ProfileRoleRow>();

  if (!me || me.role !== "admin") return res.status(403).json({ ok: false, error: "Forbidden" });

  const body = (req.body ?? {}) as Body;
  const listingId = safeString(body.listing_id);
  const status = body.status ?? null;
  const moderationNote =
    typeof body.moderation_note === "string" ? body.moderation_note.trim() : body.moderation_note ?? null;

  const notificationStatus =
    body.notification_status === "published" || body.notification_status === "rejected" || body.notification_status === "archived"
      ? body.notification_status
      : body.notification_status ?? null;

  if (!listingId) return res.status(400).json({ ok: false, error: "Missing listing_id" });
  if (
    status !== "pending" &&
    status !== "published" &&
    status !== "rejected" &&
    status !== "archived" &&
    status !== "expired"
  ) {
    return res.status(400).json({ ok: false, error: "Invalid status" });
  }

  const supabaseAdmin = adminService.getSupabaseAdminClient();

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("listings")
    .select("status")
    .eq("id", listingId)
    .maybeSingle<{ status: string | null }>();

  if (existingError) {
    console.warn("update-status: could not load existing status", existingError);
  }

  const oldStatus = existing?.status ?? null;
  const archivedAt = status === "archived" ? new Date().toISOString() : null;

  const updatePayload: Record<string, unknown> = {
    status: status as any,
    moderation_note: moderationNote,
    archived_at: archivedAt,
  };

  // Republishing an expired listing with its old, already-passed expires_at
  // would silently fail: the public views keep hiding it and the hourly sweep
  // flips it straight back to 'expired'. Clearing the stamp lets the publish
  // triggers anchor a fresh window from duration_days.
  if (status === "published" && oldStatus === "expired") {
    updatePayload.expires_at = null;
  }

  const { data, error } = await supabaseAdmin
    .from("listings")
    .update(updatePayload as any)
    .eq("id", listingId)
    .select()
    .single();

  if (error) return res.status(500).json({ ok: false, error: "Failed to update listing status" });

  return res.status(200).json({ ok: true, listing: data });
}