import { LeasingCompanyPage } from "@/components/buyauto/LeasingCompanyPage";
import { leasingCompanyBySlug } from "@/lib/buyauto/leasingCompanies";

const company = leasingCompanyBySlug("cembra-leasing-uebernehmen");

export default function CembraLeasingUebernehmen() {
  return <LeasingCompanyPage company={company} />;
}
