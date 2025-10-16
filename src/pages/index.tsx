import Head from "next/head";
import HeroSection from "@/components/buyauto/HeroSection";
import PremiumListings from "@/components/buyauto/PremiumListings";
import BenefitsSection from "@/components/buyauto/BenefitsSection";
import HowItWorksSection from "@/components/buyauto/HowItWorksSection";
import TrustSection from "@/components/buyauto/TrustSection";
import FAQSection from "@/components/buyauto/FAQSection";
import { SeoCopyBlock } from "@/components/buyauto/SeoCopyBlock";
import { getPublishedListingsCount } from "@/services/listingsService";
import { GetStaticProps } from "next";

interface HomePageProps {
  totalListings: number;
}

export default function HomePage({ totalListings }: HomePageProps) {
  return (
    <>
      <Head>
        <title>Auto Leasing Übernehmen oder Verkaufen in der Schweiz | BuyAuto.ch</title>
        <meta 
          name="description" 
          content="Finde dein nächstes Auto-Leasing oder verkaufe deines einfach und sicher. BuyAuto.ch ist die Plattform für Leasingübernahmen in der Schweiz – transparent, schnell und ohne Stress." 
        />
        <link rel="canonical" href="https://www.buyauto.ch/" />
        <meta property="og:title" content="Auto Leasing Übernehmen oder Verkaufen in der Schweiz | BuyAuto.ch" />
        <meta 
          property="og:description" 
          content="Finde dein nächstes Auto-Leasing oder verkaufe deines einfach und sicher. BuyAuto.ch ist die Plattform für Leasingübernahmen in der Schweiz – transparent, schnell und ohne Stress." 
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.buyauto.ch/" />
      </Head>

      <HeroSection totalListings={totalListings} />
      <PremiumListings />
      <BenefitsSection />
      <HowItWorksSection />
      <TrustSection />
      <FAQSection />
      <SeoCopyBlock />
    </>
  );
}

export const getStaticProps: GetStaticProps<HomePageProps> = async () => {
  const totalListings = await getPublishedListingsCount();
  return {
    props: {
      totalListings,
    },
    revalidate: 60,
  };
};