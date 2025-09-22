import { useState, useEffect } from 'react';
import { useWizard } from './ListingWizard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { CheckoutForm } from './CheckoutForm';
import { pricingPlans, PREMIUM_BOOST_PRICE, calculateTotal, Plan } from '@/lib/buyauto/stripe_config';
import { CheckIcon } from 'lucide-react';

// More robust Stripe key loading with client-side safety checks
const getStripePublishableKey = () => {
  // Only access process.env on the client side after component mounts
  if (typeof window === 'undefined') return null;
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
};

let stripePromise: Promise<any> | null = null;

const getStripePromise = () => {
  if (!stripePromise) {
    const key = getStripePublishableKey();
    if (key) {
      stripePromise = loadStripe(key);
    } else {
      console.error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not defined');
      stripePromise = Promise.resolve(null);
    }
  }
  return stripePromise;
};

export default function Step3_PlanSelection() {
  const { data, updateData, nextStep, prevStep } = useWizard();
  const { toast } = useToast();

  // Fix: Handle potential undefined premium property safely
  const [selectedPlan, setSelectedPlan] = useState<Plan>((data.price_plan as Plan) || 'standard');
  const [isPremium, setIsPremium] = useState<boolean>(Boolean(data.premium) || false);
  const [total, setTotal] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // Handle redirect back from Stripe
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get('payment_confirmed')) {
      const paymentIntentClientSecret = query.get('payment_intent_client_secret');
      if (paymentIntentClientSecret) {
        getStripePromise().then(stripe => {
          if (!stripe) return;
          stripe.retrievePaymentIntent(paymentIntentClientSecret).then(({ paymentIntent }) => {
            switch (paymentIntent?.status) {
              case 'succeeded':
                toast({ title: "Payment successful!", description: "Your listing is being processed." });
                updateData({ payment_status: 'paid' });
                nextStep();
                break;
              case 'processing':
                toast({ title: "Payment processing.", description: "We'll update you when payment is received." });
                break;
              case 'requires_payment_method':
                toast({ title: "Payment failed.", description: "Please try another payment method.", variant: 'destructive' });
                setClientSecret(paymentIntentClientSecret); // Allow user to retry
                break;
              default:
                toast({ title: "Something went wrong.", description: "Please try again.", variant: 'destructive' });
                break;
            }
          });
        });
      }
    }
  }, [toast, nextStep, updateData]);

  useEffect(() => {
    const newTotal = calculateTotal(selectedPlan, isPremium);
    setTotal(newTotal);
  }, [selectedPlan, isPremium]);

  const handlePreparePayment = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/billing/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: data.id, plan: selectedPlan, premium: isPremium }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to prepare payment.');
      }

      updateData({
        price_plan: selectedPlan,
        premium: isPremium,
        price_paid_chf: total,
      });

      if (result.next === 'continue') {
        toast({ title: 'Plan selected', description: 'Your free listing is ready for the next step.' });
        nextStep();
      } else {
        setClientSecret(result.clientSecret);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
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
    standard: ["60 Tage Laufzeit", "Standard-Platzierung"],
    extended: ["90 Tage Laufzeit", "Standard-Platzierung"],
    unlimited: ["Unlimitierte Laufzeit", "Standard-Platzierung", "Jederzeit pausierbar"],
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-light text-neutral-900 mb-2 tracking-tight">Inserat-Plan auswählen</h2>
        <p className="text-neutral-600 font-light leading-relaxed">Wählen Sie den passenden Plan für Ihr Inserat.</p>
      </div>

      {!clientSecret ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(Object.keys(pricingPlans) as Plan[]).map((planKey) => (
              <Card
                key={planKey}
                className={cn(
                  'cursor-pointer transition-all',
                  selectedPlan === planKey ? 'border-red-500 ring-2 ring-red-500' : 'hover:border-neutral-400'
                )}
                onClick={() => setSelectedPlan(planKey)}
              >
                <CardHeader>
                  <CardTitle>{pricingPlans[planKey].name}</CardTitle>
                  <CardDescription className="text-2xl font-bold">CHF {pricingPlans[planKey].price}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-neutral-600">
                    {planFeatures[planKey].map(feature => (
                        <li key={feature} className="flex items-center">
                            <CheckIcon className="mr-2 h-4 w-4 text-green-500"/>
                            {feature}
                        </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="premium-boost" className="font-bold text-lg">Premium Boost</Label>
                <p className="text-neutral-600">Ihr Inserat wird für 30 Tage hervorgehoben.</p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="font-bold text-lg">+ CHF {PREMIUM_BOOST_PRICE}</span>
                <Switch id="premium-boost" checked={isPremium} onCheckedChange={setIsPremium} />
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
          </Card>
        </>
      ) : (
        <div className="max-w-md mx-auto">
            <h3 className="text-xl font-semibold mb-4 text-center">Sichere Zahlung</h3>
            <Elements options={{ clientSecret, appearance: { theme: 'stripe' } }} stripe={getStripePromise()}>
              <CheckoutForm onSuccess={nextStep} totalAmount={total} />
            </Elements>
        </div>
      )}

      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={prevStep} disabled={isLoading}>
          Zurück
        </Button>
        {!clientSecret && (
          <Button onClick={handlePreparePayment} disabled={isLoading} className="bg-red-500 hover:bg-red-600">
            {isLoading ? "Wird geladen..." : total === 0 ? "Weiter" : `Weiter zur Bezahlung (CHF ${total})`}
          </Button>
        )}
      </div>
    </div>
  );
}
