import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { GaragePlanCards } from "@/components/buyauto/pricing/GaragePlanCards";
import { GarageFeatureMatrix } from "@/components/buyauto/pricing/GarageFeatureMatrix";
import { GarageTrustRow } from "@/components/buyauto/pricing/GarageTrustRow";
import {
  GARAGE_CUSTOM_THRESHOLD,
  GARAGE_PLANS,
  formatChf,
  pricePerVehicleChf,
  type GaragePlanCode,
} from "@/lib/buyauto/garagePlans";

function isSafeNextPath(input: unknown): input is string {
  return typeof input === "string" && input.startsWith("/") && !input.startsWith("//");
}

export default function GaragePlanPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading, profileLoading } = useAuth();
  const userRole = profile?.role;
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<GaragePlanCode | null>(null);

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
  }, [user, userRole, router, profile]);

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

    try {
      const response = await fetch("/api/dealer/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_code: planCode,
          success_path: successPath ?? undefined,
          cancel_path: cancelPath ?? undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Fehler beim Vorbereiten der Zahlung");
      }

      const { url } = await response.json();

      if (!url) {
        throw new Error("Keine Zahlungs-URL erhalten");
      }

      window.location.href = url;
    } catch (error: any) {
      console.error("Plan selection error:", error);
      toast.error("Fehler", {
        description: error.message || "Bitte versuche es später erneut.",
      });
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
              für ein individuelles Angebot.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
