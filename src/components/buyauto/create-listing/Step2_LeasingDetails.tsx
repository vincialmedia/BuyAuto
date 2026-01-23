import { useMemo } from "react";
import type { DealType } from "@/lib/buyauto/types";
import { useWizard } from "./ListingWizard";
import { LeaseTakeoverFinancingDetails } from "@/components/buyauto/create-listing/step2/LeaseTakeoverFinancingDetails";
import { DirectPurchaseFinancingDetails } from "@/components/buyauto/create-listing/step2/DirectPurchaseFinancingDetails";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Step2_LeasingDetails() {
  const { data, updateData } = useWizard();

  const selectedDealType: DealType = useMemo(() => {
    return (data.deal_type ?? "direct_purchase") as DealType;
  }, [data.deal_type]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-light text-neutral-900 mb-2 tracking-tight">Finanzierungsdetails</h2>
        <p className="text-neutral-600 font-light leading-relaxed">
          Wähle zuerst die Verkaufsart – die Felder passen sich an.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="deal_type" className="text-sm font-medium text-neutral-700">
          Verkaufsart *
        </Label>
        <Select
          value={selectedDealType}
          onValueChange={(value) => {
            const next = value as DealType;

            if (next === "lease_takeover") {
              updateData({
                deal_type: "lease_takeover",
                financing_type: null,
                leasing_offer: null,
              });
              return;
            }

            updateData({
              deal_type: "direct_purchase",
              financing_type: "cash",
              leasing_offer: null,
            });
          }}
        >
          <SelectTrigger
            id="deal_type"
            className="bg-white border border-neutral-200/40 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm"
          >
            <SelectValue placeholder="Verkaufsart auswählen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="direct_purchase">Direktkauf</SelectItem>
            <SelectItem value="lease_takeover">Leasingübernahme</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selectedDealType === "lease_takeover" ? <LeaseTakeoverFinancingDetails /> : <DirectPurchaseFinancingDetails />}
    </div>
  );
}