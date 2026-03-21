import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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

function safeString(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function json(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}

function isAllowedOrigin(origin: string): boolean {
  const o = origin.toLowerCase();
  if (o === "https://buyauto.ch" || o === "https://www.buyauto.ch") return true;
  if (o.endsWith(".vercel.app")) return true;
  if (o.startsWith("http://localhost") || o.startsWith("http://127.0.0.1")) return true;
  return false;
}

type ServiceInquiryPayload = {
  inquiry_type?: string;
  name?: string;
  email?: string;
  phone?: string;
  leasinggesellschaft?: string;
  leasing_company?: string;
  nachricht?: string;
  message?: string;
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
}): { subject: string; html: string } {
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
      <img src="https://buyauto.ch/buyauto-logo.png" alt="BuyAuto Logo" height="40">
    </div>

    <div class="content">
      <p class="h1">Neue Leasing Concierge Anfrage</p>

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

  const origin = req.headers.get("Origin");
  if (origin && !isAllowedOrigin(origin)) {
    return json(403, { error: "Forbidden origin" });
  }

  const resendKey = (Deno.env.get("RESEND_API_KEY") || "").trim();
  if (!resendKey) return json(500, { error: "RESEND_API_KEY missing" });

  const adminEmail = (Deno.env.get("ADMIN_EMAIL_ADDRESS") || "").trim();
  const toEmail = adminEmail || "hello@buyauto.ch";

  const resend = new Resend(resendKey);

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const inquiry = ((body as any)?.record ?? body) as ServiceInquiryPayload;

  const inquiryEmail = safeString(inquiry.email);
  if (!inquiryEmail) return json(400, { error: "Email is required" });

  const inquiryType = safeString(inquiry.inquiry_type) ?? "other";
  const inquiryTypeLabel = labelForInquiryType(inquiryType);

  const inquiryName = safeString(inquiry.name) ?? "Unbekannt";
  const inquiryPhone = safeString(inquiry.phone) ?? "Nicht angegeben";
  const inquiryLeasingCompany =
    safeString(inquiry.leasinggesellschaft) ?? safeString(inquiry.leasing_company) ?? "Nicht angegeben";
  const inquiryMessage = safeString(inquiry.nachricht) ?? safeString(inquiry.message) ?? "Keine Nachricht";

  if (inquiryMessage.length > 8000) return json(400, { error: "message too long" });

  const emailPayload = buildEmail({
    inquiryTypeLabel,
    inquiryName,
    inquiryEmail,
    inquiryPhone,
    inquiryLeasingCompany,
    inquiryMessage,
  });

  const { data, error } = await resend.emails.send({
    from: "BuyAuto <noreply@email.buyauto.ch>",
    to: [toEmail],
    reply_to: [inquiryEmail],
    subject: emailPayload.subject,
    html: emailPayload.html,
  });

  if (error) {
    console.error("service-inquiry-email resend error:", error);
    return json(400, { error: error.message });
  }

  return json(200, { ok: true, id: data?.id });
});