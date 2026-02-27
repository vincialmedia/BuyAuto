import Head from "next/head";
import { GetServerSideProps } from "next";
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

export default function CreateListingPage() {
  const router = useRouter();
  const { user, loading, profile, profileLoading } = useAuth();
  const [gate, setGate] = useState<GateState>({ kind: "checking" });

  const nextAfterPlan = useMemo(() => "/inserat-erstellen", []);

  useEffect(() => {
    if (!router.isReady) return;
    if (loading || profileLoading) return;

    if (!user) {
      setGate({ kind: "redirecting" });
      void router.replace("/auth?redirect=" + encodeURIComponent(nextAfterPlan));
      return;
    }

    if (profile?.role !== "garage") {
      setGate({ kind: "allowed" });
      return;
    }

    let cancelled = false;

    async function run() {
      try {
        const { data: garage, error: garageError } = await supabase
          .from("garages")
          .select("id, plan")
          .eq("owner_user_id", user.id)
          .maybeSingle();

        if (garageError) throw garageError;

        const dealerId = garage?.id ?? null;
        if (!dealerId) {
          if (!cancelled) setGate({ kind: "redirecting" });
          await router.replace(`/garage-plan?redirect=${encodeURIComponent(nextAfterPlan)}`);
          return;
        }

        const { data: sub, error: subError } = await supabase
          .from("dealer_subscriptions")
          .select("id, status, current_period_end")
          .eq("dealer_id", dealerId)
          .maybeSingle();

        if (subError) throw subError;

        const status = typeof sub?.status === "string" ? sub.status : null;
        const periodEnd = typeof sub?.current_period_end === "string" ? Date.parse(sub.current_period_end) : null;

        const now = Date.now();
        const isActiveByStatus = status === "active";
        const isStillInPaidPeriod = typeof periodEnd === "number" && Number.isFinite(periodEnd) ? periodEnd > now : false;

        const entitled = isActiveByStatus || isStillInPaidPeriod;

        if (entitled) {
          if (!cancelled) setGate({ kind: "allowed" });
          return;
        }

        if (!cancelled) setGate({ kind: "redirecting" });
        await router.replace(`/garage-plan?redirect=${encodeURIComponent(nextAfterPlan)}`);
      } catch {
        if (!cancelled) setGate({ kind: "allowed" });
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [router.isReady, loading, profileLoading, profile?.role, router, user, nextAfterPlan]);

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
            <p className="mt-3 text-neutral-600">
              {gate.kind === "checking" ? "Prüfe Garage-Paket…" : "Weiterleitung…"}
            </p>
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
          content="Erstelle dein Auto-Leasing-Inserat auf BuyAuto. Gratis oder Premium, 30 Tage, 90 Tage oder Unlimitiert."
        />
        <meta name="robots" content="index, follow" />
      </Head>

      <ListingWizard />
    </>
  );
}

// Force server-side rendering to disable static export for this page
// This prevents the server-side Stripe SDK from being bundled into client code
export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {}, // No props needed, just forces SSR
  };
};