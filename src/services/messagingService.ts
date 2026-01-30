import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type ConversationRow = Database["public"]["Tables"]["conversations"]["Row"];
export type MessageRow = Database["public"]["Tables"]["messages"]["Row"];

export interface ConversationWithMessages {
  conversation: ConversationRow;
  messages: MessageRow[];
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