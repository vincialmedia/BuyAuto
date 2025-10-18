import Head from "next/head";
import dynamic from "next/dynamic";
import HeroSection from "@/components/buyauto/HeroSection";
import { UspBar } from "@/components/buyauto/UspBar";
import PremiumListings from "@/components/buyauto/PremiumListings";
import { GetStaticProps } from "next";
import { getPublishedListingsCount } from "@/services/listingsService";

// Dynamically import below-the-fold components to reduce initial bundle
const BenefitsSection = dynamic(() => import("@/components/buyauto/BenefitsSection"), {
  loading: () => <div className="h-96 bg-neutral-50 animate-pulse" />
});

const HowItWorksSection = dynamic(() => import("@/components/buyauto/HowItWorksSection"), {
  loading: () => <div className="h-96 bg-white animate-pulse" />
});

const TrustSection = dynamic(() => import("@/components/buyauto/TrustSection"), {
  loading: () => <div className="h-96 bg-neutral-50 animate-pulse" />
});

const FAQSection = dynamic(() => import("@/components/buyauto/FAQSection"), {
  loading: () => <div className="h-96 bg-white animate-pulse" />
});

const SeoCopyBlock = dynamic(() => import("@/components/buyauto/SeoCopyBlock").then(mod => ({ default: mod.SeoCopyBlock })), {
  loading: () => <div className="h-64 bg-neutral-50 animate-pulse" />
});

interface HomePageProps {
  totalListings: number;
}

export default function HomePage({ totalListings }: HomePageProps) {
  return (
    <>
      <Head>
        <title>BuyAuto – Die Schweizer Plattform für Leasingübernahmen</title>
        <meta 
          name="description" 
          content="Auto-Leasing übernehmen oder vorzeitig verkaufen – schnell, sicher, transparent. Jetzt Inserat erstellen." 
        />
        <link rel="canonical" href="https://www.buyauto.ch/" />
        <meta property="og:title" content="BuyAuto – Die Schweizer Plattform für Leasingübernahmen" />
        <meta 
          property="og:description" 
          content="Auto-Leasing übernehmen oder vorzeitig verkaufen – schnell, sicher, transparent. Jetzt Inserat erstellen." 
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.buyauto.ch/" />
      </Head>

      <HeroSection totalListings={totalListings} />
      <UspBar />
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
