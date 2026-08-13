import { LeasingCompanyPage } from "@/components/buyauto/LeasingCompanyPage";
import { leasingCompanyBySlug } from "@/lib/buyauto/leasingCompanies";

const company = leasingCompanyBySlug("bank-now-leasing-uebernehmen");

export default function BankNowLeasingUebernehmen() {
  return <LeasingCompanyPage company={company} />;
}
