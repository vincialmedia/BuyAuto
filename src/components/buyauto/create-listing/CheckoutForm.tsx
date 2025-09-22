import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';

interface CheckoutFormProps {
  onSuccess: () => void;
  totalAmount: number;
}

export function CheckoutForm({ onSuccess }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/inserat-erstellen?payment_confirmed=true`,
      },
      redirect: 'if_required',
    });

    if (error) {
      if (error.type === 'card_error' || error.type === 'validation_error') {
        setMessage(error.message || 'An unexpected error occurred.');
      } else {
        setMessage('An unexpected error occurred.');
      }
    } else {
      // Payment succeeded, call onSuccess callback
      onSuccess();
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement 
        options={{
          layout: 'tabs'
        }}
      />
      
      {message && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-200">
          {message}
        </div>
      )}
      
      <Button
        disabled={isLoading || !stripe || !elements}
        type="submit"
        className="w-full bg-red-500 hover:bg-red-600"
      >
        {isLoading ? (
          <>
            <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Zahlung wird verarbeitet...
          </>
        ) : (
          'Jetzt bezahlen'
        )}
      </Button>
    </form>
  );
}
