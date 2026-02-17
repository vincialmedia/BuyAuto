import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Check, Mail, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const includedFeatures = [
  "Garage-Profilseite + Inventar-Seite",
  "Inserate erstellen & verwalten",
  "VIN-PreFill (wo verfügbar)",
  "Leasing-Rechner direkt im Inserat",
  "Deal-Chat pro Fahrzeug (Chat + Dokumente)",
  "Basis-Statistiken: Views & Anfragen",
];

const packages = [
  {
    code: "starter",
    name: "Starter",
    price: "CHF 149",
    period: "/ Monat",
    limit: "bis zu 15 Inserate",
    premiumIncluded: "1 Premium Inserat / Monat inklusive",
    features: ["Basis-Funktionen inklusive"],
    cta: "Starter wählen",
    popular: false,
  },
  {
    code: "growth",
    name: "Growth",
    price: "CHF 349",
    period: "/ Monat",
    limit: "bis zu 50 Inserate",
    premiumIncluded: "5 Premium Inserate / Monat inklusive",
    features: [
      "Alles aus Starter",
      "Done-for-you Onboarding",
      "Du schickst uns dein Inventar, wir erledigen den Rest.",
    ],
    cta: "Growth wählen",
    popular: true,
  },
  {
    code: "pro",
    name: "Pro",
    price: "CHF 599",
    period: "/ Monat",
    limit: "bis zu 100 Inserate",
    premiumIncluded: "10 Premium Inserate / Monat inklusive",
    features: ["Alles aus Growth", "Done-for-you Onboarding (priorisiert)"],
    cta: "Pro wählen",
    popular: false,
  },
];

export default function GaragePlanPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const userRole = profile?.role;
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push("/auth?mode=login");
      return;
    }

    if (userRole !== "garage") {
      toast.error("Zugriff verweigert", {
        description: "Diese Seite ist nur für Garagen verfügbar.",
      });
      router.push("/");
      return;
    }
  }, [user, userRole, router]);

  const handleSelectPlan = async (planCode: string) => {
    if (!user) return;

    setLoading(true);
    setSelectedPlan(planCode);

    try {
      // Step 1: Prepare payment session
      const response = await fetch("/api/dealer/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planCode }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Fehler beim Vorbereiten der Zahlung");
      }

      const { sessionId, url } = await response.json();

      if (!url) {
        throw new Error("Keine Zahlungs-URL erhalten");
      }

      // Step 2: Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error: any) {
      console.error("Plan selection error:", error);
      toast.error("Fehler", {
        description: error.message || "Bitte versuche es später erneut.",
      });
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  if (!user || userRole !== "garage") {
    return null;
  }

  return (
    <>
      <Head>
        <title>BuyAuto – Wähle dein Paket</title>
        <meta
          name="description"
          content="Wähle das passende Paket für deine Garage. Inserate, VIN-PreFill, Leasing-Rechner und Deal-Chat pro Fahrzeug."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="bg-gradient-to-b from-neutral-50 to-white">
        {/* Hero - Ultra Compact */}
        <section className="pt-8 pb-6 px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 mb-2">
            Wähle dein Paket
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Mehr Anfragen. Weniger Aufwand. Sofort loslegen.
          </p>
        </section>

        {/* Packages - Main Focus */}
        <section id="packages" className="pb-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {packages.map((pkg) => (
                <div
                  key={pkg.code}
                  className={`relative bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 flex flex-col border ${
                    pkg.popular ? "border-primary ring-1 ring-primary" : "border-neutral-100"
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                      Meist gewählt
                    </div>
                  )}

                  <div className="mb-6 text-center">
                    <h3 className="text-xl font-bold text-neutral-900 mb-2">
                      {pkg.name}
                    </h3>
                    <div className="flex items-baseline justify-center gap-1 mb-1">
                      <span className="text-4xl font-bold text-neutral-900">
                        {pkg.price}
                      </span>
                      <span className="text-neutral-500 text-sm">{pkg.period}</span>
                    </div>
                    <p className="text-sm font-medium text-neutral-900 mb-2">
                      {pkg.limit}
                    </p>
                     <div className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold">
                      {pkg.premiumIncluded}
                    </div>
                  </div>

                  <div className="flex-1 mb-6">
                    <ul className="space-y-3">
                      {pkg.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-primary flex-shrink-0" />
                          <span className="text-sm text-neutral-600">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    size="lg"
                    className="w-full"
                    variant={pkg.popular ? "default" : "outline"}
                    onClick={() => handleSelectPlan(pkg.code)}
                    disabled={loading}
                  >
                    {loading && selectedPlan === pkg.code ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Wird geladen...
                      </>
                    ) : (
                      pkg.cta
                    )}
                  </Button>
                </div>
              ))}
            </div>

            {/* Included in every package - Moved Down */}
            <div className="max-w-4xl mx-auto mb-12">
              <div className="text-center mb-6">
                 <h2 className="text-lg font-semibold text-neutral-900">
                  In allen Paketen inklusive
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {includedFeatures.map((feature, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 bg-white p-3 rounded-xl border border-neutral-100 shadow-sm"
                  >
                    <div className="bg-green-50 p-1.5 rounded-full">
                       <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    </div>
                    <span className="text-neutral-700 font-medium text-sm">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>

             {/* Enterprise / Contact */}
            <div className="max-w-3xl mx-auto bg-neutral-900 rounded-2xl p-6 text-white text-center md:text-left md:flex md:items-center md:justify-between gap-6">
              <div>
                <h3 className="text-lg font-bold mb-1">
                  Grosskunde? Mehr als 100 Fahrzeuge?
                </h3>
                <p className="text-neutral-400 text-sm">
                  Wir bieten individuelle Lösungen und Schnittstellen-Anbindungen.
                </p>
              </div>
              <Button
                variant="secondary"
                className="mt-4 md:mt-0 flex-shrink-0"
                asChild
              >
                <a href="mailto:kontakt@buyauto.ch">
                  Kontakt aufnehmen
                </a>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}