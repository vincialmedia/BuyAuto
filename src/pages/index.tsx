import HeroSection from "@/components/buyauto/HeroSection";
import PremiumListings from "@/components/buyauto/PremiumListings";
import BenefitsSection from "@/components/buyauto/BenefitsSection";
import HowItWorksSection from "@/components/buyauto/HowItWorksSection";
import TrustSection from "@/components/buyauto/TrustSection";
import FAQSection from "@/components/buyauto/FAQSection";
import { getPublishedListingsCount } from "@/services/listingsService";
import { GetStaticProps } from "next";

interface HomePageProps {
  totalListings: number;
}

export default function HomePage({ totalListings }: HomePageProps) {
  return (
    <>
      <HeroSection totalListings={totalListings} />
      <PremiumListings />
      <BenefitsSection />
      <HowItWorksSection />
      <TrustSection />
      <FAQSection />
    </>
  );
}

export const getStaticProps: GetStaticProps<HomePageProps> = async () => {
  const totalListings = await getPublishedListingsCount();
  return {
    props: {
      totalListings,
    },
    revalidate: 60, // Re-generate the page every 60 seconds
  };
};
