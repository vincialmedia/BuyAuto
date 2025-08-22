import Header from "@/components/buyauto/Header";
import HeroSection from "@/components/buyauto/HeroSection";
import PremiumListings from "@/components/buyauto/PremiumListings";
import BenefitsSection from "@/components/buyauto/BenefitsSection";
import HowItWorksSection from "@/components/buyauto/HowItWorksSection";
import TrustSection from "@/components/buyauto/TrustSection";
import FAQSection from "@/components/buyauto/FAQSection";
import Footer from "@/components/buyauto/Footer";
import { getTotalListingsCount } from "@/lib/buyauto/data";

export default function HomePage() {
  const totalListings = getTotalListingsCount();

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <HeroSection totalListings={totalListings} />
        <PremiumListings />
        <BenefitsSection />
        <HowItWorksSection />
        <TrustSection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  );
}