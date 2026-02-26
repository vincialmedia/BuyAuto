import { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useWizard } from './ListingWizard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Check, Star, AlertCircle, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { pricingPlans, PREMIUM_BOOST_PRICE } from '@/lib/buyauto/stripe_config';
import type { Plan } from '@/lib/buyauto/stripe_config';
import { cantons } from '@/lib/buyauto/data';
import { useToast } from '@/hooks/use-toast';
import { getListingByIdForOwner } from "@/services/createListingService";
import type { PaymentIntent } from '@stripe/stripe-js';
import { supabase } from '@/integrations/supabase/client';
import { useRouter } from 'next/router';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { estimateTeaserMonthlyRateChf } from "@/lib/buyauto/leasingMath";

interface PaymentIntentWithMetadata extends PaymentIntent {
  metadata: {
    listing_id: string;
    [key: string]: any;
  };
}

const PaymentWidget = dynamic(
  () => import('./PaymentWidget'),
  { 
    ssr: false,
    loading: () => (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-2 text-neutral-600">Loading payment form...</p>
      </div>
    )
  }
);

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

type LeaseTakeoverOfferShape = Partial<{
  enabled: boolean;
  price_per_month_chf: number;
  remaining_months: number;
  remaining_km: number;
  deposit_chf: number;
  pickup_canton_code: string;
}>;

type LeasingOfferShape = Partial<{
  enabled: boolean;
  interest_rate_pct: number;
  down_payment_pct: number;
  no_down_payment: boolean;
  min_term_months: number;
  max_term_months: number;
  km_options: number[];
  residual_pct_adjustment_pp: number;
  lease_takeover_offer: LeaseTakeoverOfferShape;
}>;

type PreviewVariant =
  | "lease_takeover"
  | "direct_purchase_cash"
  | "direct_purchase_leasing"
  | "unknown";

function getNumber(value: unknown): number | null {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(n)) return null;
  return n;
}

const DUMMY_IMAGE_URL = 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=600&fit=crop';

export default function Step5_PreviewAndPay() {
  const { data, updateData, prevStep, setIsComplete } = useWizard();
  const { user, loading: userLoading, profile } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isPreparingPayment, setIsPreparingPayment] = useState(false);
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  const [isPublishingGarage, setIsPublishingGarage] = useState(false);
  const [garagePublishError, setGaragePublishError] = useState<{
    message: string;
    code?: string | null;
    details?: string | null;
    hint?: string | null;
  } | null>(null);

  const isGarage = profile?.role === 'garage';

  const dealType = data.deal_type ?? "direct_purchase";
  const financingType = dealType === "direct_purchase" ? (data.financing_type ?? "cash") : null;

  const leasingOffer = (data.leasing_offer ?? null) as unknown as LeasingOfferShape | null;
  const leasingEnabled = leasingOffer?.enabled === true;
  const takeoverOfferEnabled = leasingOffer?.lease_takeover_offer?.enabled === true;
  const takeoverOffer = takeoverOfferEnabled ? (leasingOffer?.lease_takeover_offer ?? null) : null;

  const previewVariant: PreviewVariant =
    dealType === "lease_takeover"
      ? "lease_takeover"
      : dealType === "direct_purchase"
        ? (financingType === "leasing" ? "direct_purchase_leasing" : "direct_purchase_cash")
        : "unknown";

  const takeoverMonthlyRateChf = takeoverOffer ? getNumber(takeoverOffer.price_per_month_chf) : null;

  const selectedPlanId = data.price_plan as Plan | undefined;
  const isPremium = data.premium || false;

  const planDetails = selectedPlanId ? pricingPlans[selectedPlanId] : null;
  const planPrice = planDetails ? planDetails.price : 0;
  const total = isGarage ? 0 : (planPrice + (isPremium ? PREMIUM_BOOST_PRICE : 0));

  const purchasePriceForDisplayChf =
    typeof (data as any)?.purchase_price_chf === "number"
      ? (data as any).purchase_price_chf
      : dealType === "direct_purchase" && typeof (data as any)?.price_per_month_chf === "number"
        ? (data as any).price_per_month_chf
        : undefined;

  // Compute capability label
  let capabilityLabel = "";
  if (dealType === "lease_takeover") {
    capabilityLabel = "pro Monat";
  } else {
    // direct purchase
    if (financingType === "leasing" && takeoverOfferEnabled) {
      capabilityLabel = "Leasing & Leasing Übernahme möglich";
    } else if (financingType === "leasing") {
      capabilityLabel = "Leasing möglich";
    } else if (takeoverOfferEnabled) {
      capabilityLabel = "Leasing Übernahme möglich";
    }
    // cash only -> blank
  }

  const mainImage = data.images?.[0] || DUMMY_IMAGE_URL;

  const vehicleDetails = [
    { label: "Baujahr", value: data.year },
    { label: "Kilometer", value: formatMileage(data.km) },
    { label: "Karosserie", value: data.body },
    { label: "Antrieb", value: data.fuel },
    { label: "Getriebe", value: data.gearbox },
  ];

  const offerDetails =
    previewVariant === "lease_takeover"
      ? [
          { label: "Restlaufzeit", value: data.remaining_months ? `${data.remaining_months} Monate` : "-" },
          { label: "Depot / Anzahlung", value: typeof data.deposit_chf === "number" ? `CHF ${data.deposit_chf.toLocaleString("de-CH")}` : "-" },
          ...(typeof data.remaining_km === "number"
            ? [{ label: "Verbleibende KM", value: `${data.remaining_km.toLocaleString("de-CH")} km` }]
            : []),
        ]
      : [
          { label: "Finanzierung", value: financingType === "leasing" ? "Leasing" : "Cash" },
          {
            label: "Kaufpreis",
            value: typeof purchasePriceForDisplayChf === "number" ? `CHF ${purchasePriceForDisplayChf.toLocaleString("de-CH")}` : "-",
          },
          ...(financingType === "leasing"
            ? [
                ...(typeof (leasingOffer as any)?.interest_rate_pct === "number"
                  ? [{ label: "Zinssatz", value: `${(leasingOffer as any).interest_rate_pct}%` }]
                  : []),
                ...((leasingOffer as any)?.no_down_payment === true
                  ? [{ label: "Anzahlung", value: "Keine Anzahlung" }]
                  : typeof (leasingOffer as any)?.down_payment_pct === "number"
                    ? [{ label: "Anzahlung", value: `${(leasingOffer as any).down_payment_pct}%` }]
                    : []),
                ...(typeof (leasingOffer as any)?.min_term_months === "number" || typeof (leasingOffer as any)?.max_term_months === "number"
                  ? [
                      {
                        label: "Laufzeit",
                        value:
                          typeof (leasingOffer as any)?.min_term_months === "number" && typeof (leasingOffer as any)?.max_term_months === "number"
                            ? `${(leasingOffer as any).min_term_months}–${(leasingOffer as any).max_term_months} Monate`
                            : typeof (leasingOffer as any)?.min_term_months === "number"
                              ? `${(leasingOffer as any).min_term_months} Monate`
                              : typeof (leasingOffer as any)?.max_term_months === "number"
                                ? `${(leasingOffer as any).max_term_months} Monate`
                                : "-",
                      },
                    ]
                  : []),
                ...(Array.isArray((leasingOffer as any)?.km_options) && (leasingOffer as any).km_options.length > 0
                  ? [
                      {
                        label: "KM-Optionen",
                        value: ((leasingOffer as any).km_options as number[])
                          .filter((n) => typeof n === "number" && Number.isFinite(n))
                          .map((n) => `${n.toLocaleString("de-CH")} km/Jahr`)
                          .join(", "),
                      },
                    ]
                  : []),
              ]
            : []),
        ];

  const takeoverOfferDetails =
    previewVariant !== "lease_takeover" && takeoverOfferEnabled
      ? [
          { label: "Monatliche Rate", value: typeof takeoverMonthlyRateChf === "number" ? `CHF ${takeoverMonthlyRateChf.toLocaleString("de-CH")} / Monat` : "-" },
          { label: "Restlaufzeit", value: typeof takeoverOffer?.remaining_months === "number" ? `${takeoverOffer.remaining_months} Monate` : "-" },
          { label: "Depot / Anzahlung", value: typeof takeoverOffer?.deposit_chf === "number" ? `CHF ${takeoverOffer.deposit_chf.toLocaleString("de-CH")}` : "-" },
          ...(typeof takeoverOffer?.remaining_km === "number"
            ? [{ label: "Verbleibende KM", value: `${takeoverOffer.remaining_km.toLocaleString("de-CH")} km` }]
            : []),
          ...(typeof takeoverOffer?.pickup_canton_code === "string" && takeoverOffer.pickup_canton_code.length > 0
            ? [{ label: "Abholung", value: getCantonName(takeoverOffer.pickup_canton_code) }]
            : []),
        ]
      : [];

  const leasingTeaser = useMemo(() => {
    if (dealType === "direct_purchase" && financingType === "leasing" && purchasePriceForDisplayChf && data.year && data.km && leasingOffer) {
        const interestRatePct = getNumber(leasingOffer.interest_rate_pct);
        const minTermMonths = getNumber(leasingOffer.min_term_months) ?? 60;
        const noDownPayment = leasingOffer.no_down_payment === true;
        const downPaymentPct = noDownPayment ? 0 : getNumber(leasingOffer.down_payment_pct) ?? 5;
        const residualAdj = getNumber(leasingOffer.residual_pct_adjustment_pp);

        const canEstimate =
          typeof purchasePriceForDisplayChf === "number" &&
          typeof data.year === "number" &&
          typeof data.km === "number" &&
          typeof interestRatePct === "number";

        if (canEstimate) {
          const teaser = estimateTeaserMonthlyRateChf({
            priceChf: purchasePriceForDisplayChf,
            year: Number(data.year),
            mileageKm: Number(data.km),
            interestRatePct: interestRatePct!,
            residualPctAdjustmentPp: residualAdj,
            termMonths: minTermMonths,
            downPaymentPct,
          });
          return teaser;
        }
    }
    return null;
  }, [dealType, financingType, purchasePriceForDisplayChf, data.year, data.km, leasingOffer]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePaymentConfirmation = useCallback(async (paymentIntentClientSecret: string) => {
    const url = new URL(window.location.href);
    url.searchParams.delete('payment_confirmed');
    url.searchParams.delete('payment_intent_client_secret');
    window.history.replaceState({}, '', url.toString());

    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      console.error('❌ Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
      toast({ 
        title: "Configuration Error", 
        description: "Payment verification unavailable. Please contact support.", 
        variant: 'destructive' 
      });
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    try {
      const { getStripe } = await import('@/lib/stripe');
      const stripe = await getStripe();
      
      if (!stripe) {
        console.error('❌ Failed to initialize Stripe');
        toast({ 
          title: "Configuration Error", 
          description: "Payment system unavailable. Please contact support.", 
          variant: 'destructive' 
        });
        return;
      }

      const { paymentIntent } = await stripe.retrievePaymentIntent(paymentIntentClientSecret);
      
      switch (paymentIntent?.status) {
        case 'succeeded':
          toast({ title: "Zahlung erfolgreich!", description: "Ihr Inserat wird bearbeitet." });
          
          const listingId = (paymentIntent as PaymentIntentWithMetadata).metadata.listing_id;
          if (listingId && user) {
            const freshListingData = await getListingByIdForOwner(listingId, user);
            if (freshListingData) {
              console.log('✅ Storing completed listing data:', freshListingData);
              if (typeof window !== 'undefined') {
                const completedData = {
                  id: freshListingData.id,
                  price_plan: freshListingData.price_plan,
                  premium: freshListingData.premium,
                  price_paid_chf: paymentIntent.amount / 100,
                };
                sessionStorage.setItem('completedListingData', JSON.stringify(completedData));
              }
              updateData(freshListingData);
            }
          }
          setIsComplete(true);
          break;
        case 'processing':
          toast({ title: "Zahlung wird verarbeitet.", description: "Wir informieren Sie, sobald die Zahlung eingegangen ist." });
          break;
        case 'requires_payment_method':
          toast({ title: "Zahlung fehlgeschlagen.", description: "Bitte versuchen Sie eine andere Zahlungsmethode.", variant: 'destructive' });
          setClientSecret(paymentIntentClientSecret);
          break;
        default:
          toast({ title: "Ein Fehler ist aufgetreten.", description: "Bitte versuchen Sie es erneut.", variant: 'destructive' });
          break;
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast({ 
        title: "Fehler", 
        description: "Zahlungsstatus konnte nicht überprüft werden.", 
        variant: 'destructive' 
      });
    }
  }, [user, toast, updateData, setIsComplete]);

  useEffect(() => {
    if (!mounted) return;

    const query = new URLSearchParams(window.location.search);
    if (query.get('payment_confirmed')) {
      const paymentIntentClientSecret = query.get('payment_intent_client_secret');
      if (paymentIntentClientSecret) {
        handlePaymentConfirmation(paymentIntentClientSecret);
      }
    }
  }, [mounted, handlePaymentConfirmation]);

  // PRIVATE USERS: Prepare Stripe Payment
  const handlePreparePayment = async () => {
    if (!mounted || !user) {
      toast({
        title: 'Fehler',
        description: 'Sie müssen angemeldet sein.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!data.id) {
      toast({
        title: 'Fehler',
        description: 'Listing-ID nicht gefunden.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsPreparingPayment(true);

    try {
      if (total === 0) {
        // Free private listing
        const { data: updatedListing, error } = await supabase
          .from('listings')
          .update({ payment_status: 'paid', status: 'pending' })
          .eq('id', data.id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;

        updateData({ payment_status: 'paid' });
        toast({ title: 'Erfolgreich', description: 'Ihr kostenloses Inserat ist bereit.' });
        setIsComplete(true);
        return;
      }

      // Paid private listing
      const response = await fetch('/api/billing/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          listing_id: data.id, 
          plan: selectedPlanId, 
          premium: isPremium 
        }),
      });

      let result: any = null;
      try {
        result = await response.json();
      } catch {
        result = null;
      }

      if (!response.ok) {
        const msg =
          (result && (result.error || result.message)) ||
          (response.status === 401 || response.status === 403
            ? "Nicht autorisiert. Bitte Seite neu laden oder im neuen Tab öffnen und erneut versuchen."
            : `Fehler bei der Vorbereitung (HTTP ${response.status}).`);
        throw new Error(msg);
      }

      const nextClientSecret = result?.clientSecret;
      if (typeof nextClientSecret !== "string" || nextClientSecret.length === 0) {
        throw new Error("Keine Zahlungs-Session erhalten. Bitte Seite neu laden und erneut versuchen.");
      }

      setClientSecret(nextClientSecret);
      setPaymentInitiated(true);

    } catch (error: any) {
      toast({
        title: 'Fehler',
        description: error.message || 'Ein unerwarteter Fehler ist aufgetreten.',
        variant: 'destructive',
      });
    } finally {
      setIsPreparingPayment(false);
    }
  };

  // GARAGE USERS: Publish directly (enforce limits)
  const handleGaragePublish = async () => {
    if (!user || !data.id) return;

    setGaragePublishError(null);
    setIsPublishingGarage(true);
    try {
      // Ensure garage_id is set correctly (RPC enforces listing.garage_id)
      const { data: garageRow, error: garageError } = await supabase
        .from("garages")
        .select("id, listing_limit, plan")
        .eq("owner_user_id", user.id)
        .single();

      if (garageError) throw garageError;

      if (garageRow?.id) {
        const { data: updated, error: updateGarageIdError } = await supabase
          .from("listings")
          .update({ garage_id: garageRow.id, seller_type: "garage" })
          .eq("id", data.id)
          .select("id, garage_id, seller_type")
          .maybeSingle();

        if (updateGarageIdError) throw updateGarageIdError;

        if (!updated?.id) {
          const message =
            "Konnte garage_id nicht setzen. Inserat nicht gefunden oder keine Berechtigung.";
          setGaragePublishError({ message });
          toast({
            title: "Veröffentlichen fehlgeschlagen",
            description: message,
            variant: "destructive",
          });
          return;
        }

        updateData({ garage_id: updated.garage_id ?? garageRow.id, seller_type: "garage" } as any);
      }

      // Call RPC to enforce limit / entitlements
      const { error } = await supabase
        .rpc("publish_garage_listing", { listing_id: data.id });

      if (error) {
        const msg = (error as unknown as { message?: string }).message ?? "Publizieren fehlgeschlagen.";
        const isLimit =
          msg.toLowerCase().includes("limit") ||
          msg.toLowerCase().includes("listing") ||
          msg.toLowerCase().includes("slot") ||
          msg.toLowerCase().includes("quota");

        const description = isLimit
          ? "Du hast das Inserate-Limit deines aktuellen Pakets erreicht. Bitte ändere dein Paket unter „Zahlung“."
          : `Publizieren fehlgeschlagen: ${msg}`;

        setGaragePublishError({
          message: description,
          code: (error as unknown as { code?: string | null }).code ?? null,
          details: (error as unknown as { details?: string | null }).details ?? null,
          hint: (error as unknown as { hint?: string | null }).hint ?? null,
        });

        toast({
          title: "Veröffentlichen fehlgeschlagen",
          description,
          variant: "destructive",
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(isLimit ? `/garage-plan?next=${encodeURIComponent(`/inserat-erstellen?edit=${data.id}`)}` : "/dashboard/garage")}
            >
              {isLimit ? "Paket upgraden" : "Verwalten"}
            </Button>
          ),
        });

        return;
      }

      const { data: publishedRow, error: publishError } = await supabase
        .from("listings")
        .update({ status: "published", seller_type: "garage" })
        .eq("id", data.id)
        .select("id, status, seller_type")
        .maybeSingle();

      if (publishError) throw publishError;

      if (!publishedRow?.id) {
        const message = "Inserat konnte nicht veröffentlicht werden (keine Berechtigung oder Inserat nicht gefunden).";
        setGaragePublishError({ message });
        toast({
          title: "Veröffentlichen fehlgeschlagen",
          description: message,
          variant: "destructive",
          action: (
            <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/garage")}>
              Verwalten
            </Button>
          ),
        });
        return;
      }

      updateData({ status: (publishedRow as any)?.status ?? "published", seller_type: "garage" });

      toast({
        title: "Inserat veröffentlicht!",
        description: "Ihr Inserat ist jetzt live.",
      });
      setIsComplete(true);

    } catch (error: any) {
      console.error("Garage publish error:", error);

      const message =
        typeof error?.message === "string"
          ? error.message
          : "Bitte versuchen Sie es später erneut.";

      const extra = [error?.code ? `Code: ${String(error.code)}` : null, error?.details ? `Details: ${String(error.details)}` : null, error?.hint ? `Hint: ${String(error.hint)}` : null]
        .filter(Boolean)
        .join(" · ");

      setGaragePublishError({
        message,
        code: error?.code ?? null,
        details: error?.details ?? null,
        hint: error?.hint ?? null,
      });

      toast({
        title: "Fehler beim Veröffentlichen",
        description: extra ? `${message} (${extra})` : message,
        variant: "destructive",
        action: (
          <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/garage")}>
            Verwalten
          </Button>
        )
      });
    } finally {
      setIsPublishingGarage(false);
    }
  };

  const handlePaymentSuccess = () => {
    toast({ 
      title: "Zahlung erfolgreich!", 
      description: "Ihr Inserat wird bearbeitet." 
    });
    setIsComplete(true);
  };

  if (!mounted) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-2 text-neutral-600">Laden...</p>
      </div>
    );
  }

  if (!user && !userLoading) {
    return (
      <div className="text-center p-8">
        <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
        <h2 className="mt-4 text-xl font-bold">Bitte anmelden</h2>
        <p className="mt-2 text-neutral-600">Sie müssen angemeldet sein, um fortzufahren.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-light text-neutral-900 mb-2 tracking-tight">
          {paymentInitiated ? 'Bezahlung abschliessen' : (isGarage ? 'Überprüfen & Veröffentlichen' : 'Vorschau & Bezahlung')}
        </h2>
        <p className="text-neutral-600 font-light leading-relaxed">
          {paymentInitiated 
            ? 'Schliessen Sie die Bezahlung ab, um Ihr Inserat zu veröffentlichen.' 
            : (isGarage 
                ? 'Ihr Inserat wird direkt veröffentlicht (sofern Ihr Limit nicht erreicht ist).' 
                : 'Überprüfen Sie Ihre Angaben und schliessen Sie die Bezahlung ab.')
          }
        </p>
      </div>

      {!paymentInitiated ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="overflow-hidden">
                <div className="relative">
                  <div className="relative aspect-[16/10] w-full bg-neutral-100">
                    <Image
                      src={mainImage}
                      alt={`${data.brand} ${data.model}` || "Fahrzeugbild"}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="absolute left-4 top-4 flex gap-2">
                    {isPremium && (
                      <Badge className="bg-gradient-to-r from-primary to-primary/80 text-white border-0">
                        <Star className="w-4 h-4 mr-1" />
                        Premium
                      </Badge>
                    )}
                  </div>
                </div>
                <CardContent className="p-6 md:p-8">
                  {/* Sleek Header */}
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h3 className="text-2xl font-bold tracking-tight text-neutral-900">{data.brand} {data.model}</h3>
                      <p className="text-sm text-neutral-500 mt-1">{getCantonName(data.location) || "-"}</p>
                    </div>
                    <div className="text-right">
                      {previewVariant === "lease_takeover" ? (
                        <>
                          <p className="text-2xl font-bold tracking-tight text-neutral-900">
                            {formatPrice(data.price_per_month_chf)}
                          </p>
                          <p className="text-sm text-neutral-500 mt-1">{capabilityLabel}</p>
                        </>
                      ) : (
                        <>
                          <p className="text-2xl font-bold tracking-tight text-neutral-900">
                            {typeof purchasePriceForDisplayChf === "number" ? formatPrice(purchasePriceForDisplayChf) : "CHF -"}
                          </p>
                          {capabilityLabel && <p className="text-sm text-neutral-500 mt-1">{capabilityLabel}</p>}
                        </>
                      )}
                    </div>
                  </div>

                  <hr className="border-neutral-100 my-8" />

                  {/* Vehicle Details Grid */}
                  <div className="grid grid-cols-2 gap-y-4 gap-x-8 mb-8">
                    {vehicleDetails.map(({ label, value }) => (
                      <div key={label} className="flex justify-between items-center">
                        <span className="text-sm text-neutral-500">{label}</span>
                        <span className="text-sm font-medium text-neutral-900 text-right">{value || '-'}</span>
                      </div>
                    ))}
                  </div>

                  {/* Confirmation Blocks at Bottom */}
                  <div className="space-y-6">
                    {/* Leasing Conditions Block */}
                    {dealType === "direct_purchase" && financingType === "leasing" && leasingOffer && (
                      <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-100">
                        <div className="flex justify-between items-baseline mb-4">
                          <h4 className="font-semibold text-neutral-900 text-sm">Leasing-Konditionen</h4>
                          {leasingTeaser && leasingTeaser > 0 && (
                            <span className="text-sm font-medium text-neutral-900">
                              ab CHF {leasingTeaser.toLocaleString('de-CH')} / Monat
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-1 gap-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-neutral-500">Zinssatz</span>
                            <span className="text-neutral-900">{leasingOffer.interest_rate_pct}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-500">Anzahlung</span>
                            <span className="text-neutral-900">
                              {leasingOffer.no_down_payment ? "Keine Anzahlung" : `${leasingOffer.down_payment_pct}%`}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-500">Laufzeit</span>
                            <span className="text-neutral-900">
                              {leasingOffer.min_term_months}–{leasingOffer.max_term_months} Monate
                            </span>
                          </div>
                          {leasingOffer.km_options && leasingOffer.km_options.length > 0 && (
                            <div className="flex justify-between">
                              <span className="text-neutral-500">KM-Optionen</span>
                              <span className="text-neutral-900 text-right max-w-[50%] truncate">
                                {leasingOffer.km_options.map(k => `${(k/1000).toFixed(0)}k`).join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Lease Takeover Offer Block */}
                    {takeoverOfferEnabled && takeoverOffer && (
                      <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-100">
                        <h4 className="font-semibold text-neutral-900 text-sm mb-4">Leasingübernahme-Angebot</h4>
                        <div className="grid grid-cols-1 gap-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-neutral-500">Monatliche Rate</span>
                            <span className="text-neutral-900 font-medium">CHF {takeoverOffer.price_per_month_chf?.toLocaleString('de-CH')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-500">Restlaufzeit</span>
                            <span className="text-neutral-900">{takeoverOffer.remaining_months} Monate</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-500">Depot / Anzahlung</span>
                            <span className="text-neutral-900">CHF {takeoverOffer.deposit_chf?.toLocaleString('de-CH') ?? '-'}</span>
                          </div>
                          {takeoverOffer.remaining_km && (
                            <div className="flex justify-between">
                              <span className="text-neutral-500">Verbleibende KM</span>
                              <span className="text-neutral-900">{takeoverOffer.remaining_km.toLocaleString('de-CH')} km</span>
                            </div>
                          )}
                          {takeoverOffer.pickup_canton_code && (
                            <div className="flex justify-between">
                              <span className="text-neutral-500">Abholung</span>
                              <span className="text-neutral-900">{getCantonName(takeoverOffer.pickup_canton_code)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Pure Lease Takeover Details */}
                    {dealType === "lease_takeover" && (
                       <div className="grid grid-cols-1 gap-y-2 text-sm pt-2">
                          <div className="flex justify-between">
                            <span className="text-neutral-500">Restlaufzeit</span>
                            <span className="text-neutral-900">{data.remaining_months} Monate</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-500">Depot / Anzahlung</span>
                            <span className="text-neutral-900">CHF {data.deposit_chf?.toLocaleString('de-CH') ?? '-'}</span>
                          </div>
                          {data.remaining_km && (
                            <div className="flex justify-between">
                              <span className="text-neutral-500">Verbleibende KM</span>
                              <span className="text-neutral-900">{data.remaining_km.toLocaleString('de-CH')} km</span>
                            </div>
                          )}
                       </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {/* Only show Price Breakdown for Privates or if cost > 0 (fallback) */}
              {!isGarage && (
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
                              <span>Premium Boost</span>
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
              )}

              {/* Info Card - Different for Garages */}
              <Card>
                <CardContent className="p-6">
                  {isGarage ? (
                    <>
                      <h3 className="font-bold text-lg mb-4 text-blue-600 flex items-center">
                        <Check className="w-5 h-5 mr-2" />
                        Garage Upload
                      </h3>
                      <ul className="space-y-2 text-sm text-neutral-600 list-disc list-inside">
                        <li>Das Inserat wird Ihrem Garagen-Kontingent angerechnet.</li>
                        <li>Veröffentlichung erfolgt sofort.</li>
                        <li>Sie können das Inserat jederzeit im Dashboard verwalten.</li>
                      </ul>
                    </>
                  ) : (
                    <>
                      <h3 className="font-bold text-lg mb-4 text-red-600 flex items-center">
                        <Check className="w-5 h-5 mr-2 text-green-500" />
                        Nach der Bezahlung
                      </h3>
                      <ul className="space-y-2 text-sm text-neutral-600 list-disc list-inside">
                        <li>Alle Angaben werden von unserem Team überprüft.</li>
                        <li>Sie erhalten eine Benachrichtigung sobald Ihr Inserat live ist.</li>
                        <li>Dies dauert in der Regel 2-4 Stunden.</li>
                      </ul>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-between pt-6">
            <Button variant="outline" onClick={prevStep} className="rounded-2xl">
              Zurück
            </Button>
            
            {isGarage ? (
              <div className="flex flex-col items-end gap-3">
                {garagePublishError && (
                  <Alert className="max-w-[520px]" variant="destructive">
                    <AlertTitle>Veröffentlichen fehlgeschlagen</AlertTitle>
                    <AlertDescription>
                      <div className="space-y-1">
                        <div>{garagePublishError.message}</div>
                        {(garagePublishError.code || garagePublishError.details || garagePublishError.hint) && (
                          <div className="text-xs opacity-90">
                            {[garagePublishError.code ? `Code: ${garagePublishError.code}` : null, garagePublishError.details ? `Details: ${garagePublishError.details}` : null, garagePublishError.hint ? `Hint: ${garagePublishError.hint}` : null]
                              .filter(Boolean)
                              .join(" · ")}
                          </div>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <Button 
                  onClick={handleGaragePublish} 
                  disabled={isPublishingGarage}
                  className="rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-white hover:opacity-95 min-w-[200px]"
                >
                  {isPublishingGarage ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Veröffentlichen...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Jetzt Veröffentlichen
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <Button 
                onClick={handlePreparePayment} 
                disabled={isPreparingPayment}
                className="rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-white hover:opacity-95 min-w-[200px]"
              >
                {isPreparingPayment ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Wird geladen...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    {total === 0 ? 'Kostenlos Inserieren' : `Jetzt bezahlen (CHF ${total.toFixed(2)})`}
                  </>
                )}
              </Button>
            )}
          </div>
        </>
      ) : (
        /* Only for Privates entering Payment */
        <>
          {clientSecret && (
            <PaymentWidget 
              clientSecret={clientSecret}
              totalAmount={total}
              onSuccess={handlePaymentSuccess}
            />
          )}
        </>
      )}
    </div>
  );
}
