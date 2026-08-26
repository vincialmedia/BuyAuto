import { LeasingCompanyPage } from "@/components/buyauto/LeasingCompanyPage";
import { leasingCompanyBySlug } from "@/lib/buyauto/leasingCompanies";

const company = leasingCompanyBySlug("multilease-leasing-uebernehmen");

export default function MultileaseLeasingUebernehmen() {
  return <LeasingCompanyPage company={company} />;
}
