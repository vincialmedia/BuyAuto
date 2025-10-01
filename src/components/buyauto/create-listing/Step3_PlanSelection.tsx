import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useWizard } from './ListingWizard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { pricingPlans, PREMIUM_BOOST_PRICE, calculateTotal, Plan } from '@/lib/buyauto/stripe_config';
import { CheckIcon } from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext";
import { createOrUpdateListing, getListingByIdForOwner } from "@/services/createListingService";
import type { PricePlanId } from "@/lib/buyauto/types";

// Get plans from stripe config for the mapping
const planMapping: Record<Plan, PricePlanId> = {
  'standard': 'standard',
  'extended': 'extended', 
  'unlimited': 'unlimited'
};

// Client-only PaymentWidget to prevent SSR issues
const PaymentWidget = dynamic(
  () => import('./PaymentWidget'),
  { 
    ssr: false,
    loading: () => (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        <p className="mt-2 text-neutral-600">Loading payment form...</p>
      </div>
    )
  }
);

export default function Step3_PlanSelection() {
  const { data, updateData, nextStep, prevStep } = useWizard();
  const { toast } = useToast();
  const { user } = useAuth();

  // State management with proper initialization
  const [selectedPlan, setSelectedPlan] = useState<Plan>((data.price_plan as Plan) || 'standard');
  const [isPremium, setIsPremium] = useState<boolean>(Boolean(data.premium) || false);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted (client-side) before doing anything Stripe-related
  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate total whenever plan or premium changes
  useEffect(() => {
    const newTotal = calculateTotal(selectedPlan, isPremium);
    setTotal(newTotal);
  }, [selectedPlan, isPremium]);

  const handlePaymentConfirmation = useCallback(async (paymentIntentClientSecret: string) => {
    // Clean up URL without triggering navigation
    const url = new URL(window.location.href);
    url.searchParams.delete('payment_confirmed');
    url.searchParams.delete('payment_intent_client_secret');
    window.history.replaceState({}, '', url.toString());

    // Check for publishable key first
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      console.error('❌ Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY - cannot verify payment');
      toast({ 
        title: "Configuration Error", 
        description: "Payment verification unavailable. Please contact support.", 
        variant: 'destructive' 
      });
      return;
    }

    // Additional browser-only check
    if (typeof window === 'undefined') {
      console.error('❌ Attempting to access Stripe during SSR');
      return;
    }

    try {
      // Use the new getStripe function from unified stripe loader
      const { getStripe } = await import('@/lib/stripe');
      const stripe = await getStripe();
      
      if (!stripe) {
        console.error('❌ Failed to initialize Stripe - likely missing environment variable');
        toast({ 
          title: "Configuration Error", 
          description: "Payment system unavailable. Please contact support.", 
          variant: 'destructive' 
        });
        return;
      }

      const { paymentIntent } = await stripe.retrievePaymentIntent(paymentIntentClientSecret);
      
      switch (paymentIntent?.status) {
        case 'succeeded':
          toast({ title: "Payment successful!", description: "Your listing is being processed." });
          
          const listingId = paymentIntent.metadata.listing_id;
          if (listingId && user) {
            const freshListingData = await getListingByIdForOwner(listingId, user);
            if (freshListingData) {
              console.log('✅ Re-hydrating wizard with fresh data from DB:', freshListingData);
              updateData(freshListingData);
              nextStep();
            } else {
              console.error(`❌ Could not re-fetch listing data for ID: ${listingId}. Proceeding with stale data.`);
              updateData({ payment_status: 'paid' });
              nextStep();
            }
          } else {
            console.error('❌ Missing listing_id in payment intent metadata or no user. Proceeding with stale data.');
            updateData({ payment_status: 'paid' });
            nextStep();
          }
          break;
        case 'processing':
          toast({ title: "Payment processing.", description: "We'll update you when payment is received." });
          break;
        case 'requires_payment_method':
          toast({ title: "Payment failed.", description: "Please try another payment method.", variant: 'destructive' });
          setClientSecret(paymentIntentClientSecret);
          break;
        default:
          toast({ title: "Something went wrong.", description: "Please try again.", variant: 'destructive' });
          break;
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast({ 
        title: "Error", 
        description: "Could not verify payment status.", 
        variant: 'destructive' 
      });
    }
  }, [user, toast, updateData, nextStep]);

  // Handle redirect back from Stripe (only run client-side)
  useEffect(() => {
    if (!mounted) return;

    const query = new URLSearchParams(window.location.search);
    if (query.get('payment_confirmed')) {
      const paymentIntentClientSecret = query.get('payment_intent_client_secret');
      if (paymentIntentClientSecret) {
        handlePaymentConfirmation(paymentIntentClientSecret);
      }
    }
  }, [mounted, handlePaymentConfirmation]);

  const handlePreparePayment = async () => {
    if (!mounted || !user) {
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
      // ✅ CORRECT: Save the plan and premium status to DB before preparing payment
      const mappedPlan = planMapping[selectedPlan];
      await createOrUpdateListing({ id: data.id, price_plan: mappedPlan, premium: isPremium }, user);
      
      toast({
        title: "Plan gespeichert",
        description: `Der Plan '${selectedPlan}' wurde für Ihr Inserat gespeichert.`,
      });

      console.log('🚀 Preparing payment with data:', { 
        listing_id: data.id, 
        plan: selectedPlan, 
        premium: isPremium 
      });

      // If total is 0, just proceed to the next step without hitting the payment API
      if (total === 0) {
        updateData({ price_plan: selectedPlan, premium: isPremium, price_paid_chf: 0, payment_status: 'paid' });
        toast({ title: 'Plan ausgewählt', description: 'Ihr kostenloses Inserat ist bereit für den nächsten Schritt.' });
        nextStep();
        return;
      }

      // If there is a total, prepare the payment with Stripe
      const response = await fetch('/api/billing/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          listing_id: data.id, 
          plan: selectedPlan, 
          premium: isPremium 
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('❌ API Error Response:', { status: response.status, result });
        throw new Error(result.error || 'Failed to prepare payment.');
      }

      console.log('✅ Payment preparation successful:', result);

      updateData({
        price_plan: selectedPlan,
        premium: isPremium,
        price_paid_chf: total,
      });

      // Paid flow - show payment form
      setClientSecret(result.clientSecret);

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      console.error('❌ Payment preparation failed:', error);
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

  const handlePaymentSuccess = () => {
    toast({ 
      title: "Payment successful!", 
      description: "Your listing is being processed." 
    });
    nextStep();
  };

  // Don't render anything until mounted to prevent hydration mismatches
  if (!mounted) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-light text-neutral-900 mb-2 tracking-tight">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-light text-neutral-900 mb-2 tracking-tight">Inserat-Plan auswählen</h2>
        <p className="text-neutral-600 font-light leading-relaxed">Wählen Sie den passenden Plan für Ihr Inserat.</p>
      </div>

      {!clientSecret ? (
        <>
          {/* Plan Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(Object.keys(pricingPlans) as Plan[]).map((planKey) => (
              <Card
                key={planKey}
                className={cn(
                  'cursor-pointer transition-all',
                  selectedPlan === planKey ? 'border-red-500 ring-2 ring-red-500' : 'hover:border-neutral-400'
                )}
                onClick={() => setSelectedPlan(planKey)} // ✅ CORRECT: Only update state on click
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
            ))}
          </div>

          {/* Premium Boost Toggle */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="premium-boost" className="font-bold text-lg">Premium Boost</Label>
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

          {/* Order Summary */}
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
        // Payment Form (Client-Only)
        <PaymentWidget 
          clientSecret={clientSecret}
          totalAmount={total}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6">
        <Button 
          variant="outline" 
          onClick={prevStep} 
          disabled={isLoading}
        >
          Zurück
        </Button>
        
        {!clientSecret && (
          <Button 
            onClick={handlePreparePayment} 
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
              total === 0 ? "Weiter" : `Weiter zur Bezahlung (CHF ${total})`
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
