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

    // Preserve the wizard's current query (draft/edit ids) in the return URL:
    // TWINT/3DS redirects used to come back without ?draft=, so the server
    // draft was never cleaned up and the next visit resumed a stale draft of
    // an already-published listing.
    const returnUrl = new URL(window.location.href);
    returnUrl.searchParams.set("payment_confirmed", "true");
    returnUrl.searchParams.delete("payment_intent_client_secret");

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl.toString(),
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

    // With redirect: "if_required", a payment that needed a redirect (TWINT,
    // some 3DS cards) has already navigated away and this code won't run. When
    // it does run, only treat an actually-succeeded intent as success — a
    // "processing" intent is not yet paid and must not advance the wizard.
    if (paymentIntent?.status === "succeeded") {
      onSuccess();
    } else if (paymentIntent?.status === "processing") {
      setMessage(
        "Deine Zahlung wird verarbeitet. Sobald sie bestätigt ist, wird dein Inserat automatisch veröffentlicht."
      );
    } else {
      setMessage("Die Zahlung ist noch nicht abgeschlossen. Bitte versuche es erneut.");
    }
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