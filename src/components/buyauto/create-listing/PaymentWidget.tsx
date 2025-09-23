"use client";

import { useEffect, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/stripe-client'; // Use the new client-safe loader
import CheckoutForm from './CheckoutForm';
import type { Stripe } from '@stripe/stripe-js';

interface PaymentWidgetProps {
  clientSecret: string;
  totalAmount: number;
  onSuccess: () => void;
}

export default function PaymentWidget({ clientSecret, totalAmount, onSuccess }: PaymentWidgetProps) {
  const [stripe, setStripe] = useState<Promise<Stripe | null> | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // getStripe() is now guaranteed to only run on the client and return null during SSR
    const stripePromise = getStripe();
    if (stripePromise) {
      setStripe(stripePromise);
      // Wait for Stripe to load before showing the form
      stripePromise.then((stripeInstance) => {
        if (stripeInstance) {
          setIsReady(true);
        } else {
          console.error('❌ Failed to load Stripe instance');
        }
      });
    } else {
      console.error('❌ getStripe() returned null - likely SSR or missing env var');
    }
  }, []);

  // Don't render anything until the Stripe promise is set, we have a client secret, and Stripe is ready
  if (!stripe || !clientSecret || !isReady) {
    return (
      <div className="text-center p-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mb-4"></div>
        <p className="text-neutral-600">Loading secure payment form...</p>
      </div>
    );
  }

  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#ef4444',
      colorBackground: '#ffffff',
      colorText: '#1f2937',
      colorDanger: '#dc2626',
      fontFamily: 'system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '6px',
    },
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white p-6 rounded-lg border border-neutral-200 shadow-sm">
        <h3 className="text-xl font-semibold mb-4 text-center text-neutral-900">
          Sichere Zahlung - CHF {totalAmount}
        </h3>
        <Elements 
          stripe={stripe} 
          options={{ 
            clientSecret,
            appearance
          }}
        >
          <CheckoutForm onSuccess={onSuccess} totalAmount={totalAmount} />
        </Elements>
      </div>
    </div>
  );
}