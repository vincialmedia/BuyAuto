import { useMemo } from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Crown, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { type Garage } from "@/services/garageService";
import { formatDateTimeDeCH, getDealerEntitlement } from "@/services/dealerEntitlementService";
import { GaragePlanCards } from "@/components/buyauto/pricing/GaragePlanCards";
import { GarageFeatureMatrix } from "@/components/buyauto/pricing/GarageFeatureMatrix";
import { GarageTrustRow } from "@/components/buyauto/pricing/GarageTrustRow";
import {
  GARAGE_CUSTOM_THRESHOLD,
  garagePlanFor,
  type GaragePlanCode,
} from "@/lib/buyauto/garagePlans";

interface GarageBillingTabProps {
  garage: Garage | null;
}

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
    if (entitlementKind === "none") return null;
    return entitlementPlanCode ?? currentPlanId;
  }, [currentPlanId, entitlementKind, entitlementPlanCode]);

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

  const currentPlanDetails = useMemo(() => garagePlanFor(effectivePlanId), [effectivePlanId]);

  function handleUpgrade(_planId: GaragePlanCode) {
    // garage-plan never read the old ?plan= param (the user picks the plan
    // there anyway) — send a real redirect back to this tab instead.
    router.push(`/garage-plan?redirect=${encodeURIComponent("/dashboard/garage?tab=subscription")}`);
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
                <>Du nutzt aktuell <span className="font-semibold">{entitlementLabel}</span>.</>
              ) : currentPlanId ? (
                <>Du nutzt aktuell das Paket <span className="font-semibold capitalize">{currentPlanDetails?.name || currentPlanId}</span>.</>
              ) : (
                "Du hast noch kein Paket gewählt."
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
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* What the plan actually buys, so "Plan ändern" has context. */}
              <div className="grid grid-cols-3 gap-3 flex-1">
                <div>
                  <div className="text-sm font-semibold text-neutral-900">
                    {garage?.listing_limit ?? currentPlanDetails?.listingLimit ?? 0}
                  </div>
                  <div className="text-xs text-neutral-600 mt-0.5">aktive Inserate</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-neutral-900">
                    {currentPlanDetails?.premiumPerMonth ?? "–"}
                  </div>
                  <div className="text-xs text-neutral-600 mt-0.5">Premium / Monat</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-neutral-900">
                    {currentPlanDetails?.valuationsPerMonth ?? "–"}
                  </div>
                  <div className="text-xs text-neutral-600 mt-0.5">Bewertungen / Monat</div>
                </div>
              </div>

              <Button
                variant="outline"
                className="rounded-xl shrink-0"
                onClick={() => document.getElementById('available-plans')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Plan ändern
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-amber-50 border border-amber-200/60 p-6 text-center">
            <h4 className="font-semibold text-amber-900 mb-2">Jetzt loslegen</h4>
            <p className="text-sm text-amber-800/80 mb-4 max-w-md mx-auto">
              Wähle ein Paket, um Inserate zu schalten und deine Garage professionell zu präsentieren.
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

      {/* Available Plans Section — same cards as /preise and /garage-plan. */}
      <div id="available-plans" className="scroll-mt-24 space-y-6">
        <h3 className="text-xl font-bold tracking-tight text-neutral-900">Verfügbare Pakete</h3>

        <GaragePlanCards
          onSelect={handleUpgrade}
          activeCode={(currentPlanDetails?.code as GaragePlanCode | undefined) ?? null}
        />

        <GarageTrustRow />

        <GarageFeatureMatrix />
      </div>

      {/* Enterprise / Contact Section */}
      <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-8 text-center sm:text-left sm:flex sm:items-center sm:justify-between gap-6">
        <div>
          <h4 className="text-lg font-bold text-neutral-900">Grösseres Inventar?</h4>
          <p className="text-sm text-neutral-600 mt-1 max-w-xl">
            Für Garagen mit mehr als {GARAGE_CUSTOM_THRESHOLD} Fahrzeugen oder mehreren
            Standorten machen wir ein individuelles Angebot.
          </p>
        </div>
        <Button
          variant="outline"
          className="mt-4 sm:mt-0 rounded-xl px-6 h-11 border-neutral-300 hover:bg-white"
          onClick={() => { window.location.href = "mailto:hello@buyauto.ch"; }}
        >
          Kontakt aufnehmen
        </Button>
      </div>
    </div>
  );
}
