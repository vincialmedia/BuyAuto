import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { setUser, track, trackOnce } from "@/lib/analytics";
import {
  GUEST_MESSAGE_LIMITS,
  guestMessagePrefill,
  validateGuestMessage,
  type GuestMessageField,
  type GuestMessageResponse,
} from "@/lib/buyauto/guestMessage";
import { SendHorizontal } from "lucide-react";

/** How logging in an existing account from the form went (the send that follows is the panel's). */
export type GuestLoginResult = "logged_in" | "invalid_credentials" | "email_not_confirmed" | "failed";

export interface GuestMessageFormProps {
  listingId: string;
  dealType?: "lease_takeover" | "direct_purchase" | null;
  /**
   * The email already has an account: log in with the password typed here
   * and send the message through the logged-in chat. Once logged in, this
   * form unmounts and the panel shows how the send went.
   */
  onExistingAccount: (email: string, password: string, message: string) => Promise<GuestLoginResult>;
}

type FormError = { text: string; showPasswordReset?: boolean };

const inputClass = "h-11 rounded-xl border-neutral-200 focus-visible:ring-neutral-400";

export function GuestMessageForm({ listingId, dealType, onExistingAccount }: GuestMessageFormProps) {
  const router = useRouter();

  const [message, setMessage] = useState(() => guestMessagePrefill(dealType));
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Honeypot: hidden from people, filled in by form bots.
  const [website, setWebsite] = useState("");

  const [busy, setBusy] = useState(false);
  const [busyText, setBusyText] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<{ field: GuestMessageField; text: string } | null>(null);
  const [formError, setFormError] = useState<FormError | null>(null);
  const [sent, setSent] = useState<{ message: string; email: string } | null>(null);

  const loginHref = "/auth?redirect=" + encodeURIComponent(router.asPath);
  const ids = {
    message: `guest-message-${listingId}`,
    firstName: `guest-first-name-${listingId}`,
    lastName: `guest-last-name-${listingId}`,
    email: `guest-email-${listingId}`,
    password: `guest-password-${listingId}`,
    website: `guest-extra-${listingId}`,
  };

  function errorFor(field: GuestMessageField): string | null {
    return fieldError?.field === field ? fieldError.text : null;
  }

  async function logInAndSend(trimmedEmail: string, trimmedMessage: string) {
    setBusyText("Du hast schon ein Konto. Wir loggen dich ein …");
    const result = await onExistingAccount(trimmedEmail, password, trimmedMessage);
    if (result === "email_not_confirmed") {
      setFormError({
        text: "Mit dieser E-Mail gibt es schon ein Konto, das noch nicht bestätigt ist. Klick zuerst auf den Link in unserer E-Mail, danach kannst du hier schreiben.",
      });
    } else if (result === "invalid_credentials") {
      setFieldError({ field: "password", text: "Mit dieser E-Mail gibt es schon ein Konto, aber das Passwort stimmt nicht." });
      setFormError({ text: "Passwort vergessen? Auf der Login-Seite kannst du es zurücksetzen.", showPasswordReset: true });
    } else if (result === "failed") {
      setFormError({ text: "Das Einloggen hat nicht geklappt. Bitte versuch es nochmals." });
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    setFieldError(null);
    setFormError(null);

    const validation = validateGuestMessage({ listingId, firstName, lastName, email, password, message });
    if (validation.ok === false) {
      if (validation.field) setFieldError({ field: validation.field, text: validation.message });
      else setFormError({ text: validation.message });
      return;
    }
    const input = validation.value;

    setBusy(true);
    setBusyText("Nachricht wird gesendet …");
    try {
      let result: GuestMessageResponse;
      try {
        const response = await fetch("/api/messages/guest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...input, website }),
        });
        result = (await response.json()) as GuestMessageResponse;
      } catch {
        setFormError({ text: "Keine Verbindung. Bitte prüf dein Internet und versuch es nochmals." });
        return;
      }

      if (result.status === "existing_account") {
        await logInAndSend(input.email, input.message);
        return;
      }

      if (result.status === "error") {
        if (result.field) setFieldError({ field: result.field, text: result.message });
        else setFormError({ text: result.message });
        return;
      }

      // A filled honeypot gets the same answer from the server; only real
      // submissions count.
      if (!website) {
        setUser(null, "private");
        track("sign_up", { method: "email" });
        trackOnce(`ba_lead_conversation_${listingId}`, "generate_lead", {
          lead_type: "conversation",
          listing_id: listingId,
          value: 0,
          currency: "CHF",
          new_account: true,
        });
      }
      setPassword("");
      setSent({ message: input.message, email: input.email });
    } finally {
      setBusy(false);
      setBusyText(null);
    }
  }

  if (sent) {
    return (
      <div className="mt-5 space-y-3">
        <div className="rounded-2xl border border-neutral-200/60 bg-neutral-50 p-4">
          <div className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl px-4 py-3 border shadow-sm bg-neutral-900 text-white border-neutral-900">
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{sent.message}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950" role="status">
          <p className="font-semibold">Deine Nachricht ist beim Anbieter.</p>
          <p className="mt-1">
            Bestätige noch deine E-Mail-Adresse: Wir haben dir einen Link an{" "}
            <span className="font-semibold break-all">{sent.email}</span> geschickt. Danach siehst du die Antwort unter
            Nachrichten. Sobald der Anbieter antwortet, bekommst du eine E-Mail.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor={ids.message} className="text-neutral-900">
          Nachricht an den Anbieter
        </Label>
        <Textarea
          id={ids.message}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={GUEST_MESSAGE_LIMITS.messageMax}
          className="min-h-[92px] rounded-2xl border-neutral-200 focus:border-neutral-400"
          aria-invalid={Boolean(errorFor("message"))}
          disabled={busy}
        />
        {errorFor("message") ? <p className="text-xs text-red-600">{errorFor("message")}</p> : null}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 min-w-0">
          <Label htmlFor={ids.firstName} className="text-neutral-900">
            Vorname
          </Label>
          <Input
            id={ids.firstName}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            autoComplete="given-name"
            maxLength={GUEST_MESSAGE_LIMITS.nameMax}
            className={inputClass}
            aria-invalid={Boolean(errorFor("firstName"))}
            disabled={busy}
          />
        </div>
        <div className="space-y-1.5 min-w-0">
          <Label htmlFor={ids.lastName} className="text-neutral-900">
            Nachname <span className="font-normal text-neutral-500">(optional)</span>
          </Label>
          <Input
            id={ids.lastName}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            autoComplete="family-name"
            maxLength={GUEST_MESSAGE_LIMITS.nameMax}
            className={inputClass}
            aria-invalid={Boolean(errorFor("lastName"))}
            disabled={busy}
          />
        </div>
      </div>
      {errorFor("firstName") || errorFor("lastName") ? (
        <p className="-mt-2 text-xs text-red-600">{errorFor("firstName") ?? errorFor("lastName")}</p>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor={ids.email} className="text-neutral-900">
          E-Mail
        </Label>
        <Input
          id={ids.email}
          type="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          maxLength={GUEST_MESSAGE_LIMITS.emailMax}
          className={inputClass}
          aria-invalid={Boolean(errorFor("email"))}
          disabled={busy}
        />
        {errorFor("email") ? <p className="text-xs text-red-600">{errorFor("email")}</p> : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={ids.password} className="text-neutral-900">
          Passwort
        </Label>
        <Input
          id={ids.password}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          maxLength={GUEST_MESSAGE_LIMITS.passwordMax}
          className={inputClass}
          aria-invalid={Boolean(errorFor("password"))}
          aria-describedby={`${ids.password}-hint`}
          disabled={busy}
        />
        {errorFor("password") ? (
          <p className="text-xs text-red-600">{errorFor("password")}</p>
        ) : (
          <p id={`${ids.password}-hint`} className="text-xs text-neutral-500">
            Neu hier: mindestens {GUEST_MESSAGE_LIMITS.passwordMin} Zeichen. Schon ein Konto: dein bisheriges Passwort.
          </p>
        )}
      </div>

      {/* Honeypot: off-screen and out of the tab order, so only bots fill it.
          Deliberately no name/label that browser autofill would recognise. */}
      <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
        <label htmlFor={ids.website}>Bitte leer lassen</label>
        <input
          id={ids.website}
          name="ba_extra"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      {formError ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" role="alert">
          {formError.text}
          {formError.showPasswordReset ? (
            <>
              {" "}
              <Link href={loginHref} className="font-semibold underline underline-offset-2">
                Zum Login
              </Link>
            </>
          ) : null}
        </div>
      ) : null}

      <Button
        type="submit"
        disabled={busy}
        className={cn(
          "w-full h-auto min-h-11 py-2.5 whitespace-normal bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl",
          busy && "opacity-80"
        )}
      >
        <SendHorizontal className="h-4 w-4 mr-2 shrink-0" />
        <span>{busy && busyText ? busyText : "Nachricht schicken und Konto erstellen"}</span>
      </Button>

      <p className="text-xs leading-relaxed text-neutral-500">
        Mit dem Senden erstellen wir dir ein BuyAuto-Konto, und du akzeptierst die{" "}
        <Link href="/agb" className="underline underline-offset-2 hover:text-neutral-700">
          AGB
        </Link>
        . Dein Name und deine Nachricht gehen an den Anbieter (
        <Link href="/datenschutz" className="underline underline-offset-2 hover:text-neutral-700">
          Datenschutzerklärung
        </Link>
        ).
      </p>
      <p className="text-xs text-neutral-600">
        Schon ein Konto?{" "}
        <Link href={loginHref} className="font-semibold text-neutral-900 underline underline-offset-2">
          Einloggen
        </Link>
      </p>
    </form>
  );
}
