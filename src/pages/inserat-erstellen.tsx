import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import ListingWizard from "@/components/buyauto/create-listing/ListingWizard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type GateState =
  | { kind: "checking" }
  | { kind: "allowed" }
  | { kind: "redirecting" };

function isSafeNextPath(input: unknown): input is string {
  return typeof input === "string" && input.startsWith("/") && !input.startsWith("//");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function CreateListingPage() {
  const router = useRouter();
  const { user, loading, profile, profileLoading } = useAuth();
  const [gate, setGate] = useState<GateState>({ kind: "checking" });

  const nextAfterPlan = useMemo(() => "/inserat-erstellen", []);
  const dealerPlanHref = useMemo(
    () => "/garage-plan?redirect=" + encodeURIComponent(nextAfterPlan),
    [nextAfterPlan],
  );

  useEffect(() => {
    if (!router.isReady) return;
    // Wait for auth to resolve, but NOT for the profile — a guest has no profile
    // to load, so gating on profileLoading would leave them stuck on the spinner.
    if (loading) return;

    // Deferred login: guests may fill the whole wizard as a private seller and
    // are only asked to sign in at the final publish step. Garages still need to
    // authenticate (below) because listing requires an active plan/entitlement.
    if (!user) {
      setGate({ kind: "allowed" });
      return;
    }

    // Logged in: the role check needs the profile, so wait for it here.
    if (profileLoading) return;

    if (profile?.role !== "garage") {
      setGate({ kind: "allowed" });
      return;
    }

    let cancelled = false;

    async function run() {
      try {
        const { data: garage, error: garageError } = await supabase
          .from("garages")
          .select("id")
          .eq("owner_user_id", user.id)
          .maybeSingle();

        if (garageError) throw garageError;

        const dealerId = garage?.id ?? null;

        if (!dealerId) {
          if (!cancelled) setGate({ kind: "redirecting" });
          await router.replace(dealerPlanHref);
          return;
        }

        const paymentSuccess = router.query.payment_success === "true";

        // If we just returned from Stripe, the webhook might not have updated yet.
        // Retry entitlement a few times before sending the user back to the plan screen.
        const maxAttempts = paymentSuccess ? 10 : 1;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          const { data: hasEntitlement, error: entitlementError } = await supabase.rpc("dealer_has_entitlement", {
            p_dealer_id: dealerId,
          });

          if (entitlementError) throw entitlementError;

          if (hasEntitlement) {
            if (!cancelled) setGate({ kind: "allowed" });
            return;
          }

          if (!paymentSuccess) break;
          if (attempt < maxAttempts) await sleep(1500);
        }

        if (!cancelled) setGate({ kind: "redirecting" });
        await router.replace(dealerPlanHref);
      } catch (e) {
        console.error("Create listing entitlement check failed:", e);
        if (!cancelled) setGate({ kind: "redirecting" });
        await router.replace(dealerPlanHref);
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [
    router.isReady,
    router.query.payment_success,
    loading,
    profileLoading,
    profile?.role,
    router,
    user,
    nextAfterPlan,
    dealerPlanHref,
  ]);

  if (gate.kind !== "allowed") {
    return (
      <>
        <Head>
          <title>Inserat erstellen | BuyAuto Schweiz</title>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <div className="min-h-[60vh] flex items-center justify-center px-6">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-3 text-neutral-600">{gate.kind === "checking" ? "Prüfe Garage-Paket…" : "Weiterleitung…"}</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Inserat erstellen | BuyAuto Schweiz</title>
        <meta
          name="description"
          content="Erstelle dein Auto-Leasing-Inserat auf BuyAuto. Gratis oder Premium, 60 Tage, 90 Tage oder Unlimitiert."
        />
        <meta name="robots" content="index, follow" />
      </Head>

      <ListingWizard />
    </>
  );
}