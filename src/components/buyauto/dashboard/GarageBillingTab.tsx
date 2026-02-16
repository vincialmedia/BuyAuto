import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Mail, RefreshCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Garage } from "@/services/garageService";
import { getActiveDealerPlans, type DealerPlanRow } from "@/services/dealerPlansService";
import {
  ensureDealerPremiumCredits,
  getMyDealerPlanChanges,
  getMyDealerPremiumCredits,
  getMyDealerSubscription,
  requestDealerPlanChange,
  type DealerPlanChangeRow,
  type DealerPremiumCreditsRow,
  type DealerSubscriptionRow,
} from "@/services/dealerSubscriptionService";
import { useHasMounted } from "@/hooks/use-has-mounted";

type BannerState = { kind: "idle" } | { kind: "success"; message: string } | { kind: "error"; message: string };

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unbekannter Fehler";
}

function getCurrentPeriodYYYYMM(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function formatChf(amount: number | null): string {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return "—";
  return `CHF ${amount}`;
}

function getPlanBadgeClass(code: string): string {
  if (code === "growth") return "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0";
  return "bg-neutral-100 text-neutral-900 border border-neutral-200";
}

export function GarageBillingTab({ garage }: { garage: Garage | null }) {
  const hasMounted = useHasMounted();

  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<BannerState>({ kind: "idle" });

  const [plans, setPlans] = useState<DealerPlanRow[]>([]);
  const [subscription, setSubscription] = useState<DealerSubscriptionRow | null>(null);
  const [changes, setChanges] = useState<DealerPlanChangeRow[]>([]);
  const [credits, setCredits] = useState<DealerPremiumCreditsRow | null>(null);

  const periodYYYYMM = useMemo(() => (hasMounted ? getCurrentPeriodYYYYMM() : ""), [hasMounted]);

  const planById = useMemo(() => {
    const map = new Map<string, DealerPlanRow>();
    for (const p of plans) map.set(p.id, p);
    return map;
  }, [plans]);

  const currentPlan = useMemo(() => {
    if (!subscription?.plan_id) return null;
    return planById.get(subscription.plan_id) ?? null;
  }, [planById, subscription?.plan_id]);

  async function refreshAll() {
    if (!garage?.id) return;
    if (!hasMounted) return;

    setBanner({ kind: "idle" });
    setLoading(true);
    try {
      const [p, sub, hist] = await Promise.all([getActiveDealerPlans(), getMyDealerSubscription(garage), getMyDealerPlanChanges(garage)]);

      setPlans(p);
      setSubscription(sub);
      setChanges(hist);

      if (periodYYYYMM) {
        await ensureDealerPremiumCredits(garage, periodYYYYMM);
        const c = await getMyDealerPremiumCredits(garage, periodYYYYMM);
        setCredits(c);
      } else {
        setCredits(null);
      }
    } catch (e) {
      setBanner({ kind: "error", message: `Konnte Zahlung nicht laden: ${getErrorMessage(e)}` });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!hasMounted) return;
    void refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [garage?.id, hasMounted]);

  async function handleRequestChange(toCode: string) {
    if (!garage) return;

    setBanner({ kind: "idle" });
    setBusy(true);
    try {
      await requestDealerPlanChange(garage, toCode);
      setBanner({ kind: "success", message: "Paket-Wechsel wurde gespeichert. Dein Dashboard aktualisiert sich jetzt." });
      await refreshAll();
    } catch (e) {
      setBanner({ kind: "error", message: `Paket-Wechsel fehlgeschlagen: ${getErrorMessage(e)}` });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
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

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-3xl border-neutral-200/60 shadow-sm lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-lg font-bold tracking-tight text-neutral-900">Aktuelles Paket</div>
                <div className="mt-1 text-sm text-neutral-600">Dein aktueller Stand im Marketplace.</div>
              </div>
              <Button variant="outline" className="rounded-2xl" onClick={() => void refreshAll()} disabled={loading || busy || !garage}>
                <RefreshCcw className="h-4 w-4 mr-2" />
                Aktualisieren
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Lade…
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-neutral-900">{currentPlan?.name ?? "—"}</div>
                  <Badge className={cn("rounded-full", getPlanBadgeClass(currentPlan?.code ?? ""))}>{currentPlan?.code ?? "—"}</Badge>
                </div>

                <div className="rounded-2xl border border-neutral-200/60 bg-neutral-50 p-4">
                  <div className="text-sm text-neutral-700">
                    <div className="flex items-center justify-between">
                      <span>Preis</span>
                      <span className="font-semibold text-neutral-900">
                        {currentPlan?.code === "custom" ? "Individuell" : `${formatChf(currentPlan?.monthly_price_chf)} / Monat`}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span>Inserate</span>
                      <span className="font-semibold text-neutral-900">
                        {currentPlan?.code === "custom" ? "100+" : (currentPlan?.listing_limit ?? garage?.listing_limit ?? "—")}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span>Premium / Monat</span>
                      <span className="font-semibold text-neutral-900">
                        {currentPlan?.code === "custom" ? "nach Bedarf" : (currentPlan?.premium_included_per_month ?? 0)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span>Premium genutzt {periodYYYYMM ? `(${periodYYYYMM})` : ""}</span>
                      <span className="font-semibold text-neutral-900">
                        {currentPlan?.code === "custom"
                          ? "nach Bedarf"
                          : `${(credits?.credits_used ?? 0).toString()} / ${(credits?.credits_included ?? (currentPlan?.premium_included_per_month ?? 0)).toString()}`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-neutral-500">
                  Periode:{" "}
                  <span className="text-neutral-700">
                    {!hasMounted || !subscription?.current_period_start ? "—" : new Date(subscription.current_period_start).toLocaleDateString("de-CH")} –{" "}
                    {!hasMounted || !subscription?.current_period_end ? "—" : new Date(subscription.current_period_end).toLocaleDateString("de-CH")}
                  </span>
                </div>

                <div className="text-xs text-neutral-500">Hinweis: Premium ist Hervorhebung – keine garantierten Leads und kein versprochenes Suchranking-Boosting.</div>

                <div className="pt-1">
                  <Button asChild variant="secondary" className="w-full rounded-2xl">
                    <Link href="/garage-preise#pakete">Pakete vergleichen</Link>
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-neutral-200/60 shadow-sm lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="text-lg font-bold tracking-tight text-neutral-900">Paket ändern</div>
            <div className="mt-1 text-sm text-neutral-600">Upgrade/Downgrade. Du behältst deinen Zugriff und deine Daten.</div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Lade Pakete…
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {plans.map((p) => {
                  const isCurrent = subscription?.plan_id === p.id;
                  const isCustom = p.code === "custom";
                  return (
                    <div key={p.id} className="rounded-3xl border border-neutral-200/60 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-neutral-900">{p.name}</div>
                          <div className="mt-1 text-sm text-neutral-600">{isCustom ? "Individuell" : `${formatChf(p.monthly_price_chf)} / Monat`}</div>
                        </div>
                        {p.code === "growth" ? (
                          <Badge className="rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0">Meist gewählt</Badge>
                        ) : (
                          <Badge variant="secondary" className="rounded-full">
                            {p.listing_limit ?? "—"} Slots
                          </Badge>
                        )}
                      </div>

                      <div className="mt-3 text-sm text-neutral-600 space-y-1">
                        <div>Premium: {p.premium_included_per_month ?? 0} / Monat</div>
                        <div>Onboarding: {p.onboarding_included ? "inklusive" : "—"}</div>
                        {p.onboarding_note ? <div className="text-neutral-700">{p.onboarding_note}</div> : null}
                      </div>

                      <div className="mt-4">
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
                              p.code === "growth" ? "bg-gradient-to-r from-primary to-primary/80 text-white hover:opacity-95" : ""
                            )}
                            disabled={busy || isCurrent || !garage}
                            onClick={() => void handleRequestChange(p.code)}
                          >
                            {isCurrent ? "Aktuell" : "Wählen"}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-5 rounded-2xl border border-neutral-200/60 bg-neutral-50 p-4">
              <div className="text-sm font-semibold text-neutral-900">Done-for-you Onboarding</div>
              <div className="text-sm text-neutral-600 mt-1">
                Ab Growth: Du schickst uns dein Inventar, wir erledigen den Rest. (Kein Lead-Versprechen – aber saubere Präsenz + direkter Kanal.)
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border-neutral-200/60 shadow-sm">
        <CardHeader className="pb-3">
          <div className="text-lg font-bold tracking-tight text-neutral-900">Änderungsverlauf</div>
          <div className="mt-1 text-sm text-neutral-600">Deine Paket-Wechsel werden hier protokolliert.</div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Lade Verlauf…
            </div>
          ) : changes.length === 0 ? (
            <div className="text-sm text-neutral-600">Noch keine Paket-Wechsel.</div>
          ) : (
            <div className="space-y-2">
              {changes.slice(0, 10).map((c) => {
                const fromName = c.from_plan_id ? planById.get(c.from_plan_id)?.name ?? "—" : "—";
                const toName = planById.get(c.to_plan_id)?.name ?? "—";
                return (
                  <div key={c.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-2xl border border-neutral-200/60 bg-white px-4 py-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-neutral-900 truncate">
                        {fromName} → {toName}
                      </div>
                      <div className="text-xs text-neutral-500">{new Date(c.requested_at).toLocaleString("de-CH")} · Status: {c.status}</div>
                    </div>
                    <Badge variant="secondary" className="rounded-full w-fit">
                      {c.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}