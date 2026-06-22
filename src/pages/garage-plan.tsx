import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Check, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
    features: ["Für wachsende Bestände", "Kompletter Bestand hochladen"],
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
    features: ["Für grosse Bestände", "Kompletter Bestand hochladen", "Priorisierter Support"],
    cta: "Wählen",
    popular: false,
  },
];

function isSafeNextPath(input: unknown): input is string {
  return typeof input === "string" && input.startsWith("/") && !input.startsWith("//");
}

export default function GaragePlanPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const userRole = profile?.role;
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady) return;
    if (profile === undefined) return;

    if (!user) {
      const legacyNext = typeof router.query.next === "string" ? router.query.next : null;
      const redirect = typeof router.query.redirect === "string" ? router.query.redirect : null;
      const target = redirect || legacyNext || "/garage-plan";
      router.replace("/auth?redirect=" + encodeURIComponent(target));
      return;
    }

    if (userRole !== "garage") {
      toast.error("Zugriff verweigert", {
        description: "Diese Seite ist nur für Garagen verfügbar.",
      });
      router.replace("/");
      return;
    }
  }, [user, userRole, router, profile]);

  const handleSelectPlan = async (planCode: string) => {
    if (!user) return;

    const redirectPathRaw = typeof router.query.redirect === "string" ? router.query.redirect : null;
    const successPath = isSafeNextPath(redirectPathRaw) ? redirectPathRaw : null;
    const cancelPath = successPath ? `/garage-plan?redirect=${encodeURIComponent(successPath)}` : null;

    setLoading(true);
    setSelectedPlan(planCode);

    try {
      const response = await fetch("/api/dealer/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_code: planCode,
          success_path: successPath ?? undefined,
          cancel_path: cancelPath ?? undefined,
        }),
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

  // The pricing shell has no per-user data: render it on SSR and while client
  // auth resolves (instead of a blank page), and keep the plan buttons disabled
  // until we know a garage user is signed in. Logged-out / non-garage visitors
  // are redirected by the effect above.
  const authReady = Boolean(user && userRole === "garage");

  return (
    <>
      <Head>
        <title>BuyAuto – Wähle dein Paket</title>
        {/* Conversion-funnel step (package selection), not a destination to rank — keep it
            out of the index but crawlable. */}
        <meta name="robots" content="noindex,follow" />
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
                  <h3 className="text-lg font-bold text-neutral-900">
                    {pkg.name}
                  </h3>
                  <div className="flex items-baseline justify-center gap-1 mt-1">
                    <span className="text-3xl font-bold text-neutral-900">
                      {pkg.price}
                    </span>
                    <span className="text-neutral-400 text-xs">{pkg.period}</span>
                  </div>
                  <div className="text-sm font-medium text-neutral-700 mt-2 bg-neutral-100 py-1 px-2 rounded-lg inline-block">
                    {pkg.limit}
                  </div>
                  <div className="mt-2 text-xs text-neutral-500">
                    Jederzeit kündbar
                  </div>
                </div>

                <div className="flex-1 space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm text-primary font-medium bg-primary/5 p-2 rounded-lg">
                    <Check className="w-4 h-4" />
                    {pkg.premiumIncluded}
                  </div>

                  <TooltipProvider>
                    {pkg.features.map((feat, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-sm text-neutral-600"
                      >
                        <Check className="w-4 h-4 text-neutral-400 mt-0.5" />
                        {feat === "Kompletter Bestand hochladen" ? (
                          <span className="inline-flex items-center gap-1">
                            <span>{feat}</span>
                            <Tooltip>
                              <TooltipTrigger className="inline-flex items-center">
                                <Info className="h-3.5 w-3.5 text-neutral-400 hover:text-primary transition-colors cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs text-xs">
                                Wir laden Deinen kompletten Bestand für dich hoch um dir einen schnellen Start zu geben (Nur Anfangsbestand)
                              </TooltipContent>
                            </Tooltip>
                          </span>
                        ) : (
                          <span>{feat}</span>
                        )}
                      </div>
                    ))}
                  </TooltipProvider>
                </div>

                <Button
                  className={`w-full ${
                    pkg.popular
                      ? "bg-primary hover:bg-primary/90"
                      : "bg-neutral-900 hover:bg-neutral-800"
                  }`}
                  onClick={() => handleSelectPlan(pkg.code)}
                  disabled={loading || !authReady}
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

          {/* Included in every package - Ultra Compressed */}
          <section className="bg-neutral-50 py-2 border-y border-neutral-200">
            <div className="container mx-auto px-4 max-w-5xl">
              <h3 className="text-lg font-bold text-center mb-2">
                In jedem Paket inklusive
              </h3>
              <p className="text-center text-neutral-500 mb-3 text-sm">
                Diese Features bekommst du in allen Paketen – von Starter bis Pro.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <TooltipProvider>
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium">
                        Garage-Profilseite + Inventar-Seite
                      </span>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3.5 w-3.5 text-neutral-400 hover:text-primary transition-colors cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-xs">
                          Du hast eine öffentliche Garage-Seite, die du wie eine
                          Website anpassen und per iFrame auf deiner eigenen Website
                          einbinden kannst.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium">
                        Inserate erstellen & verwalten
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium">
                        VIN-PreFill (wo verfügbar)
                      </span>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3.5 w-3.5 text-neutral-400 hover:text-primary transition-colors cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-xs">
                          Fahrzeugdaten werden automatisch basierend auf der
                          Fahrgestellnummer ausgefüllt.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium">
                        Leasing-Rechner direkt im Inserat
                      </span>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3.5 w-3.5 text-neutral-400 hover:text-primary transition-colors cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-xs">
                          Potenzielle Kunden können Leasingraten direkt berechnen
                          und Anfragen stellen, was automatisch ein Angebot erstellt
                          und eine Leasing-Anfrage bei dir eröffnet.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium">
                        Deal-Chat pro Fahrzeug (Chat + Dokumente)
                      </span>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3.5 w-3.5 text-neutral-400 hover:text-primary transition-colors cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-xs">
                          Du kannst mit Leads chatten, Dokumente hochladen und
                          direkt pro Fahrzeug anfordern.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium">
                        Basis-Statistiken: Views & Anfragen
                      </span>
                    </div>
                  </div>
                </TooltipProvider>
              </div>

              <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-2 text-center text-xs text-blue-800">
                <span className="font-semibold">Hinweis:</span> Leads können nicht
                garantiert werden – aber du bekommst eine saubere Präsenz + direkten
                Kanal für Anfragen.
              </div>
            </div>
          </section>

          {/* Enterprise Link */}
          <div className="text-center">
            <p className="text-xs text-neutral-400">
              Mehr als 100 Fahrzeuge?{" "}
              <a
                href="mailto:kontakt@buyauto.ch"
                className="text-neutral-600 underline hover:text-neutral-900"
              >
                Kontaktiere uns
              </a>{" "}
              für eine Enterprise-Lösung.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}