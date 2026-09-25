import { useState } from "react";
import { Mail, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useT } from "@/i18n/runtime";

export function NewsletterSignup() {
  const t = useT();
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
      setError(t("Bitte gib deine E-Mail-Adresse ein"));
      return;
    }

    if (!consent) {
      setError(t("Bitte bestätige, dass du E-Mails erhalten möchtest"));
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
        setError(data.error ? t(data.error) : t("Ein Fehler ist aufgetreten"));
      }
    } catch (err) {
      setError(t("Ein Fehler ist aufgetreten. Bitte versuche es später erneut."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-4">
        <Mail className="h-5 w-5 text-red-500" />
        <h3 className="text-lg font-semibold text-gray-900">{t("Newsletter abonnieren")}</h3>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        {t("Bleib informiert über neue Leasingübernahmen und exklusive Angebote.")}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            type="email"
            placeholder={t("Deine E-Mail-Adresse")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading || success}
            className="flex-1 text-gray-900 border-neutral-300 focus:border-red-500 focus:ring-red-500/20"
            aria-label={t("E-Mail-Adresse für Newsletter")}
          />
          <Button
            type="submit"
            disabled={loading || success}
            className="bg-red-600 hover:bg-red-700 text-white px-6 whitespace-nowrap shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30 transition-all duration-300"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("Wird gesendet...")}
              </>
            ) : success ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {t("Angemeldet!")}
              </>
            ) : (
              t("Anmelden@@newsletter")
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
            {t("Ich möchte Informationen und Angebote per E-Mail erhalten.")}
          </label>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
            {error}
          </div>
        )}

        {success && (
          <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg p-3">
            {t("Erfolgreich angemeldet! Vielen Dank für deine Anmeldung.")}
          </div>
        )}
      </form>
    </div>
  );
}
