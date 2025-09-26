import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWizard } from "./ListingWizard";
import { ChevronLeft, Check, Star, MapPin, Calendar, Settings, Image as ImageIcon, CreditCard, Loader2 } from "lucide-react";
import Image from "next/image";
import { finalizeListing } from "@/services/createListingService";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import type { ListingDetail, PricePlanId } from "@/lib/buyauto/types";
import { getUserListingById } from "@/services/listingsService";

export default function Step5_Preview() {
  const { data, prevStep, setIsComplete } = useWizard();
  const { user } = useAuth();
  
  const [listingData, setListingData] = useState<ListingDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchListing = async () => {
      if (!data.id || !user) {
        setIsLoading(false);
        setError("Keine Inserat-Daten gefunden. Bitte gehen Sie zurück.");
        return;
      }
      
      setIsLoading(true);
      try {
        // Use the service that queries the full 'listings' table for drafts
        const fetchedListing = await getUserListingById(data.id);
        
        if (fetchedListing) {
          setListingData(fetchedListing);
        } else {
          throw new Error('Listing nicht gefunden.');
        }
      } catch (err) {
        console.error('Error fetching listing for preview:', err);
        const message = err instanceof Error ? err.message : "Ein unbekannter Fehler ist aufgetreten.";
        setError(`Vorschau konnte nicht geladen werden: ${message}`);
        toast.error("Vorschau konnte nicht geladen werden.", {
          description: "Bitte versuchen Sie es erneut.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchListing();
  }, [data.id, user]);

  const handleSubmit = async () => {
    if (!user || !listingData?.id) {
      setError('Sie müssen angemeldet sein und ein gültiges Inserat haben.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await finalizeListing(listingData.id, user);
      setIsComplete(true);
      toast.success("Inserat erfolgreich zur Überprüfung eingereicht!");
    } catch (err) {
      console.error('Failed to finalize listing:', err);
      const message = err instanceof Error ? err.message : "Bitte versuchen Sie es erneut.";
      setError(`Fehler beim Erstellen des Inserats: ${message}`);
      toast.error("Fehler beim Erstellen des Inserats.", {
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price: number | null | undefined): string => {
    if (price === null || price === undefined) return "0";
    return price.toLocaleString('de-CH');
  };

  const formatMileage = (km: number | null | undefined): string => {
    if (km === null || km === undefined) return "0";
    return km.toLocaleString('de-CH');
  };
  
  const getPlanInfo = () => {
    const planMap: Record<PricePlanId, { name: string; duration: string; price: number }> = {
      'free30': { name: 'Standard (Gratis)', duration: '30 Tage', price: 0 },
      'standard': { name: 'Standard Plan', duration: '60 Tage', price: 0 },
      'extended': { name: 'Verlängert Plan', duration: '90 Tage', price: 50 },
      'unlimited': { name: 'Unlimitiert Plan', duration: 'Ohne Ablauf', price: 190 },
    };
    
    const selectedPlan = listingData?.price_plan || data.price_plan || 'standard';
    return planMap[selectedPlan] || planMap.standard;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="w-12 h-12 animate-spin text-red-500" />
        <p className="mt-4 text-neutral-600 font-light">Lade Vorschau...</p>
      </div>
    );
  }

  if (error || !listingData) {
    return (
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-light text-red-600 mb-2 tracking-tight">
          Fehler bei der Vorschau
        </h2>
        <p className="text-neutral-600 font-light leading-relaxed">
          {error || "Die Inserat-Daten konnten nicht geladen werden."}
        </p>
        <Button onClick={prevStep} variant="outline">
          <ChevronLeft className="w-4 h-4 mr-2" />
          Zurück
        </Button>
      </div>
    );
  }
  
  const planInfo = getPlanInfo();

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-light text-neutral-900 mb-2 tracking-tight">
          Vorschau & Bestätigung
        </h2>
        <p className="text-neutral-600 font-light leading-relaxed">
          Überprüfen Sie Ihre Angaben vor der Veröffentlichung
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden rounded-lg border border-neutral-200/40 shadow-sm bg-white">
            <div className="relative aspect-[16/9] bg-neutral-50">
              {listingData.images && listingData.images.length > 0 ? (
                <Image
                  src={listingData.images[0]}
                  alt={`${listingData.brand} ${listingData.model}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 66vw"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <ImageIcon className="w-12 h-12 text-neutral-400" />
                </div>
              )}
              
              {listingData.premium && (
                <div className="absolute top-4 left-4">
                  <Badge className="bg-red-500 hover:bg-red-500 text-white px-3 py-1 text-sm font-medium shadow-sm">
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    Premium
                  </Badge>
                </div>
              )}

              {listingData.images && listingData.images.length > 1 && (
                <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-lg text-sm backdrop-blur-sm">
                  <ImageIcon className="w-4 h-4 inline mr-1" />
                  {listingData.images.length}
                </div>
              )}
            </div>

            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-semibold text-neutral-900 tracking-tight">
                    {listingData.title || `${listingData.brand} ${listingData.model}`}
                  </h3>
                  <p className="text-neutral-600 flex items-center mt-1 font-light">
                    <MapPin className="w-4 h-4 mr-1" />
                    {listingData.location || "N/A"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-red-600">
                    CHF {formatPrice(listingData.pricePerMonthCHF)}
                  </p>
                  <p className="text-sm text-neutral-500 font-light">pro Monat</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-neutral-500 font-light">Baujahr</p>
                  <p className="font-semibold text-neutral-900">{listingData.year}</p>
                </div>
                <div>
                  <p className="text-neutral-500 font-light">Kilometer</p>
                  <p className="font-semibold text-neutral-900">{formatMileage(listingData.mileageKm)} km</p>
                </div>
                <div>
                  <p className="text-neutral-500 font-light">Karosserie</p>
                  <p className="font-semibold text-neutral-900">{listingData.body}</p>
                </div>
                <div>
                  <p className="text-neutral-500 font-light">Antrieb</p>
                  <p className="font-semibold text-neutral-900">{listingData.fuel}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-neutral-200/60">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500 font-light">Restlaufzeit:</span>
                  <span className="font-semibold text-neutral-900">{listingData.remainingMonths} Monate</span>
                </div>
                {listingData.depositCHF && listingData.depositCHF > 0 && (
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-neutral-500 font-light">Kaution:</span>
                    <span className="font-semibold text-neutral-900">CHF {formatPrice(listingData.depositCHF)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-neutral-500 font-light">Getriebe:</span>
                  <span className="font-semibold text-neutral-900">{listingData.gearbox}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-lg border border-neutral-200/40 shadow-sm bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg font-medium text-neutral-900 tracking-tight">
                <Settings className="w-5 h-5 mr-2" />
                Gewählter Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-neutral-900">{planInfo.name}</p>
                  <p className="text-sm text-neutral-600 font-light">{planInfo.duration}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-neutral-900">
                    CHF {formatPrice(planInfo.price)}
                  </p>
                  {planInfo.price > 0 && (
                    <p className="text-xs text-neutral-500 font-light">einmalig</p>
                  )}
                </div>
              </div>

              {listingData.premium && (
                <div className="p-3 bg-red-50 border border-red-200/60 rounded-lg">
                  <p className="text-sm text-red-700 font-medium flex items-center">
                    <Star className="w-4 h-4 mr-2 fill-current" />
                    Premium-Platzierung aktiviert
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-lg border border-neutral-200/40 bg-white">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center text-red-600">
                  <Check className="w-5 h-5 mr-2" />
                  <span className="font-medium">Bereit zur Überprüfung</span>
                </div>
                <div className="text-sm text-neutral-600 space-y-2 font-light">
                  <p>• Alle Angaben werden von unserem Team überprüft</p>
                  <p>• Sie erhalten eine Benachrichtigung sobald Ihr Inserat live ist</p>
                  <p>• Dies dauert in der Regel 2-4 Stunden</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg shadow-sm transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Inserat wird erstellt...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Check className="w-5 h-5 mr-2" />
                  Inserat erstellen
                </div>
              )}
            </Button>

            <Button
              type="button"
              onClick={prevStep}
              variant="outline"
              disabled={isSubmitting}
              className="w-full py-4 bg-transparent hover:bg-neutral-50 border-neutral-200/40 text-neutral-600 rounded-lg transition-all duration-200"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Zurück zu den Bildern
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
