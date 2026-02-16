import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Check, Mail, ArrowRight, Loader2 } from "lucide-react";
import Header from "@/components/buyauto/Header";
import { Footer } from "@/components/buyauto/Footer";
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
    features: ["Alles aus 'Inklusive'"],
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

      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
        <Header />

        {/* Hero - Ultra Compressed */}
        <section className="relative pt-4 pb-2 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 mb-2">
              Wähle dein Paket
            </h1>
            <p className="text-xl md:text-2xl font-bold text-neutral-800 mb-1">
              Mehr Anfragen. Weniger Aufwand.
            </p>
            <p className="text-base text-neutral-600 mb-4 max-w-3xl mx-auto">
              Dein Inventar online – mit VIN-PreFill, Leasing-Rechner und
              Deal-Chat pro Fahrzeug.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 max-w-3xl mx-auto">
              {[
                "VIN-PreFill (wo verfügbar)",
                "Leasing-Rechner im Inserat",
                "Deal-Chat inkl. Dokumentenversand",
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-center gap-2 text-neutral-700"
                >
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-xs font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Included in every package - Ultra Compressed */}
        <section className="py-2 px-4 bg-neutral-50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl font-bold text-center text-neutral-900 mb-1">
              In jedem Paket inklusive
            </h2>
            <p className="text-center text-neutral-600 mb-3 max-w-2xl mx-auto text-xs">
              Diese Features bekommst du in allen Paketen – von Starter bis
              Pro.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              {includedFeatures.map((feature, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 bg-white p-4 rounded-2xl shadow-sm"
                >
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-neutral-700 font-medium text-sm">
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <p className="text-xs text-amber-900">
                <strong>Wichtig:</strong> Leads können nicht garantiert werden
                – aber du bekommst eine saubere Präsenz + direkten Kanal für
                Anfragen.
              </p>
            </div>
          </div>
        </section>

        {/* Packages - Ultra Compressed */}
        <section id="packages" className="py-2 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-center text-neutral-900 mb-1">
              Wähle dein Paket
            </h2>
            <p className="text-center text-neutral-600 mb-4 max-w-2xl mx-auto text-xs">
              Transparent, fair, monatlich kündbar.
            </p>

            {/* Main 3 cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {packages.map((pkg) => (
                <div
                  key={pkg.code}
                  className={`relative bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 flex flex-col ${
                    pkg.popular ? "ring-2 ring-primary" : ""
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
                      Meist gewählt
                    </div>
                  )}

                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-neutral-900 mb-2">
                      {pkg.name}
                    </h3>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-3xl font-bold text-neutral-900">
                        {pkg.price}
                      </span>
                      <span className="text-neutral-600 text-sm">{pkg.period}</span>
                    </div>
                    <p className="text-xs text-neutral-600 font-medium">
                      {pkg.limit}
                    </p>
                    <p className="text-xs text-primary font-semibold mt-1">
                      {pkg.premiumIncluded}
                    </p>
                  </div>

                  <div className="flex-1 mb-4">
                    <ul className="space-y-2">
                      {pkg.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-xs text-neutral-700">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    size="lg"
                    className="w-full h-12 text-sm"
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

            {/* 100+ floating bar */}
            <div className="bg-gradient-to-r from-neutral-800 to-neutral-900 rounded-3xl shadow-2xl p-6 text-white">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-1">
                    100+ Inserate oder Spezialanforderungen?
                  </h3>
                  <p className="text-neutral-300 text-sm">
                    Für grosse Bestände, mehrere Standorte oder
                    Spezialprozesse. Individuelles Angebot auf Anfrage.
                  </p>
                </div>
                <Button
                  size="lg"
                  variant="secondary"
                  className="flex-shrink-0 h-12 px-6"
                  asChild
                >
                  <a href="mailto:kontakt@buyauto.ch">
                    <Mail className="w-5 h-5 mr-2" />
                    Kontakt aufnehmen
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Premium section - Compressed */}
        <section className="py-8 px-4 bg-neutral-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center text-neutral-900 mb-3">
              Was ist ein Premium Inserat?
            </h2>
            <p className="text-neutral-600 mb-6 text-center max-w-2xl mx-auto text-sm">
              Ein Premium Inserat ist visuell hervorgehoben (Premium-Badge +
              Highlight) und kann zusätzlich in separaten Premium-Bereichen
              erscheinen (z.B. Startseite / Premium-Sektion), ohne dass wir
              eine bessere Suchplatzierung versprechen.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {[
                "Premium-Badge + visuelle Hervorhebung",
                "Optional: Platzierung in Premium-Sektionen, wenn verfügbar",
                "Monatliches Premium-Kontingent je nach Paket",
              ].map((item, i) => (
                <div
                  key={i}
                  className="bg-white p-4 rounded-2xl shadow-sm flex items-start gap-2"
                >
                  <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-neutral-700">{item}</span>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <p className="text-xs text-blue-900">
                <strong>Hinweis:</strong> Premium = Hervorhebung, nicht
                garantierte Leads.
              </p>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}