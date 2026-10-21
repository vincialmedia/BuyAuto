/**
 * Browser side of Sign in with Google: loads Google Identity Services once,
 * initialises it once per page with one nonce, and hands each credential to
 * the button that was clicked. See googleSignIn.ts for the flow.
 */
import { GOOGLE_CLIENT_ID } from "@/lib/buyauto/googleSignIn";

export type GoogleCredentialResponse = {
  /** The ID token (a JWT). */
  credential?: string;
  select_by?: string;
  /** The `state` of the button that was clicked. */
  state?: string;
};

type IdConfiguration = {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  nonce?: string;
  ux_mode?: "popup" | "redirect";
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
};

export type GoogleButtonOptions = {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  logo_alignment?: "left" | "center";
  /** Pixels, at most 400. */
  width?: number;
  locale?: string;
  state?: string;
};

export interface GoogleAccountsId {
  initialize(config: IdConfiguration): void;
  renderButton(parent: HTMLElement, options: GoogleButtonOptions): void;
}

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleAccountsId } };
  }
}

const GSI_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const LOAD_TIMEOUT_MS = 15_000;

export type CredentialHandler = (response: GoogleCredentialResponse, rawNonce: string) => void;

let scriptPromise: Promise<GoogleAccountsId> | null = null;
let preparePromise: Promise<GoogleAccountsId> | null = null;
let rawNonce: string | null = null;
const handlers: Array<{ state: string; handler: { current: CredentialHandler } }> = [];

function loadScript(): Promise<GoogleAccountsId> {
  const ready = window.google?.accounts?.id;
  if (ready) return Promise.resolve(ready);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<GoogleAccountsId>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GSI_SCRIPT_SRC;
    script.async = true;
    script.defer = true;

    let timer = 0;
    const fail = (reason: string) => {
      window.clearTimeout(timer);
      script.remove();
      scriptPromise = null;
      reject(new Error(`Google Identity Services: ${reason}`));
    };
    timer = window.setTimeout(() => fail("load timed out"), LOAD_TIMEOUT_MS);

    script.onload = () => {
      window.clearTimeout(timer);
      const api = window.google?.accounts?.id;
      if (api) resolve(api);
      else fail("library missing after load");
    };
    // Blocked by an extension or offline.
    script.onerror = () => fail("script failed to load");
    document.head.appendChild(script);
  });
  return scriptPromise;
}

/**
 * Random nonce for the ID token. Supabase expects Google to carry the SHA-256
 * hex digest and receives the raw value itself, then compares the two.
 */
async function createNonce(): Promise<{ raw: string; hashed: string }> {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const raw = btoa(String.fromCharCode(...bytes));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  const hashed = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return { raw, hashed };
}

function dispatch(response: GoogleCredentialResponse) {
  if (!rawNonce) return;
  // Only the clicked button may act on its credential: a popup finished after
  // the person navigated on must not trigger another page's button (which
  // could e.g. send that listing's prefilled message). A credential without
  // a state (not expected, every button sets one) goes to the newest button.
  const target = response.state
    ? handlers.find((entry) => entry.state === response.state)
    : handlers[handlers.length - 1];
  if (!target) {
    console.info("Google sign-in: the button for this credential is gone, ignoring it.");
    return;
  }
  target.handler.current(response, rawNonce);
}

/**
 * Loads the library and initialises it once for this page load. Calling
 * initialize() again would replace the nonce under a button that is already
 * on screen, so every button shares this one.
 */
export function prepareGoogleSignIn(): Promise<GoogleAccountsId> {
  if (!GOOGLE_CLIENT_ID) return Promise.reject(new Error("Google sign-in is not configured"));
  if (!preparePromise) {
    preparePromise = (async () => {
      const api = await loadScript();
      const nonce = await createNonce();
      api.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: dispatch,
        nonce: nonce.hashed,
        ux_mode: "popup",
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      rawNonce = nonce.raw;
      return api;
    })().catch((error: unknown) => {
      preparePromise = null;
      throw error;
    });
  }
  return preparePromise;
}

/** Routes credentials from the button with this `state` to `handler`. Returns the cleanup. */
export function registerCredentialHandler(state: string, handler: { current: CredentialHandler }): () => void {
  const entry = { state, handler };
  handlers.push(entry);
  return () => {
    const index = handlers.indexOf(entry);
    if (index >= 0) handlers.splice(index, 1);
  };
}
