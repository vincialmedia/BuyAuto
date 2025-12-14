import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useWizard } from './ListingWizard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Check, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { pricingPlans, PREMIUM_BOOST_PRICE } from '@/lib/buyauto/stripe_config';
import type { Plan } from '@/lib/buyauto/stripe_config';
import { cantons } from '@/lib/buyauto/data';
import { useToast } from '@/hooks/use-toast';
import { getListingByIdForOwner } from "@/services/createListingService";
import type { PaymentIntent } from '@stripe/stripe-js';
import { supabase } from '@/integrations/supabase/client';

interface PaymentIntentWithMetadata extends PaymentIntent {
  metadata: {
    listing_id: string;
    [key: string]: any;
  };
}

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

const formatPrice = (price: number | undefined) => {
  if (!price) return 'CHF 0';
  return `CHF ${price.toLocaleString('de-CH')}`;
};

const formatMileage = (km: number | undefined) => {
  if (!km) return '0 km';
  return `${km.toLocaleString('de-CH')} km`;
};

const getCantonName = (cantonCode: string | undefined) => {
  if (!cantonCode) return '-';
  const canton = cantons.find(c => c.value === cantonCode);
  return canton ? canton.label : cantonCode;
};

const DUMMY_IMAGE_URL = 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=600&fit=crop';

export default function Step5_PreviewAndPay() {
  const { data, updateData, prevStep, setIsComplete, nextStep } = useWizard();
  const { user, loading: userLoading } = useAuth();
  const { toast } = useToast();

  const [mounted, setMounted] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isPreparingPayment, setIsPreparingPayment] = useState(false);
  const [paymentInitiated, setPaymentInitiated] = useState(false);

  const selectedPlanId = data.price_plan as Plan | undefined;
  const isPremium = data.premium || false;

  const planDetails = selectedPlanId ? pricingPlans[selectedPlanId] : null;
  const planPrice = planDetails ? planDetails.price : 0;
  
  const total = planPrice + (isPremium ? PREMIUM_BOOST_PRICE : 0);

  const mainImage = data.images?.[0] || DUMMY_IMAGE_URL;

  const vehicleDetails = [
    { label: "Baujahr", value: data.year },
    { label: "Kilometer", value: formatMileage(data.km) },
    { label: "Karosserie", value: data.body },
    { label: "Antrieb", value: data.fuel },
    { label: "Restlaufzeit", value: `${data.remaining_months} Monate` },
    { label: "Getriebe", value: data.gearbox },
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePaymentConfirmation = useCallback(async (paymentIntentClientSecret: string) => {
    const url = new URL(window.location.href);
    url.searchParams.delete('payment_confirmed');
    url.searchParams.delete('payment_intent_client_secret');
    window.history.replaceState({}, '', url.toString());

    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      console.error('❌ Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
      toast({ 
        title: "Configuration Error", 
        description: "Payment verification unavailable. Please contact support.", 
        variant: 'destructive' 
      });
      return;
    }

    if (typeof window === 'undefined') {
      console.error('❌ Attempting to access Stripe during SSR');
      return;
    }

    try {
      const { getStripe } = await import('@/lib/stripe');
      const stripe = await getStripe();
      
      if (!stripe) {
        console.error('❌ Failed to initialize Stripe');
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
          
          const listingId = (paymentIntent as PaymentIntentWithMetadata).metadata.listing_id;
          if (listingId && user) {
            const freshListingData = await getListingByIdForOwner(listingId, user);
            if (freshListingData) {
              console.log('✅ Storing completed listing data in sessionStorage:', freshListingData);
              if (typeof window !== 'undefined') {
                const completedData = {
                  id: freshListingData.id,
                  price_plan: freshListingData.price_plan,
                  premium: freshListingData.premium,
                  price_paid_chf: paymentIntent.amount / 100, // Stripe amount is in cents
                };
                sessionStorage.setItem('completedListingData', JSON.stringify(completedData));
              }
              updateData(freshListingData);
            }
          }
          setIsComplete(true);
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
  }, [user, toast, updateData, setIsComplete]);

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
        description: 'Listing-ID nicht gefunden.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsPreparingPayment(true);

    try {
      console.log('🚀 Preparing payment with data:', { 
        listing_id: data.id, 
        plan: selectedPlanId, 
        premium: isPremium 
      });

      if (total === 0) {
        // ✅ FIX: Actually update the database for free listings
        console.log('🆓 Processing free listing - updating database with payment_status=paid');
        
        const { data: updatedListing, error } = await supabase
          .from('listings')
          .update({ payment_status: 'paid', status: 'pending' })
          .eq('id', data.id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) {
          console.error('❌ Error updating free listing:', error);
          throw new Error('Failed to update free listing');
        }

        console.log('✅ Free listing updated in database:', updatedListing);
        updateData({ payment_status: 'paid' });
        toast({ title: 'Plan ausgewählt', description: 'Ihr kostenloses Inserat ist bereit.' });
        setIsComplete(true);
        return;
      }

      const response = await fetch('/api/billing/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          listing_id: data.id, 
          plan: selectedPlanId, 
          premium: isPremium 
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('❌ API Error Response:', { status: response.status, result });
        throw new Error(result.error || 'Failed to prepare payment.');
      }

      console.log('✅ Payment preparation successful:', result);

      setClientSecret(result.clientSecret);
      setPaymentInitiated(true);

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      console.error('❌ Payment preparation failed:', error);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsPreparingPayment(false);
    }
  };

  const handlePaymentSuccess = () => {
    toast({ 
      title: "Payment successful!", 
      description: "Your listing is being processed." 
    });
    setIsComplete(true);
  };

  if (!mounted) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        <p className="mt-2 text-neutral-600">Loading...</p>
      </div>
    );
  }

  if (!user && !userLoading) {
    return (
      <div className="text-center p-8">
        <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
        <h2 className="mt-4 text-xl font-bold">Please log in</h2>
        <p className="mt-2 text-neutral-600">You must be logged in to create a listing.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-light text-neutral-900 mb-2 tracking-tight">
          {paymentInitiated ? 'Bezahlung abschliessen' : 'Vorschau & Bezahlung'}
        </h2>
        <p className="text-neutral-600 font-light leading-relaxed">
          {paymentInitiated ? 'Schliessen Sie die Bezahlung ab, um Ihr Inserat zu veröffentlichen.' : 'Überprüfen Sie Ihre Angaben und schliessen Sie die Bezahlung ab.'}
        </p>
      </div>

      {!paymentInitiated ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="overflow-hidden">
                <div className="relative">
                  <Image
                    src={mainImage}
                    alt={`${data.brand} ${data.model}` || "Vehicle image"}
                    width={800}
                    height={600}
                    className="w-full h-64 object-cover"
                  />
                  {isPremium && (
                    <Badge className="absolute top-4 left-4 bg-red-500 text-white border-red-500">
                      <Star className="w-4 h-4 mr-1" />
                      Premium
                    </Badge>
                  )}
                </div>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-bold">{data.brand} {data.model}</h3>
                      <p className="text-neutral-500">{getCantonName(data.location)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-red-600">{formatPrice(data.price_per_month_chf)}</p>
                      <p className="text-sm text-neutral-500">pro Monat</p>
                    </div>
                  </div>

                  <hr className="my-6" />

                  <div className="space-y-4">
                    {vehicleDetails.map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-neutral-500">{label}</p>
                        <p className="font-semibold text-neutral-800">{value || '-'}</p>
                      </div>
                    ))}
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Restlaufzeit:</span>
                      <span className="font-medium">{data.remaining_months} Monate</span>
                    </div>

                    {data.remaining_km && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Verbleibende KM:</span>
                        <span className="font-medium">{data.remaining_km?.toLocaleString("de-CH")} km</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-4 flex items-center">
                    Gewählter Plan
                  </h3>
                  
                  {planDetails ? (
                    <div className="space-y-3">
                      <div className="flex justify-between font-semibold">
                        <span>{planDetails.name}</span>
                        <span>CHF {planPrice.toFixed(2)}</span>
                      </div>
                      <p className="text-sm text-neutral-500 -mt-2">{planDetails.duration_days} Tage</p>

                      {isPremium && (
                        <div className="flex justify-between items-center text-sm pt-2">
                          <div className="flex items-center text-red-600 font-semibold">
                            <Star className="w-4 h-4 mr-2" />
                            <span>Premium Boost</span>
                          </div>
                          <span className="font-semibold">+ CHF {PREMIUM_BOOST_PRICE.toFixed(2)}</span>
                        </div>
                      )}

                      <hr className="border-t border-neutral-200 !my-4" />

                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>CHF {total.toFixed(2)}</span>
                      </div>

                    </div>
                  ) : (
                    <p className="text-neutral-500">Kein Plan ausgewählt.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-4 text-red-600 flex items-center">
                    <Check className="w-5 h-5 mr-2 text-green-500" />
                    Nach der Bezahlung
                  </h3>
                  <ul className="space-y-2 text-sm text-neutral-600 list-disc list-inside">
                    <li>Alle Angaben werden von unserem Team überprüft.</li>
                    <li>Sie erhalten eine Benachrichtigung sobald Ihr Inserat live ist.</li>
                    <li>Dies dauert in der Regel 2-4 Stunden.</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-between pt-6">
            <Button variant="outline" onClick={prevStep}>
              Zurück zu den Bildern
            </Button>
            <Button 
              onClick={handlePreparePayment} 
              disabled={isPreparingPayment}
              className="bg-red-500 hover:bg-red-600"
            >
              {isPreparingPayment ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Wird geladen...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  {total === 0 ? 'Inserat erstellen' : `Jetzt bezahlen (CHF ${total.toFixed(2)})`}
                </>
              )}
            </Button>
          </div>
        </>
      ) : (
        <>
          {clientSecret && (
            <PaymentWidget 
              clientSecret={clientSecret}
              totalAmount={total}
              onSuccess={handlePaymentSuccess}
            />
          )}
        </>
      )}
    </div>
  );
}
