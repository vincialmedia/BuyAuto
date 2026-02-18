import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Check, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const includedFeatures = [
  "Garage-Profilseite + Inventar",
  "Inserate verwalten",
  "VIN-PreFill (wo verfügbar)",
  "Leasing-Rechner",
  "Deal-Chat pro Fahrzeug",
  "Basis-Statistiken",
];

const packages = [
  {
    code: "starter",
    name: "Starter",
    price: "CHF 149",
    period: "/ Monat",
    limit: "bis 15 Inserate",
    premiumIncluded: "1 Premium / Monat",
    features: ["Ideal für kleine Garagen", "Sofort startklar"],
    cta: "Wählen",
    popular: false,
  },
  {
    code: "growth",
    name: "Growth",
    price: "CHF 349",
    period: "/ Monat",
    limit: "bis 50 Inserate",
    premiumIncluded: "5 Premium / Monat",
    features: [
      "Für wachsende Bestände",
      "Done-for-you Onboarding",
    ],
    cta: "Wählen",
    popular: true,
  },
  {
    code: "pro",
    name: "Pro",
    price: "CHF 599",
    period: "/ Monat",
    limit: "bis 100 Inserate",
    premiumIncluded: "10 Premium / Monat",
    features: ["Für grosse Bestände", "Priorisierter Support"],
    cta: "Wählen",
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
      const response = await fetch("/api/dealer/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_code: planCode }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Fehler beim Vorbereiten der Zahlung");
      }

      const { url } = await response.json();

      if (!url) {
        throw new Error("Keine Zahlungs-URL erhalten");
      }

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
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-neutral-50 pb-20">
        {/* Ultra Compact Header */}
        <div className="bg-white border-b border-neutral-200 py-6 px-4 text-center">
          <h1 className="text-2xl font-bold text-neutral-900">
            Wähle dein Paket
          </h1>
          <p className="text-neutral-500 text-sm mt-1">
            Monatlich kündbar. Keine versteckten Kosten.
          </p>
        </div>

        <div className="max-w-6xl mx-auto px-4 mt-8">
          
          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {packages.map((pkg) => (
              <div
                key={pkg.code}
                className={`relative bg-white rounded-2xl p-6 flex flex-col border transition-all duration-200 ${
                  pkg.popular 
                    ? "border-primary shadow-md ring-1 ring-primary/10" 
                    : "border-neutral-200 shadow-sm hover:border-neutral-300"
                }`}
              >
                {pkg.popular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full shadow-sm">
                    Empfohlen
                  </div>
                )}

                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold text-neutral-900">{pkg.name}</h3>
                  <div className="flex items-baseline justify-center gap-1 mt-1">
                    <span className="text-3xl font-bold text-neutral-900">{pkg.price}</span>
                    <span className="text-neutral-400 text-xs">{pkg.period}</span>
                  </div>
                  <div className="text-sm font-medium text-neutral-700 mt-2 bg-neutral-100 py-1 px-2 rounded-lg inline-block">
                    {pkg.limit}
                  </div>
                </div>

                <div className="flex-1 space-y-3 mb-6">
                   <div className="flex items-center gap-2 text-sm text-primary font-medium bg-primary/5 p-2 rounded-lg">
                      <Check className="w-4 h-4" />
                      {pkg.premiumIncluded}
                   </div>
                   {pkg.features.map((feat, i) => (
                     <div key={i} className="flex items-start gap-2 text-sm text-neutral-600 px-2">
                        <Check className="w-4 h-4 text-neutral-400 mt-0.5" />
                        <span>{feat}</span>
                     </div>
                   ))}
                </div>

                <Button
                  className={`w-full ${pkg.popular ? "bg-primary hover:bg-primary/90" : "bg-neutral-900 hover:bg-neutral-800"}`}
                  onClick={() => handleSelectPlan(pkg.code)}
                  disabled={loading}
                >
                  {loading && selectedPlan === pkg.code ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    pkg.cta
                  )}
                </Button>
              </div>
            ))}
          </div>

          {/* Features List (Compact) */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 mb-8 shadow-sm">
             <h3 className="text-sm font-bold text-neutral-900 mb-4 flex items-center gap-2">
               <Info className="w-4 h-4 text-neutral-400" />
               In allen Paketen enthalten:
             </h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-4">
               {includedFeatures.map((feat, i) => (
                 <div key={i} className="flex items-center gap-2 text-sm text-neutral-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    {feat}
                 </div>
               ))}
             </div>
          </div>

          {/* Enterprise Link */}
          <div className="text-center">
            <p className="text-xs text-neutral-400">
              Mehr als 100 Fahrzeuge? <a href="mailto:kontakt@buyauto.ch" className="text-neutral-600 underline hover:text-neutral-900">Kontaktiere uns</a> für eine Enterprise-Lösung.
            </p>
          </div>

        </div>
      </div>
    </>
  );
}