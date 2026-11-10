import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { GaragePlanCards } from "@/components/buyauto/pricing/GaragePlanCards";
import { GarageFeatureMatrix } from "@/components/buyauto/pricing/GarageFeatureMatrix";
import { GarageTrustRow } from "@/components/buyauto/pricing/GarageTrustRow";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  GARAGE_CUSTOM_FROM_CHF,
  GARAGE_CUSTOM_THRESHOLD,
  GARAGE_PLANS,
  formatChf,
  pricePerVehicleChf,
  type GaragePlanCode,
} from "@/lib/buyauto/garagePlans";
import { isSafeNextPath } from "@/lib/safe-next-path";

export default function GaragePlanPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading, profileLoading } = useAuth();
  const userRole = profile?.role;
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<GaragePlanCode | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady) return;
    // Wait for auth AND profile resolution: the old `profile === undefined`
    // guard could never fire (AuthContext initializes profile as null), so a
    // hard refresh bounced logged-in garages to /auth and a pending profile
    // fetch produced a wrong «Zugriff verweigert».
    if (authLoading || profileLoading) return;

    if (!user) {
      const legacyNext = typeof router.query.next === "string" ? router.query.next : null;
      const redirect = typeof router.query.redirect === "string" ? router.query.redirect : null;
      const target = redirect || legacyNext || "/garage-plan";
      router.replace("/auth?redirect=" + encodeURIComponent(target));
      return;
    }

    if (userRole !== "garage") {
      toast.error("Zugriff verweigert", {
        description: "Diese Seite ist nur für Garagen verfügbar.",
      });
      router.replace("/");
      return;
    }
    // authLoading and profileLoading belong in this list: for a logged-out
    // visitor nothing else changes when auth finishes loading, so without
    // them the effect never ran again and the page sat there with disabled
    // buttons instead of sending the visitor to the login.
  }, [user, userRole, router, profile, authLoading, profileLoading]);

  // The browser's Back button from Stripe restores this page from the
  // back/forward cache, buttons still in their loading state.
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      setLoading(false);
      setSelectedPlan(null);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  const handleSelectPlan = async (planCode: GaragePlanCode) => {
    if (!user) return;

    // ?next= is the legacy spelling still sent by the wizard's listing-limit
    // upsell — honor it as a fallback so return-to-edit works from there too.
    const redirectPathRaw =
      typeof router.query.redirect === "string"
        ? router.query.redirect
        : typeof router.query.next === "string"
          ? router.query.next
          : null;
    const successPath = isSafeNextPath(redirectPathRaw) ? redirectPathRaw : null;
    const cancelPath = successPath ? `/garage-plan?redirect=${encodeURIComponent(successPath)}` : null;

    setLoading(true);
    setSelectedPlan(planCode);
    setPromoError(null);

    // A problem with the code is shown at the code field, not as a toast.
    let codeProblem = false;

    try {
      const response = await fetch("/api/dealer/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_code: planCode,
          success_path: successPath ?? undefined,
          cancel_path: cancelPath ?? undefined,
          promo_code: promoCode.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const message =
          typeof payload?.error === "string" && payload.error ? payload.error : "Fehler beim Vorbereiten der Zahlung";
        if (payload?.field === "promo_code") {
          codeProblem = true;
          setPromoError(message);
        }
        throw new Error(message);
      }

      const { url } = await response.json();

      if (!url) {
        throw new Error("Keine Zahlungs-URL erhalten");
      }

      window.location.href = url;
    } catch (error: any) {
      console.error("Plan selection error:", error);
      if (codeProblem) {
        document.getElementById("promo-code")?.focus();
      } else {
        toast.error("Fehler", {
          description: error.message || "Bitte versuche es später erneut.",
        });
      }
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  // The pricing shell has no per-user data: render it on SSR and while client
  // auth resolves (instead of a blank page), and keep the plan buttons disabled
  // until we know a garage user is signed in. Logged-out / non-garage visitors
  // are redirected by the effect above.
  const authReady = Boolean(user && userRole === "garage");

  return (
    <>
      <Head>
        <title>BuyAuto – Wähle dein Paket</title>
        {/* Conversion-funnel step (package selection), not a destination to rank — keep it
            out of the index but crawlable. */}
        <meta name="robots" content="noindex,follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-neutral-50 pb-20">
        <div className="bg-white border-b border-neutral-200 py-8 px-4 text-center">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900">
            Wähle dein Paket
          </h1>
          <p className="text-neutral-500 text-sm mt-2">
            Monatlich kündbar. Keine Setup-Gebühr. Ab CHF{" "}
            {formatChf(pricePerVehicleChf(GARAGE_PLANS.pro), 2)} pro Fahrzeug und Monat.
          </p>
        </div>

        <div className="max-w-6xl mx-auto px-4 mt-10 space-y-8">
          <div className="mx-auto max-w-md">
            <Label htmlFor="promo-code" className="text-sm text-neutral-700">
              Gutscheincode (optional)
            </Label>
            {/* Shown in capitals through CSS only; the server normalizes the
                value. Rewriting it on every keystroke made the caret jump. */}
            <Input
              id="promo-code"
              value={promoCode}
              onChange={(e) => {
                setPromoCode(e.target.value);
                if (promoError) setPromoError(null);
              }}
              placeholder="Code eingeben"
              autoComplete="off"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              maxLength={40}
              disabled={loading}
              aria-invalid={promoError ? true : undefined}
              aria-describedby={promoError ? "promo-code-error promo-code-help" : "promo-code-help"}
              className="mt-1 uppercase placeholder:normal-case"
            />
            {promoError && (
              <p id="promo-code-error" role="alert" className="mt-1 text-xs text-red-600">
                {promoError}
              </p>
            )}
            <p id="promo-code-help" className="mt-1 text-xs text-neutral-500">
              Hast du einen Code? Gib ihn hier ein und wähle dann dein Paket. Was er dir bringt, siehst du auf der
              Zahlungsseite, bevor du bestätigst.
            </p>
          </div>

          <GaragePlanCards
            onSelect={(code) => void handleSelectPlan(code)}
            loadingCode={loading ? selectedPlan : null}
            disabled={loading || !authReady}
          />

          <GarageTrustRow />

          <GarageFeatureMatrix />

          <div className="text-center">
            <p className="text-xs text-neutral-400">
              Mehr als {GARAGE_CUSTOM_THRESHOLD} Fahrzeuge?{" "}
              <a
                href="mailto:hello@buyauto.ch"
                className="text-neutral-600 underline hover:text-neutral-900"
              >
                Kontaktiere uns
              </a>{" "}
              für ein individuelles Angebot ab CHF {formatChf(GARAGE_CUSTOM_FROM_CHF)}/Monat.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
