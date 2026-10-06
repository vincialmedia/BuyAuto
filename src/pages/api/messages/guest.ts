import type { NextApiRequest, NextApiResponse } from "next";
import { createHmac, randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/integrations/supabase/types";
import {
  GUEST_MESSAGE_LIMITS,
  GUEST_PASSWORD_TOO_SHORT,
  validateGuestMessage,
  type GuestMessageErrorCode,
  type GuestMessageField,
  type GuestMessageResponse,
} from "@/lib/buyauto/guestMessage";

// A logged-out visitor sends their first message to a seller and creates their
// account in the same step. The account is a normal one, made through the
// normal Supabase signup (same metadata, same confirmation email, same welcome
// email once confirmed); the only difference is that the message goes out
// before the email is confirmed. Existing accounts are never written for here:
// the client logs in with the password and uses the logged-in chat.

const GUEST_SUBMISSIONS_PER_IP_PER_DAY = 20;

// Where the confirmation link lands. Supabase accepts redirects on the Site
// URL's own host without an allow-list entry; vercel.json forwards the apex to
// www, and /auth sends the now signed-in buyer on to their messages.
const CONFIRMATION_REDIRECT = "https://buyauto.ch/auth?redirect=%2Fdashboard%2Fmessages";

type Precheck = {
  listing_available: boolean;
  is_seller_email?: boolean;
  account_exists?: boolean;
};

// The service-role RPCs from the guest_listing_messages migrations are not in
// the generated types yet.
type UntypedRpc = <T>(
  fn: string,
  args: Record<string, unknown>
) => PromiseLike<{ data: T | null; error: { message: string } | null }>;

const GENERIC_ERROR = "Das hat nicht geklappt. Bitte versuch es nochmals.";
const MESSAGE_FAILED =
  "Dein Konto ist erstellt, aber die Nachricht ging nicht raus. Bestätige deine E-Mail, log dich ein und schick sie nochmals.";

function fail(
  res: NextApiResponse<GuestMessageResponse>,
  httpStatus: number,
  error: GuestMessageErrorCode,
  message: string,
  field?: GuestMessageField
) {
  return res.status(httpStatus).json({ status: "error", error, message, ...(field ? { field } : {}) });
}

/** Only our own pages may post here: a JSON body (a cross-site form can't send one without a CORS preflight) from the same origin. */
function isSameOriginJson(req: NextApiRequest): boolean {
  const contentType = String(req.headers["content-type"] ?? "").toLowerCase();
  if (!contentType.startsWith("application/json")) return false;

  const fetchSite = req.headers["sec-fetch-site"];
  if (typeof fetchSite === "string" && fetchSite !== "same-origin") return false;

  const origin = req.headers.origin;
  if (typeof origin === "string" && origin) {
    const hosts = [req.headers["x-forwarded-host"], req.headers.host].filter((h): h is string => typeof h === "string");
    try {
      if (!hosts.includes(new URL(origin).host)) return false;
    } catch {
      return false;
    }
  }
  return true;
}

/** The client's network for the per-IP limit: the IPv4 address, or the /64 of an IPv6 address (one subscriber). */
function clientNetwork(req: NextApiRequest): string {
  const realIp = req.headers["x-real-ip"];
  const forwarded = req.headers["x-forwarded-for"];
  let ip =
    (typeof realIp === "string" && realIp.trim()) ||
    (typeof forwarded === "string" && forwarded.split(",")[0].trim()) ||
    req.socket.remoteAddress ||
    "unknown";

  const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mapped) ip = mapped[1];
  if (!ip.includes(":")) return ip;

  const [head, tail = ""] = ip.toLowerCase().split("::");
  const headParts = head ? head.split(":") : [];
  const tailParts = tail ? tail.split(":") : [];
  const missing = Math.max(0, 8 - headParts.length - tailParts.length);
  const groups = [...headParts, ...Array(missing).fill("0"), ...tailParts];
  return `${groups.slice(0, 4).map((g) => g || "0").join(":")}::/64`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<GuestMessageResponse>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return fail(res, 405, "invalid_input", "Method not allowed");
  }
  if (!isSameOriginJson(req)) {
    return fail(res, 403, "invalid_input", "Diese Anfrage ist nicht erlaubt.");
  }

  const body = (req.body && typeof req.body === "object" ? req.body : {}) as Record<string, unknown>;

  // Honeypot: a field humans never see. Bots get the success answer and
  // nothing is created or sent.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return res.status(200).json({ status: "sent" });
  }

  const parsed = validateGuestMessage(body);
  if (parsed.ok === false) {
    return fail(res, 400, "invalid_input", parsed.message, parsed.field ?? undefined);
  }
  const input = parsed.value;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("guest message: Supabase service configuration missing");
    return fail(res, 503, "server_error", "Nachrichten sind momentan nicht verfügbar. Bitte versuch es später nochmals.");
  }

  const admin = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const rpc = admin.rpc.bind(admin) as unknown as UntypedRpc;

  // Keyed hash: the stored value can't be turned back into an IP.
  const networkHash = createHmac("sha256", serviceRoleKey).update(`guest-message:${clientNetwork(req)}`).digest("hex");
  const { data: allowed, error: limitError } = await rpc<boolean>("guest_message_register_attempt", {
    p_ip_hash: networkHash,
    p_limit: GUEST_SUBMISSIONS_PER_IP_PER_DAY,
  });
  if (limitError) {
    console.error("guest message: rate limit check failed", limitError.message);
    return fail(res, 500, "server_error", GENERIC_ERROR);
  }
  if (allowed !== true) {
    return fail(res, 429, "rate_limited", "Zu viele Nachrichten von diesem Anschluss. Bitte versuch es morgen wieder.");
  }

  const { data: precheck, error: precheckError } = await rpc<Precheck>("guest_message_precheck", {
    p_listing_id: input.listingId,
    p_email: input.email,
  });
  if (precheckError || !precheck) {
    console.error("guest message: precheck failed", precheckError?.message);
    return fail(res, 500, "server_error", GENERIC_ERROR);
  }
  if (!precheck.listing_available) {
    return fail(res, 409, "listing_unavailable", "Dieses Inserat ist nicht mehr verfügbar.");
  }
  // Before the seller check, so the answer never tells whether a registered
  // address is this listing's seller. A seller who logs in here is stopped by
  // the conversation function (cannot_message_own_listing).
  if (precheck.account_exists) {
    return res.status(200).json({ status: "existing_account" });
  }
  // Left for addresses without an account: a garage's contact email.
  if (precheck.is_seller_email) {
    return fail(res, 400, "own_listing", "Mit dieser E-Mail-Adresse kannst du diesem Inserat nicht schreiben.", "email");
  }
  if (input.password.length < GUEST_MESSAGE_LIMITS.passwordMin) {
    return fail(res, 400, "invalid_input", GUEST_PASSWORD_TOO_SHORT, "password");
  }

  // The normal signup, run on the server: Supabase sends its usual
  // confirmation email, and the PKCE verifier cookie lands in the visitor's
  // browser, so confirming there signs them straight in.
  const fullName = [input.firstName, input.lastName].filter(Boolean).join(" ");
  const supabase = createPagesServerClient<Database>({ req, res });
  // Random per request and stored with the new account: Auth never rewrites the
  // metadata of an existing account, so finding it again proves this signUp
  // created the account.
  const signupNonce = randomUUID();
  const { data: signUp, error: signUpError } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: CONFIRMATION_REDIRECT,
      data: {
        first_name: input.firstName,
        last_name: input.lastName || undefined,
        full_name: fullName,
        role: "private",
        guest_signup_nonce: signupNonce,
      },
    },
  });

  if (signUpError) {
    const code = (signUpError as { code?: string }).code;
    if (code === "weak_password") {
      return fail(res, 400, "weak_password", "Bitte wähl ein sichereres Passwort.", "password");
    }
    if (code === "user_already_exists" || code === "email_exists") {
      return res.status(200).json({ status: "existing_account" });
    }
    if (code === "email_address_invalid") {
      return fail(res, 400, "invalid_input", "Bitte gib eine gültige E-Mail-Adresse ein.", "email");
    }
    if (signUpError.status === 429 || code === "over_email_send_rate_limit") {
      return fail(res, 429, "email_limit", "Gerade können wir keine E-Mails verschicken. Bitte versuch es in ein paar Minuten nochmals.");
    }
    console.error("guest message: signUp failed", code, signUpError.message);
    return fail(res, 500, "server_error", "Das Konto konnte nicht erstellt werden. Bitte versuch es nochmals.");
  }

  // With confirmations on, Supabase answers a confirmed address with an
  // obfuscated user without identities, and an unconfirmed one with that real,
  // older account. Only an account this very request created is written for:
  // re-read it with the service role and require this request's nonce on an
  // unconfirmed account.
  const signedUpId = signUp.user?.identities?.length ? signUp.user.id : null;
  const { data: created } = signedUpId
    ? await admin.auth.admin.getUserById(signedUpId)
    : { data: { user: null } };
  const user = created?.user ?? null;
  const isThisRequestsAccount =
    !!user && !user.email_confirmed_at && user.user_metadata?.guest_signup_nonce === signupNonce;
  if (!isThisRequestsAccount) {
    return res.status(200).json({ status: "existing_account" });
  }

  // Server-only record of where the account came from and when the AGB were
  // accepted (app_metadata can't be edited by the user). Best effort.
  const { error: metaError } = await admin.auth.admin.updateUserById(user.id, {
    app_metadata: { signup_source: "listing_message", terms_accepted_at: new Date().toISOString() },
  });
  if (metaError) {
    console.error("guest message: could not store terms acceptance", metaError.message);
  }

  // Same conversation code as the logged-in chat, then a plain message insert:
  // the existing triggers notify the seller exactly as for any other message.
  const { data: conversationId, error: conversationError } = await rpc<string>(
    "_create_or_get_conversation_for_listing_as",
    { p_listing_id: input.listingId, p_buyer_id: user.id }
  );
  if (conversationError || typeof conversationId !== "string") {
    console.error("guest message: conversation failed", conversationError?.message);
    return fail(res, 500, "message_failed", MESSAGE_FAILED);
  }

  const { error: messageError } = await admin.from("messages").insert({
    conversation_id: conversationId,
    sender_user_id: user.id,
    body: input.message,
  });
  if (messageError) {
    console.error("guest message: message insert failed", messageError.message);
    return fail(res, 500, "message_failed", MESSAGE_FAILED);
  }

  return res.status(200).json({ status: "sent" });
}
