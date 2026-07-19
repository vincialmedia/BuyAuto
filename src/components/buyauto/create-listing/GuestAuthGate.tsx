import { useState } from "react";
import { LockKeyhole, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import authService from "@/services/authService";

/**
 * Shown at the final step when a guest (not logged in) wants to publish. They
 * authenticate here *inline* — no navigation — so the listing they just filled
 * in stays in memory and the wizard continues straight to payment afterwards.
 * On successful sign-in, AuthContext's onAuthStateChange sets `user`, the parent
 * re-renders past this gate automatically, so no explicit callback is needed.
 */
export default function GuestAuthGate() {
  const { toast } = useToast();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const mail = email.trim();
    if (!mail || !password) {
      toast({ title: "Bitte E-Mail und Passwort eingeben", variant: "destructive" });
      return;
    }
    if (mode === "register" && password.length < 8) {
      toast({ title: "Passwort zu kurz", description: "Mindestens 8 Zeichen.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await authService.signIn({ email: mail, password });
        toast({ title: "Willkommen zurück!", description: "Dein Inserat wird jetzt veröffentlicht." });
        // AuthContext updates `user`; the parent re-renders past this gate.
      } else {
        // Send the confirmation link back into the wizard: the draft (and, with
        // the IndexedDB photo store, the photos) are waiting there.
        const res = await authService.signUp({
          email: mail,
          password,
          accountType: "private",
          emailRedirectTo: `${window.location.origin}/inserat-erstellen`,
        });
        if (res.session) {
          toast({ title: "Konto erstellt!", description: "Dein Inserat wird jetzt veröffentlicht." });
        } else {
          // Email confirmation required — the draft is kept safe locally.
          setConfirmSent(true);
        }
      }
    } catch (err: any) {
      const raw = String(err?.message ?? "");
      const msg = /invalid login credentials/i.test(raw)
        ? "E-Mail oder Passwort ist falsch."
        : /already registered|user already/i.test(raw)
          ? "Diese E-Mail ist bereits registriert. Bitte melde dich an."
          : raw || "Etwas ist schiefgelaufen. Bitte versuche es erneut.";
      toast({ title: "Anmeldung fehlgeschlagen", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (confirmSent) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 text-center shadow-sm">
        <h3 className="text-lg font-semibold text-neutral-900">Fast geschafft – bitte E-Mail bestätigen</h3>
        <p className="mt-2 text-sm text-neutral-600">
          Wir haben dir eine Bestätigungs-E-Mail an <span className="font-medium">{email.trim()}</span> geschickt.
          Bestätige sie und komm zurück – dein Inserat ist zwischengespeichert und wartet auf dich.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary shrink-0">
          <LockKeyhole className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-neutral-900">Fast geschafft!</h3>
          <p className="text-sm text-neutral-600">
            Melde dich an, um dein Inserat zu veröffentlichen. Deine Angaben bleiben erhalten.
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-1 rounded-2xl bg-neutral-100 p-1 text-sm font-medium">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`rounded-xl py-2 transition-colors ${mode === "login" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500"}`}
        >
          Anmelden
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className={`rounded-xl py-2 transition-colors ${mode === "register" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500"}`}
        >
          Registrieren
        </button>
      </div>

      <form onSubmit={submit} className="mt-5 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="guest-auth-email" className="text-sm font-medium text-neutral-700">
            E-Mail
          </Label>
          <Input
            id="guest-auth-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@beispiel.ch"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="guest-auth-password" className="text-sm font-medium text-neutral-700">
            Passwort
          </Label>
          <Input
            id="guest-auth-password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "register" ? "Mindestens 8 Zeichen" : "••••••••"}
            className="rounded-xl"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-white hover:opacity-95"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Bitte warten…
            </>
          ) : mode === "login" ? (
            "Anmelden & veröffentlichen"
          ) : (
            "Konto erstellen & veröffentlichen"
          )}
        </Button>
      </form>
    </div>
  );
}
