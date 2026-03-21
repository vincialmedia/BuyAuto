import { GetServerSideProps } from "next";
import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ListingDetail } from "@/lib/buyauto/types";
import { getPublishedListingById, getUserListingById } from "@/services/listingsService";
import { StructuredData } from "@/components/buyauto/StructuredData";
import { estimateTeaserMonthlyRateChf } from "@/lib/buyauto/leasingMath";
import { ListingDetailV2 } from "@/components/buyauto/detail/ListingDetailV2";
import { getGaragePublicById } from "@/services/garageService";
import type { GaragePublicInfo } from "@/services/garageService";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const InquiryForm = dynamic(() => import("@/components/buyauto/detail/InquiryForm"), { ssr: false });

const SimilarListings = dynamic(() => import("@/components/buyauto/detail/SimilarListings"), {
  loading: () => <div className="h-96 bg-neutral-50 animate-pulse rounded-2xl mt-16" />,
});

interface ListingDetailPageProps {
  listing: ListingDetail | null;
  notFound?: boolean;
}

function serializeListing(listing: ListingDetail | null): ListingDetail | null {
  if (!listing) return null;

  return {
    ...listing,
    ui_version: (listing as unknown as { ui_version?: string | null }).ui_version === "v2" ? "v2" : "v1",
    description: listing.description ?? null,
    imageUrl: listing.imageUrl ?? null,
    depositCHF: listing.depositCHF ?? null,
    cover_image_url: (listing as unknown as { cover_image_url?: string | null }).cover_image_url ?? null,
    remaining_km: (listing as unknown as { remaining_km?: number | null }).remaining_km ?? null,
    vin: listing.vin ?? null,
    makeId: listing.makeId ?? null,
    modelId: listing.modelId ?? null,
    variantId: listing.variantId ?? null,
    powerHp: listing.powerHp ?? null,
    drivetrain: listing.drivetrain ?? null,
    firstRegistration: listing.firstRegistration ?? null,
  };
}

export default function ListingDetailPage({ listing: initialListing, notFound }: ListingDetailPageProps) {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();

  const [listing, setListing] = useState<ListingDetail | null>(initialListing);
  const [isLoading, setIsLoading] = useState(!initialListing && !notFound);
  const [clientNotFound, setClientNotFound] = useState(false);
  const [isOwnerPreview, setIsOwnerPreview] = useState(false);

  const [showInquiryForm, setShowInquiryForm] = useState(false);

  const [garage, setGarage] = useState<GaragePublicInfo | null>(null);

  useEffect(() => {
    if (!listing && !notFound && !clientNotFound && id && typeof id === "string") {
      const fetchListing = async () => {
        setIsLoading(true);
        try {
          const isPreview = router.query.preview === "true";

          let fetchedListing = isPreview ? await getUserListingById(id) : await getPublishedListingById(id);

          if (!fetchedListing && isPreview && user) {
            const ownerListing = await getUserListingById(id);
            if (ownerListing) {
              fetchedListing = ownerListing;
              setIsOwnerPreview(true);
            }
          }

          if (!fetchedListing) {
            setClientNotFound(true);
            return;
          }

          setListing(fetchedListing);
        } catch (error) {
          console.error("Error fetching listing:", error);
          setClientNotFound(true);
        } finally {
          setIsLoading(false);
        }
      };

      fetchListing();
    }
  }, [id, listing, notFound, clientNotFound, router.query.preview, user]);

  useEffect(() => {
    const preview = router.query.preview === "true";
    if (!listing?.id) return;
    if (preview) return;
    if (isOwnerPreview) return;
    if (typeof window === "undefined") return;

    const run = async () => {
      let viewerId: string | null = null;

      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) viewerId = null;
        else viewerId = data.user?.id ?? null;
      } catch {
        viewerId = null;
      }

      let viewerKey = viewerId;

      if (!viewerKey) {
        try {
          const existing = window.sessionStorage.getItem("buyauto:anon-viewer");
          if (existing) viewerKey = existing;
          else {
            const created = `anon_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
            window.sessionStorage.setItem("buyauto:anon-viewer", created);
            viewerKey = created;
          }
        } catch {
          viewerKey = null;
        }
      }

      const storageKey = viewerKey ? `buyauto:viewed:${listing.id}:${viewerKey}` : null;

      let shouldCount = true;

      try {
        if (storageKey) {
          if (window.sessionStorage.getItem(storageKey) === "1") shouldCount = false;
          else window.sessionStorage.setItem(storageKey, "1");
        }
      } catch {
        shouldCount = true;
      }

      if (!shouldCount) return;

      void fetch("/api/listings/view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing_id: listing.id }),
      }).catch((error) => {
        console.warn("View tracking failed:", error);
      });
    };

    void run();
  }, [listing?.id, router.query.preview, isOwnerPreview]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!listing) {
        setGarage(null);
        return;
      }

      const garageId = typeof listing.garage_id === "string" ? listing.garage_id : null;
      if (!garageId) {
        setGarage(null);
        return;
      }

      const data = await getGaragePublicById(garageId);
      if (cancelled) return;
      setGarage(data);
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [listing?.id, listing?.garage_id]);

  const images = useMemo(() => (Array.isArray(listing?.images) ? listing?.images : []) ?? [], [listing]);

  if (notFound || clientNotFound) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center px-6">
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">Inserat nicht gefunden</h1>
          <p className="text-neutral-600 mb-6">
            Das gewünschte Inserat existiert nicht oder ist nicht mehr verfügbar.
          </p>
          <Button onClick={() => router.push("/suche")} className="bg-red-500 hover:bg-red-600 text-white rounded-2xl">
            Zurück zur Suche
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || !listing) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="animate-pulse space-y-6">
            <div className="w-32 h-10 bg-neutral-200 rounded-2xl" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-[4/3] bg-neutral-200 rounded-3xl" />
              <div className="space-y-4">
                <div className="w-3/4 h-8 bg-neutral-200 rounded-2xl" />
                <div className="w-1/2 h-6 bg-neutral-200 rounded-2xl" />
                <div className="w-1/3 h-10 bg-neutral-200 rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const baseUrl = process.env.NODE_ENV === "production" ? "https://www.buyauto.ch" : "http://localhost:3000";
  const listingUrl = `${baseUrl}/fahrzeug/${listing.id}`;
  const ogImage = listing.imageUrl || (images.length > 0 ? images[0] : `${baseUrl}/buyauto-logo.png`);

  const dealType = (listing.deal_type ?? "lease_takeover") as "lease_takeover" | "direct_purchase";

  const leasingOffer = (listing as unknown as { leasing_offer?: any; leasingOffer?: any }).leasing_offer ??
    (listing as unknown as { leasing_offer?: any; leasingOffer?: any }).leasingOffer ??
    null;

  const purchasePriceCandidate =
    (listing as unknown as { listing_price?: unknown; price_chf?: unknown; purchase_price_chf?: unknown; purchasePriceCHF?: unknown }).purchasePriceCHF ??
    (listing as unknown as { listing_price?: unknown; price_chf?: unknown; purchase_price_chf?: unknown; purchasePriceCHF?: unknown }).purchase_price_chf ??
    (listing as unknown as { listing_price?: unknown; price_chf?: unknown; purchase_price_chf?: unknown; purchasePriceCHF?: unknown }).price_chf ??
    (listing as unknown as { listing_price?: unknown; price_chf?: unknown; purchase_price_chf?: unknown; purchasePriceCHF?: unknown }).listing_price ??
    null;

  const purchasePriceChf = typeof purchasePriceCandidate === "number" ? purchasePriceCandidate : null;

  const teaserMonthlyChf =
    dealType === "direct_purchase" &&
    leasingOffer?.enabled === true &&
    purchasePriceChf
      ? estimateTeaserMonthlyRateChf({
          priceChf: purchasePriceChf,
          year: listing.year,
          mileageKm: listing.mileageKm,
          interestRatePct: Number(leasingOffer.interest_rate_pct),
          residualPctAdjustmentPp: leasingOffer.residual_pct_adjustment_pp ?? 0,
          termMonths: 60,
          kmPerYear: 10000,
          downPaymentPct: 5,
        })
      : null;

  const teaserMonthlyLabel =
    typeof teaserMonthlyChf === "number"
      ? `Ab CHF ${new Intl.NumberFormat("de-CH", { maximumFractionDigits: 0 }).format(Math.round(teaserMonthlyChf))} / Monat`
      : null;

  const structuredPrice = dealType === "direct_purchase" ? (purchasePriceChf ?? 0) : listing.pricePerMonthCHF;

  const metaPriceText =
    dealType === "direct_purchase"
      ? purchasePriceChf
        ? `${new Intl.NumberFormat("de-CH", { style: "currency", currency: "CHF", maximumFractionDigits: 0 }).format(purchasePriceChf)} Kaufpreis`
        : "Kaufpreis"
      : `${new Intl.NumberFormat("de-CH", { style: "currency", currency: "CHF", maximumFractionDigits: 0 }).format(listing.pricePerMonthCHF)}/Monat`;

  return (
    <>
      <Head>
        <title>{`${listing.brand} ${listing.model} ${listing.year} - BuyAuto`}</title>
        <meta
          name="description"
          content={`${listing.brand} ${listing.model} ${listing.year} für ${metaPriceText} in ${listing.location}. Jetzt Auto-Angebot entdecken!`}
        />
        <link rel="canonical" href={listingUrl} />

        <meta property="og:title" content={`${listing.brand} ${listing.model} ${listing.year} - BuyAuto`} />
        <meta
          property="og:description"
          content={`${listing.brand} ${listing.model} ${listing.year} für ${metaPriceText} in ${listing.location}. Jetzt Auto-Angebot entdecken!`}
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={listingUrl} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={`${listing.brand} ${listing.model} ${listing.year}`} />
        <meta property="og:site_name" content="BuyAuto" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${listing.brand} ${listing.model} ${listing.year} - BuyAuto`} />
        <meta name="twitter:description" content={`${listing.brand} ${listing.model} ${listing.year} - ${metaPriceText}`} />
        <meta name="twitter:image" content={ogImage} />
      </Head>

      <StructuredData
        type="listing"
        listingData={{
          id: listing.id,
          brand: listing.brand,
          model: listing.model,
          year: listing.year,
          price: structuredPrice,
          images: images,
        }}
      />

      <div className="bg-white border-b border-neutral-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button variant="ghost" onClick={() => router.back()} className="flex items-center gap-2 hover:bg-neutral-100">
              <ArrowLeft className="w-4 h-4" />
              Zurück
            </Button>
            <div className="text-sm text-neutral-600">ID: {listing.id.slice(0, 8)}...</div>
          </div>
        </div>
      </div>

      <ListingDetailV2
        listing={listing}
        images={images}
        isOwnerPreview={isOwnerPreview}
        garage={garage}
        teaserMonthlyLabel={teaserMonthlyLabel}
        purchasePriceChf={purchasePriceChf}
        onInquiry={() => setShowInquiryForm(true)}
        childrenBelowFold={
          <>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
              <SimilarListings listing={listing} />
            </div>
          </>
        }
      />

      <InquiryForm
        listingId={listing.id}
        listingTitle={`${listing.brand} ${listing.model} ${listing.year}`}
        open={showInquiryForm}
        onOpenChange={setShowInquiryForm}
      />
    </>
  );
}

export const getServerSideProps: GetServerSideProps<ListingDetailPageProps> = async (context) => {
  const { id } = context.params!;
  const { preview } = context.query;

  if (!id || typeof id !== "string") {
    return { notFound: true };
  }

  try {
    if (preview === "true") {
      return { props: { listing: null } };
    }

    const listing = await (async () => {
      const { data, error } = await (await import("@/integrations/supabase/client")).supabase
        .from("listings_public")
        .select("*, profiles(full_name, avatar_url)")
        .eq("id", id)
        .in("status", ["published", "active", "sold"])
        .single();

      if (error) {
        if ((error as any)?.code === "PGRST116") return null;
        console.error("Error fetching listing by ID (published/sold):", error);
        return null;
      }

      const { transformPublicRowToListingDetail } = await import("@/services/listingsService");
      const baseListing = transformPublicRowToListingDetail(data as any);

      const sellerType = (data as any)?.seller_type ?? null;
      const ownerId = (data as any)?.user_id ?? (data as any)?.created_by ?? null;

      if (sellerType !== "garage" && ownerId) {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: profileRows, error: profError } = await supabase.rpc("get_public_profiles", { p_user_ids: [ownerId] });

        if (profError) {
          console.error("Error fetching public profile for listing owner:", profError);
          return baseListing;
        }

        const row = Array.isArray(profileRows) ? (profileRows[0] as any) : null;
        const fullName = typeof row?.full_name === "string" ? row.full_name : null;
        const avatarUrl = typeof row?.avatar_url === "string" ? row.avatar_url : null;

        return {
          ...baseListing,
          seller_name: fullName ?? baseListing.seller_name ?? null,
          seller_avatar_url: avatarUrl ?? baseListing.seller_avatar_url ?? null,
        };
      }

      return baseListing;
    })();

    if (!listing) {
      return { props: { listing: null } };
    }

    const serializedListing = serializeListing(listing);

    return { props: { listing: serializedListing } };
  } catch (error) {
    console.error("Error in getServerSideProps for [id].tsx:", error);
    return { props: { listing: null } };
  }
};