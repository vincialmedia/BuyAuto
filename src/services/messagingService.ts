import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type ConversationRow = Database["public"]["Tables"]["conversations"]["Row"];
export type MessageRow = Database["public"]["Tables"]["messages"]["Row"];
export type ConversationParticipantRow = Database["public"]["Tables"]["conversation_participants"]["Row"];
export type MessageAttachmentRow = Database["public"]["Tables"]["message_attachments"]["Row"];

type ListingStatus = Database["public"]["Enums"]["listing_status"];

export interface MessageThreadItem {
  conversationId: string;
  listingId: string;
  title: string;
  listingMakeModel: string;
  coverImageUrl: string | null;
  lastMessageAt: string | null;
  lastMessagePreview: string;
  unreadCount: number;
  listingStatus: ListingStatus | null;
  conversationStatus: string;
}

export interface MessageCounts {
  total: number;
}

export interface ConversationContext {
  title: string;
  conversation: {
    id: string;
    status: string;
    last_message_at: string | null;
    archived_at: string | null;
    archive_expires_at: string | null;
    my_unread_count: number;
  };
  listing: {
    id: string;
    brand: string;
    model: string;
    make_model: string;
    year: number | null;
    price_per_month_chf: number | null;
    purchase_price_chf: number | null;
    mileage_km: number | null;
    cover_image_url: string | null;
    status: ListingStatus | null;
    garage_id: string | null;
  };
  viewer: {
    user_id: string | null;
    role: "buyer" | "seller" | string | null;
  };
  counterparty: {
    id: string | null;
    role: "buyer" | "seller" | string | null;
    display_name: string | null;
  };
  buyer: {
    id: string | null;
    full_name: string | null;
    email: string | null;
  };
  seller: {
    id: string | null;
    display_name: string | null;
  };
  permissions: {
    can_select_buyer: boolean;
    can_archive: boolean;
  };
  flags: {
    read_only: boolean;
  };
}

export type MessageWithAttachments = MessageRow & {
  message_attachments: MessageAttachmentRow[];
};

export interface UploadAttachmentResult {
  storagePath: string;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
}

const MESSAGE_ATTACHMENTS_BUCKET = "message-attachments";
const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_ATTACHMENTS_PER_MESSAGE = 5;

function getPreview(body: string): string {
  const trimmed = body.trim();
  if (!trimmed) return "";
  if (trimmed.length <= 120) return trimmed;
  return `${trimmed.slice(0, 120)}…`;
}

function safeString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function safeNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function normalizePublicStorageUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) return null;

  const cleaned = value.replace(/^\//, "");
  const prefix = "storage/v1/object/public/";

  if (cleaned.startsWith(prefix)) {
    const rest = cleaned.slice(prefix.length);
    const parts = rest
      .split("/")
      .filter(Boolean)
      .map((seg) => encodeURIComponent(seg));
    return `${base}/${prefix}${parts.join("/")}`;
  }

  const parts = cleaned
    .split("/")
    .filter(Boolean)
    .map((seg) => encodeURIComponent(seg));
  return `${base}/storage/v1/object/public/${parts.join("/")}`;
}

function sanitizeFileName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "document";
  return trimmed.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function buildAttachmentStoragePath(conversationId: string, fileName: string): string {
  const now = Date.now();
  const rand = Math.random().toString(36).slice(2, 10);
  const safe = sanitizeFileName(fileName);
  return `${conversationId}/${now}_${rand}_${safe}`;
}

function validateFilesForUpload(files: File[]): { ok: true } | { ok: false; reason: string } {
  if (files.length === 0) return { ok: false, reason: "Keine Datei ausgewählt." };
  if (files.length > MAX_ATTACHMENTS_PER_MESSAGE) {
    return { ok: false, reason: `Maximal ${MAX_ATTACHMENTS_PER_MESSAGE} Dateien pro Nachricht.` };
  }

  for (const file of files) {
    if (!file || typeof file.name !== "string") return { ok: false, reason: "Ungültige Datei." };
    if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
      return { ok: false, reason: `Datei ist zu gross (max. ${Math.round(MAX_ATTACHMENT_SIZE_BYTES / 1024 / 1024)} MB).` };
    }
  }

  return { ok: true };
}

const COUNTS_TTL_MS = 5_000;
const THREADS_TTL_MS = 10_000;

let countsCache: { at: number; data: MessageCounts } | null = null;
let countsInFlight: Promise<MessageCounts> | null = null;

let threadsCache: { at: number; limit: number; data: MessageThreadItem[] } | null = null;
let threadsInFlight: { limit: number; promise: Promise<MessageThreadItem[]> } | null = null;

export function invalidateMessagingCache(): void {
  countsCache = null;
  threadsCache = null;
}

export async function createOrGetConversationForListing(listingId: string): Promise<string | null> {
  const { data, error } = await supabase.rpc("create_or_get_conversation_for_listing", {
    p_listing_id: listingId,
  });

  if (error) {
    console.error("createOrGetConversationForListing error:", error);
    return null;
  }

  invalidateMessagingCache();
  return typeof data === "string" ? data : null;
}

export async function markConversationRead(conversationId: string): Promise<void> {
  const { error } = await supabase.rpc("mark_conversation_read", { p_conversation_id: conversationId });
  if (error) {
    console.error("markConversationRead error:", error);
    return;
  }
  invalidateMessagingCache();
}

export async function getConversationContext(conversationId: string): Promise<ConversationContext | null> {
  const { data, error } = await supabase.rpc("get_conversation_context", { p_conversation_id: conversationId });
  if (error) {
    console.error("getConversationContext error:", error);
    return null;
  }

  if (!data || typeof data !== "object") return null;

  const ctx = data as ConversationContext;
  const rawCover = ctx?.listing?.cover_image_url;
  const normalizedCover =
    typeof rawCover === "string" ? normalizePublicStorageUrl(rawCover) ?? null : null;

  if (ctx.listing) {
    ctx.listing.cover_image_url = normalizedCover;
  }

  return ctx;
}

export async function archiveConversation(conversationId: string): Promise<boolean> {
  const { error } = await supabase.rpc("archive_conversation", { p_conversation_id: conversationId });
  if (error) {
    console.error("archiveConversation error:", error);
    return false;
  }
  invalidateMessagingCache();
  return true;
}

export async function selectBuyerAndMarkListingSold(conversationId: string): Promise<boolean> {
  const { error } = await supabase.rpc("select_buyer_and_mark_listing_sold", { p_conversation_id: conversationId });
  if (error) {
    console.error("selectBuyerAndMarkListingSold error:", error);
    return false;
  }
  invalidateMessagingCache();
  return true;
}

export async function getMyMessageCounts(opts?: { force?: boolean }): Promise<MessageCounts> {
  const now = Date.now();
  if (!opts?.force && countsCache && now - countsCache.at < COUNTS_TTL_MS) {
    return countsCache.data;
  }

  if (!opts?.force && countsInFlight) return countsInFlight;

  const promise = (async (): Promise<MessageCounts> => {
    const { data, error } = await supabase.rpc("get_my_unread_message_count");
    if (error) {
      console.error("getMyMessageCounts error:", error);
      return { total: 0 };
    }
    return { total: typeof data === "number" ? data : 0 };
  })();

  countsInFlight = promise;

  try {
    const res = await promise;
    countsCache = { at: Date.now(), data: res };
    return res;
  } finally {
    countsInFlight = null;
  }
}

export async function getMyMessageThreads(limit = 25, opts?: { force?: boolean }): Promise<MessageThreadItem[]> {
  const now = Date.now();

  if (!opts?.force && threadsCache && now - threadsCache.at < THREADS_TTL_MS && threadsCache.limit >= limit) {
    return threadsCache.data.slice(0, limit);
  }

  if (!opts?.force && threadsInFlight && threadsInFlight.limit >= limit) {
    const data = await threadsInFlight.promise;
    return data.slice(0, limit);
  }

  const promise = (async (): Promise<MessageThreadItem[]> => {
    const { data, error } = await supabase.rpc("get_my_message_threads", { p_limit: limit });

    if (error) {
      console.error("getMyMessageThreads error:", error);
      return [];
    }

    const rows = Array.isArray(data) ? (data as Array<Record<string, unknown>>) : [];
    return rows.map((r) => {
      const counterpartyDisplayName = safeString(r.counterparty_display_name) || "";
      const sellerDisplayName = safeString(r.seller_display_name) || "—";
      const listingMakeModel = safeString(r.listing_make_model) || "Fahrzeug";
      const nameForTitle = counterpartyDisplayName || sellerDisplayName;
      const title = `${nameForTitle} - ${listingMakeModel}`;

      return {
        conversationId: safeString(r.conversation_id),
        listingId: safeString(r.listing_id),
        title,
        listingMakeModel,
        coverImageUrl: normalizePublicStorageUrl(safeString(r.listing_cover_image_url) || "") ?? null,
        lastMessageAt: safeString(r.last_message_at) || null,
        lastMessagePreview: getPreview(safeString(r.last_message_body)),
        unreadCount: safeNumber(r.unread_count),
        listingStatus: (r.listing_status as ListingStatus) ?? null,
        conversationStatus: safeString(r.conversation_status) || "active",
      };
    });
  })();

  threadsInFlight = { limit, promise };

  try {
    const res = await promise;
    threadsCache = { at: Date.now(), limit, data: res };
    return res;
  } finally {
    threadsInFlight = null;
  }
}

export async function getMessages(conversationId: string): Promise<MessageWithAttachments[]> {
  const { data, error } = await supabase
    .from("messages")
    .select(
      "id, conversation_id, sender_user_id, body, created_at, message_attachments(id, message_id, storage_path, file_name, mime_type, size_bytes, created_at)"
    )
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getMessages error:", error);
    return [];
  }

  const rows = Array.isArray(data) ? data : [];
  return rows.map((row) => ({
    ...(row as MessageRow),
    message_attachments: Array.isArray((row as { message_attachments?: unknown }).message_attachments)
      ? ((row as { message_attachments: MessageAttachmentRow[] }).message_attachments ?? [])
      : [],
  }));
}

async function uploadConversationAttachments(conversationId: string, files: File[]): Promise<UploadAttachmentResult[] | null> {
  const validation = validateFilesForUpload(files);
  if (!validation.ok) {
    console.error("uploadConversationAttachments validation failed:", validation.reason);
    return null;
  }

  const sessionRes = await supabase.auth.getSession();
  const userId = sessionRes.data.session?.user?.id ?? null;
  if (!userId) return null;

  const results: UploadAttachmentResult[] = [];

  for (const file of files) {
    const storagePath = buildAttachmentStoragePath(conversationId, file.name);
    const { error } = await supabase.storage.from(MESSAGE_ATTACHMENTS_BUCKET).upload(storagePath, file, {
      contentType: file.type || "application/octet-stream",
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      console.error("uploadConversationAttachments upload error:", { error, storagePath });
      return null;
    }

    results.push({
      storagePath,
      fileName: file.name,
      mimeType: file.type || null,
      sizeBytes: Number.isFinite(file.size) ? file.size : null,
    });
  }

  return results;
}

async function bestEffortRemoveAttachments(storagePaths: string[]): Promise<void> {
  if (storagePaths.length === 0) return;

  const { error } = await supabase.storage.from(MESSAGE_ATTACHMENTS_BUCKET).remove(storagePaths);
  if (error) {
    console.warn("bestEffortRemoveAttachments failed:", error);
  }
}

export async function createSignedAttachmentUrl(
  storagePath: string,
  opts?: { expiresInSeconds?: number }
): Promise<string | null> {
  const expiresIn = opts?.expiresInSeconds ?? 60;
  const { data, error } = await supabase.storage.from(MESSAGE_ATTACHMENTS_BUCKET).createSignedUrl(storagePath, expiresIn);

  if (error) {
    console.error("createSignedAttachmentUrl error:", error);
    return null;
  }

  return data?.signedUrl ?? null;
}

export async function sendMessage(conversationId: string, body: string): Promise<boolean> {
  const sessionRes = await supabase.auth.getSession();
  const userId = sessionRes.data.session?.user?.id ?? null;
  if (!userId) return false;

  const trimmed = body.trim();
  if (!trimmed) return false;

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_user_id: userId,
    body: trimmed,
  });

  if (error) {
    console.error("sendMessage error:", error);
    return false;
  }

  invalidateMessagingCache();
  return true;
}

export async function sendMessageWithAttachments(params: {
  conversationId: string;
  body: string;
  files: File[];
}): Promise<boolean> {
  const { conversationId, body, files } = params;

  const sessionRes = await supabase.auth.getSession();
  const userId = sessionRes.data.session?.user?.id ?? null;
  if (!userId) return false;

  const trimmed = body.trim();
  const hasText = trimmed.length > 0;

  const uploaded = await uploadConversationAttachments(conversationId, files);
  if (!uploaded) return false;

  const storagePaths = uploaded.map((u) => u.storagePath);

  const messageBody = hasText ? trimmed : "📎 Dokument gesendet";

  const { data: insertedMessage, error: messageError } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_user_id: userId,
      body: messageBody,
    })
    .select("id")
    .single();

  if (messageError || !insertedMessage?.id) {
    console.error("sendMessageWithAttachments message insert error:", messageError);
    await bestEffortRemoveAttachments(storagePaths);
    return false;
  }

  const messageId = insertedMessage.id as string;

  const { error: attachmentError } = await supabase.from("message_attachments").insert(
    uploaded.map((u) => ({
      message_id: messageId,
      storage_path: u.storagePath,
      file_name: u.fileName,
      mime_type: u.mimeType,
      size_bytes: u.sizeBytes,
    }))
  );

  if (attachmentError) {
    console.error("sendMessageWithAttachments attachments insert error:", attachmentError);
    await bestEffortRemoveAttachments(storagePaths);
    return false;
  }

  invalidateMessagingCache();
  return true;
}