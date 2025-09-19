
import { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface CheckoutFormProps {
  onSuccess: () => void;
  totalAmount: number;
}

export function CheckoutForm({ onSuccess, totalAmount }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}${window.location.pathname}?payment_confirmed=true`,
      },
    });

    if (error.type === 'card_error' || error.type === 'validation_error') {
      toast({
        title: 'Payment Failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'An unexpected error occurred.',
        description: 'Please try again or contact support.',
        variant: 'destructive',
      });
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement id="payment-element" />
      <Button disabled={isProcessing || !stripe || !elements} className="w-full mt-6 bg-red-500 hover:bg-red-600">
        <span id="button-text">
          {isProcessing ? 'Processing...' : `Jetzt bezahlen (CHF ${totalAmount})`}
        </span>
      </Button>
    </form>
  );
}
