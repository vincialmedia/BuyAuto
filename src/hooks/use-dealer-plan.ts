import { useEffect, useState } from "react";
import { getDealerEntitlement } from "@/services/dealerEntitlementService";
import { garagePlanFor, type GaragePlan } from "@/lib/buyauto/garagePlans";
import type { Garage } from "@/services/garageService";

export interface DealerPlanState {
  /** null while loading, or when the garage has no entitlement at all. */
  plan: GaragePlan | null;
  /** Distinguishes "still loading" from "no plan" so the UI can hold off. */
  resolved: boolean;
}

/**
 * The package a garage is effectively on, resolved through the same entitlement
 * chain as the billing tab (admin override → subscription → legacy garages.plan).
 *
 * Use it to gate plan-specific dashboard surfaces. Falls back to `null`
 * (= no plan) on error rather than guessing an upgrade away.
 */
export function useDealerPlan(garage: Garage | null): DealerPlanState {
  const [state, setState] = useState<DealerPlanState>({ plan: null, resolved: false });

  useEffect(() => {
    let cancelled = false;

    if (!garage?.id) {
      setState({ plan: null, resolved: true });
      return;
    }

    void (async () => {
      try {
        const entitlement = await getDealerEntitlement(garage);
        if (cancelled) return;
        const code = entitlement.kind === "none" ? null : entitlement.planCode;
        setState({ plan: garagePlanFor(code), resolved: true });
      } catch {
        if (!cancelled) setState({ plan: null, resolved: true });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [garage?.id]);

  return state;
}
