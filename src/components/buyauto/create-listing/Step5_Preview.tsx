import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWizard } from "./ListingWizard";
import { ChevronLeft, Check, Star, MapPin, Calendar, Settings, Image as ImageIcon, CreditCard } from "lucide-react";
import Image from "next/image";
import { createListing } from "@/services/createListingService";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { ListingFormData, PricePlan } from "@/lib/buyauto/types";

export default function Step5_Preview() {
  const { data, prevStep, setIsComplete } = useWizard();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!user) {
      setError('Sie müssen angemeldet sein, um ein Inserat zu erstellen.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Map wizard data to the expected database format with proper fallbacks
      const listingData: ListingFormData = {
        brand: data.brand || "",
        model: data.model || "",
        year: data.year || new Date().getFullYear(),
        mileage_km: data.km || 0,
        body: (data.body as "Limousine" | "Kombi" | "SUV" | "Cabrio") || "Limousine",
        fuel: (data.fuel as "Benzin" | "Diesel" | "Hybrid" | "Elektro") || "Benzin",
        gearbox: (data.gearbox as "Automatik" | "Manuell") || "Automatik",
        price_per_month_chf: data.price_per_month_chf || 0,
        remaining_months: data.remaining_months || 12,
        deposit_chf: data.deposit_chf || 0,
        location: data.location || "",
        canton_code: "ZH", // Default canton - you may want to derive this from location
        title: `${data.brand || ""} ${data.model || ""}`.trim(),
        images: data.images || [],
        cover_image_index: data.cover_image_index || 0,
        price_plan: (data.price_plan || "free30") as PricePlan,
      };

      const listingId = await createListing(listingData, user);
      
      if (listingId) {
        setIsComplete(true);
        toast("Inserat erfolgreich erstellt!");
      } else {
        setError('Fehler beim Erstellen des Inserats. Bitte versuchen Sie es erneut.');
      }
    } catch (error) {
      console.error('Failed to create listing:', error);
      setError('Fehler beim Erstellen des Inserats. Bitte versuchen Sie es erneut.');
    } finally {
      setSubmitting(false);
    }
  };

  // Safe formatting function with proper null/undefined handling
  const formatPrice = (price: number | string | null | undefined): string => {
    if (price === null || price === undefined || price === "") {
      return "0";
    }
    
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    
    if (isNaN(numPrice)) {
      return "0";
    }
    
    return numPrice.toLocaleString('de-CH');
  };

  // Safe number formatting for mileage
  const formatMileage = (km: number | string | null | undefined): string => {
    if (km === null || km === undefined || km === "") {
      return "0";
    }
    
    const numKm = typeof km === "string" ? parseFloat(km) : km;
    
    if (isNaN(numKm)) {
      return "0";
    }
    
    return numKm.toLocaleString('de-CH');
  };

  const getPlanInfo = () => {
    // ✅ FIXED: Use actual plan names from Step3_PlanSelection
    const planMap = {
      'standard': { name: 'Standard', duration: '60 Tage', price: 0 },
      'extended': { name: 'Verlängert', duration: '90 Tage', price: 50 },
      'unlimited': { name: 'Unlimitiert', duration: 'Ohne Ablauf', price: 190 },
      // Legacy fallbacks for existing data
      'free30': { name: 'Standard (Gratis)', duration: '30 Tage', price: 0 },
      'premium30': { name: 'Premium (Empfohlen)', duration: '30 Tage Premium', price: 30 },
      'paid90': { name: 'Verlängert', duration: '90 Tage', price: 50 },
    };
    
    return planMap[data.price_plan as keyof typeof planMap] || planMap.standard;
  };
  
  const planInfo = getPlanInfo();

  // Safe data access with fallbacks
  const safeData = {
    brand: data.brand || "",
    model: data.model || "",
    year: data.year || new Date().getFullYear(),
    km: data.km || 0,
    body: data.body || "",
    fuel: data.fuel || "",
    gearbox: data.gearbox || "",
    price_per_month_chf: data.price_per_month_chf || 0,
    remaining_months: data.remaining_months || 12,
    deposit_chf: data.deposit_chf || 0,
    location: data.location || "",
    images: data.images || [],
    cover_image_index: data.cover_image_index || 0,
    is_premium: data.is_premium || false,
    duration_days: data.duration_days || 30,
  };

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

      {/* Main Preview Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Listing Preview */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden rounded-lg border border-neutral-200/40 shadow-sm hover:shadow-md transition-shadow duration-200 bg-white">
            <div className="relative aspect-[16/9] bg-neutral-50">
              {safeData.images && safeData.images.length > 0 ? (
                <Image
                  src={safeData.images[safeData.cover_image_index] || safeData.images[0]}
                  alt={`${safeData.brand} ${safeData.model}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 66vw"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <ImageIcon className="w-12 h-12 text-neutral-400" />
                </div>
              )}
              
              {/* Premium Badge */}
              {data.premium && (
                <div className="absolute top-4 left-4">
                  <Badge className="bg-red-500 hover:bg-red-500 text-white px-3 py-1 text-sm font-medium shadow-sm">
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    Premium
                  </Badge>
                </div>
              )}

              {/* Image Count */}
              {safeData.images && safeData.images.length > 1 && (
                <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-lg text-sm backdrop-blur-sm">
                  <ImageIcon className="w-4 h-4 inline mr-1" />
                  {safeData.images.length}
                </div>
              )}
            </div>

            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-semibold text-neutral-900 tracking-tight">
                    {safeData.brand} {safeData.model}
                  </h3>
                  <p className="text-neutral-600 flex items-center mt-1 font-light">
                    <MapPin className="w-4 h-4 mr-1" />
                    {safeData.location || "Standort wird festgelegt"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-red-600">
                    CHF {formatPrice(safeData.price_per_month_chf)}
                  </p>
                  <p className="text-sm text-neutral-500 font-light">pro Monat</p>
                </div>
              </div>

              {/* Vehicle Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-neutral-500 font-light">Baujahr</p>
                  <p className="font-semibold text-neutral-900">{safeData.year}</p>
                </div>
                <div>
                  <p className="text-neutral-500 font-light">Kilometer</p>
                  <p className="font-semibold text-neutral-900">{formatMileage(safeData.km)} km</p>
                </div>
                <div>
                  <p className="text-neutral-500 font-light">Karosserie</p>
                  <p className="font-semibold text-neutral-900">{safeData.body}</p>
                </div>
                <div>
                  <p className="text-neutral-500 font-light">Antrieb</p>
                  <p className="font-semibold text-neutral-900">{safeData.fuel}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-neutral-200/60">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500 font-light">Restlaufzeit:</span>
                  <span className="font-semibold text-neutral-900">{safeData.remaining_months} Monate</span>
                </div>
                {safeData.deposit_chf > 0 && (
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-neutral-500 font-light">Kaution:</span>
                    <span className="font-semibold text-neutral-900">CHF {formatPrice(safeData.deposit_chf)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-neutral-500 font-light">Getriebe:</span>
                  <span className="font-semibold text-neutral-900">{safeData.gearbox}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Image Gallery Preview */}
          {safeData.images && safeData.images.length > 1 && (
            <Card className="rounded-lg border border-neutral-200/40 shadow-sm bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-medium text-neutral-900 tracking-tight">
                  Bilder ({safeData.images.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                  {safeData.images.slice(0, 12).map((image, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-neutral-200/40">
                      <Image
                        src={image}
                        alt={`Bild ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 25vw, 16vw"
                      />
                      {index === safeData.cover_image_index && (
                        <div className="absolute top-1 left-1 bg-red-500 rounded-full p-1">
                          <Star className="w-3 h-3 text-white fill-current" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {safeData.images.length > 12 && (
                  <p className="text-sm text-neutral-500 mt-3 text-center font-light">
                    ... und {safeData.images.length - 12} weitere Bilder
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Summary & Actions */}
        <div className="space-y-6">
          {/* Plan Summary */}
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

              {data.premium && (
                <div className="p-3 bg-red-50 border border-red-200/60 rounded-lg">
                  <p className="text-sm text-red-700 font-medium flex items-center">
                    <Star className="w-4 h-4 mr-2 fill-current" />
                    Premium-Platzierung aktiviert
                  </p>
                  <p className="text-xs text-red-600 mt-1 font-light">
                    Ihr Inserat erscheint oben in den Suchergebnissen
                  </p>
                </div>
              )}

              <div className="pt-3 border-t border-neutral-200/60">
                <div className="flex items-center text-sm text-neutral-600 mb-2 font-light">
                  <Calendar className="w-4 h-4 mr-2" />
                  Laufzeit
                </div>
                <p className="text-sm font-medium text-neutral-900">
                  {planInfo.duration}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Review Process */}
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

          {/* Error Message */}
          {error && (
            <Card className="rounded-lg border-red-200/60 bg-red-50">
              <CardContent className="p-6">
                <p className="text-red-600 text-sm font-light">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="space-y-4">
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg shadow-sm transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
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
              disabled={submitting}
              className="w-full py-4 bg-transparent hover:bg-neutral-50 border-neutral-200/40 text-neutral-600 rounded-lg transition-all duration-200"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Zurück zur Plan-Auswahl
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
