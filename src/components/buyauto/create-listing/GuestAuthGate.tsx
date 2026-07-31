import { useState } from "react";
import { LockKeyhole, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ADS_CONVERSIONS, trackAdsConversion } from "@/lib/analytics/gtag";
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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
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
    if (mode === "register" && (!firstName.trim() || !lastName.trim())) {
      toast({
        title: "Bitte Vor- und Nachname eingeben",
        description: "Dein Name wird bei deinem Inserat als Anbieter angezeigt.",
        variant: "destructive",
      });
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
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          accountType: "private",
          emailRedirectTo: `${window.location.origin}/inserat-erstellen`,
        });
        // The Google Ads lead conversion. Reported here rather than in either
        // branch below because the lead is complete either way — the seller has
        // handed over their name and e-mail; whether Supabase hands back a
        // session or posts a confirmation link is an auth detail, and the
        // confirmation branch never returns to this component to fire it later.
        // The `mode === "login"` path deliberately does not report: that is an
        // existing account, not a new lead.
        trackAdsConversion(ADS_CONVERSIONS.submitLeadForm);

        if (res.session) {
          toast({ title: "Konto erstellt!", description: "Dein Inserat wird jetzt veröffentlicht." });
        } else {
          // Email confirmation required — the draft is kept safe locally.
          setConfirmSent(true);
        }
      }
    } catch (err: any) {
      const raw = String(err?.message ?? "");
      const emailAlreadyExists = err?.code === "email_exists" || /already registered|user already/i.test(raw);
      const msg = /invalid login credentials/i.test(raw)
        ? "E-Mail oder Passwort ist falsch."
        : emailAlreadyExists
          ? "Diese E-Mail existiert bereits, bitte logge dich ein."
          : raw || "Etwas ist schiefgelaufen. Bitte versuche es erneut.";
      // Flip over to the login tab so the user can sign in with the existing account.
      if (emailAlreadyExists) setMode("login");
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
        {mode === "register" && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="guest-auth-first-name" className="text-sm font-medium text-neutral-700">
                Vorname
              </Label>
              <Input
                id="guest-auth-first-name"
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Max"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="guest-auth-last-name" className="text-sm font-medium text-neutral-700">
                Nachname
              </Label>
              <Input
                id="guest-auth-last-name"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Muster"
                className="rounded-xl"
              />
            </div>
            <p className="col-span-2 text-xs text-neutral-500">
              Dein Name wird bei deinem Inserat als Anbieter angezeigt. In deinem Dashboard kannst du
              stattdessen jederzeit anonym als «Privatanbieter» auftreten.
            </p>
          </div>
        )}
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
