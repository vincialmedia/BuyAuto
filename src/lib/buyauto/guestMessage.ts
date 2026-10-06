// Logged-out visitors write to a seller from the chat box on /fahrzeug/[id]
// and create their account in the same step (POST /api/messages/guest).
// The form and the route share these rules so both reject the same input.

export const GUEST_MESSAGE_LIMITS = {
  nameMax: 60,
  emailMax: 254,
  // Same minimum as the normal signup (registerSchema). Only enforced for new
  // accounts: existing ones log in here and may predate the rule.
  passwordMin: 8,
  passwordMax: 72, // bcrypt ignores everything past 72 bytes
  messageMax: 5000, // messages_body_check
} as const;

export type GuestMessageInput = {
  listingId: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  message: string;
};

export type GuestMessageField = Exclude<keyof GuestMessageInput, "listingId">;

export type GuestMessageErrorCode =
  | "invalid_input"
  | "rate_limited"
  | "listing_unavailable"
  | "own_listing"
  | "weak_password"
  | "email_limit"
  | "message_failed"
  | "server_error";

export type GuestMessageResponse =
  // Account created, message delivered to the seller, confirmation email sent.
  | { status: "sent" }
  // The email already has an account: the client logs in with the same
  // password and sends through the normal logged-in chat.
  | { status: "existing_account" }
  | { status: "error"; error: GuestMessageErrorCode; message: string; field?: GuestMessageField };

export type GuestMessageValidation =
  | { ok: true; value: GuestMessageInput }
  | { ok: false; field: GuestMessageField | null; message: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Names are shown to the seller and in their notification email: no links, no
// posing as BuyAuto, no control, bidi or zero-width characters.
const LINK_RE = /(https?:|www\.|\.[a-z]{2,}\b)/i;
// Control, format, separator and blank-looking characters, plus Unicode tags.
const CONTROL_RE =
  /[\u0000-\u001F\u007F-\u009F\u00AD\u061C\u115F\u1160\u200B-\u200F\u2028-\u202E\u2060-\u206F\u3164\uFEFF\uFFA0]|\uDB40[\uDC00-\uDC7F]/;

/** "Buy-Auto", "B.u.y Auto", full-width letters …: compared on the letters a–z only. */
function posesAsBuyAuto(value: string): boolean {
  const letters = value.normalize("NFKC").normalize("NFD").toLowerCase().replace(/[^a-z]/g, "");
  return letters.includes("buyauto");
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function validateGuestMessage(raw: Record<string, unknown>): GuestMessageValidation {
  const listingId = str(raw.listingId).trim();
  const firstName = str(raw.firstName).trim();
  const lastName = str(raw.lastName).trim();
  const email = str(raw.email).trim().toLowerCase();
  const password = str(raw.password);
  const message = str(raw.message).trim();

  if (!UUID_RE.test(listingId)) {
    return { ok: false, field: null, message: "Dieses Inserat konnten wir nicht finden." };
  }
  if (!message) {
    return { ok: false, field: "message", message: "Bitte schreib eine Nachricht." };
  }
  if (message.length > GUEST_MESSAGE_LIMITS.messageMax) {
    return {
      ok: false,
      field: "message",
      message: `Die Nachricht ist zu lang (max. ${GUEST_MESSAGE_LIMITS.messageMax} Zeichen).`,
    };
  }
  if (!firstName) {
    return { ok: false, field: "firstName", message: "Bitte gib deinen Vornamen ein." };
  }
  for (const [field, value] of [
    ["firstName", firstName],
    ["lastName", lastName],
  ] as const) {
    if (
      value.length > GUEST_MESSAGE_LIMITS.nameMax ||
      CONTROL_RE.test(value) ||
      LINK_RE.test(value) ||
      posesAsBuyAuto(value)
    ) {
      return { ok: false, field, message: "Bitte gib hier nur deinen Namen ein." };
    }
  }
  if (!email || email.length > GUEST_MESSAGE_LIMITS.emailMax || !EMAIL_RE.test(email)) {
    return { ok: false, field: "email", message: "Bitte gib eine gültige E-Mail-Adresse ein." };
  }
  if (!password) {
    return { ok: false, field: "password", message: "Bitte gib ein Passwort ein." };
  }
  if (password.length > GUEST_MESSAGE_LIMITS.passwordMax) {
    return {
      ok: false,
      field: "password",
      message: `Das Passwort darf höchstens ${GUEST_MESSAGE_LIMITS.passwordMax} Zeichen lang sein.`,
    };
  }

  return { ok: true, value: { listingId, firstName, lastName, email, password, message } };
}

export const GUEST_PASSWORD_TOO_SHORT = `Das Passwort muss mindestens ${GUEST_MESSAGE_LIMITS.passwordMin} Zeichen lang sein.`;

/** First message suggested to the buyer; a Direktkauf with takeover offer gets the neutral question. */
export function guestMessagePrefill(dealType: "lease_takeover" | "direct_purchase" | null | undefined): string {
  return dealType === "lease_takeover"
    ? "Hallo, ist die Leasingübernahme noch möglich? Ich bin interessiert."
    : "Hallo, ist das Auto noch verfügbar?";
}
