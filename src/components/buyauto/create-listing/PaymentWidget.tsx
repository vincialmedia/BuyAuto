
"use client";

import { Elements } from '@stripe/react-stripe-js';
import { useEffect, useState } from 'react';
import { getStripe } from '@/lib/stripe';
import { CheckoutForm } from './CheckoutForm';
import type { Stripe } from '@stripe/stripe-js';

interface PaymentWidgetProps {
  clientSecret: string;
  totalAmount: number;
  onSuccess: () => void;
}

export default function PaymentWidget({ clientSecret, totalAmount, onSuccess }: PaymentWidgetProps) {
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const initializeStripe = async () => {
      try {
        const stripePromise = getStripe();
        
        if (!stripePromise) {
          setError('Payment system is not available. Please check your configuration.');
          setLoading(false);
          return;
        }

        const stripeInstance = await stripePromise;
        
        if (mounted) {
          setStripe(stripeInstance);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to initialize Stripe:', err);
        if (mounted) {
          setError('Failed to load payment system. Please refresh the page and try again.');
          setLoading(false);
        }
      }
    };

    initializeStripe();

    return () => { 
      mounted = false; 
    };
  }, []);

  if (!clientSecret) {
    return null;
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        <p className="mt-2 text-neutral-600">Loading secure payment form...</p>
      </div>
    );
  }

  if (error || !stripe) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 font-medium">Payment System Error</p>
          <p className="text-red-500 text-sm mt-1">
            {error || 'Payment system unavailable. Please refresh the page and try again.'}
          </p>
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
