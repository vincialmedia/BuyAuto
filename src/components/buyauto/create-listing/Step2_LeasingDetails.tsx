import { useWizard } from "./ListingWizard";
import { DirectPurchaseFinancingDetails } from "./step2/DirectPurchaseFinancingDetails";
import { LeaseTakeoverFinancingDetails } from "./step2/LeaseTakeoverFinancingDetails";

export default function Step2_LeasingDetails() {
  const { data } = useWizard();

  // Every new listing is a Direktkauf; a Leasingübernahme is offered via the
  // "Leasingübernahme anbieten" option inside the form below (search/home cards
  // then lead with the Übernahme monthly rate instead of the Kaufpreis). The
  // old top-level Angebotsart choice asked the same question twice, so it's
  // gone. Pure lease_takeover exists only on listings created before this
  // change — editing one still gets its original form.
  const isLegacyLeaseTakeover = data.deal_type === "lease_takeover" && Boolean(data.id);

  return (
    <div className="space-y-8">
      {isLegacyLeaseTakeover ? <LeaseTakeoverFinancingDetails /> : <DirectPurchaseFinancingDetails />}
    </div>
  );
}
