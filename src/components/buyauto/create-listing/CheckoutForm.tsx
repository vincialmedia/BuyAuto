import { useState } from "react";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";

interface CheckoutFormProps {
  onSuccess: () => void;
  totalAmount: number;
}

export default function CheckoutForm({ onSuccess }: CheckoutFormProps) {
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
      redirect: "if_required",
    });

    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message || "Die Zahlung konnte nicht verarbeitet werden.");
      } else {
        setMessage("Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.");
      }
      setIsLoading(false);
      return;
    }

    onSuccess();
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />

      {message && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-2xl border border-destructive/20">
          {message}
        </div>
      )}

      <Button
        disabled={isLoading || !stripe || !elements}
        type="submit"
        className="w-full rounded-2xl bg-gradient-to-r from-primary to-primary/80 hover:opacity-95"
      >
        {isLoading ? (
          <>
            <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            Zahlung wird verarbeitet...
          </>
        ) : (
          "Jetzt bezahlen"
        )}
      </Button>
    </form>
  );
}