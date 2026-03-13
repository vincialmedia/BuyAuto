import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type ConversationRow = Database["public"]["Tables"]["conversations"]["Row"];
export type MessageRow = Database["public"]["Tables"]["messages"]["Row"];
export type ConversationParticipantRow =
  Database["public"]["Tables"]["conversation_participants"]["Row"];

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
  buyer: {
    id: string | null;
    full_name: string | null;
    email: string | null;
  };
  seller: {
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

export async function createOrGetConversationForListing(listingId: string): Promise<string | null> {
  const { data, error } = await supabase.rpc("create_or_get_conversation_for_listing", {
    p_listing_id: listingId,
  });

  if (error) {
    console.error("createOrGetConversationForListing error:", error);
    return null;
  }

  return typeof data === "string" ? data : null;
}

export async function markConversationRead(conversationId: string): Promise<void> {
  const { error } = await supabase.rpc("mark_conversation_read", { p_conversation_id: conversationId });
  if (error) console.error("markConversationRead error:", error);
}

export async function getConversationContext(conversationId: string): Promise<ConversationContext | null> {
  const { data, error } = await supabase.rpc("get_conversation_context", { p_conversation_id: conversationId });
  if (error) {
    console.error("getConversationContext error:", error);
    return null;
  }

  if (!data || typeof data !== "object") return null;
  return data as ConversationContext;
}

export async function archiveConversation(conversationId: string): Promise<boolean> {
  const { error } = await supabase.rpc("archive_conversation", { p_conversation_id: conversationId });
  if (error) {
    console.error("archiveConversation error:", error);
    return false;
  }
  return true;
}

export async function selectBuyerAndMarkListingSold(conversationId: string): Promise<boolean> {
  const { error } = await supabase.rpc("select_buyer_and_mark_listing_sold", { p_conversation_id: conversationId });
  if (error) {
    console.error("selectBuyerAndMarkListingSold error:", error);
    return false;
  }
  return true;
}

export async function getMyMessageCounts(): Promise<MessageCounts> {
  const { data, error } = await supabase.rpc("get_my_unread_message_count");
  if (error) {
    console.error("getMyMessageCounts error:", error);
    return { total: 0 };
  }
  return { total: typeof data === "number" ? data : 0 };
}

export async function getMyMessageThreads(limit = 25): Promise<MessageThreadItem[]> {
  const { data, error } = await supabase.rpc("get_my_message_threads", { p_limit: limit });

  if (error) {
    console.error("getMyMessageThreads error:", error);
    return [];
  }

  const rows = Array.isArray(data) ? (data as Array<Record<string, unknown>>) : [];
  return rows.map((r) => {
    const sellerDisplayName = safeString(r.seller_display_name) || "—";
    const listingMakeModel = safeString(r.listing_make_model) || "Fahrzeug";
    const title = `${sellerDisplayName} - ${listingMakeModel}`;

    return {
      conversationId: safeString(r.conversation_id),
      listingId: safeString(r.listing_id),
      title,
      listingMakeModel,
      coverImageUrl: safeString(r.listing_cover_image_url) || null,
      lastMessageAt: safeString(r.last_message_at) || null,
      lastMessagePreview: getPreview(safeString(r.last_message_body)),
      unreadCount: safeNumber(r.unread_count),
      listingStatus: (r.listing_status as ListingStatus) ?? null,
      conversationStatus: safeString(r.conversation_status) || "active",
    };
  });
}

export async function getMessages(conversationId: string): Promise<MessageRow[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_user_id, body, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getMessages error:", error);
    return [];
  }

  return data ?? [];
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

  return true;
}