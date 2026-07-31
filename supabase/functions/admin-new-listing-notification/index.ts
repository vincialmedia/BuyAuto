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

function safeNumber(v: unknown): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  if (!Number.isFinite(n)) return null;
  return n;
}

type ListingRecord = {
  id?: string | null;
  status?: string | null;
  payment_status?: string | null;
  brand?: string | null;
  model?: string | null;
  title?: string | null;
  first_registration_year?: number | null;
  year?: number | null;
  price?: number | string | null;
  purchase_price_chf?: number | null;
  price_paid_chf?: number | null;
  price_per_month_chf?: number | null;
  location?: string | null;
  canton_code?: string | null;
  created_at?: string | null;
};

function formatListingTitle(record: ListingRecord): string {
  const brand = safeString(record.brand) ?? "";
  const model = safeString(record.model) ?? "";
  const base = [brand, model].filter(Boolean).join(" ");
  const suffix = safeString(record.title) ? ` – ${safeString(record.title)}` : "";
  return (base || "Neues Inserat") + suffix;
}

function formatChf(value: number | null): string {
  if (value === null) return "—";
  try {
    return new Intl.NumberFormat("de-CH", { style: "currency", currency: "CHF", maximumFractionDigits: 0 }).format(value);
  } catch {
    return `CHF ${value}`;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { ok: false, error: "Method Not Allowed" });

  if (!requireServiceAuthorization(req)) return json(401, { ok: false, error: "Unauthorized" });

  const resendKey = (Deno.env.get("RESEND_API_KEY") || "").trim();
  const adminEmail = (Deno.env.get("ADMIN_EMAIL_ADDRESS") || "").trim();

  if (!resendKey) return json(500, { ok: false, error: "RESEND_API_KEY missing" });
  if (!adminEmail) return json(200, { ok: true, skipped: "ADMIN_EMAIL_ADDRESS not set" });

  const resend = new Resend(resendKey);

  const payload = await req.json().catch(() => ({} as Record<string, unknown>));
  const record = ((payload as any)?.record ?? null) as ListingRecord | null;

  if (!record) return json(400, { ok: false, error: "Missing record in payload" });

  const listingId = safeString(record.id);
  if (!listingId) return json(400, { ok: false, error: "Listing id missing" });

  const status = safeString(record.status);
  const paymentStatus = safeString(record.payment_status);

  if (status !== "pending" || paymentStatus !== "paid") {
    return json(200, { ok: true, skipped: "Listing not ready for approval" });
  }

  const listingTitle = formatListingTitle(record);
  const listingUrl = `https://buyauto.ch/fahrzeug/${listingId}`;
  const adminUrl = "https://buyauto.ch/admin";

  const year = safeNumber(record.first_registration_year) ?? safeNumber(record.year);
  const pricePaid = safeNumber(record.price_paid_chf) ?? safeNumber(record.purchase_price_chf) ?? safeNumber(record.price);

  const location = safeString(record.location);
  const canton = safeString(record.canton_code);

  const html = `<!DOCTYPE html>
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
    .row { margin: 6px 0; }
    .label { color: #6b7280; font-size: 13px; }
    .button { display: inline-block; background-color: #111827; color: white; padding: 12px 18px; text-decoration: none; border-radius: 10px; font-weight: 800; }
    a { color: #2563eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://buyauto.ch/buyauto-logo-email.png" alt="BuyAuto" width="160" height="61" style="display: block; margin: 0 auto; border: 0; max-width: 100%;">
    </div>

    <div class="content">
      <p class="h1">Neues Inserat zur Prüfung</p>

      <div class="card">
        <div class="row"><span class="label">Inserat</span><br><strong>${escapeHtml(listingTitle)}</strong></div>
        <div class="row"><span class="label">ID</span><br>${escapeHtml(listingId)}</div>
        <div class="row"><span class="label">Jahr</span><br>${escapeHtml(year ? String(year) : "—")}</div>
        <div class="row"><span class="label">Preis</span><br>${escapeHtml(formatChf(pricePaid))}</div>
        <div class="row"><span class="label">Ort</span><br>${escapeHtml([location, canton].filter(Boolean).join(" · ") || "—")}</div>
        <div class="row"><span class="label">Link</span><br><a href="${listingUrl}">${listingUrl}</a></div>
      </div>

      <div style="text-align: center; margin: 22px 0;">
        <a href="${adminUrl}" class="button">Admin öffnen</a>
      </div>
    </div>
  </div>
</body>
</html>`;

  const sendRes = await resend.emails.send({
    from: "BuyAuto <notifications@email.buyauto.ch>",
    reply_to: "hello@buyauto.ch",
    to: [adminEmail],
    subject: `🚗 Neues Inserat zur Prüfung: ${listingTitle}`,
    html,
  });

  if (sendRes.error) {
    console.error("admin-new-listing-notification resend error:", sendRes.error);
    return json(500, { ok: false, error: "Failed to send admin email" });
  }

  return json(200, { ok: true });
});