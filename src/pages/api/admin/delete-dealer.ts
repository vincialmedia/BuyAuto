import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe-server";

type ApiOk = {
  ok: true;
  stripe: {
    attempted: boolean;
    canceled: boolean;
    subscriptionId: string | null;
  };
  storage: {
    attempted: boolean;
    deletedCount: number;
  };
  tombstonesDeleted: number;
};

type ApiError = { error: string };

const LISTING_IMAGES_BUCKET = "listing-images";
const GARAGE_TEAM_BUCKET = "garage-team";
const MESSAGE_ATTACHMENTS_BUCKET = "message-attachments";

function chunkArray<T>(items: T[], size: number): T[][] {
  if (size <= 0) return [items];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

async function listAllStoragePaths(params: {
  supabaseAdmin: ReturnType<typeof createClient>;
  bucket: string;
  basePath: string;
  maxTotal?: number;
}): Promise<string[]> {
  const { supabaseAdmin, bucket, basePath, maxTotal = 5000 } = params;

  const seen = new Set<string>();
  const out: string[] = [];

  async function walk(path: string): Promise<void> {
    let offset = 0;
    const limit = 100;

    while (true) {
      const { data, error } = await supabaseAdmin.storage.from(bucket).list(path, { limit, offset });

      if (error) {
        console.warn("delete-dealer: storage list failed", { bucket, path, error });
        return;
      }

      const rows = Array.isArray(data) ? data : [];
      if (rows.length === 0) return;

      for (const item of rows) {
        const name = typeof item?.name === "string" ? item.name : "";
        if (!name) continue;

        const fullPath = path ? `${path}/${name}` : name;

        if (seen.has(fullPath)) continue;
        seen.add(fullPath);

        const id = (item as { id?: unknown }).id;
        const isFile = typeof id === "string" && id.length > 0;

        if (isFile) {
          out.push(fullPath);
          if (out.length >= maxTotal) return;
        } else {
          await walk(fullPath);
          if (out.length >= maxTotal) return;
        }
      }

      if (rows.length < limit) return;
      offset += limit;
      if (out.length >= maxTotal) return;
    }
  }

  await walk(basePath);

  return out;
}

async function removeStoragePaths(params: {
  supabaseAdmin: ReturnType<typeof createClient>;
  bucket: string;
  paths: string[];
}): Promise<number> {
  const { supabaseAdmin, bucket, paths } = params;

  const unique = Array.from(new Set(paths)).filter((p) => typeof p === "string" && p.trim().length > 0);
  if (unique.length === 0) return 0;

  let deleted = 0;

  for (const chunk of chunkArray(unique, 100)) {
    const { error } = await supabaseAdmin.storage.from(bucket).remove(chunk);
    if (error) {
      console.warn("delete-dealer: storage remove failed", { bucket, error });
      continue;
    }
    deleted += chunk.length;
  }

  return deleted;
}

async function bestEffortCancelStripeSubscription(subscriptionId: string | null): Promise<{ attempted: boolean; canceled: boolean; subscriptionId: string | null }> {
  if (!subscriptionId) return { attempted: false, canceled: false, subscriptionId: null };

  try {
    await stripe.subscriptions.del(subscriptionId);
    return { attempted: true, canceled: true, subscriptionId };
  } catch (error) {
    console.warn("delete-dealer: stripe cancel failed", { subscriptionId, error });
    return { attempted: true, canceled: false, subscriptionId };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiOk | ApiError>) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return res.status(500).json({ error: "Server configuration error" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Unauthorized" });

  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user?.id) return res.status(401).json({ error: "Unauthorized" });

  const requesterId = userData.user.id;

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: requesterProfile, error: requesterProfileError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", requesterId)
    .maybeSingle();

  if (requesterProfileError || !requesterProfile || requesterProfile.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }

  const body = (req.body ?? {}) as { userId?: unknown };
  const targetUserId = typeof body.userId === "string" ? body.userId : "";
  if (!targetUserId) return res.status(400).json({ error: "Missing userId in request body" });

  const { data: targetProfile, error: targetProfileError } = await supabaseAdmin
    .from("profiles")
    .select("id,role,email")
    .eq("id", targetUserId)
    .maybeSingle();

  if (targetProfileError || !targetProfile?.id) {
    return res.status(404).json({ error: "User not found" });
  }

  if (targetProfile.role !== "garage") {
    return res.status(400).json({ error: "Target user is not a dealer" });
  }

  const { data: garage, error: garageError } = await supabaseAdmin
    .from("garages")
    .select("id,owner_user_id,slug")
    .eq("owner_user_id", targetUserId)
    .maybeSingle();

  if (garageError || !garage?.id) {
    return res.status(400).json({ error: "Dealer garage not found" });
  }

  const garageId = garage.id as string;

  const { data: subscription } = await supabaseAdmin
    .from("dealer_subscriptions")
    .select("stripe_subscription_id,status")
    .eq("dealer_id", garageId)
    .maybeSingle();

  const stripeSubscriptionId =
    subscription && typeof subscription.stripe_subscription_id === "string" ? subscription.stripe_subscription_id : null;

  const stripeRes = await bestEffortCancelStripeSubscription(stripeSubscriptionId);

  let deletedStorageCount = 0;
  let storageAttempted = false;

  try {
    storageAttempted = true;

    const listingImagePaths = await listAllStoragePaths({
      supabaseAdmin,
      bucket: LISTING_IMAGES_BUCKET,
      basePath: targetUserId,
    });

    const garageLogoPaths = await listAllStoragePaths({
      supabaseAdmin,
      bucket: LISTING_IMAGES_BUCKET,
      basePath: `garage-logos/${garageId}`,
    });

    const garageHeaderPaths = await listAllStoragePaths({
      supabaseAdmin,
      bucket: LISTING_IMAGES_BUCKET,
      basePath: `garage-headers/${garageId}`,
    });

    const garageTeamPaths = await listAllStoragePaths({
      supabaseAdmin,
      bucket: GARAGE_TEAM_BUCKET,
      basePath: garageId,
    });

    const { data: listingRows } = await supabaseAdmin
      .from("listings")
      .select("id,created_by,user_id,garage_id")
      .or(`created_by.eq.${targetUserId},user_id.eq.${targetUserId},garage_id.eq.${garageId}`);

    const listingIds = Array.isArray(listingRows)
      ? listingRows.map((r) => (r as { id?: unknown }).id).filter((id): id is string => typeof id === "string")
      : [];

    const { data: convoRows } = listingIds.length
      ? await supabaseAdmin.from("conversations").select("id").in("listing_id", listingIds)
      : { data: [] as unknown[] };

    const conversationIds = Array.isArray(convoRows)
      ? convoRows.map((r) => (r as { id?: unknown }).id).filter((id): id is string => typeof id === "string")
      : [];

    const attachmentPaths: string[] = [];
    for (const conversationId of conversationIds) {
      const paths = await listAllStoragePaths({
        supabaseAdmin,
        bucket: MESSAGE_ATTACHMENTS_BUCKET,
        basePath: conversationId,
        maxTotal: 2000,
      });
      attachmentPaths.push(...paths);
    }

    deletedStorageCount += await removeStoragePaths({ supabaseAdmin, bucket: LISTING_IMAGES_BUCKET, paths: listingImagePaths });
    deletedStorageCount += await removeStoragePaths({ supabaseAdmin, bucket: LISTING_IMAGES_BUCKET, paths: garageLogoPaths });
    deletedStorageCount += await removeStoragePaths({ supabaseAdmin, bucket: LISTING_IMAGES_BUCKET, paths: garageHeaderPaths });
    deletedStorageCount += await removeStoragePaths({ supabaseAdmin, bucket: GARAGE_TEAM_BUCKET, paths: garageTeamPaths });
    deletedStorageCount += await removeStoragePaths({ supabaseAdmin, bucket: MESSAGE_ATTACHMENTS_BUCKET, paths: attachmentPaths });
  } catch (error) {
    console.warn("delete-dealer: storage cleanup failed", error);
  }

  let tombstonesDeleted = 0;

  const { data: tombstonesForGarage } = await supabaseAdmin
    .from("listing_tombstones")
    .delete({ count: "exact" })
    .eq("garage_id", garageId);

  tombstonesDeleted += Array.isArray(tombstonesForGarage) ? tombstonesForGarage.length : 0;

  const { data: tombstonesForUser } = await supabaseAdmin
    .from("listing_tombstones")
    .delete({ count: "exact" })
    .eq("seller_user_id", targetUserId);

  tombstonesDeleted += Array.isArray(tombstonesForUser) ? tombstonesForUser.length : 0;

  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
  if (deleteError) {
    return res.status(500).json({ error: "Failed to delete user" });
  }

  return res.status(200).json({
    ok: true,
    stripe: stripeRes,
    storage: { attempted: storageAttempted, deletedCount: deletedStorageCount },
    tombstonesDeleted,
  });
}