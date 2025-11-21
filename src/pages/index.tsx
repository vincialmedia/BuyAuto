import Head from "next/head";
import dynamic from "next/dynamic";
import HeroSection from "@/components/buyauto/HeroSection";
import { UspBar } from "@/components/buyauto/UspBar";
import PremiumListings from "@/components/buyauto/PremiumListings";
import { StructuredData } from "@/components/buyauto/StructuredData";
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
  const baseUrl = process.env.NODE_ENV === "production" 
    ? "https://www.buyauto.ch" 
    : "http://localhost:3000";

  return (
    <>
      <Head>
        <title>BuyAuto – Die Schweizer Plattform für Leasingübernahmen</title>
        <meta 
          name="description" 
          content="Leasingübernahme in der Schweiz leicht gemacht: Finde bestehende Leasingverträge, sichere dir starke Deals und wechsle dein Auto stressfrei mit BuyAuto." 
        />
        <link rel="canonical" href="https://www.buyauto.ch/" />
        
        {/* Open Graph Meta Tags */}
        <meta property="og:title" content="BuyAuto – Die Schweizer Plattform für Leasingübernahmen" />
        <meta 
          property="og:description" 
          content="Leasingübernahme in der Schweiz leicht gemacht: Finde bestehende Leasingverträge, sichere dir starke Deals und wechsle dein Auto stressfrei mit BuyAuto." 
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.buyauto.ch/" />
        <meta property="og:image" content={`${baseUrl}/buyauto-logo.png`} />
        <meta property="og:image:width" content="512" />
        <meta property="og:image:height" content="512" />
        <meta property="og:image:alt" content="BuyAuto Logo" />
        <meta property="og:site_name" content="BuyAuto" />
        <meta property="og:locale" content="de_CH" />
        
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="BuyAuto – Die Schweizer Plattform für Leasingübernahmen" />
        <meta name="twitter:description" content="Leasingübernahme in der Schweiz leicht gemacht: Finde bestehende Leasingverträge, sichere dir starke Deals und wechsle dein Auto stressfrei mit BuyAuto." />
        <meta name="twitter:image" content={`${baseUrl}/buyauto-logo.png`} />
      </Head>

      {/* Structured Data for Google */}
      <StructuredData type="homepage" />

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
