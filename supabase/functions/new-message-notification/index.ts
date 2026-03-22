import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { Resend } from "npm:resend@3.2.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function preview(body: string): string {
  const t = body.trim();
  if (!t) return "";
  if (t.length <= 180) return t;
  return `${t.slice(0, 180)}…`;
}

function formatListingTitle(record: {
  brand?: string | null;
  model?: string | null;
  title?: string | null;
  make_model?: string | null;
}): string {
  const makeModel = record.make_model?.trim() || "";
  const brand = record.brand?.trim() || "";
  const model = record.model?.trim() || "";
  const base = makeModel || [brand, model].filter(Boolean).join(" ");
  const suffix = record.title?.trim() ? ` – ${record.title.trim()}` : "";
  return (base || "Ihr Fahrzeug") + suffix;
}

function requireServiceAuthorization(req: Request): boolean {
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const auth = req.headers.get("Authorization") || "";
  return Boolean(serviceKey) && auth === `Bearer ${serviceKey}`;
}

function isConversationNotifiable(status: string | null): { ok: true } | { ok: false; reason: string } {
  const s = (status || "").trim().toLowerCase();
  if (!s) return { ok: true };

  const blocked = new Set(["archived", "closed", "blocked", "inactive", "resolved"]);
  if (blocked.has(s)) return { ok: false, reason: `conversation status=${s}` };

  return { ok: true };
}

function buildEmail(params: {
  recipientName: string;
  senderName: string;
  listingTitle: string;
  messagePreview: string;
  dashboardUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `Neue Nachricht zu ${params.listingTitle}`,
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; line-height: 1.6; color: #111827; background: #ffffff; }
    .container { max-width: 640px; margin: 0 auto; padding: 24px; }
    .header { text-align: center; padding-bottom: 18px; border-bottom: 1px solid #e5e7eb; }
    .content { padding: 22px 0; }
    .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 16px; padding: 18px; }
    .button { display: inline-block; background-color: #dc2626; color: white; padding: 12px 18px; text-decoration: none; border-radius: 10px; font-weight: 700; }
    .muted { color: #6b7280; font-size: 13px; }
    .footer { border-top: 1px solid #e5e7eb; padding-top: 16px; text-align: center; color: #6b7280; font-size: 12px; }
    a { color: #2563eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://buyauto.ch/buyauto-logo.png" alt="BuyAuto Logo" height="40">
    </div>

    <div class="content">
      <p>Hallo ${escapeHtml(params.recipientName)},</p>
      <p>Sie haben eine neue Nachricht von <strong>${escapeHtml(params.senderName)}</strong> erhalten.</p>

      <div class="card">
        <p style="margin: 0; font-weight: 700;">${escapeHtml(params.listingTitle)}</p>
        <p style="margin: 12px 0 0 0; white-space: pre-wrap;">${escapeHtml(params.messagePreview)}</p>
      </div>

      <div style="text-align: center; margin: 22px 0;">
        <a href="${params.dashboardUrl}" class="button">Nachricht öffnen</a>
      </div>

      <p class="muted">Hinweis: Antworten Sie direkt in BuyAuto im Nachrichtenbereich.</p>

      <p>Beste Grüsse<br>Ihr BuyAuto Team</p>
    </div>

    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} BuyAuto</p>
    </div>
  </div>
</body>
</html>`,
  };
}

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_user_id: string;
  body: string;
  created_at: string;
};

type ConversationRow = { id: string; listing_id: string; status: string | null };
type ListingRow = { id: string; brand: string | null; model: string | null; make_model: string | null; title: string | null };
type ProfileRow = { id: string; full_name: string | null };

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (!requireServiceAuthorization(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 401,
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendKey = Deno.env.get("RESEND_API_KEY");

  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
  if (!resendKey) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY missing" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const messageId = typeof (body as any)?.message_id === "string" ? ((body as any).message_id as string) : null;
  const recipientUserId =
    typeof (body as any)?.recipient_user_id === "string" ? ((body as any).recipient_user_id as string) : null;

  console.log("new-message-notification invoked", { messageId, recipientUserId });

  if (!messageId || !recipientUserId) {
    return new Response(JSON.stringify({ error: "message_id and recipient_user_id required" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const resend = new Resend(resendKey);

  const { data: msg, error: msgError } = await supabase
    .from("messages")
    .select("id,conversation_id,sender_user_id,body,created_at")
    .eq("id", messageId)
    .single<MessageRow>();

  if (msgError || !msg) {
    console.error("new-message-notification msgError:", msgError);
    return new Response(JSON.stringify({ error: "Message not found" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 404,
    });
  }

  const { data: convo, error: convoError } = await supabase
    .from("conversations")
    .select("id,listing_id,status")
    .eq("id", msg.conversation_id)
    .single<ConversationRow>();

  if (convoError || !convo) {
    console.error("new-message-notification convoError:", convoError);
    return new Response(JSON.stringify({ error: "Conversation not found" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 404,
    });
  }

  const notifiable = isConversationNotifiable(convo.status);
  if (!notifiable.ok) {
    console.log("new-message-notification skipped:", {
      conversationId: convo.id,
      status: convo.status,
      reason: notifiable.reason,
    });
    return new Response(
      JSON.stringify({
        success: true,
        skipped: "conversation not notifiable",
        status: convo.status,
        reason: notifiable.reason,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  }

  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("id,brand,model,make_model,title")
    .eq("id", convo.listing_id)
    .single<ListingRow>();

  if (listingError || !listing) {
    console.error("new-message-notification listingError:", listingError);
    return new Response(JSON.stringify({ error: "Listing not found" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 404,
    });
  }

  const { data: recipientProfile } = await supabase
    .from("profiles")
    .select("id,full_name")
    .eq("id", recipientUserId)
    .maybeSingle<ProfileRow>();

  const { data: senderProfile } = await supabase
    .from("profiles")
    .select("id,full_name")
    .eq("id", msg.sender_user_id)
    .maybeSingle<ProfileRow>();

  const { data: recipientAuth, error: recipientAuthError } = await supabase.auth.admin.getUserById(recipientUserId);

  if (recipientAuthError) {
    console.error("new-message-notification recipientAuthError:", recipientAuthError);
    return new Response(JSON.stringify({ error: "Recipient auth user not found" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 404,
    });
  }

  const recipientEmail = recipientAuth?.user?.email ?? null;

  if (!recipientEmail) {
    console.error("new-message-notification recipientEmail missing for user:", recipientUserId);
    return new Response(JSON.stringify({ error: "Recipient email not found" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 404,
    });
  }

  const { error: logError } = await supabase.from("email_notification_log").insert({
    kind: "new_message",
    entity_id: convo.id,
    message_id: messageId,
    recipient_user_id: recipientUserId,
    recipient_email: recipientEmail,
  });

  if (logError) {
    const code = (logError as unknown as { code?: string }).code;
    if (code === "23505") {
      return new Response(JSON.stringify({ success: true, skipped: "duplicate" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    console.error("new-message-notification log insert error:", logError);
    return new Response(JSON.stringify({ error: "Could not log notification" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  const recipientName = recipientProfile?.full_name?.trim() || "Guten Tag";
  const senderName = senderProfile?.full_name?.trim() || "Ein Nutzer";
  const listingTitle = formatListingTitle(listing);
  const messagePreview = preview(msg.body || "Neue Nachricht");
  const dashboardUrl = `https://buyauto.ch/dashboard/messages/${convo.id}`;

  const email = buildEmail({
    recipientName,
    senderName,
    listingTitle,
    messagePreview,
    dashboardUrl,
  });

  const sendRes = await resend.emails.send({
    from: "BuyAuto <noreply@email.buyauto.ch>",
    to: recipientEmail,
    subject: email.subject,
    html: email.html,
  });

  if (sendRes.error) {
    console.error("new-message-notification resend error:", sendRes.error);

    const { error: cleanupError } = await supabase
      .from("email_notification_log")
      .delete()
      .match({ kind: "new_message", message_id: messageId, recipient_user_id: recipientUserId });

    if (cleanupError) console.error("new-message-notification cleanupError:", cleanupError);

    return new Response(JSON.stringify({ error: "Failed to send email" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
});