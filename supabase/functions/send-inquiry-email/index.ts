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

function json(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}

function requireServiceAuthorization(req: Request): boolean {
  const serviceKey = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "").trim();
  const auth = (req.headers.get("Authorization") || "").trim();
  return Boolean(serviceKey) && auth === `Bearer ${serviceKey}`;
}

function safeString(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

type InquiryPayload = {
  listing_id?: string;
  name?: string;
  email?: string;
  message?: string;
};

type ListingRow = {
  id: string;
  created_by: string | null;
  user_id: string | null;
  brand: string | null;
  model: string | null;
  title: string | null;
};

type ProfileRow = { email: string | null; full_name: string | null };

function formatListingTitle(listing: Pick<ListingRow, "brand" | "model" | "title">): string {
  const brand = listing.brand?.trim() || "";
  const model = listing.model?.trim() || "";
  const base = [brand, model].filter(Boolean).join(" ");
  const suffix = listing.title?.trim() ? ` – ${listing.title.trim()}` : "";
  return (base || "Ihr Inserat") + suffix;
}

function buildEmail(params: {
  ownerName: string;
  listingTitle: string;
  listingUrl: string;
  inquiryName: string;
  inquiryEmail: string;
  inquiryMessage: string;
}): { subject: string; html: string } {
  return {
    subject: `Neue Anfrage zu Ihrem Inserat: ${params.listingTitle}`,
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
    .button { display: inline-block; background-color: #dc2626; color: white; padding: 12px 18px; text-decoration: none; border-radius: 10px; font-weight: 800; }
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
      <p>Hallo ${escapeHtml(params.ownerName)},</p>
      <p>Sie haben eine neue Anfrage erhalten.</p>

      <div class="card">
        <p style="margin: 0; font-weight: 800;">${escapeHtml(params.listingTitle)}</p>
        <p style="margin: 10px 0 0 0;" class="muted">Inserat: <a href="${params.listingUrl}">${params.listingUrl}</a></p>
      </div>

      <div class="card" style="margin-top: 16px;">
        <p style="margin: 0; font-weight: 800;">Kontaktdaten</p>
        <p style="margin: 10px 0 0 0;"><strong>${escapeHtml(params.inquiryName)}</strong></p>
        <p style="margin: 6px 0 0 0;"><a href="mailto:${encodeURIComponent(params.inquiryEmail)}">${escapeHtml(params.inquiryEmail)}</a></p>
      </div>

      <div class="card" style="margin-top: 16px;">
        <p style="margin: 0; font-weight: 800;">Nachricht</p>
        <p style="margin: 12px 0 0 0; white-space: pre-wrap;">${escapeHtml(params.inquiryMessage)}</p>
      </div>

      <div style="text-align: center; margin: 22px 0;">
        <a href="${params.listingUrl}" class="button">Inserat öffnen</a>
      </div>

      <p class="muted">Antworten Sie einfach auf diese E-Mail, um direkt mit dem Interessenten zu kommunizieren.</p>

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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method Not Allowed" });

  if (!requireServiceAuthorization(req)) return json(401, { error: "Unauthorized" });

  const supabaseUrl = (Deno.env.get("SUPABASE_URL") || "").trim();
  const serviceKey = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "").trim();
  const resendKey = (Deno.env.get("RESEND_API_KEY") || "").trim();

  if (!supabaseUrl || !serviceKey) return json(500, { error: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing" });
  if (!resendKey) return json(500, { error: "RESEND_API_KEY missing" });

  const resend = new Resend(resendKey);
  const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const inquiry = ((body as any)?.record ?? body) as InquiryPayload;

  const listingId = safeString(inquiry.listing_id);
  const inquiryName = safeString(inquiry.name) ?? "Unbekannt";
  const inquiryEmail = safeString(inquiry.email);
  const inquiryMessage = safeString(inquiry.message) ?? "";

  if (!listingId) return json(400, { error: "listing_id is required" });
  if (!inquiryEmail) return json(400, { error: "email is required" });
  if (inquiryMessage.length < 2) return json(400, { error: "message is required" });
  if (inquiryMessage.length > 5000) return json(400, { error: "message too long" });

  const { data: listing, error: listingError } = await supabaseAdmin
    .from("listings")
    .select("id,created_by,user_id,brand,model,title")
    .eq("id", listingId)
    .single<ListingRow>();

  if (listingError || !listing) {
    console.error("send-inquiry-email listingError:", listingError);
    return json(404, { error: "Listing not found" });
  }

  const ownerId = (listing.created_by ?? listing.user_id)?.trim() || "";
  if (!ownerId) return json(404, { error: "Listing owner not found" });

  const { data: ownerProfile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("email,full_name")
    .eq("id", ownerId)
    .single<ProfileRow>();

  if (profileError || !ownerProfile?.email) {
    console.error("send-inquiry-email profileError:", profileError);
    return json(404, { error: "Owner email not found" });
  }

  const ownerEmail = ownerProfile.email.trim();
  if (!ownerEmail) return json(404, { error: "Owner email not found" });

  const listingTitle = formatListingTitle(listing);
  const listingUrl = `https://buyauto.ch/fahrzeug/${listing.id}`;
  const ownerName = ownerProfile.full_name?.trim() || "Guten Tag";

  const emailPayload = buildEmail({
    ownerName,
    listingTitle,
    listingUrl,
    inquiryName,
    inquiryEmail,
    inquiryMessage,
  });

  const sendRes = await resend.emails.send({
    from: "BuyAuto <noreply@email.buyauto.ch>",
    to: [ownerEmail],
    bcc: [inquiryEmail],
    reply_to: [inquiryEmail],
    subject: emailPayload.subject,
    html: emailPayload.html,
  });

  if (sendRes.error) {
    console.error("send-inquiry-email resend error:", sendRes.error);
    return json(500, { error: "Failed to send email" });
  }

  return json(200, { ok: true });
});