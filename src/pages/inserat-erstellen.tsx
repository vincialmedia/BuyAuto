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
  return typeof input === "string" && input.startsWith("/");
}

export default function CreateListingPage() {
  const router = useRouter();
  const { user, loading, profile, profileLoading } = useAuth();
  const [gate, setGate] = useState<GateState>({ kind: "checking" });

  const nextAfterPlan = useMemo(() => "/inserat-erstellen", []);

  useEffect(() => {
    if (loading || profileLoading) return;

    if (!user || profile?.role !== "garage") {
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

        const garagePlan = garage?.plan ?? "free";
        const hasSnapshotPlan = garagePlan !== "free";

        if (hasSnapshotPlan) {
          if (!cancelled) setGate({ kind: "allowed" });
          return;
        }

        const dealerId = garage?.id ?? null;
        if (!dealerId) {
          if (!cancelled) setGate({ kind: "redirecting" });
          await router.replace(`/garage-plan?next=${encodeURIComponent(nextAfterPlan)}`);
          return;
        }

        const { data: sub, error: subError } = await supabase
          .from("dealer_subscriptions")
          .select("id, status")
          .eq("dealer_id", dealerId)
          .maybeSingle();

        if (subError) throw subError;

        const hasActiveSub = Boolean(sub?.id) && sub?.status === "active";
        if (hasActiveSub) {
          if (!cancelled) setGate({ kind: "allowed" });
          return;
        }

        if (!cancelled) setGate({ kind: "redirecting" });
        await router.replace(`/garage-plan?next=${encodeURIComponent(nextAfterPlan)}`);
      } catch {
        if (!cancelled) setGate({ kind: "allowed" });
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [loading, profileLoading, profile?.role, router, user, nextAfterPlan]);

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