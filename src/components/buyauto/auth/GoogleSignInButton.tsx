import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import type { Session, User } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";
import { queueLoginEvent, setUser, trackOnce } from "@/lib/analytics";
import {
  canOfferGoogleSignIn,
  isFreshAccount,
  isGoogleSignInConfigured,
  markGoogleSignInUnavailable,
} from "@/lib/buyauto/googleSignIn";
import {
  prepareGoogleSignIn,
  registerCredentialHandler,
  type CredentialHandler,
} from "@/lib/buyauto/googleIdentityClient";
import authService from "@/services/authService";

export type GoogleSignInResult = {
  user: User;
  session: Session | null;
  /** True when this sign-in created the account. */
  isNewAccount: boolean;
};

export interface GoogleSignInButtonProps {
  /**
   * Runs as soon as Supabase has the session, before the cookies and the name
   * are stored. For work that must start at once, e.g. sending the message
   * the person typed: the signed-in state can swap this component out.
   */
  onSession?: (result: GoogleSignInResult) => void | Promise<void>;
  /** Runs once the sign-in has fully finished (cookies set, name stored). */
  onSignedIn?: (result: GoogleSignInResult) => void | Promise<void>;
  /** Also called with the German error text shown under the button. */
  onError?: (message: string) => void;
  /** Covers the button while the e-mail form next to it is submitting. */
  disabled?: boolean;
  /** "oder mit E-Mail" line between this button and the form below or above it. */
  divider?: "below" | "above";
  /** Shows the AGB/Datenschutz note under the button. */
  showTerms?: boolean;
  /** Start of that note, up to "… die AGB." (the Datenschutz link follows). */
  termsLead?: string;
  className?: string;
}

const MAX_BUTTON_WIDTH = 400;
const FALLBACK_BUTTON_WIDTH = 320;
const GENERIC_ERROR = "Die Anmeldung mit Google hat nicht geklappt. Bitte versuch es nochmals.";

function messageFor(error: unknown): string {
  const code = (error as { code?: string } | null)?.code ?? "";
  const text = error instanceof Error ? error.message : String(error ?? "");
  if (code === "user_banned" || /banned/i.test(text)) {
    return "Dieses Konto ist gesperrt. Schreib uns an hello@buyauto.ch.";
  }
  if (code === "signup_disabled" || /signups not allowed/i.test(text)) {
    return "Neue Konten können gerade nicht erstellt werden. Bitte versuch es später nochmals.";
  }
  if (code === "provider_email_needs_verification" || /unverified email/i.test(text)) {
    return "Deine E-Mail-Adresse ist noch nicht bestätigt. Bestätige sie über den Link in deinem Postfach, danach klappt die Anmeldung mit Google.";
  }
  if (code === "provider_disabled" || /is not enabled|unsupported provider/i.test(text)) {
    return "Die Anmeldung mit Google ist gerade nicht verfügbar. Melde dich bitte mit E-Mail und Passwort an.";
  }
  return GENERIC_ERROR;
}

/** GA4: a new account is a sign-up, anything else a login (sent once the role is known). */
function reportAuthEvent(result: GoogleSignInResult) {
  if (result.isNewAccount) {
    // A Google sign-up always creates a private account (see handle_new_user).
    setUser(null, "private");
    trackOnce(`ba_sign_up_${result.user.id}`, "sign_up", { method: "google" });
  } else {
    queueLoginEvent("google");
  }
}

async function runCallback(
  callback: ((result: GoogleSignInResult) => void | Promise<void>) | undefined,
  result: GoogleSignInResult
) {
  if (!callback) return;
  try {
    await callback(result);
  } catch (error) {
    // The person is signed in; a failing follow-up step reports its own error.
    console.error("Google sign-in follow-up failed:", error);
  }
}

/**
 * Google's own "Weiter mit Google" button (Google Identity Services, popup).
 * Renders nothing, divider included, when no client ID is configured, in
 * in-app browsers (Google blocks sign-in there) or when Google's script
 * can't load. The page stays as it is throughout.
 */
export default function GoogleSignInButton({
  onSession,
  onSignedIn,
  onError,
  disabled = false,
  divider,
  showTerms = false,
  termsLead = "Mit der Anmeldung über Google akzeptierst du",
  className,
}: GoogleSignInButtonProps) {
  // Starts from the build-time config (same on server and client), so the
  // placeholder holds the button's space from the first paint and nothing
  // below it jumps; in-app browsers drop it after mount.
  const [available, setAvailable] = useState(isGoogleSignInConfigured);
  // Google's script loads only once the button is on screen: listing pages
  // show it to every logged-out visitor, most of whom never scroll to it.
  const [inView, setInView] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const busyRef = useRef(false);
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;
  const mountedRef = useRef(true);
  const state = `ba-google-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!canOfferGoogleSignIn()) setAvailable(false);
  }, []);

  function showError(message: string) {
    if (mountedRef.current) setError(message);
    onError?.(message);
  }

  async function handleCredential(idToken: string | undefined, rawNonce: string) {
    // Busy with a sign-in already, or the e-mail form next to it is submitting.
    if (busyRef.current || disabledRef.current) return;
    if (!idToken) {
      showError(GENERIC_ERROR);
      return;
    }

    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      let result: GoogleSignInResult;
      try {
        const data = await authService.signInWithGoogle({ token: idToken, nonce: rawNonce });
        if (!data.user) throw new Error("Google sign-in returned no user");
        result = { user: data.user, session: data.session ?? null, isNewAccount: isFreshAccount(data.user) };
      } catch (err) {
        console.error("Google sign-in error:", err);
        showError(messageFor(err));
        return;
      }

      // Same tick as the session: before the profile load that sends a queued login.
      reportAuthEvent(result);
      const early = runCallback(onSession, result);
      await authService.finishGoogleSignIn({ session: result.session, user: result.user, idToken });
      await early;
      await runCallback(onSignedIn, result);
    } finally {
      busyRef.current = false;
      if (mountedRef.current) setBusy(false);
    }
  }

  // The newest props for the callback Google calls after a click.
  const handlerRef = useRef<CredentialHandler>(() => {});
  useEffect(() => {
    handlerRef.current = (response, rawNonce) => {
      void handleCredential(response.credential, rawNonce);
    };
  });

  useEffect(() => {
    if (!available || inView) return;
    const target = containerRef.current;
    if (!target) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setInView(true);
        observer.disconnect();
      }
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [available, inView]);

  useEffect(() => {
    if (!available || !inView) return;
    const container = containerRef.current;
    if (!container) return;

    const unregister = registerCredentialHandler(state, handlerRef);
    let cancelled = false;

    prepareGoogleSignIn()
      .then((api) => {
        const target = containerRef.current;
        if (cancelled || !target) return;
        const measured = Math.floor(target.getBoundingClientRect().width);
        target.replaceChildren();
        api.renderButton(target, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "rectangular",
          logo_alignment: "center",
          text: "continue_with",
          width: Math.min(MAX_BUTTON_WIDTH, measured || FALLBACK_BUTTON_WIDTH),
          locale: "de",
          state,
        });
        setRendered(true);
      })
      .catch((err: unknown) => {
        // Blocked by an extension or offline: the e-mail form still works.
        console.warn("Google sign-in unavailable:", err);
        markGoogleSignInUnavailable();
        if (!cancelled) setAvailable(false);
      });

    return () => {
      cancelled = true;
      unregister();
    };
  }, [available, inView, state]);

  // The overlay only stops the mouse; inert also takes Google's button out of
  // the tab order while busy. Set on the element because React 18 renders the
  // attribute only as a string, which its types don't accept.
  const blocked = busy || disabled;
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (blocked) container.setAttribute("inert", "");
    else container.removeAttribute("inert");
  }, [blocked, available]);

  if (!available) return null;

  return (
    <div className={cn("w-full space-y-4", className)}>
      {divider === "above" ? <AuthDivider /> : null}
      <div>
        <div className="relative mx-auto w-full max-w-[400px]">
          <div ref={containerRef} className="flex min-h-[44px] w-full justify-center" />
          {!rendered ? (
            <div
              aria-hidden="true"
              className="absolute inset-0 rounded-md border border-neutral-200 bg-neutral-50 animate-pulse"
            />
          ) : null}
          {blocked ? (
            <div
              className="absolute inset-0 flex items-center justify-center gap-2 rounded-md bg-white/85 text-sm text-neutral-700"
              role={busy ? "status" : undefined}
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Anmeldung mit Google …
                </>
              ) : null}
            </div>
          ) : null}
        </div>
        {error ? (
          <p role="alert" className="mt-2 text-center text-sm text-red-600">
            {error}
          </p>
        ) : null}
        {showTerms ? (
          <p className="mt-2 text-center text-xs leading-relaxed text-neutral-500">
            {termsLead} die{" "}
            <Link href="/agb" className="underline underline-offset-2 hover:text-neutral-700">
              AGB
            </Link>
            . Wie wir deine Daten bearbeiten, steht in der{" "}
            <Link href="/datenschutz" className="underline underline-offset-2 hover:text-neutral-700">
              Datenschutzerklärung
            </Link>
            .
          </p>
        ) : null}
      </div>
      {divider === "below" ? <AuthDivider /> : null}
    </div>
  );
}

function AuthDivider() {
  return (
    <div className="flex items-center gap-3 text-xs text-neutral-500" role="separator">
      <span className="h-px flex-1 bg-neutral-200" />
      <span>oder mit E-Mail</span>
      <span className="h-px flex-1 bg-neutral-200" />
    </div>
  );
}
