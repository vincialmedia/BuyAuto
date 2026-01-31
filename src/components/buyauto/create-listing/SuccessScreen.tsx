import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { CheckCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { pricingPlans, PREMIUM_BOOST_PRICE } from "@/lib/buyauto/stripe_config";
import type { Plan } from "@/lib/buyauto/stripe_config";
import { useHasMounted } from "@/hooks/use-has-mounted";
import { useAuth } from "@/contexts/AuthContext";
import { getListingByIdForOwner } from "@/services/createListingService";
import type { ListingData } from "@/lib/buyauto/types";
import { SuccessListingSummary, type SuccessListingSummaryInput } from "@/components/buyauto/create-listing/SuccessListingSummary";

const useConfetti = () => {
  const hasMounted = useHasMounted();
  return {
    launch: () => {
      if (hasMounted && typeof window !== "undefined" && window.confetti) {
        window.confetti({
          particleCount: 150,
          spread: 90,
          origin: { y: 0.6 },
        });
      }
    },
  };
};

declare global {
  interface Window {
    confetti?: (options: unknown) => void;
  }
}

interface CompletedListingData {
  id: string;
  price_plan: Plan;
  premium: boolean;
  price_paid_chf: number;
}

export interface SuccessScreenProps {
  draft?: ListingData | null;
}

function normalizeCompletedListingData(raw: unknown): CompletedListingData | null {
  if (!raw || typeof raw !== "object") return null;

  const obj = raw as Partial<CompletedListingData>;
  if (typeof obj.id !== "string" || obj.id.length === 0) return null;
  if (typeof obj.price_plan !== "string" || !(obj.price_plan in pricingPlans)) return null;
  if (typeof obj.premium !== "boolean") return null;
  if (typeof obj.price_paid_chf !== "number" || !Number.isFinite(obj.price_paid_chf)) return null;

  return obj as CompletedListingData;
}

function getPlanLabel(args: { completed: CompletedListingData | null; listing: SuccessListingSummaryInput | null }): string | null {
  const { completed, listing } = args;

  const planKey = completed?.price_plan ?? (listing?.price_plan ? (listing.price_plan as Plan) : null);
  if (!planKey || !(planKey in pricingPlans)) return null;

  const plan = pricingPlans[planKey];
  return `${plan.name} · ${plan.duration_days} Tage`;
}

function isOnlineStatus(status: string | null | undefined): boolean {
  const s = typeof status === "string" ? status : "";
  return s === "active" || s === "published";
}

export default function SuccessScreen({ draft = null }: SuccessScreenProps) {
  const router = useRouter();
  const hasMounted = useHasMounted();
  const confetti = useConfetti();
  const { user, profile } = useAuth();

  const [completed, setCompleted] = useState<CompletedListingData | null>(null);
  const [resolvedListing, setResolvedListing] = useState<SuccessListingSummaryInput | null>(draft ? (draft as unknown as SuccessListingSummaryInput) : null);
  const [isLoadingListing, setIsLoadingListing] = useState(false);

  const sellerType = profile?.role === "garage" ? "garage" : "private";

  useEffect(() => {
    if (!hasMounted || typeof window === "undefined") return;

    const storedData = sessionStorage.getItem("completedListingData");
    if (!storedData) return;

    try {
      const parsed = JSON.parse(storedData) as unknown;
      const normalized = normalizeCompletedListingData(parsed);
      if (normalized) {
        setCompleted(normalized);
      }
    } catch (error) {
      console.error("Failed to parse listing data:", error);
    }
  }, [hasMounted]);

  useEffect(() => {
    if (!hasMounted) return;
    confetti.launch();
  }, [hasMounted, confetti]);

  const listingId = useMemo(() => {
    return completed?.id ?? (typeof draft?.id === "string" ? draft.id : null);
  }, [completed?.id, draft?.id]);

  useEffect(() => {
    const run = async () => {
      if (!hasMounted) return;
      if (!user) return;
      if (!listingId) return;

      setIsLoadingListing(true);
      try {
        const fetched = await getListingByIdForOwner(listingId, user);
        if (fetched) {
          setResolvedListing((prev) => {
            const prevObj = prev && typeof prev === "object" ? prev : null;
            const merged = { ...(prevObj ?? {}), ...(fetched as unknown as SuccessListingSummaryInput) } as SuccessListingSummaryInput;
            return merged;
          });
        } else if (draft) {
          setResolvedListing(draft as unknown as SuccessListingSummaryInput);
        }
      } catch (e) {
        if (draft) {
          setResolvedListing(draft as unknown as SuccessListingSummaryInput);
        }
      } finally {
        setIsLoadingListing(false);
      }
    };

    void run();
  }, [draft, hasMounted, listingId, user]);

  const planLabel = useMemo(() => getPlanLabel({ completed, listing: resolvedListing }), [completed, resolvedListing]);

  const handleCreateNew = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("completedListingData");
    }
    router.push("/inserat-erstellen");
  };

  if (!hasMounted) {
    return null;
  }

  const online = isOnlineStatus(resolvedListing?.status) || Boolean(completed?.id);

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.5.1/dist/confetti.browser.min.js" async></script>

      <div className="text-center">
        <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
          {online ? "Inserat erstellt" : "Vielen Dank!"}
        </h1>
        <p className="mt-4 text-lg text-neutral-600">
          {online
            ? "Hier ist die Zusammenfassung Ihres Inserats."
            : "Ihr Inserat wurde zur Überprüfung eingereicht. Sie werden benachrichtigt, sobald es veröffentlicht wird. Dies dauert in der Regel 2-4 Stunden."}
        </p>
      </div>

      <div className="mt-10 space-y-8">
        {resolvedListing ? (
          <SuccessListingSummary listing={resolvedListing} sellerType={sellerType} planLabel={planLabel} />
        ) : (
          <Card className="rounded-3xl border-neutral-200/60 shadow-sm">
            <CardContent className="p-6 text-sm text-neutral-600">
              {isLoadingListing ? "Lade Zusammenfassung..." : "Zusammenfassung ist derzeit nicht verfügbar."}
            </CardContent>
          </Card>
        )}

        {completed?.id ? (
          <Card className="rounded-3xl border-neutral-200/60 shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-neutral-800 mb-4">Preisübersicht</h3>

              <div className="space-y-2">
                {completed.price_plan && pricingPlans[completed.price_plan] ? (
                  <div className="flex justify-between items-center text-neutral-700">
                    <span>{pricingPlans[completed.price_plan].name}</span>
                    <span>CHF {pricingPlans[completed.price_plan].price.toFixed(2)}</span>
                  </div>
                ) : null}

                {completed.premium ? (
                  <div className="flex justify-between items-center text-neutral-700">
                    <span>Premium Platzierung Aktiv (CHF 30)</span>
                    <span>+ CHF {PREMIUM_BOOST_PRICE.toFixed(2)}</span>
                  </div>
                ) : null}

                <hr className="border-t border-neutral-200 my-2" />

                <div className="flex justify-between items-center text-xl font-bold">
                  <span className="text-neutral-800">Gesamtbetrag bezahlt:</span>
                  <span className="text-red-600">CHF {completed.price_paid_chf.toFixed(2)}</span>
                </div>
              </div>

              {listingId ? (
                <div className="mt-6">
                  <Button
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        sessionStorage.removeItem("completedListingData");
                        window.location.href = `/fahrzeug/${listingId}?preview=true`;
                      }
                    }}
                    className="w-full bg-neutral-900 hover:bg-neutral-800"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Inserat ansehen
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : (
          listingId ? (
            <div className="flex justify-center">
              <Button
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.location.href = `/fahrzeug/${listingId}?preview=true`;
                  }
                }}
                className="w-full sm:w-auto bg-neutral-900 hover:bg-neutral-800"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Inserat ansehen
              </Button>
            </div>
          ) : null
        )}

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button
            className="w-full sm:w-auto bg-red-500 hover:bg-red-600"
            onClick={() => {
              if (typeof window !== "undefined") {
                sessionStorage.removeItem("completedListingData");
                window.location.href = "/dashboard";
              }
            }}
          >
            Zum Dashboard
          </Button>
          <Button variant="secondary" className="w-full sm:w-auto" onClick={handleCreateNew}>
            Neues Inserat erstellen
          </Button>
        </div>
      </div>
    </div>
  );
}