import { useEffect, useMemo, useState } from "react";
import { useWizard } from "./ListingWizard";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { pricingPlans, PREMIUM_BOOST_PRICE, calculateTotal, type Plan } from "@/lib/buyauto/stripe_config";
import { Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { createOrUpdateListing } from "@/services/createListingService";
import type { PricePlanId } from "@/lib/buyauto/types";

const planMapping: Record<Plan, PricePlanId> = {
  standard: "standard",
  extended: "extended",
  unlimited: "unlimited",
};

function clampDonationAmount(raw: unknown): number {
  const n = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
  const normalized = Number.isFinite(n) ? Math.round(n) : 5;
  return Math.min(200, Math.max(1, normalized));
}

export default function Step3_PlanSelection() {
  const { data, updateData, nextStep, prevStep, registerDraftSnapshotter } = useWizard();
  const { toast } = useToast();
  const { user } = useAuth();

  const [selectedPlan, setSelectedPlan] = useState<Plan>(((data as any).price_plan as Plan) || "standard");
  const [isPremium, setIsPremium] = useState<boolean>(Boolean((data as any).premium) || false);

  const initialDonationEnabled = Boolean((data as any)?.donation_enabled);
  const initialDonationAmount = clampDonationAmount((data as any)?.donation_amount_chf ?? 5);

  const [donationEnabled, setDonationEnabled] = useState<boolean>(initialDonationEnabled);
  const [donationAmountChf, setDonationAmountChf] = useState<number>(initialDonationAmount);

  const [isLoading, setIsLoading] = useState(false);

  const donationAmountEffective = useMemo(() => {
    if (!donationEnabled) return 0;
    return clampDonationAmount(donationAmountChf);
  }, [donationAmountChf, donationEnabled]);

  const total = useMemo(() => {
    const base = calculateTotal(selectedPlan, isPremium);
    return base + donationAmountEffective;
  }, [donationAmountEffective, isPremium, selectedPlan]);

  useEffect(() => {
    registerDraftSnapshotter(() => ({
      price_plan: selectedPlan,
      premium: isPremium,
      donation_enabled: donationEnabled,
      donation_amount_chf: donationAmountEffective > 0 ? donationAmountEffective : 0,
      price_paid_chf: total,
    }) as any);

    return () => {
      registerDraftSnapshotter(() => ({}));
    };
  }, [donationAmountEffective, donationEnabled, isPremium, registerDraftSnapshotter, selectedPlan, total]);

  const planFeatures: Record<Plan, string[]> = {
    standard: ["30 Tage Laufzeit", "Standard-Platzierung"],
    extended: ["90 Tage Laufzeit", "Standard-Platzierung"],
    unlimited: ["Unlimitierte Laufzeit", "Standard-Platzierung", "Jederzeit pausierbar"],
  };

  const handlePlanSelection = async () => {
    if (!user) {
      // Deferred login: keep the plan choice in wizard state — the listing row
      // is created after sign-in at Step 5.
      updateData({
        price_plan: selectedPlan,
        premium: isPremium,
        donation_enabled: donationEnabled,
        donation_amount_chf: donationAmountEffective > 0 ? donationAmountEffective : 0,
        price_paid_chf: total,
      } as any);
      nextStep();
      return;
    }

    if (!(data as any).id) {
      toast({
        title: "Fehler",
        description:
          "Listing-ID nicht gefunden. Bitte gehe zurück zum ersten Schritt und versuche es erneut.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const mappedPlan = planMapping[selectedPlan];

      await createOrUpdateListing(
        {
          id: (data as any).id,
          price_plan: mappedPlan,
          premium: isPremium,
        },
        user
      );

      updateData({
        price_plan: selectedPlan,
        premium: isPremium,
        donation_enabled: donationEnabled,
        donation_amount_chf: donationAmountEffective > 0 ? donationAmountEffective : 0,
        price_paid_chf: total,
      } as any);

      toast({
        title: "Plan gespeichert",
        description: "Deine Auswahl wurde gespeichert.",
      });

      nextStep();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Ein unerwarteter Fehler ist aufgetreten";
      toast({
        title: "Fehler",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const presets = [5, 10, 20];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-light text-neutral-900 mb-2 tracking-tight">Inserat-Plan auswählen</h2>
        <p className="text-neutral-600 font-light leading-relaxed">Wähle den passenden Plan für dein Inserat.</p>
      </div>

      {/* Guests have no listing row by design (deferred login — the row is
          created after sign-in at Step 5), so the missing-id warning is a
          logged-in-only signal. */}
      {Boolean(user) && !(data as any).id && (
        <Alert variant="destructive">
          <AlertTitle>Weiter zu Fotos ist blockiert</AlertTitle>
          <AlertDescription>
            Die Inserat-ID fehlt. Das bedeutet, dass der vorherige Schritt nicht gespeichert werden konnte.
            Bitte gehe zurück, prüfe die Pflichtfelder und speichere erneut. Falls danach wieder ein Fehler erscheint,
            kopiere bitte den exakten Fehlertext aus der Meldung und sende ihn hier.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(Object.keys(pricingPlans) as Plan[]).map((planKey) => {
          const isExtended = planKey === "extended";

          return (
            <div key={planKey} className="relative">
              {isExtended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                    Beliebt
                  </span>
                </div>
              )}
              <Card
                className={cn(
                  "cursor-pointer transition-all h-full rounded-3xl",
                  selectedPlan === planKey ? "border-red-500 ring-2 ring-red-500" : "hover:border-neutral-400",
                  isExtended && "border-red-200"
                )}
                onClick={() => setSelectedPlan(planKey)}
              >
                <CardHeader>
                  <CardTitle>{pricingPlans[planKey].name}</CardTitle>
                  <CardDescription className="text-2xl font-bold">CHF {pricingPlans[planKey].price}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-neutral-600">
                    {planFeatures[planKey].map((feature) => (
                      <li key={feature} className="flex items-center">
                        <Check className="mr-2 h-4 w-4 text-green-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      <Card className="p-6 rounded-3xl">
        <div className="flex items-center justify-between gap-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Label htmlFor="premium-boost" className="font-bold text-lg">
                Premium Boost
              </Label>
              <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200/60">
                Bis zu 3x höhere Verkaufschancen
              </span>
            </div>
            <p className="text-neutral-600">Dein Inserat wird für 30 Tage hervorgehoben.</p>
          </div>
          <div className="flex items-center space-x-4 shrink-0">
            <span className="font-bold text-lg">+ CHF {PREMIUM_BOOST_PRICE}</span>
            <Switch
              id="premium-boost"
              checked={isPremium}
              onCheckedChange={setIsPremium}
              disabled={isLoading}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6 rounded-3xl bg-neutral-50/60 border border-neutral-200/60">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Label htmlFor="donation-toggle" className="font-semibold text-neutral-900">
                BuyAuto unterstützen
              </Label>
              <span className="text-xs text-neutral-600 bg-white/70 border border-neutral-200/60 px-2 py-0.5 rounded-full">
                optional
              </span>
            </div>
            <p className="mt-2 text-sm text-neutral-600 leading-relaxed max-w-[62ch]">
              BuyAuto ist komplett selbstfinanziert und von einem Ein-Mann-Team gebaut. Wenn du magst,
              hilf uns mit einer kleinen Spende, damit wir weiter verbessern können.
            </p>
          </div>

          <div className="shrink-0 w-full sm:w-auto">
            <div className="flex items-center justify-between sm:justify-end gap-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-neutral-700">Spende</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-600">CHF</span>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={200}
                    step={1}
                    value={donationEnabled ? donationAmountChf : 5}
                    onChange={(e) => setDonationAmountChf(clampDonationAmount(e.target.value))}
                    disabled={!donationEnabled || isLoading}
                    className="w-24 rounded-2xl"
                  />
                </div>
              </div>

              <Switch
                id="donation-toggle"
                checked={donationEnabled}
                onCheckedChange={(next) => {
                  setDonationEnabled(next);
                  if (next) {
                    setDonationAmountChf((prev) => clampDonationAmount(prev ?? 5));
                  }
                }}
                disabled={isLoading}
              />
            </div>

            <div className="mt-3 flex items-center justify-between sm:justify-end gap-2">
              <div className="flex gap-2">
                {presets.map((p) => (
                  <Button
                    key={p}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDonationEnabled(true);
                      setDonationAmountChf(p);
                    }}
                    disabled={isLoading}
                    className={cn(
                      "rounded-2xl h-8 px-3 border-neutral-200 bg-white/70 hover:bg-white",
                      donationEnabled && donationAmountChf === p ? "border-neutral-900 text-neutral-900" : "text-neutral-700"
                    )}
                  >
                    CHF {p}
                  </Button>
                ))}
              </div>

              <div className="text-xs text-neutral-500">
                {donationEnabled ? `+ CHF ${donationAmountEffective}` : "Aus"}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-neutral-50 rounded-3xl">
        <h3 className="text-lg font-bold mb-4">Zusammenfassung</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Plan: {pricingPlans[selectedPlan].name}</span>
            <span>CHF {pricingPlans[selectedPlan].price}</span>
          </div>
          {isPremium && (
            <div className="flex justify-between">
              <span>Premium Boost</span>
              <span>CHF {PREMIUM_BOOST_PRICE}</span>
            </div>
          )}
          {donationEnabled && donationAmountEffective > 0 && (
            <div className="flex justify-between">
              <span>Unterstützung</span>
              <span>CHF {donationAmountEffective}</span>
            </div>
          )}
          <hr className="my-2" />
          <div className="flex justify-between font-bold text-xl">
            <span>Total</span>
            <span>CHF {total}</span>
          </div>
        </div>
        <p className="text-sm text-neutral-500 mt-4">
          Die Bezahlung erfolgt im letzten Schritt nach der Vorschau.
        </p>
      </Card>

      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={prevStep} disabled={isLoading} className="rounded-2xl">
          Zurück
        </Button>

        <Button
          onClick={handlePlanSelection}
          disabled={isLoading || (Boolean(user) && !(data as any).id)}
          className="bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl"
        >
          {isLoading ? (
            <>
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Wird geladen...
            </>
          ) : user && !(data as any).id ? (
            "Listing-ID fehlt – bitte zurück"
          ) : (
            "Weiter zu den Bildern"
          )}
        </Button>
      </div>
    </div>
  );
}