import Link from "next/link";
import { useRouter } from "next/router";
import { useState, type FormEvent } from "react";

import { PadkosSeo } from "@/components/padkos/PadkosSeo";
import { PadkosShell } from "@/components/padkos/PadkosShell";
import chrome from "@/components/padkos/PadkosChrome.module.css";
import shop from "@/components/padkos/PadkosShop.module.css";
import ui from "@/components/padkos/Padkos.module.css";
import { PADKOS } from "@/lib/padkos/routes";

/**
 * Login & registration — `Padkos Login.dc.html`.
 *
 * Demo auth exactly as designed: any input leads to the sample account. The
 * submit handler is the single seam where Supabase Auth plugs in
 * (signInWithPassword / signUp) — see supabase/padkos/README.md.
 */
export default function PadkosLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void router.push(PADKOS.konto);
  };

  return (
    <PadkosShell>
      <PadkosSeo
        title="Anmelden – Padkos"
        description="Melde dich bei deinem Padkos-Konto an oder leg ein neues an."
        path={PADKOS.login}
        alwaysNoindex
      />

      <div className={`${chrome.pageBody} ${chrome.pageBodyForm}`}>
        <div className={shop.authCard}>
          <h1 className={shop.authRibbon}>WELKOM TERUG · WILLKOMMEN</h1>
          <div className={shop.authBody}>
            <div className={shop.authTabs}>
              <button
                type="button"
                onClick={() => setMode("login")}
                aria-pressed={mode === "login"}
                className={`${shop.authTab}${mode === "login" ? ` ${shop.authTabActive}` : ""}`}
              >
                Anmelden
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                aria-pressed={mode === "register"}
                className={`${shop.authTab}${mode === "register" ? ` ${shop.authTabActive}` : ""}`}
              >
                Registrieren
              </button>
            </div>

            {mode === "login" ? (
              <form onSubmit={submit} className={shop.authForm}>
                <input
                  required
                  type="email"
                  autoComplete="email"
                  placeholder="deine@email.at"
                  aria-label="E-Mail"
                  className={chrome.input}
                />
                <input
                  required
                  type="password"
                  autoComplete="current-password"
                  placeholder="Passwort"
                  aria-label="Passwort"
                  className={chrome.input}
                />
                <div className={shop.authMetaRow}>
                  <label className={shop.checkboxLabel}>
                    <input type="checkbox" defaultChecked />
                    <span>Angemeldet bleiben</span>
                  </label>
                  <Link href={PADKOS.kontakt} className={shop.authLink}>
                    Passwort vergessen?
                  </Link>
                </div>
                <button
                  type="submit"
                  className={`${ui.btn} ${ui.btnGreen} ${ui.shadowMd}`}
                  style={{ minHeight: 52, fontSize: 15.5 }}
                >
                  Anmelden
                </button>
              </form>
            ) : (
              <form onSubmit={submit} className={shop.authForm}>
                <input
                  required
                  autoComplete="name"
                  placeholder="Vor- und Nachname"
                  aria-label="Name"
                  className={chrome.input}
                />
                <input
                  required
                  type="email"
                  autoComplete="email"
                  placeholder="deine@email.at"
                  aria-label="E-Mail"
                  className={chrome.input}
                />
                <input
                  required
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  placeholder="Passwort wählen (min. 8 Zeichen)"
                  aria-label="Passwort"
                  className={chrome.input}
                />
                <label className={shop.checkboxLabel}>
                  <input required type="checkbox" />
                  <span>
                    Ich akzeptiere die <Link href={PADKOS.agb}>AGB</Link> und die{" "}
                    <Link href={PADKOS.datenschutz}>Datenschutzerklärung</Link>.
                  </span>
                </label>
                <button
                  type="submit"
                  className={`${ui.btn} ${ui.btnGreen} ${ui.shadowMd}`}
                  style={{ minHeight: 52, fontSize: 15.5 }}
                >
                  Konto anlegen
                </button>
              </form>
            )}

            <div className={shop.authDivider}>
              <span aria-hidden="true" className={ui.rule} />
              <span className={shop.authDividerLabel}>ODER</span>
              <span aria-hidden="true" className={ui.rule} />
            </div>

            <Link href={PADKOS.shop} className={shop.authGuest}>
              Als Gast weiter einkaufen
            </Link>

            <p className={shop.authDemo}>Demo: Jede Eingabe führt zu Anjes Beispielkonto.</p>
          </div>
        </div>
      </div>
    </PadkosShell>
  );
}
