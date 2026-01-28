import { useWizard } from "./ListingWizard";
import { DirectPurchaseFinancingDetails } from "./step2/DirectPurchaseFinancingDetails";
import { LeaseTakeoverFinancingDetails } from "./step2/LeaseTakeoverFinancingDetails";

export default function Step2_LeasingDetails() {
  const { data } = useWizard();

  if (data.deal_type === "lease_takeover") {
    return <LeaseTakeoverFinancingDetails />;
  }

  return <DirectPurchaseFinancingDetails />;
}