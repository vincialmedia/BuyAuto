import { useWizard } from './ListingWizard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Check, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { pricingPlans, PREMIUM_BOOST_PRICE } from '@/lib/buyauto/stripe_config';
import type { Plan } from '@/lib/buyauto/stripe_config';
import { cantons } from '@/lib/buyauto/data';

// Utility functions for formatting
const formatPrice = (price: number | undefined) => {
  if (!price) return 'CHF 0';
  return `CHF ${price.toLocaleString('de-CH')}`;
};

const formatMileage = (km: number | undefined) => {
  if (!km) return '0 km';
  return `${km.toLocaleString('de-CH')} km`;
};

const getCantonName = (cantonCode: string | undefined) => {
  if (!cantonCode) return '-';
  const canton = cantons.find(c => c.value === cantonCode);
  return canton ? canton.label : cantonCode;
};

const DUMMY_IMAGE_URL = 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=600&fit=crop';

export default function Step5_Preview() {
  const { data, prevStep, setIsComplete } = useWizard();
  const { user, loading: userLoading } = useAuth();

  const selectedPlanId = data.price_plan as Plan | undefined;
  const isPremium = data.premium || false;

  const planDetails = selectedPlanId ? pricingPlans[selectedPlanId] : null;
  const planPrice = planDetails ? planDetails.price : 0;
  
  const total = planPrice + (isPremium ? PREMIUM_BOOST_PRICE : 0);

  const mainImage = data.images?.[0] || DUMMY_IMAGE_URL;

  const vehicleDetails = [
    { label: "Baujahr", value: data.year },
    { label: "Kilometer", value: formatMileage(data.km) },
    { label: "Karosserie", value: data.body },
    { label: "Antrieb", value: data.fuel },
    { label: "Restlaufzeit", value: `${data.remaining_months} Monate` },
    { label: "Getriebe", value: data.gearbox },
  ];

  const handleFinish = () => {
    setIsComplete(true);
  };

  if (!user && !userLoading) {
    return (
      <div className="text-center p-8">
        <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
        <h2 className="mt-4 text-xl font-bold">Please log in</h2>
        <p className="mt-2 text-neutral-600">You must be logged in to create a listing.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-light text-neutral-900 mb-2 tracking-tight">Vorschau & Bestätigung</h2>
        <p className="text-neutral-600 font-light leading-relaxed">Überprüfen Sie Ihre Angaben vor der Veröffentlichung.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Listing Preview */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden">
            <div className="relative">
              <Image
                src={mainImage}
                alt={`${data.brand} ${data.model}` || "Vehicle image"}
                width={800}
                height={600}
                className="w-full h-64 object-cover"
              />
              {isPremium && (
                <Badge className="absolute top-4 left-4 bg-red-500 text-white border-red-500">
                  <Star className="w-4 h-4 mr-1" />
                  Premium
                </Badge>
              )}
            </div>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold">{data.brand} {data.model}</h3>
                  <p className="text-neutral-500">{getCantonName(data.location)}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-red-600">{formatPrice(data.price_per_month_chf)}</p>
                  <p className="text-sm text-neutral-500">pro Monat</p>
                </div>
              </div>

              <hr className="my-6" />

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
                {vehicleDetails.map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-neutral-500">{label}</p>
                    <p className="font-semibold text-neutral-800">{value || '-'}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Plan & Confirmation */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center">
                Gewählter Plan
              </h3>
              
              {planDetails ? (
                <div className="space-y-3">
                  <div className="flex justify-between font-semibold">
                    <span>{planDetails.name}</span>
                    <span>CHF {planPrice.toFixed(2)}</span>
                  </div>
                  <p className="text-sm text-neutral-500 -mt-2">{planDetails.duration_days} Tage</p>

                  {isPremium && (
                    <div className="flex justify-between items-center text-sm pt-2">
                      <div className="flex items-center text-red-600 font-semibold">
                        <Star className="w-4 h-4 mr-2" />
                        <span>Premium Platzierung Aktiv (CHF 30)</span>
                      </div>
                      <span className="font-semibold">+ CHF {PREMIUM_BOOST_PRICE.toFixed(2)}</span>
                    </div>
                  )}

                  <hr className="border-t border-neutral-200 !my-4" />

                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>CHF {total.toFixed(2)}</span>
                  </div>

                </div>
              ) : (
                <p className="text-neutral-500">Kein Plan ausgewählt.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-4 text-red-600 flex items-center">
                <Check className="w-5 h-5 mr-2 text-green-500" />
                Bereit zur Überprüfung
              </h3>
              <ul className="space-y-2 text-sm text-neutral-600 list-disc list-inside">
                <li>Alle Angaben werden von unserem Team überprüft.</li>
                <li>Sie erhalten eine Benachrichtigung sobald Ihr Inserat live ist.</li>
                <li>Dies dauert in der Regel 2-4 Stunden.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={prevStep}>
          Zurück zu den Bildern
        </Button>
        <Button onClick={handleFinish} className="bg-red-500 hover:bg-red-600">
          <Check className="w-4 h-4 mr-2" />
          Inserat erstellen
        </Button>
      </div>
    </div>
  );
}
