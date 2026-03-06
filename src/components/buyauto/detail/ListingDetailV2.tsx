import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ListingDetail } from "@/lib/buyauto/types";
import ImageGallery from "@/components/buyauto/detail/ImageGallery";
import { FileText, Gauge, Info, MessageCircle, Settings2, Tag, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { ListingDealTerms } from "@/components/buyauto/detail/ListingDealTerms";
import { GarageMiniBanner, GaragePublicInfo } from "@/components/buyauto/detail/GarageMiniBanner";
import { StickyListingCta } from "@/components/buyauto/detail/StickyListingCta";
import { OwnerMiniProfile } from "@/components/buyauto/detail/OwnerMiniProfile";
import { MessagingPanel } from "@/components/buyauto/detail/MessagingPanel";

function formatChf(value: number): string {
  return new Intl.NumberFormat("de-CH", { style: "currency", currency: "CHF", maximumFractionDigits: 0 }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("de-CH", { maximumFractionDigits: 0 }).format(value);
}

function formatDateDeCh(input: string): string {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  return new Intl.DateTimeFormat("de-CH", { year: "numeric", month: "2-digit", timeZone: "Europe/Zurich" }).format(d);
}

export function ListingDetailV2({
  listing,
  images,
  isOwnerPreview,
  garage,
  teaserMonthlyLabel,
  purchasePriceChf,
  onInquiry,
  childrenBelowFold,
}: {
  listing: ListingDetail;
  images: string[];
  isOwnerPreview: boolean;
  garage: GaragePublicInfo | null;
  teaserMonthlyLabel: string | null;
  purchasePriceChf: number | null;
  onInquiry: () => void;
  childrenBelowFold?: React.ReactNode;
}) {
  const [showSpecs, setShowSpecs] = useState(true);

  const dealType = (listing.deal_type ?? "lease_takeover") as "lease_takeover" | "direct_purchase";
  const keyChips = useMemo(() => {
    const chips: { label: string; value: string }[] = [];

    if (listing.year) chips.push({ label: "Baujahr", value: String(listing.year) });
    if (typeof listing.mileageKm === "number") chips.push({ label: "KM", value: `${formatNumber(listing.mileageKm)} km` });
    if (listing.fuel) chips.push({ label: "Treibstoff", value: String(listing.fuel) });
    if (listing.gearbox) chips.push({ label: "Getriebe", value: String(listing.gearbox) });

    return chips.slice(0, 4);
  }, [listing.year, listing.mileageKm, listing.fuel, listing.gearbox]);

  const primaryPriceLabel =
    dealType === "direct_purchase"
      ? typeof purchasePriceChf === "number"
        ? formatChf(purchasePriceChf)
        : "Preis auf Anfrage"
      : formatChf(listing.pricePerMonthCHF);

  const primaryPriceSub =
    dealType === "direct_purchase"
      ? "Kaufpreis"
      : "pro Monat";

  const chatScroll = () => {
    const el = document.getElementById("messages");
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      <div id="listing-hero-sentinel" className="h-px w-px" />

      {isOwnerPreview && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="text-sm text-amber-900">
              Vorschau: Dieses Inserat ist noch nicht veröffentlicht und nur für dich sichtbar.
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-3xl shadow-sm border border-neutral-200/60 overflow-hidden">
              <ImageGallery
                images={images}
                brand={listing.brand}
                model={listing.model}
                premium={listing.premium}
              />
            </div>

            {garage && (
              <GarageMiniBanner garage={garage} fallbackLocation={listing.location ?? null} />
            )}

            <div className="bg-white rounded-3xl border border-neutral-200/60 shadow-sm p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
                    {listing.brand} {listing.model}
                  </h1>
                  <p className="mt-1 text-sm text-neutral-600">{listing.location}</p>
                </div>
                {listing.premium && (
                  <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-900">
                    <Zap className="h-3.5 w-3.5" />
                    Premium
                  </div>
                )}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {keyChips.map((c) => (
                  <span key={c.label} className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-700">
                    <span className="text-neutral-500 mr-2">{c.label}</span>
                    <span className="text-neutral-900">{c.value}</span>
                  </span>
                ))}
                <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-700">
                  <Tag className="h-3.5 w-3.5 mr-2 text-neutral-600" />
                  {dealType === "direct_purchase" ? "Direktkauf" : "Leasingübernahme"}
                </span>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-neutral-200/60 bg-neutral-50 p-4">
                  <div className="text-sm text-neutral-600">{primaryPriceSub}</div>
                  <div className="mt-1 text-2xl font-bold text-neutral-900">{primaryPriceLabel}</div>
                  {dealType !== "direct_purchase" && typeof listing.depositCHF === "number" && (
                    <div className="mt-2 text-sm text-neutral-600">
                      Kaution: <span className="font-semibold text-neutral-900">{listing.depositCHF > 0 ? formatChf(listing.depositCHF) : "Keine"}</span>
                    </div>
                  )}
                  {dealType === "direct_purchase" && teaserMonthlyLabel && (
                    <div className="mt-2 text-sm text-neutral-600">{teaserMonthlyLabel}</div>
                  )}
                </div>

                <div className="rounded-2xl border border-neutral-200/60 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-neutral-900">Kontakt</div>
                    <Button variant="outline" className="rounded-2xl border-neutral-200" onClick={chatScroll}>
                      Chat öffnen
                    </Button>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <Button
                      onClick={onInquiry}
                      className="flex-1 rounded-2xl bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl transition-all"
                      size="lg"
                    >
                      <MessageCircle className="h-5 w-5 mr-2" />
                      Jetzt anfragen
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <ListingDealTerms
              listing={listing}
              purchasePriceChf={purchasePriceChf}
              teaserMonthlyLabel={teaserMonthlyLabel}
            />

            {listing.description && listing.description.trim() && (
              <section className="bg-white rounded-3xl border border-neutral-200/60 shadow-sm p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-neutral-100 rounded-2xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-neutral-700" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">Beschreibung</h2>
                </div>
                <p className="text-neutral-700 leading-relaxed whitespace-pre-wrap">{listing.description}</p>
              </section>
            )}

            <section className="bg-white rounded-3xl border border-neutral-200/60 shadow-sm p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-neutral-100 rounded-2xl flex items-center justify-center">
                    <Info className="w-5 h-5 text-neutral-700" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">Alle Angaben</h2>
                </div>
                <Button variant="outline" className="rounded-2xl border-neutral-200" onClick={() => setShowSpecs((v) => !v)}>
                  {showSpecs ? "Ausblenden" : "Einblenden"}
                </Button>
              </div>

              {showSpecs && (
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="rounded-2xl border border-neutral-200/60 bg-neutral-50 p-4">
                    <div className="flex items-center gap-2 text-neutral-600">
                      <Gauge className="h-4 w-4" />
                      Kilometerstand
                    </div>
                    <div className="mt-1 font-semibold text-neutral-900">{formatNumber(listing.mileageKm)} km</div>
                  </div>

                  <div className="rounded-2xl border border-neutral-200/60 bg-neutral-50 p-4">
                    <div className="flex items-center gap-2 text-neutral-600">
                      <Settings2 className="h-4 w-4" />
                      Karosserie
                    </div>
                    <div className="mt-1 font-semibold text-neutral-900">{listing.body}</div>
                  </div>

                  {listing.vin && (
                    <div className="rounded-2xl border border-neutral-200/60 bg-neutral-50 p-4">
                      <div className="text-neutral-600">VIN</div>
                      <div className="mt-1 font-semibold text-neutral-900 break-all">{listing.vin}</div>
                    </div>
                  )}

                  {typeof listing.powerHp === "number" && (
                    <div className="rounded-2xl border border-neutral-200/60 bg-neutral-50 p-4">
                      <div className="text-neutral-600">Leistung</div>
                      <div className="mt-1 font-semibold text-neutral-900">{formatNumber(listing.powerHp)} PS</div>
                    </div>
                  )}

                  {listing.drivetrain && (
                    <div className="rounded-2xl border border-neutral-200/60 bg-neutral-50 p-4">
                      <div className="text-neutral-600">Antrieb</div>
                      <div className="mt-1 font-semibold text-neutral-900">{listing.drivetrain}</div>
                    </div>
                  )}

                  {listing.firstRegistration && (
                    <div className="rounded-2xl border border-neutral-200/60 bg-neutral-50 p-4">
                      <div className="text-neutral-600">Erstzulassung</div>
                      <div className="mt-1 font-semibold text-neutral-900">{formatDateDeCh(listing.firstRegistration)}</div>
                    </div>
                  )}
                </div>
              )}
            </section>

            {childrenBelowFold}
          </div>

          <div className="lg:col-span-5 space-y-6">
            <Card className="border-neutral-200/60 shadow-sm bg-white rounded-3xl">
              <CardContent className="p-6 sm:p-8">
                <div className="text-sm font-semibold text-neutral-900">Anbieter</div>
                <div className="mt-4">
                  <OwnerMiniProfile
                    sellerType={(listing as unknown as { seller_type?: string | null }).seller_type ?? null}
                    name={
                      ((listing as unknown as { seller_name?: string | null }).seller_name ?? null) ||
                      ((listing as unknown as { garage_name?: string | null }).garage_name ?? null)
                    }
                    location={(listing.location ?? null) as unknown as string | null}
                    avatarUrl={(() => {
                      const sellerType = (listing as unknown as { seller_type?: string | null }).seller_type;
                      const garageId = (listing as unknown as { garage_id?: string | null }).garage_id;
                      const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
                      if (sellerType === "garage" && garageId && base) {
                        const path = `garage-logos/${garageId}/logo_medium.webp`
                          .split("/")
                          .map((seg) => encodeURIComponent(seg))
                          .join("/");
                        return `${base}/storage/v1/object/public/listing-images/${path}`;
                      }
                      return (listing as unknown as { seller_avatar_url?: string | null }).seller_avatar_url ?? null;
                    })()}
                  />
                </div>
              </CardContent>
            </Card>

            <div id="messages" className="scroll-mt-24">
              <MessagingPanel listingId={listing.id} listingTitle={`${listing.brand} ${listing.model} ${listing.year}`} />
            </div>
          </div>
        </div>
      </div>

      <StickyListingCta
        sentinelId="listing-hero-sentinel"
        onInquiry={onInquiry}
        onOpenChat={chatScroll}
      />
    </div>
  );
}