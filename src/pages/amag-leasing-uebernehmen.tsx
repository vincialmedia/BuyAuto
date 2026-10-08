import type { GetStaticProps } from "next";
import { LeasingCompanyPage } from "@/components/buyauto/LeasingCompanyPage";
import { leasingCompanyBySlug } from "@/lib/buyauto/leasingCompanies";
import { indexableBrandPages } from "@/lib/buyauto/leasingBrands";
import { getPublicOfferIndex, liveTakeovers } from "@/services/listingsService";

const company = leasingCompanyBySlug("amag-leasing-uebernehmen");

type Props = { indexableBrandHrefs: string[] };

export default function AmagLeasingUebernehmen({ indexableBrandHrefs }: Props) {
  return <LeasingCompanyPage company={company} indexableBrandHrefs={indexableBrandHrefs} />;
}

// The financed-brands line links only brand pages that are indexable right now
// (>= 2 live Leasingübernahmen). Throws on a failed query so ISR keeps the last good page.
export const getStaticProps: GetStaticProps<Props> = async () => {
  const offers = await getPublicOfferIndex();
  const indexableBrandHrefs = indexableBrandPages(liveTakeovers(offers)).map((b) => `/leasinguebernahme/${b.slug}`);
  return { props: { indexableBrandHrefs }, revalidate: 300 };
};
