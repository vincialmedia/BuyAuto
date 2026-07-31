import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { Resend } from "npm:resend@3.2.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeString(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function isValidEmail(email: string): boolean {
  const e = email.trim();
  if (e.length < 5 || e.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

type ServiceInquiryRecord = {
  id?: string;
  inquiry_type?: string;
  vorname?: string;
  name?: string;
  email?: string;
  phone?: string | null;
  leasinggesellschaft?: string | null;
  nachricht?: string;
  created_at?: string;
};

function labelForInquiryType(v: string): string {
  const labels: Record<string, string> = {
    uebernahme_begleiten: "Leasingübernahme begleiten",
    leasing_exit_full_service: "Leasing Exit - Full Service",
    other: "Andere Anfrage",
  };

  return labels[v] || v;
}

function buildEmail(params: {
  inquiryTypeLabel: string;
  inquiryName: string;
  inquiryEmail: string;
  inquiryPhone: string;
  inquiryLeasingCompany: string;
  inquiryMessage: string;
  createdAt: string | null;
  id: string | null;
}): { subject: string; html: string } {
  const metaLine = [params.createdAt ? `Zeit: ${params.createdAt}` : null, params.id ? `ID: ${params.id}` : null]
    .filter(Boolean)
    .join(" · ");

  return {
    subject: `Concierge Anfrage: ${params.inquiryTypeLabel}`,
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; line-height: 1.6; color: #111827; background: #ffffff; }
    .container { max-width: 640px; margin: 0 auto; padding: 24px; }
    .header { text-align: center; padding-bottom: 18px; border-bottom: 1px solid #e5e7eb; }
    .content { padding: 22px 0; }
    .h1 { font-size: 20px; font-weight: 800; margin: 0 0 14px 0; color: #111827; }
    .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 16px; padding: 18px; }
    .muted { color: #6b7280; font-size: 13px; }
    a { color: #2563eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://buyauto.ch/buyauto-logo-email.png" alt="BuyAuto" width="160" height="61" style="display: block; margin: 0 auto; border: 0; max-width: 100%;">
    </div>

    <div class="content">
      <p class="h1">Neue Leasing Concierge Anfrage</p>
      ${metaLine ? `<p class="muted" style="margin: 0 0 14px 0;">${escapeHtml(metaLine)}</p>` : ""}

      <div class="card">
        <p style="margin: 0; font-weight: 800;">Service</p>
        <p style="margin: 10px 0 0 0;">${escapeHtml(params.inquiryTypeLabel)}</p>
      </div>

      <div class="card" style="margin-top: 16px;">
        <p style="margin: 0; font-weight: 800;">Kontaktdaten</p>
        <p style="margin: 10px 0 0 0;"><strong>${escapeHtml(params.inquiryName)}</strong></p>
        <p style="margin: 6px 0 0 0;"><a href="mailto:${encodeURIComponent(params.inquiryEmail)}">${escapeHtml(params.inquiryEmail)}</a></p>
        <p style="margin: 6px 0 0 0;">Telefon: ${escapeHtml(params.inquiryPhone)}</p>
        <p style="margin: 6px 0 0 0;">Leasinggesellschaft: ${escapeHtml(params.inquiryLeasingCompany)}</p>
      </div>

      <div class="card" style="margin-top: 16px;">
        <p style="margin: 0; font-weight: 800;">Nachricht / Eckdaten</p>
        <p style="margin: 12px 0 0 0; white-space: pre-wrap;">${escapeHtml(params.inquiryMessage)}</p>
      </div>

      <p class="muted" style="margin-top: 18px; text-align: center;">
        Diese Anfrage wurde über das Leasing-Concierge-Formular auf BuyAuto.ch gesendet.
      </p>
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
  const adminEmail = (Deno.env.get("ADMIN_EMAIL_ADDRESS") || "").trim();

  if (!supabaseUrl || !serviceKey) return json(500, { error: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing" });
  if (!resendKey) return json(500, { error: "RESEND_API_KEY missing" });

  const toEmail = adminEmail || "hello@buyauto.ch";

  const resend = new Resend(resendKey);
  const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const record = ((body as any)?.record ?? body) as ServiceInquiryRecord;

  const inquiryEmail = safeString(record.email);
  if (!inquiryEmail) return json(400, { error: "Email is required" });
  if (!isValidEmail(inquiryEmail)) return json(400, { error: "Email is invalid" });

  const inquiryType = safeString(record.inquiry_type) ?? "other";
  const inquiryTypeLabel = labelForInquiryType(inquiryType);

  const inquiryName =
    [safeString(record.vorname), safeString(record.name)].filter(Boolean).join(" ").trim() || "Unbekannt";
  const inquiryPhone = safeString(record.phone) ?? "Nicht angegeben";
  const inquiryLeasingCompany = safeString(record.leasinggesellschaft) ?? "Nicht angegeben";
  const inquiryMessage = safeString(record.nachricht) ?? "Keine Nachricht";

  if (inquiryMessage.length > 8000) return json(400, { error: "message too long" });

  const { error: logError } = await supabaseAdmin.from("email_notification_log").insert({
    kind: "service_inquiry",
    entity_id: record.id ?? null,
    recipient_email: inquiryEmail,
  });

  if (logError) {
    const code = (logError as unknown as { code?: string }).code;
    if (code === "23505") {
      return json(200, { ok: true, skipped: "duplicate" });
    }
    console.error("service-inquiry-email log insert error:", logError);
  }

  const emailPayload = buildEmail({
    inquiryTypeLabel,
    inquiryName,
    inquiryEmail,
    inquiryPhone,
    inquiryLeasingCompany,
    inquiryMessage,
    createdAt: typeof record.created_at === "string" ? record.created_at : null,
    id: typeof record.id === "string" ? record.id : null,
  });

  const { data, error } = await resend.emails.send({
    from: "BuyAuto <noreply@email.buyauto.ch>",
    to: [toEmail],
    reply_to: inquiryEmail,
    subject: emailPayload.subject,
    html: emailPayload.html,
  });

  if (error) {
    console.error("service-inquiry-email resend error:", error);
    return json(400, { error: error.message });
  }

  return json(200, { ok: true, id: data?.id });
});