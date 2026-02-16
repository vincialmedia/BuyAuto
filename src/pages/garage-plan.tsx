import Head from "next/head";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { Check, ChevronRight, Crown, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type PlanCode = "starter" | "growth" | "pro" | "custom";

type DealerPlan = {
  id: string;
  code: string;
  name: string;
  monthly_price_chf: number | null;
  listing_limit: number | null;
  premium_included_per_month: number | null;
  onboarding_included: boolean;
  onboarding_note: string | null;
};

type PrepareOk = { ok: true; clientSecret: string; paymentIntentId: string; amountChf: number };
type PrepareErr = { ok: false; error: string };
type PrepareResponse = PrepareOk | PrepareErr;

const PaymentWidget = dynamic(() => import("@/components/buyauto/create-listing/PaymentWidget"), {
  ssr: false,
  loading: () => (
    <div className="text-center py-10">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <p className="mt-3 text-neutral-600">Lade Zahlungsformular…</p>
    </div>
  ),
});

function normalizePlan(input: unknown): PlanCode | null {
  const raw = typeof input === "string" ? input.trim().toLowerCase() : "";
  if (raw === "starter" || raw === "growth" || raw === "pro" || raw === "custom") return raw;
  return null;
}

function isSafeNextPath(input: unknown): input is string {
  return typeof input === "string" && input.startsWith("/");
}

function formatChf(amount: number | null): string {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return "—";
  return `CHF ${amount} / Monat`;
}

function planCardTopClass(code: string): string {
  if (code === "growth") return "border-primary/20 bg-gradient-to-b from-primary/[0.06] to-white shadow-lg";
  return "border-neutral-200/60 bg-white shadow-sm";
}

function isPrepareOk(input: unknown): input is PrepareOk {
  if (!input || typeof input !== "object") return false;
  const r = input as any;
  return (
    r.ok === true &&
    typeof r.clientSecret === "string" &&
    r.clientSecret.length > 0 &&
    typeof r.paymentIntentId === "string" &&
    r.paymentIntentId.length > 0 &&
    typeof r.amountChf === "number"
  );
}

function isPrepareErr(input: unknown): input is PrepareErr {
  if (!input || typeof input !== "object") return false;
  const r = input as any;
  return r.ok === false && typeof r.error === "string";
}

export default function GaragePlanPage() {
  const router = useRouter();
  const { user, loading, profile, profileLoading } = useAuth();

  const selectedFromQuery = useMemo(() => normalizePlan(router.query.plan), [router.query.plan]);
  const safeNext = useMemo(() => (isSafeNextPath(router.query.next) ? router.query.next : "/inserat-erstellen"), [router.query.next]);

  const [currentGaragePlanSnapshot, setCurrentGaragePlanSnapshot] = useState<string | null>(null);

  const [plans, setPlans] = useState<DealerPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);

  const [banner, setBanner] = useState<{ kind: "idle" } | { kind: "error"; message: string } | { kind: "success"; message: string }>({
    kind: "idle",
  });

  const [step, setStep] = useState<"select" | "pay">("select");
  const [pickedPlan, setPickedPlan] = useState<PlanCode | null>(selectedFromQuery);
  const [busy, setBusy] = useState(false);

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [amountChf, setAmountChf] = useState<number>(0);

  const authRedirectUrl = useMemo(() => {
    const qp = new URLSearchParams();
    if (selectedFromQuery) qp.set("plan", selectedFromQuery);
    qp.set("next", safeNext);
    return `/auth?redirect=${encodeURIComponent(`/garage-plan?${qp.toString()}`)}`;
  }, [safeNext, selectedFromQuery]);

  useEffect(() => {
    let cancelled = false;

    async function loadPlans() {
      setPlansLoading(true);
      try {
        const { data, error } = await supabase
          .from("dealer_plans")
          .select("id, code, name, monthly_price_chf, listing_limit, premium_included_per_month, onboarding_included, onboarding_note, active")
          .eq("active", true);

        if (error) throw error;

        const rows = (Array.isArray(data) ? data : []) as Array<DealerPlan & { active: boolean }>;
        const normalized = rows
          .map((r) => ({
            id: r.id,
            code: r.code,
            name: r.name,
            monthly_price_chf: r.monthly_price_chf,
            listing_limit: r.listing_limit,
            premium_included_per_month: r.premium_included_per_month,
            onboarding_included: r.onboarding_included,
            onboarding_note: r.onboarding_note,
          }))
          .sort((a, b) => {
            const aCustom = a.code === "custom";
            const bCustom = b.code === "custom";
            if (aCustom && !bCustom) return 1;
            if (!aCustom && bCustom) return -1;
            const ap = typeof a.monthly_price_chf === "number" ? a.monthly_price_chf : 999999;
            const bp = typeof b.monthly_price_chf === "number" ? b.monthly_price_chf : 999999;
            return ap - bp;
          });

        if (!cancelled) setPlans(normalized);
      } catch (e: any) {
        if (!cancelled) setBanner({ kind: "error", message: `Konnte Pakete nicht laden: ${typeof e?.message === "string" ? e.message : "Unbekannter Fehler"}` });
      } finally {
        if (!cancelled) setPlansLoading(false);
      }
    }

    void loadPlans();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (loading || profileLoading) return;

    if (!user) return;
    if (profile?.role !== "garage") return;

    let cancelled = false;

    async function checkGarage() {
      try {
        const { data: garage, error: garageError } = await supabase
          .from("garages")
          .select("id, plan")
          .eq("owner_user_id", user.id)
          .maybeSingle();

        if (garageError) throw garageError;

        const snapshotPlan = String(garage?.plan ?? "no_plan").trim().toLowerCase();

        if (!cancelled) {
          setCurrentGaragePlanSnapshot(snapshotPlan);
        }

        const hasPlan = snapshotPlan !== "free" && snapshotPlan !== "no_plan" && snapshotPlan !== "no plan";
        if (hasPlan) {
          await router.replace(safeNext);
        }
      } catch (e: any) {
        if (!cancelled) {
          setBanner({ kind: "error", message: `Konnte Garage nicht laden: ${typeof e?.message === "string" ? e.message : "Unbekannter Fehler"}` });
        }
      }
    }

    void checkGarage();

    return () => {
      cancelled = true;
    };
  }, [loading, profileLoading, profile?.role, router, safeNext, user]);

  async function handleActivateGarage() {
    setBanner({ kind: "idle" });
    setBusy(true);
    try {
      const { error } = await supabase.rpc("upgrade_to_garage", {});
      if (error) throw error;

      setBanner({ kind: "success", message: "Dein Garage-Konto ist aktiv. Als nächstes: Paket auswählen und bezahlen." });
      await router.replace(`/garage-plan?next=${encodeURIComponent(safeNext)}`);
    } catch (e: any) {
      setBanner({ kind: "error", message: `Aktivierung fehlgeschlagen: ${typeof e?.message === "string" ? e.message : "Unbekannter Fehler"}` });
    } finally {
      setBusy(false);
    }
  }

  async function handlePickAndPay(code: PlanCode) {
    setBanner({ kind: "idle" });

    if (!user) {
      await router.push(authRedirectUrl);
      return;
    }

    if (profile?.role !== "garage") {
      setBanner({ kind: "error", message: "Dieses Paket ist für Garagen. Bitte aktiviere zuerst dein Garage-Konto." });
      return;
    }

    if (code === "custom") return;

    setBusy(true);
    try {
      const response = await fetch("/api/dealer/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_code: code }),
      });

      const json = (await response.json().catch(() => null)) as unknown;

      if (isPrepareErr(json)) {
        throw new Error(json.error);
      }

      if (!response.ok) {
        throw new Error("Zahlung konnte nicht vorbereitet werden.");
      }

      if (!isPrepareOk(json)) {
        throw new Error("Zahlung konnte nicht vorbereitet werden.");
      }

      setPickedPlan(code);
      setClientSecret(json.clientSecret);
      setPaymentIntentId(json.paymentIntentId);
      setAmountChf(json.amountChf);
      setStep("pay");
    } catch (e: any) {
      setBanner({ kind: "error", message: `Zahlung konnte nicht gestartet werden: ${typeof e?.message === "string" ? e.message : "Unbekannter Fehler"}` });
    } finally {
      setBusy(false);
    }
  }

  async function handlePaymentSuccess() {
    if (!paymentIntentId) {
      setBanner({ kind: "error", message: "Zahlung bestätigt, aber PaymentIntent fehlt. Bitte neu laden." });
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/dealer/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_intent_id: paymentIntentId }),
      });

      const result = (await response.json().catch(() => null)) as unknown as { ok?: boolean; error?: string };

      if (!response.ok || !result?.ok) {
        throw new Error(typeof result?.error === "string" ? result.error : "Plan konnte nicht aktiviert werden.");
      }

      await router.replace(safeNext);
    } catch (e: any) {
      setBanner({ kind: "error", message: `Plan-Aktivierung fehlgeschlagen: ${typeof e?.message === "string" ? e.message : "Unbekannter Fehler"}` });
    } finally {
      setBusy(false);
    }
  }

  const isLoadingAuth = loading || profileLoading;

  return (
    <>
      <Head>
        <title>Garage Paket wählen | BuyAuto</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="bg-neutral-50/60">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-700">
              Pakete für Garagen <span className="h-1 w-1 rounded-full bg-neutral-300" /> direkt online aktivieren
            </div>
            <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900">Paket auswählen</h1>
            <p className="mt-3 text-neutral-600">Wähle dein Paket, bezahle direkt per Stripe – und erstelle danach sofort dein Inserat.</p>
          </div>

          {banner.kind !== "idle" && (
            <div
              className={cn(
                "mt-6 rounded-2xl border px-4 py-3 text-sm",
                banner.kind === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-red-200 bg-red-50 text-red-900"
              )}
            >
              {banner.message}
            </div>
          )}

          <div className="mt-8">
            {isLoadingAuth ? (
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Lade…
              </div>
            ) : !user ? (
              <div className="rounded-3xl border border-neutral-200/60 bg-white p-6 shadow-sm">
                <div className="text-sm font-semibold text-neutral-900">Bevor du startest</div>
                <div className="mt-1 text-sm text-neutral-600">Bitte melde dich an oder erstelle ein Konto, um dein Garage-Paket zu aktivieren.</div>
                <div className="mt-4 flex flex-col sm:flex-row gap-3">
                  <Button asChild className="rounded-2xl h-11">
                    <Link href={authRedirectUrl}>Jetzt anmelden / Konto erstellen</Link>
                  </Button>
                  <Button asChild variant="secondary" className="rounded-2xl h-11">
                    <a href="mailto:hello@buyauto.ch">Kontakt aufnehmen</a>
                  </Button>
                </div>
              </div>
            ) : profile?.role !== "garage" ? (
              <div className="rounded-3xl border border-neutral-200/60 bg-white p-6 shadow-sm">
                <div className="text-sm font-semibold text-neutral-900">Garage-Konto aktivieren</div>
                <div className="mt-1 text-sm text-neutral-600">
                  Dieses Paket-System ist für Garagen. Aktiviere kurz dein Garage-Konto – danach kannst du dein Paket auswählen.
                </div>
                <div className="mt-4 flex flex-col sm:flex-row gap-3">
                  <Button onClick={() => void handleActivateGarage()} disabled={busy} className="rounded-2xl h-11">
                    {busy ? "Aktiviere…" : "Garage-Konto aktivieren"}
                  </Button>
                  <Button asChild variant="secondary" className="rounded-2xl h-11">
                    <a href="mailto:hello@buyauto.ch">Kontakt aufnehmen</a>
                  </Button>
                </div>
              </div>
            ) : step === "pay" && clientSecret ? (
              <div className="rounded-3xl border border-neutral-200/60 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-lg font-bold tracking-tight text-neutral-900">Bezahlung abschliessen</div>
                    <div className="mt-1 text-sm text-neutral-600">
                      Paket: <span className="font-semibold text-neutral-900">{pickedPlan}</span> · Betrag:{" "}
                      <span className="font-semibold text-neutral-900">CHF {amountChf}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="rounded-2xl"
                    onClick={() => {
                      setStep("select");
                      setClientSecret(null);
                      setPaymentIntentId(null);
                    }}
                    disabled={busy}
                  >
                    Zurück
                  </Button>
                </div>

                <div className="mt-6">
                  <PaymentWidget clientSecret={clientSecret} totalAmount={amountChf} onSuccess={handlePaymentSuccess} />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Card className="rounded-3xl border-neutral-200/60 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-lg font-bold tracking-tight text-neutral-900">In jedem Paket inklusive</div>
                        <div className="mt-1 text-sm text-neutral-600">Marketplace-Setup + Deal-Chat pro Fahrzeug.</div>
                      </div>
                      <div className="text-xs text-neutral-500 text-right">
                        Garage-Status:{" "}
                        <span className="font-semibold text-neutral-700">
                          {currentGaragePlanSnapshot
                            ? currentGaragePlanSnapshot === "free" ||
                              currentGaragePlanSnapshot === "no_plan" ||
                              currentGaragePlanSnapshot === "no plan"
                              ? "Kein Paket"
                              : currentGaragePlanSnapshot
                            : "—"}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-2 sm:grid-cols-2 text-sm text-neutral-700">
                    {[
                      "Garage-Profilseite + Inventar-Seite",
                      "Inserate erstellen & verwalten",
                      "VIN-PreFill (wo verfügbar)",
                      "Leasing-Rechner direkt im Inserat",
                      "Deal-Chat pro Fahrzeug (Chat + Dokumente)",
                      "Basis-Statistiken: Views & Anfragen",
                    ].map((t) => (
                      <div key={t} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 text-emerald-600" />
                        <div>{t}</div>
                      </div>
                    ))}
                    <div className="sm:col-span-2 mt-2 text-xs text-neutral-500">
                      Wichtig: Leads können nicht garantiert werden – aber du bekommst eine saubere Präsenz + direkten Kanal für Anfragen.
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-3xl border-neutral-200/60 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="text-lg font-bold tracking-tight text-neutral-900">Pakete</div>
                    <div className="mt-1 text-sm text-neutral-600">Wähle das Paket, das zu deinem Bestand passt.</div>
                  </CardHeader>
                  <CardContent>
                    {plansLoading ? (
                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Lade Pakete…
                      </div>
                    ) : (
                      <div className="grid gap-4 lg:grid-cols-4">
                        {plans.map((p) => {
                          const code = normalizePlan(p.code) ?? "starter";
                          const isGrowth = p.code === "growth";
                          const isCustom = p.code === "custom";
                          const isPicked = pickedPlan === code;

                          return (
                            <div
                              key={p.id}
                              className={cn("rounded-3xl border overflow-hidden transition-shadow hover:shadow-md", planCardTopClass(p.code))}
                            >
                              <div className="p-5">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <div className="text-lg font-bold tracking-tight text-neutral-900">{p.name}</div>
                                      {isGrowth ? (
                                        <Badge className="rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0">
                                          Meist gewählt
                                        </Badge>
                                      ) : null}
                                    </div>
                                    <div className="mt-2 text-2xl font-bold tracking-tight text-neutral-900">
                                      {isCustom ? "Individuell" : formatChf(p.monthly_price_chf)}
                                    </div>
                                    <div className="mt-1 text-sm text-neutral-600">
                                      {isCustom ? "Für grosse Bestände, mehrere Standorte oder Spezialprozesse." : `bis zu ${p.listing_limit ?? "—"} Inserate`}
                                    </div>
                                    <div className="mt-1 text-sm text-neutral-600">
                                      {isCustom ? "Premium-Kontingent nach Bedarf" : `${p.premium_included_per_month ?? 0} Premium Inserat(e) / Monat inklusive`}
                                    </div>
                                  </div>

                                  <div className="rounded-2xl border border-neutral-200/60 bg-neutral-50 px-3 py-2 text-xs font-semibold text-neutral-700">
                                    {p.code.toUpperCase()}
                                  </div>
                                </div>

                                <div className="mt-4 space-y-2 text-sm text-neutral-700">
                                  {p.onboarding_included ? (
                                    <div className="flex gap-2">
                                      <ChevronRight className="mt-0.5 h-4 w-4 text-neutral-900" />
                                      <div>{p.onboarding_note ?? "Done-for-you Onboarding"}</div>
                                    </div>
                                  ) : (
                                    <div className="flex gap-2">
                                      <ChevronRight className="mt-0.5 h-4 w-4 text-neutral-900" />
                                      <div>Alles aus „Inklusive“</div>
                                    </div>
                                  )}
                                  <div className="flex gap-2">
                                    <Crown className="mt-0.5 h-4 w-4 text-amber-600" />
                                    <div>Premium = Hervorhebung, nicht garantierte Leads.</div>
                                  </div>
                                </div>

                                <div className="mt-5">
                                  {isCustom ? (
                                    <Button asChild variant="secondary" className="w-full rounded-2xl">
                                      <a href="mailto:hello@buyauto.ch">
                                        <Mail className="h-4 w-4 mr-2" />
                                        Kontakt aufnehmen
                                      </a>
                                    </Button>
                                  ) : (
                                    <Button
                                      className={cn(
                                        "w-full rounded-2xl",
                                        isGrowth ? "bg-gradient-to-r from-primary to-primary/80 text-white hover:opacity-95" : ""
                                      )}
                                      disabled={busy || isPicked}
                                      onClick={() => void handlePickAndPay(code)}
                                    >
                                      {isPicked ? "Ausgewählt" : "Jetzt auswählen & bezahlen"}
                                    </Button>
                                  )}
                                </div>

                                {code === "custom" ? (
                                  <div className="mt-3 text-xs text-neutral-500">Für 100+ rechnen wir gemeinsam: Standorte, Prozesse, Integrationen und Support.</div>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="mt-6 rounded-2xl border border-neutral-200/60 bg-neutral-50 p-4 text-sm text-neutral-600">
                      Du willst erst vergleichen?{" "}
                      <Link href="/garage-preise#pakete" className="font-semibold text-neutral-900 underline underline-offset-4">
                        Zur Preisübersicht
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}