
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWizard } from "./ListingWizard";
import { ChevronLeft, Check, Star, MapPin, Calendar, Settings, Image as ImageIcon, CreditCard } from "lucide-react";
import Image from "next/image";
import { createListing } from "@/services/createListingService";

export default function Step5_Preview() {
  const { data, prevStep, setIsComplete } = useWizard();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      // Calculate expires_at based on duration_days
      const expiresAt = data.duration_days 
        ? new Date(Date.now() + (data.duration_days * 24 * 60 * 60 * 1000)).toISOString()
        : null;

      const listingData = {
        brand: data.brand,
        model: data.model,
        year: data.year,
        km: data.km,
        body: data.body,
        fuel: data.fuel,
        gearbox: data.gearbox,
        price_per_month_chf: data.price_per_month_chf,
        remaining_months: data.remaining_months,
        deposit_chf: data.deposit_chf,
        location: data.location,
        canton_code: data.canton_code,
        images: data.images,
        cover_image_index: data.cover_image_index,
        price_plan: data.price_plan,
        is_premium: data.is_premium,
        duration_days: data.duration_days,
        expires_at: expiresAt,
        status: 'pending' as const, // All listings need review
      };

      await createListing(listingData);
      setIsComplete(true);
    } catch (error) {
      console.error('Failed to create listing:', error);
      setError('Fehler beim Erstellen des Inserats. Bitte versuchen Sie es erneut.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('de-CH');
  };

  const getPlanInfo = () => {
    const planMap = {
      'free30': { name: 'Standard (Gratis)', duration: '30 Tage', price: 0 },
      'premium30': { name: 'Premium (Empfohlen)', duration: '30 Tage Premium', price: 30 },
      'paid90': { name: 'Verlängert', duration: '90 Tage', price: 50 },
      'unlimited': { name: 'Unlimitiert', duration: 'Ohne Ablauf', price: 190 },
    };
    
    return planMap[data.price_plan as keyof typeof planMap] || planMap.free30;
  };

  const planInfo = getPlanInfo();

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-light text-neutral-900 mb-2">
          Vorschau & Bestätigung
        </h2>
        <p className="text-neutral-600">
          Überprüfen Sie Ihre Angaben vor der Veröffentlichung
        </p>
      </div>

      {/* Main Preview Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Listing Preview */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden rounded-2xl border-neutral-200/60 shadow-lg">
            <div className="relative aspect-[16/9] bg-neutral-100">
              {data.images && data.images.length > 0 ? (
                <Image
                  src={data.images[data.cover_image_index || 0]}
                  alt={`${data.brand} ${data.model}`}
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
              {data.is_premium && (
                <div className="absolute top-4 left-4">
                  <Badge className="bg-red-500 text-white px-3 py-1 text-sm font-medium">
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    Premium
                  </Badge>
                </div>
              )}

              {/* Image Count */}
              {data.images && data.images.length > 1 && (
                <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-lg text-sm">
                  <ImageIcon className="w-4 h-4 inline mr-1" />
                  {data.images.length}
                </div>
              )}
            </div>

            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-neutral-900">
                    {data.brand} {data.model}
                  </h3>
                  <p className="text-neutral-600 flex items-center mt-1">
                    <MapPin className="w-4 h-4 mr-1" />
                    {data.location}, {data.canton_code}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-amber-600">
                    CHF {formatPrice(data.price_per_month_chf)}
                  </p>
                  <p className="text-sm text-neutral-500">pro Monat</p>
                </div>
              </div>

              {/* Vehicle Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-neutral-500">Baujahr</p>
                  <p className="font-semibold text-neutral-900">{data.year}</p>
                </div>
                <div>
                  <p className="text-neutral-500">Kilometer</p>
                  <p className="font-semibold text-neutral-900">{formatPrice(data.km)} km</p>
                </div>
                <div>
                  <p className="text-neutral-500">Karosserie</p>
                  <p className="font-semibold text-neutral-900">{data.body}</p>
                </div>
                <div>
                  <p className="text-neutral-500">Antrieb</p>
                  <p className="font-semibold text-neutral-900">{data.fuel}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-neutral-200">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Restlaufzeit:</span>
                  <span className="font-semibold">{data.remaining_months} Monate</span>
                </div>
                {data.deposit_chf > 0 && (
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-neutral-500">Kaution:</span>
                    <span className="font-semibold">CHF {formatPrice(data.deposit_chf)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-neutral-500">Getriebe:</span>
                  <span className="font-semibold">{data.gearbox}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Image Gallery Preview */}
          {data.images && data.images.length > 1 && (
            <Card className="rounded-2xl border-neutral-200/60">
              <CardHeader>
                <CardTitle className="text-lg font-medium">
                  Bilder ({data.images.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                  {data.images.slice(0, 12).map((image, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border-2 border-transparent">
                      <Image
                        src={image}
                        alt={`Bild ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 25vw, 16vw"
                      />
                      {index === data.cover_image_index && (
                        <div className="absolute top-1 left-1 bg-amber-500 rounded-full p-1">
                          <Star className="w-3 h-3 text-white fill-current" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {data.images.length > 12 && (
                  <p className="text-sm text-neutral-500 mt-3 text-center">
                    ... und {data.images.length - 12} weitere Bilder
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Summary & Actions */}
        <div className="space-y-6">
          {/* Plan Summary */}
          <Card className="rounded-2xl border-neutral-200/60 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg font-medium">
                <Settings className="w-5 h-5 mr-2" />
                Gewählter Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-neutral-900">{planInfo.name}</p>
                  <p className="text-sm text-neutral-600">{planInfo.duration}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-neutral-900">
                    CHF {formatPrice(planInfo.price)}
                  </p>
                  {planInfo.price > 0 && (
                    <p className="text-xs text-neutral-500">einmalig</p>
                  )}
                </div>
              </div>

              {data.is_premium && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-700 font-medium flex items-center">
                    <Star className="w-4 h-4 mr-2 fill-current" />
                    Premium-Platzierung aktiviert
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    Ihr Inserat erscheint oben in den Suchergebnissen
                  </p>
                </div>
              )}

              <div className="pt-3 border-t border-neutral-200">
                <div className="flex items-center text-sm text-neutral-600 mb-2">
                  <Calendar className="w-4 h-4 mr-2" />
                  Laufzeit
                </div>
                <p className="text-sm font-medium">
                  {data.duration_days 
                    ? `${data.duration_days} Tage ab Veröffentlichung`
                    : "Unbegrenzt bis zum Verkauf"
                  }
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Review Process */}
          <Card className="rounded-2xl border-neutral-200/60">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center text-amber-600">
                  <Check className="w-5 h-5 mr-2" />
                  <span className="font-medium">Bereit zur Überprüfung</span>
                </div>
                <div className="text-sm text-neutral-600 space-y-2">
                  <p>• Alle Angaben werden von unserem Team überprüft</p>
                  <p>• Sie erhalten eine Benachrichtigung sobald Ihr Inserat live ist</p>
                  <p>• Dies dauert in der Regel 2-4 Stunden</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Message */}
          {error && (
            <Card className="rounded-2xl border-red-200 bg-red-50">
              <CardContent className="p-6">
                <p className="text-red-600 text-sm">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="space-y-4">
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-medium rounded-xl shadow-lg shadow-amber-200 transition-all duration-200 hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {submitting ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Inserat wird erstellt...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  {planInfo.price > 0 ? (
                    <>
                      <CreditCard className="w-5 h-5 mr-2" />
                      Bezahlen & Inserat erstellen
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      Inserat kostenfrei erstellen
                    </>
                  )}
                </div>
              )}
            </Button>

            <Button
              type="button"
              onClick={prevStep}
              variant="outline"
              disabled={submitting}
              className="w-full py-4 bg-transparent hover:bg-neutral-50 border-neutral-300 text-neutral-600 rounded-xl transition-all duration-200"
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