import { LeasingCompanyPage } from "@/components/buyauto/LeasingCompanyPage";
import { leasingCompanyBySlug } from "@/lib/buyauto/leasingCompanies";

const company = leasingCompanyBySlug("amag-leasing-uebernehmen");

export default function AmagLeasingUebernehmen() {
  return <LeasingCompanyPage company={company} />;
}
