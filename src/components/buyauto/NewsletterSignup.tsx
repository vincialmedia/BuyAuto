import { useState } from "react";
import { Mail, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!email) {
      setError("Bitte geben Sie Ihre E-Mail-Adresse ein");
      return;
    }

    if (!consent) {
      setError("Bitte bestätigen Sie, dass Sie E-Mails erhalten möchten");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, consent }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setEmail("");
        setConsent(false);
        setTimeout(() => setSuccess(false), 5000);
      } else {
        setError(data.error || "Ein Fehler ist aufgetreten");
      }
    } catch (err) {
      setError("Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-4">
        <Mail className="h-5 w-5 text-red-500" />
        <h3 className="text-lg font-semibold text-gray-900">Newsletter abonnieren</h3>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        Bleiben Sie informiert über neue Leasingübernahmen und exklusive Angebote.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            type="email"
            placeholder="Ihre E-Mail-Adresse"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading || success}
            className="flex-1 border-neutral-300 focus:border-red-500 focus:ring-red-500/20"
            aria-label="E-Mail-Adresse für Newsletter"
          />
          <Button
            type="submit"
            disabled={loading || success}
            className="bg-red-500 hover:bg-red-600 text-white px-6 whitespace-nowrap shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30 transition-all duration-300"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Wird gesendet...
              </>
            ) : success ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Angemeldet!
              </>
            ) : (
              "Anmelden"
            )}
          </Button>
        </div>

        <div className="flex items-start gap-2">
          <Checkbox
            id="newsletter-consent"
            checked={consent}
            onCheckedChange={(checked) => setConsent(checked as boolean)}
            disabled={loading || success}
            className="mt-0.5 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
          />
          <label
            htmlFor="newsletter-consent"
            className="text-sm text-gray-600 cursor-pointer leading-tight"
          >
            Ich möchte Informationen und Angebote per E-Mail erhalten.
          </label>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
            {error}
          </div>
        )}

        {success && (
          <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg p-3">
            Erfolgreich angemeldet! Vielen Dank für Ihre Anmeldung.
          </div>
        )}
      </form>
    </div>
  );
}
