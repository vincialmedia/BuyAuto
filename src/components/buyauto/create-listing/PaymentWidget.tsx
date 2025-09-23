"use client";

import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/stripe';
import { CheckoutForm } from './CheckoutForm';

const stripePromise = getStripe();

interface PaymentWidgetProps {
  clientSecret: string;
  totalAmount: number;
  onSuccess: () => void;
}

export default function PaymentWidget({ clientSecret, totalAmount, onSuccess }: PaymentWidgetProps) {
  // Guard: no clientSecret, no render
  if (!clientSecret) return null;

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
          stripe={stripePromise} 
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