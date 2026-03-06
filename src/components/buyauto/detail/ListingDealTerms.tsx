import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { ListingDetail, LeasingOffer } from "@/lib/buyauto/types";
import { Banknote, CalendarClock, CreditCard, Gauge, Percent, ShieldCheck, Timer, Wallet } from "lucide-react";

function formatChf(value: number): string {
  return new Intl.NumberFormat("de-CH", { style: "currency", currency: "CHF", maximumFractionDigits: 0 }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("de-CH", { maximumFractionDigits: 0 }).format(value);
}

function asLeasingOffer(listing: ListingDetail): LeasingOffer | null {
  const offer = (listing as unknown as { leasing_offer?: unknown }).leasing_offer ?? null;
  if (!offer || typeof offer !== "object") return null;
  return offer as LeasingOffer;
}

export function ListingDealTerms({
  listing,
  purchasePriceChf,
  teaserMonthlyLabel,
}: {
  listing: ListingDetail;
  purchasePriceChf: number | null;
  teaserMonthlyLabel: string | null;
}) {
  const dealType = (listing.deal_type ?? "lease_takeover") as "lease_takeover" | "direct_purchase";
  const financingType = (listing.financing_type ?? null) as "cash" | "leasing" | null;
  const leasingOffer = asLeasingOffer(listing);

  if (dealType === "lease_takeover") {
    const monthly = listing.pricePerMonthCHF;
    const months = listing.remainingMonths;
    const deposit = listing.depositCHF ?? null;

    return (
      <section className="bg-white rounded-3xl border border-neutral-200/60 shadow-sm p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">Konditionen</h2>
            <p className="mt-1 text-sm text-neutral-600">Leasingübernahme</p>
          </div>
          <Badge className="rounded-full px-3 py-1 text-xs" variant="secondary">
            Lease Takeover
          </Badge>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-neutral-200/60 bg-neutral-50 p-4">
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <CreditCard className="h-4 w-4" />
              Monatspreis
            </div>
            <div className="mt-1 text-2xl font-bold text-neutral-900">{formatChf(monthly)}</div>
          </div>

          <div className="rounded-2xl border border-neutral-200/60 bg-neutral-50 p-4">
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <Timer className="h-4 w-4" />
              Restlaufzeit
            </div>
            <div className="mt-1 text-2xl font-bold text-neutral-900">{formatNumber(months)} Monate</div>
          </div>

          <div className="rounded-2xl border border-neutral-200/60 bg-neutral-50 p-4">
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <Wallet className="h-4 w-4" />
              Kaution
            </div>
            <div className="mt-1 text-lg font-semibold text-neutral-900">
              {typeof deposit === "number" && deposit > 0 ? formatChf(deposit) : "Keine"}
            </div>
          </div>

          {typeof listing.remaining_km === "number" && (
            <div className="rounded-2xl border border-neutral-200/60 bg-neutral-50 p-4">
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <Gauge className="h-4 w-4" />
                Verbleibende KM
              </div>
              <div className="mt-1 text-lg font-semibold text-neutral-900">{formatNumber(listing.remaining_km)} km</div>
            </div>
          )}
        </div>

        <Separator className="my-6" />

        <div className="text-sm text-neutral-600 leading-relaxed">
          Alle Konditionen basieren auf den Angaben beim Inserat-Erstellen. Details werden im Austausch mit Anbieter:in final bestätigt.
        </div>
      </section>
    );
  }

  const showLeasingDetails = financingType === "leasing" && leasingOffer?.enabled === true;

  return (
    <section className="bg-white rounded-3xl border border-neutral-200/60 shadow-sm p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">Konditionen</h2>
          <p className="mt-1 text-sm text-neutral-600">Direktkauf</p>
        </div>
        <Badge className="rounded-full px-3 py-1 text-xs" variant="secondary">
          Direct Purchase
        </Badge>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-neutral-200/60 bg-neutral-50 p-4">
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <Banknote className="h-4 w-4" />
            Kaufpreis
          </div>
          <div className="mt-1 text-xl font-bold text-neutral-900">
            {typeof purchasePriceChf === "number" ? formatChf(purchasePriceChf) : "Preis auf Anfrage"}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200/60 bg-neutral-50 p-4">
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <ShieldCheck className="h-4 w-4" />
            Finanzierung
          </div>
          <div className="mt-1 text-lg font-semibold text-neutral-900">
            {financingType === "leasing" ? "Leasing" : "Bar / Überweisung"}
          </div>
          {showLeasingDetails && teaserMonthlyLabel && (
            <div className="mt-2 text-sm text-neutral-600">{teaserMonthlyLabel}</div>
          )}
        </div>
      </div>

      {showLeasingDetails && leasingOffer && (
        <div className="mt-6 rounded-2xl border border-neutral-200/60 bg-white p-5">
          <div className="text-sm font-semibold text-neutral-900">Leasing-Parameter (vom Anbieter)</div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-xl bg-neutral-100 p-2">
                <Percent className="h-4 w-4 text-neutral-700" />
              </div>
              <div>
                <div className="text-neutral-600">Zins</div>
                <div className="font-semibold text-neutral-900">{formatNumber(Number(leasingOffer.interest_rate_pct))}%</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-xl bg-neutral-100 p-2">
                <CreditCard className="h-4 w-4 text-neutral-700" />
              </div>
              <div>
                <div className="text-neutral-600">Anzahlung</div>
                <div className="font-semibold text-neutral-900">
                  {leasingOffer.no_down_payment ? "Keine Anzahlung" : `${formatNumber(Number(leasingOffer.down_payment_pct))}%`}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-xl bg-neutral-100 p-2">
                <CalendarClock className="h-4 w-4 text-neutral-700" />
              </div>
              <div>
                <div className="text-neutral-600">Laufzeit</div>
                <div className="font-semibold text-neutral-900">
                  {formatNumber(Number(leasingOffer.min_term_months))}–{formatNumber(Number(leasingOffer.max_term_months))} Monate
                </div>
              </div>
            </div>

            {Array.isArray(leasingOffer.km_options) && leasingOffer.km_options.length > 0 && (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-xl bg-neutral-100 p-2">
                  <Gauge className="h-4 w-4 text-neutral-700" />
                </div>
                <div>
                  <div className="text-neutral-600">KM/Jahr Optionen</div>
                  <div className="font-semibold text-neutral-900">{leasingOffer.km_options.map((v) => formatNumber(v)).join(", ")}</div>
                </div>
              </div>
            )}
          </div>

          {typeof leasingOffer.residual_pct_adjustment_pp === "number" && (
            <div className="mt-4 text-sm text-neutral-600">
              Residual-Adjustment: <span className="font-semibold text-neutral-900">{leasingOffer.residual_pct_adjustment_pp}pp</span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}