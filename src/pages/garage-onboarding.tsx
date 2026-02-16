import Head from "next/head";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type PlanCode = "starter" | "growth" | "pro" | "custom";

function normalizePlan(input: unknown): PlanCode | null {
  const raw = typeof input === "string" ? input.trim().toLowerCase() : "";
  if (raw === "starter" || raw === "growth" || raw === "pro" || raw === "custom") return raw;
  return null;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unbekannter Fehler";
}

export default function GarageOnboardingPage() {
  const router = useRouter();
  const { user, loading, profile, profileLoading } = useAuth();

  const selectedPlan = useMemo(() => normalizePlan(router.query.plan), [router.query.plan]);

  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<{ kind: "idle" } | { kind: "success"; message: string } | { kind: "error"; message: string }>({
    kind: "idle",
  });

  const redirectToAuthUrl = useMemo(() => {
    const qp = selectedPlan ? `?plan=${encodeURIComponent(selectedPlan)}` : "";
    const target = `/garage-onboarding${qp}`;
    return `/auth?redirect=${encodeURIComponent(target)}`;
  }, [selectedPlan]);

  const isGarage = profile?.role === "garage";

  async function handleActivateGarage() {
    setBanner({ kind: "idle" });
    setBusy(true);

    try {
      const { error } = await supabase.rpc("upgrade_to_garage", {});
      if (error) throw error;

      setBanner({ kind: "success", message: "Dein Garage-Konto ist aktiv. Als nächstes: Paket unter „Zahlung“ auswählen." });

      await router.push("/dashboard/garage");
    } catch (e) {
      setBanner({ kind: "error", message: `Aktivierung fehlgeschlagen: ${getErrorMessage(e)}` });
    } finally {
      setBusy(false);
    }
  }

  return (
    <MainLayout>
      <Head>
        <title>Garage Onboarding | BuyAuto</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="bg-neutral-50/60">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900">Garage starten</h1>
            <p className="mt-3 text-neutral-600">
              In 2 Minuten bist du drin. Danach kannst du dein Paket im Garage-Dashboard unter „Zahlung“ auswählen.
            </p>

            {selectedPlan && (
              <div className="mt-4 inline-flex items-center rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-700">
                Vorauswahl: <span className="ml-2 font-semibold text-neutral-900">{selectedPlan}</span>
              </div>
            )}
          </div>

          <div className="mt-6">
            {banner.kind !== "idle" && (
              <div
                className={cn(
                  "rounded-2xl border px-4 py-3 text-sm",
                  banner.kind === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : "border-red-200 bg-red-50 text-red-900"
                )}
              >
                {banner.message}
              </div>
            )}
          </div>

          <div className="mt-6 grid gap-4">
            <Card className="rounded-3xl border-neutral-200/60 shadow-sm">
              <CardHeader className="pb-3">
                <div className="text-lg font-bold tracking-tight text-neutral-900">Was passiert als nächstes?</div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-neutral-600">
                <div className="flex items-start gap-3">
                  <div className="mt-2 h-2 w-2 rounded-full bg-primary" />
                  <div>Account erstellen oder anmelden</div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-2 h-2 w-2 rounded-full bg-primary" />
                  <div>Garage aktivieren</div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-2 h-2 w-2 rounded-full bg-primary" />
                  <div>Paket unter „Zahlung“ wählen (Upgrade/Downgrade später jederzeit)</div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-neutral-200/60 shadow-sm">
              <CardHeader className="pb-3">
                <div className="text-lg font-bold tracking-tight text-neutral-900">Aktion</div>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row gap-3 sm:items-center">
                {loading || profileLoading ? (
                  <Button disabled className="rounded-2xl h-11 w-full sm:w-auto">
                    Wird geladen…
                  </Button>
                ) : !user ? (
                  <>
                    <Button asChild className="rounded-2xl h-11 w-full sm:w-auto">
                      <Link href={redirectToAuthUrl}>Jetzt anmelden / Konto erstellen</Link>
                    </Button>
                    <Button asChild variant="secondary" className="rounded-2xl h-11 w-full sm:w-auto">
                      <a href="mailto:hello@buyauto.ch">Kontakt aufnehmen</a>
                    </Button>
                  </>
                ) : isGarage ? (
                  <>
                    <Button asChild className="rounded-2xl h-11 w-full sm:w-auto">
                      <Link href="/dashboard/garage">Zum Garage-Dashboard</Link>
                    </Button>
                    <Button asChild variant="secondary" className="rounded-2xl h-11 w-full sm:w-auto">
                      <Link href="/garage-preise#pakete">Pakete ansehen</Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => void handleActivateGarage()}
                      disabled={busy}
                      className="rounded-2xl h-11 w-full sm:w-auto"
                    >
                      {busy ? "Aktiviere…" : "Garage-Konto aktivieren"}
                    </Button>
                    <Button asChild variant="secondary" className="rounded-2xl h-11 w-full sm:w-auto">
                      <a href="mailto:hello@buyauto.ch">Kontakt aufnehmen</a>
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            <div className="text-xs text-neutral-500">
              Hinweis: Falls dein Konto schon eine Garage ist, findest du dein Paket im Garage-Dashboard unter „Zahlung“.
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}