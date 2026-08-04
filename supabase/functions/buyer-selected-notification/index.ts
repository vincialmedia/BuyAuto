import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { Resend } from "npm:resend@3.2.0";

// Fired by select_buyer_and_mark_listing_sold when a seller picks the buyer.
// Always emails the buyer ("Sie wurden als Käufer ausgewählt"); for a
// Leasingübernahme additionally emails buyer AND seller their next steps with
// the leasing bank (Übernahmeformular, Bonitätsprüfung, ID-Kopie, …).

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

function formatListingTitle(record: {
  brand?: string | null;
  model?: string | null;
  title?: string | null;
  year?: number | null;
}): string {
  const brand = record.brand?.trim() || "";
  const model = record.model?.trim() || "";
  const base = [brand, model].filter(Boolean).join(" ");
  const withYear = record.year ? `${base} (${record.year})` : base;
  return withYear || "das Fahrzeug";
}

function formatChf(value: number | null | undefined): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return new Intl.NumberFormat("de-CH").format(value);
}

function requireServiceAuthorization(req: Request): boolean {
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const auth = req.headers.get("Authorization") || "";
  return Boolean(serviceKey) && auth === `Bearer ${serviceKey}`;
}

function templateShell(params: { heading: string; bodyHtml: string }): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; line-height: 1.6; color: #111827; background: #ffffff; }
    .container { max-width: 640px; margin: 0 auto; padding: 24px; }
    .header { text-align: center; padding-bottom: 18px; border-bottom: 1px solid #e5e7eb; }
    .content { padding: 22px 0; }
    .h1 { font-size: 22px; font-weight: 800; margin: 0; color: #111827; }
    .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 16px; padding: 18px; }
    .checklist { background: #fffbeb; border: 1px solid #fde68a; border-radius: 16px; padding: 18px; margin-top: 18px; }
    .checklist h3 { margin: 0 0 8px 0; font-size: 15px; color: #92400e; }
    .checklist ol { margin: 0 0 0 18px; padding: 0; }
    .checklist li { margin: 6px 0; font-size: 14px; }
    .button { display: inline-block; background-color: #dc2626; color: white; padding: 12px 18px; text-decoration: none; border-radius: 10px; font-weight: 800; }
    .muted { color: #6b7280; font-size: 13px; }
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
      <p class="h1">${params.heading}</p>
      ${params.bodyHtml}
    </div>

    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} BuyAuto</p>
    </div>
  </div>
</body>
</html>`;
}

function buildListingCard(params: { listingTitle: string; priceLine: string | null }): string {
  const priceBlock = params.priceLine
    ? `<p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;">${escapeHtml(params.priceLine)}</p>`
    : "";

  return `<div class="card">
    <p style="margin: 0; font-weight: 800;">${escapeHtml(params.listingTitle)}</p>
    ${priceBlock}
  </div>`;
}

// Consolidated from Swiss leasing providers (Cembra Money Bank, BANK-now,
// MultiLease, AMAG Leasing) and marketplace guides: the bank must approve the
// takeover, the new lessee is vetted like a new customer.
function buyerLeasingChecklistHtml(): string {
  return `<div class="checklist">
    <h3>Ihre nächsten Schritte für die Leasingübernahme</h3>
    <ol>
      <li>Füllen Sie Ihren Teil des Übernahmeformulars der Leasingbank aus und unterschreiben Sie die Einwilligung zur <strong>Bonitätsprüfung</strong> – die Bank prüft Sie wie einen Neukunden.</li>
      <li>Reichen Sie die verlangten Unterlagen ein: Kopie von <strong>ID/Pass bzw. Ausländerausweis (B/C)</strong>, die letzten <strong>3 Lohnabrechnungen</strong>, je nach Bank auch einen Betreibungsauszug.</li>
      <li>Schliessen Sie eine <strong>Vollkaskoversicherung</strong> ab – sie ist während der ganzen Leasingdauer obligatorisch.</li>
      <li>Besichtigen Sie das Fahrzeug gemeinsam und halten Sie den Zustand schriftlich fest – Vorschäden gehen auf Sie über.</li>
      <li>Unterschreiben Sie nach der Genehmigung durch die Bank den übernommenen Leasingvertrag. Die Umschreibung beim Strassenverkehrsamt veranlasst in der Regel die Leasingbank.</li>
    </ol>
    <p class="muted" style="margin: 10px 0 0 0;">Ablauf und Gebühren unterscheiden sich je nach Leasingbank (z.&nbsp;B. Cembra Money Bank, BANK-now, MultiLease, AMAG Leasing). Massgebend sind immer die Angaben der Bank. Die vollständige Checkliste steht auch in Ihrem Chat.</p>
  </div>`;
}

function sellerLeasingChecklistHtml(): string {
  return `<div class="checklist">
    <h3>Ihre nächsten Schritte für die Leasingübernahme</h3>
    <ol>
      <li>Kontaktieren Sie Ihre <strong>Leasingbank</strong> und melden Sie die gewünschte Vertragsübernahme. Fragen Sie nach dem <strong>Übernahmeformular</strong> („Antrag auf Vertragsübernahme“).</li>
      <li>Füllen Sie das Formular aus, unterschreiben Sie es und legen Sie eine <strong>Kopie Ihrer ID</strong> bei.</li>
      <li>Stellen Sie sicher, dass alle Leasingraten bezahlt sind. Viele Banken (z.&nbsp;B. BANK-now oder Cembra) verlangen zudem mind. 12 Monate Restlaufzeit.</li>
      <li>Klären Sie die <strong>Übernahmegebühr</strong> der Bank (je nach Anbieter ca. CHF 100–600) und wer sie übernimmt.</li>
      <li>Übergeben Sie das Fahrzeug erst, wenn die Bank die Übernahme <strong>schriftlich genehmigt</strong> hat – bis dahin haften Sie weiter.</li>
    </ol>
    <p class="muted" style="margin: 10px 0 0 0;">Ablauf und Gebühren unterscheiden sich je nach Leasingbank (z.&nbsp;B. Cembra Money Bank, BANK-now, MultiLease, AMAG Leasing). Massgebend sind immer die Angaben der Bank. Die vollständige Checkliste steht auch in Ihrem Chat.</p>
  </div>`;
}

type ConversationRow = { id: string; listing_id: string; status: string | null };
type ListingRow = {
  id: string;
  brand: string | null;
  model: string | null;
  title: string | null;
  year: number | null;
  deal_type: string | null;
  price_per_month_chf: number | null;
  purchase_price_chf: number | null;
  garage_id: string | null;
  created_by: string | null;
  user_id: string | null;
};
type ParticipantRow = { conversation_id: string; user_id: string | null; role: string | null };
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
  const conversationId =
    typeof (body as any)?.conversation_id === "string" ? ((body as any).conversation_id as string) : null;

  console.log("buyer-selected-notification invoked", { conversationId });

  if (!conversationId) {
    return new Response(JSON.stringify({ error: "conversation_id required" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const resend = new Resend(resendKey);

  const { data: convo, error: convoError } = await supabase
    .from("conversations")
    .select("id,listing_id,status")
    .eq("id", conversationId)
    .single<ConversationRow>();

  if (convoError || !convo) {
    console.error("buyer-selected-notification convoError:", convoError);
    return new Response(JSON.stringify({ error: "Conversation not found" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 404,
    });
  }

  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("id,brand,model,title,year,deal_type,price_per_month_chf,purchase_price_chf,garage_id,created_by,user_id")
    .eq("id", convo.listing_id)
    .single<ListingRow>();

  if (listingError || !listing) {
    console.error("buyer-selected-notification listingError:", listingError);
    return new Response(JSON.stringify({ error: "Listing not found" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 404,
    });
  }

  const { data: participants, error: participantsError } = await supabase
    .from("conversation_participants")
    .select("conversation_id,user_id,role")
    .eq("conversation_id", conversationId);

  if (participantsError) {
    console.error("buyer-selected-notification participantsError:", participantsError);
    return new Response(JSON.stringify({ error: "Participants not found" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 404,
    });
  }

  const rows = (participants ?? []) as ParticipantRow[];
  const buyerUserId = rows.find((p) => p.role === "buyer")?.user_id ?? null;
  let sellerUserId = rows.find((p) => p.role === "seller")?.user_id ?? null;

  if (!sellerUserId) {
    if (listing.garage_id) {
      const { data: garage } = await supabase
        .from("garages")
        .select("owner_user_id")
        .eq("id", listing.garage_id)
        .maybeSingle<{ owner_user_id: string | null }>();
      sellerUserId = garage?.owner_user_id ?? null;
    }
    if (!sellerUserId) sellerUserId = listing.created_by ?? listing.user_id ?? null;
  }

  if (!buyerUserId) {
    console.error("buyer-selected-notification: no buyer participant", { conversationId });
    return new Response(JSON.stringify({ error: "Buyer participant not found" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 404,
    });
  }

  const profileIds = [buyerUserId, sellerUserId].filter(Boolean) as string[];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id,full_name")
    .in("id", profileIds);

  const profileById = new Map<string, ProfileRow>();
  for (const p of (profiles ?? []) as ProfileRow[]) profileById.set(p.id, p);

  let sellerDisplayName = profileById.get(sellerUserId ?? "")?.full_name?.trim() || "";
  if (listing.garage_id) {
    const { data: garage } = await supabase
      .from("garages")
      .select("garage_name")
      .eq("id", listing.garage_id)
      .maybeSingle<{ garage_name: string | null }>();
    sellerDisplayName = garage?.garage_name?.trim() || sellerDisplayName;
  }

  const isLeaseTakeover = listing.deal_type === "lease_takeover";
  const listingTitle = formatListingTitle(listing);
  const monthly = formatChf(listing.price_per_month_chf);
  const purchase = formatChf(listing.purchase_price_chf);
  const priceLine = monthly ? `CHF ${monthly} / Monat` : purchase ? `Kaufpreis CHF ${purchase}` : null;
  const conversationUrl = `https://buyauto.ch/dashboard/messages/${convo.id}`;

  const results: Record<string, string> = {};

  async function sendOnce(params: {
    kind: string;
    recipientUserId: string;
    subject: string;
    html: string;
  }): Promise<"sent" | "skipped" | "failed"> {
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(params.recipientUserId);
    if (authError || !authUser?.user?.email) {
      console.error("buyer-selected-notification auth lookup failed:", { userId: params.recipientUserId, authError });
      return "failed";
    }
    const email = authUser.user.email;

    const { error: logError } = await supabase.from("email_notification_log").insert({
      kind: params.kind,
      entity_id: conversationId,
      recipient_user_id: params.recipientUserId,
      recipient_email: email,
    });

    if (logError) {
      if ((logError as unknown as { code?: string }).code === "23505") return "skipped";
      console.error("buyer-selected-notification log insert error:", logError);
      return "failed";
    }

    const sendRes = await resend.emails.send({
      from: "BuyAuto <noreply@email.buyauto.ch>",
      reply_to: "hello@buyauto.ch",
      to: email,
      subject: params.subject,
      html: params.html,
    });

    if (sendRes.error) {
      console.error("buyer-selected-notification resend error:", sendRes.error);
      const { error: cleanupError } = await supabase
        .from("email_notification_log")
        .delete()
        .match({ kind: params.kind, entity_id: conversationId, recipient_user_id: params.recipientUserId });
      if (cleanupError) console.error("buyer-selected-notification cleanupError:", cleanupError);
      return "failed";
    }

    return "sent";
  }

  const buyerName = profileById.get(buyerUserId)?.full_name?.trim() || "Guten Tag";
  const card = buildListingCard({ listingTitle, priceLine });

  const buyerHtml = templateShell({
    heading: "🎉 Sie wurden als Käufer ausgewählt",
    bodyHtml: `
      <p>Hallo ${escapeHtml(buyerName)},</p>
      <p>gute Neuigkeiten: ${sellerDisplayName ? `<strong>${escapeHtml(sellerDisplayName)}</strong>` : "die Verkäuferseite"} hat Sie als Käufer für das folgende Fahrzeug ausgewählt.</p>
      ${card}
      ${isLeaseTakeover ? buyerLeasingChecklistHtml() : ""}
      <p style="margin-top: 18px;">Der Chat mit ${sellerDisplayName ? escapeHtml(sellerDisplayName) : "der Verkäuferseite"} bleibt für Sie offen – besprechen Sie dort die Übergabe${isLeaseTakeover ? " und die Details der Leasingübernahme" : ""}.</p>
      <div style="text-align: center; margin: 22px 0;">
        <a href="${conversationUrl}" class="button">Zum Chat</a>
      </div>
      <p>Beste Grüsse<br>Ihr BuyAuto Team</p>
    `,
  });

  results.buyer = await sendOnce({
    kind: "buyer_selected_buyer",
    recipientUserId: buyerUserId,
    subject: `🎉 Sie wurden als Käufer ausgewählt – ${listingTitle}`,
    html: buyerHtml,
  });

  if (isLeaseTakeover && sellerUserId) {
    const sellerName = profileById.get(sellerUserId)?.full_name?.trim() || sellerDisplayName || "Guten Tag";

    const sellerHtml = templateShell({
      heading: "Nächste Schritte für Ihre Leasingübernahme",
      bodyHtml: `
        <p>Hallo ${escapeHtml(sellerName)},</p>
        <p>Sie haben <strong>${escapeHtml(buyerName)}</strong> als Käufer für das folgende Fahrzeug ausgewählt. Damit die Leasingübernahme zustande kommt, muss Ihre Leasingbank den Wechsel genehmigen.</p>
        ${card}
        ${sellerLeasingChecklistHtml()}
        <p style="margin-top: 18px;">Der Chat mit ${escapeHtml(buyerName)} bleibt für Sie offen – besprechen Sie dort die Übergabe und tauschen Sie Dokumente aus.</p>
        <div style="text-align: center; margin: 22px 0;">
          <a href="${conversationUrl}" class="button">Zum Chat</a>
        </div>
        <p>Beste Grüsse<br>Ihr BuyAuto Team</p>
      `,
    });

    results.seller = await sendOnce({
      kind: "buyer_selected_seller",
      recipientUserId: sellerUserId,
      subject: `Nächste Schritte für Ihre Leasingübernahme – ${listingTitle}`,
      html: sellerHtml,
    });
  }

  const failed = Object.values(results).includes("failed");
  return new Response(JSON.stringify({ success: !failed, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: failed ? 500 : 200,
  });
});
