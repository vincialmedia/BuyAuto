import { useState, useEffect } from 'react';
import { useWizard } from './ListingWizard';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { pricingPlans, PREMIUM_BOOST_PRICE, calculateTotal, Plan } from '@/lib/buyauto/stripe_config';
import { CheckIcon } from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext";
import { createOrUpdateListing } from "@/services/createListingService";
import type { PricePlanId } from "@/lib/buyauto/types";

const planMapping: Record<Plan, PricePlanId> = {
  'standard': 'standard',
  'extended': 'extended', 
  'unlimited': 'unlimited'
};

export default function Step3_PlanSelection() {
  const { data, updateData, nextStep, prevStep } = useWizard();
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const isGarage = profile?.role === "garage";

  const [selectedPlan, setSelectedPlan] = useState<Plan>((data.price_plan as Plan) || 'standard');
  const [isPremium, setIsPremium] = useState<boolean>(Boolean(data.premium) || false);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const newTotal = calculateTotal(selectedPlan, isPremium);
    setTotal(newTotal);
  }, [selectedPlan, isPremium]);

  useEffect(() => {
    if (isGarage) {
      nextStep();
    }
  }, [isGarage, nextStep]);

  const handlePlanSelection = async () => {
    if (!user) {
      toast({
        title: 'Fehler',
        description: 'Sie müssen angemeldet sein, um fortzufahren.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!data.id) {
      console.error('❌ No listing ID found in wizard data:', data);
      toast({
        title: 'Fehler',
        description: 'Listing-ID nicht gefunden. Bitte gehen Sie zurück zum ersten Schritt und versuchen Sie es erneut.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);

    try {
      const mappedPlan = planMapping[selectedPlan];
      
      await createOrUpdateListing({ 
        id: data.id, 
        price_plan: mappedPlan, 
        premium: isPremium 
      }, user);
      
      updateData({
        price_plan: selectedPlan,
        premium: isPremium,
        price_paid_chf: total,
      });

      toast({
        title: "Plan gespeichert",
        description: `Der Plan '${selectedPlan}' wurde für Ihr Inserat gespeichert.`,
      });

      nextStep();

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      console.error('❌ Plan selection failed:', error);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const planFeatures = {
    standard: ["30 Tage Laufzeit", "Standard-Platzierung"],
    extended: ["90 Tage Laufzeit", "Standard-Platzierung"],
    unlimited: ["Unlimitierte Laufzeit", "Standard-Platzierung", "Jederzeit pausierbar"],
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-light text-neutral-900 mb-2 tracking-tight">Inserat-Plan auswählen</h2>
        <p className="text-neutral-600 font-light leading-relaxed">Wählen Sie den passenden Plan für Ihr Inserat.</p>
      </div>

      {!data.id && (
        <Alert variant="destructive">
          <AlertTitle>Weiter zu Fotos ist blockiert</AlertTitle>
          <AlertDescription>
            Die Inserat-ID fehlt. Das bedeutet, dass der vorherige Schritt (Finanzierungsdetails) nicht gespeichert werden konnte.
            Bitte gehe zurück, prüfe die Pflichtfelder und speichere erneut. Falls danach wieder ein Fehler erscheint, kopiere bitte den
            exakten Fehlertext aus der Meldung und sende ihn hier.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(Object.keys(pricingPlans) as Plan[]).map((planKey) => {
          const isExtended = planKey === 'extended';
          
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
                  'cursor-pointer transition-all h-full',
                  selectedPlan === planKey ? 'border-red-500 ring-2 ring-red-500' : 'hover:border-neutral-400',
                  isExtended && 'border-red-200'
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
                        <CheckIcon className="mr-2 h-4 w-4 text-green-500"/>
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

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Label htmlFor="premium-boost" className="font-bold text-lg">Premium Boost</Label>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                Bis zu 3x höhere Verkaufschancen
              </span>
            </div>
            <p className="text-neutral-600">Ihr Inserat wird für 30 Tage hervorgehoben.</p>
          </div>
          <div className="flex items-center space-x-4">
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

      <Card className="p-6 bg-neutral-50">
        <h3 className="text-lg font-bold mb-4">Zusammenfassung</h3>
        <div className="space-y-2">
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
          <hr className="my-2"/>
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
        <Button 
          variant="outline" 
          onClick={prevStep} 
          disabled={isLoading}
        >
          Zurück
        </Button>
        
        <Button 
          onClick={handlePlanSelection} 
          disabled={isLoading || !data.id} 
          className="bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Wird geladen...
            </>
          ) : !data.id ? (
            "Listing-ID fehlt - Bitte zurück zum ersten Schritt"
          ) : (
            "Weiter zu den Bildern"
          )}
        </Button>
      </div>
    </div>
  );
}