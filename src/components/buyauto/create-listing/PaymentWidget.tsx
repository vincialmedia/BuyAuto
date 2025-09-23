"use client";

import { useEffect, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { getStripe, isStripeAvailable } from '@/lib/stripe';
import CheckoutForm from './CheckoutForm';
import type { Stripe } from '@stripe/stripe-js';

interface PaymentWidgetProps {
  clientSecret: string;
  totalAmount: number;
  onSuccess: () => void;
}

export default function PaymentWidget({ clientSecret, totalAmount, onSuccess }: PaymentWidgetProps) {
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only run in browser after component is mounted
    if (!mounted || typeof window === 'undefined') return;

    // Early exit if Stripe is not available (missing env var)
    if (!isStripeAvailable()) {
      console.error('❌ Stripe not available - missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
      setError('Payment system is not configured. Please contact support.');
      return;
    }

    // Early exit if no client secret
    if (!clientSecret) {
      console.error('❌ PaymentWidget: No clientSecret provided');
      setError('Payment session not initialized. Please refresh and try again.');
      return;
    }

    console.log('✅ Loading Stripe instance...');
    
    getStripe()
      .then((stripeInstance) => {
        if (stripeInstance) {
          console.log('✅ Stripe loaded successfully');
          setStripe(stripeInstance);
          setIsReady(true);
        } else {
          console.error('❌ Failed to load Stripe instance');
          setError('Failed to initialize payment system. Please refresh and try again.');
        }
      })
      .catch((err) => {
        console.error('❌ Error loading Stripe:', err);
        setError('Failed to load payment system. Please refresh and try again.');
      });
  }, [mounted, clientSecret]);

  // Don't render anything until mounted (prevents SSR issues)
  if (!mounted) {
    return null;
  }

  // Show error state
  if (error) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Payment Error</h3>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  // Show loading state
  if (!isReady || !stripe || !clientSecret) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white p-6 rounded-lg border border-neutral-200 shadow-sm text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mb-4"></div>
          <p className="text-neutral-600">Loading secure payment form...</p>
        </div>
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