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

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function requireServiceAuthorization(req: Request): boolean {
  const serviceKey = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "").trim();
  const auth = (req.headers.get("Authorization") || "").trim();
  return Boolean(serviceKey) && auth === `Bearer ${serviceKey}`;
}

type AuthUserRecord = {
  id?: string | null;
  email?: string | null;
  email_confirmed_at?: string | null;
};

type ProfileRow = { full_name: string | null; email: string | null };

function buildUserEmail(params: { name: string }): { subject: string; html: string } {
  return {
    subject: "Willkommen bei BuyAuto – E-Mail bestätigt",
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; line-height: 1.6; color: #111827; background: #ffffff; }
    .container { max-width: 640px; margin: 0 auto; padding: 24px; }
    .header { text-align: center; padding-bottom: 18px; border-bottom: 1px solid #e5e7eb; }
    .content { padding: 22px 0; }
    .h1 { font-size: 22px; font-weight: 800; margin: 0 0 14px 0; color: #111827; }
    .button { display: inline-block; background-color: #dc2626; color: white; padding: 12px 18px; text-decoration: none; border-radius: 10px; font-weight: 800; }
    .footer { border-top: 1px solid #e5e7eb; padding-top: 16px; text-align: center; color: #6b7280; font-size: 12px; }
    a { color: #2563eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://buyauto.ch/buyauto-logo-email.png" alt="BuyAuto" width="160" height="61" style="display: block; margin: 0 auto; border: 0; max-width: 100%;">
    </div>

    <div class="content">
      <p class="h1">Willkommen bei BuyAuto!</p>
      <p>Hallo ${escapeHtml(params.name)},</p>
      <p>Deine E-Mail-Adresse wurde erfolgreich bestätigt und dein Account ist nun aktiv.</p>
      <div style="text-align: center; margin: 22px 0;">
        <a href="https://buyauto.ch/auth" class="button">Jetzt einloggen</a>
      </div>
      <p>Beste Grüsse<br>Dein BuyAuto Team</p>
    </div>

    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} BuyAuto</p>
    </div>
  </div>
</body>
</html>`,
  };
}

function buildAdminEmail(params: { userId: string; userEmail: string }): { subject: string; html: string } {
  const userIdSafe = escapeHtml(params.userId || "-");
  const userEmailSafe = escapeHtml(params.userEmail || "-");

  return {
    subject: "🎉 Neuer Benutzer auf BuyAuto!",
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; color:#111827; line-height:1.6;">
  <h1 style="margin:0 0 12px 0;">Neuer Benutzer</h1>
  <p>Ein neuer Benutzer hat soeben seine E-Mail bestätigt.</p>
  <ul>
    <li><strong>User ID:</strong> ${userIdSafe}</li>
    <li><strong>Email:</strong> ${userEmailSafe}</li>
  </ul>
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

  const resend = new Resend(resendKey);
  const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const record = ((body as any)?.record ?? body) as AuthUserRecord;

  const userEmail = typeof record?.email === "string" ? record.email.trim() : "";
  const userId = typeof record?.id === "string" ? record.id.trim() : "";
  const emailConfirmedAt = record?.email_confirmed_at ?? null;

  if (!userEmail) return json(400, { error: "User email is missing in the payload." });
  if (!userId) return json(400, { error: "User id is missing in the payload." });

  if (!emailConfirmedAt) {
    return json(200, { ok: true, message: "Email not confirmed yet, welcome email not sent" });
  }

  const { error: logError } = await supabaseAdmin.from("email_notification_log").insert({
    kind: "welcome_email_confirmed",
    entity_id: userId,
    recipient_user_id: userId,
    recipient_email: userEmail,
  });

  if (logError) {
    const code = (logError as unknown as { code?: string }).code;
    if (code === "23505") {
      return json(200, { ok: true, skipped: "duplicate" });
    }
    console.error("welcome-email log insert error:", logError);
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("full_name,email")
    .eq("id", userId)
    .maybeSingle<ProfileRow>();

  const displayName = (profile?.full_name ?? "").trim() || "Guten Tag";

  const userEmailPayload = buildUserEmail({ name: displayName });

  const sendToUser = await resend.emails.send({
    from: "BuyAuto <welcome@email.buyauto.ch>",
    reply_to: "hello@buyauto.ch",
    to: userEmail,
    subject: userEmailPayload.subject,
    html: userEmailPayload.html,
  });

  if (sendToUser.error) {
    console.error("welcome-email: sendToUser error:", sendToUser.error);
    return json(500, { ok: false, error: "Failed to send welcome email" });
  }

  if (adminEmail) {
    const adminEmailPayload = buildAdminEmail({ userId, userEmail });

    const sendToAdmin = await resend.emails.send({
      from: "BuyAuto <notifications@email.buyauto.ch>",
      reply_to: "hello@buyauto.ch",
      to: adminEmail,
      subject: adminEmailPayload.subject,
      html: adminEmailPayload.html,
    });

    if (sendToAdmin.error) {
      console.error("welcome-email: sendToAdmin error:", sendToAdmin.error);
    }
  }

  return json(200, { ok: true, message: "Welcome emails processed" });
});