import Link from 'next/link';
import { useWizard } from './ListingWizard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, ExternalLink } from 'lucide-react';
import { pricingPlans, PREMIUM_BOOST_PRICE } from '@/lib/buyauto/stripe_config';
import type { Plan } from '@/lib/buyauto/stripe_config';
import { useHasMounted } from '@/hooks/use-has-mounted';
import { useEffect } from 'react';
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

export default function SuccessScreen() {
  const { data } = useWizard();
  const router = useRouter();
  const hasMounted = useHasMounted();
  const confetti = useConfetti();

  // Use the correct, final price from the wizard data.
  const finalPrice = data.price_paid_chf ?? 0;

  useEffect(() => {
    if (hasMounted) {
        confetti.launch();
    }
  }, [hasMounted, confetti]);

  const listingId = data.id;
  const selectedPlan = data.price_plan as Plan;
  const isPremium = data.premium;

  // Get the base plan price
  const basePlanPrice = selectedPlan && pricingPlans[selectedPlan] ? pricingPlans[selectedPlan].price : 0;

  const handleCreateNew = () => {
    router.push('/inserat-erstellen');
  };

  if (!hasMounted) {
    return null; // or a loading skeleton
  }

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
            
            <div className="mt-6">
              <Link href={`/fahrzeug/${listingId}`} passHref legacyBehavior>
                <a target="_blank" rel="noopener noreferrer" className="w-full">
                  <Button variant="outline" className="w-full">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Inserat ansehen
                  </Button>
                </a>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
        <Link href="/dashboard" passHref>
          <Button className="w-full sm:w-auto bg-red-500 hover:bg-red-600">
            Zum Dashboard
          </Button>
        </Link>
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
