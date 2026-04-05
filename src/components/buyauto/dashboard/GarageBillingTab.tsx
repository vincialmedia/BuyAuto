import { useMemo } from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Crown, Check, Zap, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { type Garage } from "@/services/garageService";
import { formatDateTimeDeCH, getDealerEntitlement } from "@/services/dealerEntitlementService";

interface GarageBillingTabProps {
  garage: Garage | null;
}

// Updated plans based on src/pages/preise.tsx
const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "CHF 149",
    period: "/ Monat",
    limit: "bis zu 15 Inserate",
    premiumIncluded: "1 Premium Inserat / Monat inklusive",
    features: [
      "Garage-Profilseite + Inventar",
      "VIN-PreFill (wo verfügbar)",
      "Leasing-Rechner im Inserat",
      "Deal-Chat pro Fahrzeug",
      "Basis-Statistiken"
    ],
    popular: false,
  },
  {
    id: "growth",
    name: "Growth",
    price: "CHF 349",
    period: "/ Monat",
    limit: "bis zu 50 Inserate",
    premiumIncluded: "5 Premium Inserate / Monat inklusive",
    features: [
      "Alles aus Starter",
      "Kompletter Bestand hochladen*",
      "Inventar-Import Service",
      "Priorisierter Support"
    ],
    popular: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "CHF 599",
    period: "/ Monat",
    limit: "bis zu 100 Inserate",
    premiumIncluded: "10 Premium Inserate / Monat inklusive",
    features: [
      "Alles aus Growth",
      "Priorisiertes Onboarding",
      "Dedizierter Ansprechpartner",
      "Erweiterte Statistiken"
    ],
    popular: false,
  },
];

export function GarageBillingTab({ garage }: GarageBillingTabProps) {
  const router = useRouter();
  const [entitlementLabel, setEntitlementLabel] = useState<string | null>(null);
  const [entitlementKind, setEntitlementKind] = useState<"trial" | "subscription" | "none">("none");
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [entitlementPlanCode, setEntitlementPlanCode] = useState<string | null>(null);

  const currentPlanId = useMemo(() => {
    const raw = (garage?.plan ?? "").trim();
    if (!raw || raw === "No_Plan" || raw === "no_plan") return null;
    return raw.toLowerCase();
  }, [garage?.plan]);

  const effectivePlanId = useMemo(() => {
    return entitlementPlanCode ?? currentPlanId;
  }, [currentPlanId, entitlementPlanCode]);

  useEffect(() => {
    let cancelled = false;
    let intervalId: number | null = null;

    async function load() {
      try {
        const ent = await getDealerEntitlement(garage);
        if (cancelled) return;

        if (ent.kind === "trial") {
          const name = ent.planName ?? ent.planCode;
          setEntitlementLabel(`${name} (Trial bis ${formatDateTimeDeCH(ent.endsAt)})`);
          setEntitlementKind("trial");
          setTrialEndsAt(ent.endsAt);
          setEntitlementPlanCode(ent.planCode);
          return;
        }

        if (ent.kind === "subscription") {
          const name = ent.planName ?? ent.planCode;
          const suffix = ent.endsAt ? ` (bis ${formatDateTimeDeCH(ent.endsAt)})` : "";
          setEntitlementLabel(`${name}${suffix}`);
          setEntitlementKind("subscription");
          setTrialEndsAt(null);
          setEntitlementPlanCode(ent.planCode);
          return;
        }

        if (ent.kind === "garage_plan_field") {
          const name = ent.planName ?? ent.planCode;
          setEntitlementLabel(name);
          setEntitlementKind("subscription");
          setTrialEndsAt(null);
          setEntitlementPlanCode(ent.planCode);
          return;
        }

        setEntitlementLabel(null);
        setEntitlementKind("none");
        setTrialEndsAt(null);
        setEntitlementPlanCode(null);
      } catch {
        if (!cancelled) {
          setEntitlementLabel(null);
          setEntitlementKind("none");
          setTrialEndsAt(null);
          setEntitlementPlanCode(null);
        }
      }
    }

    void load();

    intervalId = window.setInterval(() => {
      void load();
    }, 5 * 60 * 1000);

    const onVis = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelled = true;
      if (intervalId !== null) window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [garage?.id]);

  const currentPlanDetails = useMemo(() => {
    if (!effectivePlanId) return null;
    return PLANS.find((p) => p.id === effectivePlanId);
  }, [effectivePlanId]);

  function handleUpgrade(planId: string) {
    router.push(`/garage-plan?plan=${planId}`);
  }

  return (
    <div className="space-y-8">
      {/* Current Plan Section */}
      <div className="rounded-3xl border border-neutral-200/60 bg-white shadow-sm p-6">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-neutral-900">Aktueller Status</h3>
            <p className="text-sm text-neutral-600 mt-1">
              {entitlementLabel ? (
                <>Sie nutzen aktuell den <span className="font-semibold">{entitlementLabel}</span>.</>
              ) : currentPlanId ? (
                <>Sie nutzen aktuell den <span className="font-semibold capitalize">{currentPlanDetails?.name || currentPlanId}</span> Plan.</>
              ) : (
                "Sie haben noch keinen aktiven Plan ausgewählt."
              )}
            </p>
          </div>
          
          {currentPlanId ? (
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 rounded-full px-3 py-1">
              <Crown className="h-3.5 w-3.5 mr-1" />
              {currentPlanDetails?.name || currentPlanId} Aktiv
            </Badge>
          ) : (
             <Badge className="bg-amber-100 text-amber-800 border-amber-200 rounded-full px-3 py-1">
              <AlertTriangle className="h-3.5 w-3.5 mr-1" />
              Kein Plan
            </Badge>
          )}
        </div>

        {currentPlanId ? (
          <div className="rounded-2xl bg-neutral-50 border border-neutral-200/60 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-neutral-900">Inserate-Limit</div>
                <div className="text-xs text-neutral-600 mt-1">
                  {garage?.listing_limit ?? 0} aktive Inserate erlaubt
                </div>
              </div>
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => document.getElementById('available-plans')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Plan ändern
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-amber-50 border border-amber-200/60 p-6 text-center">
            <h4 className="font-semibold text-amber-900 mb-2">Starten Sie jetzt durch</h4>
            <p className="text-sm text-amber-800/80 mb-4 max-w-md mx-auto">
              Wählen Sie eines unserer Pakete, um Inserate zu schalten und Ihre Garage professionell zu präsentieren.
            </p>
            <Button 
              className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl"
              onClick={() => document.getElementById('available-plans')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Zu den Paketen
            </Button>
          </div>
        )}
      </div>

      {/* Available Plans Section */}
      <div id="available-plans" className="scroll-mt-24">
        <h3 className="text-xl font-bold tracking-tight text-neutral-900 mb-6">Verfügbare Pakete</h3>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {PLANS.map((plan) => {
            const isCurrent = plan.id === effectivePlanId;
            return (
              <Card
                key={plan.id}
                className={cn(
                  "rounded-3xl overflow-hidden transition-all flex flex-col h-full border-neutral-200",
                  plan.popular && "border-primary/50 shadow-lg ring-1 ring-primary/20",
                  isCurrent && "border-emerald-500 bg-emerald-50/10 ring-1 ring-emerald-500/20"
                )}
              >
                {plan.popular && (
                  <div className="bg-primary text-white text-xs font-bold uppercase tracking-wider text-center py-1.5">
                    Meist gewählt
                  </div>
                )}
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                    {isCurrent && <Check className="h-5 w-5 text-emerald-600" />}
                  </div>
                  <CardDescription className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-bold text-neutral-900">{plan.price}</span>
                    <span className="text-sm text-neutral-600">{plan.period}</span>
                  </CardDescription>
                  <div className="text-sm font-medium text-neutral-700 mt-3 bg-neutral-100 rounded-lg px-3 py-2 inline-block">
                    {plan.limit}
                  </div>
                  <div className="text-xs text-primary font-medium mt-2">
                    {plan.premiumIncluded}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 flex-1 flex flex-col">
                  <ul className="space-y-3 flex-1">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-sm">
                        <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                        <span className="text-neutral-600 leading-snug">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button
                    className={cn(
                      "w-full rounded-xl h-12 font-semibold text-base",
                      isCurrent 
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                        : plan.popular 
                          ? "bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20"
                          : "bg-white border-2 border-neutral-200 hover:border-neutral-300 text-neutral-900"
                    )}
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isCurrent}
                  >
                    {isCurrent ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Aktives Paket
                      </>
                    ) : (
                      <>
                        {plan.id} wählen
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-neutral-500">
          * Wir bringen dich komplett an den Start und übernehmen den Upload deines Inventars für dich.
        </p>
      </div>

      {/* Enterprise / Contact Section */}
      <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-8 text-center sm:text-left sm:flex sm:items-center sm:justify-between gap-6">
        <div>
          <h4 className="text-lg font-bold text-neutral-900">Größeres Inventar?</h4>
          <p className="text-sm text-neutral-600 mt-1 max-w-xl">
            Für Garagen mit mehr als 100 Fahrzeugen oder speziellen Anforderungen bieten wir individuelle Enterprise-Lösungen an.
          </p>
        </div>
        <Button 
          variant="outline" 
          className="mt-4 sm:mt-0 rounded-xl px-6 h-11 border-neutral-300 hover:bg-white"
          onClick={() => router.push("/kontakt")}
        >
          Kontakt aufnehmen
        </Button>
      </div>
    </div>
  );
}