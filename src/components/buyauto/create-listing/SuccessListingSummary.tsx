import { useMemo, useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { estimateTeaserMonthlyRateChf } from "@/lib/buyauto/leasingMath";

type SellerType = "private" | "garage";
type DealType = "lease_takeover" | "direct_purchase";
type FinancingType = "cash" | "leasing";

export interface SuccessListingSummaryInput {
  id?: string | null;

  deal_type?: DealType | null;
  financing_type?: FinancingType | null;
  leasing_offer?: unknown | null;

  brand?: string | null;
  model?: string | null;
  title?: string | null;
  year?: number | null;

  mileage_km?: number | null;
  km?: number | null;
  mileage?: number | null;

  body?: string | null;
  fuel?: string | null;
  gearbox?: string | null;

  location?: string | null;
  canton_code?: string | null;

  price_per_month_chf?: number | null;
  remaining_months?: number | null;
  remaining_km?: number | null;
  deposit_chf?: number | null;

  purchase_price_chf?: number | null;

  description?: string | null;

  images?: string[] | null;
  cover_image_index?: number | null;

  premium?: boolean | null;
  price_plan?: string | null;
  status?: string | null;
}

export interface SuccessListingSummaryProps {
  listing: SuccessListingSummaryInput;
  sellerType?: SellerType;
  planLabel?: string | null;
}

function formatChf(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  return `CHF ${value.toLocaleString("de-CH")}`;
}

function formatChfMoney(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  return `CHF ${value.toFixed(2)}`;
}

function formatKm(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  return `${value.toLocaleString("de-CH")} km`;
}

function getNumber(value: unknown): number | null {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(n)) return null;
  return n;
}

function getString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function getDealLabel(dealType: DealType | null): string {
  if (dealType === "direct_purchase") return "Direktkauf";
  if (dealType === "lease_takeover") return "Leasingübernahme";
  return "Inserat";
}

function getSellerLabel(sellerType: SellerType | undefined): string {
  if (sellerType === "garage") return "Garage";
  return "Privat";
}

function getPricing(args: {
  dealType: DealType | null;
  financingType: FinancingType | null;
  purchasePriceChf: number | null;
  pricePerMonthChf: number | null;
  year: number | null;
  mileageKm: number | null;
  leasingOffer: unknown | null;
}): { primary: { label: string; value: string }; secondary?: { label: string; value: string } } {
  const { dealType, financingType, purchasePriceChf, pricePerMonthChf, year, mileageKm, leasingOffer } = args;

  if (dealType === "direct_purchase") {
    const primary = { label: "Kaufpreis", value: formatChf(purchasePriceChf) };

    if (financingType === "leasing") {
      const offer = leasingOffer as Partial<{
        interest_rate_pct: number;
        down_payment_pct: number;
        no_down_payment: boolean;
        min_term_months: number;
        residual_pct_adjustment_pp: number;
      }> | null;

      const interestRatePct = getNumber(offer?.interest_rate_pct);
      const minTermMonths = getNumber(offer?.min_term_months) ?? 60;
      const downPaymentPct =
        offer?.no_down_payment === true ? 0 : getNumber(offer?.down_payment_pct) ?? 5;
      const residualAdj = getNumber(offer?.residual_pct_adjustment_pp);

      const canEstimate =
        typeof purchasePriceChf === "number" &&
        typeof year === "number" &&
        typeof mileageKm === "number" &&
        typeof interestRatePct === "number";

      if (canEstimate) {
        const teaser = estimateTeaserMonthlyRateChf({
          priceChf: purchasePriceChf,
          year,
          mileageKm,
          interestRatePct,
          residualPctAdjustmentPp: residualAdj,
          termMonths: minTermMonths,
          downPaymentPct,
        });

        if (typeof teaser === "number" && Number.isFinite(teaser) && teaser > 0) {
          return {
            primary,
            secondary: { label: "Leasing ab", value: `CHF ${teaser.toLocaleString("de-CH")} / Monat` },
          };
        }
      }

      return { primary };
    }

    return { primary };
  }

  const primary = {
    label: "Monatliche Rate",
    value: pricePerMonthChf ? `${formatChf(pricePerMonthChf)} / Monat` : "-",
  };
  return { primary };
}

export function SuccessListingSummary({ listing, sellerType, planLabel }: SuccessListingSummaryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const brand = getString(listing.brand) ?? "-";
  const model = getString(listing.model) ?? "";
  const title = getString(listing.title);
  const dealType = (listing.deal_type ?? null) as DealType | null;
  const financingType = (listing.financing_type ?? null) as FinancingType | null;

  const year = getNumber(listing.year);
  const mileageKm = getNumber(listing.mileage_km ?? listing.km ?? listing.mileage);

  const purchasePriceChf = getNumber(listing.purchase_price_chf);
  const pricePerMonthChf = getNumber(listing.price_per_month_chf);

  const images = Array.isArray(listing.images) ? listing.images.filter((u) => typeof u === "string" && u.length > 0) : [];
  const coverIndexRaw = getNumber(listing.cover_image_index);
  const coverIndex = typeof coverIndexRaw === "number" ? Math.max(0, Math.min(images.length - 1, coverIndexRaw)) : 0;

  const safeActiveIndex = images.length > 0 ? Math.max(0, Math.min(images.length - 1, activeIndex)) : 0;
  const mainImageUrl = images[safeActiveIndex] ?? images[coverIndex] ?? null;

  const pricing = useMemo(() => {
    return getPricing({
      dealType,
      financingType,
      purchasePriceChf,
      pricePerMonthChf,
      year,
      mileageKm,
      leasingOffer: listing.leasing_offer ?? null,
    });
  }, [dealType, financingType, purchasePriceChf, pricePerMonthChf, year, mileageKm, listing.leasing_offer]);

  const sections = useMemo(() => {
    const out: Array<{ title: string; rows: Array<{ label: string; value: string }> }> = [];

    const fahrzeugRows: Array<{ label: string; value: string }> = [];
    if (typeof year === "number") fahrzeugRows.push({ label: "Baujahr", value: String(year) });
    if (typeof mileageKm === "number") fahrzeugRows.push({ label: "Kilometer", value: formatKm(mileageKm) });
    if (getString(listing.body)) fahrzeugRows.push({ label: "Karosserie", value: String(listing.body) });
    if (getString(listing.fuel)) fahrzeugRows.push({ label: "Antrieb", value: String(listing.fuel) });
    if (getString(listing.gearbox)) fahrzeugRows.push({ label: "Getriebe", value: String(listing.gearbox) });

    const locationLabel = getString(listing.location) ?? getString(listing.canton_code);
    if (locationLabel) fahrzeugRows.push({ label: "Standort", value: locationLabel });

    if (fahrzeugRows.length > 0) out.push({ title: "Fahrzeug", rows: fahrzeugRows });

    const angebotRows: Array<{ label: string; value: string }> = [];

    if (dealType === "direct_purchase") {
      if (typeof purchasePriceChf === "number") angebotRows.push({ label: "Kaufpreis", value: formatChf(purchasePriceChf) });

      if (financingType === "leasing") {
        if (pricing.secondary) angebotRows.push({ label: pricing.secondary.label, value: pricing.secondary.value });

        const offer = listing.leasing_offer as Partial<{
          interest_rate_pct: number;
          down_payment_pct: number;
          no_down_payment: boolean;
          min_term_months: number;
          max_term_months: number;
          km_options: number[];
          residual_pct_adjustment_pp: number;
        }> | null;

        const interestRatePct = getNumber(offer?.interest_rate_pct);
        if (typeof interestRatePct === "number") angebotRows.push({ label: "Zinssatz", value: `${interestRatePct}%` });

        if (offer?.no_down_payment === true) {
          angebotRows.push({ label: "Anzahlung", value: "Keine Anzahlung" });
        } else {
          const downPaymentPct = getNumber(offer?.down_payment_pct);
          if (typeof downPaymentPct === "number") angebotRows.push({ label: "Anzahlung", value: `${downPaymentPct}%` });
        }

        const minTerm = getNumber(offer?.min_term_months);
        const maxTerm = getNumber(offer?.max_term_months);
        if (typeof minTerm === "number" && typeof maxTerm === "number") {
          angebotRows.push({ label: "Laufzeit", value: `${minTerm}–${maxTerm} Monate` });
        } else if (typeof minTerm === "number") {
          angebotRows.push({ label: "Laufzeit", value: `${minTerm} Monate` });
        }

        if (Array.isArray(offer?.km_options) && offer!.km_options!.length > 0) {
          const opts = offer!.km_options!.filter((n) => typeof n === "number" && Number.isFinite(n));
          if (opts.length > 0) {
            angebotRows.push({ label: "KM-Optionen", value: opts.map((n) => `${n.toLocaleString("de-CH")} km/Jahr`).join(", ") });
          }
        }

        const residualAdj = getNumber(offer?.residual_pct_adjustment_pp);
        if (typeof residualAdj === "number" && residualAdj !== 0) {
          angebotRows.push({ label: "Restwert Anpassung", value: `${residualAdj > 0 ? "+" : ""}${residualAdj} Prozentpunkte` });
        }
      }
    }

    if (dealType === "lease_takeover") {
      if (typeof pricePerMonthChf === "number") angebotRows.push({ label: "Monatliche Rate", value: `${formatChf(pricePerMonthChf)} / Monat` });

      const remainingMonths = getNumber(listing.remaining_months);
      if (typeof remainingMonths === "number") angebotRows.push({ label: "Restlaufzeit", value: `${remainingMonths} Monate` });

      const remainingKm = getNumber(listing.remaining_km);
      if (typeof remainingKm === "number") angebotRows.push({ label: "Verbleibende KM", value: formatKm(remainingKm) });

      const depositChf = getNumber(listing.deposit_chf);
      if (typeof depositChf === "number") angebotRows.push({ label: "Depot / Anzahlung", value: formatChf(depositChf) });
    }

    if (angebotRows.length > 0) out.push({ title: "Angebot", rows: angebotRows });

    const listingRows: Array<{ label: string; value: string }> = [];
    listingRows.push({ label: "Inserat-Typ", value: getDealLabel(dealType) });
    if (sellerType) listingRows.push({ label: "Verkäufer", value: getSellerLabel(sellerType) });
    if (typeof listing.premium === "boolean") listingRows.push({ label: "Premium", value: listing.premium ? "Ja" : "Nein" });
    if (planLabel) listingRows.push({ label: "Plan", value: planLabel });

    if (listingRows.length > 0) out.push({ title: "Inserat", rows: listingRows });

    return out;
  }, [dealType, financingType, listing, mileageKm, planLabel, pricing.secondary, pricePerMonthChf, purchasePriceChf, sellerType, year]);

  const description = getString(listing.description);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl overflow-hidden border border-neutral-200/60 shadow-lg bg-white">
        <div className="relative">
          <div className="relative w-full aspect-[16/10] bg-neutral-100">
            {mainImageUrl ? (
              <Image
                src={mainImageUrl}
                alt={`${brand} ${model}`.trim() || "Fahrzeug"}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 768px"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-neutral-500">
                Keine Fotos verfügbar
              </div>
            )}
          </div>

          <div className="absolute left-4 top-4 flex gap-2">
            <Badge className="bg-white/80 text-neutral-900 border-white/60 backdrop-blur">
              {getDealLabel(dealType)}
            </Badge>
            {sellerType && (
              <Badge className="bg-white/80 text-neutral-900 border-white/60 backdrop-blur">
                {getSellerLabel(sellerType)}
              </Badge>
            )}
            {listing.premium ? (
              <Badge className="bg-red-500 text-white border-red-500">Premium</Badge>
            ) : null}
          </div>
        </div>

        {images.length > 1 ? (
          <div className="p-4">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((url, idx) => (
                <button
                  key={`${url}-${idx}`}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={cn(
                    "relative h-16 w-24 shrink-0 overflow-hidden rounded-2xl border transition",
                    idx === safeActiveIndex ? "border-primary ring-2 ring-primary/20" : "border-neutral-200 hover:border-neutral-300"
                  )}
                  aria-label={idx === coverIndex ? "Titelbild" : `Foto ${idx + 1}`}
                >
                  <Image src={url} alt={`Foto ${idx + 1}`} fill className="object-cover" sizes="96px" />
                  {idx === coverIndex ? (
                    <span className="absolute left-1 top-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white">
                      Titelbild
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="px-6 pb-6">
          <div className="pt-6">
            <div className="text-2xl font-bold tracking-tight text-neutral-900">
              {brand} {model}
            </div>
            {title ? <div className="mt-1 text-sm text-neutral-600">{title}</div> : null}
          </div>

          <Separator className="my-6" />

          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-1">
              <div className="text-sm text-neutral-500">{pricing.primary.label}</div>
              <div className="mt-1 text-2xl font-bold tracking-tight text-neutral-900">
                {pricing.primary.value}
              </div>
              {pricing.secondary ? (
                <div className="mt-2 text-sm font-medium text-neutral-700">
                  {pricing.secondary.label}: <span className="text-neutral-900">{pricing.secondary.value}</span>
                </div>
              ) : null}
            </div>

            <div className="md:col-span-2 grid gap-6 sm:grid-cols-2">
              {sections.map((section) => (
                <div key={section.title} className="space-y-3">
                  <div className="text-sm font-semibold text-neutral-900">{section.title}</div>
                  <div className="space-y-2">
                    {section.rows.map((row) => (
                      <div key={`${section.title}-${row.label}`} className="flex items-start justify-between gap-3">
                        <div className="text-sm text-neutral-600">{row.label}</div>
                        <div className="text-sm font-medium text-neutral-900 text-right">{row.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {description ? (
            <>
              <Separator className="my-6" />
              <div className="space-y-2">
                <div className="text-sm font-semibold text-neutral-900">Beschreibung</div>
                <div className="text-sm text-neutral-700 whitespace-pre-line">{description}</div>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {typeof listing.price_per_month_chf === "number" || typeof listing.purchase_price_chf === "number" ? (
        <Card className="rounded-3xl border-neutral-200/60 shadow-sm">
          <CardContent className="p-6">
            <div className="text-sm font-semibold text-neutral-900">Preise (Details)</div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-neutral-600">Kaufpreis</div>
                <div className="text-sm font-medium text-neutral-900">{formatChf(purchasePriceChf)}</div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-neutral-600">Rate / Monat</div>
                <div className="text-sm font-medium text-neutral-900">
                  {pricePerMonthChf ? `${formatChf(pricePerMonthChf)} / Monat` : "-"}
                </div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-neutral-600">Depot / Anzahlung</div>
                <div className="text-sm font-medium text-neutral-900">{formatChf(getNumber(listing.deposit_chf))}</div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-neutral-600">Premium</div>
                <div className="text-sm font-medium text-neutral-900">{listing.premium ? "Ja" : "Nein"}</div>
              </div>
            </div>

            {planLabel ? (
              <div className="mt-4 text-sm text-neutral-600">
                Plan: <span className="font-medium text-neutral-900">{planLabel}</span>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}