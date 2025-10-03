import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, ExternalLink } from 'lucide-react';
import { pricingPlans, PREMIUM_BOOST_PRICE } from '@/lib/buyauto/stripe_config';
import type { Plan } from '@/lib/buyauto/stripe_config';
import { useHasMounted } from '@/hooks/use-has-mounted';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

// A simple confetti hook placeholder.
const useConfetti = () => {
    const hasMounted = useHasMounted();
    return {
        launch: () => {
            if (hasMounted && window.confetti) {
                window.confetti({
                    particleCount: 150,
                    spread: 90,
                    origin: { y: 0.6 }
                });
            }
        }
    }
};

declare global {
    interface Window {
        confetti?: (options: any) => void;
    }
}

interface CompletedListingData {
  id: string;
  price_plan: Plan;
  premium: boolean;
  price_paid_chf: number;
}

export default function SuccessScreen() {
  const router = useRouter();
  const hasMounted = useHasMounted();
  const confetti = useConfetti();
  const [listingData, setListingData] = useState<CompletedListingData | null>(null);

  // Load listing data from sessionStorage on mount
  useEffect(() => {
    if (hasMounted && typeof window !== 'undefined') {
      const storedData = sessionStorage.getItem('completedListingData');
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData);
          setListingData(parsed);
          confetti.launch();
        } catch (error) {
          console.error('Failed to parse listing data:', error);
        }
      }
    }
  }, [hasMounted, confetti]);

  const handleCreateNew = () => {
    // Clear the stored data before navigating to create a new listing
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('completedListingData');
    }
    router.push('/inserat-erstellen');
  };

  if (!hasMounted) {
    return null; // or a loading skeleton
  }

  if (!listingData) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12 px-4">
        <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.5.1/dist/confetti.browser.min.js" async></script>
        <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
          Vielen Dank!
        </h1>
        <p className="mt-4 text-lg text-neutral-600">
          Ihr Inserat wurde zur Überprüfung eingereicht. Sie werden benachrichtigt, sobald es veröffentlicht wird. Dies dauert in der Regel 2-4 Stunden.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
          <Button 
            className="w-full sm:w-auto bg-red-500 hover:bg-red-600"
            onClick={() => router.push('/dashboard')}
          >
            Zum Dashboard
          </Button>
          <Button 
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={handleCreateNew}
          >
            Neues Inserat erstellen
          </Button>
        </div>
      </div>
    );
  }

  const { id: listingId, price_plan: selectedPlan, premium: isPremium, price_paid_chf: finalPrice } = listingData;

  // Get the base plan price
  const basePlanPrice = selectedPlan && pricingPlans[selectedPlan] ? pricingPlans[selectedPlan].price : 0;

  return (
    <div className="max-w-2xl mx-auto text-center py-12 px-4">
      {/* This script is needed for the confetti effect */}
      <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.5.1/dist/confetti.browser.min.js" async></script>
      
      <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
        Ihr Inserat ist online!
      </h1>
      <p className="mt-4 text-lg text-neutral-600">
        Herzlichen Glückwunsch! Ihr Fahrzeug ist nun auf unserer Plattform sichtbar.
      </p>

      {listingId && (
        <Card className="mt-8 text-left">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-neutral-800 mb-4">Zusammenfassung</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-neutral-600">Inserat ID:</span>
                <span className="font-mono text-sm bg-neutral-100 px-2 py-1 rounded">{listingId}</span>
              </div>
              
              {selectedPlan && pricingPlans[selectedPlan] && (
                 <div className="flex justify-between items-center">
                    <span className="text-neutral-600">Gewählter Plan:</span>
                    <span className="font-semibold">{pricingPlans[selectedPlan].name}</span>
                </div>
              )}
            </div>

            <hr className="border-t border-neutral-200 my-4" />

            {/* Price Breakdown */}
            <div className="space-y-2 mb-4">
              <h4 className="text-sm font-semibold text-neutral-700 mb-2">Preisübersicht</h4>
              
              {/* Base Plan Price */}
              {selectedPlan && pricingPlans[selectedPlan] && (
                <div className="flex justify-between items-center text-neutral-700">
                  <span>{pricingPlans[selectedPlan].name}</span>
                  <span>CHF {basePlanPrice.toFixed(2)}</span>
                </div>
              )}
              
              {/* Premium Placement Add-on */}
              {isPremium && (
                <div className="flex justify-between items-center text-neutral-700">
                  <span>Premium Platzierung Aktiv (CHF 30)</span>
                  <span>+ CHF {PREMIUM_BOOST_PRICE.toFixed(2)}</span>
                </div>
              )}

              <hr className="border-t border-neutral-200 my-2" />

              {/* Total Amount */}
              <div className="flex justify-between items-center text-xl font-bold">
                <span className="text-neutral-800">Gesamtbetrag bezahlt:</span>
                <span className="text-red-600">CHF {finalPrice.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="mt-6 space-y-3">
              <Button
                onClick={() => {
                  // Navigate to dashboard listings section to see the new listing
                  if (typeof window !== 'undefined') {
                    // Also clear storage so we don't see this success page again
                    sessionStorage.removeItem('completedListingData');
                    window.location.href = `/dashboard?section=listings`;
                  }
                }}
                className="w-full bg-neutral-900 hover:bg-neutral-800"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Inserat ansehen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
        <Button 
          className="w-full sm:w-auto bg-red-500 hover:bg-red-600"
          onClick={() => {
            // Clear sessionStorage before navigating
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem('completedListingData');
              // Force a full page reload to refresh dashboard state
              window.location.href = '/dashboard';
            }
          }}
        >
          Zum Dashboard
        </Button>
        <Button 
          variant="secondary"
          className="w-full sm:w-auto"
          onClick={handleCreateNew}
        >
          Neues Inserat erstellen
        </Button>
      </div>
    </div>
  );
}
