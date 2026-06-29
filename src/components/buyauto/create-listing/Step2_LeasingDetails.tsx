import { useWizard } from "./ListingWizard";
import { DirectPurchaseFinancingDetails } from "./step2/DirectPurchaseFinancingDetails";
import { LeaseTakeoverFinancingDetails } from "./step2/LeaseTakeoverFinancingDetails";
import type { DealType } from "@/lib/buyauto/types";

const DEAL_TYPE_OPTIONS: { value: DealType; title: string; description: string }[] = [
  {
    value: "direct_purchase",
    title: "Direktkauf",
    description: "Du verkaufst das Fahrzeug zu einem Kaufpreis (optional mit Leasing- oder Übernahme-Angebot).",
  },
  {
    value: "lease_takeover",
    title: "Leasingübernahme",
    description: "Du gibst dein Leasing ab – Interessenten übernehmen Monatsrate und Restlaufzeit. Kein Kaufpreis nötig.",
  },
];

export default function Step2_LeasingDetails() {
  const { data, updateData } = useWizard();

  const dealType: DealType = data.deal_type === "lease_takeover" ? "lease_takeover" : "direct_purchase";

  const handleSelect = (next: DealType) => {
    if (next === dealType) return;

    if (next === "lease_takeover") {
      // Pure lease takeover: no direct-purchase price, no leasing offer.
      // The DB write is normalized in createListingService; here we just keep the
      // wizard preview consistent and let LeaseTakeoverFinancingDetails take over.
      updateData({
        deal_type: "lease_takeover",
        financing_type: null,
        leasing_offer: null,
        purchase_price_chf: null,
      });
    } else {
      updateData({
        deal_type: "direct_purchase",
        financing_type: data.financing_type ?? "cash",
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="text-center">
          <h2 className="text-2xl font-light text-neutral-900 mb-1 tracking-tight">Angebotsart</h2>
          <p className="text-neutral-600 font-light leading-relaxed">Wie möchtest du dein Fahrzeug anbieten?</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Angebotsart">
          {DEAL_TYPE_OPTIONS.map((opt) => {
            const selected = opt.value === dealType;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => handleSelect(opt.value)}
                className={`text-left rounded-2xl border p-4 transition-colors ${
                  selected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-neutral-200 bg-white hover:bg-neutral-50"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-neutral-900">{opt.title}</span>
                  <span
                    aria-hidden
                    className={`h-4 w-4 shrink-0 rounded-full border ${
                      selected ? "border-primary bg-primary" : "border-neutral-300 bg-white"
                    }`}
                  />
                </div>
                <p className="mt-1 text-xs text-neutral-600 font-light leading-relaxed">{opt.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {dealType === "lease_takeover" ? <LeaseTakeoverFinancingDetails /> : <DirectPurchaseFinancingDetails />}
    </div>
  );
}
