import HeroSection from "@/components/buyauto/HeroSection";
import PremiumListings from "@/components/buyauto/PremiumListings";
import BenefitsSection from "@/components/buyauto/BenefitsSection";
import HowItWorksSection from "@/components/buyauto/HowItWorksSection";
import TrustSection from "@/components/buyauto/TrustSection";
import FAQSection from "@/components/buyauto/FAQSection";
import { getTotalListingsCount } from "@/lib/buyauto/data";

export default function HomePage() {
  const totalListings = getTotalListingsCount();

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