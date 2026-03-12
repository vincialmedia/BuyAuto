import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type ConversationRow = Database["public"]["Tables"]["conversations"]["Row"];
export type MessageRow = Database["public"]["Tables"]["messages"]["Row"];
export type ConversationParticipantRow =
  Database["public"]["Tables"]["conversation_participants"]["Row"];
export type ListingRow = Database["public"]["Tables"]["listings"]["Row"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export interface ConversationWithMessages {
  conversation: ConversationRow;
  messages: MessageRow[];
}

export interface MessageThreadItem {
  conversationId: string;
  listingId: string;
  listingTitle: string;
  listingMakeModel: string;
  coverImageUrl: string | null;
  lastMessageAt: string | null;
  lastMessagePreview: string;
  buyerName: string;
  messageCount: number;
}

export interface MessageCounts {
  total: number;
}

function getListingLabel(listing: Pick<ListingRow, "brand" | "model" | "title">): string {
  const makeModel = `${listing.brand} ${listing.model}`.trim();
  return listing.title?.trim() ? listing.title.trim() : makeModel;
}

function buildMakeModel(listing: Pick<ListingRow, "brand" | "model">): string {
  return `${listing.brand} ${listing.model}`.trim();
}

function getPreview(body: string): string {
  const trimmed = body.trim();
  if (!trimmed) return "";
  if (trimmed.length <= 120) return trimmed;
  return `${trimmed.slice(0, 120)}…`;
}

function getEmailPrefix(email: string | null | undefined): string {
  const safe = (email ?? "").trim();
  if (!safe) return "";
  return safe.split("@")[0] ?? "";
}

function getProfileDisplayName(profile: Pick<ProfileRow, "full_name" | "email"> | null): string {
  if (!profile) return "";
  const full = (profile.full_name ?? "").trim();
  if (full) return full;
  return getEmailPrefix(profile.email);
}

export async function getOrCreateConversationForListing(listingId: string): Promise<ConversationRow | null> {
  const sessionRes = await supabase.auth.getSession();
  const userId = sessionRes.data.session?.user?.id ?? null;
  if (!userId) return null;

  const existing = await supabase
    .from("conversations")
    .select("id, listing_id, created_at, last_message_at")
    .eq("listing_id", listingId)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(25);

  if (existing.error) {
    console.error("getOrCreateConversationForListing: fetch conversations error", existing.error);
    return null;
  }

  const conversations = existing.data ?? [];
  for (const c of conversations) {
    const participantCheck = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("conversation_id", c.id)
      .eq("user_id", userId)
      .maybeSingle();

    if (participantCheck.error) {
      console.error("getOrCreateConversationForListing: participant check error", participantCheck.error);
      continue;
    }

    if (participantCheck.data) {
      return c as ConversationRow;
    }
  }

  const created = await supabase
    .from("conversations")
    .insert({ listing_id: listingId })
    .select("id, listing_id, created_at, last_message_at")
    .single();

  if (created.error) {
    console.error("getOrCreateConversationForListing: create conversation error", created.error);
    return null;
  }

  const addSelf = await supabase
    .from("conversation_participants")
    .insert({ conversation_id: created.data.id, user_id: userId, role: "buyer" })
    .select("conversation_id")
    .single();

  if (addSelf.error) {
    console.error("getOrCreateConversationForListing: add self participant error", addSelf.error);
    return null;
  }

  return created.data as ConversationRow;
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

export async function getMyMessageCounts(): Promise<MessageCounts> {
  const sessionRes = await supabase.auth.getSession();
  const userId = sessionRes.data.session?.user?.id ?? null;
  if (!userId) return { total: 0 };

  const { data: participantRows, error: participantError } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userId);

  if (participantError) {
    console.error("getMyMessageCounts: participants error", participantError);
    return { total: 0 };
  }

  const conversationIds = (participantRows ?? []).map((r) => r.conversation_id);
  if (conversationIds.length === 0) return { total: 0 };

  const { count, error: countError } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .in("conversation_id", conversationIds);

  if (countError) {
    console.error("getMyMessageCounts: messages count error", countError);
    return { total: 0 };
  }

  return { total: count ?? 0 };
}

export async function getMyMessageThreads(limit = 25): Promise<MessageThreadItem[]> {
  const sessionRes = await supabase.auth.getSession();
  const userId = sessionRes.data.session?.user?.id ?? null;
  if (!userId) return [];

  const { data: participantRows, error: participantError } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userId);

  if (participantError) {
    console.error("getMyMessageThreads: participants error", participantError);
    return [];
  }

  const conversationIds = (participantRows ?? []).map((r) => r.conversation_id);
  if (conversationIds.length === 0) return [];

  const { data: conversations, error: convError } = await supabase
    .from("conversations")
    .select("id, listing_id, created_at, last_message_at")
    .in("id", conversationIds)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (convError) {
    console.error("getMyMessageThreads: conversations error", convError);
    return [];
  }

  const rows = conversations ?? [];
  if (rows.length === 0) return [];

  const listingIds = Array.from(new Set(rows.map((c) => c.listing_id)));
  const { data: listings, error: listingsError } = await supabase
    .from("listings")
    .select("id, brand, model, title, cover_image_url")
    .in("id", listingIds);

  if (listingsError) {
    console.error("getMyMessageThreads: listings error", listingsError);
    return [];
  }

  const listingById = new Map<string, Pick<ListingRow, "id" | "brand" | "model" | "title" | "cover_image_url">>();
  for (const l of listings ?? []) {
    listingById.set(l.id, l);
  }

  const { data: allParticipants, error: participantsError } = await supabase
    .from("conversation_participants")
    .select("conversation_id, user_id")
    .in("conversation_id", rows.map((c) => c.id));

  if (participantsError) {
    console.error("getMyMessageThreads: participants batch error", participantsError);
    return [];
  }

  const otherUserIds = Array.from(
    new Set(
      (allParticipants ?? [])
        .filter((p) => p.user_id !== userId)
        .map((p) => p.user_id)
    )
  );

  const { data: otherProfiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, role, full_name, email")
    .in("id", otherUserIds);

  if (profilesError) {
    console.error("getMyMessageThreads: profiles error", profilesError);
    return [];
  }

  const garageOwnerIds = (otherProfiles ?? []).filter((p) => p.role === "garage").map((p) => p.id);
  const { data: garageRows, error: garagesError } =
    garageOwnerIds.length === 0
      ? { data: [], error: null }
      : await supabase.from("garages").select("owner_user_id, garage_name").in("owner_user_id", garageOwnerIds);

  if (garagesError) {
    console.error("getMyMessageThreads: garages error", garagesError);
    return [];
  }

  const garageNameByOwnerId = new Map<string, string>();
  for (const g of garageRows ?? []) {
    garageNameByOwnerId.set(g.owner_user_id, g.garage_name);
  }

  const profileById = new Map<string, Pick<ProfileRow, "id" | "role" | "full_name" | "email">>();
  for (const p of otherProfiles ?? []) {
    profileById.set(p.id, p);
  }

  const otherDisplayNameByUserId = new Map<string, string>();
  for (const p of otherProfiles ?? []) {
    if (p.role === "garage") {
      const garageName = garageNameByOwnerId.get(p.id) ?? "";
      otherDisplayNameByUserId.set(p.id, garageName || getProfileDisplayName(p));
    } else {
      otherDisplayNameByUserId.set(p.id, getProfileDisplayName(p));
    }
  }

  const otherUserIdByConversation = new Map<string, string>();
  for (const p of allParticipants ?? []) {
    if (p.user_id === userId) continue;
    if (!otherUserIdByConversation.has(p.conversation_id)) {
      otherUserIdByConversation.set(p.conversation_id, p.user_id);
    }
  }

  const lastMessageByConversation = new Map<string, Pick<MessageRow, "body" | "created_at">>();
  const messageCountByConversation = new Map<string, number>();

  await Promise.all(
    rows.map(async (c) => {
      const { data: lastMsg } = await supabase
        .from("messages")
        .select("body, created_at")
        .eq("conversation_id", c.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastMsg) lastMessageByConversation.set(c.id, lastMsg);

      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", c.id);

      messageCountByConversation.set(c.id, count ?? 0);
    })
  );

  const threads: MessageThreadItem[] = rows.map((c) => {
    const listing = listingById.get(c.listing_id);
    const listingMakeModel = listing ? buildMakeModel(listing) : "Fahrzeug";
    const listingTitle = listing ? getListingLabel(listing) : listingMakeModel;

    const lastMsg = lastMessageByConversation.get(c.id);
    const lastMessagePreview = lastMsg ? getPreview(lastMsg.body) : "";

    const otherId = otherUserIdByConversation.get(c.id) ?? "";
    const buyerName = otherDisplayNameByUserId.get(otherId) ?? "—";

    return {
      conversationId: c.id,
      listingId: c.listing_id,
      listingTitle,
      listingMakeModel,
      coverImageUrl: listing?.cover_image_url ?? null,
      lastMessageAt: c.last_message_at ?? null,
      lastMessagePreview,
      buyerName,
      messageCount: messageCountByConversation.get(c.id) ?? 0,
    };
  });

  return threads;
}