import { useWizard } from "./ListingWizard";
import { LeaseTakeoverFinancingDetails } from "@/components/buyauto/create-listing/step2/LeaseTakeoverFinancingDetails";
import { DirectPurchaseFinancingDetails } from "@/components/buyauto/create-listing/step2/DirectPurchaseFinancingDetails";

export default function Step2_LeasingDetails() {
  const { data } = useWizard();

  if (data.deal_type === "lease_takeover") {
    return <LeaseTakeoverFinancingDetails />;
  }

  return <DirectPurchaseFinancingDetails />;
}