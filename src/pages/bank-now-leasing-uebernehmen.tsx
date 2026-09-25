import { LeasingCompanyPage } from "@/components/buyauto/LeasingCompanyPage";
import { staticI18nProps } from "@/i18n/server";
import { leasingCompanyBySlug } from "@/lib/buyauto/leasingCompanies";

const company = leasingCompanyBySlug("bank-now-leasing-uebernehmen");

export const getStaticProps = staticI18nProps(["leasing"]);

export default function BankNowLeasingUebernehmen() {
  return <LeasingCompanyPage company={company} />;
}
